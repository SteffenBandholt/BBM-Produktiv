function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function applyMatrixValuesToState(layoutState, matrixInputs) {
  const next = {
    ...layoutState,
    columns: {
      nr: { ...layoutState.columns.nr },
      text: { ...layoutState.columns.text },
      meta: { ...layoutState.columns.meta },
    },
    textStyles: { ...(layoutState.textStyles || {}) },
  };

  next.columns.nr.widthMm = toNumber(matrixInputs.nrWidthMm?.value, next.columns.nr.widthMm);
  next.columns.meta.widthMm = toNumber(matrixInputs.metaWidthMm?.value, next.columns.meta.widthMm);

  next.columns.nr.padLeftMm = toNumber(matrixInputs.nrPadLeftMm?.value, next.columns.nr.padLeftMm);
  next.columns.nr.padRightMm = toNumber(matrixInputs.nrPadRightMm?.value, next.columns.nr.padRightMm);
  next.columns.text.padLeftMm = toNumber(matrixInputs.textPadLeftMm?.value, next.columns.text.padLeftMm);
  next.columns.text.padRightMm = toNumber(matrixInputs.textPadRightMm?.value, next.columns.text.padRightMm);
  next.columns.meta.padLeftMm = toNumber(matrixInputs.metaPadLeftMm?.value, next.columns.meta.padLeftMm);
  next.columns.meta.padRightMm = toNumber(matrixInputs.metaPadRightMm?.value, next.columns.meta.padRightMm);

  next.textStyles.level1NrPt = toNumber(matrixInputs.level1NrPt?.value, next.textStyles.level1NrPt);
  next.textStyles.level2To4NrPt = toNumber(matrixInputs.level2To4NrPt?.value, next.textStyles.level2To4NrPt);
  next.textStyles.shortPt = toNumber(matrixInputs.shortPt?.value, next.textStyles.shortPt);
  next.textStyles.longPt = toNumber(matrixInputs.longPt?.value, next.textStyles.longPt);
  next.textStyles.metaPt = toNumber(matrixInputs.metaPt?.value, next.textStyles.metaPt);

  return next;
}

export function formatRestWidthLabel(layout) {
  return `Restbreite = 100% - ${layout.columns.nr.widthMm}mm - ${layout.columns.meta.widthMm}mm`;
}

export function buildCodeValues(layoutState) {
  const c = layoutState.columns;
  const t = layoutState.textStyles;
  return `columns: {\n  nr: { widthMm: ${c.nr.widthMm}, padLeftMm: ${c.nr.padLeftMm}, padRightMm: ${c.nr.padRightMm} },\n  text: { mode: "rest", padLeftMm: ${c.text.padLeftMm}, padRightMm: ${c.text.padRightMm} },\n  meta: { widthMm: ${c.meta.widthMm}, padLeftMm: ${c.meta.padLeftMm}, padRightMm: ${c.meta.padRightMm} }\n},\ntextStyles: {\n  level1NrPt: ${t.level1NrPt},\n  level2To4NrPt: ${t.level2To4NrPt},\n  shortPt: ${t.shortPt},\n  longPt: ${t.longPt},\n  metaPt: ${t.metaPt}\n}`;
}
