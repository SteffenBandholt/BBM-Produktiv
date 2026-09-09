const { AUTHORITY_COLUMNS, AUTHORITY_FIELDS, MUTABLE_AUTHORITY_CATEGORIES } = require("./authorities.cjs");

const ADDRESS_FIELDS = Object.freeze(["street", "zip", "city"]);
const PROJECT_AUTHORITY_COLUMNS = Object.freeze([
  "id", "project_id", "category", "source_id", "source_revision", "snapshot_json",
  ...ADDRESS_FIELDS.map(field => `address_${field}`), "assessment_status", "assessment_method", "assessment_note",
  "match_context_hash", "revision", "created_at", "updated_at",
]);
function invalid(message) { throw new Error(`Ungültige SiGeKo-Projektzuordnung: ${message}`); }
function shape(value, columns) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("Objekt erforderlich.");
  const keys = Reflect.ownKeys(value);
  if (keys.length !== columns.length || keys.some(key => !columns.includes(key)) ||
      columns.some(key => !Object.prototype.hasOwnProperty.call(value, key))) invalid("Spalten sind unvollständig oder unbekannt.");
}
function text(value, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || value.length > 4096 || (!nullable && !value.trim())) invalid("Ungültiger Textwert.");
}
function revision(value) {
  if (!Number.isSafeInteger(value) || value < 1) invalid("Positive sichere Revision erforderlich.");
}
function validateSnapshot(snapshot) {
  shape(snapshot, AUTHORITY_COLUMNS);
  for (const key of ["id", "created_at", "updated_at"]) text(snapshot[key]);
  for (const key of [...AUTHORITY_FIELDS, "verified_at", "verification_method", "uncertainty_reason"]) text(snapshot[key], true);
  text(snapshot.organization);
  revision(snapshot.revision);
  if (!MUTABLE_AUTHORITY_CATEGORIES.includes(snapshot.category)) invalid("Unzulässige Snapshot-Kategorie.");
  const unreviewed = snapshot.verified_at === null && snapshot.verification_method === null;
  const reviewed = typeof snapshot.verified_at === "string" && !!snapshot.verified_at.trim() && snapshot.verification_method === "manual";
  if (!unreviewed && !reviewed) invalid("Inkonsistente Prüfmetadaten.");
  if (snapshot.verification_status === "unverified") {
    if (!unreviewed || snapshot.uncertainty_reason !== null) invalid("Ungeprüfter Snapshot enthält Prüfmetadaten.");
  } else if (snapshot.verification_status === "uncertain") {
    text(snapshot.uncertainty_reason);
  } else if (snapshot.verification_status === "confirmed") {
    if (!reviewed || snapshot.uncertainty_reason !== null) invalid("Bestätigter Snapshot ohne gültigen Prüfabschluss.");
    for (const key of ["street", "zip", "city", "source", "verification_note"]) text(snapshot[key]);
    if (!snapshot.scope_area?.trim() && !(snapshot.scope_zip?.trim() && snapshot.scope_city?.trim())) invalid("Bestätigter Snapshot ohne Bezugsbereich.");
    if (["WATER", "ELECTRICITY", "GAS"].includes(snapshot.category)) text(snapshot.emergency_phone);
    else if (snapshot.category === "LABOR_AUTHORITY") {
      if (!snapshot.phone?.trim() && !snapshot.email?.trim()) invalid("Bestätigte Arbeitsschutzbehörde ohne Telefon oder E-Mail.");
    } else text(snapshot.phone);
  } else invalid("Unbekannter Prüfstatus.");
}
function validateProjectAuthorityRow(row, projectId) {
  shape(row, PROJECT_AUTHORITY_COLUMNS);
  text(projectId);
  for (const key of ["id", "project_id", "source_id", "assessment_note", "created_at", "updated_at"]) text(row[key]);
  if (row.project_id !== projectId) invalid("Fremdes Projekt.");
  if (!MUTABLE_AUTHORITY_CATEGORIES.includes(row.category)) invalid("Unzulässige Kategorie.");
  for (const key of ADDRESS_FIELDS) text(row[`address_${key}`], true);
  revision(row.source_revision); revision(row.revision);
  if (!["confirmed", "uncertain"].includes(row.assessment_status)) invalid("Unzulässiger Zuständigkeitsstatus.");
  if (!["manual", "known_stock"].includes(row.assessment_method)) invalid("Unzulässige Prüfmethode.");
  if (typeof row.match_context_hash !== "string" || row.match_context_hash.length !== 64 || !/^[0-9a-f]{64}$/.test(row.match_context_hash)) {
    invalid("Ungültiger Abgleichkontext-Hash.");
  }
  if (typeof row.snapshot_json !== "string") invalid("Snapshot muss JSON-Text sein.");
  let snapshot;
  try { snapshot = JSON.parse(row.snapshot_json); } catch { invalid("Snapshot ist kein gültiges JSON."); }
  validateSnapshot(snapshot);
  if (snapshot.id !== row.source_id || snapshot.category !== row.category || snapshot.revision !== row.source_revision) {
    invalid("Snapshot stimmt nicht mit der Quellenreferenz überein.");
  }
  return row;
}
module.exports = Object.freeze({ PROJECT_AUTHORITY_COLUMNS, ADDRESS_FIELDS, validateProjectAuthorityRow });
