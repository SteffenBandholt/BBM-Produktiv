import {
  getRestarbeitenProjectSettings,
  listRestarbeitenByProject,
} from "../data/restarbeitenDataSource.js";
import { toRestarbeitenListItems } from "../viewModel/restarbeitenListItems.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function createLineCell(line1, line2, line3) {
  const td = document.createElement("td");

  const line1Div = document.createElement("div");
  line1Div.textContent = line1;
  td.append(line1Div);

  const line2Div = document.createElement("div");
  line2Div.textContent = line2;
  td.append(line2Div);

  if (typeof line3 === "string") {
    const line3Div = document.createElement("div");
    line3Div.textContent = line3;
    td.append(line3Div);
  }

  return td;
}

function createHeaderCell(text) {
  const th = document.createElement("th");
  th.textContent = text;
  return th;
}

function buildListTable(items) {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.append(
    createHeaderCell("Nr. / Datum"),
    createHeaderCell("Verortung"),
    createHeaderCell("Restarbeit"),
    createHeaderCell("Status")
  );
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  for (const item of items) {
    const row = document.createElement("tr");
    row.append(
      createLineCell(item.numberLine, item.dateLine),
      createLineCell(item.locationLine1, item.locationLine2),
      createLineCell(item.workLine1, item.workLine2),
      createLineCell(item.statusLine1, item.statusLine2, item.statusLine3)
    );
    tbody.append(row);
  }

  table.append(tbody);
  return table;
}

export default class RestarbeitenScreen {
  constructor({ router, projectId, project, moduleId } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.moduleId = moduleId || "restarbeiten";
    this.effectiveProjectId = "";
    this.host = null;
  }

  render() {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gap = "8px";

    const title = document.createElement("h2");
    title.textContent = "Restarbeiten";
    title.style.margin = "0";
    root.append(title);

    this.effectiveProjectId = normalizeText(this.projectId || this.project?.id || "");

    const context = document.createElement("div");
    context.textContent = this.effectiveProjectId
      ? `Projektkontext: #${this.effectiveProjectId}`
      : "Projektkontext: nicht gesetzt";
    root.append(context);

    this.host = document.createElement("div");
    root.append(this.host);

    if (!this.effectiveProjectId) {
      const missing = document.createElement("p");
      missing.textContent = "Kein Projektkontext für Restarbeiten vorhanden.";
      this.host.replaceChildren(missing);
      return root;
    }

    const loading = document.createElement("p");
    loading.textContent = "Restarbeiten werden geladen…";
    this.host.replaceChildren(loading);

    return root;
  }

  async load() {
    if (!this.effectiveProjectId || !this.host) return;

    try {
      await getRestarbeitenProjectSettings(this.effectiveProjectId);
      const rows = await listRestarbeitenByProject(this.effectiveProjectId);
      const items = toRestarbeitenListItems(rows);

      if (!items.length) {
        const empty = document.createElement("p");
        empty.textContent = "Für dieses Projekt sind noch keine Restarbeiten vorhanden.";
        this.host.replaceChildren(empty);
        return;
      }

      this.host.replaceChildren(buildListTable(items));
    } catch (error) {
      const err = document.createElement("p");
      err.textContent = `Restarbeiten konnten nicht geladen werden: ${error?.message || "Unbekannter Fehler"}`;
      this.host.replaceChildren(err);
    }
  }
}
