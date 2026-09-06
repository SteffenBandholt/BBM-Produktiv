const assert = require("node:assert/strict");
const fs = require("node:fs");
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

  await run("Modulvertrag: gemeinsame Renderer-Deskriptorstruktur validiert Typ, Routen und Screens", async () => {
    const contract = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/app/modules/moduleDescriptorContract.js")
    );
    const TestScreen = class TestScreen {};
    const descriptor = contract.createModuleDescriptor({
      moduleId: "testmodul",
      moduleLabel: "Testmodul",
      moduleType: "hybrid",
      licenseKey: "module:testmodul",
      screens: { work: TestScreen },
      routes: {
        global: [{ screenId: "work" }],
        project: [{ screenId: "work" }],
      },
      navigation: {
        global: [{ key: "test", label: "Test", workScreenId: "work" }],
      },
      ipcRegistrar: "testmodul",
      migrationRegistrar: "testmodul",
      requiredCapabilities: ["pdf", "mail"],
    });

    assert.equal(descriptor.moduleType, "hybrid");
    assert.equal(descriptor.routes.global[0].screenId, "work");
    assert.equal(descriptor.routes.project[0].screenId, "work");
    assert.equal(descriptor.screens.work, TestScreen);
    assert.deepEqual(descriptor.requiredCapabilities, ["pdf", "mail"]);
    assert.throws(
      () => contract.createModuleDescriptor({ ...descriptor, moduleType: "invalid" }),
      /unbekannter moduleType/
    );
    assert.throws(
      () => contract.createModuleDescriptor({
        ...descriptor,
        routes: { global: [{ screenId: "missing" }] },
      }),
      /hat keinen Screen/
    );
  });

  await run("Modulvertrag: vorhandene Fachmodule deklarieren den gemeinsamen Vertrag ohne Runtime-Import", () => {
    const moduleRegistry = require(path.join(process.cwd(), "src/main/moduleRegistry.js"));
    const moduleFiles = {
      protokoll: "src/renderer/modules/protokoll/index.js",
      restarbeiten: "src/renderer/modules/restarbeiten/index.js",
      rechnung: "src/renderer/modules/rechnungen/index.js",
    };

    for (const [moduleId, relativePath] of Object.entries(moduleFiles)) {
      const source = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
      const definition = moduleRegistry.getModuleDefinition(moduleId);
      assert.ok(definition);
      assert.match(source, /createModuleDescriptor/);
      assert.ok(source.includes(`moduleType: "${definition.kind}"`));
      assert.ok(source.includes(`licenseKey: "${definition.licenseKey}"`));
      assert.ok(source.includes(`ipcRegistrar: "${definition.ipcRegistrar}"`));
      assert.ok(source.includes(`migrationRegistrar: "${definition.migrationRegistrar}"`));
      assert.match(source, /routes:/);
      assert.match(source, /navigation:/);
      definition.requiredCapabilities.forEach((capabilityId) => {
        assert.ok(source.includes(`"${capabilityId}"`));
      });
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
