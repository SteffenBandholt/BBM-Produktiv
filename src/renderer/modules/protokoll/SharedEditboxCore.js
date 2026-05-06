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

function isCompletedStatus(value) {
  return String(value ?? "").trim().toLowerCase() === "erledigt";
}

export class SharedEditboxCore {
  constructor({ onDraftChange, onTextBlur, onStartDictation } = {}) {
    this.onDraftChange = typeof onDraftChange === "function" ? onDraftChange : null;
    this.onTextBlur = typeof onTextBlur === "function" ? onTextBlur : null;
    this.onStartDictation =
      typeof onStartDictation === "function" ? onStartDictation : null;

    this.editbox = new EditboxShell();
    this.editbox.setLimits({ shortText: 70 });
    this.root = this.editbox.getElement();
    this.flagsWrap = this.editbox.flagsWrap;
    this.shortLabel = this.editbox.shortLabel;
    this.longLabel = this.editbox.longLabel;
    this.root.classList.add("bbm-tops-workbench-editbox");
    this._currentEditorValue = {};
    this.editbox.setVisibleFlags(["important", "task", "decision"]);
    this.editbox.setCounterFormatter((evaluation) => String(evaluation?.remaining ?? ""));

    this._configurePresentation();
    this._buildDictationButtons();
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
    this.editbox.shortInput.addEventListener("input", () => {
      this._enforceShortTextLimit();
      this._updateCounters();
      this._emitDraftChange("text");
    });
    this.editbox.longInput.addEventListener("input", () => {
      this._updateCounters();
      this._emitDraftChange("text");
    });
    this.editbox.flagsWrap.addEventListener("change", () => this._emitDraftChange("flags"));
    this.editbox.shortInput.addEventListener("blur", () => this._emitTextBlur("shortText"));
    this.editbox.longInput.addEventListener("blur", () => this._emitTextBlur("longText"));
  }

  _enforceShortTextLimit() {
    if (typeof this.editbox?._enforceShortTextLimit === "function") {
      this.editbox._enforceShortTextLimit();
      return;
    }
    const limit = Number(this.editbox?.shortInput?.maxLength || 70);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 70;
    this.editbox.shortInput.value = String(this.editbox.shortInput.value || "").slice(0, safeLimit);
  }

  _updateCounters() {
    if (typeof this.editbox?._updateCounters === "function") {
      this.editbox._updateCounters();
    }
  }

  _buildDictationButtons() {
    const createButton = (target, title) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bbm-tops-workbench-btn bbm-tops-workbench-btn-neutral bbm-tops-dictation-icon-button";
      btn.setAttribute("aria-label", title);
      btn.title = title;
      btn.style.display = "none";
      btn.dataset.dictationTarget = target;
      btn.onclick = () => {
        if (this.onStartDictation) this.onStartDictation(target);
      };
      return btn;
    };

    const appendToHost = (host, button, fallbackHost) => {
      const targetHost =
        host && typeof host.append === "function"
          ? host
          : fallbackHost && typeof fallbackHost.append === "function"
            ? fallbackHost
            : null;
      if (!targetHost) return;
      targetHost.append(button);
    };

    this.shortDictateButton = createButton("shortText", "Diktat starten");
    this.longDictateButton = createButton("longText", "Diktat starten");
    appendToHost(this.shortLabel, this.shortDictateButton, this.editbox.shortWrap);
    appendToHost(this.longLabel, this.longDictateButton, this.editbox.longWrap);
  }

  _emitDraftChange(source = "text") {
    this._syncImportantState();
    if (this.onDraftChange) this.onDraftChange({ draft: this.getDraft(), source });
  }

  _syncImportantState(editorValue = null) {
    const currentEditorValue =
      editorValue && typeof editorValue === "object"
        ? editorValue
        : this._currentEditorValue && typeof this._currentEditorValue === "object"
          ? this._currentEditorValue
          : {};
    const important = Boolean(this.editbox.getValue()?.flags?.important);
    const completed = isCompletedStatus(currentEditorValue?.status);
    this.root.dataset.important = important ? "true" : "false";
    this.root.dataset.completed = completed ? "true" : "false";
  }

  _emitTextBlur(field) {
    if (!this.onTextBlur) return;
    const value =
      field === "shortText"
        ? this.editbox.shortInput.value
        : field === "longText"
          ? this.editbox.longInput.value
          : "";
    this.onTextBlur({
      field,
      value,
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
    this._currentEditorValue = { ...(editorValue || {}) };
    this._syncImportantState(editorValue);
  }

  _applyUnavailableState() {
    this._currentEditorValue = {};
    this.editbox.setValue(createEmptyWorkbenchEditboxValue());
    this._syncImportantState({});
    this.editbox.setState("disabled");
    this.editbox.setFieldAccess({
      shortTextReadOnly: false,
      longTextReadOnly: false,
      flagsDisabled: false,
    });
  }

  _applyReadOnlyState() {
    this.editbox.setState("read-only");
    this._syncImportantState();
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
    this._syncImportantState(editorValue);
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
