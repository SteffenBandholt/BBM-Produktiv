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
    this.root.style.background = "#ffffff";
    this.root.style.border = "1px solid #d5e1ee";
    this.root.style.borderRadius = "10px";
    this.root.style.boxShadow = "0 6px 14px rgba(15, 23, 42, 0.07)";
    this.root.style.padding = "4px 6px 6px";
    this.root.style.display = "grid";
    this.root.style.gap = "6px";

    this.header = document.createElement("div");
    this.header.style.display = "flex";
    this.header.style.flexWrap = "wrap";
    this.header.style.alignItems = "center";
    this.header.style.gap = "4px";
    this.header.style.paddingBottom = "4px";
    this.header.style.borderBottom = "1px solid #e4ebf4";

    this.btnL1 = this._mkBtn("+ Titel", this.onCreateLevel1, "neutral");
    this.btnChild = this._mkBtn("+ TOP", this.onCreateChild, "neutral");
    this.btnMove = this._mkBtn("Schieben", this.onToggleMove, "neutral");
    this.btnSave = this._mkBtn("Speichern", this.onSave, "primary");
    this.btnDelete = this._mkBtn("Papierkorb", this.onDelete, "danger");

    const addWrap = document.createElement("div");
    addWrap.style.display = "inline-flex";
    addWrap.style.alignItems = "center";
    addWrap.style.gap = "3px";
    addWrap.append(this.btnL1, this.btnChild);

    const actionWrap = document.createElement("div");
    actionWrap.style.marginLeft = "auto";
    actionWrap.style.display = "inline-flex";
    actionWrap.style.alignItems = "center";
    actionWrap.style.gap = "3px";
    actionWrap.append(this.btnMove, this.btnSave, this.btnDelete);

    this.header.append(addWrap, actionWrap);

    this.body = document.createElement("div");
    this.body.style.display = "grid";
    this.body.style.gridTemplateColumns = "minmax(0,1fr) minmax(220px,240px)";
    this.body.style.gap = "6px";

    this.left = document.createElement("div");
    this.left.style.display = "grid";
    this.left.style.gap = "6px";

    this.inpTitle = document.createElement("input");
    this.inpTitle.type = "text";
    this.inpTitle.placeholder = "Kurztext...";
    this.inpTitle.style.width = "100%";
    this.inpTitle.style.boxSizing = "border-box";
    this.inpTitle.style.padding = "3px 5px";
    this.inpTitle.style.border = "1px solid #cad8e6";
    this.inpTitle.style.borderRadius = "7px";
    this.inpTitle.style.background = "#ffffff";
    this.inpTitle.style.fontSize = "8.5pt";

    this.taLong = document.createElement("textarea");
    this.taLong.placeholder = "Langtext...";
    this.taLong.style.width = "100%";
    this.taLong.style.boxSizing = "border-box";
    this.taLong.style.padding = "4px 5px";
    this.taLong.style.border = "1px solid #cad8e6";
    this.taLong.style.borderRadius = "7px";
    this.taLong.style.background = "#ffffff";
    this.taLong.style.minHeight = "64px";
    this.taLong.style.resize = "vertical";
    this.taLong.style.lineHeight = "1.35";
    this.taLong.style.fontSize = "8.5pt";

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
    wrap.style.display = "grid";
    wrap.style.gap = "3px";
    wrap.style.fontSize = "8.5pt";
    const t = document.createElement("span");
    t.textContent = label;
    wrap.append(t, control);
    return wrap;
  }

  _mkBtn(label, onClick, tone) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.style.borderRadius = "6px";
    btn.style.padding = "1px 7px";
    btn.style.minHeight = "20px";
    btn.style.fontSize = "7.5pt";
    btn.style.lineHeight = "1.2";
    btn.style.fontWeight = "600";
    if (tone === "primary") {
      btn.style.background = "#2f6fb7";
      btn.style.color = "#ffffff";
      btn.style.border = "1px solid #285f9b";
    } else if (tone === "danger") {
      btn.style.background = "#fff4e6";
      btn.style.color = "#8a4b00";
      btn.style.border = "1px solid #e7bf84";
    } else {
      btn.style.background = "#f5f8fc";
      btn.style.color = "#1f344a";
      btn.style.border = "1px solid #d3dfec";
    }
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
    this.btnMove.textContent = isMoveMode ? "Schieben aktiv" : "Schieben";
  }
}

