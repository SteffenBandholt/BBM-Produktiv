import {
  getProtokollModuleEntry,
  PROTOKOLL_MODULE_ID,
} from "../../modules/protokoll/index.js";
import {
  getRestarbeitenModuleEntry,
  RESTARBEITEN_MODULE_ID,
} from "../../modules/restarbeiten/index.js";

const ACTIVE_MODULE_ENTRIES = Object.freeze([
  getProtokollModuleEntry(),
  getRestarbeitenModuleEntry(),
]);

const ACTIVE_MODULE_IDS = Object.freeze(
  ACTIVE_MODULE_ENTRIES.map((entry) => String(entry?.moduleId || "").trim()).filter(Boolean)
);

// App-Kern: kleiner statischer Modulkatalog.
// Keine dynamische Discovery, keine Plattformmechanik und noch keine Screen-Aufloesung.
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
