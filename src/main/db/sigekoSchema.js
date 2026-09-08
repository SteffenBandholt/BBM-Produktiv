const { CONTACT_FIELDS } = require("../../shared/sigeko/projectRoles.cjs");

function roleColumns(prefix) {
  return `${prefix}_source TEXT NOT NULL DEFAULT 'module' CHECK (${prefix}_source IN ('module','person','project_person','free')),
    ${prefix}_person_id TEXT REFERENCES persons(id) ON DELETE SET NULL,
    ${prefix}_project_person_id TEXT REFERENCES project_persons(id) ON DELETE SET NULL,
    ${CONTACT_FIELDS.map(key => `${prefix}_free_${key} TEXT`).join(",\n")}`;
}
function roleChecks(prefix) {
  return `CHECK (${prefix}_source = 'person' OR ${prefix}_person_id IS NULL),
    CHECK (${prefix}_source = 'project_person' OR ${prefix}_project_person_id IS NULL),
    CHECK (${prefix}_source = 'free' OR (${CONTACT_FIELDS.map(key => `${prefix}_free_${key} IS NULL`).join(" AND ")}))`;
}
function ensureSigekoSchema(db) {
  db.transaction(() => db.exec(`
    CREATE TABLE IF NOT EXISTS sigeko_profiles (
      id TEXT PRIMARY KEY NOT NULL CHECK (id = 'standard'),
      ${[...CONTACT_FIELDS, "logo_path"].map(key => `${key} TEXT`).join(",\n")},
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sigeko_projects (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
      ${roleColumns("planning")},
      execution_same_as_planning INTEGER NOT NULL DEFAULT 1 CHECK (execution_same_as_planning IN (0,1)),
      ${roleColumns("execution")},
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      ${roleChecks("planning")},
      ${roleChecks("execution")},
      CHECK (execution_same_as_planning = 0 OR execution_source = 'module')
    );
  `))();
}
module.exports = Object.freeze({ ensureSigekoSchema });
