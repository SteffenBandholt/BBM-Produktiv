import { createUiInspectorOverlay } from './UiInspectorOverlay.js';

export function createUiInspectorRuntime({ overlay } = {}) {
  const resolvedOverlay = overlay || createUiInspectorOverlay();
  let overlayActive = false;

  function activateOverlay(rootElement) {
    overlayActive = resolvedOverlay.mount(rootElement) === true;
    return overlayActive;
  }

  function deactivateOverlay() {
    resolvedOverlay.clearSelection?.();
    resolvedOverlay.unmount();
    overlayActive = false;
    return true;
  }

  function refreshOverlay() {
    if (!overlayActive) return false;
    return resolvedOverlay.refresh() === true;
  }

  function getSelectedElementId() {
    return resolvedOverlay.getSelectedId?.() || '';
  }

  function clearSelection() {
    resolvedOverlay.clearSelection?.();
    return true;
  }

  return {
    overlay: resolvedOverlay,
    activateOverlay,
    deactivateOverlay,
    refreshOverlay,
    getSelectedElementId,
    clearSelection,
    isOverlayActive() {
      return overlayActive;
    },
  };
}
