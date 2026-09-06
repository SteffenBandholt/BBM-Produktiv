const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
const { runRechnungHeaderRulesTests } = require("./rechnungHeaderRules.test.cjs");

function fixture(kind, existingSnapshot = false) {
  const db = new Database(":memory:");
  db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY); CREATE TABLE firms (id TEXT PRIMARY KEY, removed_at TEXT, is_trashed INTEGER);");
  if (kind === "fresh") return db;
  const statusDefinition = kind === "legacy"
    ? "TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled'))"
    : "TEXT";
  db.exec(`CREATE TABLE invoices (
    id TEXT PRIMARY KEY, status ${statusDefinition}, source_type TEXT,
    positions_json TEXT, issuer_snapshot_json TEXT, recipient_snapshot_json TEXT,
    customer_snapshot_json TEXT, legacy_note TEXT
    ${existingSnapshot ? ", order_snapshot_at TEXT, order_snapshot_json TEXT" : ""}
  )`);
  const status = kind === "legacy" ? "posted" : "BOOKED";
  db.prepare("INSERT INTO invoices (id, status, source_type, positions_json, issuer_snapshot_json, recipient_snapshot_json, customer_snapshot_json, legacy_note) VALUES ('historic', ?, 'FROM_ORDER', ?, ?, ?, ?, ?)")
    .run(status, '[ { "position_number": "25", "quantity": "12.5000" } ]', '{ "issuer": "Alt" }', '{ "recipient": "Alt" }', '{ "customer": "Alt" }', "Unveränderter Altbestand");
  if (existingSnapshot) db.prepare("UPDATE invoices SET order_snapshot_at = ?, order_snapshot_json = ?").run("2026-08-01T12:00:00.000Z", '{ "version": 1, "historical": true }');
  return db;
}

function state(db) {
  return {
    schema: db.prepare("SELECT name, type, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").all(),
    rows: db.prepare("SELECT * FROM invoices ORDER BY id").all(),
  };
}

async function runRechnungOrderSnapshotMigrationTests(run) {
  // Run this existing regression before the known ui-editor-kit group abort.
  await runRechnungHeaderRulesTests(async (name, test) => {
    if (name === "Rechnung Step 2: reales Legacy-Schema wird datenverlustfrei und idempotent aktualisiert") {
      await run("Rechnung #275 Paket 4c-fix: ursprünglicher Legacy-Neuaufbau-Blocker ist behoben", test);
    }
  });

  await run("Rechnung #275 Paket 4c-fix: Snapshotspalten in frischer, additiver und historisch neu aufgebauter DB", () => {
    for (const kind of ["fresh", "compatible", "legacy"]) {
      const db = fixture(kind);
      try {
        ensureInvoiceSchema(db);
        const columns = db.prepare("PRAGMA table_info(invoices)").all();
        for (const name of ["order_snapshot_at", "order_snapshot_json"]) {
          assert.equal(columns.find(column => column.name === name)?.type, "TEXT", `${kind}: ${name}`);
          assert.equal(columns.find(column => column.name === name)?.notnull, 0);
        }
        if (kind !== "fresh") {
          const row = db.prepare("SELECT * FROM invoices WHERE id = 'historic'").get();
          assert.equal(row.order_snapshot_at, null);
          assert.equal(row.order_snapshot_json, null);
          assert.equal(row.order_binding_state, "LEGACY_SNAPSHOT");
          assert.equal(row.positions_json, '[ { "position_number": "25", "quantity": "12.5000" } ]');
          assert.equal(row.issuer_snapshot_json, '{ "issuer": "Alt" }');
          assert.equal(row.customer_snapshot_json, '{ "customer": "Alt" }');
          assert.equal(row.recipient_snapshot_json, '{ "recipient": "Alt" }');
          assert.equal(row.legacy_note, "Unveränderter Altbestand");
        }
        const before = state(db);
        ensureInvoiceSchema(db);
        ensureInvoiceSchema(db);
        assert.deepEqual(state(db), before, kind);
        assert.equal(db.prepare("SELECT COUNT(*) n FROM billing_orders").get().n, 0);
      } finally { db.close(); }
    }
  });

  await run("Rechnung #275 Paket 4c-fix: vorhandene Snapshotbytes überstehen additive Migration und Legacy-Neuaufbau", () => {
    for (const kind of ["compatible", "legacy"]) {
      const db = fixture(kind, true);
      try {
        const original = db.prepare("SELECT order_snapshot_at, order_snapshot_json, positions_json FROM invoices").get();
        ensureInvoiceSchema(db);
        assert.deepEqual(db.prepare("SELECT order_snapshot_at, order_snapshot_json, positions_json FROM invoices").get(), original);
        const before = state(db);
        ensureInvoiceSchema(db);
        assert.deepEqual(state(db), before);
      } finally { db.close(); }
    }
  });
}

module.exports = { runRechnungOrderSnapshotMigrationTests };
