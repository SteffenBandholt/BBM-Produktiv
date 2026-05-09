const { ipcMain } = require("electron");
const tableLayoutsRepo = require("../db/tableLayoutsRepo");
const { listTableLayoutDefinitions } = require("../../shared/tableLayouts/tableLayoutRegistry");

function registerTableLayoutsIpc() {
  ipcMain.handle("tableLayouts:getMany", async (_evt, payload) => {
    try {
      return { ok: true, data: tableLayoutsRepo.listTableLayouts(payload || {}) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("tableLayouts:listDefinitions", async () => {
    try {
      return { ok: true, data: listTableLayoutDefinitions() };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("tableLayouts:getOne", async (_evt, payload) => {
    try {
      return { ok: true, data: await tableLayoutsRepo.getEffectiveTableLayout(payload || {}) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("tableLayouts:save", async (_evt, payload) => {
    try {
      return { ok: true, data: await tableLayoutsRepo.saveTableLayout(payload || {}) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("tableLayouts:reset", async (_evt, payload) => {
    try {
      return { ok: true, data: tableLayoutsRepo.resetTableLayout(payload || {}) };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });
}

module.exports = { registerTableLayoutsIpc };
