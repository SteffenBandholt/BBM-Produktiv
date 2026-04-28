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

function _optionalInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const int = Math.floor(parsed);
  return int > 0 ? int : null;
}

function _nowIso() {
  return new Date().toISOString();
}

function _timestampForLicenseId(date = new Date()) {
  const part = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}-${part(date.getHours())}${part(
    date.getMinutes()
  )}${part(date.getSeconds())}`;
}

function _generateLicenseId(date = new Date()) {
  return `LIC-${_timestampForLicenseId(date)}`;
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
  const modeRaw = _trimText(license.license_mode || license.licenseMode).toLowerCase();
  const editionRaw = _trimText(license.license_edition || license.licenseEdition).toLowerCase();
  const bindingRaw = _trimText(license.license_binding || license.licenseBinding).toLowerCase();
  const legacyDefaults =
    modeRaw === "full" || modeRaw === "machine"
      ? { license_edition: "full", license_binding: "machine", license_mode: "full" }
      : { license_edition: "test", license_binding: "none", license_mode: "soft" };
  const license_edition = editionRaw === "full" || editionRaw === "test" ? editionRaw : legacyDefaults.license_edition;
  const license_binding = bindingRaw === "machine" || bindingRaw === "none" ? bindingRaw : legacyDefaults.license_binding;
  const license_mode =
    modeRaw === "full" || modeRaw === "soft" || modeRaw === "machine" || modeRaw === "none"
      ? modeRaw
      : license_binding === "machine"
        ? "full"
        : "soft";

  return {
    id,
    license_id: _trimText(license.license_id || license.licenseId),
    customer_id: _trimText(license.customer_id || license.customerId),
    product_scope_json: _normalizeProductScopeJson(
      license.product_scope_json !== undefined ? license.product_scope_json : license.productScope
    ),
    valid_from: _optionalText(license.valid_from || license.validFrom),
    valid_until: _optionalText(license.valid_until || license.validUntil),
    trial_duration_days: _optionalInt(license.trial_duration_days || license.trialDurationDays),
    license_mode: _optionalText(license_mode),
    license_edition: _optionalText(license_edition),
    license_binding: _optionalText(license_binding),
    machine_id: _optionalText(license.machine_id || license.machineId),
    setup_type: _optionalText(license.setup_type || license.setupType),
    setup_status: _optionalText(license.setup_status || license.setupStatus),
    setup_file_path: _optionalText(license.setup_file_path || license.setupFilePath),
    setup_created_at: _optionalText(license.setup_created_at || license.setupCreatedAt),
    license_file_path: _optionalText(license.license_file_path || license.licenseFilePath),
    license_file_created_at: _optionalText(license.license_file_created_at || license.licenseFileCreatedAt),
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

function _baseListLicensesQuery() {
  return `
    SELECT
      lr.*,
      lr.license_edition AS licenseEdition,
      lr.license_binding AS licenseBinding,
      lr.setup_type AS setupType,
      lr.setup_status AS setupStatus,
      lr.setup_file_path AS setupFilePath,
      lr.setup_created_at AS setupCreatedAt,
      lr.license_file_path AS licenseFilePath,
      lr.license_file_created_at AS licenseFileCreatedAt,
      lc.customer_number AS customer_number,
      lc.company_name AS company_name,
      lc.customer_number AS customerNumber,
      lc.company_name AS companyName,
      CASE
        WHEN COALESCE(TRIM(lc.customer_number), '') <> '' AND COALESCE(TRIM(lc.company_name), '') <> ''
          THEN lc.customer_number || ' | ' || lc.company_name
        WHEN COALESCE(TRIM(lc.customer_number), '') <> ''
          THEN lc.customer_number
        WHEN COALESCE(TRIM(lc.company_name), '') <> ''
          THEN lc.company_name
        ELSE COALESCE(lr.customer_id, '')
      END AS customerDisplay
    FROM license_records lr
    LEFT JOIN license_customers lc ON lc.id = lr.customer_id
  `;
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
  return _db()
    .prepare(`${_baseListLicensesQuery()} ORDER BY lr.created_at DESC, lr.license_id COLLATE NOCASE`)
    .all();
}

function listLicensesByCustomer(customerId) {
  const normalizedCustomerId = _trimText(customerId);
  if (!normalizedCustomerId) throw new Error("customer_id required");
  return _db()
    .prepare(
      `${_baseListLicensesQuery()} WHERE lr.customer_id = ? ORDER BY lr.created_at DESC, lr.license_id COLLATE NOCASE`
    )
    .all(normalizedCustomerId);
}

function saveLicense(license = {}) {
  const db = _db();
  const record = _normalizeLicenseRecord(license);
  if (!record.license_id) {
    record.license_id = _generateLicenseId();
  }
  if (!record.customer_id) throw new Error("customer_id required");
  if (!record.product_scope_json) throw new Error("product_scope_json required");
  if (!record.valid_from) throw new Error("valid_from required");
  const isTestLicense = record.license_edition === "test" && record.license_binding === "none";
  if (!isTestLicense && !record.valid_until) throw new Error("valid_until required");
  if (isTestLicense && !record.trial_duration_days) throw new Error("trial_duration_days required");
  if (!record.license_mode) throw new Error("license_mode required");
  if (!record.license_edition) throw new Error("license_edition required");
  if (!record.license_binding) throw new Error("license_binding required");

  const existingById = db.prepare(`SELECT id FROM license_records WHERE id = ?`).get(record.id);
  const existingByBusinessKey = db
    .prepare(`SELECT id FROM license_records WHERE customer_id = ? AND lower(license_id) = lower(?)`)
    .get(record.customer_id, record.license_id);
  if (!existingById && existingByBusinessKey?.id) record.id = existingByBusinessKey.id;
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
          trial_duration_days = ?,
          license_mode = ?,
          license_edition = ?,
          license_binding = ?,
          machine_id = ?,
          setup_type = ?,
          setup_status = ?,
          setup_file_path = ?,
          setup_created_at = ?,
          license_file_path = ?,
          license_file_created_at = ?,
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
      record.trial_duration_days,
      record.license_mode,
      record.license_edition,
      record.license_binding,
      record.machine_id,
      record.setup_type,
      record.setup_status,
      record.setup_file_path,
      record.setup_created_at,
      record.license_file_path,
      record.license_file_created_at,
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
        trial_duration_days,
        license_mode,
        license_edition,
        license_binding,
        machine_id,
        setup_type,
        setup_status,
        setup_file_path,
        setup_created_at,
        license_file_path,
        license_file_created_at,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      record.id,
      record.license_id,
      record.customer_id,
      record.product_scope_json,
      record.valid_from,
      record.valid_until,
      record.trial_duration_days,
      record.license_mode,
      record.license_edition,
      record.license_binding,
      record.machine_id,
      record.setup_type,
      record.setup_status,
      record.setup_file_path,
      record.setup_created_at,
      record.license_file_path,
      record.license_file_created_at,
      record.notes
    );
  }

  return db.prepare(`SELECT * FROM license_records WHERE id = ?`).get(record.id);
}

function deleteLicenseRecord(id) {
  const normalizedId = _trimText(id);
  if (!normalizedId) throw new Error("license_record_id required");
  const db = _db();
  const existing = db.prepare(`SELECT * FROM license_records WHERE id = ?`).get(normalizedId);
  if (!existing) throw new Error("license_record_not_found");
  db.prepare(`DELETE FROM license_history WHERE license_record_id = ?`).run(normalizedId);
  db.prepare(`DELETE FROM license_records WHERE id = ?`).run(normalizedId);
  return { ok: true, id: normalizedId };
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


function deleteCustomer(id) {
  const normalizedId = _trimText(id);
  if (!normalizedId) throw new Error("customer_id required");
  const db = _db();
  const existing = db.prepare(`SELECT * FROM license_customers WHERE id = ?`).get(normalizedId);
  if (!existing) throw new Error("customer_not_found");
  const records = db.prepare(`SELECT id FROM license_records WHERE customer_id = ?`).all(normalizedId);
  for (const row of records) {
    db.prepare(`DELETE FROM license_history WHERE license_record_id = ?`).run(row.id);
  }
  db.prepare(`DELETE FROM license_records WHERE customer_id = ?`).run(normalizedId);
  db.prepare(`DELETE FROM license_customers WHERE id = ?`).run(normalizedId);
  return { ok: true, id: normalizedId };
}

module.exports = {
  listCustomers,
  saveCustomer,
  deleteCustomer,
  listLicenses,
  listLicensesByCustomer,
  saveLicense,
  deleteLicenseRecord,
  listHistory,
  addHistoryEntry,
};
