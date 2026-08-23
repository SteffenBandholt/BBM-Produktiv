"use strict";

const FIRM_KINDS = Object.freeze({
  GLOBAL: "global_firm",
  PROJECT: "project_firm",
});

const CREATION_ORIGINS = new Set(["firms", "project_firms", "invoice"]);

function normalizeFirmKind(value) {
  const kind = String(value || "").trim();
  if (kind !== FIRM_KINDS.GLOBAL && kind !== FIRM_KINDS.PROJECT) {
    throw new Error("firm kind must be global_firm or project_firm");
  }
  return kind;
}

function normalizeFirmRef(value, { projectId } = {}) {
  const source = value && typeof value === "object" ? value : {};
  const kind = normalizeFirmKind(source.kind);
  const id = String(source.id || "").trim();
  if (!id) throw new Error("firm id required");
  const scopedProjectId = String(source.projectId || source.project_id || projectId || "").trim() || null;
  if (kind === FIRM_KINDS.PROJECT && !scopedProjectId) {
    throw new Error("projectId required for project_firm");
  }
  const label = String(source.label || "").trim() || null;
  return Object.freeze({ kind, id, projectId: scopedProjectId, label });
}

function firmRefKey(ref) {
  const normalized = normalizeFirmRef(ref, { projectId: ref?.projectId || ref?.project_id });
  return `${normalized.kind}:${normalized.id}`;
}

function normalizeUses(value, fallback = {}) {
  const source = value && typeof value === "object" ? value : {};
  const flag = (candidate, defaultValue) =>
    candidate === undefined ? (Number(defaultValue) === 1 ? 1 : 0) : Number(candidate) === 1 ? 1 : 0;
  return Object.freeze({
    projectParticipant: flag(
      source.projectParticipant ?? source.project_participant ?? source.use_project_participant,
      fallback.projectParticipant ?? fallback.use_project_participant
    ),
    customer: flag(source.customer ?? source.use_customer, fallback.customer ?? fallback.use_customer),
  });
}

function defaultsForCreation({ origin, kind, projectId } = {}) {
  const normalizedOrigin = String(origin || "").trim();
  if (!CREATION_ORIGINS.has(normalizedOrigin)) throw new Error("firm creation origin required");

  let resolvedKind = kind ? normalizeFirmKind(kind) : null;
  if (!resolvedKind) {
    if (normalizedOrigin === "firms") resolvedKind = FIRM_KINDS.GLOBAL;
    if (normalizedOrigin === "project_firms") resolvedKind = FIRM_KINDS.PROJECT;
    if (normalizedOrigin === "invoice") resolvedKind = FIRM_KINDS.GLOBAL;
  }
  if (normalizedOrigin === "firms" && resolvedKind !== FIRM_KINDS.GLOBAL) {
    throw new Error("firms origin creates global firms only");
  }
  if (normalizedOrigin === "project_firms" && resolvedKind !== FIRM_KINDS.PROJECT) {
    throw new Error("project_firms origin creates project firms only");
  }
  if (normalizedOrigin === "invoice" && resolvedKind !== FIRM_KINDS.GLOBAL) {
    throw new Error("invoice origin creates global firms only");
  }
  if (resolvedKind === FIRM_KINDS.PROJECT && !String(projectId || "").trim()) {
    throw new Error("projectId required for project firm creation");
  }

  return Object.freeze({
    kind: resolvedKind,
    uses:
      normalizedOrigin === "invoice"
        ? Object.freeze({ projectParticipant: 0, customer: 1 })
        : Object.freeze({ projectParticipant: 1, customer: 0 }),
  });
}

module.exports = {
  FIRM_KINDS,
  normalizeFirmKind,
  normalizeFirmRef,
  normalizeUses,
  defaultsForCreation,
  firmRefKey,
};
