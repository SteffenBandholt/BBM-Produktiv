const { getModuleDefinition, isModuleActive, resolveActiveModuleIds } = require("./moduleRegistry");

function createGuardedIpcMain({ ipcMain, moduleId, getLicenseStatus }) {
  if (!ipcMain || typeof ipcMain.handle !== "function") {
    throw new TypeError("ipcMain.handle ist fuer Modul-IPCs erforderlich");
  }
  if (typeof getLicenseStatus !== "function") {
    throw new TypeError("getLicenseStatus ist fuer Modul-IPC-Guards erforderlich");
  }

  return Object.freeze({
    handle(channel, listener) {
      return ipcMain.handle(channel, (event, ...args) => {
        if (!isModuleActive(getLicenseStatus(), moduleId)) {
          const error = new Error(`MODULE_NOT_ACTIVE:${moduleId}`);
          error.code = "MODULE_NOT_ACTIVE";
          throw error;
        }
        return listener(event, ...args);
      });
    },
  });
}

function registerActiveModuleIpcs({
  licenseStatus,
  getLicenseStatus = () => licenseStatus,
  ipcMain,
  registrars = {},
  logger = console,
} = {}) {
  const activeModuleIds = resolveActiveModuleIds(licenseStatus);
  const registeredModuleIds = [];

  for (const moduleId of activeModuleIds) {
    const registrarKey = getModuleDefinition(moduleId)?.ipcRegistrar;
    const registrar = registrars[registrarKey];
    if (typeof registrar !== "function") {
      logger?.warn?.(`[main] no IPC registrar for active module: ${moduleId} (${registrarKey || "none"})`);
      continue;
    }
    const guardedIpcMain = createGuardedIpcMain({ ipcMain, moduleId, getLicenseStatus });
    registrar({ ipcMain: guardedIpcMain, moduleId });
    registeredModuleIds.push(moduleId);
  }

  return Object.freeze({
    activeModuleIds,
    registeredModuleIds: Object.freeze(registeredModuleIds),
  });
}

module.exports = Object.freeze({ createGuardedIpcMain, registerActiveModuleIpcs });
