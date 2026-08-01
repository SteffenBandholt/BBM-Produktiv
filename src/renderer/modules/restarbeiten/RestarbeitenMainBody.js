import { buildRestarbeitenList, buildRestarbeitenTableHeader } from "./RestarbeitenList.js";
import { beginM83ComponentBinding, registerM80MultiRef, registerM80Ref, registerM80TableColumnRef, registerM80TableRef } from "../../ui-editor/m80Refs.js";

function createEl(tag, { className = "", uiId = "" } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (uiId) el.setAttribute("data-ui-editor-id", uiId);
  return el;
}

export function buildRestarbeitenMainBody(options = {}) {
  beginM83ComponentBinding("bbm.restarbeiten.list");
  const main = createEl("main", {
    className: "bbm-restarbeiten-main",
    uiId: "restarbeiten.main",
  });
  const sheet = createEl("section", {
    className: "bbm-restarbeiten-sheet",
    uiId: "restarbeiten.main.sheet",
  });
  const paper = createEl("div", {
    className: "bbm-restarbeiten-paper",
    uiId: "restarbeiten.main.sheet.paper",
  });

  const table = createEl("div", {
    className: "bbm-restarbeiten-table",
  });
  const header = buildRestarbeitenTableHeader();
  const records = buildRestarbeitenList(options);

  registerM80Ref("restarbeiten.list.root", main);
  registerM80Ref("restarbeiten.list.area", sheet);
  registerM80Ref("restarbeiten.list.paper", paper);
  registerM80TableRef("restarbeiten.list.table", table, table);
  registerM80Ref("restarbeiten.list.table.header", header);
  registerM80Ref("restarbeiten.list.table.body", records);
  registerM80MultiRef("restarbeiten.list.table.row", records._m80Rows, records, { mountedInstanceCount: records._m80Rows.length });
  registerM80TableColumnRef(
    "restarbeiten.list.table.number",
    header.children[0],
    records._m80ColumnCells[0],
    table,
    table,
    "--bbm-restarbeiten-number-column",
    82
  );
  registerM80TableColumnRef(
    "restarbeiten.list.table.subject",
    header.children[1],
    records._m80ColumnCells[1],
    table,
    table,
    "--bbm-restarbeiten-subject-column",
    560
  );
  registerM80TableColumnRef(
    "restarbeiten.list.table.meta",
    header.children[2],
    records._m80ColumnCells[2],
    table,
    table,
    "--bbm-restarbeiten-meta-column",
    172
  );
  const headerMeta = header._m80MetaHeaderParts;
  const componentParts = records._m83ComponentParts;
  registerM80Ref("restarbeiten.main.tableHeader.dueDate", headerMeta.dueDate);
  registerM80Ref("restarbeiten.main.tableHeader.status", headerMeta.status);
  registerM80Ref("restarbeiten.main.tableHeader.responsible", headerMeta.responsible);
  for (const [id, key] of [
    ["restarbeiten.record.number", "number"],
    ["restarbeiten.record.createdAt", "createdAt"],
    ["restarbeiten.record.itemClass", "itemClass"],
    ["restarbeiten.record.aftercare", "aftercare"],
    ["restarbeiten.record.photos", "photos"],
    ["restarbeiten.record.location", "location"],
    ["restarbeiten.record.shortText", "shortText"],
    ["restarbeiten.record.longText", "longText"],
    ["restarbeiten.record.dueDate", "dueDate"],
    ["restarbeiten.record.ampel", "ampel"],
    ["restarbeiten.record.status", "status"],
    ["restarbeiten.record.responsible", "responsible"],
    ["restarbeiten.record.requiredSummary", "requiredSummary"],
  ]) registerM80MultiRef(id, componentParts[key], records, { mountedInstanceCount: componentParts[key].length });

  table.append(header, records);
  paper.appendChild(table);
  sheet.appendChild(paper);
  main.appendChild(sheet);
  return main;
}
