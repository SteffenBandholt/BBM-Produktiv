import { applyDrucklayoutStyles } from "./DrucklayoutCss.js";
import { getInitialLayoutState, getLayoutById } from "./DrucklayoutLayouts.js";
import { createTopsSampleRows } from "./DrucklayoutSampleData.js";
import { renderDrucklayoutPreview } from "./DrucklayoutRenderer.js";
import { buildCodeValues } from "./DrucklayoutService.js";

export default class DrucklayoutScreen {
  render() {
    const root = document.createElement("div");
    applyDrucklayoutStyles(root);
    const title = document.createElement("h3"); title.textContent = "Drucklayout – Kalibrierung";
    const controls = document.createElement("div"); controls.style.display = "flex"; controls.style.gap = "8px";
    const previewHost = document.createElement("div");
    const code = document.createElement("pre"); code.style.fontSize = "12px"; code.style.whiteSpace = "pre-wrap";
    const state = getInitialLayoutState();
    const layout = getLayoutById(state.selectedLayoutId);
    const rows = createTopsSampleRows();
    const mkBtn = (txt, onClick) => { const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.onclick = onClick; return b; };
    controls.append(
      mkBtn("Vorschau", () => renderDrucklayoutPreview({ mount: previewHost, layout: { ...layout, columns: state.columns }, rows })),
      mkBtn("Standardwerte", () => { const next = getInitialLayoutState(); state.columns = next.columns; }),
      mkBtn("Codewerte anzeigen", () => { code.textContent = buildCodeValues(state); })
    );
    root.append(title, controls, previewHost, code);
    renderDrucklayoutPreview({ mount: previewHost, layout: { ...layout, columns: state.columns }, rows });
    return root;
  }
}
