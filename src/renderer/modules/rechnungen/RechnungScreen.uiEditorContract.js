import { FIELD_LAYOUT, GROUP_LAYOUT, TEXT_LAYOUT, ZONE_HEIGHT_LAYOUT, m83Component, m83DomainButton, m83Element, m83Slot } from "../../ui-editor/m83ComponentContract.js";

export const RECHNUNG_SCOPE_ID = "rechnung.screen";
export const RECHNUNG_COMPONENT_ID = "bbm.rechnung.screen";
const invoiceElement = (values) => m83Element({ ...values, unboundedGeometry: true });
const area = (id, name, parentId, order, componentKind, options = {}) => invoiceElement({ id, name, type: "area", role: "layout", parentId, order, allowedOps: GROUP_LAYOUT, componentKind, ...options });
const group = (id, name, parentId, order, componentKind) => invoiceElement({ id, name, type: "group", role: "layout", parentId, order, allowedOps: GROUP_LAYOUT, componentKind });
const label = (id, name, parentId, order, role = "content", componentKind = "label") => invoiceElement({ id, name, type: "label", role, parentId, order, allowedOps: TEXT_LAYOUT, componentKind });
const field = (id, name, parentId, order, fieldKind) => invoiceElement({ id, name, type: "field", role: "content", parentId, order, allowedOps: FIELD_LAYOUT, fieldKind });
const buttonReflowIdsByParent = Object.freeze({
  "rechnung.overview.header": Object.freeze(["rechnung.overview.title", "rechnung.overview.subtitle", "rechnung.overview.new"]),
  "rechnung.editor.header": Object.freeze(["rechnung.editor.status", "rechnung.editor.headToggle", "rechnung.editor.leistungsEditboxToggle", "rechnung.editor.preview", "rechnung.editor.book", "rechnung.editor.delete", "rechnung.editor.close"]),
  "rechnung.editor.parties": Object.freeze(["rechnung.editor.customerPicker", "rechnung.editor.customerAddress", "rechnung.editor.issuerBlock", "rechnung.editor.invoiceMetaBlock", "rechnung.editor.introText"]),
  "rechnung.editor.servicePeriod": Object.freeze(["rechnung.editor.servicePeriodToggle", "rechnung.editor.servicePeriodType", "rechnung.editor.serviceDate", "rechnung.editor.serviceMonth", "rechnung.editor.serviceStart", "rechnung.editor.serviceEnd"]),
  "rechnung.preview": Object.freeze(["rechnung.preview.title", "rechnung.preview.body", "rechnung.preview.close"]),
});
const action = (id, name, parentId, order, actionKind) => {
  const reflowIds = Object.freeze([parentId, ...(buttonReflowIdsByParent[parentId] || [])]);
  return m83DomainButton({
    id,
    name,
    parentId,
    order,
    actionKind,
    unboundedGeometry: true,
    fitChromeToOuterSize: true,
    operationEffects: { resizeWidth: "parentReflowRequired", resizeHeight: "parentReflowRequired" },
    operationAffectedIds: { resizeWidth: reflowIds, resizeHeight: reflowIds },
  });
};

const baseElements = Object.freeze([
  invoiceElement({ id: RECHNUNG_SCOPE_ID, name: "Rechnungen", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: ZONE_HEIGHT_LAYOUT, componentKind: "moduleScreen" }),
  area("rechnung.screen.content", "Inhaltsbereich Rechnungen", RECHNUNG_SCOPE_ID, 10, "contentArea"),
  area("rechnung.overview", "Rechnungsübersicht", "rechnung.screen.content", 20, "overview"),
  group("rechnung.overview.header", "Kopf Rechnungsübersicht", "rechnung.overview", 21, "header"),
  label("rechnung.overview.title", "Rechnungen", "rechnung.overview.header", 22),
  label("rechnung.overview.subtitle", "Rechnungsgrunddaten und Belegköpfe", "rechnung.overview.header", 23),
  action("rechnung.overview.new", "Freie Rechnung", "rechnung.overview.header", 24, "createDraft"),
  invoiceElement({ id: "rechnung.overview.list", name: "Rechnungsbelege", type: "group", role: "content", parentId: "rechnung.overview", order: 25, allowedOps: GROUP_LAYOUT, componentKind: "cardList" }),
  invoiceElement({ id: "rechnung.editor", name: "Rechnungsblatt", type: "area", role: "layout", parentId: "rechnung.screen.content", order: 30, allowedOps: GROUP_LAYOUT, componentKind: "invoiceSheet" }),
  group("rechnung.editor.header", "Anwendungsaktionen", "rechnung.editor", 31, "actionRail"),
  area("rechnung.editor.headerCanvas", "Steuerungsbar-Canvas", "rechnung.editor", 32, "headerCanvas"),
  label("rechnung.editor.title", "Belegbezeichnung", "rechnung.editor.body", 32),
  invoiceElement({ id: "rechnung.editor.status", name: "Rechnungsstatus", type: "statusIndicator", role: "status", parentId: "rechnung.editor.header", order: 33, allowedOps: GROUP_LAYOUT, componentKind: "statusBadge" }),
  action("rechnung.editor.headToggle", "Kopf ein- oder ausblenden", "rechnung.editor.header", 34, "toggleInvoiceHead"),
  area("rechnung.editor.body", "Rechnungsblattinhalt", "rechnung.editor", 40, "invoiceSheetBody"),
  area("rechnung.editor.sheetArea", "Scrollbereich Rechnungsblatt", "rechnung.editor", 41, "sheetArea"),
  area("rechnung.editor.sheetCanvas", "Rechnungsblatt-Canvas", "rechnung.editor.sheetArea", 42, "sheetCanvas"),
  group("rechnung.editor.basic", "Rechnungsangaben", "rechnung.editor.body", 41, "invoiceFacts"),
  field("rechnung.editor.source", "Herkunft", "rechnung.editor.basic", 42, "select"),
  field("rechnung.editor.documentType", "Belegart", "rechnung.editor.basic", 43, "select"),
  field("rechnung.editor.installmentNumber", "Abschlagsnummer", "rechnung.editor.basic", 44, "integer"),
  field("rechnung.editor.invoiceNumber", "Rechnungsnummer", "rechnung.editor.basic", 45, "readOnlyText"),
  action("rechnung.editor.customerPicker", "Rechnungsempfaenger auswaehlen", "rechnung.editor.parties", 46, "selectCustomer"),
  field("rechnung.editor.project", "Projekt", "rechnung.editor.basic", 47, "select"),
  field("rechnung.editor.invoiceDate", "Rechnungsdatum", "rechnung.editor.basic", 48, "date"),
  group("rechnung.editor.parties", "Rechnungsparteien", "rechnung.editor.body", 50, "partySummary"),
  label("rechnung.editor.customerAddress", "Rechnungsanschrift Kunde", "rechnung.editor.parties", 51),
  group("rechnung.editor.issuerBlock", "Ausstellerblock", "rechnung.editor.parties", 52, "issuerBlock"),
  label("rechnung.editor.issuerName1", "Aussteller Name 1", "rechnung.editor.issuerBlock", 53),
  label("rechnung.editor.issuerName2", "Aussteller Name 2", "rechnung.editor.issuerBlock", 54),
  label("rechnung.editor.issuerStreet", "Aussteller Straße", "rechnung.editor.issuerBlock", 55),
  label("rechnung.editor.issuerCity", "Aussteller PLZ Ort", "rechnung.editor.issuerBlock", 56),
  group("rechnung.editor.invoiceMetaBlock", "Rechnungsdatenblock", "rechnung.editor.parties", 57, "invoiceMetaBlock"),
  label("rechnung.editor.invoiceDateDisplay", "Rechnungsdatum Anzeige", "rechnung.editor.invoiceMetaBlock", 58),
  label("rechnung.editor.invoiceDateDisplay.label", "Rechnungsdatum Bezeichnung", "rechnung.editor.invoiceDateDisplay", 58, "fieldLabel", "fieldLabel"),
  label("rechnung.editor.servicePeriodDisplay", "Leistungszeitraum Anzeige", "rechnung.editor.invoiceMetaBlock", 59),
  label("rechnung.editor.servicePeriodDisplay.label", "Leistungszeitraum Bezeichnung", "rechnung.editor.servicePeriodDisplay", 59, "fieldLabel", "fieldLabel"),
  group("rechnung.editor.servicePeriod", "Leistungszeitpunkt", "rechnung.editor.body", 60, "servicePeriod"),
  action("rechnung.editor.servicePeriodToggle", "Leistungszeitraum bearbeiten", "rechnung.editor.servicePeriod", 60, "toggleServicePeriodEditor"),
  field("rechnung.editor.servicePeriodType", "Art des Leistungszeitpunkts", "rechnung.editor.servicePeriod", 61, "select"),
  field("rechnung.editor.serviceDate", "Leistungsdatum", "rechnung.editor.servicePeriod", 62, "date"),
  field("rechnung.editor.serviceMonth", "Leistungsmonat", "rechnung.editor.servicePeriod", 63, "month"),
  field("rechnung.editor.serviceStart", "Leistungszeitraum von", "rechnung.editor.servicePeriod", 64, "date"),
  field("rechnung.editor.serviceEnd", "Leistungszeitraum bis", "rechnung.editor.servicePeriod", 65, "date"),
  field("rechnung.editor.reference", "Bauvorhaben / Leistungsbezug", "rechnung.editor.body", 70, "singleLineText"),
  field("rechnung.editor.constructionProject", "Bauvorhaben", "rechnung.editor.body", 71, "singleLineText"),
  field("rechnung.editor.introText", "Optionaler Freitext", "rechnung.editor.parties", 72, "multilineText"),
  group("rechnung.editor.positions", "Bau-LV", "rechnung.editor.body", 72, "constructionLv"),
  label("rechnung.editor.positions.total", "Nettosumme", "rechnung.editor.payment", 83),
  label("rechnung.editor.positions.total.label", "Summe Netto Bezeichnung", "rechnung.editor.payment", 83, "fieldLabel", "fieldLabel"),
  label("rechnung.editor.invoiceVat.label", "Mehrwertsteuer Bezeichnung", "rechnung.editor.payment", 84, "fieldLabel", "fieldLabel"),
  label("rechnung.editor.invoiceTotal.label", "Summe Brutto Bezeichnung", "rechnung.editor.payment", 85, "fieldLabel", "fieldLabel"),
  group("rechnung.editor.positions.list", "LV-Positionen", "rechnung.editor.positions", 74, "constructionLvList"),
  group("rechnung.editor.payment", "Summen und Zahlungstext", "rechnung.editor.body", 80, "invoiceTotals"),
  invoiceElement({ id: "rechnung.editor.issuerFooter", name: "Aussteller-Fußdaten", type: "group", role: "content", parentId: "rechnung.editor.body", order: 81, allowedOps: GROUP_LAYOUT, componentKind: "issuerFooter" }),
  field("rechnung.editor.paymentTermDays", "Zahlungsziel Kalendertage", "rechnung.editor.payment", 81, "integer"),
  field("rechnung.editor.dueDate", "Fällig am", "rechnung.editor.payment", 82, "readOnlyDate"),
  label("rechnung.editor.invoiceVat", "Mehrwertsteuerbetrag", "rechnung.editor.payment", 84, "content", "amount"),
  label("rechnung.editor.invoiceTotal", "Bruttosumme", "rechnung.editor.payment", 85, "content", "amount"),
  label("rechnung.editor.paymentText", "Zahlungshinweis", "rechnung.editor.payment", 86, "content", "paymentText"),
  invoiceElement({ id: "rechnung.editor.validation", name: "Validierung und Meldungen", type: "statusIndicator", role: "status", parentId: "rechnung.editor", order: 90, allowedOps: TEXT_LAYOUT, componentKind: "liveMessage" }),
  group("rechnung.editor.footer", "Hinweis Anwendungsaktionen", "rechnung.editor", 100, "actionRailNote"),
  label("rechnung.editor.footer.label", "Anwendungsaktionen Hinweis", "rechnung.editor.footer", 101, "fieldLabel", "fieldLabel"),
  action("rechnung.editor.preview", "Proberechnung", "rechnung.editor.header", 102, "previewDraft"),
  action("rechnung.editor.book", "Rechnung buchen", "rechnung.editor.header", 103, "bookDraft"),
  action("rechnung.editor.delete", "Entwurf verwerfen", "rechnung.editor.header", 104, "deleteDraft"),
  action("rechnung.editor.close", "Schließen", "rechnung.editor.header", 105, "close"),
  invoiceElement({ id: "rechnung.preview", name: "Proberechnung", type: "area", role: "layout", parentId: "rechnung.screen.content", order: 110, allowedOps: GROUP_LAYOUT, componentKind: "previewDialog" }),
  label("rechnung.preview.title", "Proberechnung / Entwurf", "rechnung.preview", 111),
  area("rechnung.preview.body", "Vorschau Belegkopf", "rechnung.preview", 112, "previewBody"),
  action("rechnung.preview.close", "Vorschau schließen", "rechnung.preview", 113, "closePreview"),
]);

const fieldLabelElements = Object.freeze(
  baseElements
    .filter((entry) => entry.type === "field")
    .map((entry) => label(
      `${entry.id}.label`,
      `${entry.name} Bezeichnung`,
      entry.parentId,
      entry.order,
      "fieldLabel",
      "fieldLabel"
    ))
);

const requiredElements = Object.freeze([...baseElements, ...fieldLabelElements]);
const optionalElements = Object.freeze([
  action("rechnung.editor.leistungsEditboxToggle", "LeistungsEditbox ein- oder ausblenden", "rechnung.editor.header", 35, "toggleLeistungsEditbox"),
  area("rechnung.editor.leistungsEditbox", "LeistungsEditbox", "rechnung.editor", 106, "leistungsEditbox"),
]);
const elements = Object.freeze([...requiredElements, ...optionalElements]);

export const RECHNUNG_REQUIRED_SLOTS = Object.freeze(requiredElements.map((entry) => entry.id));
export const rechnungUiEditorContract = m83Component({ componentId: RECHNUNG_COMPONENT_ID, scopeId: RECHNUNG_SCOPE_ID, requiredSlots: RECHNUNG_REQUIRED_SLOTS, slots: elements.map((entry) => m83Slot(entry.id, entry)) });
