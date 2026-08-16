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

class InvoiceService {
  constructor({ repository = new InvoiceRepository(), settingsGetMany = appSettingsGetMany, today = () => new Date().toISOString().slice(0, 10) } = {}) {
    this.repository = repository;
    this.settingsGetMany = settingsGetMany;
    this.today = today;
  }

  async defaults() {
    const rules = await loadRules();
    const settings = this.settingsGetMany([rules.PAYMENT_TERM_SETTING_KEY]);
    const configured = Number(settings[rules.PAYMENT_TERM_SETTING_KEY]);
    const paymentTermDays = Number.isInteger(configured) && configured >= 0 && configured <= 3650 ? configured : rules.DEFAULT_PAYMENT_TERM_DAYS;
    const invoiceDate = this.today();
    return { source_type: "FREE", document_type: "INVOICE", invoice_date: invoiceDate, service_period_type: "SINGLE_DATE", payment_term_days: paymentTermDays, due_date: rules.addCalendarDays(invoiceDate, paymentTermDays) };
  }

  list() { return this.repository.list(); }
  get(id) { return this.repository.get(id); }

  async createDraft(input = {}) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const defaults = await this.defaults();
    return this.repository.createDraft({ ...rules.normalizeInvoiceHeader({ ...defaults, ...input }), construction_project: String(input.construction_project || "").trim(), positions: positions.normalizeInvoicePositions(input.positions || []) });
  }

  async updateDraft(id, input = {}) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const current = this.repository.get(id);
    if (!current) throw new Error("Rechnung wurde nicht gefunden.");
    if (current.status !== "DRAFT") throw new Error("Gebuchte Rechnungen können nicht geändert werden.");
    return this.repository.updateDraft(id, { ...rules.normalizeInvoiceHeader({ ...current, ...input }), construction_project: String(input.construction_project ?? current.construction_project ?? "").trim(), positions: positions.normalizeInvoicePositions(input.positions ?? current.positions ?? []) });
  }

  deleteDraft(id) { return this.repository.deleteDraft(id); }

  async previewDraft(id, input = null) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const current = this.repository.get(id);
    if (!current) throw new Error("Rechnung wurde nicht gefunden.");
    if (current.status !== "DRAFT") return current;
    return { ...current, ...rules.normalizeInvoiceHeader({ ...current, ...(input || {}) }), construction_project: String(input?.construction_project ?? current.construction_project ?? "").trim(), positions: positions.normalizeInvoicePositions(input?.positions ?? current.positions ?? []), invoice_number: null, status: "DRAFT", preview: true };
  }

  async bookDraft(id, input = {}) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const current = this.repository.get(id);
    if (!current) throw new Error("Rechnung wurde nicht gefunden.");
    if (current.status !== "DRAFT") throw new Error("Nur Entwürfe können gebucht werden.");
    const header = { ...rules.normalizeInvoiceHeader({ ...current, ...input }, { requireBookingFields: true }), construction_project: String(input.construction_project ?? current.construction_project ?? "").trim(), positions: positions.normalizeInvoicePositions(input.positions ?? current.positions ?? []) };
    return this.repository.bookDraft(id, header);
  }
}

let singleton;
function getInvoiceService() {
  if (!singleton) singleton = new InvoiceService();
  return singleton;
}

module.exports = { InvoiceService, getInvoiceService };
