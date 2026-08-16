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
    assert.deepEqual(result.map((entry) => entry.position_number), [1, null, 2, 3]);
    assert.deepEqual(result.map((entry) => entry.total_cents), [null, null, 10000, null]);
    assert.equal(result[2].quantity, "2.5");
    assert.equal(Object.isFrozen(result), true);
  });
  await run("Rechnung Step 1.4: ungueltige Positionen werden abgewiesen", () => {
    assert.throws(() => positions.normalizeInvoicePositions([{ id: "a", short_text: "A" }, { id: "a", short_text: "B" }]), /eindeutige ID/);
    assert.throws(() => positions.normalizeInvoicePositions([{ id: "a", short_text: "A", quantity: "1.23456" }]), /Menge/);
  });
}
module.exports = { runRechnungPositionsTests };
