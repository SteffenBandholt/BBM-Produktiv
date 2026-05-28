import { createEditorV2Overlay, normalizeMode, resolveRegistryTarget } from "./editorV2Overlay.js";

function normalizeRegistry(registry) {
  return Array.isArray(registry) ? registry : [];
}

export function createEditorV2Core(options = {}) {
  const overlay = createEditorV2Overlay({
    registry: normalizeRegistry(options.registry),
    mode: options.mode || "frame",
    zIndex: options.zIndex,
  });

  let rootElement = null;
  let registry = normalizeRegistry(options.registry);
  let mode = normalizeMode(options.mode || "frame");

  function mount(nextRootElement, nextRegistry = registry) {
    rootElement = nextRootElement || null;
    registry = normalizeRegistry(nextRegistry);
    overlay.setRegistry(registry);
    overlay.setMode(mode);
    return overlay.mount(rootElement, registry);
  }

  function unmount() {
    rootElement = null;
    return overlay.unmount();
  }

  function setMode(nextMode) {
    mode = normalizeMode(nextMode);
    overlay.setMode(mode);
    return mode;
  }

  function setRegistry(nextRegistry) {
    registry = normalizeRegistry(nextRegistry);
    overlay.setRegistry(registry);
    return registry;
  }

  function handlePointerMove(event) {
    return overlay.handlePointerMove(event);
  }

  return {
    mount,
    unmount,
    setMode,
    getMode: () => mode,
    setRegistry,
    getRegistry: () => registry,
    handlePointerMove,
    getOverlayRoot: () => overlay.getOverlayRoot(),
    getHoverFrame: () => overlay.getHoverFrame(),
    getCurrentHover: () => overlay.getCurrentHover(),
    clearHoverFrame: () => overlay.clearHoverFrame(),
    resolveRegistryTarget: (candidateNode) => resolveRegistryTarget(rootElement, registry, mode, candidateNode),
  };
}

