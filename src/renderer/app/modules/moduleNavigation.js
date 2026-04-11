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

// App-Kern: kleine Ableitung modulbezogener Navigation aus aktiven Modulen.
// Kernnavigation und Fachaktionen bleiben davon getrennt.
export function getActiveProjectModuleNavigation() {
  return getActiveModuleCatalog().flatMap((entry) => {
    return asNavigationItems(entry?.navigation?.project)
      .filter((item) => hasResolvableNavigationTarget(entry, item))
      .map((item) =>
        Object.freeze({
          ...item,
          moduleId: String(item?.moduleId || entry?.moduleId || "").trim(),
        })
      );
  });
}
