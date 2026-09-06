const OWN_ORGANIZATION_ID = "own-organization";

function text(value) {
  return String(value ?? "").trim();
}

function createOwnOrganization(source = {}) {
  return Object.freeze({
    identityType: "own-organization",
    id: OWN_ORGANIZATION_ID,
    legalName: text(source.legalName ?? source.name1),
    additionalName: text(source.additionalName ?? source.name2),
    address: Object.freeze({
      street: text(source.address?.street ?? source.street),
      zip: text(source.address?.zip ?? source.zip),
      city: text(source.address?.city ?? source.city),
      country: text(source.address?.country ?? source.country),
    }),
    contact: Object.freeze({
      phone: text(source.contact?.phone ?? source.phone),
      email: text(source.contact?.email ?? source.email),
      website: text(source.contact?.website ?? source.website),
    }),
    logoPath: text(source.logoPath ?? source.logo_path),
    taxNumber: text(source.taxNumber ?? source.tax_number),
    vatId: text(source.vatId ?? source.vat_id),
    bank: Object.freeze({
      iban: text(source.bank?.iban ?? source.iban),
      bic: text(source.bank?.bic ?? source.bic),
      name: text(source.bank?.name ?? source.bank_name),
    }),
    legal: Object.freeze({
      commercialRegister: text(source.legal?.commercialRegister ?? source.commercial_register),
      registerNumber: text(source.legal?.registerNumber ?? source.register_number),
      managingDirector: text(source.legal?.managingDirector ?? source.managing_director),
      notice: text(source.legal?.notice ?? source.legal_notice),
    }),
  });
}

function toUserProfilePatch(source = {}) {
  const organization = createOwnOrganization(source);
  return Object.freeze({
    name1: organization.legalName,
    name2: organization.additionalName,
    street: organization.address.street,
    zip: organization.address.zip,
    city: organization.address.city,
    country: organization.address.country,
    phone: organization.contact.phone,
    email: organization.contact.email,
    website: organization.contact.website,
    logo_path: organization.logoPath,
    tax_number: organization.taxNumber,
    vat_id: organization.vatId,
    iban: organization.bank.iban,
    bic: organization.bank.bic,
    bank_name: organization.bank.name,
    commercial_register: organization.legal.commercialRegister,
    register_number: organization.legal.registerNumber,
    managing_director: organization.legal.managingDirector,
    legal_notice: organization.legal.notice,
  });
}

module.exports = Object.freeze({ OWN_ORGANIZATION_ID, createOwnOrganization, toUserProfilePatch });
