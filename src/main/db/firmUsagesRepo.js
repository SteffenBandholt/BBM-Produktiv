"use strict";

const FIRM_USAGE_CODES = Object.freeze({
  PROJECT_PARTICIPANT: "project_participant",
  INVOICE_CUSTOMER: "invoice_customer",
});

const ALLOWED_USAGE_CODES = new Set(Object.values(FIRM_USAGE_CODES));

function _getDb(dbConn) {
  if (dbConn) return dbConn;
  return require("./database").initDatabase();
}

function _nowIso() {
  return new Date().toISOString();
}

function _normUsageCode(value) {
  const code = String(value || "").trim().toLowerCase();
  if (!ALLOWED_USAGE_CODES.has(code)) {
    throw new Error(`Unbekannte Firmen-Verwendung: ${code || "(leer)"}`);
  }
  return code;
}

function _tableExists(db, tableName) {
  return !!db
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName);
}

function _columnExists(db, tableName, columnName) {
  if (!_tableExists(db, tableName)) return false;
  return db
    .prepare(`PRAGMA table_info("${tableName}")`)
    .all()
    .some((column) => column.name === columnName);
}

function ensureFirmUsagesSchema(dbConn) {
  const db = _getDb(dbConn);
  if (!_tableExists(db, "firms")) return;

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

    const now = _nowIso();
    if (_columnExists(db, "firms", "use_project_participant")) {
      db.prepare(`
        INSERT OR IGNORE INTO firm_usages (firm_id, usage_code, created_at, updated_at)
        SELECT id, ?, ?, ?
        FROM firms
        WHERE use_project_participant = 1
      `).run(FIRM_USAGE_CODES.PROJECT_PARTICIPANT, now, now);
    }
    if (_columnExists(db, "firms", "use_customer")) {
      db.prepare(`
        INSERT OR IGNORE INTO firm_usages (firm_id, usage_code, created_at, updated_at)
        SELECT id, ?, ?, ?
        FROM firms
        WHERE use_customer = 1
      `).run(FIRM_USAGE_CODES.INVOICE_CUSTOMER, now, now);
    }
    if (_tableExists(db, "project_global_firms")) {
      db.prepare(`
        INSERT OR IGNORE INTO firm_usages (firm_id, usage_code, created_at, updated_at)
        SELECT DISTINCT pgf.firm_id, ?, ?, ?
        FROM project_global_firms pgf
        INNER JOIN firms f ON f.id = pgf.firm_id
        WHERE pgf.removed_at IS NULL
          AND f.removed_at IS NULL
          AND COALESCE(f.is_trashed, 0) = 0
      `).run(FIRM_USAGE_CODES.PROJECT_PARTICIPANT, now, now);
    }

    // Die bisherigen use_* Spalten bleiben nur als synchronisierte
    // Kompatibilitaetsschicht fuer bestehende Projekt-/Protokollpfade erhalten.
    if (_columnExists(db, "firms", "use_project_participant")) {
      db.prepare(`
        UPDATE firms
        SET use_project_participant = 1
        WHERE COALESCE(use_project_participant, 0) <> 1
          AND EXISTS (
          SELECT 1 FROM firm_usages fu
          WHERE fu.firm_id = firms.id AND fu.usage_code = 'project_participant'
        )
      `).run();
    }
    if (_columnExists(db, "firms", "use_customer")) {
      db.prepare(`
        UPDATE firms
        SET use_customer = 1
        WHERE COALESCE(use_customer, 0) <> 1
          AND EXISTS (
          SELECT 1 FROM firm_usages fu
          WHERE fu.firm_id = firms.id AND fu.usage_code = 'invoice_customer'
        )
      `).run();
    }
  };

  if (db.inTransaction) migrate();
  else db.transaction(migrate)();
}

function _assertFirm(db, firmId) {
  const id = String(firmId || "").trim();
  if (!id) throw new Error("firmId required");

  const firm = db
    .prepare(`
      SELECT id
      FROM firms
      WHERE id = ?
        AND removed_at IS NULL
        AND COALESCE(is_trashed, 0) = 0
      LIMIT 1
    `)
    .get(id);

  if (!firm) throw new Error("Firma nicht gefunden");
  return id;
}

function listByFirm(firmId, dbConn) {
  const db = _getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const id = _assertFirm(db, firmId);

  return db
    .prepare(`
      SELECT usage_code, created_at, updated_at
      FROM firm_usages
      WHERE firm_id = ?
      ORDER BY usage_code ASC
    `)
    .all(id);
}

function listCodesByFirm(firmId, dbConn) {
  return listByFirm(firmId, dbConn).map((row) => String(row.usage_code));
}

function hasUsage({ firmId, usageCode, dbConn } = {}) {
  const db = _getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const id = _assertFirm(db, firmId);
  const code = _normUsageCode(usageCode);

  const row = db
    .prepare(`
      SELECT 1 AS yes
      FROM firm_usages
      WHERE firm_id = ? AND usage_code = ?
      LIMIT 1
    `)
    .get(id, code);

  return !!row;
}

function _syncCompatibilityFlag(db, firmId, usageCode, enabled, now) {
  const column =
    usageCode === FIRM_USAGE_CODES.PROJECT_PARTICIPANT
      ? "use_project_participant"
      : "use_customer";
  if (!_columnExists(db, "firms", column)) return;
  if (_columnExists(db, "firms", "updated_at")) {
    db.prepare(`UPDATE firms SET ${column} = ?, updated_at = ? WHERE id = ?`).run(
      enabled ? 1 : 0,
      now,
      firmId
    );
  } else {
    db.prepare(`UPDATE firms SET ${column} = ? WHERE id = ?`).run(enabled ? 1 : 0, firmId);
  }
}

function setUsage({ firmId, usageCode, enabled, dbConn } = {}) {
  const db = _getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const id = _assertFirm(db, firmId);
  const code = _normUsageCode(usageCode);
  const active = enabled !== false && Number(enabled) !== 0;
  const now = _nowIso();

  const mutate = () => {
    if (active) {
      db.prepare(`
        INSERT INTO firm_usages (firm_id, usage_code, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(firm_id, usage_code)
        DO UPDATE SET updated_at = excluded.updated_at
      `).run(id, code, now, now);
    } else {
      db.prepare(`
        DELETE FROM firm_usages
        WHERE firm_id = ? AND usage_code = ?
      `).run(id, code);
    }
    _syncCompatibilityFlag(db, id, code, active, now);
  };
  if (db.inTransaction) mutate();
  else db.transaction(mutate)();

  return {
    firmId: id,
    usageCode: code,
    enabled: active,
    usages: listCodesByFirm(id, db),
  };
}

function replaceUsages({ firmId, usageCodes, dbConn } = {}) {
  const db = _getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const id = _assertFirm(db, firmId);
  const codes = Array.from(
    new Set((Array.isArray(usageCodes) ? usageCodes : []).map(_normUsageCode))
  );
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
  const db = _getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const code = _normUsageCode(usageCode);

  return db
    .prepare(`
      SELECT f.*
      FROM firm_usages fu
      INNER JOIN firms f ON f.id = fu.firm_id
      WHERE fu.usage_code = ?
        AND f.removed_at IS NULL
        AND COALESCE(f.is_trashed, 0) = 0
      ORDER BY COALESCE(LOWER(f.name), ''), COALESCE(LOWER(f.short), '')
    `)
    .all(code);
}

function ensureProjectParticipantUsageForAssignedFirms(dbConn) {
  const db = _getDb(dbConn);
  ensureFirmUsagesSchema(db);
  const now = _nowIso();

  const info = db.prepare(`
    INSERT OR IGNORE INTO firm_usages (firm_id, usage_code, created_at, updated_at)
    SELECT DISTINCT pgf.firm_id, ?, ?, ?
    FROM project_global_firms pgf
    INNER JOIN firms f ON f.id = pgf.firm_id
    WHERE pgf.removed_at IS NULL
      AND f.removed_at IS NULL
      AND COALESCE(f.is_trashed, 0) = 0
  `).run(FIRM_USAGE_CODES.PROJECT_PARTICIPANT, now, now);

  if (_columnExists(db, "firms", "use_project_participant")) {
    db.prepare(`
      UPDATE firms
      SET use_project_participant = 1
      WHERE COALESCE(use_project_participant, 0) <> 1
        AND EXISTS (
        SELECT 1 FROM firm_usages fu
        WHERE fu.firm_id = firms.id AND fu.usage_code = 'project_participant'
      )
    `).run();
  }

  return Number(info?.changes || 0);
}

module.exports = Object.freeze({
  FIRM_USAGE_CODES,
  ensureFirmUsagesSchema,
  listByFirm,
  listCodesByFirm,
  hasUsage,
  setUsage,
  replaceUsages,
  listFirmsByUsage,
  ensureProjectParticipantUsageForAssignedFirms,
});
