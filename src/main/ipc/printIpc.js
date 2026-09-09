// src/main/ipc/printIpc.js
//
// TECH-CONTRACT (verbindlich): docs/UI-TECH-CONTRACT.md
// CONTRACT-VERSION: 1.0.1
//
// ============================================================
// INVARIANT (DO NOT BREAK) – ONE PRINT PATH RULE
// ------------------------------------------------------------
// Renderer -> bbmDb.printHtmlToPdf -> IPC "print:htmlToPdf" -> printIpc.js
// ------------------------------------------------------------
// Der alte Name bleibt, die Implementierung nutzt jetzt die neue Print-Engine.
// ============================================================

const { ipcMain, app, shell, BrowserWindow } = require("electron");
const fs = require("fs");
const { createHash } = require("node:crypto");
const { isDeepStrictEqual } = require("node:util");
const path = require("path");
const { pathToFileURL } = require("url");
const { createPrintWindow, getPrintAppUrl } = require("../print/printWindow");
const { getPrintData } = require("../print/printData");
const {
  createPrintToPdfOptions,
  normalizePrintOrientation,
  resolvePrintRequestedOrientation,
} = require("../print/printOrientation");
const {
  enforceLicensedFeature,
  toLicenseErrorPayload,
} = require("../licensing/featureGuard");
const {
  sanitizeDirName,
  resolveProjectFolderName,
} = require("./projectStoragePaths");
const { resolveBuildIdentity } = require("../buildIdentity");
require("../ui-editor/bbmPdfAdapter.cjs");
require("../ui-editor/restarbeitenPdfAdapter.cjs");
require("../ui-editor/invoicePdfAdapter.cjs");
const { createPdfEditorAdapterResolver } = require("../ui-editor/pdfAdapterRegistry.cjs");

const { isProviderRequest, createPdfProviderBridge } = require("../print/pdfProviderBridge");
require("../ui-editor/technicalPdfAdapter.cjs");
const { createProductivePdfProviderRegistry } = require("../modulePdfProviders");
let _providerBridge;
function providerBridge() { return _providerBridge || (_providerBridge = createPdfProviderBridge({ registry: createProductivePdfProviderRegistry() })); }

const { isSharedFirmsPrintRequest, createSharedFirmsPrintAccess } = require("../print/sharedFirmsPrintAccess");
let _sharedFirmsPrintAccess;
function sharedFirmsPrintAccess() { return _sharedFirmsPrintAccess || (_sharedFirmsPrintAccess = createSharedFirmsPrintAccess()); }
function recheckSharedFirmsPrint(payload, initial) {
  const current = sharedFirmsPrintAccess().resolve(payload);
  if (current.moduleId !== initial.moduleId || current.projectId !== initial.projectId || current.directory !== initial.directory) {
    throw Object.assign(new Error("Projektablage hat sich während der PDF-Erzeugung geändert. Bitte erneut erzeugen."), { code: "PDF_PROJECT_STORAGE_CHANGED" });
  }
  return current;
}

// Only Main callers can supply prepared data or a write guard. Renderer requests
// carry a job marker, never the trusted data or callbacks themselves.
const preparedPrintJobs = new Map();
const preparedPrintSenders = new WeakMap();
function printJobError(message) { return Object.assign(new Error(message), { code: "PDF_PREPARED_JOB_INVALID" }); }
function mainPrintOptions(options) {
  if (options === undefined) return {};
  if (!options || typeof options !== "object" || Array.isArray(options) ||
      Reflect.ownKeys(options).some(key => !["preparedData", "beforeWrite", "exclusiveWrite", "includeMetadata"].includes(key)) ||
      Object.hasOwn(options, "beforeWrite") && typeof options.beforeWrite !== "function" ||
      ["exclusiveWrite", "includeMetadata"].some(key => Object.hasOwn(options, key) && typeof options[key] !== "boolean")) {
    throw printJobError("Ungültige Main-Druckoptionen.");
  }
  const result = { ...options };
  if (Object.hasOwn(result, "preparedData")) {
    if (!result.preparedData || typeof result.preparedData !== "object" || Array.isArray(result.preparedData)) throw printJobError("Vorbereitete Druckdaten fehlen.");
    result.preparedData = structuredClone(result.preparedData);
  }
  return result;
}
function preparedPrintJob(event, payload) {
  const senderJob = event?.sender && preparedPrintSenders.get(event.sender);
  const job = preparedPrintJobs.get(payload?.jobId);
  if (!senderJob && !job && payload?.preparedDataJob !== true) return null;
  if (!job || job !== senderJob || job.sender !== event?.sender || payload?.preparedDataJob !== true || payload.jobId !== job.jobId ||
      ["mode", "projectId", "documentTypeId", "documentId", "moduleId"].some(key => (payload[key] ?? null) !== (job.identity[key] ?? null)) ||
      !isDeepStrictEqual(payload.providerRequest ?? null, job.identity.providerRequest ?? null)) {
    throw printJobError("Vorbereiteter Druckauftrag ist beendet oder gehört zu einem anderen Fenster/Dokument.");
  }
  return job;
}

let _pdfEditorAdapterResolver = null;

function _getPdfEditorAdapterResolver() {
  if (!_pdfEditorAdapterResolver) {
    const uiEditorRoot = path.join(app.getPath("userData"), "ui-editor");
    _pdfEditorAdapterResolver = createPdfEditorAdapterResolver({
      profileBaseRoot: path.join(uiEditorRoot, "profiles"),
      registrationRoot: uiEditorRoot,
      regeneratePdf: (request) => generatePdfForUiEditor(request),
    });
  }
  return _pdfEditorAdapterResolver;
}

let _printModesModulePromise = null;

async function _loadPrintModesModule() {
  if (!_printModesModulePromise) {
    _printModesModulePromise = import("../../shared/print/printModes.mjs");
  }
  return await _printModesModulePromise;
}

function _randId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sanitizeFileName(name) {
  const s = String(name || "").trim() || "BBM.pdf";
  const safe = s
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`;
}

function uniquePath(dir, fileName) {
  const base = sanitizeFileName(fileName);
  const full = path.join(dir, base);
  if (!fs.existsSync(full)) return full;

  const ext = path.extname(base) || ".pdf";
  const stem = base.slice(0, base.length - ext.length);

  for (let i = 2; i < 9999; i++) {
    const p = path.join(dir, `${stem} (${i})${ext}`);
    if (!fs.existsSync(p)) return p;
  }
  return path.join(dir, `${stem} (${Date.now()})${ext}`);
}

function buildPrintToPdfOptions({ orientation } = {}) {
  return createPrintToPdfOptions({ orientation });
}

function _resolveRequestedOrientation(payload = {}) {
  const requested = resolvePrintRequestedOrientation({
    orientation: payload.orientation,
    testOrientation: payload.testOrientation,
    smokeOrientation: process.env.BBM_PRINT_SMOKE_ORIENTATION,
  });
  return String(payload.mode || "").trim().toLowerCase() === "restarbeiten"
    ? "landscape"
    : requested;
}

function _readLayoutCalibrationEnabled() {
  return false;
}

function _normalizeLayoutCalibrationEnabled(value, fallback = false) {
  if (value == null) return !!fallback;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return !!fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return !!fallback;
}

// Shared technical output infrastructure:
// directory selection and file path creation stay centralized in this print service.
function _folderForMode(mode) {
  const m = String(mode || "").trim().toLowerCase();
  if (m === "protocol") return "Protokolle";
  if (m === "preview" || m === "vorabzug") return "Vorabzug";
  if (m === "todo" || m === "topsall" || m === "firms") return "Listen";
  if (m === "restarbeiten") return "Restarbeiten";
  return "PDF";
}

async function _buildOutputPath({
  fileName,
  targetDir,
  baseDir,
  projectNumber,
  project,
  mode,
  overwrite,
} = {}) {
  const modeKey = String(mode || "").trim().toLowerCase();
  const effectiveTargetDir = modeKey === "headertest" ? "temp" : targetDir;
  const downloads = app.getPath("downloads");
  const tempDir = app.getPath("temp");
  let outBaseDir = effectiveTargetDir === "temp" ? tempDir : downloads;

  if (effectiveTargetDir && effectiveTargetDir !== "temp") outBaseDir = effectiveTargetDir;
  else if (baseDir) outBaseDir = baseDir;

  let outDir = outBaseDir;
  if (effectiveTargetDir !== "temp") {
    const projectFolder = resolveProjectFolderName({
      ...(project || {}),
      project_number:
        projectNumber ||
        project?.project_number ||
        project?.projectNumber ||
        project?.number ||
        "",
    });
    const modeFolder = sanitizeDirName(_folderForMode(modeKey));
    outDir = path.join(outBaseDir, "bbm", projectFolder, modeFolder);
  }

  const normalizedOutDir = path.resolve(String(outDir || "").trim() || outBaseDir);
  if (!fs.existsSync(normalizedOutDir)) {
    fs.mkdirSync(normalizedOutDir, { recursive: true });
  }

  return overwrite
    ? path.join(outDir, sanitizeFileName(fileName || "BBM.pdf"))
    : uniquePath(outDir, fileName || "BBM.pdf");
}

// Transitional infrastructure for already generated PDFs.
function findStoredProtocolPdf({
  baseDir,
  project,
  expectedFileNames,
  meetingIndex,
} = {}) {
  const normalizedBaseDir = String(baseDir || "").trim();
  if (!normalizedBaseDir) {
    return { ok: false, error: "Basisordner fehlt" };
  }

  const projectFolder = resolveProjectFolderName(project || {});
  const protocolsDir = path.join(normalizedBaseDir, "bbm", projectFolder, "Protokolle");

  if (!fs.existsSync(protocolsDir)) {
    return {
      ok: false,
      error: "Protokollordner nicht gefunden",
      dir: protocolsDir,
      projectFolder,
    };
  }

  const pdfFiles = fs
    .readdirSync(protocolsDir, { withFileTypes: true })
    .filter((entry) => entry && typeof entry.isFile === "function" && entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => String(name || "").toLowerCase().endsWith(".pdf"));

  const normalizedExpected = Array.isArray(expectedFileNames)
    ? expectedFileNames.map((name) => sanitizeFileName(name)).filter(Boolean)
    : [];

  for (const expectedName of normalizedExpected) {
    const candidate = path.join(protocolsDir, expectedName);
    if (fs.existsSync(candidate)) {
      return {
        ok: true,
        filePath: candidate,
        dir: protocolsDir,
        projectFolder,
        matchedBy: "exact",
      };
    }
  }

  const marker = String(meetingIndex == null ? "" : `#${meetingIndex}`).trim().toLowerCase();
  if (marker) {
    const fallbackName = pdfFiles.find((name) => String(name).toLowerCase().includes(marker));
    if (fallbackName) {
      return {
        ok: true,
        filePath: path.join(protocolsDir, fallbackName),
        dir: protocolsDir,
        projectFolder,
        matchedBy: "meetingIndex",
      };
    }
  }

  return {
    ok: false,
    error: "Keine passende PDF gefunden",
    dir: protocolsDir,
    projectFolder,
    expectedFileNames: normalizedExpected,
  };
}

function listStoredFirmsPdfs({ baseDir, project } = {}) {
  const normalizedBaseDir = String(baseDir || "").trim();
  if (!normalizedBaseDir) {
    return { ok: false, error: "Basisordner fehlt" };
  }

  const projectFolder = resolveProjectFolderName(project || {});
  const listsDir = path.join(normalizedBaseDir, "bbm", projectFolder, "Listen");

  if (!fs.existsSync(listsDir)) {
    return { ok: true, dir: listsDir, projectFolder, files: [] };
  }

  const files = fs
    .readdirSync(listsDir, { withFileTypes: true })
    .filter((entry) => entry && typeof entry.isFile === "function" && entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => {
      const normalized = String(name || "").toLowerCase();
      return normalized.endsWith(".pdf") && normalized.includes("firmenliste");
    })
    .map((name) => {
      const filePath = path.join(listsDir, name);
      let mtimeMs = 0;
      try {
        mtimeMs = Number(fs.statSync(filePath)?.mtimeMs || 0);
      } catch (_err) {
        mtimeMs = 0;
      }
      return { fileName: name, filePath, mtimeMs };
    })
    .sort((a, b) => Number(b?.mtimeMs || 0) - Number(a?.mtimeMs || 0));

  return { ok: true, dir: listsDir, projectFolder, files };
}

function listStoredProjectPdfs({ baseDir, project, kind } = {}) {
  const normalizedBaseDir = String(baseDir || "").trim();
  const kindKey = String(kind || "").trim().toLowerCase();
  if (!normalizedBaseDir) {
    return { ok: false, error: "Basisordner fehlt" };
  }

  const projectFolder = resolveProjectFolderName(project || {});
  const targetDir = kindKey === "protocol"
    ? path.join(normalizedBaseDir, "bbm", projectFolder, "Protokolle")
    : path.join(normalizedBaseDir, "bbm", projectFolder, "Listen");

  if (!fs.existsSync(targetDir)) {
    return { ok: true, dir: targetDir, projectFolder, files: [] };
  }

  const matcher = (name) => {
    const normalized = String(name || "").toLowerCase();
    if (!normalized.endsWith(".pdf")) return false;
    if (kindKey === "protocol") return true;
    if (kindKey === "firms") return normalized.includes("firmenliste");
    if (kindKey === "todo") return normalized.includes("todo-liste");
    if (kindKey === "topsall") return normalized.includes("top-liste") || normalized.includes("topliste-alle");
    return false;
  };

  const files = fs
    .readdirSync(targetDir, { withFileTypes: true })
    .filter((entry) => entry && typeof entry.isFile === "function" && entry.isFile())
    .map((entry) => entry.name)
    .filter(matcher)
    .map((name) => {
      const filePath = path.join(targetDir, name);
      let mtimeMs = 0;
      try {
        mtimeMs = Number(fs.statSync(filePath)?.mtimeMs || 0);
      } catch (_err) {
        mtimeMs = 0;
      }
      return { fileName: name, filePath, mtimeMs };
    })
    .sort((a, b) => Number(b?.mtimeMs || 0) - Number(a?.mtimeMs || 0));

  return { ok: true, dir: targetDir, projectFolder, files };
}



function openInternalPdfPreview({ filePath, title } = {}) {
  const rawFilePath = String(filePath || "").trim();
  if (!rawFilePath) {
    throw new Error("PDF-Dateipfad fehlt");
  }
  const normalizedPath = path.resolve(rawFilePath);
  if (!fs.existsSync(normalizedPath)) {
    throw new Error("PDF-Datei nicht gefunden");
  }

  const win = new BrowserWindow({
    width: 1100,
    height: 900,
    show: false,
    backgroundColor: "#ffffff",
    title: normalizeTextPreviewTitle(title),
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  try {
    win.setMenuBarVisibility(false);
  } catch (_e) {}

  const pdfUrl = pathToFileURL(normalizedPath).toString();
  return win.loadURL(pdfUrl).then(() => {
    try { win.show(); win.focus(); } catch (_e) {}
    return { ok: true, filePath: normalizedPath };
  });
}

function normalizeTextPreviewTitle(value) {
  const text = String(value || "").trim();
  return text || "PDF Vorschau";
}

async function _runIpcTask(task) {
  try {
    return await task();
  } catch (err) {
    if (err?.licenseError || String(err?.message || "").startsWith("LICENSE_")) {
      return toLicenseErrorPayload(err);
    }
    return { ok: false, error: err?.message || String(err) };
  }
}

function _enforceFeature(feature) {
  enforceLicensedFeature(feature);
}

function _featureForPrintMode(mode) {
  const m = String(mode || "").trim().toLowerCase();
  if (m === "restarbeiten") return "restarbeiten";
  if (m === "invoice") return "rechnung";
  return "protokoll";
}

function _featureForStoredProjectKind(kind) {
  const k = String(kind || "").trim().toLowerCase();
  if (k === "protocol") return "protokoll";
  return "protokoll";
}

function attachPrintDebugPipes(win, jobId) {
  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const lvl = ["LOG", "WARN", "ERROR", "DEBUG"][level] || String(level);
    console.log(`[print:${jobId}] [${lvl}] ${message} (${sourceId}:${line})`);
  });

  win.webContents.on("did-finish-load", () => console.log(`[print:${jobId}] did-finish-load`));
  win.webContents.on("did-fail-load", (_e, code, desc, validatedURL) =>
    console.log(`[print:${jobId}] did-fail-load code=${code} desc=${desc} url=${validatedURL}`)
  );
  win.webContents.on("render-process-gone", (_e, details) =>
    console.log(`[print:${jobId}] render-process-gone reason=${details?.reason} exitCode=${details?.exitCode}`)
  );
  win.webContents.on("crashed", () => console.log(`[print:${jobId}] webContents crashed`));
}

async function _printToPdf(payload = {}, includeMetadata = false, options) {
  const mainOptions = mainPrintOptions(options);
  const hasPreparedData = Object.hasOwn(mainOptions, "preparedData");
  // Keep an explicit module request stable across asynchronous data/print steps.
  if (isSharedFirmsPrintRequest(payload) || hasPreparedData || options !== undefined) payload = structuredClone(payload);
  const sharedFirmsContext = isSharedFirmsPrintRequest(payload) ? sharedFirmsPrintAccess().resolve(payload) : null;
  const jobId = _randId();
  const { resolvePrintMode } = await _loadPrintModesModule();
  const mode = resolvePrintMode(payload.mode, { fallback: "protocol" });
  if (!mode) {
    throw new Error(`Unbekannter Druckmodus: ${String(payload.mode || "").trim() || "-"}`);
  }
  const providerContext = isProviderRequest(payload) ? providerBridge().resolve(payload).request : null;
  const projectId = sharedFirmsContext?.projectId || providerContext?.projectId || payload.projectId || null;
  const meetingId = payload.meetingId || null;
  const invoiceId = payload.invoiceId || null;
  const invoicePreview = payload.invoicePreview === true;
  const orientation = isProviderRequest(payload) ? "portrait" : _resolveRequestedOrientation(payload);

  if (hasPreparedData) {
    const prepared = mainOptions.preparedData;
    if (prepared.mode !== mode || prepared.orientation !== orientation ||
        (prepared.project?.id ?? prepared.projectId) !== projectId ||
        prepared.projectId != null && prepared.projectId !== projectId ||
        isProviderRequest(payload) && (prepared.documentId !== providerContext.documentId || prepared.documentTypeId !== payload.documentTypeId)) {
      throw printJobError("Vorbereitete Druckdaten passen nicht zu Modus, Projekt, Dokument oder Ausrichtung.");
    }
  }

  console.log(
    `[print:${jobId}] start mode=${mode} projectId=${projectId} meetingId=${meetingId} invoiceId=${invoiceId} orientation=${orientation}`
  );

  if (sharedFirmsContext) recheckSharedFirmsPrint(payload, sharedFirmsContext);
  const data = hasPreparedData ? mainOptions.preparedData : isProviderRequest(payload) ? await providerBridge().provide(payload) : await getPrintData({
    mode,
    projectId,
    meetingId,
    invoiceId,
    invoicePreview,
    settingsOverride: payload.settingsOverride || null,
    orientation,
    todoResponsibleFilter: payload.todoResponsibleFilter || null,
    restarbeitenRows: payload.restarbeitenRows || null,
    restarbeitenLocationLabels: payload.restarbeitenLocationLabels || null,
    showAmpelInList: typeof payload.showAmpelInList === "boolean" ? payload.showAmpelInList : null,
  });
  if (sharedFirmsContext) recheckSharedFirmsPrint(payload, sharedFirmsContext);
  const projectNumber = data?.project?.project_number || data?.project?.projectNumber || null;

  let sharedFirmsOutputPath;
  if (sharedFirmsContext) {
    const dir = payload.targetDir === "temp" ? app.getPath("temp") : sharedFirmsContext.directory;
    fs.mkdirSync(dir, { recursive: true });
    sharedFirmsOutputPath = uniquePath(dir, payload.fileName || "Firmenliste.pdf");
  }
  let providerOutputPath;
  if (isProviderRequest(payload)) {
    const dir = payload.targetDir === "temp" ? app.getPath("temp") : providerBridge().outputDirectory(payload);
    fs.mkdirSync(dir, { recursive: true });
    providerOutputPath = uniquePath(dir, payload.fileName || "Technisches-Dokument.pdf");
  }
  const outPath = sharedFirmsOutputPath || providerOutputPath || await _buildOutputPath({
    fileName: payload.fileName || null,
    targetDir: payload.targetDir,
    baseDir: payload.baseDir,
    projectNumber,
    project: data?.project || null,
    mode,
    overwrite: payload.overwrite,
  });

  const silent = !!payload.silent;
  // DevTools must open only when explicitly requested.
  const debug = !silent && !!payload.debug;

  const win = createPrintWindow({ show: debug, devTools: debug });
  if (hasPreparedData) {
    const identity = { mode, projectId, documentTypeId: payload.documentTypeId || null,
      documentId: providerContext?.documentId || null, moduleId: sharedFirmsContext?.moduleId || null,
      providerRequest: isProviderRequest(payload) ? structuredClone(payload.providerRequest) : null };
    const entry = { jobId, sender: win.webContents, identity, payload, data: mainOptions.preparedData };
    preparedPrintJobs.set(jobId, entry); preparedPrintSenders.set(win.webContents, entry);
  }
  attachPrintDebugPipes(win, jobId);

  if (debug) {
    try {
      win.show();
      win.focus();
    } catch (_e) {}
  }

  const url = getPrintAppUrl();
  console.log(`[print:${jobId}] loadURL ${url}`);

  return new Promise((resolve, reject) => {
    let done = false;
    let printing = false;
    const timeoutMsRaw = Number(payload?.timeoutMs);
    const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 120000;

    const cleanup = () => {
      preparedPrintJobs.delete(jobId);
      preparedPrintSenders.delete(win.webContents);
      try {
        ipcMain.removeListener("print:ready", onReady);
        win.removeListener("closed", onClosed);
        win.webContents.removeListener("render-process-gone", onRendererGone);
        win.webContents.removeListener("did-finish-load", onDidFinishLoad);
      } catch (_e) {}
      try {
        clearTimeout(timeout);
      } catch (_e) {}
      try {
        win.close();
      } catch (_e) {}
    };

    const fail = (error) => {
      if (done) return;
      done = true;
      cleanup();
      reject(error);
    };
    const onClosed = () => fail(new Error("Print-Window geschlossen"));
    const onRendererGone = (_event, details) => fail(new Error(`Print-Renderer beendet: ${details?.reason || "unknown"}`));

    const timeout = setTimeout(() => {
      console.log(`[print:${jobId}] TIMEOUT after ${timeoutMs}ms`);
      fail(new Error("Print-Window Timeout"));
    }, timeoutMs);

    const onReady = async (evt, msg) => {
      if (done || printing) return;
      if (evt.sender !== win.webContents) return;
      if (hasPreparedData && msg?.jobId !== jobId) return;
      if (msg?.jobId && msg.jobId !== jobId) return;
      printing = true;

      console.log(`[print:${jobId}] print:ready received`);

      try {
        const pdfOptions = buildPrintToPdfOptions({ orientation });
        console.log(
          `[PRINT_ACTIVE] printToPDF options: ${JSON.stringify(
            {
              orientation,
              landscape: pdfOptions.landscape,
              pageSize: pdfOptions.pageSize,
              displayHeaderFooter: pdfOptions.displayHeaderFooter,
              margin: pdfOptions.margin,
            },
            null,
            0
          )}`
        );
        if (msg?.ok === false) {
          throw new Error(String(msg?.error || "Print-Renderer hat die PDF-Erzeugung abgewiesen."));
        }
        if (sharedFirmsContext) recheckSharedFirmsPrint(payload, sharedFirmsContext);
        if (isProviderRequest(payload)) providerBridge().resolve(payload);
        const pdfBuffer = await win.webContents.printToPDF(pdfOptions);
        // Ein Timeout oder Fensterabbruch bleibt auch bei spaeter PDF-Antwort erfolglos.
        if (done) return;
        if (sharedFirmsContext) recheckSharedFirmsPrint(payload, sharedFirmsContext);
        if (isProviderRequest(payload)) providerBridge().resolve(payload);
        const bufferMetadata = options !== undefined && includeMetadata || mainOptions.beforeWrite ? {
          sha256: createHash("sha256").update(pdfBuffer).digest("hex"), byteSize: pdfBuffer.length,
        } : null;
        if (mainOptions.beforeWrite) {
          const result = mainOptions.beforeWrite(Object.freeze({ filePath: outPath, ...bufferMetadata }));
          if (result && (typeof result === "object" || typeof result === "function") && typeof result.then === "function") {
            Promise.resolve(result).catch(() => {});
            throw printJobError("Druck-Schreibprüfung muss synchron erfolgen.");
          }
        }
        if (done) return;
        if (sharedFirmsContext || mainOptions.exclusiveWrite) fs.writeFileSync(outPath, pdfBuffer, { flag: "wx" });
        else fs.writeFileSync(outPath, pdfBuffer);
        console.log(`[print:${jobId}] PDF written -> ${outPath}`);
        done = true;
        cleanup();
        resolve(includeMetadata ? {
          filePath: outPath,
          controlledOutputPath: outPath,
          pageCount: Number(msg?.previewMetadata?.pageCount || 0),
          generatedAt: new Date().toISOString(),
          renderBounds: Array.isArray(msg?.previewMetadata?.renderBounds) ? msg.previewMetadata.renderBounds : [],
          ...(options !== undefined ? bufferMetadata : {}),
        } : outPath);
      } catch (err) {
        console.log(`[print:${jobId}] printToPDF ERROR: ${err?.message || err}`);
        fail(err);
      }
    };

    ipcMain.on("print:ready", onReady);
    win.once("closed", onClosed);
    win.webContents.once("render-process-gone", onRendererGone);

    const onDidFinishLoad = () => {
      if (done) return;
      console.log(`[print:${jobId}] sending print:init (debug=${debug})`);
      win.webContents.send("print:init", {
        jobId,
        ...(hasPreparedData ? { preparedDataJob: true } : {}),
        ...(isProviderRequest(payload) ? { providerRequest: structuredClone(payload.providerRequest), documentId: providerContext.documentId } : {}),
        ...(sharedFirmsContext ? { moduleId: sharedFirmsContext.moduleId, storage: structuredClone(sharedFirmsContext.storage) } : {}),
        mode,
        documentTypeId: payload.documentTypeId || null,
        projectId,
        meetingId,
        invoiceId,
        invoicePreview,
        restarbeitenRows: payload.restarbeitenRows || null,
        restarbeitenLocationLabels: payload.restarbeitenLocationLabels || null,
        settingsOverride: payload.settingsOverride || null,
        orientation,
        testOrientation: payload.testOrientation || null,
        debug,
        layoutCalibrationEnabled: _readLayoutCalibrationEnabled(),
        pdfEditorPreview: payload.pdfEditorPreview === true,
      });
    };
    win.webContents.once("did-finish-load", onDidFinishLoad);

    win.loadURL(url).catch((err) => {
      console.log(`[print:${jobId}] loadURL ERROR: ${err?.message || err}`);
      fail(err);
    });
  });
}

async function printToPdf(payload = {}, options) {
  return _printToPdf(payload, options?.includeMetadata === true, options);
}

async function generatePdfForUiEditor(payload = {}) {
  return _printToPdf({ ...payload, pdfEditorPreview: true, silent: true }, true);
}

function registerPrintIpc() {
  // Stable technical service entry points for renderer callers.
  ipcMain.handle("print:getData", async (_evt, payload) =>
    _runIpcTask(async () => {
      const prepared = preparedPrintJob(_evt, payload);
      const p = prepared ? prepared.payload : payload || {};
      const sharedFirmsContext = isSharedFirmsPrintRequest(p) ? sharedFirmsPrintAccess().resolve(p) : null;
      if (!sharedFirmsContext) {
        if (isProviderRequest(p)) providerBridge().resolve(p);
        else _enforceFeature(_featureForPrintMode(p.mode));
      }
      const orientation = _resolveRequestedOrientation(p);
      const data = prepared ? structuredClone(prepared.data) : isProviderRequest(p) ? await providerBridge().provide(p) : await getPrintData({
        mode: p.mode,
        projectId: sharedFirmsContext?.projectId || p.projectId,
        meetingId: p.meetingId,
        invoiceId: p.invoiceId,
        invoicePreview: p.invoicePreview === true,
        settingsOverride: p.settingsOverride || null,
        orientation,
        todoResponsibleFilter: p.todoResponsibleFilter || null,
        restarbeitenRows: p.restarbeitenRows || null,
        restarbeitenLocationLabels: p.restarbeitenLocationLabels || null,
        showAmpelInList: typeof p.showAmpelInList === "boolean" ? p.showAmpelInList : null,
      });
      if (sharedFirmsContext) recheckSharedFirmsPrint(p, sharedFirmsContext);
      const pdfResolution = _getPdfEditorAdapterResolver().resolvePrintRegistration({ documentTypeId: p.documentTypeId, mode: isProviderRequest(p) ? undefined : data.mode });
      if (pdfResolution) {
        const pdfAdapter = pdfResolution.adapter;
        if (isProviderRequest(p)) {
          data.pdfEditorRegistry = pdfAdapter.getPdfRegistry();
          data.pdfEditorLayoutState = {
            scopeId: data.pdfEditorRegistry.scopeId,
            elements: data.pdfEditorRegistry.elements.map((entry) => ({ elementId: entry.id, scopeId: entry.scopeId, ...entry.baseline })),
          };
        }
        if (p.pdfEditorPreview === true) {
          data.pdfEditorLayoutState = pdfAdapter.getCurrentPdfLayoutState();
          data.pdfEditorRegistry = pdfAdapter.getPdfRegistry();
        } else {
          try {
            const persistedLayoutState = pdfAdapter.readPersistedPdfLayoutState();
            if (persistedLayoutState) {
              data.pdfEditorLayoutState = persistedLayoutState;
              data.pdfEditorRegistry = pdfAdapter.getPdfRegistry();
            }
          } catch (error) {
            console.warn("[BBM PDF] Gespeichertes Editorprofil wird beim Produktdruck ignoriert.", {
              documentTypeId: pdfResolution.registration.documentTypeId,
              profilePath: pdfAdapter.getPdfProfilePath(),
              code: error?.code || "pdf_profile_read_failed",
              message: error?.message || String(error),
            });
          }
        }
      }
      // Version/Channel für PDF-Footer mitgeben
      data.appVersion = app.getVersion ? app.getVersion() : "";
      data.buildChannel = resolveBuildIdentity({ electronApp: app }).channel;
      return { ok: true, data };
    })
  );

  ipcMain.handle("print:openHtmlPreview", async (_evt, payload) =>
    _runIpcTask(async () => {
      const p = payload || {};
      const sharedFirmsContext = isSharedFirmsPrintRequest(p) ? sharedFirmsPrintAccess().resolve(p) : null;
      if (!sharedFirmsContext) {
        if (isProviderRequest(p)) providerBridge().resolve(p);
        else _enforceFeature(_featureForPrintMode(p.mode));
      }
      const orientation = _resolveRequestedOrientation(p);
      const jobId = _randId();
      const win = createPrintWindow({ show: true, devTools: false });
      attachPrintDebugPipes(win, jobId);

      const url = getPrintAppUrl();
      win.webContents.once("did-finish-load", () => {
        win.webContents.send("print:init", {
          jobId,
          ...(isProviderRequest(p) ? { providerRequest: structuredClone(p.providerRequest), documentId: p.providerRequest.documentId } : {}),
          ...(sharedFirmsContext ? { moduleId: sharedFirmsContext.moduleId, storage: structuredClone(sharedFirmsContext.storage) } : {}),
          mode: p.mode || "topsAll",
          documentTypeId: p.documentTypeId || null,
          projectId: sharedFirmsContext?.projectId || p.providerRequest?.projectId || p.projectId || null,
          meetingId: p.meetingId || null,
          invoiceId: p.invoiceId || null,
          invoicePreview: p.invoicePreview === true,
          restarbeitenRows: p.restarbeitenRows || null,
          restarbeitenLocationLabels: p.restarbeitenLocationLabels || null,
          settingsOverride: p.settingsOverride || null,
          orientation,
          testOrientation: p.testOrientation || null,
          debug: false,
          devLayoutPreview: p.devLayoutPreview === true,
          layoutCalibrationEnabled:
            p.devLayoutPreview === true
              ? p.layoutCalibrationEnabled == null
                ? _readLayoutCalibrationEnabled()
                : _normalizeLayoutCalibrationEnabled(p.layoutCalibrationEnabled, _readLayoutCalibrationEnabled())
              : false,
        });
      });

      await win.loadURL(url);
      try {
        win.show();
        win.focus();
      } catch (_e) {}

      return { ok: true, jobId };
    })
  );

  ipcMain.handle("print:toPdfAndOpen", async (_evt, payload) =>
    _runIpcTask(async () => {
      const p = payload || {};
      const sharedFirmsContext = isSharedFirmsPrintRequest(p) ? sharedFirmsPrintAccess().resolve(p) : null;
      if (!sharedFirmsContext) {
        if (isProviderRequest(p)) providerBridge().resolve(p);
        else _enforceFeature(_featureForPrintMode(p.mode));
      }
      const outPath = await printToPdf(p);
      const openError = await shell.openPath(outPath);
      if (String(openError || "").trim()) {
        return { ok: false, error: openError, filePath: outPath };
      }
      return { ok: true, filePath: outPath };
    })
  );


  ipcMain.handle("print:toPdfAndPreviewInternal", async (_evt, payload) =>
    _runIpcTask(async () => {
      const p = payload || {};
      const sharedFirmsContext = isSharedFirmsPrintRequest(p) ? sharedFirmsPrintAccess().resolve(p) : null;
      if (!sharedFirmsContext) {
        if (isProviderRequest(p)) providerBridge().resolve(p);
        else _enforceFeature(_featureForPrintMode(p.mode));
      }
      const outPath = await printToPdf(p);
      const previewResult = await openInternalPdfPreview({
        filePath: outPath,
        title: p.previewTitle || p.title || "PDF Vorschau",
      });
      if (previewResult?.ok === false) {
        return { ok: false, error: previewResult.error || "PDF-Vorschau konnte nicht geöffnet werden.", filePath: outPath };
      }
      return { ok: true, filePath: outPath };
    })
  );

  ipcMain.handle("print:toPdf", async (_evt, payload) =>
    _runIpcTask(async () => {
      const p = payload || {};
      const sharedFirmsContext = isSharedFirmsPrintRequest(p) ? sharedFirmsPrintAccess().resolve(p) : null;
      if (!sharedFirmsContext) {
        if (isProviderRequest(p)) providerBridge().resolve(p);
        else _enforceFeature(_featureForPrintMode(p.mode));
      }
      console.log(
        `[PRINT_ACTIVE] handler=print:toPdf payload.mode=${payload?.mode || ""} projectId=${
          payload?.projectId ?? ""
        } meetingId=${payload?.meetingId ?? ""}`
      );
      const outPath = await printToPdf(p);
      return { ok: true, filePath: outPath };
    })
  );


  ipcMain.handle("protocol:findStoredPdf", async (_evt, payload) =>
    _runIpcTask(async () => {
      const p = payload || {};
      _enforceFeature("protokoll");
      return findStoredProtocolPdf({
        baseDir: p.baseDir,
        project: p.project || null,
        expectedFileNames: p.expectedFileNames || [],
        meetingIndex: p.meetingIndex,
      });
    })
  );

  ipcMain.handle("firms:listStoredPdfs", async (_evt, payload) =>
    _runIpcTask(async () => {
      const p = payload || {};
      _enforceFeature("protokoll");
      return listStoredFirmsPdfs({
        baseDir: p.baseDir,
        project: p.project || null,
      });
    })
  );

  ipcMain.handle("print:listStoredProjectPdfs", async (_evt, payload) =>
    _runIpcTask(async () => {
      const p = payload || {};
      _enforceFeature(_featureForStoredProjectKind(p.kind));
      return listStoredProjectPdfs({
        baseDir: p.baseDir,
        project: p.project || null,
        kind: p.kind || "",
      });
    })
  );

  ipcMain.handle("print:htmlToPdf", async (_evt, payload) =>
    _runIpcTask(async () => {
      const p = payload || {};
      const sharedFirmsContext = isSharedFirmsPrintRequest(p) ? sharedFirmsPrintAccess().resolve(p) : null;
      if (!sharedFirmsContext) {
        if (isProviderRequest(p)) providerBridge().resolve(p);
        else _enforceFeature(_featureForPrintMode(p.mode));
      }
      console.log(
        `[PRINT_ACTIVE] handler=print:htmlToPdf payload.mode=${payload?.mode || ""} projectId=${
          payload?.projectId ?? ""
        } meetingId=${payload?.meetingId ?? ""}`
      );
      const outPath = await printToPdf(p);
      return { ok: true, filePath: outPath };
    })
  );
}

module.exports = { registerPrintIpc, generatePdfForUiEditor, printToPdf, openInternalPdfPreview };
