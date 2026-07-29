"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { evaluateGeometryRisk, RISK_TYPES, RISK_ACTIONS, createRegistryFingerprint } = require("ui-editor-kit");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

class FakeElement {
  constructor(width = 150, height = 24) {
    this.dataset = {}; this.attributes = {}; this.className = ""; this.isConnected = true;
    this.style = { width: `${width}px`, height: `${height}px`, setProperty(name, value) { this[name] = value; }, getPropertyValue(name) { return this[name] || ""; } };
    this._rect = { left: 0, top: 0, width, height };
    this.classList = { contains: () => false, toggle() {} };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getBoundingClientRect() { return { ...this._rect, width: parseFloat(this.style.width) || this._rect.width, height: parseFloat(this.style.height) || this._rect.height }; }
}

async function runM823BbmSpacerCompactUiTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const hostModule = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const scopes = registry.listM80RegistryScopes();
  const entries = scopes.flatMap((scope) => scope.elements);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const manifest = JSON.parse(read("ui-editor-target.json"));
  const host = read("src/renderer/ui-editor/m80HostAdapter.js");
  const refSource = read("src/renderer/ui-editor/m80Refs.js");
  const editbox = read("src/renderer/modules/restarbeiten/RestarbeitenEditbox.js");
  const restarbeitenCss = read("src/renderer/modules/restarbeiten/styles/restarbeiten.css");
  const compactXaml = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/Views/CompactEditorWorkspaceView.xaml");
  const compactCode = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/Views/CompactEditorWorkspaceView.xaml.cs");
  const pdfCode = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/Views/EditorWindow.xaml.cs");
  const label = byId.get("restarbeiten.edit.short.label");
  const group = byId.get("restarbeiten.edit.short");
  let flowRow;
  const widthRisk = (groupWidthEditable = true) => evaluateGeometryRisk({
    operationId: "bbm-m82-3", operation: "resizeWidth", currentBounds: { left: 0, top: 0, width: 150, height: 24 }, targetBounds: { left: 0, top: 0, width: 130, height: 24 },
    target: { elementId: label.id, displayName: label.name, elementType: label.type, bounds: { left: 0, top: 0, width: 150, height: 24 } },
    group: { elementId: group.id, displayName: group.name, elementType: group.type, bounds: { left: 0, top: 0, width: 878, height: 50 } },
    affectedNeighbors: [{ elementId: "restarbeiten.edit.short.remaining", displayName: "Restzeichenanzeige Kurztext", elementType: "label", previousBounds: { left: 190, top: 0, width: 40, height: 24 }, bounds: { left: 170, top: 0, width: 40, height: 24 }, geometryChanged: true }],
    groupWidthEditable,
  });

  await run("M82.3 BBM 01: Registryversion 5 ist aktiv", () => assert.equal(registry.BBM_M80_REGISTRY_VERSION, 5));
  await run("M82.3 BBM 02: Manifest folgt Registry und Fingerprint", () => { assert.equal(manifest.registryVersion, 5); assert.equal(manifest.registryFingerprint, createRegistryFingerprint(scopes)); });
  await run("M82.3 BBM 03: Kurztextbezeichnung besitzt reservierte Breite", () => assert.deepEqual(label.baseline.spacing, { reservedWidth: 40 }));
  await run("M82.3 BBM 04: Kurztextbezeichnung erlaubt Spacer davor und danach", () => assert.deepEqual(label.spacingTargets, ["beforeElement", "afterElement", "reservedWidth"]));
  await run("M82.3 BBM 05: Gruppenbreite ist getrennt freigegeben und nutzt die responsive Laufzeitbaseline", () => { assert.ok(group.allowedOps.includes("resizeWidth")); assert.equal(group.baseline.width, null); });
  await run("M82.3 BBM 06: Gruppenhöhe ist getrennt freigegeben und nutzt die responsive Laufzeitbaseline", () => { assert.ok(group.allowedOps.includes("resizeHeight")); assert.equal(group.baseline.height, null); });
  await run("M82.3 BBM 07: Gruppeninnenabstände sind explizit", () => assert.deepEqual(group.spacingTargets.slice(0, 4), ["groupPaddingLeft", "groupPaddingRight", "groupPaddingTop", "groupPaddingBottom"]));
  await run("M82.3 BBM 08: Registry-Parents bleiben unverändert", () => { assert.equal(label.parentId, "restarbeiten.edit.short"); assert.equal(byId.get("restarbeiten.edit.short.dictation.icon").parentId, "restarbeiten.edit.short.dictation"); });
  await run("M82.3 BBM 09: Bezeichnungsbreite nutzt einen expliziten Grid-Slot", () => assert.match(editbox, /registerM80FlowLabelRef[\s\S]*30px 24px minmax\(92px, auto\) auto/));
  await run("M82.3 BBM 10: Electron-Abbildung speichert Spacing-Intent", () => assert.match(refSource, /uiEditorSpacing/));
  await run("M82.3 BBM 11: reservierter Platz wird zur Trackbreite addiert", () => assert.match(refSource, /elementWidth = bounded[\s\S]*slotWidth = elementWidth \+ reservedWidth/));
  await run("M82.3 BBM 12: generische Gruppenabstände bilden Padding und Gap ab", () => assert.match(refSource, /paddingLeft[\s\S]*columnGap[\s\S]*rowGap/));
  await run("M82.3 BBM 12a: Gruppenpadding wird ohne fremdes Boxmodell von der Inhaltsbreite abgezogen", () => assert.match(refSource, /horizontalPadding[\s\S]*desiredWidth - horizontalPadding/));
  await run("M82.3 BBM 12b: responsive Gruppenbaseline wird vor dem Start-Restore einmalig erfasst", () => assert.match(host, /capturedRuntimeBaselines[\s\S]*snapshotM80State[\s\S]*capturedBaseline/));
  await run("M82.3 BBM 13: Freier Platz ist Standardentscheidung", () => assert.equal(widthRisk().suggestedActions[0], RISK_ACTIONS.PRESERVE_SPACE));
  await run("M82.3 BBM 14: Nachrücken ist separate Entscheidung", () => assert.ok(widthRisk().suggestedActions.includes(RISK_ACTIONS.REFLOW_NEIGHBORS)));
  await run("M82.3 BBM 15: Gruppenverkleinerung ist separate Entscheidung", () => assert.ok(widthRisk().suggestedActions.includes(RISK_ACTIONS.SHRINK_GROUP)));
  await run("M82.3 BBM 16: nicht editierbare Gruppenbreite wird nicht angeboten", () => assert.equal(widthRisk(false).suggestedActions.includes(RISK_ACTIONS.SHRINK_GROUP), false));
  await run("M82.3 BBM 17: Trotzdem anwenden koppelt kein Nachrücken", () => assert.equal(widthRisk().suggestedActions.includes(RISK_ACTIONS.APPLY_ANYWAY), false));
  await run("M82.3 BBM 18: Hinweis nennt Kurztext/Gegenstand verständlich", () => { assert.equal(widthRisk().riskType, RISK_TYPES.FREED_SPACE); assert.match(widthRisk().message, /Bezeichnung Kurztext\/Gegenstand.*frei werdenden Platz/); });
  await run("M82.3 BBM 19: Vorschau nennt Restzeichenanzeige und alte/neue Position", () => { const neighbor = widthRisk().affectedNeighbors[0]; assert.equal(neighbor.displayName, "Restzeichenanzeige Kurztext"); assert.equal(neighbor.previousBounds.left, 190); assert.equal(neighbor.bounds.left, 170); assert.match(host, /Bisherige Position von[\s\S]*Neue Position von/); });
  await run("M82.3 BBM 19a: echte Gruppen-Nachbarn gelangen in die Risikobewertung", () => {
    const before = new Map([[label.id, { left: 0, top: 0, width: 150, height: 24 }], ["restarbeiten.edit.short.remaining", { left: 190, top: 0, width: 30, height: 24 }]]);
    const after = new Map([[label.id, { left: 0, top: 0, width: 130, height: 24 }], ["restarbeiten.edit.short.remaining", { left: 170, top: 0, width: 30, height: 24 }]]);
    const neighbors = hostModule.collectM80GeometryNeighbors(label, before, after);
    assert.equal(neighbors.find((item) => item.elementId === "restarbeiten.edit.short.remaining")?.geometryChanged, true);
  });
  await run("M82.3 BBM 20: lokaler Stabilitätsguard rollt unerwartete Änderungen zurück", () => assert.match(host, /electron_unexpected_layout_effect[\s\S]*unerwartet verändern/));
  await run("M82.3 BBM 21: Gruppe wird beim Fehler ebenfalls zurückgerollt", () => assert.match(host, /groupRestore\?\.state[\s\S]*applyM80State\(groupRestore\.id/));
  await run("M82.3 BBM 22: Start-Restore bleibt derselbe Profilweg", () => assert.match(host, /restoreM80StartupLayout/));
  await run("M82.3 BBM 23: Manifest veröffentlicht alle vier Spacingoperationen", () => assert.deepEqual(manifest.supportedOperations.slice(-4), ["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"]));
  await run("M82.3 BBM 24: kompakter UI-Workspace hat Ein-Zwei-Drei-Modus", () => assert.match(compactCode, /width < 860 \? 1 : width < 1260 \? 2 : 3/));
  await run("M82.3 BBM 25: feste Aktionen liegen vor den adaptiven Spalten", () => assert.ok(compactXaml.indexOf("Nächstes Element auswählen") < compactXaml.indexOf("AdaptiveColumns")));
  await run("M82.3 BBM 26: Baum scrollt intern", () => assert.match(compactXaml, /CompactElementTree[\s\S]*VerticalScrollBarVisibility="Auto"/));
  await run("M82.3 BBM 27: PDF-Workspace nutzt dieselben Breitenstufen", () => assert.match(pdfCode, /e\.NewSize\.Width < 860 \? 1 : e\.NewSize\.Width < 1260 \? 2 : 3/));
  await run("M82.3 BBM 28: echter Flow-Ref hält den Slot bei 190 px stabil", () => {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    const element = new FakeElement(150, 24); flowRow = new FakeElement(878, 50); flowRow.style.gridTemplateColumns = "190px 30px 24px minmax(92px, auto) auto";
    refs.registerM80FlowLabelRef(label.id, element, flowRow, "30px 24px minmax(92px, auto) auto");
    const initial = refs.readM80State(label.id); assert.equal(initial.spacing.reservedWidth, 40);
    refs.applyM80State(label.id, { ...initial, width: 130, spacing: { reservedWidth: 60 } });
    assert.match(flowRow.style.gridTemplateColumns, /^190px /);
    assert.equal(element.style.justifySelf, "start");
    assert.equal(element.style.minWidth, "130px");
    assert.equal(element.style.maxWidth, "130px");
    assert.equal(element.dataset.uiEditorFlowFixed, "true");
    assert.equal(element.dataset.uiEditorFlowWidth, "130");
    assert.equal(element.style["--bbm-ui-editor-flow-element-width"], "130px");
    assert.match(restarbeitenCss, /data-ui-editor-flow-fixed="true"[\s\S]*--bbm-ui-editor-flow-element-width/);
  });
  await run("M82.3 BBM 29: bewusstes Nachrücken verkleinert den Slot", () => {
    const current = refs.readM80State(label.id); refs.applyM80State(label.id, { ...current, width: 130, spacing: { reservedWidth: 40 } });
    assert.match(flowRow.style.gridTemplateColumns, /^170px /);
  });
  await run("M82.3 BBM 29a: Start-Restore stellt abgeleiteten reservierten Platz wieder her", () => {
    const startup = hostModule.createM80StartupRequests("restarbeiten.edit.root", {
      ...refs.readM80State(label.id), width: 90, spacing: { reservedWidth: 100 },
    }, { [label.id]: ["resizeWidth"] });
    assert.deepEqual(startup.map((item) => item.request.operation), ["resizeWidth", "spacingSet"]);
    assert.deepEqual(startup[1].request.payload.spacing, { target: "reservedWidth", value: 100 });
  });
  await run("M82.3 BBM 30: Fachwerte sind weiterhin verboten", () => assert.match(host, /FORBIDDEN_KEYS[\s\S]*businessData[\s\S]*domainData/));
  await run("M82.3 BBM 31: docs/licensing.md bleibt hashgleich", () => assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "docs/licensing.md"))).digest("hex").toUpperCase(), "02AE66A8873C74869539F13F734B7CE43BC63B6EF37DA553A40C27A4F514D784"));
}

module.exports = { runM823BbmSpacerCompactUiTests };
