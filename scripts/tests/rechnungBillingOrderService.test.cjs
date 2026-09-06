const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Database = require("better-sqlite3");
const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
const { BillingOrderRepository } = require("../../src/main/db/billingOrderRepository");
const { BillingOrderService } = require("../../src/main/domain/rechnung/BillingOrderService");

const header = () => ({ order_number: "A-2026-25", order_date: "2026-09-06", customer_firm_id: "firm-1", project_id: null, service_reference: "Sanierung Musterstraße" });
const item = (patch = {}) => ({ type: "service", position_number: "25", sort_index: 20, short_text: "Mauerwerk", quantity: "12.50", unit: "m2", unit_price_cents: 12345, vat_rate_percent: 19, price_input_mode: "NET", ...patch });

function fixture() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec("CREATE TABLE firms (id TEXT PRIMARY KEY, removed_at TEXT, is_trashed INTEGER); CREATE TABLE projects (id TEXT PRIMARY KEY); INSERT INTO firms VALUES ('firm-1', NULL, 0);");
  ensureInvoiceSchema(db);
  const repository = new BillingOrderRepository({ dbProvider: () => db });
  let allowed = true;
  let authorizations = 0;
  const service = new BillingOrderService({ repository, authorize: () => {
    authorizations++;
    if (!allowed) throw new Error("FEATURE_NOT_ALLOWED:rechnung");
  } });
  return { db, repository, service, deny: () => { allowed = false; }, authorizations: () => authorizations };
}

async function runRechnungBillingOrderServiceTests(run) {
  await run("Rechnung #275 Paket 4b: Service erfasst und bestätigt Vertrags-LV ohne neue Identitäten oder Nummerierung", () => {
    const { db, service } = fixture();
    try {
      const order = service.createDraft(header());
      const heading = service.addPosition({ id: order.id, position: item({ type: "heading", position_number: "10", sort_index: 10 }) });
      const child = service.addPosition({ id: order.id, position: item({ parent_position_id: heading.id }) });
      const last = service.addPosition({ id: order.id, position: item({ position_number: "40.01", sort_index: 40 }) });
      const before = service.get({ id: order.id });
      const confirmed = service.confirmOrder({ id: order.id });
      assert.equal(confirmed.status, "CONFIRMED");
      assert.deepEqual(confirmed.positions, before.positions);
      assert.deepEqual(confirmed.positions.map(p => [p.id, p.position_number, p.sort_index]), [[heading.id, "10", 10], [child.id, "25", 20], [last.id, "40.01", 40]]);
      assert.equal(service.repository, undefined);
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM invoices").get().n, 0);
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM billing_order_amendments").get().n, 0);
      // Nachtragsoperationen ergänzt in Paket 4d; der unveränderte Auftrag hat keine Nachträge.
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4b: bestätigter Auftrag ist nur lesbar und abgewiesene Befehle verändern nichts", () => {
    const { db, service } = fixture();
    try {
      const { id } = service.createDraft(header());
      service.addPosition({ id, position: item() });
      const confirmed = service.confirmOrder({ id });
      assert.throws(() => service.addPosition({ id, position: item({ position_number: "40", sort_index: 30 }) }), /billing_order_not_editable/);
      assert.throws(() => service.confirmOrder({ id }), /billing_order_not_editable/);
      assert.throws(() => service.confirmOrder({ id, status: "DRAFT" }), /billing_order_field_not_allowed/);
      assert.deepEqual(service.get({ id }), confirmed);
      db.prepare("UPDATE billing_orders SET status = 'CANCELLED' WHERE id = ?").run(id);
      assert.equal(service.get({ id }).status, "CANCELLED");
      assert.throws(() => service.addPosition({ id, position: item() }), /billing_order_not_editable/);
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4b: strikte Payload-, UUID-, Datums- und Positionsvalidierung vor Schreibzugriff", () => {
    const { db, service } = fixture();
    try {
      for (const value of [null, [], "Auftrag", { ...header(), id: "11111111-1111-4111-8111-111111111111" }, { ...header(), status: "CONFIRMED" }, { ...header(), order_date: "2026-02-30" }, { ...header(), order_number: {} }]) {
        assert.throws(() => service.createDraft(value), /billing_order_/);
      }
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM billing_orders").get().n, 0);
      assert.throws(() => service.get({ id: header().order_number }), /billing_order_id_invalid/);
      assert.throws(() => service.get({ id: "11111111-1111-4111-8111-111111111111" }), /billing_order_not_found/);
      const { id } = service.createDraft(header());
      for (const patch of [{ sort_index: "1" }, { sort_index: 1.5 }, { sort_index: -1 }, { type: "other" }, { quantity: "12,50" }, { quantity: {} }, { unit_price_cents: 1.5 }, { vat_rate_percent: 101 }, { is_nep: "false" }, { price_input_mode: "other" }, { order_id: id }, { position_number: "" }]) {
        assert.throws(() => service.addPosition({ id, position: item(patch) }), /billing_order_/);
      }
      assert.equal(service.get({ id }).positions.length, 0);
      assert.throws(() => service.confirmOrder({ id }), /billing_order_service_position_required/);
      assert.equal(service.get({ id }).status, "DRAFT");
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4b: doppelte Nummern, fremde Parents und ungültiger Bestand verhindern Bestätigung atomar", () => {
    const { db, service, repository } = fixture();
    try {
      const { id } = service.createDraft(header());
      const first = service.addPosition({ id, position: item() });
      for (const patch of [{ sort_index: 30 }, { position_number: "40" }, { position_number: "40", sort_index: 10, parent_position_id: first.id }, { position_number: "40", sort_index: 30, parent_position_id: "11111111-1111-4111-8111-111111111111" }]) {
        assert.throws(() => service.addPosition({ id, position: item(patch) }), /billing_order_position_(duplicate|parent_invalid)/);
      }
      assert.equal(service.get({ id }).positions.length, 1);
      // A pre-4b persisted malformed quantity must not become a confirmed source LV.
      repository.addPosition(id, item({ position_number: "40", sort_index: 30, quantity: "historisch unklar" }));
      const before = service.get({ id });
      assert.throws(() => service.confirmOrder({ id }), /billing_order_quantity_invalid/);
      assert.deepEqual(service.get({ id }), before);
      assert.equal(db.inTransaction, false);
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4b: LEGACY_UNRESOLVED bleibt Rechnung und wird weder zugeordnet noch gebunden", () => {
    const { db, service } = fixture();
    try {
      const { id } = service.createDraft(header());
      service.addPosition({ id, position: item() });
      service.confirmOrder({ id });
      db.prepare("INSERT INTO invoices (id, source_type, source_order_id, source_order_number, positions_json, invoice_date, due_date, created_at, updated_at) VALUES ('old-draft', 'FROM_ORDER', ?, ?, ?, '2026-09-06', '2026-09-14', 'old', 'old')").run(id, header().order_number, '[{"position_number":"25"}]');
      const old = db.prepare("SELECT * FROM invoices WHERE id = 'old-draft'").get();
      assert.equal(old.order_binding_state, "LEGACY_UNRESOLVED");
      for (const operation of ["get", "createDraft", "addPosition", "confirmOrder"]) {
        assert.throws(() => service[operation]({ ...old, id }), /billing_order_legacy_unresolved/);
      }
      assert.throws(() => service.get({ source_order_id: id }), /billing_order_field_not_allowed/);
      assert.deepEqual(db.prepare("SELECT * FROM invoices WHERE id = 'old-draft'").get(), old);
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM billing_orders").get().n, 1);
    } finally { db.close(); }
  });

  await run("Rechnung #275 Paket 4b: jeder Servicezugriff prüft aktuelle Freigabe auch ohne IPC", () => {
    const env = fixture();
    try {
      env.deny();
      for (const operation of ["get", "createDraft", "addPosition", "confirmOrder"]) assert.throws(() => env.service[operation]({}), /FEATURE_NOT_ALLOWED:rechnung/);
      assert.equal(env.authorizations(), 4);
      assert.equal(env.db.prepare("SELECT COUNT(*) AS n FROM billing_orders").get().n, 0);
    } finally { env.db.close(); }
  });

  await run("Rechnung #275 Paket 4b: genau ein produktiver Repositoryzugang und keine Auftragsfachlogik im Core oder Renderer", () => {
    const root = process.cwd();
    const importers = [];
    function visit(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) visit(file);
        else if (/\.(?:js|cjs|mjs)$/.test(file) && /(?:require\(|from\s*)["'][^"']*billingOrderRepository/.test(fs.readFileSync(file, "utf8"))) importers.push(path.relative(root, file).replaceAll("\\", "/"));
      }
    }
    visit(path.join(root, "src"));
    assert.deepEqual(importers, ["src/main/domain/rechnung/BillingOrderService.js"]);
    for (const file of ["src/main/main.js", "src/main/db/database.js", "src/main/moduleIpcRegistry.js"]) assert.doesNotMatch(fs.readFileSync(path.join(root, file), "utf8"), /billing_orders|billing_order_positions|BillingOrderService|LEGACY_UNRESOLVED/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, "src/main/domain/rechnung/BillingOrderService.js"), "utf8"), /better-sqlite3|\.prepare\(|CREATE TABLE/);
  });

  await run("Rechnung #275 Paket 4b: Preload und modularer IPC führen alle Auftragszugriffe durch den Service", async () => {
    const env = fixture();
    try {
      const { registerRechnungIpc } = require("../../src/main/ipc/rechnungIpc");
      const { registerActiveModuleIpcs } = require("../../src/main/moduleIpcRegistry");
      const handlers = new Map();
      let status = { valid: true, license: { modules: ["rechnung"] } };
      const options = {
        ipcMain: { handle: (name, handler) => handlers.set(name, handler) },
        licenseStatus: status, getLicenseStatus: () => status,
        registrars: { rechnung: ({ ipcMain }) => registerRechnungIpc({ ipcMain, billingOrderService: env.service, service: {}, firmDirectory: {}, projectRepository: {}, pdfFinalizer: {} }) },
      };
      registerActiveModuleIpcs(options);
      let api;
      const source = fs.readFileSync(path.join(process.cwd(), "src/main/preload.js"), "utf8");
      vm.runInNewContext(source, { require: (name) => {
        assert.equal(name, "electron");
        return { contextBridge: { exposeInMainWorld: (key, value) => { if (key === "bbmDb") api = value; } }, ipcRenderer: { invoke: (channel, payload) => handlers.get(channel)({}, payload), on() {} } };
      }, console, process: { env: {} } });
      assert.deepEqual([...handlers.keys()].filter(k => k.startsWith("rechnung:order:")), ["rechnung:order:get", "rechnung:order:createDraft", "rechnung:order:addPosition", "rechnung:order:confirm", "rechnung:order:amendment:createDraft", "rechnung:order:amendment:confirm"]);
      const created = await api.rechnungOrderCreateDraft(header());
      assert.equal(created.ok, true);
      const { id } = created.data;
      assert.equal((await api.rechnungOrderAddPosition(id, item())).ok, true);
      assert.equal((await api.rechnungOrderConfirm(id)).data.status, "CONFIRMED");
      assert.equal((await api.rechnungOrderGet(id)).data.id, id);
      const deniedWrite = await api.rechnungOrderAddPosition(id, item());
      assert.equal(deniedWrite.ok, false);
      assert.equal(deniedWrite.code, "billing_order_not_editable");
      const legacy = await handlers.get("rechnung:order:get")({}, { id, order_binding_state: "LEGACY_UNRESOLVED" });
      assert.equal(legacy.code, "billing_order_legacy_unresolved");
      status = { valid: true, license: { modules: [] } };
      assert.throws(() => api.rechnungOrderGet(id), /MODULE_NOT_ACTIVE:rechnung/);
      handlers.clear();
      registerActiveModuleIpcs({ ...options, licenseStatus: status });
      assert.equal(handlers.size, 0);
    } finally { env.db.close(); }
  });
}

module.exports = { runRechnungBillingOrderServiceTests };
