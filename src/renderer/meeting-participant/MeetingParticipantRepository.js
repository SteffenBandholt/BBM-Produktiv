import {
  PROJECT_COMPANY_SOURCE_LOCAL,
  PROJECT_COMPANY_SOURCE_STAMM,
  buildProjectCompanyKey,
} from "../project-company/index.js";
import {
  findMeetingParticipantByReference,
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
  if (["0", "false", "no", "nein", "inactive"].includes(text)) return false;
  if (["1", "true", "yes", "ja", "active"].includes(text)) return true;
  return fallback;
}

function parseActiveFlag(value, fallback = 1) {
  return toBool(value, Boolean(fallback)) ? 1 : 0;
}

function normKind(kind) {
  const normalized = toText(kind);
  if (normalized === "global_person" || normalized === "project_person") return normalized;
  return "";
}

function sourceTypeFromKind(kind) {
  return kind === "global_person"
    ? PROJECT_COMPANY_SOURCE_STAMM
    : PROJECT_COMPANY_SOURCE_LOCAL;
}

function kindFromSourceType(sourceType) {
  return sourceType === PROJECT_COMPANY_SOURCE_STAMM
    ? "global_person"
    : "project_person";
}

export class MeetingParticipantRepository {
  constructor({ api } = {}) {
    this.api = api || (typeof window !== "undefined" ? window.bbmDb || {} : {});
  }

  _pickItems(response) {
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.list)) return response.list;
    if (Array.isArray(response?.rows)) return response.rows;
    return [];
  }

  async _invokeProjectPool(projectId) {
    if (typeof this.api?.projectParticipantsPool !== "function") {
      return { ok: false, error: "API fehlt: projectParticipantsPool" };
    }
    const payload = { projectId };
    try {
      const resObj = await this.api.projectParticipantsPool(payload);
      if (resObj?.ok && this._pickItems(resObj).length >= 0) return resObj;
    } catch (_errObj) {
      // fallback below
    }
    try {
      return await this.api.projectParticipantsPool(projectId);
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  }

  normalizePoolPerson(raw) {
    const kind = normKind(raw?.kind);
    const personId = toText(raw?.personId ?? raw?.person_id ?? raw?.id);
    if (!kind || !personId) return null;
    return {
      ...raw,
      kind,
      personId,
      name: toText(raw?.name),
      email: toText(raw?.email ?? raw?.email_raw),
      rolle: toText(raw?.rolle ?? raw?.role),
      firm: toText(raw?.firm ?? raw?.firm_name ?? raw?.firmName ?? raw?.company_name),
      firmId: toText(raw?.firmId ?? raw?.firm_id),
      is_active: parseActiveFlag(raw?.is_active ?? raw?.isActive, 1),
      firm_is_active: parseActiveFlag(raw?.firm_is_active ?? raw?.firmIsActive, 1),
    };
  }

  toProjectCompanyFromPoolPerson(projectId, poolPerson) {
    const sourceType = sourceTypeFromKind(poolPerson?.kind);
    const firmId = toText(poolPerson?.firmId);
    const firmLabel = toText(poolPerson?.firm) || "Firma";
    return {
      projectId: toText(projectId),
      sourceType,
      companyId: sourceType === PROJECT_COMPANY_SOURCE_STAMM ? firmId || null : null,
      localCompanyId: sourceType === PROJECT_COMPANY_SOURCE_LOCAL ? firmId || "local-fallback" : "",
      name1: firmLabel,
      short: firmLabel,
      active: parseActiveFlag(poolPerson?.firm_is_active, 1) === 1,
    };
  }

  toProjectEmployeeFromPoolPerson(projectId, poolPerson) {
    const sourceType = sourceTypeFromKind(poolPerson?.kind);
    const projectCompany = this.toProjectCompanyFromPoolPerson(projectId, poolPerson);
    const projectCompanyId = buildProjectCompanyKey(projectCompany);
    const personId = toText(poolPerson?.personId);
    const isEmployeeActive = parseActiveFlag(poolPerson?.is_active, 1) === 1;
    const isFirmActive = parseActiveFlag(poolPerson?.firm_is_active, 1) === 1;
    return {
      id: `${projectCompanyId}|${sourceType}|${personId || "-"}`,
      projectId: toText(projectId),
      projectCompanyId,
      companyId: sourceType === PROJECT_COMPANY_SOURCE_STAMM ? projectCompany.companyId : null,
      employeeId: sourceType === PROJECT_COMPANY_SOURCE_STAMM ? personId || null : null,
      localEmployeeId: sourceType === PROJECT_COMPANY_SOURCE_LOCAL ? personId || "" : "",
      sourceType,
      displayName: toText(poolPerson?.name),
      role: toText(poolPerson?.rolle),
      phone: toText(poolPerson?.phone ?? poolPerson?.tel),
      email: toText(poolPerson?.email),
      active: isEmployeeActive && isFirmActive,
    };
  }

  buildProjectDataFromPool(projectId, poolItems) {
    const normalizedPool = (poolItems || [])
      .map((item) => this.normalizePoolPerson(item))
      .filter(Boolean);
    const companiesById = new Map();
    const employees = [];
    for (const person of normalizedPool) {
      const company = this.toProjectCompanyFromPoolPerson(projectId, person);
      const companyId = buildProjectCompanyKey(company);
      if (!companiesById.has(companyId)) {
        companiesById.set(companyId, { ...company, id: companyId });
      }
      employees.push(this.toProjectEmployeeFromPoolPerson(projectId, person));
    }
    return {
      pool: normalizedPool,
      projectCompanies: [...companiesById.values()],
      projectCompanyEmployees: employees,
    };
  }

  async listProjectPool(projectId) {
    const res = await this._invokeProjectPool(projectId);
    if (!res?.ok) return { ok: false, error: res?.error || "Pool konnte nicht geladen werden." };
    const items = this._pickItems(res);
    return { ok: true, items };
  }

  toMeetingParticipantFromApiEntry({ projectId, meetingId, entry, poolMap }) {
    const kind = normKind(entry?.kind);
    const personId = toText(entry?.personId ?? entry?.person_id ?? entry?.id);
    if (!kind || !personId) return null;
    const key = `${kind}:${personId}`;
    const poolPerson = poolMap.get(key) || null;
    const sourceType = sourceTypeFromKind(kind);
    const company = this.toProjectCompanyFromPoolPerson(projectId, poolPerson || entry);
    const companyLabel = toText(company.short || company.name1);

    return {
      meetingId: toText(meetingId),
      projectId: toText(projectId),
      projectCompanyId: buildProjectCompanyKey(company),
      employeeId: sourceType === PROJECT_COMPANY_SOURCE_STAMM ? personId : null,
      localEmployeeId: sourceType === PROJECT_COMPANY_SOURCE_LOCAL ? personId : "",
      sourceType,
      displayName: toText(poolPerson?.name || entry?.name) || "-",
      companyLabel,
      role: toText(poolPerson?.rolle || poolPerson?.role || entry?.rolle),
      phone: toText(poolPerson?.phone || entry?.phone),
      email: toText(poolPerson?.email || entry?.email || entry?.email_raw),
      active: toBool(entry?.isPresent ?? entry?.is_present, false),
      invited: toBool(entry?.isInDistribution ?? entry?.is_in_distribution, false),
    };
  }

  async listByMeeting({ meetingId, projectId, poolItems } = {}) {
    if (!toText(meetingId)) return { ok: false, error: "meetingId fehlt." };
    if (typeof this.api?.meetingParticipantsList !== "function") {
      return { ok: false, error: "API fehlt: meetingParticipantsList" };
    }

    let effectivePoolItems = Array.isArray(poolItems) ? poolItems : null;
    if (!effectivePoolItems && toText(projectId)) {
      const poolRes = await this.listProjectPool(projectId);
      if (poolRes?.ok) effectivePoolItems = poolRes.items || [];
    }
    const projectData = this.buildProjectDataFromPool(projectId, effectivePoolItems || []);
    const poolMap = new Map(projectData.pool.map((p) => [`${p.kind}:${p.personId}`, p]));

    const res = await this.api.meetingParticipantsList({ meetingId });
    if (!res?.ok) return { ok: false, error: res?.error || "Teilnehmer konnten nicht geladen werden." };
    const apiItems = this._pickItems(res);
    const participants = normalizeMeetingParticipantList(
      apiItems
        .map((entry) =>
          this.toMeetingParticipantFromApiEntry({
            projectId,
            meetingId,
            entry,
            poolMap,
          })
        )
        .filter(Boolean)
    );

    return {
      ok: true,
      participants,
      isClosed: Boolean(res?.isClosed),
      pool: projectData.pool,
      projectCompanies: projectData.projectCompanies,
      projectCompanyEmployees: projectData.projectCompanyEmployees,
    };
  }

  toApiItem(participant) {
    const normalized = participant || {};
    const kind = kindFromSourceType(toText(normalized.sourceType));
    const personId =
      kind === "global_person"
        ? toText(normalized.employeeId)
        : toText(normalized.localEmployeeId);
    const hasEmail = toText(normalized.email) !== "";
    return {
      kind,
      personId,
      isPresent: Boolean(normalized.active),
      isInDistribution: Boolean(normalized.invited) && hasEmail,
    };
  }

  async saveByMeeting({ meetingId, participants } = {}) {
    if (!toText(meetingId)) return { ok: false, error: "meetingId fehlt." };
    if (typeof this.api?.meetingParticipantsSet !== "function") {
      return { ok: false, error: "API fehlt: meetingParticipantsSet" };
    }
    const items = normalizeMeetingParticipantList(participants)
      .map((participant) => this.toApiItem(participant))
      .filter((item) => item.kind && item.personId);

    const res = await this.api.meetingParticipantsSet({ meetingId, items });
    if (!res?.ok) return { ok: false, error: res?.error || "Speichern fehlgeschlagen." };
    return { ok: true };
  }

  async addParticipant({ meetingId, participants, participant } = {}) {
    const list = normalizeMeetingParticipantList(participants);
    const normalizedCandidate = normalizeMeetingParticipantList([participant])[0] || null;
    if (!normalizedCandidate) return { ok: false, error: "participant fehlt." };

    const existing = findMeetingParticipantByReference(list, {
      meetingId,
      projectCompanyId: normalizedCandidate.projectCompanyId,
      sourceType: normalizedCandidate.sourceType,
      employeeId: normalizedCandidate.employeeId,
      localEmployeeId: normalizedCandidate.localEmployeeId,
    });
    const nextParticipants = existing ? list : [...list, normalizedCandidate];
    const saveRes = await this.saveByMeeting({ meetingId, participants: nextParticipants });
    if (!saveRes.ok) return saveRes;
    return { ok: true, participants: nextParticipants };
  }

  async removeParticipant({ meetingId, participants, participantId } = {}) {
    const wanted = toText(participantId);
    const list = normalizeMeetingParticipantList(participants).filter((item) => item.id !== wanted);
    const saveRes = await this.saveByMeeting({ meetingId, participants: list });
    if (!saveRes.ok) return saveRes;
    return { ok: true, participants: list };
  }

  async updateParticipant({ meetingId, participants, participantId, patch } = {}) {
    const wanted = toText(participantId);
    const list = normalizeMeetingParticipantList(participants).map((item) => {
      if (item.id !== wanted) return item;
      return { ...item, ...(patch || {}) };
    });
    const saveRes = await this.saveByMeeting({ meetingId, participants: list });
    if (!saveRes.ok) return saveRes;
    return { ok: true, participants: list };
  }
}
