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

function mergeLayoutValue(previous, operation, nextValue) {
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
      ...(Object.prototype.hasOwnProperty.call(nextValue, "width") ? { width: toNumber(previous.width) + toNumber(nextValue.width) } : {}),
      ...(Object.prototype.hasOwnProperty.call(nextValue, "height") ? { height: toNumber(previous.height) + toNumber(nextValue.height) } : {}),
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
    target.style.setProperty("width", `${Math.max(0, toNumber(layoutValue.width))}px`);
  }
  if (Object.prototype.hasOwnProperty.call(layoutValue, "height")) {
    target.style.setProperty("height", `${Math.max(0, toNumber(layoutValue.height))}px`);
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
      const layoutValue = mergeLayoutValue(previous, normalizeId(changeRequest.operation), layoutValueResult.layoutValue);
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
