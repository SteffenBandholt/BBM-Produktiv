const fs = require("fs");
const os = require("os");
const path = require("path");

const ACCEPTANCE_SWITCH = "--bbm-ui-editor-acceptance-root=";
const ACCEPTANCE_PROFILE_PREFIX = "bbm-ui-editor-acceptance-";
const ACCEPTANCE_MARKER_FILE = ".bbm-ui-editor-acceptance.json";
const ACCEPTANCE_PURPOSE = "ui-editor-isolated-acceptance";
const DEVELOPMENT_BUILD_CHANNEL = "DEV";
const DEVELOPMENT_BUILD_FLAVOR = "development-diagnostic";
const DEVELOPMENT_LICENSE_PROVIDER_ID = "bbm-internal-development-license-v1";

function isPathInside(parentPath, candidatePath, pathImpl = path) {
  const relative = pathImpl.relative(pathImpl.resolve(parentPath), pathImpl.resolve(candidatePath));
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${pathImpl.sep}`) && !pathImpl.isAbsolute(relative);
}

function readAcceptanceMarker(rootPath, { fsImpl = fs, pathImpl = path } = {}) {
  const markerPath = pathImpl.join(rootPath, ACCEPTANCE_MARKER_FILE);
  const marker = JSON.parse(fsImpl.readFileSync(markerPath, "utf8"));
  const valid = marker?.schemaVersion === 1 &&
    marker?.purpose === ACCEPTANCE_PURPOSE &&
    marker?.buildChannel === DEVELOPMENT_BUILD_CHANNEL &&
    marker?.buildFlavor === DEVELOPMENT_BUILD_FLAVOR &&
    marker?.developmentLicenseProvider === DEVELOPMENT_LICENSE_PROVIDER_ID;
  if (!valid) throw new Error("UI_EDITOR_ACCEPTANCE_MARKER_INVALID");
  return Object.freeze({ ...marker, markerPath });
}

function resolveAcceptanceRoot(argv = process.argv, { osImpl = os, pathImpl = path } = {}) {
  const argument = argv.find((value) => String(value || "").startsWith(ACCEPTANCE_SWITCH));
  if (!argument) return "";
  const rootPath = pathImpl.resolve(String(argument).slice(ACCEPTANCE_SWITCH.length));
  const tempRoot = pathImpl.resolve(osImpl.tmpdir());
  if (!isPathInside(tempRoot, rootPath, pathImpl) ||
      !pathImpl.basename(rootPath).startsWith(ACCEPTANCE_PROFILE_PREFIX)) {
    throw new Error("UI_EDITOR_ACCEPTANCE_ROOT_NOT_ISOLATED");
  }
  return rootPath;
}

function configureUiEditorAcceptanceProfile({
  electronApp,
  argv = process.argv,
  fsImpl = fs,
  osImpl = os,
  pathImpl = path,
} = {}) {
  const rootPath = resolveAcceptanceRoot(argv, { osImpl, pathImpl });
  if (!rootPath) return Object.freeze({ enabled: false });
  if (!electronApp || electronApp.isPackaged) {
    throw new Error("UI_EDITOR_ACCEPTANCE_REQUIRES_SOURCE_BUILD");
  }

  const marker = readAcceptanceMarker(rootPath, { fsImpl, pathImpl });
  const userDataPath = pathImpl.join(rootPath, "userData");
  const sessionDataPath = pathImpl.join(rootPath, "sessionData");
  fsImpl.mkdirSync(userDataPath, { recursive: true });
  fsImpl.mkdirSync(sessionDataPath, { recursive: true });
  electronApp.setPath("userData", userDataPath);
  electronApp.setPath("sessionData", sessionDataPath);

  return Object.freeze({
    enabled: true,
    rootPath,
    userDataPath,
    sessionDataPath,
    marker,
  });
}

module.exports = Object.freeze({
  ACCEPTANCE_SWITCH,
  ACCEPTANCE_PROFILE_PREFIX,
  ACCEPTANCE_MARKER_FILE,
  ACCEPTANCE_PURPOSE,
  DEVELOPMENT_BUILD_CHANNEL,
  DEVELOPMENT_BUILD_FLAVOR,
  DEVELOPMENT_LICENSE_PROVIDER_ID,
  isPathInside,
  readAcceptanceMarker,
  resolveAcceptanceRoot,
  configureUiEditorAcceptanceProfile,
});
