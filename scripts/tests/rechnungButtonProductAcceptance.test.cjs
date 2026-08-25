"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const electronBinary = require("electron");
const { ACCEPTANCE_SWITCH } = require("../../src/main/startup/uiEditorAcceptanceProfile.js");
const {
  ACCEPTANCE_MODULE_SWITCH,
  createAcceptanceProfile,
  createSanitizedEnvironment,
  removeAcceptanceProfile,
} = require("../runIsolatedUiEditorAcceptance.cjs");

const ROOT = path.resolve(__dirname, "../..");
// The native editor changes CSS geometry in one-DIP increments. On Windows with
// display scaling, Chromium exposes the resulting outer box on fractional
// device-pixel boundaries, so the closest reachable value can differ by half a
// pixel from the requested 6 px.
const EPSILON = 0.55;
const TARGET_IDS = Object.freeze([
  "rechnung.editor.positionQuantityDecimals.increase",
  "rechnung.editor.positionCreateTitle",
  "rechnung.editor.positionCreate",
  "rechnung.editor.positionMove",
  "rechnung.editor.positionDelete",
  "rechnung.editor.preview",
  "rechnung.editor.headToggle",
]);

function runProductProcess(profileRoot, action) {
  const args = [
    ROOT,
    `${ACCEPTANCE_SWITCH}${profileRoot}`,
    "--bbm-electron-editor-diagnostic",
    `${ACCEPTANCE_MODULE_SWITCH}rechnung`,
    `--bbm-rechnung-button-geometry-acceptance=${action}`,
  ];
  const child = spawnSync(electronBinary, args, {
    cwd: ROOT,
    env: createSanitizedEnvironment(),
    encoding: "utf8",
    timeout: 360000,
    windowsHide: false,
    maxBuffer: 8 * 1024 * 1024,
  });
  const resultFile = path.join(profileRoot, `rechnung-button-product-${action}.json`);
  const report = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
  assert.equal(child.status, 0, report?.error || child.stderr || child.stdout || `Produktprozess ${action} fehlgeschlagen.`);
  assert.equal(report?.ok, true, report?.error || `Produktbericht ${action} fehlt.`);
  return report;
}

function closeTo(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) <= EPSILON, `${label}: erwartet ${expected}, gemessen ${actual}`);
}

function persistedElement(report, elementId) {
  return report.persisted?.scopes?.flatMap((scope) => scope.layoutState?.elements || []).find((element) => element.elementId === elementId) || null;
}

function assertExercise(exercise) {
  const id = exercise.target.id;
  const initial = exercise.initial.bounds;
  const widthSmall = exercise.afterWidthSmall.bounds;
  const bothSmall = exercise.afterBothSmall.bounds;
  const widthGrow = exercise.afterWidthGrow.bounds;
  const bothGrow = exercise.afterBothGrow.bounds;
  const widthSmallFinal = exercise.afterWidthSmallFinal.bounds;
  const final = exercise.final.bounds;
  closeTo(widthSmall.width, 6, `${id}: Breite klein`);
  closeTo(widthSmall.height, initial.height, `${id}: nur Breite veraendert`);
  closeTo(bothSmall.width, 6, `${id}: Breite nach Hoehenoperation`);
  closeTo(bothSmall.height, 6, `${id}: Hoehe klein`);
  assert.ok(widthGrow.width > bothSmall.width + 100, `${id}: Breite wurde nicht deutlich vergroessert.`);
  closeTo(widthGrow.height, bothSmall.height, `${id}: Breitenwachstum veraenderte die Hoehe`);
  closeTo(bothGrow.width, widthGrow.width, `${id}: Hoehenwachstum veraenderte die Breite`);
  assert.ok(bothGrow.height > bothSmall.height + 60, `${id}: Hoehe wurde nicht deutlich vergroessert.`);
  closeTo(widthSmallFinal.width, 6, `${id}: Breite erneut klein`);
  closeTo(widthSmallFinal.height, bothGrow.height, `${id}: erneute Breitenoperation veraenderte die Hoehe`);
  closeTo(final.width, 6, `${id}: finale Breite`);
  closeTo(final.height, 6, `${id}: finale Hoehe`);
  for (const key of ["minWidth", "maxWidth", "minHeight", "maxHeight"]) assert.equal(exercise.final.inline[key] || "", "", `${id}: unzulaessiger Inline-Wert ${key}`);
}

async function runRechnungButtonProductAcceptanceTests(run) {
  await run("Rechnungsbuttons: normaler Router/RechnungScreen und nativer UI-Editor halten 6x6 nach Save, Rechnungs-Reopen und Electron-Neustart", () => {
    const profile = createAcceptanceProfile();
    let completed = false;
    try {
      const first = runProductProcess(profile.rootPath, "Run");
      assert.equal(first.route.rootInProductContent, true);
      assert.equal(first.route.scopeId, "rechnung.screen");
      assert.equal(first.route.coreShellStyles, true);
      assert.equal(first.route.popupStandardStyles, true);
      assert.equal(first.route.rechnungStyles, true);
      assert.equal(first.exercises.length, TARGET_IDS.length);
      assert.deepEqual(first.exercises.map((exercise) => exercise.target.id), TARGET_IDS);
      first.exercises.forEach(assertExercise);
      assert.equal(first.visibleSave.clicked, "Speichern");
      assert.equal(first.editorClose.runningAfterClose, false);
      assert.ok(first.persisted, "Gespeichertes Rechnungsprofil fehlt.");
      for (const exercise of first.exercises) {
        const id = exercise.target.id;
        const final = exercise.final.bounds;
        const saved = persistedElement(first, id);
        assert.ok(saved, `${id}: fehlt im Profil.`);
        closeTo(saved.width, final.width, `${id}: gespeicherte Breite`);
        closeTo(saved.height, final.height, `${id}: gespeicherte Hoehe`);
        for (const [stage, measurements] of [["Editor-Close", first.afterEditorClose], ["Rechnung neu geoeffnet", first.afterInvoiceReopen]]) {
          closeTo(measurements[id].bounds.width, final.width, `${id}: Breite nach ${stage}`);
          closeTo(measurements[id].bounds.height, final.height, `${id}: Hoehe nach ${stage}`);
        }
      }
      const restarted = runProductProcess(profile.rootPath, "RestoreOnly");
      assert.equal(restarted.route.rootInProductContent, true);
      assert.equal(restarted.startupRestore.applied, true);
      assert.equal(restarted.startupRestore.code, "startup_layout_applied");
      for (const exercise of first.exercises) {
        const id = exercise.target.id;
        closeTo(restarted.restored[id].bounds.width, exercise.final.bounds.width, `${id}: Breite nach Electron-Neustart`);
        closeTo(restarted.restored[id].bounds.height, exercise.final.bounds.height, `${id}: Hoehe nach Electron-Neustart`);
      }
      const artifactRoot = process.env.BBM_RECHNUNG_ACCEPTANCE_ARTIFACT_ROOT;
      if (artifactRoot) {
        fs.mkdirSync(artifactRoot, { recursive: true });
        for (const action of ["Run", "RestoreOnly"]) {
          fs.copyFileSync(
            path.join(profile.rootPath, `rechnung-button-product-${action}.json`),
            path.join(artifactRoot, `rechnung-button-product-${action}.json`),
          );
        }
      }
      completed = true;
    } finally {
      if (completed) removeAcceptanceProfile(profile.rootPath);
      else console.error(`Produktpfad-Diagnose erhalten: ${profile.rootPath}`);
    }
  });
}

module.exports = { runRechnungButtonProductAcceptanceTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runRechnungButtonProductAcceptanceTests(run).then(() => { if (failed) process.exitCode = 1; });
}
