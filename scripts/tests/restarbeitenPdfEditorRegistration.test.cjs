"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createPdfRegistryFingerprint } = require("ui-editor-kit");

const ROOT = path.resolve(__dirname, "../..");
const protocol = require("../../src/main/ui-editor/bbmPdfAdapter.cjs");
const rest = require("../../src/main/ui-editor/restarbeitenPdfAdapter.cjs");
const protocolModulePath = require.resolve("../../src/main/ui-editor/bbmPdfAdapter.cjs");
const restModulePath = require.resolve("../../src/main/ui-editor/restarbeitenPdfAdapter.cjs");
const { createDeclarativePdfAdapter, persistedRegistryFingerprint } = require("../../src/main/ui-editor/declarativePdfAdapter.cjs");
const { createPdfEditorAdapterResolver, registerPdfEditorAdapter, resetPdfEditorAdapterRegistrationsForTest } = require("../../src/main/ui-editor/pdfAdapterRegistry.cjs");

function source(relativePath) { return fs.readFileSync(path.join(ROOT, relativePath), "utf8"); }

const LEGACY_COLUMN_DEFINITIONS = Object.freeze([
  ["number", "Nr", "structureColumn", 9, 7, 12, "number"],
  ["class", "Klasse", "metaColumn", 10, 8, 14, "class"],
  ["short-text", "Kurztext", "contentColumn", 31, 24, 42, "shortText"],
  ["long-text", "Langtext", "contentColumn", 46, 34, 60, "longText"],
  ["house", "Haus", "contentColumn", 17, 13, 24, "location1"],
  ["floor", "Geschoss", "contentColumn", 17, 13, 24, "location2"],
  ["unit", "Einheit", "contentColumn", 18, 13, 24, "location3"],
  ["room", "Raum", "contentColumn", 18, 13, 24, "location4"],
  ["status", "Status/Ampel", "statusColumn", 19, 15, 25, "status"],
  ["due-date", "Fertig bis", "dateColumn", 20, 17, 24, "dueDate"],
  ["responsible", "Verantwortlich", "responsibleColumn", 25, 19, 34, "responsible"],
  ["completed-at", "erledigt am", "dateColumn", 20, 17, 24, "completedAt"],
  ["completion-note", "Notiz/Massnahmen", "contentColumn", 23, 18, 34, "completionNote"],
]);

function legacyRestarbeitenRegistry() {
  const template = rest.REGISTRY.elements.find((entry) => entry.kind === "tableColumn");
  let x = 12;
  const columns = LEGACY_COLUMN_DEFINITIONS.map(([key, name, columnRole, width, minWidth, maxWidth, rendererKey], index) => {
    const currentX = x;
    x += width;
    return {
      ...structuredClone(template),
      id: `${rest.SCOPE_ID}.table.column.${key}`,
      name,
      role: columnRole === "structureColumn" ? "structure" : columnRole === "metaColumn" ? "meta" : columnRole === "dateColumn" ? "date" : "content",
      columnRole,
      order: 101 + index,
      baseline: { ...structuredClone(template.baseline), x: currentX, width },
      layoutBounds: { ...structuredClone(template.layoutBounds), minWidth, maxWidth },
      refKey: `restarbeiten.table.column.${key}`,
      rendererKey: `.restarbeitenTable [data-restarbeiten-column="${rendererKey}"]`,
    };
  });
  const structural = rest.REGISTRY.elements
    .filter((entry) => entry.kind !== "tableColumn" && !entry.id.endsWith(".vertical-column-separators"))
    .map((entry) => structuredClone(entry));
  const footer = structural.find((entry) => entry.kind === "footer");
  const base = {
    ...structuredClone(rest.REGISTRY),
    registryVersion: 1,
    elements: [...structural.filter((entry) => entry !== footer), ...columns, footer],
  };
  delete base.registryFingerprint;
  return { ...base, registryFingerprint: createPdfRegistryFingerprint(base) };
}

function restoreProductRegistrations() {
  resetPdfEditorAdapterRegistrationsForTest();
  delete require.cache[protocolModulePath];
  delete require.cache[restModulePath];
  require(protocolModulePath);
  require(restModulePath);
}

async function runRestarbeitenPdfEditorRegistrationTests() {
  const columns = rest.REGISTRY.elements.filter((entry) => entry.kind === "tableColumn").sort((a, b) => a.order - b.order);
  assert.equal(rest.DESCRIPTOR.documentTypeId, "restarbeiten");
  assert.equal(rest.DESCRIPTOR.moduleId, "restarbeiten");
  assert.equal(rest.DESCRIPTOR.scopeId, "pdf.bbm.restarbeiten");
  assert.equal(rest.DESCRIPTOR.profileStorageKey, "module-restarbeiten");
  assert.equal(rest.DESCRIPTOR.regenerationRoute, "print:toPdf/restarbeiten");
  assert.equal(rest.DESCRIPTOR.descriptorVersion, 3);
  assert.equal(columns.length, 9);
  assert.deepEqual(columns.map((entry) => entry.name), ["Nr", "Klasse", "Gegenstand", "Ort", "Einheit/Raum", "Fertig bis/Status", "Verantwortlich", "erledigt am", "Notiz/Massnahmen"]);
  assert.deepEqual(columns.map((entry) => entry.order), [101, 102, 103, 105, 107, 109, 111, 112, 113]);
  assert.deepEqual(columns.map((entry) => entry.baseline.width), [9, 10, 77, 34, 36, 39, 25, 20, 23]);
  assert.deepEqual(columns.map((entry) => entry.layoutBounds.minWidth), [7, 8, 58, 26, 26, 32, 19, 17, 18]);
  assert.deepEqual(columns.map((entry) => entry.layoutBounds.maxWidth), [12, 14, 102, 48, 48, 49, 34, 24, 34]);
  assert.equal(columns.reduce((sum, entry) => sum + entry.baseline.width, 0), 273);
  assert.ok(rest.REGISTRY.elements.every((entry) => entry.lockedOps.includes("setPageBreakRule")));
  assert.ok(columns.every((entry) => entry.allowedOps.length === 1 && entry.allowedOps[0] === "resizeWidth"));
  const table = rest.REGISTRY.elements.find((entry) => entry.kind === "table");
  const separators = rest.REGISTRY.elements.find((entry) => entry.id === `${rest.SCOPE_ID}.table.vertical-column-separators`);
  assert.equal(table.editable, true, "Tabellenbreite ist fuer den nativen Profil-State registriert");
  assert.deepEqual(table.capabilities, ["resizeWidth"]);
  assert.deepEqual(table.allowedOps, ["resizeWidth", "resizeColumnBoundary"], "Breiten- und Grenzoperation bleiben explizit am Tabellenvertrag");
  assert.deepEqual({
    name: separators.name,
    parentId: separators.parentId,
    kind: separators.kind,
    role: separators.role,
    editable: separators.editable,
    capabilities: separators.capabilities,
    allowedOps: separators.allowedOps,
    visible: separators.baseline.visible,
    refKey: separators.refKey,
    rendererKey: separators.rendererKey,
    layoutBinding: separators.layoutBinding,
  }, {
    name: "Senkrechte Spaltentrennlinien",
    parentId: table.id,
    kind: "group",
    role: "structure",
    editable: true,
    capabilities: ["setVisibility"],
    allowedOps: ["setVisibility"],
    visible: true,
    refKey: "restarbeiten.table.vertical-column-separators",
    rendererKey: ".restarbeitenTable",
    layoutBinding: { type: "visibilityClass", className: "restarbeitenTable--vertical-column-separators" },
  });

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-rest-pdf-editor-"));
  const generated = [];
  try {
    let resolver = createPdfEditorAdapterResolver({ profileBaseRoot: path.join(root, "profiles"), registrationRoot: root, regeneratePdf: async (request) => { generated.push(request); return { pageCount: 2, controlledOutputPath: path.join(root, "rest.pdf") }; } });
    assert.equal(resolver.inspectPdfDocumentType("restarbeiten").pdfRegistryStatus, "unregistered");
    resolver.setActiveDocumentContext({ documentTypeId: "restarbeiten", projectId: "project-1", restarbeitenRows: [{ id: "r1" }], restarbeitenLocationLabels: { level_1_label: "Haus" }, showAmpelInList: true });
    resolver.activateAcceptedDocumentType("restarbeiten");
    assert.equal(resolver.getPdfContract().documentTypeId, "restarbeiten");
    const baselineState = resolver.getCurrentPdfLayoutState();
    assert.equal(baselineState.elements.find((entry) => entry.elementId === separators.id).visible, true, "Separator-Baseline ist EIN");
    const separatorsOff = resolver.submitPdfChangeRequest({ changeId: "separators-off", elementId: separators.id,
      scopeId: rest.DESCRIPTOR.scopeId, operation: "setVisibility", payload: { visible: false } });
    assert.equal(separatorsOff.success, true, separatorsOff.message);
    assert.equal(separatorsOff.newState.visible, false);
    assert.deepEqual(separatorsOff.affectedStates.map((entry) => entry.elementId), [separators.id]);
    const invalidSeparators = resolver.submitPdfChangeRequest({ changeId: "separators-invalid", elementId: separators.id,
      scopeId: rest.DESCRIPTOR.scopeId, operation: "setVisibility", payload: { visible: "false" } });
    assert.deepEqual([invalidSeparators.success, invalidSeparators.errorCode], [false, "pdf_invalid_payload"]);
    resolver.resolvePrintRegistration({ mode: "restarbeiten" }).adapter.replaceCurrentPdfLayoutState(baselineState);
    assert.equal(resolver.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === separators.id).visible, true, "Standardwiederherstellung nutzt EIN");
    const numberColumn = columns.find((entry) => entry.name === "Nr");
    const classColumn = columns.find((entry) => entry.name === "Klasse");
    const initialColumnWidths = new Map(resolver.getCurrentPdfLayoutState().elements
      .filter((entry) => entry.elementId.includes(".table.column."))
      .map((entry) => [entry.elementId, entry.width]));
    const numberFive = resolver.submitPdfChangeRequest({ changeId: "number-five", elementId: numberColumn.id,
      scopeId: rest.DESCRIPTOR.scopeId, operation: "resizeWidth", payload: { width: 5 } });
    assert.equal(numberFive.success, true, numberFive.message);
    assert.equal(numberFive.newState.width, 5);
    assert.deepEqual(numberFive.affectedStates.map((entry) => entry.elementId), [numberColumn.id]);
    const afterFive = new Map(resolver.getCurrentPdfLayoutState().elements
      .filter((entry) => entry.elementId.includes(".table.column."))
      .map((entry) => [entry.elementId, entry.width]));
    assert.equal(afterFive.get(classColumn.id), 10, "Nr 9 -> 5 veraendert Klasse nicht");
    for (const [elementId, width] of initialColumnWidths) {
      if (elementId !== numberColumn.id) assert.equal(afterFive.get(elementId), width, `${elementId} blieb unveraendert`);
    }
    const numberZero = resolver.submitPdfChangeRequest({ changeId: "number-zero", elementId: numberColumn.id,
      scopeId: rest.DESCRIPTOR.scopeId, operation: "resizeWidth", payload: { width: 0 } });
    assert.equal(numberZero.success, true, numberZero.message);
    assert.ok(resolver.getPdfRegistry().elements.some((entry) => entry.id === numberColumn.id), "0-mm-Spalte bleibt Registry-/Baumziel");
    const numberNine = resolver.submitPdfChangeRequest({ changeId: "number-nine", elementId: numberColumn.id,
      scopeId: rest.DESCRIPTOR.scopeId, operation: "resizeWidth", payload: { width: 9 } });
    assert.equal(numberNine.success, true, numberNine.message);
    assert.equal(resolver.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === classColumn.id).width, 10);
    const tableResize = resolver.submitPdfChangeRequest({ changeId: "table-width", elementId: table.id, scopeId: rest.DESCRIPTOR.scopeId, operation: "resizeWidth", payload: { width: 272 } });
    assert.equal(tableResize.success, true);
    assert.equal(resolver.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId === table.id).width, 272);
    assert.equal(resolver.getCurrentPdfLayoutState().elements.filter((entry) => entry.elementId.includes(".table.column.")).reduce((sum, entry) => sum + entry.width, 0), 272, "aeussere Tabellenbreite fuehrt die letzte Spalte atomar mit");
    const preview = await resolver.regeneratePdfPreview();
    assert.equal(preview.pageCount, 2);
    assert.deepEqual(generated.map((request) => ({ mode: request.mode, documentTypeId: request.documentTypeId, orientation: request.orientation, rows: request.restarbeitenRows.length })), [{ mode: "restarbeiten", documentTypeId: "restarbeiten", orientation: "landscape", rows: 1 }]);

    resolver = createPdfEditorAdapterResolver({ profileBaseRoot: path.join(root, "profiles"), registrationRoot: root, regeneratePdf: async () => ({ pageCount: 1 }) });
    assert.equal(resolver.inspectPdfDocumentType("restarbeiten").pdfRegistryStatus, "available", "Registrierung ueberlebt Resolver-/App-Neustart");
    assert.equal(resolver.resolvePrintRegistration({ mode: "restarbeiten" }).registration.profileStorageKey, "module-restarbeiten");
    resolver.setActiveDocumentContext({ documentTypeId: "protocol", projectId: "p", meetingId: "m" });
    assert.equal(resolver.getPdfContract().registryFingerprint, protocol.REGISTRY_FINGERPRINT, "Protokollvertrag bleibt unveraendert");
  } finally { fs.rmSync(root, { recursive: true, force: true }); }

  const migrationRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-rest-pdf-v1-v2-"));
  try {
    resetPdfEditorAdapterRegistrationsForTest();
    const legacyRegistry = legacyRestarbeitenRegistry();
    registerPdfEditorAdapter({
      ...rest.DESCRIPTOR,
      descriptorVersion: 1,
      candidateRegistry: legacyRegistry,
      printModes: ["restarbeiten"],
      createAdapter: ({ registry }) => createDeclarativePdfAdapter({ applicationId: rest.APPLICATION_ID, documentTypeId: rest.DOCUMENT_TYPE_ID, displayName: rest.DISPLAY_NAME, registry, documentIdentityFields: ["projectId"] }),
      buildRegenerationRequest: (context) => ({ mode: "restarbeiten", documentTypeId: "restarbeiten", orientation: "landscape", projectId: context.projectId }),
    });
    let migrationResolver = createPdfEditorAdapterResolver({ profileBaseRoot: path.join(migrationRoot, "profiles"), registrationRoot: migrationRoot, regeneratePdf: async () => ({ pageCount: 1 }) });
    migrationResolver.activateAcceptedDocumentType("restarbeiten");
    migrationResolver.setActiveDocumentContext({ documentTypeId: "restarbeiten", projectId: "migration-project" });
    const legacyAdapter = migrationResolver.resolvePrintRegistration({ mode: "restarbeiten" }).adapter;
    const legacyProfilePath = legacyAdapter.getPdfProfilePath();
    const legacyState = legacyAdapter.getCurrentPdfLayoutState();
    legacyState.elements.find((entry) => entry.elementId.endsWith(".number")).width = 10;
    legacyState.elements.find((entry) => entry.elementId.endsWith(".class")).width = 9;
    legacyState.elements.find((entry) => entry.elementId.endsWith(".short-text")).width = 35;
    legacyState.elements.find((entry) => entry.elementId.endsWith(".long-text")).width = 42;
    fs.mkdirSync(path.dirname(legacyProfilePath), { recursive: true });
    fs.writeFileSync(legacyProfilePath, JSON.stringify({ schemaVersion: 1, documentKind: "pdf-layout-profile", applicationId: rest.APPLICATION_ID, documentType: rest.DOCUMENT_TYPE_ID, profileId: "pdf-standard", scopeId: rest.SCOPE_ID, savedAt: new Date().toISOString(), registryFingerprint: persistedRegistryFingerprint(legacyRegistry), layoutState: legacyState }), "utf8");

    resetPdfEditorAdapterRegistrationsForTest();
    delete require.cache[restModulePath];
    require(restModulePath);
    migrationResolver = createPdfEditorAdapterResolver({ profileBaseRoot: path.join(migrationRoot, "profiles"), registrationRoot: migrationRoot, regeneratePdf: async () => ({ pageCount: 1 }) });
    let migrationStatus = migrationResolver.inspectPdfDocumentType("restarbeiten");
    assert.deepEqual(migrationStatus.newElementIds, [
      `${rest.SCOPE_ID}.table.column.due-status`, `${rest.SCOPE_ID}.table.column.location`,
      `${rest.SCOPE_ID}.table.column.subject`, `${rest.SCOPE_ID}.table.column.unit-room`,
      `${rest.SCOPE_ID}.table.vertical-column-separators`,
    ]);
    assert.deepEqual(migrationStatus.missingElementIds, [
      `${rest.SCOPE_ID}.table.column.due-date`, `${rest.SCOPE_ID}.table.column.floor`, `${rest.SCOPE_ID}.table.column.house`,
      `${rest.SCOPE_ID}.table.column.long-text`, `${rest.SCOPE_ID}.table.column.room`, `${rest.SCOPE_ID}.table.column.short-text`,
      `${rest.SCOPE_ID}.table.column.status`, `${rest.SCOPE_ID}.table.column.unit`,
    ]);
    assert.deepEqual(migrationStatus.incompatibleElementIds, [], "unveraenderte Spaltenidentitaeten bleiben kompatibel");
    assert.equal(migrationStatus.canSynchronizeElements, true);
    migrationResolver.activateAcceptedDocumentType("restarbeiten");
    migrationStatus = migrationResolver.inspectPdfDocumentType("restarbeiten");
    assert.equal(migrationStatus.pdfRegistryStatus, "available");
    assert.equal(migrationStatus.inactiveElementIds.length, 8);
    migrationResolver.setActiveDocumentContext({ documentTypeId: "restarbeiten", projectId: "migration-project" });
    const currentColumns = migrationResolver.getPdfRegistry().elements.filter((entry) => entry.kind === "tableColumn").sort((a, b) => a.order - b.order);
    assert.deepEqual(currentColumns.map((entry) => entry.name), ["Nr", "Klasse", "Gegenstand", "Ort", "Einheit/Raum", "Fertig bis/Status", "Verantwortlich", "erledigt am", "Notiz/Massnahmen"]);
    assert.equal(migrationResolver.getCurrentPdfLayoutState().elements.some((entry) => entry.elementId.endsWith(".short-text")), false, "alte Einzelspalten sind keine aktuellen Editorziele");
    assert.equal(migrationResolver.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId.endsWith(".number")).width, 10, "kompatibler Profilwert bleibt aktiv");
    assert.equal(migrationResolver.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId.endsWith(".subject")).width, 77, "neue kombinierte Spalte startet mit ihrer Baseline");
    assert.equal(migrationResolver.getCurrentPdfLayoutState().elements.find((entry) => entry.elementId.endsWith(".vertical-column-separators")).visible, true, "neue Darstellungsoption startet additiv mit EIN");
    const migratedProfile = JSON.parse(fs.readFileSync(legacyProfilePath, "utf8"));
    assert.equal(migratedProfile.layoutState.elements.some((entry) => entry.elementId.endsWith(".short-text")), false, "aktives Hauptprofil enthaelt keine Phantomspalte");
    const migratedHistory = JSON.parse(fs.readFileSync(legacyAdapter.getPdfProfileHistoryPath(), "utf8"));
    assert.equal(migratedHistory.layoutState.elements.find((entry) => entry.elementId.endsWith(".short-text")).width, 35, "historischer Einzelspaltenwert bleibt physisch erhalten");
    const accepted = JSON.parse(fs.readFileSync(migrationResolver.getRegistrationStorePath(), "utf8")).documentTypes.restarbeiten;
    assert.equal(accepted.registry.elements.some((entry) => entry.id.endsWith(".short-text")), true, "alte Einzelspalte bleibt historisch bekannt");
    assert.equal(accepted.inactiveElementIds.some((id) => id.endsWith(".short-text")), true, "alte Einzelspalte ist explizit inaktiv");
  } finally {
    fs.rmSync(migrationRoot, { recursive: true, force: true });
    restoreProductRegistrations();
  }

  const coreRegistry = source("src/main/ui-editor/pdfAdapterRegistry.cjs");
  const documentStore = source("src/main/ui-editor/pdfDocumentTypeRegistry.cjs");
  const declarativeAdapter = source("src/main/ui-editor/declarativePdfAdapter.cjs");
  const layoutCore = source("src/renderer/print/pdfEditorLayout.js");
  const forbiddenProductType = /protocol|protokoll|restarbeiten|rechnung|firmen/i;
  for (const [name, content] of [["pdfAdapterRegistry", coreRegistry], ["pdfDocumentTypeRegistry", documentStore], ["declarativePdfAdapter", declarativeAdapter], ["pdfEditorLayout", layoutCore]]) {
    assert.doesNotMatch(content, forbiddenProductType, `${name} enthaelt einen konkreten Produkttyp`);
  }
  assert.match(source("src/renderer/app/coreShellNavigation.js"), /Dieser PDF-Typ ist noch nicht für den Editor registriert\./);
  assert.match(source("src/renderer/app/coreShellNavigation.js"), /PDF-Typ registrieren/);
  assert.match(source("src/renderer/app/coreShellNavigation.js"), /isDevelopmentUiEditorBuild[\s\S]*showPdfDocumentTypeRegistrationDialog/);
  assert.match(source("src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js"), /documentTypeId:\s*"restarbeiten"[\s\S]*_syncPdfEditorContext/);
  assert.match(source("src/renderer/print/layout/PrintShell.js"), /td\.dataset\.restarbeitenColumn = column\.key/);
  console.log("PASS Restarbeiten-PDF: 9-Spalten-Descriptor, DEV-Registrierung, Restart und echter Regenerationsweg");
}

if (require.main === module) runRestarbeitenPdfEditorRegistrationTests().catch((error) => { console.error(error); process.exitCode = 1; });

module.exports = { runRestarbeitenPdfEditorRegistrationTests };
