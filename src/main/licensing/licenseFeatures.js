const LICENSE_MODULES = Object.freeze({
  PROTOKOLL: "protokoll",
  RESTARBEITEN: "restarbeiten",
  RECHNUNG: "rechnung",
});

const LICENSE_FEATURES = Object.freeze({
  DIKTAT: "diktat",
  AUDIO: "diktat",
  LICENSE_ADMIN: "license_admin",
});

const KNOWN_LICENSE_MODULE_IDS = Object.freeze(Object.values(LICENSE_MODULES));
const KNOWN_OPTIONAL_FEATURE_IDS = Object.freeze([
  LICENSE_FEATURES.DIKTAT,
  LICENSE_FEATURES.LICENSE_ADMIN,
]);

const LEGACY_FEATURE_ALIASES = Object.freeze({
  audio: LICENSE_FEATURES.DIKTAT,
  dictate: LICENSE_FEATURES.DIKTAT,
});

const LEGACY_PROTOKOLL_FEATURE_IDS = Object.freeze([
  "app",
  "pdf",
  "export",
  "mail",
  LICENSE_MODULES.PROTOKOLL,
]);

function _normalizeFeatureValue(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeOptionalLicensedFeatures(features) {
  if (!Array.isArray(features)) return [];

  const normalized = [];
  const seen = new Set();

  features.forEach((value) => {
    const feature = normalizeFeatureAlias(value);
    if (!feature || !KNOWN_OPTIONAL_FEATURE_IDS.includes(feature) || seen.has(feature)) return;
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
  return KNOWN_OPTIONAL_FEATURE_IDS.includes(normalizeFeatureAlias(feature));
}

function _hasLegacyProtokollFeature(features) {
  if (!Array.isArray(features)) return false;
  return features.some((value) =>
    LEGACY_PROTOKOLL_FEATURE_IDS.includes(_normalizeFeatureValue(value))
  );
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

  // Bestandslizenzen vor dem kanonischen Modulmodell führten app/pdf/export/mail
  // als Feature-Kennungen. Diese Übersetzung bleibt ausschließlich hier als
  // Kompatibilitätsschicht bestehen; die Begriffe sind keine Modul-IDs mehr.
  if (!seen.has(LICENSE_MODULES.PROTOKOLL) && _hasLegacyProtokollFeature(features)) {
    normalized.push(LICENSE_MODULES.PROTOKOLL);
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
  KNOWN_OPTIONAL_FEATURE_IDS,
  LEGACY_PROTOKOLL_FEATURE_IDS,
  normalizeLicensedModules,
  normalizeFeatureAlias,
  normalizeLicensedFeatures,
  normalizeOptionalLicensedFeatures,
  isStandardLicensedFeature,
  isOptionalLicensedFeature,
  isLicensedModule,
  isLicensedProduct,
};
