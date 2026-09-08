"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { EventEmitter } = require("node:events");

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Exercise the actual shared print job. Only its OS/window and data boundaries
// are substituted; no copy of the lifecycle or source-text assertions is used.
async function withPrintHarness(test) {
  const modulePath = require.resolve("../../src/main/ipc/printIpc.js");
  const previousModule = require.cache[modulePath];
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-print-lifecycle-"));
  const originalLoad = Module._load;
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;
  const created = deferred();
  const pdf = deferred();
  const loading = deferred();
  const timerToken = {};
  const ipcMain = new EventEmitter();
  const handlers = new Map();
  ipcMain.handle = (name, handler) => handlers.set(name, handler);
  const h = { root, ipcMain, handlers, pdf, loading, created, calls: [], sends: [], writes: 0,
    providerGuards: 0, allowed: true, dataCalls: 0, providerCalls: 0, timerActive: false };
  const webContents = new EventEmitter();
  webContents.send = (...args) => h.sends.push(args);
  webContents.printToPDF = (options) => { h.calls.push(options); return pdf.promise; };
  const win = new EventEmitter();
  win.webContents = webContents;
  win.close = () => { if (!h.closed) { h.closed = true; win.emit("closed"); } };
  win.loadURL = () => loading.promise;
  h.win = win;
  const bridge = {
    resolve(payload) {
      h.providerGuards++;
      if (!h.allowed) throw new Error("LICENSE_MODULE_DISABLED");
      return { request: payload.providerRequest };
    },
    async provide() { h.providerCalls++; return { providerDocument: { title: "Technical" } }; },
    outputDirectory: () => root,
  };
  const fsBoundary = Object.create(fs);
  fsBoundary.writeFileSync = (...args) => {
    h.writes++;
    if (h.writeError) throw h.writeError;
    return fs.writeFileSync(...args);
  };
  const stubs = {
    electron: { ipcMain, app: { getPath: () => root }, shell: {}, BrowserWindow: function () {} },
    fs: fsBoundary,
    "../print/printWindow": { createPrintWindow: () => { created.resolve(); return win; }, getPrintAppUrl: () => "file:///print-fixture.html" },
    "../print/printData": { getPrintData: async () => { h.dataCalls++; return {}; } },
    "../licensing/featureGuard": { enforceLicensedFeature: () => {}, toLicenseErrorPayload: (error) => ({ ok: false, error: error.message }) },
    "./projectStoragePaths": { sanitizeDirName: (s) => s, resolveProjectFolderName: () => "fixture" },
    "../buildIdentity": { resolveBuildIdentity: () => ({ channel: "test" }) },
    "../ui-editor/pdfAdapterRegistry.cjs": {},
    "../print/pdfProviderBridge": { isProviderRequest: (p) => p.mode === "provider", createPdfProviderBridge: () => bridge },
    "../modulePdfProviders": { createProductivePdfProviderRegistry: () => ({}) },
  };
  for (const name of ["bbmPdfAdapter", "restarbeitenPdfAdapter", "invoicePdfAdapter", "technicalPdfAdapter"]) {
    stubs[`../ui-editor/${name}.cjs`] = {};
  }
  Module._load = function (request, parent, isMain) {
    if (parent?.filename === modulePath && Object.hasOwn(stubs, request)) return stubs[request];
    return originalLoad.call(this, request, parent, isMain);
  };
  global.setTimeout = (callback, delay, ...args) => {
    if (delay !== 314159) return originalSetTimeout(callback, delay, ...args);
    h.timerActive = true;
    h.expire = () => { assert.equal(h.timerActive, true); h.timerActive = false; callback(...args); };
    return timerToken;
  };
  global.clearTimeout = (token) => {
    if (token === timerToken) h.timerActive = false;
    else originalClearTimeout(token);
  };
  try {
    delete require.cache[modulePath];
    h.service = require(modulePath);
    // Dependency substitution is restricted to this synchronous module load.
    Module._load = originalLoad;
    h.payload = (provider = false) => ({ mode: provider ? "provider" : "protocol", targetDir: "temp", fileName: "result.pdf", timeoutMs: 314159,
      ...(provider ? { documentTypeId: "technical-neutral", providerRequest: { moduleId: "sigeko", providerId: "technical-neutral", projectId: "p", documentId: "d" } } : {}) });
    h.start = async ({ provider = false, metadata = false, ipc = false } = {}) => {
      const payload = h.payload(provider);
      let result;
      if (ipc) {
        h.service.registerPrintIpc();
        result = handlers.get("print:htmlToPdf")({}, payload);
      } else result = metadata ? h.service.generatePdfForUiEditor(payload) : h.service.printToPdf(payload);
      // Attach rejection handling before the test triggers any failure event.
      h.outcome = result.then((value) => ({ value }), (error) => ({ error }));
      await created.promise;
    };
    h.load = () => { webContents.emit("did-finish-load"); return h.sends.at(-1)?.[1]; };
    h.ready = (msg = {}, sender = webContents) => ipcMain.emit("print:ready", { sender }, msg);
    h.assertClean = () => {
      assert.equal(ipcMain.listenerCount("print:ready"), 0);
      assert.equal(win.listenerCount("closed"), 0);
      // The debug pipes retain one informational listener for each event.
      assert.equal(webContents.listenerCount("render-process-gone"), 1);
      assert.equal(webContents.listenerCount("did-finish-load"), 1);
      assert.equal(h.timerActive, false);
      assert.equal(h.closed, true);
    };
    h.assertNoOutput = () => { assert.deepEqual(fs.readdirSync(root), []); };
    await test(h);
  } finally {
    Module._load = originalLoad;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    delete require.cache[modulePath];
    if (previousModule) require.cache[modulePath] = previousModule;
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runPrintJobLifecycleTests(run) {
  await run("S1.4: shared tabular print ignores foreign and duplicate ready events", () => withPrintHarness(async (h) => {
    await h.start();
    const init = h.load();
    h.ready({ jobId: "foreign-job" });
    h.ready({ jobId: init.jobId }, new EventEmitter());
    assert.equal(h.calls.length, 0);
    h.ready({ jobId: init.jobId }); h.ready({ jobId: init.jobId });
    assert.equal(h.calls.length, 1);
    h.pdf.resolve(Buffer.from("PDF fixture"));
    const { value, error } = await h.outcome;
    assert.ifError(error);
    assert.equal(fs.readFileSync(value, "utf8"), "PDF fixture");
    assert.equal(h.writes, 1); assert.equal(h.dataCalls, 1); assert.equal(h.providerCalls, 0);
    assert.equal(h.calls[0].pageSize, "A4"); assert.equal(h.calls[0].landscape, false);
    h.assertClean();
  }));
  await run("S1.4: provider preview keeps metadata and rechecks permission before saving", () => withPrintHarness(async (h) => {
    await h.start({ provider: true, metadata: true });
    const init = h.load();
    assert.equal(init.providerRequest.moduleId, "sigeko"); assert.equal(init.pdfEditorPreview, true);
    const bounds = [{ elementId: "title", xMm: 12 }];
    h.ready({ jobId: init.jobId, previewMetadata: { pageCount: 1, renderBounds: bounds } });
    const guardsBeforeCompletion = h.providerGuards;
    h.pdf.resolve(Buffer.from("provider PDF"));
    const { value, error } = await h.outcome;
    assert.ifError(error); assert.equal(value.pageCount, 1); assert.deepEqual(value.renderBounds, bounds);
    assert.equal(value.filePath, value.controlledOutputPath); assert.ok(Date.parse(value.generatedAt));
    assert.equal(h.providerGuards, guardsBeforeCompletion + 1);
    assert.equal(h.dataCalls, 0); assert.equal(h.providerCalls, 1); assert.equal(h.writes, 1);
    h.assertClean();
  }));
  await run("S1.4: permission withdrawn during provider printing prevents output", () => withPrintHarness(async (h) => {
    await h.start({ provider: true }); h.ready(); h.allowed = false;
    h.pdf.resolve(Buffer.from("late PDF"));
    assert.match((await h.outcome).error.message, /LICENSE_MODULE_DISABLED/);
    assert.equal(h.writes, 0); h.assertNoOutput(); h.assertClean();
  }));
  await run("S1.4: timeout during printing cannot write a late PDF", () => withPrintHarness(async (h) => {
    await h.start(); h.ready(); h.expire();
    assert.match((await h.outcome).error.message, /Timeout/);
    h.pdf.resolve(Buffer.from("late PDF")); await Promise.resolve();
    assert.equal(h.writes, 0); h.assertNoOutput(); h.assertClean();
  }));
  for (const duringPrint of [false, true]) {
    await run(`S1.4: closing print window ${duringPrint ? "during printing" : "before readiness"} remains unsuccessful`, () => withPrintHarness(async (h) => {
      await h.start({ ipc: true }); if (duringPrint) h.ready(); h.win.close();
      const { value, error } = await h.outcome;
      assert.ifError(error); assert.equal(value.ok, false); assert.match(value.error, /Print-Window geschlossen/);
      h.pdf.resolve(Buffer.from("late PDF")); await Promise.resolve();
      h.win.webContents.emit("did-finish-load"); h.ready();
      assert.equal(h.sends.length, 0); assert.equal(h.calls.length, duringPrint ? 1 : 0);
      assert.equal(h.writes, 0); h.assertNoOutput(); h.assertClean();
    }));
  }
  await run("S1.4: renderer process loss rejects immediately and discards late PDF", () => withPrintHarness(async (h) => {
    await h.start(); h.ready();
    h.win.webContents.emit("render-process-gone", {}, { reason: "crashed" });
    assert.match((await h.outcome).error.message, /Print-Renderer beendet: crashed/);
    h.pdf.resolve(Buffer.from("late PDF")); await Promise.resolve();
    assert.equal(h.writes, 0); h.assertNoOutput(); h.assertClean();
  }));
  await run("S1.4: renderer rejection never starts printing", () => withPrintHarness(async (h) => {
    await h.start(); h.ready({ ok: false, error: "layout overflow" });
    assert.match((await h.outcome).error.message, /layout overflow/);
    assert.equal(h.calls.length, 0); h.assertNoOutput(); h.assertClean();
  }));
  await run("S1.4: Chromium print rejection remains a failed IPC result", () => withPrintHarness(async (h) => {
    await h.start({ ipc: true }); h.ready(); h.pdf.reject(new Error("Chromium refused PDF"));
    const { value } = await h.outcome;
    assert.equal(value.ok, false); assert.match(value.error, /Chromium refused PDF/);
    assert.equal(h.writes, 0); h.assertNoOutput(); h.assertClean();
  }));
  await run("S1.4: output write failure remains a failed IPC result", () => withPrintHarness(async (h) => {
    await h.start({ ipc: true }); h.writeError = Object.assign(new Error("disk write denied"), { code: "EACCES" });
    h.ready(); h.pdf.resolve(Buffer.from("PDF"));
    const { value } = await h.outcome;
    assert.equal(value.ok, false); assert.match(value.error, /disk write denied/);
    assert.equal(h.writes, 1); h.assertNoOutput(); h.assertClean();
  }));
  await run("S1.4: failed print page load removes late initialization listener", () => withPrintHarness(async (h) => {
    await h.start(); h.loading.reject(new Error("load failed"));
    assert.match((await h.outcome).error.message, /load failed/);
    h.win.webContents.emit("did-finish-load"); h.ready();
    assert.equal(h.sends.length, 0); assert.equal(h.calls.length, 0); h.assertNoOutput(); h.assertClean();
  }));
}

module.exports = { runPrintJobLifecycleTests };
