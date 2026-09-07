const { PROVIDER_KINDS } = require("../moduleServiceProviders");
const { createProductivePdfProviderRegistry } = require("../modulePdfProviders");
const { getModuleDefinition } = require("../moduleRegistry");
const { enforceLicensedFeature } = require("../licensing/featureGuard");
const { createProjectStorageAccess } = require("../ipc/projectStoragePaths");

function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function isProviderRequest(payload) {
  return payload?.mode === "provider" || Object.hasOwn(payload || {}, "providerRequest");
}
function createPdfProviderBridge({ registry, enforce = enforceLicensedFeature, storage = createProjectStorageAccess() } = {}) {
  registry ||= createProductivePdfProviderRegistry();
  function resolve(payload = {}) {
    const request = payload.providerRequest;
    if (payload.mode !== "provider" || !request || typeof request !== "object" || Array.isArray(request)) {
      fail("PDF_PROVIDER_REQUEST_INVALID", "Expliziter PDF-Provider-Request erforderlich.");
    }
    if (typeof request.moduleId !== "string" || !request.moduleId.trim() ||
        typeof request.providerId !== "string" || !request.providerId.trim() ||
        payload.documentTypeId !== request.providerId || typeof request.projectId !== "string" || !request.projectId.trim() ||
        typeof request.documentId !== "string" || !request.documentId.trim() ||
        (payload.projectId != null && payload.projectId !== request.projectId) ||
        (payload.documentId != null && payload.documentId !== request.documentId)) {
      fail("PDF_PROVIDER_REQUEST_INVALID", "Dokumenttyp, Provider, Modul und Projekt muessen eindeutig angegeben sein.");
    }
    const provider = registry.resolve({ kind: PROVIDER_KINDS.PDF_DOCUMENT, moduleId: request.moduleId, type: request.providerId });
    if (!provider) fail("PDF_PROVIDER_UNKNOWN", "Unbekannter PDF-Provider.");
    // PDF ist eine gemeinsame Capability des kanonischen Modulvertrags,
    // kein Protokoll-Lizenzalias. Die Freigabepruefung selbst bleibt zentral.
    if (!getModuleDefinition(request.moduleId)?.requiredCapabilities?.includes("pdf")) {
      fail("PDF_CAPABILITY_MISSING", "Modul deklariert die PDF-Capability nicht.");
    }
    enforce(request.moduleId);
    if (!request.storage || typeof request.storage.target !== "string") fail("PDF_STORAGE_TARGET_REQUIRED", "Explizites Modul-Speicherziel erforderlich.");
    const paths = storage.resolve({ moduleId: request.moduleId, projectId: request.projectId, baseDir: request.storage.baseDir });
    if (!Object.hasOwn(paths.targets, request.storage.target)) fail("PDF_STORAGE_TARGET_INVALID", "Unbekanntes Modul-Speicherziel.");
    return { request: structuredClone(request), provider, directory: paths.targets[request.storage.target] };
  }
  return Object.freeze({
    resolve,
    async provide(payload) {
      const { request, provider } = resolve(payload);
      const document = await provider.provide({ input: structuredClone(request.data) });
      return { mode: "provider", documentTypeId: request.providerId, projectId: request.projectId, documentId: request.documentId, providerDocument: document, orientation: "portrait", settings: {}, tableLayouts: {} };
    },
    outputDirectory(payload) { return resolve(payload).directory; },
  });
}
module.exports = { isProviderRequest, createPdfProviderBridge };
