import {
  buildVisibilityOverrideFromChangeRequest,
  isVisibilityOverridePersistable,
  validateEditorLayoutOverride,
} from "../layout/editorLayoutOverrideModel.js";

export const REQUIRED_HOST_ADAPTER_METHODS = Object.freeze([
  "getHostContext",
  "getRegistry",
  "getCurrentLayoutState",
  "getCapabilities",
  "onPendingChangeRequestsChanged",
  "submitChangeRequests",
]);

export const DEFAULT_HOST_ADAPTER_CAPABILITIES = Object.freeze({
  selection: true,
  preview: true,
  pendingChangeRequests: true,
  persistence: false,
  canPersistVisibility: false,
  dryRunOnly: true,
});

function normalizeId(value) {
  return String(value ?? "").trim();
}

function clonePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const clone = { ...value };
  for (const [key, entry] of Object.entries(clone)) {
    if (Array.isArray(entry)) clone[key] = [...entry];
  }
  return clone;
}

function cloneArray(value) {
  return Array.isArray(value) ? value.map((entry) => clonePlainObject(entry)) : [];
}

export function normalizeHostContext(context = {}) {
  const activeUiScope = normalizeId(context.activeUiScope || context.scopeId);
  return {
    targetAppId: normalizeId(context.targetAppId) || "bbm",
    moduleId: normalizeId(context.moduleId),
    activeUiScope,
    scopeId: normalizeId(context.scopeId) || activeUiScope,
  };
}

export function normalizeHostCapabilities(capabilities = {}) {
  return {
    ...DEFAULT_HOST_ADAPTER_CAPABILITIES,
    ...clonePlainObject(capabilities),
    persistence: false,
    canPersistVisibility: false,
    dryRunOnly: true,
  };
}

function hasVisibilityChangeRequest(changeRequests = []) {
  return Array.isArray(changeRequests)
    && changeRequests.some((entry) => entry?.operation === "visibility");
}

function normalizeRegistryElements(registry) {
  if (Array.isArray(registry)) return registry;
  if (registry && Array.isArray(registry.elements)) return registry.elements;
  return [];
}

export function validatePersistentVisibilityChangeRequestsDryRun(
  changeRequests = [],
  { scope = {}, registry = [], capabilities = {} } = {}
) {
  const result = validatePersistentVisibilityChangeRequests(changeRequests, {
    scope,
    registry,
    capabilities: {
      ...capabilities,
      persistence: false,
      canPersistVisibility: false,
      dryRunOnly: true,
    },
  });
  return {
    ...result,
    dryRunOnly: true,
    persistenceDisabled: true,
    canPersistVisibility: false,
    entries: result.entries.map((entry) => ({
      ...entry,
      persistable: false,
      blocked: true,
      reason: "PERSISTENCE_DISABLED",
    })),
  };
}

export function validatePersistentVisibilityChangeRequests(
  changeRequests = [],
  { scope = {}, registry = [], capabilities = {} } = {}
) {
  const requests = Array.isArray(changeRequests) ? changeRequests : [];
  const persistentVisibilityRequests = requests.filter(
    (entry) => entry?.operation === "visibility" && entry?.persistent === true
  );
  const registryElements = normalizeRegistryElements(registry);
  const allowedScopes = scope?.scopeId ? [scope.scopeId] : null;
  const canPersistVisibility = capabilities.canPersistVisibility === true;
  const dryRunOnly = capabilities.dryRunOnly === true;
  const persistenceDisabled = capabilities.persistence !== true || !canPersistVisibility || dryRunOnly;
  const entries = persistentVisibilityRequests.map((changeRequest) => {
    const override = buildVisibilityOverrideFromChangeRequest(changeRequest);
    const validation = validateEditorLayoutOverride(override, {
      registry: registryElements,
      allowedScopes,
    });
    const persistable = validation.ok && isVisibilityOverridePersistable(changeRequest, capabilities);
    return {
      changeId: changeRequest.changeId,
      elementId: changeRequest.elementId,
      operation: changeRequest.operation,
      persistent: changeRequest.persistent === true,
      override,
      validation,
      persistable,
      blocked: !persistable,
      reason: persistable ? "" : "PERSISTENCE_DISABLED",
    };
  });

  const errors = entries.flatMap((entry) => entry.validation.errors || []);

  return {
    ok: errors.length === 0,
    dryRunOnly,
    persistenceDisabled,
    canPersistVisibility,
    count: entries.length,
    entries,
    errors,
  };
}

export function validateHostAdapterShape(adapter) {
  const errors = [];
  for (const methodName of REQUIRED_HOST_ADAPTER_METHODS) {
    if (!adapter || typeof adapter[methodName] !== "function") {
      errors.push({
        code: "HOST_METHOD_MISSING",
        methodName,
        message: `missing host adapter method: ${methodName}`,
      });
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    warnings: [],
  };
}

export function createInMemoryBbmEditorHostAdapter({
  hostContext = {},
  registry = null,
  registeredElements = null,
  registryResolver = null,
  currentLayoutState = null,
  capabilities = null,
  onPendingChangeRequestsChanged = null,
} = {}) {
  const normalizedContext = normalizeHostContext(hostContext);
  const normalizedCapabilities = normalizeHostCapabilities(capabilities);
  const resolver = typeof registryResolver === "function" ? registryResolver : null;
  const pendingChangeRequests = [];

  function resolveRegistry(scopeId = normalizedContext.scopeId) {
    const normalizedScopeId = normalizeId(scopeId) || normalizedContext.scopeId;
    if (resolver && normalizedScopeId) return resolver(normalizedScopeId);
    if (registry) return registry;
    return {
      targetAppId: normalizedContext.targetAppId,
      moduleId: normalizedContext.moduleId,
      uiScope: normalizedScopeId,
      scopeId: normalizedScopeId,
      elements: Array.isArray(registeredElements) ? registeredElements : [],
    };
  }

  return {
    getHostContext() {
      return { ...normalizedContext };
    },

    getRegistry(scopeId = normalizedContext.scopeId) {
      const resolvedRegistry = resolveRegistry(scopeId);
      if (Array.isArray(resolvedRegistry)) return cloneArray(resolvedRegistry);
      if (!resolvedRegistry || typeof resolvedRegistry !== "object") {
        const normalizedScopeId = normalizeId(scopeId) || normalizedContext.scopeId;
        return {
          targetAppId: normalizedContext.targetAppId,
          moduleId: normalizedContext.moduleId,
          uiScope: normalizedScopeId,
          scopeId: normalizedScopeId,
          elements: [],
          ok: false,
          reason: "HOST_REGISTRY_UNAVAILABLE",
        };
      }
      return {
        ...resolvedRegistry,
        elements: Array.isArray(resolvedRegistry.elements) ? cloneArray(resolvedRegistry.elements) : [],
      };
    },

    getCurrentLayoutState() {
      return cloneArray(currentLayoutState);
    },

    getCapabilities() {
      return { ...normalizedCapabilities };
    },

    onPendingChangeRequestsChanged(changeRequests = []) {
      pendingChangeRequests.splice(0, pendingChangeRequests.length, ...cloneArray(changeRequests));
      if (typeof onPendingChangeRequestsChanged === "function") {
        onPendingChangeRequestsChanged(cloneArray(pendingChangeRequests));
      }
      return {
        ok: true,
        persistent: false,
        count: pendingChangeRequests.length,
      };
    },

    submitChangeRequests(changeRequests = []) {
      const registryForScope = resolveRegistry(normalizedContext.scopeId);
      const visibilityDryRun = validatePersistentVisibilityChangeRequestsDryRun(changeRequests, {
        scope: normalizedContext,
        registry: registryForScope,
        capabilities: normalizedCapabilities,
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
          changeRequests: cloneArray(changeRequests),
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
        changeRequests: cloneArray(changeRequests),
      };
    },

    submitChangeRequest(changeRequest = {}) {
      return this.submitChangeRequests([changeRequest]);
    },
  };
}
