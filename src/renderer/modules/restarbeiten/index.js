import RestarbeitenScreen from "./screens/RestarbeitenScreen.js";
import { RESTARBEITEN_WORK_SCREEN_ID } from "./screens/index.js";
import PlaeneScreen from "../plaene/screens/PlaeneScreen.js";
import { PLAENE_WORK_SCREEN_ID } from "../plaene/screens/index.js";
import { RESTARBEITEN_EDITOR_RUNTIME_SCOPE, RESTARBEITEN_UI_EDITOR_REGISTRATION } from "./editor/restarbeitenUiEditorRegistration.js";

export const RESTARBEITEN_MODULE_ID = "restarbeiten";
export const RESTARBEITEN_MODULE_LABEL = "Restarbeiten";
export const RESTARBEITEN_NAV_ENTRY_KEY = "restarbeiten";
export const PLAENE_NAV_ENTRY_KEY = "plaene";
export const PLAENE_NAV_LABEL = "Pläne";

function buildRestarbeitenModuleScreens() {
  return Object.freeze({
    [RESTARBEITEN_WORK_SCREEN_ID]: RestarbeitenScreen,
    [PLAENE_WORK_SCREEN_ID]: PlaeneScreen,
  });
}

function buildRestarbeitenModuleNavigation() {
  return Object.freeze({
    project: Object.freeze([
      Object.freeze({
        key: RESTARBEITEN_NAV_ENTRY_KEY,
        label: RESTARBEITEN_MODULE_LABEL,
        moduleId: RESTARBEITEN_MODULE_ID,
        workScreenId: RESTARBEITEN_WORK_SCREEN_ID,
        section: "restarbeiten",
      }),
      Object.freeze({
        key: PLAENE_NAV_ENTRY_KEY,
        label: PLAENE_NAV_LABEL,
        moduleId: RESTARBEITEN_MODULE_ID,
        workScreenId: PLAENE_WORK_SCREEN_ID,
        section: "plaene",
        description: "Pläne im aktuellen Projektkontext verwalten.",
      }),
    ]),
  });
}

export function getRestarbeitenModuleEntry() {
  return Object.freeze({
    moduleId: RESTARBEITEN_MODULE_ID,
    moduleLabel: RESTARBEITEN_MODULE_LABEL,
    workScreenId: RESTARBEITEN_WORK_SCREEN_ID,
    screens: buildRestarbeitenModuleScreens(),
    navigation: buildRestarbeitenModuleNavigation(),
    shell: Object.freeze({
      hideSidebar: true,
    }),
    uiEditor: RESTARBEITEN_UI_EDITOR_REGISTRATION,
    editorRuntimeScopes: Object.freeze([RESTARBEITEN_EDITOR_RUNTIME_SCOPE]),
  });
}

export { RestarbeitenScreen, PlaeneScreen, RESTARBEITEN_WORK_SCREEN_ID, PLAENE_WORK_SCREEN_ID };
export * from "./screens/index.js";
