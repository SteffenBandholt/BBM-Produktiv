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

const { ipcMain, app } = require("electron");
const fs = require("fs");
const path = require("path");
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
const { appSettingsGetMany } = require("../db/appSettingsRepo");
const {
  sanitizeDirName,
  resolveProjectFolderName,
} = require("./projectStoragePaths");

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
  return resolvePrintRequestedOrientation({
    orientation: payload.orientation,
    testOrientation: payload.testOrientation,
    smokeOrientation: process.env.BBM_PRINT_SMOKE_ORIENTATION,
  });
}

function _readLayoutCalibrationEnabled() {
  try {
    const settings = appSettingsGetMany(["dev.layoutCalibrationEnabled"]) || {};
    return String(settings["dev.layoutCalibrationEnabled"] || "").trim() === "1";
  } catch (_err) {
    return false;
  }
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
    if (kindKey === "topsall") return normalized.includes("topliste-alle");
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

async function printToPdf(payload = {}) {
  const jobId = _randId();
  const { resolvePrintMode } = await _loadPrintModesModule();
  const mode = resolvePrintMode(payload.mode, { fallback: "protocol" });
  if (!mode) {
    throw new Error(`Unbekannter Druckmodus: ${String(payload.mode || "").trim() || "-"}`);
  }
  const projectId = payload.projectId || null;
  const meetingId = payload.meetingId || null;
  const orientation = _resolveRequestedOrientation(payload);

  console.log(
    `[print:${jobId}] start mode=${mode} projectId=${projectId} meetingId=${meetingId} orientation=${orientation}`
  );

  const data = await getPrintData({
    mode,
    projectId,
    meetingId,
    settingsOverride: payload.settingsOverride || null,
    orientation,
    todoResponsibleFilter: payload.todoResponsibleFilter || null,
  });
  const projectNumber = data?.project?.project_number || data?.project?.projectNumber || null;

  const outPath = await _buildOutputPath({
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
    const timeoutMsRaw = Number(payload?.timeoutMs);
    const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 120000;

    const cleanup = () => {
      try {
        ipcMain.removeListener("print:ready", onReady);
      } catch (_e) {}
      try {
        clearTimeout(timeout);
      } catch (_e) {}
      try {
        win.close();
      } catch (_e) {}
    };

    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      console.log(`[print:${jobId}] TIMEOUT after ${timeoutMs}ms`);
      cleanup();
      reject(new Error("Print-Window Timeout"));
    }, timeoutMs);

    const onReady = async (evt, msg) => {
      if (evt.sender !== win.webContents) return;
      if (msg?.jobId && msg.jobId !== jobId) return;

      console.log(`[print:${jobId}] print:ready received`);

      try {
        const options = buildPrintToPdfOptions({ orientation });
        console.log(
          `[PRINT_ACTIVE] printToPDF options: ${JSON.stringify(
            {
              orientation,
              landscape: options.landscape,
              pageSize: options.pageSize,
              displayHeaderFooter: options.displayHeaderFooter,
              margin: options.margin,
            },
            null,
            0
          )}`
        );
        const pdfBuffer = await win.webContents.printToPDF(options);
        fs.writeFileSync(outPath, pdfBuffer);
        console.log(`[print:${jobId}] PDF written -> ${outPath}`);
        done = true;
        cleanup();
        resolve(outPath);
      } catch (err) {
        console.log(`[print:${jobId}] printToPDF ERROR: ${err?.message || err}`);
        done = true;
        cleanup();
        reject(err);
      }
    };

    ipcMain.on("print:ready", onReady);

    win.webContents.once("did-finish-load", () => {
      console.log(`[print:${jobId}] sending print:init (debug=${debug})`);
      win.webContents.send("print:init", {
        jobId,
        mode,
        projectId,
        meetingId,
        settingsOverride: payload.settingsOverride || null,
        orientation,
        testOrientation: payload.testOrientation || null,
        debug,
        layoutCalibrationEnabled: _readLayoutCalibrationEnabled(),
      });
    });

    win.loadURL(url).catch((err) => {
      if (done) return;
      done = true;
      console.log(`[print:${jobId}] loadURL ERROR: ${err?.message || err}`);
      cleanup();
      reject(err);
    });
  });
}

function registerPrintIpc() {
  // Stable technical service entry points for renderer callers.
  ipcMain.handle("print:getData", async (_evt, payload) =>
    _runIpcTask(async () => {
      _enforceFeature("protokoll");
      const p = payload || {};
      const orientation = _resolveRequestedOrientation(p);
      const data = await getPrintData({
        mode: p.mode,
        projectId: p.projectId,
        meetingId: p.meetingId,
        settingsOverride: p.settingsOverride || null,
        orientation,
        todoResponsibleFilter: p.todoResponsibleFilter || null,
      });
      // Version/Channel für PDF-Footer mitgeben
      data.appVersion = app.getVersion ? app.getVersion() : "";
      data.buildChannel = app.isPackaged ? "STABLE" : "DEV";
      return { ok: true, data };
    })
  );

  ipcMain.handle("print:openHtmlPreview", async (_evt, payload) =>
    _runIpcTask(async () => {
      _enforceFeature("protokoll");
      if (app.isPackaged) {
        return { ok: false, error: "DEV-only." };
      }

      const p = payload || {};
      const orientation = _resolveRequestedOrientation(p);
      const jobId = _randId();
      const win = createPrintWindow({ show: true, devTools: false });
      attachPrintDebugPipes(win, jobId);

      const url = getPrintAppUrl();
      win.webContents.once("did-finish-load", () => {
        win.webContents.send("print:init", {
          jobId,
          mode: p.mode || "topsAll",
          projectId: p.projectId || null,
          meetingId: p.meetingId || null,
          settingsOverride: p.settingsOverride || null,
          orientation,
          testOrientation: p.testOrientation || null,
          debug: false,
          devLayoutPreview: true,
          layoutCalibrationEnabled:
            p.layoutCalibrationEnabled == null
              ? _readLayoutCalibrationEnabled()
              : _normalizeLayoutCalibrationEnabled(p.layoutCalibrationEnabled, _readLayoutCalibrationEnabled()),
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

  ipcMain.handle("print:toPdf", async (_evt, payload) =>
    _runIpcTask(async () => {
      _enforceFeature("protokoll");
      console.log(
        `[PRINT_ACTIVE] handler=print:toPdf payload.mode=${payload?.mode || ""} projectId=${
          payload?.projectId ?? ""
        } meetingId=${payload?.meetingId ?? ""}`
      );
      const outPath = await printToPdf(payload || {});
      return { ok: true, filePath: outPath };
    })
  );


  ipcMain.handle("protocol:findStoredPdf", async (_evt, payload) =>
    _runIpcTask(async () => {
      _enforceFeature("protokoll");
      const p = payload || {};
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
      _enforceFeature("protokoll");
      const p = payload || {};
      return listStoredFirmsPdfs({
        baseDir: p.baseDir,
        project: p.project || null,
      });
    })
  );

  ipcMain.handle("print:listStoredProjectPdfs", async (_evt, payload) =>
    _runIpcTask(async () => {
      _enforceFeature("protokoll");
      const p = payload || {};
      return listStoredProjectPdfs({
        baseDir: p.baseDir,
        project: p.project || null,
        kind: p.kind || "",
      });
    })
  );

  ipcMain.handle("print:htmlToPdf", async (_evt, payload) =>
    _runIpcTask(async () => {
      _enforceFeature("protokoll");
      console.log(
        `[PRINT_ACTIVE] handler=print:htmlToPdf payload.mode=${payload?.mode || ""} projectId=${
          payload?.projectId ?? ""
        } meetingId=${payload?.meetingId ?? ""}`
      );
      const outPath = await printToPdf(payload || {});
      return { ok: true, filePath: outPath };
    })
  );
}

module.exports = { registerPrintIpc };
