const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-invoice-booking-"));
  const db = new Database(path.join(root, "test.db"));
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, archived_at TEXT);
    CREATE TABLE firms (id TEXT PRIMARY KEY, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER DEFAULT 0, removed_at TEXT, is_trashed INTEGER DEFAULT 0);
    CREATE TABLE project_firms (id TEXT PRIMARY KEY, project_id TEXT, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER DEFAULT 0, removed_at TEXT, is_active INTEGER DEFAULT 1);
    CREATE TABLE user_profile (id INTEGER PRIMARY KEY, name1 TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, tax_number TEXT, vat_id TEXT, iban TEXT, bic TEXT, bank_name TEXT);
  `);
  require(path.join(process.cwd(), "src/main/db/invoiceMigrations.js")).ensureInvoiceSchema(db);
  db.prepare("INSERT INTO projects (id, name) VALUES ('p1', 'Projekt Eins')").run();
  db.prepare("INSERT INTO firms (id, name, street, zip, city, country, use_customer) VALUES ('f1', 'Kunde Alt', 'Altweg 1', '12345', 'Altstadt', 'DE', 1)").run();
  db.prepare("INSERT INTO user_profile (id, name1, name2, street, zip, city, country, iban) VALUES (1, 'BBM Betrieb', 'Inhaber', 'Werkweg 2', '54321', 'Sitzstadt', 'DE', 'DE001')").run();
  const { InvoiceRepository } = require(path.join(process.cwd(), "src/main/db/invoiceRepository.js"));
  const { InvoiceService } = require(path.join(process.cwd(), "src/main/domain/rechnung/InvoiceService.js"));
  let tick = 0;
  const repository = new InvoiceRepository({ dbProvider: () => db, clock: () => `2026-08-15T12:00:${String(tick++).padStart(2, "0")}.000Z` });
  const service = new InvoiceService({ repository, settingsGetMany: () => ({ "invoice.paymentTermDays": "8" }), today: () => "2026-08-15" });
  return { db, repository, service, close() { db.close(); fs.rmSync(root, { recursive: true, force: true }); } };
}

const complete = (overrides = {}) => ({ source_type: "FREE", document_type: "INVOICE", invoice_date: "2026-08-15", service_period_type: "RANGE", service_period_start: "2026-03-01", service_period_end: "2026-06-30", customer_ref_kind: "global_firm", customer_firm_id: "f1", project_id: "p1", service_reference: "Neubau Musterstraße", payment_term_days: 8, ...overrides });

async function runRechnungBookingTests(run) {
  await run("Rechnung Step 2 A-B: neuer und gespeicherter Entwurf bleiben nummernlos und vollständig bearbeitbar", async () => {
    const env = fixture();
    try {
      const defaults = await env.service.defaults();
      assert.deepEqual([defaults.invoice_date, defaults.payment_term_days, defaults.due_date], ["2026-08-15", 8, "2026-08-23"]);
      const draft = await env.service.createDraft({ ...complete(), service_reference: "Erster Stand" });
      assert.equal(draft.status, "DRAFT"); assert.equal(draft.invoice_number, null);
      const updated = await env.service.updateDraft(draft.id, { service_reference: "Gespeicherter Stand", payment_term_days: 10 });
      assert.equal(updated.service_reference, "Gespeicherter Stand"); assert.equal(updated.due_date, "2026-08-25"); assert.equal(updated.invoice_number, null);
      assert.equal(env.service.get(draft.id).service_period_start, "2026-03-01");
    } finally { env.close(); }
  });

  await run("Rechnung Step 2 C-D: Löschen verbraucht keine Nummer und Pflichtfeldfehler buchen nicht", async () => {
    const env = fixture();
    try {
      const deleted = await env.service.createDraft(complete());
      env.service.deleteDraft(deleted.id);
      assert.equal(env.db.prepare("SELECT COUNT(*) AS count FROM invoice_number_sequences").get().count, 0);
      const invalid = await env.service.createDraft({ ...complete(), customer_ref_kind: null, customer_firm_id: null, service_reference: null });
      await assert.rejects(() => env.service.bookDraft(invalid.id), /Rechnungskunden/);
      assert.equal(env.service.get(invalid.id).status, "DRAFT");
      assert.equal(env.db.prepare("SELECT COUNT(*) AS count FROM invoice_number_sequences").get().count, 0);
    } finally { env.close(); }
  });

  await run("Rechnung Step 2 E-H: Buchung friert Kopf und beide Snapshots unveränderlich ein", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete());
      const booked = await env.service.bookDraft(draft.id);
      assert.equal(booked.status, "BOOKED"); assert.equal(booked.invoice_number, "2026-0001"); assert.ok(booked.booked_at);
      assert.equal(booked.customer_snapshot.companyName, "Kunde Alt"); assert.equal(booked.issuer_snapshot.companyName, "BBM Betrieb");
      env.db.prepare("UPDATE firms SET name='Kunde Neu', street='Neuweg 9' WHERE id='f1'").run();
      env.db.prepare("UPDATE user_profile SET name1='Betrieb Neu', iban='DE999' WHERE id=1").run();
      const restored = env.service.get(draft.id);
      assert.equal(restored.customer_snapshot.companyName, "Kunde Alt"); assert.equal(restored.customer_snapshot.street, "Altweg 1");
      assert.equal(restored.issuer_snapshot.companyName, "BBM Betrieb"); assert.equal(restored.issuer_snapshot.iban, "DE001");
      await assert.rejects(() => env.service.updateDraft(draft.id, { invoice_date: "2026-08-16" }), /nicht geändert/);
      assert.throws(() => env.service.deleteDraft(draft.id), /nicht gelöscht/);
      await assert.rejects(() => env.service.bookDraft(draft.id), /Nur Entwürfe/);
    } finally { env.close(); }
  });

  await run("Rechnung Step 2 I: nur Buchungen erhöhen die atomare Jahresfolge", async () => {
    const env = fixture();
    try {
      const a = await env.service.createDraft(complete({ service_reference: "A" }));
      const b = await env.service.createDraft(complete({ service_reference: "B" }));
      env.service.deleteDraft(a.id);
      const first = await env.service.bookDraft(b.id);
      const c = await env.service.createDraft(complete({ service_reference: "C" }));
      const d = await env.service.createDraft(complete({ service_reference: "D" }));
      const [second, third] = await Promise.all([env.service.bookDraft(c.id), env.service.bookDraft(d.id)]);
      assert.deepEqual([first.invoice_number, second.invoice_number, third.invoice_number], ["2026-0001", "2026-0002", "2026-0003"]);
      assert.equal(new Set([first.invoice_number, second.invoice_number, third.invoice_number]).size, 3);
      assert.deepEqual(env.db.prepare("SELECT sequence_key, last_value FROM invoice_number_sequences").all(), [{ sequence_key: "2026", last_value: 3 }]);
    } finally { env.close(); }
  });

  await run("Rechnung Step 2 J-K: Monatsdaten und Proberechnung bleiben strukturiert, nummernlos und DRAFT", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete({ service_period_type: "MONTH", service_period_start: null, service_period_end: null, service_month: "2026-07" }));
      assert.deepEqual([draft.service_period_type, draft.service_period_start, draft.service_period_end], ["MONTH", "2026-07-01", "2026-07-31"]);
      const preview = await env.service.previewDraft(draft.id, { service_reference: "Vorschauänderung" });
      assert.equal(preview.preview, true); assert.equal(preview.status, "DRAFT"); assert.equal(preview.invoice_number, null);
      assert.equal(env.service.get(draft.id).service_reference, "Neubau Musterstraße");
      assert.equal(env.db.prepare("SELECT COUNT(*) AS count FROM invoice_number_sequences").get().count, 0);
    } finally { env.close(); }
  });

  await run("Rechnung Step 2: IPC und Preload bieten nur den abgegrenzten Belegkopf-Vertrag", () => {
    const ipc = fs.readFileSync(path.join(process.cwd(), "src/main/ipc/rechnungIpc.js"), "utf8");
    const preload = fs.readFileSync(path.join(process.cwd(), "src/main/preload.js"), "utf8");
    for (const channel of ["defaults", "list", "get", "createDraft", "updateDraft", "deleteDraft", "previewDraft", "bookDraft", "listCustomers", "listProjects"]) {
      assert.equal(ipc.includes(`rechnung:${channel}`), true, channel);
    }
    for (const token of ["rechnungDefaults", "rechnungList", "rechnungGet", "rechnungCreateDraft", "rechnungUpdateDraft", "rechnungDeleteDraft", "rechnungPreviewDraft", "rechnungBookDraft", "rechnungListCustomers", "rechnungListProjects"]) assert.equal(preload.includes(token), true, token);
    for (const forbidden of ["position", "tax", "zugferd", "pdf"]) assert.equal(ipc.toLowerCase().includes(forbidden), false, forbidden);
  });

  await run("Rechnung Step 2: echter Screen ersetzt den Dummy-Einstieg und enthält nur den Belegkopf", () => {
    const screen = fs.readFileSync(path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    const router = fs.readFileSync(path.join(process.cwd(), "src/renderer/app/Router.js"), "utf8");
    for (const required of ["Freie Rechnung", "Bauvorhaben / Leistungsbezug", "Proberechnung", "Rechnung buchen", "Entwurf verwerfen", "Erstellt / Gebucht", "serviceMonth", "customer_snapshot", "issuer_snapshot"]) assert.equal(screen.includes(required), true, required);
    for (const forbidden of ["INVOICE_DESIGN_POSITIONS", "invoice-positions-table", "USt. 19 %", "Rechnungsbetrag", "ZUGFeRD", "Skonto"]) assert.equal(screen.includes(forbidden), false, forbidden);
    assert.equal(router.includes("new mod.RechnungScreen"), true);
    assert.equal(router.includes('pageTitle: "Rechnungen"'), true);
    assert.equal(router.includes("hideSidebar: true"), true);
  });
}

module.exports = { runRechnungBookingTests };
