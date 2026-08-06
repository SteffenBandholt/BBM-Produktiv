"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow } = require("electron");

const resultPath = path.resolve(process.env.BBM_M8621_RESULT_PATH || "m86-21-missing-result.json");
const harnessUrl = pathToFileURL(path.join(__dirname, "m86-21RestarbeitenViewportHarness.mjs")).href;

function write(value) {
  fs.writeFileSync(resultPath, JSON.stringify(value), "utf8");
}

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

app.whenReady().then(async () => {
  let window;
  try {
    window = new BrowserWindow({
      show: false,
      width: 1920,
      height: 1080,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
        zoomFactor: 1,
      },
    });
    await window.loadFile(path.join(__dirname, "m86-16RealEditorRuntime.html"));
    window.webContents.setZoomFactor(1);
    const report = await window.webContents.executeJavaScript(
      `import(${JSON.stringify(harnessUrl)}).then((module) => module.runM8621RestarbeitenViewport())`,
      true
    );
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
