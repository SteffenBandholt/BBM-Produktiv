const { InvoiceIssuerProfileRepository } = require("../../db/invoiceIssuerProfileRepo");
const { InvoiceServiceCatalogRepository } = require("../../db/invoiceServiceCatalogRepo");

class InvoiceMasterDataService {
  constructor({ issuerRepository = new InvoiceIssuerProfileRepository(), catalogRepository = new InvoiceServiceCatalogRepository() } = {}) { this.issuerRepository = issuerRepository; this.catalogRepository = catalogRepository; }
  getIssuerProfile() { return this.issuerRepository.get(); }
  saveIssuerProfile(input) { return this.issuerRepository.upsert(input); }
  listCatalog() { return this.catalogRepository.list(); }
  createCatalogEntry(input) { return this.catalogRepository.create(input); }
  updateCatalogEntry({ id, entry } = {}) { return this.catalogRepository.update(id, entry); }
}

let singleton;
function getInvoiceMasterDataService() { if (!singleton) singleton = new InvoiceMasterDataService(); return singleton; }
module.exports = { InvoiceMasterDataService, getInvoiceMasterDataService };
