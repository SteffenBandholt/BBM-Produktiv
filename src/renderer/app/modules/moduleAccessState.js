import {
  getActiveModuleIds,
  getDerivedActiveModuleCatalog,
  getDerivedActiveModuleIds,
} from "./moduleCatalog.js";
import { deriveActiveModuleIds } from "./moduleRouteRuntime.js";

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
  const normalizedModuleIds = normalizeModuleIds(moduleIds);
  cachedActiveModuleIds = Object.freeze(getDerivedActiveModuleIds(normalizedModuleIds));
  cachedActiveModuleSource = String(source || "").trim() || "license";
  return cachedActiveModuleIds;
}

async function isPackagedRuntime() {
  const root = typeof window !== "undefined" ? window : globalThis;
  const api = root?.bbmDb || {};

  if (typeof api.appIsPackaged !== "function") {
    return null;
  }

  try {
    const res = await api.appIsPackaged();
    if (!res?.ok) return null;
    return !!res?.isPackaged;
  } catch (_err) {
    return null;
  }
}

export function getCachedActiveModuleIds() {
  return cachedActiveModuleIds;
}

export function getCachedActiveModuleCatalog() {
  return getDerivedActiveModuleCatalog(getCachedActiveModuleIds());
}

export function findCachedActiveModuleEntry(moduleId) {
  const normalizedModuleId = String(moduleId || "").trim();
  if (!normalizedModuleId) return null;
  return getCachedActiveModuleCatalog().find((entry) => entry?.moduleId === normalizedModuleId) || null;
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
  const packagedRuntime = await isPackagedRuntime();

  if (typeof api.licenseGetStatus !== "function") {
    if (packagedRuntime === true) {
      return setCachedActiveModuleIds([], "license-api-missing");
    }
    return setCachedActiveModuleIds(
      DEFAULT_ACTIVE_MODULE_IDS,
      packagedRuntime === false ? "dev-build" : "default"
    );
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

      const licensedModuleIds = Array.isArray(status.modules)
        ? status.modules
        : Array.isArray(status?.license?.modules)
          ? status.license.modules
          : [];
      const activeModuleIds = deriveActiveModuleIds(
        DEFAULT_ACTIVE_MODULE_IDS,
        licensedModuleIds
      );
      return setCachedActiveModuleIds(activeModuleIds, "product-build-license");
    } catch (_err) {
      if (packagedRuntime === true) {
        return setCachedActiveModuleIds([], "license-error");
      }
      return setCachedActiveModuleIds(DEFAULT_ACTIVE_MODULE_IDS, "dev-fallback");
    } finally {
      cachedActiveModulePromise = null;
    }
  })();

  return await cachedActiveModulePromise;
}
