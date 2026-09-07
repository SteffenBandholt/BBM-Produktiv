const { PdfDocumentProvider } = require("../../moduleServiceProviders");

// Technischer Anschlussvertrag; keine SiGeKo-Fachfunktion oder Fachfelder.
const technicalPdfProvider = PdfDocumentProvider({
  moduleId: "sigeko",
  type: "technical-neutral",
  provide({ input }) {
    if (!input || typeof input.title !== "string" || !input.title.trim() || input.title.length > 80 ||
        typeof input.body !== "string" || !input.body.trim() || input.body.length > 600 ||
        /[\r\n]/.test(input.title) || input.body.split(/\r?\n/).length > 10) {
      throw Object.assign(new Error("Technischer PDF-Inhalt fehlt oder ueberschreitet den Einseitenvertrag."), { code: "PDF_PROVIDER_DATA_INVALID" });
    }
    return { title: input.title, body: input.body };
  },
});
module.exports = { technicalPdfProvider };
