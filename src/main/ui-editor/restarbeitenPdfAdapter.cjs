"use strict";

const {
  PDF_TARGET_CONTRACT_VERSION,
  PDF_TARGET_OPERATIONS,
  createPdfRegistryFingerprint,
  validatePdfRegistry,
} = require("ui-editor-kit");
const { createDeclarativePdfAdapter } = require("./declarativePdfAdapter.cjs");
const { registerPdfEditorAdapter } = require("./pdfAdapterRegistry.cjs");

const APPLICATION_ID = "bbm-produktiv";
const DOCUMENT_TYPE_ID = "restarbeiten";
const MODULE_ID = "restarbeiten";
const DISPLAY_NAME = "Restarbeitenliste";
const SCOPE_ID = "pdf.bbm.restarbeiten";
const PROFILE_STORAGE_KEY = "module-restarbeiten";
const DESCRIPTOR_VERSION = 3;
const DOMAIN_LOCKS = Object.freeze([
  "changeText", "changeValue", "modifyDomainData", "createRecord", "deleteRecord", "saveDomainData",
  "upload", "import", "export", "autosave", "sortRecords", "filterRecords", "changeStatus",
  "changeDueDate", "changeResponsible", "deleteImage", "executeTargetAction", "setPageBreakRule",
]);

function box(x, y, width, height, extra = {}) { return Object.freeze({ x, y, width, height, visible: true, ...extra }); }
function bounds(minX, maxX, minY, maxY, minWidth, maxWidth, minHeight, maxHeight) { return Object.freeze({ minX, maxX, minY, maxY, minWidth, maxWidth, minHeight, maxHeight }); }

function element(values) {
  const capabilities = Object.freeze([...(values.capabilities || [])]);
  const allowedOps = Object.freeze([...(values.allowedOps || capabilities)]);
  return Object.freeze({
    id: values.id,
    name: values.name,
    scopeId: SCOPE_ID,
    parentId: values.parentId ?? null,
    kind: values.kind,
    role: values.role,
    pageArea: values.pageArea || "body",
    order: values.order,
    visible: true,
    editable: capabilities.length > 0,
    capabilities,
    allowedOps,
    lockedOps: Object.freeze([...new Set([...PDF_TARGET_OPERATIONS.filter((operation) => !allowedOps.includes(operation)), ...DOMAIN_LOCKS])]),
    baseline: values.baseline,
    layoutBounds: values.layoutBounds,
    refKey: values.refKey,
    rendererKey: values.rendererKey,
    ...(values.columnRole ? { columnRole: values.columnRole } : {}),
    ...(values.boundaryResizePolicy ? { boundaryResizePolicy: values.boundaryResizePolicy } : {}),
    ...(values.layoutBinding ? { layoutBinding: Object.freeze({ ...values.layoutBinding }) } : {}),
  });
}

const PAGE_BOUNDS = bounds(0, 297, 0, 210, 1, 297, 1, 210);
const HEADER_BOUNDS = bounds(0, 297, 0, 70, 5, 297, 2, 70);
const BODY_BOUNDS = bounds(0, 297, 50, 198, 5, 297, 2, 148);
const FOOTER_BOUNDS = bounds(0, 297, 180, 210, 5, 297, 2, 30);

const COLUMN_DEFINITIONS = Object.freeze([
  ["number", "Nr", "structureColumn", 9, 7, 12, 101],
  ["class", "Klasse", "metaColumn", 10, 8, 14, 102],
  ["subject", "Gegenstand", "contentColumn", 77, 58, 102, 103],
  ["location", "Ort", "contentColumn", 34, 26, 48, 105],
  ["unit-room", "Einheit/Raum", "contentColumn", 36, 26, 48, 107],
  ["due-status", "Fertig bis/Status", "statusColumn", 39, 32, 49, 109],
  ["responsible", "Verantwortlich", "responsibleColumn", 25, 19, 34, 111],
  ["completed-at", "erledigt am", "dateColumn", 20, 17, 24, 112],
  ["completion-note", "Notiz/Massnahmen", "contentColumn", 23, 18, 34, 113],
]);

const rendererColumnKeys = Object.freeze({
  number: "number", class: "class", subject: "subject", location: "location", "unit-room": "unitRoom",
  "due-status": "dueStatus", responsible: "responsible", "completed-at": "completedAt", "completion-note": "completionNote",
});

let x = 12;
const columnElements = COLUMN_DEFINITIONS.map(([key, name, columnRole, width, minWidth, maxWidth, order]) => {
  const currentX = x;
  x += width;
  return element({
    id: `${SCOPE_ID}.table.column.${key}`,
    name,
    parentId: `${SCOPE_ID}.table`,
    kind: "tableColumn",
    role: ["structureColumn", "metaColumn"].includes(columnRole) ? (columnRole === "structureColumn" ? "structure" : "meta") : columnRole === "dateColumn" ? "date" : "content",
    columnRole,
    order,
    capabilities: ["resizeWidth"],
    baseline: box(currentX, 56, width, 120),
    layoutBounds: bounds(0, 297, 50, 198, minWidth, maxWidth, 1, 148),
    refKey: `restarbeiten.table.column.${key}`,
    rendererKey: `.restarbeitenTable [data-restarbeiten-column="${rendererColumnKeys[key]}"]`,
  });
});

const ELEMENTS = Object.freeze([
  element({ id: SCOPE_ID, name: DISPLAY_NAME, kind: "document", role: "layout", pageArea: "document", order: 0, baseline: box(0, 0, 297, 210), layoutBounds: PAGE_BOUNDS, refKey: "restarbeiten.document", rendererKey: ".printRoot" }),
  element({ id: `${SCOPE_ID}.page-template`, name: "A4-Seite quer", parentId: SCOPE_ID, kind: "page", role: "layout", pageArea: "document", order: 10, baseline: box(0, 0, 297, 210, { marginTop: 5, marginRight: 12, marginBottom: 0, marginLeft: 12 }), layoutBounds: PAGE_BOUNDS, refKey: "restarbeiten.page", rendererKey: ".page" }),
  element({ id: `${SCOPE_ID}.header`, name: "Dokumentkopf", parentId: `${SCOPE_ID}.page-template`, kind: "header", role: "layout", pageArea: "header", order: 20, baseline: box(12, 5, 273, 51), layoutBounds: HEADER_BOUNDS, refKey: "restarbeiten.header", rendererKey: ".v2GlobalHeaderBlock,.v2HeaderFull,.v2HeaderMini" }),
  element({ id: `${SCOPE_ID}.header.project`, name: "Projekt-/Titelgruppe", parentId: `${SCOPE_ID}.header`, kind: "group", role: "layout", pageArea: "header", order: 21, baseline: box(12, 14, 190, 22), layoutBounds: HEADER_BOUNDS, refKey: "restarbeiten.header.project", rendererKey: ".v2FullLeftWrap" }),
  element({ id: `${SCOPE_ID}.header.project.label`, name: "Projektbezeichnung", parentId: `${SCOPE_ID}.header.project`, kind: "label", role: "fieldLabel", pageArea: "header", order: 22, baseline: box(16, 14, 38, 6), layoutBounds: HEADER_BOUNDS, refKey: "restarbeiten.header.project.label", rendererKey: ".v2Project" }),
  element({ id: `${SCOPE_ID}.header.project.value`, name: "Projekt-/Dokumentwert", parentId: `${SCOPE_ID}.header.project`, kind: "value", role: "content", pageArea: "header", order: 23, baseline: box(16, 20, 186, 8), layoutBounds: HEADER_BOUNDS, refKey: "restarbeiten.header.project.value", rendererKey: ".v2ProjectName,.v2ProtocolTitle,.v2MiniProtocolTitle" }),
  element({ id: `${SCOPE_ID}.body`, name: "Seiteninhalt", parentId: `${SCOPE_ID}.page-template`, kind: "area", role: "layout", pageArea: "body", order: 30, baseline: box(12, 56, 273, 130), layoutBounds: BODY_BOUNDS, refKey: "restarbeiten.body", rendererKey: ".v2PageBody" }),
  element({ id: `${SCOPE_ID}.table`, name: "Restarbeiten-Tabelle", parentId: `${SCOPE_ID}.body`, kind: "table", role: "content", pageArea: "body", order: 40, capabilities: ["resizeWidth"], allowedOps: ["resizeWidth", "resizeColumnBoundary"], boundaryResizePolicy: "adjacentPreserveTotal", baseline: box(12, 56, 273, 120), layoutBounds: bounds(0, 297, 50, 198, 268, 273, 1, 148), refKey: "restarbeiten.table", rendererKey: ".restarbeitenTable" }),
  element({ id: `${SCOPE_ID}.table.vertical-column-separators`, name: "Senkrechte Spaltentrennlinien", parentId: `${SCOPE_ID}.table`, kind: "group", role: "structure", pageArea: "body", order: 41, capabilities: ["setVisibility"], baseline: box(12, 56, 273, 120), layoutBounds: BODY_BOUNDS,
    layoutBinding: { type: "visibilityClass", className: "restarbeitenTable--vertical-column-separators" },
    refKey: "restarbeiten.table.vertical-column-separators", rendererKey: ".restarbeitenTable" }),
  element({ id: `${SCOPE_ID}.table.rows`, name: "Tabellenzeilen", parentId: `${SCOPE_ID}.table`, kind: "repeatingArea", role: "content", pageArea: "body", order: 50, baseline: box(12, 64, 273, 112), layoutBounds: BODY_BOUNDS, refKey: "restarbeiten.table.rows", rendererKey: ".restarbeitenTable tbody" }),
  ...columnElements,
  element({ id: `${SCOPE_ID}.footer`, name: "Seitenfuss-/Reservebereich", parentId: `${SCOPE_ID}.page-template`, kind: "footer", role: "layout", pageArea: "footer", order: 200, baseline: box(12, 198, 273, 12), layoutBounds: FOOTER_BOUNDS, refKey: "restarbeiten.footer", rendererKey: ".v2FooterReserveSpacer" }),
]);

const REGISTRY_BASE = Object.freeze({
  applicationId: APPLICATION_ID,
  documentTypeId: DOCUMENT_TYPE_ID,
  displayName: DISPLAY_NAME,
  scopeId: SCOPE_ID,
  unit: "mm",
  pageSettings: Object.freeze({ format: "A4", orientation: "landscape", width: 297, height: 210, margins: Object.freeze({ top: 5, right: 12, bottom: 0, left: 12 }) }),
  elements: ELEMENTS,
});
const REGISTRY = Object.freeze({ ...REGISTRY_BASE, registryVersion: DESCRIPTOR_VERSION, registryFingerprint: createPdfRegistryFingerprint(REGISTRY_BASE) });
const registryValidation = validatePdfRegistry(REGISTRY);
if (!registryValidation.ok) throw Object.assign(new TypeError("Restarbeiten-PDF-Descriptor ist ungueltig."), { validationErrors: registryValidation.errors });

const DESCRIPTOR = Object.freeze({
  applicationId: APPLICATION_ID,
  documentTypeId: DOCUMENT_TYPE_ID,
  moduleId: MODULE_ID,
  scopeId: SCOPE_ID,
  profileStorageKey: PROFILE_STORAGE_KEY,
  contractVersion: PDF_TARGET_CONTRACT_VERSION,
  descriptorVersion: DESCRIPTOR_VERSION,
  displayName: DISPLAY_NAME,
  regenerationRoute: "print:toPdf/restarbeiten",
  registry: REGISTRY,
});

registerPdfEditorAdapter({
  ...DESCRIPTOR,
  candidateRegistry: REGISTRY,
  createAdapter: ({ registry }) => createDeclarativePdfAdapter({ applicationId: APPLICATION_ID, documentTypeId: DOCUMENT_TYPE_ID, displayName: DISPLAY_NAME, registry, documentIdentityFields: ["projectId"] }),
  printModes: ["restarbeiten"],
  buildRegenerationRequest: (context) => ({
    mode: "restarbeiten",
    documentTypeId: DOCUMENT_TYPE_ID,
    orientation: "landscape",
    projectId: context.projectId,
    restarbeitenRows: cloneRows(context.restarbeitenRows),
    restarbeitenLocationLabels: { ...(context.restarbeitenLocationLabels || {}) },
    showAmpelInList: context.showAmpelInList === true,
    targetDir: "temp",
    fileName: `BBM-UI-Editor-${context.activeDocumentId}.pdf`,
    overwrite: true,
  }),
});

function cloneRows(rows) { return Array.isArray(rows) ? rows.map((row) => ({ ...row })) : []; }

module.exports = Object.freeze({ APPLICATION_ID, DESCRIPTOR, DISPLAY_NAME, DOCUMENT_TYPE_ID, MODULE_ID, PROFILE_STORAGE_KEY, REGISTRY, SCOPE_ID });
