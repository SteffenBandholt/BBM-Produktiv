const { createSigekoService } = require("../domain/sigeko/SigekoService");

function registerSigekoIpc({ ipcMain, service = createSigekoService() } = {}) {
  ipcMain.handle("sigeko:getModuleInfo", () => ({
    ok: true,
    module: service.getModuleInfo(),
  }));
}

module.exports = Object.freeze({ registerSigekoIpc });
