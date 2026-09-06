const { registerSigekoIpc } = require("../../ipc/sigekoIpc");

function registerIpc({ ipcMain } = {}) {
  return registerSigekoIpc({ ipcMain });
}

module.exports = Object.freeze({ registerIpc });
