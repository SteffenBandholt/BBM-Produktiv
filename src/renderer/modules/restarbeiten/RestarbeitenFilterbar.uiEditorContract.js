import {
  FIELD_LAYOUT,
  GROUP_LAYOUT,
  TEXT_LAYOUT,
  ZONE_HEIGHT_LAYOUT,
  m83Component,
  m83DomainButton,
  m83Element,
  m83Slot,
} from "../../ui-editor/m83ComponentContract.js";

const scopeId = "restarbeiten.header.root";
const elements = [
  m83Element({ id: scopeId, name: "Kopf- und Filterbereich Restarbeiten", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: ZONE_HEIGHT_LAYOUT, componentKind: "fixedHeader", baseline: { width: 1180, height: 102, minWidth: 640, maxWidth: 2400, minHeight: 56, maxHeight: 220 } }),
  m83Element({ id: "restarbeiten.filterbar", name: "Filterkopf Restarbeiten", type: "area", role: "layout", parentId: scopeId, order: 10, allowedOps: GROUP_LAYOUT, componentKind: "filterbar", baseline: { width: 1092, height: 72, minWidth: 560, maxWidth: 2200, minHeight: 48, maxHeight: 220 } }),
  m83Element({ id: "restarbeiten.filterbar.group.location", name: "Gruppe Verortungsfilter", type: "group", role: "layoutGroup", parentId: "restarbeiten.filterbar", order: 20, allowedOps: GROUP_LAYOUT, componentKind: "filterGroup" }),
  ...[1, 2, 3, 4].flatMap((level, index) => [
    m83Element({ id: `restarbeiten.filterbar.location.level${level}`, name: `Gruppe Verortung L${level}`, type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.filterbar.group.location", order: 21 + index * 3, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
    m83Element({ id: `restarbeiten.filterbar.location.level${level}.label`, name: `Verortung L${level} · Bezeichnung`, type: "label", role: "fieldLabel", parentId: `restarbeiten.filterbar.location.level${level}`, order: 22 + index * 3, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    m83Element({ id: `restarbeiten.filterbar.location.level${level}.field`, name: `Eingabefeld Verortung L${level}`, type: "field", role: "dataFieldLayout", parentId: `restarbeiten.filterbar.location.level${level}`, order: 23 + index * 3, allowedOps: FIELD_LAYOUT, fieldKind: "select", componentKind: "select" }),
  ]),
  m83Element({ id: "restarbeiten.filterbar.group.class", name: "Gruppe Klassenfilter", type: "group", role: "layoutGroup", parentId: "restarbeiten.filterbar", order: 40, allowedOps: GROUP_LAYOUT, componentKind: "buttonGroup" }),
  m83DomainButton({ id: "restarbeiten.filterbar.class.all", name: "Klasse · Alle", parentId: "restarbeiten.filterbar.group.class", order: 41, actionKind: "domainFilter" }),
  m83DomainButton({ id: "restarbeiten.filterbar.class.rest", name: "Klasse · Rest", parentId: "restarbeiten.filterbar.group.class", order: 42, actionKind: "domainFilter" }),
  m83DomainButton({ id: "restarbeiten.filterbar.class.defect", name: "Klasse · Mangel", parentId: "restarbeiten.filterbar.group.class", order: 43, actionKind: "domainFilter" }),
  m83Element({ id: "restarbeiten.filterbar.group.meta", name: "Gruppe Status- und Zuordnungsfilter", type: "group", role: "layoutGroup", parentId: "restarbeiten.filterbar", order: 50, allowedOps: GROUP_LAYOUT, componentKind: "filterGroup" }),
  ...[["status", "Status", "select"], ["dueDate", "Fertig bis", "date"], ["responsible", "Verantwortlich", "select"]].flatMap(([key, name, fieldKind], index) => [
    m83Element({ id: `restarbeiten.filterbar.meta.${key}`, name: `Gruppe ${name}`, type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.filterbar.group.meta", order: 51 + index * 3, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
    m83Element({ id: `restarbeiten.filterbar.meta.${key}.label`, name: `${name} · Bezeichnung`, type: "label", role: "fieldLabel", parentId: `restarbeiten.filterbar.meta.${key}`, order: 52 + index * 3, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    m83Element({ id: `restarbeiten.filterbar.meta.${key}.field`, name: `Eingabefeld ${name}`, type: "field", role: "dataFieldLayout", parentId: `restarbeiten.filterbar.meta.${key}`, order: 53 + index * 3, allowedOps: FIELD_LAYOUT, fieldKind, componentKind: fieldKind === "date" ? "dateInput" : "select" }),
  ]),
  m83Element({ id: "restarbeiten.filterbar.actions", name: "Gruppe Header-Aktionen", type: "group", role: "layoutGroup", parentId: "restarbeiten.filterbar", order: 70, allowedOps: GROUP_LAYOUT, componentKind: "actionGroup" }),
  m83DomainButton({ id: "restarbeiten.filterbar.action.close", name: "Schließen", parentId: "restarbeiten.filterbar.actions", order: 71, actionKind: "domainNavigation" }),
];

export const RESTARBEITEN_FILTERBAR_REQUIRED_SLOTS = Object.freeze(elements.map((entry) => entry.id));
export const restarbeitenFilterbarUiEditorContract = m83Component({
  componentId: "bbm.restarbeiten.filterbar",
  scopeId,
  requiredSlots: RESTARBEITEN_FILTERBAR_REQUIRED_SLOTS,
  slots: elements.map((entry) => m83Slot(entry.id, entry, {
    requirements: { textResize: entry.type === "label", move: entry.allowedOps.includes("move") },
  })),
});
