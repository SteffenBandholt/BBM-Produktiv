import {
  findMeetingParticipantByReference,
  normalizeMeetingParticipant,
  normalizeMeetingParticipantList,
} from "./meetingParticipantModel.js";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toBool(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  const text = toText(value).toLowerCase();
  if (!text) return fallback;
  if (["1", "true", "yes", "ja", "active"].includes(text)) return true;
  if (["0", "false", "no", "nein", "inactive"].includes(text)) return false;
  return fallback;
}

function normalizeSourceType(value) {
  const text = toText(value).toLowerCase();
  if (text === "stamm") return "stamm";
  if (text === "global_person") return "stamm";
  return "projektlokal";
}

function deriveProjectCompanyId(employee) {
  const direct = toText(employee?.projectCompanyId || employee?.project_company_id);
  if (direct) return direct;
  const sourceType = normalizeSourceType(employee?.sourceType || employee?.kind);
  const companyId = toText(employee?.companyId || employee?.company_id);
  const localCompanyId = toText(employee?.localCompanyId || employee?.local_company_id);
  const suffix = sourceType === "stamm" ? companyId || "-" : localCompanyId || "-";
  return [toText(employee?.projectId || employee?.project_id) || "-", sourceType, suffix].join("|");
}

export function deriveActiveProjectCompanyEmployees(projectCompanyEmployees) {
  const source = Array.isArray(projectCompanyEmployees) ? projectCompanyEmployees : [];
  return source.filter((item) => toBool(item?.active ?? item?.is_active ?? item?.isActive, false));
}

function buildProjectCompanyLookup(projectCompanies) {
  const companyById = new Map();
  const companies = Array.isArray(projectCompanies) ? projectCompanies : [];

  for (const company of companies) {
    const id = toText(company?.id || company?.projectCompanyId || company?.project_company_id);
    if (!id) continue;
    companyById.set(id, company);
  }

  return companyById;
}

// Protokollnahe Teilnehmerprojektion:
// aktive Projekt-Mitarbeiter werden hier in Kandidaten fuer die
// Besprechungsteilnehmerliste uebersetzt. Das ist bewusst nicht die
// gemeinsame MitarbeiterdomÃ¤ne selbst.
export function buildMeetingParticipantCandidateOptions({
  meetingId,
  projectId,
  projectCompanies,
  projectCompanyEmployees,
  currentParticipants,
} = {}) {
  const employees = deriveActiveProjectCompanyEmployees(projectCompanyEmployees);
  const participants = normalizeMeetingParticipantList(currentParticipants);
  const companyById = buildProjectCompanyLookup(projectCompanies);

  const options = [];
  for (const employee of employees) {
    const sourceType = normalizeSourceType(employee?.sourceType || employee?.kind);
    const projectCompanyId = deriveProjectCompanyId(employee);
    const company = companyById.get(projectCompanyId) || null;
    const reference = {
      meetingId,
      projectCompanyId,
      sourceType,
      employeeId: toText(employee?.employeeId || employee?.employee_id),
      localEmployeeId: toText(employee?.localEmployeeId || employee?.local_employee_id),
    };
    const alreadySelected = Boolean(findMeetingParticipantByReference(participants, reference));

    const candidate = normalizeMeetingParticipant({
      meetingId,
      projectId,
      projectCompanyId,
      employeeId: sourceType === "stamm" ? reference.employeeId : null,
      localEmployeeId: sourceType === "projektlokal" ? reference.localEmployeeId : "",
      sourceType,
      displayName: toText(employee?.displayName || employee?.name),
      companyLabel: toText(company?.short || company?.name1 || employee?.companyLabel || employee?.firm),
      role: toText(employee?.role || employee?.rolle),
      phone: toText(employee?.phone || employee?.telefon),
      email: toText(employee?.email),
      active: true,
      invited: false,
    });

    options.push({
      value: candidate.id,
      label: candidate.displayName || candidate.email || "Teilnehmer",
      companyLabel: candidate.companyLabel,
      role: candidate.role,
      participant: candidate,
      disabled: alreadySelected,
    });
  }

  options.sort((a, b) => {
    const ca = toText(a?.companyLabel).toLowerCase();
    const cb = toText(b?.companyLabel).toLowerCase();
    if (ca < cb) return -1;
    if (ca > cb) return 1;
    const la = toText(a?.label).toLowerCase();
    const lb = toText(b?.label).toLowerCase();
    if (la < lb) return -1;
    if (la > lb) return 1;
    return 0;
  });

  return options;
}
