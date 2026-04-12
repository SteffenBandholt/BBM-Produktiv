// TOPS-V2 domain policy: zentrale Aktionsfreigabe-Regeln (rein funktional).

export function hasChildren(tops, topId) {
  const list = Array.isArray(tops) ? tops : [];
  const key = String(topId ?? "");
  return list.some((t) => String(t?.parent_top_id ?? "") === key);
}

export function isBlue(top) {
  return Number(top?.is_carried_over) !== 1;
}

export function isAllowedMoveTarget(target, movingTop) {
  if (!movingTop || !target) return false;
  if (String(target.id) === String(movingTop.id)) return false;
  const level = Number(target.level);
  if (!Number.isFinite(level)) return false;
  return level >= 1 && level <= 3;
}

export function canCreateChild({ isReadOnly, selectedTop }) {
  if (isReadOnly || !selectedTop) return false;
  const level = Number(selectedTop.level);
  return Number.isFinite(level) && level < 4;
}

export function canDelete({ isReadOnly, selectedTop, tops }) {
  if (isReadOnly || !selectedTop) return false;
  if (!isBlue(selectedTop)) return false;
  if (hasChildren(tops, selectedTop.id)) return false;
  return true;
}

export function canMove({ isReadOnly, selectedTop, tops }) {
  if (isReadOnly || !selectedTop) return false;
  if (!isBlue(selectedTop)) return false;
  if (hasChildren(tops, selectedTop.id)) return false;
  return true;
}

export function canCreateChildFromState(state, selectedTop) {
  return canCreateChild({
    isReadOnly: !!state?.isReadOnly,
    selectedTop,
  });
}

export function canDeleteFromState(state, selectedTop) {
  return canDelete({
    isReadOnly: !!state?.isReadOnly,
    selectedTop,
    tops: state?.tops,
  });
}

export function canMoveFromState(state, selectedTop) {
  return canMove({
    isReadOnly: !!state?.isReadOnly,
    selectedTop,
    tops: state?.tops,
  });
}
