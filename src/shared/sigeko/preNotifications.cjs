"use strict";
const { CONTACT_FIELDS } = require("./projectRoles.cjs");

const PRE_NOTIFICATION_FIELDS = Object.freeze([
  "building_type_override", "planned_start_override", "duration_months", "max_workers",
  "employer_count", "self_employed_count", "firms_mode", "third_party_mode",
  ...CONTACT_FIELDS.map(field => `third_party_${field}`),
]);
const PRE_NOTIFICATION_COLUMNS = Object.freeze([
  "id", "project_id", ...PRE_NOTIFICATION_FIELDS, "revision", "created_at", "updated_at",
]);
const PRE_NOTIFICATION_COUNT_FIELDS = Object.freeze(["duration_months", "max_workers", "employer_count", "self_employed_count"]);

function invalid(message) {
  throw Object.assign(new Error(`Ungültige Vorankündigung: ${message}`), { code: "INVALID_INPUT" });
}
function validCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}
function text(value, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || value.length > 4096 || !value.trim() || value !== value.trim()) {
    invalid("Nicht leerer, bereinigter Text mit höchstens 4096 Zeichen erforderlich.");
  }
}
function validatePreNotificationRow(row, projectId) {
  if (!row || typeof row !== "object" || Array.isArray(row)) invalid("Objekt erforderlich.");
  const keys = Reflect.ownKeys(row);
  if (keys.length !== PRE_NOTIFICATION_COLUMNS.length || keys.some(key => !PRE_NOTIFICATION_COLUMNS.includes(key)) ||
      PRE_NOTIFICATION_COLUMNS.some(key => !Object.hasOwn(row, key))) invalid("Spalten sind unvollständig oder unbekannt.");
  text(projectId);
  for (const field of ["id", "project_id", "created_at", "updated_at"]) text(row[field]);
  if (row.project_id !== projectId) invalid("Fremdes Projekt.");
  text(row.building_type_override, true);
  if (row.planned_start_override !== null && !validCalendarDate(row.planned_start_override)) invalid("Gültiges Kalenderdatum im Format JJJJ-MM-TT erforderlich.");
  for (const field of PRE_NOTIFICATION_COUNT_FIELDS) {
    if (row[field] !== null && (!Number.isSafeInteger(row[field]) || row[field] < (field === "duration_months" ? 1 : 0))) {
      invalid(`${field}: ${field === "duration_months" ? "Positive" : "Nicht negative"} ganze Zahl erforderlich.`);
    }
  }
  if (!["unknown", "attachment"].includes(row.firms_mode)) invalid("Unbekannter Firmenlistenmodus.");
  if (!["none", "free"].includes(row.third_party_mode)) invalid("Unbekannter Modus des beauftragten Dritten.");
  for (const field of CONTACT_FIELDS) {
    text(row[`third_party_${field}`], true);
    if (row.third_party_mode === "none" && row[`third_party_${field}`] !== null) invalid("Ohne beauftragten Dritten sind keine Kontaktdaten zulässig.");
  }
  if (!Number.isSafeInteger(row.revision) || row.revision < 1) invalid("Positive sichere Revision erforderlich.");
  return row;
}

module.exports = Object.freeze({ PRE_NOTIFICATION_FIELDS, PRE_NOTIFICATION_COLUMNS, PRE_NOTIFICATION_COUNT_FIELDS,
  validCalendarDate, validatePreNotificationRow });
