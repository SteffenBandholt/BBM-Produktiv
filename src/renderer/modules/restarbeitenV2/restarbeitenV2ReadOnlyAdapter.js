import { normalizeRestarbeitV2List } from "./restarbeitenV2Mapper.js";

function createReadOnlyError(action) {
  return new Error(`Restarbeiten V2 ReadOnly-Adapter unterstützt kein ${action}`);
}

function resolveLegacyLoader(options = {}) {
  const candidates = [
    options.loadLegacyRestarbeiten,
    options.bridge?.loadLegacyRestarbeiten,
    options.bridge?.listLegacyRestarbeiten,
    options.api?.loadLegacyRestarbeiten,
    options.api?.listLegacyRestarbeiten,
  ];
  return candidates.find((candidate) => typeof candidate === "function") || null;
}

export function createRestarbeitenV2ReadOnlyAdapter(options = {}) {
  const loadLegacyRestarbeiten = resolveLegacyLoader(options);

  return {
    async listRestarbeitenV2(projectId) {
      if (!projectId) {
        throw new Error("Restarbeiten V2 ReadOnly-Adapter benötigt projectId");
      }
      if (!loadLegacyRestarbeiten) {
        throw new Error("Restarbeiten V2 ReadOnly-Adapter hat keine Lesebridge");
      }
      const legacyItems = await loadLegacyRestarbeiten(projectId);
      return normalizeRestarbeitV2List(legacyItems);
    },
    createRestarbeitV2() {
      throw createReadOnlyError("Erstellen");
    },
    updateRestarbeitV2() {
      throw createReadOnlyError("Aktualisieren");
    },
    deleteRestarbeitV2() {
      throw createReadOnlyError("Löschen");
    },
    listRestarbeitV2Attachments() {
      return Promise.resolve([]);
    },
  };
}
