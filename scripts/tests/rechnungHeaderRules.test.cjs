const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRechnungHeaderRulesTests(run) {
  const rules = await importEsmFromFile(path.join(process.cwd(), "src/shared/rechnung/invoiceHeaderRules.mjs"));
  const currentInvoiceColumns = [
    "id", "status", "source_type", "document_type", "installment_number", "invoice_number", "invoice_date", "booked_at",
    "service_period_type", "service_date", "service_period_start", "service_period_end", "customer_ref_kind", "customer_firm_id",
    "customer_project_id", "project_id", "source_order_id", "source_order_number", "source_order_date", "service_reference",
    "construction_project", "intro_text", "positions_json", "payment_term_days", "due_date", "customer_snapshot_json", "issuer_snapshot_json",
    "created_at", "updated_at",
  ];

  await run("Rechnung Step 2: Migration legt erweiterbaren Belegkopf und Nummernfolge idempotent an", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-invoice-header-schema-"));
    const db = new Database(path.join(root, "test.db"));
    try {
      db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY)");
      const { ensureInvoiceSchema } = require(path.join(process.cwd(), "src/main/db/invoiceMigrations.js"));
      ensureInvoiceSchema(db);
      ensureInvoiceSchema(db);
      const columns = new Set(db.prepare("PRAGMA table_info(invoices)").all().map((entry) => entry.name));
      for (const name of currentInvoiceColumns) assert.equal(columns.has(name), true, name);
      assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoice_number_sequences'").get().name, "invoice_number_sequences");
      assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    } finally {
      db.close();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("Rechnung Step 2: reales Legacy-Schema wird datenverlustfrei und idempotent aktualisiert", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-invoice-legacy-schema-"));
    const db = new Database(path.join(root, "test.db"));
    try {
      db.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE projects (id TEXT PRIMARY KEY);
        CREATE TABLE firms (id TEXT PRIMARY KEY);
        CREATE TABLE persons (id TEXT PRIMARY KEY);
        INSERT INTO projects (id) VALUES ('project-1');
        INSERT INTO firms (id) VALUES ('firm-1');
        INSERT INTO persons (id) VALUES ('person-1');
        CREATE TABLE invoices (
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
          invoice_number TEXT,
          invoice_date TEXT NOT NULL,
          service_date TEXT,
          customer_firm_id TEXT NOT NULL,
          customer_person_id TEXT,
          project_id TEXT,
          subject TEXT,
          issuer_snapshot_json TEXT NOT NULL,
          recipient_snapshot_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (customer_firm_id) REFERENCES firms(id) ON DELETE RESTRICT,
          FOREIGN KEY (customer_person_id) REFERENCES persons(id) ON DELETE SET NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
        );
        CREATE UNIQUE INDEX idx_invoices_invoice_number ON invoices(invoice_number) WHERE invoice_number IS NOT NULL;
        CREATE INDEX idx_invoices_status_updated ON invoices(status, updated_at DESC);
      `);
      const issuerSnapshot = JSON.stringify({ companyName: "Alt-Aussteller" });
      const recipientSnapshot = JSON.stringify({ companyName: "Alt-Empfänger" });
      db.prepare(`
        INSERT INTO invoices (
          id, status, invoice_number, invoice_date, service_date, customer_firm_id, customer_person_id,
          project_id, subject, issuer_snapshot_json, recipient_snapshot_json, created_at, updated_at
        ) VALUES (?, 'draft', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "legacy-1", "2026-08-01", "2026-07-31", "firm-1", "person-1", "project-1", "Erhaltener Alt-Betreff",
        issuerSnapshot, recipientSnapshot, "2026-08-01T10:00:00.000Z", "2026-08-01T11:00:00.000Z",
      );

      const { ensureInvoiceSchema } = require(path.join(process.cwd(), "src/main/db/invoiceMigrations.js"));
      ensureInvoiceSchema(db);

      const columns = new Set(db.prepare("PRAGMA table_info(invoices)").all().map((entry) => entry.name));
      for (const name of currentInvoiceColumns) assert.equal(columns.has(name), true, name);
      for (const name of ["customer_person_id", "subject", "recipient_snapshot_json", "legacy_status"]) assert.equal(columns.has(name), true, name);

      const legacy = db.prepare("SELECT * FROM invoices WHERE id = ?").get("legacy-1");
      assert.equal(legacy.status, "DRAFT");
      assert.equal(legacy.legacy_status, "draft");
      assert.equal(legacy.source_type, "FREE");
      assert.equal(legacy.document_type, "INVOICE");
      assert.equal(legacy.payment_term_days, 8);
      assert.equal(legacy.positions_json, "[]");
      assert.equal(legacy.intro_text, null);
      assert.equal(legacy.due_date, null);
      assert.equal(legacy.booked_at, null);
      assert.equal(legacy.invoice_date, "2026-08-01");
      assert.equal(legacy.service_date, "2026-07-31");
      assert.equal(legacy.customer_firm_id, "firm-1");
      assert.equal(legacy.customer_person_id, "person-1");
      assert.equal(legacy.project_id, "project-1");
      assert.equal(legacy.subject, "Erhaltener Alt-Betreff");
      assert.equal(legacy.issuer_snapshot_json, issuerSnapshot);
      assert.equal(legacy.recipient_snapshot_json, recipientSnapshot);

      const { InvoiceRepository } = require(path.join(process.cwd(), "src/main/db/invoiceRepository.js"));
      const repository = new InvoiceRepository({ dbProvider: () => db, clock: () => "2026-08-17T12:00:00.000Z" });
      const created = repository.createDraft({
        source_type: "FREE", document_type: "INVOICE", installment_number: null, invoice_date: "2026-08-17",
        service_period_type: "SINGLE_DATE", service_date: "2026-08-17", service_period_start: null, service_period_end: null,
        customer_ref_kind: null, customer_firm_id: null, customer_project_id: null, project_id: null,
        source_order_id: null, source_order_number: null, source_order_date: null, service_reference: null,
        construction_project: null, intro_text: "", positions: [], payment_term_days: 8, due_date: "2026-08-25",
      });
      assert.equal(created.status, "DRAFT");
      assert.equal(created.source_type, "FREE");

      const snapshot = {
        schema: db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'invoices'").get().sql,
        columns: db.prepare("PRAGMA table_info(invoices)").all(),
        indexes: db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'invoices' ORDER BY name").all(),
        rows: db.prepare("SELECT * FROM invoices ORDER BY id").all(),
      };
      ensureInvoiceSchema(db);
      assert.deepEqual({
        schema: db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'invoices'").get().sql,
        columns: db.prepare("PRAGMA table_info(invoices)").all(),
        indexes: db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'invoices' ORDER BY name").all(),
        rows: db.prepare("SELECT * FROM invoices ORDER BY id").all(),
      }, snapshot);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM invoices").get().count, 2);
      assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    } finally {
      db.close();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("Rechnung Step 2: Zahlungsziel wird kalendergenau aus Rechnungsdatum berechnet", () => {
    assert.equal(rules.DEFAULT_PAYMENT_TERM_DAYS, 8);
    assert.equal(rules.PAYMENT_TERM_SETTING_KEY, "invoice.paymentTermDays");
    assert.equal(rules.addCalendarDays("2026-08-15", 8), "2026-08-23");
    assert.equal(rules.addCalendarDays("2024-02-27", 2), "2024-02-29");
  });

  await run("Rechnung Step 2: alle drei Leistungszeitpunkte werden eindeutig strukturiert", () => {
    assert.deepEqual(rules.normalizeServicePeriod({ service_period_type: "SINGLE_DATE", service_date: "2026-07-15", service_period_start: "2020-01-01" }), { service_period_type: "SINGLE_DATE", service_date: "2026-07-15", service_period_start: null, service_period_end: null });
    assert.deepEqual(rules.normalizeServicePeriod({ service_period_type: "MONTH", service_month: "2026-07" }), { service_period_type: "MONTH", service_date: null, service_period_start: "2026-07-01", service_period_end: "2026-07-31" });
    assert.deepEqual(rules.normalizeServicePeriod({ service_period_type: "RANGE", service_period_start: "2026-03-01", service_period_end: "2026-06-30" }), { service_period_type: "RANGE", service_date: null, service_period_start: "2026-03-01", service_period_end: "2026-06-30" });
    assert.throws(() => rules.normalizeServicePeriod({ service_period_type: "RANGE", service_period_start: "2026-06-30", service_period_end: "2026-03-01" }), /Beginn/);
  });

  await run("Rechnung Step 2: Belegarten und Abschlagsnummer bleiben fachlich getrennt", () => {
    const base = { source_type: "FREE", invoice_date: "2026-08-15", service_period_type: "SINGLE_DATE", service_date: "2026-08-14", payment_term_days: 8 };
    assert.equal(rules.formatDocumentType(rules.normalizeInvoiceHeader({ ...base, document_type: "PARTIAL", installment_number: 2 })), "2. Abschlagsrechnung");
    assert.equal(rules.formatDocumentType(rules.normalizeInvoiceHeader({ ...base, document_type: "HOURLY" })), "Stundenlohnrechnung");
    assert.throws(() => rules.normalizeInvoiceHeader({ ...base, document_type: "INVOICE", installment_number: 1 }), /nur für Abschlagsrechnungen/);
  });

  await run("Rechnung Step 2: Buchungsvalidierung fordert Kunde, Leistungszeitpunkt und Leistungsbezug", () => {
    const base = { source_type: "FREE", document_type: "INVOICE", invoice_date: "2026-08-15", service_period_type: "SINGLE_DATE", service_date: "2026-08-14", payment_term_days: 8 };
    assert.throws(() => rules.normalizeInvoiceHeader(base, { requireBookingFields: true }), /Rechnungskunden/);
    assert.throws(() => rules.normalizeInvoiceHeader({ ...base, customer_ref_kind: "global_firm", customer_firm_id: "f1" }, { requireBookingFields: true }), /Leistungsbezug/);
    const normalized = rules.normalizeInvoiceHeader({ ...base, customer_ref_kind: "global_firm", customer_firm_id: "f1", service_reference: "Malerarbeiten" }, { requireBookingFields: true });
    assert.equal(normalized.due_date, "2026-08-23");
  });

  await run("Rechnung Step 2: Rechnungsnummerformat bleibt von der Sequenzverwaltung getrennt", () => {
    assert.equal(rules.formatInvoiceNumber("2026", 41), "2026-0041");
  });
}

module.exports = { runRechnungHeaderRulesTests };
