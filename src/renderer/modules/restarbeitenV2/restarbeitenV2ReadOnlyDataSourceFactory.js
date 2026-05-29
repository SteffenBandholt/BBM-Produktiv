import { createRestarbeitenV2LegacyReadBridge } from "./restarbeitenV2LegacyReadBridge.js";
import { createRestarbeitenV2ReadOnlyAdapter } from "./restarbeitenV2ReadOnlyAdapter.js";

function createFactoryBridge(options = {}) {
  return createRestarbeitenV2LegacyReadBridge(options);
}

export function createRestarbeitenV2ReadOnlyDataSourceFactory(options = {}) {
  const legacyReadBridge = createFactoryBridge(options);

  return {
    legacyReadBridge,
    createRestarbeitenV2ReadOnlyDataSource(overrideOptions = {}) {
      const mergedOptions = { ...options, ...overrideOptions };
      const nextBridge =
        Object.keys(overrideOptions || {}).length > 0 ? createFactoryBridge(mergedOptions) : legacyReadBridge;

      return createRestarbeitenV2ReadOnlyAdapter({
        loadLegacyRestarbeiten: (projectId) => nextBridge.loadLegacyRestarbeiten(projectId),
      });
    },
  };
}

export function createRestarbeitenV2ReadOnlyDataSource(options = {}) {
  return createRestarbeitenV2ReadOnlyDataSourceFactory(options).createRestarbeitenV2ReadOnlyDataSource();
}
