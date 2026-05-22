import sharedUiInspector from '../../shared/uiInspector/index.js';
import { createUiInspectorOverlay } from './UiInspectorOverlay.js';

const { createUiInspectorCore, createUiInspectorRegistry, createMemoryUiInspectorStore } = sharedUiInspector;

export function createUiInspectorRuntime({ registry, store, core, overlay } = {}) {
  const resolvedRegistry = registry || createUiInspectorRegistry();
  const resolvedStore = store || createMemoryUiInspectorStore();
  const resolvedCore = core || createUiInspectorCore({ registry: resolvedRegistry, store: resolvedStore });
  const resolvedOverlay = overlay || createUiInspectorOverlay();

  let overlayActive = false;

  function activateOverlay(rootElement) {
    overlayActive = resolvedOverlay.mount(rootElement) === true;
    return overlayActive;
  }

  function deactivateOverlay() {
    resolvedOverlay.unmount();
    overlayActive = false;
    return true;
  }

  function refreshOverlay() {
    if (!overlayActive) return false;
    return resolvedOverlay.refresh() === true;
  }

  return {
    registry: resolvedRegistry,
    store: resolvedStore,
    core: resolvedCore,
    overlay: resolvedOverlay,
    activateOverlay,
    deactivateOverlay,
    refreshOverlay,
    isOverlayActive() {
      return overlayActive;
    },
  };
}
