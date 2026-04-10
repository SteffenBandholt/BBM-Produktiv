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

function hasOwnReleaseField(releaseState, fieldName) {
  return !!releaseState && Object.prototype.hasOwnProperty.call(releaseState, fieldName);
}

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

function getReleasedModuleIds(releaseState) {
  if (!releaseState || typeof releaseState !== "object") {
    return DEFAULT_ACTIVE_MODULE_IDS;
  }

  if (hasOwnReleaseField(releaseState, "activeModuleIds")) {
    return normalizeModuleIds(releaseState.activeModuleIds);
  }

  if (hasOwnReleaseField(releaseState, "releasedModuleIds")) {
    return normalizeModuleIds(releaseState.releasedModuleIds);
  }

  if (releaseState.modules && typeof releaseState.modules === "object") {
    return normalizeModuleIds(
      Object.entries(releaseState.modules)
        .filter(([, isReleased]) => !!isReleased)
        .map(([moduleId]) => moduleId)
    );
  }

  return DEFAULT_ACTIVE_MODULE_IDS;
}

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

const ACTIVE_MODULE_ENTRIES = deriveActiveModuleEntries(DEFAULT_ACTIVE_MODULE_IDS);

const ACTIVE_MODULE_IDS = Object.freeze(
  deriveActiveModuleIds(DEFAULT_ACTIVE_MODULE_IDS)
);

// App-Kern: kleiner statischer Modulkatalog.
// Bekannte Module und aktiver Modulumfang bleiben bewusst statisch.
// Keine dynamische Discovery, keine Plattformmechanik und keine Lizenzlogik im Katalog.
export function getActiveModuleCatalog() {
  return ACTIVE_MODULE_ENTRIES;
}

export function getActiveModuleIds() {
  return ACTIVE_MODULE_IDS;
}

export function findActiveModuleEntry(moduleId) {
  const normalizedModuleId = String(moduleId || "").trim();
  if (!normalizedModuleId) return null;
  return ACTIVE_MODULE_ENTRIES.find((entry) => entry?.moduleId === normalizedModuleId) || null;
}

export function hasActiveModule(moduleId) {
  return !!findActiveModuleEntry(moduleId);
}

export function getDerivedActiveModuleCatalog(moduleIds) {
  return deriveActiveModuleEntries(moduleIds);
}

export function getDerivedActiveModuleIds(moduleIds) {
  return deriveActiveModuleIds(moduleIds);
}

export function getActiveModuleCatalogForReleaseState(releaseState) {
  return deriveActiveModuleEntries(getReleasedModuleIds(releaseState));
}

export function getActiveModuleIdsForReleaseState(releaseState) {
  return deriveActiveModuleIds(getReleasedModuleIds(releaseState));
}

export { PROTOKOLL_MODULE_ID, RESTARBEITEN_MODULE_ID };
