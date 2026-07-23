import PlaeneScreen from "./screens/PlaeneScreen.js";
import { PLAENE_WORK_SCREEN_ID } from "./screens/index.js";

export const PLAENE_MODULE_ID = "plaene";
export const PLAENE_MODULE_LABEL = "Pläne";
export const PLAENE_NAV_ENTRY_KEY = "plaene";

function buildPlaeneModuleScreens() {
  return Object.freeze({
    [PLAENE_WORK_SCREEN_ID]: PlaeneScreen,
  });
}

function buildPlaeneModuleNavigation() {
  return Object.freeze({
    project: Object.freeze([
      Object.freeze({
        key: PLAENE_NAV_ENTRY_KEY,
        label: PLAENE_MODULE_LABEL,
        moduleId: PLAENE_MODULE_ID,
        workScreenId: PLAENE_WORK_SCREEN_ID,
        section: "plaene",
        description: "Pläne im aktuellen Projektkontext vorbereiten.",
      }),
    ]),
  });
}

export function getPlaeneModuleEntry() {
  return Object.freeze({
    moduleId: PLAENE_MODULE_ID,
    moduleLabel: PLAENE_MODULE_LABEL,
    workScreenId: PLAENE_WORK_SCREEN_ID,
    screens: buildPlaeneModuleScreens(),
    navigation: buildPlaeneModuleNavigation(),
    shell: Object.freeze({
      hideSidebar: true,
    }),
  });
}

export { PlaeneScreen, PLAENE_WORK_SCREEN_ID };
export * from "./screens/index.js";
