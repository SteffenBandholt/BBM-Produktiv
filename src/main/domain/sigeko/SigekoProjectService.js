const { randomUUID } = require("crypto");
const { SigekoProjectRepository } = require("../../db/sigekoProjectRepo");
const { CONTACT_FIELDS, PROFILE_FIELDS, SOURCES, ROLE_COLUMNS } = require("../../../shared/sigeko/projectRoles.cjs");
const projectsRepo = require("../../db/projectsRepo");
const personsRepo = require("../../db/personsRepo");
const firmsRepo = require("../../db/firmsRepo");
const projectPersonsRepo = require("../../db/projectPersonsRepo");
const projectFirmsRepo = require("../../db/projectFirmsRepo");

function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function object(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("INVALID_INPUT", "Objekt erforderlich.");
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail("INVALID_INPUT", `Unzulässiges Feld: ${key}`);
  return value;
}
function text(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > 4096) fail("INVALID_INPUT", "Text mit höchstens 4096 Zeichen erforderlich.");
  return value.trim() || null;
}
function active(row) { return row && !row.removed_at && !row.is_trashed && row.is_active !== 0; }
function emptyRole(prefix) {
  return Object.fromEntries(ROLE_COLUMNS.map(key => [`${prefix}_${key}`, key === "source" ? "module" : null]));
}
function assignment(row, prefix) {
  const source = row[`${prefix}_source`];
  return { source, personId: row[`${prefix}_${source === "project_person" ? "project_person_id" : "person_id"}`] || null,
    data: source === "free" ? Object.fromEntries(CONTACT_FIELDS.map(key => [key, row[`${prefix}_free_${key}`]])) : null };
}
function createSigekoProjectService({ repo = new SigekoProjectRepository(), projects = projectsRepo, persons = personsRepo,
  firms = firmsRepo, projectPersons = projectPersonsRepo, projectFirms = projectFirmsRepo,
  clock = () => new Date().toISOString(), uuid = randomUUID } = {}) {
  function projectFor(payload, writing = false) {
    const id = text(payload.projectId);
    if (!id) fail("INVALID_INPUT", "Projekt-ID erforderlich.");
    const project = projects.getById(id);
    if (!project) fail("PROJECT_NOT_FOUND", "Projekt nicht gefunden.");
    if (writing && project.archived_at) fail("PROJECT_ARCHIVED", "Archiviertes Projekt zuerst wiederherstellen.");
    return project;
  }
  function personFor(source, id, projectId) {
    if (!id) return null;
    const person = source === "person" ? persons.getPersonById(id) : projectPersons.getById(id);
    if (!active(person)) return null;
    const firm = source === "person" ? firms.getFirmById(person.firm_id) : projectFirms.getById(person.project_firm_id);
    if (!active(firm) || (source === "project_person" && firm.project_id !== projectId)) return null;
    return { name: person.name || [person.first_name, person.last_name].filter(Boolean).join(" "),
      street: firm.street || null, zip: firm.zip || null, city: firm.city || null,
      phone: person.phone || firm.phone || null, email: person.email || firm.email || null };
  }
  function roleInput(value, prefix, projectId) {
    object(value, ["source", "personId", "data"]);
    if (!SOURCES.includes(value.source)) fail("INVALID_ROLE", "Unbekannte SiGeKo-Quelle.");
    const row = emptyRole(prefix); row[`${prefix}_source`] = value.source;
    if (["person", "project_person"].includes(value.source)) {
      if (value.data != null) fail("INVALID_ROLE", "Kontaktzuordnung enthält keine Freiangaben.");
      const id = text(value.personId);
      if (!personFor(value.source, id, projectId)) fail("PERSON_NOT_AVAILABLE", "Person fehlt, ist entfernt oder gehört zu einem anderen Projekt.");
      row[`${prefix}_${value.source === "person" ? "person_id" : "project_person_id"}`] = id;
    } else {
      if (value.personId != null) fail("INVALID_ROLE", "Diese Quelle enthält keine Personen-ID.");
      if (value.source === "free") {
        object(value.data, CONTACT_FIELDS);
        for (const key of CONTACT_FIELDS) row[`${prefix}_free_${key}`] = text(value.data[key]);
      } else if (value.data != null) fail("INVALID_ROLE", "Modulstandard darf nicht im Projekt überschrieben werden.");
    }
    return row;
  }
  function resolveRole(selection, projectId, profile) {
    const values = selection.source === "module" ? (profile && Object.fromEntries(PROFILE_FIELDS.map(key => [key, profile[key]])))
      : selection.source === "free" ? selection.data : personFor(selection.source, selection.personId, projectId);
    return { assignment: selection, values: values || null, sourceMissing: !values };
  }
  function read(project) {
    const row = repo.getProject(project.id);
    if (!row) return { project, sigekoProject: null, planning: null, execution: null };
    const profile = repo.getProfile();
    const planning = resolveRole(assignment(row, "planning"), project.id, profile);
    const execution = row.execution_same_as_planning ? { ...planning, inheritedFromPlanning: true }
      : { ...resolveRole(assignment(row, "execution"), project.id, profile), inheritedFromPlanning: false };
    return { project, sigekoProject: { id: row.id, projectId: row.project_id,
      planning: assignment(row, "planning"), executionSameAsPlanning: !!row.execution_same_as_planning,
      execution: row.execution_same_as_planning ? null : assignment(row, "execution"),
      createdAt: row.created_at, updatedAt: row.updated_at }, planning, execution };
  }
  return Object.freeze({
    getCoordinatorProfile() { return repo.getProfile(); },
    saveCoordinatorProfile(payload) {
      object(payload, ["patch"]); object(payload.patch, PROFILE_FIELDS);
      return repo.transaction(() => {
        const current = repo.getProfile(); const now = clock();
        const row = { id: "standard", created_at: current?.created_at || now, updated_at: now };
        for (const key of PROFILE_FIELDS) row[key] = payload.patch[key] === undefined ? current?.[key] ?? null : text(payload.patch[key]);
        return repo.saveProfile(row);
      });
    },
    getProjectData(payload) { object(payload, ["projectId"]); return read(projectFor(payload)); },
    saveProjectData(payload) {
      object(payload, ["projectId", "planning", "executionSameAsPlanning", "execution"]);
      return repo.transaction(() => {
        const project = projectFor(payload, true); const current = repo.getProject(project.id); const now = clock();
        const row = current || { id: uuid(), project_id: project.id, ...emptyRole("planning"),
          execution_same_as_planning: 1, ...emptyRole("execution"), created_at: now };
        if (payload.planning !== undefined) Object.assign(row, roleInput(payload.planning, "planning", project.id));
        if (payload.executionSameAsPlanning !== undefined) {
          if (typeof payload.executionSameAsPlanning !== "boolean") fail("INVALID_ROLE", "Wie Planung muss ein boolescher Wert sein.");
          row.execution_same_as_planning = Number(payload.executionSameAsPlanning);
        }
        if (row.execution_same_as_planning) {
          if (payload.execution !== undefined) fail("INVALID_ROLE", "Wie Planung und separate Ausführung schließen sich aus.");
          Object.assign(row, emptyRole("execution"));
        } else if (payload.execution !== undefined) Object.assign(row, roleInput(payload.execution, "execution", project.id));
        row.updated_at = now; repo.saveProject(row);
        return read(project);
      });
    },
  });
}
module.exports = Object.freeze({ createSigekoProjectService });
