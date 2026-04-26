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

export const LICENSE_HISTORY_FIELDS = Object.freeze([
  Object.freeze({ key: "createdAt", label: "erzeugt am", required: true }),
  Object.freeze({ key: "licenseId", label: "Lizenz-ID", required: true }),
  Object.freeze({ key: "customer", label: "Kunde", required: true }),
  Object.freeze({ key: "productScope", label: "Produktumfang", required: true }),
  Object.freeze({ key: "validUntil", label: "gueltig bis", required: true }),
  Object.freeze({ key: "outputPath", label: "Datei / Ausgabeort", required: true }),
  Object.freeze({ key: "notes", label: "Notizen", required: false }),
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
    customerId: "",
    customer_id: "",
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

export function createDefaultLicenseHistoryRecord(overrides = {}) {
  return {
    createdAt: "",
    licenseId: "",
    customer: "",
    productScope: "",
    validUntil: "",
    outputPath: "",
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
  const rawProductScope = input.productScope ?? input.product_scope_json ?? base.productScope;
  let productScopeInput = rawProductScope;
  if (typeof productScopeInput === "string") {
    const trimmed = productScopeInput.trim();
    if (trimmed) {
      try {
        productScopeInput = JSON.parse(trimmed);
      } catch (_error) {
        productScopeInput = { _display: trimmed };
      }
    } else {
      productScopeInput = {};
    }
  }
  const productScope = {
    standardumfang: Array.isArray(productScopeInput?.standardumfang)
      ? [...productScopeInput.standardumfang]
      : [...base.productScope.standardumfang],
    zusatzfunktionen: Array.isArray(productScopeInput?.zusatzfunktionen)
      ? [...productScopeInput.zusatzfunktionen]
      : [...base.productScope.zusatzfunktionen],
    module: Array.isArray(productScopeInput?.module)
      ? [...productScopeInput.module]
      : [...base.productScope.module],
    _display: String(productScopeInput?._display ?? "").trim(),
  };
  const customerId = String(input.customerId ?? input.customer_id ?? base.customerId).trim();
  const validFrom = String(input.validFrom ?? input.valid_from ?? base.validFrom).trim();
  const validUntil = String(input.validUntil ?? input.valid_until ?? base.validUntil).trim();
  const licenseMode = String(input.licenseMode ?? input.license_mode ?? normalizedMode).trim().toLowerCase();
  const normalizedLicenseMode = LICENSE_MODES.some((entry) => entry.key === licenseMode)
    ? licenseMode
    : base.licenseMode;

  return {
    licenseId: String(input.licenseId ?? base.licenseId).trim(),
    customerId,
    customer_id: customerId,
    customerNumber: String(input.customerNumber ?? base.customerNumber).trim(),
    productScope,
    product_scope_json: productScope,
    validFrom,
    valid_from: validFrom,
    validUntil,
    valid_until: validUntil,
    licenseMode: normalizedLicenseMode,
    license_mode: normalizedLicenseMode,
    machineId: String(input.machineId ?? base.machineId).trim(),
    notes: String(input.notes ?? base.notes).trim(),
  };
}

export function normalizeLicenseHistoryRecord(input = {}) {
  const base = createDefaultLicenseHistoryRecord();
  return {
    createdAt: String(input.createdAt ?? base.createdAt).trim(),
    licenseId: String(input.licenseId ?? base.licenseId).trim(),
    customer: String(input.customer ?? base.customer).trim(),
    productScope: String(input.productScope ?? base.productScope).trim(),
    validUntil: String(input.validUntil ?? base.validUntil).trim(),
    outputPath: String(input.outputPath ?? base.outputPath).trim(),
    notes: String(input.notes ?? base.notes).trim(),
  };
}
