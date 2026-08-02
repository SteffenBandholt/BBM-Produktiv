import { COMPACT_TEXT_LAYOUT, ICON_LAYOUT, m83Component, m83Element, m83Slot } from "../../ui-editor/m83ComponentContract.js";

const scopeId = "protokoll.list.root";
const columns = Object.freeze([
  Object.freeze({ id: "protokoll.list.column.number", name: "TOP / Nummer", currentWidth: 64, minimumWidth: 40, maximumWidth: 220, widthSourceId: "--bbm-tops-list-number-col", order: 31, role: "metaColumn" }),
  Object.freeze({ id: "protokoll.list.column.text", name: "Gegenstand / Kurztext / Langtext", currentWidth: 650, minimumWidth: 180, maximumWidth: 1400, widthSourceId: "--bbm-tops-list-text-col", order: 32, role: "contentColumn" }),
  Object.freeze({ id: "protokoll.list.column.meta", name: "Status / Fertig bis / Verantwortlich", currentWidth: 74, minimumWidth: 50, maximumWidth: 420, widthSourceId: "--bbm-tops-list-meta-col", order: 33, role: "metaColumn" }),
]);
const elements = [
  m83Element({ id: scopeId, name: "Protokoll-Listenbereich", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: [], componentKind: "sheetScrollOwner" }),
  m83Element({ id: "protokoll.list.canvas", name: "Protokoll-Dokumentfläche", type: "area", role: "contentArea", parentId: scopeId, order: 10, allowedOps: [], componentKind: "documentCanvas" }),
  m83Element({ id: "protokoll.list.paper", name: "Protokoll-Dokumentblatt", type: "group", role: "layoutGroup", parentId: "protokoll.list.canvas", order: 20, allowedOps: [], componentKind: "documentPaper" }),
  m83Element({ id: "protokoll.list.table", name: "Protokoll-TOP-Liste", type: "table", role: "contentTable", parentId: "protokoll.list.paper", order: 30, allowedOps: [], componentKind: "existingContentTable" }),
  m83Element({ id: "protokoll.list.table.body", name: "Datenbereich der Protokoll-TOP-Liste", type: "tableBody", role: "tableBody", parentId: "protokoll.list.table", order: 34, allowedOps: [], componentKind: "existingTableBody" }),
  ...columns.map((column) => m83Element({ id: column.id, name: column.name, type: "group", role: column.role, parentId: "protokoll.list.table", order: column.order, allowedOps: ["resizeWidth"], columnRole: column.role, componentKind: "logicalColumn", baseline: { width: column.currentWidth, minWidth: column.minimumWidth, maxWidth: column.maximumWidth } })),
  m83Element({ id: "protokoll.list.row", refKey: "protokoll.list.row", name: "Protokoll-TOP-Zeile", type: "tableRow", role: "tableRow", parentId: "protokoll.list.table.body", order: 40, allowedOps: [], componentKind: "rowTemplate", baseline: { height: 48, minHeight: 28, maxHeight: 360 } }),
  m83Element({ id: "protokoll.list.row.level1Toggle", refKey: "protokoll.list.row.level1Toggle", name: "Ebene 1 auf- oder zuklappen", type: "button", role: "navigation", parentId: "protokoll.list.column.number", order: 41, allowedOps: COMPACT_TEXT_LAYOUT, lockedOps: ["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"], componentKind: "conditionalMultiRef", baseline: { fontSize: 12, minFontSize: 7, maxFontSize: 28 } }),
  m83Element({ id: "protokoll.list.row.number", refKey: "protokoll.list.row.number", name: "TOP-Nummer", type: "label", role: "structure", parentId: "protokoll.list.column.number", order: 42, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "staticMultiRef", baseline: { fontSize: 11, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "protokoll.list.row.marker", refKey: "protokoll.list.row.marker", name: "Neu-Markierung", type: "statusIndicator", role: "status", parentId: "protokoll.list.column.number", order: 43, allowedOps: ICON_LAYOUT, componentKind: "conditionalMultiRef", baseline: { width: 10, height: 12, minWidth: 6, maxWidth: 36, minHeight: 7, maxHeight: 36 } }),
  m83Element({ id: "protokoll.list.row.createdAt", refKey: "protokoll.list.row.createdAt", name: "Anlagedatum", type: "label", role: "date", parentId: "protokoll.list.column.number", order: 44, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { fontSize: 9, minFontSize: 6, maxFontSize: 28 } }),
  m83Element({ id: "protokoll.list.row.short", refKey: "protokoll.list.row.short", name: "Kurztext", type: "label", role: "content", parentId: "protokoll.list.column.text", order: 45, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "staticMultiRef", baseline: { fontSize: 11, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "protokoll.list.row.long", refKey: "protokoll.list.row.long", name: "Langtext", type: "label", role: "content", parentId: "protokoll.list.column.text", order: 46, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { fontSize: 10, minFontSize: 7, maxFontSize: 32 } }),
  m83Element({ id: "protokoll.list.row.due", refKey: "protokoll.list.row.due", name: "Fertig bis", type: "label", role: "date", parentId: "protokoll.list.column.meta", order: 47, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { fontSize: 9, minFontSize: 6, maxFontSize: 28 } }),
  m83Element({ id: "protokoll.list.row.status", refKey: "protokoll.list.row.status", name: "Status", type: "label", role: "status", parentId: "protokoll.list.column.meta", order: 48, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { fontSize: 9, minFontSize: 6, maxFontSize: 28 } }),
  m83Element({ id: "protokoll.list.row.responsible", refKey: "protokoll.list.row.responsible", name: "Verantwortlich", type: "label", role: "responsible", parentId: "protokoll.list.column.meta", order: 49, allowedOps: COMPACT_TEXT_LAYOUT, componentKind: "conditionalMultiRef", baseline: { fontSize: 9, minFontSize: 6, maxFontSize: 28 } }),
  ...[["ampel", "Ampel"], ["todo", "ToDo"], ["decision", "Beschluss"]].map(([key, name], index) => m83Element({ id: `protokoll.list.row.${key}`, refKey: `protokoll.list.row.${key}`, name: `${name} · Listeneinträge`, type: "statusIndicator", role: "status", parentId: "protokoll.list.column.meta", order: 50 + index, allowedOps: ICON_LAYOUT, componentKind: "conditionalMultiRef", baseline: { width: 14, height: 14, minWidth: 7, maxWidth: 48, minHeight: 7, maxHeight: 48 } })),
];

const shellIds = new Set([scopeId, "protokoll.list.canvas", "protokoll.list.paper", "protokoll.list.table", "protokoll.list.table.body"]);
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
    referenceKind: "multi",
    presence: entry.componentKind === "conditionalMultiRef" ? "whenVisibleInstances" : "always",
    requirements: {
      textResize: entry.allowedOps.includes("textResize"),
      sizeBounds: entry.allowedOps.some((operation) => operation.startsWith("resize")),
    },
  })),
});
