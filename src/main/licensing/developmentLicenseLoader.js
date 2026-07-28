const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const {
  DEVELOPMENT_LICENSE_PROVIDER_ID,
  resolveBuildIdentity,
  isDevelopmentLicenseBuild,
} = require("../buildIdentity");

const DEVELOPMENT_LICENSE_LABEL = "Entwicklungsversion – Testlizenz";

function resolveDevelopmentProviderPath({ electronApp = app, pathImpl = path, resourcesPath = process.resourcesPath } = {}) {
  if (!electronApp?.isPackaged) {
    if (typeof electronApp?.getAppPath !== "function") return "";
    return pathImpl.join(electronApp.getAppPath(), "dev", "internal", "developmentLicenseProvider.cjs");
  }
  return pathImpl.join(resourcesPath || "", "internal-development-license", "provider.cjs");
}

function loadDevelopmentLicenseStatus({
  electronApp = app,
  fsImpl = fs,
  pathImpl = path,
  resourcesPath = process.resourcesPath,
  requireImpl = require,
} = {}) {
  const identity = resolveBuildIdentity({ electronApp, fsImpl, pathImpl });
  if (!isDevelopmentLicenseBuild(identity)) return null;

  const providerPath = resolveDevelopmentProviderPath({ electronApp, pathImpl, resourcesPath });
  if (!providerPath || !fsImpl.existsSync(providerPath)) return null;

  try {
    const provider = requireImpl(providerPath);
    if (provider?.PROVIDER_ID !== DEVELOPMENT_LICENSE_PROVIDER_ID ||
        typeof provider?.createDevelopmentLicenseStatus !== "function") return null;
    const status = provider.createDevelopmentLicenseStatus({
      appVersion: String(electronApp?.getVersion?.() || "").trim(),
      displayLabel: DEVELOPMENT_LICENSE_LABEL,
    });
    if (status?.valid !== true || status?.developmentLicense !== true) return null;
    return Object.freeze({ ...status, buildIdentity: identity });
  } catch (_error) {
    return null;
  }
}

module.exports = Object.freeze({
  DEVELOPMENT_LICENSE_LABEL,
  resolveDevelopmentProviderPath,
  loadDevelopmentLicenseStatus,
});
