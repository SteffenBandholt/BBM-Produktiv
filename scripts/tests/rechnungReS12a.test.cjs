"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const service = (id, parentId = null, overrides = {}) => ({
  id,
  type: "service",
  is_title: false,
  parent_id: parentId,
  short_text: id,
  long_text: `${id} lang`,
  quantity: "1",
  unit: "St",
  unit_price_cents: 10000,
  is_nep: false,
  vat_rate_percent: 19,
  price_input_mode: "NET",
  price_input_cents: null,
  ...overrides,
});
const title = (id) => ({ id, type: "heading", is_title: true, parent_id: null, short_text: id, long_text: "" });

async function runRechnungReS12aTests(run) {
  const screenModule = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"));
  const positionModule = await importEsmFromFile(path.join(ROOT, "src/shared/rechnung/rechnungPositions.mjs"));
  const contractModule = await importEsmFromFile(path.join(ROOT, "src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js"));
  const {
    copyCatalogEntryToInvoicePosition,
    insertInvoicePositionCopies,
    parseInvoicePriceCents,
    parseInvoiceQuantityInput,
    resolveInvoicePositionInsertion,
  } = screenModule;

  await run("RE-S1.2a: Einfuegestellen folgen Auswahl, letztem Titel und freier Rechnung", () => {
    assert.deepEqual(resolveInvoicePositionInsertion([], null), { index: 0, parentId: null });
    const titled = [title("t1"), service("a", "t1"), title("t2"), service("b", "t2")];
    assert.deepEqual(resolveInvoicePositionInsertion(titled, null), { index: 4, parentId: "t2" });
    assert.deepEqual(resolveInvoicePositionInsertion(titled, "a"), { index: 2, parentId: "t1" });
    assert.deepEqual(resolveInvoicePositionInsertion(titled, "t1"), { index: 2, parentId: "t1" });
    assert.equal(resolveInvoicePositionInsertion([service("root"), title("t1")], "root").blocked, true);
  });

  await run("RE-S1.2a: Mehrfachuebernahme bleibt stabil und Katalogkopien sind unabhaengig", () => {
    const catalog = [
      { id: "catalog-1", shortText: "Planung", longText: "Lang A", unit: "h", unitPriceCents: 10000, vatRatePercent: 19 },
      { id: "catalog-2", shortText: "Dokumentation", longText: "Lang B", unit: "St", unitPriceCents: 5000, vatRatePercent: 19 },
    ];
    const copies = catalog.map((entry, index) => copyCatalogEntryToInvoicePosition(entry, `copy-${index + 1}`));
    const result = insertInvoicePositionCopies([title("t1"), service("existing", "t1")], copies, "existing");
    assert.equal(result.ok, true);
    assert.deepEqual(result.positions.map((entry) => entry.id), ["t1", "existing", "copy-1", "copy-2"]);
    assert.deepEqual(result.positions.slice(2).map((entry) => entry.parent_id), ["t1", "t1"]);
    assert.notEqual(result.positions[2].id, catalog[0].id);
    result.positions[2].short_text = "Kopie geaendert";
    catalog[1].shortText = "Katalog spaeter geaendert";
    assert.equal(catalog[0].shortText, "Planung");
    assert.equal(result.positions[3].short_text, "Dokumentation");
  });

  await run("RE-S1.2a: Titelanlage mischt vorhandene Root-Leistungen nicht um", () => {
    const screen = new screenModule.default();
    let message = ""; let created = false;
    screen.current = { id: "draft", status: "DRAFT", order_binding_state: null };
    screen.source = { value: "FREE" };
    screen.positions = [service("root")];
    screen._error = (value) => { message = value; };
    screen._createPositionEntry = () => { created = true; };
    screen._createTitle();
    assert.equal(created, false);
    assert.match(message, /ohne Titel/);
  });

  await run("RE-S1.2a: Mengen- und Preiseingaben schuetzen gueltige Werte", () => {
    assert.equal(parseInvoiceQuantityInput("2,5000"), "2.5");
    assert.equal(parseInvoicePriceCents("100,00"), 10000);
    assert.throws(() => parseInvoiceQuantityInput("2,12345"), /vier Nachkommastellen/);
    assert.throws(() => parseInvoicePriceCents("100,001"), /zwei Nachkommastellen/);
  });

  await run("RE-S1.2a: NEP kann mehrfach ohne Wertverlust aus der Summe genommen werden", () => {
    const original = [service("a", null, { quantity: "2", unit_price_cents: 10000 }), service("b", null, { quantity: "1", unit_price_cents: 5000 })];
    let positions = [...positionModule.normalizeInvoicePositions(original)];
    const totals = () => positionModule.calculateInvoiceTotalsCents(positions);
    assert.deepEqual(totals(), { net_cents: 25000, vat_cents: 4750, gross_cents: 29750 });
    for (const expectedNep of [true, false, true, false]) {
      positions = [...positionModule.normalizeInvoicePositions(positions.map((entry) => entry.id === "a" ? { ...entry, is_nep: expectedNep } : entry))];
      assert.equal(positions[0].quantity, "2");
      assert.equal(positions[0].unit_price_cents, 10000);
      assert.deepEqual(totals(), expectedNep
        ? { net_cents: 5000, vat_cents: 950, gross_cents: 5950 }
        : { net_cents: 25000, vat_cents: 4750, gross_cents: 29750 });
    }
  });

  await run("RE-S1.2a: Normalisierung nummeriert Titel und Leistungen nach stabiler Reihenfolge", () => {
    const normalized = positionModule.normalizeInvoicePositions([title("t1"), service("a", "t1"), service("b", "t1"), title("t2"), service("c", "t2")]);
    assert.deepEqual(normalized.map((entry) => entry.position_number), ["1", "1.01", "1.02", "2", "2.01"]);
  });

  await run("RE-S1.2a: gebuchte und auftragsgebundene Positionen bleiben geschuetzt", () => {
    for (const current of [
      { id: "booked", status: "BOOKED", order_binding_state: null },
      { id: "bound", status: "DRAFT", order_binding_state: "BOUND" },
    ]) {
      const screen = new screenModule.default();
      screen.current = current;
      screen.source = { value: "FREE" };
      screen.positions = [service("protected")];
      screen.selectedPositionId = "protected";
      screen._renderPositions = () => {};
      screen._queueDraftSave = () => { throw new Error("Autosave darf nicht starten"); };
      screen._deletePosition();
      screen._moveSelectedPositionTo(service("target"));
      assert.deepEqual(screen.positions.map((entry) => entry.id), ["protected"]);
    }
  });

  await run("RE-S1.2a: Vertrag hat exakt 140 statische Ziele mit Parents, Orders und Fachsperren", () => {
    const elements = contractModule.rechnungUiEditorContract.slots.map((slot) => slot.element);
    const byId = new Map(elements.map((entry) => [entry.id, entry]));
    assert.equal(elements.length, 140);
    assert.equal(byId.size, 140);
    assert.equal(byId.get("rechnung.editor.reference").name, "Betreff");
    assert.equal(byId.get("rechnung.editor.positionDelete").name, "Position löschen");
    assert.equal(byId.get("rechnung.editor.positionDetails.title").name, "Positionsdetails Überschrift");
    assert.equal(byId.get("rechnung.catalogPicker").name, "Leistungen aus Katalog auswählen");
    assert.equal(byId.get("rechnung.catalogPicker.accept").name, "Ausgewählte Leistungen übernehmen");
    for (const entry of elements) {
      assert.equal(Number.isSafeInteger(entry.order), true, `${entry.id}: order`);
      if (entry.parentId !== null) assert.equal(byId.has(entry.parentId), true, `${entry.id}: parent`);
    }
    const packageIds = elements.filter((entry) => entry.id.startsWith("rechnung.catalogPicker") || entry.id.startsWith("rechnung.editor.position"))
      .filter((entry) => !["rechnung.editor.positions", "rechnung.editor.positions.list", "rechnung.editor.positions.total", "rechnung.editor.positions.total.label"].includes(entry.id));
    assert.equal(packageIds.length, 33);
    for (const entry of packageIds) assert.deepEqual(entry.lockedOps, ["executeTargetAction", "modifyDomainData", "createRecord", "deleteRecord"], entry.id);
  });
}

module.exports = { runRechnungReS12aTests };

if (require.main === module) {
  let failed = false;
  const run = async (name, test) => {
    try { await test(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runRechnungReS12aTests(run).then(() => { if (failed) process.exitCode = 1; });
}
