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

function getBundledCustomerSetupPath() {
  const packagedResources = process.resourcesPath || path.join(app.getAppPath(), "resources");
  const resourcesPath = app?.isPackaged ? packagedResources : path.join(app.getAppPath(), "resources");
  return path.join(resourcesPath, "license", "customer-setup.json");
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

function loadCustomerSetup() {
  try {
    const filePath = getBundledCustomerSetupPath();
    if (!fs.existsSync(filePath)) return null;
    const parsed = _readJsonSafe(filePath);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const setupType = String(parsed.setupType || parsed.setup_type || "").trim().toLowerCase();
    return {
      schemaVersion: Number(parsed.schemaVersion) || 1,
      setupType: setupType === "machine" ? "machine" : "test",
      customerSlug: String(parsed.customerSlug || parsed.customer_slug || "").trim(),
      customerName: String(parsed.customerName || parsed.customer_name || "").trim(),
      createdAt: String(parsed.createdAt || "").trim(),
    };
  } catch (err) {
    console.error("[licenseStorage] loadCustomerSetup failed:", err?.message || err);
    return null;
  }
}

function saveLicense(licensePayload) {
  const filePath = getLicenseFilePath();
  const machineId = getMachineId();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const existing = fs.existsSync(filePath) ? _readJsonSafe(filePath) || {} : {};
  const previousTrialStartedAt = String(existing?.trialStartedAt || "").trim();
  const previousInstalledAt = String(existing?.installedAt || "").trim();
  const binding = String(licensePayload?.license?.binding || "").trim().toLowerCase() || "none";
  const edition = String(licensePayload?.license?.edition || "").trim().toLowerCase();
  const trialStartIso =
    previousTrialStartedAt ||
    String(licensePayload?.trialStartedAt || "").trim() ||
    String(licensePayload?.installedAt || "").trim() ||
    previousInstalledAt ||
    new Date().toISOString();

  const stored = {
    ...licensePayload,
    machineId,
    installedAt: previousInstalledAt || String(licensePayload?.installedAt || "").trim() || new Date().toISOString(),
    ...(edition === "test" && binding === "none" ? { trialStartedAt: trialStartIso } : {}),
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
  getBundledCustomerSetupPath,
  loadCustomerSetup,
};
