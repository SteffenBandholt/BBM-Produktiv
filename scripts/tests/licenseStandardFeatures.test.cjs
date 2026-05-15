const assert = require("node:assert/strict");
const path = require("node:path");

function loadLicenseServiceWithStatus(status) {
  const servicePath = path.join(process.cwd(), "src/main/licensing/licenseService.js");
  const storagePath = path.join(process.cwd(), "src/main/licensing/licenseStorage.js");
  const verifierPath = path.join(process.cwd(), "src/main/licensing/licenseVerifier.js");

  delete require.cache[servicePath];
  delete require.cache[storagePath];
  delete require.cache[verifierPath];

  require.cache[storagePath] = {
    id: storagePath,
    filename: storagePath,
    loaded: true,
    exports: {
      loadLicense: () => ({ mocked: true }),
    },
  };

  require.cache[verifierPath] = {
    id: verifierPath,
    filename: verifierPath,
    loaded: true,
    exports: {
      verifyLicense: () => status,
    },
  };

  return require(servicePath);
}

async function runLicenseStandardFeaturesTests(run) {
  await run("Lizenzmodell: APP ohne gueltige Lizenz wirft LICENSE_INVALID", () => {
    const svc = loadLicenseServiceWithStatus({ valid: false, reason: "NO_LICENSE" });
    assert.throws(() => svc.requireFeature("app"), /LICENSE_INVALID:NO_LICENSE/);
  });

  await run("Lizenzmodell: PDF ohne gueltige Lizenz wirft LICENSE_INVALID", () => {
    const svc = loadLicenseServiceWithStatus({ valid: false, reason: "NO_LICENSE" });
    assert.throws(() => svc.requireFeature("pdf"), /LICENSE_INVALID:NO_LICENSE/);
  });

  await run("Lizenzmodell: MAIL ohne gueltige Lizenz wirft LICENSE_INVALID", () => {
    const svc = loadLicenseServiceWithStatus({ valid: false, reason: "NO_LICENSE" });
    assert.throws(() => svc.requireFeature("mail"), /LICENSE_INVALID:NO_LICENSE/);
  });

  await run("Lizenzmodell: EXPORT ohne gueltige Lizenz wirft LICENSE_INVALID", () => {
    const svc = loadLicenseServiceWithStatus({ valid: false, reason: "NO_LICENSE" });
    assert.throws(() => svc.requireFeature("export"), /LICENSE_INVALID:NO_LICENSE/);
  });

  await run("Lizenzmodell: APP/PDF/MAIL/EXPORT bleiben als Alias auf Modul Protokoll erlaubt", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { modules: ["protokoll"], features: [] },
    });
    assert.equal(svc.requireFeature("app"), true);
    assert.equal(svc.requireFeature("pdf"), true);
    assert.equal(svc.requireFeature("mail"), true);
    assert.equal(svc.requireFeature("export"), true);
  });

  await run("Lizenzmodell: AUDIO ohne audio-Feature wirft FEATURE_NOT_ALLOWED:diktat", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { modules: ["protokoll"], features: [] },
    });
    assert.throws(() => svc.requireFeature("audio"), /FEATURE_NOT_ALLOWED:diktat/);
  });

  await run("Lizenzmodell: AUDIO mit audio-Feature ist erlaubt", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { modules: ["protokoll"], features: ["diktat"] },
    });
    assert.equal(svc.requireFeature("audio"), true);
  });

  await run("Lizenzmodell: diktat ohne Modul protokoll bleibt gesperrt", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { modules: [], features: ["diktat"] },
    });
    assert.throws(() => svc.requireFeature("diktat"), /FEATURE_NOT_ALLOWED:diktat/);
  });

  await run("Lizenzmodell: leere Module/Funktionen sind gueltig, aber protokoll gesperrt", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { modules: [], features: [] },
    });
    assert.throws(() => svc.requireFeature("protokoll"), /FEATURE_NOT_ALLOWED:protokoll/);
  });

  await run("Lizenzmodell: Legacy ohne modules-Feld erkennt protokoll ueber features", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { features: ["protokoll"] },
    });
    assert.equal(svc.requireFeature("protokoll"), true);
  });
}

module.exports = { runLicenseStandardFeaturesTests };
