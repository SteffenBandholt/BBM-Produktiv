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

function buildSharedEditorVm(state, selectedTop) {
  const editorValue = state?.editor || editorFromTop(selectedTop);
  return {
    value: editorValue,
    access: buildSharedEditorAccessVm(state, selectedTop),
  };
}

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

// Protokollspezifische Workbench-Regel:
// Titel auf Level 1 haben in der TOP-Workbench keine operative Meta-Belegung.
function buildProtocolMetaVm(editorValue, state, selectedTop) {
  return {
    value: buildProtocolMetaValueVm(editorValue, selectedTop),
    access: buildProtocolMetaAccessVm(state, selectedTop),
  };
}

function buildWorkbenchActionsVm(state, selectedTop) {
  const isWriting = !!state?.isWriting;
  return {
    hasSelection: !!selectedTop,
    isReadOnly: !!state?.isReadOnly,
    isWriting,
    isMoveMode: !!state?.isMoveMode,
    canSave: !!selectedTop && !state?.isReadOnly && !isWriting,
    canDelete: canDeleteFromState(state, selectedTop) && !isWriting,
    canMove: canMoveFromState(state, selectedTop) && !isWriting,
    canCreateLevel1: !state?.isReadOnly && !isWriting,
    canCreateChild: canCreateChildFromState(state, selectedTop) && !isWriting,
  };
}

export function buildWorkbenchVm(state, selectedTop) {
  const sharedEditorVm = buildSharedEditorVm(state, selectedTop);

  return {
    header: buildHeaderVm(selectedTop),
    editor: sharedEditorVm,
    meta: buildProtocolMetaVm(sharedEditorVm.value, state, selectedTop),
    actions: buildWorkbenchActionsVm(state, selectedTop),
  };
}
