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

const LOCATION_KEYS = ["location_level_1", "location_level_2", "location_level_3", "location_level_4"];
const LOCATION_LABEL_FALLBACKS = ["Ebene 1", "Ebene 2", "Ebene 3", "Ebene 4"];

function normalizeText(value) { return String(value || "").trim(); }

function createMessage(doc, text) { const el = doc.createElement("p"); el.textContent = text; el.style.margin = "0"; return el; }

function compactLocationLine(item = {}) {
  const values = [item.locationLevel1, item.locationLevel2, item.locationLevel3, item.locationLevel4].map(normalizeText).filter(Boolean);
  return values.length ? values.join(" · ") : "—";
}

export default class RestarbeitenScreen {
  constructor({ router, projectId, project, moduleId } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.moduleId = moduleId || "restarbeiten";
    this.effectiveProjectId = "";
    this.headerHost = null;
    this.rows = [];
    this.items = [];
    this.filteredItems = [];
    this.selectedItemId = "";
    this.isLoading = false;
    this.editbox = null;
    this.projectFirms = [];
    this.projectSettings = null;
    this.filterState = { location_level_1: "", location_level_2: "", location_level_3: "", location_level_4: "" };
    this.attachmentsByItemId = new Map();
    this.expandedPhotoRows = new Map();
  }

  _getSelectedItem() { return this.rows.find((item) => String(item.id) === String(this.selectedItemId)) || null; }
  _setSelectedItemId(itemId) { this.selectedItemId = normalizeText(itemId); if (this.editbox) this.editbox.setItem(this._getSelectedItem()); }
  _getFilterLabel(levelIndex) { return normalizeText(this.projectSettings?.[`level_${levelIndex}_label`]) || LOCATION_LABEL_FALLBACKS[levelIndex - 1]; }
  _getFilteredItems() {
    return this.items.filter((item) => LOCATION_KEYS.every((key, idx) => {
      const selected = normalizeText(this.filterState[key]); if (!selected) return true;
      const itemValue = normalizeText(item[`locationLevel${idx + 1}`]);
      return itemValue === selected;
    }));
  }

  _buildHeaderFilter(doc, key, levelIndex) {
    const wrap = doc.createElement("label"); wrap.className = "restarbeiten-header__filter";
    const caption = doc.createElement("span"); caption.textContent = this._getFilterLabel(levelIndex);
    const select = doc.createElement("select"); select.dataset.filterKey = key;
    const allOpt = doc.createElement("option"); allOpt.value = ""; allOpt.textContent = "Alle"; select.append(allOpt);
    const uniq = [...new Set(this.items.map((item) => normalizeText(item[`locationLevel${levelIndex}`])).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
    for (const value of uniq) { const opt = doc.createElement("option"); opt.value = value; opt.textContent = value; select.append(opt); }
    select.value = normalizeText(this.filterState[key]);
    select.addEventListener("change", () => { this.filterState[key] = normalizeText(select.value); this._renderList(); });
    wrap.append(caption, select);
    return wrap;
  }

  _renderHeaderFilters() {
    if (!this.headerFiltersHost) return;
    const doc = this.headerFiltersHost.ownerDocument || globalThis.document;
    this.headerFiltersHost.replaceChildren(
      this._buildHeaderFilter(doc, "location_level_1", 1),
      this._buildHeaderFilter(doc, "location_level_2", 2),
      this._buildHeaderFilter(doc, "location_level_3", 3),
      this._buildHeaderFilter(doc, "location_level_4", 4)
    );
  }

  _renderList() {
    if (!this.listHost) return;
    const doc = this.listHost.ownerDocument || globalThis.document;
    if (!this.effectiveProjectId) return this.listHost.replaceChildren(createMessage(doc, "Kein Projektkontext für Restarbeiten vorhanden."));
    this.filteredItems = this._getFilteredItems();
    const addBtn = this.headerHost?.querySelector?.('button:nth-child(2)');
    if (addBtn) addBtn.disabled = !this.effectiveProjectId;
    if (!this.filteredItems.length) return this.listHost.replaceChildren(createMessage(doc, "Keine Restarbeiten für die aktuellen Filter."));

    const list = doc.createElement("ul"); list.className = "restarbeiten-list";
    for (const item of this.filteredItems) {
      const row = doc.createElement("li"); row.className = "restarbeiten-list__row"; row.dataset.restarbeitId = item.id;
      row.dataset.selected = String(item.id) === String(this.selectedItemId) ? "1" : "0";
      const grid = doc.createElement("div"); grid.className = "restarbeiten-list__rowGrid";
      const left = doc.createElement("div"); left.className = "restarbeiten-list__numberCol";
      const toggle = doc.createElement("button"); toggle.type = "button"; toggle.className = "restarbeiten-list__photosToggle";
      const key = String(item.id); const photosOpen = this.expandedPhotoRows.get(key) === true;
      toggle.textContent = photosOpen ? "▾ Fotos" : "▸ Fotos";
      toggle.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); this.expandedPhotoRows.set(key, !photosOpen); this._renderList(); });
      left.append(Object.assign(doc.createElement("div"), { className: "restarbeiten-list__number", textContent: item.numberLine }), Object.assign(doc.createElement("div"), { className: "restarbeiten-list__date", textContent: item.dateLine }), toggle);

      const text = doc.createElement("div"); text.className = "restarbeiten-list__textCol";
      text.append(Object.assign(doc.createElement("div"), { className: "restarbeiten-list__locationCompact", textContent: compactLocationLine(item) }), Object.assign(doc.createElement("div"), { className: "restarbeiten-list__shortText", textContent: item.workLine1 }), Object.assign(doc.createElement("div"), { className: "restarbeiten-list__longText", textContent: item.workLine2 }));

      const meta = doc.createElement("div"); meta.className = "restarbeiten-list__metaCol";
      meta.append(Object.assign(doc.createElement("div"), { textContent: `Klasse: ${item.itemClassLabel}` }), Object.assign(doc.createElement("div"), { textContent: `Status: ${item.statusLabel}` }), Object.assign(doc.createElement("div"), { textContent: `Fertig bis: ${item.dueDateLabel}` }), Object.assign(doc.createElement("div"), { textContent: `Verantwortlich: ${item.responsibleLabel}` }), Object.assign(doc.createElement("div"), { textContent: `Ampel: ${item.ampelLabel}` }));
      grid.append(left, text, meta); row.append(grid);

      const attachmentWrap = doc.createElement("div"); attachmentWrap.className = "restarbeiten-list__attachmentsWrap"; attachmentWrap.hidden = !photosOpen;
      const attachments = this.attachmentsByItemId.get(key) || [];
      attachmentWrap.textContent = attachments.length ? `Fotos: ${attachments.slice(0, 3).map((entry) => entry.caption || entry.file_name || "Foto").join(", ")}` : "Keine Fotos vorbereitet.";
      row.append(attachmentWrap);

      row.addEventListener("click", () => { this._setSelectedItemId(item.id); if (!this.expandedPhotoRows.has(key)) this.expandedPhotoRows.set(key, true); this._renderList(); this._renderEditbox(); this._loadSelectedAttachments().catch(() => {}); });
      list.append(row);
    }
    this.listHost.replaceChildren(list);
  }

  _renderEditbox() { /* unchanged minimal */
    if (!this.editHost) return;
    const doc = this.editHost.ownerDocument || globalThis.document;
    if (!this.effectiveProjectId) { if (this.editbox) this.editbox.setItem(null); this.editHost.replaceChildren(); return; }
    const selectedItem = this._getSelectedItem();
    if (!selectedItem) { if (this.editbox) this.editbox.setItem(null); this.editHost.replaceChildren(createMessage(doc, "Eine Restarbeit auswaehlen oder ueber + Restarbeit neu anlegen.")); return; }
    if (!this.editbox) {
      this.editbox = new RestarbeitenEditbox({ documentRef: doc, onSave: async (draft) => { if (!this.selectedItemId) return; this.editbox?.setSaving(true); try { await updateRestarbeitItem(this.selectedItemId, draft); await this.load({ selectItemId: this.selectedItemId }); } finally { this.editbox?.setSaving(false); } }, onSetPrimaryAttachment: async (attachmentId) => { const selected = this._getSelectedItem(); if (!selected?.id) return; await setPrimaryRestarbeitAttachment(selected.id, attachmentId); await this._loadSelectedAttachments(); this._renderEditbox(); }, onImportAttachments: async () => { const selected = this._getSelectedItem(); if (!selected?.id || !this.effectiveProjectId) return; const result = await importRestarbeitAttachments(selected.id, this.effectiveProjectId); this.attachmentsByItemId.set(String(selected.id), Array.isArray(result?.attachments) ? result.attachments : []); await this._loadSelectedAttachments(); this._renderList(); this._renderEditbox(); }, onDeleteAttachment: async (attachmentId) => { const selected = this._getSelectedItem(); if (!selected?.id || !attachmentId) return; await deleteRestarbeitAttachment(selected.id, attachmentId); await this._loadSelectedAttachments(); this._renderEditbox(); this._renderList(); } });
      this.editHost.replaceChildren(this.editbox.render());
      this.editbox.setProjectFirms(this.projectFirms);
    }
    this.editbox.setItem(selectedItem); this.editbox.setProjectFirms(this.projectFirms); this.editbox.setAttachments(this.attachmentsByItemId.get(String(selectedItem.id)) || []);
  }

  render() {
    const doc = globalThis.document; ensureRestarbeitenListStyle(doc);
    const root = doc.createElement("div"); root.setAttribute("data-bbm-restarbeiten-screen", "true");
    const header = doc.createElement("header"); header.className = "restarbeiten-header";
    const title = doc.createElement("div"); title.textContent = "Restarbeiten";
    const btnClose = doc.createElement("button"); btnClose.textContent = "Schließen"; btnClose.type = "button"; btnClose.onclick = () => this.router?.showProjectWorkspace?.();
    const btnCreate = doc.createElement("button"); btnCreate.textContent = "+ Restarbeit"; btnCreate.type = "button"; btnCreate.onclick = () => this._createRestarbeit();
    const metaBtn = doc.createElement("button"); metaBtn.textContent = "Metaspalten"; metaBtn.type = "button"; applyPopupButtonStyle(metaBtn);
    const filters = doc.createElement("div"); filters.className = "restarbeiten-header__filters";
    this.headerFiltersHost = filters;
    btnCreate.disabled = !this.effectiveProjectId;
    const actions = doc.createElement("div"); actions.className = "restarbeiten-header__actions"; actions.append(btnClose, btnCreate, metaBtn);
    header.append(title, filters, actions);
    this.headerHost = header;

    const sheetArea = doc.createElement("section"); sheetArea.setAttribute("data-bbm-restarbeiten-screen-area", "sheet");
    const sheetCanvas = doc.createElement("div"); sheetCanvas.setAttribute("data-bbm-restarbeiten-screen-sheet-canvas", "true");
    const sheetPaper = doc.createElement("div"); sheetPaper.setAttribute("data-bbm-restarbeiten-screen-sheet-paper", "true");
    const listHost = doc.createElement("div"); listHost.className = "restarbeiten-sheet__list"; sheetPaper.append(listHost); sheetCanvas.append(sheetPaper); sheetArea.append(sheetCanvas);
    const editArea = doc.createElement("section"); editArea.setAttribute("data-bbm-restarbeiten-screen-area", "edit");
    const editCanvas = doc.createElement("div"); editCanvas.setAttribute("data-bbm-restarbeiten-screen-edit-canvas", "true"); editArea.append(editCanvas);
    root.append(header, sheetArea, editArea);
    this.host = root; this.listHost = listHost; this.editHost = editCanvas;
    this._renderHeaderFilters(); this._renderList(); this._renderEditbox();
    void this.load();
    return root;
  }

  async load({ selectItemId = "" } = {}) {
    const projectId = normalizeText(this.projectId || this.project?.id || this.router?.currentProjectId);
    this.effectiveProjectId = projectId;
    if (!projectId) { this.rows = []; this.items = []; this._renderHeaderFilters(); this._renderList(); this._renderEditbox(); return; }
    const [rows, projectFirms, projectSettings] = await Promise.all([listRestarbeitenByProject(projectId), listResponsibleProjectFirms(projectId), getRestarbeitenProjectSettings(projectId)]);
    this.rows = Array.isArray(rows) ? rows : []; this.items = toRestarbeitenListItems(this.rows); this.projectFirms = Array.isArray(projectFirms) ? projectFirms : []; this.projectSettings = projectSettings || null;
    if (selectItemId) this._setSelectedItemId(selectItemId); else if (!this.selectedItemId && this.rows[0]?.id) this._setSelectedItemId(this.rows[0].id);
    await this._loadSelectedAttachments(); this._renderHeaderFilters(); this._renderList(); this._renderEditbox();
  }

  async _createRestarbeit() { if (!this.effectiveProjectId) return; const created = await createRestarbeitItem(this.effectiveProjectId, {}); await this.load({ selectItemId: created?.id || "" }); }
  async _loadSelectedAttachments() { const selected = this._getSelectedItem(); if (!selected?.id) return; const attachments = await listRestarbeitAttachments(selected.id); this.attachmentsByItemId.set(String(selected.id), Array.isArray(attachments) ? attachments : []); }
}
