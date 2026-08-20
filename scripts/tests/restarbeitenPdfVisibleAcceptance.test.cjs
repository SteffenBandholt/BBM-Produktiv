"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const electronBinary = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const RUNNER = path.join(__dirname, "restarbeitenPdfVisibleAcceptanceRunner.cjs");

function waitForFile(filePath, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const poll = () => {
      if (fs.existsSync(filePath)) { resolve(); return; }
      if (Date.now() - startedAt >= timeoutMs) { reject(new Error(`Sichtbarer Editor meldet keine Automationsbereitschaft: ${filePath}`)); return; }
      setTimeout(poll, 100);
    };
    poll();
  });
}

async function runProcess(action, temporaryRoot, profileRoot, registrationRoot) {
  const resultPath = path.join(temporaryRoot, `${action}.json`);
  const readyPath = path.join(temporaryRoot, `${action}-automation-ready.json`);
  const automationResultPath = path.join(temporaryRoot, `${action}-automation-result.json`);
  const tracePath = path.join(temporaryRoot, `${action}-automation.trace.log`);
  const host = path.join(temporaryRoot, `host-${action}`);
  for (const stale of [resultPath, readyPath, automationResultPath, tracePath]) fs.rmSync(stale, { force: true });
  fs.mkdirSync(host, { recursive: true });
  fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ main: "main.cjs" }), "utf8");
  fs.writeFileSync(path.join(host, "main.cjs"), `require(${JSON.stringify(RUNNER)});\n`, "utf8");
  const env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "ELECTRON_RUN_AS_NODE")),
    BBM_REST_PDF_RESULT_PATH: resultPath,
    BBM_REST_PDF_PROFILE_ROOT: profileRoot,
    BBM_REST_PDF_REGISTRATION_ROOT: registrationRoot,
    BBM_REST_PDF_ACTION: action,
    BBM_REST_PDF_AUTOMATION_READY_PATH: readyPath,
    BBM_REST_PDF_AUTOMATION_RESULT_PATH: automationResultPath,
  };
  const child = spawn(electronBinary, [host], { cwd: ROOT, env, windowsHide: false });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const exited = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (status) => resolve(status));
  });
  await waitForFile(readyPath);
  const ready = JSON.parse(fs.readFileSync(readyPath, "utf8"));
  const powershell = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const automationRun = spawnSync(powershell, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
    path.join(__dirname, "m86-24UiAutomation.ps1"), "-ProcessId", String(ready.processId), "-Action", ready.automationAction,
    "-TracePath", tracePath], { cwd: ROOT, encoding: "utf8", timeout: 120000, windowsHide: false, maxBuffer: 4 * 1024 * 1024 });
  if (automationRun.status !== 0) {
    child.kill();
    throw new Error(automationRun.stderr || automationRun.stdout || `${action}: externe UI-Automation fehlgeschlagen`);
  }
  fs.writeFileSync(automationResultPath, automationRun.stdout, "utf8");
  const timeout = setTimeout(() => child.kill(), 180000);
  const status = await exited;
  clearTimeout(timeout);
  const report = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, "utf8")) : null;
  assert.equal(status, 0, report?.error || stderr || stdout || `${action}: sichtbarer PDF-Lauf fehlgeschlagen`);
  assert.equal(report?.ok, true, report?.error || `${action}: Bericht fehlt`);
  return report;
}

async function runRestarbeitenPdfVisibleAcceptanceTests(run) {
  await run("Restarbeiten-PDF sichtbar: gekoppelte Grenze und unabhaengige Spaltenbreite inklusive Maus, 0 und Neustart", async () => {
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-rest-pdf-visible-"));
    const profileRoot = path.join(temporaryRoot, "profiles");
    const registrationRoot = path.join(temporaryRoot, "registration");
    let completed = false;
    try {
      const edit = await runProcess("edit", temporaryRoot, profileRoot, registrationRoot);
      assert.equal(edit.started.opened.ok, true);
      assert.equal(edit.automation.table, "Restarbeiten-Tabelle");
      assert.deepEqual(edit.automation.columns, ["Nr", "Klasse", "Gegenstand", "Ort", "Einheit/Raum", "Fertig bis/Status", "Verantwortlich", "erledigt am", "Notiz/Massnahmen"]);
      assert.match(edit.automation.boundary, /Nr.*Klasse/);
      assert.equal(edit.beforeWidths.number, 9);
      assert.equal(edit.beforeWidths.class, 10);
      assert.equal(edit.afterWidths.number, 10);
      assert.equal(edit.afterWidths.class, 9);
      assert.ok(edit.persisted, "gespeichertes Restarbeiten-PDF-Profil fehlt");
      assert.ok(edit.regenerationRequests.length >= 1, "Neuerzeugung hat keinen registrierten Request ausgeloest");
      assert.ok(edit.regenerationRequests.every(({ documentTypeId, mode, orientation }) =>
        documentTypeId === "restarbeiten" && mode === "restarbeiten" && orientation === "landscape"),
      "Neuerzeugung nutzt ausschliesslich den registrierten Restarbeiten-Weg");

      const restart = await runProcess("inspect", temporaryRoot, profileRoot, registrationRoot);
      assert.equal(restart.started.opened.ok, true);
      assert.deepEqual(restart.automation.columns, edit.automation.columns);
      assert.equal(restart.beforeWidths.number, 10);
      assert.equal(restart.beforeWidths.class, 9);
      assert.deepEqual(restart.afterWidths, restart.beforeWidths);
      assert.equal(restart.profileFile, edit.profileFile);

      const columnProfileRoot = path.join(temporaryRoot, "column-profiles");
      const columnRegistrationRoot = path.join(temporaryRoot, "column-registration");
      const five = await runProcess("column5", temporaryRoot, columnProfileRoot, columnRegistrationRoot);
      assert.equal(five.beforeWidths.number, 9);
      assert.equal(five.beforeWidths.class, 10);
      assert.equal(five.afterWidths.number, 5);
      assert.equal(five.afterWidths.class, 10, "Nr 9 -> 5 darf Klasse nicht veraendern");
      assert.equal(five.automation.treeIdentityPresent, true);
      assert.ok(five.persisted, "isoliertes 5-mm-Profil fehlt");

      const drag = await runProcess("columnDrag", temporaryRoot, columnProfileRoot, columnRegistrationRoot);
      assert.equal(drag.beforeWidths.number, 5);
      assert.equal(drag.beforeWidths.class, 10);
      assert.notEqual(drag.afterWidths.number, 5, "physischer Mauszug muss Nr sichtbar veraendern");
      assert.equal(drag.afterWidths.class, 10, "Mauszug darf Klasse nicht veraendern");
      assert.equal(drag.automation.drag.physicalMouse, true);

      const zero = await runProcess("column0", temporaryRoot, columnProfileRoot, columnRegistrationRoot);
      assert.equal(zero.afterWidths.number, 0);
      assert.equal(zero.afterWidths.class, 10);
      assert.equal(zero.automation.treeIdentityPresent, true, "0-mm-Spalte bleibt im Baum");
      assert.equal(zero.persisted.layoutState.elements.find((entry) => entry.elementId.endsWith(".number")).width, 0);

      const zeroRestart = await runProcess("columnInspect", temporaryRoot, columnProfileRoot, columnRegistrationRoot);
      assert.equal(zeroRestart.beforeWidths.number, 0, "0 mm wird in neuem Prozess geladen");
      assert.equal(zeroRestart.beforeWidths.class, 10);
      assert.equal(zeroRestart.automation.treeIdentityPresent, true, "0-mm-Spalte bleibt nach Neustart im Baum");
      assert.deepEqual(zeroRestart.afterWidths, zeroRestart.beforeWidths);

      const nine = await runProcess("column9", temporaryRoot, columnProfileRoot, columnRegistrationRoot);
      assert.equal(nine.beforeWidths.number, 0);
      assert.equal(nine.afterWidths.number, 9);
      assert.equal(nine.afterWidths.class, 10);
      const nineRestart = await runProcess("columnInspect", temporaryRoot, columnProfileRoot, columnRegistrationRoot);
      assert.equal(nineRestart.beforeWidths.number, 9, "9 mm wird nach Reaktivierung in neuem Prozess geladen");
      assert.equal(nineRestart.beforeWidths.class, 10);
      assert.equal(nineRestart.automation.treeIdentityPresent, true);
      assert.equal(five.profileFile, nineRestart.profileFile);
      assert.notEqual(five.profileFile, edit.profileFile, "Direktbreiten-Nachweis nutzt ein isoliertes Profil");

      const separatorProfileRoot = path.join(temporaryRoot, "separator-profiles");
      const separatorRegistrationRoot = path.join(temporaryRoot, "separator-registration");
      const separatorElementId = "pdf.bbm.restarbeiten.table.vertical-column-separators";
      const persistedSeparator = (report) => report.persisted?.layoutState?.elements
        .find((entry) => entry.elementId === separatorElementId)?.visible;

      const separatorsOn = await runProcess("separatorsOn", temporaryRoot, separatorProfileRoot, separatorRegistrationRoot);
      assert.equal(separatorsOn.beforeSeparators, true, "frische Baseline ist EIN");
      assert.equal(separatorsOn.afterSeparators, true, "sichtbare AUS/EIN-Bedienung endet auf EIN");
      assert.equal(separatorsOn.automation.option, "Senkrechte Spaltentrennlinien");
      assert.equal(separatorsOn.automation.visibilityControl, "Sichtbarkeit EIN/AUS");
      assert.equal(separatorsOn.automation.toggleCount, 2);
      assert.equal(persistedSeparator(separatorsOn), true, "EIN wurde im PDF-Profil gespeichert");
      const separatorsInspectOn = await runProcess("separatorsInspectOn", temporaryRoot, separatorProfileRoot, separatorRegistrationRoot);
      assert.equal(separatorsInspectOn.beforeSeparators, true, "EIN wird nach komplettem Prozessneustart geladen");
      assert.equal(separatorsInspectOn.afterSeparators, true);

      const separatorsOff = await runProcess("separatorsOff", temporaryRoot, separatorProfileRoot, separatorRegistrationRoot);
      assert.equal(separatorsOff.beforeSeparators, true);
      assert.equal(separatorsOff.afterSeparators, false, "sichtbare Bedienung schaltet gemeinsam AUS");
      assert.equal(separatorsOff.automation.toggleCount, 1);
      assert.equal(persistedSeparator(separatorsOff), false, "AUS wurde im PDF-Profil gespeichert");
      const separatorsInspectOff = await runProcess("separatorsInspectOff", temporaryRoot, separatorProfileRoot, separatorRegistrationRoot);
      assert.equal(separatorsInspectOff.beforeSeparators, false, "AUS wird nach komplettem Prozessneustart geladen");
      assert.equal(separatorsInspectOff.afterSeparators, false);

      const separatorsReset = await runProcess("separatorsReset", temporaryRoot, separatorProfileRoot, separatorRegistrationRoot);
      assert.equal(separatorsReset.beforeSeparators, false);
      assert.equal(separatorsReset.automation.resetInvoked, true);
      assert.equal(separatorsReset.afterSeparators, true, "Original stellt die Baseline EIN wieder her");
      assert.equal(persistedSeparator(separatorsReset), true);
      const separatorsInspectReset = await runProcess("separatorsInspectReset", temporaryRoot, separatorProfileRoot, separatorRegistrationRoot);
      assert.equal(separatorsInspectReset.beforeSeparators, true, "wiederhergestellte Baseline bleibt nach Prozessneustart EIN");
      assert.equal(separatorsInspectReset.afterSeparators, true);
      assert.equal(separatorsOn.profileFile, separatorsInspectReset.profileFile, "alle Separator-Läufe nutzen genau ein PDF-Profil");
      completed = true;
    } finally {
      if (completed) fs.rmSync(temporaryRoot, { recursive: true, force: true });
      else console.error(`Restarbeiten-PDF-Sichtdiagnose erhalten: ${temporaryRoot}`);
    }
  });
}

module.exports = { runRestarbeitenPdfVisibleAcceptanceTests, runProcess };

if (require.main === module) {
  let failed = false;
  runRestarbeitenPdfVisibleAcceptanceTests(async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  }).then(() => { if (failed) process.exitCode = 1; });
}
