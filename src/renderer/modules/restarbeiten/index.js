import RestarbeitenScreen from "./screens/RestarbeitenScreen.js";
import { RESTARBEITEN_WORK_SCREEN_ID, getRestarbeitenScreenEntry } from "./screens/index.js";

export const RESTARBEITEN_MODULE_ID = "restarbeiten";
export const RESTARBEITEN_MODULE_LABEL = "Restarbeiten";

function buildRestarbeitenModuleScreens() {
  const workScreenEntry = getRestarbeitenScreenEntry();
  return Object.freeze({
    [RESTARBEITEN_WORK_SCREEN_ID]: workScreenEntry,
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
    screens: buildRestarbeitenModuleScreens(),
  });
}

export { RestarbeitenScreen, RESTARBEITEN_WORK_SCREEN_ID, getRestarbeitenScreenEntry };
export * from "./screens/index.js";
