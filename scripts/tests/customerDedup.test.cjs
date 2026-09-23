const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const corePath = path.resolve(process.cwd(), "src/customer-core");

function withCore(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-customer-dedup-"));
  const { createCustomerCore } = require(corePath);
  const core = createCustomerCore({ userDataPath: root });
  try {
    return fn(core);
  } finally {
    core.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function withBridge(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-customer-dedup-bridge-"));
  const bbmUserData = path.join(root, "bbm");
  const customerUserData = path.join(root, "customer");
  fs.mkdirSync(bbmUserData, { recursive: true });
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron" && String(parent?.filename || "").endsWith(path.join("db", "database.js"))) {
      return { app: { getPath: (name) => (name === "userData" ? bbmUserData : ""), isPackaged: true } };
    }
    return originalLoad.apply(this, arguments);
  };

  const paths = {
    db: path.join(process.cwd(), "src/main/db/database.js"),
    firmsRepo: path.join(process.cwd(), "src/main/db/firmsRepo.js"),
    projectFirmsRepo: path.join(process.cwd(), "src/main/db/projectFirmsRepo.js"),
    firmUsagesRepo: path.join(process.cwd(), "src/main/db/firmUsagesRepo.js"),
    firmDirectory: path.join(process.cwd(), "src/main/domain/firms/FirmDirectoryService.js"),
    bridge: path.join(process.cwd(), "src/main/domain/customers/CustomerFirmBridgeService.js"),
  };
  let customerCore = null;
  let database = null;
  try {
    for (const modulePath of Object.values(paths)) delete require.cache[require.resolve(modulePath)];
    database = require(paths.db);
    require(paths.firmsRepo);
    require(paths.projectFirmsRepo);
    require(paths.firmUsagesRepo);
    const { FirmDirectoryService } = require(paths.firmDirectory);
    const { CustomerFirmBridgeService } = require(paths.bridge);
    const { createCustomerCore } = require(corePath);
    const bbmDb = database.initDatabase();
    customerCore = createCustomerCore({ userDataPath: customerUserData });
    const firmDirectory = new FirmDirectoryService({ dbProvider: () => bbmDb });
    const bridge = new CustomerFirmBridgeService({ firmDirectory, customerCore });
    return await fn({ customerCore, firmDirectory, bridge });
  } finally {
    try { customerCore?.close(); } catch (_) {}
    try { database?.closeDatabase(); } catch (_) {}
    for (const modulePath of Object.values(paths)) {
      try { delete require.cache[require.resolve(modulePath)]; } catch (_) {}
    }
    Module._load = originalLoad;
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runCustomerDedupTests(run) {
  const {
    DUPLICATE_STATUS,
    normalizeCompanyName,
    normalizeStreet,
    normalizeVatId,
    findDuplicateCandidates,
  } = require(corePath);

  await run("Customer Dedup 01: deutsche Namen und Anschriften werden robust normalisiert", () => {
    assert.equal(normalizeCompanyName("Müller GmbH & Co. KG"), "muller");
    assert.equal(normalizeCompanyName("MÜLLER"), "muller");
    assert.equal(normalizeStreet("Hauptstraße 10"), normalizeStreet("Hauptstr. 10"));
    assert.equal(normalizeVatId("DE 123 456 789"), "DE123456789");
  });

  await run("Customer Dedup 02: gleiche USt-IdNr. ist ein starker moeglicher Treffer", () => {
    const candidates = findDuplicateCandidates(
      { name1: "Neue Bezeichnung", vatId: "DE 123456789" },
      [{ customerId: "c1", customerNumber: "K-000001", name1: "Alt", vatId: "DE123456789", status: "ACTIVE" }]
    );
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].score, 100);
    assert.ok(candidates[0].reasons.some((reason) => reason.code === "VAT_ID_EXACT"));
  });

  await run("Customer Dedup 03: Name plus Anschrift erzeugt nachvollziehbaren Kandidaten", () => {
    const candidates = findDuplicateCandidates(
      { name1: "Muster GmbH", street: "Hauptstraße 1", postalCode: "20095", city: "Hamburg" },
      [{ customerId: "c1", customerNumber: "K-000001", name1: "Muster", street: "Hauptstr. 1", postalCode: "20095", city: "Hamburg", status: "ACTIVE" }]
    );
    assert.equal(candidates.length, 1);
    assert.ok(candidates[0].score >= 80);
    assert.ok(candidates[0].reasons.some((reason) => reason.code === "NAME1_EXACT"));
    assert.ok(candidates[0].reasons.some((reason) => reason.code === "ADDRESS_EXACT"));
  });

  await run("Customer Dedup 04: Name plus E-Mail erzeugt Kandidat, gleicher Name allein nicht", () => {
    const customers = [{ customerId: "c1", customerNumber: "K-000001", name1: "Muster GmbH", email: "Info@Example.test", status: "ACTIVE" }];
    assert.equal(findDuplicateCandidates({ name1: "Muster", email: "info@example.test" }, customers).length, 1);
    assert.equal(findDuplicateCandidates({ name1: "Muster" }, customers).length, 0);
  });

  await run("Customer Dedup 05: CustomerService prueft auch archivierte Kunden", () =>
    withCore(({ service }) => {
      const customer = service.createCustomer({
        name1: "Archiv GmbH",
        countryCode: "DE",
        vatId: "DE999999999",
      });
      service.archiveCustomer(customer.customerId);
      const candidates = service.findDuplicates({ name1: "Anders", vatId: "DE 999999999" });
      assert.equal(candidates.length, 1);
      assert.equal(candidates[0].status, "ARCHIVED");
    })
  );

  await run("Customer Dedup 06: Bridge-Vorschau unterscheidet NO_MATCH, POSSIBLE_MATCH und ALREADY_LINKED", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      customerCore.service.createCustomer({
        name1: "Muster GmbH",
        street: "Hauptstraße 1",
        postalCode: "20095",
        city: "Hamburg",
        countryCode: "DE",
      });
      const possibleFirm = firmDirectory.create({
        origin: "firms",
        data: { name: "Muster", street: "Hauptstr. 1", zip: "20095", city: "Hamburg" },
        uses: { projectParticipant: 0, customer: 0 },
      });
      const noFirm = firmDirectory.create({
        origin: "firms",
        data: { name: "Ganz Neu", city: "Kiel" },
        uses: { projectParticipant: 0, customer: 0 },
      });
      assert.equal(bridge.prepareFirmAsCustomer({ ref: possibleFirm.ref }).duplicateState.status, DUPLICATE_STATUS.POSSIBLE_MATCH);
      assert.equal(bridge.prepareFirmAsCustomer({ ref: noFirm.ref }).duplicateState.status, DUPLICATE_STATUS.NO_MATCH);

      const linkedCustomer = customerCore.service.createCustomer({ name1: "Verknuepft", countryCode: "DE" });
      bridge.linkFirmToCustomer({ ref: noFirm.ref, customerId: linkedCustomer.customerId });
      assert.equal(bridge.prepareFirmAsCustomer({ ref: noFirm.ref }).duplicateState.status, DUPLICATE_STATUS.ALREADY_LINKED);
    })
  );

  await run("Customer Dedup 07: moegliche Dublette blockiert Neuanlage ohne ausdrueckliche Bestaetigung", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      const existing = customerCore.service.createCustomer({
        name1: "Doppelt GmbH",
        street: "Weg 4",
        postalCode: "22559",
        city: "Hamburg",
        countryCode: "DE",
      });
      const firm = firmDirectory.create({
        origin: "firms",
        data: { name: "Doppelt", street: "Weg 4", zip: "22559", city: "Hamburg" },
        uses: { projectParticipant: 0, customer: 0 },
      });
      assert.throws(
        () => bridge.createCustomerFromFirm({ ref: firm.ref }),
        (error) =>
          error.code === "CUSTOMER_DUPLICATE_REVIEW_REQUIRED" &&
          error.candidates.some((candidate) => candidate.customerId === existing.customerId)
      );
      assert.equal(customerCore.service.listCustomers().length, 1);
    })
  );

  await run("Customer Dedup 08: Benutzer darf nach Pruefung bewusst neuen Customer anlegen", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      customerCore.service.createCustomer({
        name1: "Doppelt GmbH",
        street: "Weg 4",
        postalCode: "22559",
        city: "Hamburg",
        countryCode: "DE",
      });
      const firm = firmDirectory.create({
        origin: "firms",
        data: { name: "Doppelt", street: "Weg 4", zip: "22559", city: "Hamburg" },
        uses: { projectParticipant: 0, customer: 0 },
      });
      const created = bridge.createCustomerFromFirm({
        ref: firm.ref,
        confirmCreateDespiteCandidates: true,
      });
      assert.equal(created.customer.customerNumber, "K-000002");
      assert.equal(customerCore.service.listCustomers().length, 2);
    })
  );

  await run("Customer Dedup 09: vorhandenen Kandidaten verknuepfen erzeugt keine neue Kundenidentitaet", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      const existing = customerCore.service.createCustomer({
        name1: "Bestehend GmbH",
        countryCode: "DE",
        email: "mail@example.test",
      });
      const firm = firmDirectory.create({
        origin: "firms",
        data: { name: "Bestehend", email: "mail@example.test" },
        uses: { projectParticipant: 0, customer: 0 },
      });
      const linked = bridge.linkFirmToCustomer({ ref: firm.ref, customerId: existing.customerId });
      assert.equal(linked.customer.customerId, existing.customerId);
      assert.equal(customerCore.service.listCustomers().length, 1);
    })
  );
}

module.exports = { runCustomerDedupTests };
