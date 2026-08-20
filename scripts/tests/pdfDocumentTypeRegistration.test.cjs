"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createPdfRegistryFingerprint } = require("ui-editor-kit");
const { createDeclarativePdfAdapter, persistedRegistryFingerprint } = require("../../src/main/ui-editor/declarativePdfAdapter.cjs");
const registryModulePath = require.resolve("../../src/main/ui-editor/pdfAdapterRegistry.cjs");
const protocolModulePath = require.resolve("../../src/main/ui-editor/bbmPdfAdapter.cjs");
const restModulePath = require.resolve("../../src/main/ui-editor/restarbeitenPdfAdapter.cjs");
const { createPdfEditorAdapterResolver, registerPdfEditorAdapter, resetPdfEditorAdapterRegistrationsForTest } = require(registryModulePath);

const ALL_LOCKS = Object.freeze(["move", "resize", "resizeHeight", "textMove", "textResize", "setTextAlignment", "setLineSpacing", "setVisibility", "setPageMargins", "setPageBreakRule"]);

function fixed(id, kind, parentId, order, rendererKey, role = "layout") {
  return { id, name: id, scopeId: "pdf.test.sync", parentId, kind, role, pageArea: kind === "header" ? "header" : kind === "footer" ? "footer" : kind === "document" || kind === "page" ? "document" : "body", order, visible: true, editable: false, capabilities: [], allowedOps: [], lockedOps: ALL_LOCKS, baseline: { x: 0, y: 0, width: 297, height: 10, visible: true }, layoutBounds: { minX: 0, maxX: 297, minY: 0, maxY: 210, minWidth: 1, maxWidth: 297, minHeight: 1, maxHeight: 210 }, refKey: id, rendererKey };
}

function column(key, order, width = 20) {
  return { id: `pdf.test.sync.table.column.${key}`, name: key, scopeId: "pdf.test.sync", parentId: "pdf.test.sync.table", kind: "tableColumn", role: "content", columnRole: "contentColumn", pageArea: "body", order, visible: true, editable: true, capabilities: ["resizeWidth"], allowedOps: ["resizeWidth"], lockedOps: ALL_LOCKS, baseline: { x: 12 + (order - 100) * 20, y: 40, width, height: 100, visible: true }, layoutBounds: { minX: 0, maxX: 297, minY: 0, maxY: 210, minWidth: 10, maxWidth: 30, minHeight: 1, maxHeight: 150 }, refKey: `sync.column.${key}`, rendererKey: `[data-column="${key}"]` };
}

const COLUMN_POSITIONS = Object.freeze({ A: 1, B: 2, C: 3, D: 4, E: 5 });

function testRegistry(columnKeys, { incompleteKey = "", duplicateKey = "", documentTypeId = "neutral-sync" } = {}) {
  const scopeId = documentTypeId === "neutral-sync" ? "pdf.test.sync" : `pdf.test.${documentTypeId}`;
  const rewrite = (entry) => ({ ...entry, id: entry.id.replaceAll("pdf.test.sync", scopeId), scopeId, parentId: entry.parentId?.replaceAll("pdf.test.sync", scopeId) || null });
  const structural = [
    fixed("pdf.test.sync", "document", null, 0, ".root"),
    fixed("pdf.test.sync.page", "page", "pdf.test.sync", 10, ".page"),
    fixed("pdf.test.sync.header", "header", "pdf.test.sync.page", 20, ".header"),
    fixed("pdf.test.sync.header.group", "group", "pdf.test.sync.header", 21, ".group"),
    fixed("pdf.test.sync.header.label", "label", "pdf.test.sync.header.group", 22, ".label", "fieldLabel"),
    fixed("pdf.test.sync.header.value", "value", "pdf.test.sync.header.group", 23, ".value", "content"),
    fixed("pdf.test.sync.body", "area", "pdf.test.sync.page", 30, ".body"),
    { ...fixed("pdf.test.sync.table", "table", "pdf.test.sync.body", 40, ".table", "content"), editable: true, capabilities: ["resizeColumnBoundary"], allowedOps: ["resizeColumnBoundary"], boundaryResizePolicy: "adjacentPreserveTotal", baseline: { x: 12, y: 40, width: 100, height: 100, visible: true } },
    fixed("pdf.test.sync.rows", "repeatingArea", "pdf.test.sync.table", 50, ".rows", "content"),
    fixed("pdf.test.sync.footer", "footer", "pdf.test.sync.page", 200, ".footer"),
  ].map(rewrite);
  const columns = columnKeys.map((key, index) => rewrite(column(key, 100 + (COLUMN_POSITIONS[key] || index + 1))));
  if (incompleteKey) columns.push({ ...rewrite(column(incompleteKey, 150)), baseline: undefined });
  if (duplicateKey) columns.push(rewrite(column(duplicateKey, 151)));
  const base = { applicationId: "bbm-produktiv", documentTypeId, displayName: documentTypeId, scopeId, unit: "mm", pageSettings: { format: "A4", orientation: "landscape", width: 297, height: 210, margins: { top: 5, right: 12, bottom: 0, left: 12 } }, elements: [...structural, ...columns] };
  return incompleteKey || duplicateKey ? { ...base, registryVersion: columnKeys.length + 1 } : { ...base, registryVersion: columnKeys.length, registryFingerprint: createPdfRegistryFingerprint(base) };
}

function withOrientation(registry, orientation) {
  const landscape = orientation === "landscape";
  const width = landscape ? 297 : 210;
  const height = landscape ? 210 : 297;
  const elements = registry.elements.map((entry) => ({
    ...entry,
    baseline: {
      ...entry.baseline,
      width: ["document", "page"].includes(entry.kind) ? width : Math.min(Number(entry.baseline.width), width),
      height: ["document", "page"].includes(entry.kind) ? height : Math.min(Number(entry.baseline.height), height),
    },
    layoutBounds: {
      ...entry.layoutBounds,
      maxX: width,
      maxY: height,
      maxWidth: width,
      maxHeight: height,
    },
  }));
  const next = {
    ...registry,
    pageSettings: { ...registry.pageSettings, orientation, width, height },
    elements,
  };
  delete next.registryFingerprint;
  return { ...next, registryFingerprint: createPdfRegistryFingerprint(next) };
}

function registerNeutral(registry, { documentTypeId = registry.documentTypeId, descriptorVersion = registry.registryVersion, contractVersion = "1.0" } = {}) {
  return registerPdfEditorAdapter({
    documentTypeId,
    moduleId: documentTypeId,
    scopeId: registry.scopeId,
    profileStorageKey: `module-${documentTypeId}`,
    contractVersion,
    descriptorVersion,
    displayName: documentTypeId,
    candidateRegistry: registry,
    printModes: [`mode-${documentTypeId}`],
    createAdapter: ({ registry: accepted }) => createDeclarativePdfAdapter({ documentTypeId, displayName: documentTypeId, registry: accepted, documentIdentityFields: ["projectId"] }),
    buildRegenerationRequest: (context) => ({ mode: `mode-${documentTypeId}`, projectId: context.projectId }),
  });
}

function resolver(root) {
  return createPdfEditorAdapterResolver({ profileBaseRoot: path.join(root, "profiles"), registrationRoot: root, regeneratePdf: async () => ({ pageCount: 1, controlledOutputPath: "neutral.pdf" }) });
}

function restoreProductRegistrations() {
  resetPdfEditorAdapterRegistrationsForTest();
  delete require.cache[protocolModulePath];
  delete require.cache[restModulePath];
  require(protocolModulePath);
  require(restModulePath);
}

async function runPdfDocumentTypeRegistrationTests() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-pdf-document-types-"));
  try {
    resetPdfEditorAdapterRegistrationsForTest();
    const abc = testRegistry(["A", "B", "C"]);
    registerNeutral(abc);
    let current = resolver(root);
    assert.equal(current.setActiveDocumentContext({ documentTypeId: "unknown", projectId: "p1" }).pdfRegistryStatus, "unavailable");
    const initial = current.setActiveDocumentContext({ documentTypeId: "neutral-sync", projectId: "p1" });
    assert.equal(initial.pdfRegistryStatus, "unregistered");
    assert.equal(initial.canRegister, true);
    current.activateAcceptedDocumentType("neutral-sync");
    assert.equal(current.setActiveDocumentContext({ documentTypeId: "neutral-sync", projectId: "p1" }).pdfRegistryStatus, "available");

    const configured = current.resolvePrintRegistration({ mode: "mode-neutral-sync" }).adapter;
    const profilePath = configured.getPdfProfilePath();
    fs.mkdirSync(path.dirname(profilePath), { recursive: true });
    const state = configured.getCurrentPdfLayoutState();
    state.elements.find((entry) => entry.elementId.endsWith(".B")).width = 22;
    state.elements.find((entry) => entry.elementId.endsWith(".C")).width = 18;
    fs.writeFileSync(profilePath, JSON.stringify({ schemaVersion: 1, documentKind: "pdf-layout-profile", applicationId: "bbm-produktiv", documentType: "neutral-sync", profileId: "pdf-standard", scopeId: abc.scopeId, savedAt: new Date().toISOString(), registryFingerprint: persistedRegistryFingerprint(abc), layoutState: state }), "utf8");
    const legacyStoreDocument = JSON.parse(fs.readFileSync(current.getRegistrationStorePath(), "utf8"));
    delete legacyStoreDocument.documentTypes["neutral-sync"].activeElementIds;
    delete legacyStoreDocument.documentTypes["neutral-sync"].inactiveElementIds;
    fs.writeFileSync(current.getRegistrationStorePath(), JSON.stringify(legacyStoreDocument), "utf8");

    resetPdfEditorAdapterRegistrationsForTest();
    registerNeutral(testRegistry(["A", "C"]), { descriptorVersion: 4 });
    current = resolver(root);
    let status = current.inspectPdfDocumentType("neutral-sync");
    assert.deepEqual(status.missingElementIds, ["pdf.test.sync.table.column.B"]);
    assert.equal(status.canSynchronizeElements, true);
    assert.equal(status.editorAvailable, true);
    current.activateAcceptedDocumentType("neutral-sync");
    status = current.inspectPdfDocumentType("neutral-sync");
    assert.equal(status.pdfRegistryStatus, "available");
    assert.deepEqual(status.inactiveElementIds, ["pdf.test.sync.table.column.B"]);
    current.setActiveDocumentContext({ documentTypeId: "neutral-sync", projectId: "p1" });
    assert.equal(current.getPdfRegistry().elements.some((entry) => entry.id.endsWith(".B")), false, "inaktives B ist kein aktuelles Editorziel");
    assert.equal(current.getCurrentPdfLayoutState().elements.some((entry) => entry.elementId.endsWith(".B")), false, "inaktives B ist nicht im aktuellen Layoutzustand");
    const inactiveProfile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
    assert.equal(inactiveProfile.layoutState.elements.some((entry) => entry.elementId.endsWith(".B")), false, "aktives Hauptprofil bleibt fuer den nativen Editor exakt");
    const profileHistoryPath = configured.getPdfProfileHistoryPath();
    const profileHistory = JSON.parse(fs.readFileSync(profileHistoryPath, "utf8"));
    assert.equal(profileHistory.layoutState.elements.find((entry) => entry.elementId.endsWith(".B")).width, 22, "inaktives B behaelt seinen historischen Profilwert");
    assert.equal(Object.hasOwn(profileHistory, "registry"), false, "Profilhistorie ist keine parallele Registry");
    const acceptedAfterV2 = JSON.parse(fs.readFileSync(current.getRegistrationStorePath(), "utf8")).documentTypes["neutral-sync"];
    assert.equal(acceptedAfterV2.registry.elements.some((entry) => entry.id.endsWith(".B")), true, "B bleibt historisch in derselben Registry erhalten");
    assert.equal(acceptedAfterV2.activeElementIds.some((id) => id.endsWith(".B")), false);
    assert.equal(acceptedAfterV2.inactiveElementIds.some((id) => id.endsWith(".B")), true);

    resetPdfEditorAdapterRegistrationsForTest();
    const incompatibleAbc = testRegistry(["A", "B", "C"]);
    incompatibleAbc.elements = incompatibleAbc.elements.map((entry) => entry.id.endsWith(".B") ? { ...entry, baseline: { ...entry.baseline, width: 21 } } : entry);
    incompatibleAbc.registryFingerprint = createPdfRegistryFingerprint(incompatibleAbc);
    registerNeutral(incompatibleAbc, { descriptorVersion: 5 });
    current = resolver(root);
    status = current.inspectPdfDocumentType("neutral-sync");
    assert.deepEqual(status.reactivatedElementIds, ["pdf.test.sync.table.column.B"]);
    assert.deepEqual(status.incompatibleElementIds, ["pdf.test.sync.table.column.B"]);
    assert.equal(status.canSynchronizeElements, false, "inkompatible Wiederkehr wird nicht blind uebernommen");
    assert.throws(() => current.activateAcceptedDocumentType("neutral-sync"), (error) => error?.code === "pdf_document_type_incompatible");

    resetPdfEditorAdapterRegistrationsForTest();
    const abcV3 = testRegistry(["A", "B", "C"]);
    registerNeutral(abcV3, { descriptorVersion: 5 });
    current = resolver(root);
    status = current.inspectPdfDocumentType("neutral-sync");
    assert.deepEqual(status.reactivatedElementIds, ["pdf.test.sync.table.column.B"]);
    assert.equal(status.canSynchronizeElements, true);
    current.activateAcceptedDocumentType("neutral-sync");
    current.setActiveDocumentContext({ documentTypeId: "neutral-sync", projectId: "p1" });
    assert.equal(current.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId.endsWith(".B")).width, 22, "wiederkehrendes B nutzt den alten Wert");

    resetPdfEditorAdapterRegistrationsForTest();
    const abcd = testRegistry(["A", "B", "C", "D"]);
    registerNeutral(abcd, { descriptorVersion: 6 });
    current = resolver(root);
    status = current.inspectPdfDocumentType("neutral-sync");
    assert.deepEqual(status.newElementIds, ["pdf.test.sync.table.column.D"]);
    assert.equal(status.canAcceptNewElements, true);
    assert.equal(status.canSynchronizeElements, true);
    current.activateAcceptedDocumentType("neutral-sync");
    current.setActiveDocumentContext({ documentTypeId: "neutral-sync", projectId: "p1" });
    assert.equal(current.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId.endsWith(".D")).width, 20, "D wird additiv mit Baseline ergaenzt");
    assert.ok(fs.readdirSync(root).some((name) => name.startsWith("pdf-document-types.registry.json.archive-")), "Registry wird vor Synchronisation archiviert");
    assert.ok(fs.readdirSync(path.dirname(profilePath)).some((name) => name.includes(".archive-")), "Layoutprofil wird vor Synchronisation archiviert");

    resetPdfEditorAdapterRegistrationsForTest();
    registerNeutral(abcd, { descriptorVersion: 6 });
    current = resolver(root);
    current.setActiveDocumentContext({ documentTypeId: "neutral-sync", projectId: "p1" });
    assert.equal(current.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId.endsWith(".B")).width, 22, "Profil ueberlebt Resolver-Neustart");

    resetPdfEditorAdapterRegistrationsForTest();
    registerNeutral(testRegistry(["A", "B", "C", "D"], { incompleteKey: "E" }), { descriptorVersion: 7 });
    current = resolver(root);
    status = current.inspectPdfDocumentType("neutral-sync");
    assert.equal(status.pdfRegistryStatus, "incomplete");
    assert.deepEqual(status.incompleteElementIds, ["pdf.test.sync.table.column.E"]);
    assert.equal(status.editorAvailable, true, "unvollstaendiges E blockiert bekannte Elemente nicht");

    resetPdfEditorAdapterRegistrationsForTest();
    registerNeutral(abcd, { descriptorVersion: 8, contractVersion: "2.0" });
    current = resolver(root);
    status = current.inspectPdfDocumentType("neutral-sync");
    assert.equal(status.pdfRegistryStatus, "incompatible");
    assert.deepEqual(status.identityErrors, ["contractVersion"]);
    assert.equal(status.editorAvailable, true, "akzeptierter Altvertrag bleibt bei inkompatibler Version nutzbar");
    assert.throws(() => current.activateAcceptedDocumentType("neutral-sync"), (error) => error?.code === "pdf_document_type_incompatible");

    assert.throws(() => registerNeutral(abcd), /bereits registriert/, "doppelter Dokumenttyp wird deterministisch abgewiesen");
    resetPdfEditorAdapterRegistrationsForTest();
    const duplicate = testRegistry(["A", "B", "C"], { duplicateKey: "B" });
    registerNeutral(duplicate);
    status = resolver(root).inspectPdfDocumentType("neutral-sync");
    assert.deepEqual(status.duplicateElementIds, ["pdf.test.sync.table.column.B"]);
    assert.equal(status.canRegister, false);

    resetPdfEditorAdapterRegistrationsForTest();
    const third = testRegistry(["A", "B"], { documentTypeId: "neutral-third" });
    registerNeutral(third, { documentTypeId: "neutral-third" });
    current = resolver(root);
    assert.equal(current.inspectPdfDocumentType("neutral-third").pdfRegistryStatus, "unregistered");
    current.activateAcceptedDocumentType("neutral-third");
    assert.equal(current.setActiveDocumentContext({ documentTypeId: "neutral-third", projectId: "p3" }).documentTypeId, "neutral-third");
    assert.equal(current.getPdfContract().documentTypeId, "neutral-third");
    assert.equal(current.resolvePrintRegistration({ documentTypeId: "unknown", mode: "mode-neutral-third" }), null, "explizit unbekannter Typ faellt nicht auf einen bekannten Modus zurueck");
    assert.equal(current.resolvePrintRegistration({ documentTypeId: "neutral-third", mode: "falscher-modus" }), null, "Typ-/Modus-Mismatch wird deterministisch abgewiesen");

    resetPdfEditorAdapterRegistrationsForTest();
    const portrait = withOrientation(testRegistry(["A", "B"], { documentTypeId: "neutral-portrait" }), "portrait");
    const landscape = withOrientation(testRegistry(["A", "B"], { documentTypeId: "neutral-landscape" }), "landscape");
    registerNeutral(portrait);
    registerNeutral(landscape);
    const neutralRegenerations = [];
    current = createPdfEditorAdapterResolver({
      profileBaseRoot: path.join(root, "orientation-profiles"),
      registrationRoot: path.join(root, "orientation-registry"),
      regeneratePdf: async (request) => {
        neutralRegenerations.push(request);
        return { pageCount: 1, controlledOutputPath: `${request.documentTypeId}.pdf` };
      },
    });
    for (const documentTypeId of ["neutral-portrait", "neutral-landscape"]) {
      current.activateAcceptedDocumentType(documentTypeId);
      current.setActiveDocumentContext({ documentTypeId, projectId: documentTypeId });
      await current.regeneratePdfPreview();
    }
    assert.deepEqual(neutralRegenerations.map(({ documentTypeId, orientation }) => ({ documentTypeId, orientation })), [
      { documentTypeId: "neutral-portrait", orientation: "portrait" },
      { documentTypeId: "neutral-landscape", orientation: "landscape" },
    ], "neutrale Regeneration folgt ausschliesslich der registrierten Seitenausrichtung");

    restoreProductRegistrations();
    const productRegenerations = [];
    current = createPdfEditorAdapterResolver({
      profileBaseRoot: path.join(root, "product-orientation-profiles"),
      registrationRoot: path.join(root, "product-orientation-registry"),
      regeneratePdf: async (request) => {
        productRegenerations.push(request);
        return { pageCount: 1, controlledOutputPath: `${request.documentTypeId}.pdf` };
      },
    });
    current.setActiveDocumentContext({ documentTypeId: "protocol", projectId: "p", meetingId: "m" });
    await current.regeneratePdfPreview();
    current.activateAcceptedDocumentType("restarbeiten");
    current.setActiveDocumentContext({ documentTypeId: "restarbeiten", projectId: "p", restarbeitenRows: [] });
    await current.regeneratePdfPreview();
    assert.deepEqual(productRegenerations.map(({ documentTypeId, orientation }) => ({ documentTypeId, orientation })), [
      { documentTypeId: "protocol", orientation: "portrait" },
      { documentTypeId: "restarbeiten", orientation: "landscape" },
    ], "Protokoll bleibt Portrait und Restarbeiten folgt dem Landscape-Descriptor");

    console.log("PASS PDF-Dokumenttypen: exakt, additiv, persistent und ohne Core-Sonderfall registriert");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    restoreProductRegistrations();
  }
}

if (require.main === module) runPdfDocumentTypeRegistrationTests().catch((error) => { console.error(error); process.exitCode = 1; });

module.exports = { runPdfDocumentTypeRegistrationTests };
