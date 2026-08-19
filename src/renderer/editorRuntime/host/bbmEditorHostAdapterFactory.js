import { getActiveEditorModuleRegistrations } from "../../app/modules/moduleEditorRegistrations.js";

export function createBbmEditorHostAdapter(scopeId, options = {}) {
  const normalizedScopeId = String(scopeId || "").trim();
  const registration = getActiveEditorModuleRegistrations()
    .flatMap((entry) => entry?.editorRuntimeScopes || [])
    .find((entry) => entry?.scopeId === normalizedScopeId);
  if (typeof registration?.createHostAdapter === "function") return registration.createHostAdapter(options);

  const error = new Error(`Unsupported editor scope: ${normalizedScopeId || "<empty>"}`);
  error.code = "EDITOR_SCOPE_UNSUPPORTED";
  throw error;
}
