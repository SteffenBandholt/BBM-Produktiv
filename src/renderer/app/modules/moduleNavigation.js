import { getCachedActiveModuleCatalog } from "./moduleAccessState.js";
import { deriveModuleNavigationByScope } from "./moduleRouteRuntime.js";

function getActiveModuleNavigationByScope(scope) {
  return deriveModuleNavigationByScope(getCachedActiveModuleCatalog(), scope);
}

// App-Kern: modulbezogene Navigation wird ausschliesslich aus dem aktuell
// aktiven Produkt-/Build-/Lizenz-Modulset abgeleitet. Neue Fachmodule koennen
// globale, projektbezogene oder beide Einstiegspunkte deklarieren, ohne neue
// Sonderlogik in der Shell-Navigation einzubauen.
export function getActiveGlobalModuleNavigation() {
  return getActiveModuleNavigationByScope("global");
}

export function getActiveProjectModuleNavigation() {
  return getActiveModuleNavigationByScope("project");
}
