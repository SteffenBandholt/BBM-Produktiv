import { TopsMetaPanel } from "./TopsMetaPanel.js";
import { TopsResponsibleBridge } from "./TopsResponsibleBridge.js";
import { TopsStatusAmpelBridge } from "./TopsStatusAmpelBridge.js";
import { EditboxShell } from "../../core/editbox/index.js";

export class TopsWorkbench {
  constructor({
    onDraftChange,
    onSave,
    onDelete,
    onToggleMove,
    onCreateLevel1,
    onCreateChild,
    loadCompanies,
    loadEmployeesByCompany,
  } = {}) {
    this.onDraftChange = typeof onDraftChange === "function" ? onDraftChange : null;
    this.onSave = typeof onSave === "function" ? onSave : null;
    this.onDelete = typeof onDelete === "function" ? onDelete : null;
    this.onToggleMove = typeof onToggleMove === "function" ? onToggleMove : null;
    this.onCreateLevel1 = typeof onCreateLevel1 === "function" ? onCreateLevel1 : null;
    this.onCreateChild = typeof onCreateChild === "function" ? onCreateChild : null;
    this.loadCompanies = typeof loadCompanies === "function" ? loadCompanies : null;
    this.loadEmployeesByCompany =
      typeof loadEmployeesByCompany === "function" ? loadEmployeesByCompany : null;

    this.root = document.createElement("div");
    this.root.className = "bbm-tops-workbench";
    this.root.dataset.hasSelection = "false";
    this.root.dataset.isReadOnly = "false";
    this.root.dataset.isMoveMode = "false";

    this.header = document.createElement("div");
    this.header.className = "bbm-tops-workbench-header";

    this.leftHeaderTitle = document.createElement("div");
    this.leftHeaderTitle.className = "bbm-tops-workbench-left-title";
    this.leftHeaderTitle.textContent = "TOP bearbeiten";

    this.btnL1 = this._mkBtn("+Titel", this.onCreateLevel1, "neutral");
    this.btnChild = this._mkBtn("+TOP", this.onCreateChild, "neutral");
    this.btnMove = this._mkBtn("Schieben", this.onToggleMove, "neutral");
    this.btnSave = this._mkBtn("Speichern", this.onSave, "primary");
    this.btnDelete = this._mkBtn("Papierkorb", this.onDelete, "danger");

    const addWrap = document.createElement("div");
    addWrap.className = "bbm-tops-workbench-add-wrap";
    addWrap.append(this.btnL1, this.btnChild);

    const actionWrap = document.createElement("div");
    actionWrap.className = "bbm-tops-workbench-action-wrap";
    actionWrap.append(this.btnMove, this.btnSave, this.btnDelete);

    this.header.append(this.leftHeaderTitle, addWrap, actionWrap);

    this.body = document.createElement("div");
    this.body.className = "bbm-tops-workbench-body";

    this.left = document.createElement("div");
    this.left.className = "bbm-tops-workbench-left";

    this.editbox = new EditboxShell();
    this.editboxRoot = this.editbox.getElement();
    this.editboxRoot.classList.add("bbm-tops-workbench-editbox");
    this.editbox.setVisibleFlags(["important", "decision"]);
    this.editbox.setCounterFormatter((evaluation) => String(evaluation?.remaining ?? ""));
    this._configureEditboxPresentation();
    this.left.appendChild(this.editboxRoot);

    this.gutter = document.createElement("div");
    this.gutter.className = "bbm-tops-workbench-gutter";
    this.gutter.setAttribute("aria-hidden", "true");

    this.metaPanel = new TopsMetaPanel({
      onChange: () => this._emitDraftChange(),
    });

    this.statusAmpelBridge = new TopsStatusAmpelBridge({
      metaPanel: this.metaPanel,
      onChange: () => this._emitDraftChange(),
    });
    this.statusAmpelBridge.mount();

    this.responsibleBridge = new TopsResponsibleBridge({
      metaPanel: this.metaPanel,
      loadCompanies: this.loadCompanies,
      loadEmployeesByCompany: this.loadEmployeesByCompany,
      onChange: () => this._emitDraftChange(),
    });
    this.responsibleBridge.mount();

    this.body.append(this.left, this.gutter, this.metaPanel.root);
    this.root.append(this.header, this.body);

    this.editboxRoot.addEventListener("input", () => this._emitDraftChange());
    this.editboxRoot.addEventListener("change", () => this._emitDraftChange());
    this.responsibleBridge.initialize();
  }

  _configureEditboxPresentation() {
    this._attachCounterToLabel(this.editbox.shortLabel, this.editbox.shortCounter);
    this._attachCounterToLabel(this.editbox.longLabel, this.editbox.longCounter);
    this.editbox.shortWrap.classList.add("bbm-tops-editbox-short-wrap");
    this.editbox.longWrap.classList.add("bbm-tops-editbox-long-wrap");

    if (this.editbox.flagsWrap?.parentElement !== this.editbox.shortLabel) {
      this.editbox.shortLabel.appendChild(this.editbox.flagsWrap);
    }

    const germanFlags = {
      important: "Wichtig",
      task: "ToDo",
      decision: "Beschluss",
    };
    Object.entries(germanFlags).forEach(([key, label]) => {
      const input = this.editbox.flagInputs?.[key];
      const textEl = input?.parentElement?.querySelector("span");
      if (textEl) textEl.textContent = label;
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

  _mkBtn(label, onClick, tone) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.className = `bbm-tops-btn bbm-tops-workbench-btn bbm-tops-workbench-btn-${tone}`;
    btn.onclick = async () => {
      if (typeof onClick === "function") await onClick();
    };
    return btn;
  }

  _emitDraftChange() {
    if (this.onDraftChange) this.onDraftChange(this.getDraft());
  }

  _isEditboxFlagFocused() {
    return this.editbox.isAnyFlagFocused();
  }

  getDraft() {
    const textValue = this.editbox.getValue();
    return {
      title: String(textValue.shortText || ""),
      longtext: String(textValue.longText || ""),
      ...this.metaPanel.getValue(),
      is_important: textValue.flags?.important ? 1 : 0,
      is_hidden: textValue.flags?.hidden ? 1 : 0,
      is_task: textValue.flags?.task ? 1 : 0,
      is_decision: textValue.flags?.decision ? 1 : 0,
    };
  }

  setState({
    header = {},
    editor = {},
    editorState = {},
    metaState = {},
    hasSelection = false,
    isReadOnly = false,
    isMoveMode = false,
    canSave = false,
    canDelete = false,
    canMove = false,
    canCreateChild = false,
  } = {}) {
    const nextTitle = editor?.title || "";
    const nextLong = editor?.longtext || "";
    const nextEditboxValue = {};

    if (!this.editbox.isShortTextFocused()) nextEditboxValue.shortText = nextTitle;
    if (!this.editbox.isLongTextFocused()) nextEditboxValue.longText = nextLong;

    if (!this._isEditboxFlagFocused()) {
      nextEditboxValue.flags = {
        hidden: Number(editor?.is_hidden) === 1,
        important: Number(editor?.is_important) === 1,
        task: Number(editor?.is_task) === 1,
        decision: Number(editor?.is_decision) === 1,
      };
    }

    if (Object.keys(nextEditboxValue).length) {
      this.editbox.setValue(nextEditboxValue);
    }

    this.leftHeaderTitle.textContent = String(header?.title || "TOP bearbeiten");

    this.metaPanel.setValue(editor || {});
    this.statusAmpelBridge.applyDraftValue(editor || {});
    this.responsibleBridge.applyDraftValue(editor?.responsible_label || "");

    if (!hasSelection) {
      this.editbox.setValue({
        shortText: "",
        longText: "",
        flags: { hidden: false, important: false, task: false, decision: false },
      });
      this.editbox.setState("disabled");
      this.editbox.setFieldAccess({
        shortTextReadOnly: false,
        longTextReadOnly: false,
        flagsDisabled: false,
      });
    } else if (isReadOnly) {
      this.editbox.setState("read-only");
      this.editbox.setFieldAccess({
        shortTextReadOnly: true,
        longTextReadOnly: true,
        flagsDisabled: true,
      });
    } else {
      this.editbox.setState("normal");
      this.editbox.setFieldAccess({
        shortTextReadOnly: !!editorState?.shortTextReadOnly,
        longTextReadOnly: !!editorState?.longTextReadOnly,
        flagsDisabled: !!editorState?.flagsDisabled,
      });
    }

    const metaDisabled = !!metaState?.disabled;
    this.metaPanel.setDisabled(metaDisabled);
    this.statusAmpelBridge.setDisabled(metaDisabled);
    this.responsibleBridge.setDisabled(metaDisabled);

    this.btnL1.disabled = !!isReadOnly;
    this.btnChild.disabled = !!isReadOnly || !canCreateChild;
    this.btnMove.disabled = !!isReadOnly || !canMove;
    this.btnSave.disabled = !!isReadOnly || !canSave;
    this.btnDelete.disabled = !!isReadOnly || !canDelete;

    this.root.dataset.hasSelection = hasSelection ? "true" : "false";
    this.root.dataset.isReadOnly = isReadOnly ? "true" : "false";
    this.root.dataset.isMoveMode = isMoveMode ? "true" : "false";

    this.btnMove.textContent = isMoveMode ? "Schieben aktiv" : "Schieben";
  }
}
