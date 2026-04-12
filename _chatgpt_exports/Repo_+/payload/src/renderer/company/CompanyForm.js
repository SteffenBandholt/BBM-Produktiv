import { normalizeCompany } from "../stamm/firmen/index.js";

function mkEl(doc, tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function toText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function toBool(value, fallback = true) {
  if (value == null) return fallback;
  if (typeof value === "boolean") return value;
  const text = toText(value).toLowerCase();
  if (["0", "false", "no", "nein"].includes(text)) return false;
  if (["1", "true", "yes", "ja"].includes(text)) return true;
  return fallback;
}

function normalizeInputValue(value) {
  return normalizeCompany(value || {});
}

export class CompanyForm {
  constructor({ documentRef, onSubmit } = {}) {
    this.documentRef = documentRef || window.document;
    this._onSubmit = typeof onSubmit === "function" ? onSubmit : null;
    this._disabled = false;

    this._build();
    this.setValue({ active: true });
  }

  _build() {
    const doc = this.documentRef;

    this.formEl = mkEl(doc, "form", "company-form");
    this.formEl.noValidate = true;

    this.fields = {
      id: this._createInputField("ID", "text"),
      name1: this._createInputField("Name", "text", { required: true }),
      name2: this._createInputField("Name 2", "text"),
      short: this._createInputField("Kurzbezeichnung", "text", { required: true }),
      street: this._createInputField("Straße", "text"),
      zip: this._createInputField("PLZ", "text"),
      city: this._createInputField("Ort", "text"),
      phone: this._createInputField("Telefon", "text"),
      email: this._createInputField("E-Mail", "email"),
      category: this._createInputField("Kategorie", "text"),
      note: this._createTextAreaField("Notiz"),
      active: this._createCheckboxField("Aktiv"),
    };

    Object.values(this.fields).forEach((entry) => this.formEl.appendChild(entry.wrapper));

    this.formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const result = this.validate();
      if (!result.isValid) return;
      if (this._onSubmit) this._onSubmit(this.getValue());
    });
  }

  _createInputField(labelText, type, { required = false } = {}) {
    const wrapper = mkEl(this.documentRef, "label", "company-form-field");
    const label = mkEl(this.documentRef, "span", "company-form-label", labelText);
    const input = mkEl(this.documentRef, "input", "company-form-input");
    input.type = type;
    input.required = required;
    wrapper.append(label, input);
    return { wrapper, input, type: "input" };
  }

  _createTextAreaField(labelText) {
    const wrapper = mkEl(this.documentRef, "label", "company-form-field");
    const label = mkEl(this.documentRef, "span", "company-form-label", labelText);
    const textarea = mkEl(this.documentRef, "textarea", "company-form-textarea");
    wrapper.append(label, textarea);
    return { wrapper, input: textarea, type: "textarea" };
  }

  _createCheckboxField(labelText) {
    const wrapper = mkEl(this.documentRef, "label", "company-form-field company-form-field-checkbox");
    const input = mkEl(this.documentRef, "input", "company-form-checkbox");
    input.type = "checkbox";
    const label = mkEl(this.documentRef, "span", "company-form-label", labelText);
    wrapper.append(input, label);
    return { wrapper, input, type: "checkbox" };
  }

  getElement() {
    return this.formEl;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.formEl);
  }

  onSubmit(callback) {
    this._onSubmit = typeof callback === "function" ? callback : null;
  }

  setDisabled(disabled) {
    this._disabled = Boolean(disabled);
    Object.values(this.fields).forEach(({ input }) => {
      input.disabled = this._disabled;
    });
    this.formEl.classList.toggle("is-disabled", this._disabled);
  }

  setValue(value) {
    const normalized = normalizeInputValue(value);

    this.fields.id.input.value = toText(normalized.id);
    this.fields.name1.input.value = toText(normalized.name1);
    this.fields.name2.input.value = toText(normalized.name2);
    this.fields.short.input.value = toText(normalized.short);
    this.fields.street.input.value = toText(normalized.street);
    this.fields.zip.input.value = toText(normalized.zip);
    this.fields.city.input.value = toText(normalized.city);
    this.fields.phone.input.value = toText(normalized.phone);
    this.fields.email.input.value = toText(normalized.email);
    this.fields.category.input.value = toText(normalized.category);
    this.fields.note.input.value = toText(normalized.note);
    this.fields.active.input.checked = toBool(normalized.active, true);
  }

  getValue() {
    return normalizeCompany({
      id: toText(this.fields.id.input.value),
      name1: toText(this.fields.name1.input.value),
      name2: toText(this.fields.name2.input.value),
      short: toText(this.fields.short.input.value),
      street: toText(this.fields.street.input.value),
      zip: toText(this.fields.zip.input.value),
      city: toText(this.fields.city.input.value),
      phone: toText(this.fields.phone.input.value),
      email: toText(this.fields.email.input.value),
      category: toText(this.fields.category.input.value),
      note: toText(this.fields.note.input.value),
      active: Boolean(this.fields.active.input.checked),
    });
  }

  validate() {
    const value = this.getValue();
    const errors = [];

    if (!value.name1) {
      errors.push({ field: "name1", message: "Name ist erforderlich." });
    }
    if (!value.short) {
      errors.push({ field: "short", message: "Kurzbezeichnung ist erforderlich." });
    }

    const email = value.email;
    if (email && !email.includes("@")) {
      errors.push({ field: "email", message: "E-Mail ist ungültig." });
    }

    return {
      isValid: errors.length === 0,
      errors,
      value,
    };
  }
}
