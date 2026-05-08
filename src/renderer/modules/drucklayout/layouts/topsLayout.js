export const TOPS_LAYOUT_ID = "tops";

export const topsLayout = Object.freeze({
  id: TOPS_LAYOUT_ID,
  label: "TOP-Liste / Protokoll",
  page: Object.freeze({
    widthMm: 210,
    minHeightMm: 297,
    marginTopMm: 12,
    marginRightMm: 12,
    marginBottomMm: 14,
    marginLeftMm: 12,
    headerHeightMm: 28,
  }),
  columns: Object.freeze({
    nr: Object.freeze({ key: "nr", label: "TOP-Nr", widthMm: 19, mode: "fixed", padLeftMm: 0, padRightMm: 0, fontPt: 8.5 }),
    text: Object.freeze({ key: "text", label: "Gegenstand", widthMm: null, mode: "rest", padLeftMm: 0, padRightMm: 1, fontPt: 8.5 }),
    meta: Object.freeze({ key: "meta", label: "Meta", widthMm: 40, mode: "fixed", padLeftMm: 2, padRightMm: 1, fontPt: 6.5 }),
  }),
  textStyles: Object.freeze({ level1NrPt: 10, level2To4NrPt: 8.5, shortPt: 8.5, longPt: 7.5, metaPt: 6.5 }),
});
