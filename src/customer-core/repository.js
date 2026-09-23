function trimOrNull(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
}

function mapCustomer(row) {
  if (!row) return null;
  return {
    customerId: row.customer_id,
    customerNumber: row.customer_number,
    status: row.status,
    sourceCode: row.source_code,
    name1: row.name1,
    name2: row.name2,
    street: row.street,
    postalCode: row.postal_code,
    city: row.city,
    countryCode: row.country_code,
    email: row.email,
    phone: row.phone,
    vatId: row.vat_id,
    billingName1: row.billing_name1,
    billingName2: row.billing_name2,
    billingStreet: row.billing_street,
    billingPostalCode: row.billing_postal_code,
    billingCity: row.billing_city,
    billingCountryCode: row.billing_country_code,
    billingEmail: row.billing_email,
    defaultPaymentTermDays: row.default_payment_term_days,
    languageCode: row.language_code,
    internalNote: row.internal_note,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapContact(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id,
    salutation: row.salutation,
    firstName: row.first_name,
    lastName: row.last_name,
    position: row.position,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    isPrimary: row.is_primary === 1,
    isBillingContact: row.is_billing_contact === 1,
    isLicenseContact: row.is_license_contact === 1,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLink(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id,
    systemCode: row.system_code,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class CustomerRepository {
  constructor({ db }) {
    if (!db) throw new Error("customer db required");
    this.db = db;
  }

  allocateCustomerNumber() {
    return this.db.transaction(() => {
      const row = this.db.prepare("SELECT next_value FROM customer_number_sequence WHERE id = 1").get();
      if (!row) throw new Error("customer number sequence missing");
      const value = Number(row.next_value);
      this.db.prepare("UPDATE customer_number_sequence SET next_value = ? WHERE id = 1").run(value + 1);
      return `K-${String(value).padStart(6, "0")}`;
    })();
  }

  createCustomer(row) {
    this.db.prepare(`
      INSERT INTO customers (
        customer_id, customer_number, status, source_code,
        name1, name2, street, postal_code, city, country_code,
        email, phone, vat_id,
        billing_name1, billing_name2, billing_street, billing_postal_code,
        billing_city, billing_country_code, billing_email,
        default_payment_term_days, language_code, internal_note,
        revision, created_at, updated_at, archived_at
      ) VALUES (
        @customer_id, @customer_number, @status, @source_code,
        @name1, @name2, @street, @postal_code, @city, @country_code,
        @email, @phone, @vat_id,
        @billing_name1, @billing_name2, @billing_street, @billing_postal_code,
        @billing_city, @billing_country_code, @billing_email,
        @default_payment_term_days, @language_code, @internal_note,
        @revision, @created_at, @updated_at, @archived_at
      )
    `).run(row);
    return this.getCustomer(row.customer_id);
  }

  getCustomer(customerId) {
    return mapCustomer(this.db.prepare("SELECT * FROM customers WHERE customer_id = ?").get(customerId));
  }

  listCustomers({ status = "ACTIVE", includeArchived = false, search = "" } = {}) {
    const clauses = [];
    const values = {};
    if (!includeArchived) {
      clauses.push("status = @status");
      values.status = status;
    }
    const needle = String(search || "").trim().toLowerCase();
    if (needle) {
      clauses.push(`(
        LOWER(COALESCE(customer_number, '')) LIKE @needle OR
        LOWER(COALESCE(name1, '')) LIKE @needle OR
        LOWER(COALESCE(name2, '')) LIKE @needle OR
        LOWER(COALESCE(email, '')) LIKE @needle OR
        LOWER(COALESCE(vat_id, '')) LIKE @needle
      )`);
      values.needle = `%${needle}%`;
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    return this.db.prepare(`
      SELECT * FROM customers
      ${where}
      ORDER BY LOWER(name1), LOWER(COALESCE(name2, '')), customer_number
    `).all(values).map(mapCustomer);
  }

  updateCustomer(customerId, patch, { expectedRevision } = {}) {
    const columnMap = {
      name1: "name1",
      name2: "name2",
      street: "street",
      postalCode: "postal_code",
      city: "city",
      countryCode: "country_code",
      email: "email",
      phone: "phone",
      vatId: "vat_id",
      billingName1: "billing_name1",
      billingName2: "billing_name2",
      billingStreet: "billing_street",
      billingPostalCode: "billing_postal_code",
      billingCity: "billing_city",
      billingCountryCode: "billing_country_code",
      billingEmail: "billing_email",
      defaultPaymentTermDays: "default_payment_term_days",
      languageCode: "language_code",
      internalNote: "internal_note",
      sourceCode: "source_code",
    };
    const keys = Object.keys(patch || {}).filter((key) => columnMap[key]);
    if (!keys.length) return this.getCustomer(customerId);

    const sets = [];
    const values = [];
    for (const key of keys) {
      sets.push(`${columnMap[key]} = ?`);
      const value = patch[key];
      if (key === "defaultPaymentTermDays") values.push(value === null || value === "" ? null : Number(value));
      else values.push(trimOrNull(value));
    }
    sets.push("revision = revision + 1", "updated_at = ?");
    values.push(new Date().toISOString(), customerId);

    let revisionSql = "";
    if (expectedRevision !== undefined && expectedRevision !== null) {
      revisionSql = " AND revision = ?";
      values.push(Number(expectedRevision));
    }

    const info = this.db.prepare(`
      UPDATE customers
      SET ${sets.join(", ")}
      WHERE customer_id = ?${revisionSql}
    `).run(...values);

    if (info.changes !== 1) {
      const error = new Error("customer revision conflict");
      error.code = "CUSTOMER_REVISION_CONFLICT";
      throw error;
    }
    return this.getCustomer(customerId);
  }

  setArchived(customerId, archived) {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE customers
      SET status = ?, archived_at = ?, revision = revision + 1, updated_at = ?
      WHERE customer_id = ?
    `).run(archived ? "ARCHIVED" : "ACTIVE", archived ? now : null, now, customerId);
    return this.getCustomer(customerId);
  }

  listContacts(customerId, { includeInactive = false } = {}) {
    const rows = this.db.prepare(`
      SELECT * FROM customer_contacts
      WHERE customer_id = ?
        ${includeInactive ? "" : "AND is_active = 1"}
      ORDER BY is_primary DESC, LOWER(COALESCE(last_name, '')), LOWER(COALESCE(first_name, ''))
    `).all(customerId);
    return rows.map(mapContact);
  }

  getContact(id) {
    return mapContact(this.db.prepare("SELECT * FROM customer_contacts WHERE id = ?").get(id));
  }

  createContact(row) {
    this.db.prepare(`
      INSERT INTO customer_contacts (
        id, customer_id, salutation, first_name, last_name, position,
        email, phone, mobile, is_primary, is_billing_contact, is_license_contact,
        is_active, created_at, updated_at
      ) VALUES (
        @id, @customer_id, @salutation, @first_name, @last_name, @position,
        @email, @phone, @mobile, @is_primary, @is_billing_contact, @is_license_contact,
        @is_active, @created_at, @updated_at
      )
    `).run(row);
    return this.getContact(row.id);
  }

  updateContact(id, patch) {
    const columnMap = {
      salutation: "salutation",
      firstName: "first_name",
      lastName: "last_name",
      position: "position",
      email: "email",
      phone: "phone",
      mobile: "mobile",
      isPrimary: "is_primary",
      isBillingContact: "is_billing_contact",
      isLicenseContact: "is_license_contact",
      isActive: "is_active",
    };
    const keys = Object.keys(patch || {}).filter((key) => columnMap[key]);
    if (!keys.length) return this.getContact(id);
    const sets = [];
    const values = [];
    for (const key of keys) {
      sets.push(`${columnMap[key]} = ?`);
      values.push(key.startsWith("is") ? (patch[key] ? 1 : 0) : trimOrNull(patch[key]));
    }
    sets.push("updated_at = ?");
    values.push(new Date().toISOString(), id);
    this.db.prepare(`UPDATE customer_contacts SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    return this.getContact(id);
  }

  deleteContact(id) {
    return Number(this.db.prepare("DELETE FROM customer_contacts WHERE id = ?").run(id).changes || 0);
  }

  listLinks(customerId) {
    return this.db.prepare(`
      SELECT * FROM customer_links
      WHERE customer_id = ?
      ORDER BY system_code, entity_type, entity_id
    `).all(customerId).map(mapLink);
  }

  getLinkByExternalRef({ systemCode, entityType, entityId }) {
    return mapLink(this.db.prepare(`
      SELECT * FROM customer_links
      WHERE system_code = ? AND entity_type = ? AND entity_id = ?
    `).get(systemCode, entityType, entityId));
  }

  createLink(row) {
    this.db.prepare(`
      INSERT INTO customer_links (
        id, customer_id, system_code, entity_type, entity_id, created_at, updated_at
      ) VALUES (
        @id, @customer_id, @system_code, @entity_type, @entity_id, @created_at, @updated_at
      )
    `).run(row);
    return this.getLinkByExternalRef({
      systemCode: row.system_code,
      entityType: row.entity_type,
      entityId: row.entity_id,
    });
  }

  deleteLink(id) {
    return Number(this.db.prepare("DELETE FROM customer_links WHERE id = ?").run(id).changes || 0);
  }

  deleteCustomer(customerId) {
    return Number(this.db.prepare("DELETE FROM customers WHERE customer_id = ?").run(customerId).changes || 0);
  }
}

module.exports = { CustomerRepository, mapCustomer, mapContact, mapLink };
