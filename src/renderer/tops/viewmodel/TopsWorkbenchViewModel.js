export function buildWorkbenchHeaderState(state, selectedTop) {
  const displayNumber = String(
    selectedTop?.displayNumber ??
      selectedTop?.number ??
      ""
  ).trim();

  return {
    title: displayNumber ? `TOP ${displayNumber}. bearbeiten` : "TOP bearbeiten",
  };
}

export function buildWorkbenchEditorState(state, selectedTop) {
  const isReadOnly = !!state?.isReadOnly;
  const hasSelection = !!selectedTop;

  const isCarriedOver =
    Number(selectedTop?.is_carried_over ?? selectedTop?.isCarriedOver) === 1;

  return {
    hasSelection,
    isReadOnly,
    shortTextReadOnly: !isReadOnly && isCarriedOver,
    longTextReadOnly: false,
    flagsDisabled: false,
  };
}

export function buildWorkbenchMetaState(state) {
  return {
    disabled: !!state?.isReadOnly,
  };
}
