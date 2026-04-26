const { randomUUID } = require("crypto");
const { initDatabase } = require("../db/database");

function _db() {
  return initDatabase();
}

function _trimText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function _optionalText(value) {
  const trimmed = _trimText(value);
  return trimmed || null;
}

function _nowIso() {
  return new Date().toISOString();
}

function _normalizeProductScopeJson(input) {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return JSON.stringify({});
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed || {});
    } catch (_err) {
      return JSON.stringify({ raw: trimmed });
    }
  }

  if (!input || typeof input !== "object") {
    return JSON.stringify({});
  }

  return JSON.stringify(input);
}

function _normalizeCustomerRecord(customer = {}) {
  const id = _trimText(customer.id) || randomUUID();

  return {
    id,
    customer_number: _trimText(customer.customer_number || customer.customerNumber),
    company_name: _trimText(customer.company_name || customer.companyName),
    contact_person: _optionalText(customer.contact_person || customer.contactPerson),
    email: _optionalText(customer.email),
    phone: _optionalText(customer.phone),
    notes: _optionalText(customer.notes),
  };
}

function _normalizeLicenseRecord(license = {}) {
  const id = _trimText(license.id) || randomUUID();

  return {
    id,
    license_id: _trimText(license.license_id || license.licenseId),
    customer_id: _trimText(license.customer_id || license.customerId),
    product_scope_json: _normalizeProductScopeJson(
      license.product_scope_json !== undefined ? license.product_scope_json : license.productScope
    ),
    valid_from: _optionalText(license.valid_from || license.validFrom),
    valid_until: _optionalText(license.valid_until || license.validUntil),
    license_mode: _optionalText(license.license_mode || license.licenseMode),
    machine_id: _optionalText(license.machine_id || license.machineId),
    notes: _optionalText(license.notes),
  };
}

function _normalizeHistoryEntry(entry = {}) {
  const id = _trimText(entry.id) || randomUUID();

  return {
    id,
    license_record_id: _trimText(entry.license_record_id || entry.licenseRecordId),
    generated_at: _optionalText(entry.generated_at || entry.generatedAt),
    product_scope_json: _normalizeProductScopeJson(
      entry.product_scope_json !== undefined ? entry.product_scope_json : entry.productScope
    ),
    valid_until: _optionalText(entry.valid_until || entry.validUntil),
    output_path: _optionalText(entry.output_path || entry.outputPath),
    notes: _optionalText(entry.notes),
  };
}

function listCustomers() {
  return _db().prepare(`SELECT * FROM license_customers ORDER BY company_name COLLATE NOCASE, customer_number COLLATE NOCASE`).all();
}

function saveCustomer(customer = {}) {
  const db = _db();
  const record = _normalizeCustomerRecord(customer);
  if (!record.customer_number) throw new Error("customer_number required");
  if (!record.company_name) throw new Error("company_name required");

  const existing = db.prepare(`SELECT id FROM license_customers WHERE id = ?`).get(record.id);
  const now = _nowIso();

  if (existing) {
    db.prepare(
      `
      UPDATE license_customers
      SET customer_number = ?,
          company_name = ?,
          contact_person = ?,
          email = ?,
          phone = ?,
          notes = ?,
          updated_at = ?
      WHERE id = ?
    `
    ).run(
      record.customer_number,
      record.company_name,
      record.contact_person,
      record.email,
      record.phone,
      record.notes,
      now,
      record.id
    );
  } else {
    db.prepare(
      `
      INSERT INTO license_customers (
        id,
        customer_number,
        company_name,
        contact_person,
        email,
        phone,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      record.id,
      record.customer_number,
      record.company_name,
      record.contact_person,
      record.email,
      record.phone,
      record.notes
    );
  }

  return db.prepare(`SELECT * FROM license_customers WHERE id = ?`).get(record.id);
}

function listLicenses() {
  return _db().prepare(`SELECT * FROM license_records ORDER BY created_at DESC, license_id COLLATE NOCASE`).all();
}

function saveLicense(license = {}) {
  const db = _db();
  const record = _normalizeLicenseRecord(license);
  if (!record.license_id) throw new Error("license_id required");
  if (!record.customer_id) throw new Error("customer_id required");

  const existing = db.prepare(`SELECT id FROM license_records WHERE id = ?`).get(record.id);
  const now = _nowIso();

  if (existing) {
    db.prepare(
      `
      UPDATE license_records
      SET license_id = ?,
          customer_id = ?,
          product_scope_json = ?,
          valid_from = ?,
          valid_until = ?,
          license_mode = ?,
          machine_id = ?,
          notes = ?,
          updated_at = ?
      WHERE id = ?
    `
    ).run(
      record.license_id,
      record.customer_id,
      record.product_scope_json,
      record.valid_from,
      record.valid_until,
      record.license_mode,
      record.machine_id,
      record.notes,
      now,
      record.id
    );
  } else {
    db.prepare(
      `
      INSERT INTO license_records (
        id,
        license_id,
        customer_id,
        product_scope_json,
        valid_from,
        valid_until,
        license_mode,
        machine_id,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      record.id,
      record.license_id,
      record.customer_id,
      record.product_scope_json,
      record.valid_from,
      record.valid_until,
      record.license_mode,
      record.machine_id,
      record.notes
    );
  }

  return db.prepare(`SELECT * FROM license_records WHERE id = ?`).get(record.id);
}

function listHistory() {
  return _db().prepare(`SELECT * FROM license_history ORDER BY created_at DESC`).all();
}

function addHistoryEntry(entry = {}) {
  const db = _db();
  const record = _normalizeHistoryEntry(entry);
  if (!record.license_record_id) throw new Error("license_record_id required");

  db.prepare(
    `
    INSERT INTO license_history (
      id,
      license_record_id,
      generated_at,
      product_scope_json,
      valid_until,
      output_path,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    record.id,
    record.license_record_id,
    record.generated_at,
    record.product_scope_json,
    record.valid_until,
    record.output_path,
    record.notes
  );

  return db.prepare(`SELECT * FROM license_history WHERE id = ?`).get(record.id);
}

module.exports = {
  listCustomers,
  saveCustomer,
  listLicenses,
  saveLicense,
  listHistory,
  addHistoryEntry,
};
