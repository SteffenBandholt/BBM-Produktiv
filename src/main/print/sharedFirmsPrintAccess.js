"use strict";
const { getModuleDefinition, getCanonicalModuleIds } = require("../moduleRegistry");
const { enforceLicensedFeature } = require("../licensing/featureGuard");
const { createProjectStorageAccess } = require("../ipc/projectStoragePaths");

function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function isSharedFirmsPrintRequest(payload) {
  return Object.hasOwn(payload || {}, "moduleId");
}

// Explicit module access to the existing firms-list renderer, not a new print
// mode, domain provider, license mechanism or storage implementation.
function createSharedFirmsPrintAccess({ enforce = enforceLicensedFeature,
  storage = createProjectStorageAccess(), getModuleDefinition: definitionFor = getModuleDefinition } = {}) {
  function resolve(payload = {}) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
        !isSharedFirmsPrintRequest(payload) || payload.mode !== "firms" ||
        typeof payload.moduleId !== "string" || !getCanonicalModuleIds().includes(payload.moduleId) ||
        typeof payload.projectId !== "string" || !payload.projectId.trim() || payload.projectId !== payload.projectId.trim()) {
      fail("PDF_SHARED_REQUEST_INVALID", "Explizite Modulidentität, Projekt-ID und Firmenlistenmodus erforderlich.");
    }
    // Inert null/false fields may arrive through the unchanged print-window
    // envelope. Other document identities or routing contexts may not.
    if (["providerRequest", "providerId", "baseDir", "overwrite", "project"].some(key => Object.hasOwn(payload, key)) ||
        ["meetingId", "invoiceId", "documentId", "documentTypeId", "restarbeitenRows",
          "restarbeitenLocationLabels", "todoResponsibleFilter"].some(key => payload[key] != null) ||
        payload.invoicePreview != null && payload.invoicePreview !== false ||
        payload.pdfEditorPreview != null && payload.pdfEditorPreview !== false ||
        payload.devLayoutPreview != null && payload.devLayoutPreview !== false ||
        payload.showAmpelInList != null ||
        payload.targetDir != null && payload.targetDir !== "temp") {
      fail("PDF_SHARED_REQUEST_INVALID", "Firmenlistenauftrag enthält einen fremden Dokumentkontext oder eine abweichende Pfadsteuerung.");
    }
    if (!definitionFor(payload.moduleId)?.requiredCapabilities?.includes("pdf")) {
      fail("PDF_CAPABILITY_MISSING", "Modul deklariert die PDF-Capability nicht.");
    }
    enforce(payload.moduleId);
    const destination = payload.storage;
    if (!destination || typeof destination !== "object" || Array.isArray(destination) ||
        !Object.hasOwn(destination, "target")) {
      fail("PDF_STORAGE_TARGET_REQUIRED", "Explizites Modul-Speicherziel erforderlich.");
    }
    if (typeof destination.target !== "string" || !destination.target.trim() || destination.target !== destination.target.trim() ||
        Reflect.ownKeys(destination).some(key => !["target", "baseDir"].includes(key)) ||
        Object.hasOwn(destination, "baseDir") && (typeof destination.baseDir !== "string" || !destination.baseDir.trim())) {
      fail("PDF_STORAGE_TARGET_INVALID", "Ungültiger Modul-Speicherauftrag.");
    }
    const request = { target: destination.target,
      ...(Object.hasOwn(destination, "baseDir") ? { baseDir: destination.baseDir } : {}) };
    const paths = storage.resolve({ moduleId: payload.moduleId, projectId: payload.projectId, baseDir: request.baseDir });
    if (!Object.hasOwn(paths.targets, request.target)) fail("PDF_STORAGE_TARGET_INVALID", "Unbekanntes Modul-Speicherziel.");
    return { moduleId: payload.moduleId, projectId: payload.projectId,
      directory: paths.targets[request.target], storage: request };
  }
  return Object.freeze({ resolve });
}

module.exports = Object.freeze({ isSharedFirmsPrintRequest, createSharedFirmsPrintAccess });
