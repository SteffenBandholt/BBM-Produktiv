import { getBbmUiElementRef, getBbmUiElementRefStatus } from "./bbmUiElementRefs.js";
import { createBbmUiSelectionOverlay } from "./bbmUiSelectionOverlay.js";

const SELECTABLE_ELEMENT_IDS = Object.freeze([
  "bbm.main.navigation",
  "bbm.main.header",
  "bbm.main.content",
  "bbm.main.shell",
]);

function isEventInsidePanel(eventTarget, panelRoot) {
  return Boolean(panelRoot && eventTarget && (eventTarget === panelRoot || panelRoot.contains?.(eventTarget)));
}

function rectArea(element) {
  const rect = typeof element?.getBoundingClientRect === "function" ? element.getBoundingClientRect() : null;
  const width = Math.max(0, Number(rect?.width) || 0);
  const height = Math.max(0, Number(rect?.height) || 0);
  return width * height;
}

function formatMetaLabel(elementId, getElementMeta) {
  const meta = typeof getElementMeta === "function" ? getElementMeta(elementId) : null;
  const label = String(meta?.label || elementId).trim();
  return `${label} · ${elementId}`;
}

export function createBbmUiElementSelectionController(options = {}) {
  const overlay = options.overlay || createBbmUiSelectionOverlay(options.overlayOptions || {});
  const selectElement = typeof options.selectElement === "function" ? options.selectElement : async () => {};
  const getElementMeta = typeof options.getElementMeta === "function" ? options.getElementMeta : () => null;
  const onStateChange = typeof options.onStateChange === "function" ? options.onStateChange : () => {};
  const onSelection = typeof options.onSelection === "function" ? options.onSelection : () => {};
  let active = false;
  let shellElement = null;
  let ownerDocument = null;
  let ownerWindow = null;
  let hoveredElementId = "";
  let hoveredElement = null;

  function getPanelRoot() {
    return typeof options.getPanelRoot === "function" ? options.getPanelRoot() : options.panelRoot || null;
  }

  function resolveTarget(eventTarget) {
    if (!eventTarget || isEventInsidePanel(eventTarget, getPanelRoot())) return null;
    const matches = [];
    for (const elementId of SELECTABLE_ELEMENT_IDS) {
      const ref = getBbmUiElementRef(elementId);
      if (!ref || ref === getPanelRoot()) continue;
      if (ref === eventTarget || ref.contains?.(eventTarget)) {
        matches.push({ elementId, element: ref, area: rectArea(ref) });
      }
    }
    matches.sort((a, b) => a.area - b.area || SELECTABLE_ELEMENT_IDS.indexOf(a.elementId) - SELECTABLE_ELEMENT_IDS.indexOf(b.elementId));
    return matches[0] || null;
  }

  function clearHover() {
    hoveredElementId = "";
    hoveredElement = null;
    overlay.clearHover();
  }

  function updateHoverForTarget(eventTarget) {
    const hit = resolveTarget(eventTarget);
    if (!hit) {
      clearHover();
      return;
    }
    if (hit.elementId === hoveredElementId && hit.element === hoveredElement) return;
    hoveredElementId = hit.elementId;
    hoveredElement = hit.element;
    overlay.updateHover({ targetElement: hit.element, label: formatMetaLabel(hit.elementId, getElementMeta) });
  }

  function refreshHover() {
    if (!hoveredElementId || !hoveredElement) return;
    overlay.updateHover({ targetElement: hoveredElement, label: formatMetaLabel(hoveredElementId, getElementMeta) });
  }

  function stopInternal() {
    if (!active) return;
    shellElement?.removeEventListener?.("pointermove", handlePointerMove);
    shellElement?.removeEventListener?.("click", handleClick, true);
    ownerDocument?.removeEventListener?.("keydown", handleKeyDown, true);
    ownerDocument?.removeEventListener?.("scroll", handleViewportChange, true);
    ownerWindow?.removeEventListener?.("resize", handleViewportChange);
    active = false;
    shellElement = null;
    ownerDocument = null;
    ownerWindow = null;
    clearHover();
    overlay.destroy();
    onStateChange(getState());
  }

  function handlePointerMove(event) {
    try {
      updateHoverForTarget(event?.target);
    } catch (error) {
      stopInternal();
      throw error;
    }
  }

  function handleClick(event) {
    if (!active) return;
    const hit = resolveTarget(event?.target);
    if (!hit) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (typeof event?.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    Promise.resolve(selectElement({ elementId: hit.elementId }))
      .then(() => onSelection({ elementId: hit.elementId, meta: getElementMeta(hit.elementId) }))
      .catch((error) => {
        stopInternal();
        throw error;
      });
  }

  function handleKeyDown(event) {
    if (event?.key === "Escape") stopInternal();
  }

  function handleViewportChange() {
    refreshHover();
  }

  function getState() {
    const refStatus = getBbmUiElementRefStatus();
    return {
      active,
      hoveredElementId,
      boundTargetCount: SELECTABLE_ELEMENT_IDS.filter((elementId) => refStatus.registeredIds.includes(elementId)).length,
      unavailableIds: refStatus.missingIds,
    };
  }

  return {
    start() {
      if (active) return getState();
      shellElement = getBbmUiElementRef("bbm.main.shell");
      if (!shellElement) return getState();
      ownerDocument = shellElement.ownerDocument || null;
      ownerWindow = ownerDocument?.defaultView || null;
      hoveredElementId = "";
      hoveredElement = null;
      overlay.mount(ownerDocument);
      shellElement.addEventListener("pointermove", handlePointerMove);
      shellElement.addEventListener("click", handleClick, true);
      ownerDocument?.addEventListener?.("keydown", handleKeyDown, true);
      ownerDocument?.addEventListener?.("scroll", handleViewportChange, true);
      ownerWindow?.addEventListener?.("resize", handleViewportChange);
      active = true;
      onStateChange(getState());
      return getState();
    },
    stop() {
      stopInternal();
      return getState();
    },
    destroy() {
      stopInternal();
      return getState();
    },
    isActive() {
      return active;
    },
    getState,
    resolveTargetForTest: resolveTarget,
  };
}
