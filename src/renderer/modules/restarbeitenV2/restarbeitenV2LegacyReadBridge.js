function createLegacyReadBridgeError(message) {
  return new Error(message);
}

function resolveLegacyListSource(options = {}) {
  const candidates = [
    options.loadRestarbeiten,
    options.bridge?.listRestarbeiten,
    options.api?.listRestarbeiten,
  ];
  return candidates.find((candidate) => typeof candidate === "function") || null;
}

export function createRestarbeitenV2LegacyReadBridge(options = {}) {
  const loadRestarbeiten = resolveLegacyListSource(options);

  return {
    async loadLegacyRestarbeiten(projectId) {
      if (!projectId) {
        throw createLegacyReadBridgeError("Projektkontext fehlt");
      }
      if (!loadRestarbeiten) {
        throw createLegacyReadBridgeError("Restarbeiten V2 Legacy-Lese-Bridge ist nicht angebunden");
      }
      return loadRestarbeiten(projectId);
    },
  };
}
