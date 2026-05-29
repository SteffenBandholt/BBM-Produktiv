import { createRestarbeitenV2Registry } from "./restarbeitenV2Registry.js";
import { createEditorV2Panel } from "../../uiV2/editorV2/EditorV2Panel.js";

function applyV2Attributes(node, entry) {
  node.setAttribute("data-ui-v2-id", entry.id);
  node.setAttribute("data-ui-v2-kind", entry.kind);
  node.setAttribute("data-ui-v2-label", entry.label);
  node.setAttribute("data-ui-v2-editable", entry.editable ? "true" : "false");
  node.setAttribute("data-ui-v2-ops", Array.isArray(entry.ops) ? entry.ops.join(",") : "");
  if (entry.parentId) {
    node.setAttribute("data-ui-v2-parent", entry.parentId);
  }
  return node;
}

function createNode(doc, tagName, entry, textContent = "") {
  const node = applyV2Attributes(doc.createElement(tagName), entry);
  if (textContent) node.textContent = textContent;
  return node;
}

function createTextBlock(doc, text, className = "") {
  const node = doc.createElement("div");
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

const DUMMY_ROWS = [
  {
    id: "R-001",
    title: "Offene Restarbeit",
    location: "Treppenhaus",
    status: "offen",
    shortText: "Offene Restarbeit",
    longText: "Offene Restarbeit im Treppenhaus",
    meta: "R-001 / offen",
    photos: "Keine Fotos",
    note: "Platzhalternotiz",
  },
  {
    id: "R-002",
    title: "Musterpunkt",
    location: "Wohnung",
    status: "erledigt",
    shortText: "Musterpunkt",
    longText: "Musterpunkt in der Wohnung",
    meta: "R-002 / erledigt",
    photos: "Keine Fotos",
    note: "Platzhalternotiz",
  },
  {
    id: "R-003",
    title: "Kontrollpunkt",
    location: "Außenanlage",
    status: "offen",
    shortText: "Kontrollpunkt",
    longText: "Kontrollpunkt in der Außenanlage",
    meta: "R-003 / offen",
    photos: "Keine Fotos",
    note: "Platzhalternotiz",
  },
];

function cloneDummyRows() {
  return new Map(DUMMY_ROWS.map((row) => [row.id, { ...row }]));
}

function getNextDummyId(dummyRows) {
  let maxNumber = 0;
  for (const id of dummyRows.keys()) {
    const match = String(id || "").match(/^R-(\d+)$/);
    if (!match) continue;
    maxNumber = Math.max(maxNumber, Number(match[1] || 0));
  }
  return `R-${String(maxNumber + 1).padStart(3, "0")}`;
}

function createLocalDummyRow(id) {
  return {
    id,
    title: "Neue Restarbeit",
    location: "Noch ohne Verortung",
    status: "offen",
    shortText: "Neue Restarbeit",
    longText: "Lokaler DEV-Entwurf ohne Speicherung",
    meta: "DEV",
    photos: "Keine Fotos",
    note: "Nur lokale Vorschau",
  };
}

function buildTree(doc, registry) {
  const entries = new Map(registry.map((entry) => [entry.id, entry]));
  const nodes = new Map();

  for (const entry of registry) {
    const tagName = entry.kind === "control" ? "button" : "div";
    const text = String(entry.label || "").trim() || entry.id;
    const node = createNode(doc, tagName, entry, text);
    if (entry.id === "restarbeitenV2.root") {
      node.style.display = "grid";
      node.style.gridTemplateColumns = "1fr 220px";
      node.style.gridTemplateRows = "auto 1fr auto";
      node.style.gridTemplateAreas = '"header quicklane" "main quicklane" "footer footer"';
      node.style.gap = "12px";
      node.style.padding = "12px";
      node.style.boxSizing = "border-box";
    }
    if (entry.id === "restarbeitenV2.quicklane") {
      node.style.gridArea = "quicklane";
      node.style.display = "flex";
      node.style.flexDirection = "column";
      node.style.gap = "8px";
      node.style.alignItems = "stretch";
      node.style.borderLeft = "1px solid rgba(0,0,0,0.12)";
      node.style.paddingLeft = "12px";
    }
    if (entry.id === "restarbeitenV2.header") node.style.gridArea = "header";
    if (entry.id === "restarbeitenV2.main") node.style.gridArea = "main";
    if (entry.id === "restarbeitenV2.footer") node.style.gridArea = "footer";
    nodes.set(entry.id, node);
  }

  for (const entry of registry) {
    const node = nodes.get(entry.id);
    const parentNode = entry.parentId ? nodes.get(entry.parentId) : null;
    if (parentNode) {
      parentNode.append(node);
    }
  }

  const header = nodes.get("restarbeitenV2.header");
  if (header) {
    header.append(createTextBlock(doc, "Restarbeiten V2", "restarbeiten-v2-title"));
  }
  const headerContext = nodes.get("restarbeitenV2.header.context");
  if (headerContext) headerContext.textContent = "Projekt / Bereich / Stand";
  const headerStatus = nodes.get("restarbeitenV2.header.status");
  if (headerStatus) headerStatus.textContent = "Offen / Erledigt / Gesamt";
  const headerFilter = nodes.get("restarbeitenV2.header.filter");
  if (headerFilter) headerFilter.textContent = "Suche / Status / Verortung";

  const quicklane = nodes.get("restarbeitenV2.quicklane");
  if (quicklane) {
    quicklane.append(createTextBlock(doc, "Quicklane rechts", "restarbeiten-v2-quicklane-label"));
  }
  const quicklaneLabels = [
    ["restarbeitenV2.quicklane.lock", "Lock / Fixieren"],
    ["restarbeitenV2.quicklane.neu", "Neu"],
    ["restarbeitenV2.quicklane.filterOffen", "Offen"],
    ["restarbeitenV2.quicklane.filterErledigt", "Erledigt"],
    ["restarbeitenV2.quicklane.filterAlle", "Alle"],
    ["restarbeitenV2.quicklane.foto", "Foto"],
    ["restarbeitenV2.quicklane.diktat", "Diktat"],
  ];
  for (const [id, text] of quicklaneLabels) {
    const node = nodes.get(id);
    if (node) node.textContent = text;
  }

  const main = nodes.get("restarbeitenV2.main");
  const list = nodes.get("restarbeitenV2.main.liste");
  if (main) {
    main.append(createTextBlock(doc, "Main / Liste", "restarbeiten-v2-main-title"));
  }
  if (list) {
    list.append(
      createTextBlock(doc, "R-001 / Offene Restarbeit / Treppenhaus / offen", "restarbeiten-v2-row"),
      createTextBlock(doc, "R-002 / Musterpunkt / Wohnung / erledigt", "restarbeiten-v2-row"),
      createTextBlock(doc, "R-003 / Kontrollpunkt / Außenanlage / offen", "restarbeiten-v2-row")
    );
  }
  const mainLabels = [
    ["restarbeitenV2.main.nummer", "Nummer / Kennung"],
    ["restarbeitenV2.main.textbereich", "Kurztext / Langtext"],
    ["restarbeitenV2.main.verortung", "Verortung"],
    ["restarbeitenV2.main.meta", "Status / Meta"],
  ];
  for (const [id, text] of mainLabels) {
    const node = nodes.get(id);
    if (node) node.textContent = text;
  }

  const footer = nodes.get("restarbeitenV2.footer");
  if (footer) {
    footer.append(createTextBlock(doc, "Footer / Workbench", "restarbeiten-v2-footer-title"));
  }
  const footerLabels = [
    ["restarbeitenV2.footer.kurztext", "Kurztext"],
    ["restarbeitenV2.footer.langtext", "Langtext"],
    ["restarbeitenV2.footer.verortung", "Verortung"],
    ["restarbeitenV2.footer.meta", "Meta"],
    ["restarbeitenV2.footer.fotos", "Fotos"],
    ["restarbeitenV2.footer.notiz", "Notiz"],
  ];
  for (const [id, text] of footerLabels) {
    const node = nodes.get(id);
    if (node) node.textContent = text;
  }

  return nodes.get("restarbeitenV2.root") || null;
}

export function createRestarbeitenV2Screen(options = {}) {
  const registry = Array.isArray(options.registry) ? options.registry : createRestarbeitenV2Registry();
  const editorV2Core = options.editorV2Core || null;
  let rootNode = null;
  let panelNode = null;
  let panelInstance = null;
  let mountedTarget = null;
  let selectedDummyId = "R-001";
  let currentFilter = "alle";
  let dummyRowNodes = new Map();
  let dummyRows = cloneDummyRows();
  let workbenchNodes = {};
  let listNode = null;
  let listRowsHost = null;
  let headerFilterStateNode = null;
  let renderDoc = null;

  function createDummyRowNode(doc, row) {
    const rowNode = doc.createElement("button");
    rowNode.type = "button";
    rowNode.setAttribute("data-restarbeiten-v2-dummy-id", row.id);
    rowNode.setAttribute("data-restarbeiten-v2-dummy-row", "true");
    rowNode.textContent = `${row.id} / ${row.shortText} / ${row.location} / ${row.status}`;
    rowNode.onclick = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      setSelection(row.id);
    };
    return rowNode;
  }

  function appendDummyRow(doc, row) {
    dummyRows.set(row.id, row);
    const rowNode = createDummyRowNode(doc, row);
    dummyRowNodes.set(row.id, rowNode);
    if (listRowsHost && typeof listRowsHost.append === "function") {
      listRowsHost.append(rowNode);
    }
    return rowNode;
  }

  function createAndSelectDummyRow(doc) {
    currentFilter = "alle";
    const nextId = getNextDummyId(dummyRows);
    const row = createLocalDummyRow(nextId);
    appendDummyRow(doc, row);
    setSelection(nextId);
    syncFilterState();
    syncMainList();
    return row;
  }

  function setSelection(nextId) {
    const next = nextId ? dummyRows.get(nextId) || null : null;
    selectedDummyId = next?.id || null;
    for (const [id, node] of dummyRowNodes.entries()) {
      const selected = id === selectedDummyId;
      node.setAttribute("data-restarbeiten-v2-selected", selected ? "true" : "false");
      node.style.background = selected ? "rgba(41, 98, 255, 0.10)" : "transparent";
      node.style.border = selected ? "1px solid rgba(41, 98, 255, 0.5)" : "1px solid transparent";
      node.style.borderRadius = "6px";
      node.style.padding = "4px 6px";
    }
    const current = selectedDummyId ? dummyRows.get(selectedDummyId) || null : null;
    if (current) {
      if (workbenchNodes.selectionNote) {
        workbenchNodes.selectionNote.textContent = `Ausgewählt: ${current.id}`;
      }
      if (workbenchNodes.kurztextInput) workbenchNodes.kurztextInput.value = current.shortText;
      if (workbenchNodes.langtextInput) workbenchNodes.langtextInput.value = current.longText;
      if (workbenchNodes.verortungInput) workbenchNodes.verortungInput.value = current.location;
      if (workbenchNodes.statusSelect) workbenchNodes.statusSelect.value = current.status;
      if (workbenchNodes.notizInput) workbenchNodes.notizInput.value = current.note;
      if (workbenchNodes.kurztextPreview) workbenchNodes.kurztextPreview.textContent = `Kurztext: ${current.shortText}`;
      if (workbenchNodes.langtextPreview) workbenchNodes.langtextPreview.textContent = `Langtext: ${current.longText}`;
      if (workbenchNodes.verortungPreview) workbenchNodes.verortungPreview.textContent = `Verortung: ${current.location}`;
      if (workbenchNodes.metaPreview) workbenchNodes.metaPreview.textContent = `Meta: ${current.meta}`;
      if (workbenchNodes.fotosPreview) workbenchNodes.fotosPreview.textContent = `Fotos: ${current.photos}`;
      if (workbenchNodes.notizPreview) workbenchNodes.notizPreview.textContent = `Notiz: ${current.note}`;
    } else {
      if (workbenchNodes.selectionNote) workbenchNodes.selectionNote.textContent = "Keine Auswahl";
      if (workbenchNodes.kurztextInput) workbenchNodes.kurztextInput.value = "";
      if (workbenchNodes.langtextInput) workbenchNodes.langtextInput.value = "";
      if (workbenchNodes.verortungInput) workbenchNodes.verortungInput.value = "";
      if (workbenchNodes.statusSelect) workbenchNodes.statusSelect.value = "";
      if (workbenchNodes.notizInput) workbenchNodes.notizInput.value = "";
      if (workbenchNodes.kurztextPreview) workbenchNodes.kurztextPreview.textContent = "Kurztext: Keine Auswahl";
      if (workbenchNodes.langtextPreview) workbenchNodes.langtextPreview.textContent = "Langtext: Keine Auswahl";
      if (workbenchNodes.verortungPreview) workbenchNodes.verortungPreview.textContent = "Verortung: Keine Auswahl";
      if (workbenchNodes.metaPreview) workbenchNodes.metaPreview.textContent = "Meta: Keine Auswahl";
      if (workbenchNodes.fotosPreview) workbenchNodes.fotosPreview.textContent = "Fotos: Keine Auswahl";
      if (workbenchNodes.notizPreview) workbenchNodes.notizPreview.textContent = "Notiz: Keine Auswahl";
    }
    if (workbenchNodes.notice) workbenchNodes.notice.textContent = "Nur lokale DEV-Vorschau - keine Speicherung";
    syncFilterState();
    return true;
  }

  function getVisibleRows() {
    return Array.from(dummyRows.values()).filter((row) => currentFilter === "alle" || row.status === currentFilter);
  }

  function syncFilterState() {
    const filterButtons = [
      ["restarbeitenV2.quicklane.filterAlle", "alle"],
      ["restarbeitenV2.quicklane.filterOffen", "offen"],
      ["restarbeitenV2.quicklane.filterErledigt", "erledigt"],
    ];
    for (const [id, filterName] of filterButtons) {
      const button = rootNode?.querySelector?.(`[data-ui-v2-id="${id}"]`) || null;
      if (!button) continue;
      const active = currentFilter === filterName;
      button.setAttribute("data-restarbeiten-v2-filter", filterName);
      button.setAttribute("data-restarbeiten-v2-filter-active", active ? "true" : "false");
      button.style.background = active ? "rgba(41, 98, 255, 0.15)" : "";
      button.style.border = active ? "1px solid rgba(41, 98, 255, 0.6)" : "";
    }
    if (headerFilterStateNode) {
      const label = currentFilter === "alle" ? "Alle" : currentFilter === "offen" ? "Offen" : "Erledigt";
      headerFilterStateNode.textContent = `Aktiver Filter: ${label}`;
    }
  }

  function syncMainList() {
    const visibleRows = getVisibleRows();
    const nextSelectedId = selectedDummyId && visibleRows.some((row) => row.id === selectedDummyId) ? selectedDummyId : visibleRows[0]?.id || null;
    selectedDummyId = nextSelectedId;
    if (listRowsHost) {
      listRowsHost.replaceChildren?.();
    }
    dummyRowNodes = new Map();
    const doc = renderDoc || rootNode?.ownerDocument || globalThis.document;
    for (const row of visibleRows) {
      const rowNode = createDummyRowNode(doc, row);
      const selected = row.id === selectedDummyId;
      rowNode.setAttribute("data-restarbeiten-v2-selected", selected ? "true" : "false");
      rowNode.style.background = selected ? "rgba(41, 98, 255, 0.10)" : "transparent";
      rowNode.style.border = selected ? "1px solid rgba(41, 98, 255, 0.5)" : "1px solid transparent";
      rowNode.style.borderRadius = "6px";
      rowNode.style.padding = "4px 6px";
      dummyRowNodes.set(row.id, rowNode);
      listRowsHost?.append(rowNode);
    }
    syncFilterState();
    setSelection(selectedDummyId);
  }

  function updateDraftField(fieldName, value) {
    const row = dummyRows.get(selectedDummyId);
    if (!row) return false;
    const nextValue = String(value ?? "").trim();
    if (fieldName === "shortText") row.shortText = nextValue || row.shortText;
    if (fieldName === "longText") row.longText = nextValue || row.longText;
    if (fieldName === "location") row.location = nextValue || row.location;
    if (fieldName === "status") row.status = nextValue || row.status;
    if (fieldName === "note") row.note = nextValue;
    if (fieldName === "status") row.meta = `${row.id} / ${row.status}`;
    setSelection(row.id);
    syncMainList();
    return true;
  }

  function wireQuicklane(doc) {
    const buttonMap = [
      ["restarbeitenV2.quicklane.neu", () => createAndSelectDummyRow(doc)],
      ["restarbeitenV2.quicklane.filterAlle", () => {
        currentFilter = "alle";
        syncMainList();
      }],
      ["restarbeitenV2.quicklane.filterOffen", () => {
        currentFilter = "offen";
        syncMainList();
      }],
      ["restarbeitenV2.quicklane.filterErledigt", () => {
        currentFilter = "erledigt";
        syncMainList();
      }],
    ];
    for (const [id, handler] of buttonMap) {
      const button = rootNode?.querySelector?.(`[data-ui-v2-id="${id}"]`) || null;
      if (!button) continue;
      button.onclick = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        handler();
      };
    }
  }

  function createLabeledControl(doc, labelText, controlNode, previewNode) {
    const wrap = doc.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "4px";
    const label = createTextBlock(doc, labelText, "restarbeiten-v2-field-label");
    wrap.append(label);
    if (controlNode) wrap.append(controlNode);
    if (previewNode) wrap.append(previewNode);
    return wrap;
  }

  function wireWorkbench(doc) {
    workbenchNodes = {};
    const footerRoot = rootNode?.querySelector?.('[data-ui-v2-id="restarbeitenV2.footer"]') || null;
    if (!footerRoot) return;
    const headerFilter = rootNode?.querySelector?.('[data-ui-v2-id="restarbeitenV2.header.filter"]') || null;
    if (headerFilter && !headerFilterStateNode) {
      headerFilter.replaceChildren?.();
      headerFilter.append(
        createTextBlock(doc, "Suche / Status / Verortung", "restarbeiten-v2-filter-label"),
        createTextBlock(doc, "", "restarbeiten-v2-filter-state")
      );
      headerFilterStateNode = headerFilter.children?.[1] || null;
    }

    const selectionNote = createTextBlock(doc, "Ausgewählt: R-001", "restarbeiten-v2-selection-note");
    const notice = createTextBlock(doc, "Nur lokale DEV-Vorschau - keine Speicherung", "restarbeiten-v2-no-save");

    const kurztextInput = doc.createElement("input");
    kurztextInput.type = "text";
    kurztextInput.setAttribute("data-restarbeiten-v2-field", "shortText");
    kurztextInput.oninput = (event) => updateDraftField("shortText", event?.target?.value);

    const langtextInput = doc.createElement("textarea");
    langtextInput.setAttribute("data-restarbeiten-v2-field", "longText");
    langtextInput.oninput = (event) => updateDraftField("longText", event?.target?.value);

    const verortungInput = doc.createElement("input");
    verortungInput.type = "text";
    verortungInput.setAttribute("data-restarbeiten-v2-field", "location");
    verortungInput.oninput = (event) => updateDraftField("location", event?.target?.value);

    const statusSelect = doc.createElement("select");
    statusSelect.setAttribute("data-restarbeiten-v2-field", "status");
    for (const value of ["offen", "erledigt"]) {
      const option = doc.createElement("option");
      option.setAttribute("value", value);
      option.textContent = value;
      statusSelect.append(option);
    }
    statusSelect.onchange = (event) => updateDraftField("status", event?.target?.value);

    const notizInput = doc.createElement("textarea");
    notizInput.setAttribute("data-restarbeiten-v2-field", "note");
    notizInput.oninput = (event) => updateDraftField("note", event?.target?.value);

    const kurztextPreview = createTextBlock(doc, "", "restarbeiten-v2-field-preview");
    const langtextPreview = createTextBlock(doc, "", "restarbeiten-v2-field-preview");
    const verortungPreview = createTextBlock(doc, "", "restarbeiten-v2-field-preview");
    const metaPreview = createTextBlock(doc, "", "restarbeiten-v2-field-preview");
    const fotosPreview = createTextBlock(doc, "", "restarbeiten-v2-field-preview");
    const notizPreview = createTextBlock(doc, "", "restarbeiten-v2-field-preview");

    const footerKurztext = rootNode?.querySelector?.('[data-ui-v2-id="restarbeitenV2.footer.kurztext"]') || null;
    const footerLangtext = rootNode?.querySelector?.('[data-ui-v2-id="restarbeitenV2.footer.langtext"]') || null;
    const footerVerortung = rootNode?.querySelector?.('[data-ui-v2-id="restarbeitenV2.footer.verortung"]') || null;
    const footerMeta = rootNode?.querySelector?.('[data-ui-v2-id="restarbeitenV2.footer.meta"]') || null;
    const footerFotos = rootNode?.querySelector?.('[data-ui-v2-id="restarbeitenV2.footer.fotos"]') || null;
    const footerNotiz = rootNode?.querySelector?.('[data-ui-v2-id="restarbeitenV2.footer.notiz"]') || null;

    footerKurztext?.replaceChildren?.();
    footerLangtext?.replaceChildren?.();
    footerVerortung?.replaceChildren?.();
    footerMeta?.replaceChildren?.();
    footerFotos?.replaceChildren?.();
    footerNotiz?.replaceChildren?.();

    if (footerKurztext) footerKurztext.append(createLabeledControl(doc, "Kurztext", kurztextInput, kurztextPreview));
    if (footerLangtext) footerLangtext.append(createLabeledControl(doc, "Langtext", langtextInput, langtextPreview));
    if (footerVerortung) footerVerortung.append(createLabeledControl(doc, "Verortung", verortungInput, verortungPreview));
    if (footerMeta) footerMeta.append(createLabeledControl(doc, "Status / Meta", statusSelect, metaPreview));
    if (footerFotos) footerFotos.append(createLabeledControl(doc, "Fotos", createTextBlock(doc, "Keine Fotos", "restarbeiten-v2-static-value"), fotosPreview));
    if (footerNotiz) footerNotiz.append(createLabeledControl(doc, "Notiz", notizInput, notizPreview));

    workbenchNodes = {
      selectionNote,
      notice,
      kurztextInput,
      langtextInput,
      verortungInput,
      statusSelect,
      notizInput,
      kurztextPreview,
      langtextPreview,
      verortungPreview,
      metaPreview,
      fotosPreview,
      notizPreview,
    };

    footerRoot.append(selectionNote, notice);
    setSelection(selectedDummyId);
  }

  function mountEditorPanel(target, doc) {
    if (!editorV2Core || typeof editorV2Core.mount !== "function") return null;
    if (!panelInstance) {
      panelInstance = createEditorV2Panel({ core: editorV2Core });
    }
    if (!panelNode) {
      panelNode = doc.createElement("div");
      panelNode.setAttribute("data-ui-v2-restarbeiten-editor-panel-host", "true");
      panelNode.style.display = "block";
      panelNode.style.marginTop = "12px";
    }
    if (target && typeof target.append === "function" && panelNode.parentElement !== target) {
      target.append(panelNode);
    }
    panelInstance.render(panelNode);
    return panelNode;
  }

  function render(target) {
    const doc = target?.ownerDocument || globalThis.document;
    if (!doc || typeof doc.createElement !== "function") return null;
    mountedTarget = target || null;
    renderDoc = doc;
    rootNode = buildTree(doc, registry);
    if (!rootNode) return null;
    if (target && typeof target.append === "function") {
      target.append(rootNode);
    }
    listNode = rootNode?.querySelector?.('[data-ui-v2-id="restarbeitenV2.main.liste"]') || null;
    if (listNode && !listRowsHost) {
      listRowsHost = doc.createElement("div");
      listRowsHost.setAttribute("data-restarbeiten-v2-list-rows", "true");
      listNode.append(listRowsHost);
    }
    syncMainList();
    wireWorkbench(doc);
    wireQuicklane(doc);
    if (editorV2Core) {
      editorV2Core.mount(rootNode, registry);
      mountEditorPanel(target || doc.body || null, doc);
    }
    return rootNode;
  }

  function destroy() {
    try {
      panelInstance?.unmount?.();
    } catch (_e) {
      // ignore
    }
    try {
      editorV2Core?.unmount?.();
    } catch (_e) {
      // ignore
    }
    if (panelNode?.parentElement?.removeChild) {
      panelNode.parentElement.removeChild(panelNode);
    }
    if (rootNode?.parentElement?.removeChild) {
      rootNode.parentElement.removeChild(rootNode);
    }
    panelInstance = null;
    panelNode = null;
    mountedTarget = null;
    rootNode = null;
    dummyRowNodes = new Map();
    dummyRows = cloneDummyRows();
    workbenchNodes = {};
    listNode = null;
    listRowsHost = null;
    headerFilterStateNode = null;
    renderDoc = null;
    currentFilter = "alle";
    selectedDummyId = "R-001";
    return true;
  }

  return {
    registry,
    render,
    destroy,
    getRootNode: () => rootNode,
    getPanelNode: () => panelNode,
    getMountedTarget: () => mountedTarget,
    getSelectedDummyId: () => selectedDummyId,
    getCurrentFilter: () => currentFilter,
  };
}
