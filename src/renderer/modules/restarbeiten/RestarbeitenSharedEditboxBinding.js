import { SharedEditboxCore } from "../protokoll/SharedEditboxCore.js";
import { resolveLocationLabels } from "./RestarbeitenFilterbar.js";
import {
  RESTARBEITEN_STATUS_OPTIONS,
  getRestarbeitRequiredFieldSummary,
  normalizeRestarbeitStatus,
} from "./domain/restarbeitenRules.js";
import { m80EditorAttributes } from "../../ui-editor/m80Registry.js";
import {
  beginM83ComponentBinding,
  registerM80Ref,
} from "../../ui-editor/m80Refs.js";

const COMPONENT_ID = "bbm.restarbeiten.editbox";

function bindEditorRef(element, id) {
  if (!element || !id) return null;

  for (const [name, value] of Object.entries(m80EditorAttributes(id))) {
    element.setAttribute(name, value);
  }

  registerM80Ref(id, element);
  return element;
}

function bindLegacyUiId(element, id) {
  if (!element || !id) return null;
  element.setAttribute("data-ui-editor-id", id);
  return element;
}

function normalizeLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function text(value) {
  return String(value ?? "").trim();
}

function createButton(doc, label, onClick) {
  const button = doc.createElement("button");
  button.type = "button";
  button.className = "bbm-restarbeiten-button";
  button.textContent = label;
  button.addEventListener("click", () => onClick?.());
  return button;
}

function createField(doc, {
  label,
  type = "input",
  options = [],
  onInput,
  onCommit,
} = {}) {
  const wrapper = doc.createElement("label");
  wrapper.className = "bbm-restarbeiten-field";

  const labelElement = doc.createElement("span");
  labelElement.textContent = label || "";

  let control;
  if (type === "select") {
    control = doc.createElement("select");
    for (const item of options) {
      const option = doc.createElement("option");
      option.value = String(item?.value ?? "");
      option.textContent = String(item?.label ?? item?.value ?? "");
      control.appendChild(option);
    }
  } else {
    control = doc.createElement("input");
    if (type === "date") control.type = "date";
  }

  const eventName = type === "select" || type === "date" ? "change" : "input";

  control.addEventListener(eventName, () => {
    onInput?.(control.value);
    if (type === "select" || type === "date") onCommit?.();
  });

  if (type === "input") {
    control.addEventListener("blur", () => onCommit?.());
  }

  wrapper.append(labelElement, control);

  return {
    wrapper,
    labelElement,
    control,
  };
}

export class RestarbeitenSharedEditboxBinding {
  constructor({
    documentRef = globalThis.document,
    settings = {},
    textLimits = {},
    responsibleOptions = [],
    showAmpel = true,
    onDraftChange = null,
    onTextBlur = null,
    onStartDictation = null,
    onNew = null,
    onDelete = null,
    onNote = null,
    onAutoSave = null,
  } = {}) {
    const doc = documentRef;

    if (!doc?.createElement) {
      throw new Error(
        "RestarbeitenSharedEditboxBinding benötigt ein Document."
      );
    }

    this.documentRef = doc;
    this.settings = settings || {};
    this.responsibleOptions = Array.isArray(responsibleOptions)
      ? responsibleOptions
      : [];
    this.showAmpel = showAmpel !== false;

    this.onDraftChange =
      typeof onDraftChange === "function" ? onDraftChange : null;
    this.onTextBlur =
      typeof onTextBlur === "function" ? onTextBlur : null;
    this.onStartDictation =
      typeof onStartDictation === "function" ? onStartDictation : null;
    this.onNew = typeof onNew === "function" ? onNew : null;
    this.onDelete = typeof onDelete === "function" ? onDelete : null;
    this.onNote = typeof onNote === "function" ? onNote : null;
    this.onAutoSave =
      typeof onAutoSave === "function" ? onAutoSave : null;

    this.draft = {};
    this._syncing = false;

    this.sharedEditboxCore = new SharedEditboxCore({
      documentRef: this.documentRef,
      onStartDictation: (target) => this.onStartDictation?.(target),
      onDraftChange: ({ draft } = {}) => {
        if (this._syncing || !this.onDraftChange) return;

        this.onDraftChange(
          {
            short_text: String(draft?.title ?? ""),
            long_text: String(draft?.longtext ?? ""),
          },
          { render: false }
        );

        this._syncValidation({
          ...this.draft,
          short_text: String(draft?.title ?? ""),
          long_text: String(draft?.longtext ?? ""),
        });
      },

      onTextBlur: ({ field, value } = {}) => {
        if (this.onTextBlur) {
          this.onTextBlur({
            field: field === "shortText" ? "short_text" : "long_text",
            value: String(value ?? ""),
          });
        }
        this.onAutoSave?.();
      },
    });

    this.root = doc.createElement("section");
    this.root.className =
      "bbm-restarbeiten-editbox bbm-restarbeiten-shared-editbox";

    this.area = doc.createElement("div");
    this.area.className = "bbm-restarbeiten-editbox__editor-area";

    this.sharedEditboxCore.root.classList.add(
      "bbm-restarbeiten-shared-editbox-core",
      "bbm-restarbeiten-text-area"
    );

    this.sharedEditboxCore.editbox.shortWrap.classList.add(
      "bbm-restarbeiten-text-field"
    );
    this.sharedEditboxCore.editbox.longWrap.classList.add(
      "bbm-restarbeiten-text-field"
    );

    this.sharedEditboxCore.shortLabelRow?.classList.add(
      "bbm-restarbeiten-text-label__row"
    );
    this.sharedEditboxCore.longLabelRow?.classList.add(
      "bbm-restarbeiten-text-label__row"
    );

    // Restarbeiten benötigt die Protokoll-Flags Wichtig/ToDo/Beschluss nicht.
    this.sharedEditboxCore.editbox.setVisibleFlags([]);
    this.sharedEditboxCore.flagsWrap.hidden = true;

    if (
      this.sharedEditboxCore.shortLabelRow &&
      this.sharedEditboxCore.editbox.shortCounter
    ) {
      this.sharedEditboxCore.shortLabelRow.insertBefore(
        this.sharedEditboxCore.editbox.shortCounter,
        this.sharedEditboxCore.shortDictateButton || null
      );
    }

    if (
      this.sharedEditboxCore.longLabelRow &&
      this.sharedEditboxCore.editbox.longCounter
    ) {
      this.sharedEditboxCore.longLabelRow.insertBefore(
        this.sharedEditboxCore.editbox.longCounter,
        this.sharedEditboxCore.longDictateButton || null
      );
    }



    this.shortDictationIcon = doc.createElement("span");
    this.shortDictationIcon.className =
      "bbm-restarbeiten-shared-dictation-icon";
    this.shortDictationIcon.setAttribute("aria-hidden", "true");
    this.sharedEditboxCore.shortDictateButton.appendChild(
      this.shortDictationIcon
    );

    this.longDictationIcon = doc.createElement("span");
    this.longDictationIcon.className =
      "bbm-restarbeiten-shared-dictation-icon";
    this.longDictationIcon.setAttribute("aria-hidden", "true");
    this.sharedEditboxCore.longDictateButton.appendChild(
      this.longDictationIcon
    );

    const shortLabelText =
      this.sharedEditboxCore.shortLabel.querySelector?.(
        ".bbm-tops-editbox-label-text"
      );
    if (shortLabelText) shortLabelText.textContent = "Kurztext";

    const longLabelText =
      this.sharedEditboxCore.longLabel.querySelector?.(
        ".bbm-tops-editbox-label-text"
      );
    if (longLabelText) longLabelText.textContent = "Langtext";

    this._buildHeader();
    this._buildClassControls();
    this._buildLocationFields();
    this._buildMetaFields();

    this.fieldsHost = this.sharedEditboxCore.editbox.mainCol;
    this.fieldsHost.classList.add("bbm-restarbeiten-text-area");

    this.sharedEditboxCore.editbox.shortCounter.classList.add(
      "bbm-restarbeiten-remaining"
    );
    this.sharedEditboxCore.editbox.longCounter.classList.add(
      "bbm-restarbeiten-remaining"
    );

    this.locationHost = doc.createElement("div");
    this.locationHost.className =
      "bbm-restarbeiten-edit-group bbm-restarbeiten-edit-group--stack";

    this.metaHost = doc.createElement("div");
    this.metaHost.className =
      "bbm-restarbeiten-edit-group bbm-restarbeiten-edit-group--stack";

    for (const field of this.locationFields) {
      this.locationHost.appendChild(field.wrapper);
    }

    this.metaHost.append(
      this.statusField.wrapper,
      this.dueField.wrapper,
      this.ampelWrap,
      this.responsibleField.wrapper,
      this.validation,
      this.noteButton
    );

    this.area.append(
      this.header,
      this.fieldsHost,
      this.locationHost,
      this.metaHost
    );
    this.root.appendChild(this.area);

    // Klasse sowie Neu/Löschen sitzen wie bisher im Kurztext-Kopf.
    this.sharedEditboxCore.shortLabelRow?.append(
      this.classWrap,
      this.actions
    );

    this._registerLegacyUiIds();
    this.setTextLimits(textLimits);
    this.showDraft({});
  }

  _registerLegacyUiIds() {
    bindLegacyUiId(this.root, "restarbeiten.editbox");
    bindLegacyUiId(this.header, "restarbeiten.editbox.header");
    bindLegacyUiId(
      this.currentRecord,
      "restarbeiten.editbox.header.currentRecord"
    );

    bindLegacyUiId(
      this.newButton,
      "restarbeiten.editbox.action.new"
    );
    bindLegacyUiId(
      this.deleteButton,
      "restarbeiten.editbox.action.delete"
    );

    bindLegacyUiId(
      this.sharedEditboxCore.editbox.shortWrap,
      "restarbeiten.editbox.text.short"
    );

    const shortLabelText =
      this.sharedEditboxCore.shortLabel.querySelector?.(
        ".bbm-tops-editbox-label-text"
      ) || this.sharedEditboxCore.shortLabel;

    bindLegacyUiId(
      shortLabelText,
      "restarbeiten.editbox.text.short.label"
    );
    bindLegacyUiId(
      this.sharedEditboxCore.editbox.shortInput,
      "restarbeiten.editbox.text.short.input"
    );
    bindLegacyUiId(
      this.sharedEditboxCore.shortDictateButton,
      "restarbeiten.editbox.text.short.dictation"
    );
    bindLegacyUiId(
      this.sharedEditboxCore.editbox.shortCounter,
      "restarbeiten.editbox.text.short.remaining"
    );

    bindLegacyUiId(
      this.sharedEditboxCore.editbox.longWrap,
      "restarbeiten.editbox.text.long"
    );

    const longLabelText =
      this.sharedEditboxCore.longLabel.querySelector?.(
        ".bbm-tops-editbox-label-text"
      ) || this.sharedEditboxCore.longLabel;

    bindLegacyUiId(
      longLabelText,
      "restarbeiten.editbox.text.long.label"
    );
    bindLegacyUiId(
      this.sharedEditboxCore.editbox.longInput,
      "restarbeiten.editbox.text.long.input"
    );
    bindLegacyUiId(
      this.sharedEditboxCore.longDictateButton,
      "restarbeiten.editbox.text.long.dictation"
    );
    bindLegacyUiId(
      this.sharedEditboxCore.editbox.longCounter,
      "restarbeiten.editbox.text.long.remaining"
    );

    bindLegacyUiId(
      this.classWrap,
      "restarbeiten.editbox.meta.itemClass"
    );
    bindLegacyUiId(
      this.classLabel,
      "restarbeiten.editbox.meta.itemClass.label"
    );

    bindLegacyUiId(
      this.locationHost,
      "restarbeiten.editbox.location"
    );

    this.locationFields.forEach((field, index) => {
      const level = index + 1;
      bindLegacyUiId(
        field.wrapper,
        `restarbeiten.editbox.location.level${level}`
      );
      bindLegacyUiId(
        field.labelElement,
        `restarbeiten.editbox.location.level${level}.label`
      );
    });

    bindLegacyUiId(
      this.metaHost,
      "restarbeiten.editbox.meta"
    );

    bindLegacyUiId(
      this.statusField.wrapper,
      "restarbeiten.editbox.meta.status"
    );
    bindLegacyUiId(
      this.statusField.labelElement,
      "restarbeiten.editbox.meta.status.label"
    );

    bindLegacyUiId(
      this.dueField.wrapper,
      "restarbeiten.editbox.meta.dueDate"
    );
    bindLegacyUiId(
      this.dueField.labelElement,
      "restarbeiten.editbox.meta.dueDate.label"
    );

    bindLegacyUiId(
      this.responsibleField.wrapper,
      "restarbeiten.editbox.meta.responsible"
    );
    bindLegacyUiId(
      this.responsibleField.labelElement,
      "restarbeiten.editbox.meta.responsible.label"
    );

    bindLegacyUiId(
      this.validation,
      "restarbeiten.editbox.validation.shortText"
    );
    bindLegacyUiId(
      this.ampelWrap,
      "restarbeiten.editbox.meta.ampel"
    );
    bindLegacyUiId(
      this.noteButton,
      "restarbeiten.editbox.meta.noteButton"
    );
  }

  _buildHeader() {
    const doc = this.documentRef;

    this.header = doc.createElement("div");
    this.header.className = "bbm-restarbeiten-editbox__header";

    this.currentRecord = doc.createElement("div");
    this.currentRecord.className =
      "bbm-restarbeiten-editbox__current-record";

    this.header.appendChild(this.currentRecord);

    this.actions = doc.createElement("span");
    this.actions.className =
      "bbm-restarbeiten-editbox__actions bbm-restarbeiten-editbox__actions--inline";

    this.newButton = createButton(doc, "Neu", () => this.onNew?.());
    this.deleteButton = createButton(doc, "Löschen", () => {
      if (this.draft?.id) this.onDelete?.();
    });

    this.actions.append(this.newButton, this.deleteButton);
  }

  _buildClassControls() {
    const doc = this.documentRef;

    this.classWrap = doc.createElement("div");
    this.classWrap.className =
      "bbm-restarbeiten-class-field bbm-restarbeiten-class-field--inline";

    this.classLabel = doc.createElement("span");
    this.classLabel.textContent = "Typ";

    this.classControl = doc.createElement("div");
    this.classControl.className = "bbm-restarbeiten-class-toggle";

    this.classButtons = {};

    for (const item of [
      { key: "rest", label: "Rest" },
      { key: "mangel", label: "Mangel" },
    ]) {
      const button = doc.createElement("button");
      button.type = "button";
      button.value = item.key;
      button.className = "bbm-restarbeiten-word-switch";
      button.textContent = item.label;

      button.addEventListener("click", () => {
        if (this._syncing) return;

        this.draft = {
          ...this.draft,
          item_class: item.key,
        };

        this._syncClassButtons();
        this.onDraftChange?.({ item_class: item.key });
        this.onAutoSave?.();
      });

      this.classButtons[item.key] = button;
      this.classControl.appendChild(button);
    }

    this.classWrap.append(this.classLabel, this.classControl);
  }

  _buildLocationFields() {
    const labels = resolveLocationLabels(this.settings);
    this.locationFields = labels.map((label, index) => {
      const sourceKey = `location_level_${index + 1}`;

      const field = createField(this.documentRef, {
        label,
        onInput: (value) => {
          if (this._syncing) return;
          this.draft = { ...this.draft, [sourceKey]: value };
          this.onDraftChange?.({ [sourceKey]: value }, { render: false });
        },
        onCommit: () => this.onAutoSave?.(),
      });

      field.sourceKey = sourceKey;
      return field;
    });
  }

  _buildMetaFields() {
    const doc = this.documentRef;

    this.statusField = createField(doc, {
      label: "Status",
      type: "select",
      options: RESTARBEITEN_STATUS_OPTIONS,
      onInput: (status) => {
        if (this._syncing) return;
        this.draft = { ...this.draft, status };
        this.onDraftChange?.({ status });
        this._syncValidation();
      },
      onCommit: () => this.onAutoSave?.(),
    });

    this.dueField = createField(doc, {
      label: "Fertig bis",
      type: "date",
      onInput: (due_date) => {
        if (this._syncing) return;
        this.draft = { ...this.draft, due_date };
        this.onDraftChange?.({ due_date });
      },
      onCommit: () => this.onAutoSave?.(),
    });

    this.ampelWrap = doc.createElement("span");
    this.ampelWrap.className = "bbm-restarbeiten-ampel-field";
    this.ampelWrap.hidden = !this.showAmpel;
    this.ampelWrap.style.display = this.showAmpel ? "" : "none";

    this.ampel = doc.createElement("span");
    this.ampel.className = "bbm-restarbeiten-ampel";
    this.ampelWrap.appendChild(this.ampel);

    this.responsibleField = createField(doc, {
      label: "Verantwortlich",
      type: "select",
      options: [{ value: "", label: "Nicht zugeordnet" }],
      onInput: (responsibleKey) => {
        if (this._syncing) return;

        const selected = this._visibleResponsibleOptions.find(
          (item) => String(item?.value || "") === String(responsibleKey)
        );

        const ref = responsibleKey ? selected?.ref || null : null;

        const patch = {
          responsible_ref: ref,
          responsible_kind: ref?.kind || "",
          responsible_id: ref?.id || "",
          responsible_project_firm_id:
            ref?.kind === "project_firm" ? ref.id : "",
          responsible_global_firm_id:
            ref?.kind === "global_firm" ? ref.id : "",
          responsible_label:
            responsibleKey ? selected?.label || "" : "",
        };

        this.draft = { ...this.draft, ...patch };
        this.onDraftChange?.(patch);
      },
      onCommit: () => this.onAutoSave?.(),
    });

    this.validation = doc.createElement("span");
    this.validation.className = "bbm-restarbeiten-validation";

    this.noteButton = createButton(doc, "Notiz", () => {
      if (this.draft?.id) this.onNote?.();
    });
    this.noteButton.classList.add("bbm-restarbeiten-note");
  }

  _buildResponsibleOptions(draft = {}) {
    const currentResponsibleKey =
      draft.responsible_kind && draft.responsible_id
        ? `${draft.responsible_kind}:${draft.responsible_id}`
        : draft.responsible_project_firm_id
          ? `project_firm:${draft.responsible_project_firm_id}`
          : "";

    const historicalResponsibleOption =
      currentResponsibleKey &&
      !this.responsibleOptions.some(
        (item) => String(item?.value || "") === currentResponsibleKey
      )
        ? [
            {
              value: currentResponsibleKey,
              label:
                draft.responsible_label || "Historische Zuordnung",
              ref: {
                kind: draft.responsible_kind || "project_firm",
                id:
                  draft.responsible_id ||
                  draft.responsible_project_firm_id,
              },
            },
          ]
        : [];

    this._visibleResponsibleOptions = [
      ...historicalResponsibleOption,
      ...this.responsibleOptions,
    ];

    this.responsibleField.control.replaceChildren();

    const emptyOption = this.documentRef.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Nicht zugeordnet";
    this.responsibleField.control.appendChild(emptyOption);

    for (const item of this._visibleResponsibleOptions) {
      const option = this.documentRef.createElement("option");
      option.value = String(item?.value ?? "");
      option.textContent = String(item?.label ?? item?.value ?? "");
      this.responsibleField.control.appendChild(option);
    }

    return currentResponsibleKey;
  }

  _syncClassButtons() {
    const active =
      text(this.draft?.item_class) === "mangel" ? "mangel" : "rest";

    for (const [key, button] of Object.entries(this.classButtons)) {
      button.setAttribute("aria-pressed", String(key === active));
    }
  }

  _syncValidation(draft = this.draft) {
    if (!this.validation) return;

    const hasShortText = Boolean(text(draft?.short_text));

    this.validation.textContent =
      hasShortText || draft?.id
        ? getRestarbeitRequiredFieldSummary(draft)
        : "Kurztext erforderlich";
  }

  getElement() {
    return this.root;
  }

  setTextLimits(textLimits = {}) {
    const shortLimit = normalizeLimit(
      textLimits.shortText ?? textLimits.short_text,
      120
    );

    const longLimit = normalizeLimit(
      textLimits.longText ?? textLimits.long_text,
      2000
    );

    this.sharedEditboxCore.editbox.shortInput.maxLength = shortLimit;
    this.sharedEditboxCore.editbox.longInput.maxLength = longLimit;

    this.sharedEditboxCore.editbox.shortInput.setAttribute(
      "maxlength",
      String(shortLimit)
    );

    this.sharedEditboxCore.editbox.longInput.setAttribute(
      "maxlength",
      String(longLimit)
    );

    if (typeof this.sharedEditboxCore.editbox._updateCounters === "function") {
      this.sharedEditboxCore.editbox._updateCounters();
    }
  }

  showDraft(draft = {}) {
    this._syncing = true;

    try {
      this.draft = { ...(draft || {}) };

      this.sharedEditboxCore.applyEditorState(
        {
          value: {
            title: String(draft.short_text ?? ""),
            longtext: String(draft.long_text ?? ""),
            status: String(draft.status ?? ""),
            is_important: 0,
            is_hidden: 0,
            is_task: 0,
            is_decision: 0,
          },
          access: {
            shortTextReadOnly: false,
            longTextReadOnly: false,
            flagsDisabled: true,
          },
          level: 1,
        },
        {
          hasSelection: true,
          isReadOnly: false,
        }
      );

      this.currentRecord.textContent = draft.id
        ? `Nr.: ${draft.running_number || "?"} in Bearbeitung`
        : "Nr.: neu in Bearbeitung";

      this.deleteButton.disabled = !draft.id;
      this.noteButton.disabled = !draft.id;

      this._syncClassButtons();

      this.locationFields.forEach((field) => {
        field.control.value = String(draft[field.sourceKey] ?? "");
      });

      const normalizedStatus =
        normalizeRestarbeitStatus(draft.status) || "";

      if (
        normalizedStatus &&
        ![...this.statusField.control.options].some(
          (option) => option.value === normalizedStatus
        )
      ) {
        const option = this.documentRef.createElement("option");
        option.value = normalizedStatus;
        option.textContent = normalizedStatus;
        this.statusField.control.appendChild(option);
      }

      this.statusField.control.value = normalizedStatus;
      this.dueField.control.value = String(draft.due_date ?? "");

      const responsibleKey = this._buildResponsibleOptions(draft);
      this.responsibleField.control.value = responsibleKey;

      this.ampel.dataset.state = draft.ampelState || "neutral";
      this.ampelWrap.hidden = !this.showAmpel;
    this.ampelWrap.style.display = this.showAmpel ? "" : "none";

      this._syncValidation(draft);
    } finally {
      this._syncing = false;
    }
  }

  clear() {
    this.showDraft({
      item_class: "rest",
      short_text: "",
      long_text: "",
      status: "",
      due_date: "",
      ampelState: "neutral",
    });
  }

  getDraftPatch() {
    const textDraft = this.sharedEditboxCore.getDraft();

    return {
      short_text: String(textDraft?.title ?? ""),
      long_text: String(textDraft?.longtext ?? ""),
      item_class:
        text(this.draft?.item_class) === "mangel" ? "mangel" : "rest",
      status: String(this.statusField.control.value ?? ""),
      due_date: String(this.dueField.control.value ?? ""),
      ...Object.fromEntries(
        this.locationFields.map((field) => [
          field.sourceKey,
          String(field.control.value ?? ""),
        ])
      ),
    };
  }

  focusShortText(options = {}) {
    return this.sharedEditboxCore.focusShortText(options);
  }

  registerUiEditorRefs() {
    beginM83ComponentBinding(COMPONENT_ID);

    bindEditorRef(this.root, "restarbeiten.edit.root");
    bindEditorRef(this.area, "restarbeiten.edit.area");
    bindEditorRef(this.header, "restarbeiten.edit.header");
    bindEditorRef(
      this.currentRecord,
      "restarbeiten.edit.header.current"
    );
    bindEditorRef(this.fieldsHost, "restarbeiten.edit.fields");

    bindEditorRef(
      this.sharedEditboxCore.editbox.shortWrap,
      "restarbeiten.edit.short"
    );
    bindEditorRef(
      this.sharedEditboxCore.shortLabel,
      "restarbeiten.edit.short.headerZone"
    );

    const shortLabelText =
      this.sharedEditboxCore.shortLabel.querySelector?.(
        ".bbm-tops-editbox-label-text"
      ) || this.sharedEditboxCore.shortLabel;

    bindEditorRef(shortLabelText, "restarbeiten.edit.short.label");
    bindEditorRef(
      this.sharedEditboxCore.editbox.shortCounter,
      "restarbeiten.edit.short.remaining"
    );
    bindEditorRef(
      this.sharedEditboxCore.shortDictateButton,
      "restarbeiten.edit.short.dictation"
    );
    bindEditorRef(
      this.shortDictationIcon,
      "restarbeiten.edit.short.dictation.icon"
    );
    bindEditorRef(
      this.sharedEditboxCore.editbox.shortInput,
      "restarbeiten.edit.short.field"
    );

    bindEditorRef(this.actions, "restarbeiten.edit.short.actions");
    bindEditorRef(this.newButton, "restarbeiten.edit.action.new");
    bindEditorRef(this.deleteButton, "restarbeiten.edit.action.delete");

    bindEditorRef(this.classWrap, "restarbeiten.edit.class");
    bindEditorRef(this.classLabel, "restarbeiten.edit.class.label");
    bindEditorRef(this.classControl, "restarbeiten.edit.class.control");
    bindEditorRef(
      this.classButtons.rest,
      "restarbeiten.edit.class.rest"
    );
    bindEditorRef(
      this.classButtons.mangel,
      "restarbeiten.edit.class.defect"
    );

    bindEditorRef(
      this.sharedEditboxCore.editbox.longWrap,
      "restarbeiten.edit.long"
    );
    bindEditorRef(
      this.sharedEditboxCore.longLabel,
      "restarbeiten.edit.long.headerZone"
    );

    const longLabelText =
      this.sharedEditboxCore.longLabel.querySelector?.(
        ".bbm-tops-editbox-label-text"
      ) || this.sharedEditboxCore.longLabel;

    bindEditorRef(longLabelText, "restarbeiten.edit.long.label");
    bindEditorRef(
      this.sharedEditboxCore.editbox.longCounter,
      "restarbeiten.edit.long.remaining"
    );
    bindEditorRef(
      this.sharedEditboxCore.longDictateButton,
      "restarbeiten.edit.long.dictation"
    );
    bindEditorRef(
      this.longDictationIcon,
      "restarbeiten.edit.long.dictation.icon"
    );
    bindEditorRef(
      this.sharedEditboxCore.editbox.longInput,
      "restarbeiten.edit.long.field"
    );

    bindEditorRef(this.locationHost, "restarbeiten.edit.location");

    this.locationFields.forEach((field, index) => {
      const level = index + 1;

      bindEditorRef(
        field.wrapper,
        `restarbeiten.edit.location.${level}`
      );
      bindEditorRef(
        field.labelElement,
        `restarbeiten.edit.location.${level}.label`
      );
      bindEditorRef(
        field.control,
        `restarbeiten.edit.location.${level}.field`
      );
    });

    bindEditorRef(this.metaHost, "restarbeiten.edit.meta");

    bindEditorRef(
      this.statusField.wrapper,
      "restarbeiten.edit.meta.status"
    );
    bindEditorRef(
      this.statusField.labelElement,
      "restarbeiten.edit.meta.status.label"
    );
    bindEditorRef(
      this.statusField.control,
      "restarbeiten.edit.meta.status.field"
    );

    bindEditorRef(
      this.dueField.wrapper,
      "restarbeiten.edit.meta.due"
    );
    bindEditorRef(
      this.dueField.labelElement,
      "restarbeiten.edit.meta.due.label"
    );
    bindEditorRef(
      this.dueField.control,
      "restarbeiten.edit.meta.due.field"
    );

    bindEditorRef(this.ampel, "restarbeiten.edit.meta.ampel");

    bindEditorRef(
      this.responsibleField.wrapper,
      "restarbeiten.edit.meta.responsible"
    );
    bindEditorRef(
      this.responsibleField.labelElement,
      "restarbeiten.edit.meta.responsible.label"
    );
    bindEditorRef(
      this.responsibleField.control,
      "restarbeiten.edit.meta.responsible.field"
    );

    bindEditorRef(
      this.validation,
      "restarbeiten.edit.validation"
    );
    bindEditorRef(
      this.noteButton,
      "restarbeiten.edit.action.note"
    );
  }

  destroy() {
    this.sharedEditboxCore.destroy();
  }
}

export default RestarbeitenSharedEditboxBinding;
