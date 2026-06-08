import { BBM_EDITOR_CATALOG, findEditorScope, listEditorModules, listEditorScopes } from "../catalog/bbmEditorCatalog.js";
import { createBbmEditorHostAdapter } from "../host/bbmEditorHostAdapterFactory.js";
import { validateEditorRegistry } from "../registry/editorRegistryValidator.js";
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
      hostAdapter = hostAdapterFactory(scope.scopeId);
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

  return {
    getAvailableModules,
    getAvailableScopes,
    inspectScope,
  };
}

export { findEditorScope, listEditorModules, listEditorScopes };
