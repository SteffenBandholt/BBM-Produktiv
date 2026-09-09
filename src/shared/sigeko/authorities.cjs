// SiGeKo-Bestand; Projektzuständigkeit und Snapshots folgen in einem eigenen Paket.
const AUTHORITY_CATEGORIES = Object.freeze([
  "LABOR_AUTHORITY", "HOSPITAL", "ACCIDENT_DOCTOR", "WATER", "ELECTRICITY", "GAS", "EMERGENCY_112", "POLICE",
]);
const MUTABLE_AUTHORITY_CATEGORIES = Object.freeze(AUTHORITY_CATEGORIES.filter(category => category !== "EMERGENCY_112"));
const EMERGENCY_NUMBERS = Object.freeze({ EMERGENCY_112: "112", POLICE: "110" });
const AUTHORITY_FIELDS = Object.freeze([
  "organization", "street", "zip", "city", "phone", "email", "emergency_phone", "source",
  "scope_street", "scope_zip", "scope_city", "scope_district", "scope_area", "verification_note",
]);
const AUTHORITY_COLUMNS = Object.freeze([
  "id", "category", ...AUTHORITY_FIELDS, "verification_status", "verified_at", "verification_method",
  "uncertainty_reason", "revision", "created_at", "updated_at",
]);
module.exports = Object.freeze({ AUTHORITY_CATEGORIES, MUTABLE_AUTHORITY_CATEGORIES, EMERGENCY_NUMBERS, AUTHORITY_FIELDS, AUTHORITY_COLUMNS });
