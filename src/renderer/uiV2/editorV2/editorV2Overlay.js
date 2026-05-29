const DEFAULT_OVERLAY_Z_INDEX = 2147483650;

function normalizeMode(mode) {
  const value = String(mode || "").trim();
  if (value === "field" || value === "control") return value;
  return "frame";
}

function selectorToId(selector) {
  const text = String(selector || "");
  const match = text.match(/data-ui-v2-id\s*=\s*["']([^"']+)["']/i);
  return match ? match[1].trim() : "";
}

function nodeMatchesSelector(node, selector) {
  if (!node || typeof node.getAttribute !== "function") return false;
  const expectedId = selectorToId(selector);
  if (!expectedId) return false;
  return String(node.getAttribute("data-ui-v2-id") || "").trim() === expectedId;
}

function nodeMatchesRegistryEntry(node, entry) {
  if (!node || !entry) return false;
  const nodeId = String(node.getAttribute?.("data-ui-v2-id") || "").trim();
  if (nodeId && nodeId === String(entry.id || "").trim()) return true;
  if (entry.selector) return nodeMatchesSelector(node, entry.selector);
  return false;
}

function resolveRegistryTarget(rootElement, registry, mode, candidateNode) {
  const normalizedMode = normalizeMode(mode);
  const entries = Array.isArray(registry) ? registry : [];
  let node = candidateNode;
  while (node) {
    for (const entry of entries) {
      if (String(entry?.kind || "").trim() !== normalizedMode) continue;
      if (nodeMatchesRegistryEntry(node, entry)) {
        return { entry, node };
      }
    }
    if (node === rootElement) break;
    node = node.parentElement || null;
  }
  return null;
}

export function createEditorV2Overlay(options = {}) {
  let rootElement = null;
  let doc = null;
  let overlayRoot = null;
  let hoverFrame = null;
  let selectedFrame = null;
  let pointerMoveHandler = null;
  let pointerDownHandler = null;
  let scrollHandler = null;
  let resizeHandler = null;
  let currentHover = null;
  let currentSelected = null;
  let mode = normalizeMode(options.mode || "frame");
  let registry = Array.isArray(options.registry) ? options.registry : [];

  function ensureOverlayRoot() {
    if (overlayRoot) return overlayRoot;
    if (!doc || typeof doc.createElement !== "function") return null;
    overlayRoot = doc.createElement("div");
    overlayRoot.setAttribute("data-ui-editor-v2-overlay-root", "true");
    overlayRoot.style.position = "fixed";
    overlayRoot.style.inset = "0";
    overlayRoot.style.pointerEvents = "none";
    overlayRoot.style.zIndex = String(Number.isFinite(options.zIndex) ? options.zIndex : DEFAULT_OVERLAY_Z_INDEX);
    overlayRoot.style.overflow = "hidden";
    return overlayRoot;
  }

  function ensureHoverFrame() {
    if (hoverFrame) return hoverFrame;
    if (!doc || typeof doc.createElement !== "function") return null;
    hoverFrame = doc.createElement("div");
    hoverFrame.setAttribute("data-ui-editor-v2-hover-frame", "true");
    hoverFrame.style.position = "fixed";
    hoverFrame.style.pointerEvents = "none";
    hoverFrame.style.display = "none";
    hoverFrame.style.boxSizing = "border-box";
    hoverFrame.style.border = "2px solid rgba(41, 98, 255, 0.98)";
    hoverFrame.style.background = "rgba(41, 98, 255, 0.10)";
    hoverFrame.style.borderRadius = "4px";
    return hoverFrame;
  }

  function ensureSelectedFrame() {
    if (selectedFrame) return selectedFrame;
    if (!doc || typeof doc.createElement !== "function") return null;
    selectedFrame = doc.createElement("div");
    selectedFrame.setAttribute("data-ui-editor-v2-selected-frame", "true");
    selectedFrame.style.position = "fixed";
    selectedFrame.style.pointerEvents = "none";
    selectedFrame.style.display = "none";
    selectedFrame.style.boxSizing = "border-box";
    selectedFrame.style.border = "2px solid rgba(245, 158, 11, 0.98)";
    selectedFrame.style.background = "rgba(245, 158, 11, 0.08)";
    selectedFrame.style.borderRadius = "4px";
    return selectedFrame;
  }

  function paintFrame(frame, node, entry, attrName) {
    if (!frame || !node || !entry) return false;
    const rect = typeof node.getBoundingClientRect === "function" ? node.getBoundingClientRect() : null;
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) return false;
    frame.style.left = `${Math.round(rect.left)}px`;
    frame.style.top = `${Math.round(rect.top)}px`;
    frame.style.width = `${Math.round(rect.width)}px`;
    frame.style.height = `${Math.round(rect.height)}px`;
    frame.style.display = "block";
    frame.setAttribute(attrName, "true");
    frame.textContent = entry.label || entry.id;
    return true;
  }

  function syncOverlay() {
    const overlay = ensureOverlayRoot();
    if (!overlay) return false;

    const children = [];
    const selected = currentSelected?.entry && currentSelected?.node ? ensureSelectedFrame() : null;
    const hover = currentHover?.entry && currentHover?.node ? ensureHoverFrame() : null;

    if (selected && paintFrame(selected, currentSelected.node, currentSelected.entry, "data-ui-editor-v2-selected-frame")) {
      selected.setAttribute("data-ui-editor-v2-selected-id", currentSelected.entry.id);
      children.push(selected);
    }

    if (
      hover &&
      (!currentSelected || currentHover.entry.id !== currentSelected.entry.id) &&
      paintFrame(hover, currentHover.node, currentHover.entry, "data-ui-editor-v2-hover-frame")
    ) {
      hover.setAttribute("data-ui-editor-v2-hover-id", currentHover.entry.id);
      children.push(hover);
    }

    if (typeof overlay.replaceChildren === "function") {
      overlay.replaceChildren(...children);
    } else {
      overlay.children = children;
    }

    return true;
  }

  function refreshOverlay() {
    return syncOverlay();
  }

  function clearHoverFrame() {
    currentHover = null;
    syncOverlay();
  }

  function renderHoverFrame(targetNode, entry) {
    if (!targetNode || !entry) {
      clearHoverFrame();
      return false;
    }
    currentHover = { entry, node: targetNode };
    return syncOverlay();
  }

  function renderSelectedFrame(targetNode, entry) {
    if (!targetNode || !entry) return false;
    const rect = typeof targetNode.getBoundingClientRect === "function" ? targetNode.getBoundingClientRect() : null;
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) {
      return false;
    }
    currentSelected = { entry, node: targetNode };
    return syncOverlay();
  }

  function clearSelectedFrame() {
    currentSelected = null;
    syncOverlay();
  }

  function getHitCandidate(event = {}) {
    const directTarget = event.target || null;
    if (directTarget) return directTarget;
    if (doc && typeof doc.elementFromPoint === "function") {
      const x = Number(event.clientX);
      const y = Number(event.clientY);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        return doc.elementFromPoint(x, y);
      }
    }
    return null;
  }

  function handlePointerMove(event = {}) {
    if (!rootElement || !doc) return false;
    const candidate = getHitCandidate(event);
    const resolved = resolveRegistryTarget(rootElement, registry, mode, candidate);
    if (!resolved) {
      clearHoverFrame();
      return false;
    }
    return renderHoverFrame(resolved.node, resolved.entry);
  }

  function handlePointerSelect(event = {}) {
    if (!rootElement || !doc) return false;
    const candidate = getHitCandidate(event);
    const resolved = resolveRegistryTarget(rootElement, registry, mode, candidate);
    if (!resolved) {
      return false;
    }
    return renderSelectedFrame(resolved.node, resolved.entry);
  }

  function mount(nextRootElement, nextRegistry = registry) {
    if (!nextRootElement || typeof nextRootElement !== "object") return false;
    const nextDoc = nextRootElement.ownerDocument || globalThis.document;
    if (!nextDoc || typeof nextDoc.createElement !== "function") return false;

    rootElement = nextRootElement;
    doc = nextDoc;
    registry = Array.isArray(nextRegistry) ? nextRegistry : [];

    const overlay = ensureOverlayRoot();
    if (!overlay) return false;
    const mountHost = doc.body || rootElement;
    if (overlay.parentElement !== mountHost && typeof mountHost.append === "function") {
      if (overlay.parentElement?.removeChild) {
        overlay.parentElement.removeChild(overlay);
      }
      mountHost.append(overlay);
    }

    if (!pointerMoveHandler && typeof doc.addEventListener === "function") {
      pointerMoveHandler = (event) => handlePointerMove(event);
      doc.addEventListener("pointermove", pointerMoveHandler, true);
    }

    if (!pointerDownHandler && typeof doc.addEventListener === "function") {
      pointerDownHandler = (event) => handlePointerSelect(event);
      doc.addEventListener("pointerdown", pointerDownHandler, true);
      doc.addEventListener("click", pointerDownHandler, true);
    }

    if (!scrollHandler && typeof doc.addEventListener === "function") {
      scrollHandler = () => refreshOverlay();
      doc.addEventListener("scroll", scrollHandler, true);
    }

    const mountWindow = nextDoc.defaultView || globalThis.window || null;
    if (!resizeHandler && mountWindow && typeof mountWindow.addEventListener === "function") {
      resizeHandler = () => refreshOverlay();
      mountWindow.addEventListener("resize", resizeHandler, true);
    }

    return true;
  }

  function refreshFrames() {
    return syncOverlay();
  }

  function refreshSelectedFrame() {
    return syncOverlay();
  }

  function refreshHoverFrame() {
    return syncOverlay();
  }

  function unmount() {
    clearHoverFrame();
    clearSelectedFrame();
    if (doc && pointerMoveHandler && typeof doc.removeEventListener === "function") {
      doc.removeEventListener("pointermove", pointerMoveHandler, true);
    }
    if (doc && pointerDownHandler && typeof doc.removeEventListener === "function") {
      doc.removeEventListener("pointerdown", pointerDownHandler, true);
      doc.removeEventListener("click", pointerDownHandler, true);
    }
    if (doc && scrollHandler && typeof doc.removeEventListener === "function") {
      doc.removeEventListener("scroll", scrollHandler, true);
    }
    const mountWindow = doc?.defaultView || globalThis.window || null;
    if (mountWindow && resizeHandler && typeof mountWindow.removeEventListener === "function") {
      mountWindow.removeEventListener("resize", resizeHandler, true);
    }
    pointerMoveHandler = null;
    pointerDownHandler = null;
    scrollHandler = null;
    resizeHandler = null;
    if (overlayRoot?.parentElement?.removeChild) {
      overlayRoot.parentElement.removeChild(overlayRoot);
    }
    overlayRoot = null;
    hoverFrame = null;
    selectedFrame = null;
    rootElement = null;
    doc = null;
    return true;
  }

  function setMode(nextMode) {
    mode = normalizeMode(nextMode);
    return mode;
  }

  function setRegistry(nextRegistry) {
    registry = Array.isArray(nextRegistry) ? nextRegistry : [];
    return registry;
  }

  return {
    mount,
    unmount,
    handlePointerMove,
    getMode: () => mode,
    setMode,
    getRegistry: () => registry,
    setRegistry,
    getHoverFrame: () => hoverFrame,
    getSelectedFrame: () => selectedFrame,
    getOverlayRoot: () => overlayRoot,
    getCurrentHover: () => currentHover,
    getCurrentSelected: () => currentSelected,
    clearHoverFrame,
    clearSelectedFrame,
    refreshFrames,
    refreshSelectedFrame,
    refreshHoverFrame,
    refreshOverlay,
    resolveRegistryTarget: (candidateNode) => resolveRegistryTarget(rootElement, registry, mode, candidateNode),
    handlePointerSelect,
  };
}

export { normalizeMode, resolveRegistryTarget };
