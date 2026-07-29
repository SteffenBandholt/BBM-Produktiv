import { buildRestarbeitenList, buildRestarbeitenTableHeader } from "./RestarbeitenList.js";
import { registerM80Ref, registerM80TableColumnRef, registerM80TableRef } from "../../ui-editor/m80Refs.js";

function createEl(tag, { className = "", uiId = "" } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (uiId) el.setAttribute("data-ui-editor-id", uiId);
  return el;
}

export function buildRestarbeitenMainBody(options = {}) {
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
  const viewport = createEl("div", { className: "bbm-restarbeiten-table-viewport" });
  const scrollArea = createEl("div", { className: "bbm-restarbeiten-table-scroll-area" });
  const header = buildRestarbeitenTableHeader();
  const records = buildRestarbeitenList(options);

  registerM80Ref("restarbeiten.list.root", main);
  registerM80Ref("restarbeiten.list.area", sheet);
  registerM80Ref("restarbeiten.list.paper", paper);
  registerM80Ref("restarbeiten.list.viewport", viewport);
  registerM80Ref("restarbeiten.list.scrollArea", scrollArea);
  registerM80TableRef("restarbeiten.list.table", table, viewport, scrollArea);
  registerM80Ref("restarbeiten.list.table.header", header);
  registerM80Ref("restarbeiten.list.table.body", records);
  registerM80Ref("restarbeiten.list.table.row", records._m80Rows[0] || records, { targets: records._m80Rows });
  registerM80TableColumnRef(
    "restarbeiten.list.table.number",
    header.children[0],
    records._m80ColumnCells[0],
    table,
    viewport,
    "--bbm-restarbeiten-number-column",
    82
  );
  registerM80TableColumnRef(
    "restarbeiten.list.table.subject",
    header.children[1],
    records._m80ColumnCells[1],
    table,
    viewport,
    "--bbm-restarbeiten-subject-column",
    560
  );
  registerM80TableColumnRef(
    "restarbeiten.list.table.meta",
    header.children[2],
    records._m80ColumnCells[2],
    table,
    viewport,
    "--bbm-restarbeiten-meta-column",
    172
  );

  table.append(header, records);
  scrollArea.appendChild(table);
  viewport.appendChild(scrollArea);
  paper.appendChild(viewport);
  sheet.appendChild(paper);
  main.appendChild(sheet);
  return main;
}
