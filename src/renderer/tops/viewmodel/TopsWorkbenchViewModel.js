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

function buildEditorAccessVm(state, selectedTop) {
  const isReadOnly = !!state?.isReadOnly;
  const isCarriedOver =
    Number(selectedTop?.is_carried_over ?? selectedTop?.isCarriedOver) === 1;

  return {
    shortTextReadOnly: !isReadOnly && isCarriedOver,
    longTextReadOnly: false,
    flagsDisabled: false,
  };
}

function buildMetaVm(editorValue, state, selectedTop) {
  const isTitleLevel = Number(selectedTop?.level || 1) === 1;
  return {
    value: {
      due_date: editorValue?.due_date ?? null,
      status: editorValue?.status ?? "-",
      responsible_label: isTitleLevel ? "" : editorValue?.responsible_label ?? "",
    },
    access: {
      disabled: !!state?.isReadOnly,
      responsibleDisabled: !!state?.isReadOnly || isTitleLevel,
    },
  };
}

function buildActionsVm(state, selectedTop) {
  return {
    hasSelection: !!selectedTop,
    isReadOnly: !!state?.isReadOnly,
    isMoveMode: !!state?.isMoveMode,
    canSave: !!selectedTop && !state?.isReadOnly,
    canDelete: canDeleteFromState(state, selectedTop),
    canMove: canMoveFromState(state, selectedTop),
    canCreateChild: canCreateChildFromState(state, selectedTop),
  };
}

export function buildWorkbenchVm(state, selectedTop) {
  const editorValue = state?.editor || editorFromTop(selectedTop);

  return {
    header: buildHeaderVm(selectedTop),
    editor: {
      value: editorValue,
      access: buildEditorAccessVm(state, selectedTop),
    },
    meta: buildMetaVm(editorValue, state, selectedTop),
    actions: buildActionsVm(state, selectedTop),
  };
}
