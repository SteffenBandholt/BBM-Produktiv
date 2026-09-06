const {
  getCanonicalModuleIds,
  getCapabilityIds,
} = require("../moduleRegistry");

function assertCanonicalIds(actualIds, canonicalIds, kind) {
  for (const id of actualIds) {
    if (!canonicalIds.includes(id)) {
      throw new Error(`Unbekannte kanonische ${kind}-ID: ${id}`);
    }
  }
}

const CANONICAL_MODULE_IDS = getCanonicalModuleIds();
const CANONICAL_CAPABILITY_IDS = getCapabilityIds();

// Die Literale bleiben aus Kompatibilitaetsgruenden sichtbar; die Registry ist
// dennoch die kanonische Quelle und wird beim Laden gegen diese Werte geprueft.
const LICENSE_MODULES = Object.freeze({
  PROTOKOLL: "protokoll",
  RESTARBEITEN: "restarbeiten",
  RECHNUNG: "rechnung",
  SIGEKO: "sigeko",
});

const LICENSE_CAPABILITIES = Object.freeze({
  PDF: "pdf",
  MAIL: "mail",
  EXPORT: "export",
  FILE_STORAGE: "file-storage",
  AUDIO: "audio",
  UI_EDITOR: "ui-editor",
});

assertCanonicalIds(Object.values(LICENSE_MODULES), CANONICAL_MODULE_IDS, "Modul");
assertCanonicalIds(Object.values(LICENSE_CAPABILITIES), CANONICAL_CAPABILITY_IDS, "Capability");

const LICENSE_FEATURES = Object.freeze({
  DIKTAT: "diktat",
  AUDIO: "diktat",
});

const KNOWN_LICENSE_MODULE_IDS = CANONICAL_MODULE_IDS;

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

  // Bestandslizenzen vor dem kanonischen Modulmodell fuehrten app/pdf/export/mail
  // als Feature-Kennungen. Diese Uebersetzung bleibt ausschliesslich hier als
  // Kompatibilitaetsschicht bestehen; die Begriffe sind keine Modul-IDs mehr.
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
  LICENSE_CAPABILITIES,
  LICENSE_FEATURES,
  KNOWN_LICENSE_MODULE_IDS,
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
