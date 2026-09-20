import { DOMAIN_LOCKS, m83Component, m83DomainButton, m83Element, m83Slot } from "../../../ui-editor/m83ComponentContract.js";

export const OVERVIEW_SCOPE = "projektverwaltung.overview";
export const OVERVIEW_COMPONENT = "bbm.projektverwaltung.overview";
const element = values => {
  const { baseline = {}, ...elementValues } = values;
  return m83Element({ ...elementValues, lockedOps: DOMAIN_LOCKS,
    baseline: { minWidth: 8, maxWidth: 2400, minHeight: 8, maxHeight: 1600, minFontSize: 6, maxFontSize: 32, ...baseline } });
};
const id = suffix => OVERVIEW_SCOPE + suffix;
const elements = [
  element({ id: id(""), name: "Projektübersicht", type: "root", role: "scopeRoot", parentId: null, order: 0 }),
  element({ id: id(".toolbar"), name: "Projektaktionen", type: "toolbar", role: "layout", selectionKind: "group", parentId: id(""), order: 1 }),
  m83DomainButton({ id: id(".toolbar.create"), name: "+ Projekt anlegen", parentId: id(".toolbar"), order: 2, actionKind: "createProject" }),
  m83DomainButton({ id: id(".toolbar.transfer"), name: "Import / Export", parentId: id(".toolbar"), order: 3, actionKind: "transferProject" }),
  element({ id: id(".grid"), name: "Projekte", type: "area", role: "layout", parentId: id(""), order: 4 }),
  element({ id: id(".card"), name: "Projektkachel", type: "card", role: "content", selectionKind: "group", parentId: id(".grid"), order: 5,
    baseline: { maxWidth: 240 } }),
  element({ id: id(".card.header"), name: "Kachelkopf", type: "group", role: "layout", parentId: id(".card"), order: 6 }),
  element({ id: id(".card.header.number"), name: "Projektnummer", type: "label", role: "meta", parentId: id(".card.header"), order: 7 }),
  m83DomainButton({ id: id(".card.header.edit"), name: "Bearbeiten", parentId: id(".card.header"), order: 8, actionKind: "editProject" }),
  element({ id: id(".card.name"), name: "Projektname", type: "label", role: "content", parentId: id(".card"), order: 9 }),
  element({ id: id(".card.short"), name: "Kurzbezeichnung", type: "label", role: "content", parentId: id(".card"), order: 10 }),
  element({ id: id(".card.address"), name: "Bauvorhabenadresse", type: "label", role: "content", parentId: id(".card"), order: 11 }),
];
export const projectOverviewUiEditorContract = m83Component({
  componentId: OVERVIEW_COMPONENT, scopeId: OVERVIEW_SCOPE,
  requiredSlots: elements.slice(0, 5).map(entry => entry.id),
  slots: elements.map((entry, index) => m83Slot(entry.id, entry, index < 5 ? {} : {
    required: false, referenceKind: "multi", presence: "whenVisibleInstances",
  })),
});
