const { getModuleDefinition, getModuleIds } = require("./moduleRegistry");

const registrars = Object.fromEntries(getModuleIds().map((moduleId) => {
  const registrarKey = getModuleDefinition(moduleId)?.ipcRegistrar;
  return [registrarKey, (context) => require(`./modules/${registrarKey}/registerIpc`).registerIpc(context)];
}));

module.exports = Object.freeze(registrars);
