import {
  createRestarbeitNote,
  createRestarbeitItem,
  getRestarbeitenProjectSettings,
  listRestarbeitNotes,
  listResponsibleProjectFirms,
  listRestarbeitenByProject,
  softDeleteRestarbeitItem,
  updateRestarbeitItem,
} from "../data/restarbeitenDataSource.js";
import { toRestarbeitenListItems, getRestarbeitenAmpelState } from "../viewModel/restarbeitenListItems.js";
import { buildRestarbeitenFilterbar } from "../RestarbeitenFilterbar.js";
import { buildRestarbeitenMainBody } from "../RestarbeitenMainBody.js";
import { buildRestarbeitenEditbox } from "../RestarbeitenEditbox.js";
import { buildRestarbeitenQuicklane } from "../RestarbeitenQuicklane.js";
import { ensureRestarbeitenStyles } from "../styles.js";
import {
  cleanupPopupHandlers,
  createPopupOverlay,
  registerPopupCloseHandlers,
  stylePopupCard,
} from "../../../ui/popupCommon.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function formatNoteTimestamp(value) {
  const raw = normalizeText(value);
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildLocationLine(source = {}) {
  const parts = [1, 2, 3, 4].map((level) => normalizeText(source[`location_level_${level}`])).filter(Boolean);
  return parts.join(" - ");
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

function normalizeDraftStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  if (raw === "in_arbeit") return "in arbeit";
  if (["offen", "in arbeit", "erledigt", "verzug"].includes(raw)) return raw;
  return "offen";
}

function prepareDraft(source = {}) {
  const draft = {
    ...emptyDraft(),
    ...source,
    item_class: normalizeText(source.item_class) === "mangel" ? "mangel" : "rest",
    status: normalizeDraftStatus(source.status),
    responsible_project_firm_id: normalizeText(source.responsible_project_firm_id),
    responsible_label: normalizeText(source.responsible_project_firm_id) ? normalizeText(source.responsible_label) : "",
  };
  draft.ampelState = getRestarbeitenAmpelState(draft);
  return draft;
}

function buildSavePayload(draft = {}) {
  const payload = { ...draft };
  delete payload.ampelState;
  delete payload.created_at;
  delete payload.running_number;
  payload.item_class = normalizeText(payload.item_class) === "mangel" ? "mangel" : "rest";
  payload.status = normalizeDraftStatus(payload.status);
  if (!normalizeText(payload.responsible_project_firm_id)) payload.responsible_label = "";
  return payload;
}

function findRestarbeitenRecordById(root, id) {
  const expected = normalizeText(id);
  if (!root || !expected) return null;
  if (root.getAttribute?.("data-bbm-restarbeiten-record-id") === expected) return root;
  for (const child of Array.isArray(root.children) ? root.children : Array.from(root.children || [])) {
    const found = findRestarbeitenRecordById(child, expected);
    if (found) return found;
  }
  return null;
}

function toSelectOptions(values = []) {
  return values
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, "de"))
    .map((value) => ({ value, label: value }));
}

function buildUiEditorHostContextLabel(draft = {}) {
  const runningNumber = normalizeText(draft.running_number);
  const shortText = normalizeText(draft.short_text);
  return [runningNumber ? `Nr. ${runningNumber}` : "", shortText].filter(Boolean).join(" - ");
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
    this.notesOverlay = null;
    this.notesPopup = {
      restarbeitId: "",
      notes: [],
      noteText: "",
      isLoading: false,
      error: "",
      printStatus: "",
    };
    this._lastRestarbeitNotePrint = null;
    this.quicklanePinned = false;
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

  async load({ autoSelectFirst = true } = {}) {
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
      const selectedExists = this.selectedId && this.items.some((item) => normalizeText(item.id) === this.selectedId);
      if (selectedExists) {
        this._selectItem(this.selectedId, { render: false });
      } else if (autoSelectFirst && this.items[0]?.id) {
        this._selectItem(this.items[0].id, { render: false });
      } else {
        this.selectedId = null;
        this.draft = prepareDraft();
      }
      this.error = null;
    } finally {
      this.isLoading = false;
      this._renderShell();
      this._publishQuicklaneState();
      this.router?.refreshUiEditorRuntimeLauncher?.();
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

  openRestarbeitPhotos(restarbeitId = this.selectedId) {
    const id = normalizeText(restarbeitId);
    this._setStubMessage(id ? "Fotos folgen in einem späteren Paket." : "Kein Datensatz ausgewählt.");
    return { ok: Boolean(id), restarbeitId: id };
  }

  getUiEditorHostContext() {
    const projectId = normalizeText(this.projectId);
    const restarbeitId = normalizeText(this.notesPopup?.restarbeitId || this.selectedId || this.draft?.id);
    const targetLabel = buildUiEditorHostContextLabel(this.draft);
    if (!projectId || !restarbeitId || !targetLabel) return null;

    return {
      projectId,
      restarbeitId,
      targetContext: "Restarbeiten",
      targetSurfaceId: "restarbeiten.ui.main",
      targetLabel,
      elementType: "Hinweis / Infotext",
      source: "BBM-Restarbeiten-Host",
    };
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
    this.draft = row ? prepareDraft(row) : prepareDraft();
    if (render) this._renderShell();
    this.router?.refreshUiEditorRuntimeLauncher?.();
  }

  _updateDraft(patch = {}, options = {}) {
    this.draft = prepareDraft({ ...this.draft, ...patch });
    this.router?.refreshUiEditorRuntimeLauncher?.();
    if (options.render === false) return;
    this._renderShell();
  }

  _newDraft() {
    this.selectedId = null;
    this.draft = prepareDraft();
    this._renderShell();
    this.router?.refreshUiEditorRuntimeLauncher?.();
  }

  async _saveDraft() {
    if (!this.projectId) return;
    if (!normalizeText(this.draft.short_text)) return;
    const payload = buildSavePayload(this.draft);
    let createdId = "";
    if (payload.id) {
      await updateRestarbeitItem(payload.id, payload);
    } else {
      const created = await createRestarbeitItem(this.projectId, payload);
      if (created?.id) {
        createdId = normalizeText(created.id);
        this.selectedId = createdId;
      }
    }
    await this.load();
    if (createdId) this._scrollRecordIntoView(createdId);
  }

  async _autoSaveDraft() {
    if (!normalizeText(this.draft.short_text)) return;
    await this._saveDraft();
  }

  async _deleteDraft() {
    if (!this.draft?.id) return;
    await softDeleteRestarbeitItem(this.draft.id);
    this.selectedId = null;
    this.draft = prepareDraft();
    await this.load({ autoSelectFirst: false });
  }

  _scrollRecordIntoView(id) {
    const record = findRestarbeitenRecordById(this.root, id);
    if (!record || typeof record.scrollIntoView !== "function") return false;
    const run = () => record.scrollIntoView({ block: "end", behavior: "smooth" });
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(run);
    } else {
      run();
    }
    return true;
  }

  async _openNotesPopup() {
    const restarbeitId = normalizeText(this.draft?.id);
    if (!restarbeitId) return;
    if (!this.notesOverlay) {
      this.notesOverlay = createPopupOverlay({ background: "rgba(15, 23, 42, 0.34)" });
      document.body?.appendChild?.(this.notesOverlay);
      registerPopupCloseHandlers(this.notesOverlay, () => this._closeNotesPopup(), { closeOnBackdrop: false });
    }
    this.notesPopup = {
      restarbeitId,
      notes: [],
      noteText: "",
      isLoading: true,
      error: "",
      printStatus: "",
    };
    this._renderNotesPopup();
    try {
      this.notesPopup.notes = await listRestarbeitNotes(restarbeitId);
    } catch (err) {
      this.notesPopup.error = err?.message || String(err);
    } finally {
      this.notesPopup.isLoading = false;
      this._renderNotesPopup();
      this.router?.refreshUiEditorRuntimeLauncher?.();
    }
  }

  _closeNotesPopup() {
    if (!this.notesOverlay) return;
    cleanupPopupHandlers(this.notesOverlay);
    if (typeof this.notesOverlay.remove === "function") {
      this.notesOverlay.remove();
    } else if (this.notesOverlay.parentElement?.removeChild) {
      this.notesOverlay.parentElement.removeChild(this.notesOverlay);
    }
    this.notesOverlay = null;
    this.router?.refreshUiEditorRuntimeLauncher?.();
  }

  async _addNoteFromPopup(noteText) {
    const text = normalizeText(noteText);
    const restarbeitId = normalizeText(this.notesPopup.restarbeitId);
    if (!restarbeitId || !text) return;
    this.notesPopup.error = "";
    this.notesPopup.printStatus = "";
    try {
      await createRestarbeitNote(restarbeitId, text);
      this.notesPopup.noteText = "";
      this.notesPopup.notes = await listRestarbeitNotes(restarbeitId);
    } catch (err) {
      this.notesPopup.error = err?.message || String(err);
    }
    this._renderNotesPopup();
  }

  printRestarbeitNoteHistory(restarbeitId = this.notesPopup.restarbeitId) {
    const id = normalizeText(restarbeitId);
    const result = {
      ok: Boolean(id),
      status: id ? "prepared" : "missing-restarbeit",
      mode: "restarbeit-note-history",
      restarbeitId: id,
      notes: Array.isArray(this.notesPopup.notes) ? [...this.notesPopup.notes] : [],
    };
    this._lastRestarbeitNotePrint = result;
    return result;
  }

  _printRestarbeitNoteHistory() {
    const result = this.printRestarbeitNoteHistory();
    this.notesPopup.printStatus = result.ok ? "Druck vorbereitet." : "Kein Datensatz ausgewählt.";
    this._renderNotesPopup();
  }

  _renderNotesPopup() {
    if (!this.notesOverlay) return;
    this.notesOverlay.replaceChildren();
    this.notesOverlay.style.display = "flex";

    const card = document.createElement("section");
    card.className = "bbm-restarbeiten-notes-popup";
    stylePopupCard(card, { width: "min(720px, calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)" });

    const header = document.createElement("header");
    header.className = "bbm-restarbeiten-notes-popup__header";
    const title = document.createElement("h2");
    title.textContent = `Notizen zu Nr.: ${this.draft?.running_number || "?"}`;
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "bbm-restarbeiten-button";
    closeBtn.textContent = "Schließen";
    closeBtn.setAttribute("data-bbm-restarbeiten-note-action", "close");
    closeBtn.addEventListener("click", () => this._closeNotesPopup());
    header.append(title, closeBtn);

    const body = document.createElement("div");
    body.className = "bbm-restarbeiten-notes-popup__body";
    const summary = document.createElement("div");
    summary.className = "bbm-restarbeiten-notes-popup__summary";
    const locationLine = buildLocationLine(this.draft);
    summary.textContent = [
      this.draft?.item_class === "mangel" ? "Mangel" : "Restarbeit",
      locationLine,
      normalizeText(this.draft?.short_text),
    ].filter(Boolean).join(" - ");

    const history = document.createElement("div");
    history.className = "bbm-restarbeiten-notes-popup__history";
    if (this.notesPopup.isLoading) {
      const loading = document.createElement("p");
      loading.textContent = "Notizen werden geladen ...";
      history.appendChild(loading);
    } else if (this.notesPopup.error) {
      const error = document.createElement("p");
      error.className = "bbm-restarbeiten-notes-popup__error";
      error.textContent = this.notesPopup.error;
      history.appendChild(error);
    } else if (!this.notesPopup.notes.length) {
      const empty = document.createElement("p");
      empty.className = "bbm-restarbeiten-notes-popup__empty";
      empty.textContent = "Noch keine Notizen vorhanden.";
      history.appendChild(empty);
    } else {
      for (const note of this.notesPopup.notes) {
        const item = document.createElement("article");
        item.className = "bbm-restarbeiten-notes-popup__note";
        const timestamp = document.createElement("div");
        timestamp.className = "bbm-restarbeiten-notes-popup__note-time";
        timestamp.textContent = formatNoteTimestamp(note.created_at);
        const text = document.createElement("div");
        text.className = "bbm-restarbeiten-notes-popup__note-text";
        text.textContent = normalizeText(note.note_text);
        item.append(timestamp, text);
        history.appendChild(item);
      }
    }

    const input = document.createElement("textarea");
    input.className = "bbm-restarbeiten-notes-popup__input";
    input.placeholder = "Neue Notiz";
    input.value = this.notesPopup.noteText || "";
    input.setAttribute("data-bbm-restarbeiten-note-input", "true");

    const actions = document.createElement("div");
    actions.className = "bbm-restarbeiten-notes-popup__actions";
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "bbm-restarbeiten-button";
    addBtn.textContent = "Notiz hinzufügen";
    addBtn.disabled = !normalizeText(input.value);
    addBtn.setAttribute("data-bbm-restarbeiten-note-action", "add");
    input.addEventListener("input", () => {
      this.notesPopup.noteText = input.value;
      addBtn.disabled = !normalizeText(input.value);
    });
    addBtn.addEventListener("click", () => this._addNoteFromPopup(input.value));

    const printBtn = document.createElement("button");
    printBtn.type = "button";
    printBtn.className = "bbm-restarbeiten-button";
    printBtn.textContent = "Drucken";
    printBtn.setAttribute("data-bbm-restarbeiten-note-action", "print");
    printBtn.addEventListener("click", () => this._printRestarbeitNoteHistory());
    actions.append(addBtn, printBtn);

    const status = document.createElement("div");
    status.className = "bbm-restarbeiten-notes-popup__status";
    status.textContent = this.notesPopup.printStatus || "";

    body.append(summary, history, input, actions, status);
    card.append(header, body);
    this.notesOverlay.appendChild(card);
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
      buildRestarbeitenQuicklane({
        pinned: this.quicklanePinned,
        showAmpel: this.showAmpelInList,
        showLongtext: this.showLongtextInList,
        onPinToggle: () => {
          this.quicklanePinned = !this.quicklanePinned;
          this._renderShell();
        },
        onProject: () => this.router?.openProjectFormModal?.({ projectId: this.projectId, project: this.project }),
        onFirms: () =>
          this.router?.showProjectFirms?.(this.projectId, {
            project: this.project,
            returnContext: { section: "restarbeiten", projectId: this.projectId, project: this.project },
          }),
        onAmpelToggle: () => this.toggleAmpelDisplay(),
        onLongtextToggle: () => this.toggleLongtextDisplay(),
        onPreview: () => this.openRestarbeitenPreview(),
      }),
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
        onPhotos: (id) => this.openRestarbeitPhotos(id),
      }),
      buildRestarbeitenEditbox({
        settings: this.settings,
        draft: this.draft,
        showAmpel: this.showAmpelInList,
        responsibleOptions,
        onNew: () => this._newDraft(),
        onDraftChange: (patch, options) => this._updateDraft(patch, options),
        onDelete: () => this._deleteDraft().catch((err) => this._setStubMessage(err?.message || String(err))),
        onNote: () => this._openNotesPopup().catch((err) => this._setStubMessage(err?.message || String(err))),
        onAutoSave: () => this._autoSaveDraft().catch((err) => this._setStubMessage(err?.message || String(err))),
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
