import { ensureLeistungsEditboxStyles } from "./styles.js";

const ACTION_CLASS = "bbm-leistungseditbox-action";

export class LeistungsEditboxAction {
  constructor({ documentRef, label = "Aktion", onClick = null, disabled = false } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungsEditboxAction benötigt ein Document.");

    ensureLeistungsEditboxStyles(doc);

    this.element = doc.createElement("button");
    this.element.type = "button";
    this.element.className = ACTION_CLASS;
    this.element.textContent = String(label ?? "Aktion");
    this.element.disabled = disabled === true;

    if (typeof onClick === "function") {
      this.element.addEventListener("click", onClick);
    }
  }

  getElement() {
    return this.element;
  }

  setLabel(label) {
    this.element.textContent = String(label ?? "");
  }

  setDisabled(disabled) {
    this.element.disabled = disabled === true;
  }
}

export { ACTION_CLASS as LEISTUNGSEDITBOX_ACTION_CLASS };
