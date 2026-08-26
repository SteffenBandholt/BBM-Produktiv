import { POSITION_TYPES, PRICE_INPUT_MODES } from "../../../shared/rechnung/rechnungPositions.mjs";
import { LeistungsEditboxFrame } from "../../core/leistungseditbox/index.js";
import { LeistungspositionEditboxAdapter } from "../../shared/leistungsposition/LeistungspositionEditboxAdapter.js";
import { LeistungspositionEditboxHeaderAdapter } from "../../shared/leistungsposition/LeistungspositionEditboxHeaderAdapter.js";

const STYLE_MARKER = "rechnung-leistungseditbox-binding-styles";
let STYLE_HREF = "./styles/rechnungLeistungsEditbox.css";

try {
  STYLE_HREF = new URL("./styles/rechnungLeistungsEditbox.css", import.meta.url).href;
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

function centsToInput(cents) {
  const numeric = Number(cents ?? 0);
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(Number.isFinite(numeric) ? numeric / 100 : 0);
}

function editboxTypeForPosition(position) {
  if (position?.type === POSITION_TYPES.NOTE) return "hint";
  if (position?.type === POSITION_TYPES.HEADING) return "text";
  return "standard";
}

export function rechnungPositionToLeistungsEditboxValues(position = {}, {
  quantityDecimalPlaces = 2,
} = {}) {
  const isService = position?.type === POSITION_TYPES.SERVICE;
  const isGross = isService && position?.price_input_mode === PRICE_INPUT_MODES.GROSS;
  const inputPriceCents = isGross
    ? position?.price_input_cents ?? position?.unit_price_cents
    : position?.unit_price_cents;

  return Object.freeze({
    basePositionNumber: position?.position_number || "",
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
      showGross: true,
      showNep: true,
      showPositionAmount: true,
      onChange: (values) => {
        if (!this.activePositionId || !this.onChange) return;
        this.onChange(this.activePositionId, values);
      },
    });

    this.frame.replaceHeader(this.header.getElement());
    this.frame.replaceContent(this.adapter.getElement());
    this.host.append(frameElement);
  }

  getElement() {
    return this.host;
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
}
