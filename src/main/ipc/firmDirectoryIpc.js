"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { ipcMain: electronIpcMain } = require("electron");
const { getFirmDirectoryService } = require("../domain/firms/FirmDirectoryService");
const { decodeCsvBuffer, parseFirmCsvText } = require("../domain/firms/firmCsvImport");

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
  handle("firmDirectory:listPersons", (data) => service.listPersons(data), "list");
  handle("firmDirectory:createPerson", (data) => service.createPerson(data), "person");
  handle("firmDirectory:create", (data) => service.create(data), "firm");
  handle("firmDirectory:update", (data) => service.update(data), "firm");
  handle("firmDirectory:checkUseChange", (data) => service.checkUseChange(data), "assessment");
  handle("firmDirectory:setUses", (data) => service.setUses(data), "firm");
  handle("firmDirectory:prepareLocalToGlobal", (data) => service.prepareLocalToGlobal(data), "plan");
  handle("firmDirectory:importCsvParse", async (data) => {
    const filePath = String(data?.filePath || "").trim();
    if (!filePath) throw new TypeError("CSV-Dateipfad fehlt.");
    const buffer = await fs.promises.readFile(filePath);
    const csvText = decodeCsvBuffer(buffer);
    const context = String(data?.context || "stamm").trim().toLowerCase();
    const existingFirms =
      context === "projekt" || context === "project"
        ? service.listAll({
            kind: "project_firm",
            projectId: String(data?.projectId || "").trim(),
            includeInactive: true,
          })
        : service.listAll({ kind: "global_firm", includeInactive: true });
    return {
      ...parseFirmCsvText(csvText, { existingFirms }),
      filePath,
      fileName: path.basename(filePath),
    };
  }, "result");

  console.log("[main] firmDirectory IPC registered");
}

module.exports = { registerFirmDirectoryIpc };
