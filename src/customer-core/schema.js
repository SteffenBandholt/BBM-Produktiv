const SCHEMA_VERSION = 1;

function ensureCustomerSchema(db) {
  if (!db || typeof db.exec !== "function") throw new Error("customer database required");

  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS customer_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const currentVersionRow = db
    .prepare("SELECT value FROM customer_meta WHERE key = 'schema_version'")
    .get();
  const currentVersion = currentVersionRow ? Number(currentVersionRow.value) : 0;
  if (!Number.isFinite(currentVersion) || currentVersion < 0) {
    throw new Error("invalid customer database schema version");
  }
  if (currentVersion > SCHEMA_VERSION) {
    throw new Error(`customer database schema ${currentVersion} is newer than supported ${SCHEMA_VERSION}`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_number_sequence (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      next_value INTEGER NOT NULL CHECK (next_value >= 1)
    );

    INSERT OR IGNORE INTO customer_number_sequence (id, next_value) VALUES (1, 1);

    CREATE TABLE IF NOT EXISTS customers (
      customer_id TEXT PRIMARY KEY,
      customer_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
      source_code TEXT NOT NULL CHECK (source_code IN ('MANUAL', 'BBM', 'IMPORT', 'MIGRATION')),

      name1 TEXT NOT NULL,
      name2 TEXT,
      street TEXT,
      postal_code TEXT,
      city TEXT,
      country_code TEXT NOT NULL,

      email TEXT,
      phone TEXT,
      vat_id TEXT,

      billing_name1 TEXT,
      billing_name2 TEXT,
      billing_street TEXT,
      billing_postal_code TEXT,
      billing_city TEXT,
      billing_country_code TEXT,
      billing_email TEXT,

      default_payment_term_days INTEGER CHECK (
        default_payment_term_days IS NULL OR
        (default_payment_term_days >= 0 AND default_payment_term_days <= 365)
      ),
      language_code TEXT,
      internal_note TEXT,

      revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS customer_contacts (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      salutation TEXT,
      first_name TEXT,
      last_name TEXT,
      position TEXT,
      email TEXT,
      phone TEXT,
      mobile TEXT,
      is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
      is_billing_contact INTEGER NOT NULL DEFAULT 0 CHECK (is_billing_contact IN (0, 1)),
      is_license_contact INTEGER NOT NULL DEFAULT 0 CHECK (is_license_contact IN (0, 1)),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customer_links (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      system_code TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
      UNIQUE (system_code, entity_type, entity_id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_contacts_one_active_primary
      ON customer_contacts(customer_id)
      WHERE is_primary = 1 AND is_active = 1;

    CREATE INDEX IF NOT EXISTS idx_customers_status_name
      ON customers(status, name1, name2);
    CREATE INDEX IF NOT EXISTS idx_customers_vat_id
      ON customers(vat_id);
    CREATE INDEX IF NOT EXISTS idx_customers_email
      ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer
      ON customer_contacts(customer_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_customer_links_customer
      ON customer_links(customer_id);
  `);

  if (currentVersion < SCHEMA_VERSION) {
    db.prepare(`
      INSERT INTO customer_meta (key, value)
      VALUES ('schema_version', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(String(SCHEMA_VERSION));
  }

  return SCHEMA_VERSION;
}

module.exports = { SCHEMA_VERSION, ensureCustomerSchema };
