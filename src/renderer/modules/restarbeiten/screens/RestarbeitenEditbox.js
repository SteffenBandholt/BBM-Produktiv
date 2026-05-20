import { getRestarbeitenAmpelState } from "../viewModel/restarbeitenListItems.js";
function normalizeText(value) {
  return String(value ?? "").trim();
}

const LOCATION_KEYS = ["location_level_1", "location_level_2", "location_level_3", "location_level_4"];
const LOCATION_LABEL_FALLBACKS = ["Ebene 1", "Ebene 2", "Ebene 3", "Ebene 4"];
const AUTOSAVE_DELAY_MS = 650;
const EDITBOX_STATUS_OPTIONS = [
  { value: "offen", label: "offen" },
  { value: "in arbeit", label: "in arbeit" },
  { value: "erledigt", label: "erledigt" },
];

function createField(doc, labelText, control, className = "") {
  const wrap = doc.createElement("label");
  wrap.className = `restarbeiten-editbox__field ${className}`.trim();

  const label = doc.createElement("span");
  label.className = "restarbeiten-editbox__label";
  label.textContent = labelText;

  wrap.append(label, control);
  return wrap;
}

function createSelect(doc, options) {
  const select = doc.createElement("select");
  select.className = "restarbeiten-editbox__control";
  for (const option of options) {
    const opt = doc.createElement("option");
    opt.value = String(option.value ?? "");
    opt.textContent = String(option.label ?? "");
    select.append(opt);
  }
  return select;
}

function createInput(doc, type = "text", className = "") {
  const input = doc.createElement(type === "textarea" ? "textarea" : "input");
  input.className = "restarbeiten-editbox__control";
  if (className) input.className += ` ${className}`;
  if (type === "text") input.className += " restarbeiten-editbox__control--short";
  if (type === "textarea") input.className += " restarbeiten-editbox__control--long";
  if (type !== "textarea") input.type = type;
  return input;
}

function normalizeFirmEntries(list) {
  if (!Array.isArray(list)) return [];
  return list.map((firm) => {
    const id = normalizeText(firm?.id);
    if (!id) return null;
    return { id, name: normalizeText(firm?.name) };
  }).filter(Boolean);
}

function normalizeEditboxStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return "offen";
  if (raw === "in arbeit" || raw === "erledigt" || raw === "offen") return raw;
  if (raw === "in_arbeit") return "in arbeit";
  if (raw === "erledigt_gemeldet" || raw === "geprueft_erledigt" || raw === "geprüft erledigt") return "erledigt";
  return "offen";
}

export default class RestarbeitenEditbox {
  constructor({
    documentRef = globalThis.document,
    onSave = null,
    onCreate = null,
    onDelete = null,
  } = {}) {
    this.document = documentRef || globalThis.document;
    this.onSave = typeof onSave === "function" ? onSave : null;
    this.onCreate = typeof onCreate === "function" ? onCreate : null;
    this.onDelete = typeof onDelete === "function" ? onDelete : null;
    this.root = null;
    this.form = null;
    this.titleEl = null;
    this.statusEl = null;
    this.ampelPreviewEl = null;
    this.currentItem = null;
    this.projectFirms = [];
    this.locationLabels = {};
    this.locationOptions = {};
    this.locationOptionLists = {};
    this.fields = {};
    this.attachments = [];
    this.showAmpelPreview = true;
    this.isApplyingItem = false;
    this._updateAmpelPreview();
    this.isSaving = false;
    this.autosaveTimer = null;
    this.pendingDraftKey = "";
    this.currentItemDraftKey = "";
    this.lastSavedDraftKey = "";
    this.lastRequestedDraftKey = "";
    this.lastSaveFailed = false;
    this.failedDraftKey = "";
    this.noteDraftValue = "";
    this.isDeleting = false;
  }

  _getLocationLabel(index) {
    const configured = normalizeText(this.locationLabels?.[`level_${index}_label`]);
    return configured || LOCATION_LABEL_FALLBACKS[index - 1];
  }

  setLocationLabels(settings) {
    this.locationLabels = settings && typeof settings === "object" ? { ...settings } : {};
    LOCATION_KEYS.forEach((key, idx) => {
      const labelEl = this.fields?.[`${key}__label`];
      if (labelEl) labelEl.textContent = this._getLocationLabel(idx + 1);
    });
  }

  render() {
    const doc = this.document;
    const root = doc.createElement("section");
    root.className = "restarbeiten-editbox restarbeiten-editbox--compact";
    const form = doc.createElement("form");
    form.className = "restarbeiten-editbox__layout";
    const topBar = doc.createElement("div");
    topBar.className = "restarbeiten-editbox__topBar";
    const titleEl = doc.createElement("div");
    titleEl.className = "restarbeiten-editbox__title";
    titleEl.textContent = "R der Liste bearbeiten";
    const body = doc.createElement("div");
    body.className = "restarbeiten-editbox__body";
    const mainCol = doc.createElement("div");
    mainCol.className = "restarbeiten-editbox__main";
    const textRail = doc.createElement("div");
    textRail.className = "restarbeiten-editbox__textRail";
    const rightGroup = doc.createElement("div");
    rightGroup.className = "restarbeiten-editbox__rightGroup";
    const metaCol = doc.createElement("aside");
    metaCol.className = "restarbeiten-editbox__meta";

    const shortText = createInput(doc, "text");
    const longText = createInput(doc, "textarea");
    longText.rows = 4;
    const textColumn = doc.createElement("div");
    textColumn.className = "restarbeiten-editbox__textColumn";
    const shortField = doc.createElement("div");
    shortField.className = "restarbeiten-editbox__inputSlot restarbeiten-editbox__inputSlot--short";
    shortField.append(shortText);
    const longField = doc.createElement("div");
    longField.className = "restarbeiten-editbox__inputSlot restarbeiten-editbox__inputSlot--long";
    longField.append(longText);

    const shortRailRow = doc.createElement("div");
    shortRailRow.className = "restarbeiten-editbox__railRow restarbeiten-editbox__railRow--short";
    const shortRailLabel = doc.createElement("span");
    shortRailLabel.className = "restarbeiten-editbox__railLabel";
    shortRailLabel.textContent = "Kurztext";
    const shortCounter = doc.createElement("span");
    shortCounter.className = "restarbeiten-editbox__railCounter";
    shortRailRow.append(shortRailLabel, shortCounter);

    const longRailRow = doc.createElement("div");
    longRailRow.className = "restarbeiten-editbox__railRow restarbeiten-editbox__railRow--long";
    const longRailLabel = doc.createElement("span");
    longRailLabel.className = "restarbeiten-editbox__railLabel";
    longRailLabel.textContent = "Langtext";
    const longCounter = doc.createElement("span");
    longCounter.className = "restarbeiten-editbox__railCounter";
    longRailRow.append(longRailLabel, longCounter);

    textRail.append(shortRailRow, longRailRow);
    const classActions = doc.createElement("div");
    classActions.className = "restarbeiten-editbox__classActions restarbeiten-editbox__classActions--top";
    const level1 = createInput(doc, "text", "restarbeiten-editbox__locationControl");
    const level2 = createInput(doc, "text", "restarbeiten-editbox__locationControl");
    const level3 = createInput(doc, "text", "restarbeiten-editbox__locationControl");
    const level4 = createInput(doc, "text", "restarbeiten-editbox__locationControl");

    const locationGrid = doc.createElement("div");
    locationGrid.className = "restarbeiten-editbox__locationGrid";
    const loc1Field = createField(doc, this._getLocationLabel(1), level1, "restarbeiten-editbox__locationField");
    const loc2Field = createField(doc, this._getLocationLabel(2), level2, "restarbeiten-editbox__locationField");
    const loc3Field = createField(doc, this._getLocationLabel(3), level3, "restarbeiten-editbox__locationField");
    const loc4Field = createField(doc, this._getLocationLabel(4), level4, "restarbeiten-editbox__locationField");
    [loc1Field, loc2Field, loc3Field, loc4Field].forEach((field) => {
      const label = field.querySelector?.(".restarbeiten-editbox__label") || field.children[0];
      if (label) label.className = `${label.className} restarbeiten-editbox__locationLabel`.trim();
    });
    locationGrid.append(loc1Field, loc2Field, loc3Field, loc4Field);

    textColumn.append(shortField, longField);

    mainCol.append(
      textRail,
      textColumn
    );

    const itemClass = createInput(doc, "hidden");
    itemClass.value = "rest";
    const marker = doc.createElement("div");
    marker.className = "restarbeiten-editbox__classToggle";
    const restBtn = doc.createElement("button");
    restBtn.type = "button";
    restBtn.textContent = "Rest";
    restBtn.className = "restarbeiten-editbox__classToggleButton";
    const mangelBtn = doc.createElement("button");
    mangelBtn.type = "button";
    mangelBtn.textContent = "Mangel";
    mangelBtn.className = "restarbeiten-editbox__classToggleButton";
    marker.append(restBtn, mangelBtn);
    const setItemClass = (value) => {
      itemClass.value = value === "mangel" ? "mangel" : "rest";
      restBtn.dataset.active = itemClass.value === "rest" ? "1" : "0";
      mangelBtn.dataset.active = itemClass.value === "mangel" ? "1" : "0";
    };
    restBtn.addEventListener("click", () => {
      setItemClass("rest");
      this._triggerAutosaveImmediate();
    });
    mangelBtn.addEventListener("click", () => {
      setItemClass("mangel");
      this._triggerAutosaveImmediate();
    });

    const status = createSelect(doc, EDITBOX_STATUS_OPTIONS);
    const dueDate = createInput(doc, "date");
    dueDate.className += " restarbeiten-editbox__metaControl restarbeiten-editbox__metaDate";
    const responsibleProjectFirmId = createSelect(doc, [{ value: "", label: "— keine Auswahl —" }]);
    status.className += " restarbeiten-editbox__metaControl";
    responsibleProjectFirmId.className += " restarbeiten-editbox__metaControl";
    const ampelPreview = doc.createElement("span");
    ampelPreview.className = "restarbeiten-editbox__ampelPreview restarbeiten-list__ampel";
    const createBtn = this.onCreate ? doc.createElement("button") : null;
    if (createBtn) {
      createBtn.type = "button";
      createBtn.textContent = "+ Restpunkt";
      createBtn.className = "restarbeiten-editbox__create";
      createBtn.addEventListener("click", async () => {
        await this.flushAutosave();
        await this.onCreate?.();
      });
    }
    const statusEl = doc.createElement("div");
    statusEl.className = "restarbeiten-editbox__status";

    marker.className += " restarbeiten-editbox__classToggle--compact";

    const dueDateRow = doc.createElement("div");
    dueDateRow.className = "restarbeiten-editbox__metaRow restarbeiten-editbox__metaRow--dueDate";
    const dueDateField = createField(doc, "Fertig bis", dueDate);
    dueDateField.className += " restarbeiten-editbox__dueDateField";
    const ampelField = createField(doc, "", ampelPreview);
    ampelField.className += " restarbeiten-editbox__ampelField";
    dueDateRow.append(dueDateField, ampelField);

    const statusFieldRow = doc.createElement("div");
    statusFieldRow.className = "restarbeiten-editbox__metaRow restarbeiten-editbox__metaRow--status";
    const statusField = createField(doc, "Status", status);
    statusField.className += " restarbeiten-editbox__statusField";
    statusFieldRow.append(statusField);

    const markerField = createField(doc, "", marker);
    markerField.className += " restarbeiten-editbox__classToggleWrap";
    classActions.append(markerField);
    if (createBtn) {
      createBtn.className += " restarbeiten-editbox__create--right";
      classActions.append(createBtn);
    }

    const deleteBtn = this.onDelete ? doc.createElement("button") : null;
    if (deleteBtn) {
      deleteBtn.type = "button";
      deleteBtn.textContent = "Löschen";
      deleteBtn.title = "Löschen";
      deleteBtn.className = "restarbeiten-editbox__delete";
      deleteBtn.disabled = true;
      deleteBtn.addEventListener("click", async () => {
        const selectedId = normalizeText(this.currentItem?.id);
        if (!selectedId || this.isDeleting) return;
        const approve = await this._openDeleteDialog();
        if (!approve) return;
        this.isDeleting = true;
        deleteBtn.disabled = true;
        try {
          await this.flushAutosave();
          await this.onDelete?.(selectedId);
        } finally {
          this.isDeleting = false;
          deleteBtn.disabled = !normalizeText(this.currentItem?.id);
        }
      });
      classActions.append(deleteBtn);
    }
    const responsibleField = createField(doc, "Verantwortlich", responsibleProjectFirmId);
    responsibleField.className += " restarbeiten-editbox__responsibleField";
    const completedAt = createInput(doc, "date");
    completedAt.className += " restarbeiten-editbox__metaControl restarbeiten-editbox__metaDate";
    const completionNoteBtn = doc.createElement("button");
    completionNoteBtn.type = "button";
    completionNoteBtn.textContent = "✎";
    completionNoteBtn.title = "Notiz";
    completionNoteBtn.setAttribute("aria-label", "Notiz");
    completionNoteBtn.className = "restarbeiten-editbox__noteBtn";
    completionNoteBtn.addEventListener("click", () => this._openCompletionNoteDialog());
    const completedAtRow = doc.createElement("div");
    completedAtRow.className = "restarbeiten-editbox__metaRow restarbeiten-editbox__metaRow--completedAt";
    const completedAtField = createField(doc, "erledigt am", completedAt);
    const completionNoteField = createField(doc, "", completionNoteBtn);
    completedAtRow.append(completedAtField, completionNoteField);
    metaCol.append(
      dueDateRow,
      statusFieldRow,
      responsibleField,
      completedAtRow,
      statusEl
    );
    rightGroup.append(locationGrid, metaCol);
    topBar.append(titleEl, classActions);
    body.append(mainCol, rightGroup);
    form.append(topBar, body, itemClass);
    root.append(form);


    form.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation?.();
    });

    this.root = root;
    this.form = form;
    this.titleEl = titleEl;
    this.statusEl = statusEl;
    this.ampelPreviewEl = ampelPreview;
    this.fields = {
      item_class: itemClass,
      status,
      location_level_1: level1,
      location_level_2: level2,
      location_level_3: level3,
      location_level_4: level4,
      short_text: shortText,
      long_text: longText,
      short_text__counter: shortCounter,
      long_text__counter: longCounter,
      due_date: dueDate,
      completed_at: completedAt,
      responsible_project_firm_id: responsibleProjectFirmId,
      location_level_1__label: loc1Field.querySelector?.(".restarbeiten-editbox__label") || loc1Field.children[0],
      location_level_2__label: loc2Field.querySelector?.(".restarbeiten-editbox__label") || loc2Field.children[0],
      location_level_3__label: loc3Field.querySelector?.(".restarbeiten-editbox__label") || loc3Field.children[0],
      location_level_4__label: loc4Field.querySelector?.(".restarbeiten-editbox__label") || loc4Field.children[0],
      delete_button: deleteBtn,
    };
    this._setItemClass = setItemClass;
    this._wireLocationDatalists();
    this._bindAutosaveInputs();
    this._updateTextRailCounters();
    this.setItem(null);
    return root;
  }

  _bindAutosaveInputs() {
    const debouncedKeys = [...LOCATION_KEYS, "short_text", "long_text"];
    debouncedKeys.forEach((key) => {
      const input = this.fields?.[key];
      if (!input?.addEventListener) return;
      input.addEventListener("input", () => {
        this._updateTextRailCounters();
        this._queueAutosave();
      });
      input.addEventListener("blur", () => this.flushAutosave());
    });
    ["status", "due_date", "completed_at", "responsible_project_firm_id"].forEach((key) => {
      const input = this.fields?.[key];
      if (!input?.addEventListener) return;
      input.addEventListener("change", () => {
        if (key === "status") this._handleStatusChange();
        this._updateAmpelPreview();
        this._triggerAutosaveImmediate();
      });
    });
  }

  _todayIsoDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  _openCompletionNoteDialog() {
    const doc = this.document;
    const overlay = doc.createElement("div");
    overlay.className = "restarbeiten-editbox__noteDialog";
    const closeOverlay = () => {
      if (typeof overlay.remove === "function") {
        overlay.remove();
        return;
      }
      const parent = overlay.parentElement;
      if (parent && Array.isArray(parent.children)) {
        parent.children = parent.children.filter((child) => child !== overlay);
      }
    };
    const card = doc.createElement("div");
    const prompt = doc.createElement("p");
    prompt.textContent = "Folgende Maßnahmen sind getroffen:";
    const textarea = createInput(doc, "textarea");
    textarea.value = normalizeText(this.noteDraftValue);
    const actions = doc.createElement("div");
    const applyBtn = doc.createElement("button");
    applyBtn.type = "button";
    applyBtn.textContent = "Übernehmen";
    const cancelBtn = doc.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Abbrechen";
    cancelBtn.addEventListener("click", () => closeOverlay());
    applyBtn.addEventListener("click", async () => {
      this.noteDraftValue = normalizeText(textarea.value);
      closeOverlay();
      await this.flushAutosave();
    });
    actions.append(applyBtn, cancelBtn);
    card.append(prompt, textarea, actions);
    overlay.append(card);
    this.root?.append(overlay);
  }


  _openDeleteDialog() {
    const doc = this.document;
    return new Promise((resolve) => {
      const overlay = doc.createElement("div");
      overlay.className = "restarbeiten-editbox__deleteDialog";
      const card = doc.createElement("div");
      const prompt = doc.createElement("p");
      prompt.textContent = "Diesen Restpunkt wirklich löschen?";
      const actions = doc.createElement("div");
      const deleteBtn = doc.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Löschen";
      const cancelBtn = doc.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.textContent = "Abbrechen";
      const close = (approved) => {
        if (typeof overlay.remove === "function") overlay.remove();
        else if (overlay.parentElement && Array.isArray(overlay.parentElement.children)) {
          overlay.parentElement.children = overlay.parentElement.children.filter((child) => child !== overlay);
        }
        resolve(approved === true);
      };
      cancelBtn.addEventListener("click", () => close(false));
      deleteBtn.addEventListener("click", () => close(true));
      actions.append(deleteBtn, cancelBtn);
      card.append(prompt, actions);
      overlay.append(card);
      this.root?.append(overlay);
    });
  }

  _handleStatusChange() {
    const status = normalizeText(this.fields?.status?.value);
    if (status !== "erledigt") return;
    if (!normalizeText(this.fields?.completed_at?.value) && this.fields?.completed_at) {
      this.fields.completed_at.value = this._todayIsoDate();
    }
    this._openCompletionNoteDialog();
  }

  _draftKeyFor(draft) {
    return JSON.stringify(draft || {});
  }

  _formatTitlePrefix(item = null) {
    const itemClass = normalizeText(item?.item_class).toLowerCase();
    return itemClass === "mangel" ? "M" : "R";
  }

  _formatTitleNumber(item = null) {
    const raw = normalizeText(item?.running_number ?? item?.numberLine ?? "");
    return raw || "";
  }

  _updateTitle() {
    if (!this.titleEl) return;
    const prefix = this._formatTitlePrefix(this.currentItem);
    const number = this._formatTitleNumber(this.currentItem);
    this.titleEl.textContent = number ? `${prefix} ${number} bearbeiten` : `${prefix} der Liste bearbeiten`;
  }

  _updateTextRailCounters() {
    const shortCounter = this.fields?.short_text__counter;
    const longCounter = this.fields?.long_text__counter;
    if (shortCounter) shortCounter.textContent = String(normalizeText(this.fields?.short_text?.value).length);
    if (longCounter) longCounter.textContent = String(normalizeText(this.fields?.long_text?.value).length);
  }

  _canAutosave() {
    return !!this.onSave && !!normalizeText(this.currentItem?.id) && !this.isApplyingItem;
  }

  _queueAutosave() {
    if (!this._canAutosave()) return;
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => { this.autosaveTimer = null; this.flushAutosave(); }, AUTOSAVE_DELAY_MS);
  }

  _triggerAutosaveImmediate() {
    if (!this._canAutosave()) return;
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = null;
    }
    void this.flushAutosave();
  }

  async flushAutosave() {
    if (!this._canAutosave()) return;
    const draft = this.getDraft();
    const draftKey = this._draftKeyFor(draft);
    if (draftKey === this.lastSavedDraftKey) return;

    const isFailedDraft = this.lastSaveFailed && draftKey === this.failedDraftKey;
    if (this.isSaving && draftKey === this.lastRequestedDraftKey && !isFailedDraft) return;
    this.pendingDraftKey = draftKey;
    if (this.isSaving) return;
    await this._runSaveLoop();
  }

  async _runSaveLoop() {
    while (this.pendingDraftKey && !this.isApplyingItem) {
      const draftKey = this.pendingDraftKey;
      this.pendingDraftKey = "";
      this.lastRequestedDraftKey = draftKey;
      this.isSaving = true;
      this.setStatus("Änderungen werden gespeichert …");
      try {
        await this.onSave?.(JSON.parse(draftKey));
        this.lastSavedDraftKey = draftKey;
        this.lastSaveFailed = false;
        this.failedDraftKey = "";
        this.setStatus("Gespeichert");
      } catch {
        this.lastSaveFailed = true;
        this.failedDraftKey = draftKey;
        this.pendingDraftKey = draftKey;
        this.setStatus("Speichern fehlgeschlagen");
        break;
      } finally {
        this.isSaving = false;
      }
    }
  }

  _normalizeLocationOptions(options = {}) {
    const normalized = {};
    for (const key of LOCATION_KEYS) {
      const values = Array.isArray(options?.[key]) ? options[key] : [];
      const unique = [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
      normalized[key] = unique.sort((a, b) => a.localeCompare(b, "de"));
    }
    return normalized;
  }
  setLocationOptions(options) {
    this.locationOptions = this._normalizeLocationOptions(options);
    this._wireLocationDatalists();
  }
  _wireLocationDatalists() {
    const doc = this.document;
    for (const key of LOCATION_KEYS) {
      const input = this.fields?.[key];
      if (!input || !doc?.createElement) continue;

      let datalist = this.locationOptionLists[key];
      if (!datalist) {
        datalist = doc.createElement("datalist");
        datalist.id = `restarbeiten-editbox-${key}-options`;
        this.locationOptionLists[key] = datalist;
      }

      datalist.replaceChildren();
      for (const value of this.locationOptions?.[key] || []) {
        const opt = doc.createElement("option");
        opt.value = value;
        datalist.append(opt);
      }

      const parent = input.parentElement;
      if (parent && !Array.from(parent.children || []).includes(datalist)) {
        parent.append(datalist);
      }
      input.setAttribute("list", datalist.id);
    }
  }

  setProjectFirms(firms) {
    this.projectFirms = normalizeFirmEntries(firms);
    const select = this.fields?.responsible_project_firm_id;
    if (!select) return;

    const selectedBefore = normalizeText(select.value);
    const options = [{ id: "", name: "— keine Auswahl —" }, ...this.projectFirms];
    select.replaceChildren();

    for (const option of options) {
      const opt = this.document.createElement("option");
      opt.value = option.id;
      opt.textContent = option.name || "—";
      select.appendChild(opt);
    }

    const fallbackId = normalizeText(this.currentItem?.responsible_project_firm_id);
    const targetId = fallbackId || selectedBefore;
    const selectOptions = Array.from(select.children || []);
    const hasTargetOption = !!targetId && selectOptions.some((option) => normalizeText(option?.value) === targetId);

    if (targetId && !hasTargetOption) {
      const legacy = this.document.createElement("option");
      legacy.value = targetId;
      legacy.textContent = normalizeText(this.currentItem?.responsible_label) || "(nicht mehr vorhanden)";
      select.appendChild(legacy);
    }

    select.value = targetId;
  }

  setAttachments(attachments) {
    this.attachments = Array.isArray(attachments) ? attachments : [];
  }

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = String(text || "");
  }

  setSaving() {}

  _updateAmpelPreview() {
    if (!this.ampelPreviewEl) return;
    const state = getRestarbeitenAmpelState({
      status: normalizeText(this.fields?.status?.value) || "offen",
      due_date: normalizeText(this.fields?.due_date?.value),
    });
    this.ampelPreviewEl.className = `restarbeiten-editbox__ampelPreview restarbeiten-list__ampel restarbeiten-list__ampel--${state}`;
    this.ampelPreviewEl.dataset.ampel = state;
    this.ampelPreviewEl.textContent = "";
    this.ampelPreviewEl.dataset.visible = this.showAmpelPreview ? "1" : "0";
  }

  setAmpelVisible(visible) {
    this.showAmpelPreview = !!visible;
    this._updateAmpelPreview();
  }

  setItem(item) {
    this.isApplyingItem = true;
    this.currentItem = item || null;
    const source = this.currentItem || {};
    const fields = this.fields || {};

    this._setItemClass?.(normalizeText(source.item_class) || "rest");
    if (fields.status) {
      fields.status.value = normalizeEditboxStatus(source.status);
    }
    LOCATION_KEYS.forEach((key) => {
      if (fields[key]) fields[key].value = normalizeText(source[key]);
    });
    if (fields.short_text) fields.short_text.value = normalizeText(source.short_text);
    if (fields.long_text) fields.long_text.value = normalizeText(source.long_text);
    if (fields.due_date) fields.due_date.value = normalizeText(source.due_date);
    if (fields.completed_at) fields.completed_at.value = normalizeText(source.completed_at);
    this.noteDraftValue = normalizeText(source.completion_note);
    this.setProjectFirms(this.projectFirms);
    this._updateTextRailCounters();
    this._updateTitle();
    if (fields.delete_button) fields.delete_button.disabled = !normalizeText(source.id) || this.isDeleting;

    const loadedDraftKey = this._draftKeyFor(this.getDraft());
    this.currentItemDraftKey = loadedDraftKey;
    this.lastSavedDraftKey = loadedDraftKey;

    const hasPending = !!this.pendingDraftKey;
    const visibleDraftKey = this._draftKeyFor(this.getDraft());
    const hasUnsavedVisibleDraft = visibleDraftKey !== loadedDraftKey;
    if (!this.isSaving && !hasPending && !hasUnsavedVisibleDraft) {
      this.pendingDraftKey = "";
      this.lastRequestedDraftKey = "";
      this.lastSaveFailed = false;
      this.failedDraftKey = "";
    }

    this.isApplyingItem = false;
    this._updateAmpelPreview();
  }

  getDraft() {
    const fields = this.fields || {};
    const selectedFirmId = normalizeText(fields.responsible_project_firm_id?.value);
    const selectedFirm = this.projectFirms.find((entry) => entry.id === selectedFirmId) || null;
    const oldLabel = normalizeText(this.currentItem?.responsible_label);
    let responsibleProjectFirmId = null;
    let responsibleLabel = oldLabel;
    if (selectedFirmId && selectedFirm) {
      responsibleProjectFirmId = selectedFirm.id;
      responsibleLabel = selectedFirm.name;
    }

    return {
      item_class: normalizeText(fields.item_class?.value) || "rest",
      status: normalizeText(fields.status?.value) || "offen",
      location_level_1: normalizeText(fields.location_level_1?.value),
      location_level_2: normalizeText(fields.location_level_2?.value),
      location_level_3: normalizeText(fields.location_level_3?.value),
      location_level_4: normalizeText(fields.location_level_4?.value),
      short_text: normalizeText(fields.short_text?.value),
      long_text: normalizeText(fields.long_text?.value),
      due_date: normalizeText(fields.due_date?.value),
      completed_at: normalizeText(fields.completed_at?.value),
      completion_note: normalizeText(this.noteDraftValue),
      responsible_project_firm_id: responsibleProjectFirmId,
      responsible_label: responsibleLabel,
    };
  }
}
