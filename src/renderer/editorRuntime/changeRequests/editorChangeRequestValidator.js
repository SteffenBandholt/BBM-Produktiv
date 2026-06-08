import {
  EDITOR_CHANGE_REQUEST_REQUIRED_FIELDS,
  EDITOR_FORBIDDEN_CHANGE_REQUEST_TERMS,
} from "./editorChangeRequestModel.js";

function pushError(errors, code, message, details = {}) {
  errors.push({ code, message, ...details });
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function hasForbiddenTermInKey(key) {
  const normalized = String(key ?? "");
  return EDITOR_FORBIDDEN_CHANGE_REQUEST_TERMS.some((term) => normalized.includes(term));
}

export function validateEditorChangeRequest(changeRequest, { scope = null, registry = [] } = {}) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(changeRequest)) {
    pushError(errors, "CHANGE_REQUEST_NOT_OBJECT", "changeRequest must be an object");
    return { ok: false, errors, warnings };
  }

  for (const field of EDITOR_CHANGE_REQUEST_REQUIRED_FIELDS) {
    if (!(field in changeRequest)) {
      pushError(errors, "REQUIRED_FIELD_MISSING", `missing required field: ${field}`, { field });
    }
  }

  const targetAppId = normalizeString(changeRequest.targetAppId);
  const moduleId = normalizeString(changeRequest.moduleId);
  const scopeId = normalizeString(changeRequest.scopeId);
  const elementId = normalizeString(changeRequest.elementId);
  const operation = normalizeString(changeRequest.operation);

  if (scope) {
    if (normalizeString(scope.targetAppId || "bbm") && targetAppId !== normalizeString(scope.targetAppId || "bbm")) {
      pushError(errors, "TARGET_APP_MISMATCH", `targetAppId does not match scope target app: ${targetAppId}`);
    }
    if (normalizeString(scope.moduleId) && moduleId !== normalizeString(scope.moduleId)) {
      pushError(errors, "MODULE_ID_MISMATCH", `moduleId does not match scope module: ${moduleId}`);
    }
    if (normalizeString(scope.scopeId) && scopeId !== normalizeString(scope.scopeId)) {
      pushError(errors, "SCOPE_ID_MISMATCH", `scopeId does not match scope: ${scopeId}`);
    }
  }

  const registryList = Array.isArray(registry) ? registry : [];
  const registryEntry = registryList.find((entry) => entry && String(entry.id || "") === elementId);
  if (!registryEntry) {
    pushError(errors, "ELEMENT_ID_UNKNOWN", `unknown elementId: ${elementId}`);
  } else {
    const allowedOps = Array.isArray(registryEntry.allowedOps) ? registryEntry.allowedOps.map((item) => String(item || "")) : [];
    const lockedOps = Array.isArray(registryEntry.lockedOps) ? registryEntry.lockedOps.map((item) => String(item || "")) : [];

    if (allowedOps.length > 0 && !allowedOps.includes(operation)) {
      pushError(errors, "OPERATION_NOT_ALLOWED", `operation is not allowed for element: ${operation}`, {
        elementId,
      });
    }

    if (lockedOps.includes(operation)) {
      pushError(errors, "OPERATION_LOCKED", `operation is locked for element: ${operation}`, {
        elementId,
      });
    }
  }

  if (EDITOR_FORBIDDEN_CHANGE_REQUEST_TERMS.includes(operation)) {
    pushError(errors, "FORBIDDEN_OPERATION", `forbidden operation: ${operation}`);
  }

  if (!isPlainObject(changeRequest.payload)) {
    pushError(errors, "PAYLOAD_NOT_OBJECT", "payload must be an object");
  } else {
    for (const key of Object.keys(changeRequest.payload)) {
      if (hasForbiddenTermInKey(key)) {
        pushError(errors, "PAYLOAD_KEY_FORBIDDEN", `forbidden payload key: ${key}`, {
          key,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
