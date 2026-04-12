import { TopsMetaPanel } from "./TopsMetaPanel.js";
import { TopsResponsibleBridge } from "./TopsResponsibleBridge.js";
import { TopsStatusAmpelBridge } from "./TopsStatusAmpelBridge.js";
import { SharedEditboxCore } from "../../modules/protokoll/SharedEditboxCore.js";

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
    this.responsibleBridge.initialize();
  }

  // Gemeinsames Workbench-Muster:
  // Header, Arbeitsflaeche und Meta-Spalte bilden die wiederverwendbare Grundstruktur.
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
    this._buildProtocolMetaPanel();
    this._buildProtocolMetaBridges();
  }

  _assembleWorkbenchShell() {
    this.body.append(this.left, this.gutter, this.metaPanel.root);
    this.root.append(this.header, this.body);
  }

  // Gemeinsamer Bearbeitungskern:
  // wiederverwendbarer Editbox-Baustein ohne TOP-spezifische Meta-/Ablauflogik.
  _buildSharedEditboxCore() {
    this.sharedEditboxCore = new SharedEditboxCore({
      onDraftChange: () => this._emitDraftChange(),
    });
  }

  // Protokollspezifische Workbench-Huelle:
  // Meta-Spalte und Flag-Platzierung spiegeln den heutigen TOP-Arbeitsfluss.
  _buildProtocolMetaPanel() {
    this.metaPanel = new TopsMetaPanel({
      onChange: () => this._emitDraftChange(),
    });
    this.flagsMetaRow = document.createElement("div");
    this.flagsMetaRow.className = "bbm-tops-meta-flags";
    this.flagsMetaRow.appendChild(this.sharedEditboxCore.flagsWrap);
    this.metaPanel.root.appendChild(this.flagsMetaRow);
  }

  // Protokollspezifische Workbench-Bridges:
  // wiederverwendbare Kernfelder werden hier an die TOP-Meta-/Draft-Struktur gekoppelt.
  _buildProtocolMetaBridges() {
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
      ...this.metaPanel.getValue(),
    };
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
    const metaValue = metaVm?.value || {};
    const metaAccess = metaVm?.access || {};
    const metaDisabled = !!metaAccess?.disabled;
    const responsibleDisabled = !!metaAccess?.responsibleDisabled;

    this.metaPanel.setValue(metaValue);
    this.statusAmpelBridge.applyDraftValue(metaValue);
    this.responsibleBridge.applyDraftValue(metaValue?.responsible_label || "");

    this.metaPanel.setDisabled(metaDisabled);
    this.statusAmpelBridge.setDisabled(metaDisabled);
    this.responsibleBridge.setDisabled(metaDisabled || responsibleDisabled);
  }

  // Protokoll-Workbench mit TOP-Regelwirkung:
  // Aktivierungen fuer Speichern, Schieben, Loeschen und Anlegen bleiben explizit TOP-bezogen.
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
