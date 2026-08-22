"use strict";

const path = require("node:path");
const { createPdfRegistryFingerprint } = require("ui-editor-kit");
const {
  analyzePdfDocumentType,
  createAcceptedRecord,
  createEffectiveRegistry,
  createPdfDocumentTypeRegistryStore,
  mergeAdditiveRegistry,
  validateCandidate,
} = require("./pdfDocumentTypeRegistry.cjs");

const registrations = new Map();

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function normalizeId(value, label) {
  const id = String(value || "").trim();
  if (!/^[a-z0-9][a-z0-9.-]{1,100}$/.test(id)) throw new TypeError(`${label} ist ungueltig.`);
  return id;
}

function candidateRegistryOf(registration) {
  if (registration.candidateRegistry && typeof registration.candidateRegistry === "object") return clone(registration.candidateRegistry);
  if (registration.adapter && typeof registration.adapter.getPdfRegistry === "function") return clone(registration.adapter.getPdfRegistry());
  throw new TypeError("PDF-Descriptor-Registry fehlt.");
}

function registerPdfEditorAdapter(registration) {
  if (!registration || typeof registration !== "object" || Array.isArray(registration)) throw new TypeError("PDF-Adapterregistrierung fehlt.");
  const documentTypeId = normalizeId(registration.documentTypeId, "documentTypeId");
  const profileStorageKey = normalizeId(registration.profileStorageKey || registration.layoutStorageKey, "profileStorageKey");
  const candidateRegistry = candidateRegistryOf(registration);
  const scopeId = normalizeId(registration.scopeId || candidateRegistry.scopeId, "scopeId");
  const moduleId = normalizeId(registration.moduleId || documentTypeId, "moduleId");
  if (!registration.adapter && typeof registration.createAdapter !== "function") throw new TypeError("PDF-Adapter oder Adapterfactory fehlt.");
  if (registrations.has(documentTypeId)) throw new TypeError(`PDF-Dokumenttyp ist bereits registriert: ${documentTypeId}`);

  const printModes = Object.freeze([...(registration.printModes || [])].map((mode) => normalizeId(mode, "printMode")));
  for (const existing of registrations.values()) {
    const duplicateMode = printModes.find((mode) => existing.printModes.includes(mode));
    if (duplicateMode) throw new TypeError(`PDF-Druckmodus ist bereits registriert: ${duplicateMode}`);
  }

  const normalized = Object.freeze({
    documentTypeId,
    moduleId,
    scopeId,
    profileStorageKey,
    layoutStorageKey: profileStorageKey,
    contractVersion: String(registration.contractVersion || "1.0.0"),
    descriptorVersion: Number(registration.descriptorVersion || candidateRegistry.registryVersion || 1),
    displayName: String(registration.displayName || documentTypeId),
    candidateRegistry: Object.freeze(candidateRegistry),
    adapter: registration.adapter || null,
    createAdapter: typeof registration.createAdapter === "function" ? registration.createAdapter : null,
    regenerate: typeof registration.regenerate === "function" ? registration.regenerate : null,
    buildRegenerationRequest: typeof registration.buildRegenerationRequest === "function" ? registration.buildRegenerationRequest : null,
    printModes,
    builtIn: registration.builtIn === true || registration.default === true,
    default: registration.default === true,
    adapterCache: new Map(),
  });
  registrations.set(documentTypeId, normalized);
  return normalized;
}

function listPdfEditorAdapterRegistrations() {
  return [...registrations.values()];
}

function publicAnalysis(analysis) {
  if (!analysis) return null;
  return {
    documentTypeId: analysis.documentTypeId,
    displayName: analysis.displayName,
    identity: clone(analysis.identity),
    acceptedIdentity: clone(analysis.acceptedIdentity || null),
    pdfRegistryStatus: analysis.status,
    editorAvailable: analysis.available,
    canRegister: analysis.canRegister,
    canAcceptNewElements: analysis.canAcceptNewElements,
    canSynchronizeElements: analysis.canSynchronizeElements,
    newElementIds: [...analysis.newElementIds],
    missingElementIds: [...analysis.missingElementIds],
    reactivatedElementIds: [...analysis.reactivatedElementIds],
    inactiveElementIds: [...analysis.inactiveElementIds],
    incompatibleElementIds: [...analysis.incompatibleElementIds],
    incompleteElementIds: [...analysis.incompleteElementIds],
    duplicateElementIds: [...analysis.duplicateElementIds],
    identityErrors: [...analysis.identityErrors],
    validationErrors: clone(analysis.validationErrors),
  };
}

function createPdfEditorAdapterResolver({ profileBaseRoot, registrationRoot, regeneratePdf } = {}) {
  if (typeof profileBaseRoot !== "string" || !profileBaseRoot.trim()) throw new TypeError("PDF-Profilbasis fehlt.");
  const resolvedProfileBaseRoot = path.resolve(profileBaseRoot);
  const store = createPdfDocumentTypeRegistryStore({ root: registrationRoot || path.dirname(resolvedProfileBaseRoot) });
  const configured = new WeakSet();
  let activeDocumentTypeId = "";
  let activeContext = null;
  let activeAdapter = null;

  function registrationFor(documentTypeId) {
    return registrations.get(String(documentTypeId || "").trim()) || null;
  }

  function inspectRegistration(registration) {
    if (!registration) return null;
    const accepted = registration.builtIn ? null : store.get(registration.documentTypeId);
    return analyzePdfDocumentType(registration, accepted);
  }

  function adapterFor(registration, effectiveRegistry) {
    if (!registration || !effectiveRegistry) return null;
    const fingerprint = effectiveRegistry.registryFingerprint || createPdfRegistryFingerprint(effectiveRegistry);
    const candidateFingerprint = registration.candidateRegistry.registryFingerprint || createPdfRegistryFingerprint(registration.candidateRegistry);
    if (registration.adapter && candidateFingerprint === fingerprint) return registration.adapter;
    if (!registration.createAdapter) {
      throw Object.assign(new Error("Akzeptierter PDF-Descriptor kann nicht durch den registrierten Adapter bereitgestellt werden."), { code: "pdf_adapter_snapshot_unavailable" });
    }
    if (!registration.adapterCache.has(fingerprint)) {
      registration.adapterCache.set(fingerprint, registration.createAdapter({ registry: clone(effectiveRegistry) }));
    }
    return registration.adapterCache.get(fingerprint);
  }

  function configure(registration, adapter) {
    if (!registration || !adapter || configured.has(adapter)) return adapter;
    adapter.configureProfileRoot(path.join(resolvedProfileBaseRoot, registration.profileStorageKey));
    adapter.configureRegenerate(async (context) => {
      if (registration.regenerate) return registration.regenerate(context);
      if (!registration.buildRegenerationRequest || typeof regeneratePdf !== "function") {
        throw Object.assign(new Error("PDF-Regeneration ist fuer diesen Dokumenttyp nicht registriert."), { code: "pdf_regenerate_unavailable" });
      }
      const request = registration.buildRegenerationRequest(context);
      const pageSettings = adapter.getPdfRegistry()?.pageSettings;
      return regeneratePdf({
        ...request,
        documentTypeId: request?.documentTypeId || registration.documentTypeId,
        orientation: pageSettings?.orientation,
      });
    });
    configured.add(adapter);
    return adapter;
  }

  function inspect(documentTypeId) {
    const registration = registrationFor(documentTypeId);
    if (!registration) {
      return {
        documentTypeId: String(documentTypeId || "").trim(), displayName: String(documentTypeId || "").trim(),
        pdfRegistryStatus: "unavailable", editorAvailable: false, canRegister: false, canAcceptNewElements: false, canSynchronizeElements: false,
        newElementIds: [], missingElementIds: [], reactivatedElementIds: [], inactiveElementIds: [], incompatibleElementIds: [], incompleteElementIds: [], duplicateElementIds: [], identityErrors: [], validationErrors: [],
      };
    }
    return publicAnalysis(inspectRegistration(registration));
  }

  function activateAcceptedDocumentType(documentTypeId) {
    const registration = registrationFor(documentTypeId);
    if (!registration) throw Object.assign(new Error("PDF-Dokumenttyp besitzt keinen Descriptor-Provider."), { code: "pdf_document_type_unknown" });
    if (registration.builtIn) return inspect(documentTypeId);
    const previous = store.get(registration.documentTypeId);
    const analysis = analyzePdfDocumentType(registration, previous);
    const candidate = validateCandidate(registration);
    if (!candidate.ok) throw Object.assign(new Error("PDF-Dokumenttyp ist unvollstaendig oder ungueltig."), { code: "pdf_document_type_incomplete", diagnostics: publicAnalysis(analysis) });
    if (analysis.incompatibleElementIds.length || analysis.identityErrors.length || analysis.duplicateElementIds.length) {
      throw Object.assign(new Error("PDF-Dokumenttyp ist nicht additiv kompatibel."), { code: "pdf_document_type_incompatible", diagnostics: publicAnalysis(analysis) });
    }
    const nextRegistry = previous ? mergeAdditiveRegistry(previous.registry, candidate.registry, analysis.newElementIds) : candidate.registry;
    const nextRecord = createAcceptedRecord(registration, nextRegistry, previous, candidate.registry.elements.map((element) => element.id));
    const nextEffectiveRegistry = createEffectiveRegistry(nextRecord);
    const nextAdapter = configure(registration, adapterFor(registration, nextEffectiveRegistry));
    if (previous && typeof nextAdapter.reconcilePersistedProfile === "function") nextAdapter.reconcilePersistedProfile(createEffectiveRegistry(previous));
    store.save(nextRecord);
    if (activeDocumentTypeId === registration.documentTypeId) {
      activeAdapter = nextAdapter;
      if (activeContext) activeAdapter.setActiveDocumentContext(activeContext);
    }
    return inspect(documentTypeId);
  }

  function resolvePrintRegistration({ documentTypeId, mode } = {}) {
    const requestedDocumentTypeId = String(documentTypeId || "").trim();
    const requestedMode = String(mode || "").trim().toLowerCase();
    const explicit = requestedDocumentTypeId ? registrationFor(requestedDocumentTypeId) : null;
    const matches = requestedDocumentTypeId
      ? explicit && (!requestedMode || explicit.printModes.includes(requestedMode)) ? [explicit] : []
      : listPdfEditorAdapterRegistrations().filter((entry) => entry.printModes.includes(requestedMode));
    if (matches.length !== 1) return null;
    const registration = matches[0];
    const analysis = inspectRegistration(registration);
    if (!analysis?.effectiveRegistry) return null;
    return { registration, analysis: publicAnalysis(analysis), adapter: configure(registration, adapterFor(registration, analysis.effectiveRegistry)) };
  }

  function requireActiveAdapter() {
    if (!activeAdapter) throw Object.assign(new Error("PDF-Dokumenttyp ist nicht fuer den Editor registriert."), { code: "pdf_document_unavailable" });
    return activeAdapter;
  }

  return Object.freeze({
    setActiveDocumentContext(context = {}) {
      const documentTypeId = String(context.documentTypeId || "").trim();
      activeDocumentTypeId = documentTypeId;
      activeContext = clone(context);
      activeAdapter = null;
      const registration = registrationFor(documentTypeId);
      const analysis = inspectRegistration(registration);
      if (!registration || !analysis?.effectiveRegistry) return { ok: false, activeDocumentId: "", ...inspect(documentTypeId) };
      activeAdapter = configure(registration, adapterFor(registration, analysis.effectiveRegistry));
      const result = activeAdapter.setActiveDocumentContext(context);
      return { ...result, documentTypeId, ...publicAnalysis(analysis) };
    },
    inspectPdfDocumentType: inspect,
    activateAcceptedDocumentType,
    resolvePrintRegistration,
    getPdfContract() { return activeAdapter?.getPdfContract() || null; },
    getPdfRegistry() { return requireActiveAdapter().getPdfRegistry(); },
    getCurrentPdfLayoutState() { return requireActiveAdapter().getCurrentPdfLayoutState(); },
    preparePdfEditorSessionBaseline() {
      const adapter = requireActiveAdapter();
      return typeof adapter.preparePdfEditorSessionBaseline === "function" ? adapter.preparePdfEditorSessionBaseline() : null;
    },
    rollbackPdfEditorSessionPreparation(receipt) {
      const adapter = requireActiveAdapter();
      return typeof adapter.rollbackPdfEditorSessionPreparation === "function" ? adapter.rollbackPdfEditorSessionPreparation(receipt) : false;
    },
    submitPdfChangeRequest(request) { return requireActiveAdapter().submitPdfChangeRequest(request); },
    regeneratePdfPreview() { return requireActiveAdapter().regeneratePdfPreview(); },
    getPreviewMetadata() { return requireActiveAdapter().getPreviewMetadata(); },
    resolveRegistration(documentTypeId) { return registrationFor(documentTypeId); },
    getRegistrationStorePath() { return store.filePath; },
  });
}

function resetPdfEditorAdapterRegistrationsForTest() {
  registrations.clear();
}

module.exports = Object.freeze({ createPdfEditorAdapterResolver, listPdfEditorAdapterRegistrations, registerPdfEditorAdapter, resetPdfEditorAdapterRegistrationsForTest });
