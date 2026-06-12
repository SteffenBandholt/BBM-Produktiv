const { ipcMain } = require("electron");
const uiEditorLayoutOverridesRepo = require("../db/uiEditorLayoutOverridesRepo");

function registerUiEditorLayoutOverridesIpc() {
  ipcMain.handle("uiEditorLayoutOverrides:getMany", async (_evt, payload) => {
    try {
      return { ok: true, data: uiEditorLayoutOverridesRepo.listUiEditorLayoutOverrides(payload || {}) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("uiEditorLayoutOverrides:save", async (_evt, payload) => {
    try {
      return { ok: true, data: uiEditorLayoutOverridesRepo.saveUiEditorLayoutOverride(payload || {}) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });
}

module.exports = { registerUiEditorLayoutOverridesIpc };
