import { PROJECT_COMPANY_SOURCE_LOCAL } from "../constants.js";
import {
  getProjectCompanyEmployeeDisplayName,
  normalizeProjectCompanyEmployeeList,
} from "../projectCompanyEmployeeModel.js";
import { getProjectCompanyDisplayLabel, normalizeProjectCompany } from "../projectCompanyModel.js";
import { mkEl, toText } from "./dom.js";

export class ProjectCompanyEmployeeActivationList {
  constructor({
    documentRef,
    onToggleActive,
    onCreateLocalEmployee,
    onEditEmployee,
  } = {}) {
    this.documentRef = documentRef || window.document;
    this._onToggleActive = typeof onToggleActive === "function" ? onToggleActive : null;
    this._onCreateLocalEmployee =
      typeof onCreateLocalEmployee === "function" ? onCreateLocalEmployee : null;
    this._onEditEmployee = typeof onEditEmployee === "function" ? onEditEmployee : null;
    this._employees = [];
    this._selectedProjectCompany = null;
    this._readOnly = false;
    this._build();
  }

  _build() {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "project-company-employee-activation");
    this.root.setAttribute("data-component", "project-company-employee-activation");

    const header = mkEl(doc, "div", "project-company-employee-activation-header");
    this.titleEl = mkEl(doc, "div", "project-company-employee-activation-title", "Mitarbeiter im Projekt");
    this.subtitleEl = mkEl(doc, "div", "project-company-employee-activation-subtitle", "-");
    this.addBtn = mkEl(
      doc,
      "button",
      "project-company-employee-activation-btn project-company-employee-activation-btn-add",
      "Projektlokalen Mitarbeiter anlegen"
    );
    this.addBtn.type = "button";
    this.addBtn.addEventListener("click", () => {
      if (this._readOnly) return;
      if (!this._selectedProjectCompany) return;
      if (!this._canCreateLocalEmployee()) return;
      if (this._onCreateLocalEmployee) this._onCreateLocalEmployee(this._selectedProjectCompany);
    });
    header.append(this.titleEl, this.subtitleEl, this.addBtn);

    this.table = mkEl(doc, "table", "project-company-employee-activation-table");
    this.table.style.width = "100%";
    this.table.style.borderCollapse = "collapse";
    this.tableHead = mkEl(doc, "thead", "project-company-employee-activation-table-head");
    this.tableHead.innerHTML =
      "<tr>" +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Name</th>' +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Funktion</th>' +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Kontakt</th>' +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Quelle</th>' +
      '<th style="text-align:center;padding:6px;border-bottom:1px solid #ddd;width:92px;">Aktiv</th>' +
      "</tr>";

    this.tableBody = mkEl(doc, "tbody", "project-company-employee-activation-table-body");
    this.table.append(this.tableHead, this.tableBody);
    this.root.append(header, this.table);
    this._render();
  }

  _canCreateLocalEmployee() {
    const normalized = normalizeProjectCompany(this._selectedProjectCompany || {});
    return normalized.sourceType === PROJECT_COMPANY_SOURCE_LOCAL;
  }

  _render() {
    const companyLabel = this._selectedProjectCompany
      ? getProjectCompanyDisplayLabel(this._selectedProjectCompany)
      : "-";
    this.subtitleEl.textContent = companyLabel;

    const canCreateLocal = !!this._selectedProjectCompany && this._canCreateLocalEmployee();
    this.addBtn.disabled = this._readOnly || !canCreateLocal;
    this.addBtn.style.opacity = this.addBtn.disabled ? "0.55" : "1";

    this.tableBody.innerHTML = "";
    const list = normalizeProjectCompanyEmployeeList(this._employees);
    for (const employee of list) {
      const tr = this.documentRef.createElement("tr");

      const tdName = this.documentRef.createElement("td");
      tdName.style.padding = "6px";
      tdName.style.borderBottom = "1px solid #eee";
      tdName.textContent = getProjectCompanyEmployeeDisplayName(employee);

      const tdRole = this.documentRef.createElement("td");
      tdRole.style.padding = "6px";
      tdRole.style.borderBottom = "1px solid #eee";
      tdRole.textContent = toText(employee.role);

      const tdContact = this.documentRef.createElement("td");
      tdContact.style.padding = "6px";
      tdContact.style.borderBottom = "1px solid #eee";
      tdContact.textContent = toText(employee.email || employee.phone);

      const tdSource = this.documentRef.createElement("td");
      tdSource.style.padding = "6px";
      tdSource.style.borderBottom = "1px solid #eee";
      tdSource.textContent = employee.sourceType === PROJECT_COMPANY_SOURCE_LOCAL ? "Projektlokal" : "Stamm";

      const tdActive = this.documentRef.createElement("td");
      tdActive.style.padding = "6px";
      tdActive.style.borderBottom = "1px solid #eee";
      tdActive.style.textAlign = "center";

      const activeCheckbox = this.documentRef.createElement("input");
      activeCheckbox.type = "checkbox";
      activeCheckbox.checked = Boolean(employee.active);
      activeCheckbox.disabled = this._readOnly;
      activeCheckbox.addEventListener("change", () => {
        if (this._onToggleActive) this._onToggleActive(employee, Boolean(activeCheckbox.checked));
      });
      tdActive.appendChild(activeCheckbox);

      tr.append(tdName, tdRole, tdContact, tdSource, tdActive);
      tr.addEventListener("dblclick", () => {
        if (!this._onEditEmployee) return;
        if (this._readOnly) return;
        this._onEditEmployee(employee);
      });
      this.tableBody.appendChild(tr);
    }

    if (!list.length) {
      const tr = this.documentRef.createElement("tr");
      const td = this.documentRef.createElement("td");
      td.colSpan = 5;
      td.style.padding = "8px 6px";
      td.style.fontSize = "12px";
      td.style.opacity = "0.75";
      td.textContent = "Keine Mitarbeiter für diese Projektfirma vorhanden.";
      tr.appendChild(td);
      this.tableBody.appendChild(tr);
    }
  }

  getElement() {
    return this.root;
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  setReadOnly(readOnly) {
    this._readOnly = Boolean(readOnly);
    this._render();
  }

  setSelectedProjectCompany(projectCompany) {
    this._selectedProjectCompany = projectCompany ? normalizeProjectCompany(projectCompany) : null;
    this._render();
  }

  setEmployees(employees) {
    this._employees = normalizeProjectCompanyEmployeeList(employees);
    this._render();
  }

  onToggleActive(callback) {
    this._onToggleActive = typeof callback === "function" ? callback : null;
  }

  onCreateLocalEmployee(callback) {
    this._onCreateLocalEmployee = typeof callback === "function" ? callback : null;
  }

  onEditEmployee(callback) {
    this._onEditEmployee = typeof callback === "function" ? callback : null;
  }
}

