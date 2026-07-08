import { getProtokollTopsUiRegistry, PROTOKOLL_TOPS_UI_SCOPE_ID } from "./protokollEditorScopes.js";
import { validateEditorChangeRequest } from "../../../editorRuntime/changeRequests/editorChangeRequestValidator.js";
import { validateHostAdapterShape } from "../../../editorRuntime/host/bbmEditorHostAdapterContract.js";
import {
  createEditorLayoutMemoryStorage,
  createEditorLayoutStore,
  normalizeEditorLayoutValue,
} from "../../../editorRuntime/layout/editorLayoutPersistence.js";

const SCOPE = Object.freeze({
  targetAppId: "bbm",
  moduleId: "protokoll",
  scopeId: PROTOKOLL_TOPS_UI_SCOPE_ID,
});

function cloneRegistry(registry) {
  return registry.map((entry) => ({
    ...entry,
    allowedOps: [...entry.allowedOps],
    lockedOps: [...entry.lockedOps],
  }));
}

export function createProtokollTopsUiHostAdapter({ layoutStorage = createEditorLayoutMemoryStorage() } = {}) {
  const registry = getProtokollTopsUiRegistry();
  const layoutStore = createEditorLayoutStore({
    scope: SCOPE,
    storage: layoutStorage,
  });

  const adapter = {
    getRegistry() {
      return cloneRegistry(registry);
    },

    getCurrentLayoutState() {
      return layoutStore.list();
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

      const layoutValueResult = normalizeEditorLayoutValue(changeRequest.operation, changeRequest.payload);
      if (!layoutValueResult.ok) {
        return {
          ok: false,
          blocked: true,
          reason: layoutValueResult.reason,
          validation,
        };
      }

      const layoutEntry = layoutStore.save(changeRequest, layoutValueResult.layoutValue);
      return {
        ok: true,
        blocked: false,
        reason: null,
        validation,
        layoutEntry,
      };
    },

    resetLayoutState({ elementId = null } = {}) {
      const normalizedElementId = String(elementId || "").trim();
      if (normalizedElementId && !registry.some((entry) => entry.id === normalizedElementId)) {
        return {
          ok: false,
          blocked: true,
          reason: "ELEMENT_ID_UNKNOWN",
          layoutState: layoutStore.list(),
        };
      }

      return {
        ok: true,
        blocked: false,
        reason: null,
        layoutState: layoutStore.reset(normalizedElementId || null),
      };
    },
  };

  const shape = validateHostAdapterShape(adapter);
  if (!shape.ok) {
    const error = new Error("Protokoll TOPS HostAdapter contract validation failed");
    error.details = shape.errors;
    throw error;
  }

  return adapter;
}
