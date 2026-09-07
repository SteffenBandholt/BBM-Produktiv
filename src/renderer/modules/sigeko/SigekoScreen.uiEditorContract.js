import { DOMAIN_LOCKS, m83Component, m83DomainButton, m83Element, m83Slot } from "../../ui-editor/m83ComponentContract.js";

export const SIGEKO_SCOPE_ID = "sigeko.screen";
export const SIGEKO_COMPONENT_ID = "bbm.sigeko.screen";

const element = (id, name, type, role, parentId, order) => m83Element({
  id, name, type, role, parentId, order, lockedOps: DOMAIN_LOCKS,
  baseline: { minWidth: 8, maxWidth: 2400, minHeight: 8, maxHeight: 1600, minFontSize: 6, maxFontSize: 32 },
});
const elements = Object.freeze([
  element(SIGEKO_SCOPE_ID, "SiGeKo-Arbeitsbereich", "root", "scopeRoot", null, 0),
  element("sigeko.screen.header", "Kopfbereich", "group", "layout", SIGEKO_SCOPE_ID, 1),
  element("sigeko.screen.title", "SiGeKo", "label", "content", "sigeko.screen.header", 2),
  element("sigeko.screen.project", "Aktives Projekt", "label", "content", "sigeko.screen.header", 3),
  element("sigeko.screen.navigation", "Navigation", "group", "layout", SIGEKO_SCOPE_ID, 4),
  m83DomainButton({ id: "sigeko.screen.workspace", name: "Projektarbeitsbereich", parentId: "sigeko.screen.navigation", order: 5, actionKind: "navigateProjectWorkspace" }),
  m83DomainButton({ id: "sigeko.screen.projects", name: "Projekt wechseln", parentId: "sigeko.screen.navigation", order: 6, actionKind: "navigateProjects" }),
  element("sigeko.screen.notice", "Umsetzungsstand", "label", "status", SIGEKO_SCOPE_ID, 7),
  element("sigeko.screen.planned", "Geplante Bereiche – noch nicht umgesetzt", "group", "layout", SIGEKO_SCOPE_ID, 8),
  element("sigeko.screen.planned.title", "Geplante Bereiche", "label", "content", "sigeko.screen.planned", 9),
  element("sigeko.screen.planned.text", "Noch nicht umgesetzte Bereiche", "label", "content", "sigeko.screen.planned", 10),
]);

export const sigekoScreenUiEditorContract = m83Component({
  componentId: SIGEKO_COMPONENT_ID,
  scopeId: SIGEKO_SCOPE_ID,
  requiredSlots: elements.map((entry) => entry.id),
  slots: elements.map((entry) => m83Slot(entry.id, entry)),
});
