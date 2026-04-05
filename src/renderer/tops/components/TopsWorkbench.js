import { TopsMetaPanel } from "./TopsMetaPanel.js";

export class TopsWorkbench {
  constructor({
    onDraftChange,
    onSave,
    onDelete,
    onToggleMove,
    onCreateLevel1,
    onCreateChild,
  } = {}) {
    this.onDraftChange = typeof onDraftChange === "function" ? onDraftChange : null;
    this.onSave = typeof onSave === "function" ? onSave : null;
    this.onDelete = typeof onDelete === "function" ? onDelete : null;
    this.onToggleMove = typeof onToggleMove === "function" ? onToggleMove : null;
    this.onCreateLevel1 = typeof onCreateLevel1 === "function" ? onCreateLevel1 : null;
    this.onCreateChild = typeof onCreateChild === "function" ? onCreateChild : null;

    this.root = document.createElement("div");
    this.root.className = "bbm-tops-workbench";
    this.root.dataset.hasSelection = "false";
    this.root.dataset.isReadOnly = "false";
    this.root.dataset.isMoveMode = "false";

    this.header = document.createElement("div");
    this.header.className = "bbm-tops-workbench-header";

    this.btnL1 = this._mkBtn("+ Titel", this.onCreateLevel1, "neutral");
    this.btnChild = this._mkBtn("+ TOP", this.onCreateChild, "neutral");
    this.btnMove = this._mkBtn("Schieben", this.onToggleMove, "neutral");
    this.btnSave = this._mkBtn("Speichern", this.onSave, "primary");
    this.btnDelete = this._mkBtn("Papierkorb", this.onDelete, "danger");

    const addWrap = document.createElement("div");
    addWrap.className = "bbm-tops-workbench-add-wrap";
    addWrap.append(this.btnL1, this.btnChild);

    const actionWrap = document.createElement("div");
    actionWrap.className = "bbm-tops-workbench-action-wrap";
    actionWrap.append(this.btnMove, this.btnSave, this.btnDelete);

    this.header.append(addWrap, actionWrap);

    this.body = document.createElement("div");
    this.body.className = "bbm-tops-workbench-body";

    this.left = document.createElement("div");
    this.left.className = "bbm-tops-workbench-left";

    this.inpTitle = document.createElement("input");
    this.inpTitle.type = "text";
    this.inpTitle.placeholder = "Kurztext...";
    this.inpTitle.className = "bbm-tops-input";

    this.taLong = document.createElement("textarea");
    this.taLong.placeholder = "Langtext...";
    this.taLong.className = "bbm-tops-input bbm-tops-textarea";

    this.left.append(this._mkField("Kurztext", this.inpTitle), this._mkField("Langtext", this.taLong));

    this.metaPanel = new TopsMetaPanel({
      onChange: () => this._emitDraftChange(),
    });

    this.body.append(this.left, this.metaPanel.root);
    this.root.append(this.header, this.body);

    this.inpTitle.addEventListener("input", () => this._emitDraftChange());
    this.taLong.addEventListener("input", () => this._emitDraftChange());
  }

  _mkField(label, control) {
    const wrap = document.createElement("label");
    wrap.className = "bbm-tops-workbench-field";
    const t = document.createElement("span");
    t.textContent = label;
    wrap.append(t, control);
    return wrap;
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

  getDraft() {
    return {
      title: String(this.inpTitle.value || ""),
      longtext: String(this.taLong.value || ""),
      ...this.metaPanel.getValue(),
    };
  }

  setState({
    editor = {},
    isReadOnly = false,
    hasSelection = false,
    isMoveMode = false,
    canSave = false,
    canDelete = false,
    canMove = false,
    canCreateChild = false,
  } = {}) {
    const nextTitle = editor?.title || "";
    const nextLong = editor?.longtext || "";
    if (this.inpTitle !== document.activeElement) this.inpTitle.value = nextTitle;
    if (this.taLong !== document.activeElement) this.taLong.value = nextLong;
    this.metaPanel.setValue(editor || {});

    const disableInputs = !!isReadOnly || !hasSelection;
    this.inpTitle.disabled = disableInputs;
    this.taLong.disabled = disableInputs;
    this.metaPanel.setDisabled(disableInputs);

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
