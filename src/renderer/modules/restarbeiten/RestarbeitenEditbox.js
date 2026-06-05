import { resolveLocationLabels } from "./RestarbeitenFilterbar.js";

function createEl(tag, { className = "", text = "", uiId = "" } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  if (uiId) el.setAttribute("data-ui-editor-id", uiId);
  return el;
}

function createField({ label, value = "", type = "input", options = [], uiId, onInput }) {
  const wrap = createEl("label", { className: "bbm-restarbeiten-field", uiId });
  wrap.appendChild(createEl("span", { text: label }));
  const input = document.createElement(type === "textarea" ? "textarea" : type === "select" ? "select" : "input");
  if (type === "date") input.type = "date";
  if (type === "select") {
    for (const option of options) {
      const opt = document.createElement("option");
      opt.value = String(option.value ?? "");
      opt.textContent = String(option.label ?? option.value ?? "");
      input.appendChild(opt);
    }
  }
  input.value = value ?? "";
  input.addEventListener("input", () => onInput?.(input.value));
  input.addEventListener("change", () => onInput?.(input.value));
  wrap.appendChild(input);
  return wrap;
}

function createTextField({ label, value, uiId, dictationUiId, onInput }) {
  const wrap = createEl("div", { className: "bbm-restarbeiten-text-field", uiId });
  wrap.appendChild(createField({ label, value, type: "textarea", onInput }));
  const dictation = createEl("button", {
    className: "bbm-restarbeiten-icon-button",
    text: "Diktat",
    uiId: dictationUiId,
  });
  dictation.type = "button";
  dictation.disabled = true;
  dictation.title = "Diktat wird in M2 angebunden";
  wrap.appendChild(dictation);
  return wrap;
}

export function buildRestarbeitenEditbox({
  settings = {},
  draft = {},
  responsibleOptions = [],
  onDraftChange,
  onSave,
  onDelete,
} = {}) {
  const labels = resolveLocationLabels(settings);
  const root = createEl("section", {
    className: "bbm-restarbeiten-editbox",
    uiId: "restarbeiten.editbox",
  });

  const header = createEl("div", {
    className: "bbm-restarbeiten-editbox__header",
    uiId: "restarbeiten.editbox.header",
  });
  const saveBtn = createEl("button", {
    className: "bbm-restarbeiten-button",
    text: "Speichern",
    uiId: "restarbeiten.editbox.action.save",
  });
  saveBtn.type = "button";
  saveBtn.addEventListener("click", () => onSave?.());
  const deleteBtn = createEl("button", {
    className: "bbm-restarbeiten-button",
    text: "Datensatz löschen",
    uiId: "restarbeiten.editbox.action.delete",
  });
  deleteBtn.type = "button";
  deleteBtn.disabled = !draft.id;
  deleteBtn.addEventListener("click", () => onDelete?.());
  header.append(saveBtn, deleteBtn);

  const textArea = createEl("div", {
    className: "bbm-restarbeiten-text-area",
  });
  textArea.append(
    createTextField({
      label: "Kurztext / Gegenstand",
      value: draft.short_text || "",
      uiId: "restarbeiten.editbox.text.short",
      dictationUiId: "restarbeiten.editbox.text.short.dictation",
      onInput: (short_text) => onDraftChange?.({ short_text }),
    }),
    createTextField({
      label: "Langtext / Beschreibung",
      value: draft.long_text || "",
      uiId: "restarbeiten.editbox.text.long",
      dictationUiId: "restarbeiten.editbox.text.long.dictation",
      onInput: (long_text) => onDraftChange?.({ long_text }),
    })
  );

  const location = createEl("div", {
    className: "bbm-restarbeiten-edit-group",
    uiId: "restarbeiten.editbox.location",
  });
  location.appendChild(createEl("p", { className: "bbm-restarbeiten-edit-group__title", text: "Verortung" }));
  labels.forEach((label, index) => {
    const sourceKey = `location_level_${index + 1}`;
    location.appendChild(
      createField({
        label,
        value: draft[sourceKey] || "",
        uiId: `restarbeiten.editbox.location.level${index + 1}`,
        onInput: (value) => onDraftChange?.({ [sourceKey]: value }),
      })
    );
  });

  const meta = createEl("div", {
    className: "bbm-restarbeiten-edit-group",
    uiId: "restarbeiten.editbox.meta",
  });
  meta.appendChild(createEl("p", { className: "bbm-restarbeiten-edit-group__title", text: "Meta" }));
  meta.append(
    createField({
      label: "Status",
      value: draft.status === "in_arbeit" ? "in arbeit" : draft.status || "offen",
      type: "select",
      options: [
        { value: "offen", label: "Offen" },
        { value: "in arbeit", label: "In Arbeit" },
        { value: "erledigt", label: "Erledigt" },
        { value: "verzug", label: "Verzug" },
      ],
      uiId: "restarbeiten.editbox.meta.status",
      onInput: (status) => onDraftChange?.({ status }),
    }),
    createField({
      label: "Fertig bis",
      value: draft.due_date || "",
      type: "date",
      uiId: "restarbeiten.editbox.meta.dueDate",
      onInput: (due_date) => onDraftChange?.({ due_date }),
    }),
    createField({
      label: "Verantwortlich",
      value: draft.responsible_project_firm_id || "",
      type: "select",
      options: [{ value: "", label: draft.responsible_label || "Nicht zugeordnet" }, ...responsibleOptions],
      uiId: "restarbeiten.editbox.meta.responsible",
      onInput: (responsible_project_firm_id) => {
        const selected = responsibleOptions.find((item) => String(item.value) === String(responsible_project_firm_id));
        onDraftChange?.({
          responsible_project_firm_id,
          responsible_label: responsible_project_firm_id ? selected?.label || "" : "",
        });
      },
    })
  );
  const ampel = createEl("span", {
    className: "bbm-restarbeiten-ampel",
    uiId: "restarbeiten.editbox.meta.ampel",
  });
  ampel.dataset.state = draft.ampelState || "neutral";
  meta.appendChild(ampel);
  const noteBtn = createEl("button", {
    className: "bbm-restarbeiten-button bbm-restarbeiten-note",
    text: "Notiz",
    uiId: "restarbeiten.editbox.meta.noteButton",
  });
  noteBtn.type = "button";
  noteBtn.disabled = true;
  noteBtn.title = "Notiz-Popup folgt in M2";
  meta.appendChild(noteBtn);

  root.append(header, textArea, location, meta);
  return root;
}
