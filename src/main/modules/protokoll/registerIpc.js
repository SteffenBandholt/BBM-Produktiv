const { registerMeetingsIpc } = require("../../ipc/meetingsIpc");
const { registerTopsIpc } = require("../../ipc/topsIpc");

function registerIpc({ ipcMain } = {}) {
  registerMeetingsIpc({ ipcMain });
  registerTopsIpc({ ipcMain });
}

module.exports = Object.freeze({ registerIpc });
