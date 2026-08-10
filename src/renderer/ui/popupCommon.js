import { applyPopupCardStyle } from "./popupButtonStyles.js";
import { OVERLAY } from "./zIndex.js";

const CLOSE_HANDLERS = Symbol("bbm.popup.closeHandlers");
const PROTOKOLL_HEADER_SELECTOR =
  '[data-bbm-tops-screen="true"] [data-bbm-tops-header-v2="true"]';
const POPUP_VIEWPORT_MARGIN = 12;
const PROTOKOLL_HEADER_GAP = 8;

function getVisibleProtokollHeaderBottom() {
  if (typeof document === "undefined" || typeof document.querySelector !== "function") return 0;
  const header = document.querySelector(PROTOKOLL_HEADER_SELECTOR);
  if (!header || typeof header.getBoundingClientRect !== "function") return 0;

  const rect = header.getBoundingClientRect();
  const height = Number(rect?.height) || 0;
  const bottom = Number(rect?.bottom) || 0;
  if (height <= 0 || bottom <= 0) return 0;

  const viewportHeight = Number(globalThis.window?.innerHeight) || 0;
  if (viewportHeight > 0 && Number(rect?.top) >= viewportHeight) return 0;
  return Math.max(0, Math.ceil(viewportHeight > 0 ? Math.min(bottom, viewportHeight) : bottom));
}

export function syncPopupOverlayViewport(overlay) {
  if (!overlay?.style) return { context: "window", top: 0 };

  const headerBottom = getVisibleProtokollHeaderBottom();
  const usesProtokollViewport = headerBottom > 0;
  overlay.style.top = usesProtokollViewport ? `${headerBottom}px` : "0";
  overlay.style.height = usesProtokollViewport
    ? `calc(100vh - ${headerBottom}px)`
    : "100vh";
  overlay.style.padding = usesProtokollViewport
    ? `${PROTOKOLL_HEADER_GAP}px ${POPUP_VIEWPORT_MARGIN}px`
    : `${POPUP_VIEWPORT_MARGIN}px`;
  overlay.style.boxSizing = "border-box";
  overlay.style.overflow = "auto";
  overlay.style.alignItems = "safe center";
  overlay.dataset.bbmPopupViewport = usesProtokollViewport ? "protokoll" : "window";
  return {
    context: overlay.dataset.bbmPopupViewport,
    top: headerBottom,
  };
}

function registerPopupViewportSync(overlay) {
  const sync = () => syncPopupOverlayViewport(overlay);
  sync();
  overlay.addEventListener?.("focus", sync);

  const win = globalThis.window;
  win?.addEventListener?.("resize", sync);

  const cleanup = () => {
    overlay.removeEventListener?.("focus", sync);
    win?.removeEventListener?.("resize", sync);
  };
  const extra = overlay[CLOSE_HANDLERS] || [];
  extra.push(cleanup);
  overlay[CLOSE_HANDLERS] = extra;
}

export function createPopupOverlay({ background = "rgba(0,0,0,0.25)", zIndex = OVERLAY } = {}) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.left = "0";
  overlay.style.top = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = background;
  overlay.style.display = "none";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = String(zIndex);
  overlay.tabIndex = -1;
  overlay.dataset.bbmPopupOverlay = "1";
  registerPopupViewportSync(overlay);
  return overlay;
}

export function stylePopupCard(modal, { width = "min(760px, calc(100vw - 24px))", maxHeight = "calc(100vh - 24px)" } = {}) {
  applyPopupCardStyle(modal);
  modal.style.width = width;
  modal.style.maxHeight = maxHeight;
  modal.style.display = "flex";
  modal.style.flexDirection = "column";
  modal.style.overflow = "hidden";
}

export function registerPopupCloseHandlers(overlay, onClose, { closeOnBackdrop = true } = {}) {
  if (!overlay || typeof onClose !== "function") return () => {};

  const handleClick = (event) => {
    if (closeOnBackdrop && event.target === overlay) {
      onClose();
    }
  };

  const handleKey = (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onClose();
  };

  overlay.addEventListener("mousedown", handleClick);
  overlay.addEventListener("keydown", handleKey);

  const cleanup = () => {
    overlay.removeEventListener("mousedown", handleClick);
    overlay.removeEventListener("keydown", handleKey);
  };

  const extra = overlay[CLOSE_HANDLERS] || [];
  extra.push(cleanup);
  overlay[CLOSE_HANDLERS] = extra;

  return cleanup;
}

export function cleanupPopupHandlers(overlay) {
  const handlers = overlay?.[CLOSE_HANDLERS] || [];
  for (const fn of handlers) {
    if (typeof fn === "function") fn();
  }
  overlay[CLOSE_HANDLERS] = [];
}
