"use strict";

const { getFirmDirectoryService } = require("../firms/FirmDirectoryService");
const { normalizeFirmRef, FIRM_KINDS } = require("../firms/firmReference");
const { getBbmCustomerCore } = require("./customerCoreProvider");
const { DUPLICATE_STATUS } = require("../../../customer-core");

const SYSTEM_CODE = "BBM";

const FIRM_TO_CUSTOMER = Object.freeze({
  name1: "name",
  name2: "name2",
  street: "street",
  postalCode: "zip",
  city: "city",
  email: "email",
  phone: "phone",
});

const CUSTOMER_TO_FIRM = Object.freeze({
  name: "name1",
  name2: "name2",
  street: "street",
  zip: "postalCode",
  city: "city",
  email: "email",
  phone: "phone",
});

function cleanText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function compareValue(value) {
  return String(value ?? "").trim();
}

function normalizeFieldList(fields, allowed) {
  if (!Array.isArray(fields) || fields.length === 0) return [...allowed];
  const unique = [];
  for (const raw of fields) {
    const key = String(raw || "").trim();
    if (allowed.has(key) && !unique.includes(key)) unique.push(key);
  }
  return unique;
}

class CustomerFirmBridgeService {
  constructor({
    firmDirectory = getFirmDirectoryService(),
    customerCore = getBbmCustomerCore(),
  } = {}) {
    this.firmDirectory = firmDirectory;
    this.customerCore = customerCore;
    this.customerService = customerCore.service;
    this.customerRepository = customerCore.repository;
  }

  _firm(refInput) {
    const ref = normalizeFirmRef(refInput, {
      projectId: refInput?.projectId || refInput?.project_id,
    });
    const firm = this.firmDirectory.get(ref);
    if (!firm) {
      const error = new Error("firm not found");
      error.code = "FIRM_NOT_FOUND";
      throw error;
    }
    return { ref, firm };
  }

  _customer(customerId, { requireActive = false } = {}) {
    const id = String(customerId || "").trim();
    if (!id) throw new Error("customerId required");
    const customer = this.customerService.getCustomer(id);
    if (!customer) {
      const error = new Error("customer not found");
      error.code = "CUSTOMER_NOT_FOUND";
      throw error;
    }
    if (requireActive && customer.status !== "ACTIVE") {
      const error = new Error("customer is archived");
      error.code = "CUSTOMER_ARCHIVED";
      throw error;
    }
    return customer;
  }

  _linkForFirm(ref) {
    return this.customerRepository.getLinkByExternalRef({
      systemCode: SYSTEM_CODE,
      entityType: ref.kind,
      entityId: ref.id,
    });
  }

  _customerDataFromFirm(firm, fields) {
    const allowed = new Set(Object.keys(FIRM_TO_CUSTOMER));
    const selected = normalizeFieldList(fields, allowed);
    const data = {};
    for (const customerField of selected) {
      const firmField = FIRM_TO_CUSTOMER[customerField];
      data[customerField] = cleanText(firm?.[firmField]);
    }
    if (selected.includes("name1") && !data.name1) {
      throw new Error("firm name required for customer");
    }
    return data;
  }

  _firmDataFromCustomer(customer, fields) {
    const allowed = new Set(Object.keys(CUSTOMER_TO_FIRM));
    const selected = normalizeFieldList(fields, allowed);
    const data = {};
    for (const firmField of selected) {
      const customerField = CUSTOMER_TO_FIRM[firmField];
      data[firmField] = cleanText(customer?.[customerField]);
    }
    if (selected.includes("name") && !data.name) {
      throw new Error("customer name required for firm");
    }
    return data;
  }

  getLinkedCustomer(refInput) {
    const { ref, firm } = this._firm(refInput);
    const link = this._linkForFirm(ref);
    const customer = link ? this.customerService.getCustomer(link.customerId) : null;
    return { ref, firm, link, customer };
  }

  prepareFirmAsCustomer({ ref: refInput, fields, overrides = {} } = {}) {
    const current = this.getLinkedCustomer(refInput);
    const mapped = this._customerDataFromFirm(current.firm, fields);
    const proposed = {
      ...mapped,
      ...overrides,
      countryCode: overrides.countryCode || "DE",
      sourceCode: "BBM",
    };

    const candidates = current.link
      ? []
      : this.customerService.findDuplicates(proposed, { includeArchived: true });
    const duplicateState = Object.freeze({
      status: current.link
        ? DUPLICATE_STATUS.ALREADY_LINKED
        : candidates.length
          ? DUPLICATE_STATUS.POSSIBLE_MATCH
          : DUPLICATE_STATUS.NO_MATCH,
      linkedCustomer: current.customer || null,
      candidates: Object.freeze(candidates),
    });

    return {
      ...current,
      proposed,
      duplicateState,
    };
  }

  createCustomerFromFirm({
    ref: refInput,
    fields,
    overrides = {},
    confirmCreateDespiteCandidates = false,
  } = {}) {
    const prepared = this.prepareFirmAsCustomer({ ref: refInput, fields, overrides });
    if (prepared.link) {
      const error = new Error("firm is already linked to a customer");
      error.code = "CUSTOMER_LINK_EXISTS";
      error.customerId = prepared.link.customerId;
      error.duplicateState = prepared.duplicateState;
      throw error;
    }

    if (
      prepared.duplicateState.status === DUPLICATE_STATUS.POSSIBLE_MATCH &&
      confirmCreateDespiteCandidates !== true
    ) {
      const error = new Error("possible customer duplicate requires explicit review");
      error.code = "CUSTOMER_DUPLICATE_REVIEW_REQUIRED";
      error.candidates = prepared.duplicateState.candidates;
      error.duplicateState = prepared.duplicateState;
      throw error;
    }

    const customer = this.customerService.createCustomer({
      ...prepared.proposed,
      sourceCode: "BBM",
    });

    try {
      const link = this.customerService.createLink(customer.customerId, {
        systemCode: SYSTEM_CODE,
        entityType: prepared.ref.kind,
        entityId: prepared.ref.id,
      });
      return { customer, link, firm: prepared.firm };
    } catch (error) {
      this.customerService.deleteCustomerIfUnused(customer.customerId);
      throw error;
    }
  }

  linkFirmToCustomer({ ref: refInput, customerId } = {}) {
    const { ref, firm } = this._firm(refInput);
    const customer = this._customer(customerId, { requireActive: true });
    const existing = this._linkForFirm(ref);
    if (existing) {
      if (existing.customerId === customer.customerId) {
        return { firm, customer, link: existing, alreadyLinked: true };
      }
      const error = new Error("firm is already linked to another customer");
      error.code = "CUSTOMER_LINK_CONFLICT";
      error.customerId = existing.customerId;
      throw error;
    }
    const link = this.customerService.createLink(customer.customerId, {
      systemCode: SYSTEM_CODE,
      entityType: ref.kind,
      entityId: ref.id,
    });
    return { firm, customer, link, alreadyLinked: false };
  }

  compareFirmAndCustomer({ ref: refInput, customerId } = {}) {
    const { ref, firm } = this._firm(refInput);
    const linked = this._linkForFirm(ref);
    const targetId = String(customerId || linked?.customerId || "").trim();
    const customer = this._customer(targetId);

    const fields = Object.entries(FIRM_TO_CUSTOMER).map(([customerField, firmField]) => {
      const firmValue = cleanText(firm?.[firmField]);
      const customerValue = cleanText(customer?.[customerField]);
      return Object.freeze({
        field: customerField,
        firmField,
        firmValue,
        customerValue,
        equal: compareValue(firmValue) === compareValue(customerValue),
      });
    });

    return {
      ref,
      firm,
      customer,
      link: linked,
      fields,
      hasDifferences: fields.some((entry) => !entry.equal),
    };
  }

  applyFirmFieldsToCustomer({
    ref: refInput,
    customerId,
    fields,
    expectedRevision,
  } = {}) {
    const comparison = this.compareFirmAndCustomer({ ref: refInput, customerId });
    if (comparison.link && comparison.link.customerId !== comparison.customer.customerId) {
      const error = new Error("firm is linked to another customer");
      error.code = "CUSTOMER_LINK_CONFLICT";
      throw error;
    }

    const selected = normalizeFieldList(fields, new Set(Object.keys(FIRM_TO_CUSTOMER)));
    if (!selected.length) return comparison.customer;
    const patch = this._customerDataFromFirm(comparison.firm, selected);
    return this.customerService.updateCustomer(
      comparison.customer.customerId,
      patch,
      { expectedRevision }
    );
  }

  createGlobalFirmFromCustomer({ customerId, fields } = {}) {
    const customer = this._customer(customerId, { requireActive: true });
    const data = this._firmDataFromCustomer(customer, fields);
    const firm = this.firmDirectory.create({
      origin: "firms",
      data,
      uses: { projectParticipant: 0, customer: 0 },
    });
    try {
      const link = this.customerService.createLink(customer.customerId, {
        systemCode: SYSTEM_CODE,
        entityType: FIRM_KINDS.GLOBAL,
        entityId: firm.id,
      });
      return { customer, firm, link };
    } catch (error) {
      // A created BBM firm is not silently deleted here. That would be a cross-database
      // rollback illusion. Surface the partial result explicitly for controlled recovery.
      error.createdFirm = firm;
      throw error;
    }
  }

  listCustomers(options = {}) {
    return this.customerService.listCustomers(options);
  }

  getCustomer(customerId) {
    return this._customer(customerId);
  }
}

let singleton = null;
function getCustomerFirmBridgeService() {
  if (!singleton) singleton = new CustomerFirmBridgeService();
  return singleton;
}

module.exports = {
  SYSTEM_CODE,
  FIRM_TO_CUSTOMER,
  CUSTOMER_TO_FIRM,
  CustomerFirmBridgeService,
  getCustomerFirmBridgeService,
};
