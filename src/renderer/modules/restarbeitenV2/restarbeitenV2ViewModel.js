export function normalizeRestarbeitenV2Filter(filter) {
  const value = String(filter || "").toLowerCase();
  if (value === "offen" || value === "erledigt") return value;
  return "alle";
}

export function findRestarbeitenV2Item(items, id) {
  return Array.isArray(items) ? items.find((item) => item?.id === id) || null : null;
}

export function getVisibleRestarbeitenV2Items(items, filter) {
  const normalizedFilter = normalizeRestarbeitenV2Filter(filter);
  if (normalizedFilter === "alle") return Array.isArray(items) ? items.slice() : [];
  return Array.isArray(items) ? items.filter((item) => item?.status === normalizedFilter) : [];
}

export function getNextSelectedRestarbeitenV2Id(items, filter, currentSelectedId) {
  const visibleItems = getVisibleRestarbeitenV2Items(items, filter);
  if (!visibleItems.length) return null;
  if (currentSelectedId && visibleItems.some((item) => item?.id === currentSelectedId)) {
    return currentSelectedId;
  }
  return visibleItems[0]?.id || null;
}

export function updateRestarbeitenV2Item(items, id, patch) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (item?.id !== id) return item;
    return {
      ...item,
      ...(patch && typeof patch === "object" ? patch : {}),
    };
  });
}
