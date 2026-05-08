import { renderDrucklayoutTable } from "./DrucklayoutTable.js";

export function renderDrucklayoutPreview({ mount, layout, rows }) {
  mount.innerHTML = "";
  const page = document.createElement("div");
  page.style.width = `${layout.page.widthMm}mm`;
  page.style.minHeight = `${layout.page.minHeightMm}mm`;
  page.style.background = "#fff";
  page.style.border = "1px solid #cbd5e1";
  page.style.boxShadow = "0 4px 14px rgba(15,23,42,0.12)";
  page.style.padding = `${layout.page.marginTopMm}mm ${layout.page.marginRightMm}mm ${layout.page.marginBottomMm}mm ${layout.page.marginLeftMm}mm`;
  const header = document.createElement("div");
  header.textContent = "Fester Seitenkopf (v2-Vorlage)";
  header.style.height = `${layout.page.headerHeightMm}mm`;
  header.style.borderBottom = "1px solid #94a3b8";
  header.style.marginBottom = "4mm";
  header.style.display = "flex";
  header.style.alignItems = "center";
  const { table } = renderDrucklayoutTable({ layout, rows });
  page.append(header, table);
  mount.append(page);
}
