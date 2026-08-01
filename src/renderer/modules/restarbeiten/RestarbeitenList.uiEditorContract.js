import {
  COLUMN_LAYOUT,
  COMPACT_TEXT_LAYOUT,
  DOMAIN_LOCKS,
  GROUP_LAYOUT,
  ICON_LAYOUT,
  TABLE_LAYOUT,
  m83Component,
  m83Element,
  m83Slot,
} from "../../ui-editor/m83ComponentContract.js";

const scopeId = "restarbeiten.list.root";

export const RESTARBEITEN_LIST_TABLE_COLUMNS = Object.freeze([
  Object.freeze({ columnId: "restarbeiten.list.table.number", displayName: "Nr. / Datum / Klasse / Fotos", headerElementId: "restarbeiten.list.table.number.header", dataCellTemplateId: "restarbeiten.list.table.number.cells", cellElementIds: Object.freeze([]), currentWidth: 82, minimumWidth: 50, maximumWidth: 240, widthMode: "fixed", resizable: true, wrapMode: "noWrap", overflowMode: "clip", alignment: "stretch", visibility: true, order: 1, lockedOps: DOMAIN_LOCKS, widthSourceId: "restarbeiten.list.table.number", flexible: false, priority: 10 }),
  Object.freeze({ columnId: "restarbeiten.list.table.subject", displayName: "Gegenstand – Verortung / Kurztext / Langtext", headerElementId: "restarbeiten.list.table.subject.header", dataCellTemplateId: "restarbeiten.list.table.subject.cells", cellElementIds: Object.freeze([]), currentWidth: 560, minimumWidth: 160, maximumWidth: 1200, widthMode: "proportional", resizable: true, wrapMode: "wordWrap", overflowMode: "clip", alignment: "stretch", visibility: true, order: 2, lockedOps: DOMAIN_LOCKS, widthSourceId: "restarbeiten.list.table.subject", flexible: true, priority: 100 }),
  Object.freeze({ columnId: "restarbeiten.list.table.meta", displayName: "Fertig bis / Ampel / Status / Verantwortlich", headerElementId: "restarbeiten.list.table.meta.header", dataCellTemplateId: "restarbeiten.list.table.meta.cells", cellElementIds: Object.freeze([]), currentWidth: 172, minimumWidth: 110, maximumWidth: 420, widthMode: "fixed", resizable: true, wrapMode: "wordWrap", overflowMode: "clip", alignment: "stretch", visibility: true, order: 3, lockedOps: DOMAIN_LOCKS, widthSourceId: "restarbeiten.list.table.meta", flexible: false, priority: 20 }),
]);

const listTableLayout = Object.freeze({
  tableId: "restarbeiten.list.table", displayName: "Restarbeiten-Hauptliste",
  bounds: Object.freeze({ left: 0, top: 0, width: 858, height: 680 }), viewportBounds: Object.freeze({ left: 0, top: 0, width: 858, height: 680 }), contentBounds: Object.freeze({ left: 0, top: 0, width: 858, height: 680 }),
  parentId: "restarbeiten.list.paper", columnIds: Object.freeze(RESTARBEITEN_LIST_TABLE_COLUMNS.map((column) => column.columnId)), rowTemplateId: "restarbeiten.list.table.row",
  horizontalOverflowMode: "fitViewport", verticalOverflowMode: "none", widthPolicy: "bounded", minimumWidth: 320, maximumWidth: 1600, reservedWidth: 44, scrollbarWidth: 0,
  rowHeightMode: "bounded", minimumRowHeight: 54, maximumRowHeight: 180, columns: RESTARBEITEN_LIST_TABLE_COLUMNS,
});

function tableBinding(columnId, part) {
  return Object.freeze({ tableId: "restarbeiten.list.table", columnId, widthSourceId: columnId, part });
}

const compactListText = Object.freeze(["move", "textResize", "setVisibility"]);
const elements = [
  m83Element({ id: scopeId, name: "Restarbeiten · Liste", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: [], componentKind: "scope" }),
  m83Element({ id: "restarbeiten.list.area", name: "Restarbeiten-Liste", type: "area", role: "contentArea", parentId: scopeId, order: 10, allowedOps: GROUP_LAYOUT, componentKind: "contentArea", baseline: { width: 900, height: 420, minWidth: 320, minHeight: 180 } }),
  m83Element({ id: "restarbeiten.list.paper", name: "Gruppe Listenblatt", type: "group", role: "layoutGroup", parentId: "restarbeiten.list.area", order: 20, allowedOps: GROUP_LAYOUT, componentKind: "paper", baseline: { width: 900, height: 720, minWidth: 320, minHeight: 240 } }),
  m83Element({ id: "restarbeiten.list.table", name: "Restarbeiten-Hauptliste", type: "table", role: "contentTable", parentId: "restarbeiten.list.paper", order: 30, allowedOps: TABLE_LAYOUT, componentKind: "contentTable", tableLayout: listTableLayout, baseline: { width: 858, height: 680, minWidth: 320, maxWidth: 1600, minHeight: 160, maxHeight: 12000 } }),
  ...RESTARBEITEN_LIST_TABLE_COLUMNS.map((column, index) => m83Element({ id: column.columnId, name: column.displayName, type: "tableColumn", role: index === 2 ? "metaColumn" : "contentColumn", parentId: "restarbeiten.list.table", order: 31 + index, allowedOps: COLUMN_LAYOUT, columnRole: index === 2 ? "metaColumn" : "contentColumn", componentKind: "contentColumn", tableColumnLayout: column, tableBinding: tableBinding(column.columnId, "column"), baseline: { width: column.currentWidth, height: 28, minWidth: column.minimumWidth, maxWidth: column.maximumWidth } })),
  m83Element({ id: "restarbeiten.list.table.header", name: "Tabellenkopf der Restarbeiten-Liste", type: "tableHeader", role: "tableHeader", parentId: "restarbeiten.list.table", order: 40, allowedOps: [], componentKind: "tableHeader" }),
  m83Element({ id: "restarbeiten.list.table.body", name: "Datenbereich der Restarbeiten-Liste", type: "tableBody", role: "tableBody", parentId: "restarbeiten.list.table", order: 50, allowedOps: [], componentKind: "tableBody" }),
  m83Element({ id: "restarbeiten.list.table.row", refKey: "restarbeiten.record", name: "Restarbeiten-Zeile", type: "tableRow", role: "tableRow", parentId: "restarbeiten.list.table.body", order: 51, allowedOps: [], componentKind: "rowTemplate", rowLayout: { heightMode: "bounded", minimumHeight: 54, maximumHeight: 180 } }),
  ...RESTARBEITEN_LIST_TABLE_COLUMNS.flatMap((column, index) => [
    m83Element({ id: column.headerElementId, refKey: `restarbeiten.main.tableHeader.${["number", "subject", "meta"][index]}`, name: `${column.displayName} · Überschrift`, type: "tableHeaderCell", role: "tableHeaderCell", parentId: column.columnId, order: 60 + index * 2, allowedOps: ["textResize"], componentKind: "tableHeaderCell", tableBinding: tableBinding(column.columnId, "header"), baseline: { fontSize: 12, minFontSize: 8, maxFontSize: 32 } }),
    m83Element({ id: column.dataCellTemplateId, refKey: `restarbeiten.record.${["numberColumn", "contentColumn", "metaColumn"][index]}`, name: `${column.displayName} · Datenbereich`, type: "tableDataCell", role: "tableDataCell", parentId: column.columnId, order: 61 + index * 2, allowedOps: [], componentKind: "dataCellTemplate", tableBinding: tableBinding(column.columnId, "data") }),
  ]),
  m83Element({ id: "restarbeiten.record.number", name: "Nr. · Listeneinträge", type: "label", role: "structure", parentId: "restarbeiten.list.table.number.cells", order: 70, allowedOps: compactListText, componentKind: "staticMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.createdAt", name: "Datum · Listeneinträge", type: "label", role: "date", parentId: "restarbeiten.list.table.number.cells", order: 71, allowedOps: compactListText, componentKind: "staticMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.itemClass", name: "Klasse · Listeneinträge", type: "label", role: "status", parentId: "restarbeiten.list.table.number.cells", order: 72, allowedOps: compactListText, componentKind: "staticMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.aftercare", name: "Nachpflege · Listeneinträge", type: "label", role: "status", parentId: "restarbeiten.list.table.number.cells", order: 73, allowedOps: compactListText, componentKind: "conditionalMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.photos", name: "Fotos · Listeneinträge", type: "button", role: "domainActionLayout", parentId: "restarbeiten.list.table.number.cells", order: 74, allowedOps: COMPACT_TEXT_LAYOUT, lockedOps: DOMAIN_LOCKS, actionKind: "domainPhotos", componentKind: "staticMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.location", name: "Verortung · Listeneinträge", type: "label", role: "content", parentId: "restarbeiten.list.table.subject.cells", order: 75, allowedOps: compactListText, componentKind: "staticMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.shortText", name: "Kurztext · Listeneinträge", type: "label", role: "fieldLabel", parentId: "restarbeiten.list.table.subject.cells", order: 76, allowedOps: compactListText, componentKind: "staticMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.longText", name: "Langtext · Listeneinträge", type: "label", role: "fieldLabel", parentId: "restarbeiten.list.table.subject.cells", order: 77, allowedOps: compactListText, componentKind: "conditionalMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.main.tableHeader.dueDate", name: "Fertig bis · Überschrift", type: "label", role: "fieldLabel", parentId: "restarbeiten.list.table.meta.header", order: 80, allowedOps: compactListText, componentKind: "tableHeaderLabel", baseline: { fontSize: 8.667, minFontSize: 6, maxFontSize: 24 } }),
  m83Element({ id: "restarbeiten.main.tableHeader.status", name: "Status · Überschrift", type: "label", role: "fieldLabel", parentId: "restarbeiten.list.table.meta.header", order: 81, allowedOps: compactListText, componentKind: "tableHeaderLabel", baseline: { fontSize: 8.667, minFontSize: 6, maxFontSize: 24 } }),
  m83Element({ id: "restarbeiten.main.tableHeader.responsible", name: "Verantwortlich · Überschrift", type: "label", role: "fieldLabel", parentId: "restarbeiten.list.table.meta.header", order: 82, allowedOps: compactListText, componentKind: "tableHeaderLabel", baseline: { fontSize: 8.667, minFontSize: 6, maxFontSize: 24 } }),
  m83Element({ id: "restarbeiten.record.dueDate", name: "Fertig bis · Listeneinträge", type: "label", role: "date", parentId: "restarbeiten.list.table.meta.cells", order: 83, allowedOps: compactListText, componentKind: "staticMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.ampel", name: "Ampel · Listeneinträge", type: "statusIndicator", role: "status", parentId: "restarbeiten.list.table.meta.cells", order: 84, allowedOps: ["move", ...ICON_LAYOUT], componentKind: "conditionalMultiRef", baseline: { width: 12, height: 12, minWidth: 7, maxWidth: 48, minHeight: 7, maxHeight: 48 } }),
  m83Element({ id: "restarbeiten.record.status", name: "Status · Listeneinträge", type: "label", role: "status", parentId: "restarbeiten.list.table.meta.cells", order: 85, allowedOps: compactListText, componentKind: "staticMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.responsible", name: "Verantwortlich · Listeneinträge", type: "label", role: "responsible", parentId: "restarbeiten.list.table.meta.cells", order: 86, allowedOps: compactListText, componentKind: "staticMultiRef", baseline: { fontSize: 10.667, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "restarbeiten.record.requiredSummary", name: "Pflichtfeldhinweis · Listeneinträge", type: "label", role: "status", parentId: "restarbeiten.list.table.meta.cells", order: 87, allowedOps: compactListText, componentKind: "conditionalMultiRef", baseline: { fontSize: 9, minFontSize: 7, maxFontSize: 24 } }),
];

export const RESTARBEITEN_LIST_REQUIRED_SLOTS = Object.freeze([
  scopeId, "restarbeiten.list.area", "restarbeiten.list.paper", "restarbeiten.list.table",
  "restarbeiten.list.table.number", "restarbeiten.list.table.subject", "restarbeiten.list.table.meta",
  "restarbeiten.list.table.header", "restarbeiten.list.table.body", "restarbeiten.list.table.row",
  "restarbeiten.list.table.number.header", "restarbeiten.list.table.number.cells",
  "restarbeiten.list.table.subject.header", "restarbeiten.list.table.subject.cells",
  "restarbeiten.list.table.meta.header", "restarbeiten.list.table.meta.cells",
  "restarbeiten.record.number", "restarbeiten.record.createdAt", "restarbeiten.record.itemClass",
  "restarbeiten.record.aftercare", "restarbeiten.record.photos", "restarbeiten.record.location",
  "restarbeiten.record.shortText", "restarbeiten.record.longText",
  "restarbeiten.main.tableHeader.dueDate", "restarbeiten.main.tableHeader.status", "restarbeiten.main.tableHeader.responsible",
  "restarbeiten.record.dueDate", "restarbeiten.record.ampel", "restarbeiten.record.status",
  "restarbeiten.record.responsible", "restarbeiten.record.requiredSummary",
]);

const multiIds = new Set([
  "restarbeiten.list.table.row",
  ...RESTARBEITEN_LIST_TABLE_COLUMNS.map((column) => column.columnId),
  ...RESTARBEITEN_LIST_TABLE_COLUMNS.map((column) => column.dataCellTemplateId),
  "restarbeiten.record.number", "restarbeiten.record.createdAt", "restarbeiten.record.itemClass", "restarbeiten.record.aftercare", "restarbeiten.record.photos",
  "restarbeiten.record.location", "restarbeiten.record.shortText", "restarbeiten.record.longText", "restarbeiten.record.dueDate", "restarbeiten.record.ampel",
  "restarbeiten.record.status", "restarbeiten.record.responsible", "restarbeiten.record.requiredSummary",
]);
const conditionalIds = new Set(["restarbeiten.record.aftercare", "restarbeiten.record.longText", "restarbeiten.record.ampel", "restarbeiten.record.requiredSummary"]);

export const restarbeitenListUiEditorContract = m83Component({
  componentId: "bbm.restarbeiten.list",
  scopeId,
  requiredSlots: RESTARBEITEN_LIST_REQUIRED_SLOTS,
  slots: elements.map((entry) => m83Slot(entry.id, entry, {
    referenceKind: multiIds.has(entry.id) ? "multi" : "single",
    presence: conditionalIds.has(entry.id) ? "whenVisibleInstances" : "always",
    requirements: {
      textResize: entry.type === "label" || entry.type === "tableHeaderCell" || entry.id === "restarbeiten.record.photos",
      move: entry.allowedOps.includes("move"),
      sizeBounds: entry.allowedOps.some((operation) => operation.startsWith("resize")),
    },
  })),
});
