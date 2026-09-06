const INVOICE_ISSUER_PROFILE_ID = "default";

function text(value) {
  return String(value ?? "").trim();
}

function createInvoiceIssuerProfile(source = {}) {
  return Object.freeze({
    identityType: "invoice-issuer-profile",
    id: text(source.id) || INVOICE_ISSUER_PROFILE_ID,
    legalName: text(source.legalName ?? source.legal_name ?? source.name1),
    additionalName: text(source.additionalName ?? source.additional_name ?? source.name2),
    street: text(source.street),
    zip: text(source.zip),
    city: text(source.city),
    country: text(source.country),
    phone: text(source.phone),
    email: text(source.email),
    website: text(source.website),
    logoPath: text(source.logoPath ?? source.logo_path),
    taxNumber: text(source.taxNumber ?? source.tax_number),
    vatId: text(source.vatId ?? source.vat_id),
    iban: text(source.iban),
    bic: text(source.bic),
    bankName: text(source.bankName ?? source.bank_name),
    commercialRegister: text(source.commercialRegister ?? source.commercial_register),
    registerNumber: text(source.registerNumber ?? source.register_number),
    managingDirector: text(source.managingDirector ?? source.managing_director),
    legalNotice: text(source.legalNotice ?? source.legal_notice),
    initializedFromOwnOrganizationAt: text(source.initializedFromOwnOrganizationAt ?? source.initialized_from_own_organization_at),
    createdAt: text(source.createdAt ?? source.created_at),
    updatedAt: text(source.updatedAt ?? source.updated_at),
  });
}

module.exports = Object.freeze({ INVOICE_ISSUER_PROFILE_ID, createInvoiceIssuerProfile });
