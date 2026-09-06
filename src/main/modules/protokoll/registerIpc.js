const { registerMeetingsIpc } = require("../../ipc/meetingsIpc");
const { registerTopsIpc } = require("../../ipc/topsIpc");
const { registerProjectSettingsIpc } = require("../../ipc/projectSettingsIpc");
const { registerMeetingParticipantsIpc } = require("../../ipc/participantsIpc");

function registerIpc({ ipcMain } = {}) {
  registerMeetingsIpc({ ipcMain });
  registerTopsIpc({ ipcMain });
  registerProjectSettingsIpc({ ipcMain });
  registerMeetingParticipantsIpc({ ipcMain });
}

module.exports = Object.freeze({ registerIpc });
