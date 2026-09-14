"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const electronModule = require("electron");
const { createPrintToPdfOptions } = require("../../src/main/print/printOrientation.js");
const { createBbmPdfAdapter } = require("../../src/main/ui-editor/bbmPdfAdapter.cjs");
const { getM85Fixtures } = require("./m85Fixtures.cjs");

const IS_ELECTRON_PROCESS = Boolean(process.versions.electron);
const { app, BrowserWindow, ipcMain } = IS_ELECTRON_PROCESS ? electronModule : {};

function parseArgs(argv) {
  const result = { output: "", pdfDir: "", fixtureIds: [], isolatedRoot: "", modeOverrides: [], projectAddressCases: [], includeEditorLayout: false, editorElement: "", editorX: null, editorY: null, editorWidth: null, editorTextOffsetX: null, editorTextOffsetY: null, editorFontSize: null, editorVisible: null, boundaryTable: "pdf.bbm.protocol.tops", boundaryLeft: "", boundaryRight: "", boundaryDelta: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "");
    if (arg === "--output") result.output = path.resolve(String(argv[++index] || ""));
    else if (arg === "--pdf-dir") result.pdfDir = path.resolve(String(argv[++index] || ""));
    else if (arg === "--isolated-root") result.isolatedRoot = path.resolve(String(argv[++index] || ""));
    else if (arg === "--fixture") result.fixtureIds.push(String(argv[++index] || ""));
    else if (arg.startsWith("--fixture=")) result.fixtureIds.push(arg.slice("--fixture=".length));
    else if (arg === "--mode") result.modeOverrides.push(String(argv[++index] || ""));
    else if (arg === "--project-address-case") result.projectAddressCases.push(String(argv[++index] || ""));
    else if (arg === "--include-editor-layout") result.includeEditorLayout = true;
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

const PROJECT_ADDRESS_CASES = Object.freeze({
  full: Object.freeze({ street: "Musterstraße 12 A", zip: "12345", city: "Musterstadt" }),
  partial: Object.freeze({ street: "Teilweg 7", zip: "", city: "Teilort" }),
  empty: Object.freeze({ street: "   ", zip: "", city: null }),
  missing: null,
  long: Object.freeze({
    street: "Außergewöhnlich lange Straße des gemeinsamen Bauvorhabens mit ergänzender Lagebezeichnung 123 A",
    zip: "98765",
    city: "Langstraßenhausen",
  }),
});

function expandFixtureVariants(sourceFixtures, args) {
  const modes = args.modeOverrides.length ? args.modeOverrides : [null];
  const addressCases = args.projectAddressCases.length ? args.projectAddressCases : [null];
  for (const caseName of addressCases) {
    if (caseName !== null && !Object.prototype.hasOwnProperty.call(PROJECT_ADDRESS_CASES, caseName)) {
      throw new Error(`Unbekannter Projektadressfall: ${caseName}`);
    }
  }
  return sourceFixtures.flatMap((fixture) => modes.flatMap((mode) => addressCases.map((caseName) => {
    const variant = clone(fixture);
    const suffixes = [];
    if (mode) {
      variant.data.mode = mode;
      suffixes.push(`mode-${mode}`);
    }
    if (caseName) {
      variant.projectAddressCase = caseName;
      suffixes.push(`address-${caseName}`);
    }
    if (suffixes.length) variant.id = `${fixture.id}--${suffixes.join("--")}`;
    return variant;
  })));
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

function dataForFixture(fixture, args) {
  const data = clone(fixture.data);
  if (fixture.projectAddressCase) {
    const address = PROJECT_ADDRESS_CASES[fixture.projectAddressCase];
    data.project = address === null
      ? null
      : { ...(data.project || {}), ...address };
    data.settings = {
      ...(data.settings || {}),
      "pdf.footerUseUserData": "true",
      "pdf.footerName1": "Nicht verwenden: Profilname",
      "pdf.footerName2": "Nicht verwenden: Firmenprofil",
      "pdf.footerStreet": "Nicht verwenden: Profilweg 99",
      "pdf.footerZip": "00000",
      "pdf.footerCity": "Profilort",
    };
    data.userData = {
      name1: "Nicht verwenden: Benutzername",
      street: "Nicht verwenden: Benutzerweg 1",
      zip: "11111",
      city: "Benutzerort",
    };
  }
  let adapter = null;
  if (args.includeEditorLayout && fixture.kind === "protocol") {
    adapter = createBbmPdfAdapter();
    data.pdfEditorRegistry = adapter.getPdfRegistry();
    data.pdfEditorLayoutState = adapter.getCurrentPdfLayoutState();
  }
  if (!args.editorElement && !Number.isFinite(args.boundaryDelta)) return data;
  if (fixture.kind !== "protocol") throw new Error("M85-Editorcheck ist nur fuer Protokoll-Fixtures erlaubt.");
  adapter = adapter || createBbmPdfAdapter();
  const submit = (operation, payload, elementId = args.editorElement) => {
    const result = adapter.submitPdfChangeRequest({
      changeId: `editor-check-${operation}-${elementId}`,
      scopeId: "pdf.bbm.protocol",
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

async function readStandardHeaderAddress(win) {
  return win.webContents.executeJavaScript(`(() => {
    const header = document.querySelector(".v2HeaderFull:not(.v2HeaderFullSlot)");
    const right = header?.querySelector(":scope .v2HeaderRight") || null;
    const userBox = right?.querySelector(":scope > .v2UserBox") || null;
    if (!header || !right || !userBox) return null;
    const page = header.closest(".page");
    const orientation = String(document.querySelector(".printV2Root")?.dataset?.orientation || "portrait");
    const pageWidthMm = orientation === "landscape" ? 297 : 210;
    const pageHeightMm = orientation === "landscape" ? 210 : 297;
    const pageRect = page?.getBoundingClientRect?.() || {};
    const rect = (element) => {
      if (!element || !(pageRect.width > 0 && pageRect.height > 0)) return null;
      const value = element.getBoundingClientRect();
      const round = (number) => Math.round(Number(number || 0) * 1000) / 1000;
      return {
        x: round((value.left - pageRect.left) * pageWidthMm / pageRect.width),
        y: round((value.top - pageRect.top) * pageHeightMm / pageRect.height),
        width: round(value.width * pageWidthMm / pageRect.width),
        height: round(value.height * pageHeightMm / pageRect.height),
        right: round((value.right - pageRect.left) * pageWidthMm / pageRect.width),
        bottom: round((value.bottom - pageRect.top) * pageHeightMm / pageRect.height),
      };
    };
    const rows = Array.from(userBox.children || []);
    const headerRect = header.getBoundingClientRect();
    const boxRect = userBox.getBoundingClientRect();
    return {
      lines: rows.map((row) => String(row.textContent || "").trim()),
      text: String(userBox.textContent || "").trim(),
      placeholderPresent: String(userBox.textContent || "").includes("Projekt > Bearbeiten > Einstellungen"),
      legacyProfilePresent: String(userBox.textContent || "").includes("Nicht verwenden:"),
      withinFullHeader: boxRect.left >= headerRect.left - 1 && boxRect.right <= headerRect.right + 1 && boxRect.top >= headerRect.top - 1 && boxRect.bottom <= headerRect.bottom + 1,
      contentOverflow: rows.some((row) => row.scrollWidth > row.clientWidth + 1 || row.scrollHeight > row.clientHeight + 1),
      geometry: {
        fullHeader: rect(header),
        left: rect(header.querySelector(":scope .v2HeaderLeft")),
        right: rect(right),
        userBox: rect(userBox),
        pageCounter: rect(right.querySelector(":scope > .v2FullPageCounter")),
        divider: rect(header.querySelector(":scope > .v2FullDivider")),
      },
      editorTarget: {
        id: right.getAttribute("data-ui-inspector-id"),
        kind: right.getAttribute("data-ui-editor-kind"),
        label: right.getAttribute("data-ui-editor-label"),
        parent: right.getAttribute("data-ui-editor-parent"),
        editable: right.getAttribute("data-ui-editor-editable"),
        operations: right.getAttribute("data-ui-editor-ops"),
      },
    };
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
  const standardHeaderAddress = await readStandardHeaderAddress(win);

  let pdf = null;
  if (pdfDir) {
    fs.mkdirSync(pdfDir, { recursive: true });
    const filePath = path.join(pdfDir, `${fixture.id}.pdf`);
    const buffer = await win.webContents.printToPDF(createPrintToPdfOptions({ orientation: fixture.data.orientation }));
    fs.writeFileSync(filePath, buffer);
    pdf = { fileName: path.basename(filePath), bytes: buffer.length };
  }
  return { id: fixture.id, number: fixture.number, title: fixture.title, kind: fixture.kind, snapshot,
    previewMetadata: readyMessage?.previewMetadata || null, metaColumnGeometry, standardHeaderAddress, pdf };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fixtures = expandFixtureVariants(getM85Fixtures(args.fixtureIds), args);
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
