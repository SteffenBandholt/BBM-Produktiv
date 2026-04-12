import { findActiveModuleEntry } from "./moduleCatalog.js";
import {
  resolveModuleScreenFromEntry,
  resolveModuleWorkScreenFromEntry,
} from "./moduleEntryScreenResolver.js";

function normalizeKey(value) {
  return String(value || "").trim();
}

function findResolvedActiveModuleEntry(moduleId) {
  const normalizedModuleId = normalizeKey(moduleId);
  if (!normalizedModuleId) return null;

  return findActiveModuleEntry(normalizedModuleId);
}

// App-Kern: kleine modulbezogene Screen-Aufloesung.
// Keine Navigation, keine Discovery und keine allgemeine Plattformmechanik.
export function resolveActiveModuleScreen(moduleId, screenId) {
  const normalizedScreenId = normalizeKey(screenId);
  if (!normalizedScreenId) return null;

  const moduleEntry = findResolvedActiveModuleEntry(moduleId);
  if (!moduleEntry) return null;

  return resolveModuleScreenFromEntry(moduleEntry, normalizedScreenId);
}

export function resolveActiveModuleWorkScreen(moduleId) {
  const moduleEntry = findResolvedActiveModuleEntry(moduleId);
  return resolveModuleWorkScreenFromEntry(moduleEntry);
}
