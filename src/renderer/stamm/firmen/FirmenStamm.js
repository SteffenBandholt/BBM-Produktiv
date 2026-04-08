function toText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function toBool(value, fallback = true) {
  if (value == null) return fallback;
  if (typeof value === "boolean") return value;
  const text = toText(value).toLowerCase();
  if (!text) return fallback;
  if (["0", "false", "nein", "no", "inactive"].includes(text)) return false;
  if (["1", "true", "ja", "yes", "active"].includes(text)) return true;
  return fallback;
}

function toId(value) {
  if (value == null) return "";
  const text = String(value).trim();
  return text;
}

// Gemeinsame Firmen-/Stammdatenfelder:
// Diese Ableitungen sollen rendererweit wiederverwendbar bleiben und keine
// projekt- oder protokollspezifischen Annahmen enthalten.
function pickCompanyName1(raw, index) {
  if (!raw || typeof raw !== "object") return "";
  const candidates = [
    raw.name1,
    raw.Name1,
    raw.name,
    raw.companyName,
    raw.firmName,
    raw.label,
    raw.title,
  ];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return `Firma ${index + 1}`;
}

function pickCategory(raw) {
  if (!raw || typeof raw !== "object") return "";
  const candidates = [raw.category, raw.gewerk, raw.funktion, raw.function, raw.type];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return "";
}

function pickShort(raw) {
  if (!raw || typeof raw !== "object") return "";
  const candidates = [raw.short, raw.kurz, raw.shortName, raw.abbr];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return "";
}

// Gemeinsame Such-/Anzeigeprojektion fuer Firmenstammdaten.
function buildSearchText({ id, name, raw }) {
  const parts = [id, name];
  if (raw && typeof raw === "object") {
    parts.push(toText(raw.Name1));
    parts.push(toText(raw.name1));
    parts.push(toText(raw.name2));
    parts.push(toText(raw.Name2));
    parts.push(toText(raw.short));
    parts.push(toText(raw.kurz));
    parts.push(toText(raw.street));
    parts.push(toText(raw.strasse));
    parts.push(toText(raw.zip));
    parts.push(toText(raw.plz));
    parts.push(toText(raw.city));
    parts.push(toText(raw.ort));
    parts.push(toText(raw.email));
    parts.push(toText(raw.phone));
    parts.push(toText(raw.category));
    parts.push(toText(raw.gewerk));
    parts.push(toText(raw.funktion));
  }
  return parts.filter(Boolean).join(" ").toLowerCase();
}

// Gemeinsame Firmen-Normalisierung:
// akzeptiert heutige Uebergangsformen (companyId, firmId, value), damit fachnahe
// Altpfade dieselbe Stammsicht verwenden koennen.
export function normalizeCompany(company, index = 0) {
  const raw = company && typeof company === "object" ? company : {};
  const id = toId(raw.id ?? raw.companyId ?? raw.firmId ?? raw.value ?? index + 1);
  const name1 = pickCompanyName1(raw, index);
  const name2 = toText(raw.name2 ?? raw.Name2 ?? raw.name_2);
  const short = pickShort(raw);
  const street = toText(raw.street ?? raw.strasse ?? raw.address ?? raw.address1);
  const zip = toText(raw.zip ?? raw.plz ?? raw.postcode ?? raw.postalCode);
  const city = toText(raw.city ?? raw.ort ?? raw.town);
  const phone = toText(raw.phone ?? raw.telephone ?? raw.tel);
  const email = toText(raw.email ?? raw.mail ?? raw.eMail);
  const category = pickCategory(raw);
  const note = toText(raw.note ?? raw.notes ?? raw.comment ?? raw.bemerkung);
  const active = toBool(raw.active ?? raw.isActive ?? raw.enabled ?? raw.is_active, true);

  return {
    id,
    name: name1,
    name1,
    name2,
    short,
    street,
    zip,
    city,
    phone,
    email,
    category,
    note,
    active,
    raw,
    searchText: buildSearchText({ id, name: name1, raw }),
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

function buildCompanyOptionList(companies) {
  return normalizeCompanyList(companies).map((company) => ({
    value: company.id,
    label: getCompanyDisplayLabel(company),
  }));
}

// Gemeinsame Auswahloptionen fuer Firmenstammdaten.
export function toCompanyOptions(companies) {
  return buildCompanyOptionList(companies);
}

export function filterCompanies(companies, query) {
  const normalizedList = normalizeCompanyList(companies);
  const needle = toText(query).toLowerCase();
  if (!needle) return normalizedList;
  return normalizedList.filter((company) => company.searchText.includes(needle));
}

export function getCompanyDisplayLabel(company) {
  const normalized = normalizeCompany(company || {});
  const base = normalized.short || normalized.name1;
  if (!normalized.name2) return base;
  return `${base} (${normalized.name2})`;
}
