const { initDatabase } = require("./database");

const FIRM_USAGE_CODES = Object.freeze({
  PROJECT_PARTICIPANT: "project_participant",
  INVOICE_CUSTOMER: "invoice_customer",
});

const ALLOWED_USAGE_CODES = new Set(Object.values(FIRM_USAGE_CODES));

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

function _ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS firm_usages (
      firm_id TEXT NOT NULL,
      usage_code TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (firm_id, usage_code),
      FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_firm_usages_usage_code
      ON firm_usages (usage_code);
  `);
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

function listByFirm(firmId) {
  const db = initDatabase();
  _ensureSchema(db);
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

function listCodesByFirm(firmId) {
  return listByFirm(firmId).map((row) => String(row.usage_code));
}

function hasUsage({ firmId, usageCode }) {
  const db = initDatabase();
  _ensureSchema(db);
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

function setUsage({ firmId, usageCode, enabled }) {
  const db = initDatabase();
  _ensureSchema(db);
  const id = _assertFirm(db, firmId);
  const code = _normUsageCode(usageCode);
  const active = enabled !== false && Number(enabled) !== 0;
  const now = _nowIso();

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

  return {
    firmId: id,
    usageCode: code,
    enabled: active,
    usages: listCodesByFirm(id),
  };
}

function replaceUsages({ firmId, usageCodes }) {
  const db = initDatabase();
  _ensureSchema(db);
  const id = _assertFirm(db, firmId);
  const codes = Array.from(
    new Set((Array.isArray(usageCodes) ? usageCodes : []).map(_normUsageCode))
  );
  const now = _nowIso();

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM firm_usages WHERE firm_id = ?`).run(id);
    const insert = db.prepare(`
      INSERT INTO firm_usages (firm_id, usage_code, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    for (const code of codes) insert.run(id, code, now, now);
  });
  tx();

  return { firmId: id, usages: listCodesByFirm(id) };
}

function listFirmsByUsage(usageCode) {
  const db = initDatabase();
  _ensureSchema(db);
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

function ensureProjectParticipantUsageForAssignedFirms() {
  const db = initDatabase();
  _ensureSchema(db);
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

  return Number(info?.changes || 0);
}

module.exports = Object.freeze({
  FIRM_USAGE_CODES,
  listByFirm,
  listCodesByFirm,
  hasUsage,
  setUsage,
  replaceUsages,
  listFirmsByUsage,
  ensureProjectParticipantUsageForAssignedFirms,
});
