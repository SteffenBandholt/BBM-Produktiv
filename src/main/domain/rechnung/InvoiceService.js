"use strict";

const path = require("path");
const { pathToFileURL } = require("url");
const { InvoiceRepository } = require("../../db/invoiceRepository");
const { appSettingsGetMany } = require("../../db/appSettingsRepo");
const { getBillingOrderService } = require("./BillingOrderService");
const { assertOrderSnapshotInput, createOrderSnapshot } = require("./invoiceOrderSnapshot");

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

class InvoiceService {
  constructor({
    repository = new InvoiceRepository(),
    billingOrderService = getBillingOrderService(),
    settingsGetMany = appSettingsGetMany,
    today = () => new Date().toISOString().slice(0, 10),
    customerService = null,
    customerServiceProvider = () => require("../customers/customerCoreProvider").getRuntimeCustomerCore().service,
    customerFirmBridge = null,
    customerFirmBridgeProvider = () => require("../customers/CustomerFirmBridgeService").getCustomerFirmBridgeService(),
  } = {}) {
    this.repository = repository;
    this.settingsGetMany = settingsGetMany;
    this.today = today;
    this.billingOrderService = billingOrderService;
    this.customerService = customerService;
    this.customerServiceProvider = customerServiceProvider;
    this.customerFirmBridge = customerFirmBridge;
    this.customerFirmBridgeProvider = customerFirmBridgeProvider;
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

  _customers() {
    if (!this.customerService) this.customerService = this.customerServiceProvider();
    return this.customerService;
  }

  _bridge() {
    if (!this.customerFirmBridge) this.customerFirmBridge = this.customerFirmBridgeProvider();
    return this.customerFirmBridge;
  }

  listCustomers() {
    return this._customers().listCustomers({ status: "ACTIVE" }).map((customer) => ({
      ...customer,
      id: customer.customerId,
      label: [customer.customerNumber, customer.name1, customer.name2].filter(Boolean).join(" · "),
      companyName: customer.name1,
      companyName2: customer.name2,
      zip: customer.postalCode,
      country: customer.countryCode,
    }));
  }

  _customerSnapshot(customerId, { requireComplete = false } = {}) {
    const id = String(customerId || "").trim();
    if (!id) {
      if (requireComplete) throw new Error("Bitte einen Rechnungskunden wählen.");
      return null;
    }
    const service = this._customers();
    const customer = service.getCustomer(id);
    if (!customer) throw new Error("Der gewählte Rechnungskunde wurde nicht gefunden.");
    if (customer.status !== "ACTIVE") throw new Error("Der gewählte Rechnungskunde ist archiviert.");
    const billing = service.resolveBillingProfile(id);
    if (requireComplete) {
      const missing = [
        ["name1", billing?.name1],
        ["street", billing?.street],
        ["postalCode", billing?.postalCode],
        ["city", billing?.city],
        ["countryCode", billing?.countryCode],
      ].filter(([, value]) => !String(value || "").trim()).map(([field]) => field);
      if (missing.length) {
        const error = new Error("Die Rechnungsanschrift des Kunden ist unvollständig.");
        error.code = "CUSTOMER_BILLING_ADDRESS_INCOMPLETE";
        error.missingFields = missing;
        throw error;
      }
    }
    return {
      source: { kind: "customer", id: customer.customerId },
      customerId: customer.customerId,
      customerNumber: customer.customerNumber,
      customerRevision: customer.revision,
      companyName: billing.name1 || null,
      companyName2: billing.name2 || null,
      street: billing.street || null,
      zip: billing.postalCode || null,
      city: billing.city || null,
      country: billing.countryCode || null,
      phone: customer.phone || null,
      email: billing.email || null,
      vatId: billing.vatId || null,
      resolvedAt: billing.resolvedAt,
    };
  }

  async createDraft(input = {}) {
    if (input.source_type === "FROM_ORDER") throw new Error("invoice_order_requires_snapshot_creation");
    assertOrderSnapshotInput({ source_type: "FREE" }, input);
    const rules = await loadRules();
    const positions = await loadPositions();
    const defaults = await this.defaults();
    if (input.customer_id) this._customerSnapshot(input.customer_id);
    return this.repository.createDraft({ ...rules.normalizeInvoiceHeader({ ...defaults, ...input }), construction_project: String(input.construction_project || "").trim(), intro_text: normalizeIntroText(input.intro_text), positions: positions.normalizeInvoicePositions(input.positions || []) });
  }

  async createDraftFromOrder(input = {}) {
    const allowed = ["source_order_id", "invoice_date", "service_period_type", "service_date", "service_month", "service_period_start", "service_period_end", "payment_term_days", "intro_text"];
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invoice_order_payload_invalid");
    if (input.order_binding_state === "LEGACY_UNRESOLVED") throw new Error("invoice_order_binding_legacy_unresolved");
    if (Object.keys(input).some(key => !allowed.includes(key))) throw new Error("invoice_order_field_not_allowed");
    const rules = await loadRules();
    const positionRules = await loadPositions();
    const defaults = await this.defaults();
    // No await inside SQLite's transaction: read source, copy and insert are atomic.
    return this.repository.withTransaction(() => {
      const order = this.billingOrderService.get({ id: input.source_order_id });
      const snapshot = createOrderSnapshot(order, positionRules);
      const linked = this._bridge().getLinkedCustomer({ kind: "global_firm", id: order.customer_firm_id });
      if (!linked.customer) {
        const error = new Error("Die Auftragsfirma ist noch nicht mit einem Rechnungskunden verknüpft.");
        error.code = "ORDER_CUSTOMER_NOT_LINKED";
        throw error;
      }
      if (linked.customer.status !== "ACTIVE") {
        const error = new Error("Der mit der Auftragsfirma verknüpfte Kunde ist archiviert.");
        error.code = "CUSTOMER_ARCHIVED";
        throw error;
      }
      const customerPaymentTerm = linked.customer.defaultPaymentTermDays;
      const header = rules.normalizeInvoiceHeader({
        ...defaults, ...input,
        payment_term_days: input.payment_term_days ?? customerPaymentTerm ?? defaults.payment_term_days,
        source_type: "FROM_ORDER", document_type: "INVOICE",
        source_order_id: order.id, source_order_number: order.order_number, source_order_date: order.order_date,
        customer_id: linked.customer.customerId,
        customer_ref_kind: null, customer_firm_id: null,
        customer_project_id: null, project_id: order.project_id, service_reference: order.service_reference,
      });
      return this.repository.createDraft({ ...header, positions: snapshot.positions, construction_project: "", intro_text: normalizeIntroText(input.intro_text) }, snapshot);
    });
  }

  async updateDraft(id, input = {}) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const current = this.repository.get(id);
    if (!current) throw new Error("Rechnung wurde nicht gefunden.");
    if (current.status !== "DRAFT") throw new Error("Gebuchte Rechnungen können nicht geändert werden.");
    assertOrderSnapshotInput(current, input);
    const nextCustomerId = input.customer_id ?? current.customer_id;
    if (nextCustomerId) this._customerSnapshot(nextCustomerId);
    return this.repository.updateDraft(id, { ...rules.normalizeInvoiceHeader({ ...current, ...input }), construction_project: String(input.construction_project ?? current.construction_project ?? "").trim(), intro_text: normalizeIntroText(input.intro_text ?? current.intro_text), positions: current.order_binding_state === "BOUND" ? current.positions : positions.normalizeInvoicePositions(input.positions ?? current.positions ?? []) });
  }

  deleteDraft(id) { return this.repository.deleteDraft(id); }

  async previewDraft(id, input = null) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const current = this.repository.get(id);
    if (!current) throw new Error("Rechnung wurde nicht gefunden.");
    if (current.status !== "DRAFT") return current;
    assertOrderSnapshotInput(current, input || {});
    const preview = { ...current, ...rules.normalizeInvoiceHeader({ ...current, ...(input || {}) }), construction_project: String(input?.construction_project ?? current.construction_project ?? "").trim(), intro_text: normalizeIntroText(input?.intro_text ?? current.intro_text), positions: current.order_binding_state === "BOUND" ? current.positions : positions.normalizeInvoicePositions(input?.positions ?? current.positions ?? []), invoice_number: null, status: "DRAFT", preview: true, preview_identifier: rules.draftPreviewIdentifier(current.id) };
    const customerSnapshot = preview.customer_id ? this._customerSnapshot(preview.customer_id, { requireComplete: true }) : null;
    return { ...preview, ...this.repository.buildPreviewSnapshots(preview, customerSnapshot) };
  }

  async bookDraft(id, input = {}) {
    const rules = await loadRules();
    const positions = await loadPositions();
    const current = this.repository.get(id);
    if (!current) throw new Error("Rechnung wurde nicht gefunden.");
    if (current.status !== "DRAFT") throw new Error("Nur Entwürfe können gebucht werden.");
    assertOrderSnapshotInput(current, input);
    const header = { ...rules.normalizeInvoiceHeader({ ...current, ...input }, { requireBookingFields: true }), construction_project: String(input.construction_project ?? current.construction_project ?? "").trim(), intro_text: normalizeIntroText(input.intro_text ?? current.intro_text), positions: current.order_binding_state === "BOUND" ? current.positions : positions.normalizeInvoicePositions(input.positions ?? current.positions ?? []) };
    const customerSnapshot = header.customer_id ? this._customerSnapshot(header.customer_id, { requireComplete: true }) : null;
    return this.repository.bookDraft(id, header, { customerSnapshot });
  }
}

let singleton;
function getInvoiceService() {
  if (!singleton) singleton = new InvoiceService();
  return singleton;
}

module.exports = { InvoiceService, getInvoiceService };
