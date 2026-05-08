export function buildCodeValues(layoutState) {
  const c = layoutState.columns;
  return `columns: {\n  nr: { widthMm: ${c.nr.widthMm}, padLeftMm: ${c.nr.padLeftMm}, padRightMm: ${c.nr.padRightMm} },\n  text: { mode: "rest", padLeftMm: ${c.text.padLeftMm}, padRightMm: ${c.text.padRightMm} },\n  meta: { widthMm: ${c.meta.widthMm}, padLeftMm: ${c.meta.padLeftMm}, padRightMm: ${c.meta.padRightMm} }\n}`;
}
