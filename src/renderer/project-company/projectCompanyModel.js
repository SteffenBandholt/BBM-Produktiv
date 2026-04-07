import {
  PROJECT_COMPANY_SOURCE_LOCAL,
  PROJECT_COMPANY_SOURCE_STAMM,
} from "./constants.js";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNullableId(value) {
  const text = toText(value);
  return text || null;
}

function toBool(value, fallback = true) {
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

function pickName1(raw, index) {
  const candidates = [
    raw.name1,
    raw.Name1,
    raw.name,
    raw.companyName,
    raw.firmName,
    raw.title,
  ];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return `Projektfirma ${index + 1}`;
}

function pickShort(raw) {
  const candidates = [raw.short, raw.kurz, raw.shortName, raw.abbr];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return "";
}

function pickCategory(raw) {
  const candidates = [raw.category, raw.gewerk, raw.funktion, raw.type];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return "";
}

export function buildProjectCompanyKey(company) {
  const raw = company && typeof company === "object" ? company : {};
  const sourceType = toSourceType(raw.sourceType ?? raw.source_type ?? raw.kind);
  const projectId = toText(raw.projectId ?? raw.project_id) || "-";
  const companyId = toNullableId(raw.companyId ?? raw.company_id ?? raw.firmId ?? raw.firm_id);
  const localCompanyId = toText(
    raw.localCompanyId ?? raw.projectCompanyId ?? raw.project_company_id ?? raw.id
  );

  if (sourceType === PROJECT_COMPANY_SOURCE_STAMM) {
    return `${projectId}|stamm|${companyId || "-"}`;
  }
  return `${projectId}|projektlokal|${localCompanyId || "-"}`;
}

function buildSearchText(item) {
  return [
    item.projectId,
    item.companyId,
    item.localCompanyId,
    item.sourceType,
    item.name1,
    item.name2,
    item.short,
    item.street,
    item.zip,
    item.city,
    item.phone,
    item.email,
    item.category,
    item.note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function normalizeProjectCompany(company, index = 0) {
  const raw = company && typeof company === "object" ? company : {};
  const hintedSourceType = raw.sourceType ?? raw.source_type ?? raw.kind;
  const sourceType = toSourceType(hintedSourceType);

  const projectId = toText(raw.projectId ?? raw.project_id);
  const stammCompanyId = toNullableId(raw.companyId ?? raw.company_id ?? raw.firmId ?? raw.firm_id);
  const localCompanyId = toText(
    raw.localCompanyId ?? raw.projectCompanyId ?? raw.project_company_id ?? raw.id
  );

  const normalized = {
    id: "",
    projectId,
    companyId: sourceType === PROJECT_COMPANY_SOURCE_STAMM ? stammCompanyId : null,
    localCompanyId:
      sourceType === PROJECT_COMPANY_SOURCE_LOCAL ? localCompanyId || `local-${index + 1}` : "",
    sourceType,
    name1: pickName1(raw, index),
    name2: toText(raw.name2 ?? raw.Name2),
    short: pickShort(raw),
    street: toText(raw.street ?? raw.strasse ?? raw.address ?? raw.address1),
    zip: toText(raw.zip ?? raw.plz ?? raw.postcode ?? raw.postalCode),
    city: toText(raw.city ?? raw.ort ?? raw.town),
    phone: toText(raw.phone ?? raw.telephone ?? raw.tel),
    email: toText(raw.email ?? raw.mail ?? raw.eMail),
    category: pickCategory(raw),
    note: toText(raw.note ?? raw.notes ?? raw.comment ?? raw.bemerkung),
    active: toBool(raw.active ?? raw.isActive ?? raw.enabled ?? raw.is_active, true),
    raw,
    searchText: "",
  };

  normalized.id = buildProjectCompanyKey(normalized);
  normalized.searchText = buildSearchText(normalized);
  return normalized;
}

export function normalizeProjectCompanyList(companies) {
  if (!Array.isArray(companies)) return [];
  return companies.map((company, index) => normalizeProjectCompany(company, index));
}

export function findProjectCompanyById(companies, companyId) {
  const wantedId = toText(companyId);
  if (!wantedId) return null;
  return normalizeProjectCompanyList(companies).find((item) => item.id === wantedId) || null;
}

export function findProjectCompanyByReference(
  companies,
  { projectId, sourceType, companyId, localCompanyId } = {}
) {
  const projectIdText = toText(projectId);
  const source = toSourceType(sourceType);
  const wantedCompanyId = toText(companyId);
  const wantedLocalCompanyId = toText(localCompanyId);

  return (
    normalizeProjectCompanyList(companies).find((item) => {
      if (projectIdText && item.projectId !== projectIdText) return false;
      if (item.sourceType !== source) return false;
      if (source === PROJECT_COMPANY_SOURCE_STAMM) {
        return toText(item.companyId) === wantedCompanyId;
      }
      return toText(item.localCompanyId) === wantedLocalCompanyId;
    }) || null
  );
}

export function filterProjectCompaniesBySourceType(companies, sourceType) {
  const source = toSourceType(sourceType);
  return normalizeProjectCompanyList(companies).filter((item) => item.sourceType === source);
}

export function filterActiveProjectCompanies(companies) {
  return normalizeProjectCompanyList(companies).filter((item) => item.active);
}

export function filterProjectCompanies(companies, query) {
  const needle = toText(query).toLowerCase();
  const normalized = normalizeProjectCompanyList(companies);
  if (!needle) return normalized;
  return normalized.filter((item) => item.searchText.includes(needle));
}

export function getProjectCompanyDisplayLabel(company) {
  const normalized = normalizeProjectCompany(company || {});
  const title = normalized.short || normalized.name1 || "Projektfirma";
  const suffix = normalized.sourceType === PROJECT_COMPANY_SOURCE_STAMM ? "Stamm" : "Projektlokal";
  return `${title} (${suffix})`;
}
