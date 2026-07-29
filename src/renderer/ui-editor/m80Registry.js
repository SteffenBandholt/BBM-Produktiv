export const BBM_M80_REGISTRY_VERSION = 6;
export const BBM_M80_REGISTRY_STATUS = "incomplete";

const GROUP_LAYOUT = Object.freeze(["move", "setVisibility"]);
const ZONE_HEIGHT_LAYOUT = Object.freeze(["resizeHeight", "setVisibility"]);
const TEXT_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "textResize", "setVisibility"]);
const FIELD_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "textResize", "setVisibility"]);
const BUTTON_LAYOUT = Object.freeze(["move", "resizeWidth", "resizeHeight", "setVisibility"]);
const ICON_LAYOUT = Object.freeze(["resizeWidth", "resizeHeight", "setVisibility"]);
const TABLE_LAYOUT = Object.freeze(["resizeHeight", "setVisibility", "fitTableToViewport", "resizeColumnsProportionally", "setHorizontalOverflowMode", "setRowHeightMode", "resetTable"]);
const COLUMN_LAYOUT = Object.freeze(["resizeWidth", "textResize", "setVisibility", "setColumnWidthMode", "setColumnWrapMode", "setColumnOverflowMode", "resetTableColumn"]);
const SPACING_LAYOUT = Object.freeze(["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"]);
const DOMAIN_LOCKS = Object.freeze(["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"]);

function defaultBaseline(values = {}) {
  return Object.freeze({
    x: 0, y: 0, width: 100, height: 24, textOffsetX: 0, textOffsetY: 0,
    fontSize: 12, visible: true, spacing: {}, minWidth: 8, maxWidth: 2400, minHeight: 8, maxHeight: 1600,
    ...values,
  });
}

function element(values) {
  const allowedOps = Object.freeze([...(values.allowedOps || [])]);
  const selectionKind = values.selectionKind || ({
    root: "layoutZone", area: "layoutZone", group: "group", fieldGroup: "group",
    label: values.role === "status" ? "statusText" : "label", field: "field", button: "button",
    componentPart: "icon", statusIndicator: "icon", table: "table", tableHeader: "tableHeader",
    tableBody: "tableBody", tableRow: "tableRow", tableColumn: "column", tableHeaderCell: "tableHeaderCell",
    tableDataCell: "tableDataCell", tableFooter: "tableFooter", tableViewport: "tableViewport",
    horizontalScrollArea: "horizontalScrollArea",
  }[values.type] || "element");
  return Object.freeze({
    visible: true,
    editable: allowedOps.length > 0,
    ...values,
    semanticKey: values.semanticKey || values.id,
    registrationStatus: values.registrationStatus || (allowedOps.length > 0 ? "editorEnabled" : "editorContainer"),
    refKey: values.refKey || values.id,
    baseline: defaultBaseline(values.baseline),
    selectionKind,
    selectionLevels: Object.freeze([...(values.selectionLevels || [selectionKind])]),
    spacingTargets: Object.freeze([...(values.spacingTargets || [])]),
    operationEffects: Object.freeze({
      ...Object.fromEntries(allowedOps.map((operation) => [operation,
        selectionKind === "group" ? "groupWithChildren" : selectionKind === "layoutZone" ? "layoutZone" : "elementOnly"])),
      ...(values.operationEffects || {}),
    }),
    operationAffectedIds: Object.freeze({ ...(values.operationAffectedIds || {}) }),
    geometry: Object.freeze({ maximumOffset: 80, maximumStoredOffset: 2400, ...(values.geometry || {}) }),
    allowedOps,
    lockedOps: Object.freeze([...(values.lockedOps || [])]),
  });
}

function domainButton(values) {
  return element({ ...values, type: "button", role: "domainActionLayout", allowedOps: BUTTON_LAYOUT, lockedOps: DOMAIN_LOCKS, actionKind: values.actionKind || "domain" });
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

const headerElements = [
  element({ id: "restarbeiten.header.root", name: "Kopf- und Filterbereich Restarbeiten", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: ZONE_HEIGHT_LAYOUT, componentKind: "fixedHeader", baseline: { width: 1180, height: 102, minWidth: 640, maxWidth: 2400, minHeight: 56, maxHeight: 220 } }),
  element({ id: "restarbeiten.filterbar", name: "Filterkopf Restarbeiten", type: "area", role: "layout", parentId: "restarbeiten.header.root", order: 10, allowedOps: GROUP_LAYOUT, componentKind: "filterbar", baseline: { width: 1092, height: 72, minWidth: 560, maxWidth: 2200, minHeight: 48, maxHeight: 220 } }),
  element({ id: "restarbeiten.filterbar.group.location", name: "Gruppe Verortungsfilter", type: "group", role: "layoutGroup", parentId: "restarbeiten.filterbar", order: 20, allowedOps: GROUP_LAYOUT, componentKind: "filterGroup" }),
  ...[1, 2, 3, 4].flatMap((level, index) => [
    element({ id: `restarbeiten.filterbar.location.level${level}`, name: `Gruppe Verortung L${level}`, type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.filterbar.group.location", order: 21 + index * 3, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
    element({ id: `restarbeiten.filterbar.location.level${level}.label`, name: `Verortung L${level} · Bezeichnung`, type: "label", role: "fieldLabel", parentId: `restarbeiten.filterbar.location.level${level}`, order: 22 + index * 3, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    element({ id: `restarbeiten.filterbar.location.level${level}.field`, name: `Eingabefeld Verortung L${level}`, type: "field", role: "dataFieldLayout", parentId: `restarbeiten.filterbar.location.level${level}`, order: 23 + index * 3, allowedOps: FIELD_LAYOUT, fieldKind: "select", componentKind: "select" }),
  ]),
  element({ id: "restarbeiten.filterbar.group.class", name: "Gruppe Klassenfilter", type: "group", role: "layoutGroup", parentId: "restarbeiten.filterbar", order: 40, allowedOps: GROUP_LAYOUT, componentKind: "buttonGroup" }),
  domainButton({ id: "restarbeiten.filterbar.class.all", name: "Klasse · Alle", parentId: "restarbeiten.filterbar.group.class", order: 41, actionKind: "domainFilter" }),
  domainButton({ id: "restarbeiten.filterbar.class.rest", name: "Klasse · Rest", parentId: "restarbeiten.filterbar.group.class", order: 42, actionKind: "domainFilter" }),
  domainButton({ id: "restarbeiten.filterbar.class.defect", name: "Klasse · Mangel", parentId: "restarbeiten.filterbar.group.class", order: 43, actionKind: "domainFilter" }),
  element({ id: "restarbeiten.filterbar.group.meta", name: "Gruppe Status- und Zuordnungsfilter", type: "group", role: "layoutGroup", parentId: "restarbeiten.filterbar", order: 50, allowedOps: GROUP_LAYOUT, componentKind: "filterGroup" }),
  ...[
    ["status", "Status", "select"],
    ["dueDate", "Fertig bis", "date"],
    ["responsible", "Verantwortlich", "select"],
  ].flatMap(([key, name, fieldKind], index) => [
    element({ id: `restarbeiten.filterbar.meta.${key}`, name: `Gruppe ${name}`, type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.filterbar.group.meta", order: 51 + index * 3, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
    element({ id: `restarbeiten.filterbar.meta.${key}.label`, name: `${name} · Bezeichnung`, type: "label", role: "fieldLabel", parentId: `restarbeiten.filterbar.meta.${key}`, order: 52 + index * 3, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    element({ id: `restarbeiten.filterbar.meta.${key}.field`, name: `Eingabefeld ${name}`, type: "field", role: "dataFieldLayout", parentId: `restarbeiten.filterbar.meta.${key}`, order: 53 + index * 3, allowedOps: FIELD_LAYOUT, fieldKind, componentKind: fieldKind === "date" ? "dateInput" : "select" }),
  ]),
  element({ id: "restarbeiten.filterbar.actions", name: "Gruppe Header-Aktionen", type: "group", role: "layoutGroup", parentId: "restarbeiten.filterbar", order: 70, allowedOps: GROUP_LAYOUT, componentKind: "actionGroup" }),
  domainButton({ id: "restarbeiten.filterbar.action.close", name: "Schließen", parentId: "restarbeiten.filterbar.actions", order: 71, actionKind: "domainNavigation" }),
];

const listTableColumns = Object.freeze([
  Object.freeze({
    columnId: "restarbeiten.list.table.number", displayName: "Nr. / Datum / Klasse / Fotos",
    headerElementId: "restarbeiten.list.table.number.header", dataCellTemplateId: "restarbeiten.list.table.number.cells",
    cellElementIds: Object.freeze([]), currentWidth: 82, minimumWidth: 50, maximumWidth: 240, widthMode: "fixed",
    resizable: true, wrapMode: "noWrap", overflowMode: "clip", alignment: "stretch", visibility: true,
    order: 1, lockedOps: Object.freeze([...DOMAIN_LOCKS]), widthSourceId: "restarbeiten.list.table.number", flexible: false, priority: 10,
  }),
  Object.freeze({
    columnId: "restarbeiten.list.table.subject", displayName: "Gegenstand – Verortung / Kurztext / Langtext",
    headerElementId: "restarbeiten.list.table.subject.header", dataCellTemplateId: "restarbeiten.list.table.subject.cells",
    cellElementIds: Object.freeze([]), currentWidth: 560, minimumWidth: 160, maximumWidth: 1200, widthMode: "proportional",
    resizable: true, wrapMode: "wordWrap", overflowMode: "clip", alignment: "stretch", visibility: true,
    order: 2, lockedOps: Object.freeze([...DOMAIN_LOCKS]), widthSourceId: "restarbeiten.list.table.subject", flexible: true, priority: 100,
  }),
  Object.freeze({
    columnId: "restarbeiten.list.table.meta", displayName: "Fertig bis / Ampel / Status / Verantwortlich",
    headerElementId: "restarbeiten.list.table.meta.header", dataCellTemplateId: "restarbeiten.list.table.meta.cells",
    cellElementIds: Object.freeze([]), currentWidth: 172, minimumWidth: 110, maximumWidth: 420, widthMode: "fixed",
    resizable: true, wrapMode: "wordWrap", overflowMode: "clip", alignment: "stretch", visibility: true,
    order: 3, lockedOps: Object.freeze([...DOMAIN_LOCKS]), widthSourceId: "restarbeiten.list.table.meta", flexible: false, priority: 20,
  }),
]);

const listTableLayout = Object.freeze({
  tableId: "restarbeiten.list.table", displayName: "Restarbeiten-Hauptliste",
  bounds: Object.freeze({ left: 0, top: 0, width: 858, height: 680 }),
  viewportBounds: Object.freeze({ left: 0, top: 0, width: 858, height: 680 }),
  contentBounds: Object.freeze({ left: 0, top: 0, width: 858, height: 680 }),
  parentId: "restarbeiten.list.scrollArea",
  columnIds: Object.freeze(listTableColumns.map((column) => column.columnId)),
  rowTemplateId: "restarbeiten.list.table.row", horizontalOverflowMode: "auto", verticalOverflowMode: "auto",
  widthPolicy: "bounded", minimumWidth: 320, maximumWidth: 1600, reservedWidth: 44, scrollbarWidth: 0,
  rowHeightMode: "bounded", minimumRowHeight: 54, maximumRowHeight: 180, columns: listTableColumns,
});

function tableBinding(columnId, part) {
  return Object.freeze({ tableId: "restarbeiten.list.table", columnId, widthSourceId: columnId, part });
}

const listElements = [
  element({ id: "restarbeiten.list.root", name: "Restarbeiten · Liste", type: "root", role: "scopeRoot", parentId: null, order: 0, editable: false, allowedOps: [], componentKind: "scope" }),
  element({ id: "restarbeiten.list.area", name: "Restarbeiten-Liste", type: "area", role: "contentArea", parentId: "restarbeiten.list.root", order: 10, allowedOps: GROUP_LAYOUT, componentKind: "contentArea", baseline: { width: 900, height: 420, minWidth: 320, minHeight: 180 } }),
  element({ id: "restarbeiten.list.paper", name: "Gruppe Listenblatt", type: "group", role: "layoutGroup", parentId: "restarbeiten.list.area", order: 20, allowedOps: GROUP_LAYOUT, componentKind: "paper", baseline: { width: 900, height: 720, minWidth: 320, minHeight: 240 } }),
  element({ id: "restarbeiten.list.viewport", name: "Sichtbarer Inhaltsbereich der Restarbeiten-Liste", type: "tableViewport", role: "tableViewport", parentId: "restarbeiten.list.paper", order: 21, allowedOps: [], componentKind: "tableViewport" }),
  element({ id: "restarbeiten.list.scrollArea", name: "Horizontaler Scrollbereich der Restarbeiten-Liste", type: "horizontalScrollArea", role: "horizontalScrollArea", parentId: "restarbeiten.list.viewport", order: 22, allowedOps: [], componentKind: "scrollArea" }),
  element({ id: "restarbeiten.list.table", name: "Restarbeiten-Hauptliste", type: "table", role: "contentTable", parentId: "restarbeiten.list.scrollArea", order: 30, allowedOps: TABLE_LAYOUT, componentKind: "contentTable", tableLayout: listTableLayout, baseline: { width: 858, height: 680, minWidth: 320, maxWidth: 1600, minHeight: 160, maxHeight: 12000 } }),
  ...listTableColumns.map((column, index) => element({ id: column.columnId, name: column.displayName, type: "tableColumn", role: index === 2 ? "metaColumn" : "contentColumn", parentId: "restarbeiten.list.table", order: 31 + index, allowedOps: COLUMN_LAYOUT, columnRole: index === 2 ? "metaColumn" : "contentColumn", tableColumnLayout: column, tableBinding: tableBinding(column.columnId, "column"), baseline: { width: column.currentWidth, height: 28, minWidth: column.minimumWidth, maxWidth: column.maximumWidth } })),
  element({ id: "restarbeiten.list.table.header", name: "Tabellenkopf der Restarbeiten-Liste", type: "tableHeader", role: "tableHeader", parentId: "restarbeiten.list.table", order: 40, allowedOps: [], componentKind: "tableHeader" }),
  element({ id: "restarbeiten.list.table.body", name: "Datenbereich der Restarbeiten-Liste", type: "tableBody", role: "tableBody", parentId: "restarbeiten.list.table", order: 50, allowedOps: [], componentKind: "tableBody" }),
  element({ id: "restarbeiten.list.table.row", name: "Restarbeiten-Zeile", type: "tableRow", role: "tableRow", parentId: "restarbeiten.list.table.body", order: 51, allowedOps: [], componentKind: "rowTemplate", rowLayout: { heightMode: "bounded", minimumHeight: 54, maximumHeight: 180 } }),
  ...listTableColumns.flatMap((column, index) => [
    element({ id: column.headerElementId, name: `${column.displayName} · Überschrift`, type: "tableHeaderCell", role: "tableHeaderCell", parentId: column.columnId, order: 60 + index * 2, allowedOps: [], componentKind: "tableHeaderCell", tableBinding: tableBinding(column.columnId, "header") }),
    element({ id: column.dataCellTemplateId, name: `${column.displayName} · Datenbereich`, type: "tableDataCell", role: "tableDataCell", parentId: column.columnId, order: 61 + index * 2, allowedOps: [], componentKind: "dataCellTemplate", tableBinding: tableBinding(column.columnId, "data") }),
  ]),
];

const editElements = [
  element({ id: "restarbeiten.edit.root", name: "Eingabebereich Restarbeiten", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: ZONE_HEIGHT_LAYOUT, componentKind: "fixedEditArea", baseline: { width: 900, height: 276, minWidth: 320, maxWidth: 1800, minHeight: 190, maxHeight: 520 }, operationEffects: { resizeHeight: "parentReflowRequired" }, operationAffectedIds: { resizeHeight: ["restarbeiten.edit.area", "restarbeiten.list.root"] } }),
  element({ id: "restarbeiten.edit.area", name: "Layoutzone Eingabebereich", type: "area", role: "formArea", parentId: "restarbeiten.edit.root", order: 10, allowedOps: [], componentKind: "formArea", baseline: { width: 878, height: 252, minWidth: 300, minHeight: 160 } }),
  element({ id: "restarbeiten.edit.header", name: "Gruppe Editbox-Kopf", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.area", order: 20, allowedOps: GROUP_LAYOUT, componentKind: "header" }),
  element({ id: "restarbeiten.edit.header.current", name: "Status aktueller Datensatz", type: "label", role: "status", parentId: "restarbeiten.edit.header", order: 21, allowedOps: ["setVisibility"], componentKind: "label" }),
  element({ id: "restarbeiten.edit.fields", name: "Layoutzone Textfelder", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 30, allowedOps: [], componentKind: "fieldCollection", selectionKind: "layoutZone" }),
  element({ id: "restarbeiten.edit.short", name: "Gruppe Kurztext/Gegenstand", type: "group", role: "formFieldGroup", parentId: "restarbeiten.edit.fields", order: 40, allowedOps: [...GROUP_LAYOUT, "resizeWidth", "resizeHeight", ...SPACING_LAYOUT], spacingTargets: ["groupPaddingLeft", "groupPaddingRight", "groupPaddingTop", "groupPaddingBottom", "childGapHorizontal", "childGapVertical"], componentKind: "fieldGroup", baseline: { width: null, height: null, minWidth: 320, maxWidth: 1400, minHeight: 42, maxHeight: 96 } }),
  element({ id: "restarbeiten.edit.short.headerZone", name: "Kopfzeile Kurztext/Gegenstand", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.short", order: 41, allowedOps: SPACING_LAYOUT, spacingTargets: ["groupPaddingLeft", "groupPaddingRight", "groupPaddingTop", "groupPaddingBottom", "childGapHorizontal"], componentKind: "layoutZone", selectionKind: "layoutZone" }),
  element({ id: "restarbeiten.edit.short.label", name: "Bezeichnung Kurztext/Gegenstand", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.short", order: 42, allowedOps: [...TEXT_LAYOUT, ...SPACING_LAYOUT], spacingTargets: ["beforeElement", "afterElement", "reservedWidth"], componentKind: "label", baseline: { width: 150, height: 22, spacing: { reservedWidth: 40 }, minWidth: 74, maxWidth: 190, minHeight: 18, maxHeight: 48 }, operationEffects: { resizeWidth: "parentReflowRequired", resizeHeight: "parentReflowRequired" }, operationAffectedIds: { resizeWidth: ["restarbeiten.edit.short.headerZone", "restarbeiten.edit.short.field"], resizeHeight: ["restarbeiten.edit.short.headerZone", "restarbeiten.edit.short.field"] } }),
  element({ id: "restarbeiten.edit.short.remaining", name: "Restzeichenanzeige Kurztext", type: "label", role: "status", parentId: "restarbeiten.edit.short.headerZone", order: 43, allowedOps: ["setVisibility"], componentKind: "counter" }),
  domainButton({ id: "restarbeiten.edit.short.dictation", name: "Diktatbutton Kurztext", parentId: "restarbeiten.edit.short.headerZone", order: 44, actionKind: "domainDictation", baseline: { width: 22, height: 22, minWidth: 20, maxWidth: 32, minHeight: 20, maxHeight: 32 }, operationEffects: { move: "groupWithChildren" }, operationAffectedIds: { move: ["restarbeiten.edit.short.dictation.icon"] } }),
  element({ id: "restarbeiten.edit.short.dictation.icon", name: "Mikrofonsymbol Kurztext", type: "componentPart", role: "layout", parentId: "restarbeiten.edit.short.dictation", order: 45, allowedOps: ICON_LAYOUT, componentKind: "icon", baseline: { width: 17, height: 17, minWidth: 12, maxWidth: 22, minHeight: 12, maxHeight: 22 } }),
  element({ id: "restarbeiten.edit.class", name: "Gruppe Klasse", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.short.headerZone", order: 46, allowedOps: GROUP_LAYOUT, componentKind: "choiceField" }),
  element({ id: "restarbeiten.edit.class.label", name: "Bezeichnung Klasse", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.class", order: 47, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.class.control", name: "Eingabefeld Klasse", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.class", order: 48, allowedOps: FIELD_LAYOUT, fieldKind: "buttonChoice", componentKind: "choice" }),
  domainButton({ id: "restarbeiten.edit.class.rest", name: "Klasse Rest", parentId: "restarbeiten.edit.class.control", order: 49, actionKind: "domainSelection" }),
  domainButton({ id: "restarbeiten.edit.class.defect", name: "Klasse Mangel", parentId: "restarbeiten.edit.class.control", order: 50, actionKind: "domainSelection" }),
  element({ id: "restarbeiten.edit.short.actions", name: "Weitere Kurztextaktionen", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.short.headerZone", order: 51, allowedOps: GROUP_LAYOUT, componentKind: "actionGroup" }),
  domainButton({ id: "restarbeiten.edit.action.new", name: "Neu", parentId: "restarbeiten.edit.short.actions", order: 52, actionKind: "domainCreate" }),
  domainButton({ id: "restarbeiten.edit.action.delete", name: "Löschen", parentId: "restarbeiten.edit.short.actions", order: 53, actionKind: "domainDelete" }),
  element({ id: "restarbeiten.edit.short.field", name: "Texteingabe Kurztext/Gegenstand", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.short", order: 54, allowedOps: FIELD_LAYOUT, fieldKind: "text", componentKind: "input" }),
  element({ id: "restarbeiten.edit.long", name: "Gruppe Langtext/Beschreibung", type: "group", role: "formFieldGroup", parentId: "restarbeiten.edit.fields", order: 60, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.long.headerZone", name: "Kopfzeile Langtext/Beschreibung", type: "group", role: "layoutGroup", parentId: "restarbeiten.edit.long", order: 61, allowedOps: [], componentKind: "layoutZone", selectionKind: "layoutZone" }),
  element({ id: "restarbeiten.edit.long.label", name: "Bezeichnung Langtext/Beschreibung", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.long", order: 62, allowedOps: TEXT_LAYOUT, componentKind: "label", baseline: { width: 150, height: 22, minWidth: 90, maxWidth: 220, minHeight: 18, maxHeight: 48 }, operationEffects: { resizeWidth: "parentReflowRequired", resizeHeight: "parentReflowRequired" }, operationAffectedIds: { resizeWidth: ["restarbeiten.edit.long.headerZone", "restarbeiten.edit.long.field"], resizeHeight: ["restarbeiten.edit.long.headerZone", "restarbeiten.edit.long.field"] } }),
  element({ id: "restarbeiten.edit.long.remaining", name: "Restzeichenanzeige Langtext", type: "label", role: "status", parentId: "restarbeiten.edit.long.headerZone", order: 63, allowedOps: ["setVisibility"], componentKind: "counter" }),
  domainButton({ id: "restarbeiten.edit.long.dictation", name: "Diktatbutton Langtext", parentId: "restarbeiten.edit.long.headerZone", order: 64, actionKind: "domainDictation", baseline: { width: 22, height: 22, minWidth: 20, maxWidth: 32, minHeight: 20, maxHeight: 32 }, operationEffects: { move: "groupWithChildren" }, operationAffectedIds: { move: ["restarbeiten.edit.long.dictation.icon"] } }),
  element({ id: "restarbeiten.edit.long.dictation.icon", name: "Mikrofonsymbol Langtext", type: "componentPart", role: "layout", parentId: "restarbeiten.edit.long.dictation", order: 65, allowedOps: ICON_LAYOUT, componentKind: "icon", baseline: { width: 17, height: 17, minWidth: 12, maxWidth: 22, minHeight: 12, maxHeight: 22 } }),
  element({ id: "restarbeiten.edit.long.field", name: "Texteingabe Langtext/Beschreibung", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.long", order: 66, allowedOps: FIELD_LAYOUT, fieldKind: "multilineText", componentKind: "textarea" }),
  element({ id: "restarbeiten.edit.location", name: "Gruppe Verortung", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 70, allowedOps: GROUP_LAYOUT, componentKind: "locationGroup" }),
  ...[1, 2, 3, 4].flatMap((level, index) => [
    element({ id: `restarbeiten.edit.location.${level}`, name: `Gruppe Verortung L${level}`, type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.location", order: 71 + index * 3, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
    element({ id: `restarbeiten.edit.location.${level}.label`, name: `Bezeichnung Verortung L${level}`, type: "label", role: "fieldLabel", parentId: `restarbeiten.edit.location.${level}`, order: 72 + index * 3, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
    element({ id: `restarbeiten.edit.location.${level}.field`, name: `Eingabefeld Verortung L${level}`, type: "field", role: "dataFieldLayout", parentId: `restarbeiten.edit.location.${level}`, order: 73 + index * 3, allowedOps: FIELD_LAYOUT, fieldKind: "text", componentKind: "input" }),
  ]),
  element({ id: "restarbeiten.edit.meta", name: "Gruppe Status und Zuordnung", type: "group", role: "fieldCollection", parentId: "restarbeiten.edit.area", order: 90, allowedOps: GROUP_LAYOUT, componentKind: "metaGroup" }),
  element({ id: "restarbeiten.edit.meta.status", name: "Gruppe Status", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.meta", order: 91, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.meta.status.label", name: "Bezeichnung Status", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.meta.status", order: 92, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.meta.status.field", name: "Eingabefeld Status", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.meta.status", order: 93, allowedOps: FIELD_LAYOUT, fieldKind: "select", componentKind: "select" }),
  element({ id: "restarbeiten.edit.meta.due", name: "Gruppe Fertig bis", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.meta", order: 94, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.meta.due.label", name: "Bezeichnung Fertig bis", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.meta.due", order: 95, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.meta.due.field", name: "Eingabefeld Fertig bis", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.meta.due", order: 96, allowedOps: FIELD_LAYOUT, fieldKind: "date", componentKind: "dateInput" }),
  element({ id: "restarbeiten.edit.meta.ampel", name: "Statussymbol Ampel", type: "statusIndicator", role: "status", parentId: "restarbeiten.edit.meta", order: 97, allowedOps: ICON_LAYOUT, componentKind: "statusIndicator" }),
  element({ id: "restarbeiten.edit.meta.responsible", name: "Gruppe Verantwortlich", type: "fieldGroup", role: "formFieldGroup", parentId: "restarbeiten.edit.meta", order: 98, allowedOps: GROUP_LAYOUT, componentKind: "fieldGroup" }),
  element({ id: "restarbeiten.edit.meta.responsible.label", name: "Bezeichnung Verantwortlich", type: "label", role: "fieldLabel", parentId: "restarbeiten.edit.meta.responsible", order: 99, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  element({ id: "restarbeiten.edit.meta.responsible.field", name: "Eingabefeld Verantwortlich", type: "field", role: "dataFieldLayout", parentId: "restarbeiten.edit.meta.responsible", order: 100, allowedOps: FIELD_LAYOUT, fieldKind: "select", componentKind: "select" }),
  element({ id: "restarbeiten.edit.validation", name: "Status Pflichtfeldhinweis", type: "label", role: "status", parentId: "restarbeiten.edit.meta", order: 101, allowedOps: ["setVisibility"], componentKind: "validation" }),
  domainButton({ id: "restarbeiten.edit.action.note", name: "Notizbutton", parentId: "restarbeiten.edit.meta", order: 102, actionKind: "domainNote" }),
];

export const BBM_M80_ACTIVE_SCOPES = Object.freeze([
  "restarbeiten.header.root",
  "restarbeiten.list.root",
  "restarbeiten.edit.root",
]);

export const BBM_M80_REGISTRY_SCOPES = Object.freeze([
  completeScope("restarbeiten.header.root", headerElements),
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
  blockedScope("restarbeiten.layout.root", "Restarbeiten · technischer Alt-Layoutcontainer", "M80_2_split_removed"),
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
    elements: scope.elements.map((entry) => ({ ...entry, baseline: { ...entry.baseline, spacing: { ...(entry.baseline?.spacing || {}) } }, spacingTargets: [...(entry.spacingTargets || [])], allowedOps: [...entry.allowedOps], lockedOps: [...entry.lockedOps] })),
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
