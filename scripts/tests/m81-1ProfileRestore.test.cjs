"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { ELECTRON_EDITOR_ERROR_CODES, createUiScopeFingerprint, loadTargetStartupLayout } = require("ui-editor-kit");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

async function runM811ProfileRestoreTests(run) {
  await run("M81.1 Fehlercodes: UI, PDF, Archiv, Migration, Baseline und Abbruch bleiben getrennt", () => {
    assert.equal(ELECTRON_EDITOR_ERROR_CODES.PROFILE_INCOMPATIBLE, "electron_profile_incompatible");
    assert.equal(ELECTRON_EDITOR_ERROR_CODES.PROFILE_CORRUPT, "electron_profile_corrupt");
    assert.equal(ELECTRON_EDITOR_ERROR_CODES.PROFILE_MIGRATION_AVAILABLE, "electron_profile_migration_available");
    assert.equal(ELECTRON_EDITOR_ERROR_CODES.PROFILE_MIGRATION_FAILED, "electron_profile_migration_failed");
    assert.equal(ELECTRON_EDITOR_ERROR_CODES.PROFILE_ARCHIVE_FAILED, "electron_profile_archive_failed");
    assert.equal(ELECTRON_EDITOR_ERROR_CODES.PROFILE_BASELINE_STARTED, "electron_profile_baseline_started");
    assert.equal(ELECTRON_EDITOR_ERROR_CODES.UI_PROFILE_RESTORE_FAILED, "electron_ui_profile_restore_failed");
    assert.equal(ELECTRON_EDITOR_ERROR_CODES.PDF_PROFILE_RESTORE_FAILED, "electron_pdf_profile_restore_failed");
    assert.equal(ELECTRON_EDITOR_ERROR_CODES.PROFILE_USER_CANCELLED, "electron_profile_user_cancelled");
  });

  await run("M81.1 BBM-Main: Profilfehler werden nicht mehr als pauschaler Verbindungsfehler gemeldet", () => {
    const { publicError } = require("../../src/main/ui-editor/electronUiEditorSession.js");
    assert.match(publicError({ code: ELECTRON_EDITOR_ERROR_CODES.PROFILE_INCOMPATIBLE }).message, /nicht mehr.*kompatibel/i);
    assert.match(publicError({ code: ELECTRON_EDITOR_ERROR_CODES.UI_PROFILE_RESTORE_FAILED }).message, /Editorverbindung selbst ist verfügbar/);
    assert.match(publicError({ code: ELECTRON_EDITOR_ERROR_CODES.PDF_PROFILE_RESTORE_FAILED }).message, /UI-Arbeitsbereich bleibt getrennt/);
    assert.match(publicError({ code: ELECTRON_EDITOR_ERROR_CODES.PROFILE_ARCHIVE_FAILED }).message, /bleibt unverändert/);
    assert.match(publicError({ code: ELECTRON_EDITOR_ERROR_CODES.PROFILE_USER_CANCELLED }).message, /BBM bleibt geöffnet/);
  });

  await run("M81.1 Renderer: Nutzerabbruch zeigt keinen zweiten Pauschaldialog", () => {
    const navigation = read("src/renderer/app/coreShellNavigation.js");
    assert.match(navigation, /errorCode\s*!==\s*"electron_profile_user_cancelled"/);
  });

  await run("M81.1 Profilwurzel: bestehender BBM-userData-Pfad bleibt führend", () => {
    const session = read("src/main/ui-editor/electronUiEditorSession.js");
    assert.match(session, /getPath\("userData"\),\s*"ui-editor",\s*"profiles"/);
    assert.match(session, /--profile-root=/);
    assert.doesNotMatch(session, /isolated-profile|test-profile-root|profileRoot.*tmpdir/i);
  });

  await run("M81.1 Produktgrenze: Fachwerte, Datenbank und PDF-Erzeugung bleiben außerhalb", () => {
    const navigation = read("src/renderer/app/coreShellNavigation.js");
    assert.doesNotMatch(navigation, /createRecord|updateRestarbeit|deleteRestarbeit|better-sqlite3|printToPDF/);
  });

  await run("M81.1 Protokollprofil: Beschluss-Filter wird additiv ohne Verlust vorhandener Werte ergänzt", async () => {
    const profileRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-decision-filter-profile-"));
    try {
      const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
      const scope = registry.listM80RegistryScopes().find((entry) => entry.scopeId === "protokoll.screen.root");
      const decisionId = "protokoll.topsScreen.quicklane.filter.option.decision";
      const oldFingerprint = "sha256:7251a69f8243bb21a4768170d75ea0d51a4a43a48db0cb4b06caaca565185029";
      const oldElements = scope.elements
        .filter((entry) => entry.id !== decisionId)
        .map((entry) => {
          const operations = new Set(entry.allowedOps || []);
          const state = { elementId: entry.id, scopeId: scope.scopeId };
          if (operations.has("move")) Object.assign(state, { x: 0, y: 0 });
          if (operations.has("resize") || operations.has("resizeWidth") || operations.has("changeWidth")) state.width = Number(entry.baseline?.width) || Number(entry.baseline?.minWidth);
          if (operations.has("resize") || operations.has("resizeHeight")) state.height = Number(entry.baseline?.height) || Number(entry.baseline?.minHeight);
          if (operations.has("textMove")) Object.assign(state, { textOffsetX: 0, textOffsetY: 0 });
          if (operations.has("textResize")) state.fontSize = Number(entry.baseline?.fontSize);
          if (operations.has("setVisibility")) state.visible = entry.baseline?.visible !== false;
          return state;
        });
      const todo = oldElements.find((entry) => entry.elementId === "protokoll.topsScreen.quicklane.filter.option.todo");
      todo.x = 17;
      const profilePath = path.join(profileRoot, "standard.layout-profile.json");
      fs.writeFileSync(profilePath, JSON.stringify({
        schemaVersion: 2,
        applicationId: "bbm-produktiv",
        profileId: "standard",
        savedAt: "2026-08-18T00:00:00.000Z",
        scopes: [{ scopeId: scope.scopeId, registryFingerprint: oldFingerprint, layoutState: { elements: oldElements } }],
      }), "utf8");

      const { migrateAdditiveProtokollDecisionFilterProfile } = require("../../src/main/ui-editor/electronUiEditorSession.js");
      const registration = { registryScopes: registry.listM80RegistryScopes() };
      assert.equal(migrateAdditiveProtokollDecisionFilterProfile(profileRoot, registration), 1);

      const migrated = JSON.parse(fs.readFileSync(profilePath, "utf8"));
      const migratedScope = migrated.scopes[0];
      assert.equal(migratedScope.registryFingerprint, createUiScopeFingerprint(scope));
      assert.equal(migratedScope.layoutState.elements.length, scope.elements.length);
      assert.equal(migratedScope.layoutState.elements.find((entry) => entry.elementId === todo.elementId).x, 17);
      assert.deepEqual(migratedScope.layoutState.elements.find((entry) => entry.elementId === decisionId), {
        elementId: decisionId,
        scopeId: scope.scopeId,
        x: 0,
        y: 0,
        width: 8,
        height: 8,
        fontSize: 12,
        visible: true,
      });
      assert.equal(fs.readdirSync(path.join(profileRoot, "archive", "bbm-produktiv")).length, 1);
      assert.equal(migrateAdditiveProtokollDecisionFilterProfile(profileRoot, registration), 0);
      assert.equal(loadTargetStartupLayout({
        profileRoot,
        applicationId: "bbm-produktiv",
        activeScopes: [scope.scopeId],
        registryScopes: [scope],
      }).ok, true);
    } finally {
      fs.rmSync(profileRoot, { recursive: true, force: true });
    }
  });
}

module.exports = { runM811ProfileRestoreTests };

if (require.main === module) {
  let failed = false;
  runM811ProfileRestoreTests(async (name, fn) => {
    try { await fn(); console.log(`PASS ${name}`); }
    catch (error) { failed = true; console.error(`FAIL ${name}`); console.error(error); }
  }).then(() => { if (failed) process.exitCode = 1; });
}
