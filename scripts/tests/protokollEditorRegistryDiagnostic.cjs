"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const electronBinary = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const RUNNER = path.join(__dirname, "protokollEditorRegistryDiagnosticRunner.mjs");
const HTML = path.join(__dirname, "m86-16RealEditorRuntime.html");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-protokoll-registry-diagnostic-"));
const resultFile = path.join(temporaryRoot, "result.json");
const host = path.join(temporaryRoot, "host");

try {
  fs.mkdirSync(host);
  fs.writeFileSync(path.join(host, "package.json"), JSON.stringify({ main: "main.cjs" }), "utf8");

  const runnerUrl = pathToFileURL(RUNNER).href;
  const mainSource = `
"use strict";
const fs = require("node:fs");
const { app, BrowserWindow } = require("electron");

const resultFile = ${JSON.stringify(resultFile)};
const htmlFile = ${JSON.stringify(HTML)};
const runnerUrl = ${JSON.stringify(runnerUrl)};

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

app.whenReady().then(async () => {
  let win;
  try {
    win = new BrowserWindow({
      show: false,
      width: 1600,
      height: 1200,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
        zoomFactor: 1,
      },
    });
    await win.loadFile(htmlFile);
    win.webContents.setZoomFactor(1);
    const result = await win.webContents.executeJavaScript(
      \`import(\${JSON.stringify(runnerUrl)}).then((module) => module.runProtokollEditorRegistryDiagnostic())\`,
      true
    );
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2), "utf8");
  } catch (error) {
    fs.writeFileSync(resultFile, JSON.stringify({ error: error?.stack || String(error) }, null, 2), "utf8");
    process.exitCode = 1;
  } finally {
    if (win && !win.isDestroyed()) win.destroy();
    app.quit();
  }
});
`;

  fs.writeFileSync(path.join(host, "main.cjs"), mainSource, "utf8");

  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== "ELECTRON_RUN_AS_NODE")
  );

  const child = spawnSync(electronBinary, [host], {
    cwd: ROOT,
    env,
    encoding: "utf8",
    timeout: 120000,
    windowsHide: true,
  });

  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);

  if (!fs.existsSync(resultFile)) {
    console.error("Diagnose lieferte keine Ergebnisdatei.");
    process.exitCode = child.status || 1;
  } else {
    const result = JSON.parse(fs.readFileSync(resultFile, "utf8"));
    console.log("\n=== PROTOKOLL UI-EDITOR REGISTRYDIAGNOSE ===");
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result?.error ? 1 : child.status || 0;
  }
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
