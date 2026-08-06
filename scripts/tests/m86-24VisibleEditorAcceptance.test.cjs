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

function runVisibleModule(moduleId, profileRoot, temporaryRoot, requestedAction = null) {
  const actionName = requestedAction || (moduleId === "restarbeiten" ? "RestarbeitenSave" : "ProtokollSave");
  const resultFile = path.join(temporaryRoot, `${moduleId}-${actionName}.json`);
  const host = path.join(temporaryRoot, `host-${moduleId}-${actionName}`);
  fs.mkdirSync(host);
  fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ main: "main.cjs" }), "utf8");
  fs.writeFileSync(path.join(host, "main.cjs"), `require(${JSON.stringify(RUNNER)});\n`, "utf8");
  const env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "ELECTRON_RUN_AS_NODE")),
    BBM_M8624_RESULT_PATH: resultFile,
    BBM_M8624_PROFILE_ROOT: profileRoot,
    BBM_M8624_MODULE: moduleId,
    BBM_M8624_ACTION: actionName,
  };
  const child = spawnSync(electronBinary, [host], {
    cwd: ROOT,
    env,
    encoding: "utf8",
    timeout: 240000,
    windowsHide: false,
    maxBuffer: 4 * 1024 * 1024,
  });
  const report = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
  assert.equal(child.status, 0, `${moduleId}: sichtbarer M86.24-Lauf fehlgeschlagen:\n${report?.error || child.stderr || child.stdout || "ohne Ausgabe"}`);
  assert.equal(report?.ok, true, report?.error || `${moduleId}: M86.24-Bericht fehlt.`);
  return report;
}

function width(report, location) {
  const target = location.target;
  assert.ok(target?.targets?.length > 0, "Das sichtbare Ziel wurde nicht gemessen.");
  return target.targets[0].bounds.width;
}

function assertVisibleSave(moduleId, report, restartReport) {
  const run = report.automation;
  const initialWidth = width(report, run.beforeMinus);
  const minusWidths = run.minusSteps.map((step) => width(report, step.measured));
  let previous = initialWidth;
  for (const current of minusWidths) {
    assert.ok(current < previous - EPSILON, `${moduleId}: Minus muss die sichtbare Breite reduzieren (${previous} -> ${current}).`);
    previous = current;
  }

  const plusWidth = width(report, run.symmetry.afterPlus);
  const symmetryMinusWidth = width(report, run.symmetry.afterMinus);
  assert.ok(plusWidth > minusWidths.at(-1) + EPSILON, `${moduleId}: Plus muss die sichtbare Breite erhoehen.`);
  assert.ok(symmetryMinusWidth < plusWidth - EPSILON, `${moduleId}: Minus nach Plus muss wieder verkleinern.`);
  assert.ok(Math.abs(symmetryMinusWidth - minusWidths.at(-1)) <= EPSILON,
    `${moduleId}: Plus und Minus sind nicht symmetrisch (${minusWidths.at(-1)} / ${symmetryMinusWidth}).`);

  if (moduleId === "protokoll") {
    assert.equal(run.beforeMinus.target.targets.length, 2, "Fertig bis muss als Multi-Ref gemessen werden.");
    for (const step of run.minusSteps) {
      assert.equal(step.measured.target.targets.length, 2);
      assert.ok(Math.abs(step.measured.target.targets[0].bounds.width - step.measured.target.targets[1].bounds.width) <= EPSILON,
        "Beide Fertig-bis-Multi-Refs muessen dieselbe sichtbare Breite erhalten.");
    }
  }

  assert.equal(run.closeAndSave.saveDialog.dialogFound, true, `${moduleId}: Der echte Ungespeichert-Dialog wurde nicht gefunden.`);
  assert.match(run.closeAndSave.saveDialog.saveClicked, /^Speichern und fortfahren/);
  assert.equal(run.editorRunningAfterClose, false, `${moduleId}: Das Editorfenster blieb nach bestaetigtem Save offen.`);

  const savedWidth = width(report, run.beforeClose);
  assert.ok(Math.abs(width(report, run.afterClose) - savedWidth) <= EPSILON,
    `${moduleId}: Rendererzustand ging unmittelbar nach Close verloren.`);
  assert.equal(run.afterClose.markers.length, 0, `${moduleId}: Editor-Markierungen blieben nach Close zurueck.`);
  assert.ok(run.persisted, `${moduleId}: Persistentes Profil fehlt.`);
  assert.ok(run.persisted.scopes?.some((scope) =>
    scope.layoutState?.elements?.some((element) => element.elementId === run.beforeClose.targetId && Math.abs(element.width - savedWidth) <= 1)),
  `${moduleId}: Der sichtbare Zielwert fehlt im persistenten Snapshot.`);
  assert.ok(run.persisted.scopes?.some((scope) =>
    scope.explicitOperations?.[run.beforeClose.targetId]?.includes("resizeWidth")),
  `${moduleId}: Die explizite Breitenoperation fehlt im Profil.`);

  assert.equal(run.afterRestart.rawStartup?.code, "layout_profile_loaded", `${moduleId}: Profil wurde beim Neustart nicht geladen.`);
  assert.equal(run.afterRestart.restore?.applied, true, `${moduleId}: Startup-Restore wurde nicht angewendet.`);
  assert.ok(Math.abs(width(report, run.afterRestart.renderer) - savedWidth) <= EPSILON,
    `${moduleId}: Sichtbare Breite ging beim Neustart verloren.`);
  assert.equal(run.afterRestart.renderer.markers.length, 0, `${moduleId}: Editor-Markierungen erschienen nach Neustart.`);
  assert.equal(restartReport.restartOnly, true, `${moduleId}: separater Neustartprozess fehlt.`);
  assert.equal(restartReport.restarted.rawStartup?.code, "layout_profile_loaded", `${moduleId}: separater Prozess hat das Profil nicht geladen.`);
  assert.equal(restartReport.restarted.restore?.applied, true, `${moduleId}: separater Prozess hat das Profil nicht angewendet.`);
  assert.ok(Math.abs(width(restartReport, restartReport.renderer) - savedWidth) <= EPSILON,
    `${moduleId}: Sichtbare Breite ging nach vollständigem Electron-Prozessneustart verloren.`);
  assert.equal(restartReport.renderer.markers.length, 0, `${moduleId}: separater Neustartprozess begann mit Editor-Markierungen.`);
}

async function runM8624VisibleEditorAcceptanceTests(run) {
  await run("M86.24: echte Minus-Bounds und sichtbarer Save-and-continue-Pfad bleiben nach Close und Neustart erhalten", () => {
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m8624-"));
    const profileRoot = path.join(temporaryRoot, "profiles");
    let completed = false;
    try {
      const protokoll = runVisibleModule("protokoll", profileRoot, temporaryRoot);
      const restarbeiten = runVisibleModule("restarbeiten", profileRoot, temporaryRoot);
      const protokollRestart = runVisibleModule("protokoll", profileRoot, temporaryRoot, "RestoreOnly");
      const restarbeitenRestart = runVisibleModule("restarbeiten", profileRoot, temporaryRoot, "RestoreOnly");
      assertVisibleSave("protokoll", protokoll, protokollRestart);
      assertVisibleSave("restarbeiten", restarbeiten, restarbeitenRestart);
      assert.notEqual(protokoll.automation.profileFile, restarbeiten.automation.profileFile,
        "Protokoll und Restarbeiten muessen getrennte Profile verwenden.");
      completed = true;
    } finally {
      if (completed) fs.rmSync(temporaryRoot, { recursive: true, force: true });
      else console.error(`M86.24-Diagnose erhalten: ${temporaryRoot}`);
    }
  });
}

module.exports = { runM8624VisibleEditorAcceptanceTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM8624VisibleEditorAcceptanceTests(run).then(() => { if (failed) process.exitCode = 1; });
}
