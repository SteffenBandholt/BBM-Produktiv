export const CUSTOMER_RECORD_FIELDS = Object.freeze([
  Object.freeze({ key: "customerNumber", label: "Kundennummer", required: true }),
  Object.freeze({ key: "companyName", label: "Firma / Kundenname", required: true }),
  Object.freeze({ key: "contactPerson", label: "Ansprechpartner", required: true }),
  Object.freeze({ key: "email", label: "E-Mail", required: true }),
  Object.freeze({ key: "phone", label: "Telefon", required: false }),
  Object.freeze({ key: "notes", label: "Notizen", required: false }),
]);

export const LICENSE_RECORD_FIELDS = Object.freeze([
  Object.freeze({ key: "licenseId", label: "Lizenz-ID", required: true }),
  Object.freeze({ key: "customerNumber", label: "Kunde", required: true }),
  Object.freeze({ key: "productScope", label: "Produktumfang", required: true }),
  Object.freeze({ key: "validFrom", label: "gueltig von", required: true }),
  Object.freeze({ key: "validUntil", label: "gueltig bis", required: true }),
  Object.freeze({ key: "licenseMode", label: "Lizenzmodus", required: true }),
  Object.freeze({ key: "machineId", label: "Machine-ID", required: false }),
  Object.freeze({ key: "notes", label: "Notizen", required: false }),
]);

export const LICENSE_MODES = Object.freeze([
  Object.freeze({ key: "soft", label: "Soft-Lizenz" }),
  Object.freeze({ key: "full", label: "Vollversion" }),
]);

export function createDefaultCustomerRecord(overrides = {}) {
  return {
    customerNumber: "",
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    notes: "",
    ...overrides,
  };
}

export function createDefaultLicenseRecord(overrides = {}) {
  return {
    licenseId: "",
    customerNumber: "",
    productScope: {
      standardumfang: [],
      zusatzfunktionen: [],
      module: [],
    },
    validFrom: "",
    validUntil: "",
    licenseMode: "soft",
    machineId: "",
    notes: "",
    ...overrides,
  };
}

export function normalizeCustomerRecord(input = {}) {
  const base = createDefaultCustomerRecord();
  return {
    customerNumber: String(input.customerNumber ?? base.customerNumber).trim(),
    companyName: String(input.companyName ?? base.companyName).trim(),
    contactPerson: String(input.contactPerson ?? base.contactPerson).trim(),
    email: String(input.email ?? base.email).trim(),
    phone: String(input.phone ?? base.phone).trim(),
    notes: String(input.notes ?? base.notes).trim(),
  };
}

export function normalizeLicenseRecord(input = {}) {
  const base = createDefaultLicenseRecord();
  const mode = String(input.licenseMode ?? base.licenseMode).trim().toLowerCase();
  const normalizedMode = LICENSE_MODES.some((entry) => entry.key === mode) ? mode : base.licenseMode;

  return {
    licenseId: String(input.licenseId ?? base.licenseId).trim(),
    customerNumber: String(input.customerNumber ?? base.customerNumber).trim(),
    productScope: {
      standardumfang: Array.isArray(input?.productScope?.standardumfang)
        ? [...input.productScope.standardumfang]
        : [...base.productScope.standardumfang],
      zusatzfunktionen: Array.isArray(input?.productScope?.zusatzfunktionen)
        ? [...input.productScope.zusatzfunktionen]
        : [...base.productScope.zusatzfunktionen],
      module: Array.isArray(input?.productScope?.module)
        ? [...input.productScope.module]
        : [...base.productScope.module],
    },
    validFrom: String(input.validFrom ?? base.validFrom).trim(),
    validUntil: String(input.validUntil ?? base.validUntil).trim(),
    licenseMode: normalizedMode,
    machineId: String(input.machineId ?? base.machineId).trim(),
    notes: String(input.notes ?? base.notes).trim(),
  };
}
