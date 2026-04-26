import {
  normalizeCustomerRecord,
  normalizeLicenseRecord,
  normalizeLicenseHistoryRecord,
} from "./licenseRecords.js";

const storage = {
  customers: [],
  licenses: [],
  history: [],
};

export async function listCustomers() {
  return [...storage.customers];
}

export async function saveCustomer(customer) {
  const record = normalizeCustomerRecord(customer);
  storage.customers.push(record);
  return record;
}

export async function listLicenses() {
  return [...storage.licenses];
}

export async function saveLicense(license) {
  const record = normalizeLicenseRecord(license);
  storage.licenses.push(record);
  return record;
}

export async function listHistory() {
  return [...storage.history];
}

export async function addHistoryEntry(entry) {
  const record = normalizeLicenseHistoryRecord(entry);
  storage.history.push(record);
  return record;
}
