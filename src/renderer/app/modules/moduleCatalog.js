import {
  getProtokollModuleEntry,
  PROTOKOLL_MODULE_ID,
} from "../../modules/protokoll/index.js";
import {
  getRestarbeitenModuleEntry,
  RESTARBEITEN_MODULE_ID,
} from "../../modules/restarbeiten/index.js";

const AVAILABLE_MODULE_ENTRIES = Object.freeze([
  Object.freeze({
    moduleId: PROTOKOLL_MODULE_ID,
    isActive: true,
    entry: getProtokollModuleEntry(),
  }),
  Object.freeze({
    moduleId: RESTARBEITEN_MODULE_ID,
    isActive: true,
    entry: getRestarbeitenModuleEntry(),
  }),
]);

const ACTIVE_MODULE_ENTRIES = Object.freeze(
  AVAILABLE_MODULE_ENTRIES.filter((definition) => definition?.isActive)
    .map((definition) => definition?.entry)
    .filter(Boolean)
);

const ACTIVE_MODULE_IDS = Object.freeze(
  ACTIVE_MODULE_ENTRIES.map((entry) => String(entry?.moduleId || "").trim()).filter(Boolean)
);

// App-Kern: kleiner statischer Modulkatalog.
// Bekannte Module und aktiver Modulumfang bleiben bewusst statisch.
// Keine dynamische Discovery, keine Plattformmechanik und keine Lizenzlogik im Katalog.
export function getActiveModuleCatalog() {
  return ACTIVE_MODULE_ENTRIES;
}

export function getActiveModuleIds() {
  return ACTIVE_MODULE_IDS;
}

export function findActiveModuleEntry(moduleId) {
  const normalizedModuleId = String(moduleId || "").trim();
  if (!normalizedModuleId) return null;
  return ACTIVE_MODULE_ENTRIES.find((entry) => entry?.moduleId === normalizedModuleId) || null;
}

export function hasActiveModule(moduleId) {
  return !!findActiveModuleEntry(moduleId);
}

export { PROTOKOLL_MODULE_ID, RESTARBEITEN_MODULE_ID };
