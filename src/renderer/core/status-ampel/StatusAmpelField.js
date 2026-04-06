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
      return {
        value,
        label: String(item.label ?? value),
        disabled: Boolean(item.disabled),
      };
    })
    .filter(Boolean);
}

function normalizeTrafficLight(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "red" || raw === "yellow" || raw === "green") return raw;
  return "off";
}

export class StatusAmpelField {
  constructor({ documentRef, labels } = {}) {
    this.documentRef = documentRef || window.document;
    this._readOnly = false;
    this._disabled = false;
    this._trafficLight = "off";
    this._build(labels || {});
  }

  _build(labels) {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "status-ampel-field");
    this.root.setAttribute("data-component", "status-ampel-field");

    this.statusWrap = mkEl(doc, "label", "status-ampel-group");
    this.statusLabel = mkEl(doc, "span", "status-ampel-label", labels.status || "Status");
    this.statusSelect = mkEl(doc, "select", "status-ampel-select");
    this.statusWrap.append(this.statusLabel, this.statusSelect);

    this.dueWrap = mkEl(doc, "label", "status-ampel-group");
    this.dueLabel = mkEl(doc, "span", "status-ampel-label", labels.dueDate || "Fertig bis");
    this.dueInput = mkEl(doc, "input", "status-ampel-date");
    this.dueInput.type = "date";
    this.dueWrap.append(this.dueLabel, this.dueInput);

    this.trafficWrap = mkEl(doc, "div", "status-ampel-traffic");
    this.trafficLabel = mkEl(doc, "span", "status-ampel-label", labels.trafficLight || "Ampel");
    this.trafficDot = mkEl(doc, "span", "status-ampel-dot");
    this.trafficDot.setAttribute("aria-hidden", "true");
    this.trafficValue = mkEl(doc, "span", "status-ampel-value", "off");
    this.trafficWrap.append(this.trafficLabel, this.trafficDot, this.trafficValue);

    this.root.append(this.statusWrap, this.dueWrap, this.trafficWrap);
  }

  getElement() {
    return this.root;
  }

  setStatusOptions(options) {
    const normalized = normalizeOptions(options);
    const currentValue = this.statusSelect.value;
    this.statusSelect.innerHTML = "";

    normalized.forEach((item) => {
      const opt = this.documentRef.createElement("option");
      opt.value = item.value;
      opt.textContent = item.label;
      opt.disabled = Boolean(item.disabled);
      this.statusSelect.appendChild(opt);
    });

    if (normalized.length === 0) return;
    if (normalized.some((item) => item.value === currentValue)) {
      this.statusSelect.value = currentValue;
    } else {
      this.statusSelect.value = normalized[0].value;
    }
  }

  setTrafficLight(trafficLight) {
    this._trafficLight = normalizeTrafficLight(trafficLight);
    this.root.dataset.trafficLight = this._trafficLight;
    this.trafficValue.textContent = this._trafficLight;
  }

  setValue(value = {}) {
    if (value.status !== undefined) this.statusSelect.value = String(value.status ?? "");
    if (value.dueDate !== undefined) this.dueInput.value = String(value.dueDate ?? "");
    if (value.trafficLight !== undefined) this.setTrafficLight(value.trafficLight);
  }

  getValue() {
    return {
      status: String(this.statusSelect.value || ""),
      dueDate: String(this.dueInput.value || ""),
      trafficLight: this._trafficLight,
    };
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
    this.statusSelect.disabled = locked;
    this.dueInput.disabled = locked;
    this.root.classList.toggle("is-read-only", this._readOnly);
    this.root.classList.toggle("is-disabled", this._disabled);
  }
}

