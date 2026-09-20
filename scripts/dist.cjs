#!/usr/bin/env node
/**
 * scripts/dist.cjs
 *
 * Liest channel.json im Repo-Root:
 *   { "channel": "DEV" }    -> DEV Build (separate appId, Name, Artefakte + DEV Badge)
 *   { "channel": "STABLE" } -> Stable Build (keine -DEV-Erweiterung, kein Badge)
 *
 * WICHTIG:
 * - Kein ${target} Macro (electron-builder kennt das nicht).
 * - DEV/Stable wird über extraMetadata.buildChannel in die gepackte package.json eingebrannt.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const DEVELOPMENT_BUILD_FLAVOR = "development-diagnostic";
const DEVELOPMENT_LICENSE_PROVIDER_ID = "bbm-internal-development-license-v1";
const DEVELOPMENT_PROVIDER_SOURCE = "dev/internal/developmentLicenseProvider.cjs";

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (_e) {
    return null;
  }
}

function writeJsonAtomic(p, data) {
  const dir = path.dirname(p);
  const tmp = path.join(dir, `.tmp-${path.basename(p)}-${process.pid}-${Date.now()}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, p);
}

function normalizeChannel(v) {
  const s = String(v || "").trim().toUpperCase();
  return s === "DEV" ? "DEV" : "STABLE";
}

function findRepoRoot(start) {
  let cur = path.resolve(start || process.cwd());
  const root = path.parse(cur).root;
  while (true) {
    const pkg = path.join(cur, "package.json");
    if (fs.existsSync(pkg)) return cur;
    if (cur === root) break;
    cur = path.dirname(cur);
  }
  return null;
}

function sanitizeCustomerSlug(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "customer";
}

function buildCustomerProfileId(value) {
  const stableKey = String(value || "").trim().normalize("NFKC").toLowerCase();
  if (!stableKey) {
    const error = new Error("BBM_CUSTOMER_PROFILE_KEY is required for customer builds.");
    error.code = "CUSTOMER_PROFILE_KEY_REQUIRED";
    throw error;
  }
  return `c-${crypto.createHash("sha256").update(stableKey, "utf8").digest("hex").slice(0, 24)}`;
}

function buildMachineSetupMetaFromEnv(env = {}) {
  return {
    schemaVersion: 1,
    setupType: "machine",
    product: "bbm-protokoll",
    expectedBinding: "machine",
    customerSlug: sanitizeCustomerSlug(env.BBM_CUSTOMER_SLUG || env.BBM_CUSTOMER_NAME || ""),
    customerName: String(env.BBM_CUSTOMER_NAME || "").trim(),
    customerNumber: String(env.BBM_CUSTOMER_NUMBER || "").trim(),
    licenseId: String(env.BBM_LICENSE_ID || "").trim(),
    createdAt: new Date().toISOString(),
  };
}

function buildCustomerDistConfig({
  baseBuild = {},
  baseVersion = "0.0.0",
  customerLicenseFile = "",
  customerSetupFile = "",
  customerSlug = "",
  customerSetupType = "",
  customerOutputDir = "",
  customerProfileKey = "",
} = {}) {
  const setupType = String(customerSetupType || "").trim().toLowerCase();
  const isCustomerMode = Boolean(customerLicenseFile) || setupType === "machine";
  if (!isCustomerMode) {
    return {
      build: { ...baseBuild },
      outputDir: String(baseBuild?.directories?.output || "").trim() || "dist",
      artifactName: null,
    };
  }

  const customerProfileId = buildCustomerProfileId(customerProfileKey);
  const safeSlug = sanitizeCustomerSlug(customerSlug);
  const outputDir = String(customerOutputDir || "").trim() || path.join("dist", "customers", safeSlug);
  const artifactName = `BBM-${baseVersion}-${safeSlug}-Setup.exe`;
  const customerAsar = baseBuild.asar === false
    ? false
    : { ...(baseBuild.asar && typeof baseBuild.asar === "object" ? baseBuild.asar : {}), smartUnpack: false };
  const extraResources = (Array.isArray(baseBuild.extraResources) ? baseBuild.extraResources : []).filter((entry) =>
    entry?.to !== "ui-editor" &&
    !String(entry?.to || "").startsWith("license/") &&
    !String(entry?.to || "").startsWith("internal-development-license/")
  );
  if (customerLicenseFile) {
    extraResources.push({
      from: customerLicenseFile,
      to: "license/customer.bbmlic",
    });
  }
  if (setupType === "machine" && customerSetupFile) {
    extraResources.push({
      from: customerSetupFile,
      to: "license/customer-setup.json",
    });
  }

  return {
    build: {
      ...baseBuild,
      asar: customerAsar,
      npmRebuild: false,
      buildDependenciesFromSource: false,
      directories: {
        ...(baseBuild.directories || {}),
        output: outputDir,
      },
      extraResources,
      nsis: {
        ...(baseBuild.nsis || {}),
        include: "scripts/customer-installer.nsh",
        artifactName,
        deleteAppDataOnUninstall: false,
      },
      extraMetadata: {
        ...(baseBuild.extraMetadata || {}),
        name: `bbm-customer-${customerProfileId}`,
        distributionId: "customer",
        customerProfileId,
      },
    },
    outputDir,
    artifactName,
    customerProfileId,
    appId: `de.bbm.baubesprechungsmanager.customer.${customerProfileId}`,
  };
}

function applyBuildFlavor({ build = {}, channel = "STABLE", diagnostic = false } = {}) {
  const isDev = normalizeChannel(channel) === "DEV";
  const extraMetadata = { ...(build.extraMetadata || {}), buildChannel: isDev ? "DEV" : "STABLE" };
  delete extraMetadata.developmentLicenseProvider;
  extraMetadata.buildFlavor = isDev ? DEVELOPMENT_BUILD_FLAVOR : "release";
  if (isDev) extraMetadata.developmentLicenseProvider = DEVELOPMENT_LICENSE_PROVIDER_ID;

  const extraResources = (Array.isArray(build.extraResources) ? build.extraResources : []).filter((entry) =>
    entry?.to !== "internal-development-license/provider.cjs" && entry?.from !== DEVELOPMENT_PROVIDER_SOURCE
  );
  if (isDev) {
    extraResources.push({
      from: DEVELOPMENT_PROVIDER_SOURCE,
      to: "internal-development-license/provider.cjs",
    });
  }

  return {
    ...build,
    directories: diagnostic
      ? { ...(build.directories || {}), output: path.join("dist", "diagnostic") }
      : { ...(build.directories || {}) },
    extraMetadata,
    extraResources,
  };
}

function parseCliArgs(argv = []) {
  return Object.freeze({
    diagnostic: argv.includes("--diagnostic"),
    dirOnly: argv.includes("--dir"),
    protokoll: argv.includes("--protokoll"),
  });
}

function runDist({ cwd = process.cwd(), env = process.env, diagnostic = false, dirOnly = false, protokoll = false } = {}) {
  const repoRoot = findRepoRoot(cwd);
  if (!repoRoot) {
    console.error("[dist] Fehler: package.json nicht gefunden (Repo-Root).");
    return Promise.resolve(1);
  }

  const pkgPath = path.join(repoRoot, "package.json");
  const pkg = readJsonSafe(pkgPath);
  if (!pkg) {
    console.error("[dist] Fehler: package.json konnte nicht gelesen werden.");
    return Promise.resolve(1);
  }

  const baseBuild = pkg.build || {};
  const baseVersion = String(pkg.version || "").trim() || "0.0.0";

  // channel.json
  const channelPath = path.join(repoRoot, "channel.json");
  const channelJson = readJsonSafe(channelPath) || { channel: "DEV" };
  const channel = diagnostic ? "DEV" : normalizeChannel(channelJson.channel);
  const isDev = channel === "DEV";
  if (protokoll && (diagnostic || isDev || String(env.BBM_CUSTOMER_LICENSE_FILE || "").trim() || String(env.BBM_CUSTOMER_SETUP_TYPE || "").trim())) {
    console.error("[dist] Protokoll-Abnahme requires STABLE and no bundled customer license/setup metadata.");
    return Promise.resolve(1);
  }

  // Stable Defaults (aus package.json build/appId + productName)
  const stableAppId = String(baseBuild.appId || "").trim() || "de.bbm.protokoll";
  const stableProductName = String(baseBuild.productName || "").trim() || "BBM";

  // Derived DEV
  const devAppId = stableAppId.toLowerCase().endsWith(".dev") ? stableAppId : `${stableAppId}.dev`;
  const devProductName = /\(dev\)/i.test(stableProductName) ? stableProductName : `${stableProductName} (DEV)`;

  const appId = isDev ? devAppId : stableAppId;
  const productName = isDev ? devProductName : stableProductName;

  const prefix = isDev ? "BBM-DEV" : "BBM";
  const nsisName = `${prefix}-${baseVersion}-Setup.\${ext}`;
  const customerLicenseFile = String(env.BBM_CUSTOMER_LICENSE_FILE || "").trim();
  const customerSetupType = String(env.BBM_CUSTOMER_SETUP_TYPE || "").trim();
  const customerSlug = sanitizeCustomerSlug(env.BBM_CUSTOMER_SLUG || env.BBM_CUSTOMER_NAME || "");
  const customerName = String(env.BBM_CUSTOMER_NAME || "").trim();
  const customerProfileKey = String(env.BBM_CUSTOMER_PROFILE_KEY || "").trim();
  const isCustomerMode = Boolean(customerLicenseFile) || String(customerSetupType).trim().toLowerCase() === "machine";
  if (isCustomerMode && channel !== "STABLE") {
    console.error("[dist] Customer builds require the STABLE channel.");
    return Promise.resolve(1);
  }
  const customerSetupMetaFile =
    String(customerSetupType || "").trim().toLowerCase() === "machine"
      ? path.join(repoRoot, "dist", `customer-setup-${Date.now()}.json`)
      : "";
  if (customerSetupMetaFile) {
    writeJsonAtomic(customerSetupMetaFile, buildMachineSetupMetaFromEnv(env));
  }
  const customerConfig = buildCustomerDistConfig({
    baseBuild,
    baseVersion,
    customerLicenseFile,
    customerSetupFile: customerSetupMetaFile,
    customerSlug,
    customerSetupType,
    customerOutputDir: String(env.BBM_CUSTOMER_OUTPUT_DIR || "").trim(),
    customerProfileKey,
  });

  // Override-Config für electron-builder (als separate Config-Datei)
  const flavoredBuild = applyBuildFlavor({ build: customerConfig.build, channel, diagnostic });
  let override = {
    ...flavoredBuild,
    appId: customerConfig.appId || appId,
    productName,
    // ✅ pro Target eigene artifactName (kein ${target})
    nsis: customerConfig.artifactName
      ? { ...(customerConfig.build.nsis || {}) }
      : {
          ...(baseBuild.nsis || {}),
          artifactName: nsisName,
        },
  };
  if (protokoll) {
    override = require("./protokollDist.cjs").prepareProtokollBuild({ repoRoot, baseBuild: override, baseVersion, env });
  }

  const tmpConfigPath = path.join(repoRoot, "dist", `builder-config-${Date.now()}.json`);
  writeJsonAtomic(tmpConfigPath, override);

  console.log("======================================");
  console.log(" BBM DIST");
  console.log(" Kanal:   ", channel);
  console.log(" Version: ", baseVersion);
  console.log(" appId:   ", override.appId);
  console.log(" Name:    ", override.productName);
  console.log(" Flavor:  ", override.extraMetadata.buildFlavor);
  console.log(" Ausgabe: ", override.directories?.output || "dist");
  console.log(" NSIS:    ", override.nsis.artifactName);
  if (customerConfig.artifactName) {
    console.log(" Kundenmodus: aktiv");
    console.log(" Setup-Typ:   ", customerSetupType || (customerLicenseFile ? "test" : "customer"));
    console.log(" Lizenzdatei: ", customerLicenseFile || "-");
    console.log(" Kundenprofil:", customerConfig.customerProfileId);
    console.log(" Ausgabe:     ", customerConfig.outputDir);
  }
  console.log("======================================");

  const cliJs = path.join(repoRoot, "node_modules", "electron-builder", "out", "cli", "cli.js");
  if (!fs.existsSync(cliJs)) {
    console.error("ELECTRON_BUILDER_NOT_FOUND");
    console.error("[dist] Fehler: electron-builder CLI nicht gefunden:", cliJs);
    try {
      fs.unlinkSync(tmpConfigPath);
    } catch (_e) {}
    if (customerSetupMetaFile) {
      try {
        fs.unlinkSync(customerSetupMetaFile);
      } catch (_e) {}
    }
    return Promise.resolve(1);
  }

  console.log("[dist] Starte electron-builder...");
  console.log("[dist] node", cliJs);

  return new Promise((resolve) => {
    const childArgs = [cliJs, "--config", tmpConfigPath];
    if (dirOnly) childArgs.push("--dir");
    if (protokoll) childArgs.push("--win", "--x64", "--publish", "never");
    const child = spawn(process.execPath, childArgs, {
      cwd: repoRoot,
      stdio: "inherit",
      windowsHide: true,
    });

    child.on("error", (err) => {
      console.error("CUSTOMER_SETUP_BUILD_FAILED");
      console.error("[dist] Spawn-Fehler:", err?.message || err);
      try {
        fs.unlinkSync(tmpConfigPath);
      } catch (_e) {}
      if (customerSetupMetaFile) {
        try {
          fs.unlinkSync(customerSetupMetaFile);
        } catch (_e) {}
      }
      resolve(1);
    });

    child.on("close", (code) => {
      console.log("[dist] Exitcode:", code);
      try {
        fs.unlinkSync(tmpConfigPath);
      } catch (_e) {}
      if (customerSetupMetaFile) {
        try {
          fs.unlinkSync(customerSetupMetaFile);
        } catch (_e) {}
      }
      resolve(code || 0);
    });
  });
}

async function main() {
  const code = await runDist(parseCliArgs(process.argv.slice(2)));
  process.exit(code || 0);
}

if (require.main === module) {
  main();
}

module.exports = {
  sanitizeCustomerSlug,
  buildCustomerProfileId,
  buildMachineSetupMetaFromEnv,
  buildCustomerDistConfig,
  applyBuildFlavor,
  parseCliArgs,
  runDist,
};
