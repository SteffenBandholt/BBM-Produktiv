const registry = require("./module-registry.json");

function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeModuleIds(moduleIds) {
  if (!Array.isArray(moduleIds)) return [];
  const result = [];
  for (const value of moduleIds) {
    const moduleId = normalizeId(value);
    if (!moduleId || result.includes(moduleId)) continue;
    result.push(moduleId);
  }
  return result;
}

function getModuleTypes() {
  return Object.freeze([...(registry.moduleTypes || [])]);
}

function getCanonicalModuleIds() {
  return Object.freeze([...(registry.canonicalModuleIds || [])]);
}

function getModuleIds() {
  return Object.freeze(Object.keys(registry.modules || {}));
}

function getCapabilityIds() {
  return Object.freeze(Object.keys(registry.capabilities || {}));
}

function getModuleDefinition(moduleId) {
  const normalized = normalizeId(moduleId);
  if (!normalized) return null;
  return registry.modules?.[normalized] || null;
}

function getCapabilityDefinition(capabilityId) {
  const normalized = normalizeId(capabilityId);
  if (!normalized) return null;
  return registry.capabilities?.[normalized] || null;
}

function isKnownModuleId(moduleId) {
  return getCanonicalModuleIds().includes(normalizeId(moduleId));
}

function isKnownCapabilityId(capabilityId) {
  return getCapabilityIds().includes(normalizeId(capabilityId));
}

function getModuleLicenseKey(moduleId) {
  return getModuleDefinition(moduleId)?.licenseKey || "";
}

function getCapabilityLicenseKey(capabilityId) {
  return getCapabilityDefinition(capabilityId)?.licenseKey || "";
}

function resolveActiveModuleIds(licenseStatus) {
  if (!licenseStatus || licenseStatus.valid !== true) return Object.freeze([]);
  const installed = new Set(getModuleIds());
  const source = licenseStatus?.license?.modules ?? licenseStatus?.modules ?? [];
  return Object.freeze(normalizeModuleIds(source).filter((moduleId) => installed.has(moduleId)));
}

function isModuleActive(licenseStatus, moduleId) {
  const normalized = normalizeId(moduleId);
  return !!normalized && resolveActiveModuleIds(licenseStatus).includes(normalized);
}

module.exports = Object.freeze({
  registry,
  getModuleTypes,
  getCanonicalModuleIds,
  getModuleIds,
  getCapabilityIds,
  getModuleDefinition,
  getCapabilityDefinition,
  isKnownModuleId,
  isKnownCapabilityId,
  getModuleLicenseKey,
  getCapabilityLicenseKey,
  resolveActiveModuleIds,
  isModuleActive,
});
