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
const { spawn } = require("child_process");

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

  const safeSlug = sanitizeCustomerSlug(customerSlug);
  const outputDir = path.join("dist", "customers", safeSlug);
  const artifactName = `BBM-${baseVersion}-${safeSlug}-Setup.exe`;
  const extraResources = Array.isArray(baseBuild.extraResources) ? [...baseBuild.extraResources] : [];
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
      npmRebuild: false,
      buildDependenciesFromSource: false,
      directories: {
        ...(baseBuild.directories || {}),
        output: outputDir,
      },
      extraResources,
      nsis: {
        ...(baseBuild.nsis || {}),
        artifactName,
      },
    },
    outputDir,
    artifactName,
  };
}

function runDist({ cwd = process.cwd(), env = process.env } = {}) {
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
  const channel = normalizeChannel(channelJson.channel);
  const isDev = channel === "DEV";

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
  });

  // Override-Config für electron-builder (als separate Config-Datei)
  const override = {
    ...customerConfig.build,
    appId,
    productName,
    extraMetadata: {
      ...(baseBuild.extraMetadata || {}),
      // ✅ wird in die gepackte package.json geschrieben
      buildChannel: channel,
    },
    // ✅ pro Target eigene artifactName (kein ${target})
    nsis: customerConfig.artifactName
      ? { ...(customerConfig.build.nsis || {}) }
      : {
          ...(baseBuild.nsis || {}),
          artifactName: nsisName,
        },
  };

  const tmpConfigPath = path.join(repoRoot, "dist", `builder-config-${Date.now()}.json`);
  writeJsonAtomic(tmpConfigPath, override);

  console.log("======================================");
  console.log(" BBM DIST");
  console.log(" Kanal:   ", channel);
  console.log(" Version: ", baseVersion);
  console.log(" appId:   ", appId);
  console.log(" Name:    ", productName);
  console.log(" NSIS:    ", customerConfig.artifactName || nsisName);
  if (customerConfig.artifactName) {
    console.log(" Kundenmodus: aktiv");
    console.log(" Setup-Typ:   ", customerSetupType || (customerLicenseFile ? "test" : "customer"));
    console.log(" Lizenzdatei: ", customerLicenseFile || "-");
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
    const child = spawn(process.execPath, [cliJs, "--config", tmpConfigPath], {
      cwd: repoRoot,
      stdio: "inherit",
      windowsHide: false,
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
  const code = await runDist();
  process.exit(code || 0);
}

if (require.main === module) {
  main();
}

module.exports = {
  sanitizeCustomerSlug,
  buildMachineSetupMetaFromEnv,
  buildCustomerDistConfig,
  runDist,
};
