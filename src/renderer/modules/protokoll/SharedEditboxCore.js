import { EditboxShell } from "../../core/editbox/index.js";
import {
  normalizeTopLongText,
  normalizeTopShortText,
} from "../../shared/text/topTextPresentation.js";

const TOPS_WORKBENCH_FLAG_LABELS = Object.freeze({
  important: "Wichtig",
  task: "ToDo",
  decision: "Beschluss",
});

function createEmptyWorkbenchEditboxValue() {
  return {
    shortText: "",
    longText: "",
    flags: {
      hidden: false,
      important: false,
      task: false,
      decision: false,
    },
  };
}

function buildEditboxFlagsFromEditorValue(editorValue = {}) {
  return {
    hidden: Number(editorValue?.is_hidden) === 1,
    important: Number(editorValue?.is_important) === 1,
    task: Number(editorValue?.is_task) === 1,
    decision: Number(editorValue?.is_decision) === 1,
  };
}

export class SharedEditboxCore {
  constructor({ onDraftChange, onTextBlur } = {}) {
    this.onDraftChange = typeof onDraftChange === "function" ? onDraftChange : null;
    this.onTextBlur = typeof onTextBlur === "function" ? onTextBlur : null;

    this.editbox = new EditboxShell();
    this.editbox.setLimits({ shortText: 70 });
    this.root = this.editbox.getElement();
    this.flagsWrap = this.editbox.flagsWrap;
    this.root.classList.add("bbm-tops-workbench-editbox");
    this.editbox.setVisibleFlags(["important", "task", "decision"]);
    this.editbox.setCounterFormatter((evaluation) => String(evaluation?.remaining ?? ""));

    this._configurePresentation();
    this._bindDraftChangeSources();
  }

  _configurePresentation() {
    this._attachCounterToLabel(this.editbox.shortLabel, this.editbox.shortCounter);
    this._attachCounterToLabel(this.editbox.longLabel, this.editbox.longCounter);
    this.editbox.shortWrap.classList.add("bbm-tops-editbox-short-wrap");
    this.editbox.longWrap.classList.add("bbm-tops-editbox-long-wrap");
    this.editbox.flagsWrap.classList.add("bbm-tops-editbox-flags-in-meta");

    Object.entries(TOPS_WORKBENCH_FLAG_LABELS).forEach(([key, label]) => {
      const input = this.editbox.flagInputs?.[key];
      const textEl = input?.parentElement?.querySelector("span");
      if (textEl) textEl.textContent = label;
    });
  }

  _bindDraftChangeSources() {
    this.root.addEventListener("input", () => this._emitDraftChange());
    this.root.addEventListener("change", () => this._emitDraftChange());
    this.editbox.flagsWrap.addEventListener("input", () => this._emitDraftChange());
    this.editbox.flagsWrap.addEventListener("change", () => this._emitDraftChange());
    this.editbox.shortInput.addEventListener("blur", () => this._emitTextBlur("shortText"));
    this.editbox.longInput.addEventListener("blur", () => this._emitTextBlur("longText"));
  }

  _emitDraftChange() {
    if (this.onDraftChange) this.onDraftChange(this.getDraft());
  }

  _emitTextBlur(field) {
    if (!this.onTextBlur) return;
    this.onTextBlur({
      field,
      draft: this.getDraft(),
    });
  }

  _attachCounterToLabel(labelEl, counterEl) {
    if (!labelEl || !counterEl || labelEl.contains(counterEl)) return;

    const currentText = String(labelEl.textContent || "").trim();
    labelEl.textContent = "";

    const text = document.createElement("span");
    text.className = "bbm-tops-editbox-label-text";
    text.textContent = currentText;

    counterEl.classList.add("bbm-tops-editbox-remaining");
    labelEl.append(text, counterEl);
  }

  _isFlagFocused() {
    return this.editbox.isAnyFlagFocused();
  }

  _syncValue(editorValue = {}) {
    const nextEditboxValue = {};

    if (!this.editbox.isShortTextFocused()) {
      nextEditboxValue.shortText = normalizeTopShortText(editorValue?.title || "");
    }
    if (!this.editbox.isLongTextFocused()) {
      nextEditboxValue.longText = normalizeTopLongText(editorValue?.longtext || "");
    }
    if (!this._isFlagFocused()) {
      nextEditboxValue.flags = buildEditboxFlagsFromEditorValue(editorValue);
    }

    if (Object.keys(nextEditboxValue).length) {
      this.editbox.setValue(nextEditboxValue);
    }
  }

  _applyUnavailableState() {
    this.editbox.setValue(createEmptyWorkbenchEditboxValue());
    this.editbox.setState("disabled");
    this.editbox.setFieldAccess({
      shortTextReadOnly: false,
      longTextReadOnly: false,
      flagsDisabled: false,
    });
  }

  _applyReadOnlyState() {
    this.editbox.setState("read-only");
    this.editbox.setFieldAccess({
      shortTextReadOnly: true,
      longTextReadOnly: true,
      flagsDisabled: true,
    });
  }

  applyEditorState(editorVm = {}, actionsVm = {}) {
    const editorValue = editorVm?.value || {};
    const editorAccess = editorVm?.access || {};
    const hasSelection = !!actionsVm?.hasSelection;
    const isReadOnly = !!actionsVm?.isReadOnly;

    this._syncValue(editorValue);

    if (!hasSelection) {
      this._applyUnavailableState();
      return;
    }

    if (isReadOnly) {
      this._applyReadOnlyState();
      return;
    }

    this.editbox.setState("normal");
    this.editbox.setFieldAccess({
      shortTextReadOnly: !!editorAccess?.shortTextReadOnly,
      longTextReadOnly: !!editorAccess?.longTextReadOnly,
      flagsDisabled: !!editorAccess?.flagsDisabled,
    });
  }

  getDraft() {
    const textValue = this.editbox.getValue();
    return {
      title: normalizeTopShortText(textValue.shortText),
      longtext: normalizeTopLongText(textValue.longText),
      is_important: textValue.flags?.important ? 1 : 0,
      is_hidden: textValue.flags?.hidden ? 1 : 0,
      is_task: textValue.flags?.task ? 1 : 0,
      is_decision: textValue.flags?.decision ? 1 : 0,
    };
  }

  focusShortText(options = {}) {
    return this.editbox.focusShortText(options);
  }
}
