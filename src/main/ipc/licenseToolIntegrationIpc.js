"use strict";

const { ipcMain: electronIpcMain } = require("electron");
const { createLicenseToolIntegration } = require("../integrations/licenseToolIntegration");

function failure(error) {
  return {
    ok: false,
    code: error?.code || "LICENSE_TOOL_INTEGRATION_FAILED",
    error: error?.message || String(error),
    message: error?.message || String(error),
  };
}

function registerLicenseToolIntegrationIpc({
  ipcMain = electronIpcMain,
  integration = createLicenseToolIntegration(),
} = {}) {
  ipcMain.handle("dev:licenseToolStatus", async () => {
    try { return integration.status(); }
    catch (error) { return failure(error); }
  });
  ipcMain.handle("dev:licenseToolLaunch", async (_event, payload) => {
    try {
      return await integration.launch({
        customerId: String(payload?.customerId || "").trim(),
      });
    } catch (error) {
      return failure(error);
    }
  });
  return integration;
}

module.exports = { registerLicenseToolIntegrationIpc };
