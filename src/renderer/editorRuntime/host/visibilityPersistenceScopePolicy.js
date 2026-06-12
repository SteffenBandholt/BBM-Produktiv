const VISIBILITY_PERSISTENCE_ALLOWED_SCOPE_ENTRIES = Object.freeze([
  Object.freeze({
    targetAppId: "bbm",
    moduleId: "restarbeiten",
    scopeId: "restarbeiten.ui.main",
  }),
]);

export const VISIBILITY_PERSISTENCE_ALLOWED_SCOPES = Object.freeze(
  VISIBILITY_PERSISTENCE_ALLOWED_SCOPE_ENTRIES.map((entry) => entry.scopeId)
);

function normalizeId(value) {
  return String(value ?? "").trim();
}

export function getVisibilityPersistenceAllowedScopeEntries() {
  return VISIBILITY_PERSISTENCE_ALLOWED_SCOPE_ENTRIES.map((entry) => ({ ...entry }));
}

export function isVisibilityPersistenceAllowedForScope(scopeId, context = {}) {
  const normalizedScopeId = normalizeId(scopeId);
  if (!normalizedScopeId) return false;
  const targetAppId = normalizeId(context.targetAppId);
  const moduleId = normalizeId(context.moduleId);

  return VISIBILITY_PERSISTENCE_ALLOWED_SCOPE_ENTRIES.some((entry) => (
    entry.scopeId === normalizedScopeId
    && (!targetAppId || entry.targetAppId === targetAppId)
    && (!moduleId || entry.moduleId === moduleId)
  ));
}

export function getVisibilityPersistenceAllowedScopesForContext(context = {}) {
  const targetAppId = normalizeId(context.targetAppId);
  const moduleId = normalizeId(context.moduleId);
  return VISIBILITY_PERSISTENCE_ALLOWED_SCOPE_ENTRIES
    .filter((entry) => (
      (!targetAppId || entry.targetAppId === targetAppId)
      && (!moduleId || entry.moduleId === moduleId)
    ))
    .map((entry) => entry.scopeId);
}
