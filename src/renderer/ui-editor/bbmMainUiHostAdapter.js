import { validateEditorChangeRequest } from "../editorRuntime/changeRequests/editorChangeRequestValidator.js";
import { validateHostAdapterShape } from "../editorRuntime/host/bbmEditorHostAdapterContract.js";
import {
  createEditorLayoutMemoryStorage,
  createEditorLayoutStore,
  normalizeEditorLayoutValue,
} from "../editorRuntime/layout/editorLayoutPersistence.js";
import { getBbmUiElementRef } from "./bbmUiElementRefs.js";

const SCOPE = Object.freeze({
  targetAppId: "bbm-produktiv",
  moduleId: "bbm.main",
  scopeId: "bbm.main.readonly",
});

const sharedLayoutStorage = createEditorLayoutMemoryStorage();
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

function applyLayoutValueToRegisteredTarget(elementId, layoutValue) {
  const target = getBbmUiElementRef(elementId);
  if (!target) {
    return { ok: false, reason: "ELEMENT_REF_MISSING" };
  }

  const x = toNumber(layoutValue.x);
  const y = toNumber(layoutValue.y);
  target.style.setProperty("transform", `translate(${x}px, ${y}px)`);

  if (Object.prototype.hasOwnProperty.call(layoutValue, "width")) {
    target.style.setProperty("width", `${Math.max(DEFAULT_MIN_WIDTH, toNumber(layoutValue.width))}px`);
  }
  if (Object.prototype.hasOwnProperty.call(layoutValue, "height")) {
    target.style.setProperty("height", `${Math.max(DEFAULT_MIN_HEIGHT, toNumber(layoutValue.height))}px`);
  }

  return { ok: true, applied: true };
}

export function createBbmMainUiHostAdapter({ registry = [], layoutStorage = sharedLayoutStorage } = {}) {
  const runtimeRegistry = cloneRegistry(registry);
  const layoutStore = createEditorLayoutStore({
    scope: SCOPE,
    storage: layoutStorage,
  });

  const adapter = {
    getRegistry() {
      return cloneRegistry(runtimeRegistry);
    },

    getCurrentLayoutState() {
      return layoutStore.list();
    },

    submitChangeRequest(changeRequest) {
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
