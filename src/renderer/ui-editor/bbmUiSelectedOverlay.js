import { getBbmUiElementRef } from "./bbmUiElementRefs.js";

const DEFAULT_Z_INDEX = 2147483210;

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readRect(targetElement) {
  const rect = typeof targetElement?.getBoundingClientRect === "function" ? targetElement.getBoundingClientRect() : null;
  return {
    left: toNumber(rect?.left),
    top: toNumber(rect?.top),
    width: Math.max(0, toNumber(rect?.width)),
    height: Math.max(0, toNumber(rect?.height)),
  };
}

function getOwnerDocument(targetElement) {
  return targetElement?.ownerDocument || null;
}

function formatSelectedLabel(selectedElement) {
  const elementId = String(selectedElement?.elementId || "").trim();
  const label = String(selectedElement?.label || elementId).trim();
  return `Ausgewählt: ${label} · ${elementId}`;
}

export function createBbmUiSelectedOverlay(options = {}) {
  const zIndex = Number.isFinite(options.zIndex) ? options.zIndex : DEFAULT_Z_INDEX;
  let doc = null;
  let win = null;
  let root = null;
  let frame = null;
  let labelNode = null;
  let targetElement = null;
  let selectedElement = null;
  let listenersInstalled = false;

  function ensureRoot(ownerDocument) {
    doc = ownerDocument || doc;
    if (!doc || typeof doc.createElement !== "function") return null;
    if (root?.isConnected) return root;
    root = doc.createElement("div");
    root.setAttribute("data-bbm-ui-selected-overlay-root", "true");
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.pointerEvents = "none";
    root.style.zIndex = String(zIndex);
    root.style.overflow = "hidden";
    const mount = doc.body || doc.documentElement;
    if (mount?.appendChild) mount.appendChild(root);
    return root;
  }

  function ensureFrame() {
    if (!root || !doc) return null;
    if (frame?.isConnected) return frame;
    frame = doc.createElement("div");
    frame.setAttribute("data-bbm-ui-selected-frame", "true");
    frame.style.position = "fixed";
    frame.style.boxSizing = "border-box";
    frame.style.border = "2px solid rgba(249, 115, 22, 0.98)";
    frame.style.background = "rgba(249, 115, 22, 0.10)";
    frame.style.pointerEvents = "none";
    frame.style.borderRadius = "6px";

    labelNode = doc.createElement("div");
    labelNode.setAttribute("data-bbm-ui-selected-label", "true");
    labelNode.style.position = "absolute";
    labelNode.style.left = "0";
    labelNode.style.top = "-24px";
    labelNode.style.maxWidth = "420px";
    labelNode.style.whiteSpace = "nowrap";
    labelNode.style.overflow = "hidden";
    labelNode.style.textOverflow = "ellipsis";
    labelNode.style.background = "rgba(154, 52, 18, 0.96)";
    labelNode.style.color = "#fff";
    labelNode.style.font = "12px/1.35 system-ui, sans-serif";
    labelNode.style.padding = "3px 6px";
    labelNode.style.borderRadius = "4px";
    labelNode.style.pointerEvents = "none";
    frame.appendChild(labelNode);
    root.appendChild(frame);
    return frame;
  }

  function updatePosition() {
    if (!targetElement || !frame?.isConnected) return;
    const rect = readRect(targetElement);
    frame.style.left = `${rect.left}px`;
    frame.style.top = `${rect.top}px`;
    frame.style.width = `${rect.width}px`;
    frame.style.height = `${rect.height}px`;
    if (labelNode) labelNode.textContent = formatSelectedLabel(selectedElement);
  }

  function installListeners() {
    if (listenersInstalled || !doc) return;
    win = doc.defaultView || null;
    doc.addEventListener?.("scroll", updatePosition, true);
    win?.addEventListener?.("resize", updatePosition);
    listenersInstalled = true;
  }

  function removeListeners() {
    if (!listenersInstalled) return;
    doc?.removeEventListener?.("scroll", updatePosition, true);
    win?.removeEventListener?.("resize", updatePosition);
    listenersInstalled = false;
    win = null;
  }

  function clear() {
    removeListeners();
    if (root?.parentNode) root.parentNode.removeChild(root);
    root = null;
    frame = null;
    labelNode = null;
    targetElement = null;
    selectedElement = null;
    doc = null;
  }

  return {
    sync(nextSelectedElement) {
      const elementId = String(nextSelectedElement?.elementId || "").trim();
      if (!elementId) {
        clear();
        return false;
      }
      let nextTargetElement = null;
      try {
        nextTargetElement = getBbmUiElementRef(elementId);
      } catch (_error) {
        clear();
        return false;
      }
      if (!nextTargetElement) {
        clear();
        return false;
      }
      const ownerDocument = getOwnerDocument(nextTargetElement);
      if (!ownerDocument) {
        clear();
        return false;
      }
      selectedElement = nextSelectedElement;
      targetElement = nextTargetElement;
      ensureRoot(ownerDocument);
      ensureFrame();
      installListeners();
      updatePosition();
      return true;
    },
    clear,
    destroy() {
      clear();
    },
    getState() {
      return {
        mounted: Boolean(root?.isConnected),
        showing: Boolean(frame?.isConnected),
        elementId: String(selectedElement?.elementId || ""),
        listenersInstalled,
      };
    },
    updatePositionForTest: updatePosition,
  };
}
