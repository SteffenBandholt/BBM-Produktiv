import { resolveLocationLabels } from "./RestarbeitenFilterbar.js";
import {
  RESTARBEITEN_STATUS_OPTIONS,
  getMissingRestarbeitRequiredFields,
  getRestarbeitRequiredFieldSummary,
  normalizeRestarbeitStatus,
} from "./domain/restarbeitenRules.js";
import { registerM80Ref } from "../../ui-editor/m80Refs.js";

function createEl(tag, { className = "", text = "", uiId = "" } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  if (uiId) el.setAttribute("data-ui-editor-id", uiId);
  return el;
}

function createField({
  label,
  labelUiId,
  value = "",
  type = "input",
  options = [],
  uiId,
  onInput,
  onCommit,
  required = false,
  editorGroupId,
  editorLabelId,
  editorFieldId,
} = {}) {
  const wrap = createEl("label", { className: "bbm-restarbeiten-field", uiId });
  const labelElement = createEl("span", { text: label, uiId: labelUiId });
  wrap.appendChild(labelElement);
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
  if (editorGroupId) registerM80Ref(editorGroupId, wrap);
  if (editorLabelId) registerM80Ref(editorLabelId, labelElement);
  if (editorFieldId) registerM80Ref(editorFieldId, input);
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

  if (state === "ready") {
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
  dictation.setAttribute("data-bbm-dictation-state", "ready");
  const readyIcon = createDictationIcon("ready");
  const recordingIcon = createDictationIcon("recording");
  dictation.append(readyIcon, recordingIcon);
  return dictation;
}

function createNoteIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("data-bbm-note-icon", "edit");

  const makePath = (d) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.8");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
  };

  makePath("M4 20h4.5L19 9.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20Z");
  makePath("M14.5 8 16 9.5");
  makePath("M13 20h7");
  return svg;
}

function createTextField({
  label,
  labelUiId,
  value,
  uiId,
  inputUiId,
  dictationUiId,
  remainingUiId,
  onInput,
  onCommit,
  required = false,
  multiline = true,
  maxLength,
  labelControls = [],
  editorGroupId,
  editorLabelId,
  editorFieldId,
}) {
  const wrap = createEl("div", { className: "bbm-restarbeiten-text-field", uiId });
  const labelRow = createEl("div", { className: "bbm-restarbeiten-text-label__row" });
  const input = document.createElement(multiline ? "textarea" : "input");
  if (inputUiId) input.setAttribute("data-ui-editor-id", inputUiId);
  const remaining = createEl("span", {
    className: "bbm-restarbeiten-remaining",
    uiId: remainingUiId,
  });
  const labelElement = createEl("span", { text: label, uiId: labelUiId });
  const dictation = createDictationButton(dictationUiId);
  const updateRemaining = () => {
    if (typeof maxLength !== "number") return;
    const left = Math.max(0, maxLength - String(input.value || "").length);
    remaining.textContent = String(left);
  };
  if (required) input.required = true;
  if (typeof maxLength === "number") {
    input.maxLength = maxLength;
    input.setAttribute("maxlength", String(maxLength));
    updateRemaining();
  }
  input.value = value ?? "";
  updateRemaining();
  input.addEventListener("input", () => {
    updateRemaining();
    onInput?.(input.value);
  });
  input.addEventListener("blur", () => onCommit?.(input.value));
  labelRow.append(labelElement, remaining, dictation, ...labelControls);
  wrap.append(labelRow, input);
  registerM80Ref(editorGroupId, wrap);
  registerM80Ref(editorLabelId, labelElement);
  registerM80Ref(editorFieldId, input);
  registerM80Ref(`${editorGroupId}.remaining`, remaining);
  registerM80Ref(`${editorGroupId}.dictation`, dictation);
  return wrap;
}

function createClassToggle({ value = "rest", uiId, labelUiId, onChange, onCommit, inline = false } = {}) {
  const wrap = createEl("div", {
    className: inline
      ? "bbm-restarbeiten-class-field bbm-restarbeiten-class-field--inline"
      : "bbm-restarbeiten-field bbm-restarbeiten-class-field",
    uiId,
  });
  const labelElement = createEl("span", { text: "Klasse", uiId: labelUiId });
  if (!inline || labelUiId) wrap.appendChild(labelElement);
  const classToggle = createEl("div", { className: "bbm-restarbeiten-class-toggle" });
  for (const option of [
    { value: "rest", label: "Rest", editorId: "restarbeiten.edit.class.rest" },
    { value: "mangel", label: "Mangel", editorId: "restarbeiten.edit.class.defect" },
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
    registerM80Ref(option.editorId, btn);
  }
  wrap.appendChild(classToggle);
  registerM80Ref("restarbeiten.edit.class", wrap);
  registerM80Ref("restarbeiten.edit.class.label", labelElement);
  registerM80Ref("restarbeiten.edit.class.control", classToggle);
  return wrap;
}

function getValidationText(draft = {}) {
  const hasShortText = Boolean(String(draft.short_text || "").trim());
  if (hasShortText || draft.id) return getRestarbeitRequiredFieldSummary(draft);
  return "Kurztext erforderlich";
}

export function buildRestarbeitenEditbox({
  settings = {},
  draft = {},
  showAmpel = true,
  responsibleOptions = [],
  onDraftChange,
  onNew,
  onDelete,
  onNote,
  onAutoSave,
} = {}) {
  const labels = resolveLocationLabels(settings);
  const missingRequiredFields = getMissingRestarbeitRequiredFields(draft);
  const validationText = getValidationText(draft);
  const normalizedStatus = normalizeRestarbeitStatus(draft.status) || "";
  const currentRecordLabel = draft.id ? `Nr.: ${draft.running_number || "?"} in Bearbeitung` : "Nr.: neu in Bearbeitung";
  let validation = null;
  const root = createEl("section", {
    className: "bbm-restarbeiten-editbox",
    uiId: "restarbeiten.editbox",
  });
  const area = createEl("div", { className: "bbm-restarbeiten-editbox__editor-area" });
  registerM80Ref("restarbeiten.edit.root", root);
  registerM80Ref("restarbeiten.edit.area", area);
  root.dataset.fachlichVollstaendig = String(missingRequiredFields.length === 0);

  const header = createEl("div", {
    className: "bbm-restarbeiten-editbox__header",
    uiId: "restarbeiten.editbox.header",
  });
  const currentRecord = createEl("div", {
    className: "bbm-restarbeiten-editbox__current-record",
    text: currentRecordLabel,
    uiId: "restarbeiten.editbox.header.currentRecord",
  });
  const actions = createEl("span", {
    className: "bbm-restarbeiten-editbox__actions bbm-restarbeiten-editbox__actions--inline",
  });
  const newBtn = createEl("button", {
    className: "bbm-restarbeiten-button",
    text: "Neu",
    uiId: "restarbeiten.editbox.action.new",
  });
  registerM80Ref("restarbeiten.edit.action.new", newBtn);
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
  header.append(currentRecord);
  registerM80Ref("restarbeiten.edit.header", header);
  registerM80Ref("restarbeiten.edit.header.current", currentRecord);
  registerM80Ref("restarbeiten.edit.short.actions", actions);
  registerM80Ref("restarbeiten.edit.action.delete", deleteBtn);

  const classToggle = createClassToggle({
    value: draft.item_class || "rest",
    uiId: "restarbeiten.editbox.meta.itemClass",
    labelUiId: "restarbeiten.editbox.meta.itemClass.label",
    inline: true,
    onChange: (item_class) => onDraftChange?.({ item_class }),
    onCommit: () => onAutoSave?.(),
  });

  const textArea = createEl("div", {
    className: "bbm-restarbeiten-text-area",
  });
  registerM80Ref("restarbeiten.edit.fields", textArea);
  textArea.append(
    createTextField({
      label: "Kurztext / Gegenstand",
      labelUiId: "restarbeiten.editbox.text.short.label",
      value: draft.short_text || "",
      uiId: "restarbeiten.editbox.text.short",
      inputUiId: "restarbeiten.editbox.text.short.input",
      dictationUiId: "restarbeiten.editbox.text.short.dictation",
      remainingUiId: "restarbeiten.editbox.text.short.remaining",
      required: true,
      multiline: false,
      maxLength: 87,
      labelControls: [classToggle, actions],
      editorGroupId: "restarbeiten.edit.short",
      editorLabelId: "restarbeiten.edit.short.label",
      editorFieldId: "restarbeiten.edit.short.field",
      onInput: (short_text) => {
        if (validation) {
          validation.textContent = getValidationText({ ...draft, short_text });
        }
        onDraftChange?.({ short_text }, { render: false });
      },
      onCommit: () => onAutoSave?.(),
    }),
    createTextField({
      label: "Langtext / Beschreibung",
      labelUiId: "restarbeiten.editbox.text.long.label",
      value: draft.long_text || "",
      uiId: "restarbeiten.editbox.text.long",
      inputUiId: "restarbeiten.editbox.text.long.input",
      dictationUiId: "restarbeiten.editbox.text.long.dictation",
      remainingUiId: "restarbeiten.editbox.text.long.remaining",
      maxLength: 400,
      editorGroupId: "restarbeiten.edit.long",
      editorLabelId: "restarbeiten.edit.long.label",
      editorFieldId: "restarbeiten.edit.long.field",
      onInput: (long_text) => onDraftChange?.({ long_text }, { render: false }),
      onCommit: () => onAutoSave?.(),
    })
  );

  const location = createEl("div", {
    className: "bbm-restarbeiten-edit-group bbm-restarbeiten-edit-group--stack",
    uiId: "restarbeiten.editbox.location",
  });
  registerM80Ref("restarbeiten.edit.location", location);
  labels.forEach((label, index) => {
    const sourceKey = `location_level_${index + 1}`;
    location.appendChild(
      createField({
        label,
        labelUiId: `restarbeiten.editbox.location.level${index + 1}.label`,
        value: draft[sourceKey] || "",
        uiId: `restarbeiten.editbox.location.level${index + 1}`,
        editorGroupId: `restarbeiten.edit.location.${index + 1}`,
        editorLabelId: `restarbeiten.edit.location.${index + 1}.label`,
        editorFieldId: `restarbeiten.edit.location.${index + 1}.field`,
        onInput: (value) => onDraftChange?.({ [sourceKey]: value }, { render: false }),
        onCommit: () => onAutoSave?.(),
      })
    );
  });

  const meta = createEl("div", {
    className: "bbm-restarbeiten-edit-group bbm-restarbeiten-edit-group--stack",
    uiId: "restarbeiten.editbox.meta",
  });
  registerM80Ref("restarbeiten.edit.meta", meta);
  const ampelWrap = createEl("span", {
    className: "bbm-restarbeiten-ampel-field",
    uiId: "restarbeiten.editbox.meta.ampel",
  });
  ampelWrap.hidden = showAmpel === false;
  ampelWrap.style.display = showAmpel === false ? "none" : "";
  registerM80Ref("restarbeiten.edit.meta.ampel", ampelWrap);
  const ampel = createEl("span", {
    className: "bbm-restarbeiten-ampel",
  });
  ampel.dataset.state = draft.ampelState || "neutral";
  ampelWrap.appendChild(ampel);
  const dueDateField = createField({
    label: "Fertig bis",
    labelUiId: "restarbeiten.editbox.meta.dueDate.label",
    value: draft.due_date || "",
    type: "date",
    uiId: "restarbeiten.editbox.meta.dueDate",
    editorGroupId: "restarbeiten.edit.meta.due",
    editorLabelId: "restarbeiten.edit.meta.due.label",
    editorFieldId: "restarbeiten.edit.meta.due.field",
    onInput: (due_date) => onDraftChange?.({ due_date }),
    onCommit: () => onAutoSave?.(),
  });
  meta.append(
    createField({
      label: "Status",
      labelUiId: "restarbeiten.editbox.meta.status.label",
      value: normalizedStatus,
      type: "select",
      options: normalizedStatus
        ? RESTARBEITEN_STATUS_OPTIONS
        : [{ value: "", label: "Status ungueltig" }, ...RESTARBEITEN_STATUS_OPTIONS],
      uiId: "restarbeiten.editbox.meta.status",
      editorGroupId: "restarbeiten.edit.meta.status",
      editorLabelId: "restarbeiten.edit.meta.status.label",
      editorFieldId: "restarbeiten.edit.meta.status.field",
      onInput: (status) => onDraftChange?.({ status }),
      onCommit: () => onAutoSave?.(),
    }),
    dueDateField,
    ampelWrap,
    createField({
      label: "Verantwortlich",
      labelUiId: "restarbeiten.editbox.meta.responsible.label",
      value: draft.responsible_project_firm_id || "",
      type: "select",
      options: [{ value: "", label: "Nicht zugeordnet" }, ...responsibleOptions],
      uiId: "restarbeiten.editbox.meta.responsible",
      editorGroupId: "restarbeiten.edit.meta.responsible",
      editorLabelId: "restarbeiten.edit.meta.responsible.label",
      editorFieldId: "restarbeiten.edit.meta.responsible.field",
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
    text: validationText,
    uiId: "restarbeiten.editbox.validation.shortText",
  });
  registerM80Ref("restarbeiten.edit.validation", validation);
  meta.appendChild(validation);
  const noteBtn = createEl("button", {
    className: "bbm-restarbeiten-button bbm-restarbeiten-note",
    uiId: "restarbeiten.editbox.meta.noteButton",
  });
  noteBtn.type = "button";
  noteBtn.disabled = !draft.id;
  noteBtn.title = "Notiz";
  noteBtn.setAttribute("aria-label", "Notiz");
  noteBtn.appendChild(createNoteIcon());
  noteBtn.addEventListener("click", () => {
    if (draft.id) onNote?.();
  });
  registerM80Ref("restarbeiten.edit.action.note", noteBtn);
  meta.appendChild(noteBtn);

  area.append(header, textArea, location, meta);
  root.appendChild(area);
  return root;
}
