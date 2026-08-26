import {
  LeistungsEditboxField,
  LeistungsEditboxGroup,
  LeistungsEditboxRow,
} from "../../core/leistungseditbox/index.js";

const DEFAULT_TYPE_OPTIONS = Object.freeze([
  { value: "standard", label: "Standard" },
  { value: "alternative", label: "Alternative" },
  { value: "hint", label: "Hinweis" },
  { value: "text", label: "Text" },
]);

function normalizeAlternativeSuffix(value) {
  const suffix = String(value ?? "a").trim().toLowerCase();
  return /^[a-z]$/.test(suffix) ? suffix : "a";
}

function alternativeDisplayNumber(basePositionNumber, suffix) {
  const base = String(basePositionNumber ?? "").trim();
  return base ? `${base}${normalizeAlternativeSuffix(suffix)}` : normalizeAlternativeSuffix(suffix);
}

export class LeistungspositionEditboxAdapter {
  constructor({
    documentRef,
    values = {},
    typeOptions = DEFAULT_TYPE_OPTIONS,
    showGross = false,
    showNep = false,
  } = {}) {
    const doc = documentRef || globalThis.document;
    if (!doc?.createElement) throw new Error("LeistungspositionEditboxAdapter benötigt ein Document.");

    this.basePositionNumber = String(values.basePositionNumber ?? values.positionNumber ?? "").trim();
    this.alternativeSuffix = normalizeAlternativeSuffix(values.alternativeSuffix ?? "a");

    const fields = {
      positionNumber: new LeistungsEditboxField({
        documentRef: doc,
        label: "Pos.-Nr.",
        kind: "singleline",
        value: this.basePositionNumber,
      }),
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
      alternativeReference: new LeistungsEditboxField({
        documentRef: doc,
        label: "Zuordnung",
        kind: "singleline",
        value: "",
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
    };

    fields.positionNumber.getControl().readOnly = true;
    fields.alternativeReference.getControl().readOnly = true;

    if (showGross) {
      fields.gross = new LeistungsEditboxField({
        documentRef: doc,
        label: "Brutto",
        kind: "toggle",
        value: values.gross === true,
      });
    }
    if (showNep) {
      fields.nep = new LeistungsEditboxField({
        documentRef: doc,
        label: "NEP",
        kind: "toggle",
        value: values.nep === true,
      });
    }
    this.fields = Object.freeze(fields);

    this.numberRow = new LeistungsEditboxRow({
      documentRef: doc,
      columns: ["minmax(90px, .35fr)", "minmax(150px, .65fr)", "minmax(0, 2fr)"],
      children: [
        this.fields.positionNumber.getElement(),
        this.fields.type.getElement(),
        this.fields.alternativeReference.getElement(),
      ],
    });

    this.primaryRow = new LeistungsEditboxRow({
      documentRef: doc,
      children: [this.fields.shortText.getElement()],
    });

    const detailChildren = [
      this.fields.quantity.getElement(),
      this.fields.unit.getElement(),
      this.fields.unitPrice.getElement(),
      ...(this.fields.gross ? [this.fields.gross.getElement()] : []),
      ...(this.fields.nep ? [this.fields.nep.getElement()] : []),
    ];
    const detailColumns = [
      "minmax(0, 1fr)",
      "minmax(110px, .45fr)",
      "minmax(140px, .65fr)",
      ...(this.fields.gross ? ["auto"] : []),
      ...(this.fields.nep ? ["auto"] : []),
    ];

    this.detailRow = new LeistungsEditboxRow({
      documentRef: doc,
      columns: detailColumns,
      children: detailChildren,
    });

    this.textRow = new LeistungsEditboxRow({
      documentRef: doc,
      children: [this.fields.longText.getElement()],
    });

    this.root = new LeistungsEditboxGroup({
      documentRef: doc,
      children: [
        this.numberRow.getElement(),
        this.primaryRow.getElement(),
        this.detailRow.getElement(),
        this.textRow.getElement(),
      ],
    });

    this.fields.type.getControl().addEventListener("change", () => this.updateTypePresentation());
    this.updateTypePresentation();
  }

  updateTypePresentation() {
    const type = this.fields.type.getValue();
    const isAlternative = type === "alternative";
    const displayNumber = isAlternative
      ? alternativeDisplayNumber(this.basePositionNumber, this.alternativeSuffix)
      : this.basePositionNumber;

    this.fields.positionNumber.setValue(displayNumber);
    this.fields.alternativeReference.setValue(
      isAlternative && this.basePositionNumber
        ? `Alternativposition zu Pos. ${this.basePositionNumber}`
        : ""
    );
    this.fields.alternativeReference.getElement().hidden = !isAlternative;
  }

  getElement() {
    return this.root.getElement();
  }

  getField(name) {
    return this.fields[name] || null;
  }

  getValues() {
    const type = this.fields.type.getValue();
    return Object.freeze({
      positionNumber: this.fields.positionNumber.getValue(),
      basePositionNumber: this.basePositionNumber,
      shortText: this.fields.shortText.getValue(),
      longText: this.fields.longText.getValue(),
      type,
      alternativeOf: type === "alternative" ? this.basePositionNumber : "",
      alternativeSuffix: type === "alternative" ? this.alternativeSuffix : "",
      quantity: this.fields.quantity.getValue(),
      unit: this.fields.unit.getValue(),
      unitPrice: this.fields.unitPrice.getValue(),
      ...(this.fields.gross ? { gross: this.fields.gross.getValue() } : {}),
      ...(this.fields.nep ? { nep: this.fields.nep.getValue() } : {}),
    });
  }
}

export {
  DEFAULT_TYPE_OPTIONS as LEISTUNGSPOSITION_DEFAULT_TYPE_OPTIONS,
  alternativeDisplayNumber as leistungspositionAlternativeDisplayNumber,
};
