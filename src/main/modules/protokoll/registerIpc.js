const { registerMeetingsIpc } = require("../../ipc/meetingsIpc");
const { registerTopsIpc } = require("../../ipc/topsIpc");
const { registerProjectSettingsIpc } = require("../../ipc/projectSettingsIpc");

function registerIpc({ ipcMain } = {}) {
  registerMeetingsIpc({ ipcMain });
  registerTopsIpc({ ipcMain });
  registerProjectSettingsIpc({ ipcMain });
}

module.exports = Object.freeze({ registerIpc });
