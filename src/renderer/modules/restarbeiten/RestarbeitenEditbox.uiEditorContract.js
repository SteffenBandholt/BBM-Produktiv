import {
  FIELD_LAYOUT,
  GROUP_LAYOUT,
  ICON_LAYOUT,
  SPACING_LAYOUT,
  TEXT_LAYOUT,
  ZONE_HEIGHT_LAYOUT,
  m83Component,
  m83DomainButton,
  m83Element,
  m83Slot,
} from "../../ui-editor/m83ComponentContract.js";

const scopeId = "restarbeiten.edit.root";
const textGroupLayout = Object.freeze([...GROUP_LAYOUT, "resizeWidth", "resizeHeight", ...SPACING_LAYOUT]);

const elements = [
  m83Element({ id: scopeId, name: "Eingabebereich Restarbeiten", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: ZONE_HEIGHT_LAYOUT, componentKind: "fixedEditArea", baseline: { width: 900, height: 248, minWidth: 320, maxWidth: 1800, minHeight: 190, maxHeight: 480 }, operationEffects: { resizeHeight: "parentReflowRequired" }, operationAffectedIds: { resizeHeight: ["restarbeiten.edit.area", "restarbeiten.list.root"] } }),
  m83Element({ id: "restarbeiten.edit.area", name: "Layoutzone Eingabebereich", type: "area", role: "formArea", parentId: scopeId, order: 10, allowedOps: [], componentKind: "formArea", baseline: { width: 878, height: 224, minWidth: 300, minHeight: 160 } }),
  m83Element({ id: "restarbeiten.edit.header", name: "Gruppe Editbox-Kopf", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.area", order: 20, allowedOps: GROUP_LAYOUT, componentKind: "header" }),
  m83Element({ id: "restarbeiten.edit.header.current", name: "Status aktueller Datensatz", type: "label", role: "status", parentId: "restarbeiten.edit.header", order: 21, allowedOps: ["setVisibility"], componentKind: "label" }),
  m83Element({ id: "restarbeiten.edit.fields", name: "Layoutzone Textfelder", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 30, allowedOps: [], componentKind: "fieldCollection", selectionKind: "layoutZone" }),

  m83Element({ id: "restarbeiten.edit.short", name: "Gruppe Kurztext/Gegenstand", type: "group", role: "formFieldGroup", parentId: "restarbeiten.edit.fields", order: 40, allowedOps: textGroupLayout, spacingTargets: ["groupPaddingLeft", "groupPaddingRight", "groupPaddingTop", "groupPaddingBottom", "childGapHorizontal", "childGapVertical"], componentKind: "fieldGroup", baseline: { width: null, height: null, minWidth: 320, maxWidth: 1400, minHeight: 42, maxHeight: 96 } }),
  m83Element({ id: "restarbeiten.edit.short.headerZone", name: "Kopfzeile Kurztext/Gegenstand", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.short", order: 41, allowedOps: SPACING_LAYOUT, spacingTargets: ["groupPaddingLeft", "groupPaddingRight", "groupPaddingTop", "groupPaddingBottom", "childGapHorizontal"], componentKind: "layoutZone", selectionKind: "layoutZone" }),
  m83Element({ id: "restarbeiten.edit.short.label", name: "Bezeichnung Kurztext/Gegenstand", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.short", order: 42, allowedOps: [...TEXT_LAYOUT, ...SPACING_LAYOUT], spacingTargets: ["beforeElement", "afterElement", "reservedWidth"], componentKind: "label", baseline: { width: 150, height: 22, spacing: { reservedWidth: 40 }, minWidth: 74, maxWidth: 190, minHeight: 18, maxHeight: 48 }, operationEffects: { resizeWidth: "parentReflowRequired", resizeHeight: "parentReflowRequired" }, operationAffectedIds: { resizeWidth: ["restarbeiten.edit.short.headerZone", "restarbeiten.edit.short.field"], resizeHeight: ["restarbeiten.edit.short.headerZone", "restarbeiten.edit.short.field"] } }),
  m83Element({ id: "restarbeiten.edit.short.remaining", name: "Restzeichenanzeige Kurztext", type: "label", role: "status", parentId: "restarbeiten.edit.short.headerZone", order: 43, allowedOps: ["move", "textResize", "setVisibility"], componentKind: "counter", baseline: { fontSize: 8.667, minFontSize: 6, maxFontSize: 10 } }),
  m83DomainButton({ id: "restarbeiten.edit.short.dictation", name: "Diktatbutton Kurztext", parentId: "restarbeiten.edit.short.headerZone", order: 44, actionKind: "domainDictation", baseline: { width: 22, height: 22, minWidth: 20, maxWidth: 32, minHeight: 20, maxHeight: 32 }, operationEffects: { move: "groupWithChildren" }, operationAffectedIds: { move: ["restarbeiten.edit.short.dictation.icon"] } }),
  m83Element({ id: "restarbeiten.edit.short.dictation.icon", name: "Mikrofonsymbol Kurztext", type: "componentPart", role: "layout", parentId: "restarbeiten.edit.short.dictation", order: 45, allowedOps: ICON_LAYOUT, componentKind: "icon", baseline: { width: 17, height: 17, minWidth: 12, maxWidth: 22, minHeight: 12, maxHeight: 22 } }),
  m83Element({ id: "restarbeiten.edit.class", name: "Gruppe Klasse", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.short.headerZone", order: 46, allowedOps: GROUP_LAYOUT, componentKind: "choiceField" }),
  m83Element({ id: "restarbeiten.edit.class.label", name: "Bezeichnung Klasse", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.class", order: 47, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  m83Element({ id: "restarbeiten.edit.class.control", name: "Eingabefeld Klasse", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.class", order: 48, allowedOps: FIELD_LAYOUT, fieldKind: "buttonChoice", componentKind: "choice" }),
  m83DomainButton({ id: "restarbeiten.edit.class.rest", name: "Klasse Rest", parentId: "restarbeiten.edit.class.control", order: 49, actionKind: "domainSelection" }),
  m83DomainButton({ id: "restarbeiten.edit.class.defect", name: "Klasse Mangel", parentId: "restarbeiten.edit.class.control", order: 50, actionKind: "domainSelection" }),
  m83Element({ id: "restarbeiten.edit.short.actions", name: "Weitere Kurztextaktionen", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.short.headerZone", order: 51, allowedOps: GROUP_LAYOUT, componentKind: "actionGroup" }),
  m83DomainButton({ id: "restarbeiten.edit.action.new", name: "Neu", parentId: "restarbeiten.edit.short.actions", order: 52, actionKind: "domainCreate" }),
  m83DomainButton({ id: "restarbeiten.edit.action.delete", name: "Löschen", parentId: "restarbeiten.edit.short.actions", order: 53, actionKind: "domainDelete" }),
  m83Element({ id: "restarbeiten.edit.short.field", name: "Texteingabe Kurztext/Gegenstand", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.short", order: 54, allowedOps: FIELD_LAYOUT, fieldKind: "text", componentKind: "input" }),

  m83Element({ id: "restarbeiten.edit.long", name: "Gruppe Langtext/Beschreibung", type: "group", role: "formFieldGroup", parentId: "restarbeiten.edit.fields", order: 60, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
  m83Element({ id: "restarbeiten.edit.long.headerZone", name: "Kopfzeile Langtext/Beschreibung", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.long", order: 61, allowedOps: [], componentKind: "layoutZone", selectionKind: "layoutZone" }),
  m83Element({ id: "restarbeiten.edit.long.label", name: "Bezeichnung Langtext/Beschreibung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.long", order: 62, allowedOps: TEXT_LAYOUT, componentKind: "label", baseline: { width: 150, height: 22, minWidth: 90, maxWidth: 220, minHeight: 18, maxHeight: 48 }, operationEffects: { resizeWidth: "parentReflowRequired", resizeHeight: "parentReflowRequired" }, operationAffectedIds: { resizeWidth: ["restarbeiten.edit.long.headerZone", "restarbeiten.edit.long.field"], resizeHeight: ["restarbeiten.edit.long.headerZone", "restarbeiten.edit.long.field"] } }),
  m83Element({ id: "restarbeiten.edit.long.remaining", name: "Restzeichenanzeige Langtext", type: "label", role: "status", parentId: "restarbeiten.edit.long.headerZone", order: 63, allowedOps: ["move", "textResize", "setVisibility"], componentKind: "counter", baseline: { fontSize: 8.667, minFontSize: 6, maxFontSize: 10 } }),
  m83DomainButton({ id: "restarbeiten.edit.long.dictation", name: "Diktatbutton Langtext", parentId: "restarbeiten.edit.long.headerZone", order: 64, actionKind: "domainDictation", baseline: { width: 22, height: 22, minWidth: 20, maxWidth: 32, minHeight: 20, maxHeight: 32 }, operationEffects: { move: "groupWithChildren" }, operationAffectedIds: { move: ["restarbeiten.edit.long.dictation.icon"] } }),
  m83Element({ id: "restarbeiten.edit.long.dictation.icon", name: "Mikrofonsymbol Langtext", type: "componentPart", role: "layout", parentId: "restarbeiten.edit.long.dictation", order: 65, allowedOps: ICON_LAYOUT, componentKind: "icon", baseline: { width: 17, height: 17, minWidth: 12, maxWidth: 22, minHeight: 12, maxHeight: 22 } }),
  m83Element({ id: "restarbeiten.edit.long.field", name: "Texteingabe Langtext/Beschreibung", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.long", order: 66, allowedOps: FIELD_LAYOUT, fieldKind: "multilineText", componentKind: "textarea" }),

  m83Element({ id: "restarbeiten.edit.location", name: "Gruppe Verortung", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 70, allowedOps: GROUP_LAYOUT, componentKind: "locationGroup" }),
  ...[1, 2, 3, 4].flatMap((level, index) => [
    m83Element({ id: `restarbeiten.edit.location.${level}`, name: `Gruppe Verortung L${level}`, type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.location", order: 71 + index * 3, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
    m83Element({ id: `restarbeiten.edit.location.${level}.label`, name: `Bezeichnung Verortung L${level}`, type: "label", role: "fieldLabel", parentId: `restarbeiten.edit.location.${level}`, order: 72 + index * 3, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    m83Element({ id: `restarbeiten.edit.location.${level}.field`, name: `Eingabefeld Verortung L${level}`, type: "field", role: "dataFieldLayout", parentId: `restarbeiten.edit.location.${level}`, order: 73 + index * 3, allowedOps: FIELD_LAYOUT, fieldKind: "text", componentKind: "input" }),
  ]),

  m83Element({ id: "restarbeiten.edit.meta", name: "Gruppe Status und Zuordnung", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 90, allowedOps: GROUP_LAYOUT, componentKind: "metaGroup" }),
  ...[["status", "Status", "select", 91], ["due", "Fertig bis", "date", 94], ["responsible", "Verantwortlich", "select", 98]].flatMap(([key, name, fieldKind, order]) => [
    m83Element({ id: `restarbeiten.edit.meta.${key}`, name: `Gruppe ${name}`, type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.meta", order, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
    m83Element({ id: `restarbeiten.edit.meta.${key}.label`, name: `Bezeichnung ${name}`, type: "label", role: "fieldLabel", parentId: `restarbeiten.edit.meta.${key}`, order: order + 1, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    m83Element({ id: `restarbeiten.edit.meta.${key}.field`, name: `Eingabefeld ${name}`, type: "field", role: "dataFieldLayout", parentId: `restarbeiten.edit.meta.${key}`, order: order + 2, allowedOps: FIELD_LAYOUT, fieldKind, componentKind: fieldKind === "date" ? "dateInput" : "select" }),
  ]),
  m83Element({ id: "restarbeiten.edit.meta.ampel", name: "Statussymbol Ampel", type: "statusIndicator", role: "status", parentId: "restarbeiten.edit.meta", order: 97, allowedOps: ["move", ...ICON_LAYOUT], componentKind: "statusIndicator", baseline: { width: 12, height: 12, minWidth: 7, maxWidth: 48, minHeight: 7, maxHeight: 48 } }),
  m83Element({ id: "restarbeiten.edit.validation", name: "Status Pflichtfeldhinweis", type: "label", role: "status", parentId: "restarbeiten.edit.meta", order: 101, allowedOps: ["setVisibility"], componentKind: "validation" }),
  m83DomainButton({ id: "restarbeiten.edit.action.note", name: "Notizbutton", parentId: "restarbeiten.edit.meta", order: 102, actionKind: "domainNote" }),
];

export const RESTARBEITEN_EDITBOX_REQUIRED_SLOTS = Object.freeze([
  scopeId, "restarbeiten.edit.area", "restarbeiten.edit.header", "restarbeiten.edit.header.current", "restarbeiten.edit.fields",
  "restarbeiten.edit.short", "restarbeiten.edit.short.headerZone", "restarbeiten.edit.short.label", "restarbeiten.edit.short.remaining", "restarbeiten.edit.short.dictation", "restarbeiten.edit.short.dictation.icon",
  "restarbeiten.edit.class", "restarbeiten.edit.class.label", "restarbeiten.edit.class.control", "restarbeiten.edit.class.rest", "restarbeiten.edit.class.defect",
  "restarbeiten.edit.short.actions", "restarbeiten.edit.action.new", "restarbeiten.edit.action.delete", "restarbeiten.edit.short.field",
  "restarbeiten.edit.long", "restarbeiten.edit.long.headerZone", "restarbeiten.edit.long.label", "restarbeiten.edit.long.remaining", "restarbeiten.edit.long.dictation", "restarbeiten.edit.long.dictation.icon", "restarbeiten.edit.long.field",
  "restarbeiten.edit.location",
  ...[1, 2, 3, 4].flatMap((level) => [`restarbeiten.edit.location.${level}`, `restarbeiten.edit.location.${level}.label`, `restarbeiten.edit.location.${level}.field`]),
  "restarbeiten.edit.meta",
  ...["status", "due", "responsible"].flatMap((key) => [`restarbeiten.edit.meta.${key}`, `restarbeiten.edit.meta.${key}.label`, `restarbeiten.edit.meta.${key}.field`]),
  "restarbeiten.edit.meta.ampel", "restarbeiten.edit.validation", "restarbeiten.edit.action.note",
]);

export const restarbeitenEditboxUiEditorContract = m83Component({
  componentId: "bbm.restarbeiten.editbox",
  scopeId,
  requiredSlots: RESTARBEITEN_EDITBOX_REQUIRED_SLOTS,
  slots: elements.map((entry) => m83Slot(entry.id, entry, {
    requirements: { textResize: entry.type === "label" && entry.allowedOps.includes("textResize"), move: entry.allowedOps.includes("move") },
  })),
});
