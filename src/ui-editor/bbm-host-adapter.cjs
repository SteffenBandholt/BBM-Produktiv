"use strict";

const { getBbmUiEditorManifest, BBM_UI_SCOPE, BBM_LAYOUT_SCOPE, BBM_LAYOUT_PROFILE_ID } = require("./bbm-ui-editor-manifest.cjs");
const { getBbmUiElementRegistry, findBbmUiElement } = require("./bbm-ui-element-registry.cjs");

function createMemoryLayoutStateStore(initialState = []) {
  const entries = new Map();
  for (const entry of initialState) {
    if (entry?.elementId) entries.set(entry.elementId, { ...entry });
  }
  return {
    kind: "memory",
    available: true,
    load({ layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
      return [...entries.values()]
        .filter((entry) => entry.layoutScope === layoutScope && entry.layoutProfileId === layoutProfileId)
        .map((entry) => ({ ...entry, layoutValue: { ...entry.layoutValue } }));
    },
    save(entry) {
      entries.set(entry.elementId, { ...entry, layoutValue: { ...entry.layoutValue } });
      return { ok: true };
    },
    reset({ elementId } = {}) {
      if (elementId) entries.delete(elementId);
      else entries.clear();
      return { ok: true };
    },
  };
}

function block(blockCode, message, extra = {}) {
  return { ok: false, blockCode, message, ...extra };
}

function createBbmHostAdapter(options = {}) {
  const manifest = getBbmUiEditorManifest();
  const layoutStore = options.layoutStore || createMemoryLayoutStateStore();
  let selectedElementId = null;

  function assertScope(uiScope = BBM_UI_SCOPE) {
    if (!manifest.uiScopes.includes(uiScope)) {
      return block("BBM_UI_SCOPE_UNKNOWN", `Unknown UI scope: ${String(uiScope)}`);
    }
    return { ok: true };
  }

  return {
    manifest,
    layoutStore,
    getRegistry(uiScope = BBM_UI_SCOPE) {
      const scope = assertScope(uiScope);
      if (!scope.ok) return { ...scope, elements: [] };
      return getBbmUiElementRegistry(uiScope);
    },
    validateScope(uiScope = BBM_UI_SCOPE, layoutScope = BBM_LAYOUT_SCOPE) {
      const scope = assertScope(uiScope);
      if (!scope.ok) return scope;
      if (!manifest.layoutScopes.includes(layoutScope)) {
        return block("BBM_LAYOUT_SCOPE_UNKNOWN", `Unknown layout scope: ${String(layoutScope)}`);
      }
      return { ok: true, uiScope, layoutScope, layoutProfileId: BBM_LAYOUT_PROFILE_ID };
    },
    selectElement(elementId, uiScope = BBM_UI_SCOPE) {
      const scope = assertScope(uiScope);
      if (!scope.ok) return scope;
      const element = findBbmUiElement(elementId, uiScope);
      if (!element) return block("BBM_UI_ELEMENT_UNKNOWN", `Unknown UI element: ${String(elementId)}`);
      selectedElementId = element.elementId;
      return { ok: true, selectedElement: element };
    },
    getCurrentUiState(uiScope = BBM_UI_SCOPE) {
      const registry = this.getRegistry(uiScope);
      if (!registry.ok) return registry;
      return { ok: true, uiScope, selectedElementId, registeredElementCount: registry.elements.length };
    },
    getCurrentLayoutState({ layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
      if (!manifest.layoutScopes.includes(layoutScope)) return block("BBM_LAYOUT_SCOPE_UNKNOWN", `Unknown layout scope: ${String(layoutScope)}`);
      return { ok: true, layoutScope, layoutProfileId, entries: layoutStore.load({ layoutScope, layoutProfileId }) };
    },
    saveLayoutState({ elementId, layoutValue = {}, layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
      const element = findBbmUiElement(elementId);
      if (!element) return block("BBM_UI_ELEMENT_UNKNOWN", `Unknown UI element: ${String(elementId)}`);
      if (!manifest.layoutScopes.includes(layoutScope)) return block("BBM_LAYOUT_SCOPE_UNKNOWN", `Unknown layout scope: ${String(layoutScope)}`);
      layoutStore.save({ elementId, layoutScope, layoutProfileId, layoutValue, savedAt: "runtime" });
      return { ok: true, elementId, layoutScope, layoutProfileId };
    },
    resetLayoutState({ elementId, layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
      if (elementId && !findBbmUiElement(elementId)) return block("BBM_UI_ELEMENT_UNKNOWN", `Unknown UI element: ${String(elementId)}`);
      if (!manifest.layoutScopes.includes(layoutScope)) return block("BBM_LAYOUT_SCOPE_UNKNOWN", `Unknown layout scope: ${String(layoutScope)}`);
      layoutStore.reset({ elementId, layoutScope, layoutProfileId });
      return { ok: true, elementId: elementId || null, layoutScope, layoutProfileId };
    },
  };
}

module.exports = { createBbmHostAdapter, createMemoryLayoutStateStore };
