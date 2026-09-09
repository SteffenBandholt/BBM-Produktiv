"use strict";

const { FirmDirectoryService } = require("../firms/FirmDirectoryService");
const { FIRM_KINDS, normalizeFirmRef } = require("../firms/firmReference");

function available(firm) {
  return !!firm && !firm.removed_at && Number(firm.is_trashed || 0) !== 1 && firm.is_active === 1;
}

// Resolve against the caller's database, including isolated acceptance profiles.
function directory(db) {
  return new FirmDirectoryService({ dbProvider: () => db });
}

function getFirm(ref, db) {
  try {
    return directory(db).get(ref);
  } catch (error) {
    // The shared usage repository rejects removed global firms during get().
    // Infrastructure errors must still reach the caller, rather than look absent.
    if (error?.message === "Firma nicht gefunden") return null;
    throw error;
  }
}

function validateBuilder(value, projectId, db) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).some((key) => !["kind", "id"].includes(key)) ||
      typeof value.id !== "string" || typeof value.kind !== "string") {
    throw new Error("Bauherr muss eine Firmenreferenz mit kind und id sein.");
  }
  const ref = normalizeFirmRef(value, { projectId });
  if (!available(getFirm(ref, db))) {
    throw new Error("Die gewählte Bauherrfirma ist nicht verfügbar oder gehört zu einem anderen Projekt.");
  }
  return { kind: ref.kind, id: ref.id };
}

function resolveBuilder(project, db) {
  const kind = project.bauherr_firm_kind;
  const id = project.bauherr_firm_id;
  if (!kind && !id) return { ref: null, firm: null, sourceMissing: false };
  const ref = { kind, id, projectId: kind === FIRM_KINDS.PROJECT ? project.id : null };
  // Keep incomplete historical references visible; never guess a replacement.
  if (!id || ![FIRM_KINDS.GLOBAL, FIRM_KINDS.PROJECT].includes(kind)) {
    return { ref, firm: null, sourceMissing: true };
  }
  const firm = getFirm(ref, db);
  return { ref, firm: available(firm) ? firm : null, sourceMissing: !available(firm) };
}

module.exports = { validateBuilder, resolveBuilder };
