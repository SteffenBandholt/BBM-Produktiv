import { getBbmUiElementRef, getBbmUiElementRefStatus } from "./bbmUiElementRefs.js";

const MAIN_SHELL_ELEMENT_ID = "bbm.main.shell";

function normalizeElementId(elementId) {
  return String(elementId == null ? "" : elementId).trim();
}

function toTarget(element) {
  const elementId = normalizeElementId(element?.elementId || element?.id);
  if (!elementId) return null;
  return {
    elementId,
    id: elementId,
    label: element?.label || element?.name || elementId,
    name: element?.name || element?.label || elementId,
    type: element?.type || "unknown",
    role: element?.role || element?.kind || "unknown",
    parentId: element?.parentId || null,
    editable: Boolean(element?.editable),
    allowedOps: Array.isArray(element?.allowedOps) ? [...element.allowedOps] : Array.isArray(element?.allowedChanges) ? [...element.allowedChanges] : [],
  };
}

export function createBbmKitSelectionHost(options = {}) {
  const getRegistryElements = typeof options.getRegistryElements === "function" ? options.getRegistryElements : () => [];
  const getSelectedElement = typeof options.getSelectedElement === "function" ? options.getSelectedElement : () => null;
  const selectElement = typeof options.selectElement === "function" ? options.selectElement : async () => {};
  const getPanelRoot = typeof options.getPanelRoot === "function" ? options.getPanelRoot : () => null;
  const onStateChange = typeof options.onStateChange === "function" ? options.onStateChange : () => {};
  const onSelection = typeof options.onSelection === "function" ? options.onSelection : () => {};
  const onError = typeof options.onError === "function" ? options.onError : () => {};

  function listSelectableTargets() {
    return getRegistryElements().map(toTarget).filter(Boolean);
  }

  function getElementMeta(elementId) {
    const normalizedElementId = normalizeElementId(elementId);
    return listSelectableTargets().find((element) => element.elementId === normalizedElementId) || null;
  }

  return {
    listSelectableTargets,
    getElementRef(elementId) {
      const normalizedElementId = normalizeElementId(elementId);
      if (!normalizedElementId) return null;
      try {
        return getBbmUiElementRef(normalizedElementId);
      } catch (_error) {
        return null;
      }
    },
    getSelectedElementId() {
      return normalizeElementId(getSelectedElement()?.elementId);
    },
    async selectElement(elementId) {
      const normalizedElementId = normalizeElementId(elementId);
      await selectElement(normalizedElementId);
      return { ok: true, elementId: normalizedElementId };
    },
    getElementMeta,
    isExcludedTarget(eventTarget) {
      const panelRoot = getPanelRoot();
      return Boolean(panelRoot && eventTarget && (eventTarget === panelRoot || panelRoot.contains?.(eventTarget)));
    },
    getInteractionRoot() {
      try {
        return getBbmUiElementRef(MAIN_SHELL_ELEMENT_ID);
      } catch (_error) {
        return null;
      }
    },
    onStateChange(state) {
      onStateChange(state || {});
    },
    onSelection(selection) {
      onSelection(selection || {});
    },
    onError(error) {
      onError(error || new Error("BBM_KIT_SELECTION_UNKNOWN_ERROR"));
    },
    getRefStatus() {
      return getBbmUiElementRefStatus();
    },
  };
}
