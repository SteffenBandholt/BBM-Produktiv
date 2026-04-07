import {
  PROJECT_COMPANY_SOURCE_LOCAL,
  PROJECT_COMPANY_SOURCE_STAMM,
} from "../constants.js";
import { normalizeProjectCompanyEmployee } from "../projectCompanyEmployeeModel.js";
import { mkEl, toBool, toText } from "./dom.js";

export class ProjectCompanyEmployeeForm {
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
    this.formEl = mkEl(doc, "form", "project-company-employee-form");
    this.formEl.noValidate = true;

    this.fields = {
      projectId: this._createInputField("Projekt-ID", "text"),
      projectCompanyId: this._createInputField("Projektfirma-ID", "text"),
      sourceType: this._createSelectField("Quelle", [
        { value: PROJECT_COMPANY_SOURCE_LOCAL, label: "Projektlokal" },
        { value: PROJECT_COMPANY_SOURCE_STAMM, label: "Stamm" },
      ]),
      employeeId: this._createInputField("Stamm-Mitarbeiter-ID", "text"),
      localEmployeeId: this._createInputField("Projekt-Mitarbeiter-ID", "text"),
      firstName: this._createInputField("Vorname", "text"),
      lastName: this._createInputField("Nachname", "text"),
      displayName: this._createInputField("Anzeigename", "text", { required: true }),
      role: this._createInputField("Funktion", "text"),
      phone: this._createInputField("Telefon", "text"),
      email: this._createInputField("E-Mail", "email"),
      active: this._createCheckboxField("Im Projekt aktiv"),
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
    const wrapper = mkEl(this.documentRef, "label", "project-company-employee-form-field");
    const label = mkEl(this.documentRef, "span", "project-company-employee-form-label", labelText);
    const input = mkEl(this.documentRef, "input", "project-company-employee-form-input");
    input.type = type;
    input.required = required;
    wrapper.append(label, input);
    return { wrapper, input, type: "input" };
  }

  _createSelectField(labelText, options) {
    const wrapper = mkEl(this.documentRef, "label", "project-company-employee-form-field");
    const label = mkEl(this.documentRef, "span", "project-company-employee-form-label", labelText);
    const select = mkEl(this.documentRef, "select", "project-company-employee-form-select");
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
      "project-company-employee-form-field project-company-employee-form-field-checkbox"
    );
    const input = mkEl(this.documentRef, "input", "project-company-employee-form-checkbox");
    input.type = "checkbox";
    const label = mkEl(this.documentRef, "span", "project-company-employee-form-label", labelText);
    wrapper.append(input, label);
    return { wrapper, input, type: "checkbox" };
  }

  _applySourceTypeState() {
    const isStamm = toText(this.fields.sourceType.input.value) === PROJECT_COMPANY_SOURCE_STAMM;
    this.fields.employeeId.input.disabled = !isStamm || this._disabled;
    this.fields.localEmployeeId.input.disabled = isStamm || this._disabled;
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
    const normalized = normalizeProjectCompanyEmployee(value || {});
    this.fields.projectId.input.value = toText(normalized.projectId);
    this.fields.projectCompanyId.input.value = toText(normalized.projectCompanyId);
    this.fields.sourceType.input.value = toText(normalized.sourceType);
    this.fields.employeeId.input.value = toText(normalized.employeeId);
    this.fields.localEmployeeId.input.value = toText(normalized.localEmployeeId);
    this.fields.firstName.input.value = toText(normalized.firstName);
    this.fields.lastName.input.value = toText(normalized.lastName);
    this.fields.displayName.input.value = toText(normalized.displayName);
    this.fields.role.input.value = toText(normalized.role);
    this.fields.phone.input.value = toText(normalized.phone);
    this.fields.email.input.value = toText(normalized.email);
    this.fields.active.input.checked = toBool(normalized.active, false);
    this._applySourceTypeState();
  }

  getValue() {
    return normalizeProjectCompanyEmployee({
      projectId: toText(this.fields.projectId.input.value),
      projectCompanyId: toText(this.fields.projectCompanyId.input.value),
      sourceType: toText(this.fields.sourceType.input.value),
      employeeId: toText(this.fields.employeeId.input.value),
      localEmployeeId: toText(this.fields.localEmployeeId.input.value),
      firstName: toText(this.fields.firstName.input.value),
      lastName: toText(this.fields.lastName.input.value),
      displayName: toText(this.fields.displayName.input.value),
      role: toText(this.fields.role.input.value),
      phone: toText(this.fields.phone.input.value),
      email: toText(this.fields.email.input.value),
      active: Boolean(this.fields.active.input.checked),
    });
  }

  validate() {
    const value = this.getValue();
    const errors = [];
    if (!value.projectId) {
      errors.push({ field: "projectId", message: "Projekt-ID ist erforderlich." });
    }
    if (!value.projectCompanyId) {
      errors.push({ field: "projectCompanyId", message: "Projektfirma-ID ist erforderlich." });
    }
    if (!value.displayName) {
      errors.push({ field: "displayName", message: "Anzeigename ist erforderlich." });
    }
    if (value.sourceType === PROJECT_COMPANY_SOURCE_STAMM && !value.employeeId) {
      errors.push({ field: "employeeId", message: "Stamm-Mitarbeiter-ID ist erforderlich." });
    }
    if (value.email && !value.email.includes("@")) {
      errors.push({ field: "email", message: "E-Mail ist ungültig." });
    }
    return { isValid: errors.length === 0, errors, value };
  }
}

