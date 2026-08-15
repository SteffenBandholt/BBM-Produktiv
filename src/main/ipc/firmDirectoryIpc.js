"use strict";

const { ipcMain: electronIpcMain } = require("electron");
const { getFirmDirectoryService } = require("../domain/firms/FirmDirectoryService");

function failure(error) {
  return {
    ok: false,
    error: error?.message || String(error),
    code: error?.code || null,
    impacts: Array.isArray(error?.impacts) ? error.impacts : [],
  };
}

function registerFirmDirectoryIpc({ ipcMain = electronIpcMain, service = getFirmDirectoryService() } = {}) {
  const handle = (channel, operation, resultKey) => {
    ipcMain.handle(channel, async (_event, payload) => {
      try {
        const result = await operation(payload || {});
        return { ok: true, [resultKey]: result };
      } catch (error) {
        return failure(error);
      }
    });
  };

  handle("firmDirectory:get", (data) => service.get(data?.ref || data), "firm");
  handle("firmDirectory:listAll", (data) => service.listAll(data), "list");
  handle(
    "firmDirectory:listProjectParticipants",
    (data) => service.listProjectParticipants(data),
    "list"
  );
  handle("firmDirectory:listCustomers", (data) => service.listCustomers(data), "list");
  handle("firmDirectory:listPersons", (data) => service.listPersons(data), "list");
  handle("firmDirectory:create", (data) => service.create(data), "firm");
  handle("firmDirectory:update", (data) => service.update(data), "firm");
  handle("firmDirectory:checkUseChange", (data) => service.checkUseChange(data), "assessment");
  handle("firmDirectory:setUses", (data) => service.setUses(data), "firm");
  handle("firmDirectory:prepareLocalToGlobal", (data) => service.prepareLocalToGlobal(data), "plan");

  console.log("[main] firmDirectory IPC registered");
}

module.exports = { registerFirmDirectoryIpc };
