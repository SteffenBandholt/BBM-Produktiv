// Productive module composition. Shared registries and the print bridge stay module-neutral.
const { createModuleServiceProviderRegistry } = require("./moduleServiceProviders");

function createProductivePdfProviderRegistry() {
  const registry = createModuleServiceProviderRegistry();
  registry.register(require("./modules/sigeko/technicalPdfProvider").technicalPdfProvider);
  return registry;
}

module.exports = { createProductivePdfProviderRegistry };
