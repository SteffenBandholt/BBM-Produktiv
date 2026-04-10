import {
  getProtokollModuleEntry,
  PROTOKOLL_MODULE_ID,
} from "../../modules/protokoll/index.js";
import {
  getRestarbeitenModuleEntry,
  RESTARBEITEN_MODULE_ID,
} from "../../modules/restarbeiten/index.js";

const AVAILABLE_MODULE_ENTRIES = Object.freeze([
  Object.freeze({
    moduleId: PROTOKOLL_MODULE_ID,
    entry: getProtokollModuleEntry(),
  }),
  Object.freeze({
    moduleId: RESTARBEITEN_MODULE_ID,
    entry: getRestarbeitenModuleEntry(),
  }),
]);

const DEFAULT_ACTIVE_MODULE_IDS = Object.freeze([
  PROTOKOLL_MODULE_ID,
  RESTARBEITEN_MODULE_ID,
]);

const PRODUCTIVE_DEFAULT_RELEASE_STATE = Object.freeze({
  releasedModuleIds: DEFAULT_ACTIVE_MODULE_IDS,
});

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

const MODULE_RELEASE_STATE = Object.freeze({
  productiveDefaultReleaseState: PRODUCTIVE_DEFAULT_RELEASE_STATE,
  getDefaultReleasedModuleIds() {
    return this.productiveDefaultReleaseState.releasedModuleIds;
  },
  hasOwnField(releaseState, fieldName) {
    return !!releaseState && Object.prototype.hasOwnProperty.call(releaseState, fieldName);
  },
  getReleasedModuleIds(releaseState) {
    if (!releaseState || typeof releaseState !== "object") {
      return this.getDefaultReleasedModuleIds();
    }

    if (this.hasOwnField(releaseState, "activeModuleIds")) {
      return normalizeModuleIds(releaseState.activeModuleIds);
    }

    if (this.hasOwnField(releaseState, "releasedModuleIds")) {
      return normalizeModuleIds(releaseState.releasedModuleIds);
    }

    if (releaseState.modules && typeof releaseState.modules === "object") {
      return normalizeModuleIds(
        Object.entries(releaseState.modules)
          .filter(([, isReleased]) => !!isReleased)
          .map(([moduleId]) => moduleId)
      );
    }

    return this.getDefaultReleasedModuleIds();
  },
});

function deriveActiveModuleEntries(moduleIds) {
  const normalizedModuleIds = normalizeModuleIds(moduleIds);
  return Object.freeze(
    AVAILABLE_MODULE_ENTRIES.filter((definition) =>
      normalizedModuleIds.includes(String(definition?.moduleId || "").trim())
    )
      .map((definition) => definition?.entry)
      .filter(Boolean)
  );
}

function deriveActiveModuleIds(moduleIds) {
  return Object.freeze(
    deriveActiveModuleEntries(moduleIds)
      .map((entry) => String(entry?.moduleId || "").trim())
      .filter(Boolean)
  );
}

function deriveModuleIdsFromEntries(moduleEntries) {
  return Object.freeze(
    moduleEntries
      .map((entry) => String(entry?.moduleId || "").trim())
      .filter(Boolean)
  );
}

const ACTIVE_MODULE_ENTRIES = deriveActiveModuleEntries(MODULE_RELEASE_STATE.getDefaultReleasedModuleIds());

const ACTIVE_MODULE_IDS = deriveModuleIdsFromEntries(ACTIVE_MODULE_ENTRIES);

const PRODUCTIVE_ACTIVE_MODULE_ACCESS = Object.freeze({
  getCatalog() {
    return ACTIVE_MODULE_ENTRIES;
  },
  getModuleIds() {
    return ACTIVE_MODULE_IDS;
  },
  findModuleEntry(moduleId) {
    const normalizedModuleId = String(moduleId || "").trim();
    if (!normalizedModuleId) return null;
    return this.getCatalog().find((entry) => entry?.moduleId === normalizedModuleId) || null;
  },
  hasModule(moduleId) {
    return !!this.findModuleEntry(moduleId);
  },
});

// App-Kern: kleiner statischer Modulkatalog.
// Bekannte Module und aktiver Modulumfang bleiben bewusst statisch.
// Keine dynamische Discovery, keine Plattformmechanik und keine Lizenzlogik im Katalog.
export function getActiveModuleCatalog() {
  return PRODUCTIVE_ACTIVE_MODULE_ACCESS.getCatalog();
}

export function getActiveModuleIds() {
  return PRODUCTIVE_ACTIVE_MODULE_ACCESS.getModuleIds();
}

export function findActiveModuleEntry(moduleId) {
  return PRODUCTIVE_ACTIVE_MODULE_ACCESS.findModuleEntry(moduleId);
}

export function hasActiveModule(moduleId) {
  return PRODUCTIVE_ACTIVE_MODULE_ACCESS.hasModule(moduleId);
}

export function getDerivedActiveModuleCatalog(moduleIds) {
  return deriveActiveModuleEntries(moduleIds);
}

export function getDerivedActiveModuleIds(moduleIds) {
  return deriveActiveModuleIds(moduleIds);
}

export function getActiveModuleCatalogForReleaseState(releaseState) {
  return deriveActiveModuleEntries(MODULE_RELEASE_STATE.getReleasedModuleIds(releaseState));
}

export function getActiveModuleIdsForReleaseState(releaseState) {
  return deriveActiveModuleIds(MODULE_RELEASE_STATE.getReleasedModuleIds(releaseState));
}

export { PROTOKOLL_MODULE_ID, RESTARBEITEN_MODULE_ID };
