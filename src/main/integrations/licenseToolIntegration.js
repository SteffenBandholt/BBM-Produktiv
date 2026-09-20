"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const { app } = require("electron");
const { resolveBuildIdentity } = require("../buildIdentity");
const { getDbPaths, initDatabase } = require("../db/database");
const { appSettingsGetManyWithDb, appSettingsSetManyWithDb } = require("../db/appSettingsRepo");
const { getFirmDirectoryService } = require("../domain/firms/FirmDirectoryService");

const SOURCE_ROLE = "development-master";
const CONTRACT_VERSION = 1;
const START_CONTEXT_SWITCH = "--bbm-context=";
const SOURCE_SETTING_KEYS = Object.freeze({
  sourceId: "licenseTool.sourceId",
  sourceRole: "licenseTool.sourceRole",
  contractVersion: "licenseTool.sourceContractVersion",
});

function integrationError(code, message) {
  return Object.assign(new Error(message), { code });
}

function canonicalExistingFile(filePath, { extension = "" } = {}) {
  const raw = String(filePath || "").trim();
  if (!raw || !path.isAbsolute(raw) || !fs.existsSync(raw)) {
    throw integrationError("FILE_NOT_FOUND", "Die konfigurierte Datei wurde nicht gefunden.");
  }
  const canonical = fs.realpathSync.native(raw);
  if (!fs.statSync(canonical).isFile()) {
    throw integrationError("FILE_NOT_FOUND", "Der konfigurierte Pfad ist keine Datei.");
  }
  if (extension && path.extname(canonical).toLowerCase() !== extension.toLowerCase()) {
    throw integrationError("FILE_TYPE_INVALID", `Es muss eine ${extension}-Datei ausgewählt werden.`);
  }
  return canonical;
}

function resolveLicenseToolSource(sourceRoot) {
  const root = path.resolve(
    String(sourceRoot || "").trim() || path.join(__dirname, "..", "..", "..", "..", "license-tool")
  );
  const packagePath = canonicalExistingFile(path.join(root, "package.json"), { extension: ".json" });
  const mainPath = canonicalExistingFile(path.join(root, "main.js"), { extension: ".js" });
  const executableName = process.platform === "win32" ? "electron.exe" : "electron";
  const electronPath = canonicalExistingFile(path.join(root, "node_modules", "electron", "dist", executableName));
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  if (String(packageJson?.name || "").trim() !== "bbm-license-tool") {
    throw integrationError("LICENSE_TOOL_SOURCE_INVALID", "Der gefundene Quellordner ist nicht das interne BBM-Lizenztool.");
  }
  return Object.freeze({ root: fs.realpathSync.native(root), packagePath, mainPath, electronPath });
}

function encodeStartContext(context) {
  return `${START_CONTEXT_SWITCH}${Buffer.from(JSON.stringify(context), "utf8").toString("base64url")}`;
}

function sanitizeLaunchEnvironment(environment = process.env) {
  const result = { ...environment };
  for (const key of Object.keys(result)) {
    if (
      key === "ELECTRON_RUN_AS_NODE" ||
      key.startsWith("BBM_UI_EDITOR_ACCEPTANCE") ||
      key.startsWith("BBM_M80_") ||
      key.startsWith("BBM_RECHNUNG_BUTTON_")
    ) {
      delete result[key];
    }
  }
  return result;
}

function writeSourceSettings(db, patch) {
  const write = db.transaction((payload) => appSettingsSetManyWithDb(db, payload));
  write(patch);
}

function createLicenseToolIntegration({
  electronApp = app,
  distributionPolicy = { id: "full" },
  acceptanceProfile = { enabled: false },
  buildIdentityResolver = resolveBuildIdentity,
  dbPathsProvider = getDbPaths,
  dbProvider = initDatabase,
  settingsGetMany = appSettingsGetManyWithDb,
  settingsSetMany = writeSourceSettings,
  firmDirectory = getFirmDirectoryService(),
  spawnProcess = spawn,
  environment = process.env,
  licenseToolRoot = "",
} = {}) {
  function isAllowed() {
    const identity = buildIdentityResolver({ electronApp });
    return electronApp?.isPackaged === false &&
      identity?.source === "development-source" &&
      distributionPolicy?.id === "full" &&
      acceptanceProfile?.enabled !== true;
  }

  function requireAllowed() {
    if (!isAllowed()) {
      throw integrationError(
        "LICENSE_TOOL_DEV_ONLY",
        "Das Lizenztool kann nur aus dem normalen BBM-Dev-Quellbetrieb gestartet werden."
      );
    }
  }

  function ensureSourceRegistration() {
    requireAllowed();
    const databasePath = canonicalExistingFile(dbPathsProvider().activeDbPath, { extension: ".db" });
    const db = dbProvider();
    const keys = Object.values(SOURCE_SETTING_KEYS);
    const existing = settingsGetMany(db, keys);
    const sourceId = String(existing[SOURCE_SETTING_KEYS.sourceId] || "").trim();
    const sourceRole = String(existing[SOURCE_SETTING_KEYS.sourceRole] || "").trim();
    const contractVersion = String(existing[SOURCE_SETTING_KEYS.contractVersion] || "").trim();

    if (sourceId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sourceId)) {
      throw integrationError("SOURCE_ID_INVALID", "Die vorhandene BBM-Quellen-ID ist ungültig und wurde nicht überschrieben.");
    }
    if (sourceRole && sourceRole !== SOURCE_ROLE) {
      throw integrationError("SOURCE_ROLE_CONFLICT", "Die vorhandene BBM-Quellenrolle wurde nicht überschrieben.");
    }
    if (contractVersion && contractVersion !== String(CONTRACT_VERSION)) {
      throw integrationError("SOURCE_CONTRACT_CONFLICT", "Die vorhandene BBM-Datenquellenversion wurde nicht überschrieben.");
    }

    const patch = {};
    const effectiveSourceId = sourceId || randomUUID();
    if (!sourceId) patch[SOURCE_SETTING_KEYS.sourceId] = effectiveSourceId;
    if (!sourceRole) patch[SOURCE_SETTING_KEYS.sourceRole] = SOURCE_ROLE;
    if (!contractVersion) patch[SOURCE_SETTING_KEYS.contractVersion] = String(CONTRACT_VERSION);
    if (Object.keys(patch).length) settingsSetMany(db, patch);

    return Object.freeze({
      contractVersion: CONTRACT_VERSION,
      databasePath,
      sourceId: effectiveSourceId,
      sourceRole: SOURCE_ROLE,
    });
  }

  function eligibleCustomerId(customerId) {
    const id = String(customerId || "").trim();
    if (!id) return "";
    const customers = firmDirectory.listCustomers();
    return customers.some((customer) => String(customer?.id || "") === id) ? id : "";
  }

  function status() {
    if (!isAllowed()) return { ok: true, allowed: false, sourceReady: false };
    try {
      const source = resolveLicenseToolSource(licenseToolRoot);
      return { ok: true, allowed: true, sourceReady: true, sourcePath: source.root };
    } catch (error) {
      return {
        ok: true,
        allowed: true,
        sourceReady: false,
        code: error?.code || "LICENSE_TOOL_SOURCE_MISSING",
        message: "Der Lizenztool-Quellstand ist nicht startbereit. Bitte im Ordner C:\\01_Projekte\\license-tool einmal npm install ausführen.",
      };
    }
  }

  async function launch({ customerId = "" } = {}) {
    requireAllowed();
    const toolSource = resolveLicenseToolSource(licenseToolRoot);
    const source = ensureSourceRegistration();
    const context = Object.freeze({ ...source, customerId: eligibleCustomerId(customerId) });
    const argument = encodeStartContext(context);

    return await new Promise((resolve, reject) => {
      const child = spawnProcess(toolSource.electronPath, [toolSource.root, argument], {
        cwd: toolSource.root,
        shell: false,
        detached: true,
        windowsHide: false,
        stdio: "ignore",
        env: {
          ...sanitizeLaunchEnvironment(environment),
          BBM_LICENSE_TOOL_BBM_ROOT: path.resolve(__dirname, "..", "..", ".."),
        },
      });
      const onError = (error) => reject(integrationError("LICENSE_TOOL_START_FAILED", error?.message || String(error)));
      child.once("error", onError);
      child.once("spawn", () => {
        child.removeListener("error", onError);
        child.unref();
        resolve({ ok: true, customerId: context.customerId, sourcePath: toolSource.root });
      });
    });
  }

  return Object.freeze({ status, ensureSourceRegistration, launch, isAllowed });
}

module.exports = {
  SOURCE_ROLE,
  CONTRACT_VERSION,
  START_CONTEXT_SWITCH,
  SOURCE_SETTING_KEYS,
  canonicalExistingFile,
  resolveLicenseToolSource,
  encodeStartContext,
  sanitizeLaunchEnvironment,
  createLicenseToolIntegration,
};
