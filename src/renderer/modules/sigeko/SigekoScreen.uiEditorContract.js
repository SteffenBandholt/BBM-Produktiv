import { DOMAIN_LOCKS, m83Component, m83DomainButton, m83Element, m83Slot } from "../../ui-editor/m83ComponentContract.js";

export const SIGEKO_SCOPE_ID = "sigeko.screen";
export const SIGEKO_COMPONENT_ID = "bbm.sigeko.screen";

const element = (id, name, type, role, parentId, order, fieldKind = "text") => m83Element({
  id, name, type, role, parentId, order,
  ...(type === "field" ? { fieldKind, componentKind: fieldKind === "select" ? "select" : fieldKind === "checkbox" ? "checkbox" : "input" } : {}),
  lockedOps: DOMAIN_LOCKS,
  baseline: { minWidth: 8, maxWidth: 2400, minHeight: 8, maxHeight: 1600, minFontSize: 6, maxFontSize: 32 },
});
const elements = [
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
];

// Static presentation schema: no contact IDs or domain values in editor metadata.
export const SIGEKO_CONTACT_INPUTS = Object.freeze([
  ["name", "Name"], ["street", "Straße / Hausnummer"], ["zip", "Postleitzahl"],
  ["city", "Ort"], ["phone", "Telefon"], ["email", "E-Mail"],
]);
function add(suffix, name, type, parent, fieldKind) {
  elements.push(element(SIGEKO_SCOPE_ID + suffix, name, type,
    type === "field" ? "dataFieldLayout" : type === "label" ? "content" : "layout",
    SIGEKO_SCOPE_ID + parent, elements.length, fieldKind));
}
function field(suffix, name, parent, kind = "text") {
  add(suffix, name + " – Feldgruppe", "fieldGroup", parent);
  add(suffix + ".label", name, "label", suffix);
  add(suffix + ".input", name, "field", suffix, kind);
}
function button(suffix, name, parent, actionKind) {
  elements.push(m83DomainButton({ id: SIGEKO_SCOPE_ID + suffix, name, parentId: SIGEKO_SCOPE_ID + parent, order: elements.length, actionKind }));
}
function status(suffix, name, parent) {
  elements.push(element(SIGEKO_SCOPE_ID + suffix, name, "label", "status", SIGEKO_SCOPE_ID + parent, elements.length));
}
add(".basic", "Grunddaten", "group", "");
add(".basic.title", "Grunddaten", "label", ".basic");
add(".profile", "Eigenes SiGeKo-Profil", "group", ".basic");
add(".profile.title", "Eigenes SiGeKo-Profil", "label", ".profile");
add(".profile.hint", "Profilhinweis", "label", ".profile");
add(".profile.fields", "Profildaten", "group", ".profile");
for (const [key, name] of SIGEKO_CONTACT_INPUTS) field(`.profile.${key}`, name, ".profile.fields");
field(".profile.logo", "Logo auswählen", ".profile.fields", "file");
add(".profile.logoPath", "Gewähltes Logo", "label", ".profile");
button(".profile.logoClear", "Logo entfernen", ".profile", "clearSigekoLogoReference");
button(".profile.save", "Profil speichern", ".profile", "saveSigekoCoordinatorProfile");
status(".profile.status", "Profilstatus", ".profile");
add(".roles", "Projektrollen", "group", ".basic");
add(".roles.title", "SiGeKo im Projekt", "label", ".roles");
add(".roles.hint", "Rollenhinweis", "label", ".roles");
add(".roles.panels", "Planung und Ausführung", "group", ".roles");
for (const [role, title] of [["planning", "Planung"], ["execution", "Ausführung"]]) {
  const prefix = `.${role}`;
  add(prefix, title, "group", ".roles.panels");
  add(prefix + ".title", title, "label", prefix);
  if (role === "execution") field(prefix + ".same", "Ausführung wie Planung", prefix, "checkbox");
  field(prefix + ".source", "Zuordnung aus", prefix, "select");
  field(prefix + ".contact", "Person", prefix, "select");
  add(prefix + ".free", "Freie Angaben", "group", prefix);
  for (const [key, name] of SIGEKO_CONTACT_INPUTS) field(`${prefix}.free.${key}`, name, prefix + ".free");
  add(prefix + ".resolved", "Gespeicherte Zuordnung", "label", prefix);
}
button(".roles.save", "Projektrollen speichern", ".roles", "saveSigekoProjectRoles");
status(".roles.status", "Rollenstatus", ".roles");
Object.freeze(elements);

export const sigekoScreenUiEditorContract = m83Component({
  componentId: SIGEKO_COMPONENT_ID,
  scopeId: SIGEKO_SCOPE_ID,
  requiredSlots: elements.map((entry) => entry.id),
  slots: elements.map((entry) => m83Slot(entry.id, entry)),
});
