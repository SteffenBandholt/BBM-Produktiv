const { registerRechnungIpc } = require("../../ipc/rechnungIpc");

function registerIpc({ ipcMain } = {}) {
  return registerRechnungIpc({ ipcMain });
}

module.exports = Object.freeze({ registerIpc });
