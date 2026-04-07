import { ProjectCompanyEmployeeForm } from "./ProjectCompanyEmployeeForm.js";
import { mkEl } from "./dom.js";

export class ProjectCompanyEmployeeDialog {
  constructor({ documentRef, title = "Projekt-Mitarbeiter bearbeiten", onSubmit, onCancel } = {}) {
    this.documentRef = documentRef || window.document;
    this._onSubmit = typeof onSubmit === "function" ? onSubmit : null;
    this._onCancel = typeof onCancel === "function" ? onCancel : null;
    this._build(title);
  }

  _build(title) {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "project-company-employee-dialog");
    this.root.setAttribute("data-component", "project-company-employee-dialog");
    this.titleEl = mkEl(doc, "h3", "project-company-employee-dialog-title", title);
    this.form = new ProjectCompanyEmployeeForm({ documentRef: doc });

    this.actions = mkEl(doc, "div", "project-company-employee-dialog-actions");
    this.saveBtn = mkEl(
      doc,
      "button",
      "project-company-employee-dialog-btn project-company-employee-dialog-btn-save",
      "Speichern"
    );
    this.cancelBtn = mkEl(
      doc,
      "button",
      "project-company-employee-dialog-btn project-company-employee-dialog-btn-cancel",
      "Abbrechen"
    );
    this.saveBtn.type = "button";
    this.cancelBtn.type = "button";

    this.actions.append(this.cancelBtn, this.saveBtn);
    this.root.append(this.titleEl, this.form.getElement(), this.actions);

    this.saveBtn.addEventListener("click", () => {
      const result = this.form.validate();
      if (!result.isValid) return;
      if (this._onSubmit) this._onSubmit(result.value);
    });

    this.cancelBtn.addEventListener("click", () => {
      if (this._onCancel) this._onCancel();
    });
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  setValue(value) {
    this.form.setValue(value);
  }

  getValue() {
    return this.form.getValue();
  }

  setDisabled(disabled) {
    this.form.setDisabled(disabled);
    const locked = Boolean(disabled);
    this.saveBtn.disabled = locked;
    this.cancelBtn.disabled = locked;
  }

  onSubmit(callback) {
    this._onSubmit = typeof callback === "function" ? callback : null;
  }

  onCancel(callback) {
    this._onCancel = typeof callback === "function" ? callback : null;
  }
}

