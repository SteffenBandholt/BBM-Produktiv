const fs = require("node:fs");
const path = require("node:path");
const { initDatabase } = require("./database");
const { normalizePrintOrientation } = require("../print/printOrientation");

const DEFAULT_SCOPE_TYPE = "global";
const ALLOWED_SCOPE_TYPES = new Set(["global", "project"]);
const DEFAULT_SCHEMA_VERSION = 1;

let _pilotDefaultLayoutPromise = null;

function _db() {
  return initDatabase();
}

function _cloneJson(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function _isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function _normalizeText(value, fallback = "") {
  const s = String(value == null ? "" : value).trim();
  return s || fallback;
}

function _normalizeTableKey(value) {
  const tableKey = _normalizeText(value);
  if (!tableKey) throw new Error("tableKey required");
  return tableKey;
}

function _normalizeModuleId(value) {
  const moduleId = _normalizeText(value);
  if (!moduleId) throw new Error("moduleId required");
  return moduleId;
}

function _normalizeScopeType(value) {
  const scopeType = _normalizeText(value, DEFAULT_SCOPE_TYPE).toLowerCase();
  if (!ALLOWED_SCOPE_TYPES.has(scopeType)) {
    throw new Error("scopeType must be global or project");
  }
  return scopeType;
}

function _normalizeScopeId(value, scopeType) {
  const scopeId = _normalizeText(value);
  if (!scopeId && scopeType === "project") {
    throw new Error("scopeId required for project scope");
  }
  return scopeId;
}

function _normalizeSchemaVersion(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_SCHEMA_VERSION;
  return Math.floor(n);
}

function _normalizeIdentity(input = {}) {
  const tableKey = _normalizeTableKey(input.tableKey);
  const moduleId = _normalizeModuleId(input.moduleId);
  const orientation = normalizePrintOrientation(input.orientation);
  const scopeType = _normalizeScopeType(input.scopeType);
  const scopeId = _normalizeScopeId(input.scopeId, scopeType);
  return {
    tableKey,
    moduleId,
    orientation,
    scopeType,
    scopeId,
  };
}

function _normalizeLayoutPayload(layout) {
  if (layout == null) return {};
  const value = typeof layout === "string" ? JSON.parse(layout) : layout;
  if (!_isPlainObject(value)) {
    throw new Error("layout must be an object");
  }
  return _cloneJson(value);
}

function _mergeLayouts(base, overlay) {
  if (overlay == null) return _cloneJson(base);
  if (base == null) return _cloneJson(overlay);
  if (Array.isArray(base) || Array.isArray(overlay)) {
    return _cloneJson(overlay);
  }
  if (!_isPlainObject(base) || !_isPlainObject(overlay)) {
    return _cloneJson(overlay);
  }

  const out = _cloneJson(base) || {};
  for (const [key, value] of Object.entries(overlay)) {
    if (Array.isArray(value)) {
      out[key] = _cloneJson(value);
      continue;
    }
    if (_isPlainObject(value)) {
      out[key] = _mergeLayouts(out[key], value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

function _rowToLayoutRecord(row) {
  if (!row) return null;
  let layout = null;
  let parseError = "";
  try {
    layout = row.layout_json ? JSON.parse(row.layout_json) : null;
  } catch (err) {
    layout = null;
    parseError = err?.message || String(err);
  }
  return {
    tableKey: String(row.table_key || "").trim(),
    moduleId: String(row.module_id || "").trim(),
    orientation: normalizePrintOrientation(row.orientation),
    scopeType: _normalizeScopeType(row.scope_type),
    scopeId: String(row.scope_id || "").trim(),
    schemaVersion: _normalizeSchemaVersion(row.schema_version),
    layout,
    createdAt: String(row.created_at || "").trim(),
    updatedAt: String(row.updated_at || "").trim(),
    parseError,
  };
}

function _tableLayoutWhereClause(filter = {}) {
  const clauses = [];
  const values = [];

  if (filter.tableKey) {
    clauses.push("table_key = ?");
    values.push(_normalizeTableKey(filter.tableKey));
  }
  if (filter.moduleId) {
    clauses.push("module_id = ?");
    values.push(_normalizeModuleId(filter.moduleId));
  }
  if (filter.orientation) {
    clauses.push("orientation = ?");
    values.push(normalizePrintOrientation(filter.orientation));
  }
  if (filter.scopeType) {
    clauses.push("scope_type = ?");
    values.push(_normalizeScopeType(filter.scopeType));
  }
  if (filter.scopeId != null && String(filter.scopeId).trim()) {
    clauses.push("scope_id = ?");
    values.push(String(filter.scopeId).trim());
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

function listTableLayouts(filter = {}) {
  const db = _db();
  const { sql, values } = _tableLayoutWhereClause(filter);
  const rows = db
    .prepare(
      `
      SELECT
        table_key,
        module_id,
        orientation,
        scope_type,
        scope_id,
        schema_version,
        layout_json,
        created_at,
        updated_at
      FROM table_layouts
      ${sql}
      ORDER BY table_key, module_id, orientation, scope_type, scope_id
    `
    )
    .all(...values);
  return rows.map(_rowToLayoutRecord).filter(Boolean);
}

function getStoredTableLayout(identity = {}) {
  const db = _db();
  const norm = _normalizeIdentity(identity);
  const row = db
    .prepare(
      `
      SELECT
        table_key,
        module_id,
        orientation,
        scope_type,
        scope_id,
        schema_version,
        layout_json,
        created_at,
        updated_at
      FROM table_layouts
      WHERE table_key = ?
        AND module_id = ?
        AND orientation = ?
        AND scope_type = ?
        AND scope_id = ?
      LIMIT 1
    `
    )
    .get(norm.tableKey, norm.moduleId, norm.orientation, norm.scopeType, norm.scopeId);
  return _rowToLayoutRecord(row);
}

async function _loadPilotDefaultLayout(identity = {}) {
  const norm = _normalizeIdentity(identity);
  if (norm.tableKey !== "protokoll_tops" || norm.moduleId !== "protokoll") {
    return null;
  }

  if (!_pilotDefaultLayoutPromise) {
    const layoutPath = path.join(__dirname, "../../shared/tableLayouts/protokollTopsLayout.js");
    const source = fs.readFileSync(layoutPath, "utf8");
    const encodedSource = Buffer.from(source, "utf8").toString("base64");
    const dataUrl = `data:text/javascript;base64,${encodedSource}`;

    _pilotDefaultLayoutPromise = import(dataUrl).then((mod) => {
        if (typeof mod?.getProtokollTopsLayout === "function") {
          return mod.getProtokollTopsLayout();
        }
        return null;
      }).catch(() => null);
  }

  const layout = await _pilotDefaultLayoutPromise;
  return _cloneJson(layout);
}

async function getEffectiveTableLayout(identity = {}) {
  const norm = _normalizeIdentity(identity);
  const exact = getStoredTableLayout(norm);
  const defaultBase = await _loadPilotDefaultLayout(norm);
  const portraitFallback =
    norm.orientation === "landscape"
      ? getStoredTableLayout({ ...norm, orientation: "portrait" })
      : null;
  const fallbackRecord = exact?.layout ? exact : portraitFallback?.layout ? portraitFallback : null;
  const storedLayout = fallbackRecord?.layout ? _cloneJson(fallbackRecord.layout) : null;
  const effectiveLayout = _mergeLayouts(defaultBase, storedLayout);

  return {
    ...norm,
    schemaVersion: fallbackRecord?.schemaVersion || DEFAULT_SCHEMA_VERSION,
    storedLayout,
    defaultLayout: defaultBase,
    effectiveLayout,
    source: exact?.layout ? "stored" : portraitFallback?.layout ? "stored-portrait-fallback" : "default",
    parseError: exact?.parseError || portraitFallback?.parseError || "",
  };
}

async function saveTableLayout(input = {}) {
  const db = _db();
  const norm = _normalizeIdentity(input);
  const layout = _normalizeLayoutPayload(input.layout ?? input.layoutPatch ?? input.effectiveLayout);
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO table_layouts (
      table_key,
      module_id,
      orientation,
      scope_type,
      scope_id,
      schema_version,
      layout_json,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(table_key, module_id, orientation, scope_type, scope_id)
    DO UPDATE SET
      schema_version = excluded.schema_version,
      layout_json = excluded.layout_json,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    norm.tableKey,
    norm.moduleId,
    norm.orientation,
    norm.scopeType,
    norm.scopeId,
    _normalizeSchemaVersion(input.schemaVersion),
    JSON.stringify(layout),
    now,
    now
  );

  return getEffectiveTableLayout(norm);
}

function resetTableLayout(input = {}) {
  const db = _db();
  const norm = _normalizeIdentity(input);
  const stmt = db.prepare(`
    DELETE FROM table_layouts
    WHERE table_key = ?
      AND module_id = ?
      AND orientation = ?
      AND scope_type = ?
      AND scope_id = ?
  `);
  const info = stmt.run(norm.tableKey, norm.moduleId, norm.orientation, norm.scopeType, norm.scopeId);
  return {
    ...norm,
    removed: Number(info?.changes || 0),
  };
}

module.exports = {
  listTableLayouts,
  getStoredTableLayout,
  getEffectiveTableLayout,
  saveTableLayout,
  resetTableLayout,
  normalizeTableLayoutIdentity: _normalizeIdentity,
  mergeTableLayoutWithDefault: _mergeLayouts,
};
