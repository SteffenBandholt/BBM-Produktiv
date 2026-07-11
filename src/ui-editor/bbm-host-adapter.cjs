"use strict";

const { getBbmUiEditorManifest, BBM_UI_SCOPE, BBM_LAYOUT_SCOPE, BBM_LAYOUT_PROFILE_ID } = require("./bbm-ui-editor-manifest.cjs");
const { getBbmUiElementRegistry, findBbmUiElement } = require("./bbm-ui-element-registry.cjs");

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === "object") {
    const clone = {};
    Object.keys(value).forEach((key) => {
      clone[key] = cloneValue(value[key]);
    });
    return clone;
  }
  return value;
}

function createMemoryLayoutStateStore(initialState = []) {
  const entries = new Map();
  const layoutStates = new Map();
  for (const entry of initialState) {
    if (entry?.elementId) entries.set(entry.elementId, { ...entry, layoutValue: { ...(entry.layoutValue || {}) } });
  }

  function selectorKey({ targetAppId = "bbm-produktiv", uiScope = BBM_UI_SCOPE, layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
    return [targetAppId, uiScope, layoutScope, layoutProfileId].join("::");
  }

  function cloneEntries({ layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
    return [...entries.values()]
      .filter((entry) => entry.layoutScope === layoutScope && entry.layoutProfileId === layoutProfileId)
      .map((entry) => ({ ...entry, layoutValue: { ...entry.layoutValue } }));
  }

  return {
    kind: "memory",
    available: true,
    load({ layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
      return cloneEntries({ layoutScope, layoutProfileId });
    },
    save(entry) {
      entries.set(entry.elementId, { ...entry, layoutValue: { ...(entry.layoutValue || {}) } });
      return { ok: true };
    },
    reset({ elementId } = {}) {
      if (elementId) entries.delete(elementId);
      else entries.clear();
      return { ok: true };
    },
    saveLayoutState(layoutState) {
      const state = cloneValue(layoutState || {});
      layoutStates.set(selectorKey(state), state);
      return { ok: true, status: "layout_state_saved", layoutState: cloneValue(state) };
    },
    loadLayoutState(selector) {
      const key = selectorKey(selector || {});
      if (!layoutStates.has(key)) {
        return { ok: false, status: "layout_profile_not_found", errors: [{ code: "layout_profile_not_found", message: "Layout-Profil wurde nicht gefunden." }] };
      }
      return { ok: true, status: "layout_state_loaded", layoutState: cloneValue(layoutStates.get(key)) };
    },
    resetLayoutState(selector) {
      const key = selectorKey(selector || {});
      if (!layoutStates.has(key)) {
        return { ok: false, status: "layout_profile_not_found", errors: [{ code: "layout_profile_not_found", message: "Layout-Profil wurde nicht gefunden." }] };
      }
      layoutStates.delete(key);
      return { ok: true, status: "layout_state_reset", reset: "removed" };
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
    adapterManifest: manifest,
    layoutStore,
    getAdapterManifest() {
      return getBbmUiEditorManifest();
    },
    getRegistry(uiScope = BBM_UI_SCOPE) {
      const scope = assertScope(uiScope);
      if (!scope.ok) return { ...scope, elements: [], listElements: () => [], getElementById: () => null, size: () => 0 };
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
    submitChangeRequest(changeRequest) {
      return {
        ok: true,
        accepted: true,
        executed: false,
        changeRequest: cloneValue(changeRequest || {}),
        message: "M52 accepts only neutral technical UI-Editor requests; no BBM Fachaktion is executed.",
      };
    },
  };
}

module.exports = { createBbmHostAdapter, createMemoryLayoutStateStore };
