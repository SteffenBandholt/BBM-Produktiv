const { randomUUID } = require("node:crypto");
const { CustomerRepository } = require("./repository");
const { findDuplicateCandidates } = require("./dedup");

const CUSTOMER_STATUSES = Object.freeze(["ACTIVE", "ARCHIVED"]);
const CUSTOMER_SOURCE_CODES = Object.freeze(["MANUAL", "BBM", "IMPORT", "MIGRATION"]);

function requiredText(value, field) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} required`);
  return text;
}

function optionalText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeCountryCode(value) {
  const code = requiredText(value, "countryCode").toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) throw new Error("countryCode must be ISO-2");
  return code;
}

function normalizeSourceCode(value) {
  const code = String(value || "MANUAL").trim().toUpperCase();
  if (!CUSTOMER_SOURCE_CODES.includes(code)) throw new Error("invalid sourceCode");
  return code;
}

function normalizePaymentTerm(value) {
  if (value === undefined || value === null || value === "") return null;
  const days = Number(value);
  if (!Number.isInteger(days) || days < 0 || days > 365) {
    throw new Error("defaultPaymentTermDays must be an integer between 0 and 365");
  }
  return days;
}

class CustomerService {
  constructor({ db, repository } = {}) {
    this.repository = repository || new CustomerRepository({ db });
  }

  createCustomer(data = {}) {
    const normalizedName1 = requiredText(data.name1, "name1");
    const normalizedCountryCode = normalizeCountryCode(data.countryCode);
    const normalizedSourceCode = normalizeSourceCode(data.sourceCode);
    const normalizedPaymentTerm = normalizePaymentTerm(data.defaultPaymentTermDays);
    const now = new Date().toISOString();
    const customerId = randomUUID();
    const customerNumber = this.repository.allocateCustomerNumber();
    return this.repository.createCustomer({
      customer_id: customerId,
      customer_number: customerNumber,
      status: "ACTIVE",
      source_code: normalizedSourceCode,
      name1: normalizedName1,
      name2: optionalText(data.name2),
      street: optionalText(data.street),
      postal_code: optionalText(data.postalCode),
      city: optionalText(data.city),
      country_code: normalizedCountryCode,
      email: optionalText(data.email),
      phone: optionalText(data.phone),
      vat_id: optionalText(data.vatId),
      billing_name1: optionalText(data.billingName1),
      billing_name2: optionalText(data.billingName2),
      billing_street: optionalText(data.billingStreet),
      billing_postal_code: optionalText(data.billingPostalCode),
      billing_city: optionalText(data.billingCity),
      billing_country_code: data.billingCountryCode ? normalizeCountryCode(data.billingCountryCode) : null,
      billing_email: optionalText(data.billingEmail),
      default_payment_term_days: normalizedPaymentTerm,
      language_code: optionalText(data.languageCode),
      internal_note: optionalText(data.internalNote),
      revision: 1,
      created_at: now,
      updated_at: now,
      archived_at: null,
    });
  }

  getCustomer(customerId) {
    return this.repository.getCustomer(requiredText(customerId, "customerId"));
  }

  listCustomers(options = {}) {
    return this.repository.listCustomers(options);
  }

  findDuplicates(data = {}, { includeArchived = true } = {}) {
    const customers = this.repository.listCustomers({ includeArchived });
    return findDuplicateCandidates(data, customers);
  }

  updateCustomer(customerId, patch = {}, { expectedRevision } = {}) {
    const normalized = { ...patch };
    if (Object.prototype.hasOwnProperty.call(normalized, "name1")) {
      normalized.name1 = requiredText(normalized.name1, "name1");
    }
    if (Object.prototype.hasOwnProperty.call(normalized, "countryCode")) {
      normalized.countryCode = normalizeCountryCode(normalized.countryCode);
    }
    if (Object.prototype.hasOwnProperty.call(normalized, "billingCountryCode")) {
      normalized.billingCountryCode = normalized.billingCountryCode
        ? normalizeCountryCode(normalized.billingCountryCode)
        : null;
    }
    if (Object.prototype.hasOwnProperty.call(normalized, "sourceCode")) {
      normalized.sourceCode = normalizeSourceCode(normalized.sourceCode);
    }
    if (Object.prototype.hasOwnProperty.call(normalized, "defaultPaymentTermDays")) {
      normalized.defaultPaymentTermDays = normalizePaymentTerm(normalized.defaultPaymentTermDays);
    }
    return this.repository.updateCustomer(requiredText(customerId, "customerId"), normalized, { expectedRevision });
  }

  archiveCustomer(customerId) {
    const customer = this.getCustomer(customerId);
    if (!customer) return null;
    if (customer.status === "ARCHIVED") return customer;
    return this.repository.setArchived(customerId, true);
  }

  reactivateCustomer(customerId) {
    const customer = this.getCustomer(customerId);
    if (!customer) return null;
    if (customer.status === "ACTIVE") return customer;
    return this.repository.setArchived(customerId, false);
  }

  resolveBillingProfile(customerId) {
    const customer = this.getCustomer(customerId);
    if (!customer) return null;
    const usesBillingAddress = Boolean(
      customer.billingName1 ||
      customer.billingName2 ||
      customer.billingStreet ||
      customer.billingPostalCode ||
      customer.billingCity ||
      customer.billingCountryCode
    );
    return {
      customerId: customer.customerId,
      customerNumber: customer.customerNumber,
      name1: usesBillingAddress ? (customer.billingName1 || customer.name1) : customer.name1,
      name2: usesBillingAddress ? customer.billingName2 : customer.name2,
      street: usesBillingAddress ? (customer.billingStreet || customer.street) : customer.street,
      postalCode: usesBillingAddress ? (customer.billingPostalCode || customer.postalCode) : customer.postalCode,
      city: usesBillingAddress ? (customer.billingCity || customer.city) : customer.city,
      countryCode: usesBillingAddress ? (customer.billingCountryCode || customer.countryCode) : customer.countryCode,
      email: customer.billingEmail || customer.email,
      vatId: customer.vatId,
      revision: customer.revision,
      resolvedAt: new Date().toISOString(),
    };
  }

  createContact(customerId, data = {}) {
    const customer = this.getCustomer(customerId);
    if (!customer) throw new Error("customer not found");
    const now = new Date().toISOString();
    try {
      return this.repository.createContact({
        id: randomUUID(),
        customer_id: customerId,
        salutation: optionalText(data.salutation),
        first_name: optionalText(data.firstName),
        last_name: optionalText(data.lastName),
        position: optionalText(data.position),
        email: optionalText(data.email),
        phone: optionalText(data.phone),
        mobile: optionalText(data.mobile),
        is_primary: data.isPrimary ? 1 : 0,
        is_billing_contact: data.isBillingContact ? 1 : 0,
        is_license_contact: data.isLicenseContact ? 1 : 0,
        is_active: data.isActive === false ? 0 : 1,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (/idx_customer_contacts_one_active_primary|UNIQUE constraint failed/.test(String(error?.message || error))) {
        const mapped = new Error("customer already has an active primary contact");
        mapped.code = "CUSTOMER_PRIMARY_CONTACT_EXISTS";
        throw mapped;
      }
      throw error;
    }
  }

  updateContact(id, patch = {}) {
    try {
      return this.repository.updateContact(requiredText(id, "contactId"), patch);
    } catch (error) {
      if (/idx_customer_contacts_one_active_primary|UNIQUE constraint failed/.test(String(error?.message || error))) {
        const mapped = new Error("customer already has an active primary contact");
        mapped.code = "CUSTOMER_PRIMARY_CONTACT_EXISTS";
        throw mapped;
      }
      throw error;
    }
  }

  listContacts(customerId, options = {}) {
    return this.repository.listContacts(requiredText(customerId, "customerId"), options);
  }

  deleteContact(id) {
    return this.repository.deleteContact(requiredText(id, "contactId"));
  }

  createLink(customerId, { systemCode, entityType, entityId } = {}) {
    if (!this.getCustomer(customerId)) throw new Error("customer not found");
    const now = new Date().toISOString();
    try {
      return this.repository.createLink({
        id: randomUUID(),
        customer_id: customerId,
        system_code: requiredText(systemCode, "systemCode").toUpperCase(),
        entity_type: requiredText(entityType, "entityType"),
        entity_id: requiredText(entityId, "entityId"),
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (/UNIQUE constraint failed/.test(String(error?.message || error))) {
        const mapped = new Error("external entity already linked to a customer");
        mapped.code = "CUSTOMER_LINK_CONFLICT";
        throw mapped;
      }
      throw error;
    }
  }

  listLinks(customerId) {
    return this.repository.listLinks(requiredText(customerId, "customerId"));
  }

  deleteLink(id) {
    return this.repository.deleteLink(requiredText(id, "linkId"));
  }

  deleteCustomerIfUnused(customerId, { externalReferenceCount = 0 } = {}) {
    const id = requiredText(customerId, "customerId");
    const customer = this.getCustomer(id);
    if (!customer) return { deleted: 0, reason: "not_found" };
    if (Number(externalReferenceCount) > 0) {
      return { deleted: 0, reason: "external_references" };
    }
    if (this.listLinks(id).length > 0) {
      return { deleted: 0, reason: "linked" };
    }
    return { deleted: this.repository.deleteCustomer(id), reason: null };
  }
}

module.exports = {
  CustomerService,
  CUSTOMER_STATUSES,
  CUSTOMER_SOURCE_CODES,
  normalizeCountryCode,
  normalizeSourceCode,
};
