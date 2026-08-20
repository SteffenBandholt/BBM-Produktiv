"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const electronModule = require("electron");
const { createPrintToPdfOptions } = require("../../src/main/print/printOrientation.js");
const { createBbmPdfAdapter } = require("../../src/main/ui-editor/bbmPdfAdapter.cjs");
const { createDeclarativePdfAdapter } = require("../../src/main/ui-editor/declarativePdfAdapter.cjs");
const { REGISTRY: RESTARBEITEN_PDF_REGISTRY } = require("../../src/main/ui-editor/restarbeitenPdfAdapter.cjs");
const { getM85Fixtures } = require("./m85Fixtures.cjs");

const IS_ELECTRON_PROCESS = Boolean(process.versions.electron);
const { app, BrowserWindow, ipcMain } = IS_ELECTRON_PROCESS ? electronModule : {};

function parseArgs(argv) {
  const result = { output: "", pdfDir: "", fixtureIds: [], isolatedRoot: "", editorElement: "", editorX: null, editorY: null, editorWidth: null, editorTextOffsetX: null, editorTextOffsetY: null, editorFontSize: null, editorVisible: null, boundaryTable: "pdf.bbm.protocol.tops", boundaryLeft: "", boundaryRight: "", boundaryDelta: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "");
    if (arg === "--output") result.output = path.resolve(String(argv[++index] || ""));
    else if (arg === "--pdf-dir") result.pdfDir = path.resolve(String(argv[++index] || ""));
    else if (arg === "--isolated-root") result.isolatedRoot = path.resolve(String(argv[++index] || ""));
    else if (arg === "--fixture") result.fixtureIds.push(String(argv[++index] || ""));
    else if (arg.startsWith("--fixture=")) result.fixtureIds.push(arg.slice("--fixture=".length));
    else if (arg === "--editor-element") result.editorElement = String(argv[++index] || "");
    else if (arg === "--editor-x") result.editorX = Number(argv[++index]);
    else if (arg === "--editor-y") result.editorY = Number(argv[++index]);
    else if (arg === "--editor-width") result.editorWidth = Number(argv[++index]);
    else if (arg === "--editor-text-offset-x") result.editorTextOffsetX = Number(argv[++index]);
    else if (arg === "--editor-text-offset-y") result.editorTextOffsetY = Number(argv[++index]);
    else if (arg === "--editor-font-size") result.editorFontSize = Number(argv[++index]);
    else if (arg === "--editor-visible") result.editorVisible = String(argv[++index] || "") === "true";
    else if (arg === "--boundary-table") result.boundaryTable = String(argv[++index] || "");
    else if (arg === "--boundary-left") result.boundaryLeft = String(argv[++index] || "");
    else if (arg === "--boundary-right") result.boundaryRight = String(argv[++index] || "");
    else if (arg === "--boundary-delta") result.boundaryDelta = Number(argv[++index]);
  }
  if (!result.output) throw new Error("M85-Snapshot-Ausgabedatei fehlt (--output)." );
  if (result.editorElement && ![result.editorX, result.editorY, result.editorWidth, result.editorTextOffsetX, result.editorTextOffsetY, result.editorFontSize].some(Number.isFinite) && result.editorVisible === null && !Number.isFinite(result.boundaryDelta))
    throw new Error("M85-Editorcheck benoetigt mindestens eine Layoutaenderung.");
  if (Number.isFinite(result.boundaryDelta) && (!result.boundaryLeft || !result.boundaryRight))
    throw new Error("M85-Grenzencheck benoetigt linke und rechte Nachbarspalte.");
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

function applyEditorChanges(adapter, args) {
  const scopeId = adapter.getPdfRegistry().scopeId;
  const submit = (operation, payload, elementId = args.editorElement) => {
    const result = adapter.submitPdfChangeRequest({
      changeId: `editor-check-${operation}-${elementId}`,
      scopeId,
      elementId,
      operation,
      payload,
    });
    if (!result.success) throw new Error(`M85-Editorcheck abgewiesen: ${result.errorCode}`);
  };
  if (Number.isFinite(args.boundaryDelta)) {
    submit("resizeColumnBoundary", { table: { leftColumnId: args.boundaryLeft, rightColumnId: args.boundaryRight, delta: args.boundaryDelta } }, args.boundaryTable);
  }
  if (Number.isFinite(args.editorX) || Number.isFinite(args.editorY)) {
    const payload = {};
    if (Number.isFinite(args.editorX)) payload.x = args.editorX;
    if (Number.isFinite(args.editorY)) payload.y = args.editorY;
    submit("move", payload);
  }
  if (Number.isFinite(args.editorWidth)) submit("resizeWidth", { width: args.editorWidth });
  if (Number.isFinite(args.editorTextOffsetX) || Number.isFinite(args.editorTextOffsetY)) {
    const text = {};
    if (Number.isFinite(args.editorTextOffsetX)) text.offsetX = args.editorTextOffsetX;
    if (Number.isFinite(args.editorTextOffsetY)) text.offsetY = args.editorTextOffsetY;
    submit("textMove", { text });
  }
  if (Number.isFinite(args.editorFontSize)) submit("textResize", { text: { fontSize: args.editorFontSize } });
  if (args.editorVisible !== null) submit("setVisibility", { visible: args.editorVisible });
}

function dataForFixture(fixture, args) {
  const data = clone(fixture.data);
  if (fixture.kind === "restarbeiten") {
    const adapter = createDeclarativePdfAdapter({ documentTypeId: "restarbeiten", displayName: "Restarbeitenliste", registry: RESTARBEITEN_PDF_REGISTRY, documentIdentityFields: ["projectId"] });
    if (args.editorElement || Number.isFinite(args.boundaryDelta)) applyEditorChanges(adapter, args);
    data.pdfEditorRegistry = adapter.getPdfRegistry();
    data.pdfEditorLayoutState = adapter.getCurrentPdfLayoutState();
    return data;
  }
  if (!args.editorElement && !Number.isFinite(args.boundaryDelta)) return data;
  if (fixture.kind !== "protocol") throw new Error("M85-Editorcheck ist nur fuer Protokoll-Fixtures erlaubt.");
  const adapter = createBbmPdfAdapter();
  applyEditorChanges(adapter, args);
  data.pdfEditorRegistry = adapter.getPdfRegistry();
  data.pdfEditorLayoutState = adapter.getCurrentPdfLayoutState();
  return data;
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

async function readMetaColumnGeometry(win, fixture) {
  if (fixture.kind !== "protocol") return null;
  return win.webContents.executeJavaScript(`(() => {
    const mm = (px) => Math.round((Number(px || 0) * 25.4 / 96) * 1000) / 1000;
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: mm(rect.x), y: mm(rect.y), width: mm(rect.width), height: mm(rect.height), right: mm(rect.right) };
    };
    const style = (element) => element ? getComputedStyle(element) : null;
    const table = document.querySelector("table.topsTable");
    if (!table) return null;
    const header = table.querySelector("thead th.colMeta");
    const heading = header?.querySelector(":scope > .columnHeadingContent") || null;
    const cells = Array.from(table.querySelectorAll("tbody td.colMeta")).map((cell) => {
      const cellStyle = style(cell);
      const wrapper = cell.querySelector(":scope > .meta3");
      const lines = Array.from(wrapper?.querySelectorAll(":scope > .metaLine") || []).map((line) => {
        const lineStyle = style(line);
        return {
          classes: line.className,
          box: box(line),
          display: lineStyle?.display || "",
          maxWidth: lineStyle?.maxWidth || "",
          position: lineStyle?.position || "",
          transform: lineStyle?.transform || "",
        };
      });
      return {
        box: box(cell),
        paddingLeft: mm(parseFloat(cellStyle?.paddingLeft || "0")),
        paddingRight: mm(parseFloat(cellStyle?.paddingRight || "0")),
        innerWidth: mm(cell.getBoundingClientRect().width - parseFloat(cellStyle?.paddingLeft || "0") - parseFloat(cellStyle?.paddingRight || "0")),
        wrapper: box(wrapper),
        lines,
        statusText: box(wrapper?.querySelector(".metaLine.meta1 .metaText")),
        ampelDot: box(wrapper?.querySelector(".metaLine.meta1 .ampelDot")),
      };
    });
    return {
      track: box(table.querySelector("colgroup col.colMeta")),
      header: box(header),
      heading: box(heading),
      cells,
    };
  })()`, true);
}

async function readTitleMarkerGeometry(win, fixture) {
  if (fixture.kind !== "protocol") return null;
  return win.webContents.executeJavaScript(`(() => {
    const mm = (px) => Math.round((Number(px || 0) * 25.4 / 96) * 1000) / 1000;
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: mm(rect.x), y: mm(rect.y), width: mm(rect.width), height: mm(rect.height), right: mm(rect.right) };
    };
    return Array.from(document.querySelectorAll("tr.lvl1Row")).map((row) => {
      const title = row.querySelector(".lvl1Text");
      return {
        title: String(title?.textContent || "").trim(),
        titleColor: title ? getComputedStyle(title).color : "",
        titleBox: box(title),
        important: row.classList.contains("isImportant"),
        row: box(row),
        markers: Array.from(row.querySelectorAll(".lvl1Marker")).map((marker) => ({
          type: String(marker.dataset.marker || ""),
          box: box(marker),
          display: getComputedStyle(marker).display,
        })),
      };
    });
  })()`, true);
}

async function readTopIndicatorGeometry(win, fixture) {
  if (fixture.kind !== "protocol") return null;
  return win.webContents.executeJavaScript(`(() => {
    const mm = (px) => Math.round((Number(px || 0) * 25.4 / 96) * 1000) / 1000;
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: mm(rect.x), y: mm(rect.y), width: mm(rect.width), height: mm(rect.height), right: mm(rect.right) };
    };
    return Array.from(document.querySelectorAll("tr.topRow")).map((row) => {
      const title = row.querySelector(".lvl1Text, .shortText");
      return {
        title: String(title?.textContent || "").trim(),
        level: row.classList.contains("lvl1Row") ? 1 : 2,
        important: row.classList.contains("isImportant"),
        titleColor: title ? getComputedStyle(title).color : "",
        row: box(row),
        indicators: Array.from(row.querySelectorAll(".ampelDot, .lvl1Marker")).map((indicator) => ({
          type: indicator.classList.contains("ampelDot") ? "ampel" : String(indicator.dataset.marker || ""),
          box: box(indicator),
          display: getComputedStyle(indicator).display,
        })),
      };
    });
  })()`, true);
}

async function readRestarbeitenOptics(win, fixture) {
  if (fixture.kind !== "restarbeiten") return null;
  return win.webContents.executeJavaScript(`(() => {
    const mm = (px) => Math.round((Number(px || 0) * 25.4 / 96) * 1000) / 1000;
    const pt = (px) => Math.round((Number(px || 0) * 72 / 96) * 1000) / 1000;
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { widthMm: mm(rect.width), heightMm: mm(rect.height) };
    };
    const separator = (cell) => {
      const style = getComputedStyle(cell);
      return {
        display: style.display,
        borderRightMm: mm(parseFloat(style.borderRightWidth || "0")),
        borderRightStyle: style.borderRightStyle,
        borderRightColor: style.borderRightColor,
      };
    };
    return Array.from(document.querySelectorAll(".page")).map((page, pageIndex) => {
      const table = page.querySelector(".restarbeitenTable");
      const headRow = table?.querySelector(".restarbeitenTableHeadRow") || null;
      return {
        pageNumber: pageIndex + 1,
        verticalSeparatorsEnabled: table?.classList.contains("restarbeitenTable--vertical-column-separators") === true,
        headerRow: box(headRow),
        headers: Array.from(headRow?.querySelectorAll("th") || []).map((cell) => {
          const cellStyle = getComputedStyle(cell);
          const label = cell.querySelector(".restarbeitenHeaderLabel");
          const labelStyle = label ? getComputedStyle(label) : null;
          return {
            key: String(cell.dataset.restarbeitenColumn || ""),
            text: String(cell.textContent || "").replace(/\s+/g, " ").trim(),
            textAlign: cellStyle.textAlign,
            verticalAlign: cellStyle.verticalAlign,
            fontWeight: cellStyle.fontWeight,
            fontSizePt: pt(parseFloat(cellStyle.fontSize || "0")),
            lineHeightPt: pt(parseFloat(cellStyle.lineHeight || "0")),
            labelAlignItems: labelStyle?.alignItems || "",
            labelTextAlign: labelStyle?.textAlign || "",
            separator: separator(cell),
            box: box(cell),
          };
        }),
        bodyRows: Array.from(table?.querySelectorAll("tbody tr") || []).map((row) => ({
          cells: Array.from(row.querySelectorAll("td")).map((cell) => ({
            key: String(cell.dataset.restarbeitenColumn || ""),
            separator: separator(cell),
            box: box(cell),
          })),
        })),
        ampels: Array.from(table?.querySelectorAll('[data-restarbeiten-column="dueStatus"] .restarbeitStatusWrap .ampelDot') || []).map((dot) => {
          const style = getComputedStyle(dot);
          return {
            box: box(dot),
            cssWidthMm: mm(parseFloat(style.width || "0")),
            cssHeightMm: mm(parseFloat(style.height || "0")),
            borderLeftMm: mm(parseFloat(style.borderLeftWidth || "0")),
            borderTopMm: mm(parseFloat(style.borderTopWidth || "0")),
          };
        }),
      };
    });
  })()`, true);
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
  const readyMessage = await ready;
  const snapshot = await win.webContents.executeJavaScript(
    "structuredClone(globalThis.__bbmPdfSatzvertragSnapshot || null)",
    true
  );
  if (!snapshot) throw new Error(`M85-Struktursnapshot fehlt: ${fixture.id}`);
  const metaColumnGeometry = await readMetaColumnGeometry(win, fixture);
  const titleMarkerGeometry = await readTitleMarkerGeometry(win, fixture);
  const topIndicatorGeometry = await readTopIndicatorGeometry(win, fixture);
  const restarbeitenOptics = await readRestarbeitenOptics(win, fixture);

  let pdf = null;
  if (pdfDir) {
    fs.mkdirSync(pdfDir, { recursive: true });
    const filePath = path.join(pdfDir, `${fixture.id}.pdf`);
    const buffer = await win.webContents.printToPDF(createPrintToPdfOptions({ orientation: fixture.data.orientation }));
    fs.writeFileSync(filePath, buffer);
    pdf = { fileName: path.basename(filePath), bytes: buffer.length };
  }
  return { id: fixture.id, number: fixture.number, title: fixture.title, kind: fixture.kind, snapshot,
    previewMetadata: readyMessage?.previewMetadata || null, metaColumnGeometry, titleMarkerGeometry, topIndicatorGeometry, restarbeitenOptics, pdf };
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
    return { ok: true, data: dataForFixture(fixture, args) };
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
