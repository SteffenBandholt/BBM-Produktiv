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
const BUTTON_EPSILON = 0.55;
const BUTTON_BOUND_KEYS = Object.freeze(["minWidth", "maxWidth", "minHeight", "maxHeight"]);

function runVisibleModule(moduleId, profileRoot, temporaryRoot, requestedAction = null) {
  const actionName = requestedAction || (moduleId === "rechnung" ? "RechnungSave" : moduleId === "restarbeiten" ? "RestarbeitenSave" : "ProtokollSave");
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

function measuredDimension(measurement, dimension) {
  const target = measurement?.target || measurement;
  assert.ok(target?.targets?.length > 0, `Das sichtbare Buttonziel wurde nicht fuer ${dimension} gemessen.`);
  return target.targets[0].bounds[dimension];
}

function persistedElement(report, elementId) {
  for (const scope of report.automation.persisted?.scopes || []) {
    const element = scope.layoutState?.elements?.find((candidate) => candidate.elementId === elementId);
    if (element) return element;
  }
  return null;
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

  const symmetryBaseWidth = run.invoiceRange ? width(report, run.invoiceRange.afterGrow) : minusWidths.at(-1);
  const plusWidth = width(report, run.symmetry.afterPlus);
  const symmetryMinusWidth = width(report, run.symmetry.afterMinus);
  assert.ok(plusWidth > symmetryBaseWidth + EPSILON, `${moduleId}: Plus muss die sichtbare Breite erhoehen.`);
  if (moduleId !== "rechnung") {
    assert.ok(symmetryMinusWidth < plusWidth - EPSILON, `${moduleId}: Minus nach Plus muss wieder verkleinern.`);
    assert.ok(Math.abs(symmetryMinusWidth - symmetryBaseWidth) <= EPSILON,
      `${moduleId}: Plus und Minus sind nicht symmetrisch (${symmetryBaseWidth} / ${symmetryMinusWidth}).`);
  }

  if (moduleId === "protokoll") {
    assert.equal(run.beforeMinus.target.targets.length, 2, "Fertig bis muss als Multi-Ref gemessen werden.");
    for (const step of run.minusSteps) {
      assert.equal(step.measured.target.targets.length, 2);
      assert.ok(Math.abs(step.measured.target.targets[0].bounds.width - step.measured.target.targets[1].bounds.width) <= EPSILON,
        "Beide Fertig-bis-Multi-Refs muessen dieselbe sichtbare Breite erhalten.");
    }
  }

  if (moduleId === "rechnung") {
    const compactWidth = width(report, run.invoiceRange.afterShrink);
    const expandedWidth = width(report, run.invoiceRange.afterGrow);
    assert.ok(compactWidth < 468, `rechnung: Kurztext blieb trotz 120 weiterer Minus-Klicks bei ${compactWidth} px.`);
    assert.ok(expandedWidth > initialWidth, `rechnung: Kurztext ueberschritt den Ausgangswert nicht (${initialWidth} -> ${expandedWidth}).`);
    assert.equal(run.invoiceRange.shrinkClick.clickCount, 120);
    assert.equal(run.invoiceRange.growClick.clickCount, 140);
    assert.equal(run.closeAndSave.visibleSave.clicked, "Speichern", "rechnung: Der sichtbare Speichern-Button wurde nicht ausgeloest.");
    assert.ok(run.closeAndSave.savedEditorState.status.some((value) => value.startsWith("Gespeichert") || value.startsWith("Zuletzt")),
      "rechnung: Der sichtbare Editor hat den Save nicht bestaetigt.");
    assert.equal(run.invoiceButtons.length, 3, "rechnung: Drei repraesentative Buttons muessen sichtbar geprueft werden.");
    for (const button of run.invoiceButtons) {
      const id = button.targetConfig.elementId;
      const initialWidth = measuredDimension(button.selected.initial, "width");
      const initialHeight = measuredDimension(button.selected.initial, "height");
      const narrowWidth = measuredDimension(button.afterWidthMinus, "width");
      const smallWidth = measuredDimension(button.afterShrink, "width");
      const smallHeight = measuredDimension(button.afterShrink, "height");
      const grownWidth = measuredDimension(button.afterGrow, "width");
      const grownHeight = measuredDimension(button.afterGrow, "height");
      const widthOnlyGrownWidth = measuredDimension(button.afterWidthGrow, "width");
      const widthOnlyGrownHeight = measuredDimension(button.afterWidthGrow, "height");
      const finalWidthOnlyWidth = measuredDimension(button.afterWidthShrinkFinal, "width");
      const finalWidthOnlyHeight = measuredDimension(button.afterWidthShrinkFinal, "height");
      const finalWidth = measuredDimension(button.final, "width");
      const finalHeight = measuredDimension(button.final, "height");
      assert.ok(narrowWidth < initialWidth - EPSILON, `${id}: sichtbares Breiten-Minus wirkte nicht.`);
      assert.ok(smallHeight < initialHeight - EPSILON, `${id}: sichtbares Hoehen-Minus wirkte nicht.`);
      assert.ok(Math.abs(smallWidth - narrowWidth) <= BUTTON_EPSILON, `${id}: Hoehenoperation veraenderte die Breite.`);
      assert.ok(Math.abs(narrowWidth - 6) <= BUTTON_EPSILON, `${id}: angeforderte Breite 6 px ergab ${narrowWidth} px.`);
      assert.ok(Math.abs(smallHeight - 6) <= BUTTON_EPSILON, `${id}: angeforderte Hoehe 6 px ergab ${smallHeight} px.`);
      assert.ok(Math.abs(widthOnlyGrownHeight - smallHeight) <= BUTTON_EPSILON, `${id}: reine Breitenvergroesserung veraenderte die Hoehe.`);
      assert.ok(widthOnlyGrownWidth > smallWidth + 100, `${id}: deutliche Breitenvergroesserung wirkte nicht.`);
      assert.ok(grownWidth > smallWidth + EPSILON, `${id}: sichtbares Breiten-Plus wirkte nicht.`);
      assert.ok(grownHeight > smallHeight + EPSILON, `${id}: sichtbares Hoehen-Plus wirkte nicht.`);
      assert.ok(grownHeight > smallHeight + 60, `${id}: deutliche Hoehenvergroesserung wirkte nicht.`);
      assert.ok(Math.abs(finalWidthOnlyWidth - smallWidth) <= BUTTON_EPSILON, `${id}: grosse Breite wurde nicht wieder auf 6 px verkleinert.`);
      assert.ok(Math.abs(finalWidthOnlyHeight - grownHeight) <= BUTTON_EPSILON, `${id}: reine Breitenverkleinerung veraenderte die grosse Hoehe.`);
      assert.ok(Math.abs(finalWidth - smallWidth) <= BUTTON_EPSILON, `${id}: Breiten-Plus/Minus ist nicht symmetrisch.`);
      assert.ok(Math.abs(finalHeight - smallHeight) <= BUTTON_EPSILON, `${id}: Hoehen-Plus/Minus ist nicht symmetrisch.`);
      const inline = button.final.target.targets[0].inline;
      BUTTON_BOUND_KEYS.forEach((key) => assert.equal(inline[key] || "", "", `${id}: unzulaessiger Inline-Wert ${key}`));
      const saved = persistedElement(report, id);
      assert.ok(saved, `${id}: fehlt im gespeicherten Profil.`);
      assert.ok(Math.abs(saved.width - finalWidth) <= BUTTON_EPSILON, `${id}: kleine Breite wurde nicht exakt gespeichert.`);
      assert.ok(Math.abs(saved.height - finalHeight) <= BUTTON_EPSILON, `${id}: kleine Hoehe wurde nicht exakt gespeichert.`);
      BUTTON_BOUND_KEYS.forEach((key) => assert.equal(Object.hasOwn(saved, key), false, `${id}: unzulaessiger Profilwert ${key}`));
      for (const [label, targets] of [
        ["nach Editor-Close", run.afterCloseButtonTargets],
        ["nach App-Remount", run.afterRestart.buttonTargets],
        ["nach Electron-Neustart", restartReport.restarted.buttonTargets],
      ]) {
        assert.ok(Math.abs(measuredDimension(targets[id], "width") - finalWidth) <= BUTTON_EPSILON, `${id}: Breite ${label} nicht erhalten.`);
        assert.ok(Math.abs(measuredDimension(targets[id], "height") - finalHeight) <= BUTTON_EPSILON, `${id}: Hoehe ${label} nicht erhalten.`);
      }
    }
    const decimalButton = run.invoiceButtons.find((button) => button.targetConfig.elementId === "rechnung.editor.positionQuantityDecimals.increase");
    assert.ok(measuredDimension(decimalButton.final, "width") < 20, "rechnung: Nachkommastellen-Button blieb bei mindestens 20 px Breite.");
    assert.ok(measuredDimension(decimalButton.final, "height") < 18, "rechnung: Nachkommastellen-Button blieb bei mindestens 18 px Hoehe.");
  } else {
    assert.equal(run.closeAndSave.saveDialog.dialogFound, true, `${moduleId}: Der echte Ungespeichert-Dialog wurde nicht gefunden.`);
    assert.match(run.closeAndSave.saveDialog.saveClicked, /^Speichern und fortfahren/);
  }
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
      const onlyModule = String(process.env.BBM_M8624_ONLY_MODULE || "").trim();
      if (onlyModule) {
        const report = runVisibleModule(onlyModule, profileRoot, temporaryRoot);
        const restart = runVisibleModule(onlyModule, profileRoot, temporaryRoot, "RestoreOnly");
        assertVisibleSave(onlyModule, report, restart);
        completed = true;
        return;
      }
      const protokoll = runVisibleModule("protokoll", profileRoot, temporaryRoot);
      const restarbeiten = runVisibleModule("restarbeiten", profileRoot, temporaryRoot);
      const rechnung = runVisibleModule("rechnung", profileRoot, temporaryRoot);
      const protokollRestart = runVisibleModule("protokoll", profileRoot, temporaryRoot, "RestoreOnly");
      const restarbeitenRestart = runVisibleModule("restarbeiten", profileRoot, temporaryRoot, "RestoreOnly");
      const rechnungRestart = runVisibleModule("rechnung", profileRoot, temporaryRoot, "RestoreOnly");
      assertVisibleSave("protokoll", protokoll, protokollRestart);
      assertVisibleSave("restarbeiten", restarbeiten, restarbeitenRestart);
      assertVisibleSave("rechnung", rechnung, rechnungRestart);
      assert.notEqual(protokoll.automation.profileFile, restarbeiten.automation.profileFile,
        "Protokoll und Restarbeiten muessen getrennte Profile verwenden.");
      assert.notEqual(rechnung.automation.profileFile, restarbeiten.automation.profileFile,
        "Rechnung und Restarbeiten muessen getrennte Profile verwenden.");
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
