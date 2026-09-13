const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
const { getOwnOrganization } = require("../../src/main/db/ownOrganizationRepo");

function database() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE projects (id TEXT PRIMARY KEY);
    CREATE TABLE firms (id TEXT PRIMARY KEY, removed_at TEXT, is_trashed INTEGER);
    CREATE TABLE user_profile (
      id INTEGER PRIMARY KEY, name1 TEXT, name2 TEXT, street TEXT, zip TEXT,
      city TEXT, country TEXT, phone TEXT, email TEXT, website TEXT, logo_path TEXT,
      tax_number TEXT, vat_id TEXT, iban TEXT, bic TEXT, bank_name TEXT,
      commercial_register TEXT, register_number TEXT, managing_director TEXT, legal_notice TEXT
    );
  `);
  return db;
}

async function runRechnungIssuerProfileTests(run) {
  await run("Rechnung #275 R3: historische Ausstellerprofiltabelle wird einmalig angelegt und nicht nachgeführt", () => {
    const db = database();
    try {
      db.prepare("INSERT INTO user_profile (id, name1, street, zip, city, iban) VALUES (1, 'Betrieb Alt', 'Altweg 1', '12345', 'Altstadt', 'DE001')").run();
      ensureInvoiceSchema(db);
      const historical = db.prepare("SELECT * FROM invoice_issuer_profiles WHERE id = 'default'").get();
      db.prepare("UPDATE user_profile SET name1 = 'Betrieb Neu', iban = 'DE999' WHERE id = 1").run();
      ensureInvoiceSchema(db);
      assert.deepEqual(db.prepare("SELECT * FROM invoice_issuer_profiles WHERE id = 'default'").get(), historical);
      assert.deepEqual([getOwnOrganization({ dbConn: db }).legalName, getOwnOrganization({ dbConn: db }).bank.iban], ["Betrieb Neu", "DE999"]);
    } finally { db.close(); }
  });

  await run("Rechnung #275 R3: leere historische Erstmigration wartet auf verwertbare OwnOrganization", () => {
    const db = database();
    try {
      ensureInvoiceSchema(db);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM invoice_issuer_profiles").get().count, 0);
      db.prepare("INSERT INTO user_profile (id, name1, street, zip, city) VALUES (1, 'Später GmbH', 'Weg 3', '20000', 'Hamburg')").run();
      ensureInvoiceSchema(db);
      assert.equal(db.prepare("SELECT legal_name FROM invoice_issuer_profiles WHERE id = 'default'").get().legal_name, "Später GmbH");
    } finally { db.close(); }
  });

  await run("Rechnung #275 R3: LicenseSubject wird nicht als aktuelle OwnOrganization interpretiert", () => {
    const ownOrganization = require("../../src/shared/identity/ownOrganization.cjs");
    const issuer = require("../../src/shared/rechnung/invoiceIssuerProfile.cjs");
    assert.equal(ownOrganization.createOwnOrganization({ customerName: "Lizenzkunde", licenseId: "LIC-7" }).legalName, "");
    assert.equal(issuer.createInvoiceIssuerProfile({ customerName: "Lizenzkunde" }).legalName, "");
  });

  await run("Rechnung #275 R3: Snapshot mappt die vollständige kanonische OwnOrganization ohne Live-Referenz", () => {
    const { createOwnOrganization } = require("../../src/shared/identity/ownOrganization.cjs");
    const { toInvoiceIssuerSnapshot } = require("../../src/shared/rechnung/invoiceIssuerProfile.cjs");
    const organization = createOwnOrganization({
      name1: "Rechnung GmbH", name2: "Zentrale", street: "Weg 1", zip: "12345", city: "Ort", country: "DE",
      phone: "0401", email: "rechnung@example.test", website: "https://example.test", logo_path: "logo.png",
      tax_number: "T-1", vat_id: "DE1", iban: "DE001", bic: "BIC1", bank_name: "Bank",
      commercial_register: "AG Ort", register_number: "HRB 1", managing_director: "M. Muster", legal_notice: "Hinweis",
    });
    const snapshot = toInvoiceIssuerSnapshot(organization);
    assert.deepEqual(snapshot, {
      profileId: "own-organization", companyName: "Rechnung GmbH", companyName2: "Zentrale", street: "Weg 1", zip: "12345", city: "Ort", country: "DE",
      phone: "0401", email: "rechnung@example.test", website: "https://example.test", logoPath: "logo.png", taxNumber: "T-1", vatId: "DE1",
      iban: "DE001", bic: "BIC1", bankName: "Bank", commercialRegister: "AG Ort", registerNumber: "HRB 1", managingDirector: "M. Muster", legalNotice: "Hinweis",
    });
    assert.equal(Object.isFrozen(snapshot), true);
  });

  await run("Rechnung #275 R3: historische Profildaten besitzen keinen aktiven Rechnungs-Editorzugang", () => {
    const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
    const activeSources = [
      read("src/main/db/invoiceRepository.js"),
      read("src/main/domain/rechnung/InvoiceMasterDataService.js"),
      read("src/main/ipc/rechnungIpc.js"),
      read("src/main/preload.js"),
      read("src/renderer/modules/rechnungen/screens/RechnungScreen.js"),
    ].join("\n");
    assert.doesNotMatch(activeSources, /invoiceIssuerProfileRepo|rechnung:issuer|getIssuerProfile|saveIssuerProfile|rechnungIssuer/);
    assert.match(activeSources, /getOwnOrganization/);
    assert.equal(fs.existsSync(path.join(process.cwd(), "src/main/db/invoiceIssuerProfileRepo.js")), false);
  });
}

module.exports = { runRechnungIssuerProfileTests };
