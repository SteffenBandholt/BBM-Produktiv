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

const rootId = "rechnung.editor.leistungsEditbox";
const groupLayout = Object.freeze(["move", "resizeWidth", "resizeHeight"]);
const group = (id, name, parentId, order, componentKind) => m83Element({
  id, name, type: "group", role: "layoutGroup", parentId, order,
  allowedOps: GROUP_LAYOUT, componentKind,
});
const label = (id, name, parentId, order, role = "fieldLabel") => m83Element({
  id, name, type: "label", role, parentId, order,
  allowedOps: TEXT_LAYOUT, componentKind: "label",
});
const field = (id, name, parentId, order, fieldKind, componentKind = "input") => m83Element({
  id, name, type: "field", role: "dataFieldLayout", parentId, order,
  allowedOps: FIELD_LAYOUT, fieldKind, componentKind,
  ...(fieldKind === "multilineText"
    ? { baseline: { width: null, height: null, minWidth: 120, maxWidth: 1880, minHeight: 24, maxHeight: 720 } }
    : {}),
});
const action = (id, name, parentId, order, actionKind) => m83DomainButton({
  id, name, parentId, order, actionKind,
});

const elements = Object.freeze([
  m83Element({
    id: "rechnung.editor.leistungsEditbox.workbench",
    name: "Rechnung LeistungsEditbox Arbeitsbereich",
    type: "group",
    role: "layoutGroup",
    parentId: rootId,
    order: 10,
    allowedOps: groupLayout,
    componentKind: "workbench",
  }),
  group("rechnung.editor.leistungsEditbox.header", "Kopf Leistungsposition bearbeiten", "rechnung.editor.leistungsEditbox.workbench", 20, "header"),
  label("rechnung.editor.leistungsEditbox.header.title", "Leistungsposition bearbeiten", "rechnung.editor.leistungsEditbox.header", 21),
  group("rechnung.editor.leistungsEditbox.header.actions.left", "Gruppe Position anlegen", "rechnung.editor.leistungsEditbox.header", 22, "actionGroup"),
  action("rechnung.editor.leistungsEditbox.action.addTitle", "+Titel", "rechnung.editor.leistungsEditbox.header.actions.left", 23, "createTitle"),
  action("rechnung.editor.leistungsEditbox.action.addPosition", "+Position", "rechnung.editor.leistungsEditbox.header.actions.left", 24, "createPosition"),
  group("rechnung.editor.leistungsEditbox.header.actions.right", "Gruppe Positionsaktionen", "rechnung.editor.leistungsEditbox.header", 25, "actionGroup"),
  action("rechnung.editor.leistungsEditbox.action.move", "Schieben", "rechnung.editor.leistungsEditbox.header.actions.right", 26, "movePosition"),
  action("rechnung.editor.leistungsEditbox.action.delete", "Papierkorb", "rechnung.editor.leistungsEditbox.header.actions.right", 27, "deletePosition"),

  m83Element({
    id: "rechnung.editor.leistungsEditbox.content",
    name: "Gemeinsamer Editbox-Kern",
    type: "group",
    role: "fieldCollection",
    parentId: "rechnung.editor.leistungsEditbox.workbench",
    order: 40,
    allowedOps: groupLayout,
    componentKind: "editbox",
    preserveTarget: true,
  }),

  group("rechnung.editor.leistungsEditbox.shortText.wrapper", "Gruppe Kurztext", "rechnung.editor.leistungsEditbox.content", 41, "fieldGroup"),
  label("rechnung.editor.leistungsEditbox.shortText.label", "Bezeichnung Kurztext", "rechnung.editor.leistungsEditbox.shortText.wrapper", 42),
  label("rechnung.editor.leistungsEditbox.shortText.remaining", "Restzeichen Kurztext", "rechnung.editor.leistungsEditbox.shortText.wrapper", 43, "status"),
  field("rechnung.editor.leistungsEditbox.shortText", "Eingabefeld Kurztext", "rechnung.editor.leistungsEditbox.shortText.wrapper", 44, "text"),

  group("rechnung.editor.leistungsEditbox.longText.wrapper", "Gruppe Langtext", "rechnung.editor.leistungsEditbox.content", 50, "fieldGroup"),
  label("rechnung.editor.leistungsEditbox.longText.label", "Bezeichnung Langtext", "rechnung.editor.leistungsEditbox.longText.wrapper", 51),
  label("rechnung.editor.leistungsEditbox.longText.remaining", "Restzeichen Langtext", "rechnung.editor.leistungsEditbox.longText.wrapper", 52, "status"),
  field("rechnung.editor.leistungsEditbox.longText", "Eingabefeld Langtext", "rechnung.editor.leistungsEditbox.longText.wrapper", 53, "multilineText", "textarea"),

  group("rechnung.editor.leistungsEditbox.meta", "Rechnungsspezifische Positionsdaten", "rechnung.editor.leistungsEditbox.content", 60, "metaPanel"),

  ...[
    ["positionNumber", "Positionsnummer", "readOnlyText", 70],
    ["type", "Positionstyp", "select", 80],
    ["assignment", "Zuordnung", "readOnlyText", 90],
    ["nep", "NEP", "checkbox", 100],
    ["quantity", "Menge", "singleLineText", 110],
    ["unit", "Einheit", "singleLineText", 120],
    ["unitPrice", "Einzelpreis", "singleLineText", 130],
    ["positionAmount", "Gesamtpreis", "readOnlyText", 140],
  ].flatMap(([key, name, fieldKind, order]) => [
    group(`rechnung.editor.leistungsEditbox.${key}.wrapper`, `Gruppe ${name}`, "rechnung.editor.leistungsEditbox.meta", order, "fieldGroup"),
    label(`rechnung.editor.leistungsEditbox.${key}.label`, `Bezeichnung ${name}`, `rechnung.editor.leistungsEditbox.${key}.wrapper`, order + 1),
    field(
      `rechnung.editor.leistungsEditbox.${key}`,
      `Eingabefeld ${name}`,
      `rechnung.editor.leistungsEditbox.${key}.wrapper`,
      order + 2,
      fieldKind,
      fieldKind === "select" ? "select" : fieldKind === "checkbox" ? "checkbox" : "input",
    ),
  ]),

  group("rechnung.editor.leistungsEditbox.quantityDecimals", "Mengen-Nachkommastellen", "rechnung.editor.leistungsEditbox.quantity.wrapper", 113, "decimalControl"),
  action("rechnung.editor.leistungsEditbox.quantityDecimals.decrease", "Weniger Mengen-Nachkommastellen", "rechnung.editor.leistungsEditbox.quantityDecimals", 114, "decreaseDecimalPlaces"),
  label("rechnung.editor.leistungsEditbox.quantityDecimals.pattern", "Mengen-Nachkommastellen Anzeige", "rechnung.editor.leistungsEditbox.quantityDecimals", 115, "status"),
  action("rechnung.editor.leistungsEditbox.quantityDecimals.increase", "Mehr Mengen-Nachkommastellen", "rechnung.editor.leistungsEditbox.quantityDecimals", 116, "increaseDecimalPlaces"),

  m83Element({
    id: "rechnung.editor.leistungsEditbox.moduleArea",
    name: "Freie Fachmodulfläche",
    type: "area",
    role: "layout",
    parentId: "rechnung.editor.leistungsEditbox.meta",
    order: 150,
    allowedOps: GROUP_LAYOUT,
    componentKind: "moduleExtensionArea",
  }),
]);

export const rechnungLeistungsEditboxUiEditorContract = m83Component({
  componentId: RECHNUNG_LEISTUNGSEDITBOX_COMPONENT_ID,
  scopeId: RECHNUNG_SCOPE_ID,
  requiredSlots: elements.map((entry) => entry.id),
  slots: elements.map((entry) => m83Slot(entry.id, entry)),
});