import { getActiveModuleCatalog } from "./moduleCatalog.js";

function asNavigationItems(rawItems = []) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.filter((item) => item && typeof item === "object");
}

// App-Kern: kleine Ableitung modulbezogener Navigation aus aktiven Modulen.
// Kernnavigation und Fachaktionen bleiben davon getrennt.
export function getActiveProjectModuleNavigation() {
  return getActiveModuleCatalog().flatMap((entry) => {
    return asNavigationItems(entry?.navigation?.project).map((item) =>
      Object.freeze({
        ...item,
        moduleId: String(item?.moduleId || entry?.moduleId || "").trim(),
      })
    );
  });
}
