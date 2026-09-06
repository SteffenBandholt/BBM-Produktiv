"use strict";

const firmUsagesRepo = require("./firmUsagesRepo");

const CURRENT_INVOICE_COLUMN_DEFINITIONS = Object.freeze([
  ["order_snapshot_at", "TEXT"],
  ["order_snapshot_json", "TEXT"],
  ["status", "TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'BOOKED', 'CANCELLED'))"],
  ["source_type", "TEXT NOT NULL DEFAULT 'FREE' CHECK (source_type IN ('FREE', 'FROM_ORDER'))"],
  ["document_type", "TEXT NOT NULL DEFAULT 'INVOICE' CHECK (document_type IN ('INVOICE', 'PARTIAL', 'FINAL', 'HOURLY'))"],
  ["installment_number", "INTEGER CHECK (installment_number IS NULL OR installment_number > 0)"],
  ["invoice_number", "TEXT"],
  ["invoice_date", "TEXT"],
  ["booked_at", "TEXT"],
  ["service_period_type", "TEXT CHECK (service_period_type IN ('SINGLE_DATE', 'MONTH', 'RANGE'))"],
  ["service_date", "TEXT"],
  ["service_period_start", "TEXT"],
  ["service_period_end", "TEXT"],
  ["customer_ref_kind", "TEXT CHECK (customer_ref_kind IN ('global_firm', 'project_firm'))"],
  ["customer_firm_id", "TEXT"],
  ["customer_project_id", "TEXT"],
  ["project_id", "TEXT"],
  ["source_order_id", "TEXT"],
  ["source_order_number", "TEXT"],
  ["source_order_date", "TEXT"],
  ["order_binding_state", "TEXT NOT NULL DEFAULT 'NOT_APPLICABLE' CHECK (order_binding_state IN ('NOT_APPLICABLE', 'LEGACY_UNRESOLVED', 'LEGACY_SNAPSHOT', 'BOUND'))"],
  ["service_reference", "TEXT"],
  ["construction_project", "TEXT"],
  ["intro_text", "TEXT"],
  ["positions_json", "TEXT NOT NULL DEFAULT '[]'"],
  ["payment_term_days", "INTEGER NOT NULL DEFAULT 8 CHECK (payment_term_days BETWEEN 0 AND 3650)"],
  ["due_date", "TEXT"],
  ["customer_snapshot_json", "TEXT"],
  ["issuer_snapshot_json", "TEXT"],
  ["pdf_finalization_status", "TEXT NOT NULL DEFAULT 'NONE' CHECK (pdf_finalization_status IN ('NONE', 'PENDING', 'READY', 'FAILED', 'LEGACY_MISSING'))"],
  ["pdf_finalization_error", "TEXT"],
  ["created_at", "TEXT"],
  ["updated_at", "TEXT"],
]);

const CURRENT_INVOICE_COLUMN_NAMES = Object.freeze(["id", ...CURRENT_INVOICE_COLUMN_DEFINITIONS.map(([name]) => name)]);
const CURRENT_INVOICE_COLUMN_SET = new Set(CURRENT_INVOICE_COLUMN_NAMES);
const LEGACY_REQUIRED_COLUMNS = Object.freeze(["customer_firm_id", "issuer_snapshot_json", "recipient_snapshot_json"]);
const LEGACY_MIGRATION_TABLE = "invoices_current_migration";

const CREATE_INVOICE_ISSUER_PROFILES_SQL = `
  CREATE TABLE IF NOT EXISTS invoice_issuer_profiles (
    id TEXT PRIMARY KEY,
    legal_name TEXT NOT NULL DEFAULT '',
    additional_name TEXT NOT NULL DEFAULT '',
    street TEXT NOT NULL DEFAULT '',
    zip TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    logo_path TEXT NOT NULL DEFAULT '',
    tax_number TEXT NOT NULL DEFAULT '',
    vat_id TEXT NOT NULL DEFAULT '',
    iban TEXT NOT NULL DEFAULT '',
    bic TEXT NOT NULL DEFAULT '',
    bank_name TEXT NOT NULL DEFAULT '',
    commercial_register TEXT NOT NULL DEFAULT '',
    register_number TEXT NOT NULL DEFAULT '',
    managing_director TEXT NOT NULL DEFAULT '',
    legal_notice TEXT NOT NULL DEFAULT '',
    initialized_from_own_organization_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

const CREATE_INVOICES_SQL = `
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
    order_binding_state TEXT NOT NULL DEFAULT 'NOT_APPLICABLE' CHECK (order_binding_state IN ('NOT_APPLICABLE', 'LEGACY_UNRESOLVED', 'LEGACY_SNAPSHOT', 'BOUND')),
    order_snapshot_at TEXT,
    order_snapshot_json TEXT,
    service_reference TEXT,
    construction_project TEXT,
    intro_text TEXT,
    positions_json TEXT NOT NULL DEFAULT '[]',
    payment_term_days INTEGER NOT NULL DEFAULT 8 CHECK (payment_term_days BETWEEN 0 AND 3650),
    due_date TEXT NOT NULL,
    customer_snapshot_json TEXT,
    issuer_snapshot_json TEXT,
    pdf_finalization_status TEXT NOT NULL DEFAULT 'NONE' CHECK (pdf_finalization_status IN ('NONE', 'PENDING', 'READY', 'FAILED', 'LEGACY_MISSING')),
    pdf_finalization_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK (installment_number IS NULL OR installment_number > 0),
    CHECK (status != 'BOOKED' OR (invoice_number IS NOT NULL AND booked_at IS NOT NULL AND customer_snapshot_json IS NOT NULL AND issuer_snapshot_json IS NOT NULL)),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
  )
`;

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function invoiceColumns(db) {
  return db.prepare("PRAGMA table_info(invoices)").all();
}

function addMissingInvoiceColumns(db, columns) {
  const names = new Set(columns.map((column) => column.name));
  if (!names.has("id")) throw new Error("invoice_legacy_schema_missing_id");
  for (const [name, definition] of CURRENT_INVOICE_COLUMN_DEFINITIONS) {
    if (names.has(name)) continue;
    db.exec(`ALTER TABLE invoices ADD COLUMN ${quoteIdentifier(name)} ${definition}`);
    names.add(name);
  }
}

function applySafeLegacyDefaults(db, { initializeOrderBindingState = false } = {}) {
  db.exec(`
    UPDATE invoices SET source_type = 'FREE' WHERE source_type IS NULL;
    UPDATE invoices SET document_type = 'INVOICE' WHERE document_type IS NULL;
    UPDATE invoices SET positions_json = '[]' WHERE positions_json IS NULL;
    UPDATE invoices SET payment_term_days = 8 WHERE payment_term_days IS NULL;
    UPDATE invoices SET status = 'DRAFT' WHERE status IS NULL;
    UPDATE invoices SET pdf_finalization_status = 'NONE' WHERE pdf_finalization_status IS NULL;
  `);
  if (initializeOrderBindingState) {
    db.exec(`
      UPDATE invoices
      SET order_binding_state = CASE
        WHEN source_type = 'FREE' THEN 'NOT_APPLICABLE'
        WHEN status = 'DRAFT' THEN 'LEGACY_UNRESOLVED'
        ELSE 'LEGACY_SNAPSHOT'
      END
    `);
  }
}

function needsLegacyCompatibilityRebuild(columns, createSql) {
  const byName = new Map(columns.map((column) => [column.name, column]));
  const status = byName.get("status");
  if (status?.dflt_value === "'draft'" || String(createSql || "").includes("status IN ('draft', 'posted', 'cancelled')")) return true;
  return LEGACY_REQUIRED_COLUMNS.some((name) => {
    const column = byName.get(name);
    return column?.notnull === 1 && column.dflt_value === null;
  });
}

function assertNoInboundInvoiceForeignKeys(db) {
  const inbound = [];
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all();
  for (const { name } of tables) {
    if (name === "invoices") continue;
    const references = db.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(name)})`).all();
    if (references.some((reference) => reference.table === "invoices")) inbound.push(name);
  }
  if (inbound.length > 0) throw new Error(`invoice_legacy_schema_inbound_foreign_keys:${inbound.join(",")}`);
}

function safeLegacyColumnType(column) {
  const type = String(column?.type || "").trim();
  return type && /^[A-Za-z0-9_(), ]+$/.test(type) ? ` ${type}` : "";
}

function rebuildIncompatibleLegacyInvoices(db, columns) {
  assertNoInboundInvoiceForeignKeys(db);
  const migrationTableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(LEGACY_MIGRATION_TABLE);
  if (migrationTableExists) throw new Error("invoice_legacy_migration_table_exists");

  const legacyColumns = columns.filter((column) => !CURRENT_INVOICE_COLUMN_SET.has(column.name));
  const hasLegacyStatus = legacyColumns.some((column) => column.name === "legacy_status");
  const preservedLegacyColumns = hasLegacyStatus
    ? legacyColumns
    : [...legacyColumns, { name: "legacy_status", type: "TEXT" }];
  const legacyDefinitions = preservedLegacyColumns
    .map((column) => `,\n      ${quoteIdentifier(column.name)}${safeLegacyColumnType(column)}`)
    .join("");

  db.exec(`
    CREATE TABLE ${quoteIdentifier(LEGACY_MIGRATION_TABLE)} (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      source_type TEXT NOT NULL DEFAULT 'FREE',
      document_type TEXT NOT NULL DEFAULT 'INVOICE',
      installment_number INTEGER,
      invoice_number TEXT,
      invoice_date TEXT,
      booked_at TEXT,
      service_period_type TEXT,
      service_date TEXT,
      service_period_start TEXT,
      service_period_end TEXT,
      customer_ref_kind TEXT,
      customer_firm_id TEXT,
      customer_project_id TEXT,
      project_id TEXT,
      source_order_id TEXT,
      source_order_number TEXT,
      source_order_date TEXT,
      order_binding_state TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
      order_snapshot_at TEXT,
      order_snapshot_json TEXT,
      service_reference TEXT,
      construction_project TEXT,
      intro_text TEXT,
      positions_json TEXT NOT NULL DEFAULT '[]',
      payment_term_days INTEGER NOT NULL DEFAULT 8,
      due_date TEXT,
      customer_snapshot_json TEXT,
      issuer_snapshot_json TEXT,
      pdf_finalization_status TEXT NOT NULL DEFAULT 'NONE',
      pdf_finalization_error TEXT,
      created_at TEXT,
      updated_at TEXT${legacyDefinitions}
    )
  `);

  const targetColumns = [...CURRENT_INVOICE_COLUMN_NAMES, ...preservedLegacyColumns.map((column) => column.name)];
  const sourceExpressions = targetColumns.map((name) => {
    if (name === "status") {
      return "CASE status WHEN 'draft' THEN 'DRAFT' WHEN 'posted' THEN 'BOOKED' WHEN 'cancelled' THEN 'CANCELLED' ELSE status END";
    }
    if (name === "source_type") return "COALESCE(source_type, 'FREE')";
    if (name === "document_type") return "COALESCE(document_type, 'INVOICE')";
    if (name === "positions_json") return "COALESCE(positions_json, '[]')";
    if (name === "payment_term_days") return "COALESCE(payment_term_days, 8)";
    if (name === "pdf_finalization_status") {
      return "COALESCE(pdf_finalization_status, CASE WHEN status IN ('BOOKED', 'posted') THEN 'LEGACY_MISSING' ELSE 'NONE' END)";
    }
    if (name === "legacy_status" && !hasLegacyStatus) return "status";
    return quoteIdentifier(name);
  });
  const oldCount = db.prepare("SELECT COUNT(*) AS count FROM invoices").get().count;
  db.exec(`
    INSERT INTO ${quoteIdentifier(LEGACY_MIGRATION_TABLE)} (${targetColumns.map(quoteIdentifier).join(", ")})
    SELECT ${sourceExpressions.join(", ")} FROM invoices
  `);
  const newCount = db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(LEGACY_MIGRATION_TABLE)}`).get().count;
  if (newCount !== oldCount) throw new Error("invoice_legacy_migration_row_count_mismatch");

  db.exec(`
    DROP TABLE invoices;
    ALTER TABLE ${quoteIdentifier(LEGACY_MIGRATION_TABLE)} RENAME TO invoices;
  `);
}

const CREATE_BILLING_ORDER_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS billing_orders (
    id TEXT PRIMARY KEY CHECK (
      length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-'
      AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-'
    ),
    order_number TEXT NOT NULL UNIQUE CHECK (length(trim(order_number)) > 0),
    order_date TEXT NOT NULL CHECK (length(order_date) = 10),
    customer_firm_id TEXT NOT NULL,
    project_id TEXT,
    service_reference TEXT NOT NULL CHECK (length(trim(service_reference)) > 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    confirmed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK ((status = 'DRAFT' AND confirmed_at IS NULL) OR (status IN ('CONFIRMED', 'CANCELLED') AND confirmed_at IS NOT NULL)),
    FOREIGN KEY (customer_firm_id) REFERENCES firms(id) ON DELETE RESTRICT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS billing_order_positions (
    id TEXT PRIMARY KEY CHECK (
      length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-'
      AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-'
    ),
    order_id TEXT NOT NULL,
    parent_position_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('heading', 'service', 'note')),
    position_number TEXT NOT NULL CHECK (length(trim(position_number)) > 0),
    sort_index INTEGER NOT NULL CHECK (sort_index >= 0),
    short_text TEXT NOT NULL CHECK (length(trim(short_text)) > 0),
    long_text TEXT NOT NULL DEFAULT '',
    quantity TEXT,
    unit TEXT,
    unit_price_cents INTEGER CHECK (unit_price_cents IS NULL OR unit_price_cents >= 0),
    is_nep INTEGER NOT NULL DEFAULT 0 CHECK (is_nep IN (0, 1)),
    vat_rate_percent INTEGER CHECK (vat_rate_percent IS NULL OR vat_rate_percent BETWEEN 0 AND 100),
    price_input_mode TEXT CHECK (price_input_mode IS NULL OR price_input_mode IN ('NET', 'GROSS')),
    price_input_cents INTEGER CHECK (price_input_cents IS NULL OR price_input_cents >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (order_id, id),
    UNIQUE (order_id, position_number),
    UNIQUE (order_id, sort_index),
    FOREIGN KEY (order_id) REFERENCES billing_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id, parent_position_id) REFERENCES billing_order_positions(order_id, id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS billing_order_amendments (
    id TEXT PRIMARY KEY CHECK (
      length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-'
      AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-'
    ),
    order_id TEXT NOT NULL,
    sequence_no INTEGER,
    amendment_number TEXT,
    relates_to_order_position_id TEXT NOT NULL,
    short_text TEXT NOT NULL CHECK (length(trim(short_text)) > 0),
    long_text TEXT NOT NULL DEFAULT '',
    quantity TEXT,
    unit TEXT,
    unit_price_cents INTEGER CHECK (unit_price_cents IS NULL OR unit_price_cents >= 0),
    is_nep INTEGER NOT NULL DEFAULT 0 CHECK (is_nep IN (0, 1)),
    vat_rate_percent INTEGER CHECK (vat_rate_percent IS NULL OR vat_rate_percent BETWEEN 0 AND 100),
    price_input_mode TEXT CHECK (price_input_mode IS NULL OR price_input_mode IN ('NET', 'GROSS')),
    price_input_cents INTEGER CHECK (price_input_cents IS NULL OR price_input_cents >= 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    confirmed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (order_id, sequence_no),
    UNIQUE (order_id, amendment_number),
    CHECK (
      (status = 'DRAFT' AND sequence_no IS NULL AND amendment_number IS NULL AND confirmed_at IS NULL)
      OR
      (status IN ('CONFIRMED', 'CANCELLED') AND sequence_no > 0 AND amendment_number = printf('N %02d', sequence_no) AND confirmed_at IS NOT NULL)
    ),
    FOREIGN KEY (order_id) REFERENCES billing_orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (order_id, relates_to_order_position_id) REFERENCES billing_order_positions(order_id, id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_billing_orders_customer ON billing_orders(customer_firm_id, order_date DESC);
  CREATE INDEX IF NOT EXISTS idx_billing_orders_project ON billing_orders(project_id, order_date DESC);
  CREATE INDEX IF NOT EXISTS idx_billing_order_positions_order ON billing_order_positions(order_id, sort_index);
  CREATE INDEX IF NOT EXISTS idx_billing_order_amendments_order ON billing_order_amendments(order_id, sequence_no);

  CREATE TRIGGER IF NOT EXISTS trg_billing_orders_stable_id
  BEFORE UPDATE OF id ON billing_orders
  WHEN NEW.id IS NOT OLD.id
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_id_immutable');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_orders_confirmed_immutable
  BEFORE UPDATE ON billing_orders
  WHEN OLD.status IN ('CONFIRMED', 'CANCELLED') AND (
    NEW.order_number IS NOT OLD.order_number OR NEW.order_date IS NOT OLD.order_date
    OR NEW.customer_firm_id IS NOT OLD.customer_firm_id OR NEW.project_id IS NOT OLD.project_id
    OR NEW.service_reference IS NOT OLD.service_reference OR NEW.confirmed_at IS NOT OLD.confirmed_at
    OR (OLD.status = 'CONFIRMED' AND NEW.status NOT IN ('CONFIRMED', 'CANCELLED'))
    OR (OLD.status = 'CANCELLED' AND NEW.status IS NOT OLD.status)
  )
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_confirmed_immutable');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_orders_confirmed_no_delete
  BEFORE DELETE ON billing_orders
  WHEN OLD.status IN ('CONFIRMED', 'CANCELLED')
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_confirmed_immutable');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_positions_draft_insert
  BEFORE INSERT ON billing_order_positions
  WHEN NOT EXISTS (SELECT 1 FROM billing_orders WHERE id = NEW.order_id AND status = 'DRAFT')
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_positions_require_draft_order');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_positions_stable_identity
  BEFORE UPDATE OF id, order_id ON billing_order_positions
  WHEN NEW.id IS NOT OLD.id OR NEW.order_id IS NOT OLD.order_id
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_position_identity_immutable');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_positions_draft_update
  BEFORE UPDATE ON billing_order_positions
  WHEN NOT EXISTS (SELECT 1 FROM billing_orders WHERE id = OLD.order_id AND status = 'DRAFT')
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_positions_confirmed_immutable');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_positions_draft_delete
  BEFORE DELETE ON billing_order_positions
  WHEN NOT EXISTS (SELECT 1 FROM billing_orders WHERE id = OLD.order_id AND status = 'DRAFT')
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_positions_confirmed_immutable');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_amendments_confirmed_order_insert
  BEFORE INSERT ON billing_order_amendments
  WHEN NOT EXISTS (SELECT 1 FROM billing_orders WHERE id = NEW.order_id AND status = 'CONFIRMED')
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_amendments_require_confirmed_order');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_amendments_stable_identity
  BEFORE UPDATE OF id, order_id ON billing_order_amendments
  WHEN NEW.id IS NOT OLD.id OR NEW.order_id IS NOT OLD.order_id
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_amendment_identity_immutable');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_amendments_valid_origin_insert
  BEFORE INSERT ON billing_order_amendments
  WHEN NOT EXISTS (
    SELECT 1 FROM billing_order_positions
    WHERE order_id = NEW.order_id AND id = NEW.relates_to_order_position_id AND type = 'service'
  )
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_amendment_origin_invalid');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_amendments_valid_origin_update
  BEFORE UPDATE OF order_id, relates_to_order_position_id ON billing_order_amendments
  WHEN NOT EXISTS (
    SELECT 1 FROM billing_order_positions
    WHERE order_id = NEW.order_id AND id = NEW.relates_to_order_position_id AND type = 'service'
  )
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_amendment_origin_invalid');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_amendments_confirmed_immutable
  BEFORE UPDATE ON billing_order_amendments
  WHEN OLD.status IN ('CONFIRMED', 'CANCELLED') AND (
    NEW.id IS NOT OLD.id OR NEW.order_id IS NOT OLD.order_id
    OR NEW.sequence_no IS NOT OLD.sequence_no OR NEW.amendment_number IS NOT OLD.amendment_number
    OR NEW.relates_to_order_position_id IS NOT OLD.relates_to_order_position_id
    OR NEW.short_text IS NOT OLD.short_text OR NEW.long_text IS NOT OLD.long_text
    OR NEW.quantity IS NOT OLD.quantity OR NEW.unit IS NOT OLD.unit
    OR NEW.unit_price_cents IS NOT OLD.unit_price_cents OR NEW.is_nep IS NOT OLD.is_nep
    OR NEW.vat_rate_percent IS NOT OLD.vat_rate_percent OR NEW.price_input_mode IS NOT OLD.price_input_mode
    OR NEW.price_input_cents IS NOT OLD.price_input_cents OR NEW.confirmed_at IS NOT OLD.confirmed_at
    OR (OLD.status = 'CONFIRMED' AND NEW.status NOT IN ('CONFIRMED', 'CANCELLED'))
    OR (OLD.status = 'CANCELLED' AND NEW.status IS NOT OLD.status)
  )
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_amendment_confirmed_immutable');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_billing_order_amendments_confirmed_no_delete
  BEFORE DELETE ON billing_order_amendments
  WHEN OLD.status IN ('CONFIRMED', 'CANCELLED')
  BEGIN
    SELECT RAISE(ABORT, 'billing_order_amendment_confirmed_immutable');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_invoices_order_binding_insert
  AFTER INSERT ON invoices
  WHEN NEW.source_type = 'FROM_ORDER' AND NEW.order_binding_state = 'NOT_APPLICABLE'
  BEGIN
    UPDATE invoices SET order_binding_state = 'LEGACY_UNRESOLVED' WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS trg_invoices_order_binding_source_change
  AFTER UPDATE OF source_type ON invoices
  WHEN NEW.status = 'DRAFT' AND NEW.source_type IS NOT OLD.source_type
  BEGIN
    UPDATE invoices
    SET order_binding_state = CASE WHEN NEW.source_type = 'FREE' THEN 'NOT_APPLICABLE' ELSE 'LEGACY_UNRESOLVED' END
    WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS trg_invoices_legacy_unresolved_no_booking
  BEFORE UPDATE OF status ON invoices
  WHEN OLD.order_binding_state = 'LEGACY_UNRESOLVED' AND NEW.status = 'BOOKED'
  BEGIN
    SELECT RAISE(ABORT, 'invoice_order_binding_legacy_unresolved');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_invoices_order_snapshot_insert
  BEFORE INSERT ON invoices
  WHEN NEW.order_binding_state = 'BOUND'
  BEGIN
    SELECT CASE WHEN NEW.source_type IS NOT 'FROM_ORDER'
      OR NEW.order_snapshot_at IS NULL OR NEW.order_snapshot_json IS NULL
      OR NOT json_valid(NEW.order_snapshot_json)
      THEN RAISE(ABORT, 'invoice_order_snapshot_invalid') END;
    SELECT CASE WHEN json_extract(NEW.order_snapshot_json, '$.order.id') IS NOT NEW.source_order_id
      OR json_extract(NEW.order_snapshot_json, '$.positions') IS NOT NEW.positions_json
      OR NOT EXISTS (SELECT 1 FROM billing_orders WHERE id = NEW.source_order_id AND status = 'CONFIRMED')
      THEN RAISE(ABORT, 'invoice_order_snapshot_invalid') END;
  END;

  CREATE TRIGGER IF NOT EXISTS trg_invoices_order_snapshot_no_rebind
  BEFORE UPDATE OF order_binding_state ON invoices
  WHEN NEW.order_binding_state = 'BOUND' AND OLD.order_binding_state != 'BOUND'
  BEGIN
    SELECT RAISE(ABORT, 'invoice_order_snapshot_create_only');
  END;

  CREATE TRIGGER IF NOT EXISTS trg_invoices_order_snapshot_immutable
  BEFORE UPDATE ON invoices
  WHEN OLD.order_binding_state = 'BOUND' AND (
    NEW.order_binding_state IS NOT OLD.order_binding_state
    OR NEW.order_snapshot_json IS NOT OLD.order_snapshot_json OR NEW.order_snapshot_at IS NOT OLD.order_snapshot_at
    OR NEW.positions_json IS NOT OLD.positions_json OR NEW.source_type IS NOT OLD.source_type
    OR NEW.source_order_id IS NOT OLD.source_order_id OR NEW.source_order_number IS NOT OLD.source_order_number
    OR NEW.source_order_date IS NOT OLD.source_order_date OR NEW.customer_firm_id IS NOT OLD.customer_firm_id
    OR NEW.customer_ref_kind IS NOT OLD.customer_ref_kind OR NEW.customer_project_id IS NOT OLD.customer_project_id
    OR NEW.project_id IS NOT OLD.project_id OR NEW.service_reference IS NOT OLD.service_reference
    OR NEW.document_type IS NOT OLD.document_type OR NEW.installment_number IS NOT OLD.installment_number
  )
  BEGIN
    SELECT RAISE(ABORT, 'invoice_order_snapshot_immutable');
  END;
`;

function ensureBillingOrderSchema(db) {
  db.exec(CREATE_BILLING_ORDER_SCHEMA_SQL);
}

function hasUniqueInvoiceNumberIndex(db) {
  return db.prepare("PRAGMA index_list(invoices)").all().some((index) => {
    if (index.unique !== 1) return false;
    const columns = db.prepare(`PRAGMA index_info(${quoteIdentifier(index.name)})`).all();
    return columns.length === 1 && columns[0].name === "invoice_number";
  });
}

function ensureInvoiceIndexes(db) {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoices_status_updated ON invoices(status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_ref_kind, customer_firm_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
  `);
  if (!hasUniqueInvoiceNumberIndex(db)) {
    db.exec("CREATE UNIQUE INDEX idx_invoices_invoice_number_unique ON invoices(invoice_number) WHERE invoice_number IS NOT NULL");
  }
}

function normalizedIdentity(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/\s+/g, " ");
}

function isUnambiguousIdentityMatch(localFirm, globalFirm) {
  const localName = normalizedIdentity(localFirm?.name);
  if (!localName || localName !== normalizedIdentity(globalFirm?.name)) return false;

  const localEmail = normalizedIdentity(localFirm.email);
  if (localEmail && localEmail === normalizedIdentity(globalFirm.email)) return true;

  return ["street", "zip", "city"].every((field) => {
    const localValue = normalizedIdentity(localFirm[field]);
    return localValue && localValue === normalizedIdentity(globalFirm[field]);
  });
}

function resolveCentralFirmForLegacyDraft(db, draft) {
  const localFirm = db
    .prepare(`
      SELECT *
      FROM project_firms
      WHERE id = ? AND project_id = ? AND removed_at IS NULL
    `)
    .get(draft.customer_firm_id, draft.customer_project_id);
  if (!localFirm) return null;

  const candidates = db
    .prepare(`
      SELECT *
      FROM firms
      WHERE removed_at IS NULL AND COALESCE(is_trashed, 0) = 0
    `)
    .all()
    .filter((firm) => isUnambiguousIdentityMatch(localFirm, firm));
  return candidates.length === 1 ? candidates[0] : null;
}

function migrateDraftCustomerRefs(db) {
  const firmsExist = db
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'firms'")
    .get();
  if (!firmsExist) {
    return { globalRolesAdded: 0, projectRefsMigrated: 0, unresolvedProjectRefs: 0 };
  }

  firmUsagesRepo.ensureFirmUsagesSchema(db);
  let globalRolesAdded = 0;
  let projectRefsMigrated = 0;
  let unresolvedProjectRefs = 0;
  const drafts = db
    .prepare(`
      SELECT id, customer_ref_kind, customer_firm_id, customer_project_id
      FROM invoices
      WHERE status = 'DRAFT' AND customer_firm_id IS NOT NULL
    `)
    .all();

  for (const draft of drafts) {
    if (draft.customer_ref_kind === "global_firm") {
      const firm = db
        .prepare(`
          SELECT id
          FROM firms
          WHERE id = ? AND removed_at IS NULL AND COALESCE(is_trashed, 0) = 0
        `)
        .get(draft.customer_firm_id);
      if (!firm) continue;
      const existed = firmUsagesRepo.hasUsage({
        firmId: firm.id,
        usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER,
        dbConn: db,
      });
      firmUsagesRepo.setUsage({
        firmId: firm.id,
        usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER,
        enabled: true,
        dbConn: db,
      });
      if (!existed) globalRolesAdded += 1;
      if (draft.customer_project_id) {
        db.prepare(`
          UPDATE invoices
          SET customer_project_id = NULL
          WHERE id = ? AND status = 'DRAFT'
        `).run(draft.id);
      }
      continue;
    }

    if (draft.customer_ref_kind !== "project_firm") continue;
    const centralFirm = resolveCentralFirmForLegacyDraft(db, draft);
    if (!centralFirm) {
      unresolvedProjectRefs += 1;
      continue;
    }

    firmUsagesRepo.setUsage({
      firmId: centralFirm.id,
      usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER,
      enabled: true,
      dbConn: db,
    });
    db.prepare(`
      UPDATE invoices
      SET customer_ref_kind = 'global_firm',
          customer_firm_id = ?,
          customer_project_id = NULL
      WHERE id = ? AND status = 'DRAFT' AND customer_ref_kind = 'project_firm'
    `).run(centralFirm.id, draft.id);
    projectRefsMigrated += 1;
  }

  return { globalRolesAdded, projectRefsMigrated, unresolvedProjectRefs };
}

function ensureInvoiceIssuerProfile(db) {
  db.exec(CREATE_INVOICE_ISSUER_PROFILES_SQL);
  const existing = db.prepare("SELECT 1 FROM invoice_issuer_profiles WHERE id = 'default'").get();
  if (existing) return { initialized: false };
  const source = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user_profile'").get()
    ? db.prepare("SELECT * FROM user_profile WHERE id = 1").get()
    : null;
  if (!source) return { initialized: false };
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO invoice_issuer_profiles (
      id, legal_name, additional_name, street, zip, city, country, phone, email,
      website, logo_path, tax_number, vat_id, iban, bic, bank_name,
      commercial_register, register_number, managing_director, legal_notice,
      initialized_from_own_organization_at, created_at, updated_at
    ) VALUES (
      'default', @name1, @name2, @street, @zip, @city, @country, @phone, @email,
      @website, @logo_path, @tax_number, @vat_id, @iban, @bic, @bank_name,
      @commercial_register, @register_number, @managing_director, @legal_notice,
      @now, @now, @now
    )
  `).run({
    name1: source?.name1 || "", name2: source?.name2 || "", street: source?.street || "",
    zip: source?.zip || "", city: source?.city || "", country: source?.country || "",
    phone: source?.phone || "", email: source?.email || "", website: source?.website || "",
    logo_path: source?.logo_path || "", tax_number: source?.tax_number || "",
    vat_id: source?.vat_id || "", iban: source?.iban || "", bic: source?.bic || "",
    bank_name: source?.bank_name || "", commercial_register: source?.commercial_register || "",
    register_number: source?.register_number || "", managing_director: source?.managing_director || "",
    legal_notice: source?.legal_notice || "", now,
  });
  return { initialized: true };
}

function ensureInvoiceSchema(db) {
  if (!db) throw new Error("db required");
  let customerMigration = null;
  const migrate = () => {
    db.exec(CREATE_INVOICES_SQL);
    const originalColumns = invoiceColumns(db);
    const hadOrderBindingState = originalColumns.some((column) => column.name === "order_binding_state");
    const createSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'invoices'").get()?.sql || "";
    addMissingInvoiceColumns(db, originalColumns);
    applySafeLegacyDefaults(db, { initializeOrderBindingState: !hadOrderBindingState });
    const currentColumns = invoiceColumns(db);
    if (needsLegacyCompatibilityRebuild(originalColumns, createSql)) {
      rebuildIncompatibleLegacyInvoices(db, currentColumns);
    }
    ensureInvoiceIndexes(db);
    ensureBillingOrderSchema(db);
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoice_number_sequences (
        sequence_key TEXT PRIMARY KEY,
        last_value INTEGER NOT NULL CHECK (last_value > 0),
        updated_at TEXT NOT NULL
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS commercial_document_files (
        id TEXT PRIMARY KEY,
        commercial_document_type TEXT NOT NULL,
        commercial_document_id TEXT NOT NULL,
        file_role TEXT NOT NULL DEFAULT 'FINAL',
        file_type TEXT NOT NULL CHECK (file_type = 'PDF'),
        file_name TEXT NOT NULL,
        local_path TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
        size_bytes INTEGER NOT NULL CHECK (size_bytes >= 5),
        sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
        is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
        is_final INTEGER NOT NULL DEFAULT 1 CHECK (is_final IN (0, 1)),
        created_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_commercial_document_files_active_final
        ON commercial_document_files(
          commercial_document_type,
          commercial_document_id,
          file_role,
          file_type
        )
        WHERE is_active = 1 AND is_final = 1;
      CREATE INDEX IF NOT EXISTS idx_commercial_document_files_document
        ON commercial_document_files(
          commercial_document_type,
          commercial_document_id,
          created_at DESC
        );
      UPDATE invoices
      SET pdf_finalization_status = 'LEGACY_MISSING',
          pdf_finalization_error = NULL
      WHERE status = 'BOOKED'
        AND pdf_finalization_status = 'NONE'
        AND NOT EXISTS (
          SELECT 1
          FROM commercial_document_files f
          WHERE f.commercial_document_type = 'INVOICE'
            AND f.commercial_document_id = invoices.id
            AND f.file_role = 'FINAL'
            AND f.file_type = 'PDF'
            AND f.is_active = 1
            AND f.is_final = 1
        );
    `);
    ensureInvoiceIssuerProfile(db);
    customerMigration = migrateDraftCustomerRefs(db);
  };
  if (db.inTransaction) migrate();
  else db.transaction(migrate)();
  return { customerMigration };
}

module.exports = { ensureInvoiceSchema, migrateDraftCustomerRefs, ensureInvoiceIssuerProfile, ensureBillingOrderSchema };
