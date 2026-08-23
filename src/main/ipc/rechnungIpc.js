"use strict";

const path = require("node:path");
const {
  app: electronApp,
  ipcMain: electronIpcMain,
  shell: electronShell,
} = require("electron");
const projectsRepo = require("../db/projectsRepo");
const { getFirmDirectoryService } = require("../domain/firms/FirmDirectoryService");
const { getInvoiceService } = require("../domain/rechnung/InvoiceService");
const { InvoicePdfFinalizer } = require("../domain/rechnung/InvoicePdfFinalizer");

function failure(error) { return { ok: false, error: error?.message || String(error), code: error?.code || null }; }

function registerRechnungIpc({
  ipcMain = electronIpcMain,
  service = getInvoiceService(),
  firmDirectory = getFirmDirectoryService(),
  projectRepository = projectsRepo,
  app = electronApp,
  shell = electronShell,
  pdfFinalizer = null,
} = {}) {
  const finalizer = pdfFinalizer || new InvoicePdfFinalizer({
    repository: service.repository,
    renderPdf: (payload) => require("./printIpc").printToPdf(payload),
    storageRoot: path.join(app.getPath("userData"), "commercial-documents"),
  });
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
  ipcMain.handle("rechnung:bookDraft", async (_event, payload) => {
    const data = payload || {};
    try {
      const booked = await service.bookDraft(data.id, data.header);
      return { ok: true, data: await finalizer.finalize(booked.id) };
    } catch (error) {
      let invoice = null;
      try { invoice = service.get(data.id); } catch (_readError) { /* Fehlerantwort bleibt ohne optionalen Datensatz. */ }
      return { ...failure(error), data: invoice };
    }
  });
  handle("rechnung:finalizePdf", (data) => finalizer.finalize(data.id));
  handle("rechnung:openPdf", async (data) => {
    const { reference } = finalizer.verifyStored(data.id);
    const message = await shell.openPath(reference.local_path);
    if (message) throw new Error(message);
    return { opened: true, filePath: reference.local_path };
  });
  handle("rechnung:listCustomers", () => firmDirectory.listCustomers({}).filter((entry) => entry.kind === "global_firm"), "list");
  handle("rechnung:listProjects", () => projectRepository.listAll(), "list");
  console.log("[main] Rechnung IPC registered");
}

module.exports = { registerRechnungIpc };
