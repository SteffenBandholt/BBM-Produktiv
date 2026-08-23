"use strict";

const FIRM_USAGE_CODES = Object.freeze({
  PROJECT_PARTICIPANT: "project_participant",
  INVOICE_CUSTOMER: "invoice_customer",
});

const ALLOWED_USAGE_CODES = new Set(Object.values(FIRM_USAGE_CODES));

function getDb(dbConn) {
  if (dbConn) return dbConn;
  return require("./database").initDatabase();
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeUsageCode(value) {
  const code = String(value || "").trim().toLowerCase();
  if (!ALLOWED_USAGE_CODES.has(code)) {
    throw new Error(`Unbekannte Firmen-Verwendung: ${code || "(leer)"}`);
  }
  return code;
}

function tableExists(db, tableName) {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
}

function columnExists(db, tableName, columnName) {
  if (!tableExists(db, tableName)) return false;
  return db.prepare(`PRAGMA table_info("${tableName}")`).all().some((column) => column.name === columnName);
}

function ensureFirmUsagesSchema(dbConn) {
  const db = getDb(dbConn);
  if (!tableExists(db, "firms")) return;
  const migrate = () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS firm_usages (
        firm_id TEXT NOT NULL,
        usage_code TEXT NOT NULL CHECK (usage_code IN ('project_participant', 'invoice_customer')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (firm_id, usage_code),
        FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_firm_usages_usage_code
        ON firm_usages (usage_code, firm_id);
    `);
    const now = nowIso();
    if (columnExists(db, "firms", "use_project_participant")) {
      db.prepare(`
        INSERT OR IGNORE INTO firm_usages (firm_id, usage_code, created_at, updated_at)
        SELECT id, ?, ?, ? FROM firms
        WHERE use_project_participant = 1
      `).run(FIRM_USAGE_CODES.PROJECT_PARTICIPANT, now, now);
    }
    if (columnExists(db, "firms", "use_customer")) {
      db.prepare(`
        INSERT OR IGNORE INTO firm_usages (firm_id, usage_code, created_at, updated_at)
        SELECT id, ?, ?, ? FROM firms
        WHERE use_customer = 1
      `).run(FIRM_USAGE_CODES.INVOICE_CUSTOMER, now, now);
    }
    if (tableExists(db, "project_global_firms")) {
      db.prepare(`
        INSERT OR IGNORE INTO firm_usages (firm_id, usage_code, created_at, updated_at)
        SELECT DISTINCT pgf.firm_id, ?, ?, ?
        FROM project_global_firms pgf
        JOIN firms f ON f.id = pgf.firm_id
        WHERE pgf.removed_at IS NULL
          AND COALESCE(pgf.is_active, 1) = 1
          AND f.removed_at IS NULL
          AND COALESCE(f.is_trashed, 0) = 0
      `).run(FIRM_USAGE_CODES.PROJECT_PARTICIPANT, now, now);
    }
  };
  if (db.inTransaction) migrate();
  else db.transaction(migrate)();
}

function assertFirm(db, firmId) {
  const id = String(firmId || "").trim();
  if (!id) throw new Error("firmId required");
  const firm = db.prepare(`
    SELECT id FROM firms
    WHERE id = ? AND removed_at IS NULL AND COALESCE(is_trashed, 0) = 0
  `).get(id);
  if (!firm) throw new Error("Firma nicht gefunden");
  return id;
}

function listCodesByFirm(firmId, dbConn) {
  const db = getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const id = assertFirm(db, firmId);
  return db.prepare(`
    SELECT usage_code FROM firm_usages WHERE firm_id = ? ORDER BY usage_code
  `).all(id).map((row) => String(row.usage_code));
}

function hasUsage({ firmId, usageCode, dbConn } = {}) {
  const db = getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const id = assertFirm(db, firmId);
  const code = normalizeUsageCode(usageCode);
  return !!db.prepare("SELECT 1 FROM firm_usages WHERE firm_id = ? AND usage_code = ?").get(id, code);
}

function syncCompatibilityFlag(db, firmId, usageCode, enabled, now) {
  const column = usageCode === FIRM_USAGE_CODES.PROJECT_PARTICIPANT
    ? "use_project_participant"
    : "use_customer";
  if (!columnExists(db, "firms", column)) return;
  if (columnExists(db, "firms", "updated_at")) {
    db.prepare(`UPDATE firms SET ${column} = ?, updated_at = ? WHERE id = ?`)
      .run(enabled ? 1 : 0, now, firmId);
  } else {
    db.prepare(`UPDATE firms SET ${column} = ? WHERE id = ?`).run(enabled ? 1 : 0, firmId);
  }
}

function setUsage({ firmId, usageCode, enabled, dbConn } = {}) {
  const db = getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const id = assertFirm(db, firmId);
  const code = normalizeUsageCode(usageCode);
  const active = enabled !== false && Number(enabled) !== 0;
  const now = nowIso();
  const mutate = () => {
    if (active) {
      db.prepare(`
        INSERT INTO firm_usages (firm_id, usage_code, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(firm_id, usage_code) DO UPDATE SET updated_at = excluded.updated_at
      `).run(id, code, now, now);
    } else {
      db.prepare("DELETE FROM firm_usages WHERE firm_id = ? AND usage_code = ?").run(id, code);
    }
    syncCompatibilityFlag(db, id, code, active, now);
  };
  if (db.inTransaction) mutate();
  else db.transaction(mutate)();
  return { firmId: id, usageCode: code, enabled: active, usages: listCodesByFirm(id, db) };
}

function replaceUsages({ firmId, usageCodes, dbConn } = {}) {
  const db = getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const id = assertFirm(db, firmId);
  const codes = [...new Set((Array.isArray(usageCodes) ? usageCodes : []).map(normalizeUsageCode))];
  const mutate = () => {
    for (const code of ALLOWED_USAGE_CODES) {
      setUsage({ firmId: id, usageCode: code, enabled: codes.includes(code), dbConn: db });
    }
  };
  if (db.inTransaction) mutate();
  else db.transaction(mutate)();
  return { firmId: id, usages: listCodesByFirm(id, db) };
}

function listFirmsByUsage(usageCode, dbConn) {
  const db = getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const code = normalizeUsageCode(usageCode);
  return db.prepare(`
    SELECT f.* FROM firm_usages fu
    JOIN firms f ON f.id = fu.firm_id
    WHERE fu.usage_code = ?
      AND f.removed_at IS NULL AND COALESCE(f.is_trashed, 0) = 0
    ORDER BY LOWER(COALESCE(f.name, '')), LOWER(COALESCE(f.short, ''))
  `).all(code);
}

module.exports = Object.freeze({
  FIRM_USAGE_CODES,
  ensureFirmUsagesSchema,
  listCodesByFirm,
  hasUsage,
  setUsage,
  replaceUsages,
  listFirmsByUsage,
});
