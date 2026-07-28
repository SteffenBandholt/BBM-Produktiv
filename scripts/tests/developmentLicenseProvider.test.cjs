const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = process.cwd();
const PROVIDER_ID = "bbm-internal-development-license-v1";

function clearBuildModules() {
  for (const relative of [
    "src/main/buildIdentity.js",
    "src/main/licensing/developmentLicenseLoader.js",
    "src/main/licensing/licenseService.js",
  ]) {
    delete require.cache[path.join(ROOT, relative)];
  }
}

function makePackagedFixture(metadata, { includeProvider = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-development-license-"));
  const appPath = path.join(root, "app");
  const resourcesPath = path.join(root, "resources");
  fs.mkdirSync(appPath, { recursive: true });
  fs.mkdirSync(resourcesPath, { recursive: true });
  fs.writeFileSync(path.join(appPath, "package.json"), JSON.stringify(metadata), "utf8");
  if (includeProvider) {
    const target = path.join(resourcesPath, "internal-development-license", "provider.cjs");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "dev/internal/developmentLicenseProvider.cjs"), target);
  }
  return { root, appPath, resourcesPath };
}

function loadDevelopmentStatus(fixture, env = {}) {
  clearBuildModules();
  const previous = {};
  for (const [key, value] of Object.entries(env)) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    const loader = require(path.join(ROOT, "src/main/licensing/developmentLicenseLoader.js"));
    return loader.loadDevelopmentLicenseStatus({
      electronApp: {
        isPackaged: true,
        getAppPath: () => fixture.appPath,
        getVersion: () => "1.5.0",
      },
      resourcesPath: fixture.resourcesPath,
    });
  } finally {
    for (const key of Object.keys(env)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

async function runDevelopmentLicenseProviderTests(run) {
  await run("Development-Lizenz: vorhandener DEV-Buildkanal wird als compile-time Flavor erweitert", () => {
    const { applyBuildFlavor } = require(path.join(ROOT, "scripts/dist.cjs"));
    const config = applyBuildFlavor({ build: { extraResources: [] }, channel: "DEV", diagnostic: true });
    assert.equal(config.extraMetadata.buildChannel, "DEV");
    assert.equal(config.extraMetadata.buildFlavor, "development-diagnostic");
    assert.equal(config.extraMetadata.developmentLicenseProvider, PROVIDER_ID);
    assert.equal(config.directories.output, path.join("dist", "diagnostic"));
    assert.equal(config.extraResources.some((entry) => entry.to === "internal-development-license/provider.cjs"), true);
  });

  await run("Development-Lizenz: Release-Konfiguration entfernt Provideraktivierung", () => {
    const { applyBuildFlavor } = require(path.join(ROOT, "scripts/dist.cjs"));
    const config = applyBuildFlavor({
      build: {
        extraMetadata: { developmentLicenseProvider: PROVIDER_ID },
        extraResources: [{ from: "dev/internal/developmentLicenseProvider.cjs", to: "internal-development-license/provider.cjs" }],
      },
      channel: "STABLE",
    });
    assert.equal(config.extraMetadata.buildChannel, "STABLE");
    assert.equal(config.extraMetadata.buildFlavor, "release");
    assert.equal(Object.hasOwn(config.extraMetadata, "developmentLicenseProvider"), false);
    assert.equal(config.extraResources.some((entry) => entry.to === "internal-development-license/provider.cjs"), false);
  });

  await run("Development-Lizenz: paketierter Diagnostic-Build erhaelt gueltigen internen Status", () => {
    const fixture = makePackagedFixture({
      buildChannel: "DEV",
      buildFlavor: "development-diagnostic",
      developmentLicenseProvider: PROVIDER_ID,
    }, { includeProvider: true });
    try {
      const status = loadDevelopmentStatus(fixture);
      assert.equal(status.valid, true);
      assert.equal(status.developmentLicense, true);
      assert.equal(status.displayLabel, "Entwicklungsversion – Testlizenz");
      assert.deepEqual(status.license.modules, ["protokoll", "restarbeiten"]);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  await run("Development-Lizenz: DEV-Metadaten ohne gepackten Provider bleiben gesperrt", () => {
    const fixture = makePackagedFixture({
      buildChannel: "DEV",
      buildFlavor: "development-diagnostic",
      developmentLicenseProvider: PROVIDER_ID,
    });
    try {
      assert.equal(loadDevelopmentStatus(fixture), null);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  await run("Development-Lizenz: Release-Paket bleibt trotz Providerdatei gesperrt", () => {
    const fixture = makePackagedFixture({ buildChannel: "STABLE", buildFlavor: "release" }, { includeProvider: true });
    try {
      assert.equal(loadDevelopmentStatus(fixture), null);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  await run("Development-Lizenz: Umgebungsvariablen aktivieren ein Release-Paket nicht", () => {
    const fixture = makePackagedFixture({ buildChannel: "STABLE", buildFlavor: "release" }, { includeProvider: true });
    try {
      assert.equal(loadDevelopmentStatus(fixture, {
        BBM_DEVELOPMENT_LICENSE: "1",
        BBM_BUILD_CHANNEL: "DEV",
        BBM_BUILD_FLAVOR: "development-diagnostic",
      }), null);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  await run("Development-Lizenz: Release-Status verwendet weiterhin den regulaeren Verifier", () => {
    clearBuildModules();
    const loaderPath = path.join(ROOT, "src/main/licensing/developmentLicenseLoader.js");
    const storagePath = path.join(ROOT, "src/main/licensing/licenseStorage.js");
    const verifierPath = path.join(ROOT, "src/main/licensing/licenseVerifier.js");
    require.cache[loaderPath] = {
      id: loaderPath,
      filename: loaderPath,
      loaded: true,
      exports: { loadDevelopmentLicenseStatus: () => null },
    };
    require.cache[storagePath] = {
      id: storagePath,
      filename: storagePath,
      loaded: true,
      exports: { loadLicense: () => ({ expired: true }) },
    };
    require.cache[verifierPath] = {
      id: verifierPath,
      filename: verifierPath,
      loaded: true,
      exports: { verifyLicense: () => ({ valid: false, reason: "LICENSE_EXPIRED" }) },
    };
    try {
      const service = require(path.join(ROOT, "src/main/licensing/licenseService.js"));
      assert.deepEqual(service.refreshStatus(), { valid: false, reason: "LICENSE_EXPIRED" });
    } finally {
      delete require.cache[loaderPath];
      delete require.cache[storagePath];
      delete require.cache[verifierPath];
      clearBuildModules();
    }
  });

  await run("Development-Lizenz: sichtbare Kennzeichnung und zentraler Print-Buildkanal sind verdrahtet", () => {
    const header = fs.readFileSync(path.join(ROOT, "src/renderer/ui/MainHeader.js"), "utf8");
    const printIpc = fs.readFileSync(path.join(ROOT, "src/main/ipc/printIpc.js"), "utf8");
    assert.match(header, /Entwicklungsversion – Testlizenz/);
    assert.match(header, /root\.append\([^;]*devBadge\)/);
    assert.match(header, /this\._refreshBuildChannelBadge\(\)/);
    assert.match(printIpc, /resolveBuildIdentity\(\{ electronApp: app \}\)\.channel/);
  });
}

module.exports = { runDevelopmentLicenseProviderTests };
