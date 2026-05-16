import RestarbeitenAttachmentsView from "./RestarbeitenAttachmentsView.js";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function createField(doc, labelText, control) {
  const wrap = doc.createElement("label");
  wrap.style.display = "grid";
  wrap.style.gap = "6px";

  const label = doc.createElement("div");
  label.textContent = labelText;
  label.style.fontSize = "12px";
  label.style.fontWeight = "700";

  wrap.append(label, control);
  return wrap;
}

function createSelect(doc, options) {
  const select = doc.createElement("select");
  select.style.minHeight = "34px";
  select.style.padding = "6px 8px";
  select.style.borderRadius = "8px";
  select.style.border = "1px solid var(--card-border, #cfcfcf)";
  select.style.background = "var(--card-bg, #fff)";

  for (const option of options) {
    const opt = doc.createElement("option");
    opt.value = String(option.value ?? "");
    opt.textContent = String(option.label ?? "");
    select.appendChild(opt);
  }

  return select;
}

function createInput(doc, type = "text") {
  const input = doc.createElement(type === "textarea" ? "textarea" : "input");
  if (type !== "textarea") input.type = type;
  input.style.minHeight = "34px";
  input.style.padding = "6px 8px";
  input.style.borderRadius = "8px";
  input.style.border = "1px solid var(--card-border, #cfcfcf)";
  input.style.background = "var(--card-bg, #fff)";
  return input;
}

function normalizeFirmEntries(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((firm) => {
      const id = normalizeText(firm?.id);
      if (!id) return null;
      return { id, name: normalizeText(firm?.name) };
    })
    .filter(Boolean);
}

export default class RestarbeitenEditbox {
  constructor({ documentRef = globalThis.document, onSave = null, onSetPrimaryAttachment = null, onImportAttachments = null } = {}) {
    this.document = documentRef || globalThis.document;
    this.onSave = typeof onSave === "function" ? onSave : null;
    this.root = null;
    this.form = null;
    this.saveBtn = null;
    this.statusEl = null;
    this.currentItem = null;
    this.projectFirms = [];
    this.fields = {};
    this.attachments = [];
    this.attachmentsView = null;
    this.onSetPrimaryAttachment = typeof onSetPrimaryAttachment === "function" ? onSetPrimaryAttachment : null;
    this.onImportAttachments = typeof onImportAttachments === "function" ? onImportAttachments : null;
  }

  render() {
    const doc = this.document;
    const root = doc.createElement("section");
    root.style.display = "grid";
    root.style.gap = "10px";
    root.style.padding = "12px";
    root.style.border = "1px solid var(--card-border, #cfcfcf)";
    root.style.borderRadius = "12px";
    root.style.background = "var(--card-bg, #fff)";

    const title = doc.createElement("h3");
    title.textContent = "Editbox";
    title.style.margin = "0";

    const subtitle = doc.createElement("div");
    subtitle.textContent = "Restarbeit bearbeiten";
    subtitle.style.fontSize = "13px";
    subtitle.style.opacity = "0.8";

    const form = doc.createElement("form");
    form.style.display = "grid";
    form.style.gap = "10px";

    const itemClass = createSelect(doc, [
      { value: "rest", label: "Rest" },
      { value: "mangel", label: "Mangel" },
    ]);

    const status = createSelect(doc, [
      { value: "offen", label: "offen" },
      { value: "in_arbeit", label: "in Arbeit" },
      { value: "erledigt_gemeldet", label: "erledigt gemeldet" },
      { value: "geprueft_erledigt", label: "geprueft erledigt" },
      { value: "zurueckgewiesen", label: "zurueckgewiesen" },
    ]);

    const level1 = createInput(doc, "text");
    const level2 = createInput(doc, "text");
    const level3 = createInput(doc, "text");
    const level4 = createInput(doc, "text");
    const shortText = createInput(doc, "text");
    const longText = createInput(doc, "textarea");
    longText.rows = 4;
    const dueDate = createInput(doc, "date");
    const responsibleProjectFirmId = createSelect(doc, [{ value: "", label: "— keine Auswahl —" }]);

    form.append(
      createField(doc, "item_class", itemClass),
      createField(doc, "status", status),
      createField(doc, "location_level_1", level1),
      createField(doc, "location_level_2", level2),
      createField(doc, "location_level_3", level3),
      createField(doc, "location_level_4", level4),
      createField(doc, "short_text", shortText),
      createField(doc, "long_text", longText),
      createField(doc, "due_date", dueDate),
      createField(doc, "responsible_project_firm_id", responsibleProjectFirmId)
    );


    const attachmentsHost = doc.createElement("div");
    attachmentsHost.style.display = "grid";
    attachmentsHost.style.gap = "8px";

    const attachmentsTitle = doc.createElement("div");
    attachmentsTitle.textContent = "Fotos";
    attachmentsTitle.style.fontSize = "12px";
    attachmentsTitle.style.fontWeight = "700";

    this.attachmentsView = new RestarbeitenAttachmentsView({
      documentRef: doc,
      onSetPrimary: (attachmentId) => {
        if (this.onSetPrimaryAttachment) this.onSetPrimaryAttachment(attachmentId);
      },
      onImportAttachments: () => {
        if (this.onImportAttachments) this.onImportAttachments();
      },
    });

    attachmentsHost.append(attachmentsTitle, this.attachmentsView.render());

    const footer = doc.createElement("div");
    footer.style.display = "flex";
    footer.style.alignItems = "center";
    footer.style.gap = "10px";

    const saveBtn = doc.createElement("button");
    saveBtn.type = "submit";
    saveBtn.textContent = "Speichern";
    saveBtn.style.minHeight = "36px";
    saveBtn.style.padding = "8px 14px";
    saveBtn.style.borderRadius = "8px";
    saveBtn.style.border = "1px solid var(--card-border, #cfcfcf)";
    saveBtn.style.fontWeight = "700";

    const statusEl = doc.createElement("div");
    statusEl.style.fontSize = "12px";
    statusEl.style.opacity = "0.8";

    footer.append(saveBtn, statusEl);
    form.append(attachmentsHost, footer);
    root.append(title, subtitle, form);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (this.onSave) {
        await this.onSave(this.getDraft());
      }
    });

    this.root = root;
    this.form = form;
    this.saveBtn = saveBtn;
    this.statusEl = statusEl;
    this.fields = {
      item_class: itemClass,
      status,
      location_level_1: level1,
      location_level_2: level2,
      location_level_3: level3,
      location_level_4: level4,
      short_text: shortText,
      long_text: longText,
      due_date: dueDate,
      responsible_project_firm_id: responsibleProjectFirmId,
    };

    this.setAttachments([]);
    this.setItem(null);
    return root;
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
    select.value = targetId;
    if (targetId && select.value !== targetId) {
      const legacy = this.document.createElement("option");
      legacy.value = targetId;
      legacy.textContent = normalizeText(this.currentItem?.responsible_label) || "(nicht mehr vorhanden)";
      select.appendChild(legacy);
      select.value = targetId;
    }
  }

  setAttachments(attachments) {
    this.attachments = Array.isArray(attachments) ? attachments : [];
    if (this.attachmentsView) this.attachmentsView.setAttachments(this.attachments);
  }

  setStatus(text) {
    if (!this.statusEl) return;
    this.statusEl.textContent = String(text || "");
  }

  setSaving(isSaving) {
    if (!this.saveBtn) return;
    this.saveBtn.disabled = !!isSaving;
  }

  setItem(item) {
    this.currentItem = item || null;
    const source = this.currentItem || {};
    const fields = this.fields || {};

    if (fields.item_class) fields.item_class.value = normalizeText(source.item_class) || "rest";
    if (fields.status) fields.status.value = normalizeText(source.status) || "offen";
    if (fields.location_level_1) fields.location_level_1.value = normalizeText(source.location_level_1);
    if (fields.location_level_2) fields.location_level_2.value = normalizeText(source.location_level_2);
    if (fields.location_level_3) fields.location_level_3.value = normalizeText(source.location_level_3);
    if (fields.location_level_4) fields.location_level_4.value = normalizeText(source.location_level_4);
    if (fields.short_text) fields.short_text.value = normalizeText(source.short_text);
    if (fields.long_text) fields.long_text.value = normalizeText(source.long_text);
    if (fields.due_date) fields.due_date.value = normalizeText(source.due_date);

    this.setProjectFirms(this.projectFirms);
    if (this.root) {
      this.root.dataset.hasItem = this.currentItem ? "1" : "0";
    }
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
    } else if (!selectedFirmId) {
      responsibleProjectFirmId = null;
      responsibleLabel = oldLabel;
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
      responsible_project_firm_id: responsibleProjectFirmId,
      responsible_label: responsibleLabel,
    };
  }
}
