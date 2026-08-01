import { m83Component, m83Element, m83Slot } from "../../ui-editor/m83ComponentContract.js";

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
  m83Element({ id: "protokoll.list.table", name: "Protokoll-TOP-Liste", type: "group", role: "contentTable", parentId: "protokoll.list.paper", order: 30, allowedOps: [], componentKind: "existingContentTable" }),
  ...columns.map((column) => m83Element({ id: column.id, name: column.name, type: "group", role: column.role, parentId: "protokoll.list.table", order: column.order, allowedOps: ["resizeWidth"], columnRole: column.role, componentKind: "logicalColumn", baseline: { width: column.currentWidth, minWidth: column.minimumWidth, maxWidth: column.maximumWidth } })),
];

export const PROTOKOLL_LIST_REQUIRED_SLOTS = Object.freeze([scopeId, "protokoll.list.canvas", "protokoll.list.paper", "protokoll.list.table"]);
export const PROTOKOLL_LIST_COLUMNS_REQUIRED_SLOTS = Object.freeze(columns.map((column) => column.id));
export const protokollListUiEditorContract = m83Component({
  componentId: "bbm.protokoll.list.shell",
  scopeId,
  requiredSlots: PROTOKOLL_LIST_REQUIRED_SLOTS,
  slots: elements.slice(0, 4).map((entry) => m83Slot(entry.id, entry)),
});
export const protokollListColumnsUiEditorContract = m83Component({
  componentId: "bbm.protokoll.list.columns",
  scopeId,
  requiredSlots: PROTOKOLL_LIST_COLUMNS_REQUIRED_SLOTS,
  slots: elements.slice(4).map((entry) => m83Slot(entry.id, entry, { referenceKind: "multi" })),
});
