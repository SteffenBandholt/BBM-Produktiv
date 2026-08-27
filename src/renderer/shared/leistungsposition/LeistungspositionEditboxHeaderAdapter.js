import {
  LeistungsEditboxAction,
  LeistungsEditboxHeader,
} from "../../core/leistungseditbox/index.js";

export class LeistungspositionEditboxHeaderAdapter {
  constructor({
    documentRef,
    title = "Leistungsposition bearbeiten",
    onAddTitle = null,
    onAddPosition = null,
    onMove = null,
    onDelete = null,
  } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungspositionEditboxHeaderAdapter benötigt ein Document.");

    this.moveActive = false;
    this.onMove = typeof onMove === "function" ? onMove : null;

    this.actions = Object.freeze({
      addTitle: new LeistungsEditboxAction({ documentRef: doc, label: "+ Titel", onClick: onAddTitle }),
      addPosition: new LeistungsEditboxAction({ documentRef: doc, label: "+ Position", onClick: onAddPosition }),
      move: new LeistungsEditboxAction({
        documentRef: doc,
        label: "Schieben",
        onClick: () => {
          if (!this.onMove) return;
          this.onMove();
          this.setMoveActive(!this.moveActive);
        },
      }),
      delete: new LeistungsEditboxAction({ documentRef: doc, label: "Löschen", onClick: onDelete }),
    });

    this.header = new LeistungsEditboxHeader({
      documentRef: doc,
      title,
      left: [
        this.actions.addTitle.getElement(),
        this.actions.addPosition.getElement(),
      ],
      center: [this.actions.move.getElement()],
      right: [this.actions.delete.getElement()],
    });

    this.setMoveActive(false);
  }

  getElement() {
    return this.header.getElement();
  }

  getAction(name) {
    return this.actions[name] || null;
  }

  setMoveActive(active) {
    this.moveActive = active === true;
    const element = this.actions.move.getElement();
    this.actions.move.setLabel(this.moveActive ? "Schieben aktiv" : "Schieben");
    element.setAttribute("aria-pressed", String(this.moveActive));
    element.dataset.active = String(this.moveActive);
  }
}
