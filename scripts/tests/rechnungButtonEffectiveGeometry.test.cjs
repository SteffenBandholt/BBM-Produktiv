"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const electronBinary = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const RUNNER = path.join(__dirname, "m86-24VisibleEditorAcceptanceRunner.cjs");
const EPSILON = 0.2;
const EXPECTED_BUTTON_IDS = Object.freeze([
  "rechnung.overview.new",
  "rechnung.editor.headToggle",
  "rechnung.editor.customerPicker",
  "rechnung.editor.servicePeriodToggle",
  "rechnung.editor.positionQuantityDecimals.decrease",
  "rechnung.editor.positionQuantityDecimals.increase",
  "rechnung.editor.positionCreateTitle",
  "rechnung.editor.positionCreate",
  "rechnung.editor.positionMove",
  "rechnung.editor.positionDelete",
  "rechnung.editor.positionMoveRoot",
  "rechnung.editor.preview",
  "rechnung.editor.book",
  "rechnung.editor.delete",
  "rechnung.editor.close",
  "rechnung.preview.close",
]);

function bounds(measurement) {
  const value = measurement?.targets?.[0]?.bounds;
  assert.ok(value, "Das reale DOM-Ziel besitzt keine BoundingBox.");
  return value;
}

function closeTo(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= EPSILON, `${message}: erwartet ${expected}, gemessen ${actual}`);
}

function runDomLayoutAudit(temporaryRoot) {
  const resultFile = path.join(temporaryRoot, "rechnung-dom-layout.json");
  const host = path.join(temporaryRoot, "host");
  const profileRoot = path.join(temporaryRoot, "profiles");
  fs.mkdirSync(host);
  fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ main: "main.cjs" }), "utf8");
  fs.writeFileSync(path.join(host, "main.cjs"), `require(${JSON.stringify(RUNNER)});\n`, "utf8");
  const env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "ELECTRON_RUN_AS_NODE")),
    BBM_M8624_RESULT_PATH: resultFile,
    BBM_M8624_PROFILE_ROOT: profileRoot,
    BBM_M8624_MODULE: "rechnung",
    BBM_M8624_ACTION: "RechnungDomLayoutAudit",
  };
  const child = spawnSync(electronBinary, [host], { cwd: ROOT, env, encoding: "utf8", timeout: 120000, windowsHide: false, maxBuffer: 4 * 1024 * 1024 });
  const report = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
  assert.equal(child.status, 0, report?.error || child.stderr || child.stdout || "Realer Rechnungs-DOM-Lauf fehlgeschlagen.");
  assert.equal(report?.ok, true, report?.error || "Realer Rechnungs-DOM-Bericht fehlt.");
  const artifactRoot = process.env.BBM_RECHNUNG_ACCEPTANCE_ARTIFACT_ROOT;
  if (artifactRoot) {
    fs.mkdirSync(artifactRoot, { recursive: true });
    fs.copyFileSync(resultFile, path.join(artifactRoot, "rechnung-button-all-16-dom-layout.json"));
  }
  return report.automation;
}

function assertEffectiveGeometry(exercise, label) {
  const initial = bounds(exercise.initial);
  const widthZero = bounds(exercise.widthZero);
  const bothZero = bounds(exercise.bothZero);
  const widthSmall = bounds(exercise.widthSmall);
  const bothSmall = bounds(exercise.bothSmall);
  const widthLarge = bounds(exercise.widthLarge);
  const bothLarge = bounds(exercise.bothLarge);
  const widthSmallAgain = bounds(exercise.widthSmallAgain);
  const bothSmallAgain = bounds(exercise.bothSmallAgain);
  const restored = bounds(exercise.restored);
  closeTo(widthZero.width, 0, `${label}: Nullbreite`);
  closeTo(widthZero.height, initial.height, `${label}: Nullbreite muss die Hoehe unveraendert lassen`);
  closeTo(bothZero.width, 0, `${label}: Nullbreite nach Nullhoehe`);
  closeTo(bothZero.height, 0, `${label}: Nullhoehe`);
  closeTo(widthSmall.width, 6, `${label}: kleine Breite`);
  closeTo(widthSmall.height, initial.height, `${label}: Breitenoperation muss die Hoehe unveraendert lassen`);
  closeTo(bothSmall.width, 6, `${label}: kleine Breite nach Hoehenoperation`);
  closeTo(bothSmall.height, 6, `${label}: kleine Hoehe`);
  closeTo(widthLarge.width, exercise.requested.largeWidth, `${label}: grosse Breite`);
  closeTo(widthLarge.height, 6, `${label}: grosse Breite darf die kleine Hoehe nicht veraendern`);
  closeTo(bothLarge.width, exercise.requested.largeWidth, `${label}: grosse Breite nach Hoehenoperation`);
  closeTo(bothLarge.height, exercise.requested.largeHeight, `${label}: grosse Hoehe`);
  closeTo(widthSmallAgain.width, 6, `${label}: erneute kleine Breite`);
  closeTo(widthSmallAgain.height, exercise.requested.largeHeight, `${label}: Breitenoperation darf grosse Hoehe nicht veraendern`);
  closeTo(bothSmallAgain.width, 6, `${label}: kleine Breite nach erneuter Hoehenoperation`);
  closeTo(bothSmallAgain.height, 6, `${label}: erneute kleine Hoehe`);
  closeTo(restored.width, initial.width, `${label}: Standardbreite wiederhergestellt`);
  closeTo(restored.height, initial.height, `${label}: Standardhoehe wiederhergestellt`);
}

async function runRechnungButtonEffectiveGeometryTests(run) {
  await run("Rechnungsbuttons: reale Chromium-BoundingBox folgt fuer alle 16 Ziele der angeforderten Breite und Hoehe", () => {
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-rechnung-button-dom-"));
    let completed = false;
    try {
      const audit = runDomLayoutAudit(temporaryRoot);
      assert.deepEqual(audit.buttonTargetIds, EXPECTED_BUTTON_IDS);
      assert.equal(audit.buttons.length, EXPECTED_BUTTON_IDS.length);
      audit.buttons.forEach((exercise) => assertEffectiveGeometry(exercise, exercise.elementId));
      assert.equal(audit.referenceTargetId, "rechnung.editor.headerCanvas");
      assertEffectiveGeometry(audit.reference, "Referenzelement Steuerungsbar-Canvas");
      completed = true;
    } finally {
      if (completed) fs.rmSync(temporaryRoot, { recursive: true, force: true });
      else console.error(`Rechnungsbutton-DOM-Diagnose erhalten: ${temporaryRoot}`);
    }
  });
}

module.exports = { runRechnungButtonEffectiveGeometryTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runRechnungButtonEffectiveGeometryTests(run).then(() => { if (failed) process.exitCode = 1; });
}
