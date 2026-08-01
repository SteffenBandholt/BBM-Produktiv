import {
  FIELD_LAYOUT,
  GROUP_LAYOUT,
  ICON_LAYOUT,
  TEXT_LAYOUT,
  ZONE_HEIGHT_LAYOUT,
  m83Component,
  m83Element,
  m83Slot,
} from "../../ui-editor/m83ComponentContract.js";

const scopeId = "protokoll.edit.root";
const groupLayout = Object.freeze(["move", "resizeWidth", "resizeHeight"]);
const elements = [
  m83Element({ id: scopeId, name: "Protokoll-Eingabebereich", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: ZONE_HEIGHT_LAYOUT, componentKind: "fixedEditArea", baseline: { width: 940, height: 300, minWidth: 320, maxWidth: 1880, minHeight: 160, maxHeight: 720 } }),
  m83Element({ id: "protokoll.edit.canvas", name: "Protokoll-Eingabefläche", type: "area", role: "formArea", parentId: scopeId, order: 10, allowedOps: [], componentKind: "editCanvas" }),
  m83Element({ id: "protokoll.edit.workbench", name: "Gruppe TOP-Bearbeitung", type: "group", role: "layoutGroup", parentId: "protokoll.edit.canvas", order: 20, allowedOps: groupLayout, componentKind: "workbench" }),
  m83Element({ id: "protokoll.edit.header", name: "Gruppe TOP-Bearbeitungskopf", type: "group", role: "layoutGroup", parentId: "protokoll.edit.workbench", order: 30, allowedOps: GROUP_LAYOUT, componentKind: "header" }),
  m83Element({ id: "protokoll.edit.header.label", name: "Bezeichnung TOP bearbeiten", type: "label", role: "fieldLabel", parentId: "protokoll.edit.header", order: 31, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  m83Element({ id: "protokoll.edit.text", name: "Gruppe Textbearbeitung", type: "group", role: "fieldCollection", parentId: "protokoll.edit.workbench", order: 40, allowedOps: groupLayout, componentKind: "editbox" }),
  ...[["short", "Kurztext", "text", 41], ["long", "Langtext", "multilineText", 50]].flatMap(([key, name, fieldKind, order]) => [
    m83Element({ id: `protokoll.edit.${key}`, name: `Gruppe ${name}`, type: "fieldGroup", role: "formFieldGroup", parentId: "protokoll.edit.text", order, allowedOps: groupLayout, componentKind: "fieldGroup" }),
    m83Element({ id: `protokoll.edit.${key}.label`, name: `Bezeichnung ${name}`, type: "label", role: "fieldLabel", parentId: `protokoll.edit.${key}`, order: order + 1, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    m83Element({ id: `protokoll.edit.${key}.field`, name: `Eingabefeld ${name}`, type: "field", role: "dataFieldLayout", parentId: `protokoll.edit.${key}`, order: order + 2, allowedOps: FIELD_LAYOUT, fieldKind, componentKind: fieldKind === "text" ? "input" : "textarea" }),
  ]),
  m83Element({ id: "protokoll.edit.meta", name: "Gruppe Status und Zuordnung", type: "group", role: "fieldCollection", parentId: "protokoll.edit.workbench", order: 60, allowedOps: groupLayout, componentKind: "metaPanel" }),
  m83Element({ id: "protokoll.edit.flags", name: "Gruppe Kennzeichnungen", type: "group", role: "layoutGroup", parentId: "protokoll.edit.meta", order: 61, allowedOps: groupLayout, componentKind: "flagGroup" }),
  ...[["status", "Status", "select", 70], ["due", "Fertig bis", "date", 80], ["responsible", "Verantwortlich", "select", 90]].flatMap(([key, name, fieldKind, order]) => [
    m83Element({ id: `protokoll.edit.${key}`, name: `Gruppe ${name}`, type: "fieldGroup", role: "formFieldGroup", parentId: "protokoll.edit.meta", order, allowedOps: groupLayout, componentKind: "fieldGroup" }),
    m83Element({ id: `protokoll.edit.${key}.label`, name: `Bezeichnung ${name}`, type: "label", role: "fieldLabel", parentId: `protokoll.edit.${key}`, order: order + 1, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    m83Element({ id: `protokoll.edit.${key}.field`, name: `Eingabefeld ${name}`, type: "field", role: "dataFieldLayout", parentId: `protokoll.edit.${key}`, order: order + 2, allowedOps: FIELD_LAYOUT, fieldKind, componentKind: fieldKind === "date" ? "dateInput" : "select" }),
  ]),
  m83Element({ id: "protokoll.edit.ampel", name: "Statussymbol Ampel", type: "statusIndicator", role: "status", parentId: "protokoll.edit.meta", order: 100, allowedOps: ICON_LAYOUT, componentKind: "statusIndicator" }),
];

export const PROTOKOLL_EDIT_REQUIRED_SLOTS = Object.freeze([
  scopeId, "protokoll.edit.canvas", "protokoll.edit.workbench", "protokoll.edit.header", "protokoll.edit.header.label", "protokoll.edit.text",
  "protokoll.edit.short", "protokoll.edit.short.label", "protokoll.edit.short.field",
  "protokoll.edit.long", "protokoll.edit.long.label", "protokoll.edit.long.field",
  "protokoll.edit.meta", "protokoll.edit.flags",
  ...["status", "due", "responsible"].flatMap((key) => [`protokoll.edit.${key}`, `protokoll.edit.${key}.label`, `protokoll.edit.${key}.field`]),
  "protokoll.edit.ampel",
]);

export const protokollEditUiEditorContract = m83Component({
  componentId: "bbm.protokoll.editbox",
  scopeId,
  requiredSlots: PROTOKOLL_EDIT_REQUIRED_SLOTS,
  slots: elements.map((entry) => m83Slot(entry.id, entry, {
    requirements: { textResize: entry.type === "label", move: entry.allowedOps.includes("move") },
  })),
});
