"use strict";

const path = require("node:path");

const CUSTOMER_CONTEXT_MODES = Object.freeze({
  MANUFACTURER: "MANUFACTURER",
  LICENSEE: "LICENSEE",
});

const MANUFACTURER_DIRECTORY_NAME = "BBM-Kundenverwaltung";

function normalizeMode(value) {
  const mode = String(value || "").trim().toUpperCase();
  if (!mode) return "";
  if (!Object.values(CUSTOMER_CONTEXT_MODES).includes(mode)) {
    throw new Error(`invalid customer context mode: ${value}`);
  }
  return mode;
}

function resolveCustomerRuntimeContext({
  isPackaged = false,
  userDataPath,
  mode,
  env = process.env,
  manufacturerDataPath,
} = {}) {
  const localUserData = String(userDataPath || "").trim();
  if (!localUserData) throw new Error("customer userData path required");

  const explicitMode = normalizeMode(mode || env?.BBM_CUSTOMER_CONTEXT_MODE);
  const resolvedMode = explicitMode || (
    isPackaged ? CUSTOMER_CONTEXT_MODES.LICENSEE : CUSTOMER_CONTEXT_MODES.MANUFACTURER
  );

  if (resolvedMode === CUSTOMER_CONTEXT_MODES.MANUFACTURER) {
    const configuredRoot = String(
      manufacturerDataPath ||
      env?.BBM_MANUFACTURER_CUSTOMER_DATA_DIR ||
      ""
    ).trim();
    const rootPath = configuredRoot
      ? path.resolve(configuredRoot)
      : path.resolve(localUserData, "..", MANUFACTURER_DIRECTORY_NAME);
    return Object.freeze({
      mode: resolvedMode,
      rootPath,
      databasePath: path.join(rootPath, "customers.db"),
      sharedManufacturerData: true,
    });
  }

  const rootPath = path.resolve(localUserData);
  return Object.freeze({
    mode: resolvedMode,
    rootPath,
    databasePath: path.join(rootPath, "customers.db"),
    sharedManufacturerData: false,
  });
}

function shouldExposeCustomerDirectory({
  isPackaged = false,
  licenseStatus = null,
  isModuleActive = () => false,
} = {}) {
  if (!isPackaged) return true;
  return isModuleActive(licenseStatus, "rechnung") === true;
}

module.exports = {
  CUSTOMER_CONTEXT_MODES,
  MANUFACTURER_DIRECTORY_NAME,
  normalizeMode,
  resolveCustomerRuntimeContext,
  shouldExposeCustomerDirectory,
};
