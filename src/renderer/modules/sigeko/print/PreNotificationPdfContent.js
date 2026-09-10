const DOCUMENT_TYPE = "sigeko-vorankuendigung";
const SCOPE = "pdf.bbm.sigeko-vorankuendigung";
const suffixOf = entry => entry.id === SCOPE ? "" : entry.id.slice(SCOPE.length + 1);
const string = value => String(value ?? "");
const date = value => value ? value.slice(8, 10) + "." + value.slice(5, 7) + "." + value.slice(0, 4) : "";
function invalid(message) { throw Object.assign(new Error(message), { code: "PDF_PROVIDER_DATA_INVALID" }); }
function overflow(entry, detail = "Text passt nicht vollständig auf die Formularseite.") {
  throw Object.assign(new Error(`Vorankündigung – ${entry.name}: ${detail}`),
    { code: "PDF_PROVIDER_LAYOUT_OVERFLOW", elementId: entry.id, field: suffixOf(entry) });
}
function definitions(data) {
  const registry = data?.pdfEditorRegistry;
  if (registry?.documentTypeId !== DOCUMENT_TYPE || registry.scopeId !== SCOPE || registry.layoutModel !== "fixed-layout" ||
      !Array.isArray(registry.elements) || registry.elements.length !== 81) invalid("Vorankündigungs-PDF-Vertrag fehlt oder ist unvollständig.");
  return registry.elements;
}
function fieldValues(form) {
  const values = { "authority.name": form.authority?.organization,
    "authority.street": form.authority?.street, "authority.zip": form.authority?.zip, "authority.city": form.authority?.city,
    "p1.street": form.address.street, "p1.zip": form.address.zip, "p1.city": form.address.city,
    "p3.value": form.buildingType, "p6.start.value": date(form.plannedStart), "p6.duration.value": form.durationMonths,
    "p7.value": form.maxWorkers, "p8.employers.value": form.employerCount, "p8.selfEmployed.value": form.selfEmployedCount,
    "p9.value": form.firmsMode === "attachment" ? "Firmenliste siehe Anlage" : "Noch nicht bekannt" };
  for (const [prefix, contact, missing] of [["p2", form.builder, "Noch nicht angegeben"],
    ["p4", form.thirdParty, "Nicht vorhanden"], ["p5.planning", form.planning, "Noch nicht angegeben"],
    ["p5.execution", form.execution, "Noch nicht angegeben"]]) {
    for (const key of ["name", "street", "zip", "city", "phone", "email"]) {
      const value = contact?.[key];
      values[`${prefix}.${key}`] = key === "name" && !contact ? missing
        : value && key === "phone" ? `Telefon: ${value}` : value && key === "email" ? `E-Mail: ${value}` : value;
    }
  }
  return values;
}
// A declared fixed form grid, not a pager. The outer body stays in PrintShell's
// normal document flow below its actual shared header. No absolute page offset.
function placeChildren(parentNode, parent, children, nodes) {
  if (!children.length) return;
  const box = parent.baseline;
  const axes = ["x", "y"].map((axis, index) => {
    const extent = index === 0 ? "width" : "height";
    return [...new Set([box[axis], box[axis] + box[extent], ...children.flatMap(child =>
      [child.baseline[axis], child.baseline[axis] + child.baseline[extent]])])].sort((a, b) => a - b);
  });
  parentNode.style.display = "grid";
  parentNode.style.gridTemplateColumns = axes[0].slice(1).map((value, index) => `${value - axes[0][index]}mm`).join(" ");
  parentNode.style.gridTemplateRows = axes[1].slice(1).map((value, index) => `${value - axes[1][index]}mm`).join(" ");
  for (const child of children) {
    const node = nodes.get(child.id), b = child.baseline;
    node.style.gridColumn = `${axes[0].indexOf(b.x) + 1} / ${axes[0].indexOf(b.x + b.width) + 1}`;
    node.style.gridRow = `${axes[1].indexOf(b.y) + 1} / ${axes[1].indexOf(b.y + b.height) + 1}`;
    parentNode.appendChild(node);
  }
}
export function buildPreNotificationPdfContent(data) {
  const content = data?.providerDocument, snapshot = content?.snapshot;
  if (data?.mode !== "provider" || data.documentTypeId !== DOCUMENT_TYPE || content?.kind !== DOCUMENT_TYPE ||
      snapshot?.documentTypeId !== DOCUMENT_TYPE || snapshot.schemaVersion !== 1 || snapshot.projectId !== data.projectId ||
      snapshot.documentId !== data.documentId || !snapshot.form?.address) invalid("Vorankündigungs-Snapshot fehlt oder gehört zu einem anderen Dokument.");
  const entries = definitions(data), values = fieldValues(snapshot.form), nodes = new Map();
  const bodyEntries = entries.filter(entry => entry.pageArea === "body");
  for (const entry of bodyEntries) {
    const suffix = suffixOf(entry), element = document.createElement("div");
    if (suffix === "body") element.className = "sigekoVaBody";
    else element.setAttribute("data-sigeko-va-pdf", suffix);
    element.style.cssText = "box-sizing:border-box;min-width:0;min-height:0;margin:0;padding:0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.15;align-self:stretch";
    const baseline = entry.baseline;
    element.style.width = `${baseline.width}mm`; element.style.height = `${baseline.height}mm`;
    if (entry.kind === "label") element.textContent = entry.name;
    else if (entry.kind === "value") {
      if (!Object.hasOwn(values, suffix)) invalid(`Nicht zugeordnetes Vorankündigungsfeld: ${suffix}`);
      element.textContent = string(values[suffix]);
    }
    if (baseline.fontSize) element.style.fontSize = `${baseline.fontSize}pt`;
    if (suffix === "title" || /^p[1-9]\.label$/.test(suffix)) element.style.fontWeight = "600";
    if (suffix.endsWith(".blank")) { element.style.borderBottom = "0.25mm solid #111"; element.setAttribute("aria-hidden", "true"); }
    nodes.set(entry.id, element);
  }
  for (const entry of bodyEntries) placeChildren(nodes.get(entry.id), entry,
    bodyEntries.filter(child => child.parentId === entry.id), nodes);
  const body = nodes.get(`${SCOPE}.body`);
  if (!body) invalid("Vorankündigungsformular fehlt.");
  return { headerMode: "standard", body };
}
function outside(rect, bounds) {
  return rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1;
}
function visibleTextFits(node, bounds) {
  // Range includes unused font ascent/descent (notably local Noto Sans).
  // Read actual browser baselines instead of increasing overflow tolerance.
  const text = node.firstChild;
  if (node.childNodes.length !== 1 || text.nodeType !== 3) return false;
  const range = document.createRange(), markers = [];
  const edges = ["left", "right", "top", "bottom", "width", "height"];
  const sizes = ["scrollWidth", "scrollHeight", "clientWidth", "clientHeight"];
  try {
    range.selectNodeContents(text);
    const fragments = Array.from(range.getClientRects());
    if (!fragments.length || fragments.some(rect => !edges.every(key => Number.isFinite(rect[key])))) return false;
    // Across soft wraps, complex-script shaping may differ from canvas. Keep
    // the original conservative rejection when that cannot be measured here.
    const multiline = fragments.some(rect => rect.top !== fragments[0].top);
    if (multiline && /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(text.textContent)) return false;
    const dimensions = sizes.map(key => node[key]);
    const css = getComputedStyle(node), context = document.createElement("canvas").getContext("2d");
    if (!context || css.writingMode !== "horizontal-tb" || css.textTransform !== "none") return false;
    context.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    context.textBaseline = "alphabetic"; context.direction = css.direction;
    const metrics = context.measureText(text.textContent);
    const ascent = metrics.actualBoundingBoxAscent, descent = metrics.actualBoundingBoxDescent;
    if (![ascent, descent].every(Number.isFinite)) return false;
    for (let i = 0; i < 2; i++) {
      const marker = document.createElement("span"); markers.push(marker);
      marker.style.cssText = "display:inline-block;width:0;height:0;min-width:0;min-height:0;margin:0;padding:0;border:0;vertical-align:baseline;overflow:hidden";
      node.insertBefore(marker, i === 0 ? text : null);
    }
    const after = Array.from(range.getClientRects());
    if (after.length !== fragments.length || after.some((rect, i) => edges.some(key => rect[key] !== fragments[i][key])) ||
        sizes.some((key, i) => node[key] !== dimensions[i])) return false;
    const first = markers[0].getBoundingClientRect().top, last = markers[1].getBoundingClientRect().top;
    return Number.isFinite(first) && Number.isFinite(last) && first <= last &&
      first - ascent >= bounds.top - 1 && last + descent <= bounds.bottom + 1;
  } catch { return false; }
  finally { for (const marker of markers) marker.remove(); range.detach?.(); }
}
export function validatePreNotificationPdfLayout(root, data) {
  const entries = definitions(data), pages = root.querySelectorAll(".page"), footer = root.querySelector(".v2FooterReserveSpacer");
  if (pages.length !== 1 || !footer) invalid("Vorankündigung benötigt genau eine Seite mit gemeinsamer Fußreserve.");
  const page = pages[0], pageRect = page.getBoundingClientRect(), pageStyle = getComputedStyle(page);
  const bounds = { left: pageRect.left + Number.parseFloat(pageStyle.paddingLeft), right: pageRect.right - Number.parseFloat(pageStyle.paddingRight),
    top: pageRect.top + Number.parseFloat(pageStyle.paddingTop), bottom: footer.getBoundingClientRect().top };
  if (!Object.values(bounds).every(Number.isFinite)) invalid("Vorankündigungs-Seitengrenzen konnten nicht gemessen werden.");
  const nodes = new Map();
  for (const entry of entries) {
    const matches = entry.kind === "document" ? [root] : root.querySelectorAll(entry.rendererKey);
    if (matches.length !== 1) invalid(`Vorankündigungsziel fehlt oder ist doppelt: ${entry.name}`);
    nodes.set(entry.id, matches[0]);
  }
  // Name the actual overflowing field before reporting its enclosing body.
  const measured = entries.filter(item => !["document", "page"].includes(item.kind))
    .sort((a, b) => Number(!["label", "value"].includes(a.kind)) - Number(!["label", "value"].includes(b.kind)) || a.order - b.order);
  for (const entry of measured) {
    const node = nodes.get(entry.id), rect = node.getBoundingClientRect(), parent = nodes.get(entry.parentId);
    if (!parent?.contains(node)) invalid(`Vorankündigungs-Parent stimmt nicht: ${entry.name}`);
    if (![rect.left, rect.right, rect.top, rect.bottom, rect.width, rect.height].every(Number.isFinite) || !(rect.width > 0 && rect.height > 0)) overflow(entry, "Der Formularbereich ist nicht sichtbar oder messbar.");
    if (outside(rect, bounds)) overflow(entry, "Der Bereich überschreitet Seitenrand oder Fußreserve.");
    if (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) overflow(entry);
    if (entry.kind === "label" || entry.kind === "value") {
      if (node.textContent && typeof document.createRange === "function") {
        const range = document.createRange(); range.selectNodeContents(node);
        const textRect = range.getBoundingClientRect(); range.detach?.();
        if (textRect.left < rect.left - 1 || textRect.right > rect.right + 1) overflow(entry);
        if ((textRect.top < rect.top - 1 || textRect.bottom > rect.bottom + 1) && !visibleTextFits(node, rect)) overflow(entry);
      }
    }
    const siblings = entries.filter(sibling => sibling.parentId === entry.parentId && sibling.order < entry.order);
    for (const sibling of siblings) {
      const other = nodes.get(sibling.id).getBoundingClientRect();
      if (Math.min(rect.right, other.right) - Math.max(rect.left, other.left) > 1 &&
          Math.min(rect.bottom, other.bottom) - Math.max(rect.top, other.top) > 1) overflow(entry, `Der Bereich überlagert ${sibling.name}.`);
    }
  }
  return root;
}
