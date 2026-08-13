const { getModuleIds } = require("../moduleRegistry");

function createModuleMigrationRegistry() {
  const registry = new Map();

  return Object.freeze({
    register(moduleId, migrate) {
      const normalized = String(moduleId || "").trim().toLowerCase();
      if (!getModuleIds().includes(normalized)) {
        throw new Error(`Unbekannte BBM-Modul-ID: ${normalized || "(leer)"}`);
      }
      if (typeof migrate !== "function") {
        throw new TypeError(`Migration für ${normalized} muss eine Funktion sein.`);
      }
      registry.set(normalized, migrate);
      return this;
    },

    has(moduleId) {
      return registry.has(String(moduleId || "").trim().toLowerCase());
    },

    run(activeModuleIds, context = {}) {
      const executed = [];
      for (const value of Array.isArray(activeModuleIds) ? activeModuleIds : []) {
        const moduleId = String(value || "").trim().toLowerCase();
        const migrate = registry.get(moduleId);
        if (typeof migrate !== "function") continue;
        migrate(context);
        executed.push(moduleId);
      }
      return Object.freeze(executed);
    },
  });
}

module.exports = Object.freeze({ createModuleMigrationRegistry });
