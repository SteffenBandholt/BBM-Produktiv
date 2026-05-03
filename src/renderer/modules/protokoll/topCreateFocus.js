function getSafeTopIdSelector(topId) {
  const id = String(topId ?? "").trim();
  if (!id) return "";
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(id);
  }
  return id;
}

export function findTopRowElement(topsListRoot, topId) {
  const safeId = getSafeTopIdSelector(topId);
  if (!safeId) return null;
  return topsListRoot?.querySelector?.(`[data-top-id="${safeId}"]`) || null;
}

export function findScrollableParent(node) {
  let current = node?.parentElement || null;
  while (current) {
    const style =
      typeof window !== "undefined" && typeof window.getComputedStyle === "function"
        ? window.getComputedStyle(current)
        : null;
    const overflowY = String(style?.overflowY || "").toLowerCase();
    const scrollable =
      (overflowY === "auto" || overflowY === "scroll") &&
      Number(current.scrollHeight || 0) > Number(current.clientHeight || 0);
    if (scrollable) return current;
    current = current.parentElement || null;
  }
  return null;
}

export function scrollTopRowIntoView(row) {
  if (!row) return false;

  if (typeof row.scrollIntoView === "function") {
    row.scrollIntoView({ block: "nearest", inline: "nearest" });
    return true;
  }

  const scroller = findScrollableParent(row);
  if (scroller && typeof scroller.scrollTop === "number") {
    const rowTop = Number(row.offsetTop || 0);
    const rowBottom = rowTop + Number(row.offsetHeight || 0);
    const visibleTop = Number(scroller.scrollTop || 0);
    const visibleBottom = visibleTop + Number(scroller.clientHeight || 0);

    if (rowBottom > visibleBottom) {
      scroller.scrollTop += rowBottom - visibleBottom;
    } else if (rowTop < visibleTop) {
      scroller.scrollTop -= visibleTop - rowTop;
    }
    return true;
  }

  return false;
}

export async function focusCreatedTopAfterReload({
  createdTopId,
  selectedTopId,
  topsListRoot,
  workbench,
  awaitNextPaint,
} = {}) {
  const targetId = createdTopId ?? selectedTopId ?? null;
  if (targetId === null || targetId === undefined) return false;

  const wait =
    typeof awaitNextPaint === "function" ? awaitNextPaint : () => Promise.resolve();

  await wait();
  const row = findTopRowElement(topsListRoot, targetId);
  scrollTopRowIntoView(row);
  await wait();

  return !!workbench?.focusShortText?.({ select: true });
}
