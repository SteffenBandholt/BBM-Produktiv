import {
  createRestarbeitItem,
  getRestarbeitenProjectSettings,
  listRestarbeitenByProject,
  listResponsibleProjectFirms,
  listRestarbeitAttachments,
  updateRestarbeitItem,
  softDeleteRestarbeitItem,
} from "../data/restarbeitenDataSource.js";
import { mapRestarbeitenStatusLabel, toRestarbeitenListItems } from "../viewModel/restarbeitenListItems.js";
import RestarbeitenEditbox from "./RestarbeitenEditbox.js";
import RestarbeitenQuicklane from "./RestarbeitenQuicklane.js";
import { ensureRestarbeitenListStyle } from "./restarbeitenListStyle.js";
import { createUiInspectorRuntime } from "../../../uiInspector/index.js";

const LOCATION_KEYS = ["location_level_1", "location_level_2", "location_level_3", "location_level_4"];
const LOCATION_LABEL_FALLBACKS = ["Ebene 1", "Ebene 2", "Ebene 3", "Ebene 4"];
const STATUS_FILTER_ORDER = ["offen", "in_arbeit", "erledigt_gemeldet", "geprueft_erledigt", "zurueckgewiesen", "verzug"];
const COMPLETED_STATUS_VALUES = new Set(["erledigt", "erledigt_gemeldet", "geprueft_erledigt", "geprüft erledigt"]);

function normalizeText(value) {
  return String(value || "").trim();
}

function isRestarbeitenCompletedRow(row = {}) {
  const status = normalizeText(row?.status).toLowerCase();
  if (COMPLETED_STATUS_VALUES.has(status)) return true;
  return !!normalizeText(row?.completed_at);
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
  return values.length ? values.join(" Â· ") : "â€”";
}

function buildRestarbeitenLocationLabels(projectSettings = null) {
  return {
    level_1_label: normalizeText(projectSettings?.level_1_label) || "Haus",
    level_2_label: normalizeText(projectSettings?.level_2_label) || "Geschoss",
    level_3_label: normalizeText(projectSettings?.level_3_label) || "Einheit",
    level_4_label: normalizeText(projectSettings?.level_4_label) || "Raum",
  };
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
    this.quicklane = null;
    this.showAmpelInList = true;
    this.showLongtextInList = true;

    this.filterState = {
      item_class: "",
      location_level_1: "",
      location_level_2: "",
      location_level_3: "",
      location_level_4: "",
      status: "",
      due_date: "",
      responsible_project_firm_id: "",
      completed_state: "",
    };

    this.attachmentsByItemId = new Map();
    this.expandedPhotoRows = new Map();

    this.host = null;
    this.headerHost = null;
    this.headerFiltersHost = null;
    this.moduleHeaderContextHost = null;
    this.listHeaderHost = null;
    this.listHost = null;
    this.editHost = null;
    this.createScrollPending = false;
    this.uiInspectorRuntime = createUiInspectorRuntime();
    this.uiInspectorOverlayActive = false;
    this.uiInspectorKeydownHandler = null;
    this.uiInspectorKeydownHost = null;
  }

  render() {
    const doc = globalThis.document;
    ensureRestarbeitenListStyle(doc);

    this.host = doc.createElement("div");
    this.host.setAttribute("data-bbm-restarbeiten-screen", "true");
    this.host.setAttribute("data-ui-inspector-id", "restarbeiten.root");

    this._buildHeader(doc);
    this._buildSheetArea(doc);
    this._buildQuicklane(doc);
    this._buildEditArea(doc);

    this.host.append(this.workArea, this.editArea);

    this._applyAmpelVisibility();
    this._syncRestarbeitenContextUi();
    this._renderHeaderFilters();
    this._renderList();
    this._renderEditbox();
    this._bindUiInspectorToggleShortcut(doc);

    return this.host;
  }


  _bindUiInspectorToggleShortcut(doc) {
    if (!doc || this.uiInspectorKeydownHandler) return;
    if (typeof doc.addEventListener !== "function") return;
    this.uiInspectorKeydownHandler = (event) => {
      if (!event || event.repeat) return;
      const key = String(event.key || '').toLowerCase();
      if (!(event.ctrlKey && event.altKey && key === 'i')) return;
      event.preventDefault?.();
      if (this.uiInspectorOverlayActive) {
        this.uiInspectorRuntime.deactivateOverlay();
        this.uiInspectorOverlayActive = false;
      } else if (this.host) {
        this.uiInspectorOverlayActive = this.uiInspectorRuntime.activateOverlay(this.host) === true;
      }
    };
    doc.addEventListener('keydown', this.uiInspectorKeydownHandler);
    this.uiInspectorKeydownHost = doc;
  }


  dispose() {
    if (
      this.uiInspectorKeydownHost &&
      typeof this.uiInspectorKeydownHost.removeEventListener === "function" &&
      this.uiInspectorKeydownHandler
    ) {
      this.uiInspectorKeydownHost.removeEventListener('keydown', this.uiInspectorKeydownHandler);
    }
    this.uiInspectorRuntime?.deactivateOverlay?.();
    this.uiInspectorOverlayActive = false;
    this.uiInspectorKeydownHandler = null;
    this.uiInspectorKeydownHost = null;
  }

  _buildHeader(doc) {
    const header = doc.createElement("header");
    header.className = "restarbeiten-header restarbeiten-moduleHeader";
    header.setAttribute("data-ui-inspector-id", "restarbeiten.header");

    const btnClose = doc.createElement("button");
    btnClose.type = "button";
    btnClose.textContent = "Schließen";
    btnClose.onclick = () => this.router?.showProjectWorkspace?.();

    this.headerHost = header;
    this.headerCloseButton = btnClose;
  }

  _buildSheetArea(doc) {
    this.workArea = doc.createElement("div");
    this.workArea.className = "restarbeiten-workarea";
    this.workArea.setAttribute("data-ui-inspector-id", "restarbeiten.main");

    this.contentArea = doc.createElement("div");
    this.contentArea.className = "restarbeiten-workarea__content";

    this.listHeaderHost = doc.createElement("div");
    this.listHeaderHost.className = "restarbeiten-listHeader";
    this.listHeaderHost.setAttribute("data-ui-inspector-id", "restarbeiten.filterleiste");
    this.headerFiltersHost = this.listHeaderHost;

    this.sheetArea = doc.createElement("section");
    this.sheetArea.setAttribute("data-bbm-restarbeiten-screen-area", "sheet");

    const sheetCanvas = doc.createElement("div");
    sheetCanvas.setAttribute("data-bbm-restarbeiten-screen-sheet-canvas", "true");

    const sheetPaper = doc.createElement("div");
    sheetPaper.setAttribute("data-bbm-restarbeiten-screen-sheet-paper", "true");

    const listHost = doc.createElement("div");
    listHost.className = "restarbeiten-sheet__list";
    listHost.setAttribute("data-ui-inspector-id", "restarbeiten.liste");

    sheetPaper.append(listHost);
    sheetCanvas.append(sheetPaper);
    this.sheetArea.append(sheetCanvas);

    this.listHost = listHost;
    this.contentArea.append(this.listHeaderHost, this.sheetArea);
    this.workArea.append(this.contentArea);
  }

  _buildQuicklane(doc) {
    this.quicklane = new RestarbeitenQuicklane({
      onTogglePin: (pinned) => {
        this.quicklane?.setPinned?.(pinned);
      },
      onOpenFirms: async () => {
        const projectId = this.effectiveProjectId || this.projectId || this.router?.currentProjectId || null;
        if (!projectId) return;
        const project = this.project || null;
        await this.router?.showProjectFirms?.(projectId, {
          returnContext: {
            section: "restarbeiten",
            projectId,
            project,
          },
        });
      },
      onOpenPreview: async () => {
        await this.openRestarbeitenPreview();
      },
      onOpenEmail: async () => {
        await this.openRestarbeitenEmail();
      },
      onToggleLight: async () => {
        await this.toggleAmpelDisplay();
      },
      onToggleLongtext: async () => {
        await this.toggleLongtextDisplay();
      },
      ampelEnabled: this.showAmpelInList,
      longtextEnabled: this.showLongtextInList,
    });
    const quicklaneHost = this.quicklane.render(doc);
    this.workArea.append(quicklaneHost);
    this.quicklane?.setAmpelEnabled?.(this.showAmpelInList);
    this.quicklane?.setLongtextEnabled?.(this.showLongtextInList);
  }

  _buildEditArea(doc) {
    this.editArea = doc.createElement("section");
    this.editArea.setAttribute("data-bbm-restarbeiten-screen-area", "edit");
    this.editArea.setAttribute("data-ui-inspector-id", "restarbeiten.editbox");

    const editCanvas = doc.createElement("div");
    editCanvas.setAttribute("data-bbm-restarbeiten-screen-edit-canvas", "true");

    this.editArea.append(editCanvas);
    this.editHost = editCanvas;
  }

  async load({ selectItemId = "", keepSelectionEmpty = false } = {}) {
    const metaLayoutPromise = this._syncRestarbeitenMetaSurfaceLayout();
    this.effectiveProjectId = normalizeText(this.projectId || this.project?.id || this.router?.currentProjectId);
    this._applyAmpelVisibility();
    this._syncRestarbeitenContextUi();

    if (!this.effectiveProjectId) {
      await metaLayoutPromise;
      this.rows = [];
      this.items = [];
      this._renderHeaderFilters();
      this._renderList();
      this._renderEditbox();
      return;
    }

    const [, rows, projectFirms, projectSettings] = await Promise.all([
      metaLayoutPromise,
      listRestarbeitenByProject(this.effectiveProjectId),
      listResponsibleProjectFirms(this.effectiveProjectId),
      getRestarbeitenProjectSettings(this.effectiveProjectId),
    ]);

    this.rows = Array.isArray(rows) ? rows : [];
    this.items = toRestarbeitenListItems(this.rows);
    this.projectFirms = Array.isArray(projectFirms) ? projectFirms : [];
    this.projectSettings = projectSettings || null;
    this.locationOptions = this._collectLocationOptionsFromRows(this.rows);

    if (keepSelectionEmpty) {
      this._setSelectedItemId("");
    } else if (selectItemId) {
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

  async _syncRestarbeitenMetaSurfaceLayout() {
    const header = this.listHeaderHost;
    const api = globalThis.window?.bbmDb;
    if (!header?.style?.setProperty || typeof api?.tableLayoutsGetOne !== "function") return null;
    try {
      const res = await api.tableLayoutsGetOne({
        moduleId: "restarbeiten",
        tableKey: "restarbeiten_filter_meta",
        orientation: "portrait",
        scopeType: "global",
        scopeId: "",
      });
      if (!res?.ok) return null;

      const layout = res?.data?.effectiveLayout || res?.data?.defaultLayout || null;
      const rootVars = layout?.ui?.rootVars && typeof layout.ui.rootVars === "object" ? layout.ui.rootVars : {};
      for (const [key, value] of Object.entries(rootVars)) {
        if (!String(key || "").startsWith("--bbm-restarbeiten-meta-")) continue;
        header.style.setProperty(key, String(value == null ? "" : value));
      }
      return layout;
    } catch (_err) {
      return null;
    }
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
    if (!this.listHeaderHost) return;

    const doc = this.listHeaderHost.ownerDocument || globalThis.document;
    const headerGrid = doc.createElement("div");
    headerGrid.className = "restarbeiten-listHeader__grid";

    const locationWrap = doc.createElement("div");
    locationWrap.className = "restarbeiten-filterleiste__locationFilters";
    locationWrap.setAttribute("data-ui-inspector-id", "restarbeiten.filterleiste.verortung");
    const locationGroupA = doc.createElement("div");
    locationGroupA.className = "restarbeiten-filterleiste__locationGroupA";
    locationGroupA.append(this._buildSingleFilter(doc, "location_level_1", 1), this._buildSingleFilter(doc, "location_level_2", 2));
    const locationGroupB = doc.createElement("div");
    locationGroupB.className = "restarbeiten-filterleiste__locationGroupB";
    locationGroupB.append(this._buildSingleFilter(doc, "location_level_3", 3), this._buildSingleFilter(doc, "location_level_4", 4));
    locationWrap.append(locationGroupA, locationGroupB);
    const locationPanel = this._buildListHeaderPanel(doc, {
      title: "Hauptfilter / Verortung",
      body: locationWrap,
      className: "restarbeiten-listHeader__panel restarbeiten-listHeader__panel--location",
    });

    const classPanel = this._buildListHeaderPanel(doc, {
      title: "Klasse",
      body: this._buildClassFilter(doc),
      className: "restarbeiten-listHeader__panel restarbeiten-listHeader__panel--class",
    });
    classPanel.setAttribute("data-ui-inspector-id", "restarbeiten.filterleiste.klassenfilter");

    const metaWrap = doc.createElement("div");
    metaWrap.className = "restarbeiten-filterleiste__metaFilters";
    metaWrap.setAttribute("data-ui-inspector-id", "restarbeiten.filterleiste.meta");
    metaWrap.append(
      this._buildMetaFilter(doc, {
        key: "due_date",
        label: "Fertig bis",
        values: this._collectUniqueRowsValues("due_date"),
        formatDisplay: (value) => this._formatDateDisplay(value),
      }),
      this._buildMetaFilter(doc, {
        key: "status",
        label: "Status",
        values: this._collectStatusFilterValues(),
      }),
      this._buildMetaFilter(doc, {
        key: "responsible_project_firm_id",
        label: "Verantwortlich",
        values: this._collectResponsibleValues(),
      }),
      this._buildMetaFilter(doc, {
        key: "completed_state",
        label: "Erledigt",
        values: [
          { value: "", label: "Alle" },
          { value: "nicht_erledigt", label: "Nicht erledigt" },
          { value: "erledigt", label: "Erledigt" },
        ],
      })
    );
    const metaPanel = this._buildListHeaderPanel(doc, {
      title: "Meta",
      body: metaWrap,
      className: "restarbeiten-listHeader__panel restarbeiten-listHeader__panel--meta",
    });

    const closePanel = doc.createElement("div");
    closePanel.className = "restarbeiten-listHeader__closePanel restarbeiten-listHeader__panel restarbeiten-listHeader__panel--close";
    if (!this.headerCloseButton) {
      this.headerCloseButton = doc.createElement("button");
      this.headerCloseButton.type = "button";
      this.headerCloseButton.textContent = "Schließen";
      this.headerCloseButton.onclick = () => this.router?.showProjectWorkspace?.();
    }
    this.headerCloseButton.className = "restarbeiten-listHeader__closeButton";
    closePanel.append(this.headerCloseButton);

    headerGrid.append(locationPanel, classPanel, metaPanel, closePanel);
    this.listHeaderHost.replaceChildren(headerGrid);
  }


  _buildListHeaderPanel(doc, { title, body, className } = {}) {
    const panel = doc.createElement("div");
    panel.className = className || "restarbeiten-listHeader__panel";

    const label = doc.createElement("div");
    label.className = "restarbeiten-listHeader__label";
    label.textContent = title || "";

    const content = doc.createElement("div");
    content.className = "restarbeiten-listHeader__content";
    if (body) content.append(body);

    panel.append(label, content);
    return panel;
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
    if (!match) return text || "â€”";
    return `${match[3]}.${match[2]}.${match[1]}`;
  }

  _buildMetaFilter(doc, { key, label, values = [], formatDisplay = null } = {}) {
    const wrap = doc.createElement("label");
    wrap.className = "restarbeiten-filterleiste__field";
    const inspectorMap = {
      due_date: "restarbeiten.filterleiste.meta.fertig_bis",
      status: "restarbeiten.filterleiste.meta.status",
      responsible_project_firm_id: "restarbeiten.filterleiste.meta.verantwortlich",
      completed_state: "restarbeiten.filterleiste.meta.erledigt",
    };
    const inspectorId = inspectorMap[key];
    if (inspectorId) wrap.setAttribute("data-ui-inspector-id", inspectorId);
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
    this._renderHeaderFilters();
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

      const completedFilter = normalizeText(this.filterState.completed_state).toLowerCase();
      if (completedFilter === "erledigt" && !isRestarbeitenCompletedRow(row)) return false;
      if (completedFilter === "nicht_erledigt" && isRestarbeitenCompletedRow(row)) return false;

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
    toggle.textContent = photosOpen ? "â–¾ Fotos" : "â–¸ Fotos";
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
    col.setAttribute("data-ui-inspector-id", "restarbeiten.liste.textbereich");

    const location = doc.createElement("div");
    location.className = "restarbeiten-list__locationCompact";
    location.textContent = buildCompactLocation(item);

    const shortText = doc.createElement("div");
    shortText.className = "restarbeiten-list__shortText";
    shortText.textContent = item.workLine1;

    const longText = doc.createElement("div");
    longText.className = "restarbeiten-list__longText";
    longText.textContent = item.workLine2;
    longText.hidden = !this.showLongtextInList;

    col.append(location, shortText);
    if (this.showLongtextInList) {
      col.append(longText);
    }
    return col;
  }

  _renderMetaColumn(doc, item) {
    const col = doc.createElement("div");
    col.className = "restarbeiten-list__metaCol";
    col.setAttribute("data-ui-inspector-id", "restarbeiten.liste.metabereich");

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
        createMessage(doc, "Einen Restpunkt auswaehlen oder ueber + Restpunkt neu anlegen.")
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
        onDelete: async (itemId) => {
          if (!normalizeText(itemId)) return;
          await softDeleteRestarbeitItem(itemId);
          this.selectedItemId = "";
          this.attachmentsByItemId.delete(String(itemId));
          await this.load({ selectItemId: "", keepSelectionEmpty: true });
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
    this.editbox.setAmpelVisible?.(this.showAmpelInList);
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


  async _openOutputDir() {
    if (!this.effectiveProjectId || !this.project) {
      this.editbox?.setStatus("Ausgabeordner ist nicht verfÃ¼gbar.");
      return;
    }
    const openDirBridge = globalThis.window?.bbmDb?.projectsOpenRestarbeitenDir;
    if (typeof openDirBridge !== "function") {
      this.editbox?.setStatus("Ausgabeordner ist nicht verfÃ¼gbar.");
      return;
    }

    try {
      const result = await openDirBridge({
        project_number: this.project.project_number || "",
        short: this.project.short || "",
        name: this.project.name || "",
      });
      if (result?.ok === false) {
        const errorText = normalizeText(result?.error) || "Unbekannter Fehler";
        this.editbox?.setStatus(`Ausgabeordner konnte nicht geÃ¶ffnet werden: ${errorText}`);
        return;
      }
      this.editbox?.setStatus("Ausgabeordner geÃ¶ffnet.");
    } catch (error) {
      console.warn("[Restarbeiten] Ausgabeordner konnte nicht geÃ¶ffnet werden", error);
      this.editbox?.setStatus("Ausgabeordner konnte nicht geÃ¶ffnet werden.");
    }
  }

  _emitAmpelStateChanged() {
    try {
      window.dispatchEvent(
        new CustomEvent("bbm:ampel-state", {
          detail: { enabled: !!this.showAmpelInList },
        })
      );
    } catch (_e) {}
  }

  _emitLongtextStateChanged() {
    try {
      window.dispatchEvent(
        new CustomEvent("bbm:longtext-state", {
          detail: { enabled: !!this.showLongtextInList },
        })
      );
    } catch (_e) {}
  }

  _applyAmpelVisibility() {
    if (!this.host) return;
    this.host.dataset.ampelVisible = this.showAmpelInList ? "1" : "0";
  }

  _syncRestarbeitenContextUi() {
    if (!this.router?.context?.ui) return;
    this.router.context.ui.showAmpelInList = this.showAmpelInList;
    this.router.context.ui.showLongtextInList = this.showLongtextInList;
    this.router.context.ui.onAmpelToggle = () => this.toggleAmpelDisplay();
    this.router.context.ui.onLongtextToggle = () => this.toggleLongtextDisplay();
  }

  async toggleAmpelDisplay() {
    this.showAmpelInList = !this.showAmpelInList;
    this._applyAmpelVisibility();
    this._syncRestarbeitenContextUi();
    this._emitAmpelStateChanged();
    this._renderList();
    this.editbox?.setAmpelVisible?.(this.showAmpelInList);
    this.quicklane?.setAmpelEnabled?.(this.showAmpelInList);
    this._renderEditbox();
    return this.showAmpelInList;
  }

  async toggleLongtextDisplay() {
    this.showLongtextInList = !this.showLongtextInList;
    this._syncRestarbeitenContextUi();
    this._emitLongtextStateChanged();
    this._renderList();
    this.quicklane?.setLongtextEnabled?.(this.showLongtextInList);
    return this.showLongtextInList;
  }

  async openRestarbeitenPreview() {
    return await this._printFilteredList();
  }

  async openRestarbeitenEmail() {
    return await this._emailFilteredList();
  }

  async openRestarbeitenOutput() {
    return await this._openOutputDir();
  }

  _buildRestarbeitenPdfRows() {
    const visibleItems = Array.isArray(this.filteredItems) ? this.filteredItems : [];
    const rowsById = new Map(this.rows.map((row) => [String(row?.id), row]));
    return visibleItems
      .map((item) => {
        const row = rowsById.get(String(item.id));
        if (!row || row.deleted_at) return null;
        return {
          running_number: row.running_number || "",
          item_class: row.item_class || "",
          short_text: row.short_text || "",
          long_text: row.long_text || "",
          location_level_1: row.location_level_1 || "",
          location_level_2: row.location_level_2 || "",
          location_level_3: row.location_level_3 || "",
          location_level_4: row.location_level_4 || "",
          status: row.status || "",
          due_date: row.due_date || "",
          responsible_label: row.responsible_label || "",
          completed_at: row.completed_at || "",
          completion_note: row.completion_note || "",
          ampelState: item.ampelState || "neutral",
          showAmpelInList: !!this.showAmpelInList,
        };
      })
      .filter(Boolean);
  }

  _buildRestarbeitenPdfPayload() {
    return {
      mode: "restarbeiten",
      projectId: this.effectiveProjectId,
      restarbeitenRows: this._buildRestarbeitenPdfRows(),
      restarbeitenLocationLabels: buildRestarbeitenLocationLabels(this.projectSettings),
      showAmpelInList: !!this.showAmpelInList,
      devLayoutPreview: false,
      previewTitle: "Restarbeiten (Vorschau)",
      fileName: "Restarbeitenliste.pdf",
    };
  }

  async _printFilteredList() {
    const pdfPayload = this._buildRestarbeitenPdfPayload();
    if (!pdfPayload.restarbeitenRows.length) {
      this.editbox?.setStatus("Keine Restpunkte fÃ¼r den Druck vorhanden.");
      return;
    }
    const pdfBridge = globalThis.window?.bbmPrint?.printPdfAndPreviewInternal;
    if (typeof pdfBridge !== "function") {
      this.editbox?.setStatus("PDF-Druckvorschau ist nicht verfÃ¼gbar.");
      return;
    }

    try {
      const result = await pdfBridge({
        ...pdfPayload,
      });
      if (result?.ok === false) {
        const errorText = normalizeText(result?.error) || "Unbekannter Fehler";
        this.editbox?.setStatus(`PDF-Druckvorschau konnte nicht geÃ¶ffnet werden: ${errorText}`);
        return;
      }
      this.editbox?.setStatus("PDF-Druckvorschau geÃ¶ffnet.");
    } catch (error) {
      console.warn("[Restarbeiten] PDF-Druckvorschau konnte nicht geÃ¶ffnet werden", error);
      this.editbox?.setStatus("PDF-Druckvorschau konnte nicht geÃ¶ffnet werden.");
    }
  }

  async _emailFilteredList() {
    const pdfPayload = this._buildRestarbeitenPdfPayload();
    if (!pdfPayload.restarbeitenRows.length) {
      this.editbox?.setStatus("Keine Restpunkte fÃ¼r den Versand vorhanden.");
      return;
    }

    const printBridge = globalThis.window?.bbmPrint?.printPdf;
    if (typeof printBridge !== "function") {
      this.editbox?.setStatus("PDF-Erzeugung ist nicht verfÃ¼gbar.");
      return;
    }

    const mailBridge = globalThis.window?.bbmMail?.createOutlookDraft;
    if (typeof mailBridge !== "function") {
      this.editbox?.setStatus("E-Mail konnte nicht vorbereitet werden: Mail-Bridge fehlt.");
      return;
    }

    try {
      const pdfResult = await printBridge(pdfPayload);
      if (pdfResult?.ok === false) {
        const errorText = normalizeText(pdfResult?.error) || "Unbekannter Fehler";
        this.editbox?.setStatus(`E-Mail konnte nicht vorbereitet werden: ${errorText}`);
        return;
      }

      const pdfPath = normalizeText(pdfResult?.filePath);
      if (!pdfPath) {
        this.editbox?.setStatus("E-Mail konnte nicht vorbereitet werden: PDF-Datei fehlt.");
        return;
      }

      const mailResult = await mailBridge({
        subject: "Restarbeitenliste",
        body: "Anbei die gefilterte Restarbeitenliste als PDF.",
        attachmentPath: pdfPath,
      });

      if (mailResult?.ok === false) {
        const errorText = normalizeText(mailResult?.error) || "Unbekannter Fehler";
        this.editbox?.setStatus(`E-Mail konnte nicht vorbereitet werden: ${errorText}`);
        return;
      }

      this.editbox?.setStatus("E-Mail mit PDF-Anhang geÃ¶ffnet.");
    } catch (error) {
      console.warn("[Restarbeiten] E-Mail konnte nicht vorbereitet werden", error);
      this.editbox?.setStatus(`E-Mail konnte nicht vorbereitet werden: ${normalizeText(error?.message) || "Unbekannter Fehler"}`);
    }
  }
}
