import { buildRestarbeitenList, buildRestarbeitenTableHeader } from "./RestarbeitenList.js";

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

  paper.append(buildRestarbeitenTableHeader(), buildRestarbeitenList(options));
  sheet.appendChild(paper);
  main.appendChild(sheet);
  return main;
}
