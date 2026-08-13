const { resolveActiveModuleIds } = require("./moduleRegistry");

function registerActiveModuleIpcs({ licenseStatus, registrars = {}, logger = console } = {}) {
  const activeModuleIds = resolveActiveModuleIds(licenseStatus);
  const registeredModuleIds = [];

  for (const moduleId of activeModuleIds) {
    const registrar = registrars[moduleId];
    if (typeof registrar !== "function") {
      logger?.warn?.(`[main] no IPC registrar for active module: ${moduleId}`);
      continue;
    }
    registrar();
    registeredModuleIds.push(moduleId);
  }

  return Object.freeze({
    activeModuleIds,
    registeredModuleIds: Object.freeze(registeredModuleIds),
  });
}

module.exports = Object.freeze({ registerActiveModuleIpcs });
