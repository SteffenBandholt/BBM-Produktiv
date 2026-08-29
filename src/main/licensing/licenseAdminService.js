const { randomUUID } = require("crypto");
const { initDatabase } = require("../db/database");
const {
  FIRM_USAGE_CODES,
  ensureFirmUsagesSchema,
  setUsage,
} = require("../db/firmUsagesRepo");

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
    company_name: _trimText(customer.company_name || customer.companyName || customer.name),
    company_name2: _optionalText(customer.company_name2 || customer.companyName2 || customer.name2),
    contact_person: _optionalText(customer.contact_person || customer.contactPerson),
    street: _optionalText(customer.street),
    zip: _optionalText(customer.zip),
    city: _optionalText(customer.city),
    email: _optionalText(customer.email),
    phone: _optionalText(customer.phone),
    trade: _optionalText(customer.trade || customer.gewerk),
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
  const license_mode = license_edition === "full" ? "full" : "soft";

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

function _ensureLegacyCustomerMirror(db, firmId, metadata = {}) {
  const id = _trimText(firmId);
  if (!id) throw new Error("customer_id required");

  const firm = db
    .prepare(`SELECT id, short, name, phone, email, notes FROM firms WHERE id = ? LIMIT 1`)
    .get(id);
  if (!firm) throw new Error("license_customer_firm_not_found");

  const customerNumber = _trimText(metadata.customer_number || metadata.customerNumber || firm.short);
  const companyName = _trimText(metadata.company_name || metadata.companyName || firm.name);
  const contactPerson = _optionalText(metadata.contact_person || metadata.contactPerson);
  const email = _optionalText(metadata.email || firm.email);
  const phone = _optionalText(metadata.phone || firm.phone);
  const notes = _optionalText(metadata.notes || firm.notes);
  const now = _nowIso();
  const existing = db.prepare(`SELECT id FROM license_customers WHERE id = ?`).get(id);

  if (existing) {
    db.prepare(`
      UPDATE license_customers
      SET customer_number = ?, company_name = ?, contact_person = ?, email = ?, phone = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(customerNumber, companyName, contactPerson, email, phone, notes, now, id);
  } else {
    db.prepare(`
      INSERT INTO license_customers (
        id, customer_number, company_name, contact_person, email, phone, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, customerNumber, companyName, contactPerson, email, phone, notes, now, now);
  }
}

function _migrateLegacyLicenseCustomersToFirms(db) {
  ensureFirmUsagesSchema(db);
  const rows = db.prepare(`SELECT * FROM license_customers`).all();
  const now = _nowIso();

  const migrate = () => {
    for (const row of rows) {
      const id = _trimText(row.id);
      const companyName = _trimText(row.company_name);
      if (!id || !companyName) continue;

      const firm = db.prepare(`SELECT id FROM firms WHERE id = ? LIMIT 1`).get(id);
      if (!firm) {
        db.prepare(`
          INSERT INTO firms (
            id, short, name, name2, street, zip, city, phone, email, gewerk, notes, role_code,
            use_project_participant, use_customer, removed_at, created_at, updated_at
          ) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, ?, ?, NULL, ?, 60, 0, 0, NULL, ?, ?)
        `).run(
          id,
          _optionalText(row.customer_number),
          companyName,
          _optionalText(row.phone),
          _optionalText(row.email),
          _optionalText(row.notes),
          now,
          now
        );
      }

      setUsage({
        firmId: id,
        usageCode: FIRM_USAGE_CODES.LICENSE_CUSTOMER,
        enabled: true,
        dbConn: db,
      });
    }
  };

  if (db.inTransaction) migrate();
  else db.transaction(migrate)();
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
      COALESCE(lc.customer_number, f.short, '') AS customer_number,
      f.name AS company_name,
      COALESCE(lc.customer_number, f.short, '') AS customerNumber,
      f.name AS companyName,
      CASE
        WHEN COALESCE(TRIM(lc.customer_number), TRIM(f.short), '') <> '' AND COALESCE(TRIM(f.name), '') <> ''
          THEN COALESCE(lc.customer_number, f.short) || ' | ' || f.name
        WHEN COALESCE(TRIM(f.name), '') <> ''
          THEN f.name
        ELSE COALESCE(lr.customer_id, '')
      END AS customerDisplay
    FROM license_records lr
    LEFT JOIN firms f ON f.id = lr.customer_id
    LEFT JOIN license_customers lc ON lc.id = lr.customer_id
  `;
}

function listCustomers() {
  const db = _db();
  _migrateLegacyLicenseCustomersToFirms(db);
  return db.prepare(`
    SELECT
      f.id,
      COALESCE(lc.customer_number, f.short, '') AS customer_number,
      COALESCE(lc.customer_number, f.short, '') AS customerNumber,
      f.name AS company_name,
      f.name AS companyName,
      f.name2 AS company_name2,
      f.name2 AS companyName2,
      lc.contact_person AS contact_person,
      lc.contact_person AS contactPerson,
      f.street,
      f.zip,
      f.city,
      f.email,
      f.phone,
      f.gewerk,
      f.notes
    FROM firm_usages fu
    INNER JOIN firms f ON f.id = fu.firm_id
    LEFT JOIN license_customers lc ON lc.id = f.id
    WHERE fu.usage_code = ?
      AND f.removed_at IS NULL
      AND COALESCE(f.is_trashed, 0) = 0
    ORDER BY f.name COLLATE NOCASE, COALESCE(lc.customer_number, f.short, '') COLLATE NOCASE
  `).all(FIRM_USAGE_CODES.LICENSE_CUSTOMER);
}

function saveCustomer(customer = {}) {
  const db = _db();
  ensureFirmUsagesSchema(db);
  const record = _normalizeCustomerRecord(customer);
  if (!record.company_name) throw new Error("company_name required");
  const now = _nowIso();

  const mutate = () => {
    const existingFirm = db.prepare(`SELECT id FROM firms WHERE id = ? LIMIT 1`).get(record.id);
    if (existingFirm) {
      db.prepare(`
        UPDATE firms
        SET short = ?, name = ?, name2 = ?, street = ?, zip = ?, city = ?, phone = ?, email = ?, gewerk = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `).run(
        _optionalText(record.customer_number),
        record.company_name,
        record.company_name2,
        record.street,
        record.zip,
        record.city,
        record.phone,
        record.email,
        record.trade,
        record.notes,
        now,
        record.id
      );
    } else {
      db.prepare(`
        INSERT INTO firms (
          id, short, name, name2, street, zip, city, phone, email, gewerk, notes, role_code,
          use_project_participant, use_customer, removed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 60, 0, 0, NULL, ?, ?)
      `).run(
        record.id,
        _optionalText(record.customer_number),
        record.company_name,
        record.company_name2,
        record.street,
        record.zip,
        record.city,
        record.phone,
        record.email,
        record.trade,
        record.notes,
        now,
        now
      );
    }

    setUsage({
      firmId: record.id,
      usageCode: FIRM_USAGE_CODES.LICENSE_CUSTOMER,
      enabled: true,
      dbConn: db,
    });
    _ensureLegacyCustomerMirror(db, record.id, record);
  };

  if (db.inTransaction) mutate();
  else db.transaction(mutate)();

  return listCustomers().find((entry) => entry.id === record.id) || null;
}

function listLicenses() {
  const db = _db();
  _migrateLegacyLicenseCustomersToFirms(db);
  return db
    .prepare(`${_baseListLicensesQuery()} ORDER BY lr.created_at DESC, lr.license_id COLLATE NOCASE`)
    .all();
}

function listLicensesByCustomer(customerId) {
  const normalizedCustomerId = _trimText(customerId);
  if (!normalizedCustomerId) throw new Error("customer_id required");
  const db = _db();
  _migrateLegacyLicenseCustomersToFirms(db);
  return db
    .prepare(
      `${_baseListLicensesQuery()} WHERE lr.customer_id = ? ORDER BY lr.created_at DESC, lr.license_id COLLATE NOCASE`
    )
    .all(normalizedCustomerId);
}

function saveLicense(license = {}) {
  const db = _db();
  _migrateLegacyLicenseCustomersToFirms(db);
  const record = _normalizeLicenseRecord(license);
  if (!record.license_id) record.license_id = _generateLicenseId();
  if (!record.customer_id) throw new Error("customer_id required");
  if (!record.product_scope_json) throw new Error("product_scope_json required");
  if (!record.valid_from) throw new Error("valid_from required");
  const isTestLicense = record.license_edition === "test" && record.license_binding === "none";
  if (!isTestLicense && !record.valid_until) throw new Error("valid_until required");
  if (isTestLicense && !record.trial_duration_days) throw new Error("trial_duration_days required");
  if (!record.license_mode) throw new Error("license_mode required");
  if (!record.license_edition) throw new Error("license_edition required");
  if (!record.license_binding) throw new Error("license_binding required");

  setUsage({
    firmId: record.customer_id,
    usageCode: FIRM_USAGE_CODES.LICENSE_CUSTOMER,
    enabled: true,
    dbConn: db,
  });
  _ensureLegacyCustomerMirror(db, record.customer_id);

  const existing = db.prepare(`SELECT id FROM license_records WHERE id = ?`).get(record.id);
  const now = _nowIso();

  if (existing) {
    db.prepare(`
      UPDATE license_records
      SET license_id = ?, customer_id = ?, product_scope_json = ?, valid_from = ?, valid_until = ?,
          trial_duration_days = ?, license_mode = ?, license_edition = ?, license_binding = ?, machine_id = ?,
          setup_type = ?, setup_status = ?, setup_file_path = ?, setup_created_at = ?, license_file_path = ?,
          license_file_created_at = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).run(
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
    db.prepare(`
      INSERT INTO license_records (
        id, license_id, customer_id, product_scope_json, valid_from, valid_until, trial_duration_days,
        license_mode, license_edition, license_binding, machine_id, setup_type, setup_status, setup_file_path,
        setup_created_at, license_file_path, license_file_created_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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
  const historyCount = db.prepare(`SELECT COUNT(*) AS c FROM license_history WHERE license_record_id = ?`).get(normalizedId);
  if (Number(historyCount?.c || 0) > 0) throw new Error("LICENSE_RECORD_HAS_HISTORY");
  db.prepare(`DELETE FROM license_records WHERE id = ?`).run(normalizedId);
  return { ok: true, id: normalizedId };
}

function deleteCustomer(id, options = {}) {
  const normalizedId = _trimText(id);
  if (!normalizedId) throw new Error("customer_id required");
  const db = _db();
  _migrateLegacyLicenseCustomersToFirms(db);
  const existing = db.prepare(`SELECT id FROM firms WHERE id = ?`).get(normalizedId);
  if (!existing) throw new Error("customer_not_found");
  const licenses = db.prepare(`SELECT id FROM license_records WHERE customer_id = ?`).all(normalizedId);
  const deletedLicenses = Array.isArray(licenses) ? licenses.length : 0;
  const shouldDeleteLicenses = options?.deleteLicenses === true;
  if (deletedLicenses > 0 && !shouldDeleteLicenses) throw new Error("CUSTOMER_HAS_LICENSES");
  if (shouldDeleteLicenses && deletedLicenses > 0) {
    const historyCount = db
      .prepare(`SELECT COUNT(*) AS c FROM license_history WHERE license_record_id IN (SELECT id FROM license_records WHERE customer_id = ?)`)
      .get(normalizedId);
    if (Number(historyCount?.c || 0) > 0) throw new Error("CUSTOMER_HAS_LICENSE_HISTORY");
    db.prepare(`DELETE FROM license_records WHERE customer_id = ?`).run(normalizedId);
  }

  setUsage({
    firmId: normalizedId,
    usageCode: FIRM_USAGE_CODES.LICENSE_CUSTOMER,
    enabled: false,
    dbConn: db,
  });
  db.prepare(`DELETE FROM license_customers WHERE id = ?`).run(normalizedId);
  return { ok: true, id: normalizedId, deletedLicenses, firmRetained: true };
}

function listHistory() {
  return _db().prepare(`SELECT * FROM license_history ORDER BY created_at DESC`).all();
}

function addHistoryEntry(entry = {}) {
  const db = _db();
  const record = _normalizeHistoryEntry(entry);
  if (!record.license_record_id) throw new Error("license_record_id required");

  db.prepare(`
    INSERT INTO license_history (
      id, license_record_id, generated_at, product_scope_json, valid_until, output_path, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
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
  listLicensesByCustomer,
  saveLicense,
  deleteLicenseRecord,
  deleteCustomer,
  listHistory,
  addHistoryEntry,
};
