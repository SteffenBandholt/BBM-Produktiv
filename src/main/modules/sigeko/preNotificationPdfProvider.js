const { PdfDocumentProvider } = require("../../moduleServiceProviders");
const { getPreNotificationDocumentService } = require("../../domain/sigeko/PreNotificationDocumentService");
const preNotificationPdfProvider = PdfDocumentProvider({ moduleId: "sigeko", type: "sigeko-vorankuendigung",
  provide(request) { return getPreNotificationDocumentService().resolveProviderDocument(request); } });
module.exports = Object.freeze({ preNotificationPdfProvider });
