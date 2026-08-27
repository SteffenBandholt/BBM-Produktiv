import { POSITION_TYPES, PRICE_INPUT_MODES } from "../../../shared/rechnung/rechnungPositions.mjs";
import { LeistungsEditboxFrame } from "../../core/leistungseditbox/index.js";
import { LeistungspositionEditboxAdapter } from "../../shared/leistungsposition/LeistungspositionEditboxAdapter.js";
import { LeistungspositionEditboxHeaderAdapter } from "../../shared/leistungsposition/LeistungspositionEditboxHeaderAdapter.js";

const STYLE_MARKER = "rechnung-leistungseditbox-binding-styles-v4";
const GEOMETRY_STORAGE_KEY = "bbm.rechnung.leistungsEditbox.geometry.v3";
const LEGACY_GEOMETRY_STORAGE_KEYS = Object.freeze([
  "bbm.rechnung.leistungsEditbox.geometry.v2",
  "bbm.rechnung.leistungsEditbox.geometry.v1",
]);
const DEFAULT_COMPACT_HEIGHT = 138;
let STYLE_HREF = "./styles/rechnungLeistungsEditbox.css?v=compact-v4";

try {
  const url = new URL("./styles/rechnungLeistungsEditbox.css", import.meta.url);
  url.searchParams.set("v", "compact-v4");
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

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
  if (geometry?.width !== null && geometry?.width !== undefined && geometry.width >= 0) {
    frameElement.style.width = `${geometry.width}px`;
  }
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
  observer.observe(frameElement, {
    attributes: true,
    attributeFilter: ["style", "data-ui-editor-x", "data-ui-editor-y"],
  });
  return observer;
}

function setImportant(style, name, value) {
  style?.setProperty?.(name, value, "important");
}

function forceCompactControls(adapter, header) {
  for (const name of ["positionNumber", "type", "alternativeReference", "shortText", "quantity", "unit", "unitPrice", "positionAmount"]) {
    const control = adapter.getField(name)?.getControl?.();
    if (!control) continue;
    setImportant(control.style, "height", "18px");
    setImportant(control.style, "min-height", "18px");
    setImportant(control.style, "max-height", "18px");
    setImportant(control.style, "font-size", "9px");
    setImportant(control.style, "line-height", "16px");
    setImportant(control.style, "padding", "0 3px");
    setImportant(control.style, "box-sizing", "border-box");
  }

  const longText = adapter.getField("longText")?.getControl?.();
  if (longText) {
    setImportant(longText.style, "height", "42px");
    setImportant(longText.style, "min-height", "42px");
    setImportant(longText.style, "max-height", "42px");
    setImportant(longText.style, "font-size", "9px");
    setImportant(longText.style, "line-height", "11px");
    setImportant(longText.style, "padding", "2px 3px");
    setImportant(longText.style, "box-sizing", "border-box");
  }

  for (const name of ["positionNumber", "type", "alternativeReference", "shortText", "longText", "quantity", "unit", "unitPrice", "positionAmount", "nep"]) {
    const field = adapter.getField(name);
    const label = field?.labelElement;
    if (!label) continue;
    setImportant(label.style, "font-size", "8px");
    setImportant(label.style, "line-height", "9px");
  }

  for (const name of ["addTitle", "addPosition", "move", "delete"]) {
    const button = header.getAction(name)?.getElement?.();
    if (!button) continue;
    setImportant(button.style, "height", "18px");
    setImportant(button.style, "min-height", "18px");
    setImportant(button.style, "font-size", "8px");
    setImportant(button.style, "line-height", "16px");
    setImportant(button.style, "padding", "0 5px");
    setImportant(button.style, "box-sizing", "border-box");
  }
}

function centsToInput(cents) {
  const numeric = Number(cents ?? 0);
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(Number.isFinite(numeric) ? numeric / 100 : 0);
}

function editboxTypeForPosition(position) {
  if (position?.alternative_of) return "alternative";
  if (position?.type === POSITION_TYPES.NOTE) return "hint";
  if (position?.type === POSITION_TYPES.HEADING) return "text";
  return "standard";
}

export function rechnungPositionToLeistungsEditboxValues(position = {}, {
  quantityDecimalPlaces = 2,
  alternativeBasePositionNumber = "",
} = {}) {
  const isService = position?.type === POSITION_TYPES.SERVICE;
  const isAlternative = isService && !!position?.alternative_of;
  const isGross = isService && position?.price_input_mode === PRICE_INPUT_MODES.GROSS;
  const inputPriceCents = isGross
    ? position?.price_input_cents ?? position?.unit_price_cents
    : position?.unit_price_cents;

  return Object.freeze({
    basePositionNumber: isAlternative
      ? alternativeBasePositionNumber || String(position?.position_number || "").replace(/[a-z]$/i, "")
      : position?.position_number || "",
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
  constructor({
    documentRef = globalThis.document,
    onAddTitle = null,
    onAddPosition = null,
    onMove = null,
    onDelete = null,
    onChange = null,
  } = {}) {
    const doc = documentRef;
    if (!doc?.createElement) throw new Error("RechnungLeistungsEditboxBinding benötigt ein Document.");
    ensureStyles(doc);

    this.activePositionId = null;
    this.onChange = typeof onChange === "function" ? onChange : null;
    this.host = doc.createElement("section");
    this.host.className = "rechnung-leistungseditbox-host";
    this.host.hidden = true;

    this.frame = new LeistungsEditboxFrame({
      documentRef: doc,
      id: "rechnung.leistungseditbox.frame",
      label: "LeistungsEditbox Rechnung",
    });
    const frameElement = this.frame.getElement();
    for (const attribute of [
      "data-ui-inspector-id",
      "data-ui-editor-kind",
      "data-ui-editor-label",
      "data-ui-editor-parent",
      "data-ui-editor-editable",
      "data-ui-editor-ops",
    ]) frameElement.removeAttribute(attribute);

    applyStoredGeometry(frameElement, readStoredGeometry(doc));
    this.geometryObserver = observeGeometry(doc, frameElement);

    this.header = new LeistungspositionEditboxHeaderAdapter({
      documentRef: doc,
      title: "Leistungsposition bearbeiten",
      onAddTitle,
      onAddPosition,
      onMove,
      onDelete,
    });
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

    forceCompactControls(this.adapter, this.header);
    this.frame.replaceHeader(this.header.getElement());
    this.frame.replaceContent(this.adapter.getElement());
    this.host.append(frameElement);
  }

  getElement() {
    return this.host;
  }

  getFrameElement() {
    return this.frame.getElement();
  }

  showPosition(position, options = {}) {
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
