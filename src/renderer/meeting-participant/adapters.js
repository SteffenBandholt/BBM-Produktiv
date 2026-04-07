import {
  MEETING_PARTICIPANT_SOURCE_LOCAL,
  MEETING_PARTICIPANT_SOURCE_STAMM,
} from "./constants.js";
import { normalizeMeetingParticipantList } from "./meetingParticipantModel.js";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

function sourceTypeFromKind(kind) {
  return String(kind || "").trim() === "global_person"
    ? MEETING_PARTICIPANT_SOURCE_STAMM
    : MEETING_PARTICIPANT_SOURCE_LOCAL;
}

function hasValidEmail(value) {
  const email = toText(value);
  if (!email) return false;
  // bewusst pragmatisch: "sinnvolle" Mailadresse
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function fromRawParticipant(raw, index = 0) {
  const sourceType =
    toText(raw?.sourceType || raw?.source_type) || sourceTypeFromKind(raw?.kind);
  return {
    id: toText(raw?.id) || `participant-${index + 1}`,
    meetingId: toText(raw?.meetingId || raw?.meeting_id),
    projectId: toText(raw?.projectId || raw?.project_id),
    projectCompanyId: toText(raw?.projectCompanyId || raw?.project_company_id),
    employeeId:
      sourceType === MEETING_PARTICIPANT_SOURCE_STAMM
        ? toText(raw?.employeeId || raw?.employee_id || raw?.personId || raw?.person_id) || null
        : null,
    localEmployeeId:
      sourceType === MEETING_PARTICIPANT_SOURCE_LOCAL
        ? toText(raw?.localEmployeeId || raw?.local_employee_id || raw?.personId || raw?.person_id)
        : "",
    sourceType,
    displayName: toText(raw?.displayName || raw?.name || raw?.fullName || raw?.label),
    companyLabel: toText(raw?.companyLabel || raw?.firm || raw?.firm_name || raw?.company_name),
    role: toText(raw?.role || raw?.rolle || raw?.funktion),
    phone: toText(
      raw?.phone || raw?.telefon || raw?.mobile || raw?.handy || raw?.funk || raw?.cell
    ),
    email: toText(raw?.email || raw?.email_raw || raw?.mail),
    active: toBool(raw?.active ?? raw?.isPresent ?? raw?.is_present, true),
    invited: toBool(
      raw?.invited ??
        raw?.isInDistribution ??
        raw?.is_in_distribution ??
        raw?.inDistribution ??
        raw?.in_distribution,
      false
    ),
  };
}

function hasDistributionField(raw) {
  if (!raw || typeof raw !== "object") return false;
  return (
    Object.prototype.hasOwnProperty.call(raw, "invited") ||
    Object.prototype.hasOwnProperty.call(raw, "isInDistribution") ||
    Object.prototype.hasOwnProperty.call(raw, "is_in_distribution") ||
    Object.prototype.hasOwnProperty.call(raw, "inDistribution") ||
    Object.prototype.hasOwnProperty.call(raw, "in_distribution") ||
    Object.prototype.hasOwnProperty.call(raw, "send_email") ||
    Object.prototype.hasOwnProperty.call(raw, "sendEmail") ||
    Object.prototype.hasOwnProperty.call(raw, "email_enabled") ||
    Object.prototype.hasOwnProperty.call(raw, "emailEnabled")
  );
}

function normalizeParticipantsForUsage(participants) {
  const rawList = Array.isArray(participants) ? participants : [];
  const normalizedFromRaw = rawList.map((item, index) => fromRawParticipant(item, index));
  return {
    participants: normalizeMeetingParticipantList(normalizedFromRaw),
    anyDistributionField: rawList.some((item) => hasDistributionField(item)),
  };
}

export function buildMeetingParticipantPrintModel(participants) {
  const normalized = normalizeParticipantsForUsage(participants);
  const list = normalized.participants.slice();
  list.sort((a, b) => {
    const fa = toText(a?.companyLabel).toLowerCase();
    const fb = toText(b?.companyLabel).toLowerCase();
    if (fa < fb) return -1;
    if (fa > fb) return 1;
    const na = toText(a?.displayName).toLowerCase();
    const nb = toText(b?.displayName).toLowerCase();
    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
  });

  const rows = list.map((p) => ({
    name: toText(p?.displayName),
    role: toText(p?.role),
    firm: toText(p?.companyLabel),
    phone: toText(p?.phone),
    email: toText(p?.email),
    presentMark: p?.active ? "x" : "-",
    distributionMark: p?.invited ? "x" : "-",
  }));
  return { type: "participants", title: "Teilnehmer", rows };
}

export function buildMeetingParticipantMailRecipients(participants) {
  const normalized = normalizeParticipantsForUsage(participants);
  const list = normalized.participants;
  const all = [];
  const distribution = [];
  const seenAll = new Set();
  const seenDist = new Set();
  const anyDistributionField = normalized.anyDistributionField;

  for (const participant of list) {
    const email = toText(participant?.email);
    if (!hasValidEmail(email)) continue;
    const key = email.toLowerCase();
    if (!seenAll.has(key)) {
      seenAll.add(key);
      all.push(email);
    }
    if (participant?.invited && !seenDist.has(key)) {
      seenDist.add(key);
      distribution.push(email);
    }
  }

  return {
    distribution: anyDistributionField ? distribution : [...all],
    all,
    anyDistributionField,
  };
}
