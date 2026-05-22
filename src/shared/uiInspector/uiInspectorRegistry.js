function _normalizeId(value) {
  return String(value == null ? '' : value).trim();
}

function _normalizeMap(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('UiInspectorRegistry: map must be an object.');
  }

  const id = _normalizeId(input.id);
  if (!id) {
    throw new Error('UiInspectorRegistry: map id must not be empty.');
  }

  return { ...input, id };
}

function createUiInspectorRegistry() {
  const maps = new Map();

  return {
    registerMap(map) {
      const normalized = _normalizeMap(map);
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
