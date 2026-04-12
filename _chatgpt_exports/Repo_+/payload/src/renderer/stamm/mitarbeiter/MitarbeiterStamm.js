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
  return String(value).trim();
}

// Gemeinsame Mitarbeiter-/Beteiligten-Stammdatenfelder:
// Diese Ableitungen sollen rendererweit wiederverwendbar bleiben und keine
// projekt- oder protokollnahen Annahmen enthalten.
function pickEmployeeNames(raw) {
  if (!raw || typeof raw !== "object") {
    return { firstName: "", lastName: "" };
  }
  const firstName = toText(raw.firstName ?? raw.firstname ?? raw.givenName ?? raw.vorname);
  const lastName = toText(raw.lastName ?? raw.lastname ?? raw.familyName ?? raw.nachname);
  return { firstName, lastName };
}

function pickDisplayName(raw, firstName, lastName) {
  const candidates = [
    raw?.displayName,
    raw?.fullName,
    raw.name,
    raw.label,
    raw.kontakt,
    raw.email,
  ];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  return combined;
}

// Gemeinsame Such-/Anzeigeprojektion fuer Mitarbeiterstammdaten.
function buildSearchText({ id, name, companyId, raw }) {
  const parts = [id, name, companyId];
  if (raw && typeof raw === "object") {
    parts.push(toText(raw.firstName));
    parts.push(toText(raw.lastName));
    parts.push(toText(raw.email));
    parts.push(toText(raw.phone));
    parts.push(toText(raw.mobile));
    parts.push(toText(raw.role));
    parts.push(toText(raw.function));
    parts.push(toText(raw.funktion));
  }
  return parts.filter(Boolean).join(" ").toLowerCase();
}

// Gemeinsame Mitarbeiter-Normalisierung:
// akzeptiert heutige Uebergangsformen (employeeId, personId), damit
// nutzende Schichten eine gemeinsame Stammsicht beziehen koennen.
export function normalizeEmployee(employee, index = 0) {
  const raw = employee && typeof employee === "object" ? employee : {};
  const id = toId(raw.id ?? raw.employeeId ?? raw.personId ?? raw.value ?? index + 1);
  const companyId = toId(raw.companyId ?? raw.firmId ?? raw.company?.id);
  const { firstName, lastName } = pickEmployeeNames(raw);
  const displayName = pickDisplayName(raw, firstName, lastName);
  const role = toText(raw.role ?? raw.function ?? raw.funktion ?? raw.position);
  const phone = toText(raw.phone ?? raw.telephone ?? raw.tel ?? raw.mobile);
  const email = toText(raw.email ?? raw.mail ?? raw.eMail);
  const active = toBool(raw.active ?? raw.isActive ?? raw.enabled ?? raw.is_active, true);

  return {
    id,
    companyId,
    firstName,
    lastName,
    displayName,
    name: displayName,
    role,
    phone,
    email,
    active,
    raw,
    searchText: buildSearchText({ id, name: displayName, companyId, raw }),
  };
}

export function normalizeEmployeeList(employees) {
  if (!Array.isArray(employees)) return [];
  return employees.map((item, index) => normalizeEmployee(item, index));
}

export function findEmployeeById(employees, employeeId) {
  const normalizedList = normalizeEmployeeList(employees);
  const wantedId = toId(employeeId);
  if (!wantedId) return null;
  return normalizedList.find((employee) => employee.id === wantedId) || null;
}

export function filterEmployeesByCompany(employees, companyId) {
  const normalizedList = normalizeEmployeeList(employees);
  const wantedCompanyId = toId(companyId);
  if (!wantedCompanyId) return normalizedList;
  return normalizedList.filter((employee) => employee.companyId === wantedCompanyId);
}

function buildEmployeeOptionList(employees) {
  return normalizeEmployeeList(employees).map((employee) => ({
    value: employee.id,
    label: getEmployeeDisplayName(employee),
  }));
}

// Gemeinsame Auswahloptionen fuer Mitarbeiter-/Beteiligten-Stammdaten.
export function toEmployeeOptions(employees) {
  return buildEmployeeOptionList(employees);
}

export function getEmployeeDisplayName(employee) {
  const normalized = normalizeEmployee(employee || {});
  if (normalized.displayName) return normalized.displayName;
  if (normalized.firstName || normalized.lastName) {
    return [normalized.firstName, normalized.lastName].filter(Boolean).join(" ");
  }
  if (normalized.email) return normalized.email;
  if (normalized.id) return `Mitarbeiter ${normalized.id}`;
  return "Mitarbeiter";
}
