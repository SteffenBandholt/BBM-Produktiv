import { ensureLeistungsEditboxStyles } from "./styles.js";

const ROW_CLASS = "bbm-leistungseditbox-row";
const GROUP_CLASS = "bbm-leistungseditbox-group";

function normalizeColumns(columns) {
  if (!Array.isArray(columns) || columns.length === 0) return ["minmax(0, 1fr)"];
  return columns.map((column) => String(column || "minmax(0, 1fr)"));
}

export class LeistungsEditboxRow {
  constructor({ documentRef, columns = ["minmax(0, 1fr)"], children = [] } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungsEditboxRow benötigt ein Document.");

    ensureLeistungsEditboxStyles(doc);

    this.root = doc.createElement("div");
    this.root.className = ROW_CLASS;
    this.setColumns(columns);
    this.replace(...children);
  }

  getElement() {
    return this.root;
  }

  setColumns(columns) {
    this.root.style.gridTemplateColumns = normalizeColumns(columns).join(" ");
  }

  replace(...nodes) {
    this.root.replaceChildren(...nodes.filter(Boolean));
  }

  append(...nodes) {
    this.root.append(...nodes.filter(Boolean));
  }
}

export class LeistungsEditboxGroup {
  constructor({ documentRef, children = [] } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungsEditboxGroup benötigt ein Document.");

    ensureLeistungsEditboxStyles(doc);

    this.root = doc.createElement("div");
    this.root.className = GROUP_CLASS;
    this.replace(...children);
  }

  getElement() {
    return this.root;
  }

  replace(...nodes) {
    this.root.replaceChildren(...nodes.filter(Boolean));
  }

  append(...nodes) {
    this.root.append(...nodes.filter(Boolean));
  }
}

export {
  ROW_CLASS as LEISTUNGSEDITBOX_ROW_CLASS,
  GROUP_CLASS as LEISTUNGSEDITBOX_GROUP_CLASS,
};
