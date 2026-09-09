import { DOMAIN_LOCKS, m83Component, m83DomainButton, m83Element, m83Slot } from "../../../ui-editor/m83ComponentContract.js";

export const BUILDER_SCOPE = "projektverwaltung.builder";
export const BUILDER_COMPONENT = "bbm.projektverwaltung.builder";
const element = (suffix, name, type, role, parentId, order) => m83Element({
  id: BUILDER_SCOPE + suffix, name, type, role, parentId, order,
  ...(type === "field" ? { fieldKind: "select", componentKind: "select" } : {}),
  lockedOps: DOMAIN_LOCKS,
  baseline: { minWidth: 8, maxWidth: 2400, minHeight: 8, maxHeight: 1600, minFontSize: 6, maxFontSize: 32 },
});
const elements = [
  element("", "Bauherr-Zuordnung", "root", "scopeRoot", null, 0),
  element(".group", "Bauherr-Auswahl", "fieldGroup", "layout", BUILDER_SCOPE, 1),
  element(".label", "Bauherr", "label", "content", `${BUILDER_SCOPE}.group`, 2),
  element(".input", "Bauherr", "field", "dataFieldLayout", `${BUILDER_SCOPE}.group`, 3),
  element(".hint", "Hinweis zur Bauherr-Auswahl", "label", "content", BUILDER_SCOPE, 4),
  element(".status", "Bauherr-Angaben und Ladestatus", "label", "status", BUILDER_SCOPE, 5),
  m83DomainButton({ id: `${BUILDER_SCOPE}.refresh`, name: "Firmenauswahl aktualisieren", parentId: BUILDER_SCOPE, order: 6, actionKind: "refreshBuilderOptions" }),
  m83DomainButton({ id: `${BUILDER_SCOPE}.editor`, name: "UI-Editor", parentId: BUILDER_SCOPE, order: 7, actionKind: "openUiEditor" }),
];
export const projectBuilderUiEditorContract = m83Component({
  componentId: BUILDER_COMPONENT, scopeId: BUILDER_SCOPE,
  requiredSlots: elements.slice(0, 7).map(entry => entry.id),
  slots: elements.map((entry, index) => m83Slot(entry.id, entry,
    index === 7 ? { required: false, referenceKind: "multi", presence: "whenVisibleInstances" } : {})),
});
