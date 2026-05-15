import { EditboxShell } from "../../core/editbox/index.js";
import { applyPopupButtonStyle } from "../../ui/popupButtonStyles.js";
import {
  createPopupOverlay,
  stylePopupCard,
  registerPopupCloseHandlers,
  cleanupPopupHandlers,
} from "../../ui/popupCommon.js";
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
    this.editbox.setLimits({ shortText: 82 });
    this.root = this.editbox.getElement();
    this.flagsWrap = this.editbox.flagsWrap;
    this.shortLabel = this.editbox.shortLabel;
    this.longLabel = this.editbox.longLabel;
    this.root.classList.add("bbm-tops-workbench-editbox");
    this._currentEditorValue = {};
    this._dictationStatus = null;
    this._dictationUndoHandler = null;
    this._dictionaryCorrectionOverlay = null;
    this._dictionaryCorrectionSnapshot = null;
    this._dictionaryCorrectionDialog = null;
    this._dictionaryCorrectionButton = null;
    this._dictionaryCorrectionInput = null;
    this._dictionaryCorrectionReplaceButton = null;
    this._dictionaryCorrectionCancelButton = null;
    this._dictionaryCorrectionSelectionSync = null;
    this.editbox.setVisibleFlags(["important", "task", "decision"]);
    this.editbox.setCounterFormatter((evaluation) => String(evaluation?.remaining ?? ""));

    this._configurePresentation();
    this._buildDictationButtons();
    this._buildDictationStatusUi();
    this._buildDictionaryCorrectionUi();
    this._bindDraftChangeSources();
  }

  _configurePresentation() {
    const shortLabelParts = this._attachCounterToLabel(this.editbox.shortLabel, this.editbox.shortCounter);
    const longLabelParts = this._attachCounterToLabel(this.editbox.longLabel, this.editbox.longCounter);
    this.shortLabelRow = this._buildLabelRow(this.editbox.shortLabel, shortLabelParts);
    this.longLabelRow = this._buildLabelRow(this.editbox.longLabel, longLabelParts);
    this.editbox.shortWrap.classList.add("bbm-tops-editbox-row", "bbm-tops-editbox-short-wrap");
    this.editbox.longWrap.classList.add("bbm-tops-editbox-row", "bbm-tops-editbox-long-wrap");
    this.editbox.flagsWrap.classList.add("bbm-tops-editbox-flags-in-meta");

    Object.entries(TOPS_WORKBENCH_FLAG_LABELS).forEach(([key, label]) => {
      const input = this.editbox.flagInputs?.[key];
      const textEl = input?.parentElement?.querySelector("span");
      if (textEl) textEl.textContent = label;
    });
  }

  _buildLabelRow(labelEl, { textEl, counterEl } = {}) {
    const row = document.createElement("span");
    row.className = "bbm-tops-editbox-label-row";

    if (textEl) row.appendChild(textEl);
    const nextChildren = [];
    nextChildren.push(row);
    if (counterEl) nextChildren.push(counterEl);
    if (typeof labelEl.replaceChildren === "function") {
      labelEl.replaceChildren(...nextChildren);
    } else {
      labelEl.appendChild(row);
      if (counterEl) labelEl.appendChild(counterEl);
    }
    return row;
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
    appendToHost(this.shortLabelRow, this.shortDictateButton, this.shortLabel);
    appendToHost(this.longLabelRow, this.longDictateButton, this.longLabel);
  }

  _buildDictationStatusUi() {
    this.dictationStatusBar = document.createElement("div");
    this.dictationStatusBar.className = "bbm-tops-dictation-status";
    this.dictationStatusBar.style.display = "none";
    this.dictationStatusBar.style.alignItems = "center";
    this.dictationStatusBar.style.justifyContent = "space-between";
    this.dictationStatusBar.style.gap = "10px";
    this.dictationStatusBar.style.marginTop = "6px";
    this.dictationStatusBar.style.padding = "6px 8px";
    this.dictationStatusBar.style.border = "1px solid var(--card-border)";
    this.dictationStatusBar.style.borderRadius = "8px";
    this.dictationStatusBar.style.background = "var(--card-bg)";

    this.dictationStatusTextWrap = document.createElement("div");
    this.dictationStatusTextWrap.style.display = "grid";
    this.dictationStatusTextWrap.style.gap = "2px";
    this.dictationStatusTextWrap.style.minWidth = "0";

    this.dictationStatusText = document.createElement("div");
    this.dictationStatusText.style.fontSize = "12px";
    this.dictationStatusText.style.fontWeight = "600";

    this.dictationStatusDetails = document.createElement("div");
    this.dictationStatusDetails.style.fontSize = "11px";
    this.dictationStatusDetails.style.opacity = "0.82";
    this.dictationStatusDetails.style.whiteSpace = "pre-wrap";

    this.dictationUndoButton = document.createElement("button");
    this.dictationUndoButton.type = "button";
    this.dictationUndoButton.textContent = "Rückgängig";
    this.dictationUndoButton.className = "bbm-tops-workbench-btn bbm-tops-workbench-btn-neutral";
    this.dictationUndoButton.style.flex = "0 0 auto";
    this.dictationUndoButton.style.display = "none";
    this.dictationUndoButton.onclick = () => {
      if (typeof this._dictationUndoHandler === "function") {
        this._dictationUndoHandler();
      }
    };

    this.dictationStatusTextWrap.append(this.dictationStatusText, this.dictationStatusDetails);
    this.dictationStatusBar.append(this.dictationStatusTextWrap, this.dictationUndoButton);
    this.root.appendChild(this.dictationStatusBar);
  }

  _buildDictionaryCorrectionUi() {
    this.dictionaryCorrectionBar = document.createElement("div");
    this.dictionaryCorrectionBar.className = "bbm-tops-dictionary-correction";
    this.dictionaryCorrectionBar.style.display = "flex";
    this.dictionaryCorrectionBar.style.justifyContent = "flex-start";
    this.dictionaryCorrectionBar.style.gap = "8px";
    this.dictionaryCorrectionBar.style.marginTop = "2px";
    this.dictionaryCorrectionBar.style.alignItems = "center";

    this.dictionaryCorrectionButton = document.createElement("button");
    this.dictionaryCorrectionButton.type = "button";
    this.dictionaryCorrectionButton.textContent = "Korrektur";
    this.dictionaryCorrectionButton.className = "bbm-tops-workbench-btn bbm-tops-workbench-btn-neutral";
    applyPopupButtonStyle(this.dictionaryCorrectionButton, { variant: "neutral" });
    this.dictionaryCorrectionButton.disabled = true;
    this.dictionaryCorrectionButton.style.opacity = "0.55";
    this.dictionaryCorrectionButton.style.fontSize = "11px";
    this.dictionaryCorrectionButton.style.padding = "3px 7px";
    this.dictionaryCorrectionButton.style.minHeight = "24px";
    this.dictionaryCorrectionButton.style.lineHeight = "1.05";
    this.dictionaryCorrectionButton.style.alignSelf = "flex-start";
    this.dictionaryCorrectionButton.title = "Nur mit markiertem Text im aktiven Feld verfuegbar";
    this.dictionaryCorrectionButton.addEventListener("pointerdown", () => {
      this._syncDictionaryCorrectionSelection();
    });
    this.dictionaryCorrectionButton.addEventListener("mousedown", () => {
      this._syncDictionaryCorrectionSelection();
    });
    this.dictionaryCorrectionButton.onclick = () => {
      void this._openDictionaryCorrectionDialog();
    };

    this.dictionaryCorrectionBar.append(this.dictionaryCorrectionButton);
    this.longLabel.appendChild(this.dictionaryCorrectionBar);

    this._dictionaryCorrectionSelectionSync = () => this._syncDictionaryCorrectionButtonState();
    const syncFromInput = (inputEl) => () => this._syncDictionaryCorrectionSelection(inputEl);
    const shortSync = syncFromInput(this.editbox.shortInput);
    const longSync = syncFromInput(this.editbox.longInput);

    this.editbox.shortInput.addEventListener("focus", shortSync);
    this.editbox.shortInput.addEventListener("select", shortSync);
    this.editbox.shortInput.addEventListener("mouseup", shortSync);
    this.editbox.shortInput.addEventListener("keyup", shortSync);
    this.editbox.shortInput.addEventListener("input", shortSync);
    this.editbox.longInput.addEventListener("focus", longSync);
    this.editbox.longInput.addEventListener("select", longSync);
    this.editbox.longInput.addEventListener("mouseup", longSync);
    this.editbox.longInput.addEventListener("keyup", longSync);
    this.editbox.longInput.addEventListener("input", longSync);
    if (typeof document?.addEventListener === "function") {
      document.addEventListener("selectionchange", this._dictionaryCorrectionSelectionSync);
    }
    this._syncDictionaryCorrectionButtonState();
  }

  _getDictionaryCorrectionFieldElement(field) {
    const normalized = String(field || "").trim();
    if (normalized === "longText") return this.editbox.longInput;
    return this.editbox.shortInput;
  }

  _captureDictionaryCorrectionSnapshot(fieldEl = null) {
    const active =
      fieldEl === this.editbox.shortInput || fieldEl === this.editbox.longInput
        ? fieldEl
        : this.editbox.shortInput === document.activeElement
          ? this.editbox.shortInput
          : this.editbox.longInput === document.activeElement
            ? this.editbox.longInput
            : null;
    if (!active || active.disabled || active.readOnly) return null;

    const start = Number(active.selectionStart);
    const end = Number(active.selectionEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    const from = Math.max(0, Math.min(start, end));
    const to = Math.max(0, Math.max(start, end));
    if (to <= from) return null;

    const value = String(active.value || "");
    if (from > value.length || to > value.length) return null;
    const selectedText = value.slice(from, to);
    if (!selectedText) return null;

    return {
      field: active === this.editbox.longInput ? "longText" : "shortText",
      start: from,
      end: to,
      value,
      selectedText,
    };
  }

  _syncDictionaryCorrectionSelection(fieldEl = null) {
    const snapshot = this._captureDictionaryCorrectionSnapshot(fieldEl);
    if (snapshot) {
      this._dictionaryCorrectionSnapshot = snapshot;
    }
    this._syncDictionaryCorrectionButtonState();
    return snapshot;
  }

  _syncDictionaryCorrectionButtonState() {
    if (!this.dictionaryCorrectionButton) return;
    const hasSnapshot = !!this._dictionaryCorrectionSnapshot;
    const disabled = !hasSnapshot || this.editbox.shortInput.disabled || this.editbox.longInput.disabled;
    this.dictionaryCorrectionButton.disabled = disabled;
    this.dictionaryCorrectionButton.style.opacity = disabled ? "0.55" : "1";
    this.dictionaryCorrectionButton.title = hasSnapshot
      ? `Markierten Text korrigieren: "${this._dictionaryCorrectionSnapshot.selectedText}"`
      : "Nur mit markiertem Text im aktiven Feld verfuegbar";
  }

  _closeDictionaryCorrectionDialog() {
    if (!this._dictionaryCorrectionOverlay) return;
    cleanupPopupHandlers(this._dictionaryCorrectionOverlay);
    const overlay = this._dictionaryCorrectionOverlay;
    this._dictionaryCorrectionOverlay = null;
    this._dictionaryCorrectionDialog = null;
    this.dictionaryCorrectionDialog = null;
    this._dictionaryCorrectionInput = null;
    this.dictionaryCorrectionInput = null;
    this._dictionaryCorrectionReplaceButton = null;
    this.dictionaryCorrectionReplaceButton = null;
    this._dictionaryCorrectionCancelButton = null;
    this.dictionaryCorrectionCancelButton = null;
    if (overlay.parentElement && typeof overlay.parentElement.removeChild === "function") {
      overlay.parentElement.removeChild(overlay);
    } else if (typeof overlay.remove === "function") {
      overlay.remove();
    } else {
      overlay.style.display = "none";
    }
  }

  _restoreDictionaryCorrectionSelection(snapshot) {
    const fieldEl = this._getDictionaryCorrectionFieldElement(snapshot?.field);
    if (!fieldEl) return false;
    try {
      if (typeof fieldEl.focus === "function") fieldEl.focus();
      if (typeof fieldEl.setSelectionRange === "function") {
        fieldEl.setSelectionRange(snapshot.start, snapshot.end);
      }
      return true;
    } catch (_err) {
      return false;
    }
  }

  _replaceDictionaryCorrectionSelection(snapshot, replacement, { force = false } = {}) {
    const fieldEl = this._getDictionaryCorrectionFieldElement(snapshot?.field);
    if (!fieldEl || fieldEl.disabled || fieldEl.readOnly) return { ok: false, error: "Feld nicht verfuegbar." };

    const currentValue = String(fieldEl.value || "");
    const start = Number(snapshot?.start);
    const end = Number(snapshot?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return { ok: false, error: "Rueckgaengig nicht mehr moeglich, weil der diktierte Text bereits geaendert wurde." };
    }
    if (!force && currentValue !== String(snapshot?.value || "")) {
      return { ok: false, error: "Rueckgaengig nicht mehr moeglich, weil der diktierte Text bereits geaendert wurde." };
    }

    const before = currentValue.slice(0, start);
    const after = currentValue.slice(end);
    const nextValue = `${before}${replacement}${after}`;
    fieldEl.value = nextValue;
    const caretStart = before.length;
    const caretEnd = caretStart + String(replacement || "").length;
    if (typeof fieldEl.setSelectionRange === "function") {
      try {
        fieldEl.setSelectionRange(caretStart, caretEnd);
      } catch (_err) {
        // ignore
      }
    }

    if (fieldEl === this.editbox.shortInput && typeof this._enforceShortTextLimit === "function") {
      this._enforceShortTextLimit();
    }
    this._updateCounters();
    this._emitDraftChange("text");
    return { ok: true, value: nextValue };
  }

  async _saveDictionaryCorrectionEntry({ wrongText, correctText }) {
    const api = window.bbmDb || {};
    if (typeof api.dictionaryCreateEntry !== "function") {
      return { ok: false, error: "Wörterbuch-Funktion nicht verfuegbar." };
    }
    const res = await api.dictionaryCreateEntry({
      entryType: "correction",
      wrongText,
      correctText,
      category: "Bau",
      source: "user",
      active: true,
    });
    if (!res?.ok) {
      return { ok: false, error: res?.error || "Wörterbuch-Eintrag konnte nicht gespeichert werden." };
    }
    return { ok: true, entry: res.entry || null };
  }

  async _openDictionaryCorrectionDialog() {
    const snapshot = this._dictionaryCorrectionSnapshot || this._captureDictionaryCorrectionSnapshot();
    if (!snapshot) {
      alert("Bitte zuerst den falsch erkannten Text markieren.");
      return false;
    }

    this._dictionaryCorrectionSnapshot = snapshot;
    this._closeDictionaryCorrectionDialog();

    const overlay = createPopupOverlay({ background: "rgba(0,0,0,0.35)" });
    overlay.style.display = "flex";
    registerPopupCloseHandlers(overlay, () => {
      this._closeDictionaryCorrectionDialog();
      this._restoreDictionaryCorrectionSelection(this._dictionaryCorrectionSnapshot);
      this._syncDictionaryCorrectionButtonState();
    });

    const card = document.createElement("div");
    stylePopupCard(card, { width: "min(560px, calc(100vw - 24px))" });
    card.style.padding = "12px";
    card.style.display = "grid";
    card.style.gap = "12px";

    const title = document.createElement("div");
    title.textContent = "Text korrigieren";
    title.style.fontSize = "16px";
    title.style.fontWeight = "700";

    const promptRow = document.createElement("div");
    promptRow.style.display = "flex";
    promptRow.style.flexWrap = "wrap";
    promptRow.style.alignItems = "center";
    promptRow.style.gap = "10px";

    const sourceText = document.createElement("div");
    sourceText.textContent = `"${snapshot.selectedText}" ändern zu`;
    sourceText.style.fontWeight = "600";
    sourceText.style.whiteSpace = "nowrap";

    const correctionInput = document.createElement("input");
    correctionInput.type = "text";
    correctionInput.style.flex = "1 1 220px";
    correctionInput.style.minWidth = "220px";
    correctionInput.value = "";

    promptRow.append(sourceText, correctionInput);

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    const message = document.createElement("div");
    message.style.minHeight = "18px";
    message.style.fontSize = "12px";
    message.style.color = "#8a1f1f";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Abbrechen";
    applyPopupButtonStyle(cancelButton);

    const replaceButton = document.createElement("button");
    replaceButton.type = "button";
    replaceButton.textContent = "Ersetzen";
    applyPopupButtonStyle(replaceButton, { variant: "primary" });

    const closeDialog = () => {
      this._closeDictionaryCorrectionDialog();
      this._restoreDictionaryCorrectionSelection(snapshot);
      this._syncDictionaryCorrectionButtonState();
    };

    cancelButton.onclick = () => closeDialog();

    replaceButton.onclick = async () => {
      const wrongText = String(snapshot.selectedText || "").trim();
      const correctText = String(correctionInput.value || "").trim();
      if (!wrongText) {
        message.textContent = "Bitte zuerst Text markieren.";
        return;
      }
      if (!correctText) {
        message.textContent = "Bitte den Zieltext eingeben.";
        return;
      }

      const replaceResult = this._replaceDictionaryCorrectionSelection(snapshot, correctText);
      if (!replaceResult?.ok) {
        message.textContent =
          replaceResult?.error ||
          "Rückgängig nicht mehr möglich, weil der diktierte Text bereits geändert wurde.";
        return;
      }

      const saveResult = await this._saveDictionaryCorrectionEntry({ wrongText, correctText });
      if (!saveResult?.ok) {
        const fieldEl = this._getDictionaryCorrectionFieldElement(snapshot.field);
        if (fieldEl) {
          fieldEl.value = String(snapshot.value || "");
          if (typeof fieldEl.setSelectionRange === "function") {
            try {
              fieldEl.setSelectionRange(snapshot.start, snapshot.end);
            } catch (_err) {
              // ignore
            }
          }
          this._updateCounters();
          this._emitDraftChange("text");
        }
        message.textContent = saveResult?.error || "Wörterbuch-Eintrag konnte nicht gespeichert werden.";
        return;
      }

      closeDialog();
    };

    actions.append(cancelButton, replaceButton);
    card.append(title, promptRow, message, actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    this._dictionaryCorrectionOverlay = overlay;
    this._dictionaryCorrectionDialog = card;
    this.dictionaryCorrectionDialog = card;
    this._dictionaryCorrectionInput = correctionInput;
    this.dictionaryCorrectionInput = correctionInput;
    this._dictionaryCorrectionReplaceButton = replaceButton;
    this.dictionaryCorrectionReplaceButton = replaceButton;
    this._dictionaryCorrectionCancelButton = cancelButton;
    this.dictionaryCorrectionCancelButton = cancelButton;
    this._syncDictionaryCorrectionButtonState();

    try {
      correctionInput.focus();
    } catch (_err) {
      // ignore
    }

    return true;
  }

  destroy() {
    if (this._dictionaryCorrectionSelectionSync && typeof document?.removeEventListener === "function") {
      document.removeEventListener("selectionchange", this._dictionaryCorrectionSelectionSync);
    }
  }

  setDictionaryStatus({
    summaryText = "",
    details = [],
    canUndo = false,
    undoDisabledReason = "",
    onUndo = null,
  } = {}) {
    const summary = String(summaryText || "").trim();
    const lines = Array.isArray(details)
      ? details
          .map((item) => {
            if (typeof item === "string") return item.trim();
            const wrong = String(item?.wrongText || item?.wrong || "").trim();
            const correct = String(item?.correctText || item?.correct || "").trim();
            if (!wrong || !correct) return "";
            return `${wrong} -> ${correct}`;
          })
          .filter(Boolean)
      : [];

    this._dictationUndoHandler = typeof onUndo === "function" ? onUndo : null;
    this._dictationStatus = summary ? { summaryText: summary, details: lines } : null;

    if (!summary) {
      this.dictationStatusBar.style.display = "none";
      this.dictationUndoButton.style.display = "none";
      this.dictationStatusText.textContent = "";
      this.dictationStatusDetails.textContent = "";
      return;
    }

    this.dictationStatusBar.style.display = "flex";
    this.dictationStatusText.textContent = summary;
    this.dictationStatusDetails.textContent = lines.join("\n");
    this.dictationUndoButton.style.display = "inline-flex";
    this.dictationUndoButton.disabled = !canUndo;
    this.dictationUndoButton.style.opacity = canUndo ? "1" : "0.55";
    this.dictationUndoButton.title = canUndo
      ? "Letzten Diktatblock zurücknehmen"
      : String(undoDisabledReason || "Rückgängig nicht möglich").trim();
  }

  clearDictionaryStatus() {
    this._dictationUndoHandler = null;
    this._dictationStatus = null;
    if (!this.dictationStatusBar) return;
    this.dictationStatusBar.style.display = "none";
    this.dictationUndoButton.style.display = "none";
    this.dictationUndoButton.disabled = true;
    this.dictationStatusText.textContent = "";
    this.dictationStatusDetails.textContent = "";
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
    if (!labelEl || !counterEl || labelEl.contains(counterEl)) {
      return { textEl: null, counterEl: counterEl || null };
    }

    const currentText = String(labelEl.textContent || "").trim();
    labelEl.textContent = "";

    const text = document.createElement("span");
    text.className = "bbm-tops-editbox-label-text";
    text.textContent = currentText;

    counterEl.classList.add("bbm-tops-editbox-remaining");
    labelEl.append(text, counterEl);
    return { textEl: text, counterEl };
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
    const topLevel = Math.floor(Number(editorVm?.level) || 1);

    this.root.dataset.topLevel = Number.isFinite(topLevel) && topLevel > 0 ? String(topLevel) : "1";
    this._syncValue(editorValue);

    if (!hasSelection) {
      this._applyUnavailableState();
      this._syncDictionaryCorrectionButtonState();
      return;
    }

    if (isReadOnly) {
      this._applyReadOnlyState();
      this._syncDictionaryCorrectionButtonState();
      return;
    }

    this.editbox.setState("normal");
    this._syncImportantState(editorValue);
    this.editbox.setFieldAccess({
      shortTextReadOnly: !!editorAccess?.shortTextReadOnly,
      longTextReadOnly: !!editorAccess?.longTextReadOnly,
      flagsDisabled: !!editorAccess?.flagsDisabled,
    });
    this._syncDictionaryCorrectionButtonState();
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
