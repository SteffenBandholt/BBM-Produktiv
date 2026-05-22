const {
  createUiInspectorCore,
  createUiInspectorRegistry,
  createMemoryUiInspectorStore,
} = require('../../shared/uiInspector');

function createUiInspectorRuntime({ registry, store, core } = {}) {
  const resolvedRegistry = registry || createUiInspectorRegistry();
  const resolvedStore = store || createMemoryUiInspectorStore();
  const resolvedCore =
    core || createUiInspectorCore({ registry: resolvedRegistry, store: resolvedStore });

  return {
    registry: resolvedRegistry,
    store: resolvedStore,
    core: resolvedCore,
  };
}

module.exports = {
  createUiInspectorRuntime,
};
