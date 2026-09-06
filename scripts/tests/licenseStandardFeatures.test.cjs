const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

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
  await run("Modulvertrag: kanonische IDs, Typen und Lizenzschluessel sind zentral konsistent", () => {
    const moduleRegistry = require(path.join(process.cwd(), "src/main/moduleRegistry.js"));
    const licenseFeatures = require(path.join(process.cwd(), "src/main/licensing/licenseFeatures.js"));

    assert.deepEqual(moduleRegistry.getModuleTypes(), ["global", "project", "hybrid"]);
    assert.deepEqual(moduleRegistry.getCanonicalModuleIds(), [
      "protokoll",
      "restarbeiten",
      "rechnung",
      "sigeko",
    ]);
    assert.deepEqual(moduleRegistry.getCapabilityIds(), [
      "pdf",
      "mail",
      "export",
      "file-storage",
      "audio",
      "ui-editor",
    ]);
    assert.deepEqual(Object.values(licenseFeatures.LICENSE_MODULES), moduleRegistry.getCanonicalModuleIds());
    assert.deepEqual(Object.values(licenseFeatures.LICENSE_CAPABILITIES), moduleRegistry.getCapabilityIds());
    assert.equal(moduleRegistry.getModuleLicenseKey("rechnung"), "module:rechnung");
    assert.equal(moduleRegistry.getCapabilityLicenseKey("pdf"), "service:pdf");
    assert.equal(moduleRegistry.isKnownModuleId("sigeko"), true);
    assert.equal(moduleRegistry.isKnownCapabilityId("mail"), true);
  });

  await run("Modulvertrag: installierte Main-Deskriptoren referenzieren nur kanonische Capabilities", () => {
    const moduleRegistry = require(path.join(process.cwd(), "src/main/moduleRegistry.js"));
    for (const moduleId of moduleRegistry.getModuleIds()) {
      const definition = moduleRegistry.getModuleDefinition(moduleId);
      assert.ok(definition);
      assert.ok(moduleRegistry.getModuleTypes().includes(definition.kind));
      assert.equal(definition.licenseKey, `module:${moduleId}`);
      assert.equal(definition.ipcRegistrar, moduleId);
      assert.equal(definition.migrationRegistrar, moduleId);
      assert.ok(Array.isArray(definition.requiredCapabilities));
      definition.requiredCapabilities.forEach((capabilityId) => {
        assert.equal(moduleRegistry.isKnownCapabilityId(capabilityId), true);
      });
    }
  });

  await run("Modulvertrag: Renderer-Deskriptoren entsprechen dem Main-Vertrag", async () => {
    const moduleRegistry = require(path.join(process.cwd(), "src/main/moduleRegistry.js"));
    const protokoll = await importEsmFromFile(path.join(process.cwd(), "src/renderer/modules/protokoll/index.js"));
    const restarbeiten = await importEsmFromFile(path.join(process.cwd(), "src/renderer/modules/restarbeiten/index.js"));
    const rechnung = await importEsmFromFile(path.join(process.cwd(), "src/renderer/modules/rechnungen/index.js"));
    const entries = [
      protokoll.getProtokollModuleEntry(),
      restarbeiten.getRestarbeitenModuleEntry(),
      rechnung.getRechnungModuleEntry(),
    ];

    for (const entry of entries) {
      const definition = moduleRegistry.getModuleDefinition(entry.moduleId);
      assert.ok(definition);
      assert.equal(entry.moduleType, definition.kind);
      assert.equal(entry.licenseKey, definition.licenseKey);
      assert.equal(entry.ipcRegistrar, definition.ipcRegistrar);
      assert.equal(entry.migrationRegistrar, definition.migrationRegistrar);
      assert.deepEqual(entry.requiredCapabilities, definition.requiredCapabilities);
      assert.ok(entry.routes && typeof entry.routes === "object");
      assert.ok(entry.navigation && typeof entry.navigation === "object");
      for (const scope of ["global", "project"]) {
        for (const route of entry.routes[scope]) {
          assert.ok(entry.screens[route.screenId]);
        }
      }
    }
  });

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

  await run("Lizenzmodell: RESTARBEITEN als Modul ist erlaubt", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { modules: ["restarbeiten"], features: [] },
    });
    assert.equal(svc.requireFeature("restarbeiten"), true);
  });

  await run("Lizenzmodell: Protokoll und Restarbeiten sind gemeinsam erlaubt", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { modules: ["protokoll", "restarbeiten"], features: [] },
    });
    assert.equal(svc.requireFeature("protokoll"), true);
    assert.equal(svc.requireFeature("restarbeiten"), true);
  });

  await run("Lizenzmodell: Restarbeiten bleibt ohne Modulfreigabe gesperrt", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { modules: [], features: [] },
    });
    assert.throws(() => svc.requireFeature("restarbeiten"), /FEATURE_NOT_ALLOWED:restarbeiten/);
  });

  await run("Lizenzmodell: Legacy-Features aktivieren nur Protokoll, nicht Restarbeiten", () => {
    const svc = loadLicenseServiceWithStatus({
      valid: true,
      reason: "OK",
      license: { features: ["protokoll"] },
    });
    assert.equal(svc.requireFeature("protokoll"), true);
    assert.throws(() => svc.requireFeature("restarbeiten"), /FEATURE_NOT_ALLOWED:restarbeiten/);
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
