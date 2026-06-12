import { getRestarbeitenMainUiRegistry } from "./restarbeitenEditorScopes.js";
import { validateEditorChangeRequest } from "../../../editorRuntime/changeRequests/editorChangeRequestValidator.js";
import {
  normalizeHostCapabilities,
  normalizeHostContext,
  validatePersistentVisibilityChangeRequests,
  validatePersistentVisibilityChangeRequestsDryRun,
  validateHostAdapterShape,
} from "../../../editorRuntime/host/bbmEditorHostAdapterContract.js";

const SCOPE = Object.freeze({
  targetAppId: "bbm",
  moduleId: "restarbeiten",
  scopeId: "restarbeiten.ui.main",
});

const PILOT_CAPABILITIES = Object.freeze({
  selection: true,
  preview: true,
  pendingChangeRequests: true,
  persistence: true,
  canPersistVisibility: true,
  dryRunOnly: false,
});

function hasVisibilityChangeRequest(changeRequests = []) {
  return Array.isArray(changeRequests)
    && changeRequests.some((entry) => entry?.operation === "visibility");
}

function cloneEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return {};
  return {
    ...entry,
    payload: entry.payload && typeof entry.payload === "object" && !Array.isArray(entry.payload)
      ? { ...entry.payload }
      : entry.payload,
    overrides: entry.overrides && typeof entry.overrides === "object" && !Array.isArray(entry.overrides)
      ? { ...entry.overrides }
      : entry.overrides,
  };
}

function cloneArray(value) {
  return Array.isArray(value) ? value.map(cloneEntry) : [];
}

function getDefaultStorageApi() {
  const api = globalThis?.window?.bbmDb || globalThis?.bbmDb || null;
  if (!api) return null;
  return {
    async list(filter) {
      if (typeof api.uiEditorLayoutOverridesGetMany !== "function") {
        return { ok: false, error: "UI_EDITOR_LAYOUT_OVERRIDES_API_UNAVAILABLE" };
      }
      return api.uiEditorLayoutOverridesGetMany(filter);
    },
    async save(override) {
      if (typeof api.uiEditorLayoutOverridesSave !== "function") {
        return { ok: false, error: "UI_EDITOR_LAYOUT_OVERRIDES_API_UNAVAILABLE" };
      }
      return api.uiEditorLayoutOverridesSave(override);
    },
  };
}

function normalizeStorageRecords(records = []) {
  return Array.isArray(records)
    ? records
      .map((entry) => cloneEntry(entry))
      .filter((entry) => entry.scopeId === SCOPE.scopeId && typeof entry.overrides?.visible === "boolean")
      .map((entry) => ({
        ...entry,
        visible: entry.overrides.visible,
      }))
    : [];
}

export function createRestarbeitenMainUiHostAdapter({ storageApi = getDefaultStorageApi() } = {}) {
  const registry = getRestarbeitenMainUiRegistry();
  const pendingChangeRequests = [];
  let layoutState = [];

  function updateLayoutStateFromRecords(records = []) {
    layoutState = normalizeStorageRecords(records);
    return cloneArray(layoutState);
  }

  const adapter = {
    getHostContext() {
      return normalizeHostContext({
        targetAppId: SCOPE.targetAppId,
        moduleId: SCOPE.moduleId,
        scopeId: SCOPE.scopeId,
        activeUiScope: SCOPE.scopeId,
      });
    },

    getRegistry() {
      return registry.map((entry) => ({
        ...entry,
        allowedOps: [...entry.allowedOps],
        lockedOps: [...entry.lockedOps],
      }));
    },

    getCurrentLayoutState() {
      return cloneArray(layoutState);
    },

    getCapabilities() {
      return { ...PILOT_CAPABILITIES };
    },

    async loadCurrentLayoutState() {
      if (!storageApi || typeof storageApi.list !== "function") {
        return {
          ok: false,
          reason: "STORAGE_UNAVAILABLE",
          layoutState: cloneArray(layoutState),
        };
      }
      const result = await storageApi.list(SCOPE);
      if (!result?.ok) {
        return {
          ok: false,
          reason: "STORAGE_UNAVAILABLE",
          error: result?.error || "",
          layoutState: cloneArray(layoutState),
        };
      }
      return {
        ok: true,
        layoutState: updateLayoutStateFromRecords(result.data || []),
      };
    },

    onPendingChangeRequestsChanged(changeRequests = []) {
      const nextRequests = cloneArray(changeRequests);
      pendingChangeRequests.splice(0, pendingChangeRequests.length, ...nextRequests);
      return {
        ok: true,
        persistent: false,
        count: pendingChangeRequests.length,
      };
    },

    async submitChangeRequests(changeRequests = []) {
      const capabilities = this.getCapabilities();
      const visibilityValidation = validatePersistentVisibilityChangeRequests(changeRequests, {
        scope: SCOPE,
        registry,
        capabilities,
      });
      if (!visibilityValidation.ok) {
        return {
          ok: false,
          blocked: true,
          reason: "INVALID_CHANGE_REQUEST",
          persistenceDisabled: false,
          visibilityPersistenceDisabled: hasVisibilityChangeRequest(changeRequests),
          canPersistVisibility: true,
          dryRunOnly: false,
          validation: visibilityValidation,
          changeRequests: cloneArray(changeRequests),
        };
      }

      const persistentVisibilityEntries = visibilityValidation.entries || [];
      if (persistentVisibilityEntries.length > 0) {
        const blockedEntry = persistentVisibilityEntries.find((entry) => entry.persistable !== true);
        if (blockedEntry) {
          return {
            ok: false,
            blocked: true,
            reason: blockedEntry.reason || "PERSISTENCE_DISABLED",
            persistenceDisabled: visibilityValidation.persistenceDisabled,
            visibilityPersistenceDisabled: visibilityValidation.persistenceDisabled,
            canPersistVisibility: visibilityValidation.canPersistVisibility,
            dryRunOnly: visibilityValidation.dryRunOnly,
            validation: visibilityValidation,
            changeRequests: cloneArray(changeRequests),
          };
        }

        if (!storageApi || typeof storageApi.save !== "function") {
          return {
            ok: false,
            blocked: true,
            reason: "STORAGE_UNAVAILABLE",
            persistenceDisabled: false,
            visibilityPersistenceDisabled: false,
            canPersistVisibility: true,
            dryRunOnly: false,
            validation: visibilityValidation,
            changeRequests: cloneArray(changeRequests),
          };
        }

        const saved = [];
        for (const entry of persistentVisibilityEntries) {
          const result = await storageApi.save(entry.override);
          if (!result?.ok) {
            return {
              ok: false,
              blocked: true,
              reason: "PERSISTENCE_WRITE_FAILED",
              error: result?.error || "",
              persistenceDisabled: false,
              visibilityPersistenceDisabled: false,
              canPersistVisibility: true,
              dryRunOnly: false,
              validation: visibilityValidation,
              saved,
              changeRequests: cloneArray(changeRequests),
            };
          }
          saved.push(cloneEntry(result.data || entry.override));
        }
        updateLayoutStateFromRecords([
          ...layoutState.filter((entry) => !saved.some((savedEntry) => savedEntry.elementId === entry.elementId)),
          ...saved,
        ]);
        return {
          ok: true,
          accepted: true,
          persisted: true,
          reason: "PERSISTED",
          count: saved.length,
          saved,
          layoutState: cloneArray(layoutState),
          validation: visibilityValidation,
          changeRequests: cloneArray(changeRequests),
        };
      }

      const visibilityDryRun = validatePersistentVisibilityChangeRequestsDryRun(changeRequests, {
        scope: SCOPE,
        registry,
        capabilities: normalizeHostCapabilities(capabilities),
      });
      return {
        ok: false,
        blocked: true,
        reason: "PERSISTENCE_DISABLED",
        persistenceDisabled: true,
        visibilityPersistenceDisabled: hasVisibilityChangeRequest(changeRequests),
        canPersistVisibility: false,
        dryRunOnly: true,
        validation: visibilityDryRun,
        changeRequests: cloneArray(changeRequests),
      };
    },

    async submitChangeRequest(changeRequest) {
      if (changeRequest?.operation === "visibility" && changeRequest?.persistent === true) {
        return this.submitChangeRequests([changeRequest]);
      }

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
        reason: "PERSISTENCE_DISABLED",
        persistenceDisabled: true,
        dryRunOnly: true,
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
