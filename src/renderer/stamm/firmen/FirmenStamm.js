function toText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function toId(value) {
  if (value == null) return "";
  const text = String(value).trim();
  return text;
}

function pickCompanyName(raw) {
  if (!raw || typeof raw !== "object") return "";
  const candidates = [
    raw.name,
    raw.companyName,
    raw.firmName,
    raw.label,
    raw.title,
    raw.short,
  ];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return "";
}

function buildSearchText({ id, name, raw }) {
  const parts = [id, name];
  if (raw && typeof raw === "object") {
    parts.push(toText(raw.name2));
    parts.push(toText(raw.short));
    parts.push(toText(raw.city));
    parts.push(toText(raw.email));
    parts.push(toText(raw.phone));
  }
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function normalizeCompany(company, index = 0) {
  const raw = company && typeof company === "object" ? company : {};
  const id = toId(raw.id ?? raw.companyId ?? raw.firmId ?? raw.value ?? index + 1);
  const name = pickCompanyName(raw) || `Firma ${index + 1}`;

  return {
    id,
    name,
    raw,
    searchText: buildSearchText({ id, name, raw }),
  };
}

export function normalizeCompanyList(companies) {
  if (!Array.isArray(companies)) return [];
  return companies.map((item, index) => normalizeCompany(item, index));
}

export function findCompanyById(companies, companyId) {
  const normalizedList = normalizeCompanyList(companies);
  const wantedId = toId(companyId);
  if (!wantedId) return null;
  return normalizedList.find((company) => company.id === wantedId) || null;
}

export function toCompanyOptions(companies) {
  return normalizeCompanyList(companies).map((company) => ({
    value: company.id,
    label: company.name,
  }));
}

export function filterCompanies(companies, query) {
  const normalizedList = normalizeCompanyList(companies);
  const needle = toText(query).toLowerCase();
  if (!needle) return normalizedList;
  return normalizedList.filter((company) => company.searchText.includes(needle));
}

