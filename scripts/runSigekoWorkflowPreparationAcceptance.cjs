#!/usr/bin/env node
"use strict";
// Real S5.4 preparation, stopping BEFORE the first mail preparation/Outlook call.
// This is a diagnostic gate, never a substitute for the manual COM acceptance.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { createAcceptanceProfile, createSanitizedEnvironment } = require("./runIsolatedUiEditorAcceptance.cjs");
const { ACCEPTANCE_SWITCH, configureUiEditorAcceptanceProfile } = require("../src/main/startup/uiEditorAcceptanceProfile");
const ROOT = path.resolve(__dirname, "..");
async function worker() {
  const { app, BrowserWindow, dialog, ipcMain, screen } = require("electron");
  let profile;
  const report = { package: "S5.4 PDF preparation only", ok: false, actualOutlookVerified: false,
    manualConfirmed: false, actualSendObserved: false, checks: {}, measurements: [] };
  const measurements = [];
  const onReady = (event, message) => {
    if (event.sender.isDestroyed()) return;
    measurements.push(event.sender.executeJavaScript(`(() => {
      const node = document.querySelector('[data-sigeko-va-pdf="authority.label"]');
      if (!node) return null;
      const range = document.createRange(); range.selectNodeContents(node);
      const css = getComputedStyle(node);
      return { box: node.getBoundingClientRect().toJSON(), text: range.getBoundingClientRect().toJSON(),
        fontFamily: css.fontFamily, fontSize: css.fontSize, lineHeight: css.lineHeight,
        devicePixelRatio, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth,
        scrollHeight: node.scrollHeight, clientHeight: node.clientHeight,
        fonts: Array.from(document.fonts, font => ({family:font.family,status:font.status})) };
    })()`).then(value => { if (value) report.measurements.push({ ...value, ready: message }); })
      .catch(error => report.measurements.push({ error: error.message })));
  };
  try {
    app.setAppPath(ROOT);
    profile = configureUiEditorAcceptanceProfile({ electronApp: app });
    assert.equal(profile.enabled, true);
    const fixture = require("./helpers/pdfAcceptanceLicense.cjs").createPdfAcceptanceLicense({ electronApp: app, profile });
    await app.whenReady();
    report.platform = process.platform;
    report.electron = process.versions.electron;
    report.display = screen.getPrimaryDisplay();
    const caller = new BrowserWindow({ show: false, webPreferences: {
      preload: path.join(ROOT, "src/main/preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: false } });
    await caller.loadURL("about:blank");
    const stop = new Error("S54_PREPARATION_BOUNDARY_REACHED");
    const methods = [];
    const boundaryCaller = { webContents: { executeJavaScript(source) {
      const method = /^window\.bbmDb\["([^"]+)"\]/.exec(source)?.[1];
      assert.ok(method, "Unexpected acceptance call");
      if (method === "sigekoPreparePreNotificationMail") throw stop;
      assert.ok(["sigekoCreatePreNotificationPdf", "sigekoGetPreNotificationWorkflow"].includes(method), method);
      methods.push(method);
      return caller.webContents.executeJavaScript(source);
    } } };
    ipcMain.on("print:ready", onReady);
    await assert.rejects(require("./helpers/sigekoWorkflowOutlookAcceptance.cjs").runWorkflowOutlookAcceptance({
      app, BrowserWindow, dialog, ipcMain, profile, fixture, caller: boundaryCaller, report }), error => error === stop);
    assert.deepEqual(methods, ["sigekoCreatePreNotificationPdf", "sigekoGetPreNotificationWorkflow"]);
    assert.equal(report.checks.s54Fixture.actualChromiumFinalPdf, true);
    assert.equal(report.checks.s54Fixture.originalFiles.length, 2);
    report.ok = true;
  } catch (error) { report.error = { message: error.message, stack: error.stack }; }
  finally {
    ipcMain.removeListener("print:ready", onReady);
    await Promise.all(measurements);
    for (const win of BrowserWindow.getAllWindows()) win.destroy();
    if (profile) {
      const destination = path.join(profile.rootPath, "s54-preparation-result.json");
      fs.writeFileSync(destination, JSON.stringify(report, null, 2));
      console.log(`${report.ok ? "PASS" : "FAIL"} PDF preparation only (no Outlook proof): ${destination}`);
    }
    if (report.error) console.error(report.error.message);
    console.log(JSON.stringify(report.measurements));
    app.exit(report.ok ? 0 : 1);
  }
}
async function launch() {
  const profile = createAcceptanceProfile();
  const scale = process.argv.find(arg => arg.startsWith("--force-device-scale-factor="));
  const args = [__filename, "--worker", `${ACCEPTANCE_SWITCH}${profile.rootPath}`, ...(scale ? [scale] : [])];
  const child = spawn(require("electron"), args, { cwd: ROOT, env: createSanitizedEnvironment(), stdio: "inherit" });
  process.exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", code => resolve(code ?? 1)); });
}
if (process.versions.electron && process.argv.includes("--worker")) void worker();
else if (require.main === module) launch().catch(error => { console.error(error); process.exitCode = 1; });
