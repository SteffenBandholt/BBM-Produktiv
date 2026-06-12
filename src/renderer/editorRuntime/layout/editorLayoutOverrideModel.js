export const EDITOR_LAYOUT_OVERRIDE_REQUIRED_FIELDS = Object.freeze([
  "targetAppId",
  "moduleId",
  "scopeId",
  "elementId",
  "overrides",
]);

export const EDITOR_LAYOUT_OVERRIDE_SOURCE = "ui-editor";

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function clonePlainObject(value) {
  return isPlainObject(value) ? { ...value } : {};
}

function pushError(errors, code, message, details = {}) {
  errors.push({ code, message, ...details });
}

function hasUncontrolledInstanceMarker(elementId) {
  const normalized = normalizeString(elementId).toLowerCase();
  if (!normalized) return true;
  if (normalized.includes("::")) return true;
  return /(^|[._-])(record|template)([._-]|$)/.test(normalized);
}

function registryContainsElement(registry, elementId) {
  if (!Array.isArray(registry)) return true;
  const normalizedElementId = normalizeString(elementId);
  return registry.some((entry) => normalizeString(entry?.id || entry?.elementId) === normalizedElementId);
}

export function normalizeEditorLayoutOverride(input = {}) {
  const overrides = clonePlainObject(input.overrides);
  const normalized = {
    targetAppId: normalizeString(input.targetAppId),
    moduleId: normalizeString(input.moduleId),
    scopeId: normalizeString(input.scopeId),
    elementId: normalizeString(input.elementId),
    overrides: {},
    source: normalizeString(input.source) || EDITOR_LAYOUT_OVERRIDE_SOURCE,
    createdAt: normalizeString(input.createdAt),
    updatedAt: normalizeString(input.updatedAt),
  };

  if (typeof overrides.visible === "boolean") {
    normalized.overrides.visible = overrides.visible;
  } else if ("visible" in overrides) {
    normalized.overrides.visible = overrides.visible;
  }

  return normalized;
}

export function validateEditorLayoutOverride(input, { registry = null, allowedScopes = null } = {}) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(input)) {
    pushError(errors, "OVERRIDE_NOT_OBJECT", "layout override must be an object");
    return { ok: false, errors, warnings };
  }

  const normalized = normalizeEditorLayoutOverride(input);

  for (const field of EDITOR_LAYOUT_OVERRIDE_REQUIRED_FIELDS) {
    if (!(field in input)) {
      pushError(errors, "REQUIRED_FIELD_MISSING", `missing required field: ${field}`, { field });
    }
  }

  for (const field of ["targetAppId", "moduleId", "scopeId", "elementId"]) {
    if (!normalized[field]) {
      pushError(errors, "REQUIRED_FIELD_EMPTY", `required field is empty: ${field}`, { field });
    }
  }

  if (!isPlainObject(input.overrides)) {
    pushError(errors, "OVERRIDES_NOT_OBJECT", "overrides must be an object");
  } else {
    const overrideKeys = Object.keys(input.overrides);
    if (!overrideKeys.includes("visible")) {
      pushError(errors, "VISIBLE_OVERRIDE_MISSING", "overrides.visible is required");
    }
    for (const key of overrideKeys) {
      if (key !== "visible") {
        pushError(errors, "OVERRIDE_KEY_UNSUPPORTED", `unsupported override key: ${key}`, { key });
      }
    }
    if (typeof input.overrides.visible !== "boolean") {
      pushError(errors, "VISIBLE_NOT_BOOLEAN", "overrides.visible must be boolean");
    }
  }

  if (hasUncontrolledInstanceMarker(normalized.elementId)) {
    pushError(errors, "ELEMENT_ID_NOT_PERSISTABLE", "elementId is not persistable", {
      elementId: normalized.elementId,
    });
  }

  if (Array.isArray(registry) && !registryContainsElement(registry, normalized.elementId)) {
    pushError(errors, "ELEMENT_ID_UNKNOWN", `unknown elementId: ${normalized.elementId}`, {
      elementId: normalized.elementId,
    });
  }

  if (Array.isArray(allowedScopes) && !allowedScopes.map(normalizeString).includes(normalized.scopeId)) {
    pushError(errors, "SCOPE_NOT_ALLOWED", `scope is not allowed: ${normalized.scopeId}`, {
      scopeId: normalized.scopeId,
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    value: normalized,
  };
}

export function buildVisibilityOverrideFromChangeRequest(changeRequest = {}) {
  const payload = clonePlainObject(changeRequest.payload);
  const isVisibilityOperation = changeRequest.operation === "visibility";
  return normalizeEditorLayoutOverride({
    targetAppId: changeRequest.targetAppId,
    moduleId: changeRequest.moduleId,
    scopeId: changeRequest.scopeId,
    elementId: changeRequest.elementId,
    overrides: {
      visible: isVisibilityOperation ? payload.visible : undefined,
    },
    source: EDITOR_LAYOUT_OVERRIDE_SOURCE,
    createdAt: changeRequest.createdAt,
    updatedAt: changeRequest.updatedAt || changeRequest.createdAt,
  });
}

export function isVisibilityOverridePersistable(changeRequest = {}, capabilities = {}) {
  const payload = clonePlainObject(changeRequest.payload);
  return Boolean(
    changeRequest.persistent === true
      && changeRequest.operation === "visibility"
      && typeof payload.visible === "boolean"
      && capabilities.persistence === true
      && capabilities.canPersistVisibility === true
      && capabilities.dryRunOnly !== true
  );
}
