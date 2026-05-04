import {
  getActiveModuleIds,
  getDerivedActiveModuleCatalog,
} from "./moduleCatalog.js";

const DEFAULT_ACTIVE_MODULE_IDS = Object.freeze(getActiveModuleIds());

let cachedActiveModuleIds = DEFAULT_ACTIVE_MODULE_IDS;
let cachedActiveModuleSource = "default";
let cachedActiveModulePromise = null;

function normalizeModuleIds(moduleIds) {
  if (!Array.isArray(moduleIds)) return [];

  const uniqueModuleIds = [];
  for (const moduleId of moduleIds) {
    const normalizedModuleId = String(moduleId || "").trim();
    if (!normalizedModuleId || uniqueModuleIds.includes(normalizedModuleId)) {
      continue;
    }
    uniqueModuleIds.push(normalizedModuleId);
  }

  return uniqueModuleIds;
}

function setCachedActiveModuleIds(moduleIds, source = "license") {
  cachedActiveModuleIds = Object.freeze(normalizeModuleIds(moduleIds));
  cachedActiveModuleSource = String(source || "").trim() || "license";
  return cachedActiveModuleIds;
}

export function getCachedActiveModuleIds() {
  return cachedActiveModuleIds;
}

export function getCachedActiveModuleCatalog() {
  return getDerivedActiveModuleCatalog(getCachedActiveModuleIds());
}

export function getCachedActiveModuleSource() {
  return cachedActiveModuleSource;
}

export function isModuleActive(moduleId) {
  const normalizedModuleId = String(moduleId || "").trim();
  if (!normalizedModuleId) return false;
  return getCachedActiveModuleIds().includes(normalizedModuleId);
}

export async function refreshCachedActiveModuleAccess({ force = false } = {}) {
  if (!force && cachedActiveModulePromise) {
    return await cachedActiveModulePromise;
  }

  const root = typeof window !== "undefined" ? window : globalThis;
  const api = root?.bbmDb || {};
  if (typeof api.licenseGetStatus !== "function") {
    return setCachedActiveModuleIds(DEFAULT_ACTIVE_MODULE_IDS, "default");
  }

  cachedActiveModulePromise = (async () => {
    try {
      const status = await api.licenseGetStatus();
      if (!status || typeof status !== "object") {
        return setCachedActiveModuleIds([], "license-empty");
      }

      if (status.valid === false) {
        return setCachedActiveModuleIds([], "license-disabled");
      }

      return setCachedActiveModuleIds(status.modules || [], "license");
    } catch (_err) {
      return setCachedActiveModuleIds(DEFAULT_ACTIVE_MODULE_IDS, "fallback");
    } finally {
      cachedActiveModulePromise = null;
    }
  })();

  return await cachedActiveModulePromise;
}
