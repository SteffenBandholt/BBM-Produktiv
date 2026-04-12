import { EditboxStateService, EDITBOX_STATE } from "./EditboxStateService.js";
import {
  DEFAULT_TEXT_LIMITS,
  DEFAULT_WARNING_RATIO,
  evaluateShortText,
  evaluateLongText,
} from "../textregeln/index.js";

const FLAG_KEYS = ["hidden", "important", "task", "decision"];
const DEFAULT_EDITBOX_FLAGS = Object.freeze({
  hidden: false,
  important: false,
  task: false,
  decision: false,
});

function asText(value) {
  return String(value || "");
}

function asFlags(rawFlags) {
  const source = rawFlags && typeof rawFlags === "object" ? rawFlags : {};
  return {
    hidden: Boolean(source.hidden),
    important: Boolean(source.important),
    task: Boolean(source.task),
    decision: Boolean(source.decision),
  };
}

function mkEl(doc, tag, className, text) {
  const el = doc.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function createEmptyEditboxValue() {
  return {
    shortText: "",
    longText: "",
    flags: { ...DEFAULT_EDITBOX_FLAGS },
  };
}

function defaultCounterFormatter(evaluation) {
  return `${evaluation.length} / ${evaluation.limit} (Rest: ${evaluation.remaining})`;
}

export class EditboxShell {
  constructor({ documentRef, stateService, limits, warningRatio } = {}) {
    this.documentRef = documentRef || window.document;
    this.stateService = stateService || new EditboxStateService();
    this._limits = {
      shortText: this._asPositiveInt(limits?.shortText, DEFAULT_TEXT_LIMITS.shortText),
      longText: this._asPositiveInt(limits?.longText, DEFAULT_TEXT_LIMITS.longText),
    };
    this._warningRatio = this._asWarningRatio(warningRatio, DEFAULT_WARNING_RATIO);
    this._shortTextEvaluation = evaluateShortText("", {
      limit: this._limits.shortText,
      warningRatio: this._warningRatio,
    });
    this._longTextEvaluation = evaluateLongText("", {
      limit: this._limits.longText,
      warningRatio: this._warningRatio,
    });
    this._counterFormatter = defaultCounterFormatter;
    this._state = EDITBOX_STATE.EMPTY;
    this._fieldAccess = {
      shortTextReadOnly: false,
      longTextReadOnly: false,
      flagsDisabled: false,
    };
    this._build();
    this.setState(EDITBOX_STATE.EMPTY);
  }

  _asPositiveInt(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
  }

  _asWarningRatio(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0 || n > 1) return fallback;
    return n;
  }

  // Gemeinsamer Bearbeitungskern:
  // nur generische Text-/Flag-Felder und neutraler Meta-Slot, keine Protokoll-Workbench-Logik.
  _build() {
    const doc = this.documentRef;

    this.root = mkEl(doc, "section", "editbox-shell");
    this.root.setAttribute("data-component", "editbox-shell");

    this.mainCol = mkEl(doc, "div", "editbox-main");
    this.metaCol = mkEl(doc, "aside", "editbox-meta-slot");

    this.shortWrap = mkEl(doc, "div", "editbox-field");
    this.shortLabel = mkEl(doc, "label", "editbox-label", "Kurztext");
    this.shortInput = mkEl(doc, "input", "editbox-input");
    this.shortInput.type = "text";
    this.shortInput.autocomplete = "off";
    this.shortInput.maxLength = this._limits.shortText;
    this.shortCounter = mkEl(doc, "div", "editbox-counter", "0");
    this.shortWrap.append(this.shortLabel, this.shortInput, this.shortCounter);

    this.longWrap = mkEl(doc, "div", "editbox-field");
    this.longLabel = mkEl(doc, "label", "editbox-label", "Langtext");
    this.longInput = mkEl(doc, "textarea", "editbox-textarea");
    this.longInput.rows = 6;
    this.longCounter = mkEl(doc, "div", "editbox-counter", "0");
    this.longWrap.append(this.longLabel, this.longInput, this.longCounter);

    this.flagsWrap = mkEl(doc, "div", "editbox-flags");
    this.flagInputs = {};
    this.flagItems = {};
    FLAG_KEYS.forEach((key) => {
      const item = mkEl(doc, "label", "editbox-flag");
      const input = mkEl(doc, "input");
      input.type = "checkbox";
      input.dataset.flag = key;
      input.addEventListener("change", () => this._handleFlagToggle(key));
      const text = mkEl(doc, "span", null, key);
      item.append(input, text);
      this.flagsWrap.appendChild(item);
      this.flagInputs[key] = input;
      this.flagItems[key] = item;
    });

    this.mainCol.append(this.shortWrap, this.longWrap, this.flagsWrap);
    this.root.append(this.mainCol, this.metaCol);

    this.shortInput.addEventListener("input", () => {
      this._enforceShortTextLimit();
      this._updateCounters();
    });
    this.longInput.addEventListener("input", () => this._updateCounters());
    this._updateCounters();
  }

  mount(container) {
    if (!container) return;
    container.appendChild(this.root);
  }

  getElement() {
    return this.root;
  }

  getMetaSlotElement() {
    return this.metaCol;
  }

  clearMetaContent() {
    this.metaCol.innerHTML = "";
  }

  setMetaContent(content) {
    this.clearMetaContent();
    if (!content) return;
    if (typeof content === "string") {
      this.metaCol.textContent = content;
      return;
    }
    this.metaCol.appendChild(content);
  }

  attachMetaComponent(component) {
    if (!component) {
      this.clearMetaContent();
      return null;
    }

    const element =
      typeof component.getElement === "function" ? component.getElement() : component;

    if (!element || !element.nodeType) {
      throw new Error("Meta component must provide a DOM element.");
    }

    this.setMetaContent(element);
    return element;
  }

  _updateCounters() {
    this._shortTextEvaluation = evaluateShortText(this.shortInput.value, {
      limit: this._limits.shortText,
      warningRatio: this._warningRatio,
    });
    this._longTextEvaluation = evaluateLongText(this.longInput.value, {
      limit: this._limits.longText,
      warningRatio: this._warningRatio,
    });

    this._applyCounterState(this.shortWrap, this.shortCounter, this._shortTextEvaluation);
    this._applyCounterState(this.longWrap, this.longCounter, this._longTextEvaluation);
  }

  _clampShortText(value) {
    const text = asText(value);
    return text.slice(0, this._limits.shortText);
  }

  _enforceShortTextLimit() {
    const next = this._clampShortText(this.shortInput.value);
    if (next !== this.shortInput.value) this.shortInput.value = next;
  }

  _applyCounterState(fieldWrap, counterEl, evaluation) {
    counterEl.textContent = this._counterFormatter(evaluation);
    counterEl.dataset.level = evaluation.level;
    fieldWrap.dataset.level = evaluation.level;
    fieldWrap.classList.toggle("is-over-limit", evaluation.isOverLimit);
  }

  _handleFlagToggle(changedKey) {
    if (changedKey === "task" && this.flagInputs.task?.checked) {
      this.flagInputs.decision.checked = false;
      return;
    }
    if (changedKey === "decision" && this.flagInputs.decision?.checked) {
      this.flagInputs.task.checked = false;
    }
  }

  _applyEditboxFlags(flags = {}) {
    const normalizedFlags = asFlags(flags);
    Object.entries(this.flagInputs).forEach(([key, input]) => {
      input.checked = normalizedFlags[key];
    });
    this._enforceTaskDecisionExclusion();
  }

  _enforceTaskDecisionExclusion(preferredKey) {
    const taskChecked = Boolean(this.flagInputs.task?.checked);
    const decisionChecked = Boolean(this.flagInputs.decision?.checked);
    if (!taskChecked || !decisionChecked) return;

    if (preferredKey === "task") {
      this.flagInputs.decision.checked = false;
      return;
    }
    if (preferredKey === "decision") {
      this.flagInputs.task.checked = false;
      return;
    }
    this.flagInputs.task.checked = false;
  }

  setValue(value = {}) {
    if (value.shortText !== undefined) this.shortInput.value = this._clampShortText(value.shortText);
    if (value.longText !== undefined) this.longInput.value = asText(value.longText);
    if (value.flags !== undefined) this._applyEditboxFlags(value.flags);

    this._updateCounters();
  }

  getValue() {
    const flags = {};
    Object.entries(this.flagInputs).forEach(([key, input]) => {
      flags[key] = Boolean(input.checked);
    });
    return {
      shortText: this._clampShortText(this.shortInput.value),
      longText: this.longInput.value,
      flags,
    };
  }

  setVisibleFlags(flagKeys) {
    const visible = new Set(Array.isArray(flagKeys) ? flagKeys.map((key) => String(key || "").trim()) : FLAG_KEYS);
    Object.entries(this.flagItems).forEach(([key, item]) => {
      const show = visible.has(key);
      item.style.display = show ? "" : "none";
    });
  }

  isShortTextFocused() {
    return this.shortInput === this.documentRef.activeElement;
  }

  isLongTextFocused() {
    return this.longInput === this.documentRef.activeElement;
  }

  isAnyFlagFocused() {
    const active = this.documentRef.activeElement;
    if (!active) return false;
    return Object.values(this.flagInputs).includes(active);
  }

  setLimits(limits = {}) {
    this._limits = {
      shortText: this._asPositiveInt(limits.shortText, this._limits.shortText),
      longText: this._asPositiveInt(limits.longText, this._limits.longText),
    };
    this.shortInput.maxLength = this._limits.shortText;
    this._enforceShortTextLimit();
    this._updateCounters();
  }

  getLimits() {
    return {
      shortText: this._limits.shortText,
      longText: this._limits.longText,
    };
  }

  getTextRulesState() {
    return {
      shortText: { ...this._shortTextEvaluation },
      longText: { ...this._longTextEvaluation },
      warningRatio: this._warningRatio,
      limits: this.getLimits(),
    };
  }
  setFieldAccess(nextAccess = {}) {
    this._fieldAccess = {
      shortTextReadOnly: Boolean(nextAccess.shortTextReadOnly),
      longTextReadOnly: Boolean(nextAccess.longTextReadOnly),
      flagsDisabled: Boolean(nextAccess.flagsDisabled),
    };
    this._applyControlState();
  }

  _applyControlState() {
    const state = this.stateService.resolveControlState(this._state);
    const hardDisabled = state.isDisabled;
    const globalReadOnly = state.isReadOnly;

    this.shortInput.readOnly = globalReadOnly || this._fieldAccess.shortTextReadOnly;
    this.longInput.readOnly = globalReadOnly || this._fieldAccess.longTextReadOnly;

    this.shortInput.disabled = hardDisabled;
    this.longInput.disabled = hardDisabled;

    Object.values(this.flagInputs).forEach((input) => {
      input.disabled = globalReadOnly || hardDisabled || this._fieldAccess.flagsDisabled;
    });

    this.root.dataset.shortReadonly = this.shortInput.readOnly ? "true" : "false";
    this.root.dataset.longReadonly = this.longInput.readOnly ? "true" : "false";
  }
  setCounterFormatter(formatter) {
    this._counterFormatter = typeof formatter === "function"
      ? formatter
      : defaultCounterFormatter;
    this._updateCounters();
  }

  setState(nextState) {
    const state = this.stateService.resolveControlState(nextState);
    this._state = state.mode;

    if (state.isEmpty) {
      this.setValue(createEmptyEditboxValue());
    }

    this.root.dataset.state = state.mode;
    this.root.classList.toggle("is-empty", state.isEmpty);
    this.root.classList.toggle("is-read-only", state.isReadOnly);
    this.root.classList.toggle("is-disabled", state.isDisabled);
    this.root.classList.toggle("is-busy", state.isBusy);
    this._applyControlState();
  }

  getState() {
    return this._state;
  }
}
