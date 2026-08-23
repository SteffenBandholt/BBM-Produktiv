const ATTRIBUTE_NAMES = Object.freeze({
  id: "data-ui-inspector-id",
  kind: "data-ui-editor-kind",
  label: "data-ui-editor-label",
  parent: "data-ui-editor-parent",
  editable: "data-ui-editor-editable",
  operations: "data-ui-editor-ops",
});

function stateMap(data) {
  return new Map((data?.pdfEditorLayoutState?.elements || []).map((entry) => [entry.elementId, entry]));
}

function registryEntries(data) {
  return Array.isArray(data?.pdfEditorRegistry?.elements) ? data.pdfEditorRegistry.elements : [];
}

function clone(value) {
  return value === null || value === undefined ? value : structuredClone(value);
}

export function prepareBbmPdfEditorLayout(data) {
  if (!data?.pdfEditorLayoutState || !data?.pdfEditorRegistry) return data;
  const states = stateMap(data);
  const entries = registryEntries(data);
  const pageEntry = entries.find((entry) => entry.kind === "page" && entry.capabilities?.includes("setPageMargins"));
  const page = pageEntry ? states.get(pageEntry.id) : null;
  if (pageEntry && page) {
    data.v2Layout = {
      ...(data.v2Layout || {}),
      pagePadTopMm: Number(page.marginTop),
      pagePadRightMm: Number(page.marginRight),
      pagePadBottomMm: Number(page.marginBottom),
      pagePadLeftMm: Number(page.marginLeft),
    };
  }
  const headerEntry = entries.find((entry) => entry.kind === "header" && entry.capabilities?.includes("resizeHeight"));
  const header = headerEntry ? states.get(headerEntry.id) : null;
  if (headerEntry && header) data.v2Layout = { ...(data.v2Layout || {}), editorHeaderHeightMm: Number(header.height) };
  const bindings = entries.filter((entry) => entry.layoutBinding?.type === "tableLayoutColumnWidth");
  for (const tableLayoutKey of [...new Set(bindings.map((entry) => entry.layoutBinding.tableLayoutKey))]) {
    const resolved = data?.tableLayouts?.[tableLayoutKey];
    if (!resolved?.effectiveLayout) continue;
    const effective = clone(resolved.effectiveLayout);
    effective.pdf = effective.pdf || {};
    effective.pdf.columns = effective.pdf.columns || {};
    for (const entry of bindings.filter((candidate) => candidate.layoutBinding.tableLayoutKey === tableLayoutKey)) {
      const current = states.get(entry.id);
      const columnKey = entry.layoutBinding.columnKey;
      if (current && columnKey) effective.pdf.columns[columnKey] = { ...(effective.pdf.columns[columnKey] || {}), width: `${Number(current.width)}mm` };
    }
    data.tableLayouts = { ...(data.tableLayouts || {}), [tableLayoutKey]: { ...resolved, effectiveLayout: effective } };
  }
  return data;
}

function nodesFor(root, entry) {
  if (entry.kind === "document") return [root];
  try { return Array.from(root.querySelectorAll(entry.rendererKey)); }
  catch (_error) { return []; }
}

function applyAttributes(node, entry) {
  node.setAttribute(ATTRIBUTE_NAMES.id, entry.id);
  node.setAttribute(ATTRIBUTE_NAMES.kind, entry.kind);
  node.setAttribute(ATTRIBUTE_NAMES.label, entry.name);
  node.setAttribute(ATTRIBUTE_NAMES.parent, entry.parentId || "");
  node.setAttribute(ATTRIBUTE_NAMES.editable, String(entry.editable === true));
  node.setAttribute(ATTRIBUTE_NAMES.operations, (entry.allowedOps || entry.capabilities || []).join(","));
}

function changed(value, baseline) {
  return Number.isFinite(Number(value)) && Number.isFinite(Number(baseline)) && Math.abs(Number(value) - Number(baseline)) > 0.000001;
}

function applyStyle(node, entry, current) {
  const baseline = entry.baseline || {};
  const hiddenColumn = entry.kind === "tableColumn" && Number(current.width) === 0;
  const visibilityClass = entry.layoutBinding?.type === "visibilityClass"
    ? String(entry.layoutBinding.className || "").trim()
    : "";
  if (visibilityClass) node.classList.toggle(visibilityClass, current.visible !== false);
  else if (current.visible === false || hiddenColumn) node.style.display = "none";
  else if (entry.kind === "tableColumn") node.style.display = "";
  if (entry.capabilities?.includes("move") && (changed(current.x, baseline.x) || changed(current.y, baseline.y))) {
    node.style.position = "relative";
    node.style.left = `${Number(current.x) - Number(baseline.x)}mm`;
    node.style.top = `${Number(current.y) - Number(baseline.y)}mm`;
  }
  if (entry.kind === "tableColumn" &&
      (entry.capabilities?.includes("resize") || entry.capabilities?.includes("resizeWidth")) &&
      Number.isFinite(Number(current.width))) {
    node.style.width = `${Number(current.width)}mm`;
    node.style.minWidth = `${Number(current.width)}mm`;
    node.style.maxWidth = `${Number(current.width)}mm`;
  } else if ((entry.capabilities?.includes("resize") || entry.capabilities?.includes("resizeWidth")) && changed(current.width, baseline.width)) {
    node.style.width = `${Number(current.width)}mm`;
    node.style.maxWidth = `${Number(current.width)}mm`;
  }
  if ((entry.capabilities?.includes("resize") || entry.capabilities?.includes("resizeHeight")) && changed(current.height, baseline.height)) {
    node.style.height = `${Number(current.height)}mm`;
    node.style.minHeight = `${Number(current.height)}mm`;
  }
  if (entry.capabilities?.includes("textMove") &&
      (changed(current.textOffsetX, baseline.textOffsetX) || changed(current.textOffsetY, baseline.textOffsetY))) {
    node.style.position = "relative";
    node.style.left = `${Number(current.textOffsetX) - Number(baseline.textOffsetX || 0)}mm`;
    node.style.top = `${Number(current.textOffsetY) - Number(baseline.textOffsetY || 0)}mm`;
  }
  if (entry.capabilities?.includes("textResize") && Number.isFinite(Number(current.fontSize))) node.style.fontSize = `${Number(current.fontSize)}pt`;
  if (entry.capabilities?.includes("setTextAlignment") && current.textAlignment) node.style.textAlign = current.textAlignment;
  if (entry.capabilities?.includes("setLineSpacing") && Number.isFinite(Number(current.lineSpacing))) node.style.lineHeight = String(Number(current.lineSpacing));
}

function columnPart(node, entry) {
  if (entry.kind !== "tableColumn") return null;
  if (String(node.tagName || "").toLowerCase() === "col") return "track";
  if (node.closest?.("thead")) return "header";
  if (node.closest?.("tbody")) return "data";
  return "column";
}

export function applyBbmPdfEditorLayout(root, data) {
  if (!root || !data?.pdfEditorLayoutState || !data?.pdfEditorRegistry) return root;
  const states = stateMap(data);
  const pageEntry = registryEntries(data).find((entry) => entry.kind === "page" && entry.capabilities?.includes("setPageMargins"));
  const page = pageEntry ? states.get(pageEntry.id) : null;
  if (pageEntry && page) {
    root.style.setProperty("--v2-pad-top", `${Number(page.marginTop)}mm`);
    root.style.setProperty("--v2-pad-right", `${Number(page.marginRight)}mm`);
    root.style.setProperty("--v2-pad-bottom", `${Number(page.marginBottom)}mm`);
    root.style.setProperty("--v2-pad-left", `${Number(page.marginLeft)}mm`);
  }
  for (const tableEntry of registryEntries(data).filter((entry) => entry.kind === "table")) {
    const columns = registryEntries(data)
      .filter((entry) => entry.kind === "tableColumn" && entry.parentId === tableEntry.id)
      .sort((left, right) => left.order - right.order);
    if (columns.length === 0 || columns.some((column) => !states.has(column.id))) continue;
    const tableWidth = columns.reduce((sum, column) => sum + Number(states.get(column.id).width || 0), 0);
    for (const registeredNode of nodesFor(root, tableEntry)) {
      const tableNodes = String(registeredNode.tagName || "").toLowerCase() === "table"
        ? [registeredNode]
        : Array.from(registeredNode.querySelectorAll?.("table") || []);
      for (const tableNode of tableNodes) {
        tableNode.style.width = `${tableWidth}mm`;
        tableNode.style.maxWidth = `${tableWidth}mm`;
      }
    }
  }
  for (const entry of registryEntries(data)) {
    const current = states.get(entry.id);
    if (!current) continue;
    for (const node of nodesFor(root, entry)) {
      applyAttributes(node, entry);
      applyStyle(node, entry, current);
    }
  }
  return root;
}

function round(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

export function collectBbmPdfPreviewMetadata(root, data) {
  if (!root || !data?.pdfEditorRegistry) return { pageCount: 0, renderBounds: [] };
  const pages = Array.from(root.querySelectorAll(".page"));
  const states = stateMap(data);
  const renderBounds = [];
  for (const entry of registryEntries(data)) {
    for (const node of nodesFor(root, entry)) {
      if (node.style?.display === "none") continue;
      const page = node.closest?.(".page") || pages[0];
      if (!page) continue;
      const pageNumber = Math.max(1, pages.indexOf(page) + 1);
      const pageRect = page.getBoundingClientRect();
      const rect = entry.kind === "document" ? pageRect : node.getBoundingClientRect();
      if (!(pageRect.width > 0 && pageRect.height > 0 && rect.width > 0 && rect.height > 0)) continue;
      const pageWidthMm = String(data?.orientation || "portrait") === "landscape" ? 297 : 210;
      const pageHeightMm = String(data?.orientation || "portrait") === "landscape" ? 210 : 297;
      const computed = globalThis.getComputedStyle?.(node) || node.style || {};
      const current = states.get(entry.id);
      const canMove = entry.capabilities?.includes("move") && current;
      const offsetX = Number.parseFloat(computed?.left);
      const offsetY = Number.parseFloat(computed?.top);
      const appliedX = canMove && Number.isFinite(Number(entry.baseline?.x))
        ? round(Number(entry.baseline.x) + (Number.isFinite(offsetX) ? offsetX * pageWidthMm / pageRect.width : 0))
        : undefined;
      const appliedY = canMove && Number.isFinite(Number(entry.baseline?.y))
        ? round(Number(entry.baseline.y) + (Number.isFinite(offsetY) ? offsetY * pageHeightMm / pageRect.height : 0))
        : undefined;
      const part = columnPart(node, entry);
      const contentWidth = part && part !== "track" && Number(node.scrollWidth) > 0
        ? round(Number(node.scrollWidth) * pageWidthMm / pageRect.width)
        : undefined;
      const measuredBox = {
        x: round((rect.left - pageRect.left) * pageWidthMm / pageRect.width),
        y: round((rect.top - pageRect.top) * pageHeightMm / pageRect.height),
        width: round(rect.width * pageWidthMm / pageRect.width),
        height: round(rect.height * pageHeightMm / pageRect.height),
      };
      if (part === "track" && canMove) {
        measuredBox.x = round(Number(current.x));
        measuredBox.y = round(Number(current.y));
      }
      renderBounds.push({
        elementId: entry.id,
        pageNumber,
        ...(part ? { part } : {}),
        ...(contentWidth === undefined ? {} : { contentWidth }),
        ...(appliedX === undefined ? {} : { appliedX }),
        ...(appliedY === undefined ? {} : { appliedY }),
        box: measuredBox,
      });
    }
  }
  return { pageCount: pages.length, renderBounds };
}
