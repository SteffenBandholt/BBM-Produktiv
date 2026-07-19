const DEFAULT_LAYOUT_PROFILE_ID = "default";
const LAYOUT_STORAGE_VERSION = 1;

const SAFE_LAYOUT_OPERATIONS = Object.freeze([
  "move",
  "resize",
  "hide",
  "show",
  "spacing",
  "width",
  "height",
]);

const FORBIDDEN_LAYOUT_VALUE_KEYS = Object.freeze([
  "project",
  "projectId",
  "meeting",
  "meetingId",
  "top",
  "topId",
  "person",
  "personId",
  "record",
  "recordId",
  "entity",
  "businessData",
  "database",
  "db",
  "sql",
  "tableName",
  "ipc",
  "dom",
  "node",
  "element",
  "selector",
  "html",
  "className",
  "dataset",
  "style",
  "text",
  "content",
  "value",
]);

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function hasForbiddenKey(value) {
  if (Array.isArray(value)) {
    return value.some((entry) => hasForbiddenKey(entry));
  }
  if (!isPlainObject(value)) return false;

  for (const key of Object.keys(value)) {
    if (FORBIDDEN_LAYOUT_VALUE_KEYS.includes(key)) return true;
    if (hasForbiddenKey(value[key])) return true;
  }
  return false;
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toNeutralLength(value) {
  const number = toFiniteNumber(value);
  if (number !== null) return number;
  const text = normalizeString(value);
  return /^-?\d+(\.\d+)?(px|rem|em|%)$/u.test(text) ? text : null;
}

function pickNumericPayload(payload, keys) {
  const layoutValue = {};
  for (const key of keys) {
    const value = toFiniteNumber(payload?.[key]);
    if (value !== null) layoutValue[key] = value;
  }
  return layoutValue;
}

function pickLengthPayload(payload, keys) {
  const layoutValue = {};
  for (const key of keys) {
    const value = toNeutralLength(payload?.[key]);
    if (value !== null) layoutValue[key] = value;
  }
  return layoutValue;
}

export function normalizeEditorLayoutValue(operation, payload = {}) {
  const normalizedOperation = normalizeString(operation);
  const normalizedPayload = isPlainObject(payload) ? payload : {};

  if (!SAFE_LAYOUT_OPERATIONS.includes(normalizedOperation)) {
    return {
      ok: false,
      reason: "OPERATION_NOT_LAYOUT_STORAGE_SAFE",
      layoutValue: null,
    };
  }

  if (hasForbiddenKey(normalizedPayload)) {
    return {
      ok: false,
      reason: "LAYOUT_VALUE_FORBIDDEN_KEY",
      layoutValue: null,
    };
  }

  if (normalizedOperation === "move") {
    const layoutValue = pickNumericPayload(normalizedPayload, ["x", "y"]);
    return Object.keys(layoutValue).length > 0
      ? { ok: true, layoutValue }
      : { ok: false, reason: "LAYOUT_VALUE_EMPTY", layoutValue: null };
  }

  if (normalizedOperation === "resize") {
    const layoutValue = pickLengthPayload(normalizedPayload, ["width", "height"]);
    return Object.keys(layoutValue).length > 0
      ? { ok: true, layoutValue }
      : { ok: false, reason: "LAYOUT_VALUE_EMPTY", layoutValue: null };
  }

  if (normalizedOperation === "hide") {
    return { ok: true, layoutValue: { visible: false } };
  }

  if (normalizedOperation === "show") {
    return { ok: true, layoutValue: { visible: true } };
  }

  if (normalizedOperation === "spacing") {
    const layoutValue = pickLengthPayload(normalizedPayload, ["gap", "padding", "margin"]);
    return Object.keys(layoutValue).length > 0
      ? { ok: true, layoutValue }
      : { ok: false, reason: "LAYOUT_VALUE_EMPTY", layoutValue: null };
  }

  if (normalizedOperation === "width") {
    const width = toNeutralLength(normalizedPayload.width);
    return width !== null
      ? { ok: true, layoutValue: { width } }
      : { ok: false, reason: "LAYOUT_VALUE_EMPTY", layoutValue: null };
  }

  if (normalizedOperation === "height") {
    const height = toNeutralLength(normalizedPayload.height);
    return height !== null
      ? { ok: true, layoutValue: { height } }
      : { ok: false, reason: "LAYOUT_VALUE_EMPTY", layoutValue: null };
  }

  return {
    ok: false,
    reason: "OPERATION_NOT_LAYOUT_STORAGE_SAFE",
    layoutValue: null,
  };
}

export function createEditorLayoutMemoryStorage(initialPayload = null) {
  let payload = isPlainObject(initialPayload) ? structuredClone(initialPayload) : null;
  return {
    read() {
      return isPlainObject(payload) ? structuredClone(payload) : null;
    },
    write(nextPayload) {
      payload = isPlainObject(nextPayload) ? structuredClone(nextPayload) : null;
      return this.read();
    },
    clear() {
      payload = null;
    },
  };
}

function createEmptyStoragePayload(scope) {
  return {
    version: LAYOUT_STORAGE_VERSION,
    targetAppId: scope.targetAppId,
    moduleId: scope.moduleId,
    scopeId: scope.scopeId,
    layoutProfileId: DEFAULT_LAYOUT_PROFILE_ID,
    entries: {},
  };
}

function readStoragePayload(storage, scope) {
  const payload = typeof storage?.read === "function" ? storage.read() : null;
  if (!isPlainObject(payload) || !isPlainObject(payload.entries)) {
    return createEmptyStoragePayload(scope);
  }

  if (
    payload.version !== LAYOUT_STORAGE_VERSION ||
    normalizeString(payload.targetAppId) !== scope.targetAppId ||
    normalizeString(payload.moduleId) !== scope.moduleId ||
    normalizeString(payload.scopeId) !== scope.scopeId
  ) {
    return createEmptyStoragePayload(scope);
  }

  return {
    ...createEmptyStoragePayload(scope),
    entries: Object.fromEntries(
      Object.entries(payload.entries).filter(([, entry]) => isPlainObject(entry) && isPlainObject(entry.layoutValue))
    ),
  };
}

function writeStoragePayload(storage, payload) {
  if (typeof storage?.write === "function") {
    return storage.write(payload);
  }
  return payload;
}

function cloneLayoutEntry(entry) {
  return {
    layoutProfileId: normalizeString(entry.layoutProfileId) || DEFAULT_LAYOUT_PROFILE_ID,
    targetAppId: normalizeString(entry.targetAppId),
    moduleId: normalizeString(entry.moduleId),
    scopeId: normalizeString(entry.scopeId),
    elementId: normalizeString(entry.elementId),
    operation: normalizeString(entry.operation),
    layoutValue: structuredClone(entry.layoutValue),
    createdAt: normalizeString(entry.createdAt),
    updatedAt: normalizeString(entry.updatedAt),
  };
}

export function createEditorLayoutStore({ scope, storage = createEditorLayoutMemoryStorage(), now = () => new Date().toISOString() } = {}) {
  const normalizedScope = {
    targetAppId: normalizeString(scope?.targetAppId),
    moduleId: normalizeString(scope?.moduleId),
    scopeId: normalizeString(scope?.scopeId),
  };

  function list() {
    const payload = readStoragePayload(storage, normalizedScope);
    return Object.values(payload.entries).map(cloneLayoutEntry);
  }

  function save(changeRequest, layoutValue) {
    const payload = readStoragePayload(storage, normalizedScope);
    const elementId = normalizeString(changeRequest?.elementId);
    const previous = payload.entries[elementId] || null;
    const timestamp = now();
    const entry = {
      layoutProfileId: DEFAULT_LAYOUT_PROFILE_ID,
      targetAppId: normalizedScope.targetAppId,
      moduleId: normalizedScope.moduleId,
      scopeId: normalizedScope.scopeId,
      elementId,
      operation: normalizeString(changeRequest?.operation),
      layoutValue: structuredClone(layoutValue),
      createdAt: previous?.createdAt || timestamp,
      updatedAt: timestamp,
    };
    payload.entries[elementId] = entry;
    writeStoragePayload(storage, payload);
    return cloneLayoutEntry(entry);
  }

  function reset(elementId = null) {
    const payload = readStoragePayload(storage, normalizedScope);
    const normalizedElementId = normalizeString(elementId);
    if (normalizedElementId) {
      delete payload.entries[normalizedElementId];
    } else {
      payload.entries = {};
    }
    writeStoragePayload(storage, payload);
    return list();
  }

  function replace(entries = [], elementIds = null) {
    const payload = readStoragePayload(storage, normalizedScope);
    const ids = Array.isArray(elementIds) ? elementIds.map(normalizeString).filter(Boolean) : [];
    if (ids.length > 0) {
      for (const id of ids) delete payload.entries[id];
    } else {
      payload.entries = {};
    }
    for (const entry of Array.isArray(entries) ? entries : []) {
      const elementId = normalizeString(entry?.elementId);
      if (!elementId || !isPlainObject(entry?.layoutValue)) continue;
      const timestamp = normalizeString(entry.updatedAt) || now();
      payload.entries[elementId] = {
        layoutProfileId: normalizeString(entry.layoutProfileId) || DEFAULT_LAYOUT_PROFILE_ID,
        targetAppId: normalizedScope.targetAppId,
        moduleId: normalizedScope.moduleId,
        scopeId: normalizedScope.scopeId,
        elementId,
        operation: normalizeString(entry.operation) || "session.restore",
        layoutValue: structuredClone(entry.layoutValue),
        createdAt: normalizeString(entry.createdAt) || timestamp,
        updatedAt: timestamp,
      };
    }
    writeStoragePayload(storage, payload);
    return list();
  }

  return {
    list,
    save,
    reset,
    replace,
  };
}

export {
  DEFAULT_LAYOUT_PROFILE_ID,
  FORBIDDEN_LAYOUT_VALUE_KEYS,
  LAYOUT_STORAGE_VERSION,
  SAFE_LAYOUT_OPERATIONS,
};
