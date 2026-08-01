"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const electronModule = require("electron");
const { createPrintToPdfOptions } = require("../../src/main/print/printOrientation.js");
const { getM85Fixtures } = require("./m85Fixtures.cjs");

const IS_ELECTRON_PROCESS = Boolean(process.versions.electron);
const { app, BrowserWindow, ipcMain } = IS_ELECTRON_PROCESS ? electronModule : {};

function parseArgs(argv) {
  const result = { output: "", pdfDir: "", fixtureIds: [], isolatedRoot: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "");
    if (arg === "--output") result.output = path.resolve(String(argv[++index] || ""));
    else if (arg === "--pdf-dir") result.pdfDir = path.resolve(String(argv[++index] || ""));
    else if (arg === "--isolated-root") result.isolatedRoot = path.resolve(String(argv[++index] || ""));
    else if (arg === "--fixture") result.fixtureIds.push(String(argv[++index] || ""));
    else if (arg.startsWith("--fixture=")) result.fixtureIds.push(arg.slice("--fixture=".length));
  }
  if (!result.output) throw new Error("M85-Snapshot-Ausgabedatei fehlt (--output)." );
  return result;
}

function runNodeLauncher() {
  const isolatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-m85-pdf-fixtures-"));
  const env = { ...process.env };
  const childArgs = process.argv.slice(2).filter((arg) => arg !== "--node-launcher");
  delete env.ELECTRON_RUN_AS_NODE;
  try {
    const result = spawnSync(
      electronModule,
      [__filename, "--isolated-root", isolatedRoot, ...childArgs],
      { cwd: path.resolve(__dirname, "../.."), env, stdio: "inherit", windowsHide: true }
    );
    if (result.error) throw result.error;
    process.exitCode = Number.isInteger(result.status) ? result.status : 1;
  } finally {
    fs.rmSync(isolatedRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
}

function clone(value) {
  return structuredClone(value);
}

function createHarnessWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 900,
    show: false,
    backgroundColor: "#ffffff",
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      preload: path.resolve(__dirname, "../../src/main/preload/printPreload.js"),
    },
  });
  win.webContents.on("did-fail-load", (_event, code, description, validatedUrl) => {
    console.error(`[M85] did-fail-load ${code} ${description} ${validatedUrl}`);
  });
  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    if (level >= 2 && !String(message).includes("Electron Security Warning")) {
      console.error(`[M85] renderer ${message} (${sourceId}:${line})`);
    }
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error(`[M85] render-process-gone ${JSON.stringify(details)}`);
  });
  return win;
}

async function renderFixture(win, fixture, { pdfDir } = {}) {
  const jobId = `m85-${fixture.id}`;
  const ready = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ipcMain.removeListener("print:ready", onReady);
        reject(new Error(`M85-Fixture Timeout: ${fixture.id}`));
      }, 60000);
      const onReady = (event, message) => {
        if (event.sender !== win.webContents || message?.jobId !== jobId) return;
        clearTimeout(timeout);
        ipcMain.removeListener("print:ready", onReady);
        if (message?.ok === false) reject(new Error(`M85-Rendererfehler: ${fixture.id}`));
        else resolve(message);
      };
      ipcMain.on("print:ready", onReady);
    });
  win.webContents.send("print:init", {
    jobId,
    fixtureId: fixture.id,
    mode: fixture.data.mode,
    orientation: fixture.data.orientation,
    pdfSatzvertragSnapshot: true,
    debug: false,
  });
  await ready;
  const snapshot = await win.webContents.executeJavaScript(
    "structuredClone(globalThis.__bbmPdfSatzvertragSnapshot || null)",
    true
  );
  if (!snapshot) throw new Error(`M85-Struktursnapshot fehlt: ${fixture.id}`);

  let pdf = null;
  if (pdfDir) {
    fs.mkdirSync(pdfDir, { recursive: true });
    const filePath = path.join(pdfDir, `${fixture.id}.pdf`);
    const buffer = await win.webContents.printToPDF(createPrintToPdfOptions({ orientation: fixture.data.orientation }));
    fs.writeFileSync(filePath, buffer);
    pdf = { fileName: path.basename(filePath), bytes: buffer.length };
  }
  return { id: fixture.id, number: fixture.number, title: fixture.title, kind: fixture.kind, snapshot, pdf };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixtures = getM85Fixtures(args.fixtureIds);
  if (!fixtures.length) throw new Error("Keine M85-Fixtures ausgewählt.");

  if (!args.isolatedRoot) throw new Error("M85-Isolationsprofil fehlt (--isolated-root).");
  app.setAppPath(path.resolve(__dirname, "../.."));
  app.setPath("userData", path.join(args.isolatedRoot, "userData"));
  app.setPath("sessionData", path.join(args.isolatedRoot, "sessionData"));
  app.disableHardwareAcceleration();

  ipcMain.handle("print:getData", (_event, payload) => {
    const fixture = fixtures.find((entry) => entry.id === payload?.fixtureId) || null;
    if (!fixture) return { ok: false, error: `Unbekannte M85-Fixture: ${String(payload?.fixtureId || "")}` };
    return { ok: true, data: clone(fixture.data) };
  });
  ipcMain.handle("tableLayouts:getOne", () => ({ ok: false, error: "M85-Fixture verwendet nur explizite neutrale Daten." }));
  ipcMain.handle("appSettings:getMany", () => ({ ok: true, data: {} }));

  try {
    await app.whenReady();
    const win = createHarnessWindow();
    await win.loadURL(pathToFileURL(path.resolve(__dirname, "../../src/renderer/print/index.html")).href);
    const results = [];
    try {
      for (const fixture of fixtures) {
        results.push(await renderFixture(win, fixture, { pdfDir: args.pdfDir }));
      }
    } finally {
      if (!win.isDestroyed()) win.destroy();
    }
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify({ version: 1, results }, null, 2)}\n`, "utf8");
  } finally {
    for (const channel of ["print:getData", "tableLayouts:getOne", "appSettings:getMany"]) {
      try { ipcMain.removeHandler(channel); } catch (_error) { /* best-effort cleanup */ }
    }
    app.quit();
  }
}

if (IS_ELECTRON_PROCESS && !process.argv.includes("--node-launcher")) {
  main().catch((error) => {
    console.error(error?.stack || error?.message || error);
    try { app.exit(1); } catch (_error) { process.exitCode = 1; }
  });
} else {
  try {
    runNodeLauncher();
  } catch (error) {
    console.error(error?.stack || error?.message || error);
    process.exitCode = 1;
  }
}
