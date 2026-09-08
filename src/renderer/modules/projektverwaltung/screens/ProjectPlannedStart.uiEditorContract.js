import { DOMAIN_LOCKS, m83Component, m83DomainButton, m83Element, m83Slot } from "../../../ui-editor/m83ComponentContract.js";

export const PLANNED_START_SCOPE = "projektverwaltung.plannedStart";
export const PLANNED_START_COMPONENT = "bbm.projektverwaltung.plannedStart";
const element = (suffix, name, type, role, parentId, order) => m83Element({
  id: PLANNED_START_SCOPE + suffix, name, type, role, parentId, order,
  ...(type === "field" ? { fieldKind: "date", componentKind: "dateInput" } : {}),
  lockedOps: DOMAIN_LOCKS,
  baseline: { minWidth: 8, maxWidth: 2400, minHeight: 8, maxHeight: 1600, minFontSize: 6, maxFontSize: 32 },
});
const elements = [
  element("", "Geplanter Baubeginn – Zeile", "root", "scopeRoot", null, 0),
  element(".group", "Geplanter Baubeginn – Feldgruppe", "fieldGroup", "layout", PLANNED_START_SCOPE, 1),
  element(".label", "Geplanter Baubeginn", "label", "content", `${PLANNED_START_SCOPE}.group`, 2),
  element(".input", "Geplanter Baubeginn", "field", "date", `${PLANNED_START_SCOPE}.group`, 3),
  m83DomainButton({ id: `${PLANNED_START_SCOPE}.editor`, name: "UI-Editor", parentId: PLANNED_START_SCOPE, order: 4, actionKind: "openUiEditor" }),
];

export const projectPlannedStartUiEditorContract = m83Component({
  componentId: PLANNED_START_COMPONENT, scopeId: PLANNED_START_SCOPE,
  requiredSlots: elements.slice(0, 4).map(entry => entry.id),
  slots: elements.map((entry, index) => m83Slot(entry.id, entry,
    index === 4 ? { required: false, referenceKind: "multi", presence: "whenVisibleInstances" } : {})),
});
