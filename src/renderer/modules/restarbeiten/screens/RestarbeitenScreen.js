import {
  createRestarbeitItem,
  getRestarbeitenProjectSettings,
  listRestarbeitenByProject,
  listResponsibleProjectFirms,
  listRestarbeitAttachments,
  updateRestarbeitItem,
} from "../data/restarbeitenDataSource.js";
import { mapRestarbeitenStatusLabel, toRestarbeitenListItems } from "../viewModel/restarbeitenListItems.js";
import RestarbeitenEditbox from "./RestarbeitenEditbox.js";
import { ensureRestarbeitenListStyle } from "./restarbeitenListStyle.js";

const LOCATION_KEYS = ["location_level_1", "location_level_2", "location_level_3", "location_level_4"];
const LOCATION_LABEL_FALLBACKS = ["Ebene 1", "Ebene 2", "Ebene 3", "Ebene 4"];
const STATUS_FILTER_ORDER = ["offen", "in_arbeit", "erledigt_gemeldet", "geprueft_erledigt", "zurueckgewiesen", "verzug"];

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
    this.locationOptions = { location_level_1: [], location_level_2: [], location_level_3: [], location_level_4: [] };
    this.editbox = null;

    this.filterState = {
      item_class: "",
      location_level_1: "",
      location_level_2: "",
      location_level_3: "",
      location_level_4: "",
      status: "",
      due_date: "",
      responsible_project_firm_id: "",
    };

    this.attachmentsByItemId = new Map();
    this.expandedPhotoRows = new Map();

    this.host = null;
    this.headerHost = null;
    this.headerFiltersHost = null;
    this.listHost = null;
    this.editHost = null;
    this.createScrollPending = false;
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

    const filters = doc.createElement("div");
    filters.className = "restarbeiten-header__filters";

    const actions = doc.createElement("div");
    actions.className = "restarbeiten-header__actions";

    const btnClose = doc.createElement("button");
    btnClose.type = "button";
    btnClose.textContent = "Schließen";
    btnClose.onclick = () => this.router?.showProjectWorkspace?.();

    actions.append(btnClose);
    header.append(filters, actions);

    this.headerHost = header;
    this.headerFiltersHost = filters;
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
    this.locationOptions = this._collectLocationOptionsFromRows(this.rows);

    if (selectItemId) {
      this._setSelectedItemId(selectItemId);
    } else if (!this.selectedItemId && this.rows[0]?.id) {
      this._setSelectedItemId(this.rows[0].id);
    }

    await this._loadSelectedAttachments();
    this._renderHeaderFilters();
    this._renderList();
    this._renderEditbox();
    if (this.createScrollPending) this._scrollListToBottom();
  }


  _collectLocationOptionsFromRows(rows = []) {
    const options = {};
    for (const key of LOCATION_KEYS) {
      const unique = new Set();
      for (const row of Array.isArray(rows) ? rows : []) {
        const value = normalizeText(row?.[key]);
        if (value) unique.add(value);
      }
      options[key] = [...unique].sort((a, b) => a.localeCompare(b, "de"));
    }
    return options;
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
    const classFilter = this._buildClassFilter(doc);
    const locationWrap = doc.createElement("div");
    locationWrap.className = "restarbeiten-filterleiste__locationFilters";
    const locationGroupA = doc.createElement("div");
    locationGroupA.className = "restarbeiten-filterleiste__locationGroupA";
    locationGroupA.append(this._buildSingleFilter(doc, "location_level_1", 1), this._buildSingleFilter(doc, "location_level_2", 2));
    const locationGroupB = doc.createElement("div");
    locationGroupB.className = "restarbeiten-filterleiste__locationGroupB";
    locationGroupB.append(this._buildSingleFilter(doc, "location_level_3", 3), this._buildSingleFilter(doc, "location_level_4", 4));
    locationWrap.append(locationGroupA, locationGroupB);

    const metaWrap = doc.createElement("div");
    metaWrap.className = "restarbeiten-filterleiste__metaFilters";
    const metaTopRow = doc.createElement("div");
    metaTopRow.className = "restarbeiten-filterleiste__metaTopRow";
    metaTopRow.append(
      this._buildMetaFilter(doc, {
        key: "status",
        label: "Status",
        values: this._collectStatusFilterValues(),
      }),
      this._buildMetaFilter(doc, {
        key: "due_date",
        label: "Fertig bis",
        values: this._collectUniqueRowsValues("due_date"),
        formatDisplay: (value) => this._formatDateDisplay(value),
      })
    );
    const metaResponsibleRow = doc.createElement("div");
    metaResponsibleRow.className = "restarbeiten-filterleiste__metaResponsibleRow";
    metaResponsibleRow.append(
      this._buildMetaFilter(doc, {
        key: "responsible_project_firm_id",
        label: "Verantwortlich",
        values: this._collectResponsibleValues(),
      })
    );
    metaWrap.append(metaTopRow, metaResponsibleRow);

    this.headerFiltersHost.replaceChildren(classFilter, locationWrap, metaWrap);
  }

  _buildClassFilter(doc) {
    const wrap = doc.createElement("div");
    wrap.className = "restarbeiten-filterleiste__classFilter";
    const values = [
      { value: "", label: "Alle" },
      { value: "mangel", label: "Mangel" },
      { value: "rest", label: "Rest" },
    ];
    for (const entry of values) {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "restarbeiten-filterleiste__classFilterButton";
      button.textContent = entry.label;
      button.dataset.active = this.filterState.item_class === entry.value ? "1" : "0";
      button.onclick = () => {
        this.filterState.item_class = entry.value;
        this._renderHeaderFilters();
        this._renderList();
      };
      wrap.append(button);
    }
    return wrap;
  }

  _buildSingleFilter(doc, key, levelIndex) {
    const wrap = doc.createElement("label");
    wrap.className = "restarbeiten-filterleiste__field";

    const caption = doc.createElement("span");
    caption.className = "restarbeiten-filterleiste__fieldLabel";
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

  _collectUniqueRowsValues(key) {
    const unique = new Set();
    for (const row of this.rows) {
      const value = normalizeText(row?.[key]);
      if (value) unique.add(value);
    }
    return [...unique].sort((a, b) => a.localeCompare(b, "de"));
  }

  _collectStatusFilterValues() {
    const unique = new Set();
    for (const row of this.rows) {
      const value = normalizeText(row?.status).toLowerCase();
      if (value) unique.add(value);
    }
    const values = [...unique];
    values.sort((a, b) => {
      const indexA = STATUS_FILTER_ORDER.indexOf(a);
      const indexB = STATUS_FILTER_ORDER.indexOf(b);
      if (indexA >= 0 && indexB >= 0) return indexA - indexB;
      if (indexA >= 0) return -1;
      if (indexB >= 0) return 1;
      return a.localeCompare(b, "de");
    });
    return values.map((value) => ({ value, label: mapRestarbeitenStatusLabel(value) }));
  }

  _collectResponsibleValues() {
    const map = new Map();
    for (const firm of this.projectFirms) {
      const id = normalizeText(firm?.id);
      const label = normalizeText(firm?.name || firm?.display_name || firm?.label);
      if (id && label) map.set(id, label);
    }
    for (const row of this.rows) {
      const id = normalizeText(row?.responsible_project_firm_id);
      const label = normalizeText(row?.responsible_label);
      if (id && !map.has(id)) map.set(id, label || id);
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }

  _formatDateDisplay(value) {
    const text = normalizeText(value);
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return text || "—";
    return `${match[3]}.${match[2]}.${match[1]}`;
  }

  _buildMetaFilter(doc, { key, label, values = [], formatDisplay = null } = {}) {
    const wrap = doc.createElement("label");
    wrap.className = "restarbeiten-filterleiste__field";
    const caption = doc.createElement("span");
    caption.className = "restarbeiten-filterleiste__fieldLabel";
    caption.textContent = label;
    const select = doc.createElement("select");
    select.dataset.filterKey = key;
    const allOption = doc.createElement("option");
    allOption.value = "";
    allOption.textContent = "Alle";
    select.append(allOption);
    const allowedValues = new Set([""]);
    for (const entry of values) {
      const rawValue = typeof entry === "object" ? normalizeText(entry.value) : normalizeText(entry);
      if (!rawValue) continue;
      allowedValues.add(rawValue);
      const opt = doc.createElement("option");
      opt.value = rawValue;
      const display = typeof entry === "object" ? normalizeText(entry.label || entry.value) : rawValue;
      opt.textContent = formatDisplay ? formatDisplay(display) : display;
      select.append(opt);
    }
    const currentValue = normalizeText(this.filterState[key]);
    if (currentValue && !allowedValues.has(currentValue)) {
      this.filterState[key] = "";
      select.value = "";
    } else {
      select.value = currentValue;
    }
    select.addEventListener("change", () => {
      this.filterState[key] = normalizeText(select.value);
      this._renderList();
    });
    wrap.append(caption, select);
    return wrap;
  }

  _getFilterLabel(levelIndex) {
    return normalizeText(this.projectSettings?.[`level_${levelIndex}_label`]) || LOCATION_LABEL_FALLBACKS[levelIndex - 1];
  }

  _renderList() {
    if (!this.listHost) return;
    const doc = this.listHost.ownerDocument || globalThis.document;

    if (!this.effectiveProjectId) {
      this.listHost.replaceChildren(createMessage(doc, "Kein Projektkontext für Restarbeiten vorhanden."));
      return;
    }

    this.filteredItems = this._getFilteredItems();

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
    const rowsById = new Map(this.rows.map((row) => [String(row?.id), row]));
    return this.items.filter((item) => {
      const row = rowsById.get(String(item.id));
      if (!row) return false;

      const classFilter = normalizeText(this.filterState.item_class).toLowerCase();
      if (classFilter && normalizeText(row.item_class).toLowerCase() !== classFilter) return false;

      const locationMatches = LOCATION_KEYS.every((key, idx) => {
        const selected = normalizeText(this.filterState[key]);
        if (!selected) return true;
        return normalizeText(item[`locationLevel${idx + 1}`]) === selected;
      });
      if (!locationMatches) return false;

      const statusFilter = normalizeText(this.filterState.status);
      if (statusFilter && normalizeText(row.status) !== statusFilter) return false;

      const dueDateFilter = normalizeText(this.filterState.due_date);
      if (dueDateFilter && normalizeText(row.due_date) !== dueDateFilter) return false;

      const responsibleFilter = normalizeText(this.filterState.responsible_project_firm_id);
      if (responsibleFilter && normalizeText(row.responsible_project_firm_id) !== responsibleFilter) return false;

      return true;
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
    number.textContent = `${item.itemClassToken} ${item.numberLine}`;

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

    const statusLine = doc.createElement("div");
    statusLine.className = "restarbeiten-list__ampelLine";
    statusLine.textContent = item.statusLabel;

    const ampelDot = doc.createElement("span");
    ampelDot.className = `restarbeiten-list__ampel restarbeiten-list__ampel--${item.ampelState}`;
    ampelDot.dataset.ampel = String(item.ampelState || "neutral");
    statusLine.append(ampelDot);

    const dueDateLine = doc.createElement("div");
    dueDateLine.textContent = item.dueDateLabel;

    const responsibleLine = doc.createElement("div");
    responsibleLine.textContent = item.responsibleLabel;

    col.append(statusLine, dueDateLine, responsibleLine);

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
        onCreate: this.effectiveProjectId ? async () => this._createRestarbeit() : null,
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
    this.editbox.setLocationOptions(this.locationOptions);
    this.editbox.setItem(selectedItem);
    this.editbox.setProjectFirms(this.projectFirms);
    this.editbox.setAttachments(this.attachmentsByItemId.get(String(selectedItem.id)) || []);
  }

  async _createRestarbeit() {
    if (!this.effectiveProjectId) return;
    const created = await createRestarbeitItem(this.effectiveProjectId, {});
    this.createScrollPending = true;
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

  _scrollListToBottom() {
    if (!this.sheetArea) return;
    const target = Number(this.sheetArea.scrollHeight || 0) - Number(this.sheetArea.clientHeight || 0);
    this.sheetArea.scrollTop = target > 0 ? target : 0;
    this.createScrollPending = false;
  }
}
