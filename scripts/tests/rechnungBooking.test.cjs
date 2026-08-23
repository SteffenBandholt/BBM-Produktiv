const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

function fixture({ settings = { "invoice.paymentTermDays": "8" } } = {}) {
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
  const firmUsagesRepo = require(path.join(process.cwd(), "src/main/db/firmUsagesRepo.js"));
  firmUsagesRepo.setUsage({
    firmId: "f1",
    usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER,
    enabled: true,
    dbConn: db,
  });
  db.prepare("INSERT INTO user_profile (id, name1, name2, street, zip, city, country, iban) VALUES (1, 'BBM Betrieb', 'Inhaber', 'Werkweg 2', '54321', 'Sitzstadt', 'DE', 'DE001')").run();
  const { InvoiceRepository } = require(path.join(process.cwd(), "src/main/db/invoiceRepository.js"));
  const { InvoiceService } = require(path.join(process.cwd(), "src/main/domain/rechnung/InvoiceService.js"));
  let tick = 0;
  const repository = new InvoiceRepository({ dbProvider: () => db, clock: () => `2026-08-15T12:00:${String(tick++).padStart(2, "0")}.000Z` });
  const service = new InvoiceService({ repository, settingsGetMany: () => settings, today: () => "2026-08-15" });
  return { db, repository, service, close() { db.close(); fs.rmSync(root, { recursive: true, force: true }); } };
}

const complete = (overrides = {}) => ({ source_type: "FREE", document_type: "INVOICE", invoice_date: "2026-08-15", service_period_type: "RANGE", service_period_start: "2026-03-01", service_period_end: "2026-06-30", customer_ref_kind: "global_firm", customer_firm_id: "f1", project_id: "p1", service_reference: "Neubau Musterstraße", construction_project: "Haus A", positions: [{ id: "p1", type: "service", short_text: "Montage", quantity: "2", unit: "h", unit_price_cents: 5000 }], payment_term_days: 8, ...overrides });
const positionSnapshot = (entries) => entries.map((entry) => [entry.id, entry.parent_id, entry.type, entry.is_title, entry.short_text, entry.long_text, entry.quantity, entry.unit, entry.unit_price_cents, entry.is_nep, entry.position_number]);

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
      assert.equal(updated.construction_project, "Haus A"); assert.equal(updated.positions[0].total_cents, 10000);
      assert.equal(env.service.get(draft.id).service_period_start, "2026-03-01");
    } finally { env.close(); }
  });

  await run("Rechnung MwSt. Step 1: der aus einer Quelle uebernommene Satz bleibt als Rechnungspositionswert erhalten", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete({ positions: [{ id: "catalog-position", type: "service", short_text: "Katalogleistung", quantity: "1", unit: "St", unit_price_cents: 10000, vat_rate_percent: 7 }] }));
      assert.equal(draft.positions[0].vat_rate_percent, 7);
      const saved = await env.service.updateDraft(draft.id, { service_reference: "Unabhaengiger Rechnungsstand" });
      const stored = JSON.parse(env.db.prepare("SELECT positions_json FROM invoices WHERE id = ?").get(draft.id).positions_json);
      assert.equal(saved.positions[0].vat_rate_percent, 7);
      assert.equal(stored[0].vat_rate_percent, 7);
      assert.equal((await env.service.bookDraft(draft.id)).positions[0].vat_rate_percent, 7);
    } finally { env.close(); }
  });

  await run("Rechnung Preisbedienung: DRAFT, erneutes Laden und Buchung bewahren Brutto-Eingabemodus und Preis", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete({ positions: [{ id: "gross-position", type: "service", short_text: "Bruttoleistung", quantity: "1", unit: "St", unit_price_cents: 11900, price_input_cents: 11900, price_input_mode: "GROSS", vat_rate_percent: 19 }] }));
      assert.deepEqual(draft.positions.map((entry) => [entry.unit_price_cents, entry.price_input_mode, entry.price_input_cents]), [[10000, "GROSS", 11900]]);
      const saved = await env.service.updateDraft(draft.id, { service_reference: "Brutto bleibt gespeichert" });
      assert.deepEqual(env.service.get(saved.id).positions.map((entry) => [entry.unit_price_cents, entry.price_input_mode, entry.price_input_cents]), [[10000, "GROSS", 11900]]);
      assert.deepEqual((await env.service.bookDraft(draft.id)).positions.map((entry) => [entry.unit_price_cents, entry.price_input_mode, entry.price_input_cents]), [[10000, "GROSS", 11900]]);
    } finally { env.close(); }
  });

  await run("Rechnung Freitext: DRAFT speichert, lädt und leert mehrzeiligen Rechnungsinhalt unverändert", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete());
      assert.equal(draft.intro_text, "");
      const introText = "Sehr geehrte Damen und Herren,\n\nich erlaube mir gem. Auftrag vom 12.01.2025 in Rechnung zu stellen:";
      const updated = await env.service.updateDraft(draft.id, { intro_text: introText });
      assert.equal(updated.intro_text, introText);
      assert.equal(env.service.get(draft.id).intro_text, introText);
      assert.equal((await env.service.previewDraft(draft.id)).intro_text, introText);
      const cleared = await env.service.updateDraft(draft.id, { intro_text: "" });
      assert.equal(cleared.intro_text, "");
    } finally { env.close(); }
  });

  await run("Rechnung Hierarchie-Kern: DRAFT, Vorschau und Buchung behalten parent_id und abgeleitete Nummern", async () => {
    const env = fixture();
    try {
      const invoicePositions = [
        { id: "title", type: "heading", short_text: "Abschnitt" },
        { id: "child", type: "service", parent_id: "title", short_text: "Leistung", quantity: "2", unit: "h", unit_price_cents: 5000 },
        { id: "nep", type: "service", parent_id: "title", short_text: "Bedarfsposition", quantity: "1", unit: "Stk", unit_price_cents: 1200, is_nep: true },
      ];
      const draft = await env.service.createDraft(complete({ positions: invoicePositions }));
      assert.deepEqual(draft.positions.map((entry) => [entry.id, entry.parent_id, entry.position_number, entry.is_nep]), [["title", null, "1", false], ["child", "title", "1.01", false], ["nep", "title", "1.02", true]]);
      const preview = await env.service.previewDraft(draft.id);
      assert.deepEqual(preview.positions.map((entry) => entry.position_number), ["1", "1.01", "1.02"]);
      const booked = await env.service.bookDraft(draft.id);
      assert.deepEqual(booked.positions.map((entry) => [entry.id, entry.parent_id, entry.position_number, entry.is_nep]), [["title", null, "1", false], ["child", "title", "1.01", false], ["nep", "title", "1.02", true]]);
      assert.deepEqual(env.service.get(draft.id).positions.map((entry) => [entry.id, entry.parent_id, entry.position_number, entry.is_nep]), [["title", null, "1", false], ["child", "title", "1.01", false], ["nep", "title", "1.02", true]]);
    } finally { env.close(); }
  });

  await run("Rechnung Positions-Text: DRAFT speichert und laedt Kurz- und mehrzeiligen Langtext unveraendert", async () => {
    const env = fixture();
    try {
      const positions = [{ id: "text-1", type: "heading", is_title: false, short_text: "Hinweis zum Leistungsumfang", long_text: "Erste Zeile\nZweite Zeile", quantity: null, unit: null, unit_price_cents: null }];
      const draft = await env.service.createDraft(complete({ positions }));
      assert.deepEqual(draft.positions.map((entry) => [entry.is_title, entry.position_number, entry.short_text, entry.long_text]), [[false, null, "Hinweis zum Leistungsumfang", "Erste Zeile\nZweite Zeile"]]);
      const saved = await env.service.updateDraft(draft.id, { positions: draft.positions });
      assert.deepEqual(env.service.get(saved.id).positions.map((entry) => [entry.is_title, entry.position_number, entry.short_text, entry.long_text]), [[false, null, "Hinweis zum Leistungsumfang", "Erste Zeile\nZweite Zeile"]]);
    } finally { env.close(); }
  });

  await run("Rechnung Positions-Persistenz: DRAFT behaelt Editboxwerte, NEP und Hierarchie bis positions_json und erneutem Laden", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete({ positions: [
        { id: "title", type: "heading", is_title: true, short_text: "Fensterarbeiten" },
        { id: "remove", type: "service", parent_id: "title", short_text: "Ausbau Fenster", long_text: "Vorhandenes Fenster fachgerecht ausbauen und entsorgen.", quantity: "1", unit: "St", unit_price_cents: 12500 },
        { id: "supply", type: "service", parent_id: "title", short_text: "Lieferung Fenster", long_text: "Kunststofffenster liefern.", quantity: "1", unit: "St", unit_price_cents: 75000 },
        { id: "nep", type: "service", parent_id: "title", short_text: "Bedarfsposition", long_text: "Nur bei Bedarf ausfuehren.", quantity: "2", unit: "St", unit_price_cents: 10000, is_nep: true },
      ] }));
      const edited = draft.positions.map((entry) => entry.id === "remove" ? { ...entry, short_text: "Ausbau Bestandsfenster", long_text: "Bestandsfenster fachgerecht ausbauen und entsorgen." } : entry);
      const saved = await env.service.updateDraft(draft.id, { positions: edited });
      const raw = JSON.parse(env.db.prepare("SELECT positions_json FROM invoices WHERE id = ?").get(draft.id).positions_json);
      const expected = [["title", null, "heading", true, "Fensterarbeiten", "", null, null, null, false, "1"], ["remove", "title", "service", false, "Ausbau Bestandsfenster", "Bestandsfenster fachgerecht ausbauen und entsorgen.", "1", "St", 12500, false, "1.01"], ["supply", "title", "service", false, "Lieferung Fenster", "Kunststofffenster liefern.", "1", "St", 75000, false, "1.02"], ["nep", "title", "service", false, "Bedarfsposition", "Nur bei Bedarf ausfuehren.", "2", "St", 10000, true, "1.03"]];
      assert.deepEqual(positionSnapshot(saved.positions), expected);
      assert.deepEqual(positionSnapshot(raw), expected);
      assert.deepEqual(positionSnapshot(env.service.get(draft.id).positions), expected);
      assert.equal(saved.positions.find((entry) => entry.id === "nep").total_cents, null);
    } finally { env.close(); }
  });

  await run("Rechnung Hierarchie-Kern: bestehender DRAFT ohne parent_id bleibt auf Ebene 0 speicherbar", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete());
      env.db.prepare("UPDATE invoices SET positions_json = ? WHERE id = ?").run(JSON.stringify([
        { id: "legacy-position", type: "service", short_text: "Altbestand", quantity: "1", unit_price_cents: 2500 },
      ]), draft.id);
      const updated = await env.service.updateDraft(draft.id, { service_reference: "Weiterbearbeitet" });
      assert.deepEqual(updated.positions.map((entry) => [entry.id, entry.parent_id, entry.position_number, entry.total_cents]), [["legacy-position", null, "01", 2500]]);
    } finally { env.close(); }
  });

  await run("Rechnung Step 2: Zahlungsziel-Setting unterscheidet fehlend, null, 0 Tage und ungültig", async () => {
    const cases = [
      ["fehlender Key", {}, 8, "2026-08-23"],
      ["leerer Settings-Wert", { "invoice.paymentTermDays": "" }, 8, "2026-08-23"],
      ["null", { "invoice.paymentTermDays": null }, 8, "2026-08-23"],
      ["vierzehn Tage", { "invoice.paymentTermDays": "14" }, 14, "2026-08-29"],
      ["0 Tage", { "invoice.paymentTermDays": "0" }, 0, "2026-08-15"],
      ["negativ", { "invoice.paymentTermDays": "-1" }, 8, "2026-08-23"],
      ["zu groß", { "invoice.paymentTermDays": "3651" }, 8, "2026-08-23"],
      ["nicht numerisch", { "invoice.paymentTermDays": "abc" }, 8, "2026-08-23"],
    ];
    for (const [label, settings, paymentTermDays, dueDate] of cases) {
      const env = fixture({ settings });
      try {
        const defaults = await env.service.defaults();
        assert.deepEqual([defaults.payment_term_days, defaults.due_date], [paymentTermDays, dueDate], label);
      } finally { env.close(); }
    }
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
      assert.equal(restored.positions[0].short_text, "Montage");
      await assert.rejects(() => env.service.updateDraft(draft.id, { invoice_date: "2026-08-16" }), /nicht geändert/);
      assert.throws(() => env.service.deleteDraft(draft.id), /nicht gelöscht/);
      await assert.rejects(() => env.service.bookDraft(draft.id), /Nur Entwürfe/);
    } finally { env.close(); }
  });

  await run("Rechnung Freitext: Buchung hält den Inhalt fest und die bestehende Sperre verweigert Änderungen", async () => {
    const env = fixture();
    try {
      const introText = "Abschlagsrechnung\nBauabschnitt 2";
      const draft = await env.service.createDraft(complete({ intro_text: introText }));
      const booked = await env.service.bookDraft(draft.id);
      assert.equal(booked.intro_text, introText);
      await assert.rejects(() => env.service.updateDraft(draft.id, { intro_text: "Nicht zulässig" }), /nicht geändert/);
      assert.equal(env.service.get(draft.id).intro_text, introText);
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
    for (const forbidden of ["zugferd", "pdf"]) assert.equal(ipc.toLowerCase().includes(forbidden), false, forbidden);
  });

  await run("Rechnung Step 1.4/2: echter Screen verbindet Belegkopf und Positionsarbeit", () => {
    const screen = fs.readFileSync(path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    const router = fs.readFileSync(path.join(process.cwd(), "src/renderer/app/Router.js"), "utf8");
    for (const required of ["Freie Rechnung", "Bauvorhaben / Leistungsbezug", "Rechnungspositionen", "positionQuantity", "positionPrice", "positionNep", "Proberechnung", "Rechnung buchen", "Entwurf verwerfen", "Erstellt / Gebucht", "serviceMonth", "customer_snapshot", "issuer_snapshot"]) assert.equal(screen.includes(required), true, required);
    for (const forbidden of ["INVOICE_DESIGN_POSITIONS", "invoice-positions-table", "ZUGFeRD", "Skonto"]) assert.equal(screen.includes(forbidden), false, forbidden);
    assert.equal(router.includes("new mod.RechnungScreen"), true);
    assert.equal(router.includes('pageTitle: "Rechnungen"'), true);
    assert.equal(router.includes("hideSidebar: true"), true);
  });
}

module.exports = { runRechnungBookingTests };
