const { getModuleDefinition, getModuleIds } = require("./moduleRegistry");

const registrars = Object.fromEntries(getModuleIds().map((moduleId) => {
  const registrarKey = getModuleDefinition(moduleId)?.migrationRegistrar;
  return [registrarKey, (context) => require(`./modules/${registrarKey}/registerMigrations`).registerMigrations(context)];
}));

module.exports = Object.freeze(registrars);
