function createEl(tag, { className = "", text = "" } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function appendCell(row, className, text) {
  const cell = createEl("div", { className, text });
  row.appendChild(cell);
  return cell;
}

function buildHeader() {
  const header = createEl("div", { className: "bbm-restarbeiten-output__row bbm-restarbeiten-output__row--header" });
  for (const label of ["Nr.", "Kurztext", "Ort/Bereich", "Verantwortlich", "Fertig bis", "Status", "Ampel", "Hinweis"]) {
    appendCell(header, "bbm-restarbeiten-output__cell", label);
  }
  return header;
}

function buildRow(item) {
  const row = createEl("article", { className: "bbm-restarbeiten-output__row" });
  row.setAttribute("data-bbm-restarbeiten-output-row", "true");
  row.setAttribute("data-bbm-restarbeiten-output-complete", item.isComplete ? "true" : "false");
  row.setAttribute("data-bbm-restarbeiten-output-done", item.isDone ? "true" : "false");
  row.setAttribute("data-bbm-restarbeiten-output-ampel", item.ampelState || "neutral");

  appendCell(row, "bbm-restarbeiten-output__cell", item.number);
  appendCell(row, "bbm-restarbeiten-output__cell", item.shortText);
  appendCell(row, "bbm-restarbeiten-output__cell", item.location);
  appendCell(row, "bbm-restarbeiten-output__cell", item.responsible);
  appendCell(row, "bbm-restarbeiten-output__cell", item.dueDateLabel);
  appendCell(row, "bbm-restarbeiten-output__cell", item.statusLabel);
  appendCell(row, "bbm-restarbeiten-output__cell", item.ampelLabel);
  appendCell(row, "bbm-restarbeiten-output__cell bbm-restarbeiten-output__hint", item.incompleteHint);
  return row;
}

export function buildRestarbeitenOutputPreview({
  items = [],
  projectName = "",
  onClose = null,
} = {}) {
  const main = createEl("main", { className: "bbm-restarbeiten-main bbm-restarbeiten-output" });
  main.setAttribute("data-bbm-restarbeiten-output-preview", "true");

  const paper = createEl("section", { className: "bbm-restarbeiten-paper bbm-restarbeiten-output__paper" });
  const header = createEl("header", { className: "bbm-restarbeiten-output__header" });
  const title = createEl("h2", { text: "Restarbeiten Ausgabevorschau" });
  const meta = createEl("div", {
    className: "bbm-restarbeiten-output__meta",
    text: projectName ? `Projekt: ${projectName}` : "",
  });
  const close = createEl("button", { className: "bbm-restarbeiten-button", text: "Zur Bearbeitung" });
  close.type = "button";
  close.addEventListener("click", () => onClose?.());
  header.append(title, meta, close);

  const table = createEl("section", { className: "bbm-restarbeiten-output__table" });
  table.appendChild(buildHeader());
  if (!items.length) {
    table.appendChild(createEl("div", {
      className: "bbm-restarbeiten-empty",
      text: "Keine Restarbeiten vorhanden.",
    }));
  } else {
    for (const item of items) table.appendChild(buildRow(item));
  }

  paper.append(header, table);
  main.appendChild(paper);
  return main;
}
