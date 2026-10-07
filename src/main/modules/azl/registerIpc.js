const { registerAzlIpc } = require("../../ipc/azlIpc");

function registerIpc({ ipcMain } = {}) {
  return registerAzlIpc({ ipcMain });
}

module.exports = Object.freeze({ registerIpc });
