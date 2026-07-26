export const BBM_M80_REGISTRY_VERSION = 2;
export const BBM_M80_REGISTRY_STATUS = "incomplete";

const CONTAINER_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "setVisibility"]);
const PANE_LAYOUT = Object.freeze(["resizeWidth", "setVisibility"]);
const TEXT_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "textMove", "textResize", "setVisibility"]);
const TABLE_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "textMove", "textResize", "setVisibility"]);
const COLUMN_LAYOUT = Object.freeze(["resizeWidth", "textMove", "textResize", "setVisibility"]);
const SPLIT_LAYOUT = Object.freeze(["resizeHeight", "setVisibility"]);
const DOMAIN_LOCKS = Object.freeze(["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]);

function defaultBaseline(values = {}) {
  return Object.freeze({
    x: 0, y: 0, width: 100, height: 24, textOffsetX: 0, textOffsetY: 0,
    fontSize: 12, visible: true, minWidth: 24, maxWidth: 2400, minHeight: 18, maxHeight: 1600,
    ...values,
  });
}

function element(values) {
  const allowedOps = Object.freeze([...(values.allowedOps || [])]);
  return Object.freeze({
    visible: true,
    editable: allowedOps.length > 0,
    ...values,
    semanticKey: values.semanticKey || values.id,
    registrationStatus: values.registrationStatus || (allowedOps.length > 0 ? "editorEnabled" : "editorContainer"),
    refKey: values.refKey || values.id,
    baseline: defaultBaseline(values.baseline),
    allowedOps,
    lockedOps: Object.freeze([...(values.lockedOps || [])]),
  });
}

function domainButton(values) {
  return element({ ...values, type: "button", role: "domainActionLayout", allowedOps: TEXT_LAYOUT, lockedOps: DOMAIN_LOCKS, actionKind: values.actionKind || "domain" });
}

function completeScope(scopeId, elements) {
  return Object.freeze({
    scopeId,
    status: "complete",
    inventoryStatus: "complete",
    expectedElementIds: Object.freeze(elements.map((entry) => entry.id)),
    elements: Object.freeze(elements),
  });
}

function blockedScope(scopeId, name, reason = "registration_inventory_pending") {
  return Object.freeze({
    scopeId,
    name,
    status: "blocked",
    inventoryStatus: "notInventoried",
    expectedElementIds: Object.freeze([]),
    elements: Object.freeze([]),
    reason,
  });
}

const layoutElements = [
  element({ id: "restarbeiten.layout.root", name: "Restarbeiten · Hauptlayout", type: "root", role: "scopeRoot", parentId: null, order: 0, editable: false, allowedOps: [], componentKind: "scope", baseline: { width: 900, height: 670, minHeight: 340, maxHeight: 1600 } }),
  element({ id: "restarbeiten.layout.split", name: "Restarbeiten · Verhältnis Hauptliste/Editbox", type: "area", role: "layout", parentId: "restarbeiten.layout.root", order: 10, allowedOps: SPLIT_LAYOUT, componentKind: "verticalSplit", baseline: { width: 900, height: 420, minHeight: 180, maxHeight: 1200 } }),
  element({ id: "restarbeiten.layout.list", name: "Restarbeiten · Hauptlistenbereich", type: "area", role: "layout", parentId: "restarbeiten.layout.split", order: 20, allowedOps: PANE_LAYOUT, componentKind: "splitPane", baseline: { width: 900, height: 420, minWidth: 320, minHeight: 180 } }),
  element({ id: "restarbeiten.layout.edit", name: "Restarbeiten · Editboxbereich", type: "area", role: "layout", parentId: "restarbeiten.layout.split", order: 30, allowedOps: PANE_LAYOUT, componentKind: "splitPane", baseline: { width: 900, height: 250, minWidth: 320, minHeight: 160 } }),
];

const listElements = [
  element({ id: "restarbeiten.list.root", name: "Restarbeiten · Liste", type: "root", role: "scopeRoot", parentId: null, order: 0, editable: false, allowedOps: [], componentKind: "scope" }),
  element({ id: "restarbeiten.list.area", name: "Listenbereich", type: "area", role: "contentArea", parentId: "restarbeiten.list.root", order: 10, allowedOps: CONTAINER_LAYOUT, componentKind: "contentArea", baseline: { width: 900, height: 420, minWidth: 320, minHeight: 180 } }),
  element({ id: "restarbeiten.list.paper", name: "Listenblatt", type: "group", role: "layoutGroup", parentId: "restarbeiten.list.area", order: 20, allowedOps: CONTAINER_LAYOUT, componentKind: "paper", baseline: { width: 900, height: 720, minWidth: 320, minHeight: 240 } }),
  element({ id: "restarbeiten.list.table", name: "Restarbeiten-Hauptliste", type: "table", role: "contentTable", parentId: "restarbeiten.list.paper", order: 30, allowedOps: TABLE_LAYOUT, componentKind: "contentTable", baseline: { width: 858, height: 680, minWidth: 320, minHeight: 160 } }),
  element({ id: "restarbeiten.list.table.number", name: "Nr. / Datum / Klasse / Fotos", type: "tableColumn", role: "contentColumn", parentId: "restarbeiten.list.table", order: 31, allowedOps: COLUMN_LAYOUT, columnRole: "contentColumn", baseline: { width: 82, height: 28, minWidth: 50, maxWidth: 240 } }),
  element({ id: "restarbeiten.list.table.subject", name: "Gegenstand – Verortung / Kurztext / Langtext", type: "tableColumn", role: "contentColumn", parentId: "restarbeiten.list.table", order: 32, allowedOps: COLUMN_LAYOUT, columnRole: "contentColumn", baseline: { width: 600, height: 28, minWidth: 160, maxWidth: 1200 } }),
  element({ id: "restarbeiten.list.table.meta", name: "Status-Metaspalte – Fertig bis / Ampel / Status / Verantwortlich", type: "tableColumn", role: "metaColumn", parentId: "restarbeiten.list.table", order: 33, allowedOps: COLUMN_LAYOUT, columnRole: "metaColumn", baseline: { width: 172, height: 28, minWidth: 110, maxWidth: 420 } }),
];

const editElements = [
  element({ id: "restarbeiten.edit.root", name: "Restarbeiten · Bearbeitung", type: "root", role: "scopeRoot", parentId: null, order: 0, editable: false, allowedOps: [], componentKind: "scope", baseline: { width: 900, height: 250, minWidth: 320, minHeight: 160 } }),
  element({ id: "restarbeiten.edit.area", name: "Bearbeitungsbereich", type: "area", role: "formArea", parentId: "restarbeiten.edit.root", order: 10, allowedOps: CONTAINER_LAYOUT, componentKind: "formArea", baseline: { width: 878, height: 226, minWidth: 300, minHeight: 140 } }),
  element({ id: "restarbeiten.edit.header", name: "Editbox-Kopf", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.area", order: 20, allowedOps: CONTAINER_LAYOUT, componentKind: "header" }),
  element({ id: "restarbeiten.edit.header.current", name: "Aktueller Datensatz", type: "label", role: "status", parentId: "restarbeiten.edit.header", order: 21, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.fields", name: "Textfelder", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 30, allowedOps: CONTAINER_LAYOUT, componentKind: "fieldCollection" }),
  element({ id: "restarbeiten.edit.short", name: "Kurztext-Feldgruppe", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.fields", order: 40, allowedOps: CONTAINER_LAYOUT, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.short.label", name: "Kurztext / Gegenstand · Bezeichnung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.short", order: 41, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.short.remaining", name: "Restzeichen Kurztext", type: "label", role: "status", parentId: "restarbeiten.edit.short", order: 42, allowedOps: TEXT_LAYOUT, componentKind: "counter" }),
  domainButton({ id: "restarbeiten.edit.short.dictation", name: "Diktat Kurztext", parentId: "restarbeiten.edit.short", order: 43, actionKind: "domainDictation" }),
  element({ id: "restarbeiten.edit.class", name: "Klasse", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.short", order: 44, allowedOps: CONTAINER_LAYOUT, componentKind: "choiceField" }),
  element({ id: "restarbeiten.edit.class.label", name: "Klasse · Bezeichnung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.class", order: 45, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.class.control", name: "Klasse · Auswahl", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.class", order: 46, allowedOps: TEXT_LAYOUT, fieldKind: "buttonChoice", componentKind: "choice" }),
  domainButton({ id: "restarbeiten.edit.class.rest", name: "Klasse Rest", parentId: "restarbeiten.edit.class.control", order: 47, actionKind: "domainSelection" }),
  domainButton({ id: "restarbeiten.edit.class.defect", name: "Klasse Mangel", parentId: "restarbeiten.edit.class.control", order: 48, actionKind: "domainSelection" }),
  element({ id: "restarbeiten.edit.short.actions", name: "Datensatzaktionen", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.short", order: 49, allowedOps: CONTAINER_LAYOUT, componentKind: "actionGroup" }),
  domainButton({ id: "restarbeiten.edit.action.new", name: "Neu", parentId: "restarbeiten.edit.short.actions", order: 50, actionKind: "domainCreate" }),
  domainButton({ id: "restarbeiten.edit.action.delete", name: "Löschen", parentId: "restarbeiten.edit.short.actions", order: 51, actionKind: "domainDelete" }),
  element({ id: "restarbeiten.edit.short.field", name: "Kurztext / Gegenstand · Feld", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.short", order: 52, allowedOps: TEXT_LAYOUT, fieldKind: "text", componentKind: "input" }),
  element({ id: "restarbeiten.edit.long", name: "Langtext-Feldgruppe", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.fields", order: 60, allowedOps: CONTAINER_LAYOUT, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.long.label", name: "Langtext / Beschreibung · Bezeichnung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.long", order: 61, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.long.remaining", name: "Restzeichen Langtext", type: "label", role: "status", parentId: "restarbeiten.edit.long", order: 62, allowedOps: TEXT_LAYOUT, componentKind: "counter" }),
  domainButton({ id: "restarbeiten.edit.long.dictation", name: "Diktat Langtext", parentId: "restarbeiten.edit.long", order: 63, actionKind: "domainDictation" }),
  element({ id: "restarbeiten.edit.long.field", name: "Langtext / Beschreibung · Feld", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.long", order: 64, allowedOps: TEXT_LAYOUT, fieldKind: "multilineText", componentKind: "textarea" }),
  element({ id: "restarbeiten.edit.location", name: "Verortung", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 70, allowedOps: CONTAINER_LAYOUT, componentKind: "locationGroup" }),
  ...[1, 2, 3, 4].flatMap((level, index) => [
    element({ id: `restarbeiten.edit.location.${level}`, name: `Verortung L${level}`, type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.location", order: 71 + index * 3, allowedOps: CONTAINER_LAYOUT, componentKind: "fieldGroup" }),
    element({ id: `restarbeiten.edit.location.${level}.label`, name: `Verortung L${level} · Bezeichnung`, type: "label", role: "fieldLabel", parentId: `restarbeiten.edit.location.${level}`, order: 72 + index * 3, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    element({ id: `restarbeiten.edit.location.${level}.field`, name: `Verortung L${level} · Feld`, type: "field", role: "dataFieldLayout", parentId: `restarbeiten.edit.location.${level}`, order: 73 + index * 3, allowedOps: TEXT_LAYOUT, fieldKind: "text", componentKind: "input" }),
  ]),
  element({ id: "restarbeiten.edit.meta", name: "Status und Zuordnung", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 90, allowedOps: CONTAINER_LAYOUT, componentKind: "metaGroup" }),
  element({ id: "restarbeiten.edit.meta.status", name: "Status", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.meta", order: 91, allowedOps: CONTAINER_LAYOUT, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.meta.status.label", name: "Status · Bezeichnung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.meta.status", order: 92, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.meta.status.field", name: "Status · Auswahl", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.meta.status", order: 93, allowedOps: TEXT_LAYOUT, fieldKind: "select", componentKind: "select" }),
  element({ id: "restarbeiten.edit.meta.due", name: "Fertig bis", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.meta", order: 94, allowedOps: CONTAINER_LAYOUT, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.meta.due.label", name: "Fertig bis · Bezeichnung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.meta.due", order: 95, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.meta.due.field", name: "Fertig bis · Datum", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.meta.due", order: 96, allowedOps: TEXT_LAYOUT, fieldKind: "date", componentKind: "dateInput" }),
  element({ id: "restarbeiten.edit.meta.ampel", name: "Ampel", type: "statusIndicator", role: "status", parentId: "restarbeiten.edit.meta", order: 97, allowedOps: TEXT_LAYOUT, componentKind: "statusIndicator" }),
  element({ id: "restarbeiten.edit.meta.responsible", name: "Verantwortlich", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.meta", order: 98, allowedOps: CONTAINER_LAYOUT, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.meta.responsible.label", name: "Verantwortlich · Bezeichnung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.meta.responsible", order: 99, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.meta.responsible.field", name: "Verantwortlich · Auswahl", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.meta.responsible", order: 100, allowedOps: TEXT_LAYOUT, fieldKind: "select", componentKind: "select" }),
  element({ id: "restarbeiten.edit.validation", name: "Pflichtfeldhinweis", type: "label", role: "status", parentId: "restarbeiten.edit.meta", order: 101, allowedOps: TEXT_LAYOUT, componentKind: "validation" }),
  domainButton({ id: "restarbeiten.edit.action.note", name: "Notiz", parentId: "restarbeiten.edit.meta", order: 102, actionKind: "domainNote" }),
];

export const BBM_M80_ACTIVE_SCOPES = Object.freeze([
  "restarbeiten.layout.root",
  "restarbeiten.list.root",
  "restarbeiten.edit.root",
]);

export const BBM_M80_REGISTRY_SCOPES = Object.freeze([
  completeScope("restarbeiten.layout.root", layoutElements),
  completeScope("restarbeiten.list.root", listElements),
  completeScope("restarbeiten.edit.root", editElements),
  blockedScope("bbm.shell", "Shell und Hauptnavigation"),
  blockedScope("bbm.home", "Start"),
  blockedScope("bbm.projects", "Projektverwaltung"),
  blockedScope("bbm.project-workspace", "Projektarbeitsplatz"),
  blockedScope("bbm.firms", "Firmen und Personen"),
  blockedScope("bbm.project-firms", "Projektfirmen und Projektpersonen"),
  blockedScope("bbm.protokoll", "Protokoll"),
  blockedScope("bbm.settings", "Einstellungen"),
  blockedScope("bbm.help", "Hilfe"),
  blockedScope("bbm.dialogs", "Produktive Dialoge"),
  blockedScope("restarbeiten.filterbar", "Restarbeiten · Filterleiste"),
  blockedScope("restarbeiten.quicklane", "Restarbeiten · Quicklane"),
  blockedScope("restarbeiten.notes", "Restarbeiten · Notizdialog"),
  blockedScope("restarbeiten.output-preview", "Restarbeiten · Ausgabevorschau", "M81_pdf_excluded"),
]);

const entries = new Map(BBM_M80_REGISTRY_SCOPES.flatMap((scope) => scope.elements).map((entry) => [entry.id, entry]));

export function getM80RegistryEntry(id) { return entries.get(String(id || "")) || null; }
export function listM80RegistryScopes() {
  return BBM_M80_REGISTRY_SCOPES.map((scope) => ({
    ...scope,
    expectedElementIds: [...scope.expectedElementIds],
    elements: scope.elements.map((entry) => ({ ...entry, baseline: { ...entry.baseline }, allowedOps: [...entry.allowedOps], lockedOps: [...entry.lockedOps] })),
  }));
}

export function m80EditorAttributes(id) {
  const entry = getM80RegistryEntry(id);
  if (!entry) throw new Error(`Nicht registrierte M80-ID: ${id}`);
  return Object.freeze({
    "data-ui-inspector-id": entry.id,
    "data-ui-editor-kind": entry.type,
    "data-ui-editor-label": entry.name,
    "data-ui-editor-parent": entry.parentId || "",
    "data-ui-editor-editable": String(entry.editable),
    "data-ui-editor-ops": entry.allowedOps.join(","),
  });
}
