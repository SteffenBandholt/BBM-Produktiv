function normalizeValue(value) {
  return String(value || "").trim();
}

export function deriveActiveModuleIds(availableModuleIds = [], licensedModuleIds = []) {
  const available = new Set(
    (Array.isArray(availableModuleIds) ? availableModuleIds : [])
      .map(normalizeValue)
      .filter(Boolean)
  );
  const active = [];
  for (const value of Array.isArray(licensedModuleIds) ? licensedModuleIds : []) {
    const moduleId = normalizeValue(value);
    if (!moduleId || !available.has(moduleId) || active.includes(moduleId)) continue;
    active.push(moduleId);
  }
  return Object.freeze(active);
}

export function moduleSupportsScope(moduleEntry, scope) {
  const moduleType = normalizeValue(moduleEntry?.moduleType).toLowerCase();
  const normalizedScope = normalizeValue(scope).toLowerCase();
  if (normalizedScope === "global") {
    return moduleType === "global" || moduleType === "hybrid";
  }
  if (normalizedScope === "project") {
    return moduleType === "project" || moduleType === "hybrid";
  }
  return false;
}

function asNavigationItems(moduleEntry, scope) {
  if (!moduleSupportsScope(moduleEntry, scope)) return [];
  const items = moduleEntry?.navigation?.[scope];
  return Array.isArray(items) ? items.filter((item) => item && typeof item === "object") : [];
}

export function resolveModuleNavigationEntry(moduleEntry, scope, navigationKey = "") {
  const items = asNavigationItems(moduleEntry, scope);
  const key = normalizeValue(navigationKey);
  if (!key) return items[0] || null;
  return items.find((item) => normalizeValue(item?.key) === key) || null;
}

export function deriveModuleNavigationByScope(moduleCatalog = [], scope) {
  const normalizedScope = normalizeValue(scope).toLowerCase();
  if (!normalizedScope) return Object.freeze([]);
  return Object.freeze(
    (Array.isArray(moduleCatalog) ? moduleCatalog : []).flatMap((moduleEntry) =>
      asNavigationItems(moduleEntry, normalizedScope)
        .filter((item) => {
          const screenId = normalizeValue(item?.workScreenId || moduleEntry?.workScreenId);
          return !!screenId && typeof moduleEntry?.screens?.[screenId] === "function";
        })
        .map((item) =>
          Object.freeze({
            ...item,
            moduleId: normalizeValue(item?.moduleId || moduleEntry?.moduleId),
          })
        )
    )
  );
}

export async function openModuleEntry({
  moduleEntry,
  scope,
  navigationKey = "",
  projectId = null,
  project = null,
  router,
  options = {},
  show,
} = {}) {
  const normalizedScope = normalizeValue(scope).toLowerCase();
  if (!moduleEntry || !moduleSupportsScope(moduleEntry, normalizedScope)) return false;
  if (normalizedScope === "project" && !projectId) return false;

  const adapter = moduleEntry?.routing?.[normalizedScope];
  if (typeof adapter === "function") {
    return await adapter({
      router,
      moduleEntry,
      projectId,
      project,
      options: options && typeof options === "object" ? options : {},
    });
  }

  const navEntry = resolveModuleNavigationEntry(moduleEntry, normalizedScope, navigationKey);
  if (!navEntry) return false;

  const screenId = normalizeValue(navEntry?.workScreenId || moduleEntry?.workScreenId);
  const ModuleScreen = moduleEntry?.screens?.[screenId];
  if (typeof ModuleScreen !== "function" || typeof show !== "function") return false;

  const moduleId = normalizeValue(moduleEntry?.moduleId);
  const args = {
    router,
    moduleId,
    ...(normalizedScope === "project" ? { projectId, project } : {}),
  };
  const pageTitle = normalizeValue(options?.pageTitle || navEntry?.label) || null;
  const activeModuleLabel = normalizeValue(options?.activeModuleLabel || navEntry?.label) || null;
  const hideSidebar =
    options?.hideSidebar === true ||
    navEntry?.hideSidebar === true ||
    moduleEntry?.shell?.hideSidebar === true;

  await show(new ModuleScreen(args), {
    section: navEntry?.section || moduleId,
    isTopsView: false,
    pageTitle,
    activeModuleLabel,
    hideSidebar,
  });
  return true;
}
