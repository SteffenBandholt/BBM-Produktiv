"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { createPdfRegistryFingerprint, validatePdfRegistry } = require("ui-editor-kit");

const SCHEMA_VERSION = 1;
const FILE_NAME = "pdf-document-types.registry.json";

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function elementSignature(element) {
  return JSON.stringify(stableValue(element));
}

function identityFromRegistration(registration) {
  return Object.freeze({
    documentTypeId: registration.documentTypeId,
    moduleId: registration.moduleId,
    scopeId: registration.scopeId,
    profileStorageKey: registration.profileStorageKey,
    contractVersion: registration.contractVersion,
    descriptorVersion: registration.descriptorVersion,
  });
}

function duplicateIds(elements = []) {
  const seen = new Set();
  const duplicates = new Set();
  for (const element of elements) {
    const id = String(element?.id || "").trim();
    if (!id || seen.has(id)) duplicates.add(id || "<leer>");
    seen.add(id);
  }
  return [...duplicates].sort();
}

function validateCandidate(registration) {
  const registry = clone(registration.candidateRegistry);
  const duplicates = duplicateIds(registry?.elements);
  const validation = registry ? validatePdfRegistry(registry) : { ok: false, errors: [{ code: "pdf_registry_missing" }] };
  const identityErrors = [];
  if (registry?.documentTypeId !== registration.documentTypeId) identityErrors.push("documentTypeId");
  if (registry?.scopeId !== registration.scopeId) identityErrors.push("scopeId");
  return Object.freeze({
    ok: validation.ok === true && duplicates.length === 0 && identityErrors.length === 0,
    registry,
    duplicateElementIds: duplicates,
    identityErrors,
    validationErrors: clone(validation.errors || []),
  });
}

function activeElementIdsOf(record) {
  const knownIds = new Set((record?.registry?.elements || []).map((element) => element.id));
  if (!Array.isArray(record?.activeElementIds)) return [...knownIds];
  return [...new Set(record.activeElementIds.filter((id) => knownIds.has(id)))];
}

function createEffectiveRegistry(record) {
  if (!record?.registry) return null;
  const activeIds = new Set(activeElementIdsOf(record));
  const effective = {
    ...clone(record.registry),
    elements: (record.registry.elements || []).filter((element) => activeIds.has(element.id)).map(clone),
  };
  effective.registryFingerprint = createPdfRegistryFingerprint(effective);
  const validation = validatePdfRegistry(effective);
  if (!validation.ok) {
    const error = new TypeError("Aktuell aktive PDF-Registry ist ungueltig.");
    error.code = "pdf_registry_active_projection_invalid";
    error.validationErrors = validation.errors;
    throw error;
  }
  return effective;
}

function createAcceptedRecord(registration, registry, previous = null, activeElementIds = null) {
  const now = new Date().toISOString();
  const knownIds = (registry?.elements || []).map((element) => element.id);
  const requestedActiveIds = new Set(Array.isArray(activeElementIds) ? activeElementIds : knownIds);
  const normalizedActiveIds = knownIds.filter((id) => requestedActiveIds.has(id));
  return {
    ...identityFromRegistration(registration),
    acceptedAt: previous?.acceptedAt || now,
    updatedAt: now,
    activeElementIds: normalizedActiveIds,
    inactiveElementIds: knownIds.filter((id) => !requestedActiveIds.has(id)),
    registry: {
      ...clone(registry),
      registryFingerprint: createPdfRegistryFingerprint(registry),
    },
  };
}

function analyzePdfDocumentType(registration, acceptedRecord = null) {
  const candidate = validateCandidate(registration);
  const identity = identityFromRegistration(registration);
  if (!acceptedRecord) {
    const available = registration.builtIn === true && candidate.ok;
    return Object.freeze({
      documentTypeId: registration.documentTypeId,
      displayName: registration.displayName,
      identity,
      status: available ? "available" : "unregistered",
      available,
      canRegister: candidate.ok && !registration.builtIn,
      canAcceptNewElements: false,
      canSynchronizeElements: false,
      effectiveRegistry: available ? candidate.registry : null,
      candidateRegistry: candidate.registry,
      newElementIds: candidate.ok ? candidate.registry.elements.map((element) => element.id) : [],
      missingElementIds: [],
      reactivatedElementIds: [],
      inactiveElementIds: [],
      incompatibleElementIds: [],
      incompleteElementIds: candidate.ok ? [] : (candidate.registry?.elements || []).map((element) => String(element?.id || "")).filter(Boolean),
      duplicateElementIds: candidate.duplicateElementIds,
      identityErrors: candidate.identityErrors,
      validationErrors: candidate.validationErrors,
    });
  }

  const acceptedIdentity = ["documentTypeId", "moduleId", "scopeId", "profileStorageKey", "contractVersion"];
  const identityErrors = acceptedIdentity.filter((key) => acceptedRecord[key] !== identity[key]);
  const acceptedElements = new Map((acceptedRecord.registry?.elements || []).map((element) => [element.id, element]));
  const activeElementIds = new Set(activeElementIdsOf(acceptedRecord));
  const candidateElements = new Map((candidate.registry?.elements || []).map((element) => [element.id, element]));
  const newElementIds = [...candidateElements.keys()].filter((id) => !acceptedElements.has(id)).sort();
  const missingElementIds = [...activeElementIds].filter((id) => !candidateElements.has(id)).sort();
  const reactivatedElementIds = [...candidateElements.keys()].filter((id) => acceptedElements.has(id) && !activeElementIds.has(id)).sort();
  const inactiveElementIds = [...acceptedElements.keys()].filter((id) => !activeElementIds.has(id)).sort();
  const incompatibleElementIds = [...acceptedElements.keys()]
    .filter((id) => candidateElements.has(id) && elementSignature(acceptedElements.get(id)) !== elementSignature(candidateElements.get(id)))
    .sort();
  const incompleteElementIds = candidate.ok ? [] : newElementIds;
  const hasIncompatible = identityErrors.length > 0 || incompatibleElementIds.length > 0 || candidate.duplicateElementIds.length > 0;
  const hasIncomplete = !candidate.ok && !hasIncompatible;
  const hasChanges = newElementIds.length > 0 || missingElementIds.length > 0 || reactivatedElementIds.length > 0 || acceptedRecord.descriptorVersion !== identity.descriptorVersion;
  const status = hasIncompatible ? "incompatible" : hasIncomplete ? "incomplete" : hasChanges ? "changed" : "available";

  return Object.freeze({
    documentTypeId: registration.documentTypeId,
    displayName: registration.displayName,
    identity,
    acceptedIdentity: Object.freeze({
      documentTypeId: acceptedRecord.documentTypeId,
      moduleId: acceptedRecord.moduleId,
      scopeId: acceptedRecord.scopeId,
      profileStorageKey: acceptedRecord.profileStorageKey,
      contractVersion: acceptedRecord.contractVersion,
      descriptorVersion: acceptedRecord.descriptorVersion,
    }),
    status,
    available: true,
    canRegister: false,
    canAcceptNewElements: candidate.ok && !hasIncompatible && newElementIds.length > 0,
    canSynchronizeElements: candidate.ok && !hasIncompatible && hasChanges,
    effectiveRegistry: createEffectiveRegistry(acceptedRecord),
    candidateRegistry: candidate.registry,
    newElementIds,
    missingElementIds,
    reactivatedElementIds,
    inactiveElementIds,
    incompatibleElementIds,
    incompleteElementIds,
    duplicateElementIds: candidate.duplicateElementIds,
    identityErrors: [...new Set([...identityErrors, ...candidate.identityErrors])],
    validationErrors: candidate.validationErrors,
  });
}

function mergeAdditiveRegistry(acceptedRegistry, candidateRegistry, newElementIds) {
  const additions = new Set(newElementIds);
  const elements = [
    ...(acceptedRegistry?.elements || []).map(clone),
    ...(candidateRegistry?.elements || []).filter((element) => additions.has(element.id)).map(clone),
  ].sort((left, right) => Number(left.order) - Number(right.order) || left.id.localeCompare(right.id));
  const merged = { ...clone(acceptedRegistry), registryVersion: candidateRegistry.registryVersion, elements };
  merged.registryFingerprint = createPdfRegistryFingerprint(merged);
  const validation = validatePdfRegistry(merged);
  if (!validation.ok) {
    const error = new TypeError("Additiv synchronisierte PDF-Registry ist ungueltig.");
    error.code = "pdf_registry_sync_invalid";
    error.validationErrors = validation.errors;
    throw error;
  }
  return merged;
}

function createPdfDocumentTypeRegistryStore({ root, applicationId = "bbm-produktiv" } = {}) {
  if (typeof root !== "string" || !root.trim()) throw new TypeError("PDF-Dokumenttyp-Registrywurzel fehlt.");
  const filePath = path.join(path.resolve(root), FILE_NAME);

  function emptyDocument() {
    return { schemaVersion: SCHEMA_VERSION, applicationId, updatedAt: null, documentTypes: {} };
  }

  function read() {
    if (!fs.existsSync(filePath)) return emptyDocument();
    let document;
    try {
      document = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (cause) {
      throw Object.assign(new Error("PDF-Dokumenttyp-Registry konnte nicht gelesen werden."), { code: "pdf_document_registry_invalid", cause });
    }
    if (document?.schemaVersion !== SCHEMA_VERSION || document?.applicationId !== applicationId ||
        !document.documentTypes || typeof document.documentTypes !== "object" || Array.isArray(document.documentTypes)) {
      throw Object.assign(new Error("PDF-Dokumenttyp-Registry ist inkompatibel."), { code: "pdf_document_registry_incompatible" });
    }
    return document;
  }

  function write(document) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (fs.existsSync(filePath)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      fs.copyFileSync(filePath, `${filePath}.archive-${stamp}`);
    }
    const temporaryPath = `${filePath}.tmp-${process.pid}-${crypto.randomBytes(5).toString("hex")}`;
    try {
      fs.writeFileSync(temporaryPath, JSON.stringify(document, null, 2), "utf8");
      fs.renameSync(temporaryPath, filePath);
    } finally {
      if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
    }
  }

  return Object.freeze({
    filePath,
    get(documentTypeId) {
      return clone(read().documentTypes[String(documentTypeId || "").trim()] || null);
    },
    save(record) {
      const document = read();
      document.updatedAt = new Date().toISOString();
      document.documentTypes[record.documentTypeId] = clone(record);
      write(document);
      return clone(record);
    },
    list() {
      return Object.values(read().documentTypes).map(clone);
    },
  });
}

module.exports = Object.freeze({
  FILE_NAME,
  activeElementIdsOf,
  analyzePdfDocumentType,
  createAcceptedRecord,
  createEffectiveRegistry,
  createPdfDocumentTypeRegistryStore,
  mergeAdditiveRegistry,
  validateCandidate,
});
