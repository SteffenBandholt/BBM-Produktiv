const registry = require("./module-registry.json");

function getModuleIds() {
  return Object.freeze(Object.keys(registry.modules || {}));
}

module.exports = Object.freeze({ registry, getModuleIds });
