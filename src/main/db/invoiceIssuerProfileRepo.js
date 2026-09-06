const {
  INVOICE_ISSUER_PROFILE_ID,
  createInvoiceIssuerProfile,
} = require("../../shared/rechnung/invoiceIssuerProfile.cjs");
const { initDatabase } = require("./database");

const PROFILE_COLUMNS = Object.freeze([
  "legal_name", "additional_name", "street", "zip", "city", "country",
  "phone", "email", "website", "logo_path", "tax_number", "vat_id",
  "iban", "bic", "bank_name", "commercial_register", "register_number",
  "managing_director", "legal_notice",
]);

class InvoiceIssuerProfileRepository {
  constructor({ dbProvider = initDatabase, clock = () => new Date().toISOString() } = {}) {
    this.dbProvider = dbProvider;
    this.clock = clock;
  }

  get() {
    const row = this.dbProvider().prepare(
      `SELECT * FROM invoice_issuer_profiles WHERE id = ?`
    ).get(INVOICE_ISSUER_PROFILE_ID);
    return row ? createInvoiceIssuerProfile(row) : null;
  }

  upsert(input = {}) {
    const current = this.get();
    const profile = createInvoiceIssuerProfile({ ...(current || {}), ...input });
    const now = this.clock();
    const values = Object.fromEntries(PROFILE_COLUMNS.map((column) => {
      const camel = column.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
      return [column, profile[camel] ?? ""];
    }));
    this.dbProvider().prepare(`
      INSERT INTO invoice_issuer_profiles (
        id, ${PROFILE_COLUMNS.join(", ")}, initialized_from_own_organization_at,
        created_at, updated_at
      ) VALUES (
        @id, ${PROFILE_COLUMNS.map((column) => `@${column}`).join(", ")},
        @initialized_from_own_organization_at, @created_at, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        ${PROFILE_COLUMNS.map((column) => `${column} = excluded.${column}`).join(", ")},
        updated_at = excluded.updated_at
    `).run({
      id: INVOICE_ISSUER_PROFILE_ID,
      ...values,
      initialized_from_own_organization_at: current?.initializedFromOwnOrganizationAt || now,
      created_at: current?.createdAt || now,
      updated_at: now,
    });
    return this.get();
  }
}

module.exports = { InvoiceIssuerProfileRepository, PROFILE_COLUMNS };
