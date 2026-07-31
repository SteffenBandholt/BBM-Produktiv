#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const {
  ACCEPTANCE_SWITCH,
  ACCEPTANCE_PROFILE_PREFIX,
  ACCEPTANCE_MARKER_FILE,
  ACCEPTANCE_PURPOSE,
  DEVELOPMENT_BUILD_CHANNEL,
  DEVELOPMENT_BUILD_FLAVOR,
  DEVELOPMENT_LICENSE_PROVIDER_ID,
  isPathInside,
} = require("../src/main/startup/uiEditorAcceptanceProfile");

const REMOVED_ENV_KEYS = Object.freeze([
  "ELECTRON_RUN_AS_NODE",
  "BBM_DEVELOPMENT_LICENSE",
  "BBM_BUILD_CHANNEL",
  "BBM_BUILD_FLAVOR",
  "BBM_CUSTOMER_LICENSE_FILE",
  "BBM_CUSTOMER_SETUP_TYPE",
  "BBM_DEV_UNLOCK_AUDIO",
  "BBM_DEV_ENABLE_AUDIO_SUGGESTIONS",
  "BBM_WHISPER_SERVER_HOST",
  "BBM_WHISPER_SERVER_PORT",
]);

function createSanitizedEnvironment(source = process.env) {
  const result = { ...source };
  for (const key of REMOVED_ENV_KEYS) delete result[key];
  return result;
}

function createAcceptanceProfile({ fsImpl = fs, osImpl = os, pathImpl = path } = {}) {
  const rootPath = fsImpl.mkdtempSync(pathImpl.join(osImpl.tmpdir(), ACCEPTANCE_PROFILE_PREFIX));
  const userDataPath = pathImpl.join(rootPath, "userData");
  const sessionDataPath = pathImpl.join(rootPath, "sessionData");
  fsImpl.mkdirSync(userDataPath, { recursive: true });
  fsImpl.mkdirSync(sessionDataPath, { recursive: true });
  const marker = {
    schemaVersion: 1,
    purpose: ACCEPTANCE_PURPOSE,
    buildChannel: DEVELOPMENT_BUILD_CHANNEL,
    buildFlavor: DEVELOPMENT_BUILD_FLAVOR,
    developmentLicenseProvider: DEVELOPMENT_LICENSE_PROVIDER_ID,
    createdAt: new Date().toISOString(),
    nonce: crypto.randomUUID(),
  };
  fsImpl.writeFileSync(
    pathImpl.join(rootPath, ACCEPTANCE_MARKER_FILE),
    `${JSON.stringify(marker, null, 2)}\n`,
    "utf8"
  );
  return Object.freeze({ rootPath, userDataPath, sessionDataPath, marker });
}

function buildElectronArguments({ repoRoot, profileRoot }) {
  return Object.freeze([
    repoRoot,
    `${ACCEPTANCE_SWITCH}${profileRoot}`,
    "--bbm-electron-editor-diagnostic",
  ]);
}

function hashFileOrMissing(filePath, { fsImpl = fs } = {}) {
  if (!fsImpl.existsSync(filePath)) return "MISSING";
  return crypto.createHash("sha256").update(fsImpl.readFileSync(filePath)).digest("hex").toUpperCase();
}

function runElectronOnce({ electronExecutable, args, cwd, env, spawnImpl = spawn }) {
  return new Promise((resolve, reject) => {
    const child = spawnImpl(electronExecutable, args, {
      cwd,
      env,
      stdio: "inherit",
      windowsHide: false,
    });
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code: Number(code ?? 1), signal: signal || "" }));
  });
}

function removeAcceptanceProfile(profileRoot, { fsImpl = fs, osImpl = os, pathImpl = path } = {}) {
  const tempRoot = pathImpl.resolve(osImpl.tmpdir());
  const resolvedRoot = pathImpl.resolve(profileRoot);
  if (!isPathInside(tempRoot, resolvedRoot, pathImpl) ||
      !pathImpl.basename(resolvedRoot).startsWith(ACCEPTANCE_PROFILE_PREFIX)) {
    throw new Error("UI_EDITOR_ACCEPTANCE_CLEANUP_REFUSED");
  }
  fsImpl.rmSync(resolvedRoot, { recursive: true, force: true });
}

async function runAcceptance({ runs = 2 } = {}) {
  if (runs !== 2) throw new Error("UI_EDITOR_ACCEPTANCE_REQUIRES_TWO_RUNS");
  const repoRoot = path.resolve(__dirname, "..");
  const profile = createAcceptanceProfile();
  const dbPath = path.join(profile.userDataPath, "app.db");
  const electronExecutable = require("electron");
  const args = buildElectronArguments({ repoRoot, profileRoot: profile.rootPath });
  const env = createSanitizedEnvironment();
  let exitCode = 0;

  console.log(`[ui-editor-acceptance] isolated root: ${profile.rootPath}`);
  console.log(`[ui-editor-acceptance] identity: ${DEVELOPMENT_BUILD_CHANNEL} / ${DEVELOPMENT_BUILD_FLAVOR}`);
  console.log(`[ui-editor-acceptance] license provider: ${DEVELOPMENT_LICENSE_PROVIDER_ID}`);
  console.log("[ui-editor-acceptance] two runs use the same isolated profile for restart/restore.");

  try {
    for (let index = 0; index < runs; index += 1) {
      console.log(`[ui-editor-acceptance] starting run ${index + 1}/${runs}`);
      const result = await runElectronOnce({ electronExecutable, args, cwd: repoRoot, env });
      console.log(`[ui-editor-acceptance] run ${index + 1}/${runs} exit=${result.code} dbSha256=${hashFileOrMissing(dbPath)}`);
      if (result.code !== 0) {
        exitCode = result.code || 1;
        break;
      }
    }
    return exitCode;
  } finally {
    removeAcceptanceProfile(profile.rootPath);
    console.log(`[ui-editor-acceptance] isolated root removed: ${profile.rootPath}`);
  }
}

async function main() {
  try {
    process.exitCode = await runAcceptance();
  } catch (error) {
    console.error("[ui-editor-acceptance] failed:", error?.stack || error?.message || error);
    process.exitCode = 1;
  }
}

if (require.main === module) void main();

module.exports = Object.freeze({
  REMOVED_ENV_KEYS,
  createSanitizedEnvironment,
  createAcceptanceProfile,
  buildElectronArguments,
  hashFileOrMissing,
  runElectronOnce,
  removeAcceptanceProfile,
  runAcceptance,
});
