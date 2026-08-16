"use strict";

function ensureInvoiceSchema(db) {
  if (!db) throw new Error("db required");
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'BOOKED', 'CANCELLED')),
      source_type TEXT NOT NULL DEFAULT 'FREE' CHECK (source_type IN ('FREE', 'FROM_ORDER')),
      document_type TEXT NOT NULL DEFAULT 'INVOICE' CHECK (document_type IN ('INVOICE', 'PARTIAL', 'FINAL', 'HOURLY')),
      installment_number INTEGER,
      invoice_number TEXT UNIQUE,
      invoice_date TEXT NOT NULL,
      booked_at TEXT,
      service_period_type TEXT CHECK (service_period_type IN ('SINGLE_DATE', 'MONTH', 'RANGE')),
      service_date TEXT,
      service_period_start TEXT,
      service_period_end TEXT,
      customer_ref_kind TEXT CHECK (customer_ref_kind IN ('global_firm', 'project_firm')),
      customer_firm_id TEXT,
      customer_project_id TEXT,
      project_id TEXT,
      source_order_id TEXT,
      source_order_number TEXT,
      source_order_date TEXT,
      service_reference TEXT,
      construction_project TEXT,
      positions_json TEXT NOT NULL DEFAULT '[]',
      payment_term_days INTEGER NOT NULL DEFAULT 8 CHECK (payment_term_days BETWEEN 0 AND 3650),
      due_date TEXT NOT NULL,
      customer_snapshot_json TEXT,
      issuer_snapshot_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (installment_number IS NULL OR installment_number > 0),
      CHECK (status != 'BOOKED' OR (invoice_number IS NOT NULL AND booked_at IS NOT NULL AND customer_snapshot_json IS NOT NULL AND issuer_snapshot_json IS NOT NULL)),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_status_updated ON invoices(status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_ref_kind, customer_firm_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);

    CREATE TABLE IF NOT EXISTS invoice_number_sequences (
      sequence_key TEXT PRIMARY KEY,
      last_value INTEGER NOT NULL CHECK (last_value > 0),
      updated_at TEXT NOT NULL
    );
  `);

  const columns = new Set(db.prepare("PRAGMA table_info(invoices)").all().map((column) => column.name));
  if (!columns.has("construction_project")) db.exec("ALTER TABLE invoices ADD COLUMN construction_project TEXT");
  if (!columns.has("positions_json")) db.exec("ALTER TABLE invoices ADD COLUMN positions_json TEXT NOT NULL DEFAULT '[]'");
}

module.exports = { ensureInvoiceSchema };
