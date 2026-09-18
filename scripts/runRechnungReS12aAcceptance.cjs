#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { spawnSync } = require("node:child_process");
const electronBinary = require("electron");
const {
  createAcceptanceProfile,
  createSanitizedEnvironment,
  removeAcceptanceProfile,
} = require("./runIsolatedUiEditorAcceptance.cjs");
const { ACCEPTANCE_SWITCH, configureUiEditorAcceptanceProfile } = require("../src/main/startup/uiEditorAcceptanceProfile.js");

const ROOT = path.resolve(__dirname, "..");

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function seedAcceptanceData() {
  const { initDatabase } = require("../src/main/db/database");
  const firmsRepo = require("../src/main/db/firmsRepo");
  const firmUsagesRepo = require("../src/main/db/firmUsagesRepo");
  const { upsertUserProfile } = require("../src/main/db/userProfileRepo");
  const { getInvoiceMasterDataService } = require("../src/main/domain/rechnung/InvoiceMasterDataService");
  const db = initDatabase();
  if (db.prepare("SELECT COUNT(*) AS count FROM firms").get().count === 0) {
    upsertUserProfile({ name1: "BBM Test GmbH", street: "Testweg 1", zip: "12345", city: "Teststadt", country: "DE", vat_id: "DE123456789", iban: "DE00123456780000000000", bic: "TESTDEFFXXX", bank_name: "Testbank" });
    for (const values of [
      { name: "Rechnungskunde Alpha GmbH", street: "Alphaweg 1", zip: "11111", city: "Alphaort" },
      { name: "Rechnungskunde Beta GmbH", street: "Betaweg 2", zip: "22222", city: "Betaort" },
    ]) {
      const firm = firmsRepo.createFirm({ ...values, short: values.name, use_customer: 1, use_project_participant: 0 });
      firmUsagesRepo.setUsage({ firmId: firm.id, usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER, enabled: true, dbConn: db });
    }
  }
  const catalog = getInvoiceMasterDataService();
  if (catalog.listCatalog().length === 0) {
    return Promise.all([
      catalog.createCatalogEntry({ shortText: "Beratung", longText: "Beratung auf der Baustelle", unit: "h", unitPriceCents: 7500 }),
      catalog.createCatalogEntry({ shortText: "Dokumentation", longText: "Dokumentation der Leistung", unit: "St", unitPriceCents: 5000 }),
      catalog.createCatalogEntry({ shortText: "Montage", longText: "Montage und Einbau", unit: "St", unitPriceCents: 12500 }),
    ]);
  }
  return Promise.resolve();
}

async function waitForRenderer(win, expression, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await win.webContents.executeJavaScript(`Boolean(${expression})`)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`RE_S12A_RENDERER_TIMEOUT:${expression}`);
}

function firstRunAutomation() {
  const wait = async (test, label, timeout = 12000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (test()) return;
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    throw new Error(`Timeout: ${label}`);
  };
  const screen = window.__rechnungScreen;
  const target = (id) => document.querySelector(`[data-ui-inspector-id="${id}"]`);
  const click = (id) => { const element = target(id); if (!element) throw new Error(`Ziel fehlt: ${id}`); element.click(); };
  const change = (id, value, { checked = false } = {}) => {
    const element = target(id); if (!element) throw new Error(`Feld fehlt: ${id}`);
    if (checked) element.checked = Boolean(value); else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const selectRowByText = (shortText) => {
    const rows = [...document.querySelectorAll(".rechnung-lv-position")];
    const row = rows.find((entry) => entry.querySelector(".rechnung-lv-position__short")?.textContent === shortText);
    if (!row) throw new Error(`LV-Zeile fehlt: ${shortText}`);
    row.querySelector(".rechnung-lv-position__select").click();
  };
  const totals = () => ({ net: screen.positionsTotal.textContent, vat: screen.invoiceVat.textContent, gross: screen.invoiceTotal.textContent });
  const assert = (condition, message) => { if (!condition) throw new Error(message); };

  return (async () => {
    click("rechnung.overview.new");
    await wait(() => screen.current && !screen.editor.hidden, "neuer Entwurf");
    click("rechnung.editor.customerPicker");
    const customerOption = [...screen.customer.options].find((entry) => entry.textContent.includes("Alpha"));
    assert(customerOption, "Testkunde Alpha fehlt");
    screen.customer.value = customerOption.value;
    screen.customer.dispatchEvent(new Event("change", { bubbles: true }));
    change("rechnung.editor.constructionProject", "Bauprojekt RE-S1.2a");
    change("rechnung.editor.reference", "Freie Rechnung Positionsbedienung");

    click("rechnung.editor.positionCreateFree");
    change("rechnung.editor.positionShort", "Leistung A");
    change("rechnung.editor.positionLong", "Langtext Leistung A");
    change("rechnung.editor.positionQuantity", "2");
    change("rechnung.editor.positionUnit", "St");
    change("rechnung.editor.positionPrice", "100,00");
    assert(screen.positions.length === 1, "Freie Position wurde nicht angelegt");
    assert(document.querySelector(".rechnung-lv-position__long"), "Langtext ist anfangs nicht sichtbar");
    click("rechnung.editor.positionLongToggle");
    assert(!document.querySelector(".rechnung-lv-position__long"), "Langtext wurde nicht ausgeblendet");
    click("rechnung.editor.positionLongToggle");
    assert(document.querySelector(".rechnung-lv-position__long"), "Langtext wurde nicht wieder eingeblendet");

    const beforeCancel = JSON.stringify(screen.positions);
    click("rechnung.editor.positionCatalogOpen");
    await wait(() => !screen.catalogPicker.hidden, "Katalogpicker");
    change("rechnung.catalogPicker.search", "Dokumentation");
    assert(screen.catalogPickerResults.querySelectorAll(".rechnung-catalog-picker__row").length === 1, "Katalogsuche filtert nicht eindeutig");
    click("rechnung.catalogPicker.cancel");
    assert(JSON.stringify(screen.positions) === beforeCancel, "Abbrechen hat den Entwurf veraendert");

    const catalogBefore = await window.bbmDb.rechnungCatalogList();
    click("rechnung.editor.positionCatalogOpen");
    await wait(() => !screen.catalogPicker.hidden, "Katalogpicker erneut");
    const catalogChecks = [...screen.catalogPickerResults.querySelectorAll('input[type="checkbox"]')];
    assert(catalogChecks.length >= 3, "Drei Katalogleistungen fehlen");
    for (const checkbox of catalogChecks.slice(0, 2)) { checkbox.checked = true; checkbox.dispatchEvent(new Event("change", { bubbles: true })); }
    assert(screen.catalogPickerStatus.textContent.startsWith("2 "), "Mehrfachauswahlzaehler ist falsch");
    click("rechnung.catalogPicker.accept");
    assert(screen.positions.length === 3, "Zwei Katalogleistungen wurden nicht uebernommen");
    const copiedOrder = screen.positions.slice(1).map((entry) => entry.short_text);

    click("rechnung.editor.positionDelete");
    assert(screen.positions.length === 2, "Positionsloeschung war nicht wirksam");
    const copyShort = screen.positions.find((entry) => entry.short_text !== "Leistung A").short_text;
    selectRowByText(copyShort);
    change("rechnung.editor.positionShort", "Leistung B");
    change("rechnung.editor.positionLong", "Unabhaengige Rechnungskopie");
    change("rechnung.editor.positionQuantity", "1");
    change("rechnung.editor.positionUnit", "h");
    change("rechnung.editor.positionPrice", "50,00");
    const catalogAfter = await window.bbmDb.rechnungCatalogList();
    assert(JSON.stringify(catalogAfter.list) === JSON.stringify(catalogBefore.list), "Bearbeitung der Kopie hat den Katalog veraendert");

    click("rechnung.editor.positionMove");
    selectRowByText("Leistung A");
    assert(screen.positions[0].short_text === "Leistung B", "Klick-Ziel-Verschieben war nicht wirksam");
    selectRowByText("Leistung A");
    assert(JSON.stringify(totals()) === JSON.stringify({ net: "250,00 EUR", vat: "47,50 EUR", gross: "297,50 EUR" }), "Ausgangssumme fuer NEP ist falsch");
    const nepRounds = [];
    for (const enabled of [true, false, true, false]) {
      change("rechnung.editor.positionNep", enabled, { checked: true });
      const positionA = screen.positions.find((entry) => entry.short_text === "Leistung A");
      nepRounds.push({ enabled, totals: totals(), quantity: positionA.quantity, price: positionA.unit_price_cents });
    }
    assert(JSON.stringify(nepRounds.map((entry) => entry.totals)) === JSON.stringify([
      { net: "50,00 EUR", vat: "9,50 EUR", gross: "59,50 EUR" },
      { net: "250,00 EUR", vat: "47,50 EUR", gross: "297,50 EUR" },
      { net: "50,00 EUR", vat: "9,50 EUR", gross: "59,50 EUR" },
      { net: "250,00 EUR", vat: "47,50 EUR", gross: "297,50 EUR" },
    ]), "Mehrfaches NEP-Umschalten ergibt falsche Summen");
    assert(nepRounds.every((entry) => entry.quantity === "2" && entry.price === 10000), "NEP hat Menge oder Preis veraendert");
    await screen.draftSaveChain;
    const primaryId = screen.current.id;
    const primaryExpected = {
      customer: screen.customer.value,
      constructionProject: screen.constructionProject.value,
      reference: screen.reference.value,
      positions: screen.positions.map((entry) => ({ short: entry.short_text, long: entry.long_text, quantity: entry.quantity, unit: entry.unit, price: entry.unit_price_cents, nep: entry.is_nep, parent: entry.parent_id, number: entry.position_number })),
      totals: totals(),
      invoiceNumber: screen.current.invoice_number || null,
    };
    click("rechnung.editor.close");

    click("rechnung.overview.new");
    await wait(() => screen.current && screen.current.id !== primaryId, "frischer Titelentwurf");
    click("rechnung.editor.positionCreateTitle");
    change("rechnung.editor.positionShort", "Titel A");
    click("rechnung.editor.positionCreateFree");
    change("rechnung.editor.positionShort", "Titelposition 1");
    click("rechnung.editor.positionCreateFree");
    change("rechnung.editor.positionShort", "Titelposition 2");
    assert(screen.positions.map((entry) => entry.position_number).join(",") === "1,1.01,1.02", "Titel-/Einfuegeablauf ist falsch");
    assert(screen.positions.slice(1).every((entry) => entry.parent_id === screen.positions[0].id), "Titelpositionen wurden nicht dem Titel zugeordnet");
    await screen.draftSaveChain;
    click("rechnung.editor.close");

    const primaryIndex = screen.invoices.findIndex((entry) => entry.id === primaryId);
    assert(primaryIndex >= 0, "Hauptentwurf fehlt in der Uebersicht");
    document.querySelectorAll(".rechnung-live-card button")[primaryIndex].click();
    await wait(() => screen.current?.id === primaryId, "Hauptentwurf wieder oeffnen");
    return { primaryId, primaryExpected, copiedOrder, nepRounds, catalogUnchanged: true };
  })();
}

function restartAutomation(primaryId) {
  const screen = window.__rechnungScreen;
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  return (async () => {
    const index = screen.invoices.findIndex((entry) => entry.id === primaryId);
    assert(index >= 0, "Entwurf fehlt nach Neustart");
    document.querySelectorAll(".rechnung-live-card button")[index].click();
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert(screen.current?.id === primaryId, "Entwurf wurde nach Neustart nicht geoeffnet");
    return {
      customer: screen.customer.value,
      constructionProject: screen.constructionProject.value,
      reference: screen.reference.value,
      positions: screen.positions.map((entry) => ({ short: entry.short_text, long: entry.long_text, quantity: entry.quantity, unit: entry.unit, price: entry.unit_price_cents, nep: entry.is_nep, parent: entry.parent_id, number: entry.position_number })),
      totals: { net: screen.positionsTotal.textContent, vat: screen.invoiceVat.textContent, gross: screen.invoiceTotal.textContent },
      invoiceNumber: screen.current.invoice_number || null,
      invoiceNumberField: screen.invoiceNumber.value,
      status: screen.current.status,
    };
  })();
}

function layoutAudit() {
  const visible = (element) => Boolean(element && !element.hidden && element.getClientRects().length);
  const buttons = [...document.querySelectorAll(".rechnung-position-toolbar button")].map((element) => ({ text: element.textContent, visible: visible(element), right: element.getBoundingClientRect().right, bottom: element.getBoundingClientRect().bottom }));
  const sheetArea = document.querySelector(".rechnung-screen__sheet-area");
  return {
    viewport: { width: innerWidth, height: innerHeight },
    buttons,
    allActionsVisible: buttons.every((entry) => entry.visible),
    sheetScrollable: sheetArea.scrollHeight > sheetArea.clientHeight ? getComputedStyle(sheetArea).overflowY !== "hidden" : true,
    documentOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    detailsRect: document.querySelector(".rechnung-position-details")?.getBoundingClientRect().toJSON?.() || null,
  };
}

async function createRendererWindow({ BrowserWindow, profileRoot, show = false }) {
  const htmlPath = path.join(profileRoot, "rechnung-re-s12a.html");
  const moduleUrl = pathToFileURL(path.join(ROOT, "src/renderer/modules/rechnungen/screens/RechnungScreen.js")).href;
  fs.writeFileSync(htmlPath, `<!doctype html><html><head><meta charset="utf-8"><style>html,body,#app{height:100%;margin:0}body{font-family:Arial,sans-serif}</style></head><body><main id="app"></main><script type="module">import RechnungScreen from ${JSON.stringify(moduleUrl)}; const screen=new RechnungScreen(); document.getElementById('app').append(screen.render()); window.__rechnungScreen=screen; window.__rechnungReady=true;</script></body></html>`, "utf8");
  const win = new BrowserWindow({ width: 1400, height: 900, show, webPreferences: { preload: path.join(ROOT, "src/main/preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } });
  await win.loadFile(htmlPath);
  await waitForRenderer(win, "window.__rechnungReady === true && window.__rechnungScreen && window.__rechnungScreen.list");
  await waitForRenderer(win, "Array.isArray(window.__rechnungScreen.customers) && window.__rechnungScreen.customers.length >= 2");
  return win;
}

async function runElectronWorker() {
  const { app, BrowserWindow, ipcMain } = require("electron");
  const phase = process.env.BBM_RE_S12A_PHASE;
  const profileRoot = process.env.BBM_RE_S12A_ROOT;
  const reportPath = process.env.BBM_RE_S12A_REPORT;
  let win = null;
  try {
    const profile = configureUiEditorAcceptanceProfile({ electronApp: app });
    if (!profile.enabled || profile.rootPath !== path.resolve(profileRoot)) throw new Error("RE_S12A_PROFILE_NOT_ISOLATED");
    const { configureDatabaseMigrations, closeDatabase, getDbPaths } = require("../src/main/db/database");
    configureDatabaseMigrations({ valid: true, modules: ["rechnung"] }, { allowLegacyImport: false });
    await app.whenReady();
    if (phase === "first" || phase === "manual") await seedAcceptanceData();
    const { registerRechnungIpc } = require("../src/main/ipc/rechnungIpc");
    const { getOwnOrganization } = require("../src/main/db/ownOrganizationRepo");
    registerRechnungIpc({ ipcMain, app });
    ipcMain.handle("ownOrganization:get", async () => ({ ok: true, organization: getOwnOrganization() }));
    win = await createRendererWindow({ BrowserWindow, profileRoot, show: phase === "manual" });
    if (phase === "manual") {
      await win.webContents.executeJavaScript(`(() => {
        const screen = window.__rechnungScreen;
        screen._showPreview = async () => screen._error("PDF-Ausgabe ist im isolierten Handtest gesperrt.");
        screen._book = async () => screen._error("Buchung ist im isolierten Handtest gesperrt.");
        const syncLockedActions = screen._setBooked.bind(screen);
        screen._setBooked = (...args) => {
          syncLockedActions(...args);
          screen.previewButton.disabled = true;
          screen.bookButton.disabled = true;
        };
        screen.previewButton.disabled = true;
        screen.bookButton.disabled = true;
        return true;
      })()`);
      const dbPaths = getDbPaths();
      writeJson(reportPath, { ok: true, phase, pid: process.pid, paths: { profileRoot: profile.rootPath, userData: profile.userDataPath, sessionData: profile.sessionDataPath, database: dbPaths.activeDbPath, files: process.env.BBM_RE_S12A_FILES, pdf: process.env.BBM_RE_S12A_PDF }, legacyImportAllowed: false, bookingAndPdfLocked: true });
      win.show();
      win.focus();
      await new Promise((resolve) => win.once("closed", resolve));
      win = null;
      closeDatabase();
      app.quit();
      return;
    }
    let result;
    if (phase === "first") {
      result = await win.webContents.executeJavaScript(`(${firstRunAutomation.toString()})()`);
    } else {
      const firstReport = JSON.parse(fs.readFileSync(path.join(profileRoot, "phase-first.json"), "utf8"));
      result = await win.webContents.executeJavaScript(`(${restartAutomation.toString()})(${JSON.stringify(firstReport.result.primaryId)})`);
    }
    const broad = await win.webContents.executeJavaScript(`(${layoutAudit.toString()})()`);
    win.setContentSize(720, 760);
    await new Promise((resolve) => setTimeout(resolve, 120));
    const narrow = await win.webContents.executeJavaScript(`(${layoutAudit.toString()})()`);
    const dbPaths = getDbPaths();
    writeJson(reportPath, { ok: true, phase, pid: process.pid, result, broad, narrow, paths: { profileRoot: profile.rootPath, userData: profile.userDataPath, sessionData: profile.sessionDataPath, database: dbPaths.activeDbPath, files: process.env.BBM_RE_S12A_FILES, pdf: process.env.BBM_RE_S12A_PDF }, legacyImportAllowed: false });
    win.destroy(); win = null; closeDatabase(); app.quit();
  } catch (error) {
    writeJson(reportPath, { ok: false, phase, pid: process.pid, error: error?.stack || error?.message || String(error) });
    try { win?.destroy(); } catch (_) {}
    app.exit(1);
  }
}

function runPhase({ hostRoot, profile, phase, filesRoot, pdfRoot }) {
  const reportPath = path.join(profile.rootPath, `phase-${phase}.json`);
  const args = [hostRoot, `${ACCEPTANCE_SWITCH}${profile.rootPath}`];
  const env = { ...createSanitizedEnvironment(), BBM_RE_S12A_PHASE: phase, BBM_RE_S12A_ROOT: profile.rootPath, BBM_RE_S12A_REPORT: reportPath, BBM_RE_S12A_FILES: filesRoot, BBM_RE_S12A_PDF: pdfRoot };
  const child = spawnSync(electronBinary, args, { cwd: ROOT, env, encoding: "utf8", timeout: 180000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : null;
  if (child.status !== 0 || !report?.ok) throw new Error(report?.error || child.stderr || child.stdout || `Electron-Phase ${phase} fehlgeschlagen.`);
  return report;
}

async function runAcceptance() {
  const profile = createAcceptanceProfile();
  const filesRoot = path.join(profile.rootPath, "files");
  const pdfRoot = path.join(profile.rootPath, "pdf");
  const hostRoot = path.join(profile.rootPath, "electron-host");
  fs.mkdirSync(filesRoot, { recursive: true }); fs.mkdirSync(pdfRoot, { recursive: true }); fs.mkdirSync(hostRoot, { recursive: true });
  fs.writeFileSync(path.join(hostRoot, "package.json"), JSON.stringify({ name: "bbm-re-s12a-acceptance", private: true, main: "main.cjs" }), "utf8");
  fs.writeFileSync(path.join(hostRoot, "main.cjs"), `require(${JSON.stringify(__filename)}).runElectronWorker();\n`, "utf8");
  try {
    const first = runPhase({ hostRoot, profile, phase: "first", filesRoot, pdfRoot });
    const restart = runPhase({ hostRoot, profile, phase: "restart", filesRoot, pdfRoot });
    if (first.pid === restart.pid) throw new Error("Electron-Prozess wurde nicht vollstaendig neu gestartet.");
    if (JSON.stringify(first.result.primaryExpected) !== JSON.stringify({ ...restart.result, invoiceNumberField: undefined, status: undefined })) {
      const comparable = { ...restart.result }; delete comparable.invoiceNumberField; delete comparable.status;
      if (JSON.stringify(first.result.primaryExpected) !== JSON.stringify(comparable)) throw new Error("Entwurfswerte unterscheiden sich nach Prozessneustart.");
    }
    if (restart.result.status !== "DRAFT" || restart.result.invoiceNumber !== null || !restart.result.invoiceNumberField.includes("Buchung")) throw new Error("Entwurf erhielt unzulaessig eine endgueltige Rechnungsnummer.");
    for (const report of [first, restart]) {
      for (const audit of [report.broad, report.narrow]) {
        if (!audit.allActionsVisible || !audit.sheetScrollable || audit.documentOverflowX) throw new Error(`Layoutpruefung fehlgeschlagen: ${JSON.stringify(audit)}`);
      }
    }
    if (fs.readdirSync(pdfRoot).length !== 0 || fs.readdirSync(filesRoot).length !== 0) throw new Error("Der Abnahmelauf hat unerwartete Dateien oder PDFs erzeugt.");
    const summary = { ok: true, processRestart: { firstPid: first.pid, restartPid: restart.pid }, paths: first.paths, first: first.result, restart: restart.result, layout: { broad: first.broad, narrow: first.narrow }, generatedFiles: fs.readdirSync(filesRoot), generatedPdfs: fs.readdirSync(pdfRoot) };
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  } finally {
    removeAcceptanceProfile(profile.rootPath);
  }
}

function runManual() {
  const profile = createAcceptanceProfile();
  const filesRoot = path.join(profile.rootPath, "files");
  const pdfRoot = path.join(profile.rootPath, "pdf");
  const hostRoot = path.join(profile.rootPath, "electron-host");
  const reportPath = path.join(profile.rootPath, "phase-manual.json");
  fs.mkdirSync(filesRoot, { recursive: true }); fs.mkdirSync(pdfRoot, { recursive: true }); fs.mkdirSync(hostRoot, { recursive: true });
  fs.writeFileSync(path.join(hostRoot, "package.json"), JSON.stringify({ name: "bbm-re-s12a-manual", private: true, main: "main.cjs" }), "utf8");
  fs.writeFileSync(path.join(hostRoot, "main.cjs"), `require(${JSON.stringify(__filename)}).runElectronWorker();\n`, "utf8");
  const env = { ...createSanitizedEnvironment(), BBM_RE_S12A_PHASE: "manual", BBM_RE_S12A_ROOT: profile.rootPath, BBM_RE_S12A_REPORT: reportPath, BBM_RE_S12A_FILES: filesRoot, BBM_RE_S12A_PDF: pdfRoot };
  console.log(`Isolierter RE-S1.2a-Handtest: ${profile.rootPath}`);
  console.log("Testdaten: zwei Rechnungskunden, drei Katalogleistungen. Buchung und PDF-Ausgabe sind gesperrt.");
  try {
    const child = spawnSync(electronBinary, [hostRoot, `${ACCEPTANCE_SWITCH}${profile.rootPath}`], { cwd: ROOT, env, stdio: "inherit", windowsHide: false });
    const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : null;
    if (child.status !== 0 || !report?.ok || !report.bookingAndPdfLocked) throw new Error(report?.error || `Isolierter Handtest fehlgeschlagen (Exit ${child.status}).`);
  } finally {
    removeAcceptanceProfile(profile.rootPath);
  }
}

module.exports = { runAcceptance, runElectronWorker, runManual };

if (require.main === module) {
  if (process.argv.includes("--manual")) {
    try { runManual(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
  } else runAcceptance().catch((error) => { console.error(error?.stack || error); process.exitCode = 1; });
}
