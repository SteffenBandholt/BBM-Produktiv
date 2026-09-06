const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const Database = require("better-sqlite3");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
const { BillingOrderRepository } = require("../../src/main/db/billingOrderRepository");
const { BillingOrderService } = require("../../src/main/domain/rechnung/BillingOrderService");
const { InvoiceRepository } = require("../../src/main/db/invoiceRepository");
const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");

function fixture(filename = ":memory:") {
  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  db.exec(`CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE firms (id TEXT PRIMARY KEY, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER, removed_at TEXT, is_trashed INTEGER);
    CREATE TABLE project_firms (id TEXT PRIMARY KEY, project_id TEXT, name TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, use_customer INTEGER, removed_at TEXT, is_active INTEGER);
    CREATE TABLE user_profile (id INTEGER PRIMARY KEY, name1 TEXT, name2 TEXT, street TEXT, zip TEXT, city TEXT, country TEXT, phone TEXT, email TEXT, tax_number TEXT, vat_id TEXT, iban TEXT, bic TEXT, bank_name TEXT);
    INSERT INTO firms (id, name, street, zip, city, use_customer, is_trashed) VALUES ('customer', 'Bau GmbH', 'Bauweg 1', '20000', 'Hamburg', 1, 0);
    INSERT INTO user_profile (id, name1, street, zip, city) VALUES (1, 'Aussteller', 'Weg 1', '20000', 'Hamburg');`);
  ensureInvoiceSchema(db);
  const repository = new BillingOrderRepository({ dbProvider: () => db });
  let allowed = true;
  const service = new BillingOrderService({ repository, authorize: () => { if (!allowed) throw new Error("FEATURE_NOT_ALLOWED:rechnung"); } });
  let orderCount = 0;
  const order = (confirm = true) => {
    const draft = service.createDraft({ order_number: `A-${++orderCount}`, order_date: "2026-09-06", customer_firm_id: "customer", service_reference: "Sanierung" });
    for (const [type, number, sort] of [["heading", "10", 10], ["service", "25", 30], ["note", "40.01", 50]]) {
      service.addPosition({ id: draft.id, position: { type, position_number: number, sort_index: sort, short_text: type } });
    }
    return confirm ? service.confirmOrder({ id: draft.id }) : service.get({ id: draft.id });
  };
  return { db, repository, service, order, deny: () => { allowed = false; } };
}
const values = (order, patch = {}) => ({ relates_to_order_position_id: order.positions[1].id, short_text: "Zusatzleistung", long_text: "Nachtrag Mauerwerk", quantity: "12.5000", unit: "m2", unit_price_cents: 12345, vat_rate_percent: 19, price_input_mode: "NET", ...patch });
const create = (e, order, patch) => e.service.createDraftAmendment({ id: order.id, amendment: values(order, patch) });
const confirm = (e, order, draft) => e.service.confirmAmendment({ id: order.id, amendment_id: draft.id });

// Separate Electron/SQLite connections really contend for the same file write lock.
async function compete(e, filename, order, drafts) {
  const children = [];
  let timer;
  e.db.exec("BEGIN IMMEDIATE");
  try {
    return await new Promise((resolve, reject) => {
      let waiting = 0;
      const results = [];
      timer = setTimeout(() => reject(new Error("amendment_race_timeout")), 15000);
      drafts.forEach((draft, index) => {
        const child = spawn(process.execPath, [__filename, "--race-worker", filename, order.id, draft.id], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, stdio: ["ignore", "pipe", "pipe"] });
        children.push(child);
        let buffer = "", errors = "";
        child.stderr.on("data", data => { errors += data; });
        child.on("error", reject);
        child.stdout.on("data", data => {
          buffer += data;
          let end;
          while ((end = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
            if (line === "WAITING") {
              if (++waiting === drafts.length) e.db.exec("COMMIT");
            } else if (line.startsWith("RESULT ")) results[index] = JSON.parse(line.slice(7));
          }
        });
        child.on("close", code => {
          if (code !== 0 || !results[index]) return reject(new Error(`race_worker_failed:${code}:${errors}`));
          if (children.every(entry => entry.exitCode !== null) && results.filter(Boolean).length === drafts.length) resolve(results);
        });
      });
    });
  } finally {
    clearTimeout(timer);
    if (e.db.inTransaction) e.db.exec("ROLLBACK");
    await Promise.all(children.map(child => child.exitCode !== null ? Promise.resolve() : new Promise(resolve => { child.once("close", resolve); child.kill(); })));
  }
}

async function runRechnungOrderAmendmentTests(run) {
  await run("Rechnung #275 Paket 4d: Entwürfe ohne Nummer, lückenlose Bestätigung je Auftrag und stabile UUIDs", () => {
    const e = fixture();
    try {
      const order = e.order();
      const first = create(e, order), second = create(e, order), unused = create(e, order);
      for (const draft of [first, second, unused]) {
        assert.match(draft.id, /^[0-9a-f-]{36}$/);
        assert.equal(draft.sequence_no, null); assert.equal(draft.amendment_number, null); assert.equal(draft.confirmed_at, null);
      }
      const a = confirm(e, order, second), b = confirm(e, order, first);
      assert.deepEqual([a.id, a.sequence_no, a.amendment_number, a.status], [second.id, 1, "N 01", "CONFIRMED"]);
      assert.deepEqual([b.id, b.sequence_no, b.amendment_number], [first.id, 2, "N 02"]);
      assert.ok(a.confirmed_at);
      assert.equal(a.quantity, "12.5000");
      const other = e.order();
      assert.equal(confirm(e, other, create(e, other)).amendment_number, "N 01");
      assert.equal(confirm(e, order, create(e, order)).amendment_number, "N 03");
      const loaded = e.service.get({ id: order.id });
      assert.deepEqual(loaded.positions, order.positions);
      assert.deepEqual(loaded.amendments.map(a => a.sequence_no), [1, 2, 3, null]);
      assert.equal(loaded.amendments[0].relates_to_order_position_id, order.positions[1].id);
      assert.equal(loaded.positions.find(p => p.id === a.relates_to_order_position_id).position_number, "25");
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d: Ursprungs- und Auftragsguards weisen fremde Titel, Notizen, Nachträge und Legacy ab", () => {
    const e = fixture();
    try {
      const order = e.order(), other = e.order(), draftOrder = e.order(false);
      const amendment = create(e, order);
      for (const origin of [order.positions[0].id, order.positions[2].id, other.positions[1].id, amendment.id, randomUUID(), "25", null]) {
        assert.throws(() => create(e, order, { relates_to_order_position_id: origin }), /billing_order_/);
      }
      assert.throws(() => create(e, draftOrder), /require_confirmed_order/);
      assert.throws(() => confirm(e, other, amendment), /amendment_not_found/);
      assert.throws(() => e.service.createDraftAmendment({ id: order.id, amendment: values(order), order_binding_state: "LEGACY_UNRESOLVED" }), /legacy_unresolved/);
      e.db.prepare("UPDATE billing_orders SET status = 'CANCELLED' WHERE id = ?").run(order.id);
      assert.throws(() => create(e, order), /require_confirmed_order/);
      assert.throws(() => confirm(e, order, amendment), /require_confirmed_order/);
      assert.equal(e.service.get({ id: order.id }).amendments[0].status, "DRAFT");
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d: strikte Fachwerte und Clientfelder, fehlerhafter Altentwurf verbraucht keine Nummer", () => {
    const e = fixture();
    try {
      const order = e.order();
      for (const patch of [{ id: randomUUID() }, { order_id: order.id }, { sequence_no: 1 }, { amendment_number: "N 01" }, { status: "CONFIRMED" }, { sort_index: 15 }, { position_number: "11" }, { short_text: "" }, { quantity: "1,5" }, { quantity: {} }, { unit_price_cents: 0.5 }, { vat_rate_percent: 101 }, { is_nep: "true" }, { price_input_mode: "other" }, { long_text: {} }]) {
        assert.throws(() => create(e, order, patch), /billing_order_/);
      }
      assert.equal(e.service.get({ id: order.id }).amendments.length, 0);
      const bad = e.repository.createDraftAmendment(order.id, values(order, { quantity: "historisch unklar" }));
      assert.throws(() => confirm(e, order, bad), /quantity_invalid/);
      assert.equal(e.service.get({ id: order.id }).amendments[0].sequence_no, null);
      const good = create(e, order);
      assert.throws(() => e.service.confirmAmendment({ id: order.id, amendment_id: good.id, sequence_no: 99 }), /field_not_allowed/);
      assert.equal(confirm(e, order, good).amendment_number, "N 01");
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d: Persistenz schützt bestätigte Nachträge, Vertrags-LV und vergebene Nummern", () => {
    const e = fixture();
    try {
      const order = e.order(), draft = create(e, order), a = confirm(e, order, draft);
      assert.throws(() => confirm(e, order, draft), /not_confirmable/);
      for (const [field, value] of [["short_text", "Manipulation"], ["quantity", "99"], ["relates_to_order_position_id", order.positions[0].id], ["sequence_no", 20], ["amendment_number", "N 20"], ["status", "DRAFT"], ["id", randomUUID()]]) {
        assert.throws(() => e.db.prepare(`UPDATE billing_order_amendments SET ${field} = ? WHERE id = ?`).run(value, a.id));
      }
      assert.throws(() => e.db.prepare("DELETE FROM billing_order_amendments WHERE id = ?").run(a.id), /immutable/);
      assert.throws(() => e.db.prepare("UPDATE billing_order_positions SET sort_index = 1 WHERE id = ?").run(order.positions[1].id), /immutable/);
      assert.deepEqual(e.service.get({ id: order.id }).positions, order.positions);
      assert.deepEqual(e.service.get({ id: order.id }).amendments[0], a);
      // Existing 4a cancellation storage retains its number; no cancellation API added.
      e.db.prepare("UPDATE billing_order_amendments SET status = 'CANCELLED' WHERE id = ?").run(a.id);
      assert.equal(confirm(e, order, create(e, order)).amendment_number, "N 02");
      const before = e.service.get({ id: order.id });
      ensureInvoiceSchema(e.db); ensureInvoiceSchema(e.db);
      assert.deepEqual(e.service.get({ id: order.id }), before);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d: fehlgeschlagener Bestätigungswrite rollt Nummer und Status vollständig zurück", () => {
    const e = fixture();
    try {
      const order = e.order(), draft = create(e, order);
      e.db.exec("CREATE TRIGGER fail_confirm AFTER UPDATE ON billing_order_amendments BEGIN SELECT RAISE(ABORT, 'injected_write_failure'); END;");
      assert.throws(() => confirm(e, order, draft), /injected_write_failure/);
      assert.deepEqual(e.service.get({ id: order.id }).amendments[0], draft);
      assert.equal(e.db.inTransaction, false);
      e.db.exec("DROP TRIGGER fail_confirm");
      assert.equal(confirm(e, order, draft).amendment_number, "N 01");
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d: reale konkurrierende Verbindungen vergeben lückenlos und bestätigen denselben Entwurf nur einmal", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-amendment-race-"));
    const filename = path.join(dir, "bbm.sqlite");
    const e = fixture(filename);
    try {
      const order = e.order();
      const drafts = Array.from({ length: 4 }, () => create(e, order));
      const results = await compete(e, filename, order, drafts);
      assert.ok(results.every(result => result.ok), JSON.stringify(results));
      assert.deepEqual(results.map(r => r.data.sequence_no).sort((a, b) => a - b), [1, 2, 3, 4]);
      const same = create(e, order);
      const repeated = await compete(e, filename, order, [same, same]);
      assert.equal(repeated.filter(r => r.ok).length, 1);
      assert.match(repeated.find(r => !r.ok).error, /not_confirmable/);
      assert.equal(confirm(e, order, create(e, order)).amendment_number, "N 06");
      assert.deepEqual(e.service.get({ id: order.id }).amendments.map(a => a.amendment_number), ["N 01", "N 02", "N 03", "N 04", "N 05", "N 06"]);
    } finally { e.db.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  });

  await run("Rechnung #275 Paket 4d: Nachtragsanlage und Bestätigung verändern keine vorhandenen Rechnungssnapshots", async () => {
    const e = fixture();
    try {
      const order = e.order();
      const invoices = new InvoiceRepository({ dbProvider: () => e.db });
      const service = new InvoiceService({ repository: invoices, billingOrderService: e.service, settingsGetMany: () => ({}), today: () => "2026-09-06" });
      const draft = await service.createDraftFromOrder({ source_order_id: order.id, service_period_type: "SINGLE_DATE", service_date: "2026-09-01" });
      const before = e.db.prepare("SELECT * FROM invoices WHERE id = ?").get(draft.id);
      confirm(e, order, create(e, order));
      confirm(e, order, create(e, order));
      assert.deepEqual(e.db.prepare("SELECT * FROM invoices WHERE id = ?").get(draft.id), before);
      assert.deepEqual(e.service.get({ id: order.id }).positions, order.positions);
    } finally { e.db.close(); }
  });

  await run("Rechnung #275 Paket 4d: echter Preload-IPC-Service-Zugang mit dynamischen Modul- und Fachguards", async () => {
    const e = fixture();
    try {
      const { registerRechnungIpc } = require("../../src/main/ipc/rechnungIpc");
      const { registerActiveModuleIpcs } = require("../../src/main/moduleIpcRegistry");
      const handlers = new Map();
      let status = { valid: true, license: { modules: ["rechnung"] } };
      const options = { ipcMain: { handle: (key, handler) => handlers.set(key, handler) }, licenseStatus: status, getLicenseStatus: () => status,
        registrars: { rechnung: ({ ipcMain }) => registerRechnungIpc({ ipcMain, billingOrderService: e.service, service: {}, firmDirectory: {}, projectRepository: {}, pdfFinalizer: {} }) } };
      registerActiveModuleIpcs(options);
      let api;
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../../src/main/preload.js"), "utf8"), { require: () => ({ contextBridge: { exposeInMainWorld: (key, value) => { if (key === "bbmDb") api = value; } }, ipcRenderer: { invoke: (key, payload) => handlers.get(key)({}, payload), on() {} } }), console, process: { env: {} } });
      const order = e.order();
      const draft = await api.rechnungOrderAmendmentCreateDraft(order.id, values(order));
      assert.equal(draft.ok, true); assert.equal(draft.data.amendment_number, null);
      assert.equal((await api.rechnungOrderAmendmentConfirm(order.id, draft.data.id)).data.amendment_number, "N 01");
      assert.equal((await api.rechnungOrderAmendmentConfirm(order.id, draft.data.id)).code, "billing_order_amendment_not_confirmable");
      assert.equal((await api.rechnungOrderAmendmentCreateDraft(order.id, values(order, { sequence_no: 2 }))).ok, false);
      const unconfirmed = create(e, order);
      e.deny();
      assert.equal((await api.rechnungOrderAmendmentCreateDraft(order.id, values(order))).ok, false);
      assert.equal((await api.rechnungOrderAmendmentConfirm(order.id, unconfirmed.id)).ok, false);
      status = { valid: true, license: { modules: [] } };
      assert.throws(() => api.rechnungOrderAmendmentCreateDraft(order.id, values(order)), /MODULE_NOT_ACTIVE/);
      assert.throws(() => api.rechnungOrderAmendmentConfirm(order.id, unconfirmed.id), /MODULE_NOT_ACTIVE/);
      handlers.clear(); registerActiveModuleIpcs({ ...options, licenseStatus: status });
      assert.equal(handlers.size, 0);
    } finally { e.db.close(); }
  });
}

if (require.main === module && process.argv[2] === "--race-worker") {
  const db = new Database(process.argv[3], { timeout: 10000 });
  db.pragma("foreign_keys = ON");
  const service = new BillingOrderService({ repository: new BillingOrderRepository({ dbProvider: () => db }), authorize: () => {} });
  process.stdout.write("WAITING\n", () => {
    let result;
    try { result = { ok: true, data: service.confirmAmendment({ id: process.argv[4], amendment_id: process.argv[5] }) }; }
    catch (error) { result = { ok: false, error: error.message }; }
    finally { db.close(); }
    process.stdout.write(`RESULT ${JSON.stringify(result)}\n`);
  });
}

module.exports = { runRechnungOrderAmendmentTests };
