import {
  EDITOR_ALLOWED_OPERATIONS,
  isEditorElementRole,
  isEditorElementType,
  isEditorOperation,
} from "./editorRegistryModel.js";

const FORBIDDEN_FACILITY_OPS = new Set(["save", "delete", "send", "upload"]);

const REQUIRED_FIELDS = Object.freeze([
  "id",
  "name",
  "type",
  "role",
  "parentId",
  "order",
  "visible",
  "editable",
  "allowedOps",
  "lockedOps",
]);

function pushError(errors, code, message, index = null, id = null) {
  const entry = { code, message };
  if (index !== null) entry.index = index;
  if (id !== null) entry.id = id;
  errors.push(entry);
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeOps(value) {
  return Array.isArray(value) ? value.map((item) => String(item || "")) : [];
}

export function validateEditorRegistry(registry) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(registry)) {
    pushError(errors, "REGISTRY_NOT_ARRAY", "registry must be an array");
    return { ok: false, errors, warnings };
  }

  const rootEntries = [];
  const ids = new Map();

  for (const [index, element] of registry.entries()) {
    if (!isPlainObject(element)) {
      pushError(errors, "ELEMENT_NOT_OBJECT", "registry element must be an object", index);
      continue;
    }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in element)) {
        pushError(errors, "REQUIRED_FIELD_MISSING", `missing required field: ${field}`, index, element.id || null);
      }
    }

    const id = String(element.id || "");
    if (!id) {
      pushError(errors, "ID_MISSING", "id must be a non-empty string", index);
    } else if (ids.has(id)) {
      pushError(errors, "DUPLICATE_ID", `duplicate id: ${id}`, index, id);
    } else {
      ids.set(id, element);
    }

    if (!isEditorElementType(element.type)) {
      pushError(errors, "TYPE_INVALID", `invalid element type: ${String(element.type || "")}`, index, id || null);
    }

    if (!isEditorElementRole(element.role)) {
      pushError(errors, "ROLE_INVALID", `invalid element role: ${String(element.role || "")}`, index, id || null);
    }

    const allowedOps = normalizeOps(element.allowedOps);
    const lockedOps = normalizeOps(element.lockedOps);

    if (!Array.isArray(element.allowedOps)) {
      pushError(errors, "ALLOWED_OPS_NOT_ARRAY", "allowedOps must be an array", index, id || null);
    }
    if (!Array.isArray(element.lockedOps)) {
      pushError(errors, "LOCKED_OPS_NOT_ARRAY", "lockedOps must be an array", index, id || null);
    }

    for (const op of allowedOps) {
      if (!isEditorOperation(op)) {
        pushError(errors, "ALLOWED_OP_INVALID", `invalid allowed operation: ${op}`, index, id || null);
      }
      if (FORBIDDEN_FACILITY_OPS.has(op)) {
        pushError(errors, "FACILITY_OPERATION_FORBIDDEN", `forbidden facility operation: ${op}`, index, id || null);
      }
    }

    for (const op of lockedOps) {
      if (!isEditorOperation(op)) {
        pushError(errors, "LOCKED_OP_INVALID", `invalid locked operation: ${op}`, index, id || null);
      }
      if (FORBIDDEN_FACILITY_OPS.has(op)) {
        pushError(errors, "FACILITY_OPERATION_FORBIDDEN", `forbidden facility operation: ${op}`, index, id || null);
      }
    }

    for (const op of lockedOps) {
      if (allowedOps.includes(op)) {
        pushError(errors, "LOCKED_OPS_CONFLICT", `operation is both allowed and locked: ${op}`, index, id || null);
      }
    }

    if (element.parentId === null || element.parentId === undefined || String(element.parentId || "").trim() === "") {
      rootEntries.push(element);
    }
  }

  if (rootEntries.length !== 1) {
    pushError(errors, "ROOT_COUNT_INVALID", "registry must contain exactly one root element");
  }

  for (const [index, element] of registry.entries()) {
    if (!isPlainObject(element)) continue;
    const id = String(element.id || "");
    const parentId = element.parentId;
    const isRoot = parentId === null || parentId === undefined || String(parentId || "").trim() === "";
    if (!isRoot && !ids.has(String(parentId || ""))) {
      pushError(errors, "PARENT_UNKNOWN", `unknown parentId: ${String(parentId || "")}`, index, id || null);
    }
  }

  if (EDITOR_ALLOWED_OPERATIONS.length === 0) {
    warnings.push("no allowed operations configured");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
