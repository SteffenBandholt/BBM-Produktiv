import {
  createRestarbeitNote,
  createRestarbeitItem,
  deleteRestarbeitAttachment,
  getRestarbeitenProjectSettings,
  importRestarbeitAttachments,
  listRestarbeitAttachments,
  listRestarbeitNotes,
  listResponsibleProjectFirms,
  listRestarbeitenByProject,
  softDeleteRestarbeitItem,
  setPrimaryRestarbeitAttachment,
  updateRestarbeitItem,
} from "../data/restarbeitenDataSource.js";
import { toRestarbeitenListItems, getRestarbeitenAmpelState } from "../viewModel/restarbeitenListItems.js";
import { buildRestarbeitenFilterbar } from "../RestarbeitenFilterbar.js";
import { buildRestarbeitenMainBody } from "../RestarbeitenMainBody.js";
import { buildRestarbeitenEditbox } from "../RestarbeitenEditbox.js";
import {
  DEFAULT_TEXT_LIMITS,
  TextLimitSettingsService,
} from "../../../core/textregeln/index.js";
import { buildRestarbeitenQuicklane } from "../RestarbeitenQuicklane.js";
import { ensureRestarbeitenStyles } from "../styles.js";
import { beginM80PilotRender, completeM80PilotRender, registerM80Ref } from "../../../ui-editor/m80Refs.js";
import {
  canPersistRestarbeitDraft,
  normalizeRestarbeitStatus,
} from "../domain/restarbeitenRules.js";
import {
  cleanupPopupHandlers,
  createPopupOverlay,
  registerPopupCloseHandlers,
  stylePopupCard,
} from "../../../ui/popupCommon.js";
import { applyPopupButtonStyle } from "../../../ui/popupButtonStyles.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function toLocalFileUrl(value) {
  const filePath = normalizeText(value);
  if (!filePath) return "";
  if (/^file:\/\//iu.test(filePath)) return encodeURI(filePath);
  const normalized = filePath.replace(/\\/gu, "/");
  return encodeURI(`file:///${normalized.replace(/^\/+/, "")}`);
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
    status: normalizeRestarbeitStatus("", { defaultForNew: true }),
    short_text: "",
    long_text: "",
    due_date: "",
    responsible_project_firm_id: "",
    responsible_global_firm_id: "",
    responsible_kind: "",
    responsible_id: "",
    responsible_label: "",
    location_level_1: "",
    location_level_2: "",
    location_level_3: "",
    location_level_4: "",
  };
}

function normalizeDraftStatus(value, { defaultForNew = false } = {}) {
  const normalized = normalizeRestarbeitStatus(value, { defaultForNew });
  return normalized || normalizeText(value).toLowerCase();
}

function prepareDraft(source = {}) {
  const draft = {
    ...emptyDraft(),
    ...source,
    item_class: normalizeText(source.item_class) === "mangel" ? "mangel" : "rest",
    status: normalizeDraftStatus(source.status, { defaultForNew: !source.id }),
    responsible_project_firm_id: normalizeText(source.responsible_project_firm_id),
    responsible_global_firm_id: normalizeText(source.responsible_global_firm_id),
    responsible_kind: normalizeText(source.responsible_kind),
    responsible_id: normalizeText(source.responsible_id),
    responsible_label: normalizeText(source.responsible_label),
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
  const normalizedStatus = normalizeRestarbeitStatus(payload.status, { defaultForNew: !payload.id });
  if (normalizedStatus) {
    payload.status = normalizedStatus;
  } else {
    delete payload.status;
  }
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

export default class RestarbeitenScreen {
  constructor({ router, projectId, project, moduleId, textLimitSettingsService } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.moduleId = moduleId || "restarbeiten";
    this.uiEditorScopeId = "restarbeiten.header.root";

    this.root = null;
    this.quicklaneEl = null;
    this.items = [];
    this.viewItems = [];
    this.settings = {};
    this.textLimitSettingsService = textLimitSettingsService || new TextLimitSettingsService();
    this.textLimits = { ...DEFAULT_TEXT_LIMITS };
    this._textLimitUnsubscribe = null;
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
    this.photosOverlay = null;
    this._photosRequestId = 0;
    this.photosPopup = {
      restarbeitId: "",
      attachments: [],
      isLoading: false,
      error: "",
      warning: "",
    };
    this.notesPopup = {
      restarbeitId: "",
      notes: [],
      noteText: "",
      isLoading: false,
      error: "",
    };
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
      const [items, settings, firms, textLimits] = await Promise.all([
        listRestarbeitenByProject(this.projectId),
        getRestarbeitenProjectSettings(this.projectId).catch(() => ({})),
        listResponsibleProjectFirms(this.projectId).catch(() => []),
        this.textLimitSettingsService.load(),
      ]);
      this.items = Array.isArray(items) ? items : [];
      this.settings = settings || {};
      this.textLimits = textLimits || { ...DEFAULT_TEXT_LIMITS };
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
    } catch (error) {
      const detail = normalizeText(error?.message || error);
      this.error = detail
        ? `Restarbeiten konnten nicht geladen werden: ${detail}`
        : "Restarbeiten konnten nicht geladen werden.";
    } finally {
      this.isLoading = false;
      this._renderShell();
      this._publishQuicklaneState();
    }
    this._bindTextLimitSettings();
  }

  _bindTextLimitSettings() {
    if (this._textLimitUnsubscribe) return;
    this._textLimitUnsubscribe = this.textLimitSettingsService.subscribe((limits) => {
      this.textLimits = limits || { ...DEFAULT_TEXT_LIMITS };
      this._renderShell();
    });
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

  _buildRestarbeitenPdfPayload() {
    const restarbeitenRows = this._getFilteredItems()
      .filter((row) => !normalizeText(row?.deleted_at))
      .map((row) => ({ ...row }));
    return {
      mode: "restarbeiten",
      orientation: "landscape",
      projectId: this.projectId,
      restarbeitenRows,
      restarbeitenLocationLabels: {
        level_1_label: normalizeText(this.settings?.level_1_label) || "Haus",
        level_2_label: normalizeText(this.settings?.level_2_label) || "Geschoss",
        level_3_label: normalizeText(this.settings?.level_3_label) || "Einheit",
        level_4_label: normalizeText(this.settings?.level_4_label) || "Raum",
      },
      showAmpelInList: this.showAmpelInList,
      previewTitle: "Restarbeitenliste",
    };
  }

  async openRestarbeitenPreview() {
    const printPdfAndPreviewInternal = window?.bbmPrint?.printPdfAndPreviewInternal;
    if (typeof printPdfAndPreviewInternal !== "function") {
      this._setStubMessage("Interne PDF-Vorschau ist nicht verfügbar.");
      return { ok: false, error: "printPdfAndPreviewInternal fehlt" };
    }
    this.error = "Restarbeiten-PDF wird erzeugt ...";
    this._renderShell();
    try {
      const result = await printPdfAndPreviewInternal(this._buildRestarbeitenPdfPayload());
      if (result?.ok !== true) {
        this._setStubMessage(result?.error || "Restarbeiten-PDF konnte nicht erzeugt werden.");
        return result || { ok: false, error: "Leere PDF-Antwort" };
      }
      this.error = null;
      this._renderShell();
      return result;
    } catch (error) {
      this._setStubMessage(error?.message || String(error));
      return { ok: false, error: error?.message || String(error) };
    }
  }

  async openRestarbeitenOutput({ mode = "print" } = {}) {
    if (mode !== "print") return { ok: false, error: `Ausgabeart ${String(mode)} ist nicht verfügbar.` };
    return this.openRestarbeitenPreview();
  }

  async openRestarbeitPhotos(restarbeitId = this.selectedId) {
    const id = normalizeText(restarbeitId);
    if (!id) {
      this._setStubMessage("Kein Datensatz ausgewählt.");
      return { ok: false, restarbeitId: "" };
    }
    if (!this.photosOverlay) {
      this.photosOverlay = createPopupOverlay({ background: "rgba(15, 23, 42, 0.34)" });
      document.body?.appendChild?.(this.photosOverlay);
      registerPopupCloseHandlers(this.photosOverlay, () => this._closePhotosPopup(), { closeOnBackdrop: false });
    }
    const requestId = ++this._photosRequestId;
    this.photosPopup = {
      restarbeitId: id,
      attachments: [],
      isLoading: true,
      error: "",
      warning: "",
    };
    this._renderPhotosPopup();
    try {
      const attachments = await listRestarbeitAttachments(id);
      if (requestId !== this._photosRequestId) return { ok: false, restarbeitId: id, canceled: true };
      this.photosPopup.attachments = attachments;
      return { ok: true, restarbeitId: id, attachments: [...this.photosPopup.attachments] };
    } catch (error) {
      if (requestId !== this._photosRequestId) return { ok: false, restarbeitId: id, canceled: true };
      this.photosPopup.error = error?.message || String(error);
      return { ok: false, restarbeitId: id, error: this.photosPopup.error };
    } finally {
      if (requestId === this._photosRequestId) {
        this.photosPopup.isLoading = false;
        this._renderPhotosPopup();
      }
    }
  }

  _closePhotosPopup() {
    if (!this.photosOverlay) return;
    cleanupPopupHandlers(this.photosOverlay);
    this.photosOverlay.remove?.();
    this.photosOverlay = null;
    this._photosRequestId += 1;
  }

  async _importRestarbeitPhotos() {
    const restarbeitId = normalizeText(this.photosPopup.restarbeitId);
    if (!restarbeitId || this.photosPopup.attachments.length >= 3) return;
    this.photosPopup.isLoading = true;
    this.photosPopup.error = "";
    this.photosPopup.warning = "";
    this._renderPhotosPopup();
    try {
      const result = await importRestarbeitAttachments(restarbeitId, this.projectId);
      this.photosPopup.attachments = result.attachments;
    } catch (error) {
      this.photosPopup.error = error?.message || String(error);
    } finally {
      this.photosPopup.isLoading = false;
      this._renderPhotosPopup();
    }
  }

  async _setPrimaryRestarbeitPhoto(attachmentId) {
    const restarbeitId = normalizeText(this.photosPopup.restarbeitId);
    if (!restarbeitId || !normalizeText(attachmentId)) return;
    this.photosPopup.isLoading = true;
    this.photosPopup.error = "";
    this.photosPopup.warning = "";
    this._renderPhotosPopup();
    try {
      await setPrimaryRestarbeitAttachment(restarbeitId, attachmentId);
      this.photosPopup.attachments = await listRestarbeitAttachments(restarbeitId);
    } catch (error) {
      this.photosPopup.error = error?.message || String(error);
    } finally {
      this.photosPopup.isLoading = false;
      this._renderPhotosPopup();
    }
  }

  async _deleteRestarbeitPhoto(attachmentId) {
    const restarbeitId = normalizeText(this.photosPopup.restarbeitId);
    if (!restarbeitId || !normalizeText(attachmentId)) return;
    if (typeof window?.confirm === "function" && !window.confirm("Foto wirklich löschen?")) return;
    this.photosPopup.isLoading = true;
    this.photosPopup.error = "";
    this.photosPopup.warning = "";
    this._renderPhotosPopup();
    try {
      const result = await deleteRestarbeitAttachment(restarbeitId, attachmentId);
      this.photosPopup.attachments = result.attachments;
      this.photosPopup.warning = result.warning || "";
    } catch (error) {
      this.photosPopup.error = error?.message || String(error);
    } finally {
      this.photosPopup.isLoading = false;
      this._renderPhotosPopup();
    }
  }

  _renderPhotosPopup() {
    if (!this.photosOverlay) return;
    this.photosOverlay.replaceChildren();
    this.photosOverlay.style.display = "flex";

    const card = document.createElement("section");
    card.className = "bbm-restarbeiten-photos-popup bbm-popup-standard bbm-popup-dialog";
    stylePopupCard(card, { width: "min(880px, calc(100vw - 32px))", maxHeight: "100%" });

    const header = document.createElement("header");
    header.className = "bbm-restarbeiten-photos-popup__header bbm-popup-header";
    const title = document.createElement("h2");
    title.textContent = "Fotos zur Restarbeit";
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Schließen";
    applyPopupButtonStyle(closeBtn);
    closeBtn.setAttribute("data-bbm-restarbeiten-photo-action", "close");
    closeBtn.addEventListener("click", () => this._closePhotosPopup());
    header.append(title, closeBtn);

    const body = document.createElement("div");
    body.className = "bbm-restarbeiten-photos-popup__body bbm-popup-body bbm-form-content";
    if (this.photosPopup.isLoading) {
      const loading = document.createElement("p");
      loading.textContent = "Fotos werden geladen ...";
      body.appendChild(loading);
    } else if (!this.photosPopup.attachments.length) {
      const empty = document.createElement("p");
      empty.className = "bbm-restarbeiten-photos-popup__empty";
      empty.textContent = "Noch keine Fotos vorhanden.";
      body.appendChild(empty);
    } else {
      const gallery = document.createElement("div");
      gallery.className = "bbm-restarbeiten-photos-popup__gallery";
      for (const attachment of this.photosPopup.attachments) {
        const item = document.createElement("article");
        item.className = "bbm-restarbeiten-photos-popup__item bbm-form-card";
        const image = document.createElement("img");
        image.src = toLocalFileUrl(attachment.thumbnail_path || attachment.file_path);
        image.alt = normalizeText(attachment.original_file_name || attachment.file_name) || "Foto zur Restarbeit";
        const label = document.createElement("div");
        label.className = "bbm-restarbeiten-photos-popup__label";
        label.textContent = normalizeText(attachment.original_file_name || attachment.file_name) || "Foto";
        const actions = document.createElement("div");
        actions.className = "bbm-restarbeiten-photos-popup__item-actions";
        if (attachment.is_primary === true || Number(attachment.is_primary) === 1) {
          const primary = document.createElement("span");
          primary.className = "bbm-restarbeiten-photos-popup__primary";
          primary.textContent = "Hauptfoto";
          actions.appendChild(primary);
        } else {
          const primaryBtn = document.createElement("button");
          primaryBtn.type = "button";
          primaryBtn.textContent = "Als Hauptfoto";
          applyPopupButtonStyle(primaryBtn);
          primaryBtn.setAttribute("data-bbm-restarbeiten-photo-action", "primary");
          primaryBtn.addEventListener("click", () => this._setPrimaryRestarbeitPhoto(attachment.id));
          actions.appendChild(primaryBtn);
        }
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Löschen";
        applyPopupButtonStyle(deleteBtn, { variant: "danger" });
        deleteBtn.setAttribute("data-bbm-restarbeiten-photo-action", "delete");
        deleteBtn.addEventListener("click", () => this._deleteRestarbeitPhoto(attachment.id));
        actions.appendChild(deleteBtn);
        item.append(image, label, actions);
        gallery.appendChild(item);
      }
      body.appendChild(gallery);
    }

    const message = document.createElement("div");
    message.className = this.photosPopup.error
      ? "bbm-restarbeiten-photos-popup__error"
      : "bbm-restarbeiten-photos-popup__status";
    message.textContent = this.photosPopup.error || this.photosPopup.warning || "";

    const footer = document.createElement("footer");
    footer.className = "bbm-restarbeiten-photos-popup__footer bbm-popup-footer";
    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.textContent = this.photosPopup.attachments.length >= 3 ? "Maximal 3 Fotos" : "Fotos importieren";
    importBtn.disabled = this.photosPopup.isLoading || this.photosPopup.attachments.length >= 3;
    applyPopupButtonStyle(importBtn, { variant: "primary" });
    importBtn.setAttribute("data-bbm-restarbeiten-photo-action", "import");
    importBtn.addEventListener("click", () => this._importRestarbeitPhotos());
    footer.append(message, importBtn);
    card.append(header, body, footer);
    this.photosOverlay.appendChild(card);
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
      if (this.filters.status && normalizeRestarbeitStatus(row.status) !== this.filters.status) return false;
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
  }

  _updateDraft(patch = {}, options = {}) {
    this.draft = prepareDraft({ ...this.draft, ...patch });
    if (options.render === false) return;
    this._renderShell();
  }

  _newDraft() {
    this.selectedId = null;
    this.draft = prepareDraft();
    this._renderShell();
  }

  async _saveDraft() {
    if (!this.projectId) return;
    if (!canPersistRestarbeitDraft(this.draft)) return;
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
    if (!canPersistRestarbeitDraft(this.draft)) return;
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
    };
    this._renderNotesPopup();
    try {
      this.notesPopup.notes = await listRestarbeitNotes(restarbeitId);
    } catch (err) {
      this.notesPopup.error = err?.message || String(err);
    } finally {
      this.notesPopup.isLoading = false;
      this._renderNotesPopup();
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
  }

  async _addNoteFromPopup(noteText) {
    const text = normalizeText(noteText);
    const restarbeitId = normalizeText(this.notesPopup.restarbeitId);
    if (!restarbeitId || !text) return;
    this.notesPopup.error = "";
    try {
      await createRestarbeitNote(restarbeitId, text);
      this.notesPopup.noteText = "";
      this.notesPopup.notes = await listRestarbeitNotes(restarbeitId);
    } catch (err) {
      this.notesPopup.error = err?.message || String(err);
    }
    this._renderNotesPopup();
  }

  _renderNotesPopup() {
    if (!this.notesOverlay) return;
    this.notesOverlay.replaceChildren();
    this.notesOverlay.style.display = "flex";

    const card = document.createElement("section");
    card.className = "bbm-restarbeiten-notes-popup bbm-popup-standard bbm-popup-dialog";
    stylePopupCard(card, { width: "min(720px, calc(100vw - 32px))", maxHeight: "100%" });

    const header = document.createElement("header");
    header.className = "bbm-restarbeiten-notes-popup__header bbm-popup-header";
    const title = document.createElement("h2");
    title.textContent = `Notizen zu Nr.: ${this.draft?.running_number || "?"}`;
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    applyPopupButtonStyle(closeBtn);
    closeBtn.textContent = "Schließen";
    closeBtn.setAttribute("data-bbm-restarbeiten-note-action", "close");
    closeBtn.addEventListener("click", () => this._closeNotesPopup());
    header.append(title, closeBtn);

    const body = document.createElement("div");
    body.className = "bbm-restarbeiten-notes-popup__body bbm-popup-body bbm-form-content";
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
        item.className = "bbm-restarbeiten-notes-popup__note bbm-form-card";
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
    applyPopupButtonStyle(addBtn, { variant: "primary" });
    addBtn.textContent = "Notiz hinzufügen";
    addBtn.disabled = !normalizeText(input.value);
    addBtn.setAttribute("data-bbm-restarbeiten-note-action", "add");
    input.addEventListener("input", () => {
      this.notesPopup.noteText = input.value;
      addBtn.disabled = !normalizeText(input.value);
    });
    addBtn.addEventListener("click", () => this._addNoteFromPopup(input.value));
    actions.appendChild(addBtn);

    const printAvailability = document.createElement("div");
    printAvailability.className = "bbm-restarbeiten-notes-popup__print-availability";
    printAvailability.textContent = "Notizdruck ist derzeit nicht verfügbar.";

    const footer = document.createElement("div");
    footer.className = "bbm-restarbeiten-notes-popup__footer bbm-popup-footer";
    footer.append(printAvailability, actions);

    body.append(summary, history, input);
    card.append(header, body, footer);
    this.notesOverlay.appendChild(card);
  }

  _mountQuicklane(quicklane) {
    this.quicklaneEl?.remove?.();
    this.quicklaneEl = quicklane || null;
    if (this.quicklaneEl && document.body?.appendChild) {
      document.body.appendChild(this.quicklaneEl);
    }
  }

  _renderShell() {
    if (!this.root) return;
    beginM80PilotRender();
    this.root.replaceChildren();
    const filteredRows = this._getFilteredItems();
    this.viewItems = toRestarbeitenListItems(filteredRows);
    const responsibleOptions = this.responsibleFirms
      .map((firm) => ({
        value: normalizeText(firm.key || `${firm.kind}:${firm.id}`),
        label: normalizeText(firm.shortName || firm.short_name || firm.name || firm.company_name),
        ref: { kind: firm.kind, id: firm.id, projectId: this.projectId },
      }))
      .filter((entry) => entry.value && entry.label);

    const quicklane = buildRestarbeitenQuicklane({
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
      onPrint: () => this.openRestarbeitenOutput({ mode: "print" }),
    });
    const filterbar = buildRestarbeitenFilterbar({
      settings: this.settings,
      filters: this.filters,
      filterOptions: this._buildFilterOptions(),
      onFilterChange: (patch) => {
        this.filters = { ...this.filters, ...patch };
        this._renderShell();
      },
      onClose: () => this.router?.showProjectWorkspace?.(this.projectId, { project: this.project }),
    });
    const header = document.createElement("header");
    header.className = "bbm-restarbeiten-header";
    header.appendChild(filterbar);
    registerM80Ref("restarbeiten.header.root", header);
    this.root.append(header);
    this._mountQuicklane(quicklane);

    const main = buildRestarbeitenMainBody({
      items: this.viewItems,
      selectedId: this.selectedId,
      showAmpel: this.showAmpelInList,
      showLongtext: this.showLongtextInList,
      onSelect: (id) => this._selectItem(id),
      onPhotos: (id) => this.openRestarbeitPhotos(id),
    });
    const editbox = buildRestarbeitenEditbox({
      settings: this.settings,
      textLimits: this.textLimits,
      draft: this.draft,
      showAmpel: this.showAmpelInList,
      responsibleOptions,
      onNew: () => this._newDraft(),
      onDraftChange: (patch, options) => this._updateDraft(patch, options),
      onDelete: () => this._deleteDraft().catch((err) => this._setStubMessage(err?.message || String(err))),
      onNote: () => this._openNotesPopup().catch((err) => this._setStubMessage(err?.message || String(err))),
      onAutoSave: () => this._autoSaveDraft().catch((err) => this._setStubMessage(err?.message || String(err))),
    });
    const workspace = document.createElement("div");
    workspace.className = "bbm-restarbeiten-workspace";
    const listPane = document.createElement("div");
    listPane.className = "bbm-restarbeiten-workspace__list";
    const editPane = document.createElement("div");
    editPane.className = "bbm-restarbeiten-workspace__edit";
    listPane.appendChild(main);
    editPane.appendChild(editbox);
    workspace.append(listPane, editPane);
    this.root.appendChild(workspace);

    if (this.isLoading || this.error) {
      const status = document.createElement("div");
      status.className = "bbm-restarbeiten-empty";
      status.textContent = this.isLoading ? "Restarbeiten werden geladen ..." : this.error;
      this.root.appendChild(status);
    }
    completeM80PilotRender();
  }

  destroy() {
    this._textLimitUnsubscribe?.();
    this._textLimitUnsubscribe = null;
    this.notesOverlay?.remove?.();
    this.notesOverlay = null;
    this.photosOverlay?.remove?.();
    this.photosOverlay = null;
    this.quicklaneEl?.remove?.();
    this.quicklaneEl = null;
  }
}
