import { ensureLeistungsEditboxStyles } from "./styles.js";

const FIELD_CLASS = "bbm-leistungseditbox-field";

function normalizedKind(kind) {
  return ["singleline", "multiline", "select"].includes(kind) ? kind : "singleline";
}

export class LeistungsEditboxField {
  constructor({
    documentRef,
    label = "Feld",
    kind = "singleline",
    value = "",
    options = [],
    placeholder = "",
  } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungsEditboxField benötigt ein Document.");

    ensureLeistungsEditboxStyles(doc);

    this.kind = normalizedKind(kind);
    this.root = doc.createElement("label");
    this.root.className = `${FIELD_CLASS} ${FIELD_CLASS}--${this.kind}`;

    this.labelElement = doc.createElement("span");
    this.labelElement.className = `${FIELD_CLASS}__label`;
    this.labelElement.textContent = String(label || "Feld");

    if (this.kind === "multiline") {
      this.control = doc.createElement("textarea");
    } else if (this.kind === "select") {
      this.control = doc.createElement("select");
      for (const option of options) {
        const optionElement = doc.createElement("option");
        if (typeof option === "object" && option !== null) {
          optionElement.value = String(option.value ?? option.label ?? "");
          optionElement.textContent = String(option.label ?? option.value ?? "");
        } else {
          optionElement.value = String(option ?? "");
          optionElement.textContent = String(option ?? "");
        }
        this.control.appendChild(optionElement);
      }
    } else {
      this.control = doc.createElement("input");
      this.control.type = "text";
    }

    this.control.className = `${FIELD_CLASS}__control`;
    this.control.value = String(value ?? "");
    if (placeholder && this.kind !== "select") this.control.placeholder = String(placeholder);

    this.root.append(this.labelElement, this.control);
  }

  getElement() {
    return this.root;
  }

  getControl() {
    return this.control;
  }

  getValue() {
    return this.control.value;
  }

  setValue(value) {
    this.control.value = String(value ?? "");
  }

  setLabel(label) {
    this.labelElement.textContent = String(label ?? "");
  }
}

export { FIELD_CLASS as LEISTUNGSEDITBOX_FIELD_CLASS };
