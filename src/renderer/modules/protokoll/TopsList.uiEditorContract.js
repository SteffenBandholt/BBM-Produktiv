import {
  COMPACT_TEXT_LAYOUT,
  DOMAIN_LOCKS,
  ICON_LAYOUT,
  TABLE_LAYOUT,
  m83Component,
  m83Element,
  m83Slot,
} from "../../ui-editor/m83ComponentContract.js";

const scopeId = "protokoll.list.root";
const columns = Object.freeze([
  Object.freeze({ columnId: "protokoll.list.column.number", displayName: "Struktur links: TOP / Datum / Klasse / Kennzeichnung", headerElementId: "protokoll.list.column.number.header", dataCellTemplateId: "protokoll.list.column.number.cells", cellElementIds: Object.freeze([]), currentWidth: 64, minimumWidth: 48, maximumWidth: 220, widthMode: "fixed", resizable: true, wrapMode: "noWrap", overflowMode: "clip", alignment: "stretch", visibility: true, order: 1, lockedOps: DOMAIN_LOCKS, widthSourceId: "protokoll.list.column.number", flexible: false, priority: 10, cssWidthVariable: "--bbm-ui-editor-tops-list-number-col", role: "contentColumn" }),
  Object.freeze({ columnId: "protokoll.list.column.text", displayName: "Gegenstand Mitte: Kurztext / Langtext", headerElementId: "protokoll.list.column.text.header", dataCellTemplateId: "protokoll.list.column.text.cells", cellElementIds: Object.freeze([]), currentWidth: 650, minimumWidth: 180, maximumWidth: 1400, widthMode: "proportional", resizable: true, wrapMode: "wordWrap", overflowMode: "clip", alignment: "stretch", visibility: true, order: 2, lockedOps: DOMAIN_LOCKS, widthSourceId: "protokoll.list.column.text", flexible: true, priority: 100, cssWidthVariable: "--bbm-ui-editor-tops-list-text-col", role: "contentColumn" }),
  Object.freeze({ columnId: "protokoll.list.column.meta", displayName: "Meta rechts: Fertig bis / Status / Kennzeichnung / Verantwortlich", headerElementId: "protokoll.list.column.meta.header", dataCellTemplateId: "protokoll.list.column.meta.cells", cellElementIds: Object.freeze([]), currentWidth: 172, minimumWidth: 96, maximumWidth: 420, widthMode: "fixed", resizable: true, wrapMode: "wordWrap", overflowMode: "clip", alignment: "stretch", visibility: true, order: 3, lockedOps: DOMAIN_LOCKS, widthSourceId: "protokoll.list.column.meta", flexible: false, priority: 20, cssWidthVariable: "--bbm-ui-editor-tops-list-meta-col", role: "metaColumn" }),
]);

const tableLayout = Object.freeze({
  tableId: "protokoll.list.table",
  displayName: "Protokoll-TOP-Liste",
  bounds: Object.freeze({ left: 0, top: 0, width: 900, height: 680 }),
  viewportBounds: Object.freeze({ left: 0, top: 0, width: 900, height: 680 }),
  contentBounds: Object.freeze({ left: 0, top: 0, width: 900, height: 680 }),
  parentId: "protokoll.list.paper",
  columnIds: Object.freeze(columns.map((column) => column.columnId)),
  rowTemplateId: "protokoll.list.row",
  horizontalOverflowMode: "fitViewport",
  verticalOverflowMode: "none",
  widthPolicy: "bounded",
  minimumWidth: 320,
  maximumWidth: 1600,
  reservedWidth: 14,
  scrollbarWidth: 0,
  rowHeightMode: "bounded",
  minimumRowHeight: 54,
  maximumRowHeight: 180,
  columns,
});

function tableBinding(columnId, part) {
  return Object.freeze({ tableId: "protokoll.list.table", columnId, widthSourceId: columnId, part });
}

function columnElement(column) {
  return m83Element({
    id: column.columnId,
    name: column.displayName,
    type: "tableColumn",
    role: column.role,
    parentId: "protokoll.list.table",
    order: 30 + column.order,
    allowedOps: ["resizeWidth", "setColumnWidthMode", "setColumnWrapMode", "setColumnOverflowMode", "resetTableColumn"],
    lockedOps: DOMAIN_LOCKS,
    columnRole: column.role,
    componentKind: "contentColumn",
    tableColumnLayout: column,
    tableBinding: tableBinding(column.columnId, "column"),
    baseline: {
      width: column.currentWidth,
      height: 54,
      minWidth: column.minimumWidth,
      maxWidth: column.maximumWidth,
      minHeight: 8,
      maxHeight: 180,
    },
  });
}

const elements = [
  m83Element({ id: scopeId, name: "Protokoll-Listenbereich", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: [], componentKind: "sheetScrollOwner" }),
  m83Element({ id: "protokoll.list.canvas", name: "Protokoll-Dokumentflaeche", type: "area", role: "contentArea", parentId: scopeId, order: 10, allowedOps: [], componentKind: "documentCanvas" }),
  m83Element({ id: "protokoll.list.paper", name: "Protokoll-Dokumentblatt", type: "group", role: "layoutGroup", parentId: "protokoll.list.canvas", order: 20, allowedOps: [], componentKind: "documentPaper" }),
  m83Element({ id: "protokoll.list.table", name: "Protokoll-TOP-Liste", type: "table", role: "contentTable", parentId: "protokoll.list.paper", order: 30, allowedOps: TABLE_LAYOUT, componentKind: "contentTable", tableLayout, baseline: { width: 900, height: 680, minWidth: 320, maxWidth: 1600, minHeight: 160, maxHeight: 12000 } }),
  m83Element({ id: "protokoll.list.table.header", name: "Tabellenkopf der Protokoll-TOP-Liste", type: "tableHeader", role: "tableHeader", parentId: "protokoll.list.table", order: 40, allowedOps: [], componentKind: "tableHeader" }),
  m83Element({ id: "protokoll.list.table.body", name: "Datenbereich der Protokoll-TOP-Liste", type: "tableBody", role: "tableBody", parentId: "protokoll.list.table", order: 50, allowedOps: [], componentKind: "tableBody" }),
  ...columns.map(columnElement),
  ...columns.flatMap((column, index) => [
    m83Element({ id: column.headerElementId, name: `${column.displayName} - Ueberschrift`, type: "tableHeaderCell", role: "tableHeaderCell", parentId: column.columnId, order: 41 + index * 2, allowedOps: ["textResize"], componentKind: "tableHeaderCell", tableBinding: tableBinding(column.columnId, "header"), baseline: { fontSize: index === 2 ? 8.667 : 9.733, minFontSize: 6, maxFontSize: 24 } }),
    m83Element({ id: column.dataCellTemplateId, name: `${column.displayName} - Datenbereich`, type: "tableDataCell", role: "tableDataCell", parentId: column.columnId, order: 42 + index * 2, allowedOps: [], componentKind: "dataCellTemplate", tableBinding: tableBinding(column.columnId, "data") }),
  ]),
  m83Element({ id: "protokoll.list.header.due", name: "Fertig bis - Ueberschrift", type: "label", role: "fieldLabel", parentId: "protokoll.list.column.meta.header", order: 44, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "tableHeaderLabel", baseline: { fontSize: 8.667, minFontSize: 6, maxFontSize: 24 } }),
  m83Element({ id: "protokoll.list.header.status", name: "Status - Ueberschrift", type: "label", role: "fieldLabel", parentId: "protokoll.list.column.meta.header", order: 45, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "tableHeaderLabel", baseline: { fontSize: 8.667, minFontSize: 6, maxFontSize: 24 } }),
  m83Element({ id: "protokoll.list.header.responsible", name: "Verantwortlich - Ueberschrift", type: "label", role: "fieldLabel", parentId: "protokoll.list.column.meta.header", order: 46, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "tableHeaderLabel", baseline: { fontSize: 8.667, minFontSize: 6, maxFontSize: 24 } }),
  m83Element({ id: "protokoll.list.row", refKey: "protokoll.list.row", name: "Protokoll-TOP-Zeile", type: "tableRow", role: "tableRow", parentId: "protokoll.list.table.body", order: 60, allowedOps: ["resizeHeight"], componentKind: "rowTemplate", rowLayout: { heightMode: "bounded", minimumHeight: 54, maximumHeight: 180 }, baseline: { height: 54, minHeight: 54, maxHeight: 180 } }),
  m83Element({ id: "protokoll.list.row.level1Toggle", refKey: "protokoll.list.row.level1Toggle", name: "Ebene 1 auf- oder zuklappen", type: "button", role: "navigation", parentId: "protokoll.list.column.number.cells", order: 61, allowedOps: COMPACT_TEXT_LAYOUT, lockedOps: DOMAIN_LOCKS, actionKind: "collapseLevel1", componentKind: "conditionalMultiRef", baseline: { width: 18, height: 18, minWidth: 8, maxWidth: 48, minHeight: 8, maxHeight: 48, fontSize: 10.667, minFontSize: 7, maxFontSize: 28 } }),
  m83Element({ id: "protokoll.list.row.number", refKey: "protokoll.list.row.number", name: "TOP-Nummer", type: "label", role: "structure", parentId: "protokoll.list.column.number.cells", order: 62, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "staticMultiRef", baseline: { width: 40, height: 14, minWidth: 8, maxWidth: 180, minHeight: 8, maxHeight: 48, fontSize: 11.333, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "protokoll.list.row.createdAt", refKey: "protokoll.list.row.createdAt", name: "Anlagedatum", type: "label", role: "date", parentId: "protokoll.list.column.number.cells", order: 63, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { width: 72, height: 12, minWidth: 8, maxWidth: 180, minHeight: 8, maxHeight: 48, fontSize: 8.667, minFontSize: 6, maxFontSize: 28 } }),
  m83Element({ id: "protokoll.list.row.class", refKey: "protokoll.list.row.class", name: "Klasse", type: "label", role: "status", parentId: "protokoll.list.column.number.cells", order: 64, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "staticMultiRef", baseline: { width: 42, height: 12, minWidth: 8, maxWidth: 180, minHeight: 8, maxHeight: 48, fontSize: 8.667, minFontSize: 6, maxFontSize: 28 } }),
  m83Element({ id: "protokoll.list.row.marker", refKey: "protokoll.list.row.marker", name: "Neu-Markierung", type: "statusIndicator", role: "status", parentId: "protokoll.list.column.number.cells", order: 65, allowedOps: ICON_LAYOUT, componentKind: "conditionalMultiRef", baseline: { width: 10, height: 12, minWidth: 6, maxWidth: 36, minHeight: 7, maxHeight: 36 } }),
  m83Element({ id: "protokoll.list.row.short", refKey: "protokoll.list.row.short", name: "Kurztext", type: "label", role: "content", parentId: "protokoll.list.column.text.cells", order: 70, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "staticMultiRef", baseline: { width: 220, height: 18, minWidth: 8, maxWidth: 1400, minHeight: 8, maxHeight: 120, fontSize: 11.333, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "protokoll.list.row.long", refKey: "protokoll.list.row.long", name: "Langtext", type: "label", role: "content", parentId: "protokoll.list.column.text.cells", order: 71, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { width: 420, height: 28, minWidth: 8, maxWidth: 1400, minHeight: 8, maxHeight: 160, fontSize: 12.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "protokoll.list.row.due", refKey: "protokoll.list.row.due", name: "Fertig bis", type: "label", role: "date", parentId: "protokoll.list.column.meta.cells", order: 80, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { width: 84, height: 14, minWidth: 8, maxWidth: 360, minHeight: 8, maxHeight: 48, fontSize: 10.667, minFontSize: 6, maxFontSize: 28 } }),
  m83Element({ id: "protokoll.list.row.status", refKey: "protokoll.list.row.status", name: "Status", type: "label", role: "status", parentId: "protokoll.list.column.meta.cells", order: 81, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { width: 84, height: 14, minWidth: 8, maxWidth: 360, minHeight: 8, maxHeight: 48, fontSize: 10.667, minFontSize: 6, maxFontSize: 28 } }),
  ...[["ampel", "Ampel"], ["todo", "ToDo"], ["decision", "Beschluss"]].map(([key, name], index) => m83Element({ id: `protokoll.list.row.${key}`, refKey: `protokoll.list.row.${key}`, name: `${name} - Listeneintraege`, type: "statusIndicator", role: "status", parentId: "protokoll.list.column.meta.cells", order: 82 + index, allowedOps: ICON_LAYOUT, componentKind: "conditionalMultiRef", baseline: { width: 14, height: 14, minWidth: 7, maxWidth: 48, minHeight: 7, maxHeight: 48 } })),
  m83Element({ id: "protokoll.list.row.responsible", refKey: "protokoll.list.row.responsible", name: "Verantwortlich", type: "label", role: "responsible", parentId: "protokoll.list.column.meta.cells", order: 85, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { width: 120, height: 14, minWidth: 8, maxWidth: 360, minHeight: 8, maxHeight: 48, fontSize: 10.667, minFontSize: 6, maxFontSize: 28 } }),
];

const shellIds = new Set([
  scopeId,
  "protokoll.list.canvas",
  "protokoll.list.paper",
  "protokoll.list.table",
  "protokoll.list.table.header",
  "protokoll.list.table.body",
]);
const singleRecurringIds = new Set([
  "protokoll.list.column.number.header",
  "protokoll.list.column.text.header",
  "protokoll.list.column.meta.header",
  "protokoll.list.header.due",
  "protokoll.list.header.status",
  "protokoll.list.header.responsible",
]);
const conditionalIds = new Set([
  "protokoll.list.column.number.cells",
  "protokoll.list.column.text.cells",
  "protokoll.list.column.meta.cells",
  "protokoll.list.row.level1Toggle",
  "protokoll.list.row.createdAt",
  "protokoll.list.row.marker",
  "protokoll.list.row.long",
  "protokoll.list.row.due",
  "protokoll.list.row.status",
  "protokoll.list.row.ampel",
  "protokoll.list.row.todo",
  "protokoll.list.row.decision",
  "protokoll.list.row.responsible",
]);
const shellElements = elements.filter((entry) => shellIds.has(entry.id));
const recurringElements = elements.filter((entry) => !shellIds.has(entry.id));

export const PROTOKOLL_LIST_REQUIRED_SLOTS = Object.freeze(shellElements.map((entry) => entry.id));
export const PROTOKOLL_LIST_COLUMNS_REQUIRED_SLOTS = Object.freeze(recurringElements.map((entry) => entry.id));

export const protokollListUiEditorContract = m83Component({
  componentId: "bbm.protokoll.list.shell",
  scopeId,
  requiredSlots: PROTOKOLL_LIST_REQUIRED_SLOTS,
  slots: shellElements.map((entry) => m83Slot(entry.id, entry)),
});

export const protokollListColumnsUiEditorContract = m83Component({
  componentId: "bbm.protokoll.list.columns",
  scopeId,
  requiredSlots: PROTOKOLL_LIST_COLUMNS_REQUIRED_SLOTS,
  slots: recurringElements.map((entry) => m83Slot(entry.id, entry, {
    referenceKind: singleRecurringIds.has(entry.id) ? "single" : "multi",
    presence: conditionalIds.has(entry.id) ? "whenVisibleInstances" : "always",
    requirements: {
      textResize: entry.allowedOps.includes("textResize"),
      move: entry.allowedOps.includes("move"),
      sizeBounds: entry.allowedOps.some((operation) => operation.startsWith("resize")),
    },
  })),
});
