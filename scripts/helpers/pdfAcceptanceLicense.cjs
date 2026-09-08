"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const {
  ACCEPTANCE_SWITCH,
  readAcceptanceMarker,
  resolveAcceptanceRoot,
} = require("../../src/main/startup/uiEditorAcceptanceProfile");

// TEST ONLY: controlled license-status input for the isolated Electron worker.
// The real licenseService and featureGuard execute unchanged, including fresh
// reads and error classification. This does NOT verify a customer signature or
// a packaged installation. Only featureGuard receives a packaged-app facade,
// so its development overrides cannot silently authorize Protokoll/Restarbeiten.
// The global loader hook exists solely during the two synchronous imports.
function createPdfAcceptanceLicense({ electronApp, profile, modules = ["sigeko"] } = {}) {
  assert.equal(electronApp?.isPackaged, false, "PDF acceptance license fixture requires a source build");
  assert.equal(profile?.enabled, true, "PDF acceptance license fixture requires an isolated profile");
  const rootPath = resolveAcceptanceRoot([`${ACCEPTANCE_SWITCH}${profile.rootPath}`]);
  readAcceptanceMarker(rootPath);
  for (const name of ["userData", "sessionData"]) {
    assert.equal(path.resolve(profile[`${name}Path`]), path.join(rootPath, name), `Unexpected ${name} profile path`);
    assert.equal(path.resolve(electronApp.getPath(name)), path.join(rootPath, name), `Isolated ${name} must be active`);
  }

  const servicePath = require.resolve("../../src/main/licensing/licenseService");
  const guardPath = require.resolve("../../src/main/licensing/featureGuard");
  assert.equal(require.cache[servicePath], undefined, "Install PDF acceptance fixture before licenseService is loaded");
  assert.equal(require.cache[guardPath], undefined, "Install PDF acceptance fixture before featureGuard is loaded");

  let fixtureStatus;
  let statusReadCount = 0;
  function setModules(nextModules) {
    assert.ok(Array.isArray(nextModules) && (nextModules.length === 0 ||
      (nextModules.length === 1 && nextModules[0] === "sigeko")), "PDF acceptance fixture supports only SiGeKo or no modules");
    fixtureStatus = Object.freeze({
      valid: true,
      reason: "OK",
      developmentLicense: true,
      displayLabel: "Isolierte PDF-Abnahme – simulierter Lizenzstatus",
      license: Object.freeze({
        product: "bbm",
        customerName: "Isolierte PDF-Abnahme",
        modules: Object.freeze([...nextModules]),
        features: Object.freeze([]),
      }),
    });
  }
  setModules(modules);

  const originalLoad = Module._load;
  let service;
  let guard;
  Module._load = function loadAcceptanceDependency(request, parent, isMain) {
    if (parent?.filename === servicePath && request === "./developmentLicenseLoader") {
      return { loadDevelopmentLicenseStatus() { statusReadCount += 1; return fixtureStatus; } };
    }
    if (parent?.filename === guardPath && request === "electron") {
      return { app: Object.freeze({ isPackaged: true, getVersion: () => electronApp.getVersion() }) };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    service = require(servicePath);
    guard = require(guardPath);
  } finally {
    Module._load = originalLoad;
  }

  return Object.freeze({
    source: "simulated-development-license-status",
    cryptographicLicenseVerified: false,
    developmentOverridesEnabled: false,
    setModules,
    getStatus: service.getStatus,
    requireFeature: service.requireFeature,
    enforceLicensedFeature: guard.enforceLicensedFeature,
    getStatusReadCount: () => statusReadCount,
  });
}

module.exports = { createPdfAcceptanceLicense };
