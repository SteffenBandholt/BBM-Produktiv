import { ensureLeistungsEditboxStyles } from "./styles.js";

const LEISTUNGSEDITBOX_FRAME_CLASS = "bbm-leistungseditbox-frame";

function setEditorAttributes(node, {
  id = "leistungseditbox.frame",
  label = "LeistungsEditbox",
  parentId = "",
} = {}) {
  node.setAttribute("data-ui-inspector-id", id);
  node.setAttribute("data-ui-editor-kind", "frame");
  node.setAttribute("data-ui-editor-label", label);
  if (parentId) node.setAttribute("data-ui-editor-parent", parentId);
  node.setAttribute("data-ui-editor-editable", "true");
  node.setAttribute("data-ui-editor-ops", "inspect,move,resizeWidth,resizeHeight");
}

export class LeistungsEditboxFrame {
  constructor({ documentRef, id, label, parentId } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungsEditboxFrame benötigt ein Document.");

    ensureLeistungsEditboxStyles(doc);

    this.root = doc.createElement("section");
    this.root.className = LEISTUNGSEDITBOX_FRAME_CLASS;
    setEditorAttributes(this.root, { id, label, parentId });

    this.headerHost = doc.createElement("div");
    this.headerHost.className = `${LEISTUNGSEDITBOX_FRAME_CLASS}__header`;

    this.contentHost = doc.createElement("div");
    this.contentHost.className = `${LEISTUNGSEDITBOX_FRAME_CLASS}__content`;

    this.root.append(this.headerHost, this.contentHost);
  }

  getElement() {
    return this.root;
  }

  getHeaderHost() {
    return this.headerHost;
  }

  getContentHost() {
    return this.contentHost;
  }

  replaceHeader(...nodes) {
    this.headerHost.replaceChildren(...nodes.filter(Boolean));
  }

  replaceContent(...nodes) {
    this.contentHost.replaceChildren(...nodes.filter(Boolean));
  }
}

export { LEISTUNGSEDITBOX_FRAME_CLASS };
