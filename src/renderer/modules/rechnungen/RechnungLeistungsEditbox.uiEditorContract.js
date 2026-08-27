import {
  FIELD_LAYOUT,
  GROUP_LAYOUT,
  TEXT_LAYOUT,
  m83Component,
  m83DomainButton,
  m83Element,
  m83Slot,
} from "../../ui-editor/m83ComponentContract.js";
import { RECHNUNG_SCOPE_ID } from "./RechnungScreen.uiEditorContract.js";

export const RECHNUNG_LEISTUNGSEDITBOX_COMPONENT_ID = "bbm.rechnung.leistungsEditbox";

const freeElement = (values) => m83Element({
  ...values,
  unboundedGeometry: true,
});

const area = (id, name, parentId, order, componentKind) => freeElement({
  id,
  name,
  type: "area",
  role: "layout",
  parentId,
  order,
  allowedOps: GROUP_LAYOUT,
  componentKind,
});

const group = (id, name, parentId, order, componentKind) => freeElement({
  id,
  name,
  type: "group",
  role: "layout",
  parentId,
  order,
  allowedOps: GROUP_LAYOUT,
  componentKind,
});

const label = (id, name, parentId, order, role = "content", componentKind = "label") => freeElement({
  id,
  name,
  type: "label",
  role,
  parentId,
  order,
  allowedOps: TEXT_LAYOUT,
  componentKind,
});

const field = (id, name, parentId, order, fieldKind) => freeElement({
  id,
  name,
  type: "field",
  role: "content",
  parentId,
  order,
  allowedOps: FIELD_LAYOUT,
  fieldKind,
});

const action = (id, name, parentId, order, actionKind) => m83DomainButton({
  id,
  name,
  parentId,
  order,
  actionKind,
  unboundedGeometry: true,
  fitChromeToOuterSize: false,
  operationEffects: {
    move: "elementOnly",
    resizeWidth: "elementOnly",
    resizeHeight: "elementOnly",
    textResize: "elementOnly",
    setVisibility: "elementOnly",
  },
});

const elements = Object.freeze([
  group("rechnung.editor.leistungsEditbox.header", "Kopf LeistungsEditbox", "rechnung.editor.leistungsEditbox", 107, "leistungsEditboxHeader"),
  label("rechnung.editor.leistungsEditbox.header.title", "Leistungsposition bearbeiten", "rechnung.editor.leistungsEditbox.header", 108),
  action("rechnung.editor.leistungsEditbox.action.addTitle", "Titel anlegen", "rechnung.editor.leistungsEditbox.header", 109, "addTitle"),
  action("rechnung.editor.leistungsEditbox.action.addPosition", "Position anlegen", "rechnung.editor.leistungsEditbox.header", 110, "addPosition"),
  action("rechnung.editor.leistungsEditbox.action.move", "Position schieben", "rechnung.editor.leistungsEditbox.header", 111, "movePosition"),
  action("rechnung.editor.leistungsEditbox.action.delete", "Position löschen", "rechnung.editor.leistungsEditbox.header", 112, "deletePosition"),

  group("rechnung.editor.leistungsEditbox.row.meta", "Kopfzeile Position", "rechnung.editor.leistungsEditbox", 120, "leistungsEditboxMetaRow"),
  field("rechnung.editor.leistungsEditbox.positionNumber", "Positionsnummer", "rechnung.editor.leistungsEditbox.row.meta", 121, "readOnlyText"),
  label("rechnung.editor.leistungsEditbox.positionNumber.label", "Positionsnummer Bezeichnung", "rechnung.editor.leistungsEditbox.row.meta", 122, "fieldLabel", "fieldLabel"),
  field("rechnung.editor.leistungsEditbox.type", "Positionstyp", "rechnung.editor.leistungsEditbox.row.meta", 123, "select"),
  label("rechnung.editor.leistungsEditbox.type.label", "Positionstyp Bezeichnung", "rechnung.editor.leistungsEditbox.row.meta", 124, "fieldLabel", "fieldLabel"),
  field("rechnung.editor.leistungsEditbox.assignment", "Zuordnung", "rechnung.editor.leistungsEditbox.row.meta", 125, "readOnlyText"),
  label("rechnung.editor.leistungsEditbox.assignment.label", "Zuordnung Bezeichnung", "rechnung.editor.leistungsEditbox.row.meta", 126, "fieldLabel", "fieldLabel"),
  field("rechnung.editor.leistungsEditbox.nep", "NEP", "rechnung.editor.leistungsEditbox.row.meta", 127, "checkbox"),
  label("rechnung.editor.leistungsEditbox.nep.label", "NEP Bezeichnung", "rechnung.editor.leistungsEditbox.row.meta", 128, "fieldLabel", "fieldLabel"),

  group("rechnung.editor.leistungsEditbox.row.shortPrice", "Kurztext und Preise", "rechnung.editor.leistungsEditbox", 130, "leistungsEditboxShortPriceRow"),
  field("rechnung.editor.leistungsEditbox.shortText", "Kurztext", "rechnung.editor.leistungsEditbox.row.shortPrice", 131, "singleLineText"),
  label("rechnung.editor.leistungsEditbox.shortText.label", "Kurztext Bezeichnung", "rechnung.editor.leistungsEditbox.row.shortPrice", 132, "fieldLabel", "fieldLabel"),
  label("rechnung.editor.leistungsEditbox.shortText.remaining", "Kurztext Restzeichen", "rechnung.editor.leistungsEditbox.row.shortPrice", 133, "status", "remainingCharacters"),
  field("rechnung.editor.leistungsEditbox.quantity", "Menge", "rechnung.editor.leistungsEditbox.row.shortPrice", 134, "singleLineText"),
  label("rechnung.editor.leistungsEditbox.quantity.label", "Menge Bezeichnung", "rechnung.editor.leistungsEditbox.row.shortPrice", 135, "fieldLabel", "fieldLabel"),
  field("rechnung.editor.leistungsEditbox.unit", "Einheit", "rechnung.editor.leistungsEditbox.row.shortPrice", 136, "singleLineText"),
  label("rechnung.editor.leistungsEditbox.unit.label", "Einheit Bezeichnung", "rechnung.editor.leistungsEditbox.row.shortPrice", 137, "fieldLabel", "fieldLabel"),
  field("rechnung.editor.leistungsEditbox.unitPrice", "Einzelpreis", "rechnung.editor.leistungsEditbox.row.shortPrice", 138, "singleLineText"),
  label("rechnung.editor.leistungsEditbox.unitPrice.label", "Einzelpreis Bezeichnung", "rechnung.editor.leistungsEditbox.row.shortPrice", 139, "fieldLabel", "fieldLabel"),
  field("rechnung.editor.leistungsEditbox.positionAmount", "Gesamtpreis", "rechnung.editor.leistungsEditbox.row.shortPrice", 140, "readOnlyText"),
  label("rechnung.editor.leistungsEditbox.positionAmount.label", "Gesamtpreis Bezeichnung", "rechnung.editor.leistungsEditbox.row.shortPrice", 141, "fieldLabel", "fieldLabel"),

  group("rechnung.editor.leistungsEditbox.quantityDecimals", "Mengen-Nachkommastellen", "rechnung.editor.leistungsEditbox.row.shortPrice", 142, "decimalControl"),
  action("rechnung.editor.leistungsEditbox.quantityDecimals.decrease", "Weniger Mengen-Nachkommastellen", "rechnung.editor.leistungsEditbox.quantityDecimals", 143, "decreaseDecimalPlaces"),
  label("rechnung.editor.leistungsEditbox.quantityDecimals.pattern", "Mengen-Nachkommastellen Anzeige", "rechnung.editor.leistungsEditbox.quantityDecimals", 144, "content", "decimalPattern"),
  action("rechnung.editor.leistungsEditbox.quantityDecimals.increase", "Mehr Mengen-Nachkommastellen", "rechnung.editor.leistungsEditbox.quantityDecimals", 145, "increaseDecimalPlaces"),

  group("rechnung.editor.leistungsEditbox.row.longModule", "Langtext und Modulfläche", "rechnung.editor.leistungsEditbox", 150, "leistungsEditboxLongModuleRow"),
  field("rechnung.editor.leistungsEditbox.longText", "Langtext", "rechnung.editor.leistungsEditbox.row.longModule", 151, "multilineText"),
  label("rechnung.editor.leistungsEditbox.longText.label", "Langtext Bezeichnung", "rechnung.editor.leistungsEditbox.row.longModule", 152, "fieldLabel", "fieldLabel"),
  label("rechnung.editor.leistungsEditbox.longText.remaining", "Langtext Restzeichen", "rechnung.editor.leistungsEditbox.row.longModule", 153, "status", "remainingCharacters"),
  area("rechnung.editor.leistungsEditbox.moduleArea", "Freie Fachmodulfläche", "rechnung.editor.leistungsEditbox.row.longModule", 154, "moduleExtensionArea"),
]);

export const rechnungLeistungsEditboxUiEditorContract = m83Component({
  componentId: RECHNUNG_LEISTUNGSEDITBOX_COMPONENT_ID,
  scopeId: RECHNUNG_SCOPE_ID,
  requiredSlots: elements.map((entry) => entry.id),
  slots: elements.map((entry) => m83Slot(entry.id, entry)),
});
