import {
  PROJECT_COMPANY_SOURCE_LOCAL,
  PROJECT_COMPANY_SOURCE_STAMM,
} from "../constants.js";
import { normalizeProjectCompany } from "../projectCompanyModel.js";
import { mkEl, toBool, toText } from "./dom.js";

export class ProjectCompanyForm {
  constructor({ documentRef, onSubmit } = {}) {
    this.documentRef = documentRef || window.document;
    this._onSubmit = typeof onSubmit === "function" ? onSubmit : null;
    this._disabled = false;

    this._build();
    this.setValue({
      sourceType: PROJECT_COMPANY_SOURCE_LOCAL,
      active: true,
    });
  }

  _build() {
    const doc = this.documentRef;
    this.formEl = mkEl(doc, "form", "project-company-form");
    this.formEl.noValidate = true;

    this.fields = {
      projectId: this._createInputField("Projekt-ID", "text"),
      sourceType: this._createSelectField("Quelle", [
        { value: PROJECT_COMPANY_SOURCE_LOCAL, label: "Projektlokal" },
        { value: PROJECT_COMPANY_SOURCE_STAMM, label: "Stamm" },
      ]),
      companyId: this._createInputField("Stammfirma-ID", "text"),
      localCompanyId: this._createInputField("Projektfirma-ID", "text"),
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
      active: this._createCheckboxField("Aktiv im Projekt"),
    };

    Object.values(this.fields).forEach((entry) => this.formEl.appendChild(entry.wrapper));

    this.fields.sourceType.input.addEventListener("change", () => {
      this._applySourceTypeState();
    });

    this.formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const result = this.validate();
      if (!result.isValid) return;
      if (this._onSubmit) this._onSubmit(result.value);
    });
  }

  _createInputField(labelText, type, { required = false } = {}) {
    const wrapper = mkEl(this.documentRef, "label", "project-company-form-field");
    const label = mkEl(this.documentRef, "span", "project-company-form-label", labelText);
    const input = mkEl(this.documentRef, "input", "project-company-form-input");
    input.type = type;
    input.required = required;
    wrapper.append(label, input);
    return { wrapper, input, type: "input" };
  }

  _createTextAreaField(labelText) {
    const wrapper = mkEl(this.documentRef, "label", "project-company-form-field");
    const label = mkEl(this.documentRef, "span", "project-company-form-label", labelText);
    const textarea = mkEl(this.documentRef, "textarea", "project-company-form-textarea");
    wrapper.append(label, textarea);
    return { wrapper, input: textarea, type: "textarea" };
  }

  _createSelectField(labelText, options) {
    const wrapper = mkEl(this.documentRef, "label", "project-company-form-field");
    const label = mkEl(this.documentRef, "span", "project-company-form-label", labelText);
    const select = mkEl(this.documentRef, "select", "project-company-form-select");
    for (const option of options || []) {
      const opt = this.documentRef.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      select.appendChild(opt);
    }
    wrapper.append(label, select);
    return { wrapper, input: select, type: "select" };
  }

  _createCheckboxField(labelText) {
    const wrapper = mkEl(
      this.documentRef,
      "label",
      "project-company-form-field project-company-form-field-checkbox"
    );
    const input = mkEl(this.documentRef, "input", "project-company-form-checkbox");
    input.type = "checkbox";
    const label = mkEl(this.documentRef, "span", "project-company-form-label", labelText);
    wrapper.append(input, label);
    return { wrapper, input, type: "checkbox" };
  }

  _applySourceTypeState() {
    const sourceType = toText(this.fields.sourceType.input.value);
    const isStamm = sourceType === PROJECT_COMPANY_SOURCE_STAMM;
    this.fields.companyId.input.disabled = !isStamm || this._disabled;
    this.fields.localCompanyId.input.disabled = isStamm || this._disabled;
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
    this._applySourceTypeState();
  }

  setValue(value) {
    const normalized = normalizeProjectCompany(value || {});
    this.fields.projectId.input.value = toText(normalized.projectId);
    this.fields.sourceType.input.value = toText(normalized.sourceType);
    this.fields.companyId.input.value = toText(normalized.companyId);
    this.fields.localCompanyId.input.value = toText(normalized.localCompanyId);
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
    this._applySourceTypeState();
  }

  getValue() {
    return normalizeProjectCompany({
      projectId: toText(this.fields.projectId.input.value),
      sourceType: toText(this.fields.sourceType.input.value),
      companyId: toText(this.fields.companyId.input.value),
      localCompanyId: toText(this.fields.localCompanyId.input.value),
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
    if (!value.projectId) {
      errors.push({ field: "projectId", message: "Projekt-ID ist erforderlich." });
    }
    if (!value.name1) {
      errors.push({ field: "name1", message: "Name ist erforderlich." });
    }
    if (!value.short) {
      errors.push({ field: "short", message: "Kurzbezeichnung ist erforderlich." });
    }
    if (value.sourceType === PROJECT_COMPANY_SOURCE_STAMM && !value.companyId) {
      errors.push({ field: "companyId", message: "Stammfirma-ID ist erforderlich." });
    }
    if (value.email && !value.email.includes("@")) {
      errors.push({ field: "email", message: "E-Mail ist ungültig." });
    }
    return { isValid: errors.length === 0, errors, value };
  }
}

