import { topsLayout, TOPS_LAYOUT_ID } from "./layouts/topsLayout.js";

export function getInitialLayoutState() {
  return {
    selectedLayoutId: TOPS_LAYOUT_ID,
    columns: {
      nr: { ...topsLayout.columns.nr },
      text: { ...topsLayout.columns.text },
      meta: { ...topsLayout.columns.meta },
    },
  };
}

export function getLayoutById(layoutId) {
  if (String(layoutId || "").trim() === TOPS_LAYOUT_ID) return topsLayout;
  return topsLayout;
}
