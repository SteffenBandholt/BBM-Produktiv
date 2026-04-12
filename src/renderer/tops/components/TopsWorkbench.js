import { SharedEditboxCore } from "../../modules/protokoll/SharedEditboxCore.js";
import { WorkbenchMetaColumn } from "../../modules/protokoll/WorkbenchMetaColumn.js";
import { WorkbenchShellFrame } from "../../modules/protokoll/WorkbenchShellFrame.js";
import { WorkbenchActionDraftState } from "../../modules/protokoll/WorkbenchActionDraftState.js";

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
    this._buildProtocolWorkbenchActionDraftState();
    this._assembleWorkbenchShell();
    this.metaColumn.initialize();
  }

  // Gemeinsames Workbench-Muster:
  // Header, Arbeitsflaeche und Meta-Spalte bilden die wiederverwendbare Grundstruktur.
  _buildWorkbenchShell() {
    this.workbenchShell = new WorkbenchShellFrame();
    this.root = this.workbenchShell.root;
    this.header = this.workbenchShell.header;
    this.leftHeaderTitle = this.workbenchShell.leftHeaderTitle;
    this.headerAddActions = this.workbenchShell.headerAddActions;
    this.headerPrimaryActions = this.workbenchShell.headerPrimaryActions;
    this.body = this.workbenchShell.body;
    this.left = this.workbenchShell.left;
    this.gutter = this.workbenchShell.gutter;
  }

  // Protokollspezifische Workbench-Huelle:
  // Button-Bedeutungen und Header-Titel bleiben im Modul `Protokoll`.
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
    this.workbenchShell.mount(this.metaColumn.root);
  }

  // Gemeinsamer Bearbeitungskern:
  // wiederverwendbarer Editbox-Baustein ohne TOP-spezifische Meta-/Ablauflogik.
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

  _buildProtocolWorkbenchActionDraftState() {
    this.actionDraftState = new WorkbenchActionDraftState({
      sharedEditboxCore: this.sharedEditboxCore,
      metaColumn: this.metaColumn,
      root: this.workbenchShell.root,
      buttons: {
        btnL1: this.btnL1,
        btnChild: this.btnChild,
        btnMove: this.btnMove,
        btnSave: this.btnSave,
        btnDelete: this.btnDelete,
      },
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
    return this.actionDraftState.getDraft();
  }

  // ---------------------------------------------------------------------------
  // Workbench-Zustand: gemeinsames Muster vs. Protokoll-Workbench-Huelle
  // ---------------------------------------------------------------------------

  setState(vm = {}) {
    this._applyHeaderState(vm.header || {});
    this._applyEditorState(vm.editor || {}, vm.actions || {});
    this._applyMetaState(vm.meta || {});
    this._applyActionState(vm.actions || {});
  }

  _applyHeaderState(headerVm = {}) {
    this.leftHeaderTitle.textContent = String(headerVm?.title || "TOP bearbeiten");
  }

  // Gemeinsamer Bearbeitungskern im Workbench-Rahmen:
  // Editbox-Zustand und Feldzugriff bleiben generisch, auch wenn die Workbench TOP-bezogen ist.
  _applyEditorState(editorVm = {}, actionsVm = {}) {
    this.sharedEditboxCore.applyEditorState(editorVm, actionsVm);
  }

  // Protokoll-Workbench:
  // Meta-Pane und Button-Zustaende bleiben Huelle des Moduls `Protokoll`.
  _applyMetaState(metaVm = {}) {
    this.metaColumn.applyState(metaVm);
  }

  // Protokoll-Workbench mit TOP-Regelwirkung:
  // Aktivierungen fuer Speichern, Schieben, Loeschen und Anlegen bleiben explizit TOP-bezogen.
  _applyActionState(actionsVm = {}) {
    this.actionDraftState.applyActionState(actionsVm);
  }
}
