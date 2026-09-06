const moduleRegistry = require("./module-registry.json");
const {
  PROVIDER_KINDS,
  PdfDocumentProvider,
  MailPayloadProvider,
  ExportProvider,
  createServiceProviderRegistry,
} = require("../shared/providers/serviceProviderRegistry.cjs");

function createModuleServiceProviderRegistry() {
  return createServiceProviderRegistry({ moduleDefinitions: moduleRegistry.modules });
}

module.exports = Object.freeze({
  PROVIDER_KINDS,
  PdfDocumentProvider,
  MailPayloadProvider,
  ExportProvider,
  createModuleServiceProviderRegistry,
});
