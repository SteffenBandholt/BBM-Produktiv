"use strict";

const { ipcMain: electronIpcMain } = require("electron");
const { getCustomerFirmBridgeService } = require("../domain/customers/CustomerFirmBridgeService");

function failure(error) {
  return {
    ok: false,
    error: error?.message || String(error),
    code: error?.code || null,
    customerId: error?.customerId || null,
    candidates: Array.isArray(error?.candidates) ? error.candidates : [],
    duplicateState: error?.duplicateState || null,
  };
}

function registerCustomerDirectoryIpc({
  ipcMain = electronIpcMain,
  service = getCustomerFirmBridgeService(),
} = {}) {
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

  handle("customer:list", (data) => service.listCustomers(data), "list");
  handle("customer:get", (data) => service.getCustomer(data?.customerId), "customer");
  handle("customer:firm:prepare", (data) => service.prepareFirmAsCustomer(data), "data");
  handle("customer:firm:create", (data) => service.createCustomerFromFirm(data), "data");
  handle("customer:firm:link", (data) => service.linkFirmToCustomer(data), "data");
  handle("customer:firm:compare", (data) => service.compareFirmAndCustomer(data), "data");
  handle("customer:firm:applyToCustomer", (data) => service.applyFirmFieldsToCustomer(data), "customer");
  handle("customer:createGlobalFirm", (data) => service.createGlobalFirmFromCustomer(data), "data");

  console.log("[main] customer directory IPC registered");
}

module.exports = { registerCustomerDirectoryIpc };
