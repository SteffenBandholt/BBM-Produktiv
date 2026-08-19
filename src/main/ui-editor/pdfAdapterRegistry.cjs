"use strict";

const path = require("node:path");

const registrations = new Map();

function normalizeId(value, label) {
  const id = String(value || "").trim();
  if (!/^[a-z0-9][a-z0-9.-]{1,100}$/.test(id)) throw new TypeError(`${label} ist ungültig.`);
  return id;
}

function registerPdfEditorAdapter(registration) {
  if (!registration || typeof registration !== "object" || Array.isArray(registration)) throw new TypeError("PDF-Adapterregistrierung fehlt.");
  const documentTypeId = normalizeId(registration.documentTypeId, "documentTypeId");
  const layoutStorageKey = normalizeId(registration.layoutStorageKey, "layoutStorageKey");
  if (!registration.adapter || typeof registration.adapter.getPdfContract !== "function") throw new TypeError("PDF-Adapter fehlt.");
  if (registrations.has(documentTypeId) && registrations.get(documentTypeId).adapter !== registration.adapter) {
    throw new TypeError(`PDF-Dokumenttyp ist bereits registriert: ${documentTypeId}`);
  }
  const normalized = Object.freeze({
    documentTypeId,
    layoutStorageKey,
    displayName: String(registration.displayName || documentTypeId),
    adapter: registration.adapter,
    regenerate: typeof registration.regenerate === "function" ? registration.regenerate : null,
    buildRegenerationRequest: typeof registration.buildRegenerationRequest === "function" ? registration.buildRegenerationRequest : null,
    default: registration.default === true,
  });
  registrations.set(documentTypeId, normalized);
  return normalized;
}

function listPdfEditorAdapterRegistrations() {
  return [...registrations.values()];
}

function createPdfEditorAdapterResolver({ profileBaseRoot, regeneratePdf } = {}) {
  const configured = new Set();
  let activeDocumentTypeId = "";

  function resolveRegistration(documentTypeId, { allowDefault = true } = {}) {
    const requested = String(documentTypeId || activeDocumentTypeId || "").trim();
    if (requested && registrations.has(requested)) return registrations.get(requested);
    if (!allowDefault) return null;
    const defaults = listPdfEditorAdapterRegistrations().filter((entry) => entry.default);
    return defaults.length === 1 ? defaults[0] : registrations.size === 1 ? listPdfEditorAdapterRegistrations()[0] : null;
  }

  function configure(registration) {
    if (!registration || configured.has(registration.documentTypeId)) return registration;
    registration.adapter.configureProfileRoot(path.join(path.resolve(profileBaseRoot), registration.layoutStorageKey));
    registration.adapter.configureRegenerate(async (context) => {
      if (registration.regenerate) return registration.regenerate(context);
      if (!registration.buildRegenerationRequest || typeof regeneratePdf !== "function") {
        throw Object.assign(new Error("PDF-Regeneration ist für diesen Dokumenttyp nicht registriert."), { code: "pdf_regenerate_unavailable" });
      }
      return regeneratePdf(registration.buildRegenerationRequest(context));
    });
    configured.add(registration.documentTypeId);
    return registration;
  }

  function active() {
    return configure(resolveRegistration(activeDocumentTypeId));
  }

  return Object.freeze({
    setActiveDocumentContext(context = {}) {
      const registration = resolveRegistration(context.documentTypeId);
      if (!registration) return { ok: false, pdfRegistryStatus: "unavailable", activeDocumentId: "", documentTypeId: String(context.documentTypeId || "") };
      activeDocumentTypeId = registration.documentTypeId;
      const result = configure(registration).adapter.setActiveDocumentContext(context);
      return { ...result, documentTypeId: registration.documentTypeId };
    },
    getPdfContract() { return active()?.adapter.getPdfContract() || null; },
    getPdfRegistry() { return active()?.adapter.getPdfRegistry(); },
    getCurrentPdfLayoutState() { return active()?.adapter.getCurrentPdfLayoutState(); },
    submitPdfChangeRequest(request) { return active()?.adapter.submitPdfChangeRequest(request); },
    regeneratePdfPreview() { return active()?.adapter.regeneratePdfPreview(); },
    getPreviewMetadata() { return active()?.adapter.getPreviewMetadata(); },
    resolveRegistration(documentTypeId) { return resolveRegistration(documentTypeId, { allowDefault: false }); },
  });
}

function resetPdfEditorAdapterRegistrationsForTest() {
  registrations.clear();
}

module.exports = Object.freeze({
  createPdfEditorAdapterResolver,
  listPdfEditorAdapterRegistrations,
  registerPdfEditorAdapter,
  resetPdfEditorAdapterRegistrationsForTest,
});
