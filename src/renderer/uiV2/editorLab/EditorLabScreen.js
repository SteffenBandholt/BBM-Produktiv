import { createEditorLabRegistry } from "./editorLabRegistry.js";
import { createEditorV2Panel } from "../editorV2/EditorV2Panel.js";

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

function createScreenStructure(doc, registry) {
  const entries = new Map(registry.map((entry) => [entry.id, entry]));
  const root = createNode(doc, "div", entries.get("editorlab.root"), "");
  root.style.display = "grid";
  root.style.gridTemplateColumns = "1fr 220px";
  root.style.gridTemplateRows = "auto 1fr auto";
  root.style.gridTemplateAreas = '"header quicklane" "main quicklane" "footer footer"';
  root.style.gap = "12px";
  root.style.padding = "12px";
  root.style.boxSizing = "border-box";

  const header = createNode(doc, "div", entries.get("editorlab.header"), "");
  header.style.gridArea = "header";
  const headerTitle = createNode(doc, "div", entries.get("editorlab.header.titleGroup"), "Header / Titel");
  const headerSearch = createNode(doc, "div", entries.get("editorlab.header.searchGroup"), "Suche / Filter");
  const headerStatus = createNode(doc, "div", entries.get("editorlab.header.statusGroup"), "Status / Hinweis");
  header.append(headerTitle, headerSearch, headerStatus);

  const main = createNode(doc, "div", entries.get("editorlab.main"), "");
  main.style.gridArea = "main";
  const mainGroupA = createNode(doc, "div", entries.get("editorlab.main.groupA"), "");
  const mainFieldA1 = createNode(doc, "div", entries.get("editorlab.main.groupA.fieldA1"), "Feld A1");
  const mainButtonA2 = createNode(doc, "button", entries.get("editorlab.main.groupA.buttonA2"), "Button A2");
  const mainGroupB = createNode(doc, "div", entries.get("editorlab.main.groupB"), "");
  const mainFieldB1 = createNode(doc, "div", entries.get("editorlab.main.groupB.fieldB1"), "Feld B1");
  const mainButtonB2 = createNode(doc, "button", entries.get("editorlab.main.groupB.buttonB2"), "Button B2");
  mainGroupA.append(mainFieldA1, mainButtonA2);
  mainGroupB.append(mainFieldB1, mainButtonB2);
  main.append(mainGroupA, mainGroupB);

  const quicklane = createNode(doc, "aside", entries.get("editorlab.quicklane"), "");
  quicklane.style.gridArea = "quicklane";
  quicklane.style.display = "flex";
  quicklane.style.flexDirection = "column";
  quicklane.style.gap = "8px";
  quicklane.style.alignItems = "stretch";
  quicklane.style.justifyContent = "flex-start";
  quicklane.style.width = "100%";
  quicklane.style.borderLeft = "1px solid rgba(0,0,0,0.12)";
  quicklane.style.paddingLeft = "12px";

  const quicklaneLock = createNode(doc, "button", entries.get("editorlab.quicklane.lock"), "Vorhängeschloss");
  const quicklaneNew = createNode(doc, "button", entries.get("editorlab.quicklane.new"), "Neu");
  const quicklaneSave = createNode(doc, "button", entries.get("editorlab.quicklane.save"), "Speichern");
  const quicklaneView = createNode(doc, "button", entries.get("editorlab.quicklane.view"), "Ansicht");
  quicklane.append(quicklaneLock, quicklaneNew, quicklaneSave, quicklaneView);

  const footer = createNode(doc, "div", entries.get("editorlab.footer"), "");
  footer.style.gridArea = "footer";
  const footerGroupC = createNode(doc, "div", entries.get("editorlab.footer.groupC"), "");
  const footerFieldC1 = createNode(doc, "div", entries.get("editorlab.footer.groupC.fieldC1"), "Feld C1");
  footerGroupC.append(footerFieldC1);
  const footerGroupD = createNode(doc, "div", entries.get("editorlab.footer.groupD"), "");
  const footerFieldD1 = createNode(doc, "div", entries.get("editorlab.footer.groupD.fieldD1"), "Feld D1");
  const footerButtonD2 = createNode(doc, "button", entries.get("editorlab.footer.groupD.buttonD2"), "Button D2");
  footerGroupD.append(footerFieldD1, footerButtonD2);
  footer.append(footerGroupC, footerGroupD);

  root.append(header, main, quicklane, footer);
  return root;
}

export function createEditorLabScreen(options = {}) {
  const registry = Array.isArray(options.registry) ? options.registry : createEditorLabRegistry();
  const panel = options.editorV2Panel || (options.editorV2Core ? createEditorV2Panel({ core: options.editorV2Core }) : null);
  let rootNode = null;

  function render(target) {
    const doc = target?.ownerDocument || globalThis.document;
    if (!doc || typeof doc.createElement !== "function") return null;
    rootNode = createScreenStructure(doc, registry);
    if (target && typeof target.append === "function") {
      target.append(rootNode);
    }
    if (panel && typeof panel.render === "function") {
      panel.render(target || doc.body || null);
    }
    return rootNode;
  }

  return {
    registry,
    render,
    panel,
    getRootNode: () => rootNode,
    getPanelNode: () => panel?.getRootNode?.() || null,
  };
}
