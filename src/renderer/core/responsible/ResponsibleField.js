function mkEl(doc, tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function normalizeOptions(rawOptions) {
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions
    .map((item) => {
      if (item == null) return null;
      if (typeof item === "string" || typeof item === "number") {
        const value = String(item);
        return { value, label: value, disabled: false };
      }
      if (typeof item !== "object") return null;
      const value = String(item.value ?? "");
      if (!value) return null;
      const label = String(item.label ?? value);
      return {
        value,
        label,
        disabled: Boolean(item.disabled),
      };
    })
    .filter(Boolean);
}

export class ResponsibleField {
  constructor({ documentRef, label } = {}) {
    this.documentRef = documentRef || window.document;
    this._readOnly = false;
    this._disabled = false;
    this._build(label);
  }

  _build(labelText) {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "responsible-field");
    this.root.setAttribute("data-component", "responsible-field");

    this.labelEl = mkEl(doc, "label", "responsible-field-label");
    this.labelTextEl = mkEl(doc, "span", "responsible-field-label-text", labelText || "Assignee");
    this.selectEl = mkEl(doc, "select", "responsible-field-select");
    this.selectEl.autocomplete = "off";
    this.labelEl.append(this.labelTextEl, this.selectEl);
    this.root.appendChild(this.labelEl);
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  setLabel(label) {
    const text = String(label || "").trim();
    this.labelTextEl.textContent = text || "Assignee";
  }

  setOptions(options) {
    const normalized = normalizeOptions(options);
    const currentValue = this.getValue();
    this.selectEl.innerHTML = "";

    normalized.forEach((item) => {
      const opt = this.documentRef.createElement("option");
      opt.value = item.value;
      opt.textContent = item.label;
      opt.disabled = Boolean(item.disabled);
      this.selectEl.appendChild(opt);
    });

    if (normalized.length === 0) return;
    if (normalized.some((item) => item.value === currentValue)) {
      this.selectEl.value = currentValue;
    } else {
      this.selectEl.value = normalized[0].value;
    }
  }

  setValue(value) {
    const next = value == null ? "" : String(value);
    this.selectEl.value = next;
  }

  getValue() {
    return String(this.selectEl.value || "");
  }

  setReadOnly(isReadOnly) {
    this._readOnly = Boolean(isReadOnly);
    this._applyControlState();
  }

  setDisabled(isDisabled) {
    this._disabled = Boolean(isDisabled);
    this._applyControlState();
  }

  _applyControlState() {
    const locked = this._readOnly || this._disabled;
    this.selectEl.disabled = locked;
    this.root.classList.toggle("is-read-only", this._readOnly);
    this.root.classList.toggle("is-disabled", this._disabled);
  }
}
