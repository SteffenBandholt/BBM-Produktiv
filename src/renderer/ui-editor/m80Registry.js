const POSITION_SIZE_VISIBILITY = Object.freeze(["move", "resizeWidth", "resizeHeight", "setVisibility"]);
const TEXT_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "textMove", "textResize", "setVisibility"]);
const TABLE_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "textMove", "textResize", "setVisibility"]);
const COLUMN_LAYOUT = Object.freeze(["resizeWidth", "textMove", "textResize", "setVisibility"]);
const DOMAIN_LOCKS = Object.freeze(["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]);

function element(values) {
  return Object.freeze({ visible: true, editable: true, ...values,
    allowedOps: Object.freeze([...(values.allowedOps || [])]),
    lockedOps: Object.freeze([...(values.lockedOps || [])]),
  });
}

const listElements = Object.freeze([
  element({ id: "restarbeiten.list.root", name: "Restarbeiten · Liste", type: "root", role: "scopeRoot", parentId: null, order: 0, editable: false, allowedOps: [], componentKind: "scope" }),
  element({ id: "restarbeiten.list.area", name: "Listenbereich", type: "area", role: "contentArea", parentId: "restarbeiten.list.root", order: 10, allowedOps: POSITION_SIZE_VISIBILITY, componentKind: "contentArea" }),
  element({ id: "restarbeiten.list.paper", name: "Listenblatt", type: "group", role: "layoutGroup", parentId: "restarbeiten.list.area", order: 20, allowedOps: POSITION_SIZE_VISIBILITY, componentKind: "paper" }),
  element({ id: "restarbeiten.list.table", name: "Restarbeiten-Hauptliste", type: "table", role: "contentTable", parentId: "restarbeiten.list.paper", order: 30, allowedOps: TABLE_LAYOUT, componentKind: "contentTable" }),
  element({ id: "restarbeiten.list.table.number", name: "Nr. / Datum / Klasse / Fotos", type: "tableColumn", role: "contentColumn", parentId: "restarbeiten.list.table", order: 31, allowedOps: COLUMN_LAYOUT, columnRole: "contentColumn", width: 82, minWidth: 50, maxWidth: 240 }),
  element({ id: "restarbeiten.list.table.subject", name: "Gegenstand – Verortung / Kurztext / Langtext", type: "tableColumn", role: "contentColumn", parentId: "restarbeiten.list.table", order: 32, allowedOps: COLUMN_LAYOUT, columnRole: "contentColumn", width: 600, minWidth: 160, maxWidth: 1200 }),
  element({ id: "restarbeiten.list.table.meta", name: "Status-Metaspalte – Fertig bis / Ampel / Status / Verantwortlich", type: "tableColumn", role: "metaColumn", parentId: "restarbeiten.list.table", order: 33, allowedOps: COLUMN_LAYOUT, columnRole: "metaColumn", width: 172, minWidth: 110, maxWidth: 420 }),
]);

const editElements = Object.freeze([
  element({ id: "restarbeiten.edit.root", name: "Restarbeiten · Bearbeitung", type: "root", role: "scopeRoot", parentId: null, order: 0, editable: false, allowedOps: [], componentKind: "scope" }),
  element({ id: "restarbeiten.edit.area", name: "Bearbeitungsbereich", type: "area", role: "formArea", parentId: "restarbeiten.edit.root", order: 10, allowedOps: POSITION_SIZE_VISIBILITY, componentKind: "formArea" }),
  element({ id: "restarbeiten.edit.fields", name: "Textfelder", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 20, allowedOps: POSITION_SIZE_VISIBILITY, componentKind: "fieldCollection" }),
  element({ id: "restarbeiten.edit.short", name: "Kurztext-Feldgruppe", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.fields", order: 30, allowedOps: POSITION_SIZE_VISIBILITY, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.short.label", name: "Kurztext / Gegenstand · Bezeichnung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.short", order: 31, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.short.field", name: "Kurztext / Gegenstand · Feld", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.short", order: 32, allowedOps: TEXT_LAYOUT, fieldKind: "text", componentKind: "input" }),
  element({ id: "restarbeiten.edit.long", name: "Langtext-Feldgruppe", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.fields", order: 40, allowedOps: POSITION_SIZE_VISIBILITY, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.long.label", name: "Langtext / Beschreibung · Bezeichnung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.long", order: 41, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.long.field", name: "Langtext / Beschreibung · Feld", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.long", order: 42, allowedOps: TEXT_LAYOUT, fieldKind: "multilineText", componentKind: "textarea" }),
  element({ id: "restarbeiten.edit.action.new", name: "Neu", type: "button", role: "domainActionLayout", parentId: "restarbeiten.edit.area", order: 50, allowedOps: TEXT_LAYOUT, lockedOps: DOMAIN_LOCKS, actionKind: "domainCreate", componentKind: "button" }),
]);

export const BBM_M80_REGISTRY_SCOPES = Object.freeze([
  Object.freeze({ scopeId: "restarbeiten.list.root", elements: listElements }),
  Object.freeze({ scopeId: "restarbeiten.edit.root", elements: editElements }),
]);

const entries = new Map(BBM_M80_REGISTRY_SCOPES.flatMap((scope) => scope.elements).map((entry) => [entry.id, entry]));

export function getM80RegistryEntry(id) { return entries.get(String(id || "")) || null; }
export function listM80RegistryScopes() {
  return BBM_M80_REGISTRY_SCOPES.map((scope) => ({ scopeId: scope.scopeId, elements: scope.elements.map((entry) => ({ ...entry, allowedOps: [...entry.allowedOps], lockedOps: [...entry.lockedOps] })) }));
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
