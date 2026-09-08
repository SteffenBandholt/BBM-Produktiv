// SiGeKo-Fachvertrag; keine zentralen Projekt-/Kontaktfelder schreibbar.
const CONTACT_FIELDS = Object.freeze(["name", "street", "zip", "city", "phone", "email"]);
const PROFILE_FIELDS = Object.freeze([...CONTACT_FIELDS, "logo_path"]);
const SOURCES = Object.freeze(["module", "person", "project_person", "free"]);
const ROLE_COLUMNS = Object.freeze(["source", "person_id", "project_person_id", ...CONTACT_FIELDS.map(key => `free_${key}`)]);
const PROJECT_COLUMNS = Object.freeze(["id", "project_id", ...ROLE_COLUMNS.map(key => `planning_${key}`),
  "execution_same_as_planning", ...ROLE_COLUMNS.map(key => `execution_${key}`), "created_at", "updated_at"]);
module.exports = Object.freeze({ CONTACT_FIELDS, PROFILE_FIELDS, SOURCES, ROLE_COLUMNS, PROJECT_COLUMNS });
