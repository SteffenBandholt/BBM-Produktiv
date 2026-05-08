import { applyDrucklayoutStyles } from "./DrucklayoutCss.js";
import { getInitialLayoutState, getLayoutById } from "./DrucklayoutLayouts.js";
import { createTopsSampleRows } from "./DrucklayoutSampleData.js";
import { renderDrucklayoutPreview } from "./DrucklayoutRenderer.js";
import { applyMatrixValuesToState, buildCodeValues, formatRestWidthLabel } from "./DrucklayoutService.js";

export default class DrucklayoutScreen {
  render() {
    const root = document.createElement("div");
    applyDrucklayoutStyles(root);
    const title = document.createElement("h3"); title.textContent = "Drucklayout – Kalibrierung";
    const matrix = document.createElement("div"); matrix.style.display = "grid"; matrix.style.gridTemplateColumns = "repeat(3, minmax(140px, 1fr))"; matrix.style.gap = "8px";
    const controls = document.createElement("div"); controls.style.display = "flex"; controls.style.gap = "8px";
    const previewHost = document.createElement("div");
    const code = document.createElement("pre"); code.style.fontSize = "12px"; code.style.whiteSpace = "pre-wrap";

    const state = getInitialLayoutState();
    const base = getLayoutById(state.selectedLayoutId);
    const rows = createTopsSampleRows();

    const mkNumber = (label, value, key) => {
      const wrap = document.createElement("label"); wrap.style.display = "grid"; wrap.style.gap = "4px";
      const t = document.createElement("span"); t.textContent = label; t.style.fontSize = "12px";
      const i = document.createElement("input"); i.type = "number"; i.value = String(value); i.step = "0.1"; i.dataset.matrixKey = key;
      wrap.append(t, i);
      return { wrap, input: i };
    };

    const inputs = {
      ...Object.fromEntries([]),
    };
    const defs = [
      ["TOP-Nr Breite (mm)", state.columns.nr.widthMm, "nrWidthMm"],
      ["Meta Breite (mm)", state.columns.meta.widthMm, "metaWidthMm"],
      ["Nr Pad links (mm)", state.columns.nr.padLeftMm, "nrPadLeftMm"],
      ["Nr Pad rechts (mm)", state.columns.nr.padRightMm, "nrPadRightMm"],
      ["Text Pad links (mm)", state.columns.text.padLeftMm, "textPadLeftMm"],
      ["Text Pad rechts (mm)", state.columns.text.padRightMm, "textPadRightMm"],
      ["Meta Pad links (mm)", state.columns.meta.padLeftMm, "metaPadLeftMm"],
      ["Meta Pad rechts (mm)", state.columns.meta.padRightMm, "metaPadRightMm"],
      ["TOP-Nr L1 (pt)", state.textStyles.level1NrPt, "level1NrPt"],
      ["TOP-Nr L2-4 (pt)", state.textStyles.level2To4NrPt, "level2To4NrPt"],
      ["Kurztext (pt)", state.textStyles.shortPt, "shortPt"],
      ["Langtext (pt)", state.textStyles.longPt, "longPt"],
      ["Meta (pt)", state.textStyles.metaPt, "metaPt"],
    ];
    for (const [label, value, key] of defs) {
      const { wrap, input } = mkNumber(label, value, key);
      inputs[key] = input;
      matrix.append(wrap);
    }
    const restLabel = document.createElement("div");
    restLabel.style.fontSize = "12px";
    restLabel.style.gridColumn = "1 / -1";
    matrix.append(restLabel);

    const rerender = () => {
      const merged = applyMatrixValuesToState(state, inputs);
      Object.assign(state, merged);
      const runtimeLayout = { ...base, page: state.page, columns: state.columns, textStyles: state.textStyles };
      restLabel.textContent = formatRestWidthLabel(runtimeLayout);
      renderDrucklayoutPreview({ mount: previewHost, layout: runtimeLayout, rows });
    };

    const reset = () => {
      const defaults = getInitialLayoutState();
      Object.assign(state, defaults);
      for (const [, , key] of defs) inputs[key].value = String(defaults.columns.nr[key] ?? defaults.columns.meta[key] ?? defaults.columns.text[key] ?? defaults.textStyles[key]);
      inputs.nrWidthMm.value = String(defaults.columns.nr.widthMm);
      inputs.metaWidthMm.value = String(defaults.columns.meta.widthMm);
      inputs.nrPadLeftMm.value = String(defaults.columns.nr.padLeftMm);
      inputs.nrPadRightMm.value = String(defaults.columns.nr.padRightMm);
      inputs.textPadLeftMm.value = String(defaults.columns.text.padLeftMm);
      inputs.textPadRightMm.value = String(defaults.columns.text.padRightMm);
      inputs.metaPadLeftMm.value = String(defaults.columns.meta.padLeftMm);
      inputs.metaPadRightMm.value = String(defaults.columns.meta.padRightMm);
      inputs.level1NrPt.value = String(defaults.textStyles.level1NrPt);
      inputs.level2To4NrPt.value = String(defaults.textStyles.level2To4NrPt);
      inputs.shortPt.value = String(defaults.textStyles.shortPt);
      inputs.longPt.value = String(defaults.textStyles.longPt);
      inputs.metaPt.value = String(defaults.textStyles.metaPt);
      rerender();
    };

    const mkBtn = (txt, onClick) => { const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.onclick = onClick; return b; };
    controls.append(
      mkBtn("Vorschau", () => rerender()),
      mkBtn("Standardwerte", () => reset()),
      mkBtn("Codewerte anzeigen", () => { code.textContent = buildCodeValues(state); })
    );

    root.append(title, matrix, controls, previewHost, code);
    rerender();
    return root;
  }
}
