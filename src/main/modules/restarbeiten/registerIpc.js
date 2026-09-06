const { registerRestarbeitenIpc } = require("../../ipc/restarbeitenIpc");

function registerIpc({ ipcMain } = {}) {
  return registerRestarbeitenIpc({ ipcMain });
}

module.exports = Object.freeze({ registerIpc });
