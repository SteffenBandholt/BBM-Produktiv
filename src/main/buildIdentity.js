const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const DEVELOPMENT_BUILD_CHANNEL = "DEV";
const RELEASE_BUILD_CHANNEL = "STABLE";
const DEVELOPMENT_BUILD_FLAVOR = "development-diagnostic";
const RELEASE_BUILD_FLAVOR = "release";
const DEVELOPMENT_LICENSE_PROVIDER_ID = "bbm-internal-development-license-v1";

function normalizeBuildChannel(value) {
  return String(value || "").trim().toUpperCase() === DEVELOPMENT_BUILD_CHANNEL
    ? DEVELOPMENT_BUILD_CHANNEL
    : RELEASE_BUILD_CHANNEL;
}

function readPackagedBuildMetadata({ electronApp = app, fsImpl = fs, pathImpl = path } = {}) {
  try {
    if (!electronApp?.isPackaged || typeof electronApp.getAppPath !== "function") return {};
    const packagePath = pathImpl.join(electronApp.getAppPath(), "package.json");
    const parsed = JSON.parse(fsImpl.readFileSync(packagePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function resolveBuildIdentity(options = {}) {
  const electronApp = options.electronApp || app;
  if (!electronApp?.isPackaged) {
    return Object.freeze({
      channel: DEVELOPMENT_BUILD_CHANNEL,
      flavor: DEVELOPMENT_BUILD_FLAVOR,
      developmentLicenseProvider: DEVELOPMENT_LICENSE_PROVIDER_ID,
      source: "development-source",
    });
  }

  const metadata = readPackagedBuildMetadata({ ...options, electronApp });
  return Object.freeze({
    channel: normalizeBuildChannel(metadata.buildChannel),
    flavor: String(metadata.buildFlavor || RELEASE_BUILD_FLAVOR).trim().toLowerCase(),
    developmentLicenseProvider: String(metadata.developmentLicenseProvider || "").trim(),
    source: "package-metadata",
  });
}

function isDevelopmentLicenseBuild(identity) {
  return identity?.channel === DEVELOPMENT_BUILD_CHANNEL &&
    identity?.flavor === DEVELOPMENT_BUILD_FLAVOR &&
    identity?.developmentLicenseProvider === DEVELOPMENT_LICENSE_PROVIDER_ID;
}

module.exports = Object.freeze({
  DEVELOPMENT_BUILD_CHANNEL,
  RELEASE_BUILD_CHANNEL,
  DEVELOPMENT_BUILD_FLAVOR,
  RELEASE_BUILD_FLAVOR,
  DEVELOPMENT_LICENSE_PROVIDER_ID,
  normalizeBuildChannel,
  readPackagedBuildMetadata,
  resolveBuildIdentity,
  isDevelopmentLicenseBuild,
});
