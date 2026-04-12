import { SharedEditboxCore } from "../../modules/protokoll/SharedEditboxCore.js";
import { WorkbenchMetaColumn } from "../../modules/protokoll/WorkbenchMetaColumn.js";

const PROTOCOL_WORKBENCH_BUTTON_SPECS = Object.freeze({
  createLevel1: { label: "+Titel", tone: "neutral" },
  createChild: { label: "+TOP", tone: "neutral" },
  toggleMove: { label: "Schieben", tone: "neutral" },
  save: { label: "Speichern", tone: "primary" },
  delete: { label: "Papierkorb", tone: "danger" },
});

function buildProtocolActionButtonSpecs() {
  return [
    ["btnL1", PROTOCOL_WORKBENCH_BUTTON_SPECS.createLevel1, "onCreateLevel1"],
    ["btnChild", PROTOCOL_WORKBENCH_BUTTON_SPECS.createChild, "onCreateChild"],
    ["btnMove", PROTOCOL_WORKBENCH_BUTTON_SPECS.toggleMove, "onToggleMove"],
    ["btnSave", PROTOCOL_WORKBENCH_BUTTON_SPECS.save, "onSave"],
    ["btnDelete", PROTOCOL_WORKBENCH_BUTTON_SPECS.delete, "onDelete"],
  ];
}

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

    this._buildWorkbenchShell();
    this._buildProtocolWorkbenchHeader();
    this._buildProtocolWorkbenchEditorArea();
    this._buildProtocolWorkbenchMetaArea();
    this._assembleWorkbenchShell();
    this.metaColumn.initialize();
  }

  _buildWorkbenchShell() {
    this.root = document.createElement("div");
    this.root.className = "bbm-tops-workbench";
    this.root.dataset.hasSelection = "false";
    this.root.dataset.isReadOnly = "false";
    this.root.dataset.isMoveMode = "false";

    this.header = document.createElement("div");
    this.header.className = "bbm-tops-workbench-header";

    this.leftHeaderTitle = document.createElement("div");
    this.leftHeaderTitle.className = "bbm-tops-workbench-left-title";

    const addWrap = document.createElement("div");
    addWrap.className = "bbm-tops-workbench-add-wrap";
    this.headerAddActions = addWrap;

    const actionWrap = document.createElement("div");
    actionWrap.className = "bbm-tops-workbench-action-wrap";
    this.headerPrimaryActions = actionWrap;

    this.header.append(this.leftHeaderTitle, addWrap, actionWrap);

    this.body = document.createElement("div");
    this.body.className = "bbm-tops-workbench-body";

    this.left = document.createElement("div");
    this.left.className = "bbm-tops-workbench-left";

    this.gutter = document.createElement("div");
    this.gutter.className = "bbm-tops-workbench-gutter";
    this.gutter.setAttribute("aria-hidden", "true");
  }

  _buildProtocolWorkbenchHeader() {
    this.leftHeaderTitle.textContent = "TOP bearbeiten";

    this._buildProtocolWorkbenchActionButtons();

    this.headerAddActions.append(this.btnL1, this.btnChild);
    this.headerPrimaryActions.append(this.btnMove, this.btnSave, this.btnDelete);
  }

  _buildProtocolWorkbenchActionButtons() {
    buildProtocolActionButtonSpecs().forEach(([propertyName, spec, handlerName]) => {
      this[propertyName] = this._createWorkbenchButton(spec, this[handlerName]);
    });
  }

  _buildProtocolWorkbenchEditorArea() {
    this._buildSharedEditboxCore();
    this.left.appendChild(this.sharedEditboxCore.root);
  }

  _buildProtocolWorkbenchMetaArea() {
    this._buildProtocolMetaColumn();
  }

  _assembleWorkbenchShell() {
    this.body.append(this.left, this.gutter, this.metaColumn.root);
    this.root.append(this.header, this.body);
  }

  _buildSharedEditboxCore() {
    this.sharedEditboxCore = new SharedEditboxCore({
      onDraftChange: () => this._emitDraftChange(),
    });
  }

  _buildProtocolMetaColumn() {
    this.metaColumn = new WorkbenchMetaColumn({
      flagsWrap: this.sharedEditboxCore.flagsWrap,
      loadCompanies: this.loadCompanies,
      loadEmployeesByCompany: this.loadEmployeesByCompany,
      onChange: () => this._emitDraftChange(),
    });
  }

  _createWorkbenchButton(spec, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(spec?.label || "");
    btn.className = `bbm-tops-btn bbm-tops-workbench-btn bbm-tops-workbench-btn-${spec?.tone || "neutral"}`;
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
      ...this.sharedEditboxCore.getDraft(),
      ...this.metaColumn.getDraft(),
    };
  }

  setState(vm = {}) {
    this._applyHeaderState(vm.header || {});
    this._applyEditorState(vm.editor || {}, vm.actions || {});
    this._applyMetaState(vm.meta || {});
    this._applyActionState(vm.actions || {});
  }

  _applyHeaderState(headerVm = {}) {
    this.leftHeaderTitle.textContent = String(headerVm?.title || "TOP bearbeiten");
  }

  _applyEditorState(editorVm = {}, actionsVm = {}) {
    this.sharedEditboxCore.applyEditorState(editorVm, actionsVm);
  }

  _applyMetaState(metaVm = {}) {
    this.metaColumn.applyState(metaVm);
  }

  _applyActionState(actionsVm = {}) {
    const hasSelection = !!actionsVm?.hasSelection;
    const isReadOnly = !!actionsVm?.isReadOnly;
    const isWriting = !!actionsVm?.isWriting;
    const isMoveMode = !!actionsVm?.isMoveMode;
    const canSave = !!actionsVm?.canSave;
    const canDelete = !!actionsVm?.canDelete;
    const canMove = !!actionsVm?.canMove;
    const canCreateLevel1 = !!actionsVm?.canCreateLevel1;
    const canCreateChild = !!actionsVm?.canCreateChild;

    this.btnL1.disabled = isReadOnly || isWriting || !canCreateLevel1;
    this.btnChild.disabled = isReadOnly || isWriting || !canCreateChild;
    this.btnMove.disabled = isReadOnly || isWriting || !canMove;
    this.btnSave.disabled = isReadOnly || isWriting || !canSave;
    this.btnDelete.disabled = isReadOnly || isWriting || !canDelete;

    this.root.dataset.hasSelection = hasSelection ? "true" : "false";
    this.root.dataset.isReadOnly = isReadOnly ? "true" : "false";
    this.root.dataset.isMoveMode = isMoveMode ? "true" : "false";

    this.btnMove.textContent = isMoveMode ? "Schieben aktiv" : "Schieben";
  }
}
