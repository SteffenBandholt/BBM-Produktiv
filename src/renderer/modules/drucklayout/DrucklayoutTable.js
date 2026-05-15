function mm(value) { return `${Number(value || 0)}mm`; }

export function renderDrucklayoutTable({ layout, rows }) {
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.tableLayout = "fixed";

  const colgroup = document.createElement("colgroup");
  const colNr = document.createElement("col"); colNr.className = "dl-col-nr"; colNr.style.width = mm(layout.columns.nr.widthMm);
  const colText = document.createElement("col"); colText.className = "dl-col-text";
  const colMeta = document.createElement("col"); colMeta.className = "dl-col-meta"; colMeta.style.width = mm(layout.columns.meta.widthMm);
  colgroup.append(colNr, colText, colMeta);

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const title of ["TOP-Nr", "Gegenstand", "Meta"]) {
    const th = document.createElement("th");
    th.textContent = title;
    th.style.textAlign = "left";
    th.style.fontSize = "8pt";
    th.style.borderBottom = "0.2mm solid #111827";
    th.style.paddingBottom = "1.2mm";
    headRow.append(th);
  }
  thead.append(headRow);

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    const tdNr = document.createElement("td"); const tdText = document.createElement("td"); const tdMeta = document.createElement("td");
    tdNr.textContent = row.nr;
    tdNr.style.verticalAlign = "top";
    tdNr.style.fontWeight = "650";
    tdNr.style.fontSize = `${row.level === 1 ? layout.textStyles.level1NrPt : layout.textStyles.level2To4NrPt}pt`;

    const short = document.createElement("div"); short.textContent = row.short; short.style.fontSize = `${layout.textStyles.shortPt}pt`; short.style.fontWeight = "600";
    const long = document.createElement("div"); long.textContent = row.long; long.style.marginTop = "1.2mm"; long.style.fontSize = `${layout.textStyles.longPt}pt`;
    tdText.append(short, long);

    tdMeta.textContent = row.meta;
    tdMeta.style.whiteSpace = "pre-line";
    tdMeta.style.fontSize = `${layout.textStyles.metaPt}pt`;

    tdNr.style.paddingLeft = mm(layout.columns.nr.padLeftMm); tdNr.style.paddingRight = mm(layout.columns.nr.padRightMm);
    tdText.style.paddingLeft = mm(layout.columns.text.padLeftMm); tdText.style.paddingRight = mm(layout.columns.text.padRightMm);
    tdMeta.style.paddingLeft = mm(layout.columns.meta.padLeftMm); tdMeta.style.paddingRight = mm(layout.columns.meta.padRightMm);
    tr.append(tdNr, tdText, tdMeta);
    tbody.append(tr);
  }

  table.append(colgroup, thead, tbody);
  return { table, colgroup, thead };
}
