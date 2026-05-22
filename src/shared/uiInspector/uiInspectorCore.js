const { createUiInspectorRegistry } = require('./uiInspectorRegistry');
const { createMemoryUiInspectorStore } = require('./uiInspectorStore');

function _normalizeElementId(value) {
  return String(value == null ? '' : value).trim();
}

function createUiInspectorCore({ registry, store } = {}) {
  const resolvedRegistry = registry || createUiInspectorRegistry();
  const resolvedStore = store || createMemoryUiInspectorStore();

  const state = {
    active: false,
    selectedElementId: null,
  };

  return {
    registry: resolvedRegistry,
    store: resolvedStore,
    getState() {
      return { ...state };
    },
    activate() {
      state.active = true;
      return this.getState();
    },
    deactivate() {
      state.active = false;
      return this.getState();
    },
    isActive() {
      return state.active;
    },
    selectElement(id) {
      const normalizedId = _normalizeElementId(id);
      if (!normalizedId) {
        throw new Error('UiInspectorCore: selected element id must not be empty.');
      }
      state.selectedElementId = normalizedId;
      return this.getState();
    },
    clearSelection() {
      state.selectedElementId = null;
      return this.getState();
    },
  };
}

module.exports = {
  createUiInspectorCore,
};
