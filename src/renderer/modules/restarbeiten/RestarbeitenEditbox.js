import { resolveLocationLabels } from "./RestarbeitenFilterbar.js";

function createEl(tag, { className = "", text = "", uiId = "" } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  if (uiId) el.setAttribute("data-ui-editor-id", uiId);
  return el;
}

function createField({
  label,
  value = "",
  type = "input",
  options = [],
  uiId,
  onInput,
  onCommit,
  required = false,
} = {}) {
  const wrap = createEl("label", { className: "bbm-restarbeiten-field", uiId });
  wrap.appendChild(createEl("span", { text: label }));
  const input = document.createElement(type === "textarea" ? "textarea" : type === "select" ? "select" : "input");
  if (type === "date") input.type = "date";
  if (required) input.required = true;
  if (type === "select") {
    for (const option of options) {
      const opt = document.createElement("option");
      opt.value = String(option.value ?? "");
      opt.textContent = String(option.label ?? option.value ?? "");
      input.appendChild(opt);
    }
  }
  input.value = value ?? "";
  if (type === "select" || type === "date") {
    input.addEventListener("change", () => {
      onInput?.(input.value);
      onCommit?.(input.value);
    });
  } else {
    input.addEventListener("input", () => onInput?.(input.value));
    input.addEventListener("blur", () => onCommit?.(input.value));
  }
  wrap.appendChild(input);
  return wrap;
}

function createDictationIcon(state) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("data-bbm-dictation-icon", state);

  const makePath = (d, attrs = {}) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", attrs.stroke || "currentColor");
    path.setAttribute("stroke-width", attrs.strokeWidth || "1.8");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
  };

  if (state === "recording") {
    makePath("M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0V5Z", { stroke: "#1d4ed8" });
    makePath("M6.5 9v2a5.5 5.5 0 0 0 11 0V9", { stroke: "#1d4ed8" });
    makePath("M12 16.5V20", { stroke: "#1d4ed8" });
    makePath("M9 20h6", { stroke: "#1d4ed8" });
    makePath("M5 6c-1.5 1.5-2.2 3.2-2.2 5s.7 3.5 2.2 5", { stroke: "#1d4ed8" });
    makePath("M19 6c1.5 1.5 2.2 3.2 2.2 5s-.7 3.5-2.2 5", { stroke: "#1d4ed8" });
  } else {
    makePath("M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-.5 1.7", { stroke: "#b42318" });
    makePath("M9.5 13.4A3 3 0 0 1 9 11V5", { stroke: "#b42318" });
    makePath("M6.5 9v2a5.5 5.5 0 0 0 8.4 4.7", { stroke: "#b42318" });
    makePath("M12 16.5V20", { stroke: "#b42318" });
    makePath("M9 20h6", { stroke: "#b42318" });
    makePath("M4 4l16 16", { stroke: "#b42318", strokeWidth: "2.2" });
  }

  return svg;
}

function createDictationButton(uiId) {
  const dictation = createEl("button", {
    className: "bbm-restarbeiten-icon-button bbm-restarbeiten-dictation-button",
    uiId,
  });
  dictation.type = "button";
  dictation.disabled = true;
  dictation.title = "Diktat wird später angebunden";
  dictation.setAttribute("aria-label", "Diktat");
  dictation.setAttribute("data-bbm-dictation-state", "stop");
  const stopIcon = createDictationIcon("stop");
  const recordingIcon = createDictationIcon("recording");
  recordingIcon.setAttribute("hidden", "true");
  dictation.append(stopIcon, recordingIcon);
  return dictation;
}

function createTextField({ label, value, uiId, dictationUiId, onInput, onCommit, required = false }) {
  const wrap = createEl("div", { className: "bbm-restarbeiten-text-field", uiId });
  const field = createEl("label", { className: "bbm-restarbeiten-field bbm-restarbeiten-text-label" });
  const labelRow = createEl("span", { className: "bbm-restarbeiten-text-label__row" });
  labelRow.append(createEl("span", { text: label }), createDictationButton(dictationUiId));
  const input = document.createElement("textarea");
  if (required) input.required = true;
  input.value = value ?? "";
  input.addEventListener("input", () => onInput?.(input.value));
  input.addEventListener("blur", () => onCommit?.(input.value));
  field.append(labelRow, input);
  wrap.appendChild(field);
  return wrap;
}

function createClassToggle({ value = "rest", uiId, onChange, onCommit } = {}) {
  const wrap = createEl("div", { className: "bbm-restarbeiten-field bbm-restarbeiten-class-field", uiId });
  wrap.appendChild(createEl("span", { text: "Klasse" }));
  const classToggle = createEl("div", { className: "bbm-restarbeiten-class-toggle" });
  for (const option of [
    { value: "rest", label: "Rest" },
    { value: "mangel", label: "Mangel" },
  ]) {
    const btn = createEl("button", { className: "bbm-restarbeiten-word-switch", text: option.label });
    btn.type = "button";
    btn.value = option.value;
    btn.setAttribute("aria-pressed", String(value === option.value));
    btn.addEventListener("click", () => {
      onChange?.(option.value);
      onCommit?.(option.value);
    });
    classToggle.appendChild(btn);
  }
  wrap.appendChild(classToggle);
  return wrap;
}

export function buildRestarbeitenEditbox({
  settings = {},
  draft = {},
  responsibleOptions = [],
  onDraftChange,
  onNew,
  onDelete,
  onNote,
  onAutoSave,
} = {}) {
  const labels = resolveLocationLabels(settings);
  const canSave = Boolean(String(draft.short_text || "").trim());
  const currentRecordLabel = draft.id ? `Nr.: ${draft.running_number || "?"} in Bearbeitung` : "Nr.: neu in Bearbeitung";
  let validation = null;
  const root = createEl("section", {
    className: "bbm-restarbeiten-editbox",
    uiId: "restarbeiten.editbox",
  });

  const header = createEl("div", {
    className: "bbm-restarbeiten-editbox__header",
    uiId: "restarbeiten.editbox.header",
  });
  const currentRecord = createEl("div", {
    className: "bbm-restarbeiten-editbox__current-record",
    text: currentRecordLabel,
    uiId: "restarbeiten.editbox.header.currentRecord",
  });
  const actions = createEl("div", {
    className: "bbm-restarbeiten-editbox__actions",
  });
  const newBtn = createEl("button", {
    className: "bbm-restarbeiten-button",
    text: "Neu",
    uiId: "restarbeiten.editbox.action.new",
  });
  newBtn.type = "button";
  newBtn.addEventListener("click", () => onNew?.());
  const deleteBtn = createEl("button", {
    className: "bbm-restarbeiten-button",
    text: "Löschen",
    uiId: "restarbeiten.editbox.action.delete",
  });
  deleteBtn.type = "button";
  deleteBtn.disabled = !draft.id;
  deleteBtn.addEventListener("click", () => {
    if (draft.id) onDelete?.();
  });
  actions.append(newBtn, deleteBtn);
  header.append(currentRecord, actions);

  const textArea = createEl("div", {
    className: "bbm-restarbeiten-text-area",
  });
  textArea.append(
    createTextField({
      label: "Kurztext / Gegenstand",
      value: draft.short_text || "",
      uiId: "restarbeiten.editbox.text.short",
      dictationUiId: "restarbeiten.editbox.text.short.dictation",
      required: true,
      onInput: (short_text) => {
        const hasShortText = Boolean(String(short_text || "").trim());
        if (validation) validation.textContent = hasShortText ? "" : "Kurztext erforderlich";
        onDraftChange?.({ short_text }, { render: false });
      },
      onCommit: () => onAutoSave?.(),
    }),
    createTextField({
      label: "Langtext / Beschreibung",
      value: draft.long_text || "",
      uiId: "restarbeiten.editbox.text.long",
      dictationUiId: "restarbeiten.editbox.text.long.dictation",
      onInput: (long_text) => onDraftChange?.({ long_text }, { render: false }),
      onCommit: () => onAutoSave?.(),
    })
  );

  const location = createEl("div", {
    className: "bbm-restarbeiten-edit-group bbm-restarbeiten-edit-group--stack",
    uiId: "restarbeiten.editbox.location",
  });
  labels.forEach((label, index) => {
    const sourceKey = `location_level_${index + 1}`;
    location.appendChild(
      createField({
        label,
        value: draft[sourceKey] || "",
        uiId: `restarbeiten.editbox.location.level${index + 1}`,
        onInput: (value) => onDraftChange?.({ [sourceKey]: value }, { render: false }),
        onCommit: () => onAutoSave?.(),
      })
    );
  });

  const meta = createEl("div", {
    className: "bbm-restarbeiten-edit-group bbm-restarbeiten-edit-group--stack",
    uiId: "restarbeiten.editbox.meta",
  });
  meta.append(
    createClassToggle({
      value: draft.item_class || "rest",
      uiId: "restarbeiten.editbox.meta.itemClass",
      onChange: (item_class) => onDraftChange?.({ item_class }),
      onCommit: () => onAutoSave?.(),
    }),
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
      onCommit: () => onAutoSave?.(),
    }),
    createField({
      label: "Fertig bis",
      value: draft.due_date || "",
      type: "date",
      uiId: "restarbeiten.editbox.meta.dueDate",
      onInput: (due_date) => onDraftChange?.({ due_date }),
      onCommit: () => onAutoSave?.(),
    }),
    createField({
      label: "Verantwortlich",
      value: draft.responsible_project_firm_id || "",
      type: "select",
      options: [{ value: "", label: "Nicht zugeordnet" }, ...responsibleOptions],
      uiId: "restarbeiten.editbox.meta.responsible",
      onInput: (responsible_project_firm_id) => {
        const selected = responsibleOptions.find((item) => String(item.value) === String(responsible_project_firm_id));
        onDraftChange?.({
          responsible_project_firm_id,
          responsible_label: responsible_project_firm_id ? selected?.label || "" : "",
        });
      },
      onCommit: () => onAutoSave?.(),
    })
  );
  validation = createEl("span", {
    className: "bbm-restarbeiten-validation",
    text: canSave ? "" : "Kurztext erforderlich",
    uiId: "restarbeiten.editbox.validation.shortText",
  });
  meta.appendChild(validation);
  const ampelWrap = createEl("span", {
    className: "bbm-restarbeiten-ampel-field",
    uiId: "restarbeiten.editbox.meta.ampel",
  });
  const ampel = createEl("span", {
    className: "bbm-restarbeiten-ampel",
  });
  ampel.dataset.state = draft.ampelState || "neutral";
  ampelWrap.appendChild(ampel);
  meta.appendChild(ampelWrap);
  const noteBtn = createEl("button", {
    className: "bbm-restarbeiten-button bbm-restarbeiten-note",
    text: "Notiz",
    uiId: "restarbeiten.editbox.meta.noteButton",
  });
  noteBtn.type = "button";
  noteBtn.disabled = !draft.id;
  noteBtn.title = draft.id ? "Notizen öffnen" : "Notiz erst nach dem Speichern möglich";
  noteBtn.addEventListener("click", () => {
    if (draft.id) onNote?.();
  });
  meta.appendChild(noteBtn);

  root.append(header, textArea, location, meta);
  return root;
}
