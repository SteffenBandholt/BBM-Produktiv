function normalizeText(value) {
  return String(value ?? "").trim();
}

const LOCATION_KEYS = ["location_level_1", "location_level_2", "location_level_3", "location_level_4"];
const LOCATION_LABEL_FALLBACKS = ["Ebene 1", "Ebene 2", "Ebene 3", "Ebene 4"];
const AUTOSAVE_DELAY_MS = 650;

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

export default class RestarbeitenEditbox {
  constructor({ documentRef = globalThis.document, onSave = null, onCreate = null } = {}) {
    this.document = documentRef || globalThis.document;
    this.onSave = typeof onSave === "function" ? onSave : null;
    this.onCreate = typeof onCreate === "function" ? onCreate : null;
    this.root = null;
    this.form = null;
    this.statusEl = null;
    this.currentItem = null;
    this.projectFirms = [];
    this.locationLabels = {};
    this.locationOptions = {};
    this.locationOptionLists = {};
    this.fields = {};
    this.attachments = [];
    this.isApplyingItem = false;
    this.isSaving = false;
    this.autosaveTimer = null;
    this.pendingDraftKey = "";
    this.lastSavedDraftKey = "";
    this.lastRequestedDraftKey = "";
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
    const mainCol = doc.createElement("div");
    mainCol.className = "restarbeiten-editbox__main";
    const metaCol = doc.createElement("aside");
    metaCol.className = "restarbeiten-editbox__meta";

    const shortText = createInput(doc, "text");
    const longText = createInput(doc, "textarea");
    longText.rows = 4;
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

    mainCol.append(createField(doc, "Kurztext", shortText), createField(doc, "Langtext", longText), locationGrid);

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

    const status = createSelect(doc, [
      { value: "offen", label: "offen" }, { value: "in_arbeit", label: "in Arbeit" }, { value: "erledigt_gemeldet", label: "erledigt gemeldet" },
      { value: "geprueft_erledigt", label: "geprueft erledigt" }, { value: "zurueckgewiesen", label: "zurueckgewiesen" },
    ]);
    const dueDate = createInput(doc, "date");
    const responsibleProjectFirmId = createSelect(doc, [{ value: "", label: "— keine Auswahl —" }]);
    responsibleProjectFirmId.className += " restarbeiten-editbox__metaControl";
    const createBtn = this.onCreate ? doc.createElement("button") : null;
    if (createBtn) {
      createBtn.type = "button";
      createBtn.textContent = "+ Restarbeit";
      createBtn.className = "restarbeiten-editbox__create";
      createBtn.addEventListener("click", async () => {
        await this.flushAutosave();
        await this.onCreate?.();
      });
    }
    const statusEl = doc.createElement("div");
    statusEl.className = "restarbeiten-editbox__status";

    metaCol.append(createField(doc, "Rest / Mangel", marker), createField(doc, "Status", status), createField(doc, "Fertig bis", dueDate), createField(doc, "Verantwortlich", responsibleProjectFirmId), ...(createBtn ? [createBtn] : []), statusEl);
    form.append(mainCol, metaCol, itemClass);
    root.append(form);

    this.root = root;
    this.form = form;
    this.statusEl = statusEl;
    this.fields = { item_class: itemClass, status, location_level_1: level1, location_level_2: level2, location_level_3: level3, location_level_4: level4, short_text: shortText, long_text: longText, due_date: dueDate, responsible_project_firm_id: responsibleProjectFirmId,
      location_level_1__label: loc1Field.querySelector?.(".restarbeiten-editbox__label") || loc1Field.children[0],
      location_level_2__label: loc2Field.querySelector?.(".restarbeiten-editbox__label") || loc2Field.children[0],
      location_level_3__label: loc3Field.querySelector?.(".restarbeiten-editbox__label") || loc3Field.children[0],
      location_level_4__label: loc4Field.querySelector?.(".restarbeiten-editbox__label") || loc4Field.children[0], };
    this._setItemClass = setItemClass;
    this._wireLocationDatalists();
    this._bindAutosaveInputs();
    this.setItem(null);
    return root;
  }

  _bindAutosaveInputs() {
    const debouncedKeys = [...LOCATION_KEYS, "short_text", "long_text"];
    debouncedKeys.forEach((key) => {
      const input = this.fields?.[key];
      if (!input?.addEventListener) return;
      input.addEventListener("input", () => this._queueAutosave());
      input.addEventListener("blur", () => this.flushAutosave());
    });
    ["status", "due_date", "responsible_project_firm_id"].forEach((key) => {
      const input = this.fields?.[key];
      if (!input?.addEventListener) return;
      input.addEventListener("change", () => this._triggerAutosaveImmediate());
    });
  }

  _draftKeyFor(draft) { return JSON.stringify(draft || {}); }
  _canAutosave() { return !!this.onSave && !!normalizeText(this.currentItem?.id) && !this.isApplyingItem; }

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
    if (draftKey === this.lastSavedDraftKey || draftKey === this.lastRequestedDraftKey) return;
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
        this.setStatus("Gespeichert");
      } catch {
        this.pendingDraftKey = draftKey;
        this.setStatus("Speichern fehlgeschlagen");
        break;
      } finally {
        this.isSaving = false;
      }
    }
  }

  _normalizeLocationOptions(options = {}) { const normalized = {}; for (const key of LOCATION_KEYS) { const values = Array.isArray(options?.[key]) ? options[key] : []; const unique = [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))]; normalized[key] = unique.sort((a, b) => a.localeCompare(b, "de")); } return normalized; }
  setLocationOptions(options) { this.locationOptions = this._normalizeLocationOptions(options); this._wireLocationDatalists(); }
  _wireLocationDatalists() { const doc = this.document; for (const key of LOCATION_KEYS) { const input = this.fields?.[key]; if (!input || !doc?.createElement) continue; let datalist = this.locationOptionLists[key]; if (!datalist) { datalist = doc.createElement("datalist"); datalist.id = `restarbeiten-editbox-${key}-options`; this.locationOptionLists[key] = datalist; } datalist.replaceChildren(); for (const value of this.locationOptions?.[key] || []) { const opt = doc.createElement("option"); opt.value = value; datalist.append(opt); } const parent = input.parentElement; if (parent && !Array.from(parent.children || []).includes(datalist)) parent.append(datalist); input.setAttribute("list", datalist.id); } }

  setProjectFirms(firms) { this.projectFirms = normalizeFirmEntries(firms); const select = this.fields?.responsible_project_firm_id; if (!select) return; const selectedBefore = normalizeText(select.value); const options = [{ id: "", name: "— keine Auswahl —" }, ...this.projectFirms]; select.replaceChildren(); for (const option of options) { const opt = this.document.createElement("option"); opt.value = option.id; opt.textContent = option.name || "—"; select.appendChild(opt); } const fallbackId = normalizeText(this.currentItem?.responsible_project_firm_id); const targetId = fallbackId || selectedBefore; const selectOptions = Array.from(select.children || []); const hasTargetOption = !!targetId && selectOptions.some((option) => normalizeText(option?.value) === targetId); if (targetId && !hasTargetOption) { const legacy = this.document.createElement("option"); legacy.value = targetId; legacy.textContent = normalizeText(this.currentItem?.responsible_label) || "(nicht mehr vorhanden)"; select.appendChild(legacy); } select.value = targetId; }
  setAttachments(attachments) { this.attachments = Array.isArray(attachments) ? attachments : []; }
  setStatus(text) { if (this.statusEl) this.statusEl.textContent = String(text || ""); }
  setSaving() {}

  setItem(item) {
    this.isApplyingItem = true;
    this.currentItem = item || null;
    const source = this.currentItem || {};
    const fields = this.fields || {};
    this._setItemClass?.(normalizeText(source.item_class) || "rest");
    if (fields.status) fields.status.value = normalizeText(source.status) || "offen";
    LOCATION_KEYS.forEach((key) => { if (fields[key]) fields[key].value = normalizeText(source[key]); });
    if (fields.short_text) fields.short_text.value = normalizeText(source.short_text);
    if (fields.long_text) fields.long_text.value = normalizeText(source.long_text);
    if (fields.due_date) fields.due_date.value = normalizeText(source.due_date);
    this.setProjectFirms(this.projectFirms);
    this.lastSavedDraftKey = this._draftKeyFor(this.getDraft());
    this.pendingDraftKey = "";
    this.lastRequestedDraftKey = "";
    this.isApplyingItem = false;
  }

  getDraft() {
    const fields = this.fields || {};
    const selectedFirmId = normalizeText(fields.responsible_project_firm_id?.value);
    const selectedFirm = this.projectFirms.find((entry) => entry.id === selectedFirmId) || null;
    const oldLabel = normalizeText(this.currentItem?.responsible_label);
    let responsibleProjectFirmId = null;
    let responsibleLabel = oldLabel;
    if (selectedFirmId && selectedFirm) { responsibleProjectFirmId = selectedFirm.id; responsibleLabel = selectedFirm.name; }
    return { item_class: normalizeText(fields.item_class?.value) || "rest", status: normalizeText(fields.status?.value) || "offen", location_level_1: normalizeText(fields.location_level_1?.value), location_level_2: normalizeText(fields.location_level_2?.value), location_level_3: normalizeText(fields.location_level_3?.value), location_level_4: normalizeText(fields.location_level_4?.value), short_text: normalizeText(fields.short_text?.value), long_text: normalizeText(fields.long_text?.value), due_date: normalizeText(fields.due_date?.value), responsible_project_firm_id: responsibleProjectFirmId, responsible_label: responsibleLabel };
  }
}
