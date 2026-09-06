const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Database = require("better-sqlite3");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
const { BillingOrderRepository } = require("../../src/main/db/billingOrderRepository");
const { BillingOrderService } = require("../../src/main/domain/rechnung/BillingOrderService");
const { InvoiceRepository } = require("../../src/main/db/invoiceRepository");
const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");

function fixture() {
  const db = new Database(":memory:");
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE firms (id TEXT PRIMARY KEY, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER DEFAULT 0, removed_at TEXT, is_trashed INTEGER DEFAULT 0);
    CREATE TABLE project_firms (id TEXT PRIMARY KEY, project_id TEXT, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER DEFAULT 0, removed_at TEXT, is_active INTEGER DEFAULT 1);
    CREATE TABLE user_profile (id INTEGER PRIMARY KEY, name1 TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, tax_number TEXT, vat_id TEXT, iban TEXT, bic TEXT, bank_name TEXT);
    INSERT INTO firms (id, name, street, zip, city, use_customer) VALUES ('customer', 'Bau GmbH', 'Bauweg 1', '20000', 'Hamburg', 1);
    INSERT INTO projects VALUES ('project', 'Sanierung');
    INSERT INTO user_profile (id, name1, street, zip, city) VALUES (1, 'Aussteller', 'Weg 1', '20000', 'Hamburg');
  `);
  ensureInvoiceSchema(db);
  const orders = new BillingOrderRepository({ dbProvider: () => db });
  const billing = new BillingOrderService({ repository: orders, authorize: () => {} });
  const invoices = new InvoiceRepository({ dbProvider: () => db });
  let sourceReads = 0;
  const service = new InvoiceService({ repository: invoices, billingOrderService: { get(input) {
    assert.equal(db.inTransaction, true, "Quelle muss innerhalb der Rechnungsanlage gelesen werden");
    sourceReads++;
    return billing.get(input);
  } }, settingsGetMany: () => ({}), today: () => "2026-09-06" });
  const order = billing.createDraft({ order_number: "A-25", order_date: "2026-08-01", customer_firm_id: "customer", project_id: "project", service_reference: "Umbau Musterstraße" });
  const heading = billing.addPosition({ id: order.id, position: { type: "heading", position_number: "10", sort_index: 10, short_text: "Rohbau", long_text: "Vertragstext" } });
  billing.addPosition({ id: order.id, position: { parent_position_id: heading.id, type: "service", position_number: "25", sort_index: 30, short_text: "Mauerwerk", long_text: "Unverändert übernehmen", quantity: "12.5000", unit: "m2", unit_price_cents: 12345, vat_rate_percent: 19, price_input_mode: "NET" } });
  // A root before the title's child exposes unwanted free hierarchy sorting.
  billing.addPosition({ id: order.id, position: { type: "service", position_number: "40.01", sort_index: 20, short_text: "Anfahrt", quantity: "1", unit: "St", unit_price_cents: 5000 } });
  const confirm = () => billing.confirmOrder({ id: order.id });
  const create = (patch = {}) => service.createDraftFromOrder({ source_order_id: order.id, service_period_type: "SINGLE_DATE", service_date: "2026-09-01", ...patch });
  return { db, orders, billing, invoices, service, order, confirm, create, reads: () => sourceReads };
}

async function runRechnungOrderSnapshotTests(run) {
  await run("Rechnung #275 Paket 4c: atomarer eigener Snapshot bewahrt Vertragskopf, IDs, Nummern, Reihenfolge und Werte", async () => {
    const e = fixture();
    try {
      const source = e.confirm();
      e.orders.createDraftAmendment(source.id, { relates_to_order_position_id: source.positions.find(p => p.type === "service").id, short_text: "Nicht übernehmen" });
      const draft = await e.create();
      assert.equal(e.reads(), 1);
      assert.equal(draft.source_type, "FROM_ORDER");
      assert.equal(draft.order_binding_state, "BOUND");
      assert.equal(draft.status, "DRAFT");
      assert.equal(draft.invoice_number, null);
      assert.equal(draft.source_order_id, source.id);
      assert.equal(draft.source_order_number, "A-25");
      assert.equal(draft.source_order_date, "2026-08-01");
      assert.equal(draft.customer_firm_id, source.customer_firm_id);
      assert.equal(draft.project_id, source.project_id);
      assert.equal(draft.service_reference, source.service_reference);
      assert.ok(draft.order_snapshot_at);
      const snapshot = JSON.parse(draft.order_snapshot_json);
      assert.deepEqual(snapshot.positions, draft.positions);
      assert.equal(snapshot.order.amendments, undefined);
      assert.equal(draft.positions.length, source.positions.length);
      for (const [i, p] of draft.positions.entries()) {
        const original = source.positions[i];
        assert.notEqual(p.id, original.id);
        assert.equal(p.source_order_position_id, original.id);
        assert.equal(p.source_order_id, source.id);
        assert.equal(p.position_origin, "CONTRACT");
        for (const key of ["type", "position_number", "sort_index", "short_text", "long_text", "quantity", "unit", "unit_price_cents", "vat_rate_percent", "price_input_mode", "price_input_cents", "is_nep"]) assert.deepEqual(p[key], original[key], key);
        assert.equal(p.parent_id, original.parent_position_id ? draft.positions.find(x => x.source_order_position_id === original.parent_position_id).id : null);
      }
      const second = await e.create();
      assert.notEqual(second.id, draft.id);
      assert.notEqual(second.positions[0].id, draft.positions[0].id);
      assert.equal(e.db.prepare("SELECT COUNT(*) n FROM invoices").get().n, 2);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4c: nur bestätigte Quelle, keine Client-Snapshots oder LEGACY_UNRESOLVED", async () => {
    const e = fixture();
    try {
      await assert.rejects(() => e.create(), /invoice_order_source_not_confirmed/);
      await assert.rejects(() => e.create({ order_binding_state: "LEGACY_UNRESOLVED" }), /legacy_unresolved/);
      await assert.rejects(() => e.create({ source_order_id: "A-25" }), /billing_order_id_invalid/);
      e.confirm();
      for (const patch of [{ positions: [] }, { order_snapshot_json: "{}" }, { customer_firm_id: "other" }, { source_order_number: "A-25" }, { document_type: "PARTIAL" }, { id: "old-invoice" }]) await assert.rejects(() => e.create(patch), /invoice_order_field_not_allowed/);
      await assert.rejects(() => e.service.createDraft({ source_type: "FROM_ORDER" }), /requires_snapshot_creation/);
      e.db.prepare("UPDATE billing_orders SET status = 'CANCELLED' WHERE id = ?").run(e.order.id);
      await assert.rejects(() => e.create(), /invoice_order_source_not_confirmed/);
      assert.equal(e.db.prepare("SELECT COUNT(*) n FROM invoices").get().n, 0);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4c: Anlagefehler rollen gesamte Transaktion ohne halbe Rechnung zurück", async () => {
    const e = fixture();
    try {
      e.confirm();
      await assert.rejects(() => e.create({ service_date: "2026-02-30" }), /Leistungsdatum/);
      const insert = e.invoices.createDraft.bind(e.invoices);
      e.invoices.createDraft = (...args) => { insert(...args); throw new Error("simulierter Abschlussfehler"); };
      await assert.rejects(() => e.create(), /simulierter Abschlussfehler/);
      assert.equal(e.db.prepare("SELECT COUNT(*) n FROM invoices").get().n, 0);
      assert.equal(e.db.inTransaction, false);
      assert.equal(e.billing.get({ id: e.order.id }).status, "CONFIRMED");
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4c: spätere Quellenzustände und weitere Nachträge ändern bestehende Entwürfe nicht", async () => {
    const e = fixture();
    try {
      e.confirm();
      const draft = await e.create();
      const immutable = draft.positions_json;
      draft.positions[0].short_text = "Client-Mutation";
      const source = e.orders.get(e.order.id);
      source.positions[0].short_text = "Mutierte Lesekopie";
      e.orders.createDraftAmendment(source.id, { relates_to_order_position_id: source.positions.find(p => p.type === "service").id, short_text: "Spätere Leistung" });
      e.db.prepare("UPDATE billing_orders SET status = 'CANCELLED' WHERE id = ?").run(source.id);
      const updated = await e.service.updateDraft(draft.id, { intro_text: "Nur Rechnungstext", payment_term_days: 14, installment_number: "" });
      assert.equal(updated.positions_json, immutable);
      assert.equal(updated.order_snapshot_json, draft.order_snapshot_json);
      assert.equal((await e.service.previewDraft(draft.id)).positions_json, immutable);
      const booked = await e.service.bookDraft(draft.id);
      assert.equal(booked.status, "BOOKED");
      assert.equal(booked.positions_json, immutable);
      assert.equal(booked.order_snapshot_at, draft.order_snapshot_at);
      assert.equal(e.reads(), 1, "Speichern/Vorschauen/Buchen dürfen die Quelle nicht erneut lesen");
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4c: Quellkopie ist bei Speichern, Vorschauen und Buchen manipulationsgeschützt", async () => {
    const e = fixture();
    try {
      e.confirm();
      const draft = await e.create();
      const edits = [
        { source_type: "FREE" }, { source_order_id: "other" }, { source_order_number: "Neu" }, { source_order_date: "2026-09-01" },
        { order_binding_state: "NOT_APPLICABLE" }, { order_snapshot_at: "now" }, { order_snapshot_json: "{}" },
        { customer_firm_id: "other" }, { service_reference: "Anderer Vertrag" }, { document_type: "FINAL" },
        { positions: draft.positions.slice().reverse() }, { positions: draft.positions.slice(1) },
        ...["position_number", "sort_index", "source_order_position_id", "source_order_id", "parent_id", "position_origin", "quantity", "short_text"].map(key => ({ positions: draft.positions.map((p, i) => i === 0 ? { ...p, [key]: "manipuliert" } : p) })),
      ];
      for (const operation of ["updateDraft", "previewDraft", "bookDraft"]) for (const edit of edits) await assert.rejects(() => e.service[operation](draft.id, edit), /snapshot_immutable/);
      assert.deepEqual(e.invoices.get(draft.id), draft);
      assert.equal(e.db.prepare("SELECT COUNT(*) n FROM invoice_number_sequences").get().n, 0);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4c: Persistenz schützt Snapshot und erlaubt keine nachträgliche Legacy-Bindung", async () => {
    const e = fixture();
    try {
      e.confirm();
      const draft = await e.create();
      for (const field of ["positions_json", "order_snapshot_json", "order_snapshot_at", "source_order_id", "source_order_number", "service_reference"]) assert.throws(() => e.db.prepare(`UPDATE invoices SET ${field} = 'changed' WHERE id = ?`).run(draft.id), /snapshot_immutable/);
      assert.throws(() => e.invoices.updateDraft(draft.id, { ...draft, positions: [] }), /snapshot_immutable/);
      e.db.prepare("INSERT INTO invoices (id, source_type, source_order_id, source_order_number, positions_json, invoice_date, due_date, created_at, updated_at) VALUES ('legacy', 'FROM_ORDER', ?, 'A-25', '[{\"position_number\":\"25\"}]', '2025-01-01', '2025-01-09', 'old', 'old')").run(e.order.id);
      const old = e.invoices.get("legacy");
      assert.throws(() => e.db.prepare("UPDATE invoices SET order_binding_state = 'BOUND' WHERE id = 'legacy'").run(), /create_only/);
      for (const operation of ["updateDraft", "previewDraft", "bookDraft"]) await assert.rejects(() => e.service[operation]("legacy", {}), /legacy_unresolved/);
      ensureInvoiceSchema(e.db);
      ensureInvoiceSchema(e.db);
      assert.deepEqual(e.invoices.get("legacy"), old);
      assert.deepEqual(e.invoices.get(draft.id), draft);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4c: freie Rechnung behält freie Nummerierung und bearbeitbare Positionen", async () => {
    const e = fixture();
    try {
      const draft = await e.service.createDraft({ source_type: "FREE", invoice_date: "2026-09-06", service_period_type: "SINGLE_DATE", service_date: "2026-09-01", customer_ref_kind: "global_firm", customer_firm_id: "customer", positions: [{ id: "free1", type: "service", short_text: "Frei", quantity: "2", unit_price_cents: 100 }] });
      const updated = await e.service.updateDraft(draft.id, { positions: [{ ...draft.positions[0], quantity: "3" }] });
      assert.equal(updated.positions[0].position_number, "01");
      assert.equal(updated.positions[0].quantity, "3");
      assert.equal(updated.order_snapshot_at, null);
      assert.equal(updated.order_snapshot_json, null);
      assert.equal(e.reads(), 0);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4c: Screen-Datenpfad erhält Vertragsreihenfolge und sperrt freie Operationen", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    function method(name) {
      const start = source.indexOf(`  ${name}(`);
      const next = /\n  \w+\(/.exec(source.slice(start + 3));
      const block = source.slice(start, start + 3 + next.index);
      return new Function("normalizeInvoicePositions", `return ({${block}}).${name}`)(() => { throw new Error("Freie Normalisierung verboten"); });
    }
    const positions = [{ id: "title", sort_index: 10 }, { id: "root", sort_index: 20 }, { id: "child", parent_id: "title", sort_index: 30 }];
    const screen = { current: { status: "DRAFT", order_binding_state: "BOUND" }, source: { value: "FREE" }, positions };
    method("_normalizePositions").call(screen);
    assert.deepEqual(method("_orderedPositions").call(screen), positions);
    assert.equal(method("_isFreeDraft").call(screen), false);
    method("_deletePosition").call(screen);
    assert.deepEqual(screen.positions, positions);
  });

  await run("Rechnung #275 Paket 4c: Preload und Rechnungs-IPC erzeugen genau einen Snapshot pro Anlageaufruf", async () => {
    const e = fixture();
    try {
      e.confirm();
      const handlers = new Map();
      require("../../src/main/ipc/rechnungIpc").registerRechnungIpc({ ipcMain: { handle: (name, fn) => handlers.set(name, fn) }, service: e.service, billingOrderService: e.billing, firmDirectory: {}, projectRepository: {}, pdfFinalizer: {} });
      let api;
      vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), "src/main/preload.js"), "utf8"), { require: (name) => {
        assert.equal(name, "electron");
        return { contextBridge: { exposeInMainWorld: (key, value) => { if (key === "bbmDb") api = value; } }, ipcRenderer: { invoke: (channel, input) => handlers.get(channel)({}, input), on() {} } };
      }, console, process: { env: {} } });
      const result = await api.rechnungCreateDraftFromOrder({ source_order_id: e.order.id, service_period_type: "SINGLE_DATE", service_date: "2026-09-01" });
      assert.equal(result.ok, true);
      const draft = result.data;
      assert.equal(draft.order_binding_state, "BOUND");
      const saved = await api.rechnungUpdateDraft(draft.id, { positions: draft.positions, installment_number: "", intro_text: "IPC-Speicherung" });
      assert.equal(saved.ok, true);
      assert.deepEqual(saved.data.positions, draft.positions);
      const bad = await api.rechnungUpdateDraft(draft.id, { positions: [] });
      assert.equal(bad.ok, false);
      assert.equal(bad.code, "invoice_order_snapshot_immutable");
      assert.equal(e.db.prepare("SELECT COUNT(*) n FROM invoices").get().n, 1);
      assert.equal(e.reads(), 1);
    } finally { e.db.close(); }
  });
}

module.exports = { runRechnungOrderSnapshotTests, orderSnapshotFixture: fixture };
