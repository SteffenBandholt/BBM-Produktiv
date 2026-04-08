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

// Protokollspezifische Workbench-Regel:
// Titel auf Level 1 haben in der TOP-Workbench keine operative Meta-Belegung.
function buildProtocolMetaVm(editorValue, state, selectedTop) {
  const isWriting = !!state?.isWriting;
  const isTitleLevel = Number(selectedTop?.level || 1) === 1;
  return {
    value: {
      due_date: editorValue?.due_date ?? null,
      status: editorValue?.status ?? "-",
      responsible_label: isTitleLevel ? "" : editorValue?.responsible_label ?? "",
    },
    access: {
      disabled: !!state?.isReadOnly || isWriting,
      responsibleDisabled: !!state?.isReadOnly || isWriting || isTitleLevel,
    },
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
