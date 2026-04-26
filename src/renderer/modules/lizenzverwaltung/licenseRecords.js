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
    customer_number: "",
    companyName: "",
    company_name: "",
    contactPerson: "",
    contact_person: "",
    email: "",
    phone: "",
    notes: "",
    ...overrides,
  };
}

export function createDefaultLicenseRecord(overrides = {}) {
  return {
    licenseId: "",
    license_id: "",
    customerId: "",
    customer_id: "",
    customerNumber: "",
    productScope: {
      standardumfang: [],
      zusatzfunktionen: [],
      module: [],
    },
    product_scope_json: "",
    validFrom: "",
    valid_from: "",
    validUntil: "",
    valid_until: "",
    licenseMode: "soft",
    license_mode: "soft",
    machineId: "",
    machine_id: "",
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
  const customerNumber = String(input.customerNumber ?? input.customer_number ?? base.customerNumber).trim();
  const companyName = String(input.companyName ?? input.company_name ?? base.companyName).trim();
  const contactPerson = String(input.contactPerson ?? input.contact_person ?? base.contactPerson).trim();
  const email = String(input.email ?? base.email).trim();
  const phone = String(input.phone ?? base.phone).trim();
  const notes = String(input.notes ?? base.notes).trim();

  return {
    customerNumber,
    customer_number: customerNumber,
    companyName,
    company_name: companyName,
    contactPerson,
    contact_person: contactPerson,
    email,
    phone,
    notes,
  };
}

function normalizeProductScope(inputProductScope, inputProductScopeJson, baseProductScope) {
  if (typeof inputProductScopeJson === "string") {
    const trimmed = inputProductScopeJson.trim();
    if (!trimmed) return { ...baseProductScope };
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") return parsed;
      return { raw: trimmed };
    } catch (_err) {
      return { raw: trimmed };
    }
  }

  if (inputProductScopeJson && typeof inputProductScopeJson === "object") {
    return inputProductScopeJson;
  }

  if (typeof inputProductScope === "string") {
    const trimmed = inputProductScope.trim();
    if (!trimmed) return { ...baseProductScope };
    return { raw: trimmed };
  }

  if (inputProductScope && typeof inputProductScope === "object") {
    return {
      standardumfang: Array.isArray(inputProductScope.standardumfang)
        ? [...inputProductScope.standardumfang]
        : [...(baseProductScope.standardumfang || [])],
      zusatzfunktionen: Array.isArray(inputProductScope.zusatzfunktionen)
        ? [...inputProductScope.zusatzfunktionen]
        : [...(baseProductScope.zusatzfunktionen || [])],
      module: Array.isArray(inputProductScope.module)
        ? [...inputProductScope.module]
        : [...(baseProductScope.module || [])],
      ...(inputProductScope.raw ? { raw: String(inputProductScope.raw) } : {}),
    };
  }

  return { ...baseProductScope };
}

export function normalizeLicenseRecord(input = {}) {
  const base = createDefaultLicenseRecord();

  const licenseId = String(input.licenseId ?? input.license_id ?? base.licenseId).trim();
  const customerId = String(input.customerId ?? input.customer_id ?? base.customerId).trim();
  const validFrom = String(input.validFrom ?? input.valid_from ?? base.validFrom).trim();
  const validUntil = String(input.validUntil ?? input.valid_until ?? base.validUntil).trim();
  const machineId = String(input.machineId ?? input.machine_id ?? base.machineId).trim();
  const modeRaw = String(input.licenseMode ?? input.license_mode ?? base.licenseMode).trim().toLowerCase();
  const normalizedMode = LICENSE_MODES.some((entry) => entry.key === modeRaw) ? modeRaw : base.licenseMode;
  const productScope = normalizeProductScope(input.productScope, input.product_scope_json, base.productScope);

  return {
    licenseId,
    license_id: licenseId,
    customerId,
    customer_id: customerId,
    customerNumber: String(input.customerNumber ?? input.customer_number ?? base.customerNumber).trim(),
    productScope,
    product_scope_json: JSON.stringify(productScope || {}),
    validFrom,
    valid_from: validFrom,
    validUntil,
    valid_until: validUntil,
    licenseMode: normalizedMode,
    license_mode: normalizedMode,
    machineId,
    machine_id: machineId,
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
