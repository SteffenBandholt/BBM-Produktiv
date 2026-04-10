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
  getProductiveReleaseState() {
    return this.productiveDefaultReleaseState;
  },
  getCurrentReleaseState(releaseState) {
    if (!releaseState || typeof releaseState !== "object") {
      return this.getProductiveReleaseState();
    }

    return releaseState;
  },
  getDefaultReleasedModuleIds() {
    return this.getProductiveReleaseState().releasedModuleIds;
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

function createReleaseStateAccess(getReleaseState) {
  return Object.freeze({
    getReleaseState(releaseState) {
      return getReleaseState(releaseState);
    },
    getReleasedModuleIds(releaseState) {
      return MODULE_RELEASE_STATE.getReleasedModuleIds(this.getReleaseState(releaseState));
    },
  });
}

const CURRENT_RELEASE_STATE_ACCESS = createReleaseStateAccess((releaseState) =>
  MODULE_RELEASE_STATE.getCurrentReleaseState(releaseState)
);

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

function findModuleEntryInCatalog(moduleCatalog, moduleId) {
  const normalizedModuleId = String(moduleId || "").trim();
  if (!normalizedModuleId) return null;
  return moduleCatalog.find((entry) => entry?.moduleId === normalizedModuleId) || null;
}

function createModuleLookupAccess(getCatalog) {
  return Object.freeze({
    findModuleEntry(releaseState, moduleId) {
      return findModuleEntryInCatalog(getCatalog(releaseState), moduleId);
    },
    hasModule(releaseState, moduleId) {
      return !!this.findModuleEntry(releaseState, moduleId);
    },
  });
}

function createModuleAccess(getCatalog) {
  return Object.freeze({
    getCatalog(releaseState) {
      return getCatalog(releaseState);
    },
    getModuleIds(releaseState) {
      return deriveModuleIdsFromEntries(this.getCatalog(releaseState));
    },
    ...createModuleLookupAccess(getCatalog),
  });
}

function createReleasedModuleAccess(getReleasedModuleIds) {
  return createModuleAccess((releaseState) =>
    deriveActiveModuleEntries(getReleasedModuleIds(releaseState))
  );
}

function createProductiveModuleAccess(moduleAccess, getModuleIds) {
  return Object.freeze({
    getCatalog() {
      return moduleAccess.getCatalog();
    },
    getModuleIds() {
      return getModuleIds();
    },
    findModuleEntry(moduleId) {
      return moduleAccess.findModuleEntry(undefined, moduleId);
    },
    hasModule(moduleId) {
      return moduleAccess.hasModule(undefined, moduleId);
    },
  });
}

const RELEASE_STATE_MODULE_ACCESS = createReleasedModuleAccess((releaseState) =>
  CURRENT_RELEASE_STATE_ACCESS.getReleasedModuleIds(releaseState)
);

const ACTIVE_MODULE_ENTRIES = RELEASE_STATE_MODULE_ACCESS.getCatalog();

const ACTIVE_MODULE_IDS = RELEASE_STATE_MODULE_ACCESS.getModuleIds();

const PRODUCTIVE_ACTIVE_MODULE_ACCESS = createProductiveModuleAccess(
  RELEASE_STATE_MODULE_ACCESS,
  () => ACTIVE_MODULE_IDS
);

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
  return RELEASE_STATE_MODULE_ACCESS.getCatalog(releaseState);
}

export function getActiveModuleIdsForReleaseState(releaseState) {
  return RELEASE_STATE_MODULE_ACCESS.getModuleIds(releaseState);
}

export { PROTOKOLL_MODULE_ID, RESTARBEITEN_MODULE_ID };
