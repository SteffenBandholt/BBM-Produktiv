function createUiInspectorOverlay() {
  return {
    mount() {
      return false;
    },
    unmount() {
      return false;
    },
  };
}

module.exports = {
  createUiInspectorOverlay,
};
