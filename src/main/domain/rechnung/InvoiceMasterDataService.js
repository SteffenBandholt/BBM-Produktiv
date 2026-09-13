const { InvoiceServiceCatalogRepository } = require("../../db/invoiceServiceCatalogRepo");

let positionsPromise;
function centralVatRate() {
  if (!positionsPromise) positionsPromise = import("../../../shared/rechnung/rechnungPositions.mjs");
  return positionsPromise.then((rules) => rules.DEFAULT_VAT_RATE_PERCENT);
}

class InvoiceMasterDataService {
  constructor({ catalogRepository = new InvoiceServiceCatalogRepository(), vatRateProvider = centralVatRate } = {}) { this.catalogRepository = catalogRepository; this.vatRateProvider = vatRateProvider; }
  listCatalog() { return this.catalogRepository.list(); }
  async getCatalogDefaults() { return { vatRatePercent: await this.vatRateProvider() }; }
  async createCatalogEntry(input) { return this.catalogRepository.create({ ...input, vatRatePercent: await this.vatRateProvider() }); }
  async updateCatalogEntry({ id, entry } = {}) { return this.catalogRepository.update(id, { ...entry, vatRatePercent: await this.vatRateProvider() }); }
}

let singleton;
function getInvoiceMasterDataService() { if (!singleton) singleton = new InvoiceMasterDataService(); return singleton; }
module.exports = { InvoiceMasterDataService, getInvoiceMasterDataService };
