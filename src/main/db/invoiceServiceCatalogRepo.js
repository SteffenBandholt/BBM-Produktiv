const { randomUUID } = require("node:crypto");
const { initDatabase } = require("./database");

const DEFAULT_VAT_RATE_PERCENT = 19;

function text(value) { return String(value ?? "").trim(); }
function normalizePriceCents(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("Der Einzelpreis ist ungültig.");
  return parsed;
}
function normalize(input = {}) {
  const shortText = text(input.shortText ?? input.short_text);
  if (!shortText) throw new Error("Kurztext ist erforderlich.");
  return {
    short_text: shortText,
    long_text: text(input.longText ?? input.long_text),
    unit: text(input.unit),
    unit_price_cents: normalizePriceCents(input.unitPriceCents ?? input.unit_price_cents),
    vat_rate_percent: DEFAULT_VAT_RATE_PERCENT,
  };
}
function record(row) {
  return row && Object.freeze({ id: row.id, shortText: row.short_text, longText: row.long_text, unit: row.unit, unitPriceCents: row.unit_price_cents, vatRatePercent: row.vat_rate_percent, createdAt: row.created_at, updatedAt: row.updated_at });
}

class InvoiceServiceCatalogRepository {
  constructor({ dbProvider = initDatabase, clock = () => new Date().toISOString(), idFactory = randomUUID } = {}) { this.dbProvider = dbProvider; this.clock = clock; this.idFactory = idFactory; }
  list() { return this.dbProvider().prepare("SELECT * FROM invoice_service_catalog ORDER BY LOWER(short_text), id").all().map(record); }
  get(id) { return record(this.dbProvider().prepare("SELECT * FROM invoice_service_catalog WHERE id = ?").get(text(id))); }
  create(input) {
    const value = normalize(input); const now = this.clock(); const id = this.idFactory();
    this.dbProvider().prepare(`INSERT INTO invoice_service_catalog (id, short_text, long_text, unit, unit_price_cents, vat_rate_percent, created_at, updated_at) VALUES (@id, @short_text, @long_text, @unit, @unit_price_cents, @vat_rate_percent, @created_at, @updated_at)`).run({ id, ...value, created_at: now, updated_at: now });
    return this.get(id);
  }
  update(id, input) {
    const key = text(id); if (!this.get(key)) throw new Error("Katalogleistung wurde nicht gefunden.");
    const value = normalize(input); const updatedAt = this.clock();
    this.dbProvider().prepare(`UPDATE invoice_service_catalog SET short_text=@short_text, long_text=@long_text, unit=@unit, unit_price_cents=@unit_price_cents, vat_rate_percent=@vat_rate_percent, updated_at=@updated_at WHERE id=@id`).run({ id: key, ...value, updated_at: updatedAt });
    return this.get(key);
  }
}

module.exports = { InvoiceServiceCatalogRepository, DEFAULT_VAT_RATE_PERCENT };
