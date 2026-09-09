"use strict";
const { randomUUID } = require("crypto");
const projectsRepo = require("../../db/projectsRepo");
const { getFirmDirectoryService } = require("../firms/FirmDirectoryService");
const { SigekoPreNotificationRepository } = require("../../db/sigekoPreNotificationRepo");
const { createSigekoProjectService } = require("./SigekoProjectService");
const { createProjectAuthorityService } = require("./ProjectAuthorityService");
const { CONTACT_FIELDS } = require("../../../shared/sigeko/projectRoles.cjs");
const { PRE_NOTIFICATION_FIELDS, PRE_NOTIFICATION_COUNT_FIELDS, validCalendarDate,
  validatePreNotificationRow } = require("../../../shared/sigeko/preNotifications.cjs");

function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function object(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("INVALID_INPUT", "Objekt erforderlich.");
  for (const key of Reflect.ownKeys(value)) if (!keys.includes(key)) fail("INVALID_INPUT", `Unzulässiges Feld: ${String(key)}`);
}
function text(value) {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 4096) fail("INVALID_INPUT", "Text mit höchstens 4096 Zeichen erforderlich.");
  return value.trim() || null;
}
const valuesFor = role => role && !role.sourceMissing ? role.values || null : null;
const FIELD_LABELS = Object.freeze({ name: "Name", street: "Straße und Hausnummer", zip: "Postleitzahl", city: "Ort",
  duration_months: "Manuelle Dauer in ganzen Monaten", max_workers: "Höchstzahl Beschäftigte",
  employer_count: "Anzahl Arbeitgeber", self_employed_count: "Anzahl Unternehmer ohne Beschäftigte" });
function defaults() {
  return { ...Object.fromEntries(PRE_NOTIFICATION_FIELDS.map(field => [field, null])), firms_mode: "unknown", third_party_mode: "none" };
}

// Only the current editable draft is persisted here. Central sources stay live;
// document versions, signed returns and process state belong to later S5 steps.
function createPreNotificationService({ repo = new SigekoPreNotificationRepository(), projects = projectsRepo,
  projectService = createSigekoProjectService({ projects }), projectAuthorityService = createProjectAuthorityService({ projects }),
  projectFirms = null, clock = () => new Date().toISOString(), uuid = randomUUID } = {}) {
  function projectFor(projectId, writing = false) {
    const id = text(projectId);
    if (!id) fail("INVALID_INPUT", "Projekt-ID erforderlich.");
    const project = projects.getById(id);
    if (!project) fail("PROJECT_NOT_FOUND", "Projekt nicht gefunden.");
    if (writing && project.archived_at) fail("PROJECT_ARCHIVED", "Archiviertes Projekt zuerst wiederherstellen.");
    return project;
  }
  function firmsFor(projectId) {
    // Same neutral participant source as the existing shared firms-list PDF.
    return (projectFirms || getFirmDirectoryService()).listProjectParticipants({ projectId, includeInactive: false });
  }
  function read(project) {
    const record = repo.get(project.id);
    if (record) validatePreNotificationRow(record, project.id);
    const draft = record || defaults();
    const roleData = projectService.getProjectData({ projectId: project.id });
    const builder = projects.getBuilder(project.id);
    const authorityData = projectAuthorityService.getProjectAuthorities({ projectId: project.id });
    const authority = authorityData.categories.find(entry => entry.category === "LABOR_AUTHORITY") || null;
    const firms = firmsFor(project.id);
    const address = Object.fromEntries(["street", "zip", "city"].map(field => [field, project[field] || null]));
    // Core has no authoritative building-type field. In particular, the project
    // name is never silently interpreted as the type of construction work.
    const central = { project, address, builder, building_type: null, planned_start: project.geplanter_baubeginn || null,
      planning: roleData.planning, execution: roleData.execution, authority };
    const effective = { address, builder: builder.ref && !builder.sourceMissing ? builder.firm || null : null,
      building_type: draft.building_type_override ?? central.building_type,
      planned_start: draft.planned_start_override ?? central.planned_start,
      ...Object.fromEntries(PRE_NOTIFICATION_COUNT_FIELDS.map(field => [field, draft[field]])),
      planning: valuesFor(roleData.planning), execution: valuesFor(roleData.execution),
      third_party: draft.third_party_mode === "free"
        ? Object.fromEntries(CONTACT_FIELDS.map(field => [field, draft[`third_party_${field}`]])) : null,
      firms_mode: draft.firms_mode, firms, authority };
    const issues = [];
    const add = (code, field, message, action = "preNotification", status = "red") => issues.push({ code, field, message, action, status });
    const required = (values, fields, prefix, label, action) => {
      for (const field of fields) if (typeof values?.[field] !== "string" || !values[field].trim()) {
        add("FIELD_MISSING", `${prefix}.${field}`, `${label}: ${FIELD_LABELS[field]} fehlt.`, action);
      }
    };
    required(address, ["street", "zip", "city"], "address", "Baustellenadresse", "project");
    if (!builder.ref) add("BUILDER_NOT_ASSIGNED", "builder", "Bauherr ist im zentralen Projekt noch nicht zugeordnet.", "project");
    else if (builder.sourceMissing || !builder.firm) add("BUILDER_SOURCE_MISSING", "builder", "Die zugeordnete Bauherrquelle ist nicht mehr verfügbar.", "project");
    else required(effective.builder, ["name", "street", "zip", "city"], "builder", "Bauherr", "project");
    for (const [role, label] of [["planning", "SiGeKo Planung"], ["execution", "SiGeKo Ausführung"]]) {
      const source = central[role];
      const action = source?.assignment?.source === "module" ? "profile" : "roles";
      if (!source) add("ROLE_NOT_ASSIGNED", role, `${label}: Noch nicht zugeordnet.`, action);
      else if (source.sourceMissing || !source.values) add("ROLE_SOURCE_MISSING", role, `${label}: Kontaktquelle nicht verfügbar.`, action);
      else required(effective[role], ["name", "street", "zip", "city"], role, label, action);
    }
    if (!effective.building_type) add("FIELD_MISSING", "building_type", "Art des Bauvorhabens fehlt.");
    if (!effective.planned_start) add("FIELD_MISSING", "planned_start", "Voraussichtlicher Beginn fehlt.");
    else if (!validCalendarDate(effective.planned_start)) add("DATE_INVALID", "planned_start", "Voraussichtlicher Beginn ist kein gültiges Kalenderdatum.", draft.planned_start_override ? "preNotification" : "project");
    for (const field of PRE_NOTIFICATION_COUNT_FIELDS) if (effective[field] === null) {
      add("FIELD_MISSING", field, `${FIELD_LABELS[field]} fehlt.`);
    }
    if (draft.third_party_mode === "free") required(effective.third_party, ["name", "street", "zip", "city"], "third_party", "Beauftragter Dritter", "preNotification");
    if (draft.firms_mode === "attachment" && firms.length === 0) add("FIRMS_ATTACHMENT_EMPTY", "firms_mode", "Für die gewählte Anlage sind keine aktiven Projektfirmen vorhanden.", "firms");
    if (!authority || authority.status !== "green") {
      const status = authority?.status === "orange" ? "orange" : "red";
      if (authority?.issues?.length) for (const issue of authority.issues) add(issue.code, "authority", issue.message, "authorities", status);
      else add("AUTHORITY_NOT_READY", "authority", "Arbeitsschutzbehörde fehlt oder muss geprüft werden.", "authorities", status);
    }
    return { projectId: project.id, record, central, effective,
      readiness: { status: issues.some(issue => issue.status === "red") ? "red" : issues.length ? "orange" : "green", issues } };
  }
  return Object.freeze({
    getPreNotification(payload) {
      object(payload, ["projectId"]);
      return read(projectFor(payload.projectId));
    },
    savePreNotification(payload) {
      object(payload, ["projectId", "expectedRevision", "patch"]);
      object(payload.patch, PRE_NOTIFICATION_FIELDS);
      if (!Number.isSafeInteger(payload.expectedRevision) || payload.expectedRevision < 0) fail("INVALID_INPUT", "Gelesene Entwurfsrevision erforderlich.");
      return repo.transaction(() => {
        const project = projectFor(payload.projectId, true);
        const before = repo.get(project.id);
        if (before) validatePreNotificationRow(before, project.id);
        if ((before?.revision || 0) !== payload.expectedRevision) fail("PRE_NOTIFICATION_CONFLICT", "Vorankündigung wurde inzwischen geändert. Bitte erneut laden.");
        const values = { ...defaults(), ...before };
        for (const field of PRE_NOTIFICATION_FIELDS) if (Object.hasOwn(payload.patch, field)) {
          const value = payload.patch[field];
          values[field] = PRE_NOTIFICATION_COUNT_FIELDS.includes(field) || ["firms_mode", "third_party_mode"].includes(field) ? value : text(value);
        }
        // Explicitly clearing the role clears its local contact as one action.
        // Other partial patches never erase an existing third-party contact.
        if (payload.patch.third_party_mode === "none") for (const field of CONTACT_FIELDS) {
          const key = `third_party_${field}`;
          if (Object.hasOwn(payload.patch, key) && values[key] !== null) fail("INVALID_INPUT", "Ohne beauftragten Dritten sind keine Kontaktdaten zulässig.");
          values[key] = null;
        }
        const now = clock();
        const row = { ...Object.fromEntries(PRE_NOTIFICATION_FIELDS.map(field => [field, values[field]])),
          id: before?.id || uuid(), project_id: project.id, revision: before?.revision || 1,
          created_at: before?.created_at || now, updated_at: now };
        validatePreNotificationRow(row, project.id);
        if (row.firms_mode === "attachment" && firmsFor(project.id).length === 0) {
          fail("FIRMS_ATTACHMENT_EMPTY", "Eine Firmenlistenanlage erfordert mindestens eine aktive Projektfirma.");
        }
        if (before && PRE_NOTIFICATION_FIELDS.every(field => row[field] === before[field])) return read(project);
        if (before?.revision === Number.MAX_SAFE_INTEGER) fail("INVALID_INPUT", "Maximale Entwurfsrevision erreicht.");
        row.revision = (before?.revision || 0) + 1;
        const saved = before ? repo.update(row, before.revision) : repo.insert(row);
        if (!saved) fail("PRE_NOTIFICATION_CONFLICT", "Vorankündigung wurde inzwischen geändert. Bitte erneut laden.");
        return read(project);
      });
    },
  });
}

module.exports = Object.freeze({ createPreNotificationService });
