import { normalizeCompany } from "../stamm/firmen/index.js";
import { filterEmployeesByCompany } from "../stamm/mitarbeiter/index.js";
import { PROJECT_COMPANY_SOURCE_LOCAL } from "./constants.js";
import {
  createProjectLocalCompany,
  createProjectLocalCompanyEmployee,
  ensureStammCompanyAssigned,
  ensureStammEmployeesProjected,
  setProjectEmployeeActiveState,
  upsertProjectCompany,
  upsertProjectCompanyEmployee,
} from "./projectCompanyDerivation.js";
import { normalizeProjectCompany, normalizeProjectCompanyList } from "./projectCompanyModel.js";
import {
  filterProjectCompanyEmployeesByCompany,
  normalizeProjectCompanyEmployeeList,
} from "./projectCompanyEmployeeModel.js";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export class ProjectCompanyRegistry {
  constructor({ projectId, companies = [], employees = [] } = {}) {
    this.projectId = toText(projectId);
    this._companies = normalizeProjectCompanyList(companies);
    this._employees = normalizeProjectCompanyEmployeeList(employees);
  }

  setProjectId(projectId) {
    this.projectId = toText(projectId);
  }

  setState({ companies = [], employees = [] } = {}) {
    this._companies = normalizeProjectCompanyList(companies);
    this._employees = normalizeProjectCompanyEmployeeList(employees);
  }

  getCompanies() {
    return normalizeProjectCompanyList(this._companies);
  }

  getEmployees() {
    return normalizeProjectCompanyEmployeeList(this._employees);
  }

  getEmployeesByProjectCompany(projectCompanyId) {
    return filterProjectCompanyEmployeesByCompany(this._employees, projectCompanyId);
  }

  addStammCompany({ stammCompany, stammEmployees = [], active = true, defaultEmployeeActive = false } = {}) {
    const sourceCompany = normalizeCompany(stammCompany || {});
    const assignResult = ensureStammCompanyAssigned({
      companies: this._companies,
      projectId: this.projectId,
      stammCompany: sourceCompany,
      active,
    });
    this._companies = assignResult.companies;

    const sourceEmployees = filterEmployeesByCompany(stammEmployees, sourceCompany.id);
    this._employees = ensureStammEmployeesProjected({
      employees: this._employees,
      projectId: this.projectId,
      projectCompany: assignResult.projectCompany,
      stammEmployees: sourceEmployees,
      defaultActive: defaultEmployeeActive,
    });

    return assignResult.projectCompany;
  }

  addProjectLocalCompany(companyData) {
    const created = createProjectLocalCompany({
      projectId: this.projectId,
      company: companyData,
      active: true,
    });
    this._companies = upsertProjectCompany(this._companies, created);
    return created;
  }

  updateProjectCompany(companyData) {
    const normalized = normalizeProjectCompany({
      ...companyData,
      projectId: this.projectId,
    });
    this._companies = upsertProjectCompany(this._companies, normalized);
    return normalized;
  }

  addProjectLocalEmployee({ projectCompanyId, employee, active = true } = {}) {
    const created = createProjectLocalCompanyEmployee({
      projectId: this.projectId,
      projectCompanyId,
      employee,
      active,
    });
    this._employees = upsertProjectCompanyEmployee(this._employees, created);
    return created;
  }

  updateProjectCompanyEmployee(employeeData) {
    const normalized = {
      ...employeeData,
      projectId: this.projectId,
    };
    this._employees = upsertProjectCompanyEmployee(this._employees, normalized);
    return normalized;
  }

  setEmployeeActive(projectEmployeeId, active) {
    this._employees = setProjectEmployeeActiveState({
      employees: this._employees,
      projectEmployeeId,
      active,
    });
    return this._employees;
  }

  setCompanyEmployeeActive(projectCompanyId, active) {
    const companyEmployees = this.getEmployeesByProjectCompany(projectCompanyId);
    for (const employee of companyEmployees) {
      this.setEmployeeActive(employee.id, active);
    }
    return this.getEmployeesByProjectCompany(projectCompanyId);
  }

  canCreateLocalEmployee(projectCompany) {
    const normalized = normalizeProjectCompany(projectCompany || {});
    return normalized.sourceType === PROJECT_COMPANY_SOURCE_LOCAL;
  }

  assignStammCompanySnapshot({
    stammCompany,
    stammCompanies = [],
    stammEmployees = [],
    defaultEmployeeActive = false,
  } = {}) {
    const sourceCompany = normalizeCompany(stammCompany || {});
    const fallback = normalizeCompany(stammCompanies.find((item) => item?.id === sourceCompany.id) || sourceCompany);
    return this.addStammCompany({
      stammCompany: fallback,
      stammEmployees,
      active: true,
      defaultEmployeeActive,
    });
  }

  assignStammCompanyRecord({ stammCompany, stammEmployees = [] } = {}) {
    return this.addStammCompany({
      stammCompany,
      stammEmployees,
    });
  }

  snapshot() {
    return {
      projectId: this.projectId,
      companies: this.getCompanies(),
      employees: this.getEmployees(),
    };
  }
}
