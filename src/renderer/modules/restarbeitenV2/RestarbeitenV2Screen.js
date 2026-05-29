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
    rootNode = buildTree(doc, registry);
    if (!rootNode) return null;
    if (target && typeof target.append === "function") {
      target.append(rootNode);
    }
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
    return true;
  }

  return {
    registry,
    render,
    destroy,
    getRootNode: () => rootNode,
    getPanelNode: () => panelNode,
    getMountedTarget: () => mountedTarget,
  };
}
