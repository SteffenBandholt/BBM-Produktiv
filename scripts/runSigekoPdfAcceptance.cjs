#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const { createAcceptanceProfile, createSanitizedEnvironment } = require("./runIsolatedUiEditorAcceptance.cjs");
const { ACCEPTANCE_SWITCH, configureUiEditorAcceptanceProfile, isPathInside } = require("../src/main/startup/uiEditorAcceptanceProfile");

const ROOT = path.resolve(__dirname, "..");
const HELP = `SiGeKo S1.4 / S1.4a: bestehender Print-/Preview-/Editor-Regenerationsweg.
  node scripts/runSigekoPdfAcceptance.cjs
  node scripts/runSigekoPdfAcceptance.cjs --headless
  xvfb-run -a node scripts/runSigekoPdfAcceptance.cjs

Worker mit einem durch createAcceptanceProfile() erzeugten Temp-Profil:
  electron scripts/runSigekoPdfAcceptance.cjs --worker ${ACCEPTANCE_SWITCH}<Temp-Profil>

--headless versucht Chromium Ozone ohne Display. Ein nicht unterstuetztes
Backend ist ein fehlgeschlagener Lauf, kein bestandener PDF-Nachweis.
Unter Linux als root erhaelt ausschliesslich dieser Abnahmeprozess --no-sandbox.
PDFs, Screenshot und acceptance-result.json bleiben im isolierten Temp-Profil.
Die native Windows-Editoroberflaeche ist nicht Teil dieser technischen Abnahme.`;

async function inspectPdf(filePath) {
  const bytes = fs.readFileSync(filePath);
  assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-", "Keine echte PDF-Datei");
  const { getDocument } = await import(pathToFileURL(require.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href);
  const document = await getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, disableFontFace: true }).promise;
  try {
    assert.equal(document.numPages, 1, "Neutraler Technikbeleg muss genau eine Seite besitzen");
    const page = await document.getPage(1);
    const content = await page.getTextContent();
    const textItems = content.items.filter((item) => item.str?.trim()).map((item) => ({ text: item.str, fontSizePoints: Math.hypot(item.transform[2], item.transform[3]) }));
    return { filePath, bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex"), pageCount: document.numPages, pageBox: page.view, text: content.items.map((item) => item.str || "").join(" "), textItems };
  } finally { await document.destroy(); }
}

function pdfPagePaintEvidence(bitmap, width, height) {
  const white = (x, y) => {
    const offset = (y * width + x) * 4;
    return bitmap[offset] > 240 && bitmap[offset + 1] > 240 && bitmap[offset + 2] > 240;
  };
  let whiteSamples = 0;
  let samples = 0;
  for (let y = 0; y < height; y += 4) for (let x = 0; x < width; x += 4) {
    samples += 1;
    if (white(x, y)) whiteSamples += 1;
  }
  const scanY = Math.floor(height * 0.65);
  let start = 0;
  let pageLeft = 0;
  let pageRight = 0;
  for (let x = 0; x <= width; x += 1) {
    if (x < width && white(x, scanY)) continue;
    if (x - start > pageRight - pageLeft) { pageLeft = start; pageRight = x; }
    start = x + 1;
  }
  let inkSamples = 0;
  for (let y = Math.max(15, Math.floor(height * 0.1)); y < Math.min(height - 15, height * 0.75); y += 2) {
    for (let x = pageLeft + 12; x < pageRight - 12; x += 2) {
      const offset = (y * width + x) * 4;
      if (bitmap[offset] < 100 && bitmap[offset + 1] < 100 && bitmap[offset + 2] < 100 &&
          white(x, y - 14) && white(x, y + 14)) inkSamples += 1;
    }
  }
  const whiteFraction = whiteSamples / Math.max(samples, 1);
  return { visible: width > 0 && height > 0 && whiteFraction > 0.2 && whiteFraction < 0.98 &&
    pageRight - pageLeft > width * 0.3 && inkSamples >= 10, width, height, whiteFraction, pageLeft, pageRight, inkSamples };
}

async function capturePaintedPdfPreview(window, screenshotPath) {
  const deadline = Date.now() + 15000;
  let previousHash = "";
  let lastImage;
  let evidence;
  while (Date.now() < deadline) {
    lastImage = await window.webContents.capturePage();
    const { width, height } = lastImage.getSize();
    evidence = pdfPagePaintEvidence(lastImage.toBitmap(), width, height);
    const hash = crypto.createHash("sha256").update(lastImage.toPNG()).digest("hex");
    if (evidence.visible && hash === previousHash) {
      fs.writeFileSync(screenshotPath, lastImage.toPNG());
      return { ...evidence, stableFrames: 2, screenshotSha256: hash };
    }
    previousHash = evidence.visible ? hash : "";
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  if (lastImage) fs.writeFileSync(screenshotPath, lastImage.toPNG());
  const diagnostics = { visible: window.isVisible(), focused: window.isFocused(), url: window.webContents.getURL(), frames: [] };
  for (const frame of window.webContents.mainFrame.framesInSubtree) {
    try {
      diagnostics.frames.push({ url: frame.url, state: await frame.executeJavaScript("({ready:document.readyState,visibility:document.visibilityState,body:document.body?.innerHTML.slice(0,1500)})") });
    } catch (error) { diagnostics.frames.push({ url: frame.url, error: error.message }); }
  }
  throw Object.assign(new Error(`Interne PDF-Vorschau zeigt keine stabil gezeichnete Seite mit Text: ${JSON.stringify(evidence)}; Diagnose: ${JSON.stringify(diagnostics)}`), { code: "PDF_PREVIEW_PAINT_TIMEOUT" });
}

function pdfInventory(directories) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else if (entry.isFile() && /\.pdf$/i.test(entry.name)) files.push({ filePath, sha256: crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex") });
    }
  };
  directories.forEach(visit);
  return files.sort((left, right) => left.filePath.localeCompare(right.filePath));
}

async function runWorker() {
  console.log("[S1.4a] Electron worker gestartet");
  const { app, BrowserWindow, ipcMain } = require("electron");
  let profile;
  let db;
  const report = { schemaVersion: 1, package: "S1.4", ok: false, nativeEditorUiVerified: false, checks: {} };
  try {
    app.setAppPath(ROOT);
    // Vor DB-/Lizenz-/Print-Import: vorhandenes validiertes Abnahmeprofil.
    profile = configureUiEditorAcceptanceProfile({ electronApp: app });
    assert.equal(profile.enabled, true, "Isoliertes Abnahmeprofil erforderlich");
    const tempPath = path.join(profile.rootPath, "temp");
    fs.mkdirSync(tempPath, { recursive: true });
    app.setPath("temp", tempPath);
    app.disableHardwareAcceleration();
    await app.whenReady();
    console.log("[S1.4] Electron bereit; isolierte Datenbank und kontrollierter SiGeKo-Lizenzstatus");
    const { createPdfAcceptanceLicense } = require("./helpers/pdfAcceptanceLicense.cjs");
    const licenseFixture = createPdfAcceptanceLicense({ electronApp: app, profile });
    const license = licenseFixture.getStatus({ fresh: true });
    assert.equal(license.valid, true);
    assert.deepEqual(license.license.modules, ["sigeko"]);
    licenseFixture.enforceLicensedFeature("sigeko");
    for (const moduleId of ["protokoll", "restarbeiten", "rechnung"]) {
      assert.throws(() => licenseFixture.enforceLicensedFeature(moduleId), new RegExp(`FEATURE_NOT_ALLOWED:${moduleId}`));
    }
    report.checks.modulePermission = { source: licenseFixture.source, modules: license.license.modules,
      cryptographicLicenseVerified: licenseFixture.cryptographicLicenseVerified,
      developmentOverridesEnabled: licenseFixture.developmentOverridesEnabled, otherModulesDenied: true };
    const { configureDatabaseMigrations, initDatabase } = require("../src/main/db/database");
    configureDatabaseMigrations(license, { allowLegacyImport: false });
    db = initDatabase();
    assert.ok(isPathInside(profile.rootPath, db.name), "DB muss im Abnahmeprofil liegen");
    const project = require("../src/main/db/projectsRepo").createProject({ project_number: "S14A", name: "SiGeKo PDF Technikabnahme" });
    const baseDir = path.join(profile.rootPath, "Ablage");
    require("../src/main/db/appSettingsRepo").appSettingsSetMany({ "pdf.protocolsDir": baseDir });
    const { REGISTRY, DOCUMENT_TYPE_ID } = require("../src/main/ui-editor/technicalPdfAdapter.cjs");
    assert.equal(DOCUMENT_TYPE_ID, "technical-neutral");
    assert.equal(REGISTRY.layoutModel, "fixed-layout");
    const { registerPrintIpc, generatePdfForUiEditor, openInternalPdfPreview } = require("../src/main/ipc/printIpc");
    registerPrintIpc();
    const { createPdfEditorAdapterResolver } = require("../src/main/ui-editor/pdfAdapterRegistry.cjs");
    const uiEditorRoot = path.join(profile.userDataPath, "ui-editor");
    const resolver = createPdfEditorAdapterResolver({ profileBaseRoot: path.join(uiEditorRoot, "profiles"), registrationRoot: uiEditorRoot, regeneratePdf: generatePdfForUiEditor });
    const registered = resolver.activateAcceptedDocumentType(DOCUMENT_TYPE_ID);
    assert.equal(registered.editorAvailable, true, "Technischer PDF-Typ nicht editorfaehig akzeptiert");
    const payload = {
      mode: "provider", documentTypeId: DOCUMENT_TYPE_ID, projectId: project.id, documentId: "s14a-proof", silent: true,
      providerRequest: { moduleId: "sigeko", providerId: "technical-neutral", projectId: project.id, documentId: "s14a-proof",
        data: { title: "S1.4a Techniknachweis", body: "Neutraler PDF-Beleg aus dem bestehenden BBM-Druckweg." }, storage: { target: "Unterlagen", baseDir } },
    };
    console.log("[S1.4a] Registry akzeptiert; echtes BrowserWindow wird erstellt");
    const caller = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, sandbox: false, nodeIntegration: false, preload: path.join(ROOT, "src/main/preload.js") } });
    console.log("[S1.4a] BrowserWindow erstellt; produktive Preload-/IPC-Bruecke wird geladen");
    await caller.loadURL("data:text/html;charset=utf-8,<title>S1.4a IPC Abnahme</title>");
    const invoke = (method, request = payload) => caller.webContents.executeJavaScript(`window.${method}(${JSON.stringify(request)})`, true);
    const saved = await invoke("bbmDb.printHtmlToPdf");
    assert.equal(saved.ok, true, JSON.stringify(saved));
    assert.ok(isPathInside(baseDir, saved.filePath), "PDF ausserhalb des festgelegten Test-Ablageziels");
    const stored = await inspectPdf(saved.filePath);
    assert.ok(stored.text.includes(payload.providerRequest.data.title), "Titel fehlt im echten PDF");
    assert.ok(stored.text.includes(payload.providerRequest.data.body), "Text fehlt im echten PDF");
    report.checks.savedPdf = stored;

    const existingWindows = new Set(BrowserWindow.getAllWindows().map((win) => win.id));
    const preview = await invoke("bbmPrint.printPdfAndPreviewInternal");
    assert.equal(preview.ok, true, JSON.stringify(preview));
    let previewWindow = BrowserWindow.getAllWindows().find((win) => !existingWindows.has(win.id) && win.webContents.getURL() === pathToFileURL(preview.filePath).href);
    assert.ok(previewWindow, "Bestehende interne PDF-Vorschau wurde nicht geoeffnet");
    const previewPdf = await inspectPdf(preview.filePath);
    assert.equal(previewPdf.text, stored.text);
    const screenshotPath = path.join(profile.rootPath, "internal-preview.png");
    // PDF viewer initialization outlives loadURL; verify the first display.
    await capturePaintedPdfPreview(previewWindow, screenshotPath);
    // Real reopen: close the viewer, then use the SAME existing preview service
    // on the stored file. Reloading an active Chromium PDF plugin is not reopen.
    const previousWindowId = previewWindow.id;
    await new Promise((resolve) => { previewWindow.once("closed", resolve); previewWindow.close(); });
    const beforeReopen = new Set(BrowserWindow.getAllWindows().map((window) => window.id));
    const reopenResult = await openInternalPdfPreview({ filePath: preview.filePath, title: "PDF Vorschau" });
    assert.equal(reopenResult.ok, true);
    previewWindow = BrowserWindow.getAllWindows().find((window) => !beforeReopen.has(window.id) && window.webContents.getURL() === pathToFileURL(preview.filePath).href);
    assert.ok(previewWindow, "Gespeicherte PDF wurde nicht in der bestehenden Vorschaufunktion geoeffnet");
    assert.notEqual(previewWindow.id, previousWindowId);
    const reopened = await inspectPdf(preview.filePath);
    assert.equal(reopened.sha256, previewPdf.sha256, "Wiederoeffnen hat gespeicherten PDF-Inhalt veraendert");
    const paint = await capturePaintedPdfPreview(previewWindow, screenshotPath);
    report.checks.internalPreview = { filePath: preview.filePath, screenshotPath, reopenedUnchanged: true,
      reopenedThroughExistingPreviewService: true, previousWindowClosed: true, pageCount: reopened.pageCount, paint };
    if (process.argv.includes("--preview-only")) { report.package = "S1.4-preview-only"; report.ok = true; return; }

    const beforeOverflowPdfs = pdfInventory([baseDir, tempPath]);
    const readyMessages = new Map();
    const onHtmlReady = (event, message) => readyMessages.set(message?.jobId, { sender: event.sender, message });
    ipcMain.on("print:ready", onHtmlReady);
    try {
      const htmlPreview = await invoke("bbmDb.printOpenHtmlPreview");
      assert.equal(htmlPreview.ok, true, JSON.stringify(htmlPreview));
      const deadline = Date.now() + 15000;
      while (!readyMessages.has(htmlPreview.jobId) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100));
      const ready = readyMessages.get(htmlPreview.jobId);
      assert.ok(ready, "Echte HTML-Vorschau meldet kein print:ready");
      assert.equal(ready.message.ok, true, JSON.stringify(ready.message));
      const guardUrl = pathToFileURL(path.join(ROOT, "src/renderer/print/layout/ProviderDocument.js")).href;
      const overflow = await ready.sender.executeJavaScript(`(async () => {
        const { validateProviderDocumentLayout } = await import(${JSON.stringify(guardUrl)});
        const definitions = ${JSON.stringify(REGISTRY.elements)};
        const declaredNodes = new Map(definitions.map((definition) => [definition.id, document.querySelector(definition.rendererKey)]));
        const mountedRefs = definitions.map((definition) => {
          const node = declaredNodes.get(definition.id);
          const parent = declaredNodes.get(definition.parentId);
          return { id: node?.getAttribute("data-ui-inspector-id"), kind: node?.getAttribute("data-ui-editor-kind"),
            label: node?.getAttribute("data-ui-editor-label"), parent: node?.getAttribute("data-ui-editor-parent"),
            editable: node?.getAttribute("data-ui-editor-editable"), ops: node?.getAttribute("data-ui-editor-ops"),
            connected: node?.isConnected === true, matches: document.querySelectorAll(definition.rendererKey).length,
            parentContains: definition.parentId === null || Boolean(parent?.contains(node)) };
        });
        const root = document.querySelector(".printRoot");
        const body = root.querySelector(".providerBody");
        validateProviderDocumentLayout(root);
        const originalHeight = body.style.height;
        const beforeHeight = body.getBoundingClientRect().height;
        let errorCode = null;
        try {
          body.style.height = "400mm";
          try { validateProviderDocumentLayout(root); }
          catch (error) { errorCode = error.code || error.message; }
        } finally { body.style.height = originalHeight; }
        validateProviderDocumentLayout(root);
        return { errorCode, beforeHeight, restoredHeight: body.getBoundingClientRect().height, mountedRefs };
      })()`, true);
      assert.equal(overflow.mountedRefs.length, 4, "Vier explizit deklarierte PDF-Refs erwartet");
      assert.deepEqual(overflow.mountedRefs, REGISTRY.elements.map((definition) => ({
        id: definition.id, kind: definition.kind, label: definition.name, parent: definition.parentId || "",
        editable: String(definition.editable === true), ops: (definition.allowedOps || definition.capabilities || []).join(","),
        connected: true, matches: 1, parentContains: true,
      })), "Gemountete explizite PDF-Refs weichen vom Editorvertrag ab");
      assert.equal(overflow.errorCode, "PDF_PROVIDER_LAYOUT_OVERFLOW");
      assert.equal(overflow.restoredHeight, overflow.beforeHeight);
      assert.deepEqual(pdfInventory([baseDir, tempPath]), beforeOverflowPdfs, "HTML-Overflowpruefung hat PDF-Dateien angelegt oder veraendert");
      report.checks.rendererOverflow = { ...overflow, pdfFilesUnchanged: true };
      BrowserWindow.fromWebContents(ready.sender)?.close();
    } finally { ipcMain.removeListener("print:ready", onHtmlReady); }

    const context = { projectId: project.id, documentId: payload.documentId, documentTypeId: DOCUMENT_TYPE_ID, providerRequest: payload.providerRequest };
    assert.equal(resolver.setActiveDocumentContext(context).ok, true);
    resolver.preparePdfEditorSessionBaseline();
    const editable = resolver.getPdfRegistry().elements.find((element) => element.capabilities?.includes("textResize"));
    assert.ok(editable, "Neutraler Text muss explizit textResize registrieren");
    const before = resolver.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === editable.id);
    const fontSize = Number(before.fontSize) + 1;
    const change = resolver.submitPdfChangeRequest({ changeId: "s14a-font-proof", scopeId: REGISTRY.scopeId, elementId: editable.id, operation: "textResize", payload: { text: { fontSize } } });
    assert.equal(change.success, true, JSON.stringify(change));
    assert.equal(resolver.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === editable.id).fontSize, fontSize);
    const generated = await resolver.regeneratePdfPreview();
    assert.equal(generated.pageCount, 1, "Echte Render-Metadaten enthalten nicht genau eine Seite");
    assert.equal(generated.state, "current");
    const regeneratedPdf = await inspectPdf(generated.controlledOutputPath);
    assert.equal(regeneratedPdf.text, stored.text, "Layoutaenderung darf Fachtext nicht veraendern");
    assert.ok(regeneratedPdf.textItems.some((item) => stored.textItems.some((old) => old.text === item.text && item.fontSizePoints > old.fontSizePoints + 0.5)), "Schriftgroessen-Aenderung ist im erzeugten PDF nicht nachweisbar");
    assert.ok(isPathInside(profile.rootPath, generated.controlledOutputPath));
    assert.ok(Array.isArray(generated.renderBounds) && generated.renderBounds.some((entry) => entry.elementId === editable.id || entry.id === editable.id), "Bearbeitetes Element fehlt in echten Render-Bounds");
    for (const definition of REGISTRY.elements.filter((entry) => entry.kind === "text")) {
      const measured = generated.renderBounds.find((entry) => entry.elementId === definition.id)?.box;
      assert.ok(measured, `Reale Bounds fehlen: ${definition.id}`);
      for (const field of ["x", "y", "width", "height"]) {
        assert.ok(Math.abs(measured[field] - definition.baseline[field]) < 0.3,
          `Registry-/DOM-Abweichung ${definition.id}.${field}: ${measured[field]} statt ${definition.baseline[field]}`);
      }
    }
    report.checks.editorRegeneration = { elementId: editable.id, previousFontSize: before.fontSize, fontSize, metadata: generated, pdf: regeneratedPdf };
    const { verifyPdfExecutionFailures } = require("./helpers/pdfExecutionAcceptance.cjs");
    report.checks.executionFailures = await verifyPdfExecutionFailures({ app, BrowserWindow, ipcMain, invoke,
      payload, profile, baseDir, tempPath, licenseFixture, pdfInventory, persistentWindowIds: [caller.id, previewWindow.id] });
    const recovered = await invoke("bbmDb.printHtmlToPdf");
    assert.equal(recovered.ok, true, JSON.stringify(recovered));
    const recoveredPdf = await inspectPdf(recovered.filePath);
    assert.equal(recoveredPdf.text, stored.text);
    report.checks.recoveryAfterFailures = { ok: true, pdf: recoveredPdf };
    report.ok = true;
  } catch (error) {
    report.error = { message: error?.message || String(error), code: error?.code || null, validationErrors: error?.validationErrors || [], stack: error?.stack || "" };
    console.error(`[S1.4a] FAIL: ${report.error.stack}`);
  } finally {
    for (const win of BrowserWindow.getAllWindows()) win.destroy();
    if (db?.open) db.close();
    if (profile) {
      const reportPath = path.join(profile.rootPath, "acceptance-result.json");
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`[S1.4a] ${report.ok ? "PASS" : "FAIL"}: ${reportPath}`);
    }
    app.exit(report.ok ? 0 : 1);
  }
}

async function launch() {
  const profile = createAcceptanceProfile();
  console.log(`[S1.4a] Isoliertes Profil bleibt erhalten: ${profile.rootPath}`);
  const args = [];
  if (process.platform === "linux" && process.getuid?.() === 0) args.push("--no-sandbox");
  if (process.argv.includes("--headless")) args.push("--ozone-platform=headless");
  args.push(__filename, "--worker", `${ACCEPTANCE_SWITCH}${profile.rootPath}`);
  if (process.argv.includes("--preview-only")) args.push("--preview-only");
  const child = spawn(require("electron"), args, { cwd: ROOT, env: createSanitizedEnvironment(), stdio: "inherit" });
  const timeout = setTimeout(() => { console.error("[S1.4a] FAIL: Abnahme-Timeout"); child.kill("SIGTERM"); }, 180000);
  const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", (exitCode) => resolve(exitCode ?? 1)); }).finally(() => clearTimeout(timeout));
  const reportPath = path.join(profile.rootPath, "acceptance-result.json");
  if (!fs.existsSync(reportPath)) {
    fs.writeFileSync(reportPath, JSON.stringify({ schemaVersion: 1, package: "S1.4", ok: false, nativeEditorUiVerified: false, checks: {}, error: { code: "ACCEPTANCE_WORKER_ABORTED", message: `Electron endete ohne Abnahmebericht (Exit ${code}); PDF-/Vorschau-Nachweis nicht erbracht.` } }, null, 2));
    console.error(`[S1.4a] FAIL: ${reportPath}`);
  }
  process.exitCode = code || (JSON.parse(fs.readFileSync(reportPath, "utf8")).ok === true ? 0 : 1);
}

if (process.versions.electron && process.argv.includes("--worker")) void runWorker();
else if (require.main === module) {
  if (process.argv.includes("--help")) console.log(HELP);
  else launch().catch((error) => { console.error(`[S1.4a] FAIL: ${error.stack || error}`); process.exitCode = 1; });
}

module.exports = { inspectPdf, pdfPagePaintEvidence, runWorker, launch };
