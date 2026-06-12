const { initDatabase } = require("./database");

const PILOT_SCOPE = Object.freeze({
  targetAppId: "bbm",
  moduleId: "restarbeiten",
  scopeId: "restarbeiten.ui.main",
});

const SOURCE = "ui-editor";

function _db() {
  return initDatabase();
}

function _normalizeText(value) {
  return String(value == null ? "" : value).trim();
}

function _isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function _normalizeOverrides(value) {
  const overrides = typeof value === "string" ? JSON.parse(value) : value;
  if (!_isPlainObject(overrides)) {
    throw new Error("overrides must be an object");
  }
  const keys = Object.keys(overrides);
  if (!keys.includes("visible")) {
    throw new Error("overrides.visible required");
  }
  for (const key of keys) {
    if (key !== "visible") {
      throw new Error(`unsupported override key: ${key}`);
    }
  }
  if (typeof overrides.visible !== "boolean") {
    throw new Error("overrides.visible must be boolean");
  }
  return { visible: overrides.visible };
}

function _normalizeIdentity(input = {}) {
  const targetAppId = _normalizeText(input.targetAppId);
  const moduleId = _normalizeText(input.moduleId);
  const scopeId = _normalizeText(input.scopeId);
  const elementId = _normalizeText(input.elementId);
  if (!targetAppId) throw new Error("targetAppId required");
  if (!moduleId) throw new Error("moduleId required");
  if (!scopeId) throw new Error("scopeId required");
  if (!elementId) throw new Error("elementId required");
  return { targetAppId, moduleId, scopeId, elementId };
}

function _assertPilotScope(identity) {
  if (
    identity.targetAppId !== PILOT_SCOPE.targetAppId
    || identity.moduleId !== PILOT_SCOPE.moduleId
    || identity.scopeId !== PILOT_SCOPE.scopeId
  ) {
    throw new Error("UI_EDITOR_LAYOUT_OVERRIDE_SCOPE_NOT_ALLOWED");
  }
}

function _rowToRecord(row) {
  if (!row) return null;
  let overrides = null;
  let parseError = "";
  try {
    overrides = row.overrides_json ? JSON.parse(row.overrides_json) : null;
  } catch (err) {
    overrides = null;
    parseError = err?.message || String(err);
  }
  return {
    targetAppId: _normalizeText(row.target_app_id),
    moduleId: _normalizeText(row.module_id),
    scopeId: _normalizeText(row.scope_id),
    elementId: _normalizeText(row.element_id),
    overrides,
    source: _normalizeText(row.source) || SOURCE,
    createdAt: _normalizeText(row.created_at),
    updatedAt: _normalizeText(row.updated_at),
    parseError,
  };
}

function _whereClause(filter = {}) {
  const clauses = [];
  const values = [];
  if (filter.targetAppId) {
    clauses.push("target_app_id = ?");
    values.push(_normalizeText(filter.targetAppId));
  }
  if (filter.moduleId) {
    clauses.push("module_id = ?");
    values.push(_normalizeText(filter.moduleId));
  }
  if (filter.scopeId) {
    clauses.push("scope_id = ?");
    values.push(_normalizeText(filter.scopeId));
  }
  if (filter.elementId) {
    clauses.push("element_id = ?");
    values.push(_normalizeText(filter.elementId));
  }
  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

function listUiEditorLayoutOverrides(filter = {}) {
  const db = _db();
  const { sql, values } = _whereClause(filter);
  const rows = db
    .prepare(
      `
      SELECT
        target_app_id,
        module_id,
        scope_id,
        element_id,
        overrides_json,
        source,
        created_at,
        updated_at
      FROM ui_editor_layout_overrides
      ${sql}
      ORDER BY target_app_id, module_id, scope_id, element_id
    `
    )
    .all(...values);
  return rows.map(_rowToRecord).filter(Boolean);
}

function getUiEditorLayoutOverride(identity = {}) {
  const db = _db();
  const norm = _normalizeIdentity(identity);
  const row = db
    .prepare(
      `
      SELECT
        target_app_id,
        module_id,
        scope_id,
        element_id,
        overrides_json,
        source,
        created_at,
        updated_at
      FROM ui_editor_layout_overrides
      WHERE target_app_id = ?
        AND module_id = ?
        AND scope_id = ?
        AND element_id = ?
      LIMIT 1
    `
    )
    .get(norm.targetAppId, norm.moduleId, norm.scopeId, norm.elementId);
  return _rowToRecord(row);
}

function saveUiEditorLayoutOverride(input = {}) {
  const db = _db();
  const norm = _normalizeIdentity(input);
  _assertPilotScope(norm);
  const overrides = _normalizeOverrides(input.overrides);
  const source = _normalizeText(input.source) || SOURCE;
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO ui_editor_layout_overrides (
      target_app_id,
      module_id,
      scope_id,
      element_id,
      overrides_json,
      source,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(target_app_id, module_id, scope_id, element_id)
    DO UPDATE SET
      overrides_json = excluded.overrides_json,
      source = excluded.source,
      updated_at = excluded.updated_at
  `
  ).run(
    norm.targetAppId,
    norm.moduleId,
    norm.scopeId,
    norm.elementId,
    JSON.stringify(overrides),
    source,
    now,
    now
  );

  return getUiEditorLayoutOverride(norm);
}

module.exports = {
  PILOT_SCOPE,
  listUiEditorLayoutOverrides,
  getUiEditorLayoutOverride: getUiEditorLayoutOverride,
  saveUiEditorLayoutOverride,
};
