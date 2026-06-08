import { getRestarbeitenMainUiRegistry } from "./restarbeitenEditorScopes.js";
import { validateEditorChangeRequest } from "../../../editorRuntime/changeRequests/editorChangeRequestValidator.js";
import { validateHostAdapterShape } from "../../../editorRuntime/host/bbmEditorHostAdapterContract.js";

const SCOPE = Object.freeze({
  targetAppId: "bbm",
  moduleId: "restarbeiten",
  scopeId: "restarbeiten.ui.main",
});

export function createRestarbeitenMainUiHostAdapter() {
  const registry = getRestarbeitenMainUiRegistry();

  const adapter = {
    getRegistry() {
      return registry.map((entry) => ({
        ...entry,
        allowedOps: [...entry.allowedOps],
        lockedOps: [...entry.lockedOps],
      }));
    },

    getCurrentLayoutState() {
      return [];
    },

    submitChangeRequest(changeRequest) {
      const validation = validateEditorChangeRequest(changeRequest, {
        scope: SCOPE,
        registry,
      });

      if (!validation.ok) {
        return {
          ok: false,
          blocked: true,
          reason: "INVALID_CHANGE_REQUEST",
          validation,
        };
      }

      return {
        ok: false,
        blocked: true,
        reason: "LAYOUT_WRITE_NOT_IMPLEMENTED",
        validation,
      };
    },
  };

  const shape = validateHostAdapterShape(adapter);
  if (!shape.ok) {
    const error = new Error("Restarbeiten HostAdapter contract validation failed");
    error.details = shape.errors;
    throw error;
  }

  return adapter;
}
