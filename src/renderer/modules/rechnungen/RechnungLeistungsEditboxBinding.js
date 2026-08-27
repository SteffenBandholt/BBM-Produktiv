import { POSITION_TYPES, PRICE_INPUT_MODES } from "../../../shared/rechnung/rechnungPositions.mjs";
import { LeistungsEditboxFrame } from "../../core/leistungseditbox/index.js";
import { LeistungspositionEditboxAdapter } from "../../shared/leistungsposition/LeistungspositionEditboxAdapter.js";
import { LeistungspositionEditboxHeaderAdapter } from "../../shared/leistungsposition/LeistungspositionEditboxHeaderAdapter.js";
import { m80EditorAttributes } from "../../ui-editor/m80Registry.js";
import { registerM80Ref } from "../../ui-editor/m80Refs.js";

const STYLE_MARKER = "rechnung-leistungseditbox-binding-styles-v7";
const GEOMETRY_STORAGE_KEY = "bbm.rechnung.leistungsEditbox.geometry.v3";
const LEGACY_GEOMETRY_STORAGE_KEYS = Object.freeze([
  "bbm.rechnung.leistungsEditbox.geometry.v2",
  "bbm.rechnung.leistungsEditbox.geometry.v1",
]);
const DEFAULT_COMPACT_HEIGHT = 138;
let STYLE_HREF = "./styles/rechnungLeistungsEditbox.css?v=free-v7";

try {
  const url = new URL("./styles/rechnungLeistungsEditbox.css", import.meta.url);
  url.searchParams.set("v", "free-v7");
  STYLE_HREF = url.href;
} catch (_error) {
  // Testloader/Data-URL fallback.
}

function ensureStyles(doc) {
  if (!doc?.head || doc.querySelector?.(`link[data-${STYLE_MARKER}="true"]`)) return;
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLE_HREF;
  link.setAttribute(`data-${STYLE_MARKER}`, "true");
  doc.head.appendChild(link);
}

function finiteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function px(value) {
  return `${finiteNumber(value, 0)}px`;
}

function readActualEditorState(element, id) {
  const view = element?.ownerDocument?.defaultView;
  const style = view?.getComputedStyle?.(element) || element?.style || {};
  const rect = element?.getBoundingClientRect?.() || { width: 0, height: 0 };
  const inlineWidth = parseFloat(element?.style?.width || "");
  const inlineHeight = parseFloat(element?.style?.height || "");
  return {
    elementId: id,
    x: finiteNumber(element?.dataset?.uiEditorX, 0),
    y: finiteNumber(element?.dataset?.uiEditorY, 0),
    width: Number.isFinite(inlineWidth) ? Math.max(0, inlineWidth) : Math.max(0, finiteNumber(rect.width, 0)),
    height: Number.isFinite(inlineHeight) ? Math.max(0, inlineHeight) : Math.max(0, finiteNumber(rect.height, 0)),
    textOffsetX: finiteNumber(element?.dataset?.uiEditorTextX, 0),
    textOffsetY: finiteNumber(element?.dataset?.uiEditorTextY, 0),
    fontSize: finiteNumber(parseFloat(style.fontSize), 0),
    visible: element?.hidden !== true && String(style.display || "").toLowerCase() !== "none",
    spacing: {},
  };
}

function setFreeGeometryStyle(element, name, value) {
  if (!element?.style) return;
  if (name === "width") {
    element.style.removeProperty("min-width");
    element.style.removeProperty("max-width");
  }
  if (name === "height") {
    element.style.removeProperty("min-height");
    element.style.removeProperty("max-height");
  }
  element.style.setProperty(name, value, "important");
}

function applyActualEditorState(element, state, requestedOperation = null) {
  if (!element || !state) return;
  const applies = (...operations) => requestedOperation === null || operations.includes(requestedOperation);

  if (applies("move")) {
    const x = finiteNumber(state.x, 0);
    const y = finiteNumber(state.y, 0);
    element.dataset.uiEditorX = String(x);
    element.dataset.uiEditorY = String(y);
    setFreeGeometryStyle(element, "translate", `${px(x)} ${px(y)}`);
  }

  if (applies("resize", "resizeWidth") && state.width !== null && state.width !== undefined) {
    setFreeGeometryStyle(element, "width", px(Math.max(0, finiteNumber(state.width, 0))));
    element.style.setProperty("box-sizing", "border-box", "important");
  }

  if (applies("resize", "resizeHeight") && state.height !== null && state.height !== undefined) {
    setFreeGeometryStyle(element, "height", px(Math.max(0, finiteNumber(state.height, 0))));
    element.style.setProperty("box-sizing", "border-box", "important");
  }

  if (applies("textResize") && state.fontSize !== null && state.fontSize !== undefined) {
    setFreeGeometryStyle(element, "font-size", px(Math.max(0, finiteNumber(state.fontSize, 0))));
  }

  if (applies("textMove")) {
    const x = finiteNumber(state.textOffsetX, 0);
    const y = finiteNumber(state.textOffsetY, 0);
    element.dataset.uiEditorTextX = String(x);
    element.dataset.uiEditorTextY = String(y);
    setFreeGeometryStyle(element, "padding-left", px(x));
    setFreeGeometryStyle(element, "padding-top", px(y));
  }

  if (applies("setVisibility") && typeof state.visible === "boolean") {
    element.hidden = state.visible === false;
  }
}

function bindEditorRef(element, id) {
  if (!element || !id) return null;
  for (const [name, value] of Object.entries(m80EditorAttributes(id))) element.setAttribute(name, value);
  registerM80Ref(id, element, {
    read: () => readActualEditorState(element, id),
    apply: (state, requestedOperation = null) => applyActualEditorState(element, state, requestedOperation),
  });
  return element;
}

function registerField(adapter, name, id) {
  const field = adapter.getField(name);
  if (!field) return;
  bindEditorRef(field.getElement?.(), `${id}.wrapper`);
  bindEditorRef(field.getControl?.(), id);
  bindEditorRef(field.labelElement, `${id}.label`);
}

function parseStoredGeometry(raw, { keepHeight = true } = {}) {
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    x: finiteNumber(value.x),
    y: finiteNumber(value.y),
    width: finiteNumber(value.width),
    height: keepHeight ? finiteNumber(value.height) : null,
  };
}

function readStoredGeometry(doc) {
  try {
    const storage = doc?.defaultView?.localStorage;
    if (!storage) return null;
    const current = parseStoredGeometry(storage.getItem(GEOMETRY_STORAGE_KEY));
    if (current) return current;
    for (const key of LEGACY_GEOMETRY_STORAGE_KEYS) {
      const legacy = parseStoredGeometry(storage.getItem(key), { keepHeight: false });
      if (legacy) return legacy;
    }
    return null;
  } catch (_error) {
    return null;
  }
}

function applyStoredGeometry(frameElement, geometry) {
  if (!frameElement) return;
  const x = geometry?.x ?? 0;
  const y = geometry?.y ?? 0;
  frameElement.dataset.uiEditorX = String(x);
  frameElement.dataset.uiEditorY = String(y);
  frameElement.style.translate = `${x}px ${y}px`;
  if (geometry?.width !== null && geometry?.width !== undefined && geometry.width >= 0) frameElement.style.width = `${geometry.width}px`;
  frameElement.style.height = `${geometry?.height ?? DEFAULT_COMPACT_HEIGHT}px`;
}

function measuredDimension(frameElement, name) {
  const inline = String(frameElement?.style?.[name] || "").trim();
  const pixelMatch = inline.match(/^(-?\d+(?:\.\d+)?)px$/i);
  if (pixelMatch) return finiteNumber(pixelMatch[1]);
  const rect = frameElement?.getBoundingClientRect?.();
  return finiteNumber(rect?.[name]);
}

function snapshotGeometry(frameElement) {
  return {
    x: finiteNumber(frameElement?.dataset?.uiEditorX) ?? 0,
    y: finiteNumber(frameElement?.dataset?.uiEditorY) ?? 0,
    width: measuredDimension(frameElement, "width"),
    height: measuredDimension(frameElement, "height"),
  };
}

function storeGeometry(doc, frameElement) {
  try {
    const storage = doc?.defaultView?.localStorage;
    if (!storage || !frameElement) return;
    const geometry = snapshotGeometry(frameElement);
    if (geometry.width === null || geometry.height === null) return;
    storage.setItem(GEOMETRY_STORAGE_KEY, JSON.stringify(geometry));
  } catch (_error) {
    // Lokale Geometrie-Persistenz darf die Rechnung nicht blockieren.
  }
}

function observeGeometry(doc, frameElement) {
  const Observer = doc?.defaultView?.MutationObserver || globalThis.MutationObserver;
  if (typeof Observer !== "function" || !frameElement) return null;
  const observer = new Observer(() => storeGeometry(doc, frameElement));
  observer.observe(frameElement, { attributes: true, attributeFilter: ["style", "data-ui-editor-x", "data-ui-editor-y"] });
  return observer;
}

function applyCompactDefaults(adapter, header) {
  for (const name of ["positionNumber", "type", "alternativeReference", "shortText", "quantity", "unit", "unitPrice", "positionAmount"]) {
    const control = adapter.getField(name)?.getControl?.();
    if (!control) continue;
    control.style.height = "18px";
    control.style.fontSize = "9px";
    control.style.lineHeight = "16px";
    control.style.padding = "0 3px";
    control.style.boxSizing = "border-box";
  }

  const longText = adapter.getField("longText")?.getControl?.();
  if (longText) {
    longText.style.height = "42px";
    longText.style.fontSize = "9px";
    longText.style.lineHeight = "11px";
    longText.style.padding = "2px 3px";
    longText.style.boxSizing = "border-box";
  }

  for (const name of ["positionNumber", "type", "alternativeReference", "shortText", "longText", "quantity", "unit", "unitPrice", "positionAmount", "nep"]) {
    const label = adapter.getField(name)?.labelElement;
    if (!label) continue;
    label.style.fontSize = "8px";
    label.style.lineHeight = "9px";
  }

  for (const name of ["addTitle", "addPosition", "move", "delete"]) {
    const button = header.getAction(name)?.getElement?.();
    if (!button) continue;
    button.style.height = "18px";
    button.style.fontSize = "8px";
    button.style.lineHeight = "16px";
    button.style.padding = "0 5px";
    button.style.boxSizing = "border-box";
  }
}

function centsToInput(cents) {
  const numeric = Number(cents ?? 0);
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(Number.isFinite(numeric) ? numeric / 100 : 0);
}

function editboxTypeForPosition(position) {
  if (position?.alternative_of) return "alternative";
  if (position?.type === POSITION_TYPES.NOTE) return "hint";
  if (position?.type === POSITION_TYPES.HEADING) return "text";
  return "standard";
}

export function rechnungPositionToLeistungsEditboxValues(position = {}, { quantityDecimalPlaces = 2, alternativeBasePositionNumber = "" } = {}) {
  const isService = position?.type === POSITION_TYPES.SERVICE;
  const isAlternative = isService && !!position?.alternative_of;
  const isGross = isService && position?.price_input_mode === PRICE_INPUT_MODES.GROSS;
  const inputPriceCents = isGross ? position?.price_input_cents ?? position?.unit_price_cents : position?.unit_price_cents;

  return Object.freeze({
    basePositionNumber: isAlternative ? alternativeBasePositionNumber || String(position?.position_number || "").replace(/[a-z]$/i, "") : position?.position_number || "",
    alternativeSuffix: isAlternative ? position?.alternative_suffix || "a" : "a",
    shortText: position?.short_text || "",
    longText: position?.long_text || "",
    type: editboxTypeForPosition(position),
    quantity: isService ? position?.quantity ?? "" : "",
    quantityDecimalPlaces,
    unit: isService ? position?.unit || "" : "",
    unitPrice: isService ? centsToInput(inputPriceCents) : "",
    gross: isGross,
    nep: isService && position?.is_nep === true,
  });
}

export class RechnungLeistungsEditboxBinding {
  constructor({ documentRef = globalThis.document, onAddTitle = null, onAddPosition = null, onMove = null, onDelete = null, onChange = null } = {}) {
    const doc = documentRef;
    if (!doc?.createElement) throw new Error("RechnungLeistungsEditboxBinding benötigt ein Document.");
    ensureStyles(doc);

    this.documentRef = doc;
    this.activePositionId = null;
    this.onChange = typeof onChange === "function" ? onChange : null;
    this.uiEditorRefsRegistered = false;
    this.host = doc.createElement("section");
    this.host.className = "rechnung-leistungseditbox-host";
    this.host.hidden = true;

    this.frame = new LeistungsEditboxFrame({ documentRef: doc, id: "rechnung.leistungseditbox.frame", label: "LeistungsEditbox Rechnung" });
    const frameElement = this.frame.getElement();
    for (const attribute of ["data-ui-inspector-id", "data-ui-editor-kind", "data-ui-editor-label", "data-ui-editor-parent", "data-ui-editor-editable", "data-ui-editor-ops"]) frameElement.removeAttribute(attribute);

    applyStoredGeometry(frameElement, readStoredGeometry(doc));
    this.geometryObserver = observeGeometry(doc, frameElement);

    this.header = new LeistungspositionEditboxHeaderAdapter({ documentRef: doc, title: "Leistungsposition bearbeiten", onAddTitle, onAddPosition, onMove, onDelete });
    this.adapter = new LeistungspositionEditboxAdapter({
      documentRef: doc,
      compact: true,
      reserveGrossSlot: false,
      reserveModuleArea: true,
      textLimits: { shortText: 100, longText: 600 },
      showGross: false,
      showNep: true,
      showPositionAmount: true,
      onChange: (values) => {
        if (!this.activePositionId || !this.onChange) return;
        this.onChange(this.activePositionId, values);
      },
    });

    applyCompactDefaults(this.adapter, this.header);
    this.frame.replaceHeader(this.header.getElement());
    this.frame.replaceContent(this.adapter.getElement());
    this.host.append(frameElement);
  }

  registerUiEditorRefs() {
    if (this.uiEditorRefsRegistered || !this.host.isConnected) return false;

    bindEditorRef(this.frame.getHeaderHost(), "rechnung.editor.leistungsEditbox.frameHeader");
    bindEditorRef(this.frame.getContentHost(), "rechnung.editor.leistungsEditbox.frameContent");

    bindEditorRef(this.header.getElement(), "rechnung.editor.leistungsEditbox.header");
    bindEditorRef(this.header.header?.getTitleHost?.(), "rechnung.editor.leistungsEditbox.header.title");
    bindEditorRef(this.header.header?.actionsHost, "rechnung.editor.leistungsEditbox.header.actions");
    bindEditorRef(this.header.header?.getLeftHost?.(), "rechnung.editor.leistungsEditbox.header.actions.left");
    bindEditorRef(this.header.header?.getCenterHost?.(), "rechnung.editor.leistungsEditbox.header.actions.center");
    bindEditorRef(this.header.header?.getRightHost?.(), "rechnung.editor.leistungsEditbox.header.actions.right");
    bindEditorRef(this.header.getAction("addTitle")?.getElement?.(), "rechnung.editor.leistungsEditbox.action.addTitle");
    bindEditorRef(this.header.getAction("addPosition")?.getElement?.(), "rechnung.editor.leistungsEditbox.action.addPosition");
    bindEditorRef(this.header.getAction("move")?.getElement?.(), "rechnung.editor.leistungsEditbox.action.move");
    bindEditorRef(this.header.getAction("delete")?.getElement?.(), "rechnung.editor.leistungsEditbox.action.delete");

    bindEditorRef(this.adapter.getElement(), "rechnung.editor.leistungsEditbox.content");
    bindEditorRef(this.adapter.numberRow?.getElement?.(), "rechnung.editor.leistungsEditbox.row.meta");
    bindEditorRef(this.adapter.shortDetailRow?.getElement?.(), "rechnung.editor.leistungsEditbox.row.shortPrice");
    bindEditorRef(this.adapter.primaryRow?.getElement?.(), "rechnung.editor.leistungsEditbox.row.short");
    bindEditorRef(this.adapter.detailRow?.getElement?.(), "rechnung.editor.leistungsEditbox.row.prices");
    bindEditorRef(this.adapter.longModuleRow?.getElement?.(), "rechnung.editor.leistungsEditbox.row.longModule");
    bindEditorRef(this.adapter.textRow?.getElement?.(), "rechnung.editor.leistungsEditbox.row.long");

    registerField(this.adapter, "positionNumber", "rechnung.editor.leistungsEditbox.positionNumber");
    registerField(this.adapter, "type", "rechnung.editor.leistungsEditbox.type");
    registerField(this.adapter, "alternativeReference", "rechnung.editor.leistungsEditbox.assignment");
    registerField(this.adapter, "nep", "rechnung.editor.leistungsEditbox.nep");
    registerField(this.adapter, "shortText", "rechnung.editor.leistungsEditbox.shortText");
    registerField(this.adapter, "quantity", "rechnung.editor.leistungsEditbox.quantity");
    registerField(this.adapter, "unit", "rechnung.editor.leistungsEditbox.unit");
    registerField(this.adapter, "unitPrice", "rechnung.editor.leistungsEditbox.unitPrice");
    registerField(this.adapter, "positionAmount", "rechnung.editor.leistungsEditbox.positionAmount");
    registerField(this.adapter, "longText", "rechnung.editor.leistungsEditbox.longText");

    bindEditorRef(this.adapter.shortTextRemaining, "rechnung.editor.leistungsEditbox.shortText.remaining");
    bindEditorRef(this.adapter.longTextRemaining, "rechnung.editor.leistungsEditbox.longText.remaining");

    const decimal = this.adapter.getQuantityDecimalControl?.();
    bindEditorRef(decimal?.getElement?.(), "rechnung.editor.leistungsEditbox.quantityDecimals");
    bindEditorRef(decimal?.decreaseButton, "rechnung.editor.leistungsEditbox.quantityDecimals.decrease");
    bindEditorRef(decimal?.pattern, "rechnung.editor.leistungsEditbox.quantityDecimals.pattern");
    bindEditorRef(decimal?.increaseButton, "rechnung.editor.leistungsEditbox.quantityDecimals.increase");

    const moduleArea = this.adapter.getElement()?.querySelector?.(".bbm-leistungsposition-module-area");
    bindEditorRef(moduleArea, "rechnung.editor.leistungsEditbox.moduleArea");

    this.uiEditorRefsRegistered = true;
    return true;
  }

  getElement() { return this.host; }
  getFrameElement() { return this.frame.getElement(); }

  showPosition(position, options = {}) {
    this.registerUiEditorRefs();
    if (!position || position.is_title === true) {
      this.hide();
      return null;
    }
    this.activePositionId = position.id || null;
    const values = rechnungPositionToLeistungsEditboxValues(position, options);
    this.adapter.setValues(values);
    this.host.hidden = false;
    return values;
  }

  hide() {
    this.activePositionId = null;
    this.host.hidden = true;
  }

  destroy() {
    this.geometryObserver?.disconnect?.();
    this.geometryObserver = null;
  }
}
