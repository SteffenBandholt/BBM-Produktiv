function _normalizeKey(key) {
  return String(key == null ? '' : key).trim();
}

function createMemoryUiInspectorStore() {
  const values = new Map();

  return {
    getValue(key) {
      const normalizedKey = _normalizeKey(key);
      if (!normalizedKey) return undefined;
      return values.get(normalizedKey);
    },
    setValue(key, value) {
      const normalizedKey = _normalizeKey(key);
      if (!normalizedKey) throw new Error('UiInspectorStore: key must not be empty.');
      values.set(normalizedKey, value);
      return value;
    },
    removeValue(key) {
      const normalizedKey = _normalizeKey(key);
      if (!normalizedKey) return false;
      return values.delete(normalizedKey);
    },
    clear() {
      values.clear();
    },
  };
}

module.exports = {
  createMemoryUiInspectorStore,
};
