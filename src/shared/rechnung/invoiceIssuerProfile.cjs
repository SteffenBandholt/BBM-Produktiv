const INVOICE_ISSUER_PROFILE_ID = "default";

function text(value) {
  return String(value ?? "").trim();
}

function createInvoiceIssuerProfile(source = {}) {
  const address = source.address || {};
  const contact = source.contact || {};
  const bank = source.bank || {};
  const legal = source.legal || {};
  return Object.freeze({
    identityType: "invoice-issuer-profile",
    id: text(source.id) || INVOICE_ISSUER_PROFILE_ID,
    legalName: text(source.legalName ?? source.legal_name ?? source.name1),
    additionalName: text(source.additionalName ?? source.additional_name ?? source.name2),
    street: text(address.street ?? source.street),
    zip: text(address.zip ?? source.zip),
    city: text(address.city ?? source.city),
    country: text(address.country ?? source.country),
    phone: text(contact.phone ?? source.phone),
    email: text(contact.email ?? source.email),
    website: text(contact.website ?? source.website),
    logoPath: text(source.logoPath ?? source.logo_path),
    taxNumber: text(source.taxNumber ?? source.tax_number),
    vatId: text(source.vatId ?? source.vat_id),
    iban: text(bank.iban ?? source.iban),
    bic: text(bank.bic ?? source.bic),
    bankName: text(bank.name ?? source.bankName ?? source.bank_name),
    commercialRegister: text(legal.commercialRegister ?? source.commercialRegister ?? source.commercial_register),
    registerNumber: text(legal.registerNumber ?? source.registerNumber ?? source.register_number),
    managingDirector: text(legal.managingDirector ?? source.managingDirector ?? source.managing_director),
    legalNotice: text(legal.notice ?? source.legalNotice ?? source.legal_notice),
    initializedFromOwnOrganizationAt: text(source.initializedFromOwnOrganizationAt ?? source.initialized_from_own_organization_at),
    createdAt: text(source.createdAt ?? source.created_at),
    updatedAt: text(source.updatedAt ?? source.updated_at),
  });
}

function toInvoiceIssuerSnapshot(source = {}) {
  const profile = createInvoiceIssuerProfile(source);
  return Object.freeze({
    profileId: profile.id,
    companyName: profile.legalName || null,
    companyName2: profile.additionalName || null,
    street: profile.street || null,
    zip: profile.zip || null,
    city: profile.city || null,
    country: profile.country || null,
    phone: profile.phone || null,
    email: profile.email || null,
    website: profile.website || null,
    logoPath: profile.logoPath || null,
    taxNumber: profile.taxNumber || null,
    vatId: profile.vatId || null,
    iban: profile.iban || null,
    bic: profile.bic || null,
    bankName: profile.bankName || null,
    commercialRegister: profile.commercialRegister || null,
    registerNumber: profile.registerNumber || null,
    managingDirector: profile.managingDirector || null,
    legalNotice: profile.legalNotice || null,
  });
}

module.exports = Object.freeze({ INVOICE_ISSUER_PROFILE_ID, createInvoiceIssuerProfile, toInvoiceIssuerSnapshot });
