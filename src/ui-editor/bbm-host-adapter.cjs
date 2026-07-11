"use strict";

const uiEditorKit = require("ui-editor-kit");
const { getBbmUiEditorManifest, BBM_UI_SCOPE, BBM_LAYOUT_SCOPE, BBM_LAYOUT_PROFILE_ID } = require("./bbm-ui-editor-manifest.cjs");
const { getBbmUiElementRegistry, findBbmUiElement } = require("./bbm-ui-element-registry.cjs");

const M53_CHANGE_OPERATION = "visibility.set";
const M53_ALLOWED_ELEMENTS = Object.freeze(["bbm.main.header", "bbm.main.actions"]);
const M53_LOCKED_REASONS = Object.freeze({
  "bbm.main.shell": "Der Hauptrahmen darf in M53 nicht ausgeblendet werden.",
  "bbm.main.navigation": "Die Navigation bleibt gesperrt, damit ein Rueckweg erhalten bleibt.",
  "bbm.main.content": "Der Inhaltsbereich bleibt gesperrt, damit das Statuspanel bedienbar bleibt.",
});
const M53_ALLOWED_CHANGE_FIELDS = Object.freeze([
  "elementId",
  "uiScope",
  "layoutScope",
  "layoutProfileId",
  "operation",
  "property",
  "value",
]);
const M53_FORBIDDEN_PROPERTIES = Object.freeze([
  "x",
  "y",
  "width",
  "height",
  "margin",
  "padding",
  "color",
  "background",
  "font",
  "fontSize",
  "className",
  "style",
  "text",
  "html",
  "children",
  "parentId",
  "type",
]);

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
  const entryStore = new Map();
  const publicStore = uiEditorKit.createMemoryLayoutStateStore({ allowedPayloadFields: ["visible"] });
  for (const entry of initialState) {
    if (entry?.elementId) entryStore.set(entry.elementId, { ...entry, layoutValue: { ...(entry.layoutValue || {}) } });
  }

  function cloneEntries({ layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
    return [...entryStore.values()]
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
      entryStore.set(entry.elementId, { ...entry, layoutValue: { ...(entry.layoutValue || {}) } });
      return { ok: true };
    },
    reset({ elementId } = {}) {
      if (elementId) entryStore.delete(elementId);
      else entryStore.clear();
      return { ok: true };
    },
    saveLayoutState(layoutState) {
      return publicStore.saveLayoutState(layoutState);
    },
    loadLayoutState(selector) {
      return publicStore.loadLayoutState(selector);
    },
    resetLayoutState(selector) {
      return publicStore.resetLayoutState(selector);
    },
    listLayoutProfiles(selector) {
      return publicStore.listLayoutProfiles(selector);
    },
  };
}

function block(blockCode, message, extra = {}) {
  return { ok: false, blockCode, message, ...extra };
}

function createLayoutSelector() {
  return {
    targetAppId: "bbm-produktiv",
    uiScope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
  };
}

function createDefaultLayoutState(elementsMap = {}, version = 1) {
  return uiEditorKit.createLayoutState({
    schemaVersion: 1,
    ...createLayoutSelector(),
    version,
    source: "saved",
    elements: elementsMap,
  });
}

function normalizeChangeRequest(input = {}) {
  const payload = input && typeof input === "object" ? input : {};
  return {
    elementId: String(payload.elementId || "").trim(),
    uiScope: String(payload.uiScope || BBM_UI_SCOPE).trim(),
    layoutScope: String(payload.layoutScope || BBM_LAYOUT_SCOPE).trim(),
    layoutProfileId: String(payload.layoutProfileId || BBM_LAYOUT_PROFILE_ID).trim(),
    operation: String(payload.operation || M53_CHANGE_OPERATION).trim(),
    property: String(payload.property || "visible").trim(),
    value: payload.value,
  };
}

function validateM53ChangeRequest(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return block("BBM_UI_CHANGE_DRAFT_INVALID", "ChangeRequest muss ein Objekt sein.");
  const unknownField = Object.keys(input).find((field) => !M53_ALLOWED_CHANGE_FIELDS.includes(field));
  if (unknownField) return block("BBM_UI_CHANGE_UNSUPPORTED_PROPERTY", "Diese Aenderung ist in M53 nicht erlaubt.", { field: unknownField });
  const request = normalizeChangeRequest(input);
  if (!request.elementId) return block("BBM_UI_CHANGE_NO_SELECTION", "Kein registriertes Element ausgewaehlt.");
  if (request.uiScope !== BBM_UI_SCOPE) return block("BBM_UI_CHANGE_SCOPE_MISMATCH", "Dieser UI-Scope ist in M53 nicht erlaubt.");
  if (request.layoutScope !== BBM_LAYOUT_SCOPE) return block("BBM_UI_CHANGE_SCOPE_MISMATCH", "Dieser Layout-Scope ist in M53 nicht erlaubt.");
  if (request.layoutProfileId !== BBM_LAYOUT_PROFILE_ID) return block("BBM_UI_CHANGE_PROFILE_MISMATCH", "Dieses Layoutprofil ist in M53 nicht erlaubt.");
  const element = findBbmUiElement(request.elementId, request.uiScope);
  if (!element) return block("BBM_UI_ELEMENT_UNKNOWN", "Das UI-Element ist nicht registriert.");
  if (request.operation !== M53_CHANGE_OPERATION || request.property !== "visible") {
    return block("BBM_UI_CHANGE_UNSUPPORTED_PROPERTY", "M53 erlaubt ausschliesslich visible true/false.");
  }
  if (M53_FORBIDDEN_PROPERTIES.includes(request.property)) return block("BBM_UI_CHANGE_UNSUPPORTED_PROPERTY", "Diese Eigenschaft ist in M53 gesperrt.");
  if (typeof request.value !== "boolean") return block("BBM_UI_CHANGE_INVALID_VALUE", "visible muss ein Boolean sein.");
  if (!M53_ALLOWED_ELEMENTS.includes(request.elementId)) {
    return block("BBM_UI_CHANGE_ELEMENT_LOCKED", M53_LOCKED_REASONS[request.elementId] || "Dieses Element ist in M53 fuer Layoutaenderungen gesperrt.", { element });
  }
  return { ok: true, request, element };
}

function createBbmHostAdapter(options = {}) {
  const manifest = getBbmUiEditorManifest();
  const layoutStore = options.layoutStore || createMemoryLayoutStateStore();
  let selectedElementId = null;
  let layoutVersion = 1;

  function assertScope(uiScope = BBM_UI_SCOPE) {
    if (!manifest.uiScopes.includes(uiScope)) return block("BBM_UI_SCOPE_UNKNOWN", `Unknown UI scope: ${String(uiScope)}`);
    return { ok: true };
  }

  function loadPublicLayoutState() {
    return layoutStore.loadLayoutState(createLayoutSelector());
  }

  function getVisible(elementId) {
    const loaded = loadPublicLayoutState();
    const value = loaded?.ok ? loaded.layoutState?.elements?.[elementId]?.visible : undefined;
    if (typeof value === "boolean") return value;
    const element = findBbmUiElement(elementId);
    return element?.layoutDefaults?.visible !== false;
  }

  function saveVisible(elementId, visible) {
    const existing = loadPublicLayoutState();
    const elements = existing?.ok && existing.layoutState?.elements ? cloneValue(existing.layoutState.elements) : {};
    elements[elementId] = { visible };
    const state = createDefaultLayoutState(elements, ++layoutVersion);
    const validation = uiEditorKit.validateLayoutState(state, { allowedPayloadFields: ["visible"] });
    if (!validation.ok) return block("BBM_UI_CHANGE_DRAFT_INVALID", "LayoutState wurde vom UI-Editor-kit abgelehnt.", { validation });
    const saved = layoutStore.saveLayoutState(state);
    if (!saved?.ok) return block("BBM_UI_CHANGE_APPLY_FAILED", "Layoutzustand konnte nicht gespeichert werden.", { validation: saved });
    layoutStore.save({ elementId, layoutScope: BBM_LAYOUT_SCOPE, layoutProfileId: BBM_LAYOUT_PROFILE_ID, layoutValue: { visible }, savedAt: "runtime" });
    return { ok: true, layoutState: saved.layoutState, elementState: saved.layoutState.elements[elementId] };
  }

  return {
    manifest,
    adapterManifest: manifest,
    layoutStore,
    getAdapterManifest() { return getBbmUiEditorManifest(); },
    getRegistry(uiScope = BBM_UI_SCOPE) {
      const scope = assertScope(uiScope);
      if (!scope.ok) return { ...scope, elements: [], listElements: () => [], getElementById: () => null, size: () => 0 };
      return getBbmUiElementRegistry(uiScope);
    },
    validateScope(uiScope = BBM_UI_SCOPE, layoutScope = BBM_LAYOUT_SCOPE) {
      const scope = assertScope(uiScope);
      if (!scope.ok) return scope;
      if (!manifest.layoutScopes.includes(layoutScope)) return block("BBM_LAYOUT_SCOPE_UNKNOWN", `Unknown layout scope: ${String(layoutScope)}`);
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
    getElementLayoutState({ elementId, layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
      const element = findBbmUiElement(elementId);
      if (!element) return block("BBM_UI_ELEMENT_UNKNOWN", "Das UI-Element ist nicht registriert.");
      if (layoutScope !== BBM_LAYOUT_SCOPE) return block("BBM_UI_CHANGE_SCOPE_MISMATCH", "Dieser Layout-Scope ist in M53 nicht erlaubt.");
      if (layoutProfileId !== BBM_LAYOUT_PROFILE_ID) return block("BBM_UI_CHANGE_PROFILE_MISMATCH", "Dieses Layoutprofil ist in M53 nicht erlaubt.");
      return { ok: true, elementId, layoutScope, layoutProfileId, visible: getVisible(elementId), defaultVisible: element.layoutDefaults?.visible !== false, storage: "session-memory" };
    },
    saveLayoutState({ elementId, layoutValue = {}, layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
      const element = findBbmUiElement(elementId);
      if (!element) return block("BBM_UI_ELEMENT_UNKNOWN", `Unknown UI element: ${String(elementId)}`);
      if (layoutScope !== BBM_LAYOUT_SCOPE) return block("BBM_UI_CHANGE_SCOPE_MISMATCH", "Dieser Layout-Scope ist in M53 nicht erlaubt.");
      if (layoutProfileId !== BBM_LAYOUT_PROFILE_ID) return block("BBM_UI_CHANGE_PROFILE_MISMATCH", "Dieses Layoutprofil ist in M53 nicht erlaubt.");
      const keys = Object.keys(layoutValue || {});
      if (keys.length !== 1 || keys[0] !== "visible") return block("BBM_UI_CHANGE_UNSUPPORTED_PROPERTY", "M53 erlaubt ausschliesslich visible.");
      if (typeof layoutValue.visible !== "boolean") return block("BBM_UI_CHANGE_INVALID_VALUE", "visible muss ein Boolean sein.");
      return saveVisible(elementId, layoutValue.visible);
    },
    resetLayoutState({ elementId, layoutScope = BBM_LAYOUT_SCOPE, layoutProfileId = BBM_LAYOUT_PROFILE_ID } = {}) {
      const element = findBbmUiElement(elementId);
      if (!element) return block("BBM_UI_ELEMENT_UNKNOWN", "Das UI-Element ist nicht registriert.");
      if (layoutScope !== BBM_LAYOUT_SCOPE) return block("BBM_UI_CHANGE_SCOPE_MISMATCH", "Dieser Layout-Scope ist in M53 nicht erlaubt.");
      if (layoutProfileId !== BBM_LAYOUT_PROFILE_ID) return block("BBM_UI_CHANGE_PROFILE_MISMATCH", "Dieses Layoutprofil ist in M53 nicht erlaubt.");
      const existing = loadPublicLayoutState();
      const elements = existing?.ok && existing.layoutState?.elements ? cloneValue(existing.layoutState.elements) : {};
      delete elements[elementId];
      layoutStore.reset({ elementId, layoutScope, layoutProfileId });
      if (Object.keys(elements).length === 0) {
        const reset = layoutStore.resetLayoutState(createLayoutSelector());
        if (!reset?.ok && reset?.status !== "layout_profile_not_found") return block("BBM_UI_CHANGE_APPLY_FAILED", "Layoutzustand konnte nicht zurueckgesetzt werden.");
      } else {
        const saved = layoutStore.saveLayoutState(createDefaultLayoutState(elements, ++layoutVersion));
        if (!saved?.ok) return block("BBM_UI_CHANGE_APPLY_FAILED", "Layoutzustand konnte nicht zurueckgesetzt werden.");
      }
      return { ok: true, elementId, layoutScope, layoutProfileId, visible: element.layoutDefaults?.visible !== false, defaultVisible: element.layoutDefaults?.visible !== false, storage: "session-memory" };
    },
    validateChangeRequest: validateM53ChangeRequest,
    submitChangeRequest(changeRequest) {
      const validation = validateM53ChangeRequest(changeRequest);
      if (!validation.ok) return validation;
      const saved = saveVisible(validation.request.elementId, validation.request.value);
      if (!saved.ok) return saved;
      return { ok: true, accepted: true, executed: true, elementId: validation.request.elementId, visible: validation.request.value, layoutProfileId: BBM_LAYOUT_PROFILE_ID, storage: "session-memory", layoutState: saved.layoutState };
    },
  };
}

module.exports = { createBbmHostAdapter, createMemoryLayoutStateStore, validateM53ChangeRequest, createDefaultLayoutState, M53_CHANGE_OPERATION, M53_ALLOWED_ELEMENTS };
