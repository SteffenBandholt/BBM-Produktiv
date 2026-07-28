import { getM80RegistryEntry, m80EditorAttributes } from "./m80Registry.js";

const refs = new Map();
const elementIds = new WeakMap();
const workingStates = new Map();
const HIDDEN_CLASS = "bbm-ui-editor-hidden";

function finite(value, fallback = 0) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
function positive(value, fallback) { const number = finite(value, fallback); return number > 0 ? number : fallback; }
function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }
function px(value) { return `${Math.round(Number(value) * 1000) / 1000}px`; }
function isElementRef(value) { return Boolean(value) && typeof value.setAttribute === "function"; }
function rectOf(element) { return typeof element.getBoundingClientRect === "function" ? element.getBoundingClientRect() : { left: 0, top: 0, width: finite(parseFloat(element.style?.width)), height: finite(parseFloat(element.style?.height)) }; }
function styleOf(element) { return globalThis.window?.getComputedStyle?.(element) || element.style || {}; }
function hasClass(element, className) { return element.classList?.contains?.(className) ?? String(element.className || "").split(/\s+/).includes(className); }
function toggleClass(element, className, enabled) {
  if (element.classList?.toggle) { element.classList.toggle(className, enabled); return; }
  const names = new Set(String(element.className || "").split(/\s+/).filter(Boolean));
  if (enabled) names.add(className); else names.delete(className);
  element.className = [...names].join(" ");
}
function setCustomProperty(style, name, value) { if (typeof style?.setProperty === "function") style.setProperty(name, value); else if (style) style[name] = value; }
function getCustomProperty(style, name) { return typeof style?.getPropertyValue === "function" ? style.getPropertyValue(name) : style?.[name]; }
function applyAttributes(target, id) {
  for (const [name, value] of Object.entries(m80EditorAttributes(id))) target.setAttribute(name, value);
}

function readGeneric(element, id) {
  const rect = rectOf(element);
  const style = styleOf(element);
  return {
    elementId: id,
    x: finite(element.dataset.uiEditorX),
    y: finite(element.dataset.uiEditorY),
    width: positive(rect.width, positive(parseFloat(style.width), 1)),
    height: positive(rect.height, positive(parseFloat(style.height), 1)),
    textOffsetX: finite(element.dataset.uiEditorTextX, finite(parseFloat(style.paddingLeft))),
    textOffsetY: finite(element.dataset.uiEditorTextY, finite(parseFloat(style.paddingTop))),
    fontSize: positive(parseFloat(style.fontSize), 12),
    visible: !hasClass(element, HIDDEN_CLASS),
  };
}

function bounded(entry, field, value, fallback) {
  const baseline = entry?.baseline || {};
  const capitalized = field[0].toUpperCase() + field.slice(1);
  return clamp(positive(value, fallback), positive(baseline[`min${capitalized}`], 1), positive(baseline[`max${capitalized}`], Number.MAX_SAFE_INTEGER));
}

function applyGeneric(element, state, entry) {
  const operations = new Set(entry.allowedOps);
  if (operations.has("move")) {
    element.dataset.uiEditorX = String(finite(state.x));
    element.dataset.uiEditorY = String(finite(state.y));
    element.style.translate = `${px(state.x)} ${px(state.y)}`;
  }
  if (operations.has("resize") || operations.has("resizeWidth")) element.style.width = px(bounded(entry, "width", state.width, 1));
  if (operations.has("resize") || operations.has("resizeHeight")) element.style.height = px(bounded(entry, "height", state.height, 1));
  if (operations.has("textMove") && state.textOffsetX !== null && state.textOffsetX !== undefined) {
    element.dataset.uiEditorTextX = String(state.textOffsetX);
    element.style.paddingLeft = px(Math.max(0, finite(state.textOffsetX)));
  }
  if (operations.has("textMove") && state.textOffsetY !== null && state.textOffsetY !== undefined) {
    element.dataset.uiEditorTextY = String(state.textOffsetY);
    element.style.paddingTop = px(Math.max(0, finite(state.textOffsetY)));
  }
  if (operations.has("textResize") && state.fontSize !== null && state.fontSize !== undefined) element.style.fontSize = px(positive(state.fontSize, 1));
  if (operations.has("setVisibility")) toggleClass(element, HIDDEN_CLASS, state.visible === false);
}

export function beginM80PilotRender() {
  refs.clear();
}

export function resetM80PilotWorkingStatesForDiagnostic() {
  refs.clear();
  workingStates.clear();
}

export function registerM80Ref(id, element, custom = {}) {
  const entry = getM80RegistryEntry(id);
  if (!entry || !isElementRef(element)) throw new Error(`Ungültige explizite M80-Referenz: ${id}`);
  applyAttributes(element, id);
  const ref = {
    id,
    entry,
    element,
    read: custom.read || (() => readGeneric(element, id)),
    apply: custom.apply || ((state) => applyGeneric(element, state, entry)),
  };
  refs.set(id, ref);
  elementIds.set(element, id);
  if (workingStates.has(id)) ref.apply(workingStates.get(id));
  return element;
}

export function completeM80PilotRender() {
  for (const ref of refs.values()) {
    if (typeof ref.element.isConnected === "boolean" && !ref.element.isConnected) continue;
    if (workingStates.has(ref.id)) ref.apply(workingStates.get(ref.id));
    const current = ref.read();
    if (!workingStates.has(ref.id)) workingStates.set(ref.id, { ...current });
  }
  if (typeof window?.dispatchEvent === "function") {
    const event = typeof CustomEvent === "function" ? new CustomEvent("bbm:m80-pilot-render-complete") : { type: "bbm:m80-pilot-render-complete" };
    window.dispatchEvent(event);
  }
}

export function registerM80TableColumnRef(id, headerCell, tableElement, cssVariable, initialWidth) {
  const entry = getM80RegistryEntry(id);
  return registerM80Ref(id, headerCell, {
    read: () => {
      const style = styleOf(headerCell);
      const rect = rectOf(headerCell);
      const width = positive(parseFloat(getCustomProperty(tableElement.style, cssVariable)), positive(rect.width, initialWidth));
      return {
        elementId: id, x: 0, y: 0, width, height: positive(rect.height, 1),
        textOffsetX: finite(headerCell.dataset.uiEditorTextX, finite(parseFloat(style.paddingLeft))),
        textOffsetY: finite(headerCell.dataset.uiEditorTextY, finite(parseFloat(style.paddingTop))),
        fontSize: positive(parseFloat(style.fontSize), 12), visible: !hasClass(headerCell, HIDDEN_CLASS),
      };
    },
    apply: (state) => {
      setCustomProperty(tableElement.style, cssVariable, px(bounded(entry, "width", state.width, initialWidth)));
      headerCell.dataset.uiEditorTextX = String(finite(state.textOffsetX));
      headerCell.dataset.uiEditorTextY = String(finite(state.textOffsetY));
      headerCell.style.paddingLeft = px(Math.max(0, finite(state.textOffsetX)));
      headerCell.style.paddingTop = px(Math.max(0, finite(state.textOffsetY)));
      headerCell.style.fontSize = px(positive(state.fontSize, 1));
      toggleClass(tableElement, `${HIDDEN_CLASS}-${id.split(".").pop()}`, state.visible === false);
      toggleClass(headerCell, HIDDEN_CLASS, state.visible === false);
    },
  });
}

export function getM80Ref(id) { return refs.get(String(id || "")) || null; }
export function listM80Refs() { return [...refs.values()]; }
export function snapshotM80Geometry() {
  return new Map([...refs.values()].map((ref) => {
    const rect = rectOf(ref.element);
    return [ref.id, { left: finite(rect.left), top: finite(rect.top), width: finite(rect.width), height: finite(rect.height) }];
  }));
}
export function getM80IdFromTarget(target) {
  let current = isElementRef(target) ? target : null;
  while (current) {
    const id = elementIds.get(current);
    if (id) return id;
    current = current.parentElement;
  }
  return null;
}
export function readM80State(id) {
  const ref = getM80Ref(id);
  if (!ref) return null;
  const state = ref.read();
  workingStates.set(id, { ...state });
  return { ...state };
}
export function applyM80State(id, state) {
  const ref = getM80Ref(id);
  if (!ref) throw Object.assign(new Error("Explizite Elementreferenz fehlt."), { code: "electron_element_not_found" });
  ref.apply(state);
  const readback = ref.read();
  workingStates.set(id, { ...readback });
  return { ...readback };
}
export function snapshotM80State(id) { return readM80State(id); }
export function listM80CurrentStates(scopeId) {
  return [...refs.values()].filter((ref) => {
      let entry = ref.entry;
      while (entry && entry.parentId) entry = getM80RegistryEntry(entry.parentId);
      return entry?.id === scopeId;
    }).map((ref) => readM80State(ref.id));
}
export function getM80ReferenceStatus(id) {
  const ref = getM80Ref(id);
  return { refKey: String(id || ""), referenceResolved: Boolean(ref && (typeof ref.element.isConnected !== "boolean" || ref.element.isConnected)) };
}
export function clearM80VisualState() {
  document.querySelector("[data-bbm-ui-editor-overlay]")?.remove();
}

export { HIDDEN_CLASS };
