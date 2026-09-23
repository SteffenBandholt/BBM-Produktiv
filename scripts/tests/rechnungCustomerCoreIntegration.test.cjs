const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const Database = require("better-sqlite3");

async function loadRules() {
  return import(pathToFileURL(path.join(process.cwd(), "src/shared/rechnung/invoiceHeaderRules.mjs")).href);
}

function customerFixture(overrides = {}) {
  return {
    customerId: "11111111-1111-4111-8111-111111111111",
    customerNumber: "K-000001",
    status: "ACTIVE",
    sourceCode: "MANUAL",
    name1: "Muster GmbH",
    name2: "Abrechnung",
    street: "Hauptweg 1",
    postalCode: "20095",
    city: "Hamburg",
    countryCode: "DE",
    email: "info@example.test",
    phone: "040 123",
    vatId: "DE123456789",
    billingName1: "Muster Rechnung GmbH",
    billingName2: null,
    billingStreet: "Rechnungsweg 2",
    billingPostalCode: "22041",
    billingCity: "Hamburg",
    billingCountryCode: "DE",
    billingEmail: "rechnung@example.test",
    defaultPaymentTermDays: 14,
    revision: 3,
    ...overrides,
  };
}

function customerServiceFixture(customer = customerFixture()) {
  return {
    listCustomers: ({ status } = {}) =>
      !status || customer.status === status ? [customer] : [],
    getCustomer: (id) => id === customer.customerId ? customer : null,
    resolveBillingProfile: (id) => {
      if (id !== customer.customerId) return null;
      return {
        customerId: customer.customerId,
        customerNumber: customer.customerNumber,
        name1: customer.billingName1 || customer.name1,
        name2: customer.billingName2 ?? customer.name2,
        street: customer.billingStreet || customer.street,
        postalCode: customer.billingPostalCode || customer.postalCode,
        city: customer.billingCity || customer.city,
        countryCode: customer.billingCountryCode || customer.countryCode,
        email: customer.billingEmail || customer.email,
        vatId: customer.vatId,
        revision: customer.revision,
        resolvedAt: "2026-09-23T18:00:00.000Z",
      };
    },
  };
}

function draftBase(customerId) {
  return {
    id: "invoice-1",
    status: "DRAFT",
    source_type: "FREE",
    document_type: "INVOICE",
    installment_number: null,
    invoice_date: "2026-09-23",
    service_period_type: "SINGLE_DATE",
    service_date: "2026-09-23",
    service_period_start: null,
    service_period_end: null,
    customer_id: customerId,
    customer_ref_kind: null,
    customer_firm_id: null,
    customer_project_id: null,
    project_id: null,
    source_order_id: null,
    source_order_number: null,
    source_order_date: null,
    order_binding_state: "NOT_APPLICABLE",
    order_snapshot_at: null,
    order_snapshot_json: null,
    service_reference: "Freiberufliche Leistung",
    construction_project: "",
    intro_text: "",
    positions: [],
    payment_term_days: 14,
    due_date: "2026-10-07",
  };
}

async function runRechnungCustomerCoreIntegrationTests(run) {
  await run("Rechnung Customer 01: Header nutzt customer_id und leert Firmenreferenz", async () => {
    const rules = await loadRules();
    const header = rules.normalizeInvoiceHeader({
      ...draftBase("customer-1"),
      customer_ref_kind: "global_firm",
      customer_firm_id: "legacy-firm",
    }, { requireBookingFields: true });
    assert.equal(header.customer_id, "customer-1");
    assert.equal(header.customer_ref_kind, null);
    assert.equal(header.customer_firm_id, null);
    assert.equal(header.customer_project_id, null);
  });

  await run("Rechnung Customer 02: Invoice-Schema enthaelt customer_id und Index", () => {
    const db = new Database(":memory:");
    try {
      const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
      ensureInvoiceSchema(db);
      const columns = db.prepare("PRAGMA table_info(invoices)").all().map((row) => row.name);
      assert.ok(columns.includes("customer_id"));
      const indexes = db.prepare("PRAGMA index_list(invoices)").all().map((row) => row.name);
      assert.ok(indexes.includes("idx_invoices_customer_id"));
    } finally {
      db.close();
    }
  });

  await run("Rechnung Customer 03: Repository speichert neuen Entwurf direkt mit customer_id", () => {
    const db = new Database(":memory:");
    try {
      const { ensureInvoiceSchema } = require("../../src/main/db/invoiceMigrations");
      const { InvoiceRepository } = require("../../src/main/db/invoiceRepository");
      ensureInvoiceSchema(db);
      const repository = new InvoiceRepository({ dbProvider: () => db, clock: () => "2026-09-23T18:00:00.000Z" });
      const created = repository.createDraft({ ...draftBase("customer-1"), positions: [] });
      assert.equal(created.customer_id, "customer-1");
      assert.equal(created.customer_ref_kind, null);
      assert.equal(created.customer_firm_id, null);
    } finally {
      db.close();
    }
  });

  await run("Rechnung Customer 04: Kundenliste stammt aus aktivem Customer Core", () => {
    const customer = customerFixture();
    const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");
    const service = new InvoiceService({
      repository: {},
      billingOrderService: {},
      settingsGetMany: () => ({}),
      customerService: customerServiceFixture(customer),
    });
    const list = service.listCustomers();
    assert.equal(list.length, 1);
    assert.equal(list[0].customerId, customer.customerId);
    assert.equal(list[0].label, "K-000001 · Muster GmbH · Abrechnung");
    assert.equal(list[0].companyName, "Muster GmbH");
    assert.equal(list[0].zip, "20095");
  });

  await run("Rechnung Customer 05: archivierter Customer wird nicht als Rechnungskunde akzeptiert", async () => {
    const customer = customerFixture({ status: "ARCHIVED" });
    const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");
    const service = new InvoiceService({
      repository: { createDraft: () => { throw new Error("should not persist"); } },
      billingOrderService: {},
      settingsGetMany: () => ({}),
      today: () => "2026-09-23",
      customerService: customerServiceFixture(customer),
    });
    await assert.rejects(
      () => service.createDraft({
        ...draftBase(customer.customerId),
        positions: [],
      }),
      /archiviert/
    );
  });

  await run("Rechnung Customer 06: Preview-Snapshot verwendet aufgeloeste Rechnungsanschrift", async () => {
    const customer = customerFixture();
    let receivedSnapshot = null;
    const current = draftBase(customer.customerId);
    const repository = {
      get: () => current,
      buildPreviewSnapshots: (_header, snapshot) => {
        receivedSnapshot = snapshot;
        return { customer_snapshot: snapshot, issuer_snapshot: { companyName: "Aussteller" } };
      },
    };
    const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");
    const service = new InvoiceService({
      repository,
      billingOrderService: {},
      settingsGetMany: () => ({}),
      customerService: customerServiceFixture(customer),
    });
    const preview = await service.previewDraft(current.id, current);
    assert.equal(receivedSnapshot.customerId, customer.customerId);
    assert.equal(receivedSnapshot.customerNumber, "K-000001");
    assert.equal(receivedSnapshot.companyName, "Muster Rechnung GmbH");
    assert.equal(receivedSnapshot.street, "Rechnungsweg 2");
    assert.equal(receivedSnapshot.zip, "22041");
    assert.equal(receivedSnapshot.email, "rechnung@example.test");
    assert.equal(preview.customer_snapshot.customerRevision, 3);
  });

  await run("Rechnung Customer 07: Buchung friert Customer-Snapshot ein", async () => {
    const customer = customerFixture();
    const current = draftBase(customer.customerId);
    let booking = null;
    const repository = {
      get: () => current,
      bookDraft: (_id, header, options) => {
        booking = { header, options };
        return { ...current, ...header, status: "BOOKED", customer_snapshot: options.customerSnapshot };
      },
    };
    const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");
    const service = new InvoiceService({
      repository,
      billingOrderService: {},
      settingsGetMany: () => ({}),
      customerService: customerServiceFixture(customer),
    });
    const booked = await service.bookDraft(current.id, current);
    assert.equal(booking.header.customer_id, customer.customerId);
    assert.equal(booking.options.customerSnapshot.customerNumber, "K-000001");
    assert.equal(booked.customer_snapshot.companyName, "Muster Rechnung GmbH");
  });

  await run("Rechnung Customer 08: unvollstaendige Rechnungsanschrift blockiert Buchung", async () => {
    const customer = customerFixture({
      street: null,
      postalCode: null,
      city: null,
      billingStreet: null,
      billingPostalCode: null,
      billingCity: null,
    });
    const current = draftBase(customer.customerId);
    const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");
    const service = new InvoiceService({
      repository: { get: () => current, bookDraft: () => { throw new Error("should not book"); } },
      billingOrderService: {},
      settingsGetMany: () => ({}),
      customerService: customerServiceFixture(customer),
    });
    await assert.rejects(
      () => service.bookDraft(current.id, current),
      (error) => error.code === "CUSTOMER_BILLING_ADDRESS_INCOMPLETE"
    );
  });

  await run("Rechnung Customer 09: FROM_ORDER loest bewusst verknuepften Customer auf", async () => {
    const customer = customerFixture();
    let createdHeader = null;
    const order = {
      id: "order-1",
      status: "CONFIRMED",
      order_number: "A-2026-1",
      order_date: "2026-09-01",
      customer_firm_id: "firm-1",
      project_id: null,
      service_reference: "Bauvorhaben",
      positions: [],
      amendments: [],
    };
    const repository = {
      withTransaction: (operation) => operation(),
      createDraft: (header) => { createdHeader = header; return { id: "draft-1", ...header }; },
    };
    const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");
    const service = new InvoiceService({
      repository,
      billingOrderService: { get: () => order },
      settingsGetMany: () => ({}),
      today: () => "2026-09-23",
      customerService: customerServiceFixture(customer),
      customerFirmBridge: { getLinkedCustomer: () => ({ customer }) },
    });
    await service.createDraftFromOrder({
      source_order_id: order.id,
      invoice_date: "2026-09-23",
      service_period_type: "SINGLE_DATE",
      service_date: "2026-09-23",
    });
    assert.equal(createdHeader.customer_id, customer.customerId);
    assert.equal(createdHeader.customer_firm_id, null);
    assert.equal(createdHeader.payment_term_days, 14);
  });

  await run("Rechnung Customer 10: unverknuepfte Auftragsfirma blockiert Rechnungsentwurf", async () => {
    const order = {
      id: "order-1", status: "CONFIRMED", order_number: "A-1", order_date: "2026-09-01",
      customer_firm_id: "firm-1", project_id: null, service_reference: "BV", positions: [], amendments: [],
    };
    const { InvoiceService } = require("../../src/main/domain/rechnung/InvoiceService");
    const service = new InvoiceService({
      repository: { withTransaction: (operation) => operation() },
      billingOrderService: { get: () => order },
      settingsGetMany: () => ({}),
      today: () => "2026-09-23",
      customerService: customerServiceFixture(),
      customerFirmBridge: { getLinkedCustomer: () => ({ customer: null }) },
    });
    await assert.rejects(
      () => service.createDraftFromOrder({
        source_order_id: order.id,
        invoice_date: "2026-09-23",
        service_period_type: "SINGLE_DATE",
        service_date: "2026-09-23",
      }),
      (error) => error.code === "ORDER_CUSTOMER_NOT_LINKED"
    );
  });

  await run("Rechnung Customer 11: Renderer sendet customer_id und keine Firmenidentitaet", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"),
      "utf8"
    );
    assert.match(source, /customer_id:\s*customerId/);
    assert.match(source, /customer_ref_kind:\s*null/);
    assert.match(source, /customer_firm_id:\s*null/);
    assert.match(source, /defaultPaymentTermDays/);
    assert.doesNotMatch(source, /const \[fallbackKind, fallbackId\]/);
  });

  await run("Rechnung Customer 12: Rechnung-IPC liest Kunden nicht mehr aus FirmDirectory", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/main/ipc/rechnungIpc.js"), "utf8");
    assert.match(source, /rechnung:listCustomers/);
    assert.match(source, /service\.listCustomers\(\)/);
    assert.doesNotMatch(source, /getFirmDirectoryService/);
    assert.doesNotMatch(source, /firmDirectory\.listCustomers/);
  });
}

module.exports = { runRechnungCustomerCoreIntegrationTests };
