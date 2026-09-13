const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
const { InvoiceIssuerProfileRepository } = require("../../src/main/db/invoiceIssuerProfileRepo");
const { InvoiceServiceCatalogRepository } = require("../../src/main/db/invoiceServiceCatalogRepo");
const { InvoiceMasterDataService } = require("../../src/main/domain/rechnung/InvoiceMasterDataService");
const firmUsagesRepo = require("../../src/main/db/firmUsagesRepo");
const { FirmDirectoryService } = require("../../src/main/domain/firms/FirmDirectoryService");

function prepare(file) {
  const db = new Database(file);
  db.exec(`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY); CREATE TABLE IF NOT EXISTS firms (id TEXT PRIMARY KEY, short TEXT, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, role_code INTEGER DEFAULT 60, use_project_participant INTEGER DEFAULT 0, use_customer INTEGER DEFAULT 0, removed_at TEXT, is_trashed INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT); CREATE TABLE IF NOT EXISTS user_profile (id INTEGER PRIMARY KEY, name1 TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, website TEXT, logo_path TEXT, tax_number TEXT, vat_id TEXT, iban TEXT, bic TEXT, bank_name TEXT, commercial_register TEXT, register_number TEXT, managing_director TEXT, legal_notice TEXT);`);
  ensureInvoiceSchema(db); return db;
}

async function runRechnungReS11Tests(run) {
  await run("Rechnung RE-S1.1: Profil und drei Katalogleistungen überleben DB-Neustart, Belege bleiben bytegleich", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-re-s11-")); const file = path.join(root, "bbm.db");
    let db = prepare(file);
    db.prepare(`INSERT INTO invoices (id,status,source_type,document_type,invoice_date,service_period_type,service_date,positions_json,payment_term_days,due_date,created_at,updated_at) VALUES ('existing','DRAFT','FREE','INVOICE','2026-09-13','SINGLE_DATE','2026-09-13','[{"short_text":"Bestand"}]',8,'2026-09-21','before','before')`).run();
    const before = db.prepare("SELECT * FROM invoices WHERE id='existing'").get();
    let sequence = 0; const service = new InvoiceMasterDataService({ issuerRepository: new InvoiceIssuerProfileRepository({ dbProvider: () => db, clock: () => "2026-09-13T12:00:00.000Z" }), catalogRepository: new InvoiceServiceCatalogRepository({ dbProvider: () => db, clock: () => "2026-09-13T12:00:00.000Z", idFactory: () => `service-${++sequence}` }), vatRateProvider: async () => 7 });
    service.saveIssuerProfile({ legalName: "RE-S1.1 Rechnung GmbH", street: "Rechnungsweg 1", zip: "12345", city: "Teststadt", vatId: "DE123", iban: "DE001" });
    db.prepare("INSERT INTO firms (id,name,street,use_customer) VALUES ('customer-a','Kunde Alpha','Altweg 1',1),('customer-b','Kunde Beta','Betaweg 2',1)").run();
    for (const firmId of ["customer-a", "customer-b"]) firmUsagesRepo.setUsage({ firmId, usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER, enabled: true, dbConn: db });
    db.prepare("UPDATE firms SET name='Kunde Alpha geändert', street='Neuweg 9' WHERE id='customer-a'").run();
    const entries = [await service.createCatalogEntry({ shortText: "Planung", longText: "Planungsleistung", unit: "h", unitPriceCents: 12500 }), await service.createCatalogEntry({ shortText: "Beratung", longText: "Beratung vor Ort", unit: "h", unitPriceCents: 9800 }), await service.createCatalogEntry({ shortText: "Dokumentation", longText: "Dokument erstellen", unit: "St", unitPriceCents: 45000 })];
    await service.updateCatalogEntry({ id: entries[1].id, entry: { shortText: "Beratung geändert", longText: "Beratung und Prüfung", unit: "h", unitPriceCents: 10500 } });
    db.close(); db = prepare(file);
    const restarted = new InvoiceMasterDataService({ issuerRepository: new InvoiceIssuerProfileRepository({ dbProvider: () => db }), catalogRepository: new InvoiceServiceCatalogRepository({ dbProvider: () => db }) });
    const customers = new FirmDirectoryService({ dbProvider: () => db, usageRepo: firmUsagesRepo }).listCustomers({});
    assert.deepEqual([restarted.getIssuerProfile().legalName, restarted.getIssuerProfile().vatId], ["RE-S1.1 Rechnung GmbH", "DE123"]);
    assert.deepEqual(customers.map((entry) => [entry.id, entry.name, entry.street]), [["customer-a", "Kunde Alpha geändert", "Neuweg 9"], ["customer-b", "Kunde Beta", "Betaweg 2"]]);
    assert.deepEqual(restarted.listCatalog().map((entry) => [entry.id, entry.shortText, entry.unitPriceCents, entry.vatRatePercent]), [["service-2", "Beratung geändert", 10500, 7], ["service-3", "Dokumentation", 45000, 7], ["service-1", "Planung", 12500, 7]]);
    assert.deepEqual(db.prepare("SELECT * FROM invoices WHERE id='existing'").get(), before);
    db.close(); fs.rmSync(root, { recursive: true, force: true });
  });

  await run("Rechnung RE-S1.1 Korrektur: bisherige 19-Prozent-Katalogdaten bleiben beim Öffnen für zentrale Vorgaben erhalten", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-re-s11-vat-migration-")); const file = path.join(root, "bbm.db");
    const db = new Database(file);
    db.exec(`CREATE TABLE projects (id TEXT PRIMARY KEY); CREATE TABLE firms (id TEXT PRIMARY KEY, removed_at TEXT, is_trashed INTEGER); CREATE TABLE user_profile (id INTEGER PRIMARY KEY); CREATE TABLE invoice_service_catalog (id TEXT PRIMARY KEY, short_text TEXT NOT NULL, long_text TEXT NOT NULL DEFAULT '', unit TEXT NOT NULL DEFAULT '', unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0), vat_rate_percent INTEGER NOT NULL DEFAULT 19 CHECK (vat_rate_percent = 19), created_at TEXT NOT NULL, updated_at TEXT NOT NULL); INSERT INTO invoice_service_catalog VALUES ('legacy-19','Bestand','','h',1000,19,'before','before');`);
    ensureInvoiceSchema(db);
    assert.deepEqual(db.prepare("SELECT * FROM invoice_service_catalog WHERE id='legacy-19'").get(), { id: "legacy-19", short_text: "Bestand", long_text: "", unit: "h", unit_price_cents: 1000, vat_rate_percent: 19, created_at: "before", updated_at: "before" });
    const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='invoice_service_catalog'").get().sql;
    assert.match(sql, /BETWEEN 0 AND 100/); db.close(); fs.rmSync(root, { recursive: true, force: true });
  });

  await run("Rechnung RE-S1.1 Korrektur: Kundenrefresh bewahrt ungespeicherte Profil- und Katalogwerte", async () => {
    const { buildCustomerRefresh, formatCatalogVatRate } = await import("../../src/renderer/modules/rechnungen/masterDataCustomerRefresh.mjs");
    const unsaved = { issuer: { legalName: "Noch nicht gespeichert" }, catalog: { selectedId: "service-2", shortText: "Ungespeichert geändert", unitPrice: "77,00" } };
    const before = structuredClone(unsaved);
    const refreshed = buildCustomerRefresh({ ok: true, list: [{ kind: "global_firm", id: "customer-a", name: "Kunde geändert" }, { kind: "global_firm", id: "customer-b", name: "Kunde B" }] }, "global_firm:customer-a");
    assert.deepEqual(refreshed.customers.map((entry) => entry.id), ["customer-a", "customer-b"]);
    assert.equal(refreshed.selectedKey, "global_firm:customer-a");
    assert.deepEqual(unsaved, before);
    assert.equal(formatCatalogVatRate(null, 7), "7 %");
    assert.equal(formatCatalogVatRate({ vatRatePercent: 16 }, 7), "16 %");
  });

  await run("Rechnung RE-S1.1: IPC, Preload und UI nutzen rechnungsspezifische Stammdatenwege", async () => {
    const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
    const ipc = read("src/main/ipc/rechnungIpc.js"); const preload = read("src/main/preload.js"); const screen = read("src/renderer/modules/rechnungen/screens/RechnungScreen.js"); const contract = read("src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js");
    for (const channel of ["rechnung:issuer:get", "rechnung:issuer:save", "rechnung:catalog:list", "rechnung:catalog:defaults", "rechnung:catalog:create", "rechnung:catalog:update"]) { assert.match(ipc, new RegExp(channel)); assert.match(preload, new RegExp(channel)); }
    assert.match(screen, /rechnungIssuerGet/); assert.doesNotMatch(screen, /userProfileGet/); assert.match(screen, /openFirmEditor/); assert.match(screen, /origin: "invoice"/);
    for (const id of ["rechnung.masterData", "rechnung.masterData.issuer", "rechnung.masterData.customers.select", "rechnung.masterData.catalog.shortText", "rechnung.masterData.catalog.vatRate"]) assert.match(contract, new RegExp(id.replaceAll(".", "\\.")));
    assert.deepEqual(await new InvoiceMasterDataService().getCatalogDefaults(), { vatRatePercent: 19 });
  });
}
module.exports = { runRechnungReS11Tests };
