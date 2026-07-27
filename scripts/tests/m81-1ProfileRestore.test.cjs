"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ELECTRON_EDITOR_ERROR_CODES } = require("ui-editor-kit");

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
}

module.exports = { runM811ProfileRestoreTests };

if (require.main === module) {
  let failed = false;
  runM811ProfileRestoreTests(async (name, fn) => {
    try { await fn(); console.log(`PASS ${name}`); }
    catch (error) { failed = true; console.error(`FAIL ${name}`); console.error(error); }
  }).then(() => { if (failed) process.exitCode = 1; });
}
