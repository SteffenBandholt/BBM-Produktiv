"use strict";
const { CONTACT_FIELDS } = require("./projectRoles.cjs");
const { PRE_NOTIFICATION_COUNT_FIELDS, validCalendarDate, validatePreNotificationRow } = require("./preNotifications.cjs");
const { PROJECT_AUTHORITY_COLUMNS, validateProjectAuthorityRow, normalizeAuthorityAddressValue } = require("./projectAuthorities.cjs");
const DOCUMENT_TYPE = "sigeko-vorankuendigung";
const SNAPSHOT_KEYS = ["schemaVersion", "documentTypeId", "projectId", "documentId", "createdAt", "source", "form", "printRuntimeContext", "readiness"];
const FORM_KEYS = ["address", "builder", "buildingType", "thirdParty", "planning", "execution", "plannedStart", "durationMonths", "maxWorkers", "employerCount", "selfEmployedCount", "firmsMode", "authority", "authorityEvidence", "authorityStatus"];
const COUNTS = ["durationMonths", "maxWorkers", "employerCount", "selfEmployedCount"];
function invalid(message) { throw Object.assign(new Error(`Ungültiger Vorankündigungs-Snapshot: ${message}`), { code: "PRE_NOTIFICATION_SNAPSHOT_INVALID" }); }
function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) invalid("Einfaches Objekt erforderlich.");
}
function shape(value, keys) {
  object(value);
  if (Reflect.ownKeys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) invalid("Unbekannte oder fehlende Felder.");
}
function text(value, nullable = false) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || !value.trim() || value !== value.trim() || value.length > 4096) invalid("Ungültiger Textwert.");
}
function normalized(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 4096) invalid("Ungültiger Quelltext.");
  return value.trim() || null;
}
function fields(source, keys) { return Object.fromEntries(keys.map(key => [key, normalized(source?.[key])])); }
function contact(value) {
  if (value === null) return;
  shape(value, CONTACT_FIELDS);
  CONTACT_FIELDS.forEach(key => text(value[key], true));
}
function integer(value, minimum, nullable = false) {
  if (nullable && value === null) return;
  if (!Number.isSafeInteger(value) || value < minimum) invalid("Ungültige Ganzzahl.");
}
// Enforce a lossless JSON value contract before cloning. In particular no dates,
// undefined, NaN, custom objects or cycles may silently change when persisted.
function jsonCopy(value) {
  const seen = new Set();
  function visit(item) {
    if (item === null || typeof item === "string" || typeof item === "boolean") return;
    if (typeof item === "number" && Number.isFinite(item)) return;
    if (!item || typeof item !== "object" || seen.has(item)) invalid("Nicht serialisierbarer Druckkontext.");
    if (!Array.isArray(item)) object(item);
    seen.add(item);
    const keys = Reflect.ownKeys(item);
    if (keys.some(key => typeof key !== "string")) invalid("Symbolschlüssel sind nicht zulässig.");
    if (Array.isArray(item)) {
      if (keys.length !== item.length + 1 || !keys.includes("length")) invalid("Ungültige Liste.");
      for (let i = 0; i < item.length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(item, String(i));
        if (!descriptor?.enumerable || !Object.hasOwn(descriptor, "value")) invalid("Ungültiger Listeneintrag.");
        visit(descriptor.value);
      }
    } else for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(item, key);
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value")) invalid("Verborgene Felder und Getter sind nicht zulässig.");
      visit(descriptor.value);
    }
    seen.delete(item);
  }
  visit(value);
  return JSON.parse(JSON.stringify(value));
}
function authorityRow(value, projectId) {
  try { validateProjectAuthorityRow(value, projectId); }
  catch (error) { invalid(error.message); }
  return JSON.parse(value.snapshot_json);
}
function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function validatePreNotificationSnapshot(value, projectId = value?.projectId, documentId = value?.documentId) {
  shape(value, SNAPSHOT_KEYS);
  if (value.schemaVersion !== 1 || value.documentTypeId !== DOCUMENT_TYPE) invalid("Unbekannter Dokumentvertrag.");
  [value.projectId, value.documentId, value.createdAt, projectId, documentId].forEach(v => text(v));
  if (value.projectId !== projectId || value.documentId !== documentId) invalid("Fremde Projekt-/Dokumentidentität.");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.createdAt) ||
      !Number.isFinite(Date.parse(value.createdAt)) || new Date(value.createdAt).toISOString() !== value.createdAt) invalid("Ungültiger Erstellzeitpunkt.");
  shape(value.source, ["draftId", "draftRevision"]);
  text(value.source.draftId, true); integer(value.source.draftRevision, 0);
  if ((value.source.draftId === null) !== (value.source.draftRevision === 0)) invalid("Inkonsistente Entwurfsreferenz.");
  const form = value.form;
  shape(form, FORM_KEYS); shape(form.address, ["street", "zip", "city"]);
  Object.values(form.address).forEach(v => text(v, true));
  for (const key of ["builder", "thirdParty", "planning", "execution"]) contact(form[key]);
  text(form.buildingType, true);
  if (form.plannedStart !== null && !validCalendarDate(form.plannedStart)) invalid("Ungültiger Baubeginn.");
  COUNTS.forEach((key, i) => integer(form[key], i === 0 ? 1 : 0, true));
  if (!["unknown", "attachment"].includes(form.firmsMode)) invalid("Unbekannter Firmenlistenmodus.");
  if (!["red", "orange", "green"].includes(form.authorityStatus)) invalid("Unbekannter Behördenstatus.");
  if (form.authorityEvidence === null) {
    if (form.authority !== null || form.authorityStatus === "green") invalid("Behörde ohne Nachweis.");
  } else {
    const captured = authorityRow(form.authorityEvidence, projectId);
    if (form.authorityEvidence.category !== "LABOR_AUTHORITY") invalid("Falsche Behördenkategorie.");
    shape(form.authority, ["organization", "street", "zip", "city", "phone", "email"]);
    for (const key of Object.keys(form.authority)) if (form.authority[key] !== normalized(captured[key])) invalid("Behördenanschrift weicht vom Nachweis ab.");
    if (form.authorityStatus === "green" && (form.authorityEvidence.assessment_status !== "confirmed" || captured.verification_status !== "confirmed")) invalid("Unbestätigte Behörde als bestätigt markiert.");
    if (form.authorityStatus === "green" && ["street", "zip", "city"].some(key =>
      !normalizeAuthorityAddressValue(form.address[key]) ||
      normalizeAuthorityAddressValue(form.address[key]) !== normalizeAuthorityAddressValue(form.authorityEvidence[`address_${key}`]))) invalid("Bestätigte Behörde gehört zu einer anderen Baustellenadresse.");
  }
  object(value.printRuntimeContext);
  if (value.printRuntimeContext.project?.id !== projectId || value.printRuntimeContext.orientation !== "portrait") invalid("Fremder Druckkontext.");
  shape(value.readiness, ["status", "issues"]);
  if (!["red", "orange", "green"].includes(value.readiness.status) || !Array.isArray(value.readiness.issues)) invalid("Ungültige Vollständigkeitshinweise.");
  for (const issue of value.readiness.issues) {
    shape(issue, ["code", "field", "message", "action", "status"]);
    Object.values(issue).forEach(v => text(v));
    if (!["red", "orange"].includes(issue.status)) invalid("Ungültiger Hinweisstatus.");
  }
  const calculated = value.readiness.issues.some(issue => issue.status === "red") ? "red" : value.readiness.issues.length ? "orange" : "green";
  if (value.readiness.status !== calculated) invalid("Inkonsistente Vollständigkeitshinweise.");
  jsonCopy(value);
  return value;
}
// Input is resolved by the existing Main service, never accepted over renderer IPC.
// This captures data only: it is not a final PDF or an authority/send completion.
function buildPreNotificationSnapshot({ data, runtimeContext, documentId, createdAt }) {
  object(data); text(data.projectId); text(documentId); text(createdAt);
  if (data.record) validatePreNotificationRow(data.record, data.projectId);
  const effective = data.effective;
  object(effective);
  const authority = effective.authority;
  const assignment = authority?.assignment;
  const evidence = assignment ? Object.fromEntries(PROJECT_AUTHORITY_COLUMNS.map(key => [key, assignment[key]])) : null;
  const authorityValues = evidence ? authorityRow(evidence, data.projectId) : null;
  const form = {
    address: fields(effective.address, ["street", "zip", "city"]),
    builder: effective.builder ? fields(effective.builder, CONTACT_FIELDS) : null,
    buildingType: normalized(effective.building_type),
    thirdParty: effective.third_party ? fields(effective.third_party, CONTACT_FIELDS) : null,
    planning: effective.planning ? fields(effective.planning, CONTACT_FIELDS) : null,
    execution: effective.execution ? fields(effective.execution, CONTACT_FIELDS) : null,
    plannedStart: effective.planned_start ?? null,
    ...Object.fromEntries(COUNTS.map((key, i) => [key, effective[PRE_NOTIFICATION_COUNT_FIELDS[i]]])),
    firmsMode: effective.firms_mode,
    authority: authorityValues ? fields(authorityValues, ["organization", "street", "zip", "city", "phone", "email"]) : null,
    authorityEvidence: evidence, authorityStatus: authority?.status || "red",
  };
  const snapshot = jsonCopy({ schemaVersion: 1, documentTypeId: DOCUMENT_TYPE,
    projectId: data.projectId, documentId, createdAt,
    source: { draftId: data.record?.id || null, draftRevision: data.record?.revision || 0 },
    form, printRuntimeContext: runtimeContext, readiness: data.readiness });
  validatePreNotificationSnapshot(snapshot, data.projectId, documentId);
  return freeze(snapshot);
}
module.exports = Object.freeze({ DOCUMENT_TYPE, buildPreNotificationSnapshot, validatePreNotificationSnapshot });
