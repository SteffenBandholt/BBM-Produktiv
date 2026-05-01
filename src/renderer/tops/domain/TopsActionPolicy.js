// TOPS-V2 domain policy: zentrale Aktionsfreigabe-Regeln (rein funktional).

export function hasChildren(tops, topId) {
  const list = Array.isArray(tops) ? tops : [];
  const key = String(topId ?? "");
  return list.some((t) => String(t?.parent_top_id ?? "") === key);
}

export function isBlue(top) {
  return Number(top?.is_carried_over) !== 1;
}

function isDescendantOf(topId, ancestorId, tops) {
  const list = Array.isArray(tops) ? tops : [];
  const byId = new Map(list.map((top) => [String(top?.id ?? ""), top]));
  let current = byId.get(String(topId ?? "")) || null;
  let guard = 0;

  while (current && guard < 100) {
    const parentId = current?.parent_top_id ?? null;
    if (parentId === null || parentId === undefined || parentId === "") return false;
    if (String(parentId) === String(ancestorId ?? "")) return true;
    current = byId.get(String(parentId)) || null;
    guard += 1;
  }

  return false;
}

export function isAllowedMoveTarget(target, movingTop, tops = []) {
  if (!movingTop || !target) return false;
  if (String(target.id) === String(movingTop.id)) return false;
  const level = Number(target.level);
  if (!Number.isFinite(level)) return false;
  if (isDescendantOf(target.id, movingTop.id, tops)) return false;
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
