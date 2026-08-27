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

function unrestrictedEffects(parentId) {
  if (!parentId) return {};
  return {
    operationEffects: {
      move: "parentReflowRequired",
      resizeWidth: "parentReflowRequired",
      resizeHeight: "parentReflowRequired",
      textResize: "parentReflowRequired",
      setVisibility: "parentReflowRequired",
    },
    operationAffectedIds: {
      move: [parentId],
      resizeWidth: [parentId],
      resizeHeight: [parentId],
      textResize: [parentId],
      setVisibility: [parentId],
    },
  };
}

const freeElement = (values) => m83Element({
  ...values,
  ...unrestrictedEffects(values.parentId),
  unboundedGeometry: true,
});
const area = (id, name, parentId, order, componentKind) => freeElement({ id, name, type: "area", role: "layout", parentId, order, allowedOps: GROUP_LAYOUT, componentKind });
const group = (id, name, parentId, order, componentKind) => freeElement({ id, name, type: "group", role: "layout", parentId, order, allowedOps: GROUP_LAYOUT, componentKind });
const label = (id, name, parentId, order, role = "content", componentKind = "label") => freeElement({ id, name, type: "label", role, parentId, order, allowedOps: TEXT_LAYOUT, componentKind });
const field = (id, name, parentId, order, fieldKind) => freeElement({ id, name, type: "field", role: "content", parentId, order, allowedOps: FIELD_LAYOUT, fieldKind });
const action = (id, name, parentId, order, actionKind) => m83DomainButton({
  id,
  name,
  parentId,
  order,
  actionKind,
  unboundedGeometry: true,
  fitChromeToOuterSize: false,
  ...unrestrictedEffects(parentId),
});

const wrapper = (id, name, parentId, order) => group(id, name, parentId, order, "leistungsEditboxFieldWrapper");

const elements = Object.freeze([
  area("rechnung.editor.leistungsEditbox.frameHeader", "Rahmen Kopfbereich", "rechnung.editor.leistungsEditbox", 1061, "leistungsEditboxFrameHeader"),
  area("rechnung.editor.leistungsEditbox.frameContent", "Rahmen Inhaltsbereich", "rechnung.editor.leistungsEditbox", 1062, "leistungsEditboxFrameContent"),

  group("rechnung.editor.leistungsEditbox.header", "Kopf LeistungsEditbox", "rechnung.editor.leistungsEditbox.frameHeader", 1070, "leistungsEditboxHeader"),
  label("rechnung.editor.leistungsEditbox.header.title", "Leistungsposition bearbeiten", "rechnung.editor.leistungsEditbox.header", 1071),
  group("rechnung.editor.leistungsEditbox.header.actions", "Aktionsbereich", "rechnung.editor.leistungsEditbox.header", 1072, "leistungsEditboxActions"),
  group("rechnung.editor.leistungsEditbox.header.actions.left", "Aktionsgruppe links", "rechnung.editor.leistungsEditbox.header.actions", 1073, "leistungsEditboxActionGroup"),
  group("rechnung.editor.leistungsEditbox.header.actions.center", "Aktionsgruppe mitte", "rechnung.editor.leistungsEditbox.header.actions", 1074, "leistungsEditboxActionGroup"),
  group("rechnung.editor.leistungsEditbox.header.actions.right", "Aktionsgruppe rechts", "rechnung.editor.leistungsEditbox.header.actions", 1075, "leistungsEditboxActionGroup"),
  action("rechnung.editor.leistungsEditbox.action.addTitle", "Titel anlegen", "rechnung.editor.leistungsEditbox.header.actions.left", 1080, "addTitle"),
  action("rechnung.editor.leistungsEditbox.action.addPosition", "Position anlegen", "rechnung.editor.leistungsEditbox.header.actions.left", 1081, "addPosition"),
  action("rechnung.editor.leistungsEditbox.action.move", "Position schieben", "rechnung.editor.leistungsEditbox.header.actions.center", 1082, "movePosition"),
  action("rechnung.editor.leistungsEditbox.action.delete", "Position löschen", "rechnung.editor.leistungsEditbox.header.actions.right", 1083, "deletePosition"),

  group("rechnung.editor.leistungsEditbox.content", "LeistungsEditbox Inhalt", "rechnung.editor.leistungsEditbox.frameContent", 1100, "leistungsEditboxContent"),
  group("rechnung.editor.leistungsEditbox.row.meta", "Kopfzeile Position", "rechnung.editor.leistungsEditbox.content", 1110, "leistungsEditboxMetaRow"),

  wrapper("rechnung.editor.leistungsEditbox.positionNumber.wrapper", "Positionsnummer Feldgruppe", "rechnung.editor.leistungsEditbox.row.meta", 1111),
  field("rechnung.editor.leistungsEditbox.positionNumber", "Positionsnummer", "rechnung.editor.leistungsEditbox.positionNumber.wrapper", 1112, "readOnlyText"),
  label("rechnung.editor.leistungsEditbox.positionNumber.label", "Positionsnummer Bezeichnung", "rechnung.editor.leistungsEditbox.positionNumber.wrapper", 1113, "fieldLabel", "fieldLabel"),

  wrapper("rechnung.editor.leistungsEditbox.type.wrapper", "Positionstyp Feldgruppe", "rechnung.editor.leistungsEditbox.row.meta", 1120),
  field("rechnung.editor.leistungsEditbox.type", "Positionstyp", "rechnung.editor.leistungsEditbox.type.wrapper", 1121, "select"),
  label("rechnung.editor.leistungsEditbox.type.label", "Positionstyp Bezeichnung", "rechnung.editor.leistungsEditbox.type.wrapper", 1122, "fieldLabel", "fieldLabel"),

  wrapper("rechnung.editor.leistungsEditbox.assignment.wrapper", "Zuordnung Feldgruppe", "rechnung.editor.leistungsEditbox.row.meta", 1130),
  field("rechnung.editor.leistungsEditbox.assignment", "Zuordnung", "rechnung.editor.leistungsEditbox.assignment.wrapper", 1131, "readOnlyText"),
  label("rechnung.editor.leistungsEditbox.assignment.label", "Zuordnung Bezeichnung", "rechnung.editor.leistungsEditbox.assignment.wrapper", 1132, "fieldLabel", "fieldLabel"),

  wrapper("rechnung.editor.leistungsEditbox.nep.wrapper", "NEP Feldgruppe", "rechnung.editor.leistungsEditbox.row.meta", 1140),
  field("rechnung.editor.leistungsEditbox.nep", "NEP", "rechnung.editor.leistungsEditbox.nep.wrapper", 1141, "checkbox"),
  label("rechnung.editor.leistungsEditbox.nep.label", "NEP Bezeichnung", "rechnung.editor.leistungsEditbox.nep.wrapper", 1142, "fieldLabel", "fieldLabel"),

  group("rechnung.editor.leistungsEditbox.row.shortPrice", "Kurztext und Preise", "rechnung.editor.leistungsEditbox.content", 1200, "leistungsEditboxShortPriceRow"),
  group("rechnung.editor.leistungsEditbox.row.short", "Kurztext Zeile", "rechnung.editor.leistungsEditbox.row.shortPrice", 1210, "leistungsEditboxShortRow"),
  wrapper("rechnung.editor.leistungsEditbox.shortText.wrapper", "Kurztext Feldgruppe", "rechnung.editor.leistungsEditbox.row.short", 1211),
  field("rechnung.editor.leistungsEditbox.shortText", "Kurztext", "rechnung.editor.leistungsEditbox.shortText.wrapper", 1212, "singleLineText"),
  label("rechnung.editor.leistungsEditbox.shortText.label", "Kurztext Bezeichnung", "rechnung.editor.leistungsEditbox.shortText.wrapper", 1213, "fieldLabel", "fieldLabel"),
  label("rechnung.editor.leistungsEditbox.shortText.remaining", "Kurztext Restzeichen", "rechnung.editor.leistungsEditbox.shortText.label", 1214, "status", "remainingCharacters"),

  group("rechnung.editor.leistungsEditbox.row.prices", "Mengen und Preise Zeile", "rechnung.editor.leistungsEditbox.row.shortPrice", 1220, "leistungsEditboxPriceRow"),
  wrapper("rechnung.editor.leistungsEditbox.quantity.wrapper", "Menge Feldgruppe", "rechnung.editor.leistungsEditbox.row.prices", 1221),
  field("rechnung.editor.leistungsEditbox.quantity", "Menge", "rechnung.editor.leistungsEditbox.quantity.wrapper", 1222, "singleLineText"),
  label("rechnung.editor.leistungsEditbox.quantity.label", "Menge Bezeichnung", "rechnung.editor.leistungsEditbox.quantity.wrapper", 1223, "fieldLabel", "fieldLabel"),
  group("rechnung.editor.leistungsEditbox.quantityDecimals", "Mengen-Nachkommastellen", "rechnung.editor.leistungsEditbox.quantity.label", 1224, "decimalControl"),
  action("rechnung.editor.leistungsEditbox.quantityDecimals.decrease", "Weniger Mengen-Nachkommastellen", "rechnung.editor.leistungsEditbox.quantityDecimals", 1225, "decreaseDecimalPlaces"),
  label("rechnung.editor.leistungsEditbox.quantityDecimals.pattern", "Mengen-Nachkommastellen Anzeige", "rechnung.editor.leistungsEditbox.quantityDecimals", 1226, "content", "decimalPattern"),
  action("rechnung.editor.leistungsEditbox.quantityDecimals.increase", "Mehr Mengen-Nachkommastellen", "rechnung.editor.leistungsEditbox.quantityDecimals", 1227, "increaseDecimalPlaces"),

  wrapper("rechnung.editor.leistungsEditbox.unit.wrapper", "Einheit Feldgruppe", "rechnung.editor.leistungsEditbox.row.prices", 1230),
  field("rechnung.editor.leistungsEditbox.unit", "Einheit", "rechnung.editor.leistungsEditbox.unit.wrapper", 1231, "singleLineText"),
  label("rechnung.editor.leistungsEditbox.unit.label", "Einheit Bezeichnung", "rechnung.editor.leistungsEditbox.unit.wrapper", 1232, "fieldLabel", "fieldLabel"),

  wrapper("rechnung.editor.leistungsEditbox.unitPrice.wrapper", "Einzelpreis Feldgruppe", "rechnung.editor.leistungsEditbox.row.prices", 1240),
  field("rechnung.editor.leistungsEditbox.unitPrice", "Einzelpreis", "rechnung.editor.leistungsEditbox.unitPrice.wrapper", 1241, "singleLineText"),
  label("rechnung.editor.leistungsEditbox.unitPrice.label", "Einzelpreis Bezeichnung", "rechnung.editor.leistungsEditbox.unitPrice.wrapper", 1242, "fieldLabel", "fieldLabel"),

  wrapper("rechnung.editor.leistungsEditbox.positionAmount.wrapper", "Gesamtpreis Feldgruppe", "rechnung.editor.leistungsEditbox.row.prices", 1250),
  field("rechnung.editor.leistungsEditbox.positionAmount", "Gesamtpreis", "rechnung.editor.leistungsEditbox.positionAmount.wrapper", 1251, "readOnlyText"),
  label("rechnung.editor.leistungsEditbox.positionAmount.label", "Gesamtpreis Bezeichnung", "rechnung.editor.leistungsEditbox.positionAmount.wrapper", 1252, "fieldLabel", "fieldLabel"),

  group("rechnung.editor.leistungsEditbox.row.longModule", "Langtext und Modulfläche", "rechnung.editor.leistungsEditbox.content", 1300, "leistungsEditboxLongModuleRow"),
  group("rechnung.editor.leistungsEditbox.row.long", "Langtext Zeile", "rechnung.editor.leistungsEditbox.row.longModule", 1310, "leistungsEditboxLongRow"),
  wrapper("rechnung.editor.leistungsEditbox.longText.wrapper", "Langtext Feldgruppe", "rechnung.editor.leistungsEditbox.row.long", 1311),
  field("rechnung.editor.leistungsEditbox.longText", "Langtext", "rechnung.editor.leistungsEditbox.longText.wrapper", 1312, "multilineText"),
  label("rechnung.editor.leistungsEditbox.longText.label", "Langtext Bezeichnung", "rechnung.editor.leistungsEditbox.longText.wrapper", 1313, "fieldLabel", "fieldLabel"),
  label("rechnung.editor.leistungsEditbox.longText.remaining", "Langtext Restzeichen", "rechnung.editor.leistungsEditbox.longText.label", 1314, "status", "remainingCharacters"),
  area("rechnung.editor.leistungsEditbox.moduleArea", "Freie Fachmodulfläche", "rechnung.editor.leistungsEditbox.row.longModule", 1320, "moduleExtensionArea"),
]);

export const rechnungLeistungsEditboxUiEditorContract = m83Component({
  componentId: RECHNUNG_LEISTUNGSEDITBOX_COMPONENT_ID,
  scopeId: RECHNUNG_SCOPE_ID,
  requiredSlots: elements.map((entry) => entry.id),
  slots: elements.map((entry) => m83Slot(entry.id, entry)),
});
