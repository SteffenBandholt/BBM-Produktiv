import {
  LeistungsEditboxField,
  LeistungsEditboxGroup,
  LeistungsEditboxRow,
} from "../../core/leistungseditbox/index.js";

const DEFAULT_TYPE_OPTIONS = Object.freeze([
  { value: "standard", label: "Standard" },
  { value: "alternative", label: "Alternative" },
]);

export class LeistungspositionEditboxAdapter {
  constructor({
    documentRef,
    values = {},
    typeOptions = DEFAULT_TYPE_OPTIONS,
  } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungspositionEditboxAdapter benötigt ein Document.");

    this.fields = Object.freeze({
      shortText: new LeistungsEditboxField({
        documentRef: doc,
        label: "Kurztext",
        kind: "singleline",
        value: values.shortText ?? "",
      }),
      longText: new LeistungsEditboxField({
        documentRef: doc,
        label: "Langtext",
        kind: "multiline",
        value: values.longText ?? "",
      }),
      type: new LeistungsEditboxField({
        documentRef: doc,
        label: "Typ",
        kind: "select",
        value: values.type ?? typeOptions[0]?.value ?? "",
        options: typeOptions,
      }),
      quantity: new LeistungsEditboxField({
        documentRef: doc,
        label: "Menge",
        kind: "singleline",
        value: values.quantity ?? "",
      }),
      unit: new LeistungsEditboxField({
        documentRef: doc,
        label: "Einheit",
        kind: "singleline",
        value: values.unit ?? "",
      }),
      unitPrice: new LeistungsEditboxField({
        documentRef: doc,
        label: "Einzelpreis",
        kind: "singleline",
        value: values.unitPrice ?? "",
      }),
    });

    this.primaryRow = new LeistungsEditboxRow({
      documentRef: doc,
      columns: ["minmax(0, 2fr)", "minmax(150px, .7fr)"],
      children: [
        this.fields.shortText.getElement(),
        this.fields.type.getElement(),
      ],
    });

    this.detailRow = new LeistungsEditboxRow({
      documentRef: doc,
      columns: ["minmax(0, 1fr)", "minmax(110px, .45fr)", "minmax(140px, .65fr)"],
      children: [
        this.fields.quantity.getElement(),
        this.fields.unit.getElement(),
        this.fields.unitPrice.getElement(),
      ],
    });

    this.textRow = new LeistungsEditboxRow({
      documentRef: doc,
      children: [this.fields.longText.getElement()],
    });

    this.root = new LeistungsEditboxGroup({
      documentRef: doc,
      children: [
        this.primaryRow.getElement(),
        this.detailRow.getElement(),
        this.textRow.getElement(),
      ],
    });
  }

  getElement() {
    return this.root.getElement();
  }

  getField(name) {
    return this.fields[name] || null;
  }

  getValues() {
    return Object.freeze({
      shortText: this.fields.shortText.getValue(),
      longText: this.fields.longText.getValue(),
      type: this.fields.type.getValue(),
      quantity: this.fields.quantity.getValue(),
      unit: this.fields.unit.getValue(),
      unitPrice: this.fields.unitPrice.getValue(),
    });
  }
}

export { DEFAULT_TYPE_OPTIONS as LEISTUNGSPOSITION_DEFAULT_TYPE_OPTIONS };
