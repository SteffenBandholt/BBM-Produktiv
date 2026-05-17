import {
  createRestarbeitItem,
  getRestarbeitenProjectSettings,
  listRestarbeitenByProject,
  listResponsibleProjectFirms,
  listRestarbeitAttachments,
  updateRestarbeitItem,
} from "../data/restarbeitenDataSource.js";
import { toRestarbeitenListItems } from "../viewModel/restarbeitenListItems.js";
import RestarbeitenEditbox from "./RestarbeitenEditbox.js";
import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";
import { ensureRestarbeitenListStyle } from "./restarbeitenListStyle.js";

const LOCATION_KEYS = ["location_level_1", "location_level_2", "location_level_3", "location_level_4"];
const LOCATION_LABEL_FALLBACKS = ["Ebene 1", "Ebene 2", "Ebene 3", "Ebene 4"];

function normalizeText(value) {
  return String(value || "").trim();
}

function createMessage(doc, text) {
  const el = doc.createElement("p");
  el.textContent = text;
  el.style.margin = "0";
  return el;
}

function buildCompactLocation(item = {}) {
  const values = [item.locationLevel1, item.locationLevel2, item.locationLevel3, item.locationLevel4]
    .map(normalizeText)
    .filter(Boolean);
  return values.length ? values.join(" · ") : "—";
}

export default class RestarbeitenScreen {
  constructor({ router, projectId, project, moduleId } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.moduleId = moduleId || "restarbeiten";

    this.effectiveProjectId = "";
    this.rows = [];
    this.items = [];
    this.filteredItems = [];
    this.selectedItemId = "";
    this.projectFirms = [];
    this.projectSettings = null;
    this.editbox = null;

    this.filterState = {
      location_level_1: "",
      location_level_2: "",
      location_level_3: "",
      location_level_4: "",
    };

    this.attachmentsByItemId = new Map();
    this.expandedPhotoRows = new Map();

    this.host = null;
    this.headerHost = null;
    this.headerFiltersHost = null;
    this.btnCreate = null;
    this.listHost = null;
    this.editHost = null;
  }

  render() {
    const doc = globalThis.document;
    ensureRestarbeitenListStyle(doc);

    this.host = doc.createElement("div");
    this.host.setAttribute("data-bbm-restarbeiten-screen", "true");

    this._buildHeader(doc);
    this._buildSheetArea(doc);
    this._buildEditArea(doc);

    this.host.append(this.headerHost, this.sheetArea, this.editArea);

    this._renderHeaderFilters();
    this._renderList();
    this._renderEditbox();

    return this.host;
  }

  _buildHeader(doc) {
    const header = doc.createElement("header");
    header.className = "restarbeiten-header";

    const title = doc.createElement("div");
    title.textContent = "Restarbeiten";

    const filters = doc.createElement("div");
    filters.className = "restarbeiten-header__filters";

    const actions = doc.createElement("div");
    actions.className = "restarbeiten-header__actions";

    const btnClose = doc.createElement("button");
    btnClose.type = "button";
    btnClose.textContent = "Schließen";
    btnClose.onclick = () => this.router?.showProjectWorkspace?.();

    const btnCreate = doc.createElement("button");
    btnCreate.type = "button";
    btnCreate.textContent = "+ Restarbeit";
    btnCreate.disabled = true;
    btnCreate.onclick = () => this._createRestarbeit();

    const btnMeta = doc.createElement("button");
    btnMeta.type = "button";
    btnMeta.textContent = "Metaspalten";
    applyPopupButtonStyle(btnMeta);

    actions.append(btnClose, btnCreate, btnMeta);
    header.append(title, filters, actions);

    this.headerHost = header;
    this.headerFiltersHost = filters;
    this.btnCreate = btnCreate;
  }

  _buildSheetArea(doc) {
    this.sheetArea = doc.createElement("section");
    this.sheetArea.setAttribute("data-bbm-restarbeiten-screen-area", "sheet");

    const sheetCanvas = doc.createElement("div");
    sheetCanvas.setAttribute("data-bbm-restarbeiten-screen-sheet-canvas", "true");

    const sheetPaper = doc.createElement("div");
    sheetPaper.setAttribute("data-bbm-restarbeiten-screen-sheet-paper", "true");

    const listHost = doc.createElement("div");
    listHost.className = "restarbeiten-sheet__list";

    sheetPaper.append(listHost);
    sheetCanvas.append(sheetPaper);
    this.sheetArea.append(sheetCanvas);

    this.listHost = listHost;
  }

  _buildEditArea(doc) {
    this.editArea = doc.createElement("section");
    this.editArea.setAttribute("data-bbm-restarbeiten-screen-area", "edit");

    const editCanvas = doc.createElement("div");
    editCanvas.setAttribute("data-bbm-restarbeiten-screen-edit-canvas", "true");

    this.editArea.append(editCanvas);
    this.editHost = editCanvas;
  }

  async load({ selectItemId = "" } = {}) {
    this.effectiveProjectId = normalizeText(this.projectId || this.project?.id || this.router?.currentProjectId);

    if (!this.effectiveProjectId) {
      this.rows = [];
      this.items = [];
      this._renderHeaderFilters();
      this._renderList();
      this._renderEditbox();
      return;
    }

    const [rows, projectFirms, projectSettings] = await Promise.all([
      listRestarbeitenByProject(this.effectiveProjectId),
      listResponsibleProjectFirms(this.effectiveProjectId),
      getRestarbeitenProjectSettings(this.effectiveProjectId),
    ]);

    this.rows = Array.isArray(rows) ? rows : [];
    this.items = toRestarbeitenListItems(this.rows);
    this.projectFirms = Array.isArray(projectFirms) ? projectFirms : [];
    this.projectSettings = projectSettings || null;

    if (selectItemId) {
      this._setSelectedItemId(selectItemId);
    } else if (!this.selectedItemId && this.rows[0]?.id) {
      this._setSelectedItemId(this.rows[0].id);
    }

    await this._loadSelectedAttachments();
    this._renderHeaderFilters();
    this._renderList();
    this._renderEditbox();
  }

  _setSelectedItemId(itemId) {
    this.selectedItemId = normalizeText(itemId);
    if (this.editbox) this.editbox.setItem(this._getSelectedItem());
  }

  _getSelectedItem() {
    return this.rows.find((item) => String(item.id) === String(this.selectedItemId)) || null;
  }

  _renderHeaderFilters() {
    if (!this.headerFiltersHost) return;

    const doc = this.headerFiltersHost.ownerDocument || globalThis.document;
    const controls = LOCATION_KEYS.map((key, idx) => this._buildSingleFilter(doc, key, idx + 1));

    this.headerFiltersHost.replaceChildren(...controls);
    this._syncCreateButtonState();
  }

  _buildSingleFilter(doc, key, levelIndex) {
    const wrap = doc.createElement("label");
    wrap.className = "restarbeiten-header__filter";

    const caption = doc.createElement("span");
    caption.textContent = this._getFilterLabel(levelIndex);

    const select = doc.createElement("select");
    select.dataset.filterKey = key;

    const allOption = doc.createElement("option");
    allOption.value = "";
    allOption.textContent = "Alle";
    select.append(allOption);

    const values = this._collectFilterValues(levelIndex);
    for (const value of values) {
      const opt = doc.createElement("option");
      opt.value = value;
      opt.textContent = value;
      select.append(opt);
    }

    select.value = normalizeText(this.filterState[key]);
    select.addEventListener("change", () => {
      this.filterState[key] = normalizeText(select.value);
      this._renderList();
    });

    wrap.append(caption, select);
    return wrap;
  }

  _collectFilterValues(levelIndex) {
    const values = this.items
      .map((item) => normalizeText(item[`locationLevel${levelIndex}`]))
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b, "de"));
  }

  _getFilterLabel(levelIndex) {
    return normalizeText(this.projectSettings?.[`level_${levelIndex}_label`]) || LOCATION_LABEL_FALLBACKS[levelIndex - 1];
  }

  _syncCreateButtonState() {
    if (this.btnCreate) this.btnCreate.disabled = !this.effectiveProjectId;
  }

  _renderList() {
    if (!this.listHost) return;
    const doc = this.listHost.ownerDocument || globalThis.document;

    if (!this.effectiveProjectId) {
      this.listHost.replaceChildren(createMessage(doc, "Kein Projektkontext für Restarbeiten vorhanden."));
      this._syncCreateButtonState();
      return;
    }

    this.filteredItems = this._getFilteredItems();
    this._syncCreateButtonState();

    if (!this.filteredItems.length) {
      this.listHost.replaceChildren(createMessage(doc, "Keine Restarbeiten für die aktuellen Filter."));
      return;
    }

    const list = doc.createElement("ul");
    list.className = "restarbeiten-list";

    for (const item of this.filteredItems) {
      list.append(this._renderListRow(doc, item));
    }

    this.listHost.replaceChildren(list);
  }

  _getFilteredItems() {
    return this.items.filter((item) => {
      return LOCATION_KEYS.every((key, idx) => {
        const selected = normalizeText(this.filterState[key]);
        if (!selected) return true;
        return normalizeText(item[`locationLevel${idx + 1}`]) === selected;
      });
    });
  }

  _renderListRow(doc, item) {
    const row = doc.createElement("li");
    row.className = "restarbeiten-list__row";
    row.dataset.restarbeitId = String(item.id || "");
    row.dataset.selected = String(item.id) === String(this.selectedItemId) ? "1" : "0";

    const rowGrid = doc.createElement("div");
    rowGrid.className = "restarbeiten-list__rowGrid";

    rowGrid.append(
      this._renderNumberColumn(doc, item),
      this._renderTextColumn(doc, item),
      this._renderMetaColumn(doc, item)
    );

    const attachmentsWrap = this._renderAttachmentsPreview(doc, item);

    row.append(rowGrid, attachmentsWrap);
    row.addEventListener("click", () => this._selectRow(item.id));

    return row;
  }

  _renderNumberColumn(doc, item) {
    const col = doc.createElement("div");
    col.className = "restarbeiten-list__numberCol";

    const number = doc.createElement("div");
    number.className = "restarbeiten-list__number";
    number.textContent = item.numberLine;

    const date = doc.createElement("div");
    date.className = "restarbeiten-list__date";
    date.textContent = item.dateLine;

    const toggle = this._buildPhotoToggle(doc, item);
    col.append(number, date, toggle);

    return col;
  }

  _buildPhotoToggle(doc, item) {
    const key = String(item.id);
    const photosOpen = this.expandedPhotoRows.get(key) === true;

    const toggle = doc.createElement("button");
    toggle.type = "button";
    toggle.className = "restarbeiten-list__photosToggle";
    toggle.textContent = photosOpen ? "▾ Fotos" : "▸ Fotos";
    toggle.dataset.expanded = photosOpen ? "1" : "0";
    toggle.setAttribute("aria-expanded", photosOpen ? "true" : "false");
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.expandedPhotoRows.set(key, !photosOpen);
      this._renderList();
    });

    return toggle;
  }

  _renderTextColumn(doc, item) {
    const col = doc.createElement("div");
    col.className = "restarbeiten-list__textCol";

    const location = doc.createElement("div");
    location.className = "restarbeiten-list__locationCompact";
    location.textContent = buildCompactLocation(item);

    const shortText = doc.createElement("div");
    shortText.className = "restarbeiten-list__shortText";
    shortText.textContent = item.workLine1;

    const longText = doc.createElement("div");
    longText.className = "restarbeiten-list__longText";
    longText.textContent = item.workLine2;

    col.append(location, shortText, longText);
    return col;
  }

  _renderMetaColumn(doc, item) {
    const col = doc.createElement("div");
    col.className = "restarbeiten-list__metaCol";

    const lines = [
      `Klasse: ${item.itemClassLabel}`,
      `Status: ${item.statusLabel}`,
      `Fertig bis: ${item.dueDateLabel}`,
      `Verantwortlich: ${item.responsibleLabel}`,
    ];

    for (const text of lines) {
      const line = doc.createElement("div");
      line.textContent = text;
      col.append(line);
    }

    const ampelLine = doc.createElement("div");
    ampelLine.className = "restarbeiten-list__ampelLine";

    const ampelDot = doc.createElement("span");
    ampelDot.className = `restarbeiten-list__ampel restarbeiten-list__ampel--${item.ampelState}`;
    ampelDot.dataset.ampel = String(item.ampelState || "neutral");

    const ampelText = doc.createElement("span");
    ampelText.textContent = `Ampel: ${item.ampelLabel}`;

    ampelLine.append(ampelDot, ampelText);
    col.append(ampelLine);

    return col;
  }

  _renderAttachmentsPreview(doc, item) {
    const key = String(item.id);
    const photosOpen = this.expandedPhotoRows.get(key) === true;
    const attachments = this.attachmentsByItemId.get(key) || [];

    const wrap = doc.createElement("div");
    wrap.className = "restarbeiten-list__attachmentsWrap";
    wrap.dataset.expanded = photosOpen ? "1" : "0";
    wrap.hidden = !photosOpen;

    if (!attachments.length) {
      wrap.textContent = "Keine Fotos vorbereitet.";
      return wrap;
    }

    const preview = attachments
      .slice(0, 3)
      .map((entry) => entry.caption || entry.file_name || "Foto")
      .join(", ");
    wrap.textContent = `Fotos: ${preview}`;

    return wrap;
  }

  _selectRow(itemId) {
    this._setSelectedItemId(itemId);
    const key = String(itemId);
    if (!this.expandedPhotoRows.has(key)) this.expandedPhotoRows.set(key, true);

    this._renderList();
    this._renderEditbox();
    this._loadSelectedAttachments().catch(() => {});
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
      this.editbox.setProjectFirms(this.projectFirms);
    }

    this.editbox.setLocationLabels(this.projectSettings || {});
    this.editbox.setItem(selectedItem);
    this.editbox.setProjectFirms(this.projectFirms);
    this.editbox.setAttachments(this.attachmentsByItemId.get(String(selectedItem.id)) || []);
  }

  async _createRestarbeit() {
    if (!this.effectiveProjectId) return;
    const created = await createRestarbeitItem(this.effectiveProjectId, {});
    await this.load({ selectItemId: created?.id || "" });
  }

  async _loadSelectedAttachments() {
    const selected = this._getSelectedItem();
    if (!selected?.id) return;

    try {
      const attachments = await listRestarbeitAttachments(selected.id);
      this.attachmentsByItemId.set(String(selected.id), Array.isArray(attachments) ? attachments : []);
      this.editbox?.setStatus("");
    } catch {
      this.attachmentsByItemId.set(String(selected.id), []);
      this.editbox?.setStatus("Fotos konnten nicht geladen werden.");
    }
  }
}
