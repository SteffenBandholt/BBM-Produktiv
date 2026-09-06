const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
const { BillingOrderRepository } = require("../../src/main/db/billingOrderRepository");

const UUID = Object.freeze({
  order: "11111111-1111-4111-8111-111111111111",
  heading: "22222222-2222-4222-8222-222222222222",
  service: "33333333-3333-4333-8333-333333333333",
  service2: "44444444-4444-4444-8444-444444444444",
  amendment1: "55555555-5555-4555-8555-555555555555",
  amendment2: "66666666-6666-4666-8666-666666666666",
  amendment3: "77777777-7777-4777-8777-777777777777",
});

function database() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE projects (id TEXT PRIMARY KEY);
    CREATE TABLE firms (id TEXT PRIMARY KEY, removed_at TEXT, is_trashed INTEGER);
    INSERT INTO projects (id) VALUES ('project-1');
    INSERT INTO firms (id, removed_at, is_trashed) VALUES ('firm-1', NULL, 0);
  `);
  ensureInvoiceSchema(db);
  return db;
}

function legacyDatabase() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE unrelated_data (id TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT INTO unrelated_data (id, value) VALUES ('keep', 'unverändert');
    CREATE TABLE invoices (
      id TEXT PRIMARY KEY,
      status TEXT,
      source_type TEXT,
      source_order_id TEXT,
      source_order_number TEXT,
      source_order_date TEXT,
      positions_json TEXT
    );
    INSERT INTO invoices VALUES ('free-draft', 'DRAFT', 'FREE', NULL, NULL, NULL, '[]');
    INSERT INTO invoices VALUES ('order-draft', 'DRAFT', 'FROM_ORDER', 'legacy-order', 'A-25', '2025-01-10', '[{"position_number":"25"}]');
    INSERT INTO invoices VALUES ('order-booked', 'BOOKED', 'FROM_ORDER', 'legacy-booked', 'A-24', '2024-03-01', '[{"position_number":"10"}]');
  `);
  return db;
}

function repository(db) {
  let tick = 0;
  return new BillingOrderRepository({
    dbProvider: () => db,
    clock: () => `2026-09-06T14:10:${String(tick++).padStart(2, "0")}.000Z`,
  });
}

function createOrder(repo, input = {}) {
  return repo.createDraft({
    id: UUID.order,
    order_number: "A-25",
    order_date: "2025-01-10",
    customer_firm_id: "firm-1",
    project_id: "project-1",
    service_reference: "Umbau Musterstraße",
    ...input,
  });
}

async function runRechnungBillingOrderPersistenceTests(run) {
  await run("Rechnung #275 Paket 4a: Fachmigration legt nur additive Auftrags-LV-Tabellen und Indizes an", () => {
    const db = database();
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(({ name }) => name);
      for (const name of ["billing_orders", "billing_order_positions", "billing_order_amendments"]) {
        assert.equal(tables.includes(name), true, name);
      }
      const coreSource = require("node:fs").readFileSync(require("node:path").join(process.cwd(), "src/main/db/database.js"), "utf8");
      assert.doesNotMatch(coreSource, /billing_orders|billing_order_positions|billing_order_amendments|LEGACY_UNRESOLVED/);
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4a: stabile UUIDs, sichtbare Nummern und Vertragsreihenfolge bleiben erhalten", () => {
    const db = database();
    try {
      const repo = repository(db);
      const order = createOrder(repo);
      assert.equal(order.id, UUID.order);
      repo.addPosition(order.id, {
        id: UUID.heading, type: "heading", position_number: "10", sort_index: 10,
        short_text: "Titel Rohbau",
      });
      repo.addPosition(order.id, {
        id: UUID.service, parent_position_id: UUID.heading, type: "service",
        position_number: "25", sort_index: 20, short_text: "Mauerwerk",
        quantity: "12.5", unit: "m2", unit_price_cents: 12345,
        vat_rate_percent: 19, price_input_mode: "NET",
      });
      const persisted = repo.get(order.id);
      assert.deepEqual(persisted.positions.map((position) => [position.id, position.position_number, position.sort_index]), [
        [UUID.heading, "10", 10],
        [UUID.service, "25", 20],
      ]);
      assert.throws(
        () => db.prepare("UPDATE billing_order_positions SET id = ? WHERE id = ?").run(UUID.service2, UUID.service),
        /billing_order_position_identity_immutable/
      );
      assert.throws(
        () => repo.addPosition(order.id, { id: UUID.service2, type: "service", position_number: "25", sort_index: 30, short_text: "Doppelt" }),
        /UNIQUE constraint failed/
      );
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4a: bestätigter Auftragskopf und Vertrags-LV sind auch auf DB-Ebene unveränderlich", () => {
    const db = database();
    try {
      const repo = repository(db);
      createOrder(repo);
      repo.addPosition(UUID.order, { id: UUID.service, type: "service", position_number: "25", sort_index: 10, short_text: "Mauerwerk" });
      const confirmed = repo.confirmOrder(UUID.order);
      assert.deepEqual([confirmed.status, confirmed.positions[0].position_number, confirmed.positions[0].sort_index], ["CONFIRMED", "25", 10]);
      assert.throws(() => db.prepare("UPDATE billing_orders SET order_number = 'NEU' WHERE id = ?").run(UUID.order), /billing_order_confirmed_immutable/);
      assert.throws(() => db.prepare("UPDATE billing_order_positions SET position_number = '26' WHERE id = ?").run(UUID.service), /billing_order_positions_confirmed_immutable/);
      assert.throws(() => db.prepare("UPDATE billing_order_positions SET sort_index = 20 WHERE id = ?").run(UUID.service), /billing_order_positions_confirmed_immutable/);
      assert.throws(() => db.prepare("DELETE FROM billing_order_positions WHERE id = ?").run(UUID.service), /billing_order_positions_confirmed_immutable/);
      assert.throws(() => db.prepare("DELETE FROM billing_orders WHERE id = ?").run(UUID.order), /billing_order_confirmed_immutable/);
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4a/4d: Nachtragsbestand bewahrt Referenz und N 01/N 02 bei fortgesetzter Nummernvergabe", () => {
    const db = database();
    try {
      const repo = repository(db);
      createOrder(repo);
      repo.addPosition(UUID.order, { id: UUID.heading, type: "heading", position_number: "10", sort_index: 10, short_text: "Titel" });
      repo.addPosition(UUID.order, { id: UUID.service, type: "service", position_number: "25", sort_index: 20, short_text: "Mauerwerk" });
      repo.confirmOrder(UUID.order);
      assert.throws(
        () => repo.createDraftAmendment(UUID.order, { id: UUID.amendment1, relates_to_order_position_id: UUID.heading, short_text: "Ungültig" }),
        /billing_order_amendment_origin_invalid/
      );
      const firstDraft = repo.createDraftAmendment(UUID.order, {
        id: UUID.amendment1, relates_to_order_position_id: UUID.service, short_text: "Zusatzöffnung",
      });
      assert.deepEqual([firstDraft.status, firstDraft.sequence_no, firstDraft.amendment_number], ["DRAFT", null, null]);
      const insertConfirmed = db.prepare(`
        INSERT INTO billing_order_amendments (
          id, order_id, sequence_no, amendment_number, relates_to_order_position_id,
          short_text, status, confirmed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', 'confirmed', 'created', 'updated')
      `);
      insertConfirmed.run(UUID.amendment2, UUID.order, 1, "N 01", UUID.service, "Zusatzsturz");
      insertConfirmed.run(UUID.amendment3, UUID.order, 2, "N 02", UUID.service, "Zusatzöffnung 2");
      assert.deepEqual(
        db.prepare("SELECT sequence_no, amendment_number FROM billing_order_amendments WHERE status = 'CONFIRMED' ORDER BY sequence_no").all(),
        [{ sequence_no: 1, amendment_number: "N 01" }, { sequence_no: 2, amendment_number: "N 02" }]
      );
      assert.throws(
        () => db.prepare("UPDATE billing_order_amendments SET amendment_number = 'N 03' WHERE id = ?").run(UUID.amendment2),
        /billing_order_amendment_confirmed_immutable/
      );
      assert.throws(() => db.prepare("DELETE FROM billing_order_amendments WHERE id = ?").run(UUID.amendment2), /billing_order_amendment_confirmed_immutable/);
      const confirmed = repo.confirmAmendment(UUID.order, firstDraft.id);
      assert.deepEqual([confirmed.id, confirmed.sequence_no, confirmed.amendment_number], [firstDraft.id, 3, "N 03"]);
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4a: Bestandsmigration klassifiziert Legacy-Fälle ohne unsichere Zuordnung", () => {
    const db = legacyDatabase();
    try {
      ensureInvoiceSchema(db);
      const states = db.prepare("SELECT id, order_binding_state FROM invoices ORDER BY id").all();
      assert.deepEqual(states, [
        { id: "free-draft", order_binding_state: "NOT_APPLICABLE" },
        { id: "order-booked", order_binding_state: "LEGACY_SNAPSHOT" },
        { id: "order-draft", order_binding_state: "LEGACY_UNRESOLVED" },
      ]);
      assert.equal(db.prepare("SELECT value FROM unrelated_data WHERE id = 'keep'").get().value, "unverändert");
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM billing_orders").get().count, 0);
      assert.throws(
        () => db.prepare("UPDATE invoices SET status = 'BOOKED' WHERE id = 'order-draft'").run(),
        /invoice_order_binding_legacy_unresolved/
      );
      ensureInvoiceSchema(db);
      assert.deepEqual(db.prepare("SELECT source_order_id, source_order_number, positions_json, order_binding_state FROM invoices WHERE id = 'order-draft'").get(), {
        source_order_id: "legacy-order",
        source_order_number: "A-25",
        positions_json: '[{"position_number":"25"}]',
        order_binding_state: "LEGACY_UNRESOLVED",
      });
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM billing_orders").get().count, 0);
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4a: neue FROM_ORDER-Entwürfe bleiben bis Paket 4c ungelöst und nicht buchbar", () => {
    const db = database();
    try {
      db.prepare(`
        INSERT INTO invoices (
          id, status, source_type, document_type, invoice_date, positions_json,
          payment_term_days, due_date, created_at, updated_at
        ) VALUES ('new-order-draft', 'DRAFT', 'FROM_ORDER', 'INVOICE', '2026-09-06', '[]', 8, '2026-09-14', 'now', 'now')
      `).run();
      assert.equal(db.prepare("SELECT order_binding_state FROM invoices WHERE id = 'new-order-draft'").get().order_binding_state, "LEGACY_UNRESOLVED");
      assert.throws(
        () => db.prepare("UPDATE invoices SET status = 'BOOKED' WHERE id = 'new-order-draft'").run(),
        /invoice_order_binding_legacy_unresolved/
      );
    } finally { db.close(); }
  });
}

module.exports = { runRechnungBillingOrderPersistenceTests };
