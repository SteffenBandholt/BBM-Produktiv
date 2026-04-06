function toText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function toId(value) {
  if (value == null) return "";
  return String(value).trim();
}

function pickEmployeeName(raw) {
  if (!raw || typeof raw !== "object") return "";
  const firstName = toText(raw.firstName ?? raw.firstname ?? raw.givenName ?? raw.vorname);
  const lastName = toText(raw.lastName ?? raw.lastname ?? raw.familyName ?? raw.nachname);
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  const candidates = [
    raw.name,
    raw.displayName,
    raw.fullName,
    raw.label,
    raw.email,
  ];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  return "";
}

function buildSearchText({ id, name, companyId, raw }) {
  const parts = [id, name, companyId];
  if (raw && typeof raw === "object") {
    parts.push(toText(raw.email));
    parts.push(toText(raw.phone));
    parts.push(toText(raw.role));
    parts.push(toText(raw.function));
    parts.push(toText(raw.funktion));
  }
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function normalizeEmployee(employee, index = 0) {
  const raw = employee && typeof employee === "object" ? employee : {};
  const id = toId(raw.id ?? raw.employeeId ?? raw.personId ?? raw.value ?? index + 1);
  const companyId = toId(raw.companyId ?? raw.firmId ?? raw.company?.id);
  const name = pickEmployeeName(raw) || `Mitarbeiter ${index + 1}`;

  return {
    id,
    companyId,
    name,
    raw,
    searchText: buildSearchText({ id, name, companyId, raw }),
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

export function toEmployeeOptions(employees) {
  return normalizeEmployeeList(employees).map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));
}

