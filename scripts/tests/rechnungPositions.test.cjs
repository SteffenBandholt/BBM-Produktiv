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
