import { MeetingParticipantRegistry } from "./MeetingParticipantRegistry.js";
import { buildMeetingParticipantCandidateOptions } from "./meetingParticipantDerivation.js";
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
  if (text === "stamm" || text === "global_person") return "stamm";
  if (text === "projektlokal" || text === "project_person") return "projektlokal";
  return "projektlokal";
}

function extractPersonRef(entry, sourceType) {
  if (sourceType === "stamm") {
    return (
      toText(entry?.employeeId || entry?.employee_id || entry?.personId || entry?.person_id) || null
    );
  }
  return (
    toText(
      entry?.localEmployeeId || entry?.local_employee_id || entry?.personId || entry?.person_id
    ) || ""
  );
}

function buildFallbackProjectCompanyId({ projectId, sourceType, personRef, index }) {
  return [
    toText(projectId) || "-",
    "fallback",
    sourceType || "projektlokal",
    personRef || `row-${index + 1}`,
  ].join("|");
}

export class MeetingParticipantRepository {
  constructor({ api, registry } = {}) {
    this.api = api || (typeof window !== "undefined" ? window.bbmDb || {} : {});
    this.registry = registry || new MeetingParticipantRegistry();
  }

  _pickItems(response) {
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.list)) return response.list;
    if (Array.isArray(response?.rows)) return response.rows;
    return [];
  }

  _buildCompanyById(projectCompanies) {
    const map = new Map();
    const list = Array.isArray(projectCompanies) ? projectCompanies : [];
    for (const company of list) {
      const id = toText(company?.id || company?.projectCompanyId || company?.project_company_id);
      if (!id) continue;
      map.set(id, company);
    }
    return map;
  }

  _buildEmployeeLookup(projectCompanyEmployees) {
    const byReference = new Map();
    const list = Array.isArray(projectCompanyEmployees) ? projectCompanyEmployees : [];

    for (const employee of list) {
      const sourceType = normalizeSourceType(employee?.sourceType || employee?.kind);
      const personRef = extractPersonRef(employee, sourceType);
      if (!personRef) continue;
      const key = `${sourceType}:${personRef}`;
      const arr = byReference.get(key) || [];
      arr.push(employee);
      byReference.set(key, arr);
    }

    return { byReference };
  }

  _resolveApiEntryToParticipant({
    entry,
    index,
    meetingId,
    projectId,
    companyById,
    employeeLookup,
  }) {
    const sourceType = normalizeSourceType(entry?.sourceType || entry?.kind);
    const personRef = extractPersonRef(entry, sourceType);
    const referenceKey = personRef ? `${sourceType}:${personRef}` : "";
    const employeeMatches = referenceKey ? employeeLookup.byReference.get(referenceKey) || [] : [];
    const resolvedEmployee = employeeMatches.length === 1 ? employeeMatches[0] : null;

    const directProjectCompanyId = toText(entry?.projectCompanyId || entry?.project_company_id);
    const employeeProjectCompanyId = toText(
      resolvedEmployee?.projectCompanyId || resolvedEmployee?.project_company_id
    );
    const resolvedProjectCompanyId =
      directProjectCompanyId ||
      employeeProjectCompanyId ||
      buildFallbackProjectCompanyId({
        projectId,
        sourceType,
        personRef,
        index,
      });

    const company = companyById.get(resolvedProjectCompanyId) || null;
    const companyLabel =
      toText(entry?.companyLabel || entry?.company_label || entry?.firm || entry?.company) ||
      toText(company?.short || company?.name1 || company?.label) ||
      toText(resolvedEmployee?.companyLabel || resolvedEmployee?.firm) ||
      "-";

    const mapped = {
      id: toText(entry?.id),
      meetingId: toText(meetingId),
      projectId: toText(projectId),
      projectCompanyId: resolvedProjectCompanyId,
      sourceType,
      employeeId: sourceType === "stamm" ? personRef || null : null,
      localEmployeeId: sourceType === "projektlokal" ? personRef || "" : "",
      displayName:
        toText(entry?.displayName || entry?.name || entry?.label) ||
        toText(resolvedEmployee?.displayName || resolvedEmployee?.name) ||
        "",
      companyLabel,
      role: toText(entry?.role || entry?.rolle || entry?.funktion) || toText(resolvedEmployee?.role),
      phone: toText(entry?.phone || entry?.telefon || entry?.mobile) || toText(resolvedEmployee?.phone),
      email: toText(entry?.email || entry?.mail || entry?.email_raw) || toText(resolvedEmployee?.email),
      active: toBool(entry?.active ?? entry?.isPresent ?? entry?.is_present, true),
      invited: toBool(
        entry?.invited ??
          entry?.isInDistribution ??
          entry?.is_in_distribution ??
          entry?.inDistribution ??
          entry?.in_distribution,
        false
      ),
    };

    return normalizeMeetingParticipant(mapped);
  }

  async listByMeeting({ meetingId, projectId, projectCompanies, projectCompanyEmployees } = {}) {
    const mid = toText(meetingId);
    if (!mid) return { ok: false, error: "meetingId fehlt." };

    const companies = Array.isArray(projectCompanies) ? projectCompanies : [];
    const employees = Array.isArray(projectCompanyEmployees) ? projectCompanyEmployees : [];

    let participants = [];
    let isClosed = false;
    if (typeof this.api?.meetingParticipantsList === "function") {
      const res = await this.api.meetingParticipantsList({ meetingId: mid });
      if (!res?.ok) return { ok: false, error: res?.error || "Teilnehmer konnten nicht geladen werden." };
      isClosed = Number(res?.isClosed ?? 0) === 1 || Boolean(res?.isClosed === true);
      const rawItems = this._pickItems(res);
      const companyById = this._buildCompanyById(companies);
      const employeeLookup = this._buildEmployeeLookup(employees);
      participants = normalizeMeetingParticipantList(
        rawItems.map((entry, index) =>
          this._resolveApiEntryToParticipant({
            entry,
            index,
            meetingId: mid,
            projectId,
            companyById,
            employeeLookup,
          })
        )
      );
    } else {
      participants = this.registry.listByMeeting({ meetingId: mid, projectId });
    }

    const selectableOptions = buildMeetingParticipantCandidateOptions({
      meetingId: mid,
      projectId,
      projectCompanies: companies,
      projectCompanyEmployees: employees,
      currentParticipants: participants,
    });

    return {
      ok: true,
      participants,
      isClosed,
      selectableOptions,
      projectCompanies: companies,
      projectCompanyEmployees: employees,
    };
  }

  async saveByMeeting({ meetingId, projectId, participants } = {}) {
    const mid = toText(meetingId);
    if (!mid) return { ok: false, error: "meetingId fehlt." };

    const normalized = normalizeMeetingParticipantList(participants).map((item) => ({
      ...item,
      meetingId: item.meetingId || mid,
      projectId: item.projectId || toText(projectId),
    }));

    if (typeof this.api?.meetingParticipantsSet === "function") {
      const payloadItems = normalized.map((p) => ({
        kind: p.sourceType === "stamm" ? "global_person" : "project_person",
        personId: p.sourceType === "stamm" ? p.employeeId : p.localEmployeeId,
        isPresent: Boolean(p.active),
        isInDistribution: Boolean(p.invited),
      }));
      const res = await this.api.meetingParticipantsSet({ meetingId: mid, items: payloadItems });
      if (!res?.ok) return { ok: false, error: res?.error || "Speichern fehlgeschlagen." };
    } else {
      this.registry.replaceByMeeting({ meetingId: mid, projectId, participants: normalized });
    }

    return { ok: true, participants: normalized };
  }

  async addParticipant({ meetingId, projectId, participants, participant } = {}) {
    const candidate = normalizeMeetingParticipant(participant);
    const list = normalizeMeetingParticipantList(participants);
    const existing = findMeetingParticipantByReference(list, {
      meetingId: candidate.meetingId || meetingId,
      projectCompanyId: candidate.projectCompanyId,
      sourceType: candidate.sourceType,
      employeeId: candidate.employeeId,
      localEmployeeId: candidate.localEmployeeId,
    });
    const next = existing ? list : [...list, candidate];
    return this.saveByMeeting({ meetingId, projectId, participants: next });
  }

  async removeParticipant({ meetingId, projectId, participants, participantId } = {}) {
    const pid = toText(participantId);
    const next = normalizeMeetingParticipantList(participants).filter((item) => item.id !== pid);
    return this.saveByMeeting({ meetingId, projectId, participants: next });
  }

  async updateParticipant({ meetingId, projectId, participants, participantId, patch } = {}) {
    const pid = toText(participantId);
    const next = normalizeMeetingParticipantList(participants).map((item) =>
      item.id === pid ? normalizeMeetingParticipant({ ...item, ...(patch || {}) }) : item
    );
    return this.saveByMeeting({ meetingId, projectId, participants: next });
  }
}
