import { findActiveModuleEntry } from "./moduleCatalog.js";

function normalizeKey(value) {
  return String(value || "").trim();
}

// App-Kern: kleine modulbezogene Screen-Aufloesung.
// Keine Navigation, keine Discovery und keine allgemeine Plattformmechanik.
export function resolveActiveModuleScreen(moduleId, screenId) {
  const normalizedModuleId = normalizeKey(moduleId);
  const normalizedScreenId = normalizeKey(screenId);
  if (!normalizedModuleId || !normalizedScreenId) return null;

  const moduleEntry = findActiveModuleEntry(normalizedModuleId);
  if (!moduleEntry) return null;

  const screens = moduleEntry?.screens && typeof moduleEntry.screens === "object"
    ? moduleEntry.screens
    : null;
  if (!screens) return null;

  return screens[normalizedScreenId] || null;
}

export function resolveActiveModuleWorkScreen(moduleId) {
  const normalizedModuleId = normalizeKey(moduleId);
  if (!normalizedModuleId) return null;

  const moduleEntry = findActiveModuleEntry(normalizedModuleId);
  const workScreenId = normalizeKey(moduleEntry?.workScreenId);
  if (!workScreenId) return null;

  return resolveActiveModuleScreen(normalizedModuleId, workScreenId);
}
