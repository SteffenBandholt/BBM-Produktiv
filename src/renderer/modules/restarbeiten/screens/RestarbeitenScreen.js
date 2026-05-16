import {
  getRestarbeitenProjectSettings,
  listRestarbeitenByProject,
} from "../data/restarbeitenDataSource.js";
import { toRestarbeitenListItems } from "../viewModel/restarbeitenListItems.js";

function normalizeText(value) {
  return String(value || "").trim();
}

export default class RestarbeitenScreen {
  constructor({ router, projectId, project, moduleId } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.moduleId = moduleId || "restarbeiten";
  }

  async render() {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gap = "8px";

    const title = document.createElement("h2");
    title.textContent = "Restarbeiten";
    title.style.margin = "0";
    root.append(title);

    const effectiveProjectId = normalizeText(this.projectId || this.project?.id || "");
    const context = document.createElement("div");
    context.textContent = effectiveProjectId
      ? `Projektkontext: #${effectiveProjectId}`
      : "Projektkontext: nicht gesetzt";
    root.append(context);

    if (!effectiveProjectId) {
      const missing = document.createElement("p");
      missing.textContent = "Kein Projektkontext für Restarbeiten vorhanden.";
      root.append(missing);
      return root;
    }

    const loading = document.createElement("p");
    loading.textContent = "Restarbeiten werden geladen…";
    root.append(loading);

    try {
      await getRestarbeitenProjectSettings(effectiveProjectId);
      const rows = await listRestarbeitenByProject(effectiveProjectId);
      const items = toRestarbeitenListItems(rows);
      loading.remove();

      if (!items.length) {
        const empty = document.createElement("p");
        empty.textContent = "Für dieses Projekt sind noch keine Restarbeiten vorhanden.";
        root.append(empty);
        return root;
      }

      const table = document.createElement("table");
      const head = document.createElement("thead");
      head.innerHTML = "<tr><th>Nr. / Datum</th><th>Verortung</th><th>Restarbeit</th><th>Status</th></tr>";
      table.append(head);
      const body = document.createElement("tbody");
      for (const item of items) {
        const tr = document.createElement("tr");
        tr.innerHTML = [
          `<td><div>${item.numberLine}</div><div>${item.dateLine}</div></td>`,
          `<td><div>${item.locationLine1}</div><div>${item.locationLine2}</div></td>`,
          `<td><div>${item.workLine1}</div><div>${item.workLine2}</div></td>`,
          `<td><div>${item.statusLine1}</div><div>${item.statusLine2}</div><div>${item.statusLine3}</div></td>`,
        ].join("");
        body.append(tr);
      }
      table.append(body);
      root.append(table);
      return root;
    } catch (error) {
      loading.remove();
      const err = document.createElement("p");
      err.textContent = `Restarbeiten konnten nicht geladen werden: ${error?.message || "Unbekannter Fehler"}`;
      root.append(err);
      return root;
    }
  }
}
