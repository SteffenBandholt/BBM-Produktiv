import { getActiveModuleCatalog } from "./moduleCatalog.js";
import { resolveModuleScreenFromEntry } from "./moduleEntryScreenResolver.js";

function asNavigationItems(rawItems = []) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.filter((item) => item && typeof item === "object");
}

function hasResolvableNavigationTarget(moduleEntry, navigationItem) {
  const screenId = String(
    navigationItem?.workScreenId || moduleEntry?.workScreenId || ""
  ).trim();
  if (!screenId) return false;
  return !!resolveModuleScreenFromEntry(moduleEntry, screenId);
}

function getActiveModuleNavigationByScope(scope) {
  const normalizedScope = String(scope || "").trim().toLowerCase();
  if (!normalizedScope) return [];

  return getActiveModuleCatalog().flatMap((entry) => {
    return asNavigationItems(entry?.navigation?.[normalizedScope])
      .filter((item) => hasResolvableNavigationTarget(entry, item))
      .map((item) =>
        Object.freeze({
          ...item,
          moduleId: String(item?.moduleId || entry?.moduleId || "").trim(),
        })
      );
  });
}

// App-Kern: modulbezogene Navigation wird ausschließlich aus den aktiven
// Moduldeskriptoren abgeleitet. Damit können neue Fachmodule globale,
// projektbezogene oder beide Einstiegspunkte deklarieren, ohne neue
// Sonderlogik in der Shell-Navigation einzubauen.
export function getActiveGlobalModuleNavigation() {
  return getActiveModuleNavigationByScope("global");
}

export function getActiveProjectModuleNavigation() {
  return getActiveModuleNavigationByScope("project");
}
