import { createRestarbeitenMainUiHostAdapter } from "../../modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js";
import { isVisibilityPersistenceAllowedForScope } from "./visibilityPersistenceScopePolicy.js";

export function createBbmEditorHostAdapter(scopeId) {
  const normalizedScopeId = String(scopeId || "").trim();
  if (isVisibilityPersistenceAllowedForScope(normalizedScopeId, {
    targetAppId: "bbm",
    moduleId: "restarbeiten",
  })) {
    return createRestarbeitenMainUiHostAdapter();
  }

  const error = new Error(`Unsupported editor scope: ${normalizedScopeId || "<empty>"}`);
  error.code = "EDITOR_SCOPE_UNSUPPORTED";
  throw error;
}
