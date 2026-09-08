const { createSigekoService } = require("../domain/sigeko/SigekoService");

const { createSigekoProjectService } = require("../domain/sigeko/SigekoProjectService");

function registerSigekoIpc({ ipcMain, service = createSigekoService(), projectService = createSigekoProjectService() } = {}) {
  for (const operation of ["getStoragePaths", "ensureStorageDirectories", "openStorageDirectory"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await service[operation](payload) }; }
      catch (error) {
        return { ok: false, error: error?.message || String(error), code: error?.code || "STORAGE_ERROR", path: error?.path || null };
      }
    });
  }
  for (const operation of ["getCoordinatorProfile", "saveCoordinatorProfile", "getProjectData", "saveProjectData"]) {
    ipcMain.handle(`sigeko:${operation}`, async (_event, payload) => {
      try { return { ok: true, data: await projectService[operation](payload) }; }
      catch (error) { return { ok: false, error: error?.message || String(error), code: error?.code || "SIGEKO_ERROR" }; }
    });
  }
  ipcMain.handle("sigeko:getModuleInfo", () => ({
    ok: true,
    module: service.getModuleInfo(),
  }));
}

module.exports = Object.freeze({ registerSigekoIpc });
