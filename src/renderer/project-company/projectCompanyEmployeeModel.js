import {
  PROJECT_COMPANY_SOURCE_LOCAL,
  PROJECT_COMPANY_SOURCE_STAMM,
} from "./constants.js";
import { buildProjectCompanyKey, normalizeProjectCompany } from "./projectCompanyModel.js";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNullableId(value) {
  const text = toText(value);
  return text || null;
}

function toBool(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  const text = toText(value).toLowerCase();
  if (!text) return fallback;
  if (["0", "false", "no", "nein", "inactive"].includes(text)) return false;
  if (["1", "true", "yes", "ja", "active"].includes(text)) return true;
  return fallback;
}

function toSourceType(value) {
  const text = toText(value).toLowerCase();
  if (text === PROJECT_COMPANY_SOURCE_LOCAL) return PROJECT_COMPANY_SOURCE_LOCAL;
  return PROJECT_COMPANY_SOURCE_STAMM;
}

function pickDisplayName(raw, firstName, lastName) {
  const candidates = [
    raw.displayName,
    raw.fullName,
    raw.name,
    raw.label,
    raw.kontakt,
    raw.email,
  ];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function buildSearchText(item) {
  return [
    item.projectId,
    item.projectCompanyId,
    item.companyId,
    item.employeeId,
    item.localEmployeeId,
    item.sourceType,
    item.firstName,
    item.lastName,
    item.displayName,
    item.role,
    item.phone,
    item.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function buildProjectCompanyEmployeeKey(employee) {
  const raw = employee && typeof employee === "object" ? employee : {};
  const sourceType = toSourceType(raw.sourceType ?? raw.source_type ?? raw.kind);
  const projectCompany = raw.projectCompany ? normalizeProjectCompany(raw.projectCompany) : null;
  const projectCompanyId = toText(raw.projectCompanyId ?? raw.project_company_id ?? projectCompany?.id) || "-";
  const employeeId = toNullableId(raw.employeeId ?? raw.employee_id ?? raw.personId ?? raw.person_id);
  const localEmployeeId = toText(
    raw.localEmployeeId ?? raw.projectCompanyEmployeeId ?? raw.project_company_employee_id ?? raw.id
  );
  const employeeKey =
    sourceType === PROJECT_COMPANY_SOURCE_STAMM ? employeeId || "-" : localEmployeeId || "-";
  return `${projectCompanyId}|${sourceType}|${employeeKey}`;
}

export function normalizeProjectCompanyEmployee(employee, index = 0) {
  const raw = employee && typeof employee === "object" ? employee : {};
  const hintedSourceType = raw.sourceType ?? raw.source_type ?? raw.kind;
  const sourceType = toSourceType(hintedSourceType);

  const projectCompany = raw.projectCompany ? normalizeProjectCompany(raw.projectCompany) : null;
  const projectCompanyId = toText(raw.projectCompanyId ?? raw.project_company_id ?? projectCompany?.id);
  const projectId = toText(raw.projectId ?? raw.project_id ?? projectCompany?.projectId);
  const companyId = toNullableId(raw.companyId ?? raw.company_id ?? projectCompany?.companyId);
  const employeeId = toNullableId(raw.employeeId ?? raw.employee_id ?? raw.personId ?? raw.person_id);
  const localEmployeeId = toText(
    raw.localEmployeeId ?? raw.projectCompanyEmployeeId ?? raw.project_company_employee_id ?? raw.id
  );

  const firstName = toText(raw.firstName ?? raw.firstname ?? raw.vorname ?? raw.givenName);
  const lastName = toText(raw.lastName ?? raw.lastname ?? raw.nachname ?? raw.familyName);
  const displayName = pickDisplayName(raw, firstName, lastName);

  const normalized = {
    id: "",
    projectId,
    projectCompanyId: projectCompanyId || buildProjectCompanyKey(projectCompany || {}),
    companyId,
    employeeId: sourceType === PROJECT_COMPANY_SOURCE_STAMM ? employeeId : null,
    localEmployeeId:
      sourceType === PROJECT_COMPANY_SOURCE_LOCAL ? localEmployeeId || `local-employee-${index + 1}` : "",
    sourceType,
    firstName,
    lastName,
    displayName,
    role: toText(raw.role ?? raw.funktion ?? raw.function ?? raw.position),
    phone: toText(raw.phone ?? raw.tel ?? raw.telephone ?? raw.mobile),
    email: toText(raw.email ?? raw.mail ?? raw.eMail),
    active: toBool(raw.active ?? raw.isActive ?? raw.is_active ?? raw.enabled, false),
    raw,
    searchText: "",
  };

  normalized.id = buildProjectCompanyEmployeeKey(normalized);
  normalized.searchText = buildSearchText(normalized);
  return normalized;
}

export function normalizeProjectCompanyEmployeeList(employees) {
  if (!Array.isArray(employees)) return [];
  return employees.map((employee, index) => normalizeProjectCompanyEmployee(employee, index));
}

export function findProjectCompanyEmployeeById(employees, employeeId) {
  const wantedId = toText(employeeId);
  if (!wantedId) return null;
  return normalizeProjectCompanyEmployeeList(employees).find((item) => item.id === wantedId) || null;
}

export function filterProjectCompanyEmployeesByCompany(employees, projectCompanyId) {
  const wantedId = toText(projectCompanyId);
  const normalized = normalizeProjectCompanyEmployeeList(employees);
  if (!wantedId) return normalized;
  return normalized.filter((item) => item.projectCompanyId === wantedId);
}

export function filterActiveProjectCompanyEmployees(employees) {
  return normalizeProjectCompanyEmployeeList(employees).filter((item) => item.active);
}

export function filterProjectCompanyEmployeesBySourceType(employees, sourceType) {
  const source = toSourceType(sourceType);
  return normalizeProjectCompanyEmployeeList(employees).filter((item) => item.sourceType === source);
}

export function filterProjectCompanyEmployees(employees, query) {
  const needle = toText(query).toLowerCase();
  const normalized = normalizeProjectCompanyEmployeeList(employees);
  if (!needle) return normalized;
  return normalized.filter((item) => item.searchText.includes(needle));
}

export function getProjectCompanyEmployeeDisplayName(employee) {
  const normalized = normalizeProjectCompanyEmployee(employee || {});
  if (normalized.displayName) return normalized.displayName;
  if (normalized.firstName || normalized.lastName) {
    return [normalized.firstName, normalized.lastName].filter(Boolean).join(" ").trim();
  }
  if (normalized.email) return normalized.email;
  return "Mitarbeiter";
}

export function setProjectCompanyEmployeeActive(employees, employeeId, active) {
  const wantedId = toText(employeeId);
  const nextActive = toBool(active, false);
  return normalizeProjectCompanyEmployeeList(employees).map((item) => {
    if (item.id !== wantedId) return item;
    return { ...item, active: nextActive };
  });
}
