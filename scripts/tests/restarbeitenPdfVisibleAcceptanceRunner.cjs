"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, ipcMain } = require("electron");
require("../../src/main/ui-editor/bbmPdfAdapter.cjs");
require("../../src/main/ui-editor/restarbeitenPdfAdapter.cjs");
const { createPdfEditorAdapterResolver } = require("../../src/main/ui-editor/pdfAdapterRegistry.cjs");
const { ElectronUiEditorSessionController } = require("../../src/main/ui-editor/electronUiEditorSession.js");

const root = path.resolve(__dirname, "../..");
const resultPath = path.resolve(process.env.BBM_REST_PDF_RESULT_PATH || "rest-pdf-missing-result.json");
const profileRoot = path.resolve(process.env.BBM_REST_PDF_PROFILE_ROOT || path.join(path.dirname(resultPath), "profiles"));
const registrationRoot = path.resolve(process.env.BBM_REST_PDF_REGISTRATION_ROOT || path.dirname(profileRoot));
const action = process.env.BBM_REST_PDF_ACTION || "edit";
const externalAutomationReadyPath = process.env.BBM_REST_PDF_AUTOMATION_READY_PATH ? path.resolve(process.env.BBM_REST_PDF_AUTOMATION_READY_PATH) : null;
const externalAutomationResultPath = process.env.BBM_REST_PDF_AUTOMATION_RESULT_PATH ? path.resolve(process.env.BBM_REST_PDF_AUTOMATION_RESULT_PATH) : null;
const harnessUrl = pathToFileURL(path.join(__dirname, "m86-24VisibleEditorAcceptanceHarness.mjs")).href;

function waitForExternalAutomationResult(filePath, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const poll = () => {
      if (fs.existsSync(filePath)) {
        try { resolve(JSON.parse(fs.readFileSync(filePath, "utf8"))); }
        catch (error) { reject(error); }
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) { reject(new Error(`Externer UI-Automationsbericht fehlt: ${filePath}`)); return; }
      setTimeout(poll, 100);
    };
    poll();
  });
}

function runPowerShell(processId, requestedAction) {
  return new Promise((resolve, reject) => {
    const tracePath = path.join(path.dirname(resultPath), `${action}-automation.trace.log`);
    fs.writeFileSync(tracePath, `${new Date().toISOString()} runner-spawn process=${processId} action=${requestedAction}\n`, "utf8");
    const powershell = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
    const child = spawn(powershell, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(__dirname, "m86-24UiAutomation.ps1"), "-ProcessId", String(processId), "-Action", requestedAction, "-TracePath", tracePath], { cwd: root, windowsHide: false });
    fs.appendFileSync(tracePath, `${new Date().toISOString()} runner-child pid=${child.pid || 0}\n`, "utf8");
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${requestedAction}: UI-Automation hat das Zeitlimit ueberschritten. Trace: ${tracePath}`));
    }, 90000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => { clearTimeout(timer); if (code === 0) resolve(JSON.parse(stdout)); else reject(new Error(stderr || stdout || `UI Automation exit ${code}`)); });
  });
}

function widthOf(state, suffix) {
  return state.elements.find((entry) => entry.elementId.endsWith(suffix))?.width ?? null;
}

function separatorVisibility(state) {
  return state.elements.find((entry) => entry.elementId.endsWith(".vertical-column-separators"))?.visible ?? null;
}

function tableColumnRenderBounds(resolver) {
  const registry = resolver.getPdfRegistry();
  const state = resolver.getCurrentPdfLayoutState();
  const byId = new Map(state.elements.map((entry) => [entry.elementId, entry]));
  const bounds = [];
  for (const table of registry.elements.filter((entry) => entry.kind === "table")) {
    const tableState = byId.get(table.id) || table.baseline;
    let x = Number(tableState.x ?? table.baseline.x);
    for (const column of registry.elements.filter((entry) => entry.kind === "tableColumn" && entry.parentId === table.id).sort((left, right) => left.order - right.order)) {
      const columnState = byId.get(column.id) || column.baseline;
      const width = Number(columnState.width);
      if (width > 0) bounds.push({ elementId: column.id, pageNumber: 1, part: "track",
        box: { x, y: Number(tableState.y ?? table.baseline.y), width, height: Number(tableState.height ?? table.baseline.height) } });
      x += width;
    }
  }
  return bounds;
}

app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.whenReady().then(async () => {
  let window;
  let controller;
  try {
    window = new BrowserWindow({ show: true, width: 1600, height: 1000, webPreferences: { preload: path.join(root, "src", "main", "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: false, backgroundThrottling: false } });
    const previewPath = path.join(registrationRoot, "restarbeiten-visible.pdf");
    const regenerationRequests = [];
    const resolver = createPdfEditorAdapterResolver({
      profileBaseRoot: profileRoot,
      registrationRoot,
      regeneratePdf: async (request) => {
        regenerationRequests.push(structuredClone(request));
        const pdf = await window.webContents.printToPDF({ landscape: true, printBackground: true, pageSize: "A4" });
        fs.mkdirSync(registrationRoot, { recursive: true });
        fs.writeFileSync(previewPath, pdf);
        return { pageCount: 1, controlledOutputPath: previewPath, renderBounds: tableColumnRenderBounds(resolver) };
      },
    });
    if (resolver.inspectPdfDocumentType("restarbeiten").pdfRegistryStatus === "unregistered") resolver.activateAcceptedDocumentType("restarbeiten");
    const context = { documentTypeId: "restarbeiten", mode: "restarbeiten", orientation: "landscape", projectId: "visible-project", restarbeitenRows: [{ id: "r1", short_text: "Sichtbarer PDF-Test" }], restarbeitenLocationLabels: { level_1_label: "Haus", level_2_label: "Geschoss", level_3_label: "Einheit", level_4_label: "Raum" }, showAmpelInList: true };
    resolver.setActiveDocumentContext(context);
    const before = resolver.getCurrentPdfLayoutState();
    const targetApp = { isPackaged: false, getPath: app.getPath.bind(app), getAppPath: () => root, getVersion: app.getVersion.bind(app) };
    controller = new ElectronUiEditorSessionController({ app: targetApp, ipcMain, getMainWindow: () => window, pdfAdapter: resolver, profileRootResolver: () => profileRoot });
    controller.registerIpc();
    await window.loadFile(path.join(__dirname, "m86-24VisibleEditorAcceptance.html"));
    const started = await window.webContents.executeJavaScript(`import(${JSON.stringify(harnessUrl)}).then((module) => { window.__m8624 = module; return module.startVisibleAcceptance("restarbeiten"); })`, true);
    if (!started?.opened?.ok || !controller.child?.pid) throw new Error(started?.opened?.message || "Sichtbarer PDF-Editor wurde nicht gestartet.");
    const automationActions = {
      edit: "PdfEditSave", inspect: "PdfInspect", column5: "PdfColumn5", columnDrag: "PdfColumnDrag",
      column0: "PdfColumn0", column9: "PdfColumn9", columnInspect: "PdfColumnInspect",
      separatorsOn: "PdfSeparatorsOn", separatorsInspectOn: "PdfSeparatorsInspect",
      separatorsOff: "PdfSeparatorsOff", separatorsInspectOff: "PdfSeparatorsInspect",
      separatorsReset: "PdfSeparatorsReset", separatorsInspectReset: "PdfSeparatorsInspect",
    };
    const automationAction = automationActions[action] || "Dump";
    let automation;
    if (externalAutomationReadyPath && externalAutomationResultPath) {
      fs.writeFileSync(externalAutomationReadyPath, JSON.stringify({ processId: controller.child.pid, automationAction }), "utf8");
      automation = await waitForExternalAutomationResult(externalAutomationResultPath);
    } else {
      automation = await runPowerShell(controller.child.pid, automationAction);
    }
    const after = resolver.getCurrentPdfLayoutState();
    const profileFile = resolver.resolvePrintRegistration({ mode: "restarbeiten" }).adapter.getPdfProfilePath();
    const persisted = fs.existsSync(profileFile) ? JSON.parse(fs.readFileSync(profileFile, "utf8")) : null;
    await controller.close();
    fs.writeFileSync(resultPath, JSON.stringify({ ok: true, action, started, automation, regenerationRequests,
      beforeWidths: { number: widthOf(before, ".number"), class: widthOf(before, ".class") },
      afterWidths: { number: widthOf(after, ".number"), class: widthOf(after, ".class") },
      beforeSeparators: separatorVisibility(before), afterSeparators: separatorVisibility(after), profileFile, persisted }, null, 2), "utf8");
  } catch (error) {
    fs.writeFileSync(resultPath, JSON.stringify({ ok: false, action, error: error?.stack || String(error), automationDump: error?.automationDump || null }, null, 2), "utf8");
    process.exitCode = 1;
  } finally {
    try { await controller?.shutdown(); } catch { }
    if (window && !window.isDestroyed()) window.destroy();
    app.quit();
  }
});
