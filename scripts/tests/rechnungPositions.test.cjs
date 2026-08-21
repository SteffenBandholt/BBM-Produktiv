const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function runRechnungPositionsTests(run) {
  const positions = await import(pathToFileURL(path.join(process.cwd(), "src/shared/rechnung/rechnungPositions.mjs")).href);
  await run("Rechnung Step 1.4: Positionstypen werden stabil normalisiert", () => {
    const result = positions.normalizeInvoicePositions([
      { id: "a", type: "heading", short_text: "Titel" },
      { id: "b", type: "note", short_text: "Hinweis" },
      { id: "c", type: "service", short_text: "Arbeit", quantity: "2,5", unit: "h", unit_price_cents: 4000 },
      { id: "d", type: "service", short_text: "Bedarf", quantity: "1", unit_price_cents: 500, is_nep: true },
    ]);
    assert.deepEqual(result.map((entry) => entry.position_number), ["1", null, "01", "02"]);
    assert.deepEqual(result.map((entry) => entry.parent_id), [null, null, null, null]);
    assert.deepEqual(result.map((entry) => entry.total_cents), [null, null, 10000, null]);
    assert.equal(result[2].quantity, "2.5");
    assert.equal(Object.isFrozen(result), true);
  });
  await run("Rechnung Step 1.4: ungueltige Positionen werden abgewiesen", () => {
    assert.throws(() => positions.normalizeInvoicePositions([{ id: "a", short_text: "A" }, { id: "a", short_text: "B" }]), /eindeutige ID/);
    assert.throws(() => positions.normalizeInvoicePositions([{ id: "a", short_text: "A", quantity: "1.23456" }]), /Menge/);
  });
  await run("Rechnung MwSt. Step 1: Leistungspositionen speichern ihren Satz und berechnen Netto, MwSt. und Brutto", () => {
    const normalized = positions.normalizeInvoicePositions([
      { id: "standard", type: "service", short_text: "Standardleistung", quantity: "1", unit_price_cents: 10000 },
      { id: "catalog", type: "service", short_text: "Katalogleistung", quantity: "2", unit_price_cents: 5000, vat_rate_percent: 7 },
      { id: "nep", type: "service", short_text: "Bedarf", quantity: "1", unit_price_cents: 5000, is_nep: true, vat_rate_percent: 7 },
      { id: "title", type: "heading", short_text: "Titel" },
      { id: "note", type: "note", short_text: "Hinweis" },
    ]);
    assert.deepEqual(normalized.map((entry) => entry.vat_rate_percent), [19, 7, 7, null, null]);
    assert.deepEqual(positions.calculateInvoiceTotalsCents(normalized), { net_cents: 20000, vat_cents: 2600, gross_cents: 22600 });
    assert.equal(positions.calculatePositionVatCents(normalized.find((entry) => entry.id === "nep")), null);
  });
  await run("Rechnung MwSt. Step 1: ungueltige Saetze werden abgewiesen", () => {
    assert.throws(() => positions.normalizeInvoicePositions([{ id: "a", type: "service", short_text: "A", quantity: "1", unit_price_cents: 100, vat_rate_percent: "19,0" }]), /Mehrwertsteuersatz/);
  });
  await run("Rechnung MwSt. Step 1: MwSt. wird je Position kaufmaennisch auf Cent gerundet", () => {
    const normalized = positions.normalizeInvoicePositions([
      { id: "cent", type: "service", short_text: "Centfall", quantity: "1", unit_price_cents: 333, vat_rate_percent: 19 },
      { id: "fraction", type: "service", short_text: "Mengenrundung", quantity: "0,03", unit_price_cents: 3333, vat_rate_percent: 19 },
    ]);
    assert.deepEqual(positions.calculateInvoiceTotalsCents(normalized), { net_cents: 433, vat_cents: 82, gross_cents: 515 });
  });
  await run("Rechnung Preisbedienung: Netto- und Brutto-Eingabe liefern dieselben centgenauen Summen", () => {
    const normalized = positions.normalizeInvoicePositions([
      { id: "net", type: "service", short_text: "Netto", quantity: "1", unit_price_cents: 10000, vat_rate_percent: 19, price_input_mode: "NET" },
      { id: "gross", type: "service", short_text: "Brutto", quantity: "1", unit_price_cents: 11900, price_input_cents: 11900, vat_rate_percent: 19, price_input_mode: "GROSS" },
    ]);
    assert.deepEqual(normalized.map((entry) => [entry.price_input_mode, entry.unit_price_cents, entry.price_input_cents]), [["NET", 10000, null], ["GROSS", 10000, 11900]]);
    assert.deepEqual(positions.calculateInvoiceTotalsCents(normalized), { net_cents: 20000, vat_cents: 3800, gross_cents: 23800 });
    assert.equal(positions.calculatePositionGrossUnitPriceCents(normalized[0]), 11900);
    assert.equal(positions.calculatePositionGrossUnitPriceCents(normalized[1]), 11900);
  });
  await run("Rechnung Preisbedienung: Brutto-Eingabe 199,00 bleibt durch Netto und MwSt. exakt erhalten", () => {
    const [gross] = positions.normalizeInvoicePositions([{ id: "gross", type: "service", short_text: "Brutto", quantity: "1", unit_price_cents: 19900, price_input_cents: 19900, vat_rate_percent: 19, price_input_mode: "GROSS" }]);
    assert.equal(gross.unit_price_cents, 16723);
    assert.equal(positions.calculatePositionTotalCents(gross), 16723);
    assert.equal(positions.calculatePositionVatCents(gross), 3177);
    assert.deepEqual(positions.calculateInvoiceTotalsCents([gross]), { net_cents: 16723, vat_cents: 3177, gross_cents: 19900 });
  });
  await run("Rechnung Preisbedienung: Legacy und NEP bleiben kompatibel und summenneutral", () => {
    const [legacy, nep] = positions.normalizeInvoicePositions([
      { id: "legacy", type: "service", short_text: "Alt", quantity: "1", unit_price_cents: 10000 },
      { id: "nep", type: "service", short_text: "Bedarf", quantity: "1", unit_price_cents: 11900, price_input_cents: 11900, vat_rate_percent: 19, price_input_mode: "GROSS", is_nep: true },
    ]);
    assert.deepEqual([legacy.price_input_mode, legacy.unit_price_cents, legacy.price_input_cents], ["NET", 10000, null]);
    assert.equal(nep.unit_price_cents, 10000);
    assert.deepEqual(positions.calculateInvoiceTotalsCents([legacy, nep]), { net_cents: 10000, vat_cents: 1900, gross_cents: 11900 });
  });
  await run("Rechnung Hierarchie-Kern: fehlende IDs erhalten eine stabile erzeugte Identitaet", () => {
    const result = positions.normalizeInvoicePositions([{ short_text: "Neue Position", quantity: "1", unit_price_cents: 100 }], { idFactory: () => "generated-position-id" });
    assert.deepEqual(result.map((entry) => [entry.id, entry.parent_id, entry.position_number]), [["generated-position-id", null, "01"]]);
  });
  await run("Rechnung Hierarchie-Kern: Nummern folgen ausschliesslich Elternbezug und Listenreihenfolge", () => {
    const result = positions.normalizeInvoicePositions([
      { id: "free-a", type: "service", short_text: "Freie Position A", quantity: "1", unit_price_cents: 100 },
      { id: "title", type: "heading", short_text: "Titel" },
      { id: "under-title-a", type: "service", parent_id: "title", short_text: "Untertitel A", quantity: "1", unit_price_cents: 100 },
      { id: "under-title-b", type: "service", parent_id: "title", short_text: "Untertitel B", quantity: "1", unit_price_cents: 100 },
      { id: "deep", type: "service", parent_id: "under-title-a", short_text: "Tief", quantity: "1", unit_price_cents: 100 },
      { id: "deeper", type: "service", parent_id: "deep", short_text: "Tiefer", quantity: "1", unit_price_cents: 100 },
      { id: "free-b", type: "service", short_text: "Freie Position B", quantity: "1", unit_price_cents: 100 },
    ]);
    assert.deepEqual(result.map((entry) => entry.position_number), ["01", "1", "1.01", "1.02", "1.01.01", "1.01.01.01", "02"]);
    assert.equal(result.find((entry) => entry.id === "title").total_cents, null);
    assert.equal(result.find((entry) => entry.id === "title").quantity, null);
  });
  await run("Rechnung Hierarchie-Kern: Textposition und Titel bleiben im vorhandenen heading-Typ getrennt", () => {
    const result = positions.normalizeInvoicePositions([
      { id: "text", type: "heading", is_title: false, short_text: "Freier Text" },
      { id: "title", type: "heading", short_text: "Titel" },
    ]);
    assert.deepEqual(result.map((entry) => [entry.is_title, entry.position_number, entry.total_cents]), [[false, null, null], [true, "1", null]]);
  });
  await run("Rechnung Positionsdarstellung: Hinweis und Text bleiben nummernneutral zwischen Leistungspositionen", () => {
    const result = positions.normalizeInvoicePositions([
      { id: "title", type: "heading", short_text: "Fensterarbeiten" },
      { id: "first", type: "service", parent_id: "title", short_text: "Ausbau Fenster", quantity: "1", unit_price_cents: 100 },
      { id: "note", type: "note", parent_id: "title", short_text: "Fensterbank freiraeumen" },
      { id: "text", type: "heading", is_title: false, parent_id: "title", short_text: "Nebenleistungen enthalten" },
      { id: "second", type: "service", parent_id: "title", short_text: "Lieferung Fenster", quantity: "1", unit_price_cents: 100 },
    ]);
    assert.deepEqual(result.map((entry) => [entry.id, entry.position_number, entry.total_cents]), [["title", "1", null], ["first", "1.01", 100], ["note", null, null], ["text", null, null], ["second", "1.02", 100]]);
  });
  await run("Rechnung Hierarchie-Kern: defekte Eltern und Zyklen werden ohne Datenverlust sicher entkoppelt", () => {
    const result = positions.normalizeInvoicePositions([
      { id: "legacy", type: "service", short_text: "Legacy", quantity: "1", unit_price_cents: 100 },
      { id: "invalid", type: "service", parent_id: "fehlt", short_text: "Defekter Elternbezug", quantity: "1", unit_price_cents: 200 },
      { id: "a", type: "service", parent_id: "b", short_text: "Zyklus A", quantity: "1", unit_price_cents: 300 },
      { id: "b", type: "service", parent_id: "a", short_text: "Zyklus B", quantity: "1", unit_price_cents: 400 },
    ]);
    assert.deepEqual(result.map((entry) => entry.parent_id), [null, null, "b", null]);
    assert.deepEqual(result.map((entry) => entry.position_number), ["01", "02", "03.01", "03"]);
    assert.deepEqual(result.map((entry) => entry.id), ["legacy", "invalid", "a", "b"]);
    assert.deepEqual(result.map((entry) => entry.total_cents), [100, 200, 300, 400]);
  });
}
module.exports = { runRechnungPositionsTests };
