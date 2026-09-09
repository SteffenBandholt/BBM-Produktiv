const { CONTACT_FIELDS } = require("../../shared/sigeko/projectRoles.cjs");
const { AUTHORITY_FIELDS, MUTABLE_AUTHORITY_CATEGORIES } = require("../../shared/sigeko/authorities.cjs");
const { PRE_NOTIFICATION_COUNT_FIELDS } = require("../../shared/sigeko/preNotifications.cjs");

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
    CREATE TABLE IF NOT EXISTS sigeko_pre_notifications (
      id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0),
      project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
      building_type_override TEXT CHECK (building_type_override IS NULL OR
        (typeof(building_type_override) = 'text' AND length(trim(building_type_override)) > 0 AND length(building_type_override) <= 4096)),
      planned_start_override TEXT CHECK (planned_start_override IS NULL OR
        (length(planned_start_override) = 10 AND planned_start_override GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
          AND substr(planned_start_override, 1, 4) BETWEEN '0001' AND '9999'
          AND COALESCE(date(planned_start_override, '+0 days') = planned_start_override, 0))),
      ${PRE_NOTIFICATION_COUNT_FIELDS.map(field => `${field} INTEGER CHECK (${field} IS NULL OR
        (typeof(${field}) = 'integer' AND ${field} BETWEEN ${field === "duration_months" ? 1 : 0} AND 9007199254740991))`).join(",\n")},
      firms_mode TEXT NOT NULL DEFAULT 'unknown' CHECK (firms_mode IN ('unknown','attachment')),
      third_party_mode TEXT NOT NULL DEFAULT 'none' CHECK (third_party_mode IN ('none','free')),
      ${CONTACT_FIELDS.map(field => `third_party_${field} TEXT CHECK (third_party_${field} IS NULL OR
        (typeof(third_party_${field}) = 'text' AND length(trim(third_party_${field})) > 0 AND length(third_party_${field}) <= 4096))`).join(",\n")},
      revision INTEGER NOT NULL CHECK (typeof(revision) = 'integer' AND revision BETWEEN 1 AND 9007199254740991),
      created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
      updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
      CHECK (third_party_mode = 'free' OR (${CONTACT_FIELDS.map(field => `third_party_${field} IS NULL`).join(" AND ")}))
    );
    CREATE TABLE IF NOT EXISTS sigeko_authority_records (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL CHECK (category IN (${MUTABLE_AUTHORITY_CATEGORIES.map(category => `'${category}'`).join(",")})),
      ${AUTHORITY_FIELDS.map(key => `${key} TEXT`).join(",\n")},
      verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','confirmed','uncertain')),
      verified_at TEXT,
      verification_method TEXT,
      uncertainty_reason TEXT,
      revision INTEGER NOT NULL DEFAULT 1 CHECK (typeof(revision) = 'integer' AND revision >= 1),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK ((verified_at IS NULL AND verification_method IS NULL) OR
        (verified_at IS NOT NULL AND length(trim(verified_at)) > 0 AND verification_method IS NOT NULL AND verification_method = 'manual')),
      CHECK (
        (verification_status = 'unverified' AND verified_at IS NULL AND verification_method IS NULL AND uncertainty_reason IS NULL) OR
        (verification_status = 'confirmed' AND verified_at IS NOT NULL AND verification_method = 'manual' AND uncertainty_reason IS NULL) OR
        (verification_status = 'uncertain' AND uncertainty_reason IS NOT NULL AND length(trim(uncertainty_reason)) > 0)
      )
    );
    CREATE TABLE IF NOT EXISTS sigeko_project_authorities (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN (${MUTABLE_AUTHORITY_CATEGORIES.map(category => `'${category}'`).join(",")})),
      source_id TEXT NOT NULL CHECK (length(trim(source_id)) > 0),
      source_revision INTEGER NOT NULL CHECK (typeof(source_revision) = 'integer' AND source_revision BETWEEN 1 AND 9007199254740991),
      snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json)),
      address_street TEXT,
      address_zip TEXT,
      address_city TEXT,
      assessment_status TEXT NOT NULL CHECK (assessment_status IN ('confirmed','uncertain')),
      assessment_method TEXT NOT NULL CHECK (assessment_method IN ('manual','known_stock')),
      assessment_note TEXT NOT NULL CHECK (length(trim(assessment_note)) > 0),
      match_context_hash TEXT NOT NULL CHECK (typeof(match_context_hash) = 'text' AND length(match_context_hash) = 64
        AND length(CAST(match_context_hash AS BLOB)) = 64 AND match_context_hash NOT GLOB '*[^0-9a-f]*'),
      revision INTEGER NOT NULL CHECK (typeof(revision) = 'integer' AND revision BETWEEN 1 AND 9007199254740991),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (project_id, category),
      CHECK (COALESCE(json_type(snapshot_json) = 'object'
        AND json_extract(snapshot_json, '$.id') = source_id
        AND json_extract(snapshot_json, '$.category') = category
        AND json_type(snapshot_json, '$.revision') = 'integer'
        AND json_extract(snapshot_json, '$.revision') = source_revision, 0))
    );
  `))();
}
module.exports = Object.freeze({ ensureSigekoSchema });
