#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const {
  createAcceptanceProfile,
  createSanitizedEnvironment,
} = require("./runIsolatedUiEditorAcceptance.cjs");
const {
  ACCEPTANCE_SWITCH,
  configureUiEditorAcceptanceProfile,
  isPathInside,
} = require("../src/main/startup/uiEditorAcceptanceProfile");

const ROOT = path.resolve(__dirname, "..");

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

async function inspectPdf(filePath) {
  const bytes = fs.readFileSync(filePath);
  assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-", "Keine echte PDF-Datei");
  const { getDocument } = await import(
    pathToFileURL(require.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href
  );
  const document = await getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;
  try {
    const text = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      text.push(content.items.map((item) => item.str || "").join(" "));
    }
    return Object.freeze({
      filePath: path.resolve(filePath),
      bytes: bytes.length,
      sha256: sha256(bytes),
      pageCount: document.numPages,
      text: text.join(" ").replace(/\s+/g, " ").trim(),
    });
  } finally {
    await document.destroy();
  }
}

function invoiceInput(customerId, marker) {
  return {
    source_type: "FREE",
    document_type: "INVOICE",
    invoice_date: "2026-09-14",
    service_period_type: "SINGLE_DATE",
    service_date: "2026-09-14",
    customer_ref_kind: "global_firm",
    customer_firm_id: customerId,
    service_reference: marker,
    positions: [{
      id: `${marker}-position`,
      type: "service",
      short_text: `Leistung ${marker}`,
      quantity: "1",
      unit: "h",
      unit_price_cents: 12345,
      vat_rate_percent: 19,
    }],
    payment_term_days: 8,
  };
}

function initialOrganization() {
  return {
    legalName: "BBM Abschluss Alt GmbH",
    additionalName: "Niederlassung Alt",
    address: { street: "Altweg 11", zip: "11111", city: "Altstadt", country: "DE" },
    contact: { phone: "040 111", email: "alt@example.test", website: "https://alt.example.test" },
    taxNumber: "ALT-TAX-342",
    vatId: "DE111111111",
    bank: { iban: "DE00111111111111111111", bic: "ALTBBIC1", name: "Altbank 342" },
    legal: {
      commercialRegister: "AG Altstadt",
      registerNumber: "HRB 342-A",
      managingDirector: "A. Alt",
      notice: "Alter Hinweis 342",
    },
  };
}

function currentOrganization() {
  return {
    legalName: "BBM Abschluss Neu GmbH",
    additionalName: "Zentrale Neu",
    address: { street: "Neuweg 22", zip: "22222", city: "Neustadt", country: "DE" },
    contact: { phone: "040 222", email: "neu@example.test", website: "https://neu.example.test" },
    taxNumber: "NEU-TAX-342",
    vatId: "DE222222222",
    bank: { iban: "DE00222222222222222222", bic: "NEUBBIC2", name: "Neubank 342" },
    legal: {
      commercialRegister: "AG Neustadt",
      registerNumber: "HRB 342-N",
      managingDirector: "N. Neu",
      notice: "Neuer Hinweis 342",
    },
  };
}

function assertPdfText(pdf, organization) {
  for (const expected of [
    organization.legalName,
    organization.address.street,
    organization.address.zip,
    organization.address.city,
  ]) {
    assert.ok(pdf.text.includes(expected), `PDF enthaelt nicht: ${expected}`);
  }
}

function listPdfFiles(rootPath) {
  const result = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else if (entry.isFile() && /\.pdf$/i.test(entry.name)) result.push(path.resolve(filePath));
    }
  };
  visit(rootPath);
  return result.sort();
}

async function invoke(caller, expression) {
  return caller.webContents.executeJavaScript(expression, true);
}

async function bookThroughProductIpc(caller, input) {
  const draft = await invoke(
    caller,
    `window.bbmDb.rechnungCreateDraft(${JSON.stringify(input)})`
  );
  assert.equal(draft?.ok, true, JSON.stringify(draft));
  const booked = await invoke(
    caller,
    `window.bbmDb.rechnungBookDraft(${JSON.stringify(draft.data.id)}, ${JSON.stringify(input)})`
  );
  assert.equal(booked?.ok, true, JSON.stringify(booked));
  assert.equal(booked.data.status, "BOOKED");
  assert.equal(booked.data.pdf_finalization_status, "READY");
  assert.ok(booked.data.final_pdf_reference);
  return booked.data;
}

async function runWorker() {
  const { app, BrowserWindow } = require("electron");
  let profile;
  let caller;
  let closeDatabase = () => {};
  const report = {
    schemaVersion: 1,
    package: "Rechnung RE-S1.1 PDF-Abschluss",
    ok: false,
    automatedElectronVerification: true,
    computerUseVerification: false,
    checks: {},
  };
  try {
    app.setAppPath(ROOT);
    profile = configureUiEditorAcceptanceProfile({ electronApp: app });
    assert.equal(profile.enabled, true, "Isoliertes Abnahmeprofil erforderlich");
    const tempPath = path.join(profile.rootPath, "temp");
    fs.mkdirSync(tempPath, { recursive: true });
    app.setPath("temp", tempPath);
    app.disableHardwareAcceleration();
    await app.whenReady();

    const database = require("../src/main/db/database");
    closeDatabase = database.closeDatabase;
    const dbPath = path.join(profile.userDataPath, "app.db");
    assert.equal(fs.existsSync(dbPath), false, "Testdatenbank muss frisch sein");
    const license = require("../src/main/licensing/licenseService").getStatus({ fresh: true });
    assert.equal(license.valid, true, "Entwicklungs-Lizenzstatus fehlt");
    assert.ok(license.license.modules.includes("rechnung"), "Rechnung ist im Testlauf nicht freigeschaltet");
    database.configureDatabaseMigrations(license, { allowLegacyImport: false });
    let db = database.initDatabase();
    assert.ok(isPathInside(profile.rootPath, db.name), "Datenbank liegt ausserhalb des Temp-Profils");

    const { upsertOwnOrganization } = require("../src/main/db/ownOrganizationRepo");
    const firmUsagesRepo = require("../src/main/db/firmUsagesRepo");
    const oldOrganization = initialOrganization();
    const newOrganization = currentOrganization();
    upsertOwnOrganization(oldOrganization);
    db.prepare(`
      INSERT INTO firms (id, name, street, zip, city, phone, email, use_customer)
      VALUES ('re-s11-customer', 'Kunde Abschluss 342', 'Kundenweg 3', '33333', 'Kundenstadt', '040 333', 'kunde@example.test', 1)
    `).run();
    firmUsagesRepo.setUsage({
      firmId: "re-s11-customer",
      usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER,
      enabled: true,
      dbConn: db,
    });

    require("../src/main/ipc/tableLayoutsIpc").registerTableLayoutsIpc();
    require("../src/main/ipc/printIpc").registerPrintIpc();
    require("../src/main/ipc/rechnungIpc").registerRechnungIpc();
    caller = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        sandbox: false,
        nodeIntegration: false,
        preload: path.join(ROOT, "src/main/preload.js"),
      },
    });
    await caller.loadURL("data:text/html;charset=utf-8,<title>RE-S1.1 PDF-Abschluss</title>");

    const first = await bookThroughProductIpc(
      caller,
      invoiceInput("re-s11-customer", "RE-S1.1-ALT")
    );
    assert.ok(isPathInside(profile.rootPath, first.final_pdf_reference.local_path));
    const firstSnapshotJson = db
      .prepare("SELECT issuer_snapshot_json FROM invoices WHERE id = ?")
      .get(first.id).issuer_snapshot_json;
    const firstReference = db
      .prepare("SELECT * FROM commercial_document_files WHERE id = ?")
      .get(first.final_pdf_reference.id);
    const firstPdf = await inspectPdf(first.final_pdf_reference.local_path);
    assertPdfText(firstPdf, oldOrganization);
    assert.equal(firstPdf.sha256, first.final_pdf_reference.sha256);
    assert.equal(firstPdf.bytes, first.final_pdf_reference.size_bytes);

    upsertOwnOrganization(newOrganization);
    const second = await bookThroughProductIpc(
      caller,
      invoiceInput("re-s11-customer", "RE-S1.1-NEU")
    );
    assert.equal(second.issuer_snapshot.companyName, newOrganization.legalName);
    assert.equal(second.issuer_snapshot.street, newOrganization.address.street);
    assert.equal(second.issuer_snapshot.bankName, newOrganization.bank.name);
    assert.equal(second.issuer_snapshot.iban, newOrganization.bank.iban);
    assert.notEqual(second.invoice_number, first.invoice_number);
    assert.ok(isPathInside(profile.rootPath, second.final_pdf_reference.local_path));
    const secondPdf = await inspectPdf(second.final_pdf_reference.local_path);
    assertPdfText(secondPdf, newOrganization);
    assert.equal(secondPdf.sha256, second.final_pdf_reference.sha256);
    assert.equal(secondPdf.bytes, second.final_pdf_reference.size_bytes);

    closeDatabase();
    db = database.initDatabase();
    const reopenedFirstResult = await invoke(
      caller,
      `window.bbmDb.rechnungGet(${JSON.stringify(first.id)})`
    );
    assert.equal(reopenedFirstResult?.ok, true, JSON.stringify(reopenedFirstResult));
    const reopenedFirst = reopenedFirstResult.data;
    assert.equal(reopenedFirst.issuer_snapshot.companyName, oldOrganization.legalName);
    assert.equal(reopenedFirst.issuer_snapshot.street, oldOrganization.address.street);
    assert.equal(reopenedFirst.issuer_snapshot.bankName, oldOrganization.bank.name);
    assert.equal(reopenedFirst.issuer_snapshot.iban, oldOrganization.bank.iban);
    assert.equal(
      db.prepare("SELECT issuer_snapshot_json FROM invoices WHERE id = ?").get(first.id).issuer_snapshot_json,
      firstSnapshotJson
    );
    assert.deepEqual(
      db.prepare("SELECT * FROM commercial_document_files WHERE id = ?").get(first.final_pdf_reference.id),
      firstReference
    );
    const verifiedFirstResult = await invoke(
      caller,
      `window.bbmDb.rechnungFinalizePdf(${JSON.stringify(first.id)})`
    );
    assert.equal(verifiedFirstResult?.ok, true, JSON.stringify(verifiedFirstResult));
    const reopenedFirstPdf = await inspectPdf(first.final_pdf_reference.local_path);
    assert.deepEqual(
      { bytes: reopenedFirstPdf.bytes, sha256: reopenedFirstPdf.sha256, text: reopenedFirstPdf.text },
      { bytes: firstPdf.bytes, sha256: firstPdf.sha256, text: firstPdf.text }
    );

    const pdfFiles = listPdfFiles(profile.rootPath);
    assert.deepEqual(
      pdfFiles,
      [first.final_pdf_reference.local_path, second.final_pdf_reference.local_path]
        .map((filePath) => path.resolve(filePath))
        .sort(),
      "Nur die beiden finalen Test-PDFs duerfen im isolierten Profil verbleiben"
    );
    report.checks.isolation = {
      profileRoot: profile.rootPath,
      databasePath: path.resolve(db.name),
      tempOutputPath: path.resolve(tempPath),
      legacyImportDisabled: true,
      sourceDatabaseCopied: false,
      allPdfPathsInsideProfile: pdfFiles.every((filePath) => isPathInside(profile.rootPath, filePath)),
    };
    report.checks.firstBooking = {
      id: first.id,
      invoiceNumber: first.invoice_number,
      issuerSnapshotSha256: sha256(Buffer.from(firstSnapshotJson, "utf8")),
      issuer: first.issuer_snapshot,
      pdf: firstPdf,
      reference: firstReference,
    };
    report.checks.secondBooking = {
      id: second.id,
      invoiceNumber: second.invoice_number,
      issuer: second.issuer_snapshot,
      pdf: secondPdf,
      reference: second.final_pdf_reference,
    };
    report.checks.reopen = {
      databaseReopened: true,
      firstSnapshotUnchanged: true,
      firstReferenceUnchanged: true,
      firstPdfHashUnchanged: true,
      firstPdfBytesUnchanged: true,
      readyInvoiceVerifiedWithoutRerender: true,
    };
    report.checks.runtime = {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      pdfRenderer: "existing Rechnung IPC -> InvoicePdfFinalizer -> printIpc -> BrowserWindow.webContents.printToPDF",
    };
    report.ok = true;
  } catch (error) {
    report.error = {
      message: error?.message || String(error),
      code: error?.code || null,
      stack: error?.stack || "",
    };
    console.error(`[RE-S1.1 PDF] FAIL: ${report.error.stack}`);
  } finally {
    if (caller && !caller.isDestroyed()) caller.destroy();
    for (const window of BrowserWindow.getAllWindows()) window.destroy();
    closeDatabase();
    if (profile) {
      const reportPath = path.join(profile.rootPath, "rechnung-re-s1.1-pdf-result.json");
      fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
      console.log(`[RE-S1.1 PDF] ${report.ok ? "PASS" : "FAIL"}: ${reportPath}`);
    }
    app.exit(report.ok ? 0 : 1);
  }
}

async function launch() {
  const profile = createAcceptanceProfile();
  const reportPath = path.join(profile.rootPath, "rechnung-re-s1.1-pdf-result.json");
  console.log(`[RE-S1.1 PDF] Isoliertes Temp-Profil: ${profile.rootPath}`);
  const args = [__filename, "--worker", `${ACCEPTANCE_SWITCH}${profile.rootPath}`];
  if (process.platform === "linux" && process.getuid?.() === 0) args.unshift("--no-sandbox");
  const child = spawn(require("electron"), args, {
    cwd: ROOT,
    env: createSanitizedEnvironment(),
    stdio: "inherit",
    windowsHide: true,
  });
  const timeout = setTimeout(() => {
    console.error("[RE-S1.1 PDF] FAIL: Abnahme-Timeout");
    child.kill("SIGTERM");
  }, 180000);
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve(exitCode ?? 1));
  }).finally(() => clearTimeout(timeout));
  if (!fs.existsSync(reportPath)) {
    fs.writeFileSync(reportPath, `${JSON.stringify({
      schemaVersion: 1,
      package: "Rechnung RE-S1.1 PDF-Abschluss",
      ok: false,
      error: {
        code: "ACCEPTANCE_WORKER_ABORTED",
        message: `Electron endete ohne Abnahmebericht (Exit ${code}).`,
      },
    }, null, 2)}\n`, "utf8");
  }
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  process.exitCode = code || (report.ok === true ? 0 : 1);
}

if (process.versions.electron && process.argv.includes("--worker")) void runWorker();
else if (require.main === module) {
  launch().catch((error) => {
    console.error(`[RE-S1.1 PDF] FAIL: ${error?.stack || error}`);
    process.exitCode = 1;
  });
}

module.exports = Object.freeze({ inspectPdf, runWorker, launch });
