import {
  createRestarbeitItem,
  getRestarbeitenProjectSettings,
  listRestarbeitenByProject,
  listResponsibleProjectFirms,
  listRestarbeitAttachments,
  setPrimaryRestarbeitAttachment,
  importRestarbeitAttachments,
  deleteRestarbeitAttachment,
  updateRestarbeitItem,
} from "../data/restarbeitenDataSource.js";
import { toRestarbeitenListItems } from "../viewModel/restarbeitenListItems.js";
import RestarbeitenEditbox from "./RestarbeitenEditbox.js";
import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";
import { ensureRestarbeitenListStyle } from "./restarbeitenListStyle.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function createLineCell(doc, line1, line2, class1, class2) {
  const td = doc.createElement("td");

  const line1Div = doc.createElement("div");
  if (class1) line1Div.className = class1;
  line1Div.textContent = line1;
  td.append(line1Div);

  const line2Div = doc.createElement("div");
  if (class2) line2Div.className = class2;
  line2Div.textContent = line2;
  td.append(line2Div);

  return td;
}

function createStatusCell(doc, item) {
  const td = doc.createElement("td");
  td.dataset.ampel = item.ampelState;

  const meta = doc.createElement("div");
  meta.className = "restarbeiten-list__meta";

  const classLine = doc.createElement("div");
  classLine.className = "restarbeiten-list__class";
  classLine.textContent = `Klasse: ${item.itemClassLabel}`;

  const statusLine = doc.createElement("div");
  statusLine.className = "restarbeiten-list__status";
  statusLine.textContent = `Status: ${item.statusLabel}`;

  const dueLine = doc.createElement("div");
  dueLine.className = "restarbeiten-list__due";
  dueLine.textContent = `Fertig bis: ${item.dueDateLabel}`;

  const responsibleLine = doc.createElement("div");
  responsibleLine.className = "restarbeiten-list__responsible";
  responsibleLine.textContent = `Verantwortlich: ${item.responsibleLabel}`;

  const ampelLine = doc.createElement("div");
  const ampelDot = doc.createElement("span");
  ampelDot.className = `restarbeiten-list__ampel restarbeiten-list__ampel--${item.ampelState}`;
  ampelDot.dataset.ampel = item.ampelState;

  const ampelText = doc.createElement("span");
  ampelText.textContent = `Ampel: ${item.ampelLabel}`;
  ampelLine.append(ampelDot, ampelText);

  meta.append(classLine, statusLine, dueLine, responsibleLine, ampelLine);
  td.append(meta);
  return td;
}

function createHeaderCell(doc, text) {
  const th = doc.createElement("th");
  th.textContent = text;
  return th;
}

function buildListTable(doc, items, selectedId, onSelect) {
  const table = doc.createElement("table");
  table.className = "restarbeiten-list__table";

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
    row.className = "restarbeiten-list__row";
    row.dataset.restarbeitId = item.id;
    row.dataset.ampel = item.ampelState;
    if (String(item.id) === String(selectedId)) {
      row.classList.add("restarbeiten-list__row--selected");
      row.dataset.selected = "1";
    }
    row.addEventListener("click", () => onSelect(item.id));
    row.append(
      createLineCell(doc, item.numberLine, item.dateLine, "restarbeiten-list__number", "restarbeiten-list__date"),
      createLineCell(doc, item.locationLine1, item.locationLine2, "restarbeiten-list__location", "restarbeiten-list__location"),
      createLineCell(doc, item.workLine1, item.workLine2, "restarbeiten-list__shortText", "restarbeiten-list__longText"),
      createStatusCell(doc, item)
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
    this.projectFirms = [];
    this.attachmentsByItemId = new Map();
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
        this._loadSelectedAttachments().catch(() => {});
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
        onSetPrimaryAttachment: async (attachmentId) => {
          const selectedItem = this._getSelectedItem();
          if (!selectedItem?.id) return;
          await setPrimaryRestarbeitAttachment(selectedItem.id, attachmentId);
          await this._loadSelectedAttachments();
          this._renderEditbox();
        },
        onImportAttachments: async () => {
          const selectedItem = this._getSelectedItem();
          if (!selectedItem?.id || !this.effectiveProjectId) return;
          try {
            const result = await importRestarbeitAttachments(selectedItem.id, this.effectiveProjectId);
            const attachments = Array.isArray(result?.attachments) ? result.attachments : [];
            this.attachmentsByItemId.set(String(selectedItem.id), attachments);
            this.editbox?.setAttachments(attachments);
            this.editbox?.setStatus(result?.canceled ? "Fotoimport abgebrochen." : "Fotos importiert.");
          } catch (_error) {
            this.editbox?.setStatus("Fotos konnten nicht importiert werden.");
          }
        },
        onDeleteAttachment: async (attachmentId) => {
          const selectedItem = this._getSelectedItem();
          if (!selectedItem?.id) return;
          try {
            const result = await deleteRestarbeitAttachment(selectedItem.id, attachmentId);
            const attachments = Array.isArray(result?.attachments) ? result.attachments : [];
            this.attachmentsByItemId.set(String(selectedItem.id), attachments);
            this.editbox?.setAttachments(attachments);
            this.editbox?.setItem(selectedItem);
            this.editbox?.setStatus(result?.warning ? `Foto entfernt. Hinweis: ${result.warning}` : "Foto entfernt.");
          } catch (_error) {
            this.editbox?.setStatus("Foto konnte nicht entfernt werden.");
          }
        },
      });
      this.editHost.replaceChildren(this.editbox.render());
    }

    this.editbox.setProjectFirms(this.projectFirms);
    this.editbox.setItem(selectedItem);
    this.editbox.setAttachments(this.attachmentsByItemId.get(String(selectedItem.id)) || []);
    this.editbox.setStatus(selectedItem ? `Ausgewählt: #${selectedItem.running_number || selectedItem.id}` : "");
  }

  async _loadSelectedAttachments() {
    const selectedItem = this._getSelectedItem();
    if (!selectedItem?.id || !this.editbox) return;
    const itemId = String(selectedItem.id);
    try {
      const attachments = await listRestarbeitAttachments(itemId);
      this.attachmentsByItemId.set(itemId, Array.isArray(attachments) ? attachments : []);
      this.editbox.setAttachments(this.attachmentsByItemId.get(itemId) || []);
    } catch (_error) {
      this.attachmentsByItemId.set(itemId, []);
      this.editbox.setAttachments([]);
      this.editbox.setStatus("Fotos konnten nicht geladen werden.");
      throw _error;
    }
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
    ensureRestarbeitenListStyle(document);

    const root = document.createElement("div");
    root.className = "restarbeiten-list";
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
      const [rows, firms] = await Promise.all([
        listRestarbeitenByProject(this.effectiveProjectId),
        listResponsibleProjectFirms(this.effectiveProjectId),
      ]);
      this.rows = Array.isArray(rows) ? rows : [];
      this.attachmentsByItemId = new Map();
      this.projectFirms = Array.isArray(firms) ? firms : [];
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
      this.projectFirms = [];
      this.attachmentsByItemId = new Map();
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
