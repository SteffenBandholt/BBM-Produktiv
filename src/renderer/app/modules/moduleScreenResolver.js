import { findActiveModuleEntry } from "./moduleCatalog.js";
import {
  resolveModuleScreenFromEntry,
  resolveModuleWorkScreenFromEntry,
} from "./moduleEntryScreenResolver.js";

// App-Kern: kleine modulbezogene Screen-Aufloesung.
// Keine Navigation, keine Discovery und keine allgemeine Plattformmechanik.
export function resolveActiveModuleScreen(moduleId, screenId) {
  const normalizedModuleId = String(moduleId || "").trim();
  const normalizedScreenId = String(screenId || "").trim();
  if (!normalizedModuleId || !normalizedScreenId) return null;

  const moduleEntry = findActiveModuleEntry(normalizedModuleId);
  if (!moduleEntry) return null;
  return resolveModuleScreenFromEntry(moduleEntry, normalizedScreenId);
}

export function resolveActiveModuleWorkScreen(moduleId) {
  const normalizedModuleId = String(moduleId || "").trim();
  if (!normalizedModuleId) return null;

  const moduleEntry = findActiveModuleEntry(normalizedModuleId);
  return resolveModuleWorkScreenFromEntry(moduleEntry);
}
