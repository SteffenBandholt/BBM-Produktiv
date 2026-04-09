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
// In diesem Paket wird nur die minimale Struktur und ein kleiner Moduleinstieg
// angelegt. Es gibt bewusst noch keinen Vollumzug, keine Navigation und keine
// Plattformmechanik.
export function getRestarbeitenModuleEntry() {
  return Object.freeze({
    moduleId: RESTARBEITEN_MODULE_ID,
    moduleLabel: RESTARBEITEN_MODULE_LABEL,
    workScreenId: RESTARBEITEN_WORK_SCREEN_ID,
    screens: buildRestarbeitenModuleScreens(),
  });
}

export { RESTARBEITEN_WORK_SCREEN_ID, getRestarbeitenScreenEntry };
export * from "./screens/index.js";
