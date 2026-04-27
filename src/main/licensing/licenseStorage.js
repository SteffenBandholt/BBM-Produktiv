// src/main/licensing/licenseStorage.js

const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { getMachineId } = require("./deviceIdentity");

function getLicenseFilePath() {
  const userData = app.getPath("userData");
  return path.join(userData, "license.json");
}

function getBundledCustomerLicensePath() {
  const packagedResources = process.resourcesPath || path.join(app.getAppPath(), "resources");
  const resourcesPath = app?.isPackaged ? packagedResources : path.join(app.getAppPath(), "resources");
  return path.join(resourcesPath, "license", "customer.bbmlic");
}

function _readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

function loadLicense() {
  try {
    const filePath = getLicenseFilePath();

    if (fs.existsSync(filePath)) {
      return _readJsonSafe(filePath);
    }

    const bundledPath = getBundledCustomerLicensePath();
    if (!fs.existsSync(bundledPath)) {
      return null;
    }

    const bundledLicense = _readJsonSafe(bundledPath);
    if (!bundledLicense) {
      return null;
    }

    try {
      saveLicense(bundledLicense);
    } catch (_err) {
      // fallback only: still return bundled content
    }
    return bundledLicense;
  } catch (err) {
    console.error("[licenseStorage] load failed:", err?.message || err);
    return null;
  }
}

function saveLicense(licensePayload) {
  const filePath = getLicenseFilePath();
  const machineId = getMachineId();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const stored = {
    ...licensePayload,
    machineId,
    installedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    filePath,
    JSON.stringify(stored, null, 2),
    "utf8"
  );

  console.log("[LICENSE] saveLicense", {
    filePath,
    machineId,
    hasLicense: !!stored?.license,
    hasSignature: !!stored?.signature,
  });

  return stored;
}

function deleteLicense() {
  const filePath = getLicenseFilePath();

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return true;
}

module.exports = {
  loadLicense,
  saveLicense,
  deleteLicense,
  getLicenseFilePath,
  getBundledCustomerLicensePath,
};
