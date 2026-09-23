"use strict";

const { ipcMain: electronIpcMain } = require("electron");
const { getRuntimeCustomerCore } = require("../domain/customers/customerCoreProvider");

function failure(error) {
  return {
    ok: false,
    error: error?.message || String(error),
    code: error?.code || null,
    candidates: Array.isArray(error?.candidates) ? error.candidates : [],
    missingFields: Array.isArray(error?.missingFields) ? error.missingFields : [],
  };
}

function duplicateCandidates(resolvedService, data, excludeCustomerId = "") {
  return resolvedService
    .findDuplicates(data || {}, { includeArchived: true })
    .filter((entry) => String(entry?.customerId || "") !== String(excludeCustomerId || ""));
}

function registerCustomerManagementIpc({
  ipcMain = electronIpcMain,
  customerService = null,
  runtimeContext = null,
} = {}) {
  let resolvedService = customerService;
  let resolvedContext = runtimeContext;
  if (!resolvedService) {
    const core = getRuntimeCustomerCore();
    resolvedService = core.service;
    resolvedContext = core.context;
  }
  if (!resolvedContext) {
    resolvedContext = { mode: "UNKNOWN", sharedManufacturerData: false };
  }

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

  handle("customerMgmt:context", () => ({
    mode: resolvedContext.mode,
    sharedManufacturerData: resolvedContext.sharedManufacturerData === true,
  }), "context");
  handle("customerMgmt:list", (data) => resolvedService.listCustomers(data), "list");
  handle("customerMgmt:get", (data) => resolvedService.getCustomer(data.customerId), "customer");
  handle("customerMgmt:prepareCreate", (data) => ({
    candidates: duplicateCandidates(resolvedService, data.customer || data),
  }), "data");

  handle("customerMgmt:create", (data) => {
    const input = data.customer || {};
    const candidates = duplicateCandidates(resolvedService, input);
    if (candidates.length && data.confirmCreateDespiteCandidates !== true) {
      const error = new Error("possible customer duplicate requires explicit review");
      error.code = "CUSTOMER_DUPLICATE_REVIEW_REQUIRED";
      error.candidates = candidates;
      throw error;
    }
    return resolvedService.createCustomer({
      ...input,
      sourceCode: input.sourceCode || "MANUAL",
    });
  }, "customer");

  handle("customerMgmt:update", (data) => {
    const current = resolvedService.getCustomer(data.customerId);
    if (!current) {
      const error = new Error("customer not found");
      error.code = "CUSTOMER_NOT_FOUND";
      throw error;
    }
    const patch = data.patch || {};
    const proposed = { ...current, ...patch };
    const candidates = duplicateCandidates(resolvedService, proposed, current.customerId);
    if (candidates.length && data.confirmUpdateDespiteCandidates !== true) {
      const error = new Error("possible customer duplicate requires explicit review");
      error.code = "CUSTOMER_DUPLICATE_REVIEW_REQUIRED";
      error.candidates = candidates;
      throw error;
    }
    return resolvedService.updateCustomer(
      current.customerId,
      patch,
      { expectedRevision: data.expectedRevision }
    );
  }, "customer");

  handle("customerMgmt:archive", (data) => resolvedService.archiveCustomer(data.customerId), "customer");
  handle("customerMgmt:reactivate", (data) => resolvedService.reactivateCustomer(data.customerId), "customer");

  handle("customerMgmt:contacts:list", (data) =>
    resolvedService.listContacts(data.customerId, { includeInactive: data.includeInactive === true }), "list");
  handle("customerMgmt:contacts:create", (data) =>
    resolvedService.createContact(data.customerId, data.contact || {}), "contact");
  handle("customerMgmt:contacts:update", (data) =>
    resolvedService.updateContact(data.contactId, data.patch || {}), "contact");
  handle("customerMgmt:contacts:delete", (data) =>
    ({ deleted: resolvedService.deleteContact(data.contactId) }), "data");

  console.log("[main] customer management IPC registered");
}

module.exports = {
  registerCustomerManagementIpc,
  duplicateCandidates,
};
