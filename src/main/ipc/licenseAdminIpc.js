"use strict";

const { app, ipcMain } = require("electron");
const licenseAdminService = require("../licensing/licenseAdminService");
const { requireFeature } = require("../licensing/licenseService");
const { LICENSE_FEATURES } = require("../licensing/licenseFeatures");
const {
  issueLicense,
  listProductAdapters,
  resolvePrivateKeyPath,
} = require("../licensing/licenseIssuerService");
const fs = require("fs");

function _assertLicenseAdminAccess() {
  if (!app.isPackaged) return true;
  requireFeature(LICENSE_FEATURES.LICENSE_ADMIN);
  return true;
}

function _guard(handler) {
  return async (_event, payload) => {
    try {
      _assertLicenseAdminAccess();
      return await handler(payload);
    } catch (error) {
      return {
        ok: false,
        error: String(error?.code || error?.message || error || "LICENSE_ADMIN_FAILED"),
      };
    }
  };
}

function _productList() {
  return listProductAdapters().map((adapter) => ({
    product: adapter.product,
    label: adapter.label || adapter.product,
    extension: adapter.extension || "lic",
    moduleIds: Array.isArray(adapter.moduleIds) ? [...adapter.moduleIds] : [],
    featureIds: Array.isArray(adapter.featureIds) ? [...adapter.featureIds] : [],
  }));
}

function registerLicenseAdminIpc() {
  ipcMain.handle("license-admin:access-status", _guard(async () => ({
    ok: true,
    development: !app.isPackaged,
  })));

  ipcMain.handle("license-admin:list-customers", _guard(async () => ({
    ok: true,
    customers: licenseAdminService.listCustomers(),
  })));

  ipcMain.handle("license-admin:save-customer", _guard(async (payload) => ({
    ok: true,
    customer: licenseAdminService.saveCustomer(payload || {}),
  })));

  ipcMain.handle("license-admin:delete-customer", _guard(async (payload) => {
    const id = String(payload?.id || payload || "").trim();
    return licenseAdminService.deleteCustomer(id, {
      deleteLicenses: payload?.deleteLicenses === true,
    });
  }));

  ipcMain.handle("license-admin:list-licenses", _guard(async () => ({
    ok: true,
    licenses: licenseAdminService.listLicenses(),
  })));

  ipcMain.handle("license-admin:list-licenses-by-customer", _guard(async (payload) => ({
    ok: true,
    licenses: licenseAdminService.listLicensesByCustomer(
      String(payload?.customerId || payload || "").trim()
    ),
  })));

  ipcMain.handle("license-admin:save-license", _guard(async (payload) => ({
    ok: true,
    license: licenseAdminService.saveLicense(payload || {}),
  })));

  ipcMain.handle("license-admin:delete-license", _guard(async (payload) =>
    licenseAdminService.deleteLicenseRecord(String(payload?.id || payload || "").trim())
  ));

  ipcMain.handle("license-admin:list-history", _guard(async () => ({
    ok: true,
    history: licenseAdminService.listHistory(),
  })));

  ipcMain.handle("license-admin:add-history", _guard(async (payload) => ({
    ok: true,
    entry: licenseAdminService.addHistoryEntry(payload || {}),
  })));

  ipcMain.handle("license-admin:list-products", _guard(async () => ({
    ok: true,
    products: _productList(),
  })));

  ipcMain.handle("license-admin:key-status", _guard(async () => {
    const keyPath = resolvePrivateKeyPath();
    return {
      ok: true,
      configured: fs.existsSync(keyPath),
    };
  }));

  ipcMain.handle("license-admin:issue", _guard(async (payload) => {
    const result = issueLicense(payload || {});
    return {
      ok: true,
      outputPath: result.outputPath,
      product: result.product,
      license: result.license,
    };
  }));
}

module.exports = Object.freeze({
  registerLicenseAdminIpc,
  _assertLicenseAdminAccess,
});
