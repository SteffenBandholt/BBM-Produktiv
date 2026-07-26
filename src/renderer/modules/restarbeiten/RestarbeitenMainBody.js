import { buildRestarbeitenList, buildRestarbeitenTableHeader } from "./RestarbeitenList.js";
import { registerM80Ref, registerM80TableColumnRef } from "../../ui-editor/m80Refs.js";

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
  const header = buildRestarbeitenTableHeader();
  const records = buildRestarbeitenList(options);

  registerM80Ref("restarbeiten.list.root", main);
  registerM80Ref("restarbeiten.list.area", sheet);
  registerM80Ref("restarbeiten.list.paper", paper);
  registerM80Ref("restarbeiten.list.table", table);
  registerM80TableColumnRef(
    "restarbeiten.list.table.number",
    header.children[0],
    table,
    "--bbm-restarbeiten-number-column",
    82
  );
  registerM80TableColumnRef(
    "restarbeiten.list.table.subject",
    header.children[1],
    table,
    "--bbm-restarbeiten-subject-column",
    600
  );
  registerM80TableColumnRef(
    "restarbeiten.list.table.meta",
    header.children[2],
    table,
    "--bbm-restarbeiten-meta-column",
    172
  );

  table.append(header, records);
  paper.appendChild(table);
  sheet.appendChild(paper);
  main.appendChild(sheet);
  return main;
}
