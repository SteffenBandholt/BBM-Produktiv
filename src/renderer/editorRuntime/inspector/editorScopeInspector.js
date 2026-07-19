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

function cloneLayoutEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  return { ...entry, layoutValue: structuredClone(entry.layoutValue || {}) };
}


function normalizeLayoutValue(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    x: input.x ?? 0,
    y: input.y ?? 0,
    width: input.width ?? null,
    height: input.height ?? null,
    visible: input.visible ?? null,
  };
}

function sameLayoutValue(left, right) {
  return JSON.stringify(normalizeLayoutValue(left)) === JSON.stringify(normalizeLayoutValue(right));
}

function findLayoutEntry(layoutState, elementId) {
  const needle = normalizeId(elementId);
  if (!needle || !Array.isArray(layoutState)) return null;
  return layoutState.find((entry) => normalizeId(entry?.elementId) === needle) || null;
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
  const layoutSessions = new Map();

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


  function buildLayoutSessionStatus(scopeId, context) {
    const normalizedScopeId = normalizeId(scopeId);
    const session = layoutSessions.get(normalizedScopeId) || null;
    const persistenceStatus = typeof context.hostAdapter?.getPersistenceStatus === "function"
      ? context.hostAdapter.getPersistenceStatus()
      : { persistenceAvailable: false, persistencePersistent: false };
    if (!context.ok) {
      return { ...persistenceStatus, ok: false, active: Boolean(session), changedElementIds: [], changedCount: 0, changedByElementId: {}, errors: context.inspection.errors || [] };
    }
    if (!session) {
      return { ...persistenceStatus, ok: true, active: false, changedElementIds: [], changedCount: 0, changedByElementId: {} };
    }
    const currentLayoutState = typeof context.hostAdapter.getCurrentLayoutState === "function" ? context.hostAdapter.getCurrentLayoutState() : [];
    const changedElementIds = context.registry
      .map((element) => normalizeId(element?.id || element?.elementId))
      .filter(Boolean)
      .filter((elementId) => !sameLayoutValue(
        findLayoutEntry(currentLayoutState, elementId)?.layoutValue || null,
        session.baselineByElementId.get(elementId)?.layoutValue || null
      ));
    return {
      ...persistenceStatus,
      ok: true,
      active: true,
      changedElementIds,
      changedCount: changedElementIds.length,
      changedByElementId: Object.fromEntries(changedElementIds.map((elementId) => [elementId, true])),
    };
  }

  function beginLayoutSession(scopeId) {
    const context = prepareScopeContext(scopeId);
    if (!context.ok) {
      return { ok: false, blocked: true, reason: context.inspection.errors?.[0]?.code || "SCOPE_UNAVAILABLE", status: buildLayoutSessionStatus(scopeId, context) };
    }
    const normalizedScopeId = normalizeId(context.scope.scopeId);
    if (!layoutSessions.has(normalizedScopeId)) {
      const layoutState = typeof context.hostAdapter.getCurrentLayoutState === "function" ? context.hostAdapter.getCurrentLayoutState() : [];
      const byElementId = new Map(layoutState.map((entry) => [normalizeId(entry?.elementId), cloneLayoutEntry(entry)]));
      layoutSessions.set(normalizedScopeId, {
        startedAt: new Date().toISOString(),
        baselineByElementId: new Map(context.registry.map((element) => {
          const elementId = normalizeId(element?.id || element?.elementId);
          return [elementId, byElementId.get(elementId) || null];
        })),
      });
    }
    return { ok: true, blocked: false, reason: null, status: buildLayoutSessionStatus(normalizedScopeId, context) };
  }

  function getLayoutSessionStatus(scopeId) {
    const context = prepareScopeContext(scopeId);
    return buildLayoutSessionStatus(scopeId, context);
  }


  function resetSessionBaseline(scopeId, context) {
    const normalizedScopeId = normalizeId(context.scope.scopeId);
    const layoutState = typeof context.hostAdapter.getCurrentLayoutState === "function" ? context.hostAdapter.getCurrentLayoutState() : [];
    const byElementId = new Map(layoutState.map((entry) => [normalizeId(entry?.elementId), cloneLayoutEntry(entry)]));
    layoutSessions.set(normalizedScopeId, {
      startedAt: new Date().toISOString(),
      baselineByElementId: new Map(context.registry.map((element) => {
        const elementId = normalizeId(element?.id || element?.elementId);
        return [elementId, byElementId.get(elementId) || null];
      })),
    });
    return buildLayoutSessionStatus(normalizedScopeId, context);
  }

  function saveLayoutSession(scopeId) {
    const context = prepareScopeContext(scopeId);
    if (!context.ok) {
      return { ok: false, blocked: true, reason: context.inspection.errors?.[0]?.code || "SCOPE_UNAVAILABLE", status: buildLayoutSessionStatus(scopeId, context) };
    }
    if (typeof context.hostAdapter.saveLayoutSession !== "function") {
      return { ok: false, blocked: true, reason: "HOST_SAVE_LAYOUT_SESSION_MISSING", status: buildLayoutSessionStatus(scopeId, context) };
    }
    const result = context.hostAdapter.saveLayoutSession();
    if (!result?.ok) return { ...result, status: buildLayoutSessionStatus(scopeId, context) };
    return { ...result, status: resetSessionBaseline(scopeId, context) };
  }

  function loadSavedLayout(scopeId) {
    const context = prepareScopeContext(scopeId);
    if (!context.ok) {
      return { ok: false, blocked: true, reason: context.inspection.errors?.[0]?.code || "SCOPE_UNAVAILABLE", status: buildLayoutSessionStatus(scopeId, context) };
    }
    if (typeof context.hostAdapter.loadSavedLayout !== "function") {
      return { ok: false, blocked: true, reason: "HOST_LOAD_SAVED_LAYOUT_MISSING", status: buildLayoutSessionStatus(scopeId, context) };
    }
    const result = context.hostAdapter.loadSavedLayout();
    if (!result?.ok) return { ...result, status: buildLayoutSessionStatus(scopeId, context) };
    if (!result.savedLayoutFound) return { ...result, status: buildLayoutSessionStatus(scopeId, context) };
    return { ...result, status: resetSessionBaseline(scopeId, context) };
  }

  function restoreBaselineForElementIds(scopeId, elementIds) {
    const context = prepareScopeContext(scopeId);
    if (!context.ok) {
      return { ok: false, blocked: true, reason: context.inspection.errors?.[0]?.code || "SCOPE_UNAVAILABLE", status: buildLayoutSessionStatus(scopeId, context) };
    }
    const normalizedScopeId = normalizeId(context.scope.scopeId);
    const session = layoutSessions.get(normalizedScopeId);
    if (!session) return { ok: false, blocked: true, reason: "LAYOUT_SESSION_MISSING", status: buildLayoutSessionStatus(normalizedScopeId, context) };
    const registryIds = new Set(context.registry.map((element) => normalizeId(element?.id || element?.elementId)).filter(Boolean));
    const ids = [...new Set((Array.isArray(elementIds) ? elementIds : []).map(normalizeId).filter(Boolean))].filter((id) => registryIds.has(id));
    if (!ids.length) return { ok: false, blocked: true, reason: "ELEMENT_ID_MISSING", status: buildLayoutSessionStatus(normalizedScopeId, context) };
    if (typeof context.hostAdapter.restoreLayoutState !== "function") {
      return { ok: false, blocked: true, reason: "HOST_RESTORE_LAYOUT_STATE_MISSING", status: buildLayoutSessionStatus(normalizedScopeId, context) };
    }
    const entries = ids.map((id) => session.baselineByElementId.get(id)).filter(Boolean).map(cloneLayoutEntry);
    const result = context.hostAdapter.restoreLayoutState({ entries, elementIds: ids });
    return { ...result, status: buildLayoutSessionStatus(normalizedScopeId, context) };
  }

  function discardLayoutSessionElement(scopeId, elementId) {
    return restoreBaselineForElementIds(scopeId, [elementId]);
  }

  function discardLayoutSession(scopeId) {
    const context = prepareScopeContext(scopeId);
    const status = buildLayoutSessionStatus(scopeId, context);
    if (!status.ok) return { ok: false, blocked: true, reason: status.errors?.[0]?.code || "SCOPE_UNAVAILABLE", status };
    return restoreBaselineForElementIds(scopeId, status.changedElementIds);
  }

  function endLayoutSession(scopeId) {
    layoutSessions.delete(normalizeId(scopeId));
    return { ok: true, blocked: false, reason: null, status: { ok: true, active: false, changedElementIds: [], changedCount: 0, changedByElementId: {} } };
  }

  return {
    getAvailableModules,
    getAvailableScopes,
    inspectScope,
    getLayoutControlPanel,
    applyLayoutChange,
    loadLayoutState,
    resetLayoutState,
    beginLayoutSession,
    getLayoutSessionStatus,
    saveLayoutSession,
    loadSavedLayout,
    discardLayoutSessionElement,
    discardLayoutSession,
    endLayoutSession,
  };
}

export { findEditorScope, listEditorModules, listEditorScopes };
