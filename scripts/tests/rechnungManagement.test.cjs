const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function fixture({ today = "2026-08-20" } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-invoice-management-"));
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
  db.prepare("INSERT INTO firms (id, name, street, zip, city, country, use_customer) VALUES ('f1', 'Kunde Eins', 'Kundenweg 1', '12345', 'Kundenstadt', 'DE', 1)").run();
  const firmUsagesRepo = require(path.join(process.cwd(), "src/main/db/firmUsagesRepo.js"));
  firmUsagesRepo.setUsage({ firmId: "f1", usageCode: firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER, enabled: true, dbConn: db });
  db.prepare("INSERT INTO user_profile (id, name1, street, zip, city, country) VALUES (1, 'BBM Betrieb', 'Werkweg 2', '54321', 'Sitzstadt', 'DE')").run();
  const { InvoiceRepository } = require(path.join(process.cwd(), "src/main/db/invoiceRepository.js"));
  const { InvoiceService } = require(path.join(process.cwd(), "src/main/domain/rechnung/InvoiceService.js"));
  let tick = 0;
  const repository = new InvoiceRepository({ dbProvider: () => db, clock: () => `2026-08-20T12:00:${String(tick++).padStart(2, "0")}.000Z` });
  const service = new InvoiceService({ repository, settingsGetMany: () => ({ "invoice.paymentTermDays": "8" }), today: () => today });
  return { db, repository, service, close() { db.close(); fs.rmSync(root, { recursive: true, force: true }); } };
}

const complete = (overrides = {}) => ({
  source_type: "FREE", document_type: "INVOICE", invoice_date: "2026-08-15",
  service_period_type: "SINGLE_DATE", service_date: "2026-08-15",
  customer_ref_kind: "global_firm", customer_firm_id: "f1", project_id: "p1",
  service_reference: "Neubau Musterstraße",
  positions: [{ id: "position-1", type: "service", short_text: "Montage", quantity: "2", unit: "h", unit_price_cents: 5000, vat_rate_percent: 19 }],
  payment_term_days: 8,
  ...overrides,
});

async function book(env, overrides = {}) {
  const draft = await env.service.createDraft(complete(overrides));
  return env.service.bookDraft(draft.id);
}

async function runRechnungManagementTests(run) {
  const root = process.cwd();
  const screenModule = await importEsmFromFile(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"));
  const contractModule = await importEsmFromFile(path.join(root, "src/renderer/modules/rechnungen/RechnungScreen.uiEditorContract.js"));
  const { default: RechnungScreen, draftPreviewIdentifier, invoiceMatchesManagementFilter, parseEuroToCents } = screenModule;

  await run("Rechnung R3.2 01: Managementliste lädt DRAFT und BOOKED mit zentral abgeleiteten Summen", async () => {
    const env = fixture();
    try {
      const booked = await book(env);
      const draft = await env.service.createDraft(complete({ service_reference: "Zweiter Entwurf" }));
      const list = await env.service.listManagement();
      assert.deepEqual(new Set(list.map((invoice) => invoice.status)), new Set(["DRAFT", "BOOKED"]));
      assert.deepEqual(list.find((invoice) => invoice.id === booked.id), { ...env.service.get(booked.id), invoice_id: booked.id, gross_cents: 11900, paid_cents: 0, open_cents: 11900, payment_status: "OPEN" });
      assert.equal(list.find((invoice) => invoice.id === draft.id).payment_status, null);
      assert.match(fs.readFileSync(path.join(root, "src/main/ipc/rechnungIpc.js"), "utf8"), /rechnung:listManagement/);
      assert.match(fs.readFileSync(path.join(root, "src/main/preload.js"), "utf8"), /rechnungListManagement/);
    } finally { env.close(); }
  });

  await run("Rechnung R3.2 02: Entwurf zeigt nur stabile Entwurfskennung und keine offizielle Rechnungsnummer", async () => {
    const env = fixture();
    try {
      const draft = await env.service.createDraft(complete());
      assert.equal(draft.invoice_number, null);
      assert.match(draftPreviewIdentifier(draft.id), /^PR-[A-Z0-9]{6}$/);
      assert.notEqual(draftPreviewIdentifier(draft.id), draft.invoice_number);
    } finally { env.close(); }
  });

  await run("Rechnung R3.2 03: gebuchte Rechnung zeigt die vergebene Rechnungsnummer", async () => {
    const env = fixture();
    try { assert.match((await book(env)).invoice_number, /^2026-0001$/); } finally { env.close(); }
  });

  await run("Rechnung R3.2 04: unbezahlte gebuchte Rechnung wird OPEN", async () => {
    const env = fixture();
    try { const invoice = await book(env); assert.equal((await env.service.listManagement()).find((entry) => entry.id === invoice.id).payment_status, "OPEN"); } finally { env.close(); }
  });

  await run("Rechnung R3.2 05: Teilzahlung wird PARTIALLY_PAID", async () => {
    const env = fixture();
    try { const invoice = await book(env); await env.service.recordPayment(invoice.id, { payment_date: "2026-08-20", amount_cents: 4000 }); const row = (await env.service.listManagement()).find((entry) => entry.id === invoice.id); assert.deepEqual([row.paid_cents, row.open_cents, row.payment_status], [4000, 7900, "PARTIALLY_PAID"]); } finally { env.close(); }
  });

  await run("Rechnung R3.2 06: Vollzahlung wird PAID", async () => {
    const env = fixture();
    try { const invoice = await book(env); await env.service.recordPayment(invoice.id, { payment_date: "2026-08-20", amount_cents: 11900 }); const row = (await env.service.listManagement()).find((entry) => entry.id === invoice.id); assert.deepEqual([row.paid_cents, row.open_cents, row.payment_status], [11900, 0, "PAID"]); } finally { env.close(); }
  });

  await run("Rechnung R3.2 07: fällige offene Rechnung wird abgeleitet OVERDUE", async () => {
    const env = fixture({ today: "2026-08-24" });
    try { const invoice = await book(env); assert.equal((await env.service.listManagement()).find((entry) => entry.id === invoice.id).payment_status, "OVERDUE"); } finally { env.close(); }
  });

  const filterRows = Object.freeze([
    Object.freeze({ id: "draft", status: "DRAFT", payment_status: null }),
    Object.freeze({ id: "open", status: "BOOKED", payment_status: "OPEN" }),
    Object.freeze({ id: "partial", status: "BOOKED", payment_status: "PARTIALLY_PAID" }),
    Object.freeze({ id: "overdue", status: "BOOKED", payment_status: "OVERDUE" }),
    Object.freeze({ id: "paid", status: "BOOKED", payment_status: "PAID" }),
  ]);
  const filteredIds = (filter) => filterRows.filter((invoice) => invoiceMatchesManagementFilter(invoice, filter)).map((invoice) => invoice.id);

  await run("Rechnung R3.2 08: Filter Entwürfe nutzt ausschließlich Belegstatus DRAFT", () => assert.deepEqual(filteredIds("DRAFT"), ["draft"]));
  await run("Rechnung R3.2 09: Filter Offen nutzt BOOKED plus Zahlungsstatus OPEN", () => assert.deepEqual(filteredIds("OPEN"), ["open"]));
  await run("Rechnung R3.2 10: Filter Teilbezahlt nutzt BOOKED plus PARTIALLY_PAID", () => assert.deepEqual(filteredIds("PARTIALLY_PAID"), ["partial"]));
  await run("Rechnung R3.2 11: Filter Überfällig nutzt BOOKED plus OVERDUE", () => assert.deepEqual(filteredIds("OVERDUE"), ["overdue"]));
  await run("Rechnung R3.2 12: Filter Bezahlt nutzt BOOKED plus PAID", () => assert.deepEqual(filteredIds("PAID"), ["paid"]));

  await run("Rechnung R3.2 13: UI erfasst Eurobetrag auf BOOKED als Integer-Cent und aktualisiert sofort", async () => {
    const previousWindow = global.window;
    const calls = [];
    const updated = { id: "invoice-1", status: "BOOKED", invoice_number: "2026-0001", gross_cents: 11900, paid_cents: 4000, open_cents: 7900, payment_status: "PARTIALLY_PAID" };
    global.window = { bbmDb: {
      rechnungRecordPayment: async (invoiceId, payment) => { calls.push([invoiceId, payment]); return { ok: true, data: { id: "payment-1", ...payment } }; },
      rechnungListManagement: async () => ({ ok: true, list: [updated] }),
    } };
    try {
      const screen = new RechnungScreen();
      screen.paymentInvoice = { ...updated, paid_cents: 0, open_cents: 11900, payment_status: "OPEN" };
      screen.paymentDate = { value: "2026-08-20" }; screen.paymentAmount = { value: "40,00" }; screen.paymentNote = { value: "Anzahlung" };
      screen.paymentSaveButton = { disabled: false, textContent: "" }; screen.paymentCancelButton = { textContent: "" }; screen.paymentMessage = { textContent: "", dataset: {} };
      screen.paymentGrossValue = { textContent: "" }; screen.paymentPaidValue = { textContent: "" }; screen.paymentOpenValue = { textContent: "" };
      screen._renderList = () => {}; screen._reloadPayments = async () => true;
      assert.equal(parseEuroToCents("1.234,56 EUR"), 123456);
      assert.equal(await screen._savePayment(), true);
      assert.deepEqual(calls, [["invoice-1", { payment_date: "2026-08-20", amount_cents: 4000, note: "Anzahlung" }]]);
      assert.deepEqual([screen.paymentInvoice.paid_cents, screen.paymentInvoice.open_cents, screen.paymentInvoice.payment_status], [4000, 7900, "PARTIALLY_PAID"]);
    } finally { global.window = previousWindow; }
  });

  await run("Rechnung R3.2 14: Zahlung auf DRAFT ist über UI und IPC gesperrt", async () => {
    const env = fixture();
    const previousWindow = global.window;
    try {
      const draft = await env.service.createDraft(complete());
      const screen = new RechnungScreen(); screen.paymentPanel = { hidden: true };
      assert.equal(await screen._openPaymentManagement(draft), false);
      let calls = 0;
      const handlers = new Map();
      require(path.join(root, "src/main/ipc/rechnungIpc.js")).registerRechnungIpc({ ipcMain: { handle(channel, handler) { handlers.set(channel, handler); } }, app: { isPackaged: false }, service: env.service, firmDirectory: { listCustomers: () => [] }, projectRepository: { listAll: () => [] } });
      global.window = { bbmDb: { rechnungRecordPayment: async () => { calls += 1; return { ok: true }; } } };
      const result = await handlers.get("rechnung:recordPayment")({}, { invoiceId: draft.id, payment: { payment_date: "2026-08-20", amount_cents: 100 } });
      assert.equal(result.ok, false); assert.match(result.error, /nur.*gebuchte Rechnungen|nur für gebuchte Rechnungen/s); assert.equal(calls, 0);
    } finally { global.window = previousWindow; env.close(); }
  });

  await run("Rechnung R3.2 15: UI-Zahlungskorrektur aktualisiert Summen und Status", async () => {
    const previousWindow = global.window;
    const calls = [];
    const paid = { id: "invoice-1", status: "BOOKED", invoice_number: "2026-0001", gross_cents: 11900, paid_cents: 11900, open_cents: 0, payment_status: "PAID" };
    global.window = { bbmDb: { rechnungCorrectPayment: async (...args) => { calls.push(args); return { ok: true, data: { id: "payment-1" } }; }, rechnungListManagement: async () => ({ ok: true, list: [paid] }) } };
    try {
      const screen = new RechnungScreen(); screen.paymentInvoice = { ...paid, paid_cents: 4000, open_cents: 7900, payment_status: "PARTIALLY_PAID" }; screen.paymentEditingId = "payment-1";
      screen.paymentDate = { value: "2026-08-21" }; screen.paymentAmount = { value: "119,00" }; screen.paymentNote = { value: "Korrigiert" }; screen.paymentSaveButton = { disabled: false, textContent: "" }; screen.paymentCancelButton = { textContent: "" }; screen.paymentMessage = { textContent: "", dataset: {} }; screen.paymentGrossValue = { textContent: "" }; screen.paymentPaidValue = { textContent: "" }; screen.paymentOpenValue = { textContent: "" }; screen._renderList = () => {}; screen._reloadPayments = async () => true;
      assert.equal(await screen._savePayment(), true);
      assert.deepEqual(calls, [["invoice-1", "payment-1", { payment_date: "2026-08-21", amount_cents: 11900, note: "Korrigiert" }]]);
      assert.deepEqual([screen.paymentInvoice.paid_cents, screen.paymentInvoice.open_cents, screen.paymentInvoice.payment_status], [11900, 0, "PAID"]);
    } finally { global.window = previousWindow; }
  });

  await run("Rechnung R3.2 16: BOOKED bleibt inhaltlich schreibgeschützt", () => {
    const screen = new RechnungScreen(); const control = () => ({ disabled: false, hidden: false });
    screen.current = { status: "BOOKED" }; screen.paymentText = { textContent: "" }; screen.dueDate = { value: "2026-08-23" }; screen.paymentTerm = { value: "8" }; screen.status = { textContent: "", className: "" };
    ["source", "documentType", "installmentNumber", "customer", "project", "invoiceDate", "serviceType", "serviceDate", "serviceMonth", "serviceStart", "serviceEnd", "reference", "constructionProject", "introText", "paymentTerm", "positionType", "positionShort", "positionLong", "positionQuantity", "positionUnit", "positionPrice", "positionPriceGross", "positionNep", "positionDeleteButton", "positionCreateTitleButton", "positionCreateButton", "positionMoveButton", "positionMoveRootButton", "customerPickerButton", "servicePeriodToggle"].forEach((name) => { screen[name] = control(); });
    screen.bookButton = control(); screen.deleteButton = control(); screen.positionsList = { classList: { toggle() {} } };
    screen._setBooked(true);
    assert.equal(screen.reference.disabled, true); assert.equal(screen.positionPrice.disabled, true); assert.equal(screen.customerPickerButton.disabled, true); assert.equal(screen.bookButton.hidden, true); assert.equal(screen.deleteButton.hidden, true);
  });

  await run("Rechnung R3.2 17: DEV-Nummernreset bleibt backendseitig nur ungepackt", () => {
    const { devOnly } = require(path.join(root, "src/main/ipc/rechnungIpc.js"));
    let calls = 0; const operation = () => { calls += 1; return true; };
    assert.equal(devOnly({ isPackaged: false }, operation)({}), true);
    assert.throws(() => devOnly({ isPackaged: true }, operation)({}), (error) => error.code === "DEV_ONLY");
    assert.equal(calls, 1);
  });

  await run("Rechnung R3.2 18: bestehende 81 Rechnung-UI-Editor-Refs bleiben vollständig", () => {
    assert.equal(contractModule.RECHNUNG_REQUIRED_SLOTS.length, 81);
    assert.equal(new Set(contractModule.RECHNUNG_REQUIRED_SLOTS).size, 81);
  });

  await run("Rechnung R3.2 19: keine neue Filter- oder Zahlungsfachaktion wird Editor-Ziel", () => {
    const ids = contractModule.RECHNUNG_REQUIRED_SLOTS;
    assert.equal(ids.some((id) => /filter|paymentRecord|paymentCorrect|zahlung/i.test(id)), false);
    const source = fs.readFileSync(path.join(root, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"), "utf8");
    for (const className of ["rechnung-management-filters", "rechnung-payment-management", "rechnung-payment-management__form"]) {
      const declaration = source.split(/\r?\n/).find((line) => line.includes(className) && line.includes("node("));
      assert.ok(declaration, className); assert.equal(declaration.includes("bind("), false, className);
    }
    for (const actionLabel of ["Zahlungen", "Korrigieren", "Zahlung speichern"]) assert.equal(source.includes(`plainButton(\"${actionLabel}\"`), true, actionLabel);
  });

  await run("Rechnung R3.2 20: R3.1-Fachtests bleiben vor R3.2 in derselben Rechnungsgruppe verankert", () => {
    const { findTestGroup } = require(path.join(root, "scripts/testGroups.cjs"));
    const suites = findTestGroup("rechnungen-design").suites.map(([name]) => name);
    assert.ok(suites.indexOf("rechnungPayments.test.cjs") >= 0);
    assert.ok(suites.indexOf("rechnungIpc.test.cjs") >= 0);
    assert.ok(suites.indexOf("rechnungManagement.test.cjs") > suites.indexOf("rechnungIpc.test.cjs"));
  });
}

module.exports = { runRechnungManagementTests };
