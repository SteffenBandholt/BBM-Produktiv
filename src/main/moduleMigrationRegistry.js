const { getModuleDefinition, getModuleIds } = require("./moduleRegistry");

function normalizeModuleIds(moduleIds) {
  if (!Array.isArray(moduleIds)) return [];
  const installed = new Set(getModuleIds());
  return [...new Set(moduleIds.map((value) => String(value || "").trim().toLowerCase()))]
    .filter((moduleId) => installed.has(moduleId));
}

function runModuleMigrations({ db, moduleIds, registrars = {}, migrations = {}, logger = console } = {}) {
  const migratedModuleIds = [];
  for (const moduleId of normalizeModuleIds(moduleIds)) {
    const registrarKey = getModuleDefinition(moduleId)?.migrationRegistrar;
    const registrar = registrars[registrarKey];
    if (typeof registrar !== "function") {
      logger?.warn?.(`[db] no migration registrar for module: ${moduleId} (${registrarKey || "none"})`);
      continue;
    }
    registrar({ db, moduleId, migrations });
    migratedModuleIds.push(moduleId);
  }
  return Object.freeze(migratedModuleIds);
}

module.exports = Object.freeze({ normalizeModuleIds, runModuleMigrations });
