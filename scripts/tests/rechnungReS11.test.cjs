const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
const { InvoiceRepository } = require("../../src/main/db/invoiceRepository");
const { InvoiceServiceCatalogRepository } = require("../../src/main/db/invoiceServiceCatalogRepo");
const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");
const { InvoiceMasterDataService } = require("../../src/main/domain/rechnung/InvoiceMasterDataService");
const { getOwnOrganization } = require("../../src/main/db/ownOrganizationRepo");
const firmUsagesRepo = require("../../src/main/db/firmUsagesRepo");
const { FirmDirectoryService } = require("../../src/main/domain/firms/FirmDirectoryService");

const PROFILE_COLUMNS = [
  "name1", "name2", "street", "zip", "city", "country", "phone", "email",
  "website", "logo_path", "tax_number", "vat_id", "iban", "bic", "bank_name",
  "commercial_register", "register_number", "managing_director", "legal_notice",
];

function prepare(file, initialProfile = null) {
  const db = new Database(file);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS firms (
      id TEXT PRIMARY KEY, short TEXT, name TEXT, name2 TEXT, street TEXT, zip TEXT,
      city TEXT, country TEXT, phone TEXT, email TEXT, role_code INTEGER DEFAULT 60,
      use_project_participant INTEGER DEFAULT 0, use_customer INTEGER DEFAULT 0,
      removed_at TEXT, is_trashed INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY,
      ${PROFILE_COLUMNS.map((column) => `${column} TEXT`).join(", ")}
    );
  `);
  if (initialProfile && !db.prepare("SELECT 1 FROM user_profile WHERE id = 1").get()) {
    db.prepare(`INSERT INTO user_profile (id, ${PROFILE_COLUMNS.join(", ")}) VALUES (1, ${PROFILE_COLUMNS.map((column) => `@${column}`).join(", ")})`).run(
      Object.fromEntries(PROFILE_COLUMNS.map((column) => [column, initialProfile[column] || ""]))
    );
  }
  ensureInvoiceSchema(db);
  return db;
}

function invoiceInput(customerId) {
  return {
    source_type: "FREE",
    document_type: "INVOICE",
    invoice_date: "2026-09-13",
    service_period_type: "SINGLE_DATE",
    service_date: "2026-09-13",
    customer_ref_kind: "global_firm",
    customer_firm_id: customerId,
    service_reference: "RE-S1.1",
    positions: [{ id: "position-1", type: "service", short_text: "Prüfung", quantity: "1", unit: "h", unit_price_cents: 10000, vat_rate_percent: 19 }],
    payment_term_days: 8,
  };
}

function setProfile(db, values) {
  db.prepare(`UPDATE user_profile SET ${Object.keys(values).map((key) => `${key} = @${key}`).join(", ")} WHERE id = 1`).run(values);
}

async function runRechnungReS11Tests(run) {
  await run("Rechnung RE-S1.1: OwnOrganization ist aktuelle Ausstellerquelle; Altbeleg/PDF und historische Profilkopie bleiben unverändert", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-re-s11-"));
    const file = path.join(root, "bbm.db");
    const initialProfile = {
      name1: "BBM Alt GmbH", name2: "Niederlassung Nord", street: "Altweg 1", zip: "12345", city: "Altstadt", country: "DE",
      phone: "040 111", email: "alt@example.test", website: "https://alt.example.test", logo_path: "C:\\logos\\alt.png",
      tax_number: "ALT-TAX", vat_id: "DE111", iban: "DE001", bic: "ALTBBIC", bank_name: "Altbank",
      commercial_register: "AG Altstadt", register_number: "HRB 1", managing_director: "A. Alt", legal_notice: "Alter Hinweis",
    };
    let db = prepare(file, initialProfile);
    try {
      db.prepare("INSERT INTO firms (id,name,street,zip,city,use_customer) VALUES ('customer-a','Kunde Alpha','Alphaweg 1','11111','Alphaort',1),('customer-b','Kunde Beta','Betaweg 2','22222','Betaort',1)").run();
      for (const firmId of ["customer-a", "customer-b"]) firmUsagesRepo.setUsage({ firmId, usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER, enabled: true, dbConn: db });

      let sequence = 0;
      const catalogService = new InvoiceMasterDataService({
        catalogRepository: new InvoiceServiceCatalogRepository({ dbProvider: () => db, clock: () => "2026-09-13T12:00:00.000Z", idFactory: () => `service-${++sequence}` }),
        vatRateProvider: async () => 19,
      });
      const entries = [
        await catalogService.createCatalogEntry({ shortText: "Planung", longText: "Planungsleistung", unit: "h", unitPriceCents: 12500 }),
        await catalogService.createCatalogEntry({ shortText: "Beratung", longText: "Beratung vor Ort", unit: "h", unitPriceCents: 9800 }),
        await catalogService.createCatalogEntry({ shortText: "Dokumentation", longText: "Dokument erstellen", unit: "St", unitPriceCents: 45000 }),
      ];
      await catalogService.updateCatalogEntry({ id: entries[1].id, entry: { shortText: "Beratung geändert", longText: "Beratung und Prüfung", unit: "h", unitPriceCents: 10500 } });

      const invoiceService = new InvoiceService({
        repository: new InvoiceRepository({ dbProvider: () => db, clock: () => "2026-09-13T12:00:00.000Z" }),
        settingsGetMany: () => ({ "invoice.paymentTermDays": "8" }),
        today: () => "2026-09-13",
      });
      const oldBooked = await invoiceService.bookDraft((await invoiceService.createDraft(invoiceInput("customer-a"))).id);
      assert.deepEqual(
        [oldBooked.issuer_snapshot.profileId, oldBooked.issuer_snapshot.companyName, oldBooked.issuer_snapshot.logoPath, oldBooked.issuer_snapshot.legalNotice],
        ["own-organization", "BBM Alt GmbH", "C:\\logos\\alt.png", "Alter Hinweis"]
      );

      const pdfPath = path.join(root, "historische-rechnung.pdf");
      const pdfBytes = Buffer.from("%PDF-1.4\nhistorical-re-s1.1\n%%EOF\n", "utf8");
      fs.writeFileSync(pdfPath, pdfBytes);
      const pdfHash = crypto.createHash("sha256").update(pdfBytes).digest("hex");
      db.prepare(`INSERT INTO commercial_document_files (id, commercial_document_type, commercial_document_id, file_role, file_type, file_name, local_path, version, size_bytes, sha256, is_active, is_final, created_at) VALUES ('historic-pdf','INVOICE',?,'FINAL','PDF','historisch.pdf',?,1,?,?,1,1,'2026-09-13T12:00:00.000Z')`).run(oldBooked.id, pdfPath, pdfBytes.length, pdfHash);
      db.prepare("UPDATE invoices SET pdf_finalization_status = 'READY' WHERE id = ?").run(oldBooked.id);
      const oldSnapshotJson = db.prepare("SELECT issuer_snapshot_json FROM invoices WHERE id = ?").get(oldBooked.id).issuer_snapshot_json;
      const legacyProfileBefore = db.prepare("SELECT * FROM invoice_issuer_profiles WHERE id = 'default'").get();
      const oldPdfReference = db.prepare("SELECT * FROM commercial_document_files WHERE id = 'historic-pdf'").get();

      const reloadedDraft = await invoiceService.createDraft(invoiceInput("customer-b"));
      setProfile(db, {
        name1: "BBM Neu GmbH", name2: "Zentrale", street: "Neuweg 9", zip: "54321", city: "Neustadt", country: "DE",
        phone: "040 999", email: "neu@example.test", website: "https://neu.example.test", logo_path: "C:\\logos\\neu.png",
        tax_number: "NEU-TAX", vat_id: "DE999", iban: "DE999", bic: "NEUBBIC", bank_name: "Neubank",
        commercial_register: "AG Neustadt", register_number: "HRB 9", managing_director: "N. Neu", legal_notice: "Neuer Hinweis",
      });

      const currentOrganization = getOwnOrganization({ dbConn: db });
      assert.deepEqual([currentOrganization.legalName, currentOrganization.address.street, currentOrganization.bank.iban], ["BBM Neu GmbH", "Neuweg 9", "DE999"]);
      const preview = await invoiceService.previewDraft(reloadedDraft.id);
      const newlyBooked = await invoiceService.bookDraft(reloadedDraft.id);
      for (const snapshot of [preview.issuer_snapshot, newlyBooked.issuer_snapshot]) {
        assert.deepEqual(snapshot, {
          profileId: "own-organization", companyName: "BBM Neu GmbH", companyName2: "Zentrale", street: "Neuweg 9", zip: "54321", city: "Neustadt", country: "DE",
          phone: "040 999", email: "neu@example.test", website: "https://neu.example.test", logoPath: "C:\\logos\\neu.png", taxNumber: "NEU-TAX", vatId: "DE999",
          iban: "DE999", bic: "NEUBBIC", bankName: "Neubank", commercialRegister: "AG Neustadt", registerNumber: "HRB 9", managingDirector: "N. Neu", legalNotice: "Neuer Hinweis",
        });
      }
      assert.equal(db.prepare("SELECT issuer_snapshot_json FROM invoices WHERE id = ?").get(oldBooked.id).issuer_snapshot_json, oldSnapshotJson);
      assert.deepEqual(db.prepare("SELECT * FROM invoice_issuer_profiles WHERE id = 'default'").get(), legacyProfileBefore);
      assert.deepEqual(db.prepare("SELECT * FROM commercial_document_files WHERE id = 'historic-pdf'").get(), oldPdfReference);
      assert.deepEqual(fs.readFileSync(pdfPath), pdfBytes);

      db.close();
      db = prepare(file);
      const restartedCatalog = new InvoiceMasterDataService({ catalogRepository: new InvoiceServiceCatalogRepository({ dbProvider: () => db }) });
      const customers = new FirmDirectoryService({ dbProvider: () => db, usageRepo: firmUsagesRepo }).listCustomers({});
      assert.deepEqual(customers.map((entry) => [entry.id, entry.name]), [["customer-a", "Kunde Alpha"], ["customer-b", "Kunde Beta"]]);
      assert.deepEqual(restartedCatalog.listCatalog().map((entry) => [entry.id, entry.shortText, entry.unitPriceCents, entry.vatRatePercent]), [["service-2", "Beratung geändert", 10500, 19], ["service-3", "Dokumentation", 45000, 19], ["service-1", "Planung", 12500, 19]]);
      assert.deepEqual([getOwnOrganization({ dbConn: db }).legalName, getOwnOrganization({ dbConn: db }).bank.iban], ["BBM Neu GmbH", "DE999"]);
      assert.deepEqual(db.prepare("SELECT * FROM invoice_issuer_profiles WHERE id = 'default'").get(), legacyProfileBefore);
      assert.equal(db.prepare("SELECT issuer_snapshot_json FROM invoices WHERE id = ?").get(oldBooked.id).issuer_snapshot_json, oldSnapshotJson);
      assert.deepEqual(fs.readFileSync(pdfPath), pdfBytes);
    } finally {
      if (db?.open) db.close();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("Rechnung RE-S1.1: fehlende Pflichtwerte verweisen auf die vorhandene Profil-/Adresspflege", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-re-s11-required-"));
    const db = prepare(path.join(root, "bbm.db"), { name1: "BBM", street: "Weg 1", zip: "", city: "Ort" });
    try {
      db.prepare("INSERT INTO firms (id,name,use_customer) VALUES ('customer','Kunde',1)").run();
      firmUsagesRepo.setUsage({ firmId: "customer", usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER, enabled: true, dbConn: db });
      const service = new InvoiceService({ repository: new InvoiceRepository({ dbProvider: () => db }), settingsGetMany: () => ({}), today: () => "2026-09-13" });
      const draft = await service.createDraft(invoiceInput("customer"));
      await assert.rejects(() => service.previewDraft(draft.id), /Einstellungen > Profil \/ Adresse/);
      await assert.rejects(() => service.bookDraft(draft.id), /Einstellungen > Profil \/ Adresse/);
      assert.equal(service.get(draft.id).status, "DRAFT");
    } finally { db.close(); fs.rmSync(root, { recursive: true, force: true }); }
  });

  await run("Rechnung RE-S1.1: bisherige 19-Prozent-Katalogdaten bleiben beim Öffnen erhalten", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-re-s11-vat-migration-")); const file = path.join(root, "bbm.db");
    const db = new Database(file);
    db.exec(`CREATE TABLE projects (id TEXT PRIMARY KEY); CREATE TABLE firms (id TEXT PRIMARY KEY, removed_at TEXT, is_trashed INTEGER); CREATE TABLE user_profile (id INTEGER PRIMARY KEY); CREATE TABLE invoice_service_catalog (id TEXT PRIMARY KEY, short_text TEXT NOT NULL, long_text TEXT NOT NULL DEFAULT '', unit TEXT NOT NULL DEFAULT '', unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0), vat_rate_percent INTEGER NOT NULL DEFAULT 19 CHECK (vat_rate_percent = 19), created_at TEXT NOT NULL, updated_at TEXT NOT NULL); INSERT INTO invoice_service_catalog VALUES ('legacy-19','Bestand','','h',1000,19,'before','before');`);
    ensureInvoiceSchema(db);
    assert.deepEqual(db.prepare("SELECT * FROM invoice_service_catalog WHERE id='legacy-19'").get(), { id: "legacy-19", short_text: "Bestand", long_text: "", unit: "h", unit_price_cents: 1000, vat_rate_percent: 19, created_at: "before", updated_at: "before" });
    assert.match(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='invoice_service_catalog'").get().sql, /BETWEEN 0 AND 100/);
    db.close(); fs.rmSync(root, { recursive: true, force: true });
  });

  await run("Rechnung RE-S1.1: zentrale Mehrwertsteuer bleibt im Katalog sichtbar", async () => {
    const { formatCatalogVatRate } = await import("../../src/renderer/modules/rechnungen/masterDataCatalogFormat.mjs");
    assert.equal(formatCatalogVatRate(null, 19), "19 %");
    assert.equal(formatCatalogVatRate({ vatRatePercent: 19 }, 19), "19 %");
    assert.throws(() => formatCatalogVatRate({ vatRatePercent: 101 }, 19), /Mehrwertsteuer-Vorgabe/);
  });

  await run("Rechnung RE-S1.1: direkter Leistungskatalog ersetzt die zusätzliche Stammdatenseite", async () => {
    const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
    const ipc = read("src/main/ipc/rechnungIpc.js"); const preload = read("src/main/preload.js"); const service = read("src/main/domain/rechnung/InvoiceMasterDataService.js");
    const screen = read("src/renderer/modules/rechnungen/screens/RechnungScreen.js"); const contract = read("src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js"); const css = read("src/renderer/modules/rechnungen/styles/rechnungenDesign.css");
    for (const channel of ["rechnung:catalog:list", "rechnung:catalog:defaults", "rechnung:catalog:create", "rechnung:catalog:update"]) { assert.match(ipc, new RegExp(channel)); assert.match(preload, new RegExp(channel)); }
    for (const removed of [ipc, preload, service, screen]) assert.doesNotMatch(removed, /rechnung:issuer|rechnungIssuer|InvoiceIssuerProfileRepository|saveIssuerProfile|getIssuerProfile/);
    assert.match(screen, /ownOrganizationGet/); assert.match(screen, /rechnungListCustomers/); assert.match(screen, /rechnung\.editor\.customerPicker/); assert.match(screen, /button\("Leistungskatalog", "rechnung\.overview\.catalog"/);
    assert.doesNotMatch(screen, /Rechnungsstammdaten|Rechnungstellerprofil|Rechnungsteller speichern|rechnung\.masterData/);
    assert.doesNotMatch(contract, /rechnung\.masterData/);
    for (const id of ["rechnung.overview.catalog", "rechnung.catalog", "rechnung.catalog.form", "rechnung.catalog.shortText", "rechnung.catalog.vatRate", "rechnung.catalog.save"]) assert.match(contract, new RegExp(id.replaceAll(".", "\\.")));
    assert.match(css, /\.rechnung-catalog\s*\{[^}]*height:\s*100%;[^}]*overflow:\s*auto;/s);
    assert.doesNotMatch(css, /\.rechnung-master-/);
    assert.deepEqual(await new InvoiceMasterDataService().getCatalogDefaults(), { vatRatePercent: 19 });
  });
}

module.exports = { runRechnungReS11Tests };
