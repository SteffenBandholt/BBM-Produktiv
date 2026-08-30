"use strict";

const path = require("path");
const { pathToFileURL } = require("url");
const { InvoiceRepository } = require("../../db/invoiceRepository");
const { appSettingsGetMany } = require("../../db/appSettingsRepo");

let rulesPromise;
let positionsPromise;
function loadRules() {
  if (!rulesPromise) rulesPromise = import(pathToFileURL(path.join(__dirname, "../../../shared/rechnung/invoiceHeaderRules.mjs")).href);
  return rulesPromise;
}
function loadPositions() {
  if (!positionsPromise) positionsPromise = import(pathToFileURL(path.join(__dirname, "../../../shared/rechnung/rechnungPositions.mjs")).href);
  return positionsPromise;
}

function normalizeIntroText(value) {
  return value === null || value === undefined ? "" : String(value);
}

function normalizePaymentAmount(value) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error("Der Zahlbetrag muss als positive ganze Centzahl angegeben werden.");
  return value;
}

function normalizePaymentNote(value) {
  const note = value === null || value === undefined ? "" : String(value).trim();
  return note || null;
}

function buildPaymentSummary(invoice, paidCents, calculateTotals, today) {
  const { gross_cents } = calculateTotals(invoice.positions || []);
  const paid_cents = Number(paidCents || 0);
  const open_cents = Math.max(gross_cents - paid_cents, 0);
  let payment_status = null;
  if (invoice.status === "BOOKED") {
    if (open_cents === 0) payment_status = "PAID";
    else if (invoice.due_date && invoice.due_date < today) payment_status = "OVERDUE";
    else if (paid_cents > 0) payment_status = "PARTIALLY_PAID";
    else payment_status = "OPEN";
  }
  return { invoice_id: invoice.id, gross_cents, paid_cents, open_cents, payment_status };
}

class InvoiceService {
  constructor({ repository = new InvoiceRepository(), settingsGetMany = appSettingsGetMany, today = () => new Date().toISOString().slice(0, 10) } = {}) {
    this.repository = repository;
    this.settingsGetMany = settingsGetMany;
    this.today = today;
  }

  async defaults() {
    const rules = await loadRules();
    const settings = this.settingsGetMany([rules.PAYMENT_TERM_SETTING_KEY]) || {};
    const configuredValue = settings[rules.PAYMENT_TERM_SETTING_KEY];
    const hasConfiguredValue = configuredValue !== null
      && configuredValue !== undefined
      && (typeof configuredValue !== "string" || configuredValue.trim() !== "");
    const configured = hasConfiguredValue ? Number(configuredValue) : Number.NaN;
    const paymentTermDays = Number.isInteger(configured) && configured >= 0 && configured <= 3650 ? configured : rules.DEFAULT_PAYMENT_TERM_DAYS;
    const invoiceDate = this.today();
    return { source_type: "FREE", document_type: "INVOICE", invoice_date: invoiceDate, service_period_type: "SINGLE_DATE", payment_term_days: paymentTermDays, due_date: rules.addCalendarDays(invoiceDate, paymentTermDays) };
  }

  list() { return this.repository.list(); }
  get(id) { return this.repository.get(id); }

  async listManagement() {
    const invoices = this.repository.list();
    const positions = await loadPositions();
    const paidByInvoice = typeof this.repository.sumPaymentsByInvoice === "function"
      ? this.repository.sumPaymentsByInvoice()
      : new Map(invoices.map((invoice) => [invoice.id, this.repository.sumPayments(invoice.id)]));
    const today = this.today();
    return invoices.map((invoice) => ({
      ...invoice,
      ...buildPaymentSummary(invoice, paidByInvoice.get(invoice.id) || 0, positions.calculateInvoiceTotalsCents, today),
    }));
  }

  listPayments(invoiceId) {
    const invoice = this.repository.get(invoiceId);
    if (!invoice) throw new Error("Rechnung wurde nicht gefunden.");
    return this.repository.listPayments(invoice.id);
  }

  async recordPayment(invoiceId, input = {}) {
    const rules = await loadRules();
    if (!rules.isIsoDate(input.payment_date)) throw new Error("Bitte ein gültiges Zahlungsdatum eingeben.");
    return this.repository.createPayment(invoiceId, {
      payment_date: String(input.payment_date).trim(),
      amount_cents: normalizePaymentAmount(input.amount_cents),
      note: normalizePaymentNote(input.note),
    });
  }

  async correctPayment(invoiceId, paymentId, input = {}) {
    const rules = await loadRules();
    if (!rules.isIsoDate(input.payment_date)) throw new Error("Bitte ein gültiges Zahlungsdatum eingeben.");
    return this.repository.updatePayment(invoiceId, paymentId, {
      payment_date: String(input.payment_date).trim(),
      amount_cents: normalizePaymentAmount(input.amount_cents),
      note: normalizePaymentNote(input.note),
    });
  }

  async paymentSummary(invoiceId) {
    const invoice = this.repository.get(invoiceId);
    if (!invoice) throw new Error("Rechnung wurde nicht gefunden.");
    const positions = await loadPositions();
    return buildPaymentSummary(invoice, this.repository.sumPayments(invoice.id), positions.calculateInvoiceTotalsCents, this.today());
  }

  getDevNumberSequence(sequenceKey) { return this.repository.getNumberSequence(sequenceKey); }
  resetDevNumberSequence(sequenceKey) { return this.repository.resetNumberSequence(sequenceKey); }

  async createDraft(input = {}) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const defaults = await this.defaults();
    return this.repository.createDraft({ ...rules.normalizeInvoiceHeader({ ...defaults, ...input }), construction_project: String(input.construction_project || "").trim(), intro_text: normalizeIntroText(input.intro_text), positions: positions.normalizeInvoicePositions(input.positions || []) });
  }

  async updateDraft(id, input = {}) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const current = this.repository.get(id);
    if (!current) throw new Error("Rechnung wurde nicht gefunden.");
    if (current.status !== "DRAFT") throw new Error("Gebuchte Rechnungen können nicht geändert werden.");
    return this.repository.updateDraft(id, { ...rules.normalizeInvoiceHeader({ ...current, ...input }), construction_project: String(input.construction_project ?? current.construction_project ?? "").trim(), intro_text: normalizeIntroText(input.intro_text ?? current.intro_text), positions: positions.normalizeInvoicePositions(input.positions ?? current.positions ?? []) });
  }

  deleteDraft(id) { return this.repository.deleteDraft(id); }

  async previewDraft(id, input = null) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const current = this.repository.get(id);
    if (!current) throw new Error("Rechnung wurde nicht gefunden.");
    if (current.status !== "DRAFT") return current;
    return { ...current, ...rules.normalizeInvoiceHeader({ ...current, ...(input || {}) }), construction_project: String(input?.construction_project ?? current.construction_project ?? "").trim(), intro_text: normalizeIntroText(input?.intro_text ?? current.intro_text), positions: positions.normalizeInvoicePositions(input?.positions ?? current.positions ?? []), invoice_number: null, status: "DRAFT", preview: true };
  }

  async bookDraft(id, input = {}) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const current = this.repository.get(id);
    if (!current) throw new Error("Rechnung wurde nicht gefunden.");
    if (current.status !== "DRAFT") throw new Error("Nur Entwürfe können gebucht werden.");
    const header = { ...rules.normalizeInvoiceHeader({ ...current, ...input }, { requireBookingFields: true }), construction_project: String(input.construction_project ?? current.construction_project ?? "").trim(), intro_text: normalizeIntroText(input.intro_text ?? current.intro_text), positions: positions.normalizeInvoicePositions(input.positions ?? current.positions ?? []) };
    return this.repository.bookDraft(id, header);
  }
}

let singleton;
function getInvoiceService() {
  if (!singleton) singleton = new InvoiceService();
  return singleton;
}

module.exports = { InvoiceService, getInvoiceService };
