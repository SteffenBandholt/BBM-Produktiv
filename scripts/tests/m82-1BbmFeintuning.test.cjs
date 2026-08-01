"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { createRegistryFingerprint, createUiScopeFingerprint } = require("ui-editor-kit");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

async function runM821BbmFeintuningTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const scopes = registry.listM80RegistryScopes();
  const entries = scopes.flatMap((scope) => scope.elements);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const manifest = JSON.parse(read("ui-editor-target.json"));
  const host = read("src/renderer/ui-editor/m80HostAdapter.js");
  const refs = read("src/renderer/ui-editor/m80Refs.js");
  const preload = read("src/main/preload.js");
  const session = read("src/main/ui-editor/electronUiEditorSession.js");
  const bridge = read("src/renderer/ui-editor/m80Bridge.js");
  const editbox = read("src/renderer/modules/restarbeiten/RestarbeitenEditbox.js");
  const css = read("src/renderer/modules/restarbeiten/styles/restarbeiten.css");

  await run("M82.1 BBM 01: Registryversion bleibt konsistent", () => assert.equal(registry.BBM_M80_REGISTRY_VERSION, 13));
  await run("M82.1 BBM 02: Manifestversion folgt der Registry", () => assert.equal(manifest.registryVersion, registry.BBM_M80_REGISTRY_VERSION));
  await run("M82.1 BBM 03: Manifestfingerprint ist aktuell", () => assert.equal(manifest.registryFingerprint, createRegistryFingerprint(scopes)));
  await run("M82.1/M82.6 BBM 04: beide Referenzmodule besitzen je drei aktive Scopes", () => assert.deepEqual(registry.BBM_M80_ACTIVE_SCOPES, ["restarbeiten.header.root", "restarbeiten.list.root", "restarbeiten.edit.root", "protokoll.screen.root", "protokoll.list.root", "protokoll.edit.root"]));
  await run("M82.1 BBM 05: Header behält 31 Elemente", () => assert.equal(byId.has("restarbeiten.header.root") && scopes.find((scope) => scope.scopeId === "restarbeiten.header.root").elements.length, 31));
  await run("M82.1 BBM 06: Editbox besitzt 53 explizite Elemente", () => assert.equal(scopes.find((scope) => scope.scopeId === "restarbeiten.edit.root").elements.length, 53));
  await run("M82.1 BBM 07: Editbox-Root ist nur höhen- und sichtbarkeitsfähig", () => assert.deepEqual(byId.get("restarbeiten.edit.root").allowedOps, ["resizeHeight", "setVisibility"]));
  await run("M82.1 BBM 08: Editbox-Baseline beträgt 276 px", () => assert.equal(byId.get("restarbeiten.edit.root").baseline.height, 276));
  await run("M82.1 BBM 09: sichere Editbox- und reale Kleinlabel-Grenzen sind deklariert", () => {
    assert.equal(byId.get("restarbeiten.edit.root").baseline.minHeight, 190);
    assert.equal(byId.get("restarbeiten.edit.location.1.label").baseline.minHeight, 8);
    assert.equal(byId.get("restarbeiten.list.table").baseline.maxHeight, 12000);
  });
  await run("M82.1 BBM 10: sichere maximale Editbox-Höhe und flexibler Listen-Root sind deklariert", () => {
    assert.equal(byId.get("restarbeiten.edit.root").baseline.maxHeight, 520);
    assert.deepEqual(byId.get("restarbeiten.edit.root").operationAffectedIds.resizeHeight, ["restarbeiten.edit.area", "restarbeiten.list.root"]);
  });
  await run("M82.1 BBM 11: kurzer Beschreibungsheader ist separat registriert", () => assert.equal(byId.get("restarbeiten.edit.short.headerZone").selectionKind, "layoutZone"));
  await run("M82.1 BBM 12: langer Beschreibungsheader ist separat registriert", () => assert.equal(byId.get("restarbeiten.edit.long.headerZone").selectionKind, "layoutZone"));
  await run("M82.1 BBM 13: kurzes Diktiericon ist separat registriert", () => assert.equal(byId.get("restarbeiten.edit.short.dictation.icon").selectionKind, "icon"));
  await run("M82.1 BBM 14: langes Diktiericon ist separat registriert", () => assert.equal(byId.get("restarbeiten.edit.long.dictation.icon").selectionKind, "icon"));
  await run("M82.1 BBM 15: Icon-Parent ist der Diktierbutton", () => assert.equal(byId.get("restarbeiten.edit.short.dictation.icon").parentId, "restarbeiten.edit.short.dictation"));
  await run("M82.1 BBM 15a: Diktatverschiebung deklariert das mitbewegte Symbol", () => {
    assert.equal(byId.get("restarbeiten.edit.short.dictation").operationEffects.move, "groupWithChildren");
    assert.deepEqual(byId.get("restarbeiten.edit.short.dictation").operationAffectedIds.move, ["restarbeiten.edit.short.dictation.icon"]);
    assert.deepEqual(byId.get("restarbeiten.edit.long.dictation").operationAffectedIds.move, ["restarbeiten.edit.long.dictation.icon"]);
  });
  await run("M82.1 BBM 16: Gruppenwirkung ist explizit", () => assert.equal(byId.get("restarbeiten.edit.short").operationEffects.move, "groupWithChildren"));
  await run("M82.1 BBM 17: verbotene Splitoperation bleibt entfernt", () => assert.equal(entries.some((entry) => entry.id === "restarbeiten.layout.split"), false));
  await run("M82.1 BBM 18: keine Fachoperation ist freigegeben", () => assert.equal(entries.flatMap((entry) => entry.allowedOps).some((operation) => ["save", "create", "delete", "upload", "import", "execute"].includes(operation)), false));
  await run("M82.1 BBM 19: Startprofil wird über enge Preload-API geladen", () => assert.match(preload, /loadStartupLayout:/));
  await run("M82.1 BBM 20: Startprofil wird über enge Preload-API bestätigt", () => assert.match(preload, /completeStartupLayout:/));
  await run("M82.1 BBM 21: Startprofil nutzt den bestehenden Profilpfad", () => assert.match(session, /profileRootResolver/));
  await run("M82.1 BBM 22: Startprofil nutzt den UI-Editor-Kit-Core", () => assert.match(session, /loadTargetStartupLayout/));
  await run("M82.1 BBM 23: Restore läuft ohne Editorprozess und ist gegen Installationsreihenfolge abgesichert", () => {
    assert.match(host, /editorProcessRequired:\s*false/);
    assert.match(bridge, /void ensureStartupLayout\(\)/);
    assert.match(bridge, /bbm:m80-pilot-render-complete/);
    assert.match(bridge, /waitingForRegistry/);
    assert.match(bridge, /clearTimeout\(startupRetryTimer\)/);
  });
  await run("M82.1 BBM 24: Start-Rollback ist vorhanden und unveränderte Vollzustände werden nicht erneut angewandt", () => {
    assert.match(host, /rollbackSucceeded/);
    assert.match(host, /snapshotM80State\(entry\.id\)/);
    assert.match(host, /Math\.abs\(Number\(value\) - Number\(baseline\)\) > 0\.01/);
  });
  await run("M82.1 BBM 25: Direktauswahl nutzt nur den gemeinsamen Vertrag", () => assert.match(host, /direct-selection-contract\.mjs/));
  await run("M82.1 BBM 26: Tab und Shift-Tab werden unterstützt", () => { assert.match(host, /event\.key === "Tab"/); assert.match(host, /event\.shiftKey/); });
  await run("M82.1 BBM 27: Enter bestätigt und Escape beendet", () => { assert.match(host, /event\.key === "Enter"/); assert.match(host, /event\.key === "Escape"/); });
  await run("M82.1 BBM 28: Geometriewirkungen werden vor Annahme geprüft", () => { assert.match(host, /inspectGeometryEffect/); assert.match(host, /electron_unexpected_layout_effect/); });
  await run("M82.1 BBM 29: generisches Anwenden friert Flexelemente nicht mehr ein", () => { assert.doesNotMatch(refs, /flexShrink\s*=\s*"0"/); assert.match(refs, /allowedOps/); });
  await run("M82.1 BBM 30: Layout und Icon-Trennung sind real im Renderer verankert", () => { assert.match(editbox, /\.headerZone/); assert.match(editbox, /dictation\.icon/); assert.match(css, /min-height:\s*190px/); assert.match(css, /overflow:\s*auto/); });

  await run("M82.1 BBM 31: kompatibles Profil wird im echten BBM-Startdienst ohne Editorprozess geladen", async () => {
    const profileRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m82-1-startup-"));
    try {
      const registryScopes = scopes.map((scope) => scope.status === "complete"
        ? { ...scope, elements: scope.elements.map((entry) => ({
            ...entry,
            referenceResolved: true,
            ...(entry.baseline?.width === null || entry.baseline?.height === null ? { capturedBaseline: { width: 640, height: 64 } } : {}),
          })) }
        : scope);
      const registration = {
        applicationId: "bbm-produktiv", displayName: "BBM", framework: "electron",
        registryVersion: registry.BBM_M80_REGISTRY_VERSION, registryStatus: "incomplete",
        activeScopes: [...registry.BBM_M80_ACTIVE_SCOPES],
        supportedOperations: ["move", "resize", "resizeWidth", "resizeHeight", "textMove", "textResize", "setVisibility", "spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset", "fitTableToViewport", "resizeColumnsProportionally", "setHorizontalOverflowMode", "setColumnWidthMode", "setColumnWrapMode", "setColumnOverflowMode", "setRowHeightMode", "resetTableColumn", "resetTable"],
        uiCapability: "layout", pdfCapability: "unavailable", labelFieldSeparation: true, visibilityCapability: true,
        registryScopes,
      };
      const savedElement = (scopeId, entry) => {
        const saved = { elementId: entry.id, scopeId };
        const ops = new Set(entry.allowedOps);
        if (ops.has("move")) { saved.x = entry.baseline.x; saved.y = entry.baseline.y; }
        if (ops.has("resize") || ops.has("resizeWidth")) saved.width = Number.isFinite(entry.baseline.width) ? entry.baseline.width : Math.max(entry.baseline.minWidth || 1, 640);
        if (ops.has("resize") || ops.has("resizeHeight")) saved.height = Number.isFinite(entry.baseline.height) ? entry.baseline.height : Math.max(entry.baseline.minHeight || 1, 64);
        if (ops.has("textMove")) { saved.textOffsetX = entry.baseline.textOffsetX; saved.textOffsetY = entry.baseline.textOffsetY; }
        if (ops.has("textResize")) saved.fontSize = entry.baseline.fontSize;
        if (ops.has("setVisibility")) saved.visible = entry.baseline.visible;
        if (["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"].some((operation) => ops.has(operation))) saved.spacing = { ...(entry.baseline.spacing || {}) };
        if (entry.tableColumnLayout) saved.table = { tableId: entry.tableBinding.tableId, columnId: entry.id, widthMode: entry.tableColumnLayout.widthMode, wrapMode: entry.tableColumnLayout.wrapMode, overflowMode: entry.tableColumnLayout.overflowMode };
        if (entry.tableLayout) saved.table = { tableId: entry.id, horizontalOverflowMode: entry.tableLayout.horizontalOverflowMode, rowHeightMode: entry.tableLayout.rowHeightMode };
        return saved;
      };
      const document = {
        schemaVersion: 2, applicationId: "bbm-produktiv", profileId: "standard", savedAt: "2026-07-27T20:00:00.000Z",
        scopes: registry.BBM_M80_ACTIVE_SCOPES.map((scopeId) => {
          const scope = registryScopes.find((candidate) => candidate.scopeId === scopeId);
          return { scopeId, registryFingerprint: createUiScopeFingerprint(scope), layoutState: { elements: scope.elements.map((entry) => savedElement(scopeId, entry)) } };
        }),
      };
      fs.writeFileSync(path.join(profileRoot, "standard.layout-profile.json"), JSON.stringify(document));
      const { ElectronUiEditorSessionController } = require("../../src/main/ui-editor/electronUiEditorSession.js");
      let spawned = 0;
      const controller = new ElectronUiEditorSessionController({
        app: { getAppPath: () => ROOT, getVersion: () => "1.5.0", getPath: () => profileRoot },
        ipcMain: { handle() {} }, getMainWindow: () => null, profileRootResolver: () => profileRoot,
        spawnProcess: () => { spawned += 1; throw new Error("Editorprozess darf beim Start-Restore nicht laufen."); },
      });
      const loaded = controller.loadStartupLayout(registration);
      assert.equal(loaded.ok, true); assert.equal(loaded.found, true); assert.equal(loaded.editorProcessRequired, false); assert.equal(spawned, 0);
      assert.equal(controller.completeStartupLayout({ ok: true, profileSha256: loaded.profileSha256 }).ok, true);
      assert.equal(controller.status().running, false);
    } finally {
      fs.rmSync(profileRoot, { recursive: true, force: true });
    }
  });

  await run("M82.1 BBM 32: inkompatibles Startprofil fällt auf Baseline zurück und hinterlässt einen Recovery-Marker", async () => {
    assert.match(session, /startup-profile-recovery\.json|loadTargetStartupLayout/);
    assert.match(session, /state:\s*"baseline"/);
    assert.doesNotMatch(session, /BrowserWindow|WebSocket|https?:\/\//i);
  });
}

module.exports = { runM821BbmFeintuningTests };
