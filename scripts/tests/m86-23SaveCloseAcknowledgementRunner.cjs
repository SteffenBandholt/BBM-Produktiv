"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow } = require("electron");

const resultPath = path.resolve(process.env.BBM_M8623_RESULT_PATH || "m86-23-missing-result.json");
const harnessUrl = pathToFileURL(path.join(__dirname, "m86-23SaveCloseAcknowledgementHarness.mjs")).href;
function write(value) { fs.writeFileSync(resultPath, JSON.stringify(value), "utf8"); }

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.whenReady().then(async () => {
  let window;
  try {
    window = new BrowserWindow({ show: false, width: 1600, height: 1200, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: false, backgroundThrottling: false } });
    await window.loadFile(path.join(__dirname, "m86-23SaveCloseAcknowledgement.html"));
    const report = await window.webContents.executeJavaScript(`import(${JSON.stringify(harnessUrl)}).then((module) => module.runM8623SaveCloseAcknowledgement())`, true);
    write(report);
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    write({ ok: false, error: error?.stack || String(error) });
    process.exitCode = 1;
  } finally {
    if (window && !window.isDestroyed()) window.destroy();
    app.quit();
  }
});
