import {
  createRestarbeitItem,
  getRestarbeitenProjectSettings,
  listResponsibleProjectFirms,
  listRestarbeitenByProject,
  softDeleteRestarbeitItem,
  updateRestarbeitItem,
} from "../data/restarbeitenDataSource.js";
import { toRestarbeitenListItems, getRestarbeitenAmpelState } from "../viewModel/restarbeitenListItems.js";
import { buildRestarbeitenFilterbar } from "../RestarbeitenFilterbar.js";
import { buildRestarbeitenMainBody } from "../RestarbeitenMainBody.js";
import { buildRestarbeitenEditbox } from "../RestarbeitenEditbox.js";
import { ensureRestarbeitenStyles } from "../styles.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function emptyDraft() {
  return {
    id: "",
    item_class: "rest",
    status: "offen",
    short_text: "",
    long_text: "",
    due_date: "",
    responsible_project_firm_id: "",
    responsible_label: "",
    location_level_1: "",
    location_level_2: "",
    location_level_3: "",
    location_level_4: "",
  };
}

function toSelectOptions(values = []) {
  return values
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "de"))
    .map((value) => ({ value, label: value }));
}

export default class RestarbeitenScreen {
  constructor({ router, projectId, project, moduleId } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.moduleId = moduleId || "restarbeiten";

    this.root = null;
    this.items = [];
    this.viewItems = [];
    this.settings = {};
    this.responsibleFirms = [];
    this.filters = {
      level1: "",
      level2: "",
      level3: "",
      level4: "",
      itemClass: "all",
      status: "",
      dueDate: "",
      responsible: "",
    };
    this.selectedId = null;
    this.draft = emptyDraft();
    this.showAmpelInList = true;
    this.showLongtextInList = true;
    this.error = null;
    this.isLoading = false;
  }

  render() {
    ensureRestarbeitenStyles();
    this.root = document.createElement("section");
    this.root.className = "bbm-restarbeiten-screen";
    this.root.setAttribute("data-bbm-restarbeiten-screen", "m1");
    this.root.setAttribute("data-ui-editor-id", "restarbeiten.root");
    this._renderShell();
    this._publishQuicklaneState();
    return this.root;
  }

  async load() {
    if (!this.projectId) return;
    this.isLoading = true;
    this._renderShell();
    try {
      const [items, settings, firms] = await Promise.all([
        listRestarbeitenByProject(this.projectId),
        getRestarbeitenProjectSettings(this.projectId).catch(() => ({})),
        listResponsibleProjectFirms(this.projectId).catch(() => []),
      ]);
      this.items = Array.isArray(items) ? items : [];
      this.settings = settings || {};
      this.responsibleFirms = Array.isArray(firms) ? firms : [];
      if (!this.selectedId && this.items[0]?.id) this._selectItem(this.items[0].id, { render: false });
      this.error = null;
    } finally {
      this.isLoading = false;
      this._renderShell();
      this._publishQuicklaneState();
    }
  }

  toggleAmpelDisplay() {
    this.showAmpelInList = !this.showAmpelInList;
    this._renderShell();
    this._publishQuicklaneState();
  }

  toggleLongtextDisplay() {
    this.showLongtextInList = !this.showLongtextInList;
    this._renderShell();
    this._publishQuicklaneState();
  }

  openRestarbeitenPreview() {
    this._setStubMessage("PDF Voransicht folgt in M2.");
  }

  openRestarbeitenOutput() {
    this._setStubMessage("Ausgabe, Druck und E-Mail folgen in M2.");
  }

  _setStubMessage(message) {
    this.error = message;
    this._renderShell();
  }

  _publishQuicklaneState() {
    try {
      window.dispatchEvent(new CustomEvent("bbm:ampel-state", { detail: { enabled: this.showAmpelInList } }));
      window.dispatchEvent(new CustomEvent("bbm:longtext-state", { detail: { enabled: this.showLongtextInList } }));
    } catch (_err) {
      // ignore in tests/non-browser contexts
    }
  }

  _buildFilterOptions() {
    const rows = this.items || [];
    return {
      level1: toSelectOptions(rows.map((row) => row.location_level_1)),
      level2: toSelectOptions(rows.map((row) => row.location_level_2)),
      level3: toSelectOptions(rows.map((row) => row.location_level_3)),
      level4: toSelectOptions(rows.map((row) => row.location_level_4)),
      responsible: toSelectOptions(rows.map((row) => row.responsible_label)),
    };
  }

  _getFilteredItems() {
    return (this.items || []).filter((row) => {
      if (this.filters.itemClass !== "all" && normalizeText(row.item_class) !== this.filters.itemClass) return false;
      if (this.filters.status && normalizeText(row.status) !== this.filters.status) return false;
      if (this.filters.dueDate && normalizeText(row.due_date).slice(0, 10) !== this.filters.dueDate) return false;
      if (this.filters.responsible && normalizeText(row.responsible_label) !== this.filters.responsible) return false;
      for (let i = 1; i <= 4; i += 1) {
        if (this.filters[`level${i}`] && normalizeText(row[`location_level_${i}`]) !== this.filters[`level${i}`]) {
          return false;
        }
      }
      return true;
    });
  }

  _selectItem(id, { render = true } = {}) {
    this.selectedId = normalizeText(id);
    const row = this.items.find((item) => normalizeText(item.id) === this.selectedId) || null;
    this.draft = row ? { ...emptyDraft(), ...row, ampelState: getRestarbeitenAmpelState(row) } : emptyDraft();
    if (render) this._renderShell();
  }

  _updateDraft(patch = {}) {
    this.draft = { ...this.draft, ...patch };
  }

  async _saveDraft() {
    if (!this.projectId) return;
    const payload = { ...this.draft };
    if (payload.id) {
      await updateRestarbeitItem(payload.id, payload);
    } else {
      const created = await createRestarbeitItem(this.projectId, payload);
      if (created?.id) this.selectedId = created.id;
    }
    await this.load();
  }

  async _deleteDraft() {
    if (!this.draft?.id) return;
    await softDeleteRestarbeitItem(this.draft.id);
    this.selectedId = null;
    this.draft = emptyDraft();
    await this.load();
  }

  _renderShell() {
    if (!this.root) return;
    this.root.replaceChildren();
    const filteredRows = this._getFilteredItems();
    this.viewItems = toRestarbeitenListItems(filteredRows);
    const responsibleOptions = this.responsibleFirms
      .map((firm) => ({
        value: normalizeText(firm.id),
        label: normalizeText(firm.shortName || firm.short_name || firm.name || firm.company_name),
      }))
      .filter((entry) => entry.value && entry.label);

    this.root.append(
      buildRestarbeitenFilterbar({
        settings: this.settings,
        filters: this.filters,
        filterOptions: this._buildFilterOptions(),
        onFilterChange: (patch) => {
          this.filters = { ...this.filters, ...patch };
          this._renderShell();
        },
        onClose: () => this.router?.showProjectWorkspace?.(this.projectId, { project: this.project }),
      }),
      buildRestarbeitenMainBody({
        items: this.viewItems,
        selectedId: this.selectedId,
        showAmpel: this.showAmpelInList,
        showLongtext: this.showLongtextInList,
        onSelect: (id) => this._selectItem(id),
      }),
      buildRestarbeitenEditbox({
        settings: this.settings,
        draft: this.draft,
        responsibleOptions,
        onDraftChange: (patch) => this._updateDraft(patch),
        onSave: () => this._saveDraft().catch((err) => this._setStubMessage(err?.message || String(err))),
        onDelete: () => this._deleteDraft().catch((err) => this._setStubMessage(err?.message || String(err))),
      })
    );

    if (this.isLoading || this.error) {
      const status = document.createElement("div");
      status.className = "bbm-restarbeiten-empty";
      status.textContent = this.isLoading ? "Restarbeiten werden geladen ..." : this.error;
      this.root.appendChild(status);
    }
  }
}
