import RestarbeitenScreen from "./screens/RestarbeitenScreen.js";
import {
  RESTARBEITEN_WORK_SCREEN_ID,
  RESTARBEITEN_WORK_SCREEN_LABEL,
  getRestarbeitenScreenEntry,
} from "./screens/index.js";
import * as restarbeitenComponents from "./components/index.js";

export const RESTARBEITEN_MODULE_ID = "restarbeiten";
export const RESTARBEITEN_MODULE_LABEL = "Restarbeiten";
export const RESTARBEITEN_NAV_ENTRY_KEY = "restarbeiten";

function buildRestarbeitenModuleScreens() {
  const workScreenEntry = getRestarbeitenScreenEntry();
  return Object.freeze({
    [RESTARBEITEN_WORK_SCREEN_ID]: workScreenEntry,
  });
}

function buildMovedRestarbeitenModuleParts() {
  return Object.freeze({
    components: restarbeitenComponents,
  });
}

function buildRestarbeitenModuleNavigation() {
  return Object.freeze({
    project: Object.freeze([
      Object.freeze({
        key: RESTARBEITEN_NAV_ENTRY_KEY,
        label: "Restarbeiten",
        moduleId: RESTARBEITEN_MODULE_ID,
        workScreenId: RESTARBEITEN_WORK_SCREEN_ID,
        section: "meetings",
      }),
    ]),
  });
}

function buildRestarbeitenModuleCapabilities() {
  return Object.freeze({
    hasWorkScreen: true,
    hasNavigation: true,
    hasRouterIntegration: false,
    hasPersistentDataFlow: false,
  });
}

// Technische Heimat fuer das Fachmodul `Restarbeiten`.
// In den ersten Paketen bleibt die Anbindung bewusst klein:
// eigener Moduleinstieg, eigener Screen-Anker und eine erste fachliche
// Workbench ohne Router-/Navigationsintegration und ohne Vollumzug.
export function getRestarbeitenModuleEntry() {
  return Object.freeze({
    moduleId: RESTARBEITEN_MODULE_ID,
    moduleLabel: RESTARBEITEN_MODULE_LABEL,
    workScreenId: RESTARBEITEN_WORK_SCREEN_ID,
    workScreenLabel: RESTARBEITEN_WORK_SCREEN_LABEL,
    screens: buildRestarbeitenModuleScreens(),
    navigation: buildRestarbeitenModuleNavigation(),
    movedParts: buildMovedRestarbeitenModuleParts(),
    capabilities: buildRestarbeitenModuleCapabilities(),
  });
}

export {
  RestarbeitenScreen,
  RESTARBEITEN_WORK_SCREEN_ID,
  RESTARBEITEN_WORK_SCREEN_LABEL,
  getRestarbeitenScreenEntry,
};
export * from "./components/index.js";
export * from "./screens/index.js";
