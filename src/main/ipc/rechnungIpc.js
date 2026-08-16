"use strict";

const { ipcMain: electronIpcMain } = require("electron");
const projectsRepo = require("../db/projectsRepo");
const { getFirmDirectoryService } = require("../domain/firms/FirmDirectoryService");
const { getInvoiceService } = require("../domain/rechnung/InvoiceService");

function failure(error) { return { ok: false, error: error?.message || String(error), code: error?.code || null }; }

function registerRechnungIpc({ ipcMain = electronIpcMain, service = getInvoiceService(), firmDirectory = getFirmDirectoryService(), projectRepository = projectsRepo } = {}) {
  const handle = (channel, operation, resultKey = "data") => ipcMain.handle(channel, async (_event, payload) => {
    try { return { ok: true, [resultKey]: await operation(payload || {}) }; }
    catch (error) { return failure(error); }
  });
  handle("rechnung:defaults", () => service.defaults());
  handle("rechnung:list", () => service.list(), "list");
  handle("rechnung:get", (data) => service.get(data.id));
  handle("rechnung:createDraft", (data) => service.createDraft(data));
  handle("rechnung:updateDraft", (data) => service.updateDraft(data.id, data.header));
  handle("rechnung:deleteDraft", (data) => service.deleteDraft(data.id));
  handle("rechnung:previewDraft", (data) => service.previewDraft(data.id, data.header));
  handle("rechnung:bookDraft", (data) => service.bookDraft(data.id, data.header));
  handle("rechnung:listCustomers", () => firmDirectory.listCustomers({}).filter((entry) => entry.kind === "global_firm"), "list");
  handle("rechnung:listProjects", () => projectRepository.listAll(), "list");
  console.log("[main] Rechnung IPC registered");
}

module.exports = { registerRechnungIpc };
