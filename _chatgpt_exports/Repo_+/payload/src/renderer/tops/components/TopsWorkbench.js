import { TopsMetaPanel } from "./TopsMetaPanel.js";
import { TopsResponsibleBridge } from "./TopsResponsibleBridge.js";
import { TopsStatusAmpelBridge } from "./TopsStatusAmpelBridge.js";
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

const PROTOCOL_WORKBENCH_BUTTON_SPECS = Object.freeze({
  createLevel1: { label: "+Titel", tone: "neutral" },
  createChild: { label: "+TOP", tone: "neutral" },
  toggleMove: { label: "Schieben", tone: "neutral" },
  save: { label: "Speichern", tone: "primary" },
  delete: { label: "Papierkorb", tone: "danger" },
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
    this._bindDraftChangeSources();
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
    this.left.appendChild(this.editboxRoot);
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
    this.editbox = new EditboxShell();
    this.editbox.setLimits({ shortText: 70 });
    this.editboxRoot = this.editbox.getElement();
    this.editboxRoot.classList.add("bbm-tops-workbench-editbox");
    this.editbox.setVisibleFlags(["important", "task", "decision"]);
    this.editbox.setCounterFormatter((evaluation) => String(evaluation?.remaining ?? ""));
    this._configureEditboxPresentation();
  }

  // Protokollspezifische Workbench-Huelle:
  // Meta-Spalte und Flag-Platzierung spiegeln den heutigen TOP-Arbeitsfluss.
  _buildProtocolMetaPanel() {
    this.metaPanel = new TopsMetaPanel({
      onChange: () => this._emitDraftChange(),
    });
    this.flagsMetaRow = document.createElement("div");
    this.flagsMetaRow.className = "bbm-tops-meta-flags";
    this.flagsMetaRow.appendChild(this.editbox.flagsWrap);
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

  _bindDraftChangeSources() {
    this.editboxRoot.addEventListener("input", () => this._emitDraftChange());
    this.editboxRoot.addEventListener("change", () => this._emitDraftChange());
    this.flagsMetaRow.addEventListener("input", () => this._emitDraftChange());
    this.flagsMetaRow.addEventListener("change", () => this._emitDraftChange());
  }

  _configureEditboxPresentation() {
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

  _isEditboxFlagFocused() {
    return this.editbox.isAnyFlagFocused();
  }

  _buildProtocolDraftFromUiState() {
    const textValue = this.editbox.getValue();
    return {
      title: normalizeTopShortText(textValue.shortText),
      longtext: normalizeTopLongText(textValue.longText),
      ...this.metaPanel.getValue(),
      is_important: textValue.flags?.important ? 1 : 0,
      is_hidden: textValue.flags?.hidden ? 1 : 0,
      is_task: textValue.flags?.task ? 1 : 0,
      is_decision: textValue.flags?.decision ? 1 : 0,
    };
  }

  getDraft() {
    return this._buildProtocolDraftFromUiState();
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
    const editorValue = editorVm?.value || {};
    const editorAccess = editorVm?.access || {};
    const hasSelection = !!actionsVm?.hasSelection;
    const isReadOnly = !!actionsVm?.isReadOnly;

    this._syncSharedEditboxValue(editorValue);

    if (!hasSelection) {
      this._applyEditboxUnavailableState();
      return;
    }

    if (isReadOnly) {
      this._applyEditboxReadOnlyState();
      return;
    }

    this.editbox.setState("normal");
    this.editbox.setFieldAccess({
      shortTextReadOnly: !!editorAccess?.shortTextReadOnly,
      longTextReadOnly: !!editorAccess?.longTextReadOnly,
      flagsDisabled: !!editorAccess?.flagsDisabled,
    });
  }

  _syncSharedEditboxValue(editorValue = {}) {
    const nextEditboxValue = {};

    if (!this.editbox.isShortTextFocused()) {
      nextEditboxValue.shortText = normalizeTopShortText(editorValue?.title || "");
    }
    if (!this.editbox.isLongTextFocused()) {
      nextEditboxValue.longText = normalizeTopLongText(editorValue?.longtext || "");
    }
    if (!this._isEditboxFlagFocused()) {
      nextEditboxValue.flags = buildEditboxFlagsFromEditorValue(editorValue);
    }

    if (Object.keys(nextEditboxValue).length) {
      this.editbox.setValue(nextEditboxValue);
    }
  }

  _applyEditboxUnavailableState() {
    this.editbox.setValue(createEmptyWorkbenchEditboxValue());
    this.editbox.setState("disabled");
    this.editbox.setFieldAccess({
      shortTextReadOnly: false,
      longTextReadOnly: false,
      flagsDisabled: false,
    });
  }

  _applyEditboxReadOnlyState() {
    this.editbox.setState("read-only");
    this.editbox.setFieldAccess({
      shortTextReadOnly: true,
      longTextReadOnly: true,
      flagsDisabled: true,
    });
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
