import { BBM_EDITOR_CATALOG, findEditorScope, listEditorModules, listEditorScopes } from "../catalog/bbmEditorCatalog.js";
import { createBbmEditorHostAdapter } from "../host/bbmEditorHostAdapterFactory.js";
import { validateEditorRegistry } from "../registry/editorRegistryValidator.js";
import {
  applyEditorLayoutChange,
  createEditorLayoutControlPanel,
  loadEditorLayoutState,
  resetEditorLayoutState,
} from "./editorLayoutControls.js";
import { buildEditorRegistryTree } from "./editorRegistryTree.js";

function normalizeId(value) {
  return String(value ?? "").trim();
}

function findCatalogScope(catalog, scopeId) {
  const needle = normalizeId(scopeId);
  if (!needle || !catalog || !Array.isArray(catalog.modules)) return null;
  for (const module of catalog.modules) {
    for (const scope of module.scopes || []) {
      if (normalizeId(scope.scopeId) === needle) {
        return {
          ...scope,
          targetAppId: catalog.targetAppId || "bbm",
          moduleId: module.moduleId,
          moduleLabel: module.moduleLabel,
        };
      }
    }
  }
  return null;
}

export function createEditorScopeInspector({
  catalog = BBM_EDITOR_CATALOG,
  hostAdapterFactory = createBbmEditorHostAdapter,
} = {}) {
  const hostAdapters = new Map();

  function getHostAdapter(scopeId) {
    const normalizedScopeId = normalizeId(scopeId);
    if (!hostAdapters.has(normalizedScopeId)) {
      hostAdapters.set(normalizedScopeId, hostAdapterFactory(normalizedScopeId));
    }
    return hostAdapters.get(normalizedScopeId);
  }

  function getAvailableModules() {
    return Array.isArray(catalog?.modules)
      ? catalog.modules.map((module) => ({
          moduleId: module.moduleId,
          moduleLabel: module.moduleLabel,
          scopeCount: Array.isArray(module.scopes) ? module.scopes.length : 0,
        }))
      : [];
  }

  function getAvailableScopes() {
    return Array.isArray(catalog?.modules)
      ? catalog.modules.flatMap((module) =>
          (module.scopes || []).map((scope) => ({
            ...scope,
            moduleId: module.moduleId,
            moduleLabel: module.moduleLabel,
          }))
        )
      : [];
  }

  function inspectScope(scopeId) {
    const scope = findCatalogScope(catalog, scopeId);
    const errors = [];
    const warnings = [];

    if (!scope) {
      return {
        ok: false,
        scope: null,
        registry: [],
        registryValidation: { ok: false, errors: [{ code: "SCOPE_UNKNOWN", message: `unknown scope: ${normalizeId(scopeId) || "<empty>"}` }], warnings: [] },
        treeResult: { ok: false, tree: null, errors: [{ code: "SCOPE_UNKNOWN", message: `unknown scope: ${normalizeId(scopeId) || "<empty>"}` }], warnings: [] },
        layoutState: [],
        errors: [{ code: "SCOPE_UNKNOWN", message: `unknown scope: ${normalizeId(scopeId) || "<empty>"}` }],
        warnings: [],
      };
    }

    let hostAdapter;
    try {
      hostAdapter = getHostAdapter(scope.scopeId);
    } catch (error) {
      const errorEntry = {
        code: error?.code || "HOST_ADAPTER_ERROR",
        message: error?.message || "failed to create host adapter",
      };
      return {
        ok: false,
        scope,
        registry: [],
        registryValidation: { ok: false, errors: [errorEntry], warnings: [] },
        treeResult: { ok: false, tree: null, errors: [errorEntry], warnings: [] },
        layoutState: [],
        errors: [errorEntry],
        warnings: [],
      };
    }

    const registry = typeof hostAdapter.getRegistry === "function" ? hostAdapter.getRegistry() : [];
    const layoutState = typeof hostAdapter.getCurrentLayoutState === "function" ? hostAdapter.getCurrentLayoutState() : [];
    const registryValidation = validateEditorRegistry(registry);
    const treeResult = buildEditorRegistryTree(registry);

    errors.push(...(registryValidation.errors || []), ...(treeResult.errors || []));
    warnings.push(...(registryValidation.warnings || []), ...(treeResult.warnings || []));

    return {
      ok: errors.length === 0,
      scope,
      registry,
      registryValidation,
      treeResult,
      layoutState,
      errors,
      warnings,
    };
  }

  function prepareScopeContext(scopeId) {
    const inspection = inspectScope(scopeId);
    if (!inspection.ok) {
      return {
        ok: false,
        inspection,
        scope: inspection.scope,
        registry: inspection.registry,
        hostAdapter: null,
      };
    }

    return {
      ok: true,
      inspection,
      scope: inspection.scope,
      registry: inspection.registry,
      hostAdapter: getHostAdapter(inspection.scope.scopeId),
    };
  }

  function getLayoutControlPanel(scopeId, elementId) {
    const context = prepareScopeContext(scopeId);
    if (!context.ok) {
      return {
        ok: false,
        scope: context.scope,
        elementId: normalizeId(elementId),
        selectedElement: null,
        currentLayoutEntry: null,
        controls: [],
        status: {
          kind: "blocked",
          message: "Scope kann nicht bedient werden.",
          reason: context.inspection.errors?.[0]?.code || "SCOPE_UNAVAILABLE",
        },
        errors: context.inspection.errors || [],
        warnings: context.inspection.warnings || [],
      };
    }

    return createEditorLayoutControlPanel({
      scope: context.scope,
      registry: context.registry,
      hostAdapter: context.hostAdapter,
      elementId,
    });
  }

  function applyLayoutChange(scopeId, { elementId, operation, payload } = {}) {
    const context = prepareScopeContext(scopeId);
    if (!context.ok) {
      return {
        ok: false,
        blocked: true,
        reason: context.inspection.errors?.[0]?.code || "SCOPE_UNAVAILABLE",
        status: {
          kind: "blocked",
          message: "Aenderung wurde blockiert: Scope ist nicht verfuegbar.",
        },
        errors: context.inspection.errors || [],
        warnings: context.inspection.warnings || [],
      };
    }

    return applyEditorLayoutChange({
      scope: context.scope,
      registry: context.registry,
      hostAdapter: context.hostAdapter,
      elementId,
      operation,
      payload,
    });
  }

  function loadLayoutState(scopeId, { elementId = null } = {}) {
    const context = prepareScopeContext(scopeId);
    if (!context.ok) {
      return {
        ok: false,
        blocked: true,
        reason: context.inspection.errors?.[0]?.code || "SCOPE_UNAVAILABLE",
        status: {
          kind: "blocked",
          message: "Gespeicherter Zustand wurde nicht geladen: Scope ist nicht verfuegbar.",
        },
        layoutState: [],
        currentLayoutEntry: null,
        errors: context.inspection.errors || [],
        warnings: context.inspection.warnings || [],
      };
    }

    return loadEditorLayoutState({
      registry: context.registry,
      hostAdapter: context.hostAdapter,
      elementId,
    });
  }

  function resetLayoutState(scopeId, { elementId = null } = {}) {
    const context = prepareScopeContext(scopeId);
    if (!context.ok) {
      return {
        ok: false,
        blocked: true,
        reason: context.inspection.errors?.[0]?.code || "SCOPE_UNAVAILABLE",
        status: {
          kind: "blocked",
          message: "Reset wurde blockiert: Scope ist nicht verfuegbar.",
        },
        layoutState: [],
        errors: context.inspection.errors || [],
        warnings: context.inspection.warnings || [],
      };
    }

    return resetEditorLayoutState({
      registry: context.registry,
      hostAdapter: context.hostAdapter,
      elementId,
    });
  }

  return {
    getAvailableModules,
    getAvailableScopes,
    inspectScope,
    getLayoutControlPanel,
    applyLayoutChange,
    loadLayoutState,
    resetLayoutState,
    __getHostAdapter: getHostAdapter,
  };
}

export { findEditorScope, listEditorModules, listEditorScopes };
