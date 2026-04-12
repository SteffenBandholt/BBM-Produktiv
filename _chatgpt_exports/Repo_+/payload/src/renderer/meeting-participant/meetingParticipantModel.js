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
  if (text === "projektlokal") return "projektlokal";
  if (text === "global_person") return "stamm";
  if (text === "project_person") return "projektlokal";
  return "projektlokal";
}

function buildParticipantId(participant) {
  const sourceType = normalizeSourceType(participant?.sourceType);
  const personRef =
    sourceType === "stamm"
      ? toText(participant?.employeeId) || "-"
      : toText(participant?.localEmployeeId) || "-";
  return [
    toText(participant?.meetingId) || "-",
    toText(participant?.projectCompanyId) || "-",
    sourceType,
    personRef,
  ].join("|");
}

export function normalizeMeetingParticipant(input) {
  const sourceType = normalizeSourceType(input?.sourceType || input?.kind);
  const normalized = {
    id: toText(input?.id),
    meetingId: toText(input?.meetingId || input?.meeting_id),
    projectId: toText(input?.projectId || input?.project_id),
    projectCompanyId: toText(input?.projectCompanyId || input?.project_company_id),
    employeeId:
      sourceType === "stamm"
        ? toText(input?.employeeId || input?.employee_id || input?.personId || input?.person_id) || null
        : null,
    localEmployeeId:
      sourceType === "projektlokal"
        ? toText(input?.localEmployeeId || input?.local_employee_id || input?.personId || input?.person_id)
        : "",
    sourceType,
    displayName: toText(input?.displayName || input?.name || input?.fullName || input?.label),
    companyLabel: toText(input?.companyLabel || input?.firm || input?.company),
    role: toText(input?.role || input?.rolle || input?.funktion),
    phone: toText(input?.phone || input?.telefon || input?.mobile || input?.handy),
    email: toText(input?.email || input?.mail || input?.email_raw),
    active: toBool(input?.active ?? input?.isPresent ?? input?.is_present, true),
    invited: toBool(
      input?.invited ??
        input?.isInDistribution ??
        input?.is_in_distribution ??
        input?.inDistribution ??
        input?.in_distribution,
      false
    ),
  };

  normalized.id = normalized.id || buildParticipantId(normalized);
  return normalized;
}

export function normalizeMeetingParticipantList(list) {
  const source = Array.isArray(list) ? list : [];
  const out = [];
  const seen = new Set();

  for (const item of source) {
    const normalized = normalizeMeetingParticipant(item);
    if (!normalized.projectCompanyId) continue;
    const key = normalized.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }

  return out;
}

export function findMeetingParticipantByReference(list, reference = {}) {
  const normalizedList = normalizeMeetingParticipantList(list);
  const sourceType = normalizeSourceType(reference?.sourceType || reference?.kind);
  const employeeId = toText(reference?.employeeId || reference?.employee_id || reference?.personId || reference?.person_id);
  const localEmployeeId = toText(
    reference?.localEmployeeId || reference?.local_employee_id || reference?.personId || reference?.person_id
  );
  const projectCompanyId = toText(reference?.projectCompanyId || reference?.project_company_id);
  const meetingId = toText(reference?.meetingId || reference?.meeting_id);

  return (
    normalizedList.find((item) => {
      if (meetingId && item.meetingId && item.meetingId !== meetingId) return false;
      if (projectCompanyId && item.projectCompanyId !== projectCompanyId) return false;
      if (item.sourceType !== sourceType) return false;
      if (sourceType === "stamm") return toText(item.employeeId) === employeeId;
      return toText(item.localEmployeeId) === localEmployeeId;
    }) || null
  );
}

export function getMeetingParticipantDisplayLabel(participant) {
  const normalized = normalizeMeetingParticipant(participant);
  if (normalized.displayName) return normalized.displayName;
  if (normalized.email) return normalized.email;
  return "Teilnehmer";
}
