const registry = require("./module-registry.json");

function normalizeModuleIds(moduleIds) {
  if (!Array.isArray(moduleIds)) return [];
  const result = [];
  for (const value of moduleIds) {
    const moduleId = String(value || "").trim().toLowerCase();
    if (!moduleId || result.includes(moduleId)) continue;
    result.push(moduleId);
  }
  return result;
}

function getModuleIds() {
  return Object.freeze(Object.keys(registry.modules || {}));
}

function resolveActiveModuleIds(licenseStatus) {
  if (!licenseStatus || licenseStatus.valid !== true) return Object.freeze([]);
  const known = new Set(getModuleIds());
  const source = licenseStatus?.license?.modules ?? licenseStatus?.modules ?? [];
  return Object.freeze(normalizeModuleIds(source).filter((moduleId) => known.has(moduleId)));
}

function isModuleActive(licenseStatus, moduleId) {
  const normalized = String(moduleId || "").trim().toLowerCase();
  return !!normalized && resolveActiveModuleIds(licenseStatus).includes(normalized);
}

module.exports = Object.freeze({
  registry,
  getModuleIds,
  resolveActiveModuleIds,
  isModuleActive,
});
