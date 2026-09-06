// Gemeinsame technische PDF-/Print-Dienstgrenze.
// Fachmodule liefern Operation und Payload; der Dienst kennt weder Dokumentarten
// noch fachliche ViewModels, Layoutregeln oder Dateinamen.
export class PdfDocumentService {
  constructor({ router } = {}) {
    this.router = router || null;
  }

  async create({ operation, payload } = {}) {
    const methodName = String(operation || "").trim();
    const method = methodName ? this.router?.[methodName] : null;
    if (typeof method !== "function") {
      return {
        ok: false,
        skipped: true,
        error: methodName ? `PDF-Dienst ${methodName} ist nicht verfuegbar.` : "PDF-Dienst fehlt.",
      };
    }
    return await method.call(this.router, payload || {});
  }
}
