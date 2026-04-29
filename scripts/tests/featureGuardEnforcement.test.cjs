const assert = require("node:assert/strict");
const path = require("node:path");

function loadFeatureGuardWithStatus(status, { packaged = true, unlockAudio = "false" } = {}) {
  const fgPath = path.join(process.cwd(), "src/main/licensing/featureGuard.js");
  const lsPath = path.join(process.cwd(), "src/main/licensing/licenseService.js");
  const lstorePath = path.join(process.cwd(), "src/main/licensing/licenseStorage.js");
  const lverifyPath = path.join(process.cwd(), "src/main/licensing/licenseVerifier.js");
  const electronPath = require.resolve("electron");

  delete require.cache[fgPath];
  delete require.cache[lsPath];
  delete require.cache[lstorePath];
  delete require.cache[lverifyPath];
  delete require.cache[electronPath];

  const oldUnlock = process.env.BBM_DEV_UNLOCK_AUDIO;
  process.env.BBM_DEV_UNLOCK_AUDIO = unlockAudio;

  require.cache[electronPath] = {
    id: electronPath, filename: electronPath, loaded: true,
    exports: { app: { isPackaged: packaged, getVersion: () => "test" } },
  };
  require.cache[lstorePath] = {
    id: lstorePath, filename: lstorePath, loaded: true,
    exports: { loadLicense: () => ({ mocked: true }) },
  };
  require.cache[lverifyPath] = {
    id: lverifyPath, filename: lverifyPath, loaded: true,
    exports: { verifyLicense: () => status },
  };

  const mod = require(fgPath);
  process.env.BBM_DEV_UNLOCK_AUDIO = oldUnlock;
  return mod;
}

async function runFeatureGuardEnforcementTests(run) {
  await run("FeatureGuard: app ohne Lizenz wirft LICENSE_INVALID:NO_LICENSE", () => {
    const g = loadFeatureGuardWithStatus({ valid: false, reason: "NO_LICENSE" });
    assert.throws(() => g.enforceLicensedFeature("app"), /LICENSE_INVALID:NO_LICENSE/);
  });
  await run("FeatureGuard: pdf ohne Lizenz wirft LICENSE_INVALID:NO_LICENSE", () => {
    const g = loadFeatureGuardWithStatus({ valid: false, reason: "NO_LICENSE" });
    assert.throws(() => g.enforceLicensedFeature("pdf"), /LICENSE_INVALID:NO_LICENSE/);
  });
  await run("FeatureGuard: mail ohne Lizenz wirft LICENSE_INVALID:NO_LICENSE", () => {
    const g = loadFeatureGuardWithStatus({ valid: false, reason: "NO_LICENSE" });
    assert.throws(() => g.enforceLicensedFeature("mail"), /LICENSE_INVALID:NO_LICENSE/);
  });
  await run("FeatureGuard: export ohne Lizenz wirft LICENSE_INVALID:NO_LICENSE", () => {
    const g = loadFeatureGuardWithStatus({ valid: false, reason: "NO_LICENSE" });
    assert.throws(() => g.enforceLicensedFeature("export"), /LICENSE_INVALID:NO_LICENSE/);
  });
  await run("FeatureGuard: Standardfeatures mit gueltiger Lizenz erlaubt", () => {
    const g = loadFeatureGuardWithStatus({ valid: true, reason: "OK", license: { features: [] } });
    assert.equal(!!g.enforceLicensedFeature("app"), true);
    assert.equal(!!g.enforceLicensedFeature("pdf"), true);
    assert.equal(!!g.enforceLicensedFeature("mail"), true);
    assert.equal(!!g.enforceLicensedFeature("export"), true);
  });
  await run("FeatureGuard: audio ohne audio-Feature wirft FEATURE_NOT_ALLOWED:audio", () => {
    const g = loadFeatureGuardWithStatus({ valid: true, reason: "OK", license: { features: [] } });
    assert.throws(() => g.enforceLicensedFeature("audio"), /FEATURE_NOT_ALLOWED:audio/);
  });
  await run("FeatureGuard: audio mit audio-Feature ist erlaubt", () => {
    const g = loadFeatureGuardWithStatus({ valid: true, reason: "OK", license: { features: ["audio"] } });
    assert.equal(!!g.enforceLicensedFeature("audio"), true);
  });
}

module.exports = { runFeatureGuardEnforcementTests };
