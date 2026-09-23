const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

const rootPath = process.cwd();
const usagesRepo = require(path.join(rootPath, "src/main/db/firmUsagesRepo.js"));
const { ensureInvoiceSchema } = require(path.join(rootPath, "src/main/db/invoiceMigrations.js"));
const { InvoiceRepository } = require(path.join(rootPath, "src/main/db/invoiceRepository.js"));
const { InvoiceService } = require(path.join(rootPath, "src/main/domain/rechnung/InvoiceService.js"));
const { createCustomerCore } = require(path.join(rootPath, "src/customer-core"));

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-invoice-central-customers-"));
  const db = new Database(path.join(root, "test.db"));
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE firms (
      id TEXT PRIMARY KEY, short TEXT, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT,
      country TEXT, phone TEXT, email TEXT, role_code INTEGER DEFAULT 60,
      use_project_participant INTEGER DEFAULT 0, use_customer INTEGER DEFAULT 0,
      removed_at TEXT, is_trashed INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT
    );
    CREATE TABLE project_firms (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, short TEXT, name TEXT, name2 TEXT,
      street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT,
      use_project_participant INTEGER DEFAULT 0, use_customer INTEGER DEFAULT 0,
      removed_at TEXT, is_active INTEGER DEFAULT 1, created_at TEXT, updated_at TEXT
    );
    CREATE TABLE project_global_firms (
      project_id TEXT NOT NULL, firm_id TEXT NOT NULL, is_active INTEGER DEFAULT 1,
      removed_at TEXT, created_at TEXT, updated_at TEXT, PRIMARY KEY (project_id, firm_id)
    );
    CREATE TABLE user_profile (
      id INTEGER PRIMARY KEY, name1 TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT,
      country TEXT, phone TEXT, email TEXT, tax_number TEXT, vat_id TEXT, iban TEXT, bic TEXT,
      bank_name TEXT
    );
    INSERT INTO projects (id, name) VALUES ('p1', 'Projekt Eins');
    INSERT INTO user_profile (id, name1, street, zip, city, country)
      VALUES (1, 'BBM', 'Werkweg 1', '10115', 'Berlin', 'DE');
  `);
  ensureInvoiceSchema(db);
  const customerCore = createCustomerCore({ userDataPath: path.join(root, "customer-data") });
  let tick = 0;
  const repository = new InvoiceRepository({
    dbProvider: () => db,
    clock: () => `2026-08-23T10:00:${String(tick++).padStart(2, "0")}.000Z`,
  });
  const service = new InvoiceService({
    repository,
    settingsGetMany: () => ({ "invoice.paymentTermDays": "8" }),
    today: () => "2026-08-23",
    customerService: customerCore.service,
  });
  return {
    db,
    service,
    customerCore,
    close() {
      customerCore.close();
      db.close();
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function insertFirm(db, id, name, fields = {}) {
  db.prepare(`
    INSERT INTO firms (
      id, name, street, zip, city, email, use_project_participant, use_customer,
      created_at, updated_at
    ) VALUES (
      @id, @name, @street, @zip, @city, @email, @participant, @customer, 'now', 'now'
    )
  `).run({
    id,
    name,
    street: fields.street || null,
    zip: fields.zip || null,
    city: fields.city || null,
    email: fields.email || null,
    participant: fields.participant ? 1 : 0,
    customer: fields.customer ? 1 : 0,
  });
  const usageCodes = [];
  if (fields.participant) usageCodes.push(usagesRepo.FIRM_USAGE_CODES.PROJECT_PARTICIPANT);
  if (fields.customer) usageCodes.push(usagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER);
  usagesRepo.replaceUsages({ firmId: id, usageCodes, dbConn: db });
}

function invoiceInput(customerId, overrides = {}) {
  return {
    source_type: "FREE",
    document_type: "INVOICE",
    invoice_date: "2026-08-23",
    service_period_type: "SINGLE_DATE",
    service_date: "2026-08-23",
    customer_id: customerId,
    customer_ref_kind: null,
    customer_firm_id: null,
    customer_project_id: null,
    service_reference: "Zentrale Kundenbasis",
    positions: [],
    payment_term_days: 8,
    ...overrides,
  };
}

function insertLegacyDraft(db, { id, firmId, projectId = "p1", status = "DRAFT", snapshot = null }) {
  db.prepare(`
    INSERT INTO invoices (
      id, status, source_type, document_type, invoice_number, invoice_date, booked_at,
      service_period_type, service_date, customer_ref_kind, customer_firm_id,
      customer_project_id, positions_json, payment_term_days, due_date,
      customer_snapshot_json, issuer_snapshot_json, created_at, updated_at
    ) VALUES (
      @id, @status, 'FREE', 'INVOICE', @number, '2026-08-23', @bookedAt,
      'SINGLE_DATE', '2026-08-23', 'project_firm', @firmId, @projectId,
      '[]', 8, '2026-08-31', @snapshot, @issuer, 'now', 'now'
    )
  `).run({
    id,
    status,
    number: status === "BOOKED" ? `ALT-${id}` : null,
    bookedAt: status === "BOOKED" ? "2026-08-23T09:00:00.000Z" : null,
    firmId,
    projectId,
    snapshot: status === "BOOKED"
      ? JSON.stringify(snapshot || { companyName: "Historischer Kunde" })
      : null,
    issuer: status === "BOOKED" ? JSON.stringify({ companyName: "BBM" }) : null,
  });
}

async function runRechnungCentralCustomersTests(run) {
  await run("Rechnung R2-I1 neu: Rechnungskunden stammen aus Customer Core und nicht aus Firmenrollen", async () => {
    const env = fixture();
    try {
      insertFirm(env.db, "legacy-customer", "Legacy Rechnungskunde", { customer: true });
      insertFirm(env.db, "participant", "Nur Teilnehmer", { participant: true });
      const customer = env.customerCore.service.createCustomer({
        name1: "Zentraler Kunde",
        street: "Kundenweg 1",
        postalCode: "20095",
        city: "Hamburg",
        countryCode: "DE",
      });

      const list = env.service.listCustomers();
      assert.equal(list.length, 1);
      assert.equal(list[0].customerId, customer.customerId);
      assert.equal(list[0].name1, "Zentraler Kunde");
      assert.equal(list.some((entry) => entry.id === "legacy-customer"), false);

      const draft = await env.service.createDraft(invoiceInput(customer.customerId, { project_id: "p1" }));
      assert.equal(draft.customer_id, customer.customerId);
      assert.equal(draft.customer_firm_id, null);
      assert.equal(draft.customer_ref_kind, null);
      assert.equal(draft.project_id, "p1");
    } finally {
      env.close();
    }
  });

  await run("Rechnung R2-I1 neu: Buchung friert Customer- und Ausstellerdaten dauerhaft ein", async () => {
    const env = fixture();
    try {
      const customer = env.customerCore.service.createCustomer({
        name1: "Kunde Vorher",
        street: "Altweg 1",
        postalCode: "12345",
        city: "Altstadt",
        countryCode: "DE",
        email: "alt@example.test",
      });
      const draft = await env.service.createDraft(invoiceInput(customer.customerId, { project_id: "p1" }));
      const booked = await env.service.bookDraft(draft.id);
      assert.deepEqual(booked.customer_snapshot.source, {
        kind: "customer",
        id: customer.customerId,
      });
      assert.equal(booked.customer_snapshot.customerNumber, customer.customerNumber);
      assert.equal(booked.customer_snapshot.companyName, "Kunde Vorher");
      assert.equal(booked.issuer_snapshot.companyName, "BBM");

      env.customerCore.service.updateCustomer(customer.customerId, {
        name1: "Kunde Nachher",
        street: "Neuweg 9",
      }, { expectedRevision: customer.revision });
      env.db.prepare("UPDATE user_profile SET name1 = 'Betreiber Neu' WHERE id = 1").run();

      const restored = env.service.get(draft.id);
      assert.equal(restored.customer_snapshot.companyName, "Kunde Vorher");
      assert.equal(restored.customer_snapshot.street, "Altweg 1");
      assert.equal(restored.issuer_snapshot.companyName, "BBM");
    } finally {
      env.close();
    }
  });

  await run("Rechnung R2-I1 Legacy: alte Firmen-DRAFT-Verweise bleiben nur als kontrollierte Uebergangsmigration erhalten", () => {
    const env = fixture();
    try {
      insertFirm(env.db, "central-clear", "Eindeutig GmbH", { email: "klar@example.test" });
      insertFirm(env.db, "ambiguous-a", "Doppelt GmbH", { email: "gleich@example.test" });
      insertFirm(env.db, "ambiguous-b", "Doppelt GmbH", { email: "gleich@example.test" });
      insertFirm(env.db, "same-raw-id", "Andere Zentralfirma", { email: "zentral@example.test" });
      insertFirm(env.db, "global-draft", "Globaler Altentwurf");
      env.db.prepare(`
        INSERT INTO project_firms (id, project_id, name, email, created_at, updated_at)
        VALUES ('local-clear', 'p1', 'Eindeutig GmbH', 'klar@example.test', 'now', 'now'),
               ('local-ambiguous', 'p1', 'Doppelt GmbH', 'gleich@example.test', 'now', 'now'),
               ('local-booked', 'p1', 'Historisch GmbH', 'historisch@example.test', 'now', 'now'),
               ('same-raw-id', 'p1', 'Andere Projektfirma', 'projekt@example.test', 'now', 'now')
      `).run();
      insertLegacyDraft(env.db, { id: "draft-clear", firmId: "local-clear" });
      insertLegacyDraft(env.db, { id: "draft-ambiguous", firmId: "local-ambiguous" });
      insertLegacyDraft(env.db, { id: "booked-legacy", firmId: "local-booked", status: "BOOKED" });
      insertLegacyDraft(env.db, { id: "draft-same-raw-id", firmId: "same-raw-id" });
      insertLegacyDraft(env.db, { id: "draft-global", firmId: "global-draft" });
      env.db.prepare("UPDATE invoices SET customer_ref_kind = 'global_firm' WHERE id = 'draft-global'").run();

      const result = ensureInvoiceSchema(env.db);
      assert.deepEqual(
        env.db.prepare("SELECT customer_id, customer_ref_kind, customer_firm_id, customer_project_id FROM invoices WHERE id = 'draft-clear'").get(),
        {
          customer_id: null,
          customer_ref_kind: "global_firm",
          customer_firm_id: "central-clear",
          customer_project_id: null,
        }
      );
      assert.deepEqual(
        env.db.prepare("SELECT customer_id, customer_ref_kind, customer_firm_id, customer_project_id FROM invoices WHERE id = 'draft-ambiguous'").get(),
        {
          customer_id: null,
          customer_ref_kind: "project_firm",
          customer_firm_id: "local-ambiguous",
          customer_project_id: "p1",
        }
      );
      assert.equal(result.customerMigration.projectRefsMigrated, 1);
      assert.equal(result.customerMigration.globalRolesAdded, 1);
      assert.equal(result.customerMigration.unresolvedProjectRefs, 2);
      assert.equal(env.service.get("draft-ambiguous").legacy_customer.name, "Doppelt GmbH");
      assert.equal(env.service.get("draft-same-raw-id").customer_ref_kind, "project_firm");
      const second = ensureInvoiceSchema(env.db);
      assert.equal(second.customerMigration.projectRefsMigrated, 0);
      assert.equal(env.db.prepare("SELECT COUNT(*) AS count FROM invoices").get().count, 5);
    } finally {
      env.close();
    }
  });
}

module.exports = { runRechnungCentralCustomersTests };
