import {
  PROTOKOLL_EDITOR_RUNTIME_SCOPE,
  PROTOKOLL_UI_EDITOR_REGISTRATION,
} from "../../modules/protokoll/editor/protokollUiEditorRegistration.js";
import {
  RESTARBEITEN_EDITOR_RUNTIME_SCOPE,
  RESTARBEITEN_UI_EDITOR_REGISTRATION,
} from "../../modules/restarbeiten/editor/restarbeitenUiEditorRegistration.js";

const registrations = Object.freeze([
  Object.freeze({ moduleId: "protokoll", moduleLabel: "Protokoll", uiEditor: PROTOKOLL_UI_EDITOR_REGISTRATION, editorRuntimeScopes: Object.freeze([PROTOKOLL_EDITOR_RUNTIME_SCOPE]) }),
  Object.freeze({ moduleId: "restarbeiten", moduleLabel: "Restarbeiten", uiEditor: RESTARBEITEN_UI_EDITOR_REGISTRATION, editorRuntimeScopes: Object.freeze([RESTARBEITEN_EDITOR_RUNTIME_SCOPE]) }),
]);

const blockedScopes = Object.freeze([
  Object.freeze({ scopeId: "bbm.shell", name: "Shell und Hauptnavigation" }),
  Object.freeze({ scopeId: "bbm.home", name: "Start" }),
  Object.freeze({ scopeId: "bbm.projects", name: "Projektverwaltung" }),
  Object.freeze({ scopeId: "bbm.project-workspace", name: "Projektarbeitsplatz" }),
  Object.freeze({ scopeId: "bbm.firms", name: "Firmen und Personen" }),
  Object.freeze({ scopeId: "bbm.project-firms", name: "Projektfirmen und Projektpersonen" }),
  Object.freeze({ scopeId: "bbm.settings", name: "Einstellungen" }),
  Object.freeze({ scopeId: "bbm.help", name: "Hilfe" }),
  Object.freeze({ scopeId: "bbm.dialogs", name: "Produktive Dialoge" }),
]);

export function getActiveEditorModuleRegistrations() {
  return registrations;
}

export function getBlockedEditorScopes() {
  return blockedScopes;
}
