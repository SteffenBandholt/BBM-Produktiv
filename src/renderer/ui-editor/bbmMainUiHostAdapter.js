import { validateEditorChangeRequest } from "../editorRuntime/changeRequests/editorChangeRequestValidator.js";
import { validateHostAdapterShape } from "../editorRuntime/host/bbmEditorHostAdapterContract.js";
import {
  createEditorLayoutMemoryStorage,
  createEditorLayoutStore,
  normalizeEditorLayoutValue,
} from "../editorRuntime/layout/editorLayoutPersistence.js";
import { getBbmUiElementRef } from "./bbmUiElementRefs.js";
import { createBbmMainUiLayoutStorage } from "./bbmMainUiLayoutStorage.js";

const SCOPE = Object.freeze({
  targetAppId: "bbm-produktiv",
  moduleId: "bbm.main",
  scopeId: "bbm.main-layout",
});

const sharedLayoutStorage = createBbmMainUiLayoutStorage();
const DEFAULT_MIN_WIDTH = 20;
const DEFAULT_MIN_HEIGHT = 20;

function cloneRegistry(registry) {
  return Array.isArray(registry)
    ? registry.map((entry) => ({
        ...entry,
        allowedOps: Array.isArray(entry.allowedOps) ? [...entry.allowedOps] : [],
        lockedOps: Array.isArray(entry.lockedOps) ? [...entry.lockedOps] : [],
      }))
    : [];
}

function normalizeId(value) {
  return String(value ?? "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getCurrentLayoutValue(layoutStore, elementId) {
  const normalizedElementId = normalizeId(elementId);
  return layoutStore.list().find((entry) => normalizeId(entry.elementId) === normalizedElementId)?.layoutValue || {};
}

function getRegistryElement(registry, elementId) {
  const normalizedElementId = normalizeId(elementId);
  return registry.find((entry) => normalizeId(entry.id) === normalizedElementId) || null;
}

function getLayoutDefaults(registryElement) {
  const source = registryElement?.layoutDefaults || registryElement?.defaults || registryElement?.defaultLayout || {};
  return source && typeof source === "object" && !Array.isArray(source) ? source : {};
}

function getMinSize(registryElement, key) {
  const defaults = getLayoutDefaults(registryElement);
  const explicit = key === "width"
    ? defaults.minWidth ?? registryElement?.minWidth
    : defaults.minHeight ?? registryElement?.minHeight;
  return Math.max(1, toNumber(explicit, key === "width" ? DEFAULT_MIN_WIDTH : DEFAULT_MIN_HEIGHT));
}

function getRefRectValue(elementId, key) {
  const target = getBbmUiElementRef(elementId);
  if (!target || typeof target.getBoundingClientRect !== "function") return null;
  const rect = target.getBoundingClientRect();
  const value = toNumber(rect?.[key], NaN);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getBaseSize({ previous, registryElement, elementId, key }) {
  if (Object.prototype.hasOwnProperty.call(previous, key)) return toNumber(previous[key]);
  const defaults = getLayoutDefaults(registryElement);
  const defaultValue = defaults[key] ?? registryElement?.[key];
  const normalizedDefault = toNumber(defaultValue, NaN);
  if (Number.isFinite(normalizedDefault) && normalizedDefault > 0) return normalizedDefault;
  const refValue = getRefRectValue(elementId, key);
  return refValue !== null ? refValue : getMinSize(registryElement, key);
}

function mergeLayoutValue({ previous, operation, nextValue, registryElement, elementId }) {
  if (operation === "move") {
    return {
      ...previous,
      ...(Object.prototype.hasOwnProperty.call(nextValue, "x") ? { x: toNumber(previous.x) + toNumber(nextValue.x) } : {}),
      ...(Object.prototype.hasOwnProperty.call(nextValue, "y") ? { y: toNumber(previous.y) + toNumber(nextValue.y) } : {}),
    };
  }

  if (operation === "resize") {
    return {
      ...previous,
      ...(Object.prototype.hasOwnProperty.call(nextValue, "width") ? { width: Math.max(getMinSize(registryElement, "width"), getBaseSize({ previous, registryElement, elementId, key: "width" }) + toNumber(nextValue.width)) } : {}),
      ...(Object.prototype.hasOwnProperty.call(nextValue, "height") ? { height: Math.max(getMinSize(registryElement, "height"), getBaseSize({ previous, registryElement, elementId, key: "height" }) + toNumber(nextValue.height)) } : {}),
    };
  }

  return { ...previous, ...nextValue };
}



function cloneLayoutEntryForRestore(entry) {
  return {
    ...entry,
    layoutValue: entry?.layoutValue && typeof entry.layoutValue === "object" ? { ...entry.layoutValue } : {},
  };
}

function cloneLayoutEntries(entries) {
  return (Array.isArray(entries) ? entries : []).map(cloneLayoutEntryForRestore);
}

function normalizeComparableLayoutValue(value = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    x: toNumber(input.x, 0),
    y: toNumber(input.y, 0),
    width: Object.prototype.hasOwnProperty.call(input, "width") ? toNumber(input.width) : null,
    height: Object.prototype.hasOwnProperty.call(input, "height") ? toNumber(input.height) : null,
    visible: Object.prototype.hasOwnProperty.call(input, "visible") ? Boolean(input.visible) : null,
  };
}

function sameComparableLayoutValue(left, right) {
  return JSON.stringify(normalizeComparableLayoutValue(left)) === JSON.stringify(normalizeComparableLayoutValue(right));
}

function isDefaultLayoutProfile(entry) {
  return normalizeId(entry?.layoutProfileId) === "default" || !normalizeId(entry?.layoutProfileId);
}

function buildDefaultLayoutValue(registryElement) {
  const defaults = getLayoutDefaults(registryElement);
  const layoutValue = {};
  if (Object.prototype.hasOwnProperty.call(defaults, "x")) layoutValue.x = toNumber(defaults.x, 0);
  if (Object.prototype.hasOwnProperty.call(defaults, "y")) layoutValue.y = toNumber(defaults.y, 0);
  if (Object.prototype.hasOwnProperty.call(defaults, "width")) layoutValue.width = defaults.width;
  if (Object.prototype.hasOwnProperty.call(defaults, "height")) layoutValue.height = defaults.height;
  if (Object.prototype.hasOwnProperty.call(defaults, "visible")) layoutValue.visible = Boolean(defaults.visible);
  else if (Object.prototype.hasOwnProperty.call(registryElement || {}, "visible")) layoutValue.visible = Boolean(registryElement.visible);
  return layoutValue;
}

function isResettableRegistryElement(registryElement, stateElementIds = new Set()) {
  const id = normalizeId(registryElement?.id || registryElement?.elementId);
  if (!id) return false;
  if (stateElementIds.has(id)) return true;
  return Boolean(registryElement?.editable);
}

function buildDefaultEntries(registry, stateElementIds = new Set()) {
  return (Array.isArray(registry) ? registry : [])
    .filter((registryElement) => isResettableRegistryElement(registryElement, stateElementIds))
    .map((registryElement) => ({
      layoutProfileId: "default",
      targetAppId: SCOPE.targetAppId,
      moduleId: SCOPE.moduleId,
      scopeId: SCOPE.scopeId,
      elementId: normalizeId(registryElement?.id || registryElement?.elementId),
      operation: "layout.defaults",
      layoutValue: buildDefaultLayoutValue(registryElement),
      createdAt: "",
      updatedAt: "",
    }))
    .filter((entry) => entry.elementId);
}

function applyLayoutValueToRegisteredTarget(elementId, layoutValue, { resetMissingSize = false } = {}) {
  const target = getBbmUiElementRef(elementId);
  if (!target) {
    return { ok: false, reason: "ELEMENT_REF_MISSING" };
  }

  if (Object.prototype.hasOwnProperty.call(layoutValue, "x") || Object.prototype.hasOwnProperty.call(layoutValue, "y")) {
    const x = toNumber(layoutValue.x);
    const y = toNumber(layoutValue.y);
    target.style.setProperty("transform", `translate(${x}px, ${y}px)`);
  } else if (resetMissingSize) {
    target.style.removeProperty("transform");
  }

  if (Object.prototype.hasOwnProperty.call(layoutValue, "visible")) {
    target.hidden = layoutValue.visible === false;
  }

  if (Object.prototype.hasOwnProperty.call(layoutValue, "width")) {
    target.style.setProperty("width", `${Math.max(DEFAULT_MIN_WIDTH, toNumber(layoutValue.width))}px`);
  } else if (resetMissingSize) {
    target.style.removeProperty("width");
  }
  if (Object.prototype.hasOwnProperty.call(layoutValue, "height")) {
    target.style.setProperty("height", `${Math.max(DEFAULT_MIN_HEIGHT, toNumber(layoutValue.height))}px`);
  } else if (resetMissingSize) {
    target.style.removeProperty("height");
  }

  return { ok: true, applied: true };
}

export function createBbmMainUiHostAdapter({ registry = [], layoutStorage = sharedLayoutStorage, onChangeRequest = null } = {}) {
  const runtimeRegistry = cloneRegistry(registry);
  const persistentLayoutStore = createEditorLayoutStore({
    scope: SCOPE,
    storage: layoutStorage,
  });
  const sessionLayoutStorage = createEditorLayoutMemoryStorage();
  const layoutStore = createEditorLayoutStore({
    scope: SCOPE,
    storage: sessionLayoutStorage,
  });

  function validateRequiredRefs(entries = []) {
    for (const entry of Array.isArray(entries) ? entries : []) {
      const elementId = normalizeId(entry?.elementId);
      if (!elementId) continue;
      if (!getBbmUiElementRef(elementId)) return { ok: false, reason: "ELEMENT_REF_MISSING", elementId };
    }
    return { ok: true };
  }

  function applyEntries(entries = [], { resetMissingSize = false } = {}) {
    for (const entry of Array.isArray(entries) ? entries : []) {
      const elementId = normalizeId(entry?.elementId);
      if (!elementId) continue;
      const applyResult = applyLayoutValueToRegisteredTarget(elementId, entry?.layoutValue || {}, { resetMissingSize });
      if (!applyResult.ok) return { ok: false, reason: applyResult.reason, elementId };
    }
    return { ok: true, applied: true };
  }

  function getStateElementIds(...entryLists) {
    return new Set(entryLists.flatMap((entries) => cloneLayoutEntries(entries).map((entry) => normalizeId(entry.elementId)).filter(Boolean)));
  }

  function hasSavedLayout() {
    try {
      return persistentLayoutStore.list().some(isDefaultLayoutProfile);
    } catch (_error) {
      return false;
    }
  }

  function currentDeviatesFromDefaults() {
    const currentEntries = layoutStore.list();
    const currentById = new Map(currentEntries.map((entry) => [normalizeId(entry.elementId), entry.layoutValue || {}]));
    const stateIds = getStateElementIds(currentEntries);
    const defaultEntries = buildDefaultEntries(runtimeRegistry, stateIds);
    return defaultEntries.some((entry) => currentById.has(normalizeId(entry.elementId)) && !sameComparableLayoutValue(currentById.get(normalizeId(entry.elementId)) || {}, entry.layoutValue || {}));
  }

  function getPersistenceStatus() {
    const savedLayoutFound = hasSavedLayout();
    const deviatesFromDefaults = currentDeviatesFromDefaults();
    return {
      persistenceAvailable: Boolean(layoutStorage?.available),
      persistencePersistent: Boolean(layoutStorage?.persistent),
      savedLayoutFound,
      deviatesFromDefaults,
      standardLayoutActive: !savedLayoutFound && !deviatesFromDefaults,
    };
  }

  function readPersistentStorage() {
    if (typeof layoutStorage?.readResult === "function") {
      return layoutStorage.readResult();
    }
    try {
      const payload = typeof layoutStorage?.read === "function" ? layoutStorage.read() : null;
      return payload ? { ok: true, found: true, payload } : { ok: true, found: false, payload: null };
    } catch (error) {
      return { ok: false, found: false, payload: null, reason: error?.code || "LAYOUT_STORAGE_READ_FAILED" };
    }
  }

  function loadPersistentEntriesIntoSession() {
    const readResult = readPersistentStorage();
    if (!readResult.ok) return { ok: false, savedLayoutFound: false, reason: readResult.reason || "LAYOUT_STORAGE_READ_FAILED", entries: [] };
    if (!readResult.found) return { ok: true, savedLayoutFound: false, entries: [] };
    const savedEntries = persistentLayoutStore.list();
    layoutStore.replace(savedEntries, runtimeRegistry.map((entry) => normalizeId(entry.id)).filter(Boolean));
    return { ok: true, savedLayoutFound: savedEntries.length > 0, entries: savedEntries };
  }

  const initialLoad = loadPersistentEntriesIntoSession();
  if (!initialLoad.ok && initialLoad.reason !== "LAYOUT_STORAGE_UNAVAILABLE") {
    // Der Fehler wird erst beim expliziten Laden sichtbar gemeldet.
  }

  const adapter = {
    getRegistry() {
      return cloneRegistry(runtimeRegistry);
    },

    getCurrentLayoutState() {
      return layoutStore.list();
    },

    getSavedLayoutState() {
      return persistentLayoutStore.list();
    },

    getPersistenceStatus() {
      return getPersistenceStatus();
    },

    loadSavedLayout() {
      try {
        const loadResult = loadPersistentEntriesIntoSession();
        if (!loadResult.ok) return { ...getPersistenceStatus(), ok: false, blocked: true, reason: loadResult.reason || "LAYOUT_LOAD_FAILED", savedLayoutFound: false, layoutState: layoutStore.list() };
        if (!loadResult.savedLayoutFound) return { ...getPersistenceStatus(), ok: true, blocked: false, reason: null, savedLayoutFound: false, layoutState: layoutStore.list(), savedLayoutState: [] };
        const applyResult = applyEntries(loadResult.entries, { resetMissingSize: true });
        if (!applyResult.ok) return { ...getPersistenceStatus(), ok: false, blocked: true, reason: applyResult.reason, elementId: applyResult.elementId, savedLayoutFound: true, layoutState: layoutStore.list() };
        return { ...getPersistenceStatus(), ok: true, blocked: false, reason: null, savedLayoutFound: true, layoutState: layoutStore.list(), savedLayoutState: persistentLayoutStore.list() };
      } catch (_error) {
        return { ...getPersistenceStatus(), ok: false, blocked: true, reason: "LAYOUT_LOAD_FAILED", savedLayoutFound: false, layoutState: layoutStore.list() };
      }
    },

    saveLayoutSession() {
      const persistence = getPersistenceStatus();
      if (!persistence.persistenceAvailable || !persistence.persistencePersistent) {
        return { ...persistence, ok: false, blocked: true, reason: "LAYOUT_STORAGE_NOT_PERSISTENT", layoutState: layoutStore.list() };
      }
      try {
        const ids = runtimeRegistry.map((entry) => normalizeId(entry.id)).filter(Boolean);
        const layoutState = layoutStore.list();
        persistentLayoutStore.replace(layoutState, ids);
        const verify = readPersistentStorage();
        if (!verify.ok || !verify.found) {
          return { ...persistence, ok: false, blocked: true, reason: verify.reason || "LAYOUT_STORAGE_VERIFY_FAILED", layoutState: layoutStore.list() };
        }
        const savedLayoutState = persistentLayoutStore.list();
        return { ...persistence, ok: true, blocked: false, reason: null, savedLayoutFound: savedLayoutState.length > 0, layoutState: layoutStore.list(), savedLayoutState };
      } catch (error) {
        return { ...persistence, ok: false, blocked: true, reason: error?.code || "LAYOUT_SAVE_FAILED", layoutState: layoutStore.list() };
      }
    },

    submitChangeRequest(changeRequest) {
      if (typeof onChangeRequest === "function") onChangeRequest(changeRequest);
      const validation = validateEditorChangeRequest(changeRequest, {
        scope: SCOPE,
        registry: runtimeRegistry,
      });

      if (!validation.ok) {
        return { ok: false, blocked: true, reason: "INVALID_CHANGE_REQUEST", validation };
      }

      const layoutValueResult = normalizeEditorLayoutValue(changeRequest.operation, changeRequest.payload);
      if (!layoutValueResult.ok) {
        return { ok: false, blocked: true, reason: layoutValueResult.reason, validation };
      }

      const previous = getCurrentLayoutValue(layoutStore, changeRequest.elementId);
      const registryElement = getRegistryElement(runtimeRegistry, changeRequest.elementId);
      const layoutValue = mergeLayoutValue({
        previous,
        operation: normalizeId(changeRequest.operation),
        nextValue: layoutValueResult.layoutValue,
        registryElement,
        elementId: changeRequest.elementId,
      });
      const layoutEntry = layoutStore.save(changeRequest, layoutValue);
      const applyResult = applyLayoutValueToRegisteredTarget(changeRequest.elementId, layoutEntry.layoutValue);

      if (!applyResult.ok) {
        return { ok: false, blocked: true, reason: applyResult.reason, validation, layoutEntry };
      }

      return { ok: true, blocked: false, reason: null, validation, layoutEntry, applyResult };
    },

    resetLayoutState({ elementId = null } = {}) {
      const normalizedElementId = normalizeId(elementId);
      if (normalizedElementId && !runtimeRegistry.some((entry) => entry.id === normalizedElementId)) {
        return { ok: false, blocked: true, reason: "ELEMENT_ID_UNKNOWN", layoutState: layoutStore.list() };
      }

      return { ok: true, blocked: false, reason: null, layoutState: layoutStore.reset(normalizedElementId || null) };
    },

    resetLayoutToDefaults() {
      const persistence = getPersistenceStatus();
      if (!persistence.persistenceAvailable || !persistence.persistencePersistent) {
        return { ...persistence, ok: false, blocked: true, reason: "LAYOUT_STORAGE_NOT_PERSISTENT", layoutState: layoutStore.list() };
      }

      const previousPersistentEntries = cloneLayoutEntries(persistentLayoutStore.list());
      const previousSessionEntries = cloneLayoutEntries(layoutStore.list());
      const ids = runtimeRegistry.map((entry) => normalizeId(entry.id)).filter(Boolean);
      const stateIds = getStateElementIds(previousPersistentEntries, previousSessionEntries);
      const defaultEntries = buildDefaultEntries(runtimeRegistry, stateIds);
      const defaultIds = defaultEntries.map((entry) => normalizeId(entry.elementId)).filter(Boolean);
      const requiredRefs = validateRequiredRefs(defaultEntries);
      if (!requiredRefs.ok) {
        return { ...persistence, ok: false, blocked: true, reason: requiredRefs.reason, elementId: requiredRefs.elementId, layoutState: layoutStore.list() };
      }

      function restorePreviousState(reason, extra = {}) {
        try {
          layoutStore.replace(previousSessionEntries, ids);
          const previousById = new Map(previousSessionEntries.map((entry) => [normalizeId(entry.elementId), entry]));
          const rollbackEntries = defaultIds.map((id) => previousById.get(id) || { elementId: id, layoutValue: {} });
          applyEntries(rollbackEntries, { resetMissingSize: true });
        } catch (_rollbackError) {
          // Rueckgabe bleibt Fehler; Mischzustand wird nicht als Erfolg gemeldet.
        }
        try {
          persistentLayoutStore.replace(previousPersistentEntries, ids);
        } catch (_rollbackError) {
          // Rueckgabe bleibt Fehler; Persistenz-Rollback wurde bestmoeglich versucht.
        }
        return { ...getPersistenceStatus(), ok: false, blocked: true, reason, ...extra, layoutState: layoutStore.list(), savedLayoutState: persistentLayoutStore.list() };
      }

      try {
        layoutStore.replace(defaultEntries, ids);
        const applyResult = applyEntries(defaultEntries, { resetMissingSize: true });
        if (!applyResult.ok) {
          return restorePreviousState(applyResult.reason || "LAYOUT_DEFAULT_APPLY_FAILED", { elementId: applyResult.elementId });
        }
        const retainedPersistentEntries = previousPersistentEntries.filter((entry) => !isDefaultLayoutProfile(entry));
        const defaultPersistentIds = previousPersistentEntries.filter(isDefaultLayoutProfile).map((entry) => normalizeId(entry.elementId)).filter(Boolean);
        const persistentReplaceIds = [...new Set([...ids, ...defaultPersistentIds])];
        persistentLayoutStore.replace(retainedPersistentEntries, persistentReplaceIds);
        const verify = persistentLayoutStore.list();
        if (verify.some(isDefaultLayoutProfile)) {
          return restorePreviousState("LAYOUT_STORAGE_CLEAR_VERIFY_FAILED");
        }
        const layoutState = layoutStore.replace([], ids);
        return { ...getPersistenceStatus(), ok: true, blocked: false, reason: null, savedLayoutFound: false, deviatesFromDefaults: false, standardLayoutActive: true, layoutState, savedLayoutState: verify };
      } catch (error) {
        return restorePreviousState(error?.code || "LAYOUT_RESET_DEFAULTS_FAILED");
      }
    },

    restoreLayoutState({ entries = [], elementIds = [] } = {}) {
      const ids = Array.isArray(elementIds) ? elementIds.map(normalizeId).filter(Boolean) : [];
      const unknown = ids.find((id) => !runtimeRegistry.some((entry) => entry.id === id));
      if (unknown) return { ok: false, blocked: true, reason: "ELEMENT_ID_UNKNOWN", elementId: unknown, layoutState: layoutStore.list() };
      const restoreEntries = (Array.isArray(entries) ? entries : []).map(cloneLayoutEntryForRestore).filter((entry) => ids.includes(normalizeId(entry.elementId)));
      const layoutState = layoutStore.replace(restoreEntries, ids);
      const byId = new Map(restoreEntries.map((entry) => [normalizeId(entry.elementId), entry]));
      for (const id of ids) {
        const layoutValue = byId.get(id)?.layoutValue || {};
        const applyResult = applyLayoutValueToRegisteredTarget(id, layoutValue, { resetMissingSize: true });
        if (!applyResult.ok) return { ok: false, blocked: true, reason: applyResult.reason, elementId: id, layoutState };
      }
      return { ok: true, blocked: false, reason: null, layoutState };
    },
  };

  const shape = validateHostAdapterShape(adapter);
  if (!shape.ok) {
    const error = new Error("BBM main UI HostAdapter contract validation failed");
    error.details = shape.errors;
    throw error;
  }

  return adapter;
}

export const BBM_MAIN_UI_HOST_ADAPTER_SCOPE = SCOPE;
