import {
  DOMAIN_LOCKS,
  GROUP_LAYOUT,
  TEXT_LAYOUT,
  m83Component,
  m83DomainButton,
  m83Element,
  m83Slot,
} from "../../../ui-editor/m83ComponentContract.js";

const scopeId = "protokoll.screen.root";
const protokollGroupLayout = Object.freeze(["move", "resizeWidth", "resizeHeight"]);

const screenElements = [
  m83Element({ id: scopeId, name: "Protokoll-TopScreen", type: "root", role: "scopeRoot", parentId: null, order: 0, allowedOps: [], componentKind: "screen" }),
  m83Element({ id: "protokoll.header", name: "Protokoll-Kopfbereich", type: "area", role: "contentArea", parentId: scopeId, order: 10, allowedOps: GROUP_LAYOUT, componentKind: "header" }),
  m83Element({ id: "protokoll.header.titleGroup", name: "Gruppe Protokollbezeichnung", type: "group", role: "layoutGroup", parentId: "protokoll.header", order: 20, allowedOps: protokollGroupLayout, componentKind: "titleGroup" }),
  m83Element({ id: "protokoll.header.title", name: "Bezeichnung Protokoll", type: "label", role: "fieldLabel", parentId: "protokoll.header.titleGroup", order: 21, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  m83Element({ id: "protokoll.header.keyword", name: "Schlagwort", type: "label", role: "dataFieldLayout", parentId: "protokoll.header.titleGroup", order: 22, allowedOps: TEXT_LAYOUT, componentKind: "interactiveLabel", lockedOps: DOMAIN_LOCKS }),
  m83Element({ id: "protokoll.header.context", name: "Protokollkontext", type: "label", role: "status", parentId: "protokoll.header.titleGroup", order: 23, allowedOps: TEXT_LAYOUT, componentKind: "label" }),
  m83Element({ id: "protokoll.header.actions", name: "Gruppe Protokoll-Aktionen", type: "group", role: "layoutGroup", parentId: "protokoll.header", order: 40, allowedOps: GROUP_LAYOUT, componentKind: "actionGroup" }),
  m83DomainButton({ id: "protokoll.header.action.endMeeting", name: "Protokoll beenden", parentId: "protokoll.header.actions", order: 41, actionKind: "endMeeting" }),
  m83DomainButton({ id: "protokoll.header.action.close", name: "Schliessen", parentId: "protokoll.header.actions", order: 42, actionKind: "close" }),
  m83DomainButton({ id: "protokoll.header.action.openUiEditor", name: "UI-Editor öffnen", parentId: "protokoll.header.actions", order: 43, actionKind: "developmentOpenUiEditor" }),
];

const quicklaneElements = [
  m83Element({ id: "protokoll.topsScreen.quicklane", name: "Protokoll-Quicklane", type: "area", role: "layout", parentId: scopeId, order: 40, allowedOps: protokollGroupLayout, componentKind: "toolbar" }),
  ...[["navigation", "Navigation", 41], ["visibility", "Sichtbarkeit", 42], ["filter", "TOP-Filter", 43], ["output", "Ausgabe", 44]].map(([key, name, order]) => m83Element({ id: `protokoll.topsScreen.quicklane.group.${key}`, name: `Gruppe ${name}`, type: "group", role: "layoutGroup", parentId: "protokoll.topsScreen.quicklane", order, allowedOps: GROUP_LAYOUT, componentKind: "toolbarGroup" })),
  ...[
    ["pin", "Fixieren", "navigation", 50], ["action.project", "Projekt", "navigation", 51], ["action.firms", "Firmen", "navigation", 52], ["action.participants", "Teilnehmer", "navigation", 53],
    ["action.ampel", "Ampel", "visibility", 54], ["action.longtext", "Langtext", "visibility", 55], ["action.topFilter", "TOP-Filter", "filter", 56],
    ["action.preview", "PDF-Vorschau", "output", 57], ["action.print", "Drucken", "output", 58], ["action.mail", "E-Mail", "output", 59],
  ].map(([key, name, group, order]) => m83DomainButton({ id: `protokoll.topsScreen.quicklane.${key}`, name, parentId: `protokoll.topsScreen.quicklane.group.${group}`, order, actionKind: "domainAction" })),
  m83Element({ id: "protokoll.topsScreen.quicklane.filter.menu", name: "TOP-Filterauswahl", type: "group", role: "layoutGroup", parentId: "protokoll.topsScreen.quicklane", order: 60, allowedOps: GROUP_LAYOUT, componentKind: "transientMenu" }),
  ...[["all", "Alle", 61], ["todo", "ToDo", 62], ["decision", "Beschluss", 63]].map(([key, name, order]) => m83DomainButton({ id: `protokoll.topsScreen.quicklane.filter.option.${key}`, name, parentId: "protokoll.topsScreen.quicklane.filter.menu", order, actionKind: "filter" })),
];

const elements = [...screenElements, ...quicklaneElements];
const optionalScreenSlotIds = new Set(["protokoll.header.action.openUiEditor"]);
const optionalQuicklaneSlotIds = new Set([
  "protokoll.topsScreen.quicklane.filter.menu",
  "protokoll.topsScreen.quicklane.filter.option.all",
  "protokoll.topsScreen.quicklane.filter.option.todo",
  "protokoll.topsScreen.quicklane.filter.option.decision",
]);

export const PROTOKOLL_SCREEN_REQUIRED_SLOTS = Object.freeze([
  scopeId, "protokoll.header", "protokoll.header.titleGroup", "protokoll.header.title", "protokoll.header.keyword", "protokoll.header.context",
  "protokoll.header.actions", "protokoll.header.action.endMeeting", "protokoll.header.action.close",
]);
export const PROTOKOLL_QUICKLANE_REQUIRED_SLOTS = Object.freeze([
  "protokoll.topsScreen.quicklane",
  ...["navigation", "visibility", "filter", "output"].map((key) => `protokoll.topsScreen.quicklane.group.${key}`),
  "protokoll.topsScreen.quicklane.pin", "protokoll.topsScreen.quicklane.action.project", "protokoll.topsScreen.quicklane.action.firms", "protokoll.topsScreen.quicklane.action.participants",
  "protokoll.topsScreen.quicklane.action.ampel", "protokoll.topsScreen.quicklane.action.longtext", "protokoll.topsScreen.quicklane.action.topFilter",
  "protokoll.topsScreen.quicklane.action.preview", "protokoll.topsScreen.quicklane.action.print", "protokoll.topsScreen.quicklane.action.mail",
]);

export const protokollScreenUiEditorContract = m83Component({
  componentId: "bbm.protokoll.screen",
  scopeId,
  requiredSlots: PROTOKOLL_SCREEN_REQUIRED_SLOTS,
  slots: screenElements.map((entry) => m83Slot(entry.id, entry, {
    required: !optionalScreenSlotIds.has(entry.id),
    referenceKind: optionalScreenSlotIds.has(entry.id) ? "multi" : "single",
    presence: optionalScreenSlotIds.has(entry.id) ? "whenVisibleInstances" : "always",
    requirements: { textResize: entry.type === "label", move: entry.allowedOps.includes("move") },
  })),
});

export const protokollQuicklaneUiEditorContract = m83Component({
  componentId: "bbm.protokoll.quicklane",
  scopeId,
  requiredSlots: PROTOKOLL_QUICKLANE_REQUIRED_SLOTS,
  slots: quicklaneElements.map((entry) => m83Slot(entry.id, entry, {
    required: !optionalQuicklaneSlotIds.has(entry.id),
    referenceKind: optionalQuicklaneSlotIds.has(entry.id) ? "multi" : "single",
    presence: optionalQuicklaneSlotIds.has(entry.id) ? "whenVisibleInstances" : "always",
    requirements: { move: entry.allowedOps.includes("move") },
  })),
});
