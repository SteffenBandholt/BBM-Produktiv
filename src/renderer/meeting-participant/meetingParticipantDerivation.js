import {
  filterActiveProjectCompanyEmployees,
  findProjectCompanyById,
  getProjectCompanyDisplayLabel,
  normalizeProjectCompanyEmployeeList,
  normalizeProjectCompanyList,
} from "../project-company/index.js";
import {
  findMeetingParticipantByReference,
  normalizeMeetingParticipant,
  normalizeMeetingParticipantList,
} from "./meetingParticipantModel.js";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function deriveMeetingParticipantFromProjectEmployee({
  meetingId,
  projectId,
  projectEmployee,
  projectCompany,
  active = true,
  invited = false,
} = {}) {
  const employee = projectEmployee && typeof projectEmployee === "object" ? projectEmployee : {};
  const company = projectCompany && typeof projectCompany === "object" ? projectCompany : {};

  return normalizeMeetingParticipant({
    meetingId,
    projectId: projectId ?? employee.projectId,
    projectCompanyId: employee.projectCompanyId,
    employeeId: employee.employeeId,
    localEmployeeId: employee.localEmployeeId,
    sourceType: employee.sourceType,
    displayName: employee.displayName,
    companyLabel: getProjectCompanyDisplayLabel(company),
    role: employee.role,
    phone: employee.phone,
    email: employee.email,
    active,
    invited,
  });
}

export function deriveMeetingParticipantOptionsFromActiveProjectEmployees({
  meetingId,
  projectId,
  projectCompanies,
  projectCompanyEmployees,
} = {}) {
  const companies = normalizeProjectCompanyList(projectCompanies);
  const activeEmployees = filterActiveProjectCompanyEmployees(projectCompanyEmployees);

  const options = [];
  for (const employee of activeEmployees) {
    const company = findProjectCompanyById(companies, employee.projectCompanyId);
    if (!company) continue;
    if (projectId && toText(projectId) !== toText(employee.projectId)) continue;
    const participant = deriveMeetingParticipantFromProjectEmployee({
      meetingId,
      projectId,
      projectEmployee: employee,
      projectCompany: company,
      active: true,
      invited: false,
    });
    options.push({
      value: participant.id,
      participant,
      projectEmployeeId: employee.id,
      companyId: company.id,
      companyLabel: participant.companyLabel,
      label: participant.displayName,
      subLabel: participant.role,
      sourceType: participant.sourceType,
    });
  }

  options.sort((a, b) => {
    const companyA = (a.companyLabel || "").toLowerCase();
    const companyB = (b.companyLabel || "").toLowerCase();
    if (companyA < companyB) return -1;
    if (companyA > companyB) return 1;
    const labelA = (a.label || "").toLowerCase();
    const labelB = (b.label || "").toLowerCase();
    if (labelA < labelB) return -1;
    if (labelA > labelB) return 1;
    return 0;
  });

  return options;
}

export function groupMeetingParticipantOptionsByCompany(options) {
  const grouped = new Map();
  for (const option of options || []) {
    const key = option.companyId || option.companyLabel || "-";
    if (!grouped.has(key)) {
      grouped.set(key, {
        companyId: option.companyId || "",
        companyLabel: option.companyLabel || "-",
        options: [],
      });
    }
    grouped.get(key).options.push(option);
  }
  return [...grouped.values()];
}

export function ensureMeetingParticipantFromProjectEmployee({
  participants,
  meetingId,
  projectId,
  projectEmployee,
  projectCompany,
} = {}) {
  const list = normalizeMeetingParticipantList(participants);
  const normalizedProjectEmployees = normalizeProjectCompanyEmployeeList([projectEmployee]);
  const employee = normalizedProjectEmployees[0];
  if (!employee || !employee.active) {
    return { participants: list, participant: null, created: false };
  }

  const existing = findMeetingParticipantByReference(list, {
    meetingId,
    projectCompanyId: employee.projectCompanyId,
    sourceType: employee.sourceType,
    employeeId: employee.employeeId,
    localEmployeeId: employee.localEmployeeId,
  });
  if (existing) return { participants: list, participant: existing, created: false };

  const created = deriveMeetingParticipantFromProjectEmployee({
    meetingId,
    projectId,
    projectEmployee: employee,
    projectCompany,
    active: true,
    invited: false,
  });
  return { participants: [...list, created], participant: created, created: true };
}

export function removeMeetingParticipantById(participants, participantId) {
  const wantedId = toText(participantId);
  return normalizeMeetingParticipantList(participants).filter((item) => item.id !== wantedId);
}

export function setMeetingParticipantActive(participants, participantId, active) {
  const wantedId = toText(participantId);
  return normalizeMeetingParticipantList(participants).map((item) => {
    if (item.id !== wantedId) return item;
    return { ...item, active: Boolean(active) };
  });
}

export function setMeetingParticipantInvited(participants, participantId, invited) {
  const wantedId = toText(participantId);
  return normalizeMeetingParticipantList(participants).map((item) => {
    if (item.id !== wantedId) return item;
    return { ...item, invited: Boolean(invited) };
  });
}
