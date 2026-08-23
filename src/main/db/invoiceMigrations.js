"use strict";

const firmUsagesRepo = require("./firmUsagesRepo");

const CURRENT_INVOICE_COLUMN_DEFINITIONS = Object.freeze([
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
  ["service_reference", "TEXT"],
  ["construction_project", "TEXT"],
  ["intro_text", "TEXT"],
  ["positions_json", "TEXT NOT NULL DEFAULT '[]'"],
  ["payment_term_days", "INTEGER NOT NULL DEFAULT 8 CHECK (payment_term_days BETWEEN 0 AND 3650)"],
  ["due_date", "TEXT"],
  ["customer_snapshot_json", "TEXT"],
  ["issuer_snapshot_json", "TEXT"],
  ["created_at", "TEXT"],
  ["updated_at", "TEXT"],
]);

const CURRENT_INVOICE_COLUMN_NAMES = Object.freeze(["id", ...CURRENT_INVOICE_COLUMN_DEFINITIONS.map(([name]) => name)]);
const CURRENT_INVOICE_COLUMN_SET = new Set(CURRENT_INVOICE_COLUMN_NAMES);
const LEGACY_REQUIRED_COLUMNS = Object.freeze(["customer_firm_id", "issuer_snapshot_json", "recipient_snapshot_json"]);
const LEGACY_MIGRATION_TABLE = "invoices_current_migration";

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
    service_reference TEXT,
    construction_project TEXT,
    intro_text TEXT,
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

function applySafeLegacyDefaults(db) {
  db.exec(`
    UPDATE invoices SET source_type = 'FREE' WHERE source_type IS NULL;
    UPDATE invoices SET document_type = 'INVOICE' WHERE document_type IS NULL;
    UPDATE invoices SET positions_json = '[]' WHERE positions_json IS NULL;
    UPDATE invoices SET payment_term_days = 8 WHERE payment_term_days IS NULL;
    UPDATE invoices SET status = 'DRAFT' WHERE status IS NULL;
  `);
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
      service_reference TEXT,
      construction_project TEXT,
      intro_text TEXT,
      positions_json TEXT NOT NULL DEFAULT '[]',
      payment_term_days INTEGER NOT NULL DEFAULT 8,
      due_date TEXT,
      customer_snapshot_json TEXT,
      issuer_snapshot_json TEXT,
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

function ensureInvoiceSchema(db) {
  if (!db) throw new Error("db required");
  let customerMigration = null;
  const migrate = () => {
    db.exec(CREATE_INVOICES_SQL);
    const originalColumns = invoiceColumns(db);
    const createSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'invoices'").get()?.sql || "";
    addMissingInvoiceColumns(db, originalColumns);
    applySafeLegacyDefaults(db);
    const currentColumns = invoiceColumns(db);
    if (needsLegacyCompatibilityRebuild(originalColumns, createSql)) {
      rebuildIncompatibleLegacyInvoices(db, currentColumns);
    }
    ensureInvoiceIndexes(db);
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoice_number_sequences (
        sequence_key TEXT PRIMARY KEY,
        last_value INTEGER NOT NULL CHECK (last_value > 0),
        updated_at TEXT NOT NULL
      )
    `);
    customerMigration = migrateDraftCustomerRefs(db);
  };
  if (db.inTransaction) migrate();
  else db.transaction(migrate)();
  return { customerMigration };
}

module.exports = { ensureInvoiceSchema, migrateDraftCustomerRefs };
