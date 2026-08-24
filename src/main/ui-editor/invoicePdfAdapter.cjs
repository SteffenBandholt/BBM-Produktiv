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
const DOCUMENT_TYPE_ID = "invoice";
const MODULE_ID = "rechnungen";
const DISPLAY_NAME = "Rechnung";
const SCOPE_ID = "pdf.bbm.invoice";
const PROFILE_STORAGE_KEY = "module-rechnungen";
const DESCRIPTOR_VERSION = 2;
const PDF_V2_INVOICE_CONTRACT_IDS = Object.freeze({
  immutableSnapshot: "PDF-V2-INVOICE-001",
  firstPageBlocks: "PDF-V2-INVOICE-002",
  repeatedTableHead: "PDF-V2-INVOICE-003",
  positionKinds: "PDF-V2-INVOICE-004",
  nepPresentation: "PDF-V2-INVOICE-005",
  vatBreakdown: "PDF-V2-INVOICE-006",
  tailReservation: "PDF-V2-INVOICE-007",
  fixedStorage: "PDF-V2-INVOICE-008",
  oneRenderer: "PDF-V2-INVOICE-009",
});
const DOMAIN_LOCKS = Object.freeze([
  "changeText",
  "changeValue",
  "modifyDomainData",
  "createRecord",
  "deleteRecord",
  "saveDomainData",
  "upload",
  "import",
  "export",
  "autosave",
  "sortRecords",
  "filterRecords",
  "changeStatus",
  "changeDueDate",
  "changeResponsible",
  "executeTargetAction",
  "setPageBreakRule",
]);

function box(x, y, width, height, extra = {}) {
  return Object.freeze({ x, y, width, height, visible: true, ...extra });
}

function bounds(minX, maxX, minY, maxY, minWidth, maxWidth, minHeight, maxHeight) {
  return Object.freeze({ minX, maxX, minY, maxY, minWidth, maxWidth, minHeight, maxHeight });
}

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
    editable: allowedOps.length > 0,
    capabilities,
    allowedOps,
    lockedOps: Object.freeze([
      ...new Set([
        ...PDF_TARGET_OPERATIONS.filter((operation) => !allowedOps.includes(operation)),
        ...DOMAIN_LOCKS,
      ]),
    ]),
    baseline: values.baseline,
    layoutBounds: values.layoutBounds,
    refKey: values.refKey,
    rendererKey: values.rendererKey,
    ...(values.columnRole ? { columnRole: values.columnRole } : {}),
    ...(values.boundaryResizePolicy
      ? { boundaryResizePolicy: values.boundaryResizePolicy }
      : {}),
  });
}

const PAGE_BOUNDS = bounds(0, 210, 0, 297, 1, 210, 1, 297);
const HEADER_BOUNDS = bounds(0, 210, 0, 75, 5, 210, 2, 75);
const BODY_BOUNDS = bounds(0, 210, 50, 285, 5, 210, 2, 235);

const COLUMN_DEFINITIONS = Object.freeze([
  ["number", "Pos.", "structureColumn", 18, 12, 28],
  ["description", "Leistung", "contentColumn", 86, 50, 120],
  ["quantity", "Menge", "contentColumn", 18, 12, 28],
  ["unit", "Einheit", "metaColumn", 16, 10, 24],
  ["unit-price", "EP", "contentColumn", 24, 18, 34],
  ["total-price", "GP / NEP", "contentColumn", 24, 18, 34],
]);

let columnX = 12;
const columnElements = COLUMN_DEFINITIONS.map(
  ([key, name, columnRole, width, minWidth, maxWidth], index) => {
    const x = columnX;
    columnX += width;
    return element({
      id: `${SCOPE_ID}.positions.column.${key}`,
      name,
      parentId: `${SCOPE_ID}.positions`,
      kind: "tableColumn",
      role: columnRole === "structureColumn"
        ? "structure"
        : columnRole === "metaColumn"
          ? "meta"
          : "content",
      columnRole,
      order: 110 + index,
      capabilities: ["resizeWidth"],
      baseline: box(x, 95, width, 135),
      layoutBounds: bounds(0, 210, 50, 285, minWidth, maxWidth, 1, 235),
      refKey: `invoice.positions.column.${key}`,
      rendererKey: `.invoicePdfTable [data-invoice-column="${key}"]`,
    });
  }
);

const ELEMENTS = Object.freeze([
  element({ id: SCOPE_ID, name: DISPLAY_NAME, kind: "document", role: "layout", pageArea: "document", order: 0, baseline: box(0, 0, 210, 297), layoutBounds: PAGE_BOUNDS, refKey: "invoice.document", rendererKey: ".printRoot" }),
  element({ id: `${SCOPE_ID}.page-template`, name: "A4-Seite", parentId: SCOPE_ID, kind: "page", role: "layout", pageArea: "document", order: 10, baseline: box(0, 0, 210, 297, { marginTop: 5, marginRight: 12, marginBottom: 0, marginLeft: 12 }), layoutBounds: PAGE_BOUNDS, refKey: "invoice.page", rendererKey: ".page" }),
  element({ id: `${SCOPE_ID}.header`, name: "Rechnungs-FullHeader", parentId: `${SCOPE_ID}.page-template`, kind: "header", role: "layout", pageArea: "header", order: 20, capabilities: ["setVisibility"], baseline: box(12, 13, 186, 51), layoutBounds: HEADER_BOUNDS, refKey: "invoice.header", rendererKey: ".invoicePdfFullHeaderContent" }),
  element({ id: `${SCOPE_ID}.recipient`, name: "Rechnungsempfänger", parentId: `${SCOPE_ID}.header`, kind: "group", role: "content", pageArea: "header", order: 30, capabilities: ["setVisibility"], baseline: box(12, 13, 92, 31), layoutBounds: HEADER_BOUNDS, refKey: "invoice.recipient", rendererKey: ".invoicePdfRecipient" }),
  element({ id: `${SCOPE_ID}.meta`, name: "Rechnungsdaten", parentId: `${SCOPE_ID}.header`, kind: "group", role: "meta", pageArea: "header", order: 40, capabilities: ["setVisibility"], baseline: box(108, 13, 90, 31), layoutBounds: HEADER_BOUNDS, refKey: "invoice.meta", rendererKey: ".invoicePdfMeta" }),
  element({ id: `${SCOPE_ID}.meta.label`, name: "Rechnungsdaten-Bezeichnung", parentId: `${SCOPE_ID}.meta`, kind: "label", role: "fieldLabel", pageArea: "header", order: 41, baseline: box(108, 13, 32, 31), layoutBounds: HEADER_BOUNDS, refKey: "invoice.meta.label", rendererKey: ".invoicePdfMetaLabel" }),
  element({ id: `${SCOPE_ID}.meta.value`, name: "Rechnungsdaten-Wert", parentId: `${SCOPE_ID}.meta`, kind: "value", role: "content", pageArea: "header", order: 42, baseline: box(140, 13, 58, 31), layoutBounds: HEADER_BOUNDS, refKey: "invoice.meta.value", rendererKey: ".invoicePdfMetaValue" }),
  element({ id: `${SCOPE_ID}.context`, name: "Bauvorhaben / Leistungsbezug", parentId: `${SCOPE_ID}.header`, kind: "group", role: "content", pageArea: "header", order: 45, capabilities: ["setVisibility"], baseline: box(12, 45, 150, 11), layoutBounds: HEADER_BOUNDS, refKey: "invoice.context", rendererKey: ".invoicePdfContext" }),
  element({ id: `${SCOPE_ID}.body`, name: "Rechnungsinhalt", parentId: `${SCOPE_ID}.page-template`, kind: "area", role: "layout", order: 50, baseline: box(12, 68, 186, 203), layoutBounds: BODY_BOUNDS, refKey: "invoice.body", rendererKey: ".v2PageBody" }),
  element({ id: `${SCOPE_ID}.intro`, name: "Einleitung", parentId: `${SCOPE_ID}.body`, kind: "text", role: "content", order: 60, capabilities: ["setVisibility"], baseline: box(12, 68, 186, 7), layoutBounds: BODY_BOUNDS, refKey: "invoice.intro", rendererKey: ".invoicePdfIntro" }),
  element({ id: `${SCOPE_ID}.positions`, name: "Bau-LV", parentId: `${SCOPE_ID}.body`, kind: "table", role: "content", order: 100, capabilities: ["resizeWidth"], allowedOps: ["resizeWidth", "resizeColumnBoundary"], boundaryResizePolicy: "adjacentPreserveTotal", baseline: box(12, 95, 186, 135), layoutBounds: bounds(0, 210, 50, 285, 180, 186, 1, 235), refKey: "invoice.positions", rendererKey: ".invoicePdfTable" }),
  element({ id: `${SCOPE_ID}.positions.rows`, name: "Bau-LV-Zeilen", parentId: `${SCOPE_ID}.positions`, kind: "repeatingArea", role: "content", order: 101, baseline: box(12, 103, 186, 127), layoutBounds: BODY_BOUNDS, refKey: "invoice.positions.rows", rendererKey: ".invoicePdfTable tbody" }),
  ...columnElements,
  element({ id: `${SCOPE_ID}.totals`, name: "Rechnungssummen", parentId: `${SCOPE_ID}.body`, kind: "group", role: "content", order: 200, capabilities: ["setVisibility"], baseline: box(108, 232, 90, 28), layoutBounds: BODY_BOUNDS, refKey: "invoice.totals", rendererKey: ".invoicePdfTotals" }),
  element({ id: `${SCOPE_ID}.payment`, name: "Zahlungstext", parentId: `${SCOPE_ID}.body`, kind: "text", role: "content", order: 210, capabilities: ["setVisibility"], baseline: box(12, 262, 186, 9), layoutBounds: BODY_BOUNDS, refKey: "invoice.payment", rendererKey: ".invoicePdfPayment" }),
  element({ id: `${SCOPE_ID}.footer`, name: "Aussteller-Fuß", parentId: `${SCOPE_ID}.body`, kind: "footer", role: "content", pageArea: "body", order: 220, capabilities: ["setVisibility"], baseline: box(12, 272, 186, 13), layoutBounds: BODY_BOUNDS, refKey: "invoice.footer", rendererKey: ".invoicePdfFooter" }),
  element({ id: `${SCOPE_ID}.mini-header`, name: "Rechnungs-MiniHeader", parentId: `${SCOPE_ID}.page-template`, kind: "header", role: "layout", pageArea: "header", order: 230, capabilities: ["setVisibility"], baseline: box(12, 5, 186, 14), layoutBounds: HEADER_BOUNDS, refKey: "invoice.miniHeader", rendererKey: ".v2HeaderMini[data-ui-inspector-id='pdf.bbm.invoice.mini-header']" }),
]);

const REGISTRY_BASE = Object.freeze({
  applicationId: APPLICATION_ID,
  documentTypeId: DOCUMENT_TYPE_ID,
  displayName: DISPLAY_NAME,
  scopeId: SCOPE_ID,
  unit: "mm",
  pageSettings: Object.freeze({
    format: "A4",
    orientation: "portrait",
    width: 210,
    height: 297,
    margins: Object.freeze({ top: 5, right: 12, bottom: 0, left: 12 }),
  }),
  elements: ELEMENTS,
});
const REGISTRY = Object.freeze({
  ...REGISTRY_BASE,
  registryVersion: DESCRIPTOR_VERSION,
  registryFingerprint: createPdfRegistryFingerprint(REGISTRY_BASE),
});
const validation = validatePdfRegistry(REGISTRY);
if (!validation.ok) {
  throw Object.assign(new TypeError("Rechnung-PDF-Descriptor ist ungültig."), {
    validationErrors: validation.errors,
  });
}

const adapter = createDeclarativePdfAdapter({
  applicationId: APPLICATION_ID,
  documentTypeId: DOCUMENT_TYPE_ID,
  displayName: DISPLAY_NAME,
  registry: REGISTRY,
  documentIdentityFields: ["invoiceId"],
});

registerPdfEditorAdapter({
  documentTypeId: DOCUMENT_TYPE_ID,
  moduleId: MODULE_ID,
  scopeId: SCOPE_ID,
  displayName: DISPLAY_NAME,
  profileStorageKey: PROFILE_STORAGE_KEY,
  contractVersion: PDF_TARGET_CONTRACT_VERSION,
  descriptorVersion: DESCRIPTOR_VERSION,
  printModes: ["invoice"],
  adapter,
  builtIn: true,
  buildRegenerationRequest: ({ invoiceId, activeDocumentId }) => ({
    mode: "invoice",
    documentTypeId: DOCUMENT_TYPE_ID,
    invoiceId,
    orientation: "portrait",
    targetDir: "temp",
    fileName: `BBM-UI-Editor-${activeDocumentId}.pdf`,
    overwrite: true,
  }),
});

module.exports = Object.freeze({
  APPLICATION_ID,
  DESCRIPTOR_VERSION,
  DISPLAY_NAME,
  DOCUMENT_TYPE_ID,
  MODULE_ID,
  PDF_V2_INVOICE_CONTRACT_IDS,
  PROFILE_STORAGE_KEY,
  REGISTRY,
  SCOPE_ID,
  getInvoicePdfAdapter: () => adapter,
});
