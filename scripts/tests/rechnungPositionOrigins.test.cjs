const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ORIGIN_FIELDS = Object.freeze([
  "catalog_item_id",
  "source_offer_id",
  "source_offer_position_id",
  "source_order_id",
  "source_order_position_id",
]);

const ORIGIN_VALUES = Object.freeze({
  catalog_item_id: "catalog-17",
  source_offer_id: "offer-23",
  source_offer_position_id: "offer-position-42",
  source_order_id: "order-31",
  source_order_position_id: "order-position-99",
});

function originValues(position) {
  return Object.fromEntries(ORIGIN_FIELDS.map((field) => [field, position[field]]));
}

function servicePosition(overrides = {}) {
  return {
    id: "position-1",
    type: "service",
    short_text: "Montage",
    long_text: "Montage einschließlich Befestigungsmaterial.",
    quantity: "2",
    unit: "h",
    unit_price_cents: 5000,
    vat_rate_percent: 19,
    is_nep: false,
    ...overrides,
  };
}

function complete(overrides = {}) {
  return {
    source_type: "FREE",
    document_type: "INVOICE",
    invoice_date: "2026-08-30",
    service_period_type: "SINGLE_DATE",
    service_date: "2026-08-30",
    customer_ref_kind: "global_firm",
    customer_firm_id: "firm-1",
    project_id: "project-1",
    service_reference: "Werkstattumbau",
    positions: [servicePosition()],
    payment_term_days: 8,
    ...overrides,
  };
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-invoice-position-origin-"));
  const db = new Database(path.join(root, "test.db"));
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, archived_at TEXT);
    CREATE TABLE firms (id TEXT PRIMARY KEY, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER DEFAULT 0, removed_at TEXT, is_trashed INTEGER DEFAULT 0);
    CREATE TABLE project_firms (id TEXT PRIMARY KEY, project_id TEXT, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER DEFAULT 0, removed_at TEXT, is_active INTEGER DEFAULT 1);
    CREATE TABLE user_profile (id INTEGER PRIMARY KEY, name1 TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, tax_number TEXT, vat_id TEXT, iban TEXT, bic TEXT, bank_name TEXT);
  `);
  require(path.join(process.cwd(), "src/main/db/invoiceMigrations.js")).ensureInvoiceSchema(db);
  db.prepare("INSERT INTO projects (id, name) VALUES ('project-1', 'Projekt Eins')").run();
  db.prepare("INSERT INTO firms (id, name, street, zip, city, country, use_customer) VALUES ('firm-1', 'Kunde Eins', 'Kundenweg 1', '12345', 'Kundenstadt', 'DE', 1)").run();
  const firmUsagesRepo = require(path.join(process.cwd(), "src/main/db/firmUsagesRepo.js"));
  firmUsagesRepo.setUsage({ firmId: "firm-1", usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER, enabled: true, dbConn: db });
  db.prepare("INSERT INTO user_profile (id, name1, street, zip, city, country) VALUES (1, 'BBM Betrieb', 'Werkweg 2', '54321', 'Sitzstadt', 'DE')").run();
  const { InvoiceRepository } = require(path.join(process.cwd(), "src/main/db/invoiceRepository.js"));
  const { InvoiceService } = require(path.join(process.cwd(), "src/main/domain/rechnung/InvoiceService.js"));
  let tick = 0;
  const repository = new InvoiceRepository({ dbProvider: () => db, clock: () => `2026-08-30T12:00:${String(tick++).padStart(2, "0")}.000Z` });
  const service = new InvoiceService({ repository, settingsGetMany: () => ({ "invoice.paymentTermDays": "8" }), today: () => "2026-08-30" });
  return { db, service, close() { db.close(); fs.rmSync(root, { recursive: true, force: true }); } };
}

async function runRechnungPositionOriginTests(run) {
  const positions = await importEsmFromFile(path.join(process.cwd(), "src/shared/rechnung/rechnungPositions.mjs"));

  await run("Rechnung R3.3 01: freie Position funktioniert ohne Herkunft unverändert", () => {
    const [position] = positions.normalizeInvoicePositions([servicePosition({ catalog_item_id: " ", source_offer_id: "", source_offer_position_id: null, source_order_id: undefined, source_order_position_id: "\t" })]);
    assert.deepEqual(originValues(position), Object.fromEntries(ORIGIN_FIELDS.map((field) => [field, null])));
    assert.deepEqual([position.short_text, position.long_text, position.quantity, position.unit, position.unit_price_cents, position.vat_rate_percent, position.is_nep], ["Montage", "Montage einschließlich Befestigungsmaterial.", "2", "h", 5000, 19, false]);
  });

  const individualFields = [
    ["02", "catalog_item_id"],
    ["03", "source_offer_id"],
    ["04", "source_offer_position_id"],
    ["05", "source_order_id"],
    ["06", "source_order_position_id"],
  ];
  for (const [number, field] of individualFields) {
    await run(`Rechnung R3.3 ${number}: ${field} wird getrimmt und bleibt erhalten`, () => {
      const [position] = positions.normalizeInvoicePositions([servicePosition({ [field]: `  ${ORIGIN_VALUES[field]}  ` })]);
      assert.equal(position[field], ORIGIN_VALUES[field]);
      for (const other of ORIGIN_FIELDS.filter((entry) => entry !== field)) assert.equal(position[other], null);
    });
  }

  await run("Rechnung R3.3 07: Create, Update und Reload erhalten alle Positions-Herkunftsfelder", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete({ positions: [servicePosition(ORIGIN_VALUES)] }));
      assert.deepEqual(originValues(draft.positions[0]), ORIGIN_VALUES);
      assert.equal(draft.source_order_id, null);
      const updated = await env.service.updateDraft(draft.id, { positions: [{ ...draft.positions[0], short_text: "Montage aktualisiert" }] });
      assert.deepEqual(originValues(updated.positions[0]), ORIGIN_VALUES);
      assert.deepEqual(originValues(env.service.get(draft.id).positions[0]), ORIGIN_VALUES);
      const raw = JSON.parse(env.db.prepare("SELECT positions_json FROM invoices WHERE id = ?").get(draft.id).positions_json);
      assert.deepEqual(originValues(raw[0]), ORIGIN_VALUES);
    } finally { env.close(); }
  });

  await run("Rechnung R3.3 08: Vorschau erhält alle Positions-Herkunftsfelder", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete({ positions: [servicePosition(ORIGIN_VALUES)] }));
      const preview = await env.service.previewDraft(draft.id, { positions: [{ ...draft.positions[0], long_text: "Nur in der Vorschau geändert" }] });
      assert.equal(preview.preview, true);
      assert.deepEqual(originValues(preview.positions[0]), ORIGIN_VALUES);
    } finally { env.close(); }
  });

  await run("Rechnung R3.3 09: Buchung erhält alle Positions-Herkunftsfelder", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete({ positions: [servicePosition(ORIGIN_VALUES)] }));
      const booked = await env.service.bookDraft(draft.id);
      assert.equal(booked.status, "BOOKED");
      assert.deepEqual(originValues(booked.positions[0]), ORIGIN_VALUES);
      assert.deepEqual(originValues(JSON.parse(env.db.prepare("SELECT positions_json FROM invoices WHERE id = ?").get(draft.id).positions_json)[0]), ORIGIN_VALUES);
    } finally { env.close(); }
  });

  await run("Rechnung R3.3 10: gebuchte Position bleibt ein vollständiger fachlicher Snapshot", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete({ positions: [servicePosition({ ...ORIGIN_VALUES, quantity: "2,5", unit: "Std", unit_price_cents: 12345, vat_rate_percent: 7 })] }));
      const position = (await env.service.bookDraft(draft.id)).positions[0];
      assert.deepEqual([position.type, position.short_text, position.long_text, position.quantity, position.unit, position.unit_price_cents, position.vat_rate_percent, position.is_nep, position.position_number], ["service", "Montage", "Montage einschließlich Befestigungsmaterial.", "2.5", "Std", 12345, 7, false, "01"]);
      assert.deepEqual(originValues(position), ORIGIN_VALUES);
    } finally { env.close(); }
  });

  await run("Rechnung R3.3 11: Position funktioniert ohne auflösbare Herkunft", async () => {
    const env = fixture();
    try {
      const unresolved = Object.fromEntries(ORIGIN_FIELDS.map((field, index) => [field, `nicht-auflösbar/${index + 1}#snapshot`]));
      const draft = await env.service.createDraft(complete({ positions: [servicePosition(unresolved)] }));
      assert.deepEqual(originValues(draft.positions[0]), unresolved);
    } finally { env.close(); }
  });

  await run("Rechnung R3.3 12: simulierte Quellenänderung verändert den gespeicherten Rechnungssnapshot nicht", async () => {
    const env = fixture();
    try {
      const catalogItem = { id: "catalog-live-1", short_text: "Katalogtext alt", long_text: "Beschreibung alt", unit_price_cents: 8000 };
      const draft = await env.service.createDraft(complete({ positions: [servicePosition({ catalog_item_id: catalogItem.id, short_text: catalogItem.short_text, long_text: catalogItem.long_text, unit_price_cents: catalogItem.unit_price_cents })] }));
      catalogItem.short_text = "Katalogtext neu"; catalogItem.long_text = "Beschreibung neu"; catalogItem.unit_price_cents = 9900;
      const stored = env.service.get(draft.id).positions[0];
      assert.deepEqual([stored.catalog_item_id, stored.short_text, stored.long_text, stored.unit_price_cents], ["catalog-live-1", "Katalogtext alt", "Beschreibung alt", 8000]);
    } finally { env.close(); }
  });

  await run("Rechnung R3.3 13: Herkunft verändert die Summenlogik nicht", () => {
    const plain = positions.normalizeInvoicePositions([servicePosition({ quantity: "2", unit_price_cents: 10000 })]);
    const sourced = positions.normalizeInvoicePositions([servicePosition({ ...ORIGIN_VALUES, quantity: "2", unit_price_cents: 10000 })]);
    assert.deepEqual(positions.calculateInvoiceTotalsCents(sourced), positions.calculateInvoiceTotalsCents(plain));
    assert.deepEqual(positions.calculateInvoiceTotalsCents(sourced), { net_cents: 20000, vat_cents: 3800, gross_cents: 23800 });
  });

  await run("Rechnung R3.3 14: Herkunft verändert NEP nicht", () => {
    const [nep] = positions.normalizeInvoicePositions([servicePosition({ ...ORIGIN_VALUES, is_nep: true })]);
    assert.equal(positions.calculatePositionTotalCents(nep), null);
    assert.deepEqual(positions.calculateInvoiceTotalsCents([nep]), { net_cents: 0, vat_cents: 0, gross_cents: 0 });
  });

  await run("Rechnung R3.3 15: Herkunft verändert MwSt. nicht", () => {
    const [position] = positions.normalizeInvoicePositions([servicePosition({ ...ORIGIN_VALUES, quantity: "1", unit_price_cents: 10000, vat_rate_percent: 7 })]);
    assert.equal(positions.calculatePositionVatCents(position), 700);
    assert.deepEqual(positions.calculateInvoiceTotalsCents([position]), { net_cents: 10000, vat_cents: 700, gross_cents: 10700 });
  });

  await run("Rechnung R3.3 16: Titel-, Text- und Hinweispositionen bleiben nummerierungs- und summenneutral", () => {
    const normalized = positions.normalizeInvoicePositions([
      { id: "title", type: "heading", short_text: "Titel", ...ORIGIN_VALUES },
      { id: "text", type: "heading", is_title: false, short_text: "Text", source_offer_position_id: "offer-text-1" },
      { id: "note", type: "note", short_text: "Hinweis", source_order_position_id: "order-note-1" },
    ]);
    assert.deepEqual(normalized.map((entry) => [entry.type, entry.is_title, entry.position_number, entry.total_cents]), [["heading", true, "1", null], ["heading", false, null, null], ["note", false, null, null]]);
    assert.deepEqual(positions.calculateInvoiceTotalsCents(normalized), { net_cents: 0, vat_cents: 0, gross_cents: 0 });
    assert.deepEqual(originValues(normalized[0]), ORIGIN_VALUES);
  });
}

module.exports = { runRechnungPositionOriginTests };
