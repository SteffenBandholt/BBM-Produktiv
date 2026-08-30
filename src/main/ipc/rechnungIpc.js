"use strict";

const { app: electronApp, ipcMain: electronIpcMain } = require("electron");
const projectsRepo = require("../db/projectsRepo");
const { getFirmDirectoryService } = require("../domain/firms/FirmDirectoryService");
const { getInvoiceService } = require("../domain/rechnung/InvoiceService");

function failure(error) { return { ok: false, error: error?.message || String(error), code: error?.code || null }; }

function devOnly(app, operation) {
  return (data) => {
    if (app?.isPackaged !== false) {
      const error = new Error("Nur im ungepackten Entwicklermodus verfügbar.");
      error.code = "DEV_ONLY";
      throw error;
    }
    return operation(data);
  };
}

function registerRechnungIpc({ ipcMain = electronIpcMain, app = electronApp, service = getInvoiceService(), firmDirectory = getFirmDirectoryService(), projectRepository = projectsRepo } = {}) {
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
  handle("rechnung:listPayments", (data) => service.listPayments(data.invoiceId), "list");
  handle("rechnung:recordPayment", (data) => service.recordPayment(data.invoiceId, data.payment));
  handle("rechnung:correctPayment", (data) => service.correctPayment(data.invoiceId, data.paymentId, data.payment));
  handle("rechnung:paymentSummary", (data) => service.paymentSummary(data.invoiceId));
  handle("rechnung:devNumberSequenceGet", devOnly(app, (data) => service.getDevNumberSequence(data.sequenceKey)));
  handle("rechnung:devNumberSequenceReset", devOnly(app, (data) => service.resetDevNumberSequence(data.sequenceKey)));
  handle("rechnung:listCustomers", () => firmDirectory.listCustomers({}).filter((entry) => entry.kind === "global_firm"), "list");
  handle("rechnung:listProjects", () => projectRepository.listAll(), "list");
  console.log("[main] Rechnung IPC registered");
}

module.exports = { registerRechnungIpc, devOnly };
