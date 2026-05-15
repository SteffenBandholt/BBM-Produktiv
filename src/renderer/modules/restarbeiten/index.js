import RestarbeitenScreen from "./screens/RestarbeitenScreen.js";
import { RESTARBEITEN_WORK_SCREEN_ID } from "./screens/index.js";

export const RESTARBEITEN_MODULE_ID = "restarbeiten";
export const RESTARBEITEN_MODULE_LABEL = "Restarbeiten";
export const RESTARBEITEN_NAV_ENTRY_KEY = "restarbeiten";

function buildRestarbeitenModuleScreens() {
  return Object.freeze({
    [RESTARBEITEN_WORK_SCREEN_ID]: RestarbeitenScreen,
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
  });
}

export { RestarbeitenScreen, RESTARBEITEN_WORK_SCREEN_ID };
export * from "./screens/index.js";
