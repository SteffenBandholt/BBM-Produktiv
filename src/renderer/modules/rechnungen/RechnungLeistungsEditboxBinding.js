import { POSITION_TYPES, PRICE_INPUT_MODES } from "../../../shared/rechnung/rechnungPositions.mjs";
import { SharedEditboxCore } from "../protokoll/SharedEditboxCore.js";
import { WorkbenchShellFrame } from "../protokoll/WorkbenchShellFrame.js";
import { ensureProtokollModuleStyles } from "../protokoll/styles.js";
import { m80EditorAttributes } from "../../ui-editor/m80Registry.js";
import { beginM83ComponentBinding, registerM80Ref } from "../../ui-editor/m80Refs.js";
import { RECHNUNG_LEISTUNGSEDITBOX_COMPONENT_ID } from "./RechnungLeistungsEditbox.uiEditorContract.js";

const STYLE_MARKER = "rechnung-shared-editbox-styles";
let STYLE_HREF = "./styles/rechnungLeistungsEditbox.css";
try {
  STYLE_HREF = new URL("./styles/rechnungLeistungsEditbox.css", import.meta.url).href;
} catch (_error) {
  // Testloader/Data-URL fallback.
}

function ensureStyles(doc) {
  ensureProtokollModuleStyles();
  if (!doc?.head || doc.querySelector?.(`link[data-${STYLE_MARKER}="true"]`)) return;
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLE_HREF;
  link.setAttribute(`data-${STYLE_MARKER}`, "true");
  doc.head.appendChild(link);
}

function bindEditorRef(element, id) {
  if (!element || !id) return null;
  for (const [name, value] of Object.entries(m80EditorAttributes(id))) {
    element.setAttribute(name, value);
  }
  registerM80Ref(id, element);
  return element;
}

function centsToInput(cents) {
  const numeric = Number(cents ?? 0);
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(Number.isFinite(numeric) ? numeric / 100 : 0);
}

function editboxTypeForPosition(position) {
  if (position?.alternative_of) return "alternative";
  if (position?.type === POSITION_TYPES.NOTE) return "hint";
  if (position?.type === POSITION_TYPES.HEADING || position?.is_title === true) return "text";
  return "standard";
}

export function rechnungPositionToLeistungsEditboxValues(
  position = {},
  { quantityDecimalPlaces = 2, alternativeBasePositionNumber = "" } = {},
) {
  const isService = position?.type === POSITION_TYPES.SERVICE;
  const isAlternative = isService && !!position?.alternative_of;
  const isGross = isService && position?.price_input_mode === PRICE_INPUT_MODES.GROSS;
  const inputPriceCents = isGross
    ? position?.price_input_cents ?? position?.unit_price_cents
    : position?.unit_price_cents;

  return Object.freeze({
    positionNumber: position?.position_number || "",
    assignment: isAlternative
      ? `zu Pos.: ${alternativeBasePositionNumber || String(position?.position_number || "").replace(/[a-z]$/i, "")}`
      : "",
    shortText: position?.short_text || "",
    longText: position?.long_text || "",
    type: editboxTypeForPosition(position),
    quantity: isService ? position?.quantity ?? "" : "",
    quantityDecimalPlaces: Number.isInteger(Number(quantityDecimalPlaces)) ? Number(quantityDecimalPlaces) : 2,
    unit: isService ? position?.unit || "" : "",
    unitPrice: isService ? centsToInput(inputPriceCents) : "",
    positionAmount: isService ? centsToInput(position?.total_cents) : "",
    gross: isGross,
    nep: isService && position?.is_nep === true,
  });
}

function createActionButton(doc, label, handler) {
  const button = doc.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = "bbm-tops-btn bbm-tops-workbench-btn bbm-tops-workbench-btn-neutral";
  button.addEventListener("pointerdown", (event) => event.stopPropagation());
  button.addEventListener("mousedown", (event) => event.stopPropagation());
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof handler === "function") handler();
  });
  return button;
}

function createField(doc, { label, kind = "input", readOnly = false, options = [] } = {}) {
  const wrapper = doc.createElement("label");
  wrapper.className = "rechnung-shared-editbox-field";
  const labelElement = doc.createElement("span");
  labelElement.className = "rechnung-shared-editbox-field__label";
  labelElement.textContent = label || "";
  const control = kind === "select" ? doc.createElement("select") : doc.createElement("input");
  control.className = "rechnung-shared-editbox-field__control";
  if (kind === "checkbox") control.type = "checkbox";
  if (readOnly) control.readOnly = true;
  if (kind === "select") {
    for (const item of options) {
      const option = doc.createElement("option");
      option.value = String(item.value ?? "");
      option.textContent = String(item.label ?? item.value ?? "");
      control.appendChild(option);
    }
  }
  wrapper.append(labelElement, control);
  return { wrapper, labelElement, control };
}

export class RechnungLeistungsEditboxBinding {
  constructor({
    documentRef = globalThis.document,
    onAddTitle = null,
    onAddPosition = null,
    onMove = null,
    onDelete = null,
    onChange = null,
  } = {}) {
    const doc = documentRef;
    if (!doc?.createElement) throw new Error("RechnungLeistungsEditboxBinding benötigt ein Document.");
    ensureStyles(doc);

    this.documentRef = doc;
    this.activePositionId = null;
    this.onChange = typeof onChange === "function" ? onChange : null;
    this.values = null;
    this._syncing = false;

    // Exakt derselbe wiederverwendbare Workbench-/Editbox-Unterbau wie im Protokoll.
    this.workbench = new WorkbenchShellFrame();
    this.workbench.root.classList.add("rechnung-shared-editbox-workbench");
    this.workbench.leftHeaderTitle.textContent = "Leistungsposition bearbeiten";

    this.actions = {
      addTitle: createActionButton(doc, "+Titel", onAddTitle),
      addPosition: createActionButton(doc, "+Position", onAddPosition),
      move: createActionButton(doc, "Schieben", onMove),
      delete: createActionButton(doc, "Papierkorb", onDelete),
    };
    this.workbench.headerAddActions.append(this.actions.addTitle, this.actions.addPosition);
    this.workbench.headerPrimaryActions.append(this.actions.move, this.actions.delete);

    this.sharedEditboxCore = new SharedEditboxCore({
      onDraftChange: ({ draft } = {}) => {
        if (this._syncing || !this.activePositionId) return;
        this.values = {
          ...(this.values || {}),
          shortText: String(draft?.title ?? ""),
          longText: String(draft?.longtext ?? ""),
        };
        this._emitChange();
      },
    });
    this.sharedEditboxCore.root.classList.add("rechnung-shared-editbox-core");
    this.sharedEditboxCore.editbox.setVisibleFlags([]);
    this.sharedEditboxCore.flagsWrap.hidden = true;

    this._buildDetails();
    this.sharedEditboxCore.editbox.metaCol.replaceChildren(this.detailsRoot);
    this.workbench.left.appendChild(this.sharedEditboxCore.root);
    this.workbench.mount();

    this.host = doc.createElement("section");
    this.host.className = "rechnung-leistungseditbox-host";
    this.host.classList.add("is-inactive");
    this.host.setAttribute("aria-hidden", "true");
    this.host.appendChild(this.workbench.root);
  }

  _buildDetails() {
    const doc = this.documentRef;
    this.detailsRoot = doc.createElement("div");
    this.detailsRoot.className = "rechnung-shared-editbox-details";

    this.fields = {
      positionNumber: createField(doc, { label: "Pos.", readOnly: true }),
      type: createField(doc, {
        label: "Typ",
        kind: "select",
        options: [
          { value: "standard", label: "Normalposition" },
          { value: "alternative", label: "Alternativposition" },
          { value: "hint", label: "Hinweis" },
          { value: "text", label: "Text/Titel" },
        ],
      }),
      assignment: createField(doc, { label: "Zuordnung", readOnly: true }),
      nep: createField(doc, { label: "NEP", kind: "checkbox" }),
      quantity: createField(doc, { label: "Menge" }),
      unit: createField(doc, { label: "Einheit" }),
      unitPrice: createField(doc, { label: "EP netto" }),
      positionAmount: createField(doc, { label: "Gesamt", readOnly: true }),
    };

    this.quantityDecimals = doc.createElement("div");
    this.quantityDecimals.className = "rechnung-shared-editbox-decimals";
    this.quantityDecimalsDecrease = createActionButton(doc, "−", () => this._changeQuantityDecimals(-1));
    this.quantityDecimalsIncrease = createActionButton(doc, "+", () => this._changeQuantityDecimals(1));
    this.quantityDecimalsPattern = doc.createElement("span");
    this.quantityDecimalsPattern.className = "rechnung-shared-editbox-decimals__pattern";
    this.quantityDecimals.append(
      this.quantityDecimalsDecrease,
      this.quantityDecimalsPattern,
      this.quantityDecimalsIncrease,
    );
    this.fields.quantity.wrapper.appendChild(this.quantityDecimals);

    this.moduleArea = doc.createElement("div");
    this.moduleArea.className = "rechnung-shared-editbox-module-area";
    this.moduleArea.setAttribute("aria-label", "Freie Fachmodulfläche");

    for (const [name, field] of Object.entries(this.fields)) {
      const eventName = name === "nep" || name === "type" ? "change" : "input";
      if (!["positionNumber", "assignment", "positionAmount"].includes(name)) {
        field.control.addEventListener(eventName, () => {
          if (this._syncing || !this.activePositionId) return;
          if (name === "nep") this.values.nep = field.control.checked;
          else this.values[name] = field.control.value;
          this._syncFieldAvailability();
          this._emitChange();
        });
      }
      this.detailsRoot.appendChild(field.wrapper);
    }
    this.detailsRoot.appendChild(this.moduleArea);
  }

  _changeQuantityDecimals(delta) {
    if (!this.values || !this.activePositionId) return;
    const current = Number(this.values.quantityDecimalPlaces) || 0;
    this.values.quantityDecimalPlaces = Math.max(0, Math.min(4, current + Number(delta || 0)));
    this._syncQuantityDecimals();
    this._emitChange();
  }

  _syncQuantityDecimals() {
    const places = Math.max(0, Math.min(4, Number(this.values?.quantityDecimalPlaces) || 0));
    this.quantityDecimalsPattern.textContent = places > 0 ? `0,${"0".repeat(places)}` : "0";
  }

  _syncFieldAvailability() {
    const type = String(this.fields.type.control.value || "standard");
    const service = type === "standard" || type === "alternative";
    for (const name of ["quantity", "unit", "unitPrice", "nep"]) {
      this.fields[name].control.disabled = !service;
    }
    this.quantityDecimalsDecrease.disabled = !service;
    this.quantityDecimalsIncrease.disabled = !service;
  }

  _emitChange() {
    if (!this.activePositionId || !this.onChange || !this.values) return;
    const draft = this.sharedEditboxCore.getDraft();
    this.onChange(this.activePositionId, {
      ...this.values,
      shortText: String(draft?.title ?? this.values.shortText ?? ""),
      longText: String(draft?.longtext ?? this.values.longText ?? ""),
      type: String(this.fields.type.control.value || this.values.type || "standard"),
      quantity: String(this.fields.quantity.control.value ?? ""),
      unit: String(this.fields.unit.control.value ?? ""),
      unitPrice: String(this.fields.unitPrice.control.value ?? ""),
      gross: this.values.gross === true,
      nep: this.fields.nep.control.checked === true,
      quantityDecimalPlaces: Number(this.values.quantityDecimalPlaces) || 0,
    });
  }

  registerUiEditorRefs() {
    beginM83ComponentBinding(RECHNUNG_LEISTUNGSEDITBOX_COMPONENT_ID);

    bindEditorRef(this.workbench.root, "rechnung.editor.leistungsEditbox.workbench");
    bindEditorRef(this.workbench.header, "rechnung.editor.leistungsEditbox.header");
    bindEditorRef(this.workbench.leftHeaderTitle, "rechnung.editor.leistungsEditbox.header.title");
    bindEditorRef(this.workbench.headerAddActions, "rechnung.editor.leistungsEditbox.header.actions.left");
    bindEditorRef(this.workbench.headerPrimaryActions, "rechnung.editor.leistungsEditbox.header.actions.right");
    bindEditorRef(this.actions.addTitle, "rechnung.editor.leistungsEditbox.action.addTitle");
    bindEditorRef(this.actions.addPosition, "rechnung.editor.leistungsEditbox.action.addPosition");
    bindEditorRef(this.actions.move, "rechnung.editor.leistungsEditbox.action.move");
    bindEditorRef(this.actions.delete, "rechnung.editor.leistungsEditbox.action.delete");

    const editbox = this.sharedEditboxCore.editbox;
    bindEditorRef(this.sharedEditboxCore.root, "rechnung.editor.leistungsEditbox.content");
    bindEditorRef(editbox.shortWrap, "rechnung.editor.leistungsEditbox.shortText.wrapper");
    bindEditorRef(editbox.shortLabel, "rechnung.editor.leistungsEditbox.shortText.label");
    bindEditorRef(editbox.shortCounter, "rechnung.editor.leistungsEditbox.shortText.remaining");
    bindEditorRef(editbox.shortInput, "rechnung.editor.leistungsEditbox.shortText");
    bindEditorRef(editbox.longWrap, "rechnung.editor.leistungsEditbox.longText.wrapper");
    bindEditorRef(editbox.longLabel, "rechnung.editor.leistungsEditbox.longText.label");
    bindEditorRef(editbox.longCounter, "rechnung.editor.leistungsEditbox.longText.remaining");
    bindEditorRef(editbox.longInput, "rechnung.editor.leistungsEditbox.longText");
    bindEditorRef(editbox.metaCol, "rechnung.editor.leistungsEditbox.meta");

    for (const name of ["positionNumber", "type", "assignment", "nep", "quantity", "unit", "unitPrice", "positionAmount"]) {
      const field = this.fields[name];
      const id = `rechnung.editor.leistungsEditbox.${name}`;
      bindEditorRef(field.wrapper, `${id}.wrapper`);
      bindEditorRef(field.labelElement, `${id}.label`);
      bindEditorRef(field.control, id);
    }

    bindEditorRef(this.quantityDecimals, "rechnung.editor.leistungsEditbox.quantityDecimals");
    bindEditorRef(this.quantityDecimalsDecrease, "rechnung.editor.leistungsEditbox.quantityDecimals.decrease");
    bindEditorRef(this.quantityDecimalsPattern, "rechnung.editor.leistungsEditbox.quantityDecimals.pattern");
    bindEditorRef(this.quantityDecimalsIncrease, "rechnung.editor.leistungsEditbox.quantityDecimals.increase");
    bindEditorRef(this.moduleArea, "rechnung.editor.leistungsEditbox.moduleArea");
    return true;
  }

  getElement() {
    return this.host;
  }

  getFrameElement() {
    return this.host;
  }

  showPosition(position, options = {}) {
    if (!position) {
      this.hide();
      return null;
    }

    this.activePositionId = position.id || null;
    this.values = { ...rechnungPositionToLeistungsEditboxValues(position, options) };
    this._syncing = true;
    try {
      this.sharedEditboxCore.applyEditorState(
        {
          value: {
            title: this.values.shortText,
            longtext: this.values.longText,
          },
          access: {
            shortTextReadOnly: false,
            longTextReadOnly: false,
            flagsDisabled: true,
          },
          level: position?.is_title === true ? 1 : 2,
        },
        { hasSelection: true, isReadOnly: false },
      );

      this.fields.positionNumber.control.value = this.values.positionNumber;
      this.fields.type.control.value = this.values.type;
      this.fields.assignment.control.value = this.values.assignment;
      this.fields.nep.control.checked = this.values.nep === true;
      this.fields.quantity.control.value = this.values.quantity;
      this.fields.unit.control.value = this.values.unit;
      this.fields.unitPrice.control.value = this.values.unitPrice;
      this.fields.positionAmount.control.value = this.values.positionAmount;
      this._syncQuantityDecimals();
      this._syncFieldAvailability();
    } finally {
      this._syncing = false;
    }

    this.workbench.root.dataset.hasSelection = "true";
    this.host.classList.remove("is-inactive");
    this.host.setAttribute("aria-hidden", "false");
    return Object.freeze({ ...this.values });
  }

  hide() {
    this.activePositionId = null;
    this.workbench.root.dataset.hasSelection = "false";
    this.host.classList.add("is-inactive");
    this.host.setAttribute("aria-hidden", "true");
  }

  destroy() {
    this.sharedEditboxCore?.destroy?.();
    this.activePositionId = null;
  }
}