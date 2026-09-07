const { createSigekoService } = require("../domain/sigeko/SigekoService");

function registerSigekoIpc({ ipcMain, service = createSigekoService() } = {}) {
  for (const operation of ["getStoragePaths", "ensureStorageDirectories", "openStorageDirectory"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await service[operation](payload) }; }
      catch (error) {
        return { ok: false, error: error?.message || String(error), code: error?.code || "STORAGE_ERROR", path: error?.path || null };
      }
    });
  }
  ipcMain.handle("sigeko:getModuleInfo", () => ({
    ok: true,
    module: service.getModuleInfo(),
  }));
}

module.exports = Object.freeze({ registerSigekoIpc });
