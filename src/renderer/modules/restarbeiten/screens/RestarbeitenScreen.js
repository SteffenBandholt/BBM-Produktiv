import {
  createRestarbeitItem,
  getRestarbeitenProjectSettings,
  listRestarbeitenByProject,
  updateRestarbeitItem,
} from "../data/restarbeitenDataSource.js";
import { toRestarbeitenListItems } from "../viewModel/restarbeitenListItems.js";
import RestarbeitenEditbox from "./RestarbeitenEditbox.js";
import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function createLineCell(doc, line1, line2, line3) {
  const td = doc.createElement("td");

  const line1Div = doc.createElement("div");
  line1Div.textContent = line1;
  td.append(line1Div);

  const line2Div = doc.createElement("div");
  line2Div.textContent = line2;
  td.append(line2Div);

  if (typeof line3 === "string") {
    const line3Div = doc.createElement("div");
    line3Div.textContent = line3;
    td.append(line3Div);
  }

  return td;
}

function createHeaderCell(doc, text) {
  const th = doc.createElement("th");
  th.textContent = text;
  return th;
}

function buildListTable(doc, items, selectedId, onSelect) {
  const table = doc.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  const thead = doc.createElement("thead");
  const headRow = doc.createElement("tr");
  headRow.append(
    createHeaderCell(doc, "Nr. / Datum"),
    createHeaderCell(doc, "Verortung"),
    createHeaderCell(doc, "Restarbeit"),
    createHeaderCell(doc, "Status")
  );
  thead.append(headRow);
  table.append(thead);

  const tbody = doc.createElement("tbody");
  for (const item of items) {
    const row = doc.createElement("tr");
    row.dataset.restarbeitId = item.id;
    row.style.cursor = "pointer";
    row.style.borderBottom = "1px solid var(--card-border, #d6d6d6)";
    row.style.verticalAlign = "top";
    if (String(item.id) === String(selectedId)) {
      row.style.background = "rgba(0, 0, 0, 0.05)";
      row.dataset.selected = "1";
    }
    row.addEventListener("click", () => onSelect(item.id));
    row.append(
      createLineCell(doc, item.numberLine, item.dateLine),
      createLineCell(doc, item.locationLine1, item.locationLine2),
      createLineCell(doc, item.workLine1, item.workLine2),
      createLineCell(doc, item.statusLine1, item.statusLine2, item.statusLine3)
    );
    tbody.append(row);
  }

  table.append(tbody);
  return table;
}

function createMessage(doc, text) {
  const el = doc.createElement("p");
  el.textContent = text;
  el.style.margin = "0";
  return el;
}

export default class RestarbeitenScreen {
  constructor({ router, projectId, project, moduleId } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.moduleId = moduleId || "restarbeiten";
    this.effectiveProjectId = "";
    this.host = null;
    this.headerHost = null;
    this.listHost = null;
    this.editHost = null;
    this.rows = [];
    this.items = [];
    this.selectedItemId = "";
    this.isLoading = false;
    this.editbox = null;
  }

  _getSelectedItem() {
    return this.rows.find((item) => String(item.id) === String(this.selectedItemId)) || null;
  }

  _setSelectedItemId(itemId) {
    this.selectedItemId = normalizeText(itemId);
    if (this.editbox) this.editbox.setItem(this._getSelectedItem());
  }

  _renderList() {
    if (!this.listHost) return;

    const doc = this.listHost.ownerDocument || globalThis.document;
    if (!this.effectiveProjectId) {
      this.listHost.replaceChildren(createMessage(doc, "Kein Projektkontext für Restarbeiten vorhanden."));
      return;
    }

    if (!this.items.length) {
      this.listHost.replaceChildren(
        createMessage(doc, "Für dieses Projekt sind noch keine Restarbeiten vorhanden.")
      );
      return;
    }

    this.listHost.replaceChildren(
      buildListTable(doc, this.items, this.selectedItemId, (itemId) => {
        this._setSelectedItemId(itemId);
        this._renderList();
        this._renderEditbox();
      })
    );
  }

  _renderEditbox() {
    if (!this.editHost) return;
    const doc = this.editHost.ownerDocument || globalThis.document;

    if (!this.effectiveProjectId) {
      if (this.editbox) this.editbox.setItem(null);
      this.editHost.replaceChildren();
      return;
    }

    const selectedItem = this._getSelectedItem();

    if (!selectedItem) {
      if (this.editbox) this.editbox.setItem(null);
      this.editHost.replaceChildren(
        createMessage(doc, "Eine Restarbeit auswaehlen oder ueber + Restarbeit neu anlegen.")
      );
      return;
    }

    if (!this.editbox) {
      this.editbox = new RestarbeitenEditbox({
        documentRef: doc,
        onSave: async (draft) => {
          if (!this.selectedItemId) return;
          this.editbox?.setSaving(true);
          try {
            await updateRestarbeitItem(this.selectedItemId, draft);
            await this.load({ selectItemId: this.selectedItemId });
          } finally {
            this.editbox?.setSaving(false);
          }
        },
      });
      this.editHost.replaceChildren(this.editbox.render());
    }

    this.editbox.setItem(selectedItem);
    this.editbox.setStatus(selectedItem ? `Ausgewählt: #${selectedItem.running_number || selectedItem.id}` : "");
  }

  async _createRestarbeit() {
    if (!this.effectiveProjectId) return;
    this.editbox?.setStatus("Restarbeit wird angelegt...");
    try {
      const item = await createRestarbeitItem(this.effectiveProjectId, {});
      const selectedId = item?.id ? String(item.id) : "";
      await this.load({ selectItemId: selectedId });
    } catch (error) {
      if (this.editbox) this.editbox.setStatus(error?.message || "Restarbeit konnte nicht angelegt werden.");
    }
  }

  _renderHeader() {
    if (!this.headerHost) return;
    const doc = this.headerHost.ownerDocument || globalThis.document;
    const row = doc.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";

    const title = doc.createElement("h2");
    title.textContent = "Restarbeiten";
    title.style.margin = "0";

    const actionBtn = doc.createElement("button");
    actionBtn.type = "button";
    actionBtn.textContent = "+ Restarbeit";
    applyPopupButtonStyle(actionBtn, { variant: "primary" });
    actionBtn.disabled = !this.effectiveProjectId;
    actionBtn.onclick = async () => {
      await this._createRestarbeit();
    };

    const context = doc.createElement("div");
    context.textContent = this.effectiveProjectId
      ? `Projektkontext: #${this.effectiveProjectId}`
      : "Projektkontext: nicht gesetzt";
    context.style.marginLeft = "auto";
    context.style.fontSize = "12px";
    context.style.opacity = "0.85";

    row.append(title, actionBtn, context);
    this.headerHost.replaceChildren(row);
  }

  render() {
    const root = document.createElement("div");
    root.style.display = "grid";
    root.style.gap = "12px";

    this.effectiveProjectId = normalizeText(this.projectId || this.project?.id || "");

    this.headerHost = document.createElement("div");
    this.listHost = document.createElement("div");
    this.editHost = document.createElement("div");

    this._renderHeader();
    if (this.effectiveProjectId) {
      this._renderList();
      this._renderEditbox();
    } else {
      this.listHost.replaceChildren(
        createMessage(this.listHost.ownerDocument || globalThis.document, "Kein Projektkontext für Restarbeiten vorhanden.")
      );
      this.editHost.replaceChildren();
    }

    root.append(this.headerHost, this.listHost, this.editHost);
    this.host = root;
    return root;
  }

  async load({ selectItemId = null } = {}) {
    if (!this.effectiveProjectId || !this.host) return;

    this.isLoading = true;
    this.listHost?.replaceChildren(
      createMessage(this.listHost.ownerDocument || globalThis.document, "Restarbeiten werden geladen…")
    );
    if (this.editbox) this.editbox.setStatus("Lade...");

    try {
      await getRestarbeitenProjectSettings(this.effectiveProjectId);
      const rows = await listRestarbeitenByProject(this.effectiveProjectId);
      this.rows = Array.isArray(rows) ? rows : [];
      this.items = toRestarbeitenListItems(this.rows);
      const wantedId = normalizeText(selectItemId);
      if (wantedId && this.items.some((item) => String(item.id) === wantedId)) {
        this.selectedItemId = wantedId;
      } else if (this.selectedItemId && !this.items.some((item) => String(item.id) === String(this.selectedItemId))) {
        this.selectedItemId = this.items[0]?.id ? String(this.items[0].id) : "";
      } else if (!this.selectedItemId && this.items[0]) {
        this.selectedItemId = String(this.items[0].id);
      }

      this._renderList();
      this._renderEditbox();
    } catch (error) {
      this.rows = [];
      this.items = [];
      if (this.listHost) {
        this.listHost.replaceChildren(
          createMessage(
            this.listHost.ownerDocument || globalThis.document,
            `Restarbeiten konnten nicht geladen werden: ${error?.message || "Unbekannter Fehler"}`
          )
        );
      }
      if (this.editbox) this.editbox.setStatus("");
    } finally {
      this.isLoading = false;
    }
  }
}
