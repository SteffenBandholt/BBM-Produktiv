import {
  normalizeCustomerRecord,
  normalizeLicenseRecord,
  normalizeLicenseHistoryRecord,
} from "./licenseRecords.js";

function getLicenseAdminDbApi() {
  const api = globalThis?.window?.bbmDb;
  if (!api) {
    throw new Error(
      "Lizenzverwaltung: Preload-API nicht verfügbar (window.bbmDb fehlt). Speicherung nicht möglich."
    );
  }
  return api;
}

function requireApiMethod(methodName) {
  const api = getLicenseAdminDbApi();
  const method = api[methodName];
  if (typeof method !== "function") {
    throw new Error(`Lizenzverwaltung: Preload-API-Methode fehlt (${methodName}).`);
  }
  return method;
}

export async function listCustomers() {
  const list = requireApiMethod("licenseAdminListLicenseCustomers");
  return list();
}

export async function saveCustomer(customer) {
  const record = normalizeCustomerRecord(customer);
  const save = requireApiMethod("licenseAdminSaveLicenseCustomer");
  return save(record);
}

export async function listLicenses() {
  const list = requireApiMethod("licenseAdminListLicenseRecords");
  return list();
}

export async function saveLicense(license) {
  const record = normalizeLicenseRecord(license);
  const customerId = String(record.customerId || record.customer_id || "").trim();
  if (!customerId) {
    throw new Error("Lizenzverwaltung: customer_id/customerId fehlt.");
  }
  const payload = {
    ...record,
    customerId,
    customer_id: customerId,
    product_scope_json: record.productScope,
    valid_until: record.validUntil,
    license_mode: record.licenseMode,
  };
  const save = requireApiMethod("licenseAdminSaveLicenseRecord");
  return save(payload);
}

export async function listHistory() {
  const list = requireApiMethod("licenseAdminListLicenseHistory");
  return list();
}

export async function addHistoryEntry(entry) {
  const record = normalizeLicenseHistoryRecord(entry);
  const add = requireApiMethod("licenseAdminAddLicenseHistoryEntry");
  return add(record);
}
