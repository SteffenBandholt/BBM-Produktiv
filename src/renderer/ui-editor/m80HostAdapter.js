import { getM80RegistryEntry, listM80RegistryScopes } from "./m80Registry.js";
import {
  applyM80State,
  beginM80PilotRender,
  clearM80VisualState,
  completeM80PilotRender,
  getM80IdFromTarget,
  getM80Ref,
  registerM80Ref,
  resetM80PilotWorkingStatesForDiagnostic,
  snapshotM80State,
} from "./m80Refs.js";

const ALLOWED_ACTIONS = new Set(["getRegistry", "getLayoutState", "submitChange"]);
const FORBIDDEN_KEYS = new Set(["fachDaten", "businessData", "domainData", "recordId", "entity", "database", "sql", "status", "responsible", "dueDate", "photos", "rows", "values"]);
let selectionMode = false;
let selectedId = null;

function hasForbidden(value) {
  if (Array.isArray(value)) return value.some(hasForbidden);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => FORBIDDEN_KEYS.has(key) || hasForbidden(nested));
}
function failure(request, errorCode, message, previousState = null, rollbackSucceeded = true) {
  return { success: false, changeId: String(request?.changeId || ""), elementId: String(request?.elementId || ""), operation: String(request?.operation || ""), errorCode, message, previousState, newState: previousState, rollbackSucceeded };
}
function number(value, field, { positive = false, nonNegative = false } = {}) {
  const result = Number(value);
  if (!Number.isFinite(result) || (positive && result <= 0) || (nonNegative && result < 0)) throw Object.assign(new Error(`Ungültiger Layoutwert: ${field}`), { code: "electron_editor_message_invalid" });
  return result;
}

function desiredState(previous, operation, payload) {
  const next = { ...previous };
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || hasForbidden(payload)) throw Object.assign(new Error("Layout-Payload ist ungültig."), { code: "electron_editor_message_invalid" });
  if (operation === "move") {
    const keys = Object.keys(payload); if (!keys.length || keys.some((key) => !["x", "y"].includes(key))) throw new Error("move-Payload ist ungültig.");
    if (Object.hasOwn(payload, "x")) next.x = number(payload.x, "x");
    if (Object.hasOwn(payload, "y")) next.y = number(payload.y, "y");
  } else if (operation === "resize") {
    const keys = Object.keys(payload); if (!keys.length || keys.some((key) => !["width", "height"].includes(key))) throw new Error("resize-Payload ist ungültig.");
    if (Object.hasOwn(payload, "width")) next.width = number(payload.width, "width", { positive: true });
    if (Object.hasOwn(payload, "height")) next.height = number(payload.height, "height", { positive: true });
  } else if (operation === "resizeWidth") {
    if (Object.keys(payload).length !== 1 || !Object.hasOwn(payload, "width")) throw new Error("resizeWidth-Payload ist ungültig.");
    next.width = number(payload.width, "width", { positive: true });
  } else if (operation === "resizeHeight") {
    if (Object.keys(payload).length !== 1 || !Object.hasOwn(payload, "height")) throw new Error("resizeHeight-Payload ist ungültig.");
    next.height = number(payload.height, "height", { positive: true });
  } else if (operation === "textMove") {
    if (Object.keys(payload).length !== 1 || !payload.text || typeof payload.text !== "object") throw new Error("textMove-Payload ist ungültig.");
    const keys = Object.keys(payload.text); if (!keys.length || keys.some((key) => !["offsetX", "offsetY"].includes(key))) throw new Error("textMove-Payload ist ungültig.");
    if (Object.hasOwn(payload.text, "offsetX")) next.textOffsetX = number(payload.text.offsetX, "offsetX", { nonNegative: true });
    if (Object.hasOwn(payload.text, "offsetY")) next.textOffsetY = number(payload.text.offsetY, "offsetY", { nonNegative: true });
  } else if (operation === "textResize") {
    if (Object.keys(payload).length !== 1 || !payload.text || Object.keys(payload.text).length !== 1 || !Object.hasOwn(payload.text, "fontSize")) throw new Error("textResize-Payload ist ungültig.");
    next.fontSize = number(payload.text.fontSize, "fontSize", { positive: true });
  } else if (operation === "setVisibility") {
    if (Object.keys(payload).length !== 1 || typeof payload.visible !== "boolean") throw new Error("setVisibility-Payload ist ungültig.");
    next.visible = payload.visible;
  } else throw Object.assign(new Error("Operation ist nicht erlaubt."), { code: "electron_operation_not_allowed" });
  return next;
}

function submitChange(changeRequest, scopeId) {
  const request = changeRequest && typeof changeRequest === "object" ? changeRequest : {};
  const entry = getM80RegistryEntry(request.elementId);
  if (!entry) return failure(request, "electron_element_not_found", "Element ist nicht registriert.");
  if (scopeId && !belongsToScope(entry, scopeId)) return failure(request, "electron_registry_invalid", "Scope passt nicht zum Element.");
  if (entry.lockedOps.includes(request.operation)) return failure(request, "electron_operation_locked", "Operation ist gesperrt.");
  if (!entry.allowedOps.includes(request.operation)) return failure(request, "electron_operation_not_allowed", "Operation ist nicht freigegeben.");
  const previous = snapshotM80State(entry.id);
  if (!previous) return failure(request, "electron_element_not_found", "Explizite Elementreferenz fehlt.");
  try {
    const ref = getM80Ref(entry.id);
    if (ref?.element?.dataset?.uiEditorFailNextApply === "true") {
      delete ref.element.dataset.uiEditorFailNextApply;
      throw Object.assign(new Error("Kontrollierter Diagnosefehler."), { code: "electron_change_apply_failed" });
    }
    const desired = desiredState(previous, request.operation, request.payload);
    const readback = applyM80State(entry.id, desired);
    return { success: true, changeId: request.changeId, elementId: entry.id, operation: request.operation, errorCode: null, message: "Layoutänderung angewandt und zurückgelesen.", previousState: previous, newState: readback, rollbackSucceeded: true };
  } catch (error) {
    try {
      const restored = applyM80State(entry.id, previous);
      return failure(request, error?.code || "electron_change_apply_failed", "Layoutänderung wurde sicher abgewiesen und zurückgerollt.", restored, true);
    } catch (_rollbackError) {
      return failure(request, "electron_change_rollback_failed", "Layoutänderung und Rollback sind fehlgeschlagen.", previous, false);
    }
  }
}

function belongsToScope(entry, scopeId) {
  let current = entry;
  while (current?.parentId) current = getM80RegistryEntry(current.parentId);
  return current?.id === scopeId;
}

function layoutPayload() {
  return listM80RegistryScopes().map((scope) => ({
    scopeId: scope.scopeId,
    capturedAt: new Date().toISOString(),
    elements: scope.elements.map((entry) => snapshotM80State(entry.id)).filter(Boolean),
  }));
}

function overlay() {
  let value = document.querySelector("[data-bbm-ui-editor-overlay]");
  if (!value) {
    value = document.createElement("div");
    value.setAttribute("data-bbm-ui-editor-overlay", "true");
    value.style.cssText = "position:fixed;pointer-events:none;z-index:2147483000;border:3px solid #2563eb;background:rgba(37,99,235,.10);box-shadow:0 0 0 2px rgba(255,255,255,.9);display:none";
    document.body.appendChild(value);
  }
  return value;
}

export function highlightM80Element(elementId) {
  const ref = getM80Ref(elementId);
  if (!ref) throw Object.assign(new Error("Element kann nicht markiert werden."), { code: "electron_highlight_failed" });
  selectedId = elementId;
  const rect = ref.element.getBoundingClientRect();
  const value = overlay();
  value.style.left = `${rect.left}px`; value.style.top = `${rect.top}px`; value.style.width = `${rect.width}px`; value.style.height = `${rect.height}px`; value.style.display = "block";
  return true;
}

function stopSelection() { selectionMode = false; document.removeEventListener("click", onSelectionClick, true); }
async function onSelectionClick(event) {
  if (!selectionMode) return;
  const id = getM80IdFromTarget(event.target);
  if (!id) return;
  event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  stopSelection();
  selectedId = id;
  highlightM80Element(id);
  await window.uiEditor?.sendTargetEvent?.({ action: "targetSelectionChanged", scopeId: rootScope(id), elementId: id });
}
function rootScope(id) { let entry = getM80RegistryEntry(id); while (entry?.parentId) entry = getM80RegistryEntry(entry.parentId); return entry?.id || ""; }

export function handleM80EditorEvent(event = {}) {
  const action = String(event.action || "");
  if (action === "beginTargetSelection") { stopSelection(); selectionMode = true; document.addEventListener("click", onSelectionClick, true); return { ok: true }; }
  if (action === "cancelTargetSelection") { stopSelection(); return { ok: true }; }
  if (action === "highlightElement") { highlightM80Element(event.elementId); return { ok: true }; }
  if (action === "editorClosed") { stopSelection(); selectedId = null; clearM80VisualState(); return { ok: true }; }
  return { ok: false, errorCode: "electron_editor_message_invalid" };
}

export function handleM80EditorRequest(request = {}) {
  const action = String(request.action || "");
  if (!ALLOWED_ACTIONS.has(action)) throw Object.assign(new Error("Unbekannte Editoranfrage."), { code: "electron_editor_message_invalid" });
  if (action === "getRegistry") return { registryScopes: listM80RegistryScopes() };
  if (action === "getLayoutState") return { scopeStates: layoutPayload() };
  return { changeResult: submitChange(request.changeRequest, request.scopeId) };
}

export function clearM80EditorInteraction() { stopSelection(); selectedId = null; clearM80VisualState(); }
export function getM80InteractionStatus() { return { selectionMode, selectedId, scopeStates: layoutPayload() }; }
export { beginM80PilotRender, completeM80PilotRender, registerM80Ref, resetM80PilotWorkingStatesForDiagnostic };
