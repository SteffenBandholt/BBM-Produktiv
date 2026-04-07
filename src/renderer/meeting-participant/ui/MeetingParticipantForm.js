import { normalizeMeetingParticipant } from "../meetingParticipantModel.js";
import { mkEl, toText } from "./dom.js";

export class MeetingParticipantForm {
  constructor({ documentRef, onSubmit } = {}) {
    this.documentRef = documentRef || window.document;
    this._onSubmit = typeof onSubmit === "function" ? onSubmit : null;
    this._disabled = false;
    this._build();
    this.setValue({ active: true, invited: false });
  }

  _build() {
    const doc = this.documentRef;
    this.formEl = mkEl(doc, "form", "meeting-participant-form");
    this.formEl.noValidate = true;

    this.fields = {
      meetingId: this._createInputField("Besprechung-ID", "text"),
      projectId: this._createInputField("Projekt-ID", "text"),
      projectCompanyId: this._createInputField("Projektfirma-ID", "text"),
      displayName: this._createInputField("Anzeigename", "text"),
      companyLabel: this._createInputField("Firma", "text"),
      role: this._createInputField("Funktion", "text"),
      phone: this._createInputField("Telefon", "text"),
      email: this._createInputField("E-Mail", "email"),
      active: this._createCheckboxField("Aktiv in Besprechung"),
      invited: this._createCheckboxField("Invited"),
    };

    Object.values(this.fields).forEach((entry) => this.formEl.appendChild(entry.wrapper));

    this.formEl.addEventListener("submit", (event) => {
      event.preventDefault();
      const result = this.validate();
      if (!result.isValid) return;
      if (this._onSubmit) this._onSubmit(result.value);
    });
  }

  _createInputField(labelText, type) {
    const wrapper = mkEl(this.documentRef, "label", "meeting-participant-form-field");
    const label = mkEl(this.documentRef, "span", "meeting-participant-form-label", labelText);
    const input = mkEl(this.documentRef, "input", "meeting-participant-form-input");
    input.type = type;
    wrapper.append(label, input);
    return { wrapper, input, type: "input" };
  }

  _createCheckboxField(labelText) {
    const wrapper = mkEl(
      this.documentRef,
      "label",
      "meeting-participant-form-field meeting-participant-form-field-checkbox"
    );
    const input = mkEl(this.documentRef, "input", "meeting-participant-form-checkbox");
    input.type = "checkbox";
    const label = mkEl(this.documentRef, "span", "meeting-participant-form-label", labelText);
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
    const normalized = normalizeMeetingParticipant(value || {});
    this.fields.meetingId.input.value = toText(normalized.meetingId);
    this.fields.projectId.input.value = toText(normalized.projectId);
    this.fields.projectCompanyId.input.value = toText(normalized.projectCompanyId);
    this.fields.displayName.input.value = toText(normalized.displayName);
    this.fields.companyLabel.input.value = toText(normalized.companyLabel);
    this.fields.role.input.value = toText(normalized.role);
    this.fields.phone.input.value = toText(normalized.phone);
    this.fields.email.input.value = toText(normalized.email);
    this.fields.active.input.checked = Boolean(normalized.active);
    this.fields.invited.input.checked = Boolean(normalized.invited);
  }

  getValue() {
    return normalizeMeetingParticipant({
      meetingId: toText(this.fields.meetingId.input.value),
      projectId: toText(this.fields.projectId.input.value),
      projectCompanyId: toText(this.fields.projectCompanyId.input.value),
      displayName: toText(this.fields.displayName.input.value),
      companyLabel: toText(this.fields.companyLabel.input.value),
      role: toText(this.fields.role.input.value),
      phone: toText(this.fields.phone.input.value),
      email: toText(this.fields.email.input.value),
      active: Boolean(this.fields.active.input.checked),
      invited: Boolean(this.fields.invited.input.checked),
    });
  }

  validate() {
    const value = this.getValue();
    const errors = [];
    if (!value.meetingId) errors.push({ field: "meetingId", message: "Besprechung-ID fehlt." });
    if (!value.projectId) errors.push({ field: "projectId", message: "Projekt-ID fehlt." });
    if (!value.projectCompanyId) {
      errors.push({ field: "projectCompanyId", message: "Projektfirma-ID fehlt." });
    }
    if (!value.displayName) {
      errors.push({ field: "displayName", message: "Anzeigename ist erforderlich." });
    }
    if (value.email && !value.email.includes("@")) {
      errors.push({ field: "email", message: "E-Mail ist ungültig." });
    }
    return { isValid: errors.length === 0, errors, value };
  }
}

