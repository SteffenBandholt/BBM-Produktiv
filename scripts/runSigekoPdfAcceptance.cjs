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
    assert.equal(document.numPages, 1, "Einseitiger Abnahmebeleg muss genau eine Seite besitzen");
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
  // A single horizontal line can cross document text and split a fully painted
  // page into short white runs. Locate the same wide page edges on several
  // separated rows instead; toolbar, thumbnail and isolated white bands do not
  // establish a page. The white-area and actual-ink requirements stay unchanged.
  const rowRuns = [];
  for (let row = 0; row <= 30; row += 1) {
    const y = Math.floor(height * (0.2 + row * 0.02));
    let start = 0, left = 0, right = 0;
    for (let x = 0; x <= width; x += 1) {
      if (x < width && white(x, y)) continue;
      if (x - start > right - left) { left = start; right = x; }
      start = x + 1;
    }
    rowRuns.push({ left, right, y });
  }
  let pageLeft = 0;
  let pageRight = 0;
  let supportingRows = 0;
  for (const candidate of rowRuns) {
    const matches = rowRuns.filter(run => Math.abs(run.left - candidate.left) <= 2 && Math.abs(run.right - candidate.right) <= 2);
    if (matches.length < 3 || Math.max(...matches.map(run => run.y)) - Math.min(...matches.map(run => run.y)) < height * 0.1) continue;
    const left = Math.max(...matches.map(run => run.left)), right = Math.min(...matches.map(run => run.right));
    if (right - left > pageRight - pageLeft) { pageLeft = left; pageRight = right; supportingRows = matches.length; }
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
    pageRight - pageLeft > width * 0.3 && inkSamples >= 10, width, height, whiteFraction, pageLeft, pageRight, supportingRows, inkSamples };
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
    let timeout;
    try {
      const state = await Promise.race([
        frame.executeJavaScript("({ready:document.readyState,visibility:document.visibilityState,body:document.body?.innerHTML.slice(0,1500)})"),
        new Promise((resolve) => { timeout = setTimeout(() => resolve({ diagnosticTimeout: true }), 1000); }),
      ]);
      diagnostics.frames.push({ url: frame.url, state });
    } catch (error) { diagnostics.frames.push({ url: frame.url, error: error.message }); }
    finally { clearTimeout(timeout); }
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

async function runPreNotificationAcceptance({ db, profile, baseDir, tempPath, BrowserWindow, ipcMain, invoke, resolver }) {
  const { REGISTRY, DOCUMENT_TYPE_ID, SCOPE_ID } = require("../src/main/ui-editor/sigekoPreNotificationPdfAdapter.cjs");
  const projects = require("../src/main/db/projectsRepo");
  const drafts = require("../src/main/domain/sigeko/PreNotificationService").createPreNotificationService();
  const roles = require("../src/main/domain/sigeko/SigekoProjectService").createSigekoProjectService();
  const authorities = require("../src/main/domain/sigeko/AuthorityService").createAuthorityService();
  const assignments = require("../src/main/domain/sigeko/ProjectAuthorityService").createProjectAuthorityService();
  require("../src/main/ipc/sigekoIpc").registerSigekoIpc({ ipcMain });
  const address = { street: "Baustraße 7", zip: "00123", city: "Köln" };
  const project = projects.createProject({ project_number: "S53B2", name: "Vorankündigung Abnahme", ...address, geplanter_baubeginn: "2028-02-29" });
  const contact = name => ({ name, street: "Grüner Weg 3", zip: "01234", city: "München", phone: "0123 456", email: "kontakt@example.test" });
  db.prepare("INSERT INTO firms (id,name,street,zip,city,phone,email) VALUES (?,?,?,?,?,?,?)")
    .run("s53b2-builder", "Bauherr GmbH", "Bauherrenweg 1", "00123", "Köln", "0123 789", "bauherr@example.test");
  projects.updateProject({ id: project.id, bauherr: { kind: "global_firm", id: "s53b2-builder" } });
  db.prepare("INSERT INTO project_firms (id,project_id,name,street,zip,city,use_project_participant) VALUES (?,?,?,?,?,?,1)")
    .run("s53b2-firm", project.id, "Baufirma Anlage", "Firmenweg 2", "00123", "Köln");
  roles.saveProjectData({ projectId: project.id, planning: { source: "free", data: contact("Planung Müller") },
    executionSameAsPlanning: false, execution: { source: "free", data: contact("Ausführung Weiß") } });
  let authority = authorities.saveAuthorityRecord({ patch: { category: "LABOR_AUTHORITY", organization: "Amt für Arbeitsschutz",
    street: "Amtsweg 2", zip: "54321", city: "Düsseldorf", phone: "0123 456", email: "amt@example.test",
    source: "Isolierte Testquelle", verification_note: "Isolierte Testbestätigung", scope_street: address.street, scope_zip: address.zip, scope_city: address.city } });
  authority = authorities.confirmAuthorityRecord({ id: authority.id, expectedRevision: authority.revision });
  assignments.assignProjectAuthority({ projectId: project.id, category: authority.category, sourceId: authority.id, sourceRevision: authority.revision,
    expectedRevision: 0, expectedAddress: address, status: "confirmed", note: "Isolierte Testbaustelle" });
  const read = () => drafts.getPreNotification({ projectId: project.id });
  const save = patch => drafts.savePreNotification({ projectId: project.id, expectedRevision: read().record?.revision || 0, patch });
  const request = () => ({ projectId: project.id, expectedRevision: read().record?.revision || 0 });
  const rows = () => db.prepare("SELECT * FROM sigeko_documents WHERE project_id=? ORDER BY created_at,id").all(project.id);
  const call = async (operation, payload = request()) => {
    const result = await invoke(`bbmDb.sigeko${operation}`, payload); assert.equal(result.ok, true, JSON.stringify(result)); return result.data;
  };
  const root = path.dirname(require("../src/main/ipc/projectStoragePaths").createProjectStorageAccess().resolve({ moduleId: "sigeko", projectId: project.id }).moduleDir);
  const fileFor = (document, kind) => path.join(root, ...document.files.find(file => file.kind === kind).projectRelativePath.split("/"));
  save({ building_type_override: "Neubau Wohnhaus", duration_months: 7, max_workers: 0, employer_count: 13, self_employed_count: 2 });
  const first = (await call("CreatePreNotificationPdf")).document;
  assert.equal(rows().length, 1); assert.deepEqual(first.files.map(file => file.kind), ["main"]);
  const firstPdf = await inspectPdf(fileFor(first, "main"));
  for (const text of ["Vorankündigung", "Bauherr GmbH", "Baustraße 7", "Amt für Arbeitsschutz", "Planung Müller", "Ausführung Weiß", "29.02.2028", "Neubau Wohnhaus", "Noch nicht bekannt", "Nicht vorhanden"]) assert.ok(firstPdf.text.includes(text), `Vorankündigungs-PDF enthält nicht: ${text}`);
  assert.equal(firstPdf.sha256, first.files[0].sha256); assert.equal(firstPdf.bytes, first.files[0].byteSize);
  assert.ok(Math.abs(firstPdf.pageBox[2] - 595.28) < 1 && Math.abs(firstPdf.pageBox[3] - 841.89) < 1, "Vorankündigung muss A4-Hochformat sein");
  const beforePreview = rows(); const beforeWindows = new Set(BrowserWindow.getAllWindows().map(win => win.id));
  await call("PreviewPreNotificationPdf"); assert.deepEqual(rows(), beforePreview);
  const previewWindow = BrowserWindow.getAllWindows().find(win => !beforeWindows.has(win.id) && win.webContents.getURL().startsWith("file:") && win.webContents.getURL().includes(".pdf"));
  assert.ok(previewWindow, "VA-Vorschau öffnet kein vorhandenes internes PDF-Fenster");
  const previewScreenshot = path.join(profile.rootPath, "vorankuendigung-preview.png");
  const paint = await capturePaintedPdfPreview(previewWindow, previewScreenshot); previewWindow.close();

  const { context } = await call("PreparePreNotificationPdfEditor");
  const payload = { mode: "provider", documentTypeId: DOCUMENT_TYPE_ID, projectId: project.id, documentId: context.documentId,
    providerRequest: context.providerRequest, targetDir: "temp", silent: true };
  const messages = new Map(); const onReady = (event, message) => messages.set(message?.jobId, { sender: event.sender, message });
  ipcMain.on("print:ready", onReady);
  let mounted;
  try {
    const html = await invoke("bbmDb.printOpenHtmlPreview", payload); assert.equal(html.ok, true, JSON.stringify(html));
    const deadline = Date.now() + 15000;
    while (!messages.has(html.jobId) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
    const ready = messages.get(html.jobId); assert.ok(ready); assert.equal(ready.message.ok, true, JSON.stringify(ready.message));
    const guardUrl = pathToFileURL(path.join(ROOT, "src/renderer/modules/sigeko/print/PreNotificationPdfContent.js")).href;
    mounted = await ready.sender.executeJavaScript(`(async () => {
      const { validatePreNotificationPdfLayout } = await import(${JSON.stringify(guardUrl)});
      const definitions = ${JSON.stringify(REGISTRY.elements)};
      const root = document.querySelector('.printRoot'); const data = root._bbmRuntimeData;
      const refs = definitions.map(definition => {
        const matches = definition.kind === 'document' ? [root] : root.querySelectorAll(definition.rendererKey);
        const node = matches[0]; const parent = definitions.find(entry => entry.id === definition.parentId);
        const parentNode = !parent ? null : parent.kind === 'document' ? root : root.querySelector(parent.rendererKey);
        return { id: node?.getAttribute('data-ui-inspector-id'), kind: node?.getAttribute('data-ui-editor-kind'), label: node?.getAttribute('data-ui-editor-label'),
          parent: node?.getAttribute('data-ui-editor-parent'), editable: node?.getAttribute('data-ui-editor-editable'), ops: node?.getAttribute('data-ui-editor-ops'),
          matches: matches.length, connected: node?.isConnected === true, parentContains: !parent || parentNode?.contains(node) === true };
      });
      validatePreNotificationPdfLayout(root, data);
      const element = suffix => root.querySelector('[data-sigeko-va-pdf="' + suffix + '"]');
      const contents = Object.fromEntries(['p5.planning.name','p5.execution.name','p6.duration.value','p7.value','p8.employers.value','p8.selfEmployed.value','signature.placeDate.blank','signature.signer.blank'].map(suffix => [suffix, element(suffix).textContent]));
      const field = element('p3.value'), old = field.textContent; let overflow;
      try { field.textContent = 'Sehr langer Bauvorhabentext '.repeat(100); try { validatePreNotificationPdfLayout(root, data); }
        catch(error) { overflow = { code: error.code, field: error.field, message: error.message }; }
      } finally { field.textContent = old; }
      validatePreNotificationPdfLayout(root, data);
      return { refs, contents, overflow, pageCount: root.querySelectorAll('.page').length, bodyTop: root.querySelector('.sigekoVaBody').getBoundingClientRect().top,
        sharedHeaderBottom: root.querySelector('.v2HeaderFull').getBoundingClientRect().bottom };
    })()`, true);
    assert.deepEqual(mounted.refs, REGISTRY.elements.map(entry => ({ id: entry.id, kind: entry.kind, label: entry.name, parent: entry.parentId || "",
      editable: String(entry.editable), ops: entry.allowedOps.join(","), matches: 1, connected: true, parentContains: true })));
    assert.equal(mounted.pageCount, 1); assert.ok(mounted.bodyTop > mounted.sharedHeaderBottom);
    assert.deepEqual(mounted.contents, { "p5.planning.name": "Planung Müller", "p5.execution.name": "Ausführung Weiß", "p6.duration.value": "7", "p7.value": "0",
      "p8.employers.value": "13", "p8.selfEmployed.value": "2", "signature.placeDate.blank": "", "signature.signer.blank": "" });
    assert.equal(mounted.overflow?.code, "PDF_PROVIDER_LAYOUT_OVERFLOW"); assert.equal(mounted.overflow?.field, "p3.value");
    BrowserWindow.fromWebContents(ready.sender)?.close();
  } finally { ipcMain.removeListener("print:ready", onReady); }

  assert.equal(resolver.setActiveDocumentContext(context).ok, true); resolver.preparePdfEditorSessionBaseline();
  const elementId = `${SCOPE_ID}.p3.value`, initial = resolver.getCurrentPdfLayoutState();
  const change = resolver.submitPdfChangeRequest({ changeId: "s53b2-font", scopeId: SCOPE_ID, elementId, operation: "textResize", payload: { text: { fontSize: 10 } } });
  assert.equal(change.success, true, JSON.stringify(change));
  const generated = await resolver.regeneratePdfPreview(); const editedPdf = await inspectPdf(generated.controlledOutputPath);
  assert.equal(generated.pageCount, 1); assert.equal(generated.renderBounds.length, 81);
  assert.equal(editedPdf.text, firstPdf.text, "PDF-Layoutbearbeitung verändert Fachtext");
  assert.ok(editedPdf.textItems.some(item => item.text === "Neubau Wohnhaus" && item.fontSizePoints > 9.5), "Echte PDF enthält die 10pt-Schriftänderung nicht");
  assert.equal(resolver.rollbackPdfEditorSessionPreparation({ previousLayoutState: initial }), true);
  const undone = await resolver.regeneratePdfPreview(); const undonePdf = await inspectPdf(undone.controlledOutputPath);
  assert.ok(undonePdf.textItems.some(item => item.text === "Neubau Wohnhaus" && item.fontSizePoints < 9.5));
  assert.deepEqual(rows(), beforePreview); assert.equal((await inspectPdf(fileFor(first, "main"))).sha256, firstPdf.sha256);

  save({ firms_mode: "attachment" });
  const second = (await call("CreatePreNotificationPdf")).document; assert.notEqual(second.id, first.id); assert.equal(rows().length, 2);
  assert.deepEqual(second.files.map(file => file.kind), ["main", "firms"]);
  const secondPdf = await inspectPdf(fileFor(second, "main")), firmsPdf = await inspectPdf(fileFor(second, "firms"));
  assert.ok(secondPdf.text.includes("Firmenliste siehe Anlage")); assert.ok(firmsPdf.text.includes("Baufirma Anlage"));
  assert.equal(firmsPdf.sha256, second.files[1].sha256); assert.equal((await inspectPdf(fileFor(first, "main"))).sha256, firstPdf.sha256);
  db.prepare("UPDATE project_firms SET name=? WHERE id=?").run("Später geänderte Firma", "s53b2-firm");
  const beforeOpen = new Set(BrowserWindow.getAllWindows().map(win => win.id));
  await call("OpenPreNotificationDocumentFile", { projectId: project.id, documentId: second.id, kind: "firms" });
  for (const win of BrowserWindow.getAllWindows().filter(win => !beforeOpen.has(win.id))) win.close();
  assert.equal((await inspectPdf(fileFor(second, "firms"))).sha256, firmsPdf.sha256);
  const list = await call("ListPreNotificationDocuments", { projectId: project.id }); assert.deepEqual(list.documents.map(entry => entry.id), [second.id, first.id]);
  save({ building_type_override: "Sehr langer Bauvorhabentext ".repeat(100), firms_mode: "unknown" });
  const beforeFailed = rows(), beforeFiles = pdfInventory([baseDir, tempPath]);
  const failed = await invoke("bbmDb.sigekoCreatePreNotificationPdf", request());
  assert.equal(failed.ok, false); assert.match(failed.error, /Art des Bauvorhabens/); assert.deepEqual(rows(), beforeFailed);
  assert.deepEqual(pdfInventory([baseDir, tempPath]), beforeFiles, "Fehlgeschlagener VA-Render hinterlässt eine PDF");
  return { ok: true, nativeEditorUiVerified: false, first: { document: first, pdf: firstPdf }, second: { document: second, pdf: secondPdf, firmsPdf },
    preview: { paint, screenshotPath: previewScreenshot, noFinalRow: true }, mounted, editorRegeneration: { elementId, fontSize: 10, metadata: generated, undoFontSize: 9 },
    historicalFilesUnchanged: true, overflowCreatesNoDocumentOrFile: true };
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
    console.log("[S5.3b2] Echte Vorankündigung, Firmenanlage, 81 PDF-Refs und Editor-Regeneration");
    report.checks.preNotification = await runPreNotificationAcceptance({ db, profile, baseDir, tempPath, BrowserWindow, ipcMain, invoke, resolver });
    report.package = "S1.4 / S5.3b2";
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
      if (!process.argv.includes("--preview-only")) {
        const va = report.checks.preNotification;
        console.log("sigeko-vorankuendigung-result.json=" + JSON.stringify({ ok: va?.ok === true, nativeEditorUiVerified: false,
          error: report.error || null, pdfPageCounts: va ? [va.first.pdf.pageCount, va.second.pdf.pageCount, va.second.firmsPdf.pageCount] : [],
          mountedTargetCount: va?.mounted.refs.length || 0, allSixAttributesAndParentsVerified: va?.ok === true,
          contents: va?.mounted.contents || null, overflow: va?.mounted.overflow || null,
          preview: va?.preview || null, editorRegeneration: va ? { elementId: va.editorRegeneration.elementId,
            fontSize: va.editorRegeneration.fontSize, undoFontSize: va.editorRegeneration.undoFontSize,
            pageCount: va.editorRegeneration.metadata.pageCount, renderBoundsCount: va.editorRegeneration.metadata.renderBounds.length } : null,
          historicalFilesUnchanged: va?.historicalFilesUnchanged === true, overflowCreatesNoDocumentOrFile: va?.overflowCreatesNoDocumentOrFile === true,
          documents: va ? [va.first.document, va.second.document] : [] }, null, 2));
        const screenshotPath = path.join(profile.rootPath, "vorankuendigung-preview.png");
        if (fs.existsSync(screenshotPath)) console.log("vorankuendigung-preview.png=" + fs.readFileSync(screenshotPath).toString("base64"));
      }
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
