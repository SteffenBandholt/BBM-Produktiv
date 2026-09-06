const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
const { InvoiceIssuerProfileRepository } = require("../../src/main/db/invoiceIssuerProfileRepo");

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
  await run("Rechnung #275 R3: Migration initialisiert eigenständiges Ausstellerprofil einmalig aus OwnOrganization", () => {
    const db = database();
    try {
      db.prepare("INSERT INTO user_profile (id, name1, street, zip, city, iban) VALUES (1, 'Betrieb Alt', 'Altweg 1', '12345', 'Altstadt', 'DE001')").run();
      ensureInvoiceSchema(db);
      const repo = new InvoiceIssuerProfileRepository({ dbProvider: () => db, clock: () => "2026-09-06T12:00:00.000Z" });
      assert.deepEqual([repo.get().identityType, repo.get().legalName, repo.get().iban], ["invoice-issuer-profile", "Betrieb Alt", "DE001"]);
      db.prepare("UPDATE user_profile SET name1 = 'Betrieb Neu', iban = 'DE999' WHERE id = 1").run();
      ensureInvoiceSchema(db);
      assert.deepEqual([repo.get().legalName, repo.get().iban], ["Betrieb Alt", "DE001"]);
    } finally { db.close(); }
  });

  await run("Rechnung #275 R3: Ausstellerprofil ist unabhängig bearbeitbar", () => {
    const db = database();
    try {
      ensureInvoiceSchema(db);
      const repo = new InvoiceIssuerProfileRepository({ dbProvider: () => db, clock: () => "2026-09-06T12:00:00.000Z" });
      const updated = repo.upsert({ legalName: "Rechnung GmbH", street: "Rechnungsweg 2", zip: "54321", city: "Rechnungsstadt", vatId: "DE123", iban: "DE002" });
      assert.deepEqual([updated.legalName, updated.street, updated.vatId, updated.iban], ["Rechnung GmbH", "Rechnungsweg 2", "DE123", "DE002"]);
      assert.equal(db.prepare("SELECT name1 FROM user_profile WHERE id = 1").get(), undefined);
    } finally { db.close(); }
  });

  await run("Rechnung #275 R3: leere Erstmigration wartet auf verwertbare OwnOrganization", () => {
    const db = database();
    try {
      ensureInvoiceSchema(db);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM invoice_issuer_profiles").get().count, 0);
      db.prepare("INSERT INTO user_profile (id, name1, street, zip, city) VALUES (1, 'Später GmbH', 'Weg 3', '20000', 'Hamburg')").run();
      ensureInvoiceSchema(db);
      assert.equal(db.prepare("SELECT legal_name FROM invoice_issuer_profiles WHERE id = 'default'").get().legal_name, "Später GmbH");
    } finally { db.close(); }
  });

  await run("Rechnung #275 R3: Ausstellerprofil bleibt fachlich außerhalb des Core-Vertrags", () => {
    const ownOrganization = require("../../src/shared/identity/ownOrganization.cjs");
    const issuer = require("../../src/shared/rechnung/invoiceIssuerProfile.cjs");
    assert.notEqual(issuer.INVOICE_ISSUER_PROFILE_ID, ownOrganization.OWN_ORGANIZATION_ID);
    assert.equal(issuer.createInvoiceIssuerProfile({ customerName: "Lizenzkunde" }).legalName, "");
  });

  await run("Rechnung #275 R3: Snapshot enthält rechtlich relevante Profildaten ohne Live-Referenz", () => {
    const { toInvoiceIssuerSnapshot } = require("../../src/shared/rechnung/invoiceIssuerProfile.cjs");
    const source = { id: "default", legal_name: "Rechnung GmbH", street: "Weg 1", zip: "12345", city: "Ort", tax_number: "T-1", vat_id: "DE1", iban: "DE001" };
    const snapshot = toInvoiceIssuerSnapshot(source);
    source.legal_name = "Geändert";
    assert.deepEqual([snapshot.profileId, snapshot.companyName, snapshot.taxNumber, snapshot.vatId, snapshot.iban], ["default", "Rechnung GmbH", "T-1", "DE1", "DE001"]);
    assert.equal(Object.isFrozen(snapshot), true);
  });
}

module.exports = { runRechnungIssuerProfileTests };
