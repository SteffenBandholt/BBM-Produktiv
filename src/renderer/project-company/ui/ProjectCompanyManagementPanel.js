import { PROJECT_COMPANY_SOURCE_LOCAL } from "../constants.js";
import {
  getProjectCompanyDisplayLabel,
  normalizeProjectCompanyList,
} from "../projectCompanyModel.js";
import {
  filterProjectCompanyEmployeesByCompany,
  normalizeProjectCompanyEmployeeList,
} from "../projectCompanyEmployeeModel.js";
import { ProjectCompanyEmployeeActivationList } from "./ProjectCompanyEmployeeActivationList.js";
import { ProjectCompanyStammSelector } from "./ProjectCompanyStammSelector.js";
import { mkEl } from "./dom.js";

export class ProjectCompanyManagementPanel {
  constructor({
    documentRef,
    onAddStammCompany,
    onCreateProjectLocalCompany,
    onEditProjectCompany,
    onSelectProjectCompany,
    onToggleProjectCompanyActive,
    onToggleEmployeeActive,
    onCreateProjectLocalEmployee,
    onEditProjectCompanyEmployee,
  } = {}) {
    this.documentRef = documentRef || window.document;
    this._onAddStammCompany = typeof onAddStammCompany === "function" ? onAddStammCompany : null;
    this._onCreateProjectLocalCompany =
      typeof onCreateProjectLocalCompany === "function" ? onCreateProjectLocalCompany : null;
    this._onEditProjectCompany = typeof onEditProjectCompany === "function" ? onEditProjectCompany : null;
    this._onSelectProjectCompany =
      typeof onSelectProjectCompany === "function" ? onSelectProjectCompany : null;
    this._onToggleProjectCompanyActive =
      typeof onToggleProjectCompanyActive === "function" ? onToggleProjectCompanyActive : null;
    this._onToggleEmployeeActive =
      typeof onToggleEmployeeActive === "function" ? onToggleEmployeeActive : null;
    this._onCreateProjectLocalEmployee =
      typeof onCreateProjectLocalEmployee === "function" ? onCreateProjectLocalEmployee : null;
    this._onEditProjectCompanyEmployee =
      typeof onEditProjectCompanyEmployee === "function" ? onEditProjectCompanyEmployee : null;

    this._companies = [];
    this._employees = [];
    this._selectedProjectCompanyId = "";
    this._readOnly = false;

    this._build();
  }

  _build() {
    const doc = this.documentRef;
    this.root = mkEl(doc, "section", "project-company-management-panel");
    this.root.setAttribute("data-component", "project-company-management-panel");

    const top = mkEl(doc, "div", "project-company-management-panel-top");
    this.stammSelector = new ProjectCompanyStammSelector({
      documentRef: doc,
      onAdd: (company) => {
        if (this._onAddStammCompany) this._onAddStammCompany(company);
      },
    });
    this.createLocalBtn = mkEl(
      doc,
      "button",
      "project-company-management-panel-btn project-company-management-panel-btn-create",
      "Projektlokale Firma anlegen"
    );
    this.createLocalBtn.type = "button";
    this.createLocalBtn.addEventListener("click", () => {
      if (this._readOnly) return;
      if (this._onCreateProjectLocalCompany) this._onCreateProjectLocalCompany();
    });
    top.append(this.stammSelector.getElement(), this.createLocalBtn);

    const layout = mkEl(doc, "div", "project-company-management-panel-layout");
    layout.style.display = "grid";
    layout.style.gridTemplateColumns = "1fr 1fr";
    layout.style.gap = "12px";

    this.companySection = mkEl(doc, "div", "project-company-management-panel-company-section");
    this.companyTitle = mkEl(doc, "h3", "project-company-management-panel-company-title", "Firmen im Projekt");
    this.companyTable = mkEl(doc, "table", "project-company-management-panel-company-table");
    this.companyTable.style.width = "100%";
    this.companyTable.style.borderCollapse = "collapse";
    this.companyTableHead = mkEl(doc, "thead", "project-company-management-panel-company-table-head");
    this.companyTableHead.innerHTML =
      "<tr>" +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Firma</th>' +
      '<th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Quelle</th>' +
      '<th style="text-align:center;padding:6px;border-bottom:1px solid #ddd;width:80px;">Aktiv</th>' +
      "</tr>";
    this.companyTableBody = mkEl(doc, "tbody", "project-company-management-panel-company-table-body");
    this.companyTable.append(this.companyTableHead, this.companyTableBody);
    this.companySection.append(this.companyTitle, this.companyTable);

    this.employeeActivation = new ProjectCompanyEmployeeActivationList({
      documentRef: doc,
      onToggleActive: (employee, active) => {
        if (this._onToggleEmployeeActive) this._onToggleEmployeeActive(employee, active);
      },
      onCreateLocalEmployee: (projectCompany) => {
        if (this._onCreateProjectLocalEmployee) this._onCreateProjectLocalEmployee(projectCompany);
      },
      onEditEmployee: (employee) => {
        if (this._onEditProjectCompanyEmployee) this._onEditProjectCompanyEmployee(employee);
      },
    });

    layout.append(this.companySection, this.employeeActivation.getElement());
    this.root.append(top, layout);
    this._renderCompanyTable();
  }

  _renderCompanyTable() {
    this.companyTableBody.innerHTML = "";
    const companies = normalizeProjectCompanyList(this._companies);

    for (const company of companies) {
      const tr = this.documentRef.createElement("tr");
      const isSelected = company.id === this._selectedProjectCompanyId;
      tr.style.background = isSelected ? "rgba(0, 0, 0, 0.04)" : "transparent";
      tr.style.cursor = "pointer";

      const tdLabel = this.documentRef.createElement("td");
      tdLabel.style.padding = "6px";
      tdLabel.style.borderBottom = "1px solid #eee";
      tdLabel.textContent = getProjectCompanyDisplayLabel(company);

      const tdSource = this.documentRef.createElement("td");
      tdSource.style.padding = "6px";
      tdSource.style.borderBottom = "1px solid #eee";
      tdSource.textContent = company.sourceType === PROJECT_COMPANY_SOURCE_LOCAL ? "Projektlokal" : "Stamm";

      const tdActive = this.documentRef.createElement("td");
      tdActive.style.padding = "6px";
      tdActive.style.borderBottom = "1px solid #eee";
      tdActive.style.textAlign = "center";
      const activeCheckbox = this.documentRef.createElement("input");
      activeCheckbox.type = "checkbox";
      activeCheckbox.checked = Boolean(company.active);
      activeCheckbox.disabled = this._readOnly;
      activeCheckbox.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      activeCheckbox.addEventListener("change", () => {
        if (this._onToggleProjectCompanyActive) {
          this._onToggleProjectCompanyActive(company, Boolean(activeCheckbox.checked));
        }
      });
      tdActive.appendChild(activeCheckbox);

      tr.append(tdLabel, tdSource, tdActive);
      tr.addEventListener("click", () => {
        this._selectedProjectCompanyId = company.id;
        this._updateEmployeeSection();
        this._renderCompanyTable();
        if (this._onSelectProjectCompany) this._onSelectProjectCompany(company);
      });
      tr.addEventListener("dblclick", () => {
        if (this._readOnly) return;
        if (this._onEditProjectCompany) this._onEditProjectCompany(company);
      });

      this.companyTableBody.appendChild(tr);
    }

    if (!companies.length) {
      const tr = this.documentRef.createElement("tr");
      const td = this.documentRef.createElement("td");
      td.colSpan = 3;
      td.style.padding = "8px 6px";
      td.style.fontSize = "12px";
      td.style.opacity = "0.75";
      td.textContent = "Keine Projektfirmen vorhanden.";
      tr.appendChild(td);
      this.companyTableBody.appendChild(tr);
    }
  }

  _updateEmployeeSection() {
    const selected = this._companies.find((company) => company.id === this._selectedProjectCompanyId) || null;
    const companyEmployees = selected
      ? filterProjectCompanyEmployeesByCompany(this._employees, selected.id)
      : [];
    this.employeeActivation.setSelectedProjectCompany(selected);
    this.employeeActivation.setEmployees(companyEmployees);
    this.employeeActivation.setReadOnly(this._readOnly);
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
    this.createLocalBtn.disabled = this._readOnly;
    this.createLocalBtn.style.opacity = this._readOnly ? "0.55" : "1";
    this.stammSelector.setDisabled(this._readOnly);
    this.employeeActivation.setReadOnly(this._readOnly);
    this._renderCompanyTable();
  }

  setStammCompanies(stammCompanies) {
    this.stammSelector.setCompanies(stammCompanies);
  }

  setProjectCompanies(companies) {
    this._companies = normalizeProjectCompanyList(companies);
    if (!this._companies.some((company) => company.id === this._selectedProjectCompanyId)) {
      this._selectedProjectCompanyId = this._companies[0]?.id || "";
    }
    this._renderCompanyTable();
    this._updateEmployeeSection();
  }

  setProjectCompanyEmployees(employees) {
    this._employees = normalizeProjectCompanyEmployeeList(employees);
    this._updateEmployeeSection();
  }

  onAddStammCompany(callback) {
    this._onAddStammCompany = typeof callback === "function" ? callback : null;
  }

  onCreateProjectLocalCompany(callback) {
    this._onCreateProjectLocalCompany = typeof callback === "function" ? callback : null;
  }

  onEditProjectCompany(callback) {
    this._onEditProjectCompany = typeof callback === "function" ? callback : null;
  }

  onSelectProjectCompany(callback) {
    this._onSelectProjectCompany = typeof callback === "function" ? callback : null;
  }

  onToggleProjectCompanyActive(callback) {
    this._onToggleProjectCompanyActive = typeof callback === "function" ? callback : null;
  }

  onToggleEmployeeActive(callback) {
    this._onToggleEmployeeActive = typeof callback === "function" ? callback : null;
  }

  onCreateProjectLocalEmployee(callback) {
    this._onCreateProjectLocalEmployee = typeof callback === "function" ? callback : null;
  }

  onEditProjectCompanyEmployee(callback) {
    this._onEditProjectCompanyEmployee = typeof callback === "function" ? callback : null;
  }
}

