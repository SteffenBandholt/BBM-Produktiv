const { ipcMain } = require("electron");
const uiEditorElementOverridesRepo = require("../db/uiEditorElementOverridesRepo");

function registerUiEditorElementOverridesIpc() {
  ipcMain.handle("uiEditorElementOverrides:list", async (_evt, payload) => {
    try {
      return { ok: true, data: uiEditorElementOverridesRepo.listUiEditorElementOverrides(payload || {}) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("uiEditorElementOverrides:save", async (_evt, payload) => {
    try {
      return { ok: true, data: uiEditorElementOverridesRepo.saveUiEditorElementOverride(payload || {}) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });
}

module.exports = { registerUiEditorElementOverridesIpc };
