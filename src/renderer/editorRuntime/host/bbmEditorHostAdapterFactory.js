import { createRestarbeitenMainUiHostAdapter } from "../../modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js";

export function createBbmEditorHostAdapter(scopeId) {
  const normalizedScopeId = String(scopeId || "").trim();
  if (normalizedScopeId === "restarbeiten.ui.main") {
    return createRestarbeitenMainUiHostAdapter();
  }

  const error = new Error(`Unsupported editor scope: ${normalizedScopeId || "<empty>"}`);
  error.code = "EDITOR_SCOPE_UNSUPPORTED";
  throw error;
}
