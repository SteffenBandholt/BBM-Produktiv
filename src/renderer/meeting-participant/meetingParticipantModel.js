import {
  MEETING_PARTICIPANT_SOURCE_LOCAL,
  MEETING_PARTICIPANT_SOURCE_STAMM,
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
  if (text === MEETING_PARTICIPANT_SOURCE_LOCAL) return MEETING_PARTICIPANT_SOURCE_LOCAL;
  return MEETING_PARTICIPANT_SOURCE_STAMM;
}

function buildDisplayName(raw) {
  const candidates = [
    raw.displayName,
    raw.fullName,
    raw.name,
    raw.label,
    raw.email,
  ];
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return text;
  }
  const firstName = toText(raw.firstName ?? raw.firstname ?? raw.vorname);
  const lastName = toText(raw.lastName ?? raw.lastname ?? raw.nachname);
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function buildSearchText(item) {
  return [
    item.meetingId,
    item.projectId,
    item.projectCompanyId,
    item.employeeId,
    item.localEmployeeId,
    item.sourceType,
    item.displayName,
    item.companyLabel,
    item.role,
    item.phone,
    item.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function buildMeetingParticipantKey(participant) {
  const raw = participant && typeof participant === "object" ? participant : {};
  const meetingId = toText(raw.meetingId ?? raw.meeting_id) || "-";
  const projectCompanyId = toText(raw.projectCompanyId ?? raw.project_company_id) || "-";
  const sourceType = toSourceType(raw.sourceType ?? raw.source_type ?? raw.kind);
  const employeeRef =
    sourceType === MEETING_PARTICIPANT_SOURCE_STAMM
      ? toNullableId(raw.employeeId ?? raw.employee_id ?? raw.personId ?? raw.person_id)
      : toText(
          raw.localEmployeeId ?? raw.projectEmployeeId ?? raw.project_employee_id ?? raw.id
        );
  return `${meetingId}|${projectCompanyId}|${sourceType}|${employeeRef || "-"}`;
}

export function normalizeMeetingParticipant(participant, index = 0) {
  const raw = participant && typeof participant === "object" ? participant : {};
  const sourceType = toSourceType(raw.sourceType ?? raw.source_type ?? raw.kind);
  const meetingId = toText(raw.meetingId ?? raw.meeting_id);
  const projectId = toText(raw.projectId ?? raw.project_id);
  const projectCompanyId = toText(raw.projectCompanyId ?? raw.project_company_id);
  const employeeId = toNullableId(raw.employeeId ?? raw.employee_id ?? raw.personId ?? raw.person_id);
  const localEmployeeId = toText(
    raw.localEmployeeId ?? raw.projectEmployeeId ?? raw.project_employee_id ?? raw.id
  );

  const normalized = {
    id: "",
    meetingId,
    projectId,
    projectCompanyId,
    employeeId: sourceType === MEETING_PARTICIPANT_SOURCE_STAMM ? employeeId : null,
    localEmployeeId:
      sourceType === MEETING_PARTICIPANT_SOURCE_LOCAL ? localEmployeeId || `local-${index + 1}` : "",
    sourceType,
    displayName: buildDisplayName(raw),
    companyLabel: toText(raw.companyLabel ?? raw.company_label ?? raw.companyName),
    role: toText(raw.role ?? raw.funktion ?? raw.function ?? raw.position),
    phone: toText(raw.phone ?? raw.tel ?? raw.telephone ?? raw.mobile),
    email: toText(raw.email ?? raw.mail ?? raw.eMail),
    active: toBool(raw.active ?? raw.isActive ?? raw.is_active ?? raw.enabled, true),
    invited: toBool(raw.invited ?? raw.isInvited ?? raw.is_invited ?? raw.mailPrepared, false),
    raw,
    searchText: "",
  };

  normalized.id = buildMeetingParticipantKey(normalized);
  normalized.searchText = buildSearchText(normalized);
  return normalized;
}

export function normalizeMeetingParticipantList(participants) {
  if (!Array.isArray(participants)) return [];
  return participants.map((participant, index) => normalizeMeetingParticipant(participant, index));
}

export function findMeetingParticipantById(participants, participantId) {
  const wantedId = toText(participantId);
  if (!wantedId) return null;
  return normalizeMeetingParticipantList(participants).find((item) => item.id === wantedId) || null;
}

export function findMeetingParticipantByReference(
  participants,
  { meetingId, projectCompanyId, sourceType, employeeId, localEmployeeId } = {}
) {
  const meetingIdText = toText(meetingId);
  const projectCompanyIdText = toText(projectCompanyId);
  const source = toSourceType(sourceType);
  const employeeIdText = toText(employeeId);
  const localEmployeeIdText = toText(localEmployeeId);

  return (
    normalizeMeetingParticipantList(participants).find((item) => {
      if (meetingIdText && item.meetingId !== meetingIdText) return false;
      if (projectCompanyIdText && item.projectCompanyId !== projectCompanyIdText) return false;
      if (item.sourceType !== source) return false;
      if (source === MEETING_PARTICIPANT_SOURCE_STAMM) return toText(item.employeeId) === employeeIdText;
      return toText(item.localEmployeeId) === localEmployeeIdText;
    }) || null
  );
}

export function filterMeetingParticipantsByMeeting(participants, meetingId) {
  const meetingIdText = toText(meetingId);
  const normalized = normalizeMeetingParticipantList(participants);
  if (!meetingIdText) return normalized;
  return normalized.filter((item) => item.meetingId === meetingIdText);
}

export function filterMeetingParticipantsByProject(participants, projectId) {
  const projectIdText = toText(projectId);
  const normalized = normalizeMeetingParticipantList(participants);
  if (!projectIdText) return normalized;
  return normalized.filter((item) => item.projectId === projectIdText);
}

export function filterActiveMeetingParticipants(participants) {
  return normalizeMeetingParticipantList(participants).filter((item) => item.active);
}

export function filterMeetingParticipants(participants, query) {
  const needle = toText(query).toLowerCase();
  const normalized = normalizeMeetingParticipantList(participants);
  if (!needle) return normalized;
  return normalized.filter((item) => item.searchText.includes(needle));
}

export function getMeetingParticipantDisplayLabel(participant) {
  const normalized = normalizeMeetingParticipant(participant || {});
  const name = normalized.displayName || "Teilnehmer";
  if (!normalized.companyLabel) return name;
  return `${name} - ${normalized.companyLabel}`;
}

