import { getRestarbeitenMainUiRegistry } from "./restarbeitenEditorScopes.js";
import { validateEditorChangeRequest } from "../../../editorRuntime/changeRequests/editorChangeRequestValidator.js";
import {
  normalizeHostCapabilities,
  normalizeHostContext,
  validatePersistentVisibilityChangeRequestsDryRun,
  validateHostAdapterShape,
} from "../../../editorRuntime/host/bbmEditorHostAdapterContract.js";

const SCOPE = Object.freeze({
  targetAppId: "bbm",
  moduleId: "restarbeiten",
  scopeId: "restarbeiten.ui.main",
});

function hasVisibilityChangeRequest(changeRequests = []) {
  return Array.isArray(changeRequests)
    && changeRequests.some((entry) => entry?.operation === "visibility");
}

export function createRestarbeitenMainUiHostAdapter() {
  const registry = getRestarbeitenMainUiRegistry();
  const pendingChangeRequests = [];

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
      return [];
    },

    getCapabilities() {
      return normalizeHostCapabilities({
        selection: true,
        preview: true,
        pendingChangeRequests: true,
      });
    },

    onPendingChangeRequestsChanged(changeRequests = []) {
      const nextRequests = Array.isArray(changeRequests) ? changeRequests.map((entry) => ({ ...entry })) : [];
      pendingChangeRequests.splice(0, pendingChangeRequests.length, ...nextRequests);
      return {
        ok: true,
        persistent: false,
        count: pendingChangeRequests.length,
      };
    },

    submitChangeRequests(changeRequests = []) {
      const capabilities = this.getCapabilities();
      const visibilityDryRun = validatePersistentVisibilityChangeRequestsDryRun(changeRequests, {
        scope: SCOPE,
        registry,
        capabilities,
      });
      if (!visibilityDryRun.ok) {
        return {
          ok: false,
          blocked: true,
          reason: "INVALID_CHANGE_REQUEST",
          persistenceDisabled: true,
          visibilityPersistenceDisabled: hasVisibilityChangeRequest(changeRequests),
          canPersistVisibility: false,
          dryRunOnly: true,
          validation: visibilityDryRun,
          changeRequests: Array.isArray(changeRequests) ? changeRequests.map((entry) => ({ ...entry })) : [],
        };
      }
      return {
        ok: false,
        blocked: true,
        reason: "PERSISTENCE_DISABLED",
        persistenceDisabled: true,
        visibilityPersistenceDisabled: hasVisibilityChangeRequest(changeRequests),
        canPersistVisibility: false,
        dryRunOnly: true,
        validation: visibilityDryRun,
        changeRequests: Array.isArray(changeRequests) ? changeRequests.map((entry) => ({ ...entry })) : [],
      };
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
