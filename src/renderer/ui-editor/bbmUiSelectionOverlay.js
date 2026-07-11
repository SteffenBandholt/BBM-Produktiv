const DEFAULT_Z_INDEX = 2147483200;

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

export function createBbmUiSelectionOverlay(options = {}) {
  const zIndex = Number.isFinite(options.zIndex) ? options.zIndex : DEFAULT_Z_INDEX;
  let doc = null;
  let root = null;
  let frame = null;
  let hint = null;

  function ensureRoot(ownerDocument) {
    doc = ownerDocument || doc;
    if (!doc || typeof doc.createElement !== "function") return null;
    if (root?.isConnected) return root;
    root = doc.createElement("div");
    root.setAttribute("data-bbm-ui-selection-overlay-root", "true");
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
    frame.setAttribute("data-bbm-ui-selection-hover-frame", "true");
    frame.style.position = "fixed";
    frame.style.boxSizing = "border-box";
    frame.style.border = "2px solid rgba(37, 99, 235, 0.95)";
    frame.style.background = "rgba(37, 99, 235, 0.08)";
    frame.style.pointerEvents = "none";
    frame.style.borderRadius = "6px";

    const label = doc.createElement("div");
    label.setAttribute("data-bbm-ui-selection-hover-label", "true");
    label.style.position = "absolute";
    label.style.left = "0";
    label.style.top = "-24px";
    label.style.maxWidth = "360px";
    label.style.whiteSpace = "nowrap";
    label.style.overflow = "hidden";
    label.style.textOverflow = "ellipsis";
    label.style.background = "rgba(30, 41, 59, 0.95)";
    label.style.color = "#fff";
    label.style.font = "12px/1.35 system-ui, sans-serif";
    label.style.padding = "3px 6px";
    label.style.borderRadius = "4px";
    label.style.pointerEvents = "none";
    frame.appendChild(label);
    root.appendChild(frame);
    return frame;
  }

  function showHint(text = "Maus ueber einen BBM-Bereich bewegen und anklicken. Esc beendet den Auswahlmodus.") {
    if (!root || !doc) return;
    if (!hint?.isConnected) {
      hint = doc.createElement("div");
      hint.setAttribute("data-bbm-ui-selection-hint", "true");
      hint.style.position = "fixed";
      hint.style.left = "50%";
      hint.style.bottom = "18px";
      hint.style.transform = "translateX(-50%)";
      hint.style.background = "rgba(15, 23, 42, 0.94)";
      hint.style.color = "#fff";
      hint.style.font = "13px/1.4 system-ui, sans-serif";
      hint.style.padding = "8px 10px";
      hint.style.borderRadius = "8px";
      hint.style.pointerEvents = "none";
      root.appendChild(hint);
    }
    hint.textContent = text;
  }

  return {
    mount(ownerDocument) {
      ensureRoot(ownerDocument);
      showHint();
    },
    updateHover({ targetElement, label }) {
      if (!targetElement || !root) {
        this.clearHover();
        return;
      }
      const rect = readRect(targetElement);
      const node = ensureFrame();
      if (!node) return;
      node.style.left = `${rect.left}px`;
      node.style.top = `${rect.top}px`;
      node.style.width = `${rect.width}px`;
      node.style.height = `${rect.height}px`;
      const labelNode = node.firstChild;
      if (labelNode) labelNode.textContent = String(label || "");
    },
    clearHover() {
      if (frame?.parentNode) frame.parentNode.removeChild(frame);
      frame = null;
    },
    destroy() {
      if (root?.parentNode) root.parentNode.removeChild(root);
      root = null;
      frame = null;
      hint = null;
      doc = null;
    },
    getState() {
      return { mounted: Boolean(root?.isConnected), hovering: Boolean(frame?.isConnected) };
    },
  };
}
