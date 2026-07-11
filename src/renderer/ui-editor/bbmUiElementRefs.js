const elementRefs = new Map();
const allowedElementIds = new Set([
  "bbm.main.shell",
  "bbm.main.navigation",
  "bbm.main.header",
  "bbm.main.content",
  "bbm.main.actions",
]);

function normalizeElementId(elementId) {
  return String(elementId == null ? "" : elementId).trim();
}

function assertKnownElementId(elementId) {
  const normalizedElementId = normalizeElementId(elementId);
  if (!allowedElementIds.has(normalizedElementId)) {
    throw new Error(`BBM_UI_ELEMENT_REF_UNKNOWN: ${normalizedElementId || "<empty>"}`);
  }
  return normalizedElementId;
}

function isHTMLElementInstance(element) {
  if (!element || typeof element !== "object") return false;
  const HTMLElementCtor = element.ownerDocument?.defaultView?.HTMLElement || globalThis.HTMLElement;
  return typeof HTMLElementCtor === "function" && element instanceof HTMLElementCtor;
}

function cloneStatus() {
  const registeredIds = [...elementRefs.keys()];
  const expectedIds = [...allowedElementIds];
  return {
    registeredIds,
    missingIds: expectedIds.filter((elementId) => !elementRefs.has(elementId)),
    count: registeredIds.length,
    expectedCount: expectedIds.length,
  };
}

export function registerBbmUiElementRef(elementId, element) {
  const normalizedElementId = assertKnownElementId(elementId);
  if (!isHTMLElementInstance(element)) {
    throw new Error(`BBM_UI_ELEMENT_REF_INVALID_ELEMENT: ${normalizedElementId}`);
  }
  elementRefs.set(normalizedElementId, element);
  return getBbmUiElementRef(normalizedElementId);
}

export function getBbmUiElementRef(elementId) {
  const normalizedElementId = assertKnownElementId(elementId);
  return elementRefs.get(normalizedElementId) || null;
}

export function unregisterBbmUiElementRef(elementId) {
  const normalizedElementId = assertKnownElementId(elementId);
  elementRefs.delete(normalizedElementId);
}

export function clearBbmUiElementRefs() {
  elementRefs.clear();
}

export function getBbmUiElementRefStatus() {
  return cloneStatus();
}
