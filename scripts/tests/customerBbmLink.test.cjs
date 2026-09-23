const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

async function withBridge(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-customer-link-"));
  const bbmUserData = path.join(root, "bbm");
  const customerUserData = path.join(root, "customer");
  fs.mkdirSync(bbmUserData, { recursive: true });

  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron" && String(parent?.filename || "").endsWith(path.join("db", "database.js"))) {
      return {
        app: {
          getPath: (name) => (name === "userData" ? bbmUserData : ""),
          isPackaged: true,
        },
      };
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
  const customerCorePath = path.join(process.cwd(), "src/customer-core");
  let customerCore = null;
  let database = null;

  try {
    for (const modulePath of Object.values(paths)) {
      delete require.cache[require.resolve(modulePath)];
    }

    database = require(paths.db);
    // Repositories must be required only after the fresh database module so their
    // initDatabase closure points at this test's temporary BBM database.
    require(paths.firmsRepo);
    require(paths.projectFirmsRepo);
    require(paths.firmUsagesRepo);

    const { FirmDirectoryService } = require(paths.firmDirectory);
    const { CustomerFirmBridgeService } = require(paths.bridge);
    const { createCustomerCore } = require(customerCorePath);

    const bbmDb = database.initDatabase();
    customerCore = createCustomerCore({ userDataPath: customerUserData });
    const firmDirectory = new FirmDirectoryService({ dbProvider: () => bbmDb });
    const bridge = new CustomerFirmBridgeService({ firmDirectory, customerCore });

    return await fn({
      database,
      bbmDb,
      customerCore,
      firmDirectory,
      bridge,
      bbmUserData,
      customerUserData,
    });
  } finally {
    try {
      customerCore?.close();
    } catch (_) {}
    try {
      database?.closeDatabase();
    } catch (_) {}
    for (const modulePath of Object.values(paths)) {
      try {
        delete require.cache[require.resolve(modulePath)];
      } catch (_) {}
    }
    Module._load = originalLoad;
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runCustomerBbmLinkTests(run) {
  await run("Customer Link 01: BBM- und Customer-Datenbanken bleiben physisch getrennt", () =>
    withBridge(({ customerCore, bbmUserData, customerUserData }) => {
      assert.equal(customerCore.databasePath, path.join(customerUserData, "customers.db"));
      assert.notEqual(customerCore.databasePath, path.join(bbmUserData, "app.db"));
      customerCore.close();
    })
  );

  await run("Customer Link 02: Firma wird bewusst als Customer uebernommen und verknuepft", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      const firm = firmDirectory.create({
        origin: "firms",
        data: {
          name: "Augustin BauPM GmbH",
          name2: "Bauprojektmanagement",
          street: "Musterweg 1",
          zip: "20095",
          city: "Hamburg",
          email: "info@example.test",
          phone: "040 123",
        },
        uses: { projectParticipant: 0, customer: 0 },
      });

      const prepared = bridge.prepareFirmAsCustomer({ ref: firm.ref });
      assert.equal(prepared.link, null);
      assert.equal(prepared.proposed.name1, "Augustin BauPM GmbH");
      assert.equal(prepared.proposed.postalCode, "20095");
      assert.equal(prepared.proposed.sourceCode, "BBM");

      const result = bridge.createCustomerFromFirm({ ref: firm.ref });
      assert.equal(result.customer.customerNumber, "K-000001");
      assert.equal(result.customer.sourceCode, "BBM");
      assert.equal(result.link.systemCode, "BBM");
      assert.equal(result.link.entityType, "global_firm");
      assert.equal(result.link.entityId, firm.id);

      const linked = bridge.getLinkedCustomer(firm.ref);
      assert.equal(linked.customer.customerId, result.customer.customerId);
      assert.equal(linked.link.customerId, result.customer.customerId);

      const firmAfter = firmDirectory.get(firm.ref);
      assert.deepEqual(firmAfter.uses, { projectParticipant: 0, customer: 0 });
      customerCore.close();
    })
  );

  await run("Customer Link 03: bestehender Customer kann bewusst mit weiterer BBM-Firma verknuepft werden", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      const customer = customerCore.service.createCustomer({
        name1: "Zentraler Kunde",
        countryCode: "DE",
      });
      const first = firmDirectory.create({
        origin: "firms",
        data: { name: "Firma A" },
        uses: { projectParticipant: 0, customer: 0 },
      });
      const second = firmDirectory.create({
        origin: "firms",
        data: { name: "Firma B" },
        uses: { projectParticipant: 0, customer: 0 },
      });

      bridge.linkFirmToCustomer({ ref: first.ref, customerId: customer.customerId });
      bridge.linkFirmToCustomer({ ref: second.ref, customerId: customer.customerId });

      assert.equal(customerCore.service.listLinks(customer.customerId).length, 2);
      assert.equal(bridge.getLinkedCustomer(first.ref).customer.customerId, customer.customerId);
      assert.equal(bridge.getLinkedCustomer(second.ref).customer.customerId, customer.customerId);
      customerCore.close();
    })
  );

  await run("Customer Link 04: eine BBM-Firma kann nicht zwei Customers zugeordnet werden", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      const a = customerCore.service.createCustomer({ name1: "A", countryCode: "DE" });
      const b = customerCore.service.createCustomer({ name1: "B", countryCode: "DE" });
      const firm = firmDirectory.create({
        origin: "firms",
        data: { name: "Firma" },
        uses: { projectParticipant: 0, customer: 0 },
      });

      bridge.linkFirmToCustomer({ ref: firm.ref, customerId: a.customerId });
      assert.throws(
        () => bridge.linkFirmToCustomer({ ref: firm.ref, customerId: b.customerId }),
        (error) => error.code === "CUSTOMER_LINK_CONFLICT"
      );
      customerCore.close();
    })
  );

  await run("Customer Link 05: Firmendaten synchronisieren sich niemals automatisch", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      const firm = firmDirectory.create({
        origin: "firms",
        data: { name: "Altname", phone: "111", city: "Hamburg" },
        uses: { projectParticipant: 0, customer: 0 },
      });
      const created = bridge.createCustomerFromFirm({ ref: firm.ref });
      firmDirectory.update({ ref: firm.ref, patch: { name: "Neuer Firmenname", phone: "222", city: "Berlin" } });

      const unchanged = customerCore.service.getCustomer(created.customer.customerId);
      assert.equal(unchanged.name1, "Altname");
      assert.equal(unchanged.phone, "111");
      assert.equal(unchanged.city, "Hamburg");

      const comparison = bridge.compareFirmAndCustomer({ ref: firm.ref });
      assert.equal(comparison.hasDifferences, true);
      assert.ok(comparison.fields.find((entry) => entry.field === "name1" && entry.equal === false));
      assert.ok(comparison.fields.find((entry) => entry.field === "phone" && entry.equal === false));
      customerCore.close();
    })
  );

  await run("Customer Link 06: einzelne Felder werden nur nach ausdruecklicher Auswahl uebernommen", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      const firm = firmDirectory.create({
        origin: "firms",
        data: { name: "Firma", phone: "111", city: "Hamburg" },
        uses: { projectParticipant: 0, customer: 0 },
      });
      const created = bridge.createCustomerFromFirm({ ref: firm.ref });
      firmDirectory.update({ ref: firm.ref, patch: { phone: "222", city: "Berlin" } });

      const before = customerCore.service.getCustomer(created.customer.customerId);
      const changed = bridge.applyFirmFieldsToCustomer({
        ref: firm.ref,
        customerId: before.customerId,
        fields: ["phone"],
        expectedRevision: before.revision,
      });

      assert.equal(changed.phone, "222");
      assert.equal(changed.city, "Hamburg");
      assert.equal(changed.revision, before.revision + 1);
      customerCore.close();
    })
  );

  await run("Customer Link 07: Customer kann bewusst als neutrale globale BBM-Firma angelegt werden", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      const customer = customerCore.service.createCustomer({
        name1: "Nur Kunde GmbH",
        name2: "Zentrale",
        street: "Kundenweg 5",
        postalCode: "22559",
        city: "Hamburg",
        countryCode: "DE",
        email: "kunde@example.test",
      });

      const result = bridge.createGlobalFirmFromCustomer({ customerId: customer.customerId });
      assert.equal(result.firm.kind, "global_firm");
      assert.equal(result.firm.name, "Nur Kunde GmbH");
      assert.equal(result.firm.zip, "22559");
      assert.deepEqual(result.firm.uses, { projectParticipant: 0, customer: 0 });
      assert.equal(bridge.getLinkedCustomer(result.firm.ref).customer.customerId, customer.customerId);

      const reread = firmDirectory.get(result.firm.ref);
      assert.deepEqual(reread.uses, { projectParticipant: 0, customer: 0 });
      customerCore.close();
    })
  );

  await run("Customer Link 08: archivierter Customer kann nicht neu mit BBM verknuepft werden", () =>
    withBridge(({ customerCore, firmDirectory, bridge }) => {
      const customer = customerCore.service.createCustomer({ name1: "Archiv", countryCode: "DE" });
      customerCore.service.archiveCustomer(customer.customerId);
      const firm = firmDirectory.create({
        origin: "firms",
        data: { name: "Firma" },
        uses: { projectParticipant: 0, customer: 0 },
      });

      assert.throws(
        () => bridge.linkFirmToCustomer({ ref: firm.ref, customerId: customer.customerId }),
        (error) => error.code === "CUSTOMER_ARCHIVED"
      );
      assert.throws(
        () => bridge.createGlobalFirmFromCustomer({ customerId: customer.customerId }),
        (error) => error.code === "CUSTOMER_ARCHIVED"
      );
      customerCore.close();
    })
  );

  await run("Customer Link 09: Projektfirma kann typisiert verknuepft werden", () =>
    withBridge(({ customerCore, bbmDb, firmDirectory, bridge }) => {
      bbmDb.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p1", "Projekt");
      const projectFirm = firmDirectory.create({
        origin: "project_firms",
        projectId: "p1",
        data: { name: "Lokale Firma" },
        uses: { projectParticipant: 1, customer: 0 },
      });
      const customer = customerCore.service.createCustomer({ name1: "Kunde", countryCode: "DE" });

      const linked = bridge.linkFirmToCustomer({ ref: projectFirm.ref, customerId: customer.customerId });
      assert.equal(linked.link.entityType, "project_firm");
      assert.equal(linked.link.entityId, projectFirm.id);
      assert.equal(bridge.getLinkedCustomer(projectFirm.ref).customer.customerId, customer.customerId);
      customerCore.close();
    })
  );

  await run("Customer Link 10: IPC-Vertrag exponiert nur kontrollierte Customer-Aktionen", () => {
    const originalLoad = Module._load;
    const handlers = new Map();
    const ipcMain = {
      handle(channel, handler) {
        handlers.set(channel, handler);
      },
    };
    Module._load = function patched(request, parent, isMain) {
      if (request === "electron") return { ipcMain };
      return originalLoad.apply(this, arguments);
    };
    const ipcPath = path.join(process.cwd(), "src/main/ipc/customerDirectoryIpc.js");
    try {
      delete require.cache[require.resolve(ipcPath)];
      const { registerCustomerDirectoryIpc } = require(ipcPath);
      const service = {
        listCustomers: () => [],
        getCustomer: () => ({ customerId: "c1" }),
        prepareFirmAsCustomer: () => ({}),
        createCustomerFromFirm: () => ({}),
        linkFirmToCustomer: () => ({}),
        compareFirmAndCustomer: () => ({}),
        applyFirmFieldsToCustomer: () => ({}),
        createGlobalFirmFromCustomer: () => ({}),
      };
      registerCustomerDirectoryIpc({ ipcMain, service });
      assert.deepEqual(
        [...handlers.keys()].sort(),
        [
          "customer:createGlobalFirm",
          "customer:firm:applyToCustomer",
          "customer:firm:compare",
          "customer:firm:create",
          "customer:firm:link",
          "customer:firm:prepare",
          "customer:get",
          "customer:list",
        ].sort()
      );
    } finally {
      Module._load = originalLoad;
      delete require.cache[require.resolve(ipcPath)];
    }
  });

  await run("Customer Link 11: Main und Preload registrieren die neue Bridge ohne Lizenztool/PDFtoGAEB", () => {
    const mainSource = fs.readFileSync(path.join(process.cwd(), "src/main/main.js"), "utf8");
    const preloadSource = fs.readFileSync(path.join(process.cwd(), "src/main/preload.js"), "utf8");
    assert.match(mainSource, /registerCustomerDirectoryIpc/);
    assert.match(preloadSource, /customerFirmCreate/);
    assert.match(preloadSource, /customerFirmLink/);
    assert.match(preloadSource, /customerFirmCompare/);
    assert.doesNotMatch(
      fs.readFileSync(path.join(process.cwd(), "src/main/domain/customers/CustomerFirmBridgeService.js"), "utf8"),
      /license-tool|PDFtoGAEB|invoice_customer/
    );
  });
}

module.exports = { runCustomerBbmLinkTests };
