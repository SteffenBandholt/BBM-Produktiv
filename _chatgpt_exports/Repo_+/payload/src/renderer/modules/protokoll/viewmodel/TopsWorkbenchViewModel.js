import {
  editorFromTop,
  canCreateChildFromState,
  canDeleteFromState,
  canMoveFromState,
} from "./TopsScreenViewModel.js";

function buildHeaderVm(selectedTop) {
  const displayNumber = String(
    selectedTop?.displayNumber ??
      selectedTop?.number ??
      ""
  ).trim();

  return {
    title: displayNumber ? `TOP ${displayNumber}. bearbeiten` : "TOP bearbeiten",
  };
}

// Gemeinsames Workbench-Muster:
// Auswahl-, Read-only-, Busy- und Move-Zustand sind generische Zustandstypen.
function buildSharedWorkbenchStateVm(state, selectedTop) {
  return {
    hasSelection: !!selectedTop,
    isReadOnly: !!state?.isReadOnly,
    isWriting: !!state?.isWriting,
    isMoveMode: !!state?.isMoveMode,
  };
}

// TOP-spezifische Fachlogik:
// Level 1 bedeutet Titel und damit andere Bearbeitungsregeln als fuer normale TOPs.
function isTitleLevelTop(selectedTop) {
  return Number(selectedTop?.level || 1) === 1;
}

function buildSharedEditorAccessVm(state, selectedTop) {
  const isReadOnly = !!state?.isReadOnly;
  const isWriting = !!state?.isWriting;
  const isCarriedOver =
    Number(selectedTop?.is_carried_over ?? selectedTop?.isCarriedOver) === 1;

  return {
    shortTextReadOnly: isWriting || (!isReadOnly && isCarriedOver),
    longTextReadOnly: isWriting,
    flagsDisabled: isWriting,
  };
}

// Gemeinsamer Bearbeitungskern:
// Editbox-Wert und Feldzugriff bleiben ein generischer Bearbeitungszuschnitt.
function buildSharedEditorVm(state, selectedTop) {
  const editorValue = state?.editor || editorFromTop(selectedTop);
  return {
    value: editorValue,
    access: buildSharedEditorAccessVm(state, selectedTop),
  };
}

// TOP-spezifische Fachlogik:
// Titel auf Level 1 haben keine operative Meta-Belegung fuer Verantwortlich.
function buildProtocolMetaValueVm(editorValue, selectedTop) {
  const titleLevel = isTitleLevelTop(selectedTop);
  return {
    due_date: editorValue?.due_date ?? null,
    status: editorValue?.status ?? "-",
    responsible_label: titleLevel ? "" : editorValue?.responsible_label ?? "",
  };
}

function buildProtocolMetaAccessVm(state, selectedTop) {
  const isWriting = !!state?.isWriting;
  const titleLevel = isTitleLevelTop(selectedTop);
  return {
    disabled: !!state?.isReadOnly || isWriting,
    responsibleDisabled: !!state?.isReadOnly || isWriting || titleLevel,
  };
}

function buildProtocolWorkbenchStructureVm(selectedTop) {
  return {
    header: buildHeaderVm(selectedTop),
  };
}

// Protokollspezifische Workbench-Regel:
// Titel auf Level 1 haben in der TOP-Workbench keine operative Meta-Belegung.
function buildProtocolMetaVm(editorValue, state, selectedTop) {
  return {
    value: buildProtocolMetaValueVm(editorValue, selectedTop),
    access: buildProtocolMetaAccessVm(state, selectedTop),
  };
}

// Gemeinsames Workbench-Muster:
// Auswahl- und Bearbeitungsmuster bleiben wiederverwendbar, ohne TOP-Fachlogik mitzunehmen.
function buildSharedWorkbenchPatternVm(state, selectedTop) {
  const sharedWorkbenchState = buildSharedWorkbenchStateVm(state, selectedTop);
  const sharedEditorVm = buildSharedEditorVm(state, selectedTop);
  return {
    state: sharedWorkbenchState,
    editor: sharedEditorVm,
  };
}

// Protokollspezifische Workbench-Huelle:
// konkrete Header-/Action-Bedeutung bleibt TOP-bezogen und nutzt TOP-Regeln.
function buildProtocolWorkbenchActionsVm(sharedWorkbenchState, state, selectedTop) {
  const isWriting = !!sharedWorkbenchState?.isWriting;
  return {
    ...sharedWorkbenchState,
    canSave: !!selectedTop && !sharedWorkbenchState?.isReadOnly && !isWriting,
    canDelete: canDeleteFromState(state, selectedTop) && !isWriting,
    canMove: canMoveFromState(state, selectedTop) && !isWriting,
    canCreateLevel1: !sharedWorkbenchState?.isReadOnly && !isWriting,
    canCreateChild: canCreateChildFromState(state, selectedTop) && !isWriting,
  };
}

function buildProtocolWorkbenchVm(state, selectedTop) {
  const protocolWorkbenchStructure = buildProtocolWorkbenchStructureVm(selectedTop);
  const sharedPatternVm = buildSharedWorkbenchPatternVm(state, selectedTop);

  return {
    header: protocolWorkbenchStructure.header,
    editor: sharedPatternVm.editor,
    meta: buildProtocolMetaVm(sharedPatternVm.editor.value, state, selectedTop),
    actions: buildProtocolWorkbenchActionsVm(sharedPatternVm.state, state, selectedTop),
  };
}

export function buildWorkbenchVm(state, selectedTop) {
  return buildProtocolWorkbenchVm(state, selectedTop);
}
