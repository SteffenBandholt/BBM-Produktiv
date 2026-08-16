"use strict";

const crypto = require("node:crypto");
const {
  PDF_TARGET_CONTRACT_VERSION,
  PDF_TARGET_OPERATIONS,
  createPdfRegistryFingerprint,
  validatePdfRegistry,
  validatePdfTargetContract,
} = require("ui-editor-kit");

const APPLICATION_ID = "bbm-produktiv";
const DOCUMENT_TYPE_ID = "protocol";
const DISPLAY_NAME = "BBM-Protokoll";
const SCOPE_ID = "pdf.bbm.protocol";
const PDF_REGISTRY_VERSION = 1;
const DOMAIN_LOCKS = Object.freeze([
  "changeText", "changeValue", "modifyDomainData", "createRecord", "deleteRecord", "saveDomainData",
  "upload", "import", "export", "autosave", "sortRecords", "filterRecords", "changeStatus",
  "changeDueDate", "changeResponsible", "deleteImage", "executeTargetAction", "setPageBreakRule",
]);

const ALL_LAYOUT_OPERATIONS = Object.freeze([...PDF_TARGET_OPERATIONS]);

function box(x, y, width, height, extra = {}) {
  return Object.freeze({ x, y, width, height, ...extra });
}

function bounds(minX, maxX, minY, maxY, minWidth, maxWidth, minHeight, maxHeight) {
  return Object.freeze({ minX, maxX, minY, maxY, minWidth, maxWidth, minHeight, maxHeight });
}

function element(values) {
  const capabilities = Object.freeze([...(values.capabilities || [])]);
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
    allowedOps: capabilities,
    lockedOps: Object.freeze([...new Set([
      ...ALL_LAYOUT_OPERATIONS.filter((operation) => !capabilities.includes(operation)),
      ...DOMAIN_LOCKS,
      ...(values.lockedOps || []),
    ])]),
    baseline: Object.freeze({ ...values.baseline }),
    layoutBounds: Object.freeze({ ...values.layoutBounds }),
    refKey: values.refKey,
    rendererKey: values.rendererKey,
    ...(values.columnRole ? { columnRole: values.columnRole } : {}),
  });
}

const PAGE_BOUNDS = bounds(0, 210, 0, 297, 1, 210, 1, 297);
const HEADER_BOUNDS = bounds(0, 210, 0, 120, 5, 210, 2, 120);
const BODY_BOUNDS = bounds(0, 210, 50, 297, 5, 210, 2, 247);
const FOOTER_BOUNDS = bounds(0, 210, 180, 297, 5, 210, 2, 100);
const TEXT = Object.freeze(["move", "resizeWidth", "textResize", "setTextAlignment", "setVisibility"]);

const ELEMENTS = Object.freeze([
  element({ id: SCOPE_ID, name: "BBM-Protokoll", kind: "document", role: "layout", pageArea: "document", order: 0,
    baseline: box(0, 0, 210, 297, { visible: true }), layoutBounds: PAGE_BOUNDS, refKey: "protocol.document", rendererKey: "printRoot" }),
  element({ id: `${SCOPE_ID}.page-template`, name: "A4-Seite", parentId: SCOPE_ID, kind: "page", role: "layout", pageArea: "document", order: 10,
    capabilities: ["setPageMargins"], baseline: box(0, 0, 210, 297, { marginTop: 5, marginRight: 12, marginBottom: 0, marginLeft: 12, visible: true }),
    layoutBounds: PAGE_BOUNDS, refKey: "protocol.page", rendererKey: ".page" }),
  element({ id: `${SCOPE_ID}.header`, name: "Seitenkopf", parentId: `${SCOPE_ID}.page-template`, kind: "header", role: "layout", pageArea: "header", order: 20,
    capabilities: ["resizeHeight", "setVisibility"], baseline: box(12, 5, 186, 51, { visible: true }), layoutBounds: HEADER_BOUNDS,
    refKey: "protocol.header", rendererKey: ".v2HeaderFull,.v2HeaderMini" }),
  element({ id: `${SCOPE_ID}.header.logos`, name: "Logobereich", parentId: `${SCOPE_ID}.header`, kind: "group", role: "content", pageArea: "header", order: 30,
    capabilities: ["move", "resizeWidth", "resizeHeight", "setVisibility"], baseline: box(12, 5, 186, 8, { visible: true }), layoutBounds: HEADER_BOUNDS,
    refKey: "protocol.header.logos", rendererKey: ".v2GlobalHeaderBlock" }),
  element({ id: `${SCOPE_ID}.header.project`, name: "Projektzeile", parentId: `${SCOPE_ID}.header`, kind: "group", role: "layout", pageArea: "header", order: 40,
    capabilities: ["move", "resizeWidth"], baseline: box(12, 14, 120, 16, { visible: true }), layoutBounds: HEADER_BOUNDS,
    refKey: "protocol.header.project", rendererKey: ".v2FullLeftWrap" }),
  element({ id: `${SCOPE_ID}.header.project.label`, name: "Projekt · Bezeichnung", parentId: `${SCOPE_ID}.header.project`, kind: "label", role: "fieldLabel", pageArea: "header", order: 41,
    capabilities: TEXT, baseline: box(16, 14, 28, 6, { fontSize: 9, textAlignment: "left", visible: true }), layoutBounds: HEADER_BOUNDS,
    refKey: "protocol.header.project.label", rendererKey: ".v2Project" }),
  element({ id: `${SCOPE_ID}.header.project.value`, name: "Projekt · Wert", parentId: `${SCOPE_ID}.header.project`, kind: "value", role: "content", pageArea: "header", order: 42,
    capabilities: TEXT, baseline: box(16, 20, 116, 7, { fontSize: 16, textAlignment: "left", visible: true }), layoutBounds: HEADER_BOUNDS,
    refKey: "protocol.header.project.value", rendererKey: ".v2ProjectName" }),
  element({ id: `${SCOPE_ID}.header.title`, name: "Dokumenttitel", parentId: `${SCOPE_ID}.header`, kind: "value", role: "content", pageArea: "header", order: 50,
    capabilities: [...TEXT, "setLineSpacing"], baseline: box(16, 28, 116, 8, { fontSize: 12.5, textAlignment: "left", lineSpacing: 1.1, visible: true }), layoutBounds: HEADER_BOUNDS,
    refKey: "protocol.header.title", rendererKey: ".v2ProtocolTitle,.v2MiniProtocolTitle" }),
  element({ id: `${SCOPE_ID}.header.meta`, name: "Kopfmetadaten", parentId: `${SCOPE_ID}.header`, kind: "group", role: "meta", pageArea: "header", order: 60,
    capabilities: ["move", "resizeWidth", "resizeHeight"], baseline: box(143, 14, 55, 22, { visible: true }), layoutBounds: HEADER_BOUNDS,
    refKey: "protocol.header.meta", rendererKey: ".v2HeaderRight,.v2MiniRight" }),
  element({ id: `${SCOPE_ID}.header.meta.page-label`, name: "Seite · Bezeichnung", parentId: `${SCOPE_ID}.header.meta`, kind: "label", role: "fieldLabel", pageArea: "header", order: 61,
    capabilities: TEXT, baseline: box(143, 14, 16, 6, { fontSize: 9, textAlignment: "right", visible: true }), layoutBounds: HEADER_BOUNDS,
    refKey: "protocol.header.meta.page-label", rendererKey: ".v2MiniPageLabel" }),
  element({ id: `${SCOPE_ID}.header.meta.page-value`, name: "Seite · Wert", parentId: `${SCOPE_ID}.header.meta`, kind: "value", role: "meta", pageArea: "header", order: 62,
    capabilities: TEXT, baseline: box(159, 14, 39, 6, { fontSize: 9, textAlignment: "right", visible: true }), layoutBounds: HEADER_BOUNDS,
    refKey: "protocol.header.meta.page-value", rendererKey: ".v2MiniPageValue" }),
  element({ id: `${SCOPE_ID}.body`, name: "Dokumentinhalt", parentId: `${SCOPE_ID}.page-template`, kind: "area", role: "layout", pageArea: "body", order: 100,
    baseline: box(12, 56, 186, 204, { visible: true }), layoutBounds: BODY_BOUNDS, refKey: "protocol.body", rendererKey: ".v2PageBody" }),
  element({ id: `${SCOPE_ID}.participants`, name: "Teilnehmerbereich", parentId: `${SCOPE_ID}.body`, kind: "group", role: "content", pageArea: "body", order: 110,
    capabilities: ["move", "resizeWidth", "setVisibility"], baseline: box(12, 56, 186, 32, { visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.participants", rendererKey: ".v2ParticipantsBlock" }),
  element({ id: `${SCOPE_ID}.participants.title`, name: "Teilnehmer · Überschrift", parentId: `${SCOPE_ID}.participants`, kind: "label", role: "heading", pageArea: "body", order: 111,
    capabilities: TEXT, baseline: box(12, 56, 186, 6, { fontSize: 10, textAlignment: "left", visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.participants.title", rendererKey: ".v2ParticipantsTitle" }),
  element({ id: `${SCOPE_ID}.participants.rows`, name: "Teilnehmer · Wiederholung", parentId: `${SCOPE_ID}.participants`, kind: "repeatingArea", role: "content", pageArea: "body", order: 112,
    capabilities: ["resizeWidth", "setLineSpacing"], baseline: box(12, 62, 186, 26, { lineSpacing: 1.1, visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.participants.rows", rendererKey: ".v2ParticipantsTable tbody" }),
  element({ id: `${SCOPE_ID}.tops`, name: "TOP-Tabelle", parentId: `${SCOPE_ID}.body`, kind: "table", role: "content", pageArea: "body", order: 200,
    capabilities: ["move", "resizeWidth", "setVisibility"], baseline: box(12, 91, 186, 120, { visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.tops", rendererKey: ".topsTable" }),
  element({ id: `${SCOPE_ID}.tops.header`, name: "TOP-Tabelle · Kopf", parentId: `${SCOPE_ID}.tops`, kind: "group", role: "structure", pageArea: "body", order: 210,
    capabilities: ["resizeHeight", "textResize", "setTextAlignment", "setVisibility"], baseline: box(12, 91, 186, 8, { fontSize: 8, textAlignment: "left", visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.tops.header", rendererKey: ".topsTable thead" }),
  element({ id: `${SCOPE_ID}.tops.rows`, name: "TOP-Tabelle · Wiederholung", parentId: `${SCOPE_ID}.tops`, kind: "repeatingArea", role: "content", pageArea: "body", order: 220,
    capabilities: ["setLineSpacing"], baseline: box(12, 99, 186, 112, { lineSpacing: 1.35, visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.tops.rows", rendererKey: ".topsTable tbody" }),
  element({ id: `${SCOPE_ID}.tops.column.number`, name: "Spalte TOP", parentId: `${SCOPE_ID}.tops`, kind: "tableColumn", role: "structure", columnRole: "structureColumn", pageArea: "body", order: 230,
    capabilities: ["resizeWidth"], baseline: box(12, 91, 24.18, 120, { visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.tops.column.number", rendererKey: ".topsTable .colNr" }),
  element({ id: `${SCOPE_ID}.tops.column.text`, name: "Spalte Gegenstand", parentId: `${SCOPE_ID}.tops`, kind: "tableColumn", role: "content", columnRole: "contentColumn", pageArea: "body", order: 231,
    capabilities: ["resizeWidth"], baseline: box(36.18, 91, 120.9, 120, { visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.tops.column.text", rendererKey: ".topsTable .colText" }),
  element({ id: `${SCOPE_ID}.tops.column.meta`, name: "Spalte Status / Fertig bis / verantw", parentId: `${SCOPE_ID}.tops`, kind: "tableColumn", role: "meta", columnRole: "metaColumn", pageArea: "body", order: 232,
    capabilities: ["resizeWidth"], baseline: box(157.08, 91, 40.92, 120, { visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.tops.column.meta", rendererKey: ".topsTable .colMeta" }),
  element({ id: `${SCOPE_ID}.tops.heading.number`, name: "Tabellenkopf TOP", parentId: `${SCOPE_ID}.tops.header`, kind: "label", role: "columnHeader", pageArea: "body", order: 240,
    capabilities: ["textResize", "setTextAlignment", "setVisibility"], baseline: box(12, 91, 24.18, 8, { fontSize: 8, textAlignment: "left", visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.tops.heading.number", rendererKey: ".topsTable thead .colNr" }),
  element({ id: `${SCOPE_ID}.tops.heading.text`, name: "Tabellenkopf Gegenstand", parentId: `${SCOPE_ID}.tops.header`, kind: "label", role: "columnHeader", pageArea: "body", order: 241,
    capabilities: ["textResize", "setTextAlignment", "setVisibility"], baseline: box(36.18, 91, 120.9, 8, { fontSize: 8, textAlignment: "left", visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.tops.heading.text", rendererKey: ".topsTable thead .colText" }),
  element({ id: `${SCOPE_ID}.tops.heading.meta`, name: "Tabellenkopf Status / Fertig bis / verantw", parentId: `${SCOPE_ID}.tops.header`, kind: "label", role: "columnHeader", pageArea: "body", order: 242,
    capabilities: ["textResize", "setTextAlignment", "setVisibility"], baseline: box(157.08, 91, 40.92, 8, { fontSize: 8, textAlignment: "left", visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.tops.heading.meta", rendererKey: ".topsTable thead .colMeta" }),
  element({ id: `${SCOPE_ID}.closing`, name: "Abschlussbereich", parentId: `${SCOPE_ID}.body`, kind: "group", role: "content", pageArea: "body", order: 300,
    capabilities: ["move", "resizeWidth", "setVisibility"], baseline: box(12, 225, 186, 35, { visible: true }), layoutBounds: BODY_BOUNDS,
    refKey: "protocol.closing", rendererKey: ".v2TopsTail" }),
  element({ id: `${SCOPE_ID}.footer`, name: "Aufgestellt-Bereich", parentId: `${SCOPE_ID}.page-template`, kind: "footer", role: "content", pageArea: "footer", order: 400,
    capabilities: ["move", "resizeWidth", "resizeHeight", "setVisibility"], baseline: box(12, 260, 186, 30, { visible: true }), layoutBounds: FOOTER_BOUNDS,
    refKey: "protocol.footer", rendererKey: ".v2ProtocolFooter" }),
  element({ id: `${SCOPE_ID}.footer.label`, name: "Aufgestellt · Bezeichnung", parentId: `${SCOPE_ID}.footer`, kind: "label", role: "fieldLabel", pageArea: "footer", order: 401,
    capabilities: TEXT, baseline: box(12, 260, 40, 6, { fontSize: 9, textAlignment: "left", visible: true }), layoutBounds: FOOTER_BOUNDS,
    refKey: "protocol.footer.label", rendererKey: ".v2ProtocolFooterTitle" }),
  element({ id: `${SCOPE_ID}.footer.value`, name: "Aufgestellt · Wert", parentId: `${SCOPE_ID}.footer`, kind: "value", role: "content", pageArea: "footer", order: 402,
    capabilities: [...TEXT, "setLineSpacing"], baseline: box(12, 266, 186, 24, { fontSize: 8, textAlignment: "left", lineSpacing: 1.35, visible: true }), layoutBounds: FOOTER_BOUNDS,
    refKey: "protocol.footer.value", rendererKey: ".v2ProtocolFooterLine" }),
]);

const REGISTRY_BASE = Object.freeze({
  applicationId: APPLICATION_ID,
  documentTypeId: DOCUMENT_TYPE_ID,
  displayName: DISPLAY_NAME,
  scopeId: SCOPE_ID,
  unit: "mm",
  pageSettings: Object.freeze({ format: "A4", orientation: "portrait", width: 210, height: 297,
    margins: Object.freeze({ top: 2, right: 12, bottom: 0, left: 12 }) }),
  elements: ELEMENTS,
});

const REGISTRY_FINGERPRINT = createPdfRegistryFingerprint(REGISTRY_BASE);
const REGISTRY = Object.freeze({ ...REGISTRY_BASE, registryVersion: PDF_REGISTRY_VERSION, registryFingerprint: REGISTRY_FINGERPRINT });
const REGISTRY_VALIDATION = validatePdfRegistry(REGISTRY);
if (!REGISTRY_VALIDATION.ok) {
  const error = new TypeError("BBM-PDF-Registry ist ungültig.");
  error.validationErrors = REGISTRY_VALIDATION.errors;
  throw error;
}

function clone(value) {
  return structuredClone(value);
}

function stateFromRegistry() {
  return {
    scopeId: SCOPE_ID,
    capturedAt: new Date().toISOString(),
    elements: ELEMENTS.map((entry) => ({ elementId: entry.id, scopeId: SCOPE_ID, ...clone(entry.baseline) })),
  };
}

function finite(value, field, { positive = false, nonNegative = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || (positive && number <= 0) || (nonNegative && number < 0)) {
    throw Object.assign(new Error(`Ungültiger PDF-Layoutwert: ${field}`), { code: "pdf_invalid_number" });
  }
  return number;
}

function desiredState(previous, operation, payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw Object.assign(new Error("PDF-Payload fehlt."), { code: "pdf_invalid_payload" });
  const next = { ...previous };
  if (operation === "move") {
    if (Object.hasOwn(payload, "x")) next.x = finite(payload.x, "x");
    if (Object.hasOwn(payload, "y")) next.y = finite(payload.y, "y");
  } else if (operation === "resize" || operation === "resizeWidth" || operation === "resizeHeight") {
    if (Object.hasOwn(payload, "width")) next.width = finite(payload.width, "width", { positive: true });
    if (Object.hasOwn(payload, "height")) next.height = finite(payload.height, "height", { positive: true });
  } else if (operation === "textMove") {
    if (!payload.text || typeof payload.text !== "object") throw Object.assign(new Error("Text-Payload fehlt."), { code: "pdf_invalid_payload" });
    if (Object.hasOwn(payload.text, "offsetX")) next.textOffsetX = finite(payload.text.offsetX, "offsetX", { nonNegative: true });
    if (Object.hasOwn(payload.text, "offsetY")) next.textOffsetY = finite(payload.text.offsetY, "offsetY", { nonNegative: true });
  } else if (operation === "textResize") {
    next.fontSize = finite(payload?.text?.fontSize, "fontSize", { positive: true });
  } else if (operation === "setTextAlignment") {
    const alignment = String(payload.textAlignment || "").trim().toLowerCase();
    if (!new Set(["left", "center", "right"]).has(alignment)) throw Object.assign(new Error("Textausrichtung ist ungültig."), { code: "pdf_invalid_payload" });
    next.textAlignment = alignment;
  } else if (operation === "setLineSpacing") {
    next.lineSpacing = finite(payload.lineSpacing, "lineSpacing", { positive: true });
  } else if (operation === "setVisibility") {
    if (typeof payload.visible !== "boolean") throw Object.assign(new Error("Sichtbarkeit ist ungültig."), { code: "pdf_invalid_payload" });
    next.visible = payload.visible;
  } else if (operation === "setPageMargins") {
    for (const field of ["marginTop", "marginRight", "marginBottom", "marginLeft"]) {
      if (Object.hasOwn(payload, field)) next[field] = finite(payload[field], field, { nonNegative: true });
    }
  } else throw Object.assign(new Error("PDF-Operation ist nicht erlaubt."), { code: "pdf_operation_not_allowed" });
  return next;
}

function validateState(entry, state, allStates) {
  const limit = entry.layoutBounds;
  if (state.x < limit.minX || state.x > limit.maxX || state.y < limit.minY || state.y > limit.maxY ||
      state.width < limit.minWidth || state.width > limit.maxWidth || state.height < limit.minHeight || state.height > limit.maxHeight ||
      state.x + state.width > 210.000001 || state.y + state.height > 297.000001) {
    throw Object.assign(new Error("PDF-Layout verlässt die registrierten Grenzen."), { code: "pdf_out_of_page_bounds" });
  }
  const zoneId = entry.pageArea === "header" ? `${SCOPE_ID}.header`
    : entry.pageArea === "body" ? `${SCOPE_ID}.body`
      : entry.pageArea === "footer" ? `${SCOPE_ID}.footer` : null;
  const zone = zoneId ? allStates.get(zoneId) : null;
  if (zone && entry.id !== zoneId &&
      (state.x < zone.x - 0.000001 || state.y < zone.y - 0.000001 ||
       state.x + state.width > zone.x + zone.width + 0.000001 ||
       state.y + state.height > zone.y + zone.height + 0.000001)) {
    throw Object.assign(new Error("PDF-Layout verlässt den registrierten Seitenbereich."), { code: "pdf_invalid_page_zone" });
  }
  if (entry.kind === "tableColumn" && state.width < 5) throw Object.assign(new Error("PDF-Spalte ist kleiner als 5 mm."), { code: "pdf_invalid_column_width" });
  if (entry.kind === "tableColumn") {
    const widths = ["number", "text", "meta"].map((name) => allStates.get(`${SCOPE_ID}.tops.column.${name}`).width);
    if (widths.reduce((sum, value) => sum + value, 0) > allStates.get(`${SCOPE_ID}.tops`).width + 0.000001) {
      throw Object.assign(new Error("PDF-Spaltensumme überschreitet die Tabellenbreite."), { code: "pdf_invalid_table_width" });
    }
  }
  if (entry.id.endsWith("page-template")) {
    const horizontal = Number(state.marginLeft || 0) + Number(state.marginRight || 0);
    const vertical = Number(state.marginTop || 0) + Number(state.marginBottom || 0);
    if (horizontal >= 210 || vertical >= 297) throw Object.assign(new Error("PDF-Seitenränder sind ungültig."), { code: "pdf_invalid_page_margins" });
  }
}

function safeDocumentId(projectId, meetingId) {
  if (!projectId || !meetingId) return "";
  return `bbm-protocol-${crypto.createHash("sha256").update(`${projectId}\0${meetingId}`, "utf8").digest("hex").slice(0, 24)}`;
}

function createBbmPdfAdapter({ regenerate } = {}) {
  let regenerateHandler = regenerate;
  let working = stateFromRegistry();
  let context = null;
  let preview = { state: "missing", stale: true, generation: 0, pageCount: 0, generatedAt: null, activeDocumentId: "", controlledOutputPath: null, renderBounds: [] };
  let failNextApplyForDiagnostic = false;

  function getPdfRegistry() { return clone(REGISTRY); }
  function getCurrentPdfLayoutState() { return clone({ ...working, capturedAt: new Date().toISOString() }); }
  function activeDocumentId() { return safeDocumentId(context?.projectId, context?.meetingId); }
  function setActiveDocumentContext(value = {}) {
    const projectId = String(value.projectId || "").trim();
    const meetingId = String(value.meetingId || "").trim();
    context = projectId && meetingId ? { projectId, meetingId } : null;
    const id = activeDocumentId();
    if (preview.activeDocumentId !== id) preview = { state: "missing", stale: true, generation: 0, pageCount: 0, generatedAt: null, activeDocumentId: id, controlledOutputPath: null, renderBounds: [] };
    return { ok: Boolean(context), activeDocumentId: id, pdfRegistryStatus: context ? "available" : "incomplete" };
  }
  function getPdfContract() {
    if (!context) return null;
    const contract = {
      applicationId: APPLICATION_ID,
      documentTypeId: DOCUMENT_TYPE_ID,
      displayName: DISPLAY_NAME,
      contractVersion: PDF_TARGET_CONTRACT_VERSION,
      registryVersion: PDF_REGISTRY_VERSION,
      registryFingerprint: REGISTRY_FINGERPRINT,
      profileScope: SCOPE_ID,
      supportedOperations: [...PDF_TARGET_OPERATIONS],
      pageSettingsCapability: "margins",
      previewCapability: "nativePdf",
      regenerateCapability: "explicit",
      activeDocumentId: activeDocumentId(),
      pdfRegistryStatus: "available",
    };
    const result = validatePdfTargetContract(contract);
    if (!result.ok) throw Object.assign(new Error("BBM-PDF-Vertrag ist ungültig."), { code: "pdf_contract_invalid", validationErrors: result.errors });
    return contract;
  }
  function submitPdfChangeRequest(request = {}) {
    const entry = ELEMENTS.find((candidate) => candidate.id === request.elementId);
    const failure = (code, message, previousState = null, rollbackSucceeded = true) => ({ success: false, changeId: String(request.changeId || ""), elementId: String(request.elementId || ""), operation: String(request.operation || ""), errorCode: code, message, previousState, newState: previousState, rollbackSucceeded });
    if (!entry) return failure("pdf_unknown_element", "PDF-Element ist nicht registriert.");
    if (request.scopeId !== SCOPE_ID) return failure("pdf_layout_incompatible", "PDF-Scope passt nicht.");
    if (entry.lockedOps.includes(request.operation)) return failure("pdf_operation_locked", "PDF-Operation ist gesperrt.");
    if (!entry.capabilities.includes(request.operation)) return failure("pdf_operation_not_allowed", "PDF-Operation ist nicht freigegeben.");
    const previous = working.elements.find((state) => state.elementId === entry.id);
    try {
      if (failNextApplyForDiagnostic) {
        failNextApplyForDiagnostic = false;
        throw Object.assign(new Error("Kontrollierter PDF-Diagnosefehler."), { code: "pdf_change_apply_failed" });
      }
      const next = desiredState(previous, request.operation, request.payload);
      const nextStates = new Map(working.elements.map((state) => [state.elementId, state.elementId === entry.id ? next : state]));
      validateState(entry, next, nextStates);
      working = { scopeId: SCOPE_ID, capturedAt: new Date().toISOString(), elements: [...nextStates.values()].map(clone) };
      preview = { ...preview, state: preview.controlledOutputPath ? "stale" : "missing", stale: true };
      return { success: true, changeId: request.changeId, elementId: entry.id, operation: request.operation, errorCode: null,
        message: "PDF-Layoutänderung angewandt und zurückgelesen.", previousState: clone(previous), newState: clone(next), rollbackSucceeded: true };
    } catch (error) {
      const readback = working.elements.find((state) => state.elementId === entry.id);
      return failure(error?.code || "pdf_change_apply_failed", "PDF-Layoutänderung wurde sicher abgewiesen; der vorherige Zustand blieb erhalten.", clone(readback), true);
    }
  }
  async function regeneratePdfPreview() {
    if (!context) throw Object.assign(new Error("Kein aktives BBM-Protokoll für die PDF-Vorschau."), { code: "pdf_document_unavailable" });
    if (typeof regenerateHandler !== "function") throw Object.assign(new Error("PDF-Neuerzeugung ist nicht angebunden."), { code: "pdf_regenerate_unavailable" });
    const result = await regenerateHandler({ ...context, activeDocumentId: activeDocumentId(), layoutState: getCurrentPdfLayoutState() });
    preview = {
      state: "current", stale: false, generation: preview.generation + 1,
      pageCount: Number(result.pageCount || 0), generatedAt: result.generatedAt || new Date().toISOString(),
      activeDocumentId: activeDocumentId(), controlledOutputPath: String(result.controlledOutputPath || ""),
      renderBounds: Array.isArray(result.renderBounds) ? result.renderBounds.map(clone) : [],
    };
    return getPreviewMetadata();
  }
  function getPreviewMetadata() {
    return clone(preview);
  }
  function replaceCurrentPdfLayoutState(state) {
    if (!state || state.scopeId !== SCOPE_ID || !Array.isArray(state.elements)) throw Object.assign(new Error("PDF-LayoutState ist ungültig."), { code: "pdf_layout_incompatible" });
    const requested = new Map(state.elements.map((entry) => [entry.elementId, entry]));
    const original = working;
    try {
      const next = stateFromRegistry();
      next.elements = next.elements.map((baseline) => requested.has(baseline.elementId) ? { ...baseline, ...clone(requested.get(baseline.elementId)), elementId: baseline.elementId, scopeId: SCOPE_ID } : baseline);
      const byId = new Map(next.elements.map((entry) => [entry.elementId, entry]));
      for (const definition of ELEMENTS) validateState(definition, byId.get(definition.id), byId);
      working = { ...next, capturedAt: new Date().toISOString() };
      preview = { ...preview, state: preview.controlledOutputPath ? "stale" : "missing", stale: true };
      return getCurrentPdfLayoutState();
    } catch (error) {
      working = original;
      throw error;
    }
  }
  function resetForDiagnostic() { working = stateFromRegistry(); context = null; preview = { state: "missing", stale: true, generation: 0, pageCount: 0, generatedAt: null, activeDocumentId: "", controlledOutputPath: null, renderBounds: [] }; failNextApplyForDiagnostic = false; }
  function failNextApply() { failNextApplyForDiagnostic = true; }
  function configureRegenerate(handler) {
    if (typeof handler !== "function") throw new TypeError("PDF-Neuerzeugungshandler fehlt.");
    regenerateHandler = handler;
  }

  return Object.freeze({ getPdfRegistry, getCurrentPdfLayoutState, submitPdfChangeRequest, regeneratePdfPreview, getPreviewMetadata,
    getPdfContract, setActiveDocumentContext, replaceCurrentPdfLayoutState, resetForDiagnostic, failNextApply, configureRegenerate });
}

const sharedBbmPdfAdapter = createBbmPdfAdapter();

module.exports = Object.freeze({
  APPLICATION_ID,
  DOCUMENT_TYPE_ID,
  DISPLAY_NAME,
  SCOPE_ID,
  PDF_REGISTRY_VERSION,
  REGISTRY_FINGERPRINT,
  createBbmPdfAdapter,
  getSharedBbmPdfAdapter: () => sharedBbmPdfAdapter,
  getBbmPdfRegistry: () => clone(REGISTRY),
});
