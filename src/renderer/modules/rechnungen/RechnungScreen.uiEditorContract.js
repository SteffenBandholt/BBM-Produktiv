import { FIELD_LAYOUT, GROUP_LAYOUT, TEXT_LAYOUT, ZONE_HEIGHT_LAYOUT, m83Component, m83DomainButton, m83Element, m83Slot } from "../../ui-editor/m83ComponentContract.js";

export const RECHNUNG_SCOPE_ID = "rechnung.screen";
export const RECHNUNG_COMPONENT_ID = "bbm.rechnung.screen";
const area = (id, name, parentId, order, componentKind) => m83Element({ id, name, type: "area", role: "layout", parentId, order, allowedOps: GROUP_LAYOUT, componentKind });
const group = (id, name, parentId, order, componentKind) => m83Element({ id, name, type: "group", role: "layout", parentId, order, allowedOps: GROUP_LAYOUT, componentKind });
const label = (id, name, parentId, order, role = "content") => m83Element({ id, name, type: "label", role, parentId, order, allowedOps: TEXT_LAYOUT, componentKind: "label" });
const field = (id, name, parentId, order, fieldKind) => m83Element({ id, name, type: "field", role: "content", parentId, order, allowedOps: FIELD_LAYOUT, fieldKind });
const action = (id, name, parentId, order, actionKind) => m83DomainButton({ id, name, parentId, order, actionKind });

const elements = Object.freeze([
  m83Element({ id: RECHNUNG_SCOPE_ID, name: "Rechnungen", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: ZONE_HEIGHT_LAYOUT, componentKind: "moduleScreen" }),
  area("rechnung.screen.content", "Inhaltsbereich Rechnungen", RECHNUNG_SCOPE_ID, 10, "contentArea"),
  area("rechnung.overview", "Rechnungsübersicht", "rechnung.screen.content", 20, "overview"),
  group("rechnung.overview.header", "Kopf Rechnungsübersicht", "rechnung.overview", 21, "header"),
  label("rechnung.overview.title", "Rechnungen", "rechnung.overview.header", 22),
  label("rechnung.overview.subtitle", "Rechnungsgrunddaten und Belegköpfe", "rechnung.overview.header", 23),
  action("rechnung.overview.new", "Freie Rechnung", "rechnung.overview.header", 24, "createDraft"),
  m83Element({ id: "rechnung.overview.list", name: "Rechnungsbelege", type: "group", role: "content", parentId: "rechnung.overview", order: 25, allowedOps: GROUP_LAYOUT, componentKind: "cardList" }),
  m83Element({ id: "rechnung.editor", name: "Rechnungseditor", type: "area", role: "layout", parentId: "rechnung.screen.content", order: 30, allowedOps: GROUP_LAYOUT, componentKind: "workDialog" }),
  group("rechnung.editor.header", "Kopf Rechnungseditor", "rechnung.editor", 31, "header"),
  label("rechnung.editor.title", "Belegart", "rechnung.editor.header", 32),
  m83Element({ id: "rechnung.editor.status", name: "Rechnungsstatus", type: "statusIndicator", role: "status", parentId: "rechnung.editor.header", order: 33, allowedOps: GROUP_LAYOUT, componentKind: "statusBadge" }),
  area("rechnung.editor.body", "Belegkopfdaten", "rechnung.editor", 40, "formBody"),
  group("rechnung.editor.basic", "Grunddaten", "rechnung.editor.body", 41, "formGroup"),
  field("rechnung.editor.source", "Herkunft", "rechnung.editor.basic", 42, "select"),
  field("rechnung.editor.documentType", "Belegart", "rechnung.editor.basic", 43, "select"),
  field("rechnung.editor.installmentNumber", "Abschlagsnummer", "rechnung.editor.basic", 44, "integer"),
  field("rechnung.editor.invoiceNumber", "Rechnungsnummer", "rechnung.editor.basic", 45, "readOnlyText"),
  field("rechnung.editor.customer", "Rechnungskunde", "rechnung.editor.basic", 46, "select"),
  field("rechnung.editor.project", "Projekt", "rechnung.editor.basic", 47, "select"),
  field("rechnung.editor.invoiceDate", "Rechnungsdatum", "rechnung.editor.basic", 48, "date"),
  group("rechnung.editor.parties", "Rechnungsparteien", "rechnung.editor.body", 50, "partySummary"),
  label("rechnung.editor.customerAddress", "Rechnungsanschrift Kunde", "rechnung.editor.parties", 51),
  label("rechnung.editor.issuerAddress", "Rechnungssteller", "rechnung.editor.parties", 52),
  group("rechnung.editor.servicePeriod", "Leistungszeitpunkt", "rechnung.editor.body", 60, "servicePeriod"),
  field("rechnung.editor.servicePeriodType", "Art des Leistungszeitpunkts", "rechnung.editor.servicePeriod", 61, "select"),
  field("rechnung.editor.serviceDate", "Leistungsdatum", "rechnung.editor.servicePeriod", 62, "date"),
  field("rechnung.editor.serviceMonth", "Leistungsmonat", "rechnung.editor.servicePeriod", 63, "month"),
  field("rechnung.editor.serviceStart", "Leistungszeitraum von", "rechnung.editor.servicePeriod", 64, "date"),
  field("rechnung.editor.serviceEnd", "Leistungszeitraum bis", "rechnung.editor.servicePeriod", 65, "date"),
  field("rechnung.editor.reference", "Bauvorhaben / Leistungsbezug", "rechnung.editor.body", 70, "singleLineText"),
  field("rechnung.editor.constructionProject", "Bauvorhaben", "rechnung.editor.body", 71, "singleLineText"),
  group("rechnung.editor.positions", "Rechnungspositionen", "rechnung.editor.body", 72, "positionWorkbench"),
  label("rechnung.editor.positions.total", "Positionssumme", "rechnung.editor.positions", 73),
  group("rechnung.editor.positions.list", "Positionsliste", "rechnung.editor.positions", 74, "cardList"),
  group("rechnung.editor.positionEditor", "Positionseditor", "rechnung.editor.positions", 75, "positionEditor"),
  field("rechnung.editor.positionType", "Positionstyp", "rechnung.editor.positionEditor", 76, "select"),
  field("rechnung.editor.positionShort", "Kurztext", "rechnung.editor.positionEditor", 77, "singleLineText"),
  field("rechnung.editor.positionLong", "Langtext", "rechnung.editor.positionEditor", 78, "multilineText"),
  field("rechnung.editor.positionQuantity", "Menge", "rechnung.editor.positionEditor", 79, "decimal"),
  field("rechnung.editor.positionUnit", "Einheit", "rechnung.editor.positionEditor", 80, "singleLineText"),
  field("rechnung.editor.positionPrice", "Einzelpreis", "rechnung.editor.positionEditor", 81, "currency"),
  field("rechnung.editor.positionNep", "NEP", "rechnung.editor.positionEditor", 82, "checkbox"),
  action("rechnung.editor.positionApply", "Position uebernehmen", "rechnung.editor.positionEditor", 83, "applyPosition"),
  action("rechnung.editor.positionDelete", "Position loeschen", "rechnung.editor.positionEditor", 84, "deletePosition"),
  action("rechnung.editor.positionUp", "Position nach oben", "rechnung.editor.positionEditor", 85, "movePosition"),
  action("rechnung.editor.positionDown", "Position nach unten", "rechnung.editor.positionEditor", 86, "movePosition"),
  group("rechnung.editor.payment", "Zahlungsdaten", "rechnung.editor.body", 80, "payment"),
  field("rechnung.editor.paymentTermDays", "Zahlungsziel Kalendertage", "rechnung.editor.payment", 81, "integer"),
  field("rechnung.editor.dueDate", "Fällig am", "rechnung.editor.payment", 82, "readOnlyDate"),
  m83Element({ id: "rechnung.editor.validation", name: "Validierung und Meldungen", type: "statusIndicator", role: "status", parentId: "rechnung.editor", order: 90, allowedOps: TEXT_LAYOUT, componentKind: "liveMessage" }),
  group("rechnung.editor.footer", "Aktionen Rechnungseditor", "rechnung.editor", 100, "actionBar"),
  action("rechnung.editor.save", "Speichern", "rechnung.editor.footer", 101, "saveDraft"),
  action("rechnung.editor.preview", "Proberechnung", "rechnung.editor.footer", 102, "previewDraft"),
  action("rechnung.editor.book", "Rechnung buchen", "rechnung.editor.footer", 103, "bookDraft"),
  action("rechnung.editor.delete", "Entwurf verwerfen", "rechnung.editor.footer", 104, "deleteDraft"),
  action("rechnung.editor.close", "Schließen", "rechnung.editor.footer", 105, "close"),
  m83Element({ id: "rechnung.preview", name: "Proberechnung", type: "area", role: "layout", parentId: "rechnung.screen.content", order: 110, allowedOps: GROUP_LAYOUT, componentKind: "previewDialog" }),
  label("rechnung.preview.title", "Proberechnung / Entwurf", "rechnung.preview", 111),
  area("rechnung.preview.body", "Vorschau Belegkopf", "rechnung.preview", 112, "previewBody"),
  action("rechnung.preview.close", "Vorschau schließen", "rechnung.preview", 113, "closePreview"),
]);

export const RECHNUNG_REQUIRED_SLOTS = Object.freeze(elements.map((entry) => entry.id));
export const rechnungUiEditorContract = m83Component({ componentId: RECHNUNG_COMPONENT_ID, scopeId: RECHNUNG_SCOPE_ID, requiredSlots: RECHNUNG_REQUIRED_SLOTS, slots: elements.map((entry) => m83Slot(entry.id, entry)) });
