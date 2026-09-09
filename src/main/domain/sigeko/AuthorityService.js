"use strict";
const { randomUUID } = require("crypto");
const { SigekoAuthoritiesRepository } = require("../../db/sigekoAuthoritiesRepo");
const { AUTHORITY_CATEGORIES, MUTABLE_AUTHORITY_CATEGORIES, AUTHORITY_FIELDS } = require("../../../shared/sigeko/authorities.cjs");

const UTILITIES = new Set(["WATER", "ELECTRICITY", "GAS"]);
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function object(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("INVALID_INPUT", "Objekt erforderlich.");
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail("INVALID_INPUT", `Unzulässiges Feld: ${key}`);
  return value;
}
function text(value) {
  if (value == null) return null;
  if (typeof value !== "string" || value.length > 4096) fail("INVALID_INPUT", "Text mit höchstens 4096 Zeichen erforderlich.");
  return value.trim() || null;
}
function category(value, mutable = false) {
  if (!(mutable ? MUTABLE_AUTHORITY_CATEGORIES : AUTHORITY_CATEGORIES).includes(value)) {
    fail("INVALID_CATEGORY", "Unbekannte oder nicht bearbeitbare Behördenkategorie.");
  }
  return value;
}
function confirmationIssues(row) {
  const issues = [];
  const required = [["organization", "Stelle / Einrichtung / Betreiber"], ["street", "Straße und Hausnummer"],
    ["zip", "Postleitzahl"], ["city", "Ort"], ["source", "Belastbare Quelle"], ["verification_note", "Fachlicher Prüfnachweis"]];
  if (UTILITIES.has(row.category)) required.push(["emergency_phone", "Bestätigter Havarie-/Störkontakt"]);
  else if (row.category !== "LABOR_AUTHORITY") required.push(["phone", "Telefonkontakt"]);
  else if (!row.phone?.trim() && !row.email?.trim()) issues.push({ field: "contact", message: "Telefon- oder E-Mail-Kontakt der Arbeitsschutzbehörde fehlt." });
  for (const [field, label] of required) if (!row[field]?.trim()) issues.push({ field, message: `${label} fehlt.` });
  if (!row.scope_area?.trim() && !(row.scope_zip?.trim() && row.scope_city?.trim())) {
    issues.push({ field: "scope", message: "Dokumentiertes Zuständigkeits-/Bezugsgebiet oder Bezugsort mit PLZ fehlt." });
  }
  return issues;
}
const result = row => ({ ...row, confirmationIssues: confirmationIssues(row) });

// Module-wide verified records are not project assignments. Confirmation records
// an explicit manual review; it never claims an automatic source verification.
function createAuthorityService({ repo = new SigekoAuthoritiesRepository(), clock = () => new Date().toISOString(), uuid = randomUUID } = {}) {
  function get(id) {
    id = text(id);
    if (!id) fail("INVALID_INPUT", "Datensatz-ID erforderlich.");
    const row = repo.getById(id);
    if (!row) fail("AUTHORITY_NOT_FOUND", "Behörden-/Kontaktdatensatz nicht gefunden.");
    return row;
  }
  function current(payload) {
    if (!Number.isSafeInteger(payload.expectedRevision) || payload.expectedRevision < 1) fail("INVALID_INPUT", "Gelesene Datensatzrevision erforderlich.");
    const row = get(payload.id);
    if (row.revision !== payload.expectedRevision) fail("AUTHORITY_CONFLICT", "Datensatz wurde inzwischen geändert. Bitte erneut laden und prüfen.");
    return row;
  }
  function update(row, changes) {
    const saved = repo.update({ ...row, ...changes, revision: row.revision + 1, updated_at: clock() }, row.revision);
    if (!saved) fail("AUTHORITY_CONFLICT", "Datensatz wurde inzwischen geändert. Bitte erneut laden und prüfen.");
    return result(saved);
  }
  return Object.freeze({
    listAuthorityRecords(payload = {}) {
      object(payload, ["category"]);
      const filter = payload.category === undefined ? null : category(payload.category);
      return repo.list({ category: filter }).map(result);
    },
    getAuthorityRecord(payload) { object(payload, ["id"]); return result(get(payload.id)); },
    saveAuthorityRecord(payload) {
      object(payload, ["id", "expectedRevision", "patch"]); object(payload.patch, ["category", ...AUTHORITY_FIELDS]);
      return repo.transaction(() => {
        const creating = payload.id === undefined;
        if (creating && payload.expectedRevision !== undefined) fail("INVALID_INPUT", "Neue Datensätze haben noch keine Revision.");
        const before = creating ? null : current(payload);
        const selectedCategory = payload.patch.category === undefined && before ? before.category : category(payload.patch.category, true);
        if (before && selectedCategory !== before.category) fail("INVALID_CATEGORY", "Die Kategorie eines bestehenden Datensatzes ist unveränderlich.");
        const values = Object.fromEntries(AUTHORITY_FIELDS.map(field => [field,
          payload.patch[field] === undefined ? before?.[field] ?? null : text(payload.patch[field])]));
        if (!values.organization) fail("INVALID_INPUT", "Stelle / Einrichtung / Betreiber erforderlich.");
        if (before && AUTHORITY_FIELDS.every(field => values[field] === before[field])) return result(before);
        const reset = { verification_status: "unverified", verified_at: null, verification_method: null, uncertainty_reason: null };
        if (before) return update(before, { ...values, ...reset });
        const now = clock();
        return result(repo.insert({ id: uuid(), category: selectedCategory, ...values, ...reset,
          revision: 1, created_at: now, updated_at: now }));
      });
    },
    confirmAuthorityRecord(payload) {
      object(payload, ["id", "expectedRevision"]);
      return repo.transaction(() => {
        const row = current(payload); const issues = confirmationIssues(row);
        if (issues.length) fail("AUTHORITY_INCOMPLETE", issues.map(issue => issue.message).join(" "));
        if (row.verification_status === "confirmed") return result(row);
        return update(row, { verification_status: "confirmed", verified_at: clock(), verification_method: "manual", uncertainty_reason: null });
      });
    },
    markAuthorityUncertain(payload) {
      object(payload, ["id", "expectedRevision", "reason"]);
      const reason = text(payload.reason);
      if (!reason) fail("INVALID_INPUT", "Konkreter Unsicherheitsgrund erforderlich.");
      return repo.transaction(() => {
        const row = current(payload);
        if (row.verification_status === "uncertain" && row.uncertainty_reason === reason) return result(row);
        return update(row, { verification_status: "uncertain", uncertainty_reason: reason });
      });
    },
  });
}
module.exports = Object.freeze({ createAuthorityService });
