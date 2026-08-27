import {
  LeistungsEditboxDecimalControl,
  LeistungsEditboxField,
  LeistungsEditboxGroup,
  LeistungsEditboxRow,
} from "../../core/leistungseditbox/index.js";
import {
  DEFAULT_TEXT_LIMITS,
  evaluateLongText,
  evaluateShortText,
} from "../../core/textregeln/index.js";

const DEFAULT_TYPE_OPTIONS = Object.freeze([
  { value: "standard", label: "Standard" },
  { value: "alternative", label: "Alternative" },
  { value: "hint", label: "Hinweis" },
  { value: "text", label: "Text" },
]);
const PRICED_TYPES = new Set(["standard", "alternative"]);

function normalizeAlternativeSuffix(value) {
  const suffix = String(value ?? "a").trim().toLowerCase();
  return /^[a-z]$/.test(suffix) ? suffix : "a";
}
function alternativeDisplayNumber(basePositionNumber, suffix) {
  const base = String(basePositionNumber ?? "").trim();
  return base ? `${base}${normalizeAlternativeSuffix(suffix)}` : normalizeAlternativeSuffix(suffix);
}
function parseLocalizedNumber(value) {
  const text = String(value ?? "").trim().replace(/\s+/g, "");
  if (!text) return null;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}
function formatLocalizedNumber(value, decimalPlaces) {
  const numeric = parseLocalizedNumber(value);
  if (numeric === null) return String(value ?? "");
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping: true,
  }).format(numeric);
}
function formatPositionAmount(quantity, unitPrice) {
  const quantityValue = parseLocalizedNumber(quantity);
  const unitPriceValue = parseLocalizedNumber(unitPrice);
  if (quantityValue === null || unitPriceValue === null) return "";
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(quantityValue * unitPriceValue);
}
function appendRemainingCounter(doc, field, className) {
  const remaining = doc.createElement("span");
  remaining.className = `bbm-leistungsposition-remaining ${className}`;
  remaining.setAttribute("aria-live", "polite");
  field.labelElement.appendChild(remaining);
  return remaining;
}
function createReservedSlot(doc, label, className) {
  const slot = doc.createElement("div");
  slot.className = `bbm-leistungsposition-reserved-slot ${className}`;
  const caption = doc.createElement("span");
  caption.className = "bbm-leistungsposition-reserved-slot__label";
  caption.textContent = label;
  slot.appendChild(caption);
  return slot;
}

export class LeistungspositionEditboxAdapter {
  constructor({
    documentRef,
    values = {},
    typeOptions = DEFAULT_TYPE_OPTIONS,
    showGross = false,
    showNep = false,
    showPositionAmount = false,
    compact = false,
    reserveGrossSlot = false,
    reserveModuleArea = false,
    textLimits = DEFAULT_TEXT_LIMITS,
    onChange = null,
  } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungspositionEditboxAdapter benötigt ein Document.");

    this.onChange = typeof onChange === "function" ? onChange : null;
    this.silent = false;
    this.compact = compact === true;
    this.reserveGrossSlot = reserveGrossSlot === true;
    this.reserveModuleArea = reserveModuleArea === true;
    this.textLimits = Object.freeze({
      shortText: Number(textLimits?.shortText) > 0 ? Math.floor(Number(textLimits.shortText)) : DEFAULT_TEXT_LIMITS.shortText,
      longText: Number(textLimits?.longText) > 0 ? Math.floor(Number(textLimits.longText)) : DEFAULT_TEXT_LIMITS.longText,
    });
    this.defaultType = String(typeOptions[0]?.value ?? "");
    this.basePositionNumber = String(values.basePositionNumber ?? values.positionNumber ?? "").trim();
    this.alternativeSuffix = normalizeAlternativeSuffix(values.alternativeSuffix ?? "a");

    const fields = {
      positionNumber: new LeistungsEditboxField({ documentRef: doc, label: "Pos", kind: "singleline", value: this.basePositionNumber }),
      shortText: new LeistungsEditboxField({ documentRef: doc, label: "Kurztext", kind: "singleline", value: values.shortText ?? "" }),
      longText: new LeistungsEditboxField({ documentRef: doc, label: "Langtext", kind: "multiline", value: values.longText ?? "" }),
      type: new LeistungsEditboxField({ documentRef: doc, label: "Typ", kind: "select", value: values.type ?? this.defaultType, options: typeOptions }),
      alternativeReference: new LeistungsEditboxField({ documentRef: doc, label: "Zuordnung", kind: "singleline", value: "" }),
      quantity: new LeistungsEditboxField({ documentRef: doc, label: "Menge", kind: "singleline", value: values.quantity ?? "" }),
      unit: new LeistungsEditboxField({ documentRef: doc, label: "Einh.", kind: "singleline", value: values.unit ?? "" }),
      unitPrice: new LeistungsEditboxField({ documentRef: doc, label: "EP", kind: "singleline", value: values.unitPrice ?? "" }),
    };
    fields.positionNumber.getControl().readOnly = true;
    fields.alternativeReference.getControl().readOnly = true;
    fields.shortText.getControl().maxLength = this.textLimits.shortText;
    fields.longText.getControl().maxLength = this.textLimits.longText;

    if (showPositionAmount) {
      fields.positionAmount = new LeistungsEditboxField({ documentRef: doc, label: "GP", kind: "singleline", value: "" });
      fields.positionAmount.getControl().readOnly = true;
    }
    if (showGross) fields.gross = new LeistungsEditboxField({ documentRef: doc, label: "Brutto", kind: "toggle", value: values.gross === true });
    if (showNep) fields.nep = new LeistungsEditboxField({ documentRef: doc, label: "NEP", kind: "toggle", value: values.nep === true });
    this.fields = Object.freeze(fields);

    this.shortTextRemaining = appendRemainingCounter(doc, this.fields.shortText, "bbm-leistungsposition-remaining--short");
    this.longTextRemaining = appendRemainingCounter(doc, this.fields.longText, "bbm-leistungsposition-remaining--long");

    this.quantityDecimalControl = new LeistungsEditboxDecimalControl({
      documentRef: doc,
      value: values.quantityDecimalPlaces ?? 2,
      minPlaces: 0,
      maxPlaces: 4,
      ariaLabel: "Nachkommastellen der Menge",
      onChange: () => {
        this.formatQuantity();
        this.updatePositionAmount();
        this.emitChange();
      },
    });
    this.fields.quantity.labelElement.style.display = "flex";
    this.fields.quantity.labelElement.style.alignItems = "center";
    this.fields.quantity.labelElement.style.justifyContent = "space-between";
    this.fields.quantity.labelElement.style.gap = "6px";
    this.fields.quantity.labelElement.appendChild(this.quantityDecimalControl.getElement());

    this.fields.shortText.getControl().addEventListener("input", () => { this.updateRemainingCounters(); this.emitChange(); });
    this.fields.longText.getControl().addEventListener("input", () => { this.updateRemainingCounters(); this.emitChange(); });
    this.fields.unit.getControl().addEventListener("input", () => this.emitChange());
    this.fields.quantity.getControl().addEventListener("input", () => { this.updatePositionAmount(); this.emitChange(); });
    this.fields.quantity.getControl().addEventListener("blur", () => { this.formatQuantity(); this.updatePositionAmount(); this.emitChange(); });
    this.fields.unitPrice.getControl().addEventListener("input", () => { this.updatePositionAmount(); this.emitChange(); });
    this.fields.unitPrice.getControl().addEventListener("blur", () => { this.formatUnitPrice(); this.updatePositionAmount(); this.emitChange(); });
    this.fields.type.getControl().addEventListener("change", () => { this.updateTypePresentation(); this.emitChange(); });
    this.fields.gross?.getControl().addEventListener("change", () => this.emitChange());
    this.fields.nep?.getControl().addEventListener("change", () => this.emitChange());

    this.formatQuantity();
    this.formatUnitPrice();

    this.primaryRow = new LeistungsEditboxRow({ documentRef: doc, children: [this.fields.shortText.getElement()] });
    this.primaryRow.getElement().classList.add("bbm-leistungsposition-short-row");
    this.textRow = new LeistungsEditboxRow({ documentRef: doc, children: [this.fields.longText.getElement()] });
    this.textRow.getElement().classList.add("bbm-leistungsposition-long-row");

    const detailChildren = [
      this.fields.quantity.getElement(),
      this.fields.unit.getElement(),
      this.fields.unitPrice.getElement(),
      ...(this.fields.positionAmount ? [this.fields.positionAmount.getElement()] : []),
    ];
    const detailColumns = [".92fr", ".52fr", ".7fr", ...(this.fields.positionAmount ? [".72fr"] : [])];
    this.detailRow = new LeistungsEditboxRow({ documentRef: doc, columns: detailColumns, children: detailChildren });
    this.detailRow.getElement().classList.add("bbm-leistungsposition-detail-row");
    for (const name of ["quantity", "unit", "unitPrice", "positionAmount"]) this.fields[name]?.getElement().classList.add("bbm-leistungsposition-field--right");

    if (this.compact) {
      const grossCell = this.fields.gross?.getElement() || (this.reserveGrossSlot ? createReservedSlot(doc, "Brutto", "bbm-leistungsposition-reserved-slot--gross") : null);
      const numberChildren = [
        this.fields.positionNumber.getElement(),
        this.fields.type.getElement(),
        this.fields.alternativeReference.getElement(),
        ...(grossCell ? [grossCell] : []),
        ...(this.fields.nep ? [this.fields.nep.getElement()] : []),
      ];
      const numberColumns = [".45fr", ".72fr", "1.3fr", ...(grossCell ? [".58fr"] : []), ...(this.fields.nep ? [".52fr"] : [])];
      this.numberRow = new LeistungsEditboxRow({ documentRef: doc, columns: numberColumns, children: numberChildren });
      this.numberRow.getElement().classList.add("bbm-leistungsposition-number-row");

      this.shortDetailRow = new LeistungsEditboxRow({
        documentRef: doc,
        columns: ["1.38fr", "1fr"],
        children: [this.primaryRow.getElement(), this.detailRow.getElement()],
      });
      this.shortDetailRow.getElement().classList.add("bbm-leistungsposition-short-detail-row");

      const moduleArea = this.reserveModuleArea ? createReservedSlot(doc, "", "bbm-leistungsposition-reserved-slot--module") : doc.createElement("div");
      moduleArea.classList.add("bbm-leistungsposition-module-area");
      this.longModuleRow = new LeistungsEditboxRow({
        documentRef: doc,
        columns: ["1.38fr", "1fr"],
        children: [this.textRow.getElement(), moduleArea],
      });
      this.longModuleRow.getElement().classList.add("bbm-leistungsposition-long-module-row");

      this.bodyRow = null;
      this.root = new LeistungsEditboxGroup({
        documentRef: doc,
        children: [this.numberRow.getElement(), this.shortDetailRow.getElement(), this.longModuleRow.getElement()],
      });
      this.root.getElement().classList.add("bbm-leistungsposition-editbox", "bbm-leistungsposition-editbox--compact");
    } else {
      const numberChildren = [
        this.fields.positionNumber.getElement(),
        this.fields.type.getElement(),
        this.fields.alternativeReference.getElement(),
        ...(this.fields.nep ? [this.fields.nep.getElement()] : []),
        ...(this.fields.gross ? [this.fields.gross.getElement()] : []),
      ];
      const numberColumns = ["minmax(0, .35fr)", "minmax(0, .65fr)", "minmax(0, 2fr)", ...(this.fields.nep ? ["auto"] : []), ...(this.fields.gross ? ["auto"] : [])];
      this.numberRow = new LeistungsEditboxRow({ documentRef: doc, columns: numberColumns, children: numberChildren });
      this.numberRow.getElement().classList.add("bbm-leistungsposition-number-row");
      this.bodyRow = null;
      this.root = new LeistungsEditboxGroup({ documentRef: doc, children: [this.numberRow.getElement(), this.primaryRow.getElement(), this.detailRow.getElement(), this.textRow.getElement()] });
      this.root.getElement().classList.add("bbm-leistungsposition-editbox");
    }

    this.updateTypePresentation();
    this.updatePositionAmount();
    this.updateRemainingCounters();
  }

  emitChange() {
    if (this.silent || !this.onChange) return;
    this.onChange(this.getValues());
  }
  updateRemainingCounters() {
    const shortEvaluation = evaluateShortText(this.fields.shortText.getValue(), { limit: this.textLimits.shortText });
    const longEvaluation = evaluateLongText(this.fields.longText.getValue(), { limit: this.textLimits.longText });
    this.shortTextRemaining.textContent = String(shortEvaluation.remaining);
    this.longTextRemaining.textContent = String(longEvaluation.remaining);
    this.shortTextRemaining.dataset.level = shortEvaluation.level;
    this.longTextRemaining.dataset.level = longEvaluation.level;
  }
  formatQuantity() {
    const current = this.fields.quantity.getValue();
    if (String(current ?? "").trim() === "") return;
    this.fields.quantity.setValue(formatLocalizedNumber(current, this.quantityDecimalControl.getValue()));
  }
  formatUnitPrice() {
    const current = this.fields.unitPrice.getValue();
    if (String(current ?? "").trim() === "") return;
    this.fields.unitPrice.setValue(formatLocalizedNumber(current, 2));
  }
  updatePositionAmount() {
    if (!this.fields.positionAmount) return;
    this.fields.positionAmount.setValue(formatPositionAmount(this.fields.quantity.getValue(), this.fields.unitPrice.getValue()));
  }
  updateTypePresentation() {
    const type = this.fields.type.getValue();
    const isAlternative = type === "alternative";
    const isPriced = PRICED_TYPES.has(type);
    const displayNumber = isAlternative ? alternativeDisplayNumber(this.basePositionNumber, this.alternativeSuffix) : this.basePositionNumber;
    this.fields.positionNumber.setValue(displayNumber);
    this.fields.alternativeReference.setValue(isAlternative && this.basePositionNumber ? `Alt. zu Pos. ${this.basePositionNumber}` : "");
    this.fields.alternativeReference.getElement().hidden = !isAlternative;
    this.detailRow.getElement().hidden = !isPriced;
  }

  getElement() { return this.root.getElement(); }
  getField(name) { return this.fields[name] || null; }
  getQuantityDecimalControl() { return this.quantityDecimalControl; }

  setValues(values = {}) {
    this.silent = true;
    try {
      this.basePositionNumber = String(values.basePositionNumber ?? values.positionNumber ?? "").trim();
      this.alternativeSuffix = normalizeAlternativeSuffix(values.alternativeSuffix ?? "a");
      this.fields.shortText.setValue(values.shortText ?? "");
      this.fields.longText.setValue(values.longText ?? "");
      this.fields.type.setValue(values.type ?? this.defaultType);
      this.fields.quantity.setValue(values.quantity ?? "");
      this.quantityDecimalControl.setValue(values.quantityDecimalPlaces ?? 2, { silent: true });
      this.fields.unit.setValue(values.unit ?? "");
      this.fields.unitPrice.setValue(values.unitPrice ?? "");
      if (this.fields.gross) this.fields.gross.setValue(values.gross === true);
      if (this.fields.nep) this.fields.nep.setValue(values.nep === true);
      this.formatQuantity();
      this.formatUnitPrice();
      this.updateTypePresentation();
      this.updatePositionAmount();
      this.updateRemainingCounters();
      return this.getValues();
    } finally {
      this.silent = false;
    }
  }

  getValues() {
    const type = this.fields.type.getValue();
    return Object.freeze({
      positionNumber: this.fields.positionNumber.getValue(),
      basePositionNumber: this.basePositionNumber,
      shortText: this.fields.shortText.getValue(),
      longText: this.fields.longText.getValue(),
      type,
      alternativeOf: type === "alternative" ? this.basePositionNumber : "",
      alternativeSuffix: type === "alternative" ? this.alternativeSuffix : "",
      quantity: this.fields.quantity.getValue(),
      quantityDecimalPlaces: this.quantityDecimalControl.getValue(),
      unit: this.fields.unit.getValue(),
      unitPrice: this.fields.unitPrice.getValue(),
      ...(this.fields.positionAmount ? { positionAmount: this.fields.positionAmount.getValue() } : {}),
      ...(this.fields.gross ? { gross: this.fields.gross.getValue() } : {}),
      ...(this.fields.nep ? { nep: this.fields.nep.getValue() } : {}),
    });
  }
}

export {
  DEFAULT_TYPE_OPTIONS as LEISTUNGSPOSITION_DEFAULT_TYPE_OPTIONS,
  alternativeDisplayNumber as leistungspositionAlternativeDisplayNumber,
  formatLocalizedNumber as leistungspositionFormatLocalizedNumber,
  formatPositionAmount as leistungspositionFormatPositionAmount,
};
