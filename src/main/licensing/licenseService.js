const { loadLicense } = require("./licenseStorage");
const { verifyLicense } = require("./licenseVerifier");
const { loadDevelopmentLicenseStatus } = require("./developmentLicenseLoader");
const {
  LICENSE_MODULES,
  LICENSE_FEATURES,
  normalizeLicensedModules,
  normalizeFeatureAlias,
  normalizeLicensedFeatures,
  isLicensedModule,
} = require("./licenseFeatures");

let cachedStatus = null;

// Zentrale Kernlogik:
// Lizenzdatei lesen, verifizieren und den aktuellen Laufzeitstatus cachen.
function checkLicense() {
  const developmentStatus = loadDevelopmentLicenseStatus();
  if (developmentStatus) {
    cachedStatus = developmentStatus;
    return cachedStatus;
  }
  const licenseData = loadLicense();
  cachedStatus = verifyLicense(licenseData);
  return cachedStatus;
}

function getStatus({ fresh = false } = {}) {
  if (fresh || !cachedStatus) {
    return checkLicense();
  }

  return cachedStatus;
}

function refreshStatus() {
  return checkLicense();
}

const {requireValidLicense,requireFeature} = require("../../../packages/entitlement-core/src/index.cjs").createEntitlementCore({
  getStatus, features: require("./licenseFeatures")
});

module.exports = {
  checkLicense,
  getStatus,
  refreshStatus,
  requireValidLicense,
  requireFeature,
};
