const crypto = require("node:crypto");
const { initDatabase } = require("./database");

const UI_EDITOR_ELEMENT_OVERRIDE_ALLOWED_SURFACES = Object.freeze(["restarbeiten.ui.main"]);
const UI_EDITOR_ELEMENT_OVERRIDE_ALLOWED_ELEMENT_TYPES = Object.freeze(["Hinweis / Infotext", "label"]);
const UI_EDITOR_ELEMENT_OVERRIDE_ALLOWED_CHANGE_KEYS = Object.freeze(["text", "label", "visible", "order"]);

function _db() {
  return initDatabase();
}

function _isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function _normalizeText(value, fieldName = "value") {
  const text = String(value == null ? "" : value).trim();
  if (!text) {
    throw new Error(`${fieldName} required`);
  }
  return text;
}

function _optionalText(value) {
  const text = String(value == null ? "" : value).trim();
  return text;
}

function _normalizeChangeValue(key, value) {
  if (key === "text" || key === "label") {
    const text = String(value == null ? "" : value).trim();
    if (!text) {
      throw new Error(`changes.${key} required`);
    }
    return text;
  }
  if (key === "visible") {
    if (typeof value !== "boolean") {
      throw new Error("changes.visible must be boolean");
    }
    return value;
  }
  if (key === "order") {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      throw new Error("changes.order must be a number");
    }
    return num;
  }
  throw new Error(`unsupported change key: ${key}`);
}

function _normalizeChanges(changes) {
  if (!_isPlainObject(changes)) {
    throw new Error("changes must be an object");
  }
  const keys = Object.keys(changes);
  if (keys.length < 1) {
    throw new Error("changes required");
  }
  for (const key of keys) {
    if (!UI_EDITOR_ELEMENT_OVERRIDE_ALLOWED_CHANGE_KEYS.includes(key)) {
      throw new Error(`unsupported change key: ${key}`);
    }
  }
  if (Object.prototype.hasOwnProperty.call(changes, "noteText")) {
    throw new Error("noteText is not allowed");
  }
  if (Object.prototype.hasOwnProperty.call(changes, "restarbeitId")) {
    throw new Error("restarbeitId is not allowed");
  }
  if (Object.prototype.hasOwnProperty.call(changes, "diagnosticState")) {
    throw new Error("diagnosticState is not allowed");
  }
  if (Object.prototype.hasOwnProperty.call(changes, "diagnostics")) {
    throw new Error("diagnostics is not allowed");
  }

  const normalized = {};
  for (const key of keys) {
    normalized[key] = _normalizeChangeValue(key, changes[key]);
  }
  return normalized;
}

function _normalizeIdentity(input = {}) {
  if (!_isPlainObject(input)) {
    throw new Error("payload must be an object");
  }
  const projectId = _normalizeText(input.projectId ?? input.project_id, "projectId");
  const surfaceId = _normalizeText(input.surfaceId ?? input.surface_id, "surfaceId");
  const elementId = _normalizeText(input.elementId ?? input.element_id, "elementId");
  const elementType = _normalizeText(input.elementType ?? input.element_type, "elementType");
  const allowedKeys = new Set(["projectId", "project_id", "surfaceId", "surface_id", "elementId", "element_id", "elementType", "element_type", "changes"]);
  const unknownKeys = Object.keys(input).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(`unsupported payload key: ${unknownKeys[0]}`);
  }
  if (!UI_EDITOR_ELEMENT_OVERRIDE_ALLOWED_SURFACES.includes(surfaceId)) {
    throw new Error("surfaceId not allowed");
  }
  if (!UI_EDITOR_ELEMENT_OVERRIDE_ALLOWED_ELEMENT_TYPES.includes(elementType)) {
    throw new Error("elementType not allowed");
  }
  const changes = _normalizeChanges(input.changes);
  return {
    projectId,
    surfaceId,
    elementId,
    elementType,
    changes,
  };
}

function _rowToRecord(row) {
  if (!row) return null;
  let changes = null;
  let parseError = "";
  try {
    changes = row.changes_json ? JSON.parse(row.changes_json) : null;
  } catch (err) {
    changes = null;
    parseError = err?.message || String(err);
  }
  return {
    id: String(row.id || "").trim(),
    projectId: String(row.project_id || "").trim(),
    surfaceId: String(row.surface_id || "").trim(),
    elementId: String(row.element_id || "").trim(),
    elementType: String(row.element_type || "").trim(),
    changes,
    createdAt: String(row.created_at || "").trim(),
    updatedAt: String(row.updated_at || "").trim(),
    resultReference: String(row.id || "").trim(),
    parseError,
  };
}

function _whereClause(filter = {}) {
  const clauses = [];
  const values = [];

  if (filter.projectId != null && String(filter.projectId).trim()) {
    clauses.push("project_id = ?");
    values.push(String(filter.projectId).trim());
  }
  if (filter.surfaceId != null && String(filter.surfaceId).trim()) {
    clauses.push("surface_id = ?");
    values.push(String(filter.surfaceId).trim());
  }
  if (filter.elementId != null && String(filter.elementId).trim()) {
    clauses.push("element_id = ?");
    values.push(String(filter.elementId).trim());
  }
  if (filter.elementType != null && String(filter.elementType).trim()) {
    clauses.push("element_type = ?");
    values.push(String(filter.elementType).trim());
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

function validateUiEditorElementOverridePayload(input = {}) {
  return _normalizeIdentity(input);
}

function listUiEditorElementOverrides(filter = {}) {
  const db = _db();
  const { sql, values } = _whereClause(filter);
  const rows = db
    .prepare(
      `
      SELECT
        id,
        project_id,
        surface_id,
        element_id,
        element_type,
        changes_json,
        created_at,
        updated_at
      FROM ui_editor_element_overrides
      ${sql}
      ORDER BY project_id, surface_id, element_id
    `
    )
    .all(...values);
  return rows.map(_rowToRecord).filter(Boolean);
}

function getUiEditorElementOverride(identity = {}) {
  const db = _db();
  const projectId = _normalizeText(identity.projectId ?? identity.project_id, "projectId");
  const surfaceId = _normalizeText(identity.surfaceId ?? identity.surface_id, "surfaceId");
  const elementId = _normalizeText(identity.elementId ?? identity.element_id, "elementId");
  const row = db
    .prepare(
      `
      SELECT
        id,
        project_id,
        surface_id,
        element_id,
        element_type,
        changes_json,
        created_at,
        updated_at
      FROM ui_editor_element_overrides
      WHERE project_id = ?
        AND surface_id = ?
        AND element_id = ?
      LIMIT 1
    `
    )
    .get(projectId, surfaceId, elementId);
  return _rowToRecord(row);
}

function saveUiEditorElementOverride(input = {}) {
  const db = _db();
  const norm = validateUiEditorElementOverridePayload(input);
  const now = new Date().toISOString();
  const existing = getUiEditorElementOverride(norm);
  const id = existing?.id || crypto.randomUUID();

  db.prepare(
    `
    INSERT INTO ui_editor_element_overrides (
      id,
      project_id,
      surface_id,
      element_id,
      element_type,
      changes_json,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id, surface_id, element_id)
    DO UPDATE SET
      element_type = excluded.element_type,
      changes_json = excluded.changes_json,
      updated_at = excluded.updated_at
  `
  ).run(
    id,
    norm.projectId,
    norm.surfaceId,
    norm.elementId,
    norm.elementType,
    JSON.stringify(norm.changes),
    existing?.createdAt || now,
    now
  );

  return getUiEditorElementOverride(norm);
}

module.exports = {
  UI_EDITOR_ELEMENT_OVERRIDE_ALLOWED_SURFACES,
  UI_EDITOR_ELEMENT_OVERRIDE_ALLOWED_ELEMENT_TYPES,
  UI_EDITOR_ELEMENT_OVERRIDE_ALLOWED_CHANGE_KEYS,
  validateUiEditorElementOverridePayload,
  listUiEditorElementOverrides,
  getUiEditorElementOverride,
  saveUiEditorElementOverride,
};
