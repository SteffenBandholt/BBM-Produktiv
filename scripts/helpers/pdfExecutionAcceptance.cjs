"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// Actual preload -> IPC -> print-window path. Faults are confined to this
// isolated worker; printToPDF, storage and IPC results are never replaced.
async function verifyPdfExecutionFailures({ app, BrowserWindow, ipcMain, invoke, payload,
  profile, baseDir, tempPath, licenseFixture, pdfInventory }) {
  const results = [];
  const inventory = () => pdfInventory([baseDir, tempPath]);
  async function rejected(name, request, expected, method = "bbmDb.printHtmlToPdf") {
    const before = inventory();
    const listeners = ipcMain.listenerCount("print:ready");
    const windows = BrowserWindow.getAllWindows().map((window) => window.id).sort();
    const result = await invoke(method, request);
    assert.equal(result.ok, false, `${name}: ${JSON.stringify(result)}`);
    assert.equal(result.filePath, undefined, `${name}: Fehler darf keinen fertigen Dateipfad melden`);
    assert.match(JSON.stringify(result), expected, name);
    assert.deepEqual(inventory(), before, `${name}: PDF-Bestand veraendert`);
    assert.equal(ipcMain.listenerCount("print:ready"), listeners, `${name}: Ready-Listener bleibt zurueck`);
    assert.deepEqual(BrowserWindow.getAllWindows().map((window) => window.id).sort(), windows, `${name}: Druckfenster bleibt zurueck`);
    results.push({ name, ok: false, error: result.error, code: result.code || null, expectedFailureVerified: true,
      pdfFilesUnchanged: true, noWindowOrReadyListenerLeak: true });
  }

  licenseFixture.setModules([]);
  try {
    for (const method of ["bbmDb.printHtmlToPdf", "bbmPrint.printPdfAndPreviewInternal", "bbmDb.printOpenHtmlPreview"]) {
      await rejected(`SiGeKo nicht freigeschaltet: ${method}`, payload, /FEATURE_NOT_ALLOWED/, method);
    }
  } finally { licenseFixture.setModules(["sigeko"]); }
  await rejected("Kein Protokoll-Fallback bei Providerkontext", { ...payload, mode: "protocol" }, /Provider|provider/);
  await rejected("Protokoll ohne Freigabe", { mode: "protocol" }, /FEATURE_NOT_ALLOWED/);
  const invalidData = structuredClone(payload);
  invalidData.providerRequest.data.title = "x".repeat(81);
  await rejected("Ungueltiger Providerinhalt", invalidData, /PDF-Inhalt/);
  const missingProject = structuredClone(payload);
  missingProject.projectId = missingProject.providerRequest.projectId = "missing-s14-project";
  await rejected("Projekt fehlt", missingProject, /Projekt|project/i);
  const blockedPath = path.join(profile.rootPath, "blocked-storage");
  fs.writeFileSync(blockedPath, "Datei statt Ablageverzeichnis");
  const badStorage = structuredClone(payload);
  badStorage.providerRequest.storage.baseDir = blockedPath;
  await rejected("Ablage kann nicht angelegt werden", badStorage, /ENOTDIR|EEXIST/);

  // BrowserWindow is real; closing the new print window is the actual abort.
  let closed = false;
  const onWindow = (_event, window) => {
    window.webContents.once("did-finish-load", () => { closed = true; window.close(); });
  };
  app.once("browser-window-created", onWindow);
  try {
    await rejected("Druckfenster geschlossen", payload, /Print-Window geschlossen/);
    assert.equal(closed, true, "Abbruchereignis nicht ausgefuehrt");
  } finally { app.removeListener("browser-window-created", onWindow); }

  await rejected("Druckauftrag Timeout", { ...payload, timeoutMs: 1 }, /Print-Window Timeout/);

  const revokeAtLoad = (_event, window) => {
    window.webContents.once("did-finish-load", () => licenseFixture.setModules([]));
  };
  app.once("browser-window-created", revokeAtLoad);
  try {
    await rejected("Freigabe waehrend Druck entzogen", payload, /sigeko|freigeschaltet/i);
  } finally {
    app.removeListener("browser-window-created", revokeAtLoad);
    licenseFixture.setModules(["sigeko"]);
  }
  return results;
}

module.exports = { verifyPdfExecutionFailures };
