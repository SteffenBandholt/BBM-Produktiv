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

export async function listLicensesByCustomer(customerId) {
  const list = requireApiMethod("licenseAdminListLicenseRecordsByCustomer");
  return list(String(customerId || "").trim());
}

export async function saveLicense(license) {
  const record = normalizeLicenseRecord(license);
  const save = requireApiMethod("licenseAdminSaveLicenseRecord");
  return save(record);
}


export async function deleteCustomer(customerOrId, options = {}) {
  const rawId = typeof customerOrId === "string" ? customerOrId : customerOrId?.id;
  const id = String(rawId || "").trim();
  const del = requireApiMethod("licenseAdminDeleteLicenseCustomer");
  return del({ id, ...options });
}

export async function deleteLicense(record) {
  const id = String(record?.id || "").trim();
  const del = requireApiMethod("licenseAdminDeleteLicenseRecord");
  return del(id);
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

export async function createCustomerSetup(payload) {
  const create = requireApiMethod("licenseAdminCreateCustomerSetup");
  return create(payload || {});
}

export async function sendResponseLicenseMail(payload) {
  const send = requireApiMethod("licenseAdminSendResponseLicenseMail");
  return send(payload || {});
}
