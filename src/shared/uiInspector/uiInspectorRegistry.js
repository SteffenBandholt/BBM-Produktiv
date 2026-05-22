const { normalizeUiInspectorMap } = require('./uiInspectorMapSchema');

function _normalizeId(value) {
  return String(value == null ? '' : value).trim();
}

function createUiInspectorRegistry() {
  const maps = new Map();

  return {
    registerMap(map) {
      const normalized = normalizeUiInspectorMap(map);
      maps.set(normalized.id, normalized); // duplicate ids are overwritten by newest map
      return normalized;
    },
    listMaps() {
      return Array.from(maps.values());
    },
    getMap(id) {
      const normalizedId = _normalizeId(id);
      if (!normalizedId) return null;
      return maps.get(normalizedId) || null;
    },
    clear() {
      maps.clear();
    },
  };
}

module.exports = {
  createUiInspectorRegistry,
};
