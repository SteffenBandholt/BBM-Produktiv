'use strict';
function createEntitlementCore({getStatus,features}) {
 const {LICENSE_MODULES,LICENSE_FEATURES,normalizeLicensedModules,normalizeFeatureAlias,normalizeLicensedFeatures,isLicensedModule}=features;
// Zentrale Kernlogik:
// "gueltige Lizenz erforderlich" bleibt hier gebuendelt, nicht in den nutzenden IPCs/Views.
function requireValidLicense({ fresh = false } = {}) {
  const result = getStatus({ fresh });

  if (!result.valid) {
    throw new Error(`LICENSE_INVALID:${result.reason}`);
  }

  return result.license;
}

function _normalizeRequestedFeature(feature) {
  return String(feature || "").trim();
}

// Zentrale Kernlogik:
// Standard-Features gehoeren zur Grundlizenz, optionale Features werden explizit aus der Lizenz gelesen.
function requireFeature(feature) {
  const normalizedFeature = normalizeFeatureAlias(_normalizeRequestedFeature(feature));
  if (!normalizedFeature) {
    throw new Error("FEATURE_NOT_ALLOWED:");
  }

  const license = requireValidLicense({ fresh: true });

  const modules = normalizeLicensedModules(license?.modules, license?.features);
  const features = normalizeLicensedFeatures(license?.features);
  if (isLicensedModule(normalizedFeature)) {
    if (!modules.includes(normalizedFeature)) throw new Error(`FEATURE_NOT_ALLOWED:${normalizedFeature}`);
    return true;
  }
  if (normalizedFeature === LICENSE_FEATURES.DIKTAT) {
    if (!modules.includes(LICENSE_MODULES.PROTOKOLL) || !features.includes(LICENSE_FEATURES.DIKTAT)) {
      throw new Error(`FEATURE_NOT_ALLOWED:${normalizedFeature}`);
    }
    return true;
  }
  if (normalizedFeature !== LICENSE_MODULES.PROTOKOLL) {
    throw new Error(`FEATURE_NOT_ALLOWED:${normalizedFeature}`);
  }
}

return {requireValidLicense,requireFeature};
}
module.exports={createEntitlementCore,...require("./features.cjs")};
