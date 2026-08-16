const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRechnungHeaderRulesTests(run) {
  const rules = await importEsmFromFile(path.join(process.cwd(), "src/shared/rechnung/invoiceHeaderRules.mjs"));

  await run("Rechnung Step 2: Migration legt erweiterbaren Belegkopf und Nummernfolge idempotent an", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-invoice-header-schema-"));
    const db = new Database(path.join(root, "test.db"));
    try {
      db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY)");
      const { ensureInvoiceSchema } = require(path.join(process.cwd(), "src/main/db/invoiceMigrations.js"));
      ensureInvoiceSchema(db);
      ensureInvoiceSchema(db);
      const columns = new Set(db.prepare("PRAGMA table_info(invoices)").all().map((entry) => entry.name));
      for (const name of ["id", "status", "source_type", "document_type", "installment_number", "invoice_number", "invoice_date", "booked_at", "service_period_type", "service_date", "service_period_start", "service_period_end", "customer_ref_kind", "customer_firm_id", "customer_project_id", "project_id", "source_order_id", "source_order_number", "source_order_date", "service_reference", "payment_term_days", "due_date", "customer_snapshot_json", "issuer_snapshot_json", "created_at", "updated_at"]) assert.equal(columns.has(name), true, name);
      assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoice_number_sequences'").get().name, "invoice_number_sequences");
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
