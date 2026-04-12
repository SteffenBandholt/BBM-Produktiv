export function getSelectedTop(state) {
  const tops = Array.isArray(state?.tops) ? state.tops : [];
  const selectedId = state?.selectedTopId;
  if (selectedId === null || selectedId === undefined) return null;
  const key = String(selectedId);
  return tops.find((top) => String(top?.id) === key) || null;
}

export function hasSelection(state) {
  return !!getSelectedTop(state);
}

export function isEditable(state) {
  return !state?.isReadOnly;
}
