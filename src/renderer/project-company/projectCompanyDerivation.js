import { normalizeCompany, normalizeCompanyList } from "../stamm/firmen/index.js";
import { normalizeEmployee, normalizeEmployeeList } from "../stamm/mitarbeiter/index.js";
import {
  PROJECT_COMPANY_SOURCE_LOCAL,
  PROJECT_COMPANY_SOURCE_STAMM,
} from "./constants.js";
import {
  findProjectCompanyByReference,
  normalizeProjectCompany,
  normalizeProjectCompanyList,
} from "./projectCompanyModel.js";
import {
  normalizeProjectCompanyEmployee,
  normalizeProjectCompanyEmployeeList,
  setProjectCompanyEmployeeActive,
} from "./projectCompanyEmployeeModel.js";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function deriveProjectCompanyFromStamm({ projectId, company, active = true } = {}) {
  const normalizedCompany = normalizeCompany(company || {});
  return normalizeProjectCompany({
    projectId,
    sourceType: PROJECT_COMPANY_SOURCE_STAMM,
    companyId: normalizedCompany.id,
    name1: normalizedCompany.name1,
    name2: normalizedCompany.name2,
    short: normalizedCompany.short,
    street: normalizedCompany.street,
    zip: normalizedCompany.zip,
    city: normalizedCompany.city,
    phone: normalizedCompany.phone,
    email: normalizedCompany.email,
    category: normalizedCompany.category,
    note: normalizedCompany.note,
    active,
  });
}

export function deriveProjectCompanyListFromStamm({ projectId, companies, active = true } = {}) {
  return normalizeCompanyList(companies).map((company) =>
    deriveProjectCompanyFromStamm({ projectId, company, active })
  );
}

export function deriveProjectCompanyEmployeeFromStamm({
  projectId,
  projectCompanyId,
  companyId,
  employee,
  active = false,
} = {}) {
  const normalizedEmployee = normalizeEmployee(employee || {});
  const resolvedCompanyId = toText(companyId || normalizedEmployee.companyId) || null;
  return normalizeProjectCompanyEmployee({
    projectId,
    projectCompanyId,
    companyId: resolvedCompanyId,
    employeeId: normalizedEmployee.id,
    sourceType: PROJECT_COMPANY_SOURCE_STAMM,
    firstName: normalizedEmployee.firstName,
    lastName: normalizedEmployee.lastName,
    displayName: normalizedEmployee.displayName,
    role: normalizedEmployee.role,
    phone: normalizedEmployee.phone,
    email: normalizedEmployee.email,
    active,
  });
}

export function deriveProjectCompanyEmployeesFromStamm({
  projectId,
  projectCompanyId,
  companyId,
  employees,
  active = false,
} = {}) {
  return normalizeEmployeeList(employees).map((employee) =>
    deriveProjectCompanyEmployeeFromStamm({
      projectId,
      projectCompanyId,
      companyId,
      employee,
      active,
    })
  );
}

export function createProjectLocalCompany({ projectId, company, active = true } = {}) {
  const raw = company && typeof company === "object" ? company : {};
  return normalizeProjectCompany({
    projectId,
    sourceType: PROJECT_COMPANY_SOURCE_LOCAL,
    companyId: null,
    localCompanyId: raw.localCompanyId ?? raw.id,
    name1: raw.name1 ?? raw.name,
    name2: raw.name2,
    short: raw.short,
    street: raw.street,
    zip: raw.zip,
    city: raw.city,
    phone: raw.phone,
    email: raw.email,
    category: raw.category,
    note: raw.note,
    active,
  });
}

export function createProjectLocalCompanyEmployee({
  projectId,
  projectCompanyId,
  companyId = null,
  employee,
  active = true,
} = {}) {
  const raw = employee && typeof employee === "object" ? employee : {};
  return normalizeProjectCompanyEmployee({
    projectId,
    projectCompanyId,
    companyId,
    sourceType: PROJECT_COMPANY_SOURCE_LOCAL,
    employeeId: null,
    localEmployeeId: raw.localEmployeeId ?? raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    displayName: raw.displayName,
    role: raw.role,
    phone: raw.phone,
    email: raw.email,
    active,
  });
}

export function upsertProjectCompany(companies, projectCompany) {
  const normalizedList = normalizeProjectCompanyList(companies);
  const normalizedItem = normalizeProjectCompany(projectCompany || {});
  const index = normalizedList.findIndex((item) => item.id === normalizedItem.id);
  if (index < 0) return [...normalizedList, normalizedItem];
  return normalizedList.map((item, currentIndex) => (currentIndex === index ? normalizedItem : item));
}

export function upsertProjectCompanyEmployee(employees, projectCompanyEmployee) {
  const normalizedList = normalizeProjectCompanyEmployeeList(employees);
  const normalizedItem = normalizeProjectCompanyEmployee(projectCompanyEmployee || {});
  const index = normalizedList.findIndex((item) => item.id === normalizedItem.id);
  if (index < 0) return [...normalizedList, normalizedItem];
  return normalizedList.map((item, currentIndex) => (currentIndex === index ? normalizedItem : item));
}

export function ensureStammCompanyAssigned({
  companies,
  projectId,
  stammCompany,
  active = true,
} = {}) {
  const normalizedCompanies = normalizeProjectCompanyList(companies);
  const normalizedStammCompany = normalizeCompany(stammCompany || {});
  const existing = findProjectCompanyByReference(normalizedCompanies, {
    projectId,
    sourceType: PROJECT_COMPANY_SOURCE_STAMM,
    companyId: normalizedStammCompany.id,
  });
  if (existing) return { companies: normalizedCompanies, projectCompany: existing, created: false };

  const createdProjectCompany = deriveProjectCompanyFromStamm({
    projectId,
    company: normalizedStammCompany,
    active,
  });
  return {
    companies: [...normalizedCompanies, createdProjectCompany],
    projectCompany: createdProjectCompany,
    created: true,
  };
}

export function ensureStammEmployeesProjected({
  employees,
  projectId,
  projectCompany,
  stammEmployees,
  defaultActive = false,
} = {}) {
  const normalizedEmployees = normalizeProjectCompanyEmployeeList(employees);
  const normalizedProjectCompany = normalizeProjectCompany(projectCompany || {});
  const sourceEmployees = normalizeEmployeeList(stammEmployees);

  const merged = [...normalizedEmployees];
  for (const employee of sourceEmployees) {
    const derived = deriveProjectCompanyEmployeeFromStamm({
      projectId,
      projectCompanyId: normalizedProjectCompany.id,
      companyId: normalizedProjectCompany.companyId,
      employee,
      active: defaultActive,
    });
    const index = merged.findIndex((item) => item.id === derived.id);
    if (index < 0) {
      merged.push(derived);
      continue;
    }
    // Fachlich wichtig: Projekt-Aktivstatus bleibt erhalten.
    merged[index] = {
      ...derived,
      active: merged[index].active,
    };
  }
  return merged;
}

export function setProjectEmployeeActiveState({ employees, projectEmployeeId, active } = {}) {
  return setProjectCompanyEmployeeActive(employees, projectEmployeeId, active);
}
