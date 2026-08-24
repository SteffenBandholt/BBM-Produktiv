export const INVOICE_STATUSES = Object.freeze(["DRAFT", "BOOKED", "CANCELLED"]);
export const INVOICE_SOURCE_TYPES = Object.freeze(["FREE", "FROM_ORDER"]);
export const INVOICE_DOCUMENT_TYPES = Object.freeze(["INVOICE", "PARTIAL", "FINAL", "HOURLY"]);
export const SERVICE_PERIOD_TYPES = Object.freeze(["SINGLE_DATE", "MONTH", "RANGE"]);
export const DEFAULT_PAYMENT_TERM_DAYS = 8;
export const PAYMENT_TERM_SETTING_KEY = "invoice.paymentTermDays";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const text = (value) => String(value ?? "").trim();

export function isIsoDate(value) {
  const source = text(value);
  if (!ISO_DATE.test(source)) return false;
  const date = new Date(`${source}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === source;
}

export function addCalendarDays(isoDate, days) {
  if (!isIsoDate(isoDate)) throw new Error("Rechnungsdatum ist ungültig.");
  const count = Number(days);
  if (!Number.isInteger(count) || count < 0 || count > 3650) throw new Error("Zahlungsziel muss zwischen 0 und 3650 Kalendertagen liegen.");
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function monthBounds(value) {
  const source = text(value);
  const match = /^(\d{4})-(\d{2})$/.exec(source);
  if (!match) throw new Error("Leistungsmonat ist ungültig.");
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error("Leistungsmonat ist ungültig.");
  const start = `${match[1]}-${match[2]}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  return { start, end: endDate.toISOString().slice(0, 10) };
}

export function normalizeServicePeriod(input = {}) {
  const type = text(input.service_period_type);
  if (!SERVICE_PERIOD_TYPES.includes(type)) throw new Error("Bitte einen gültigen Leistungszeitpunkt wählen.");
  if (type === "SINGLE_DATE") {
    if (!isIsoDate(input.service_date)) throw new Error("Bitte ein gültiges Leistungsdatum eingeben.");
    return { service_period_type: type, service_date: text(input.service_date), service_period_start: null, service_period_end: null };
  }
  if (type === "MONTH") {
    const month = text(input.service_month) || text(input.service_period_start).slice(0, 7);
    const bounds = monthBounds(month);
    return { service_period_type: type, service_date: null, service_period_start: bounds.start, service_period_end: bounds.end };
  }
  const start = text(input.service_period_start);
  const end = text(input.service_period_end);
  if (!isIsoDate(start) || !isIsoDate(end)) throw new Error("Bitte einen gültigen Leistungszeitraum eingeben.");
  if (start > end) throw new Error("Der Beginn des Leistungszeitraums darf nicht nach dem Ende liegen.");
  return { service_period_type: type, service_date: null, service_period_start: start, service_period_end: end };
}

export function normalizeInvoiceHeader(input = {}, { requireBookingFields = false } = {}) {
  const sourceType = text(input.source_type || "FREE");
  const documentType = text(input.document_type || "INVOICE");
  if (!INVOICE_SOURCE_TYPES.includes(sourceType)) throw new Error("Herkunft der Rechnung ist ungültig.");
  if (!INVOICE_DOCUMENT_TYPES.includes(documentType)) throw new Error("Belegart ist ungültig.");
  const invoiceDate = text(input.invoice_date);
  if (!isIsoDate(invoiceDate)) throw new Error("Bitte ein gültiges Rechnungsdatum eingeben.");
  const paymentTermDays = Number(input.payment_term_days);
  if (!Number.isInteger(paymentTermDays) || paymentTermDays < 0 || paymentTermDays > 3650) throw new Error("Zahlungsziel muss zwischen 0 und 3650 Kalendertagen liegen.");
  const serviceReference = text(input.service_reference);
  const customerRefKind = text(input.customer_ref_kind);
  const customerFirmId = text(input.customer_firm_id);
  const projectId = text(input.project_id) || null;
  const installmentNumber = input.installment_number === null || input.installment_number === undefined || input.installment_number === "" ? null : Number(input.installment_number);
  if (installmentNumber !== null && (!Number.isInteger(installmentNumber) || installmentNumber < 1)) throw new Error("Abschlagsnummer muss eine positive ganze Zahl sein.");
  if (documentType !== "PARTIAL" && installmentNumber !== null) throw new Error("Eine Abschlagsnummer ist nur für Abschlagsrechnungen zulässig.");
  const servicePeriod = normalizeServicePeriod(input);
  if (requireBookingFields) {
    if (!customerFirmId || customerRefKind !== "global_firm") throw new Error("Bitte einen zentralen Rechnungskunden wählen.");
    if (!serviceReference) throw new Error("Bitte Bauvorhaben / Leistungsbezug eingeben.");
    if (sourceType === "FROM_ORDER") {
      if (!text(input.source_order_id) || !text(input.source_order_number) || !isIsoDate(input.source_order_date)) throw new Error("Der Auftragsbezug ist unvollständig.");
    }
  }
  return {
    source_type: sourceType,
    document_type: documentType,
    installment_number: installmentNumber,
    invoice_date: invoiceDate,
    ...servicePeriod,
    customer_ref_kind: customerRefKind || null,
    customer_firm_id: customerFirmId || null,
    customer_project_id: customerRefKind === "project_firm" ? text(input.customer_project_id) || null : null,
    project_id: projectId,
    source_order_id: text(input.source_order_id) || null,
    source_order_number: text(input.source_order_number) || null,
    source_order_date: text(input.source_order_date) || null,
    service_reference: serviceReference || null,
    payment_term_days: paymentTermDays,
    due_date: addCalendarDays(invoiceDate, paymentTermDays),
  };
}

export function formatDocumentType(input = {}) {
  if (input.document_type === "PARTIAL") return input.installment_number ? `${input.installment_number}. Abschlagsrechnung` : "Abschlagsrechnung";
  return ({ INVOICE: "Rechnung", FINAL: "Schlussrechnung", HOURLY: "Stundenlohnrechnung" })[input.document_type] || "Rechnung";
}

export function draftPreviewIdentifier(draftId) {
  const compact = String(draftId || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `PR-${(compact || "ENTWURF").slice(-6)}`;
}

export function formatInvoiceNumber(sequenceKey, value) {
  return `${sequenceKey}-${String(value).padStart(4, "0")}`;
}
