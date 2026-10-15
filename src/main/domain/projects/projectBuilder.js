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

function hasColumn(db, tableName, columnName) {
  try {
    return db.prepare(`PRAGMA table_info(${tableName})`).all()
      .some((column) => String(column?.name || "") === String(columnName || ""));
  } catch (_error) {
    return false;
  }
}

function resolveBuilder(project, db) {
  const projectId = project?.id;
  if (!projectId) return { ref: null, firm: null, sourceMissing: false };

  const roleSchemaAvailable =
    hasColumn(db, "project_firms", "project_role") &&
    hasColumn(db, "project_global_firms", "project_role");

  let kind = null;
  let id = null;

  if (roleSchemaAvailable) {
    const local = db.prepare(`
      SELECT id
      FROM project_firms
      WHERE project_id = ?
        AND removed_at IS NULL
        AND project_role = 'bauherr'
      LIMIT 1
    `).get(projectId);

    const global = local ? null : db.prepare(`
      SELECT firm_id AS id
      FROM project_global_firms
      WHERE project_id = ?
        AND removed_at IS NULL
        AND project_role = 'bauherr'
      LIMIT 1
    `).get(projectId);

    kind = local ? FIRM_KINDS.PROJECT : global ? FIRM_KINDS.GLOBAL : null;
    id = local?.id || global?.id || null;
  } else {
    kind = project.bauherr_firm_kind || null;
    id = project.bauherr_firm_id || null;
  }

  if (!kind && !id) return { ref: null, firm: null, sourceMissing: false };
  const ref = { kind, id, projectId: kind === FIRM_KINDS.PROJECT ? projectId : null };
  if (!id || ![FIRM_KINDS.GLOBAL, FIRM_KINDS.PROJECT].includes(kind)) {
    return { ref, firm: null, sourceMissing: true };
  }
  const firm = getFirm(ref, db);
  return { ref, firm: available(firm) ? firm : null, sourceMissing: !available(firm) };
}

module.exports = { validateBuilder, resolveBuilder };
