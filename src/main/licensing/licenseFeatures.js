const LICENSE_MODULES = Object.freeze({
  PROTOKOLL: "protokoll",
  RESTARBEITEN: "restarbeiten",
  RECHNUNG: "rechnung",
});

const LICENSE_FEATURES = Object.freeze({
  DIKTAT: "diktat",
  AUDIO: "diktat",
});

const KNOWN_LICENSE_MODULE_IDS = Object.freeze(Object.values(LICENSE_MODULES));

const LEGACY_FEATURE_ALIASES = Object.freeze({
  audio: LICENSE_FEATURES.DIKTAT,
  dictate: LICENSE_FEATURES.DIKTAT,
  app: LICENSE_MODULES.PROTOKOLL,
  pdf: LICENSE_MODULES.PROTOKOLL,
  export: LICENSE_MODULES.PROTOKOLL,
  mail: LICENSE_MODULES.PROTOKOLL,
});

function _normalizeFeatureValue(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeOptionalLicensedFeatures(features) {
  if (!Array.isArray(features)) return [];

  const normalized = [];
  const seen = new Set();

  features.forEach((value) => {
    const feature = normalizeFeatureAlias(value);
    if (!feature || feature !== LICENSE_FEATURES.DIKTAT || seen.has(feature)) return;
    seen.add(feature);
    normalized.push(feature);
  });

  return normalized;
}

function normalizeLicensedFeatures(features) {
  return normalizeOptionalLicensedFeatures(features);
}

function normalizeFeatureAlias(feature) {
  const normalized = _normalizeFeatureValue(feature);
  if (!normalized) return "";
  return LEGACY_FEATURE_ALIASES[normalized] || normalized;
}

function isStandardLicensedFeature(feature) {
  return isLicensedModule(feature);
}

function isOptionalLicensedFeature(feature) {
  return normalizeFeatureAlias(feature) === LICENSE_FEATURES.DIKTAT;
}

function normalizeLicensedModules(modules, features) {
  const rawModules = Array.isArray(modules) ? modules : [];
  const normalized = [];
  const seen = new Set();
  rawModules.forEach((value) => {
    const mod = _normalizeFeatureValue(value);
    const isAllowedModule = KNOWN_LICENSE_MODULE_IDS.includes(mod);
    if (!mod || !isAllowedModule || seen.has(mod)) return;
    seen.add(mod);
    normalized.push(mod);
  });
  if (!seen.has(LICENSE_MODULES.PROTOKOLL)) {
    const fallback = Array.isArray(features)
      ? features.some((value) => normalizeFeatureAlias(value) === LICENSE_MODULES.PROTOKOLL)
      : false;
    if (fallback) normalized.push(LICENSE_MODULES.PROTOKOLL);
  }
  return normalized;
}

function isLicensedModule(moduleId) {
  const normalized = _normalizeFeatureValue(moduleId);
  return KNOWN_LICENSE_MODULE_IDS.includes(normalized);
}

function isLicensedProduct(product) {
  const normalized = _normalizeFeatureValue(product);
  return normalized === "bbm" || normalized === "bbm-protokoll";
}

module.exports = {
  LICENSE_MODULES,
  LICENSE_FEATURES,
  KNOWN_LICENSE_MODULE_IDS,
  normalizeLicensedModules,
  normalizeFeatureAlias,
  normalizeLicensedFeatures,
  normalizeOptionalLicensedFeatures,
  isStandardLicensedFeature,
  isOptionalLicensedFeature,
  isLicensedModule,
  isLicensedProduct,
};
