"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { evaluateGeometryRisk, RISK_TYPES, RISK_ACTIONS } = require("ui-editor-kit");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const rect = (left, top, width = 22, height = 22) => ({ left, top, width, height });

async function runM822BbmGeometryRiskTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const entries = registry.listM80RegistryScopes().flatMap((scope) => scope.elements);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const host = read("src/renderer/ui-editor/m80HostAdapter.js");
  const session = read("src/main/ui-editor/electronUiEditorSession.js");
  const viewModel = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/ViewModels/EditorWindowViewModel.cs");
  const xaml = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/Views/EditorWindow.xaml");
  const preference = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.EditorIntegration/Persistence/EditorPreferenceStore.cs");
  const risk = (overrides = {}) => evaluateGeometryRisk({
    editMode: "guided", operationId: "bbm-operation", currentBounds: rect(10, 10), targetBounds: rect(90, 10),
    target: { elementId: byId.get("restarbeiten.edit.short.dictation").id, displayName: byId.get("restarbeiten.edit.short.dictation").name, elementType: "button", bounds: rect(10, 10) },
    group: { elementId: byId.get("restarbeiten.edit.short.headerZone").id, displayName: byId.get("restarbeiten.edit.short.headerZone").name, elementType: "group", bounds: rect(0, 0, 100, 100) },
    parent: { elementId: byId.get("restarbeiten.edit.short.headerZone").id, displayName: byId.get("restarbeiten.edit.short.headerZone").name, elementType: "group", bounds: rect(0, 0, 100, 100) },
    editableArea: { elementId: byId.get("restarbeiten.edit.root").id, displayName: byId.get("restarbeiten.edit.root").name, elementType: "root", bounds: rect(0, 0, 120, 120) },
    affectedNeighbors: [], ...overrides,
  });

  await run("M82.2 BBM 01: Editorstart bleibt auf einer Instanz", () => assert.match(session, /existing.*activate|focused|activateEditor/is));
  await run("M82.2 BBM 02: Auswahl allein ruft keine Risikobewertung auf", () => { const body = host.slice(host.indexOf("export function highlightM80Element"), host.indexOf("function stopSelection")); assert.doesNotMatch(body, /evaluateGeometryRisk|failure\(/); });
  await run("M82.2 BBM 03: kryptische Parent-Reflow-Warnung ist entfernt", () => assert.doesNotMatch(viewModel, /Achtung: Parent-Reflow/));
  await run("M82.2 BBM 04: riskante Höhenänderung wird über gemeinsamen Core bewertet", () => assert.match(host, /geometryRiskFor[\s\S]*evaluateGeometryRisk/));
  await run("M82.2 BBM 05: verständlicher Hinweis ersetzt Fehlerwand", () => assert.equal(risk().title, "Element verlässt seine Gruppe"));
  await run("M82.2 BBM 06: Gruppe wird mit Anzeigename genannt", () => assert.match(risk().message, /Diktatbutton Kurztext.*Kopfzeile Kurztext\/Gegenstand/));
  await run("M82.2 BBM 07: technische IDs stehen nur in Details", () => { assert.doesNotMatch(risk().message, /restarbeiten\./); assert.match(risk().technicalDetails.elementId, /restarbeiten\./); });
  await run("M82.2 BBM 08: Abbrechen räumt Vorschau und hält Bedienung frei", () => assert.match(viewModel, /GeometryRiskDecision\.Cancel[\s\S]*ClearGeometryPreviewAsync/));
  await run("M82.2 BBM 09: Zurück nennt direkte Weiterarbeit", () => assert.match(viewModel, /Änderung wurde nicht übernommen\. Sie können direkt weiterarbeiten/));
  await run("M82.2 BBM 10: Rollbackzustand ist garantiert", () => assert.equal(risk().technicalDetails.rollbackStatus, "guaranteed"));
  await run("M82.2 BBM 11: Auswahl bleibt beim Risikodialog erhalten", () => assert.doesNotMatch(viewModel.slice(viewModel.indexOf("if (outcome.Result.GeometryRisk"), viewModel.indexOf("internal void ShowConnectionLost")), /SelectedId\s*=/));
  await run("M82.2 BBM 12: Geführt kann an der Gruppe halten", () => assert.ok(risk().suggestedActions.includes(RISK_ACTIONS.CLAMP_TO_GROUP)));
  await run("M82.2 BBM 13: Geführt kann trotzdem anwenden", () => assert.ok(risk().suggestedActions.includes(RISK_ACTIONS.APPLY_ANYWAY)));
  await run("M82.2 BBM 14: Frei erlaubt Gruppenverlassen als Risiko", () => assert.equal(risk({ editMode: "free" }).riskType, RISK_TYPES.LEAVES_GROUP));
  await run("M82.2 BBM 15: Frei erlaubt Nachbarüberlappung als Risiko", () => assert.ok(risk({ editMode: "free", targetBounds: rect(45, 10), affectedNeighbors: [{ elementId: "neighbor", displayName: "Restzeichenanzeige Kurztext", elementType: "label", bounds: rect(50, 10) }] }).suggestedActions.includes(RISK_ACTIONS.APPLY_ANYWAY)));
  await run("M82.2 BBM 16: freie Position bleibt im bestehenden Profilweg speicherbar", () => { assert.match(host, /newState: readback/); assert.match(preference, /editor-preferences\.json/); });
  await run("M82.2 BBM 17: Neustart-Restore bleibt vorhanden", () => assert.match(host, /restoreM80StartupLayout/));
  await run("M82.2 BBM 18: Editoröffnung verursacht keine zweite Anwendung", () => assert.match(host, /startupRestorePromise/));
  await run("M82.2 BBM 19: Diagnoseaufbau bewahrt das bereits angewandte Startprofil", () => {
    const diagnostic = read("src/renderer/ui-editor/m80Diagnostic.js");
    assert.doesNotMatch(diagnostic, /resetM80PilotWorkingStatesForDiagnostic/);
    assert.match(diagnostic, /refreshM80StartupLayoutAfterRegistryMount/);
    assert.match(host, /export async function refreshM80StartupLayoutAfterRegistryMount[\s\S]*return restoreM80StartupLayout\(\)/);
  });
  await run("M82.2 BBM 20: Diktatbutton behält feste Größenlimits", () => assert.deepEqual([byId.get("restarbeiten.edit.short.dictation").baseline.minWidth, byId.get("restarbeiten.edit.short.dictation").baseline.maxWidth], [20, 32]));
  await run("M82.2 BBM 21: Symbolgröße bleibt eigener Registryeintrag", () => assert.equal(byId.get("restarbeiten.edit.short.dictation.icon").parentId, "restarbeiten.edit.short.dictation"));
  await run("M82.2 BBM 22: Kurztext kann Nachbarbereich verständlich benennen", () => assert.match(risk({ targetBounds: rect(45, 10), affectedNeighbors: [{ elementId: "responsible", displayName: "Verantwortlich", elementType: "area", bounds: rect(50, 10) }] }).message, /Verantwortlich/));
  await run("M82.2 BBM 23: Gruppe Klasse bleibt bewegbar", () => assert.ok(byId.get("restarbeiten.edit.class").allowedOps.includes("move")));
  await run("M82.2 BBM 24: Registry-Parents bleiben unverändert", () => assert.equal(byId.get("restarbeiten.edit.class.control").parentId, "restarbeiten.edit.class"));
  await run("M82.2 BBM 25: Elementreset bleibt im Editor", () => assert.match(viewModel, /ResetElementCommand/));
  await run("M82.2 BBM 26: Gruppenreset nutzt bestehenden Elementpfad", () => assert.match(viewModel, /ResetElementAsync/));
  await run("M82.2 BBM 27: Gesamtreset bleibt im Editor", () => assert.match(viewModel, /ResetAllCommand/));
  await run("M82.2 BBM 28: Discard bleibt im Editor", () => assert.match(viewModel, /DiscardElementCommand.*DiscardAllCommand/));
  await run("M82.2 BBM 29: PDF-Tab bleibt vorhanden", () => assert.match(xaml, /TabItem Header="PDF-Ausgabe"/));
  await run("M82.2 BBM 30: Profil-Recovery bleibt unverändert angebunden", () => assert.match(read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/Editor/ElectronTargetEditor.cs"), /ProfileRecoveryWorkflow/));
  await run("M82.2 BBM 31: Fachwerte sind im Adapterpayload verboten", () => assert.match(host, /FORBIDDEN_KEYS[\s\S]*businessData[\s\S]*domainData/));
  await run("M82.2 BBM 32: genau eine gemeinsame Risikovertragsdatei wird importiert", () => { assert.match(host, /ui-editor-kit\/dist\/geometry-risk-contract\.mjs/); assert.doesNotMatch(read("../UI-Editor-kit/src/core/geometry-risk-contract.cjs"), /restarbeiten\.|bbm\./i); });
  await run("M82.2 BBM 33: docs/licensing.md bleibt hashgleich", () => assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "docs/licensing.md"))).digest("hex").toUpperCase(), "02AE66A8873C74869539F13F734B7CE43BC63B6EF37DA553A40C27A4F514D784"));
  await run("M82.2 BBM 34: Start- und Restorepfade öffnen keinen interaktiven Risikodialog", () => {
    assert.match(host, /const interactive = request\.source === "ui-editor-panel";[\s\S]*const unvalidatedStartupRequest = request\.source === "target-app-start" && !validatedStartupRequests\.has\(request\);[\s\S]*const risk = \(interactive \|\| unvalidatedStartupRequest\) && !usesValidatedTableGeometry/);
    assert.match(host, /trustedPersistentProfile = \/\^\[a-f0-9\]\{64\}\$\/i\.test\(String\(loaded\.profileSha256 \|\| ""\)\)/);
    assert.match(host, /if \(trustedPersistentProfile\) validatedStartupRequests\.add\(request\)/);
    assert.match(host, /if \(interactive\) \{\s*pendingGeometryRisks\.set\([\s\S]*renderGeometryRiskPreview\(risk\);\s*\}/);
    assert.match(host, /source: "target-app-start"/);
  });
  await run("M82.2 BBM 35: Pack enthält das bestehende Ziel-App-Manifest", () => {
    const packageJson = JSON.parse(read("package.json"));
    assert.ok(packageJson.build.files.includes("ui-editor-target.json"));
  });
}

module.exports = { runM822BbmGeometryRiskTests };
