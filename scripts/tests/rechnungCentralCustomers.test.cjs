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
const { FirmDirectoryService } = require(
  path.join(rootPath, "src/main/domain/firms/FirmDirectoryService.js")
);

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
    INSERT INTO user_profile (id, name1, street, zip, city)
      VALUES (1, 'BBM', 'Werkweg 1', '10115', 'Berlin');
  `);
  ensureInvoiceSchema(db);
  let tick = 0;
  const repository = new InvoiceRepository({
    dbProvider: () => db,
    clock: () => `2026-08-23T10:00:${String(tick++).padStart(2, "0")}.000Z`,
  });
  const service = new InvoiceService({
    repository,
    settingsGetMany: () => ({ "invoice.paymentTermDays": "8" }),
    today: () => "2026-08-23",
  });
  const directory = new FirmDirectoryService({ dbProvider: () => db, usageRepo: usagesRepo });
  return {
    db,
    service,
    directory,
    close() {
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
    customer_ref_kind: "global_firm",
    customer_firm_id: customerId,
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
    snapshot:
      status === "BOOKED"
        ? JSON.stringify(snapshot || { companyName: "Historischer Kunde" })
        : null,
    issuer: status === "BOOKED" ? JSON.stringify({ companyName: "BBM" }) : null,
  });
}

async function runRechnungCentralCustomersTests(run) {
  await run("Rechnung R2-I1 01-07: zentrale Kundenrolle bleibt projektunabhängig und duplikatfrei", async () => {
    const env = fixture();
    try {
      insertFirm(env.db, "customer", "Nur Kunde", { customer: true });
      insertFirm(env.db, "both", "Kunde und Teilnehmer", {
        customer: true,
        participant: true,
      });
      insertFirm(env.db, "participant", "Nur Teilnehmer", { participant: true });
      insertFirm(env.db, "none", "Ohne Rolle");
      env.db
        .prepare("INSERT INTO project_global_firms (project_id, firm_id) VALUES ('p1', 'customer'), ('p1', 'both')")
        .run();

      const withoutProject = env.directory.listCustomers({});
      const withProject = env.directory.listCustomers({ projectId: "p1" });
      assert.deepEqual(withoutProject.map((firm) => firm.name), ["Kunde und Teilnehmer", "Nur Kunde"]);
      assert.deepEqual(withProject.map((firm) => firm.id), withoutProject.map((firm) => firm.id));
      assert.equal(new Set(withProject.map((firm) => firm.id)).size, 2);
      assert.ok(withProject.every((firm) => firm.kind === "global_firm"));
      assert.deepEqual(
        env.db
          .prepare("SELECT use_project_participant, use_customer FROM firms WHERE id = 'both'")
          .get(),
        { use_project_participant: 1, use_customer: 1 }
      );

      const noProjectDraft = await env.service.createDraft(invoiceInput("customer"));
      const projectDraft = await env.service.createDraft(
        invoiceInput("both", { project_id: "p1" })
      );
      assert.equal(noProjectDraft.project_id, null);
      assert.equal(projectDraft.project_id, "p1");
      assert.equal(projectDraft.customer_project_id, null);
      await assert.rejects(
        () => env.service.createDraft(invoiceInput("participant")),
        /nicht mehr verfügbar/
      );
      await assert.rejects(
        () =>
          env.service.createDraft(
            invoiceInput("legacy", {
              customer_ref_kind: "project_firm",
              customer_project_id: "p1",
            })
          ),
        /zentrale Firmen/
      );
    } finally {
      env.close();
    }
  });

  await run("Rechnung R2-I1 08-10: Buchung friert zentrale Kunden- und Ausstellerdaten ein", async () => {
    const env = fixture();
    try {
      insertFirm(env.db, "customer", "Kunde Vorher", {
        customer: true,
        street: "Altweg 1",
        zip: "12345",
        city: "Altstadt",
        email: "alt@example.test",
      });
      const draft = await env.service.createDraft(invoiceInput("customer", { project_id: "p1" }));
      const booked = await env.service.bookDraft(draft.id);
      assert.deepEqual(booked.customer_snapshot.source, {
        kind: "global_firm",
        id: "customer",
        projectId: null,
      });
      assert.equal(booked.customer_snapshot.companyName, "Kunde Vorher");
      assert.equal(booked.issuer_snapshot.companyName, "BBM");

      env.db
        .prepare("UPDATE firms SET name = 'Kunde Nachher', street = 'Neuweg 9' WHERE id = 'customer'")
        .run();
      usagesRepo.setUsage({
        firmId: "customer",
        usageCode: usagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER,
        enabled: false,
        dbConn: env.db,
      });
      assert.equal(
        env.db.prepare("SELECT use_customer FROM firms WHERE id = 'customer'").get().use_customer,
        0
      );
      env.db.prepare("UPDATE user_profile SET name1 = 'BBM Neu' WHERE id = 1").run();

      const restored = env.service.get(draft.id);
      assert.equal(restored.customer_snapshot.companyName, "Kunde Vorher");
      assert.equal(restored.customer_snapshot.street, "Altweg 1");
      assert.equal(restored.issuer_snapshot.companyName, "BBM");
      assert.equal(env.directory.listCustomers({ projectId: "p1" }).length, 0);
    } finally {
      env.close();
    }
  });

  await run("Rechnung R2-I1 11-12: nur eindeutige DRAFT-Altverweise werden migriert", () => {
    const env = fixture();
    try {
      insertFirm(env.db, "central-clear", "Eindeutig GmbH", { email: "klar@example.test" });
      insertFirm(env.db, "ambiguous-a", "Doppelt GmbH", { email: "gleich@example.test" });
      insertFirm(env.db, "ambiguous-b", "Doppelt GmbH", { email: "gleich@example.test" });
      insertFirm(env.db, "same-raw-id", "Andere Zentralfirma", {
        email: "zentral@example.test",
      });
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
      insertLegacyDraft(env.db, {
        id: "booked-legacy",
        firmId: "local-booked",
        status: "BOOKED",
      });
      insertLegacyDraft(env.db, { id: "draft-same-raw-id", firmId: "same-raw-id" });
      insertLegacyDraft(env.db, { id: "draft-global", firmId: "global-draft" });
      env.db
        .prepare("UPDATE invoices SET customer_ref_kind = 'global_firm' WHERE id = 'draft-global'")
        .run();

      const result = ensureInvoiceSchema(env.db);
      assert.deepEqual(
        env.db
          .prepare("SELECT customer_ref_kind, customer_firm_id, customer_project_id FROM invoices WHERE id = 'draft-clear'")
          .get(),
        {
          customer_ref_kind: "global_firm",
          customer_firm_id: "central-clear",
          customer_project_id: null,
        }
      );
      assert.deepEqual(
        env.db
          .prepare("SELECT customer_ref_kind, customer_firm_id, customer_project_id FROM invoices WHERE id = 'draft-ambiguous'")
          .get(),
        {
          customer_ref_kind: "project_firm",
          customer_firm_id: "local-ambiguous",
          customer_project_id: "p1",
        }
      );
      assert.deepEqual(
        env.db
          .prepare("SELECT status, customer_ref_kind, customer_firm_id FROM invoices WHERE id = 'booked-legacy'")
          .get(),
        {
          status: "BOOKED",
          customer_ref_kind: "project_firm",
          customer_firm_id: "local-booked",
        }
      );
      assert.equal(result.customerMigration.projectRefsMigrated, 1);
      assert.equal(result.customerMigration.globalRolesAdded, 1);
      assert.equal(result.customerMigration.unresolvedProjectRefs, 2);
      assert.equal(
        usagesRepo.hasUsage({
          firmId: "central-clear",
          usageCode: usagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER,
          dbConn: env.db,
        }),
        true
      );
      const unresolved = env.service.get("draft-ambiguous");
      assert.equal(unresolved.legacy_customer.name, "Doppelt GmbH");
      assert.equal(unresolved.customer_project_id, "p1");
      assert.equal(env.service.get("draft-same-raw-id").customer_ref_kind, "project_firm");
      assert.deepEqual(
        env.db
          .prepare("SELECT customer_ref_kind, customer_firm_id, customer_project_id FROM invoices WHERE id = 'draft-global'")
          .get(),
        {
          customer_ref_kind: "global_firm",
          customer_firm_id: "global-draft",
          customer_project_id: null,
        }
      );
      assert.equal(
        env.db.prepare("SELECT use_customer FROM firms WHERE id = 'global-draft'").get().use_customer,
        1
      );
      const second = ensureInvoiceSchema(env.db);
      assert.equal(second.customerMigration.projectRefsMigrated, 0);
      assert.equal(env.db.prepare("SELECT COUNT(*) AS count FROM invoices").get().count, 5);
    } finally {
      env.close();
    }
  });
}

module.exports = { runRechnungCentralCustomersTests };
