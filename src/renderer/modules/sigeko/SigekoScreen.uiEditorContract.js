import { DOMAIN_LOCKS, m83Component, m83DomainButton, m83Element, m83Slot } from "../../ui-editor/m83ComponentContract.js";

export const SIGEKO_SCOPE_ID = "sigeko.screen";
export const SIGEKO_COMPONENT_ID = "bbm.sigeko.screen";

const element = (id, name, type, role, parentId, order, fieldKind = "text") => m83Element({
  id, name, type, role, parentId, order,
  ...(type === "field" ? { fieldKind, componentKind: fieldKind === "select" ? "select" : fieldKind === "checkbox" ? "checkbox" : fieldKind === "multilineText" ? "textarea" : "input" } : {}),
  lockedOps: DOMAIN_LOCKS,
  baseline: { minWidth: 8, maxWidth: 2400, minHeight: fieldKind === "multilineText" ? 24 : 8, maxHeight: fieldKind === "multilineText" ? 720 : 1600, minFontSize: 6, maxFontSize: 32 },
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
add(".readiness", "Übersicht / Readiness", "group", "");
add(".readiness.title", "Projektbereitschaft", "label", ".readiness");
add(".readiness.project", "Projektdaten prüfen", "group", ".readiness");
add(".readiness.project.title", "Projektdaten", "label", ".readiness.project");
status(".readiness.project.status", "Bereitschaft der Projektdaten", ".readiness.project");
add(".readiness.project.issues", "Fehlende Projektdaten", "label", ".readiness.project");
add(".readiness.authorities", "Behörden und Versorger prüfen", "group", ".readiness");
add(".readiness.authorities.title", "Behörden / Notfall / Versorger", "label", ".readiness.authorities");
status(".readiness.authorities.status", "Bereitschaft der Behördenangaben", ".readiness.authorities");
add(".readiness.authorities.issues", "Fehlende Behördenangaben", "label", ".readiness.authorities");
status(".readiness.warning", "Bereitschaftshinweis", ".readiness");
button(".readiness.refresh", "Bereitschaft aktualisieren", ".readiness", "refreshSigekoReadiness");
button(".readiness.editProject", "Projektverwaltung öffnen", ".readiness", "navigateProjectForm");
button(".readiness.editRoles", "Profil und Projektrollen bearbeiten", ".readiness", "navigateSigekoBasicData");
// Statically declared S4.3 presentation fields; never derived from database rows.
export const SIGEKO_AUTHORITY_CATEGORIES = Object.freeze([
  ["LABOR_AUTHORITY", "labor", "Arbeitsschutzbehörde"], ["HOSPITAL", "hospital", "Krankenhaus / ZNA"],
  ["ACCIDENT_DOCTOR", "doctor", "D-Arzt"], ["WATER", "water", "Wasser"],
  ["ELECTRICITY", "electricity", "Stromnetz"], ["GAS", "gas", "Gasnetz"],
  ["EMERGENCY_112", "emergency", "Notruf 112"], ["POLICE", "police", "Polizei"],
]);
export const SIGEKO_AUTHORITY_INPUTS = Object.freeze([
  ["organization", "Stelle / Einrichtung / Betreiber"], ["street", "Straße / Hausnummer"],
  ["zip", "Postleitzahl"], ["city", "Ort"], ["phone", "Telefon"], ["email", "E-Mail"],
  ["emergency_phone", "Havarie-/Störkontakt"], ["source", "Quelle"],
  ["scope_street", "Zuständig für Straße / Hausnummer"], ["scope_zip", "Bezugs-PLZ"],
  ["scope_city", "Bezugsort"], ["scope_district", "Bezirk / Kreis"],
  ["scope_area", "Dokumentiertes Bezugsgebiet", "multilineText"],
  ["verification_note", "Fachlicher Prüfnachweis", "multilineText"],
]);
add(".authorities", "Behörden / Notfall / Versorger", "group", "");
add(".authorities.title", "Behörden / Notfall / Versorger", "label", ".authorities");
add(".authorities.hint", "Behördenhinweis", "label", ".authorities");
status(".authorities.status", "Behördenstatus", ".authorities");
add(".authorities.overview", "Projektkontakte im Überblick", "group", ".authorities");
for (const [, key, label] of SIGEKO_AUTHORITY_CATEGORIES) status(`.authorities.overview.${key}`, label, ".authorities.overview");
button(".authorities.refresh", "Behörden aktualisieren", ".authorities", "refreshSigekoAuthorities");
button(".authorities.apply", "Eindeutige Treffer übernehmen", ".authorities", "applyKnownProjectAuthorities");
add(".authorities.record", "Wiederverwendbarer Bestand", "group", ".authorities");
add(".authorities.record.title", "Bestandskontakt bearbeiten", "label", ".authorities.record");
add(".authorities.record.hint", "Bestandshinweis", "label", ".authorities.record");
field(".authorities.category", "Kategorie", ".authorities.record", "select");
field(".authorities.contact", "Bestandskontakt", ".authorities.record", "select");
button(".authorities.new", "Neuen Kontakt anlegen", ".authorities.record", "newAuthorityDraft");
add(".authorities.record.fields", "Kontaktdaten und Nachweise", "group", ".authorities.record");
for (const [key, label, kind] of SIGEKO_AUTHORITY_INPUTS) field(`.authorities.record.${key}`, label, ".authorities.record.fields", kind);
button(".authorities.record.save", "Bestand speichern", ".authorities.record", "saveAuthorityRecord");
button(".authorities.record.confirm", "Bestandsprüfung bestätigen", ".authorities.record", "confirmAuthorityRecord");
field(".authorities.record.reason", "Grund für Unsicherheit", ".authorities.record", "multilineText");
button(".authorities.record.uncertain", "Bestand als unsicher markieren", ".authorities.record", "markAuthorityUncertain");
status(".authorities.record.status", "Bestandsprüfstatus", ".authorities.record");
add(".authorities.assignment", "Kontakt für diese Baustelle", "group", ".authorities");
add(".authorities.assignment.title", "Projektzuordnung", "label", ".authorities.assignment");
add(".authorities.assignment.snapshot", "Gespeicherter Projektkontakt", "label", ".authorities.assignment");
add(".authorities.assignment.hint", "Projektbezogener Prüfhinweis", "label", ".authorities.assignment");
field(".authorities.assignment.note", "Projektbezogene Prüfung / Begründung", ".authorities.assignment", "multilineText");
button(".authorities.assignment.confirm", "Zuständigkeit bestätigen und zuordnen", ".authorities.assignment", "assignConfirmedProjectAuthority");
button(".authorities.assignment.uncertain", "Mit Prüfbedarf zuordnen", ".authorities.assignment", "assignUncertainProjectAuthority");
button(".readiness.editAuthorities", "Behördenkontakte bearbeiten", ".readiness", "navigateSigekoAuthorities");
button(".preNotification", "Vorankündigung öffnen", ".navigation", "navigatePreNotification");
Object.freeze(elements);

export const sigekoScreenUiEditorContract = m83Component({
  componentId: SIGEKO_COMPONENT_ID,
  scopeId: SIGEKO_SCOPE_ID,
  requiredSlots: elements.map((entry) => entry.id),
  slots: elements.map((entry) => m83Slot(entry.id, entry)),
});
