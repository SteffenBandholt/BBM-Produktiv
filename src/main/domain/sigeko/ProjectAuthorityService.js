"use strict";
const { randomUUID, createHash } = require("crypto");
const projectsRepo = require("../../db/projectsRepo");
const { SigekoAuthoritiesRepository } = require("../../db/sigekoAuthoritiesRepo");
const { SigekoProjectAuthoritiesRepository } = require("../../db/sigekoProjectAuthoritiesRepo");
const { createAuthorityService } = require("./AuthorityService");
const { AUTHORITY_CATEGORIES, MUTABLE_AUTHORITY_CATEGORIES, AUTHORITY_COLUMNS, EMERGENCY_NUMBERS } = require("../../../shared/sigeko/authorities.cjs");
const { ADDRESS_FIELDS, validateProjectAuthorityRow, normalizeAuthorityAddressValue: normalized } = require("../../../shared/sigeko/projectAuthorities.cjs");

const MEDICAL = new Set(["HOSPITAL", "ACCIDENT_DOCTOR"]);
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function object(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("INVALID_INPUT", "Objekt erforderlich.");
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail("INVALID_INPUT", `Unzulässiges Feld: ${key}`);
}
function text(value, required = false) {
  if (value != null && (typeof value !== "string" || value.length > 4096)) fail("INVALID_INPUT", "Text mit höchstens 4096 Zeichen erforderlich.");
  const result = value?.trim() || null;
  if (required && !result) fail("INVALID_INPUT", "Nicht leerer Text erforderlich.");
  return result;
}
const addressOf = project => Object.fromEntries(ADDRESS_FIELDS.map(key => [key, project[key] || null]));
const completeAddress = address => ADDRESS_FIELDS.every(key => normalized(address[key]));
const equalAddress = (left, right) => ADDRESS_FIELDS.every(key => normalized(left[key]) === normalized(right[key]));
const exactSource = (source, address) => completeAddress(address) && ADDRESS_FIELDS.every(key => normalized(source[`scope_${key}`]) === normalized(address[key]));
const sameSource = (source, snapshot) => !!source && AUTHORITY_COLUMNS.every(key => source[key] === snapshot[key]);
const confirmedSource = source => source.verification_status === "confirmed" && source.confirmationIssues.length === 0;
const matchContext = sources => createHash("sha256").update(JSON.stringify([...sources]
  .sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  .map(source => AUTHORITY_COLUMNS.map(key => source[key])))).digest("hex");

function createProjectAuthorityService({ repo = new SigekoProjectAuthoritiesRepository(), stock = new SigekoAuthoritiesRepository(),
  projects = projectsRepo, clock = () => new Date().toISOString(), uuid = randomUUID } = {}) {
  const authorities = createAuthorityService({ repo: stock });
  function projectFor(payload, writing = false) {
    const project = projects.getById(text(payload.projectId, true));
    if (!project) fail("PROJECT_NOT_FOUND", "Projekt nicht gefunden.");
    if (writing && project.archived_at) fail("PROJECT_ARCHIVED", "Archiviertes Projekt zuerst wiederherstellen.");
    return project;
  }
  function checkAddress(value, project) {
    object(value, ADDRESS_FIELDS);
    if (ADDRESS_FIELDS.some(key => !Object.hasOwn(value, key))) fail("INVALID_INPUT", "Gelesene Baustellenadresse erforderlich.");
    const expected = Object.fromEntries(ADDRESS_FIELDS.map(key => [key, text(value[key])]));
    if (!equalAddress(expected, addressOf(project))) fail("PROJECT_ADDRESS_CONFLICT", "Baustellenadresse wurde inzwischen geändert. Bitte erneut laden.");
  }
  function selection(payload, project) {
    if (!MUTABLE_AUTHORITY_CATEGORIES.includes(payload.category)) fail("INVALID_CATEGORY", "Nicht bearbeitbare Behördenkategorie.");
    if (!Number.isSafeInteger(payload.expectedRevision) || payload.expectedRevision < 0 ||
        !Number.isSafeInteger(payload.sourceRevision) || payload.sourceRevision < 1) fail("INVALID_INPUT", "Gelesene Quell- und Zuordnungsrevision erforderlich.");
    const before = repo.get(project.id, payload.category);
    if ((before?.revision || 0) !== payload.expectedRevision) fail("ASSIGNMENT_CONFLICT", "Zuordnung wurde inzwischen geändert. Bitte erneut laden.");
    const source = stock.getById(text(payload.sourceId, true));
    if (!source) fail("AUTHORITY_NOT_FOUND", "Behörden-/Kontaktdatensatz nicht gefunden.");
    if (source.category !== payload.category) fail("INVALID_CATEGORY", "Quelle gehört zu einer anderen Kategorie.");
    if (source.revision !== payload.sourceRevision) fail("AUTHORITY_CONFLICT", "Quelle wurde inzwischen geändert. Bitte erneut laden.");
    return { before, source };
  }
  function save(project, before, source, status, method, note) {
    const now = clock();
    const row = { id: before?.id || uuid(), project_id: project.id, category: source.category,
      source_id: source.id, source_revision: source.revision,
      snapshot_json: JSON.stringify(Object.fromEntries(AUTHORITY_COLUMNS.map(key => [key, source[key]]))),
      ...Object.fromEntries(ADDRESS_FIELDS.map(key => [`address_${key}`, project[key] || null])),
      assessment_status: status, assessment_method: method, assessment_note: note,
      match_context_hash: matchContext(stock.list({ category: source.category }).filter(candidate => exactSource(candidate, addressOf(project)))),
      revision: (before?.revision || 0) + 1, created_at: before?.created_at || now, updated_at: now };
    validateProjectAuthorityRow(row, project.id);
    const saved = before ? repo.update(row, before.revision) : repo.insert(row);
    if (!saved) fail("ASSIGNMENT_CONFLICT", "Zuordnung wurde inzwischen geändert. Bitte erneut laden.");
  }
  function read(project) {
    const address = addressOf(project), sources = authorities.listAuthorityRecords(), assignments = repo.list(project.id);
    const categories = AUTHORITY_CATEGORIES.map(category => {
      if (category === "EMERGENCY_112") return { category, status: "green", fixedPhone: EMERGENCY_NUMBERS.EMERGENCY_112, assignment: null, candidates: [], proposal: null, issues: [] };
      const categorySources = sources.filter(source => source.category === category);
      const exact = categorySources.filter(source => exactSource(source, address));
      // Regional candidates are hints only. A free-text area is never geocoded.
      const candidates = categorySources.filter(source => exact.includes(source) ||
        (normalized(address.zip) && normalized(source.scope_zip) === normalized(address.zip)) ||
        (normalized(address.city) && normalized(source.scope_city) === normalized(address.city)))
        .map(source => ({ ...source, exactAddress: exact.includes(source) }));
      const automatic = exact.length === 1 && confirmedSource(exact[0]) && !MEDICAL.has(category) ? exact[0] : null;
      const row = assignments.find(item => item.category === category) || null;
      const issues = [];
      const add = (code, message) => issues.push({ code, message });
      let assignment = null;
      if (row) {
        validateProjectAuthorityRow(row, project.id);
        const snapshot = JSON.parse(row.snapshot_json);
        assignment = { ...row, snapshot };
        const current = categorySources.find(source => source.id === row.source_id);
        if (!current) add("SOURCE_MISSING", "Die gespeicherte Quelle fehlt im lokalen Bestand; Projektkontakt bleibt erhalten.");
        else {
          if (!sameSource(current, snapshot)) add("SOURCE_CHANGED", "Quelle wurde seit der Zuordnung geändert; gespeicherten Kontakt erneut prüfen.");
          if (!confirmedSource(current)) add("SOURCE_UNCONFIRMED", current.uncertainty_reason || "Quelle ist nicht vollständig bestätigt.");
        }
        const captured = Object.fromEntries(ADDRESS_FIELDS.map(key => [key, row[`address_${key}`]]));
        if (!completeAddress(address)) add("ADDRESS_INCOMPLETE", "Vollständige Baustellenadresse fehlt.");
        if (!equalAddress(captured, address)) add("ADDRESS_CHANGED", "Baustellenadresse wurde seit der Zuordnung geändert.");
        if (row.assessment_status !== "confirmed") add("ASSIGNMENT_UNCERTAIN", row.assessment_note);
        if (row.assessment_method === "manual" && exact.some(candidate => candidate.id !== row.source_id) && row.match_context_hash !== matchContext(exact)) {
          add("MATCH_CHANGED", "Neue oder geänderte widersprüchliche Adresszuordnungen erfordern eine erneute Projektprüfung.");
        }
        if (row.assessment_method === "known_stock" && (!automatic || automatic.id !== row.source_id)) {
          add("MATCH_UNCERTAIN", "Automatisch belegte eindeutige Zuständigkeit ist nicht mehr gegeben.");
        }
      } else {
        add("ASSIGNMENT_MISSING", "Projektkontakt ist noch nicht zugeordnet.");
        if (exact.length > 1) add("MULTIPLE_MATCHES", "Mehrere Quellen widersprechen einer eindeutigen Adresszuordnung.");
        else if (MEDICAL.has(category) && exact.length) add("MEDICAL_REVIEW_REQUIRED", "Nähe und Eignung für diese Baustelle ausdrücklich prüfen.");
        else if (candidates.length && !automatic) add("MATCH_UNCERTAIN", "Zuständigkeit für die konkrete Baustellenadresse ist nicht eindeutig bestätigt.");
      }
      return { category, status: row ? (issues.length ? "orange" : "green") : candidates.length ? "orange" : "red",
        fixedPhone: category === "POLICE" ? EMERGENCY_NUMBERS.POLICE : null, assignment, candidates,
        proposal: automatic && !row ? { category, sourceId: automatic.id, sourceRevision: automatic.revision, expectedRevision: 0 } : null, issues };
    });
    return { projectId: project.id, address, categories,
      status: categories.some(item => item.status === "red") ? "red" : categories.some(item => item.status === "orange") ? "orange" : "green" };
  }
  return Object.freeze({
    getProjectAuthorities(payload) { object(payload, ["projectId"]); return read(projectFor(payload)); },
    assignProjectAuthority(payload) {
      object(payload, ["projectId", "category", "sourceId", "sourceRevision", "expectedRevision", "expectedAddress", "status", "note"]);
      if (!["confirmed", "uncertain"].includes(payload.status)) fail("INVALID_INPUT", "Bestätigung oder Unsicherheit erforderlich.");
      const note = text(payload.note, true);
      return repo.transaction(() => {
        const project = projectFor(payload, true); checkAddress(payload.expectedAddress, project);
        const { before, source } = selection(payload, project);
        save(project, before, source, payload.status, "manual", note);
        return read(project);
      });
    },
    applyKnownProjectAuthorities(payload) {
      object(payload, ["projectId", "expectedAddress", "selections"]);
      if (!Array.isArray(payload.selections) || payload.selections.length < 1 || payload.selections.length > 7) fail("INVALID_INPUT", "Ein bis sieben Vorschläge erforderlich.");
      const seen = new Set();
      for (const item of payload.selections) {
        object(item, ["category", "sourceId", "sourceRevision", "expectedRevision"]);
        if (seen.has(item.category)) fail("INVALID_INPUT", "Kategorie mehrfach ausgewählt.");
        seen.add(item.category);
      }
      return repo.transaction(() => {
        const project = projectFor(payload, true); checkAddress(payload.expectedAddress, project);
        const preview = read(project);
        for (const item of payload.selections) {
          const { before, source } = selection(item, project);
          const proposal = preview.categories.find(entry => entry.category === item.category)?.proposal;
          if (!proposal || proposal.sourceId !== source.id || proposal.sourceRevision !== source.revision) fail("MATCH_UNCERTAIN", "Vorschlag ist nicht mehr eindeutig bestätigt. Bitte erneut prüfen.");
          save(project, before, source, "confirmed", "known_stock", "Bestätigter eindeutiger Bestand mit dokumentiertem exaktem Baustellenadressbezug übernommen.");
        }
        return read(project);
      });
    },
  });
}
module.exports = Object.freeze({ createProjectAuthorityService });
