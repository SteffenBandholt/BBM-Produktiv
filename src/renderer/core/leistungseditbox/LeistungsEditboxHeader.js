import { ensureLeistungsEditboxStyles } from "./styles.js";

const HEADER_CLASS = "bbm-leistungseditbox-header";

export class LeistungsEditboxHeader {
  constructor({ documentRef, title = "", left = [], center = [], right = [] } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungsEditboxHeader benötigt ein Document.");

    ensureLeistungsEditboxStyles(doc);

    this.root = doc.createElement("div");
    this.root.className = HEADER_CLASS;

    this.titleHost = doc.createElement("div");
    this.titleHost.className = `${HEADER_CLASS}__title`;
    this.titleHost.textContent = String(title ?? "");

    this.actionsHost = doc.createElement("div");
    this.actionsHost.className = `${HEADER_CLASS}__actions`;

    this.leftHost = doc.createElement("div");
    this.leftHost.className = `${HEADER_CLASS}__group ${HEADER_CLASS}__group--left`;

    this.centerHost = doc.createElement("div");
    this.centerHost.className = `${HEADER_CLASS}__group ${HEADER_CLASS}__group--center`;

    this.rightHost = doc.createElement("div");
    this.rightHost.className = `${HEADER_CLASS}__group ${HEADER_CLASS}__group--right`;

    this.actionsHost.append(this.leftHost, this.centerHost, this.rightHost);
    this.root.append(this.titleHost, this.actionsHost);

    this.replaceLeft(...left);
    this.replaceCenter(...center);
    this.replaceRight(...right);
  }

  getElement() {
    return this.root;
  }

  getTitleHost() {
    return this.titleHost;
  }

  getLeftHost() {
    return this.leftHost;
  }

  getCenterHost() {
    return this.centerHost;
  }

  getRightHost() {
    return this.rightHost;
  }

  setTitle(title) {
    this.titleHost.textContent = String(title ?? "");
  }

  replaceLeft(...nodes) {
    this.leftHost.replaceChildren(...nodes.filter(Boolean));
  }

  replaceCenter(...nodes) {
    this.centerHost.replaceChildren(...nodes.filter(Boolean));
  }

  replaceRight(...nodes) {
    this.rightHost.replaceChildren(...nodes.filter(Boolean));
  }
}

export { HEADER_CLASS as LEISTUNGSEDITBOX_HEADER_CLASS };
