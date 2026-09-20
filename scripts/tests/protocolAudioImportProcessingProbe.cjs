"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");

const ROOT = path.resolve(__dirname, "../..");
const WAV_PATH = path.resolve(
  process.env.BBM_AUDIO_IMPORT_TEST_WAV ||
  path.join(ROOT, "tmp", "audio-abnahme", "audio-import-v1-synthetisch.wav")
);
const LOG_PATH = String(process.env.BBM_AUDIO_IMPORT_PROCESSING_LOG || "").trim();
const SKIP_PROCESSING = process.env.BBM_AUDIO_IMPORT_SKIP_PROCESSING === "1";
const CANCEL_ONLY = process.env.BBM_AUDIO_IMPORT_CANCEL_ONLY === "1";
const EXIT_AFTER = process.env.BBM_AUDIO_IMPORT_EXIT_AFTER === "1";

app.setAppPath(ROOT);

let mainWindow = null;
let processingStarted = false;
let processingCompleted = SKIP_PROCESSING;
let finalInspectionStarted = false;

function report(message) {
  const line = `${new Date().toISOString()} ${message}`;
  console.log(line);
  if (LOG_PATH) fs.appendFileSync(LOG_PATH, `${line}\n`, "utf8");
}

function waitForRenderer(window, expression, timeoutMs = 20000) {
  return window.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const expiresAt = Date.now() + ${Number(timeoutMs)};
      const timer = setInterval(() => {
        try {
          const value = (${expression});
          if (value) {
            clearInterval(timer);
            resolve(value);
          } else if (Date.now() >= expiresAt) {
            clearInterval(timer);
            reject(new Error('AUDIO_IMPORT_RENDERER_TIMEOUT'));
          }
        } catch (error) {
          clearInterval(timer);
          reject(error);
        }
      }, 100);
    })
  `, true);
}

async function closeAuxiliaryWindows() {
  for (const window of BrowserWindow.getAllWindows()) {
    if (window !== mainWindow && !window.isDestroyed()) window.close();
  }
}

async function inspectAndLeaveOpen() {
  if (finalInspectionStarted || !mainWindow || mainWindow.isDestroyed()) return;
  finalInspectionStarted = true;
  const { initDatabase } = require(path.join(ROOT, "src/main/db/database"));
  const db = initDatabase();
  const meeting = db.prepare(`
    SELECT id, project_id FROM meetings
    WHERE is_closed = 0
    ORDER BY meeting_index DESC, created_at DESC
    LIMIT 1
  `).get();
  const importRoot = db.prepare(`
    SELECT id FROM tops
    WHERE project_id = ? AND special_type = 'audio_import'
      AND removed_at IS NULL AND COALESCE(is_trashed, 0) = 0
    ORDER BY created_at DESC LIMIT 1
  `).get(meeting?.project_id || "");
  const importIds = importRoot
    ? new Set(db.prepare("SELECT id FROM tops WHERE id = ? OR parent_top_id = ?").all(importRoot.id, importRoot.id).map((row) => row.id))
    : new Set();
  const { getPrintData } = require(path.join(ROOT, "src/main/print/printData"));
  const printResults = [];
  for (const mode of ["preview", "protocol"]) {
    const data = await getPrintData({ mode, projectId: meeting?.project_id, meetingId: meeting?.id });
    const ids = new Set((data?.tops || []).map((row) => row.id));
    if ([...importIds].some((id) => ids.has(id))) throw new Error(`AUDIO_IMPORT_PRINT_FILTER_FAILED:${mode}`);
    printResults.push({ mode, topCount: ids.size });
  }
  report(`AUDIO_IMPORT_PRINT_FILTER_OK ${JSON.stringify(printResults)}`);
  const visible = await waitForRenderer(mainWindow, `(() => {
    const button = document.querySelector('[data-quicklane-action="audio-import"]');
    const bodyText = String(document.body?.innerText || '');
    if (!button || button.disabled || !bodyText.includes('Import')) return null;
    const rect = button.getBoundingClientRect();
    const quicklane = document.querySelector('.bbm-tops-screen-quicklane');
    const quicklaneRect = quicklane?.getBoundingClientRect?.();
    return {
      importButton: {
        title: button.title,
        disabled: button.disabled,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      quicklane: quicklaneRect ? {
        width: Math.round(quicklaneRect.width),
        height: Math.round(quicklaneRect.height),
      } : null,
      hasImportTitle: bodyText.includes('Import'),
      bodyExcerpt: bodyText.slice(-1200),
    };
  })()`, 30000);
  await closeAuxiliaryWindows();
  mainWindow.show();
  mainWindow.focus();
  visible.windowCount = BrowserWindow.getAllWindows().filter((window) => !window.isDestroyed()).length;
  report(`AUDIO_IMPORT_FINAL_WINDOW ${JSON.stringify(visible)}`);
  if (EXIT_AFTER) app.quit();
}

async function processWavThroughProductiveIpc() {
  if (processingStarted || processingCompleted || !mainWindow || mainWindow.isDestroyed()) return;
  processingStarted = true;
  if (!fs.existsSync(WAV_PATH)) throw new Error(`TEST_WAV_MISSING:${WAV_PATH}`);

  await waitForRenderer(mainWindow, `(() => {
    const button = document.querySelector('[data-quicklane-action="audio-import"]');
    return button && button.disabled === false;
  })()`, 20000);

  const { initDatabase } = require(path.join(ROOT, "src/main/db/database"));
  const meeting = initDatabase().prepare(`
    SELECT id, project_id
    FROM meetings
    WHERE is_closed = 0
    ORDER BY meeting_index DESC, created_at DESC
    LIMIT 1
  `).get();
  if (!meeting?.id || !meeting?.project_id) throw new Error("OPEN_TEST_MEETING_MISSING");

  const operationId = `acceptance-${Date.now()}`;
  const payload = { operationId, meetingId: meeting.id, projectId: meeting.project_id, filePath: WAV_PATH };
  const result = await mainWindow.webContents.executeJavaScript(`
    (async () => {
      const progress = [];
      const unsubscribe = window.bbmDb.audioOnProtocolImportProgress((entry) => {
        if (entry?.operationId === ${JSON.stringify(operationId)}) progress.push(entry);
      });
      try {
        const imported = await window.bbmDb.audioRunProtocolImport(${JSON.stringify(payload)});
        const listed = await window.bbmDb.topsListByMeeting(${JSON.stringify(meeting.id)});
        return { imported, progress, listed };
      } finally {
        unsubscribe();
      }
    })()
  `, true);

  if (!result?.imported?.ok) {
    throw new Error(`PRODUCTIVE_AUDIO_IMPORT_FAILED:${JSON.stringify(result?.imported || null)}`);
  }
  const list = Array.isArray(result?.listed?.list) ? result.listed.list : [];
  const importRoot = list.find((row) => row?.special_type === "audio_import");
  const children = importRoot ? list.filter((row) => row?.parent_top_id === importRoot.id) : [];
  if (!importRoot || children.length < 1) {
    throw new Error(`PRODUCTIVE_AUDIO_IMPORT_NOT_VISIBLE_IN_DATA:${JSON.stringify({ importRoot, children })}`);
  }
  const { getPrintData } = require(path.join(ROOT, "src/main/print/printData"));
  const printResults = [];
  for (const mode of ["preview", "protocol"]) {
    const printData = await getPrintData({
      mode,
      projectId: meeting.project_id,
      meetingId: meeting.id,
    });
    const printedIds = new Set((printData?.tops || []).map((row) => String(row?.id || "")));
    if (printedIds.has(importRoot.id) || children.some((row) => printedIds.has(row.id))) {
      throw new Error(`AUDIO_IMPORT_PRINT_FILTER_FAILED:${mode}`);
    }
    printResults.push({ mode, topCount: printedIds.size });
  }
  report(`AUDIO_IMPORT_PROCESSING_OK ${JSON.stringify({
    wavPath: WAV_PATH,
    meetingId: meeting.id,
    projectId: meeting.project_id,
    imported: result.imported,
    progress: result.progress,
    importRoot: { id: importRoot.id, title: importRoot.title, displayNumber: importRoot.displayNumber },
    children: children.map((row) => ({ id: row.id, title: row.title, longtext: row.longtext })),
    printResults,
  })}`);

  processingCompleted = true;
  mainWindow.webContents.reloadIgnoringCache();
}

async function cancelWavThroughProductiveIpc() {
  if (processingStarted || !mainWindow || mainWindow.isDestroyed()) return;
  processingStarted = true;
  if (!fs.existsSync(WAV_PATH)) throw new Error(`TEST_WAV_MISSING:${WAV_PATH}`);
  await waitForRenderer(mainWindow, `(() => {
    const button = document.querySelector('[data-quicklane-action="audio-import"]');
    return button && button.disabled === false;
  })()`, 20000);

  const { initDatabase } = require(path.join(ROOT, "src/main/db/database"));
  const db = initDatabase();
  const meeting = db.prepare(`
    SELECT id, project_id FROM meetings
    WHERE is_closed = 0 ORDER BY meeting_index DESC, created_at DESC LIMIT 1
  `).get();
  const countChildren = () => db.prepare(`
    SELECT COUNT(*) AS count
    FROM tops child
    JOIN tops root ON root.id = child.parent_top_id
    WHERE root.special_type = 'audio_import'
      AND root.project_id = ?
      AND child.removed_at IS NULL
      AND COALESCE(child.is_trashed, 0) = 0
  `).get(meeting.project_id).count;
  const beforeCount = countChildren();
  const operationId = `cancel-acceptance-${Date.now()}`;
  const payload = { operationId, meetingId: meeting.id, projectId: meeting.project_id, filePath: WAV_PATH };
  const result = await mainWindow.webContents.executeJavaScript(`
    (async () => {
      const runPromise = window.bbmDb.audioRunProtocolImport(${JSON.stringify(payload)});
      await new Promise((resolve) => setTimeout(resolve, 150));
      const cancel = await window.bbmDb.audioCancelProtocolImport({ operationId: ${JSON.stringify(operationId)} });
      const imported = await runPromise;
      return { cancel, imported };
    })()
  `, true);
  const afterCount = countChildren();
  if (result?.cancel?.ok !== true || result?.cancel?.canceled !== true || result?.imported?.canceled !== true) {
    throw new Error(`PRODUCTIVE_AUDIO_CANCEL_FAILED:${JSON.stringify(result)}`);
  }
  if (afterCount !== beforeCount) {
    throw new Error(`PRODUCTIVE_AUDIO_CANCEL_LEFT_PARTIAL_TOPS:${beforeCount}->${afterCount}`);
  }
  report(`AUDIO_IMPORT_CANCEL_OK ${JSON.stringify({ beforeCount, afterCount, result })}`);
  processingCompleted = true;
  if (EXIT_AFTER) app.quit();
}

app.on("browser-window-created", (_event, window) => {
  window.webContents.on("did-finish-load", async () => {
    try {
      const url = String(window.webContents.getURL() || "");
      if (!url.replace(/\\/g, "/").includes("/src/renderer/index.html")) return;
      mainWindow = window;
      if (CANCEL_ONLY) {
        await cancelWavThroughProductiveIpc();
        return;
      }
      if (!processingCompleted) {
        await processWavThroughProductiveIpc();
        return;
      }
      await inspectAndLeaveOpen();
    } catch (error) {
      report(`AUDIO_IMPORT_PROCESSING_FAILED ${error?.stack || error?.message || error}`);
      process.exitCode = 1;
      app.quit();
    }
  });
});

require(path.join(ROOT, "src/main/main.js"));
