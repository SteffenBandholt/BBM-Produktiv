import TopsScreen from "./screens/TopsScreen.js";
import { PROTOKOLL_WORK_SCREEN_ID } from "./screens/index.js";
import * as protokollViewModels from "./viewmodel/index.js";
import { PROTOKOLL_EDITOR_RUNTIME_SCOPE, PROTOKOLL_UI_EDITOR_REGISTRATION } from "./editor/protokollUiEditorRegistration.js";

export const PROTOKOLL_MODULE_ID = "protokoll";
export const PROTOKOLL_MODULE_LABEL = "Protokoll";
export const PROTOKOLL_NAV_ENTRY_KEY = "protokoll";

function buildProtokollModuleScreens() {
  return Object.freeze({
    [PROTOKOLL_WORK_SCREEN_ID]: TopsScreen,
  });
}

function buildMovedProtocolModuleParts() {
  return Object.freeze({
    viewmodel: protokollViewModels,
  });
}

function buildProtokollModuleNavigation() {
  return Object.freeze({
    project: Object.freeze([
      Object.freeze({
        key: PROTOKOLL_NAV_ENTRY_KEY,
        label: "Protokoll",
        moduleId: PROTOKOLL_MODULE_ID,
        workScreenId: PROTOKOLL_WORK_SCREEN_ID,
        section: "meetings",
      }),
    ]),
  });
}

// Technische Heimat fuer das Fachmodul `Protokoll`.
// Der heutige Bestand bleibt vorerst in seinen vorhandenen Pfaden und wird hier
// nur ueber kleine Einstiegspunkte angedockt.
// Kein globaler Modulkatalog, keine Plattformlogik und kein Vollumzug.
export function getProtokollModuleEntry() {
  return Object.freeze({
    moduleId: PROTOKOLL_MODULE_ID,
    moduleLabel: PROTOKOLL_MODULE_LABEL,
    workScreenId: PROTOKOLL_WORK_SCREEN_ID,
    screens: buildProtokollModuleScreens(),
    navigation: buildProtokollModuleNavigation(),
    movedParts: buildMovedProtocolModuleParts(),
    uiEditor: PROTOKOLL_UI_EDITOR_REGISTRATION,
    editorRuntimeScopes: Object.freeze([PROTOKOLL_EDITOR_RUNTIME_SCOPE]),
  });
}

export { TopsScreen, PROTOKOLL_WORK_SCREEN_ID };
export * from "./screens/index.js";
export * from "./viewmodel/index.js";
