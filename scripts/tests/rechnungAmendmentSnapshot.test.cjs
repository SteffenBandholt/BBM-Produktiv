const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { pathToFileURL } = require("node:url");
const { orderSnapshotFixture } = require("./rechnungOrderSnapshot.test.cjs");
const { createOrderSnapshot } = require("../../src/main/domain/rechnung/invoiceOrderSnapshot");
const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");

function amendment(e, source, confirm = true) {
  const draft = e.billing.createDraftAmendment({ id: source.id, amendment: {
    relates_to_order_position_id: source.positions.find(p => p.position_number === "25").id,
    short_text: "Zusätzliche Öffnung", long_text: "Verstärkung der Laibung", quantity: "2.5000", unit: "m2",
    unit_price_cents: 12500, is_nep: false, vat_rate_percent: 19, price_input_mode: "NET", price_input_cents: 12500,
  } });
  return confirm ? e.billing.confirmAmendment({ id: source.id, amendment_id: draft.id }) : draft;
}
const rules = () => import(pathToFileURL(path.join(__dirname, "../../src/shared/rechnung/rechnungPositions.mjs")).href);

// Execute the actual production method both in a minimal DOM test and in Chromium.
function renderMethodSource() {
  const source = fs.readFileSync(path.join(__dirname, "../../src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
  const start = source.indexOf("  _renderLvPositions() {");
  const end = source.indexOf("\n  _syncDerived()", start);
  assert.ok(start > 0 && end > start);
  return source.slice(start, end);
}

async function runRechnungAmendmentSnapshotTests(run) {
  await run("Rechnung #275 Paket 4d2: mehrere Rechnungen bewahren ihren Anlagezeitpunkt mit nur bestätigten Nachträgen", async () => {
    const e = orderSnapshotFixture();
    try {
      const source = e.confirm();
      const before = await e.create();
      const row = id => e.db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
      const beforeRow = row(before.id);
      const n1 = amendment(e, source);
      const draft = amendment(e, source, false);
      const withOne = await e.create();
      const oneRow = row(withOne.id);
      const n2 = e.billing.confirmAmendment({ id: source.id, amendment_id: draft.id });
      const ignoredDraft = amendment(e, source, false);
      const cancelled = amendment(e, source);
      e.db.prepare("UPDATE billing_order_amendments SET status = 'CANCELLED' WHERE id = ?").run(cancelled.id);
      const withTwo = await e.create();
      assert.equal(e.reads(), 3, "ein atomarer Quellenabruf je Rechnung");
      assert.equal(before.positions.length, source.positions.length);
      assert.deepEqual(withOne.positions.filter(p => p.position_origin === "AMENDMENT").map(p => p.position_number), ["N 01"]);
      assert.deepEqual(withTwo.positions.map(p => p.position_number), [...source.positions.map(p => p.position_number), "N 01", "N 02"]);
      const copied = withTwo.positions.slice(source.positions.length);
      assert.deepEqual(copied.map(p => p.source_order_amendment_id), [n1.id, n2.id]);
      assert.ok(!withTwo.positions.some(p => [ignoredDraft.id, cancelled.id].includes(p.source_order_amendment_id)));
      for (const [i, p] of copied.entries()) {
        const original = [n1, n2][i];
        assert.notEqual(p.id, original.id);
        assert.equal(p.source_order_id, source.id);
        assert.equal(p.relates_to_order_position_id, original.relates_to_order_position_id);
        assert.equal(p.relates_to_position_number, "25");
        assert.equal(p.parent_id, null);
        assert.ok(p.sort_index > Math.max(...source.positions.map(p => p.sort_index)));
        for (const field of ["sequence_no", "amendment_number", "short_text", "long_text", "quantity", "unit", "unit_price_cents", "is_nep", "vat_rate_percent", "price_input_mode", "price_input_cents"]) assert.deepEqual(p[field], original[field], field);
      }
      assert.notEqual(withOne.positions.at(-1).id, copied[0].id);
      assert.deepEqual(JSON.parse(withTwo.order_snapshot_json).positions, withTwo.positions);
      assert.deepEqual(row(before.id), beforeRow);
      assert.deepEqual(row(withOne.id), oneRow);
      assert.deepEqual(e.billing.get({ id: source.id }).positions, source.positions);
      ensureInvoiceSchema(e.db); ensureInvoiceSchema(e.db);
      assert.deepEqual(row(before.id), beforeRow);
      assert.deepEqual(row(withOne.id), oneRow);
      assert.deepEqual(e.invoices.get(withTwo.id), withTwo);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d2: Sortierung nur der Nachtragskopien, Vertragsreihenfolge und UUID-Bezug unverändert", async () => {
    const e = orderSnapshotFixture();
    try {
      const source = e.confirm();
      amendment(e, source); amendment(e, source);
      const order = e.billing.get({ id: source.id });
      order.amendments.reverse();
      const before = structuredClone(order);
      const snapshot = createOrderSnapshot(order, await rules());
      assert.deepEqual(order, before);
      assert.deepEqual(snapshot.positions.map(p => p.position_number), ["10", "40.01", "25", "N 01", "N 02"]);
      assert.deepEqual(snapshot.positions.slice(0, 3).map(p => [p.source_order_position_id, p.sort_index]), order.positions.map(p => [p.id, p.sort_index]));
      const changedLabel = structuredClone(order);
      changedLabel.positions.find(p => p.position_number === "25").position_number = "25.001";
      const relabelled = createOrderSnapshot(changedLabel, await rules());
      assert.equal(relabelled.positions.at(-1).relates_to_position_number, "25.001");
      assert.equal(snapshot.positions.at(-1).relates_to_position_number, "25");
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d2: ungültiger bestätigter Ursprung, Identität oder Nummer bricht Rechnungsanlage atomar ab", async () => {
    const e = orderSnapshotFixture();
    try {
      const source = e.confirm(); amendment(e, source);
      const original = e.billing.get({ id: source.id });
      for (const patch of [
        { relates_to_order_position_id: original.positions[0].id }, { relates_to_order_position_id: randomUUID() },
        { relates_to_order_position_id: "25" }, { order_id: randomUUID() }, { sequence_no: 0 },
        { sequence_no: 1.5 }, { amendment_number: "N01" }, { amendment_number: "N 02" }, { id: "N 01" },
      ]) {
        const invalid = structuredClone(original); Object.assign(invalid.amendments[0], patch);
        const service = new InvoiceService({ repository: e.invoices, billingOrderService: { get: () => invalid }, settingsGetMany: () => ({}), today: () => "2026-09-06" });
        await assert.rejects(() => service.createDraftFromOrder({ source_order_id: source.id, service_period_type: "SINGLE_DATE", service_date: "2026-09-01" }), /invoice_order_amendment_/);
        assert.equal(e.db.prepare("SELECT COUNT(*) n FROM invoices").get().n, 0);
        assert.equal(e.db.inTransaction, false);
      }
      const duplicate = structuredClone(original); duplicate.amendments.push({ ...duplicate.amendments[0], id: randomUUID() });
      const positionRules = await rules();
      assert.throws(() => createOrderSnapshot(duplicate, positionRules), /invoice_order_amendment_number_invalid/);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d2: Nachtragsquellkopie ist bei Speichern, Vorschauen und Buchen gesperrt", async () => {
    const e = orderSnapshotFixture();
    try {
      const source = e.confirm(); amendment(e, source);
      const draft = await e.create();
      for (const operation of ["updateDraft", "previewDraft", "bookDraft"]) {
        for (const field of ["source_order_amendment_id", "relates_to_order_position_id", "relates_to_position_number", "sequence_no", "amendment_number", "position_number", "sort_index", "quantity", "short_text"]) {
          const positions = structuredClone(draft.positions); positions.at(-1)[field] = "manipuliert";
          await assert.rejects(() => e.service[operation](draft.id, { positions }), /snapshot_immutable/);
        }
        await assert.rejects(() => e.service[operation](draft.id, { positions: draft.positions.slice().reverse() }), /snapshot_immutable/);
      }
      assert.deepEqual((await e.service.updateDraft(draft.id, { intro_text: "Begleittext" })).positions, draft.positions);
      assert.deepEqual((await e.service.previewDraft(draft.id)).positions, draft.positions);
      assert.equal(e.reads(), 1);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d2: echter LV-Renderer setzt Bezug vor Kurztext und erhält Auswahl ohne freien Umbau", async () => {
    const e = orderSnapshotFixture();
    try {
      const source = e.confirm(); amendment(e, source); amendment(e, source);
      const draft = await e.create();
      const node = (tag, className = "", textContent = "") => ({ tag, className, textContent, children: [], append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; } });
      const r = await rules();
      const render = new Function("node", "calculatePositionTotalCents", "calculateInvoiceTotalsCents", "POSITION_TYPES", "formatQuantityForDisplay", "formatEuroCents", "money", `return ({${renderMethodSource()}})._renderLvPositions`)(node, r.calculatePositionTotalCents, r.calculateInvoiceTotalsCents, r.POSITION_TYPES, x => x, x => x, x => x);
      const screen = { positionsList: node("div"), _orderedPositions: () => draft.positions, _positionDepth: () => 0, positionsTotal: {}, invoiceVatLabel: {}, invoiceVat: {}, invoiceTotal: {}, _handlePositionRowClick: entry => { screen.selectedPositionId = entry.id; } };
      render.call(screen);
      const rows = screen.positionsList.children.filter(n => n.tag === "article");
      assert.deepEqual(rows.map(row => row.children[0].children[0].textContent), draft.positions.map(p => p.position_number));
      const select = rows.at(-1).children[0], content = select.children[1];
      assert.deepEqual(content.children.map(n => n.textContent), ["Nachtragspos. zu Pos.: 25", "Zusätzliche Öffnung"]);
      assert.equal(content.children[0].className, "rechnung-lv-position__origin");
      select.onclick(); assert.equal(screen.selectedPositionId, draft.positions.at(-1).id);
      assert.equal(rows[0].children[0].children[1].tag, "strong");
    } finally { e.db.close(); }
  });
}

module.exports = { runRechnungAmendmentSnapshotTests, renderMethodSource, amendment };
