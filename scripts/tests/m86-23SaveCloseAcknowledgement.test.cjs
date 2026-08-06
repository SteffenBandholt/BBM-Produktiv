"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const electronBinary = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const RUNNER = path.join(__dirname, "m86-23SaveCloseAcknowledgementRunner.cjs");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function runM8623Renderer() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m8623-"));
  const resultFile = path.join(temporaryRoot, "result.json");
  const host = path.join(temporaryRoot, "host");
  try {
    fs.mkdirSync(host);
    fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ main: "main.cjs" }), "utf8");
    fs.writeFileSync(path.join(host, "main.cjs"), `require(${JSON.stringify(RUNNER)});\n`, "utf8");
    const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "ELECTRON_RUN_AS_NODE")), BBM_M8623_RESULT_PATH: resultFile };
    const child = spawnSync(electronBinary, [host], { cwd: ROOT, env, encoding: "utf8", timeout: 180000, windowsHide: true });
    const report = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
    assert.equal(child.status, 0, `M86.23 Chromium-Lauf fehlgeschlagen:\n${report?.error || child.stderr || child.stdout || "ohne Ausgabe"}`);
    assert.ok(report?.ok, report?.error || "M86.23-Bericht fehlt.");
    return report;
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

async function runM8623SaveCloseAcknowledgementTests(run) {
  await run("M86.23 01: Save-Snapshot und eindeutige requestId werden vor Close bestätigt", () => {
    const core = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.EditorIntegration/Persistence/LayoutProfileSession.cs");
    const electron = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.EditorIntegration/Electron/ElectronPipeHostAdapter.cs");
    assert.match(core, /profileStore\.SaveAsync[\s\S]*Acknowledge[\s\S]*saved = CloneStates/);
    assert.match(core, /Guid\.NewGuid\(\)\.ToString\("N"\)/);
    assert.match(electron, /RequestAsync\(\s*"acknowledgeLayoutSave"/);
    assert.match(electron, /RequestAsync\(\s*"prepareEditorClose"/);
  });

  await run("M86.23 02: Close wartet auf Save-Erfolg; fehlendes Acknowledgement lässt den Editor offen", () => {
    const viewModel = read("../UI-Editor-kit/reference-target-app/src/ReferenceTargetApp.Wpf/UI/ViewModels/EditorWindowViewModel.cs");
    const saveAwait = viewModel.indexOf("if (IsDirty && !await SaveAsync()) return false;");
    const disposition = viewModel.indexOf("CloseDisposition = EditorCloseDisposition.Saved;", saveAwait);
    assert.ok(saveAwait >= 0 && disposition > saveAwait);
  });

  await run("M86.23 03: BBM leitet Save-Acknowledgement und requestId bis zum zentralen Close-Cleanup durch", () => {
    const main = read("src/main/ui-editor/electronUiEditorSession.js");
    const host = read("src/renderer/ui-editor/m80HostAdapter.js");
    assert.match(main, /NATIVE_REQUEST_ACTIONS = new Set\(\[[^\]]*"acknowledgeLayoutSave"[^\]]*"prepareEditorClose"/);
    assert.match(main, /editorClosed", reason, disposition, saveRequestId/);
    assert.match(host, /editorSessionBoundary = captureM80WorkingStates\(\);\s*editorSessionOperations = new Map\(\);/);
    assert.match(host, /prepareEditorClose\(request\)[\s\S]*completeEditorSession\(disposition\)/);
  });

  await run("M86.23 04: Restarbeiten und Protokoll behalten bestätigte Layouts nach Close und Neustart", () => {
    const report = runM8623Renderer();
    for (const moduleId of ["restarbeiten", "protokoll"]) {
      assert.deepEqual({
        acknowledgementBeforeClose: report[moduleId].acknowledgementBeforeClose,
        failedAcknowledgementRejected: report[moduleId].failedAcknowledgementRejected,
        cleanupBeforeClose: report[moduleId].cleanupBeforeClose,
        discardRestoredOnlyUnsaved: report[moduleId].discardRestoredOnlyUnsaved,
        cleanPreserved: report[moduleId].cleanPreserved,
        closePreserved: report[moduleId].closePreserved,
        restartPreserved: report[moduleId].restartPreserved,
        markersRemoved: report[moduleId].markersRemoved,
      }, {
        acknowledgementBeforeClose: true,
        failedAcknowledgementRejected: true,
        cleanupBeforeClose: true,
        discardRestoredOnlyUnsaved: true,
        cleanPreserved: true,
        closePreserved: true,
        restartPreserved: true,
        markersRemoved: true,
      }, moduleId);
    }
    assert.equal(report.separateProfiles, true);
    assert.notEqual(report.restarbeiten.saveRequestId, report.restarbeiten.secondSaveRequestId);
    assert.notEqual(report.protokoll.saveRequestId, report.protokoll.secondSaveRequestId);
  });
}

module.exports = { runM8623SaveCloseAcknowledgementTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => { try { await test(); console.log(`ok - ${name}`); } catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); } };
  runM8623SaveCloseAcknowledgementTests(run).then(() => { if (failed) process.exitCode = 1; });
}
