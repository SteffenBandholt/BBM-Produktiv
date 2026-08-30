const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

function fixture({ today = "2026-08-20" } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-invoice-payments-"));
  const db = new Database(path.join(root, "test.db"));
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, archived_at TEXT);
    CREATE TABLE firms (id TEXT PRIMARY KEY, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER DEFAULT 0, removed_at TEXT, is_trashed INTEGER DEFAULT 0);
    CREATE TABLE project_firms (id TEXT PRIMARY KEY, project_id TEXT, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER DEFAULT 0, removed_at TEXT, is_active INTEGER DEFAULT 1);
    CREATE TABLE user_profile (id INTEGER PRIMARY KEY, name1 TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, tax_number TEXT, vat_id TEXT, iban TEXT, bic TEXT, bank_name TEXT);
  `);
  const migrations = require(path.join(process.cwd(), "src/main/db/invoiceMigrations.js"));
  migrations.ensureInvoiceSchema(db);
  db.prepare("INSERT INTO projects (id, name) VALUES ('p1', 'Projekt Eins')").run();
  db.prepare("INSERT INTO firms (id, name, street, zip, city, country, use_customer) VALUES ('f1', 'Kunde Eins', 'Kundenweg 1', '12345', 'Kundenstadt', 'DE', 1)").run();
  const firmUsagesRepo = require(path.join(process.cwd(), "src/main/db/firmUsagesRepo.js"));
  firmUsagesRepo.setUsage({ firmId: "f1", usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER, enabled: true, dbConn: db });
  db.prepare("INSERT INTO user_profile (id, name1, street, zip, city, country) VALUES (1, 'BBM Betrieb', 'Werkweg 2', '54321', 'Sitzstadt', 'DE')").run();
  const { InvoiceRepository } = require(path.join(process.cwd(), "src/main/db/invoiceRepository.js"));
  const { InvoiceService } = require(path.join(process.cwd(), "src/main/domain/rechnung/InvoiceService.js"));
  let tick = 0;
  const repository = new InvoiceRepository({
    dbProvider: () => db,
    clock: () => `2026-08-20T12:00:${String(tick++).padStart(2, "0")}.000Z`,
  });
  const service = new InvoiceService({ repository, settingsGetMany: () => ({ "invoice.paymentTermDays": "8" }), today: () => today });
  return {
    db,
    repository,
    service,
    migrations,
    close() {
      db.close();
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

const complete = (overrides = {}) => ({
  source_type: "FREE",
  document_type: "INVOICE",
  invoice_date: "2026-08-15",
  service_period_type: "SINGLE_DATE",
  service_date: "2026-08-15",
  customer_ref_kind: "global_firm",
  customer_firm_id: "f1",
  project_id: "p1",
  service_reference: "Neubau Musterstraße",
  positions: [{ id: "p1", type: "service", short_text: "Montage", quantity: "2", unit: "h", unit_price_cents: 5000, vat_rate_percent: 19 }],
  payment_term_days: 8,
  ...overrides,
});

async function book(env, overrides = {}) {
  const draft = await env.service.createDraft(complete(overrides));
  return env.service.bookDraft(draft.id);
}

async function runRechnungPaymentsTests(run) {
  await run("Rechnung R3.1 Migration: Zahlungstabelle ist additiv, idempotent und bestandserhaltend", async () => {
    const env = fixture();
    try {
      const invoice = await book(env);
      await env.service.recordPayment(invoice.id, { payment_date: "2026-08-20", amount_cents: 4000, note: "Anzahlung" });
      const before = {
        invoice: env.db.prepare("SELECT id, status, invoice_number, positions_json FROM invoices WHERE id = ?").get(invoice.id),
        sequence: env.db.prepare("SELECT sequence_key, last_value FROM invoice_number_sequences").all(),
        payments: env.db.prepare("SELECT invoice_id, payment_date, amount_cents, note FROM invoice_payments").all(),
      };
      env.migrations.ensureInvoiceSchema(env.db);
      env.migrations.ensureInvoiceSchema(env.db);
      const after = {
        invoice: env.db.prepare("SELECT id, status, invoice_number, positions_json FROM invoices WHERE id = ?").get(invoice.id),
        sequence: env.db.prepare("SELECT sequence_key, last_value FROM invoice_number_sequences").all(),
        payments: env.db.prepare("SELECT invoice_id, payment_date, amount_cents, note FROM invoice_payments").all(),
      };
      assert.deepEqual(after, before);
      assert.deepEqual(env.db.prepare("PRAGMA foreign_key_check").all(), []);
      const columns = env.db.prepare("PRAGMA table_info(invoice_payments)").all();
      assert.deepEqual(columns.map((entry) => entry.name), ["id", "invoice_id", "payment_date", "amount_cents", "note", "created_at", "updated_at"]);
    } finally { env.close(); }
  });

  await run("Rechnung R3.1 Zahlungen: DRAFT und CANCELLED werden abgelehnt, BOOKED wird gespeichert", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete());
      await assert.rejects(() => env.service.recordPayment(draft.id, { payment_date: "2026-08-20", amount_cents: 100 }), /nur für gebuchte Rechnungen/);
      assert.equal((await env.service.paymentSummary(draft.id)).payment_status, null);
      const booked = await env.service.bookDraft(draft.id);
      const payment = await env.service.recordPayment(booked.id, { payment_date: "2026-08-20", amount_cents: 4000, note: " Anzahlung " });
      assert.equal(payment.amount_cents, 4000);
      assert.equal(payment.note, "Anzahlung");
      assert.deepEqual(env.service.listPayments(booked.id).map((entry) => [entry.invoice_id, entry.amount_cents]), [[booked.id, 4000]]);
      assert.equal(env.service.get(booked.id).status, "BOOKED");
      env.db.prepare("UPDATE invoices SET status = 'CANCELLED' WHERE id = ?").run(booked.id);
      await assert.rejects(() => env.service.recordPayment(booked.id, { payment_date: "2026-08-21", amount_cents: 100 }), /nur für gebuchte Rechnungen/);
      assert.equal((await env.service.paymentSummary(booked.id)).payment_status, null);
    } finally { env.close(); }
  });

  await run("Rechnung R3.1 Zahlungen: OPEN, PARTIALLY_PAID, PAID und Überzahlung werden centgenau abgeleitet", async () => {
    const env = fixture();
    try {
      const invoice = await book(env);
      assert.deepEqual(await env.service.paymentSummary(invoice.id), {
        invoice_id: invoice.id,
        gross_cents: 11900,
        paid_cents: 0,
        open_cents: 11900,
        payment_status: "OPEN",
      });
      const first = await env.service.recordPayment(invoice.id, { payment_date: "2026-08-20", amount_cents: 4000 });
      assert.deepEqual(await env.service.paymentSummary(invoice.id), {
        invoice_id: invoice.id,
        gross_cents: 11900,
        paid_cents: 4000,
        open_cents: 7900,
        payment_status: "PARTIALLY_PAID",
      });
      await env.service.correctPayment(invoice.id, first.id, { payment_date: "2026-08-20", amount_cents: 5000, note: "Korrigiert" });
      const second = await env.service.recordPayment(invoice.id, { payment_date: "2026-08-21", amount_cents: 6900 });
      assert.deepEqual(await env.service.paymentSummary(invoice.id), {
        invoice_id: invoice.id,
        gross_cents: 11900,
        paid_cents: 11900,
        open_cents: 0,
        payment_status: "PAID",
      });
      await env.service.correctPayment(invoice.id, second.id, { payment_date: "2026-08-21", amount_cents: 8000 });
      const overpaid = await env.service.paymentSummary(invoice.id);
      assert.deepEqual([overpaid.paid_cents, overpaid.open_cents, overpaid.payment_status], [13000, 0, "PAID"]);
    } finally { env.close(); }
  });

  await run("Rechnung R3.1 Zahlungen: offene und teilbezahlte Forderungen werden erst nach Fälligkeit OVERDUE", async () => {
    const dueToday = fixture({ today: "2026-08-23" });
    try {
      const invoice = await book(dueToday);
      assert.equal((await dueToday.service.paymentSummary(invoice.id)).payment_status, "OPEN");
    } finally { dueToday.close(); }
    const overdue = fixture({ today: "2026-08-24" });
    try {
      const invoice = await book(overdue);
      assert.equal((await overdue.service.paymentSummary(invoice.id)).payment_status, "OVERDUE");
      await overdue.service.recordPayment(invoice.id, { payment_date: "2026-08-24", amount_cents: 4000 });
      const summary = await overdue.service.paymentSummary(invoice.id);
      assert.deepEqual([summary.paid_cents, summary.open_cents, summary.payment_status], [4000, 7900, "OVERDUE"]);
    } finally { overdue.close(); }
  });

  await run("Rechnung R3.1 Zahlungen: nur positive sichere Integer-Centbeträge sind zulässig", async () => {
    const env = fixture();
    try {
      const invoice = await book(env);
      for (const invalid of [0, -1, 1.5, "100", null, Number.MAX_SAFE_INTEGER + 1]) {
        await assert.rejects(() => env.service.recordPayment(invoice.id, { payment_date: "2026-08-20", amount_cents: invalid }), /positive ganze Centzahl/);
      }
      assert.throws(() => env.db.prepare(`
        INSERT INTO invoice_payments (id, invoice_id, payment_date, amount_cents, created_at, updated_at)
        VALUES ('invalid-float', ?, '2026-08-20', 1.5, '2026-08-20T00:00:00.000Z', '2026-08-20T00:00:00.000Z')
      `).run(invoice.id), /CHECK constraint failed/);
      assert.equal(env.service.listPayments(invoice.id).length, 0);
    } finally { env.close(); }
  });

  await run("Rechnung R3.1 DEV-Reset: leerer Nummernkreis wird auf 0 gesetzt und startet erneut bei 0001", async () => {
    const env = fixture();
    try {
      env.db.prepare("INSERT INTO invoice_number_sequences (sequence_key, last_value, updated_at) VALUES ('2027', 17, '2026-08-20T00:00:00.000Z')").run();
      assert.equal(env.service.getDevNumberSequence("2027").last_value, 17);
      assert.deepEqual(env.service.resetDevNumberSequence("2027"), { sequence_key: "2027", last_value: 0, updated_at: null });
      assert.equal(env.service.getDevNumberSequence("2027").last_value, 0);
      const booked = await book(env, { invoice_date: "2027-01-15", service_date: "2027-01-15" });
      assert.equal(booked.invoice_number, "2027-0001");
    } finally { env.close(); }
  });

  await run("Rechnung R3.1 DEV-Reset: vorhandene BOOKED- oder CANCELLED-Nummern blockieren ohne Umnummerierung", async () => {
    const env = fixture();
    try {
      const booked = await book(env);
      const before = env.db.prepare("SELECT status, invoice_number FROM invoices WHERE id = ?").get(booked.id);
      assert.throws(() => env.service.resetDevNumberSequence("2026"), (error) => error.code === "INVOICE_SEQUENCE_RESET_COLLISION");
      assert.deepEqual(env.db.prepare("SELECT status, invoice_number FROM invoices WHERE id = ?").get(booked.id), before);
      assert.equal(env.service.getDevNumberSequence("2026").last_value, 1);

      env.db.prepare("INSERT INTO invoice_number_sequences (sequence_key, last_value, updated_at) VALUES ('2025', 16, '2026-08-20T00:00:00.000Z')").run();
      const cancelled = await book(env, { invoice_date: "2025-12-15", service_date: "2025-12-15" });
      assert.equal(cancelled.invoice_number, "2025-0017");
      env.db.prepare("UPDATE invoices SET status = 'CANCELLED' WHERE id = ?").run(cancelled.id);
      env.db.prepare("DELETE FROM invoice_number_sequences WHERE sequence_key = '2025'").run();
      assert.throws(() => env.service.resetDevNumberSequence("2025"), (error) => error.code === "INVOICE_SEQUENCE_RESET_COLLISION");
      assert.equal(env.service.getDevNumberSequence("2025").last_value, 0);

      const uniqueIndex = env.db.prepare("PRAGMA index_list(invoices)").all().find((entry) => entry.unique === 1);
      assert.ok(uniqueIndex);
      assert.throws(() => env.db.prepare("UPDATE invoices SET invoice_number = ? WHERE id = ?").run(booked.invoice_number, cancelled.id), /UNIQUE constraint failed/);
    } finally { env.close(); }
  });
}

module.exports = { runRechnungPaymentsTests };
