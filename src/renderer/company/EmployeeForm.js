import {
  normalizeEmployee,
  toEmployeeOptions,
} from "../stamm/mitarbeiter/index.js";
import { normalizeCompanyList, getCompanyDisplayLabel } from "../stamm/firmen/index.js";

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

export class EmployeeForm {
  constructor({ documentRef, onSubmit } = {}) {
    this.documentRef = documentRef || window.document;
    this._onSubmit = typeof onSubmit === "function" ? onSubmit : null;
    this._disabled = false;
    this._companyOptions = [];

    this._build();
    this.setValue({ active: true });
  }

  _build() {
    const doc = this.documentRef;
    this.formEl = mkEl(doc, "form", "employee-form");
    this.formEl.noValidate = true;

    this.fields = {
      id: this._createInputField("ID", "text"),
      companyId: this._createSelectField("Firma", { required: true }),
      firstName: this._createInputField("Vorname", "text"),
      lastName: this._createInputField("Nachname", "text"),
      displayName: this._createInputField("Anzeigename", "text"),
      role: this._createInputField("Funktion", "text"),
      phone: this._createInputField("Telefon", "text"),
      email: this._createInputField("E-Mail", "email"),
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

  _createInputField(labelText, type) {
    const wrapper = mkEl(this.documentRef, "label", "employee-form-field");
    const label = mkEl(this.documentRef, "span", "employee-form-label", labelText);
    const input = mkEl(this.documentRef, "input", "employee-form-input");
    input.type = type;
    wrapper.append(label, input);
    return { wrapper, input, type: "input" };
  }

  _createSelectField(labelText) {
    const wrapper = mkEl(this.documentRef, "label", "employee-form-field");
    const label = mkEl(this.documentRef, "span", "employee-form-label", labelText);
    const select = mkEl(this.documentRef, "select", "employee-form-select");
    wrapper.append(label, select);
    return { wrapper, input: select, type: "select" };
  }

  _createCheckboxField(labelText) {
    const wrapper = mkEl(this.documentRef, "label", "employee-form-field employee-form-field-checkbox");
    const input = mkEl(this.documentRef, "input", "employee-form-checkbox");
    input.type = "checkbox";
    const label = mkEl(this.documentRef, "span", "employee-form-label", labelText);
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

  setCompanyOptions(companies) {
    const normalizedCompanies = normalizeCompanyList(companies);
    this._companyOptions = normalizedCompanies.map((company) => ({
      value: company.id,
      label: getCompanyDisplayLabel(company),
    }));
    this._renderCompanyOptions();
  }

  setValue(value) {
    const normalized = normalizeEmployee(value || {});

    this.fields.id.input.value = toText(normalized.id);
    this.fields.firstName.input.value = toText(normalized.firstName);
    this.fields.lastName.input.value = toText(normalized.lastName);
    this.fields.displayName.input.value = toText(normalized.displayName);
    this.fields.role.input.value = toText(normalized.role);
    this.fields.phone.input.value = toText(normalized.phone);
    this.fields.email.input.value = toText(normalized.email);
    this.fields.active.input.checked = toBool(normalized.active, true);

    this._renderCompanyOptions(normalized.companyId);
  }

  getValue() {
    const firstName = toText(this.fields.firstName.input.value);
    const lastName = toText(this.fields.lastName.input.value);
    const explicitDisplayName = toText(this.fields.displayName.input.value);
    const derivedDisplayName = explicitDisplayName || [firstName, lastName].filter(Boolean).join(" ").trim();

    return normalizeEmployee({
      id: toText(this.fields.id.input.value),
      companyId: toText(this.fields.companyId.input.value),
      firstName,
      lastName,
      displayName: derivedDisplayName,
      role: toText(this.fields.role.input.value),
      phone: toText(this.fields.phone.input.value),
      email: toText(this.fields.email.input.value),
      active: Boolean(this.fields.active.input.checked),
    });
  }

  validate() {
    const value = this.getValue();
    const errors = [];

    if (!value.companyId) {
      errors.push({ field: "companyId", message: "Firma ist erforderlich." });
    }

    const explicitDisplayName = toText(this.fields.displayName.input.value);
    const derivedDisplayName = [
      toText(this.fields.firstName.input.value),
      toText(this.fields.lastName.input.value),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const effectiveDisplayName = explicitDisplayName || derivedDisplayName;
    if (!effectiveDisplayName) {
      errors.push({ field: "displayName", message: "Anzeigename ist erforderlich." });
    }

    if (value.email && !value.email.includes("@")) {
      errors.push({ field: "email", message: "E-Mail ist ungültig." });
    }

    return {
      isValid: errors.length === 0,
      errors,
      value,
    };
  }

  _renderCompanyOptions(preferredValue = null) {
    const select = this.fields.companyId.input;
    const valueFromField = toText(select.value);
    const wanted = toText(preferredValue ?? valueFromField);

    select.innerHTML = "";

    const emptyOption = this.documentRef.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "-";
    select.appendChild(emptyOption);

    this._companyOptions.forEach((option) => {
      const opt = this.documentRef.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      select.appendChild(opt);
    });

    if (wanted && this._companyOptions.some((option) => option.value === wanted)) {
      select.value = wanted;
    }
  }

  getEmployeeOptionsPreview() {
    return toEmployeeOptions([this.getValue()]);
  }
}
