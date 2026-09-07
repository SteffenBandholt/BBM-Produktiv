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
const HELP = `SiGeKo S1.4a: realer bestehender Print-/Preview-/Editor-Regenerationsweg.
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

async function runWorker() {
  console.log("[S1.4a] Electron worker gestartet");
  const { app, BrowserWindow } = require("electron");
  let profile;
  let db;
  const report = { schemaVersion: 1, package: "S1.4a", ok: false, nativeEditorUiVerified: false, checks: {} };
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
    console.log("[S1.4a] Electron bereit; isolierte Datenbank und Entwicklungs-Testlizenz");
    const { getStatus } = require("../src/main/licensing/licenseService");
    const license = getStatus({ fresh: true });
    assert.equal(license.valid, true, "Bestehende Entwicklungs-Testlizenz fehlt");
    assert.ok(license.license.modules.includes("sigeko"));
    const { configureDatabaseMigrations, initDatabase } = require("../src/main/db/database");
    configureDatabaseMigrations({ ...license, license: { ...license.license, modules: ["sigeko"] } }, { allowLegacyImport: false });
    db = initDatabase();
    assert.ok(isPathInside(profile.rootPath, db.name), "DB muss im Abnahmeprofil liegen");
    const project = require("../src/main/db/projectsRepo").createProject({ project_number: "S14A", name: "SiGeKo PDF Technikabnahme" });
    const baseDir = path.join(profile.rootPath, "Ablage");
    require("../src/main/db/appSettingsRepo").appSettingsSetMany({ "pdf.protocolsDir": baseDir });
    const { REGISTRY, DOCUMENT_TYPE_ID } = require("../src/main/ui-editor/technicalPdfAdapter.cjs");
    assert.equal(DOCUMENT_TYPE_ID, "technical-neutral");
    assert.equal(REGISTRY.layoutModel, "fixed-layout");
    const { registerPrintIpc, generatePdfForUiEditor } = require("../src/main/ipc/printIpc");
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
    const invoke = (method) => caller.webContents.executeJavaScript(`window.${method}(${JSON.stringify(payload)})`, true);
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
    const previewWindow = BrowserWindow.getAllWindows().find((win) => !existingWindows.has(win.id) && win.webContents.getURL() === pathToFileURL(preview.filePath).href);
    assert.ok(previewWindow, "Bestehende interne PDF-Vorschau wurde nicht geoeffnet");
    const previewPdf = await inspectPdf(preview.filePath);
    assert.equal(previewPdf.text, stored.text);
    // Die bestehende Vorschau laedt dieselbe gespeicherte Datei erneut.
    await previewWindow.loadURL(pathToFileURL(preview.filePath).href);
    const reopened = await inspectPdf(preview.filePath);
    assert.equal(reopened.sha256, previewPdf.sha256, "Wiederoeffnen hat gespeicherten PDF-Inhalt veraendert");
    const screenshotPath = path.join(profile.rootPath, "internal-preview.png");
    fs.writeFileSync(screenshotPath, (await previewWindow.webContents.capturePage()).toPNG());
    report.checks.internalPreview = { filePath: preview.filePath, screenshotPath, reopenedUnchanged: true, pageCount: reopened.pageCount };

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
    report.checks.editorRegeneration = { elementId: editable.id, previousFontSize: before.fontSize, fontSize, metadata: generated, pdf: regeneratedPdf };
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
  const child = spawn(require("electron"), args, { cwd: ROOT, env: createSanitizedEnvironment(), stdio: "inherit" });
  const timeout = setTimeout(() => { console.error("[S1.4a] FAIL: Abnahme-Timeout"); child.kill("SIGTERM"); }, 180000);
  const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", (exitCode) => resolve(exitCode ?? 1)); }).finally(() => clearTimeout(timeout));
  const reportPath = path.join(profile.rootPath, "acceptance-result.json");
  if (!fs.existsSync(reportPath)) {
    fs.writeFileSync(reportPath, JSON.stringify({ schemaVersion: 1, package: "S1.4a", ok: false, nativeEditorUiVerified: false, checks: {}, error: { code: "ACCEPTANCE_WORKER_ABORTED", message: `Electron endete ohne Abnahmebericht (Exit ${code}); PDF-/Vorschau-Nachweis nicht erbracht.` } }, null, 2));
    console.error(`[S1.4a] FAIL: ${reportPath}`);
  }
  process.exitCode = code || (JSON.parse(fs.readFileSync(reportPath, "utf8")).ok === true ? 0 : 1);
}

if (process.versions.electron && process.argv.includes("--worker")) void runWorker();
else if (require.main === module) {
  if (process.argv.includes("--help")) console.log(HELP);
  else launch().catch((error) => { console.error(`[S1.4a] FAIL: ${error.stack || error}`); process.exitCode = 1; });
}

module.exports = { inspectPdf, runWorker, launch };
