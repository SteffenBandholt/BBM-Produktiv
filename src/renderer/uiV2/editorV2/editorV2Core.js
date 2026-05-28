import { createEditorV2Overlay, normalizeMode, resolveRegistryTarget } from "./editorV2Overlay.js";

function normalizeRegistry(registry) {
  return Array.isArray(registry) ? registry : [];
}

function getDefaultMinSize(kind) {
  const normalizedKind = String(kind || "").trim();
  if (normalizedKind === "field") return { minWidth: 40, minHeight: 20 };
  if (normalizedKind === "control") return { minWidth: 24, minHeight: 20 };
  return { minWidth: 40, minHeight: 24 };
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readRect(node) {
  const rect = typeof node?.getBoundingClientRect === "function" ? node.getBoundingClientRect() : null;
  return {
    left: toNumber(rect?.left),
    top: toNumber(rect?.top),
    width: Math.max(0, toNumber(rect?.width)),
    height: Math.max(0, toNumber(rect?.height)),
  };
}

function buildCssText(baseCssText, previewState) {
  const chunks = [];
  const prefix = String(baseCssText || "").trim();
  if (prefix) chunks.push(prefix.replace(/;\s*$/, ""));
  if (previewState) {
    const parts = [];
    if (previewState.x !== 0 || previewState.y !== 0) {
      parts.push(`transform: translate(${Math.round(previewState.x)}px, ${Math.round(previewState.y)}px)`);
    }
    if (Number.isFinite(previewState.width)) {
      parts.push(`width: ${Math.max(0, Math.round(previewState.width))}px`);
    }
    if (Number.isFinite(previewState.height)) {
      parts.push(`height: ${Math.max(0, Math.round(previewState.height))}px`);
    }
    if (parts.length) chunks.push(parts.join("; "));
  }
  return chunks.filter(Boolean).join("; ");
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
  const previewStates = new Map();

  function getSelectedSnapshot() {
    return overlay.getCurrentSelected();
  }

  function getSelectedNode() {
    return getSelectedSnapshot()?.node || null;
  }

  function getSelectedEntry() {
    return getSelectedSnapshot()?.entry || null;
  }

  function ensurePreviewState(targetNode, entry) {
    if (!targetNode || !entry) return null;
    const id = String(entry.id || "").trim();
    if (!id) return null;
    let state = previewStates.get(id);
    if (state) return state;
    const rect = readRect(targetNode);
    state = {
      id,
      entry,
      node: targetNode,
      originalCssText: String(targetNode?.style?.cssText || ""),
      baseRect: rect,
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
    };
    previewStates.set(id, state);
    return state;
  }

  function applyPreviewState(state) {
    if (!state?.node) return false;
    const node = state.node;
    if (node._rect && typeof node._rect === "object") {
      node._rect = {
        left: state.baseRect.left + state.x,
        top: state.baseRect.top + state.y,
        width: state.width,
        height: state.height,
      };
    }
    if (!node.style) node.style = {};
    node.style.cssText = buildCssText(state.originalCssText, state);
    overlay.refreshFrames();
    return true;
  }

  function restorePreviewState(state) {
    if (!state?.node) return false;
    const node = state.node;
    if (node._rect && typeof node._rect === "object") {
      node._rect = { ...state.baseRect };
    }
    if (!node.style) node.style = {};
    node.style.cssText = String(state.originalCssText || "");
    return true;
  }

  function getSelectedPreviewState() {
    const selected = getSelectedSnapshot();
    if (!selected?.entry || !selected?.node) return null;
    return ensurePreviewState(selected.node, selected.entry);
  }

  function getMinSizeForState(state) {
    const entry = state?.entry || {};
    const fallback = getDefaultMinSize(entry.kind);
    return {
      minWidth: toNumber(entry.minWidth, fallback.minWidth),
      minHeight: toNumber(entry.minHeight, fallback.minHeight),
    };
  }

  function moveSelected(dx = 0, dy = 0) {
    const state = getSelectedPreviewState();
    if (!state) return false;
    state.x += toNumber(dx, 0);
    state.y += toNumber(dy, 0);
    return applyPreviewState(state);
  }

  function resizeSelected(dw = 0, dh = 0) {
    const state = getSelectedPreviewState();
    if (!state) return false;
    const minSize = getMinSizeForState(state);
    state.width = Math.max(minSize.minWidth, state.width + toNumber(dw, 0));
    state.height = Math.max(minSize.minHeight, state.height + toNumber(dh, 0));
    return applyPreviewState(state);
  }

  function moveSelectedLeft(step = 2) {
    return moveSelected(-Math.abs(toNumber(step, 2)), 0);
  }

  function moveSelectedRight(step = 2) {
    return moveSelected(Math.abs(toNumber(step, 2)), 0);
  }

  function moveSelectedUp(step = 2) {
    return moveSelected(0, -Math.abs(toNumber(step, 2)));
  }

  function moveSelectedDown(step = 2) {
    return moveSelected(0, Math.abs(toNumber(step, 2)));
  }

  function growSelectedWidth(step = 2) {
    return resizeSelected(Math.abs(toNumber(step, 2)), 0);
  }

  function shrinkSelectedWidth(step = 2) {
    return resizeSelected(-Math.abs(toNumber(step, 2)), 0);
  }

  function growSelectedHeight(step = 2) {
    return resizeSelected(0, Math.abs(toNumber(step, 2)));
  }

  function shrinkSelectedHeight(step = 2) {
    return resizeSelected(0, -Math.abs(toNumber(step, 2)));
  }

  function resetSelectedPreview() {
    const selected = getSelectedSnapshot();
    if (!selected?.entry) return false;
    const state = previewStates.get(String(selected.entry.id || "").trim());
    if (!state) return false;
    restorePreviewState(state);
    previewStates.delete(state.id);
    overlay.refreshFrames();
    return true;
  }

  function resetAllPreview() {
    let didReset = false;
    for (const state of previewStates.values()) {
      didReset = restorePreviewState(state) || didReset;
    }
    previewStates.clear();
    if (didReset) {
      overlay.refreshFrames();
    }
    return didReset;
  }

  function getHoverTargetId() {
    return String(overlay.getCurrentHover()?.entry?.id || "").trim() || null;
  }

  function getSelectedTargetId() {
    return String(overlay.getCurrentSelected()?.entry?.id || "").trim() || null;
  }

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
    getSelectedFrame: () => overlay.getSelectedFrame(),
    getCurrentHover: () => overlay.getCurrentHover(),
    getCurrentSelected: () => overlay.getCurrentSelected(),
    getHoverTargetId,
    getSelectedTargetId,
    clearHoverFrame: () => overlay.clearHoverFrame(),
    clearSelectedFrame: () => overlay.clearSelectedFrame(),
    handlePointerSelect: (event) => overlay.handlePointerSelect(event),
    resolveRegistryTarget: (candidateNode) => resolveRegistryTarget(rootElement, registry, mode, candidateNode),
    moveSelected,
    resizeSelected,
    moveSelectedLeft,
    moveSelectedRight,
    moveSelectedUp,
    moveSelectedDown,
    growSelectedWidth,
    shrinkSelectedWidth,
    growSelectedHeight,
    shrinkSelectedHeight,
    resetSelectedPreview,
    resetAllPreview,
    getPreviewState: (entryId) => previewStates.get(String(entryId || "").trim()) || null,
  };
}
