const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function runCustomerManagementUiTests(run) {
  await run("Customer UI 01: generische Management-IPC bietet Customer-CRUD ohne Firmenpflicht", async () => {
    const handlers = new Map();
    const ipcMain = { handle(channel, handler) { handlers.set(channel, handler); } };
    const customer = {
      customerId: "c1",
      customerNumber: "K-000001",
      name1: "Muster GmbH",
      countryCode: "DE",
      status: "ACTIVE",
      revision: 1,
    };
    const contacts = [];
    const service = {
      listCustomers: () => [customer],
      getCustomer: (id) => id === "c1" ? customer : null,
      findDuplicates: (data) => data?.name1 === "Doppelt GmbH"
        ? [{ customerId: "c9", customerNumber: "K-000009", name1: "Doppelt GmbH", score: 90 }]
        : [],
      createCustomer: (data) => ({ ...customer, ...data }),
      updateCustomer: (_id, patch, options) => ({ ...customer, ...patch, revision: options.expectedRevision + 1 }),
      archiveCustomer: () => ({ ...customer, status: "ARCHIVED" }),
      reactivateCustomer: () => customer,
      listContacts: () => contacts,
      createContact: (_id, data) => ({ id: "p1", customerId: "c1", ...data }),
      updateContact: (id, patch) => ({ id, customerId: "c1", ...patch }),
      deleteContact: () => 1,
    };
    const { registerCustomerManagementIpc } = require("../../src/main/ipc/customerManagementIpc");
    registerCustomerManagementIpc({
      ipcMain,
      customerService: service,
      runtimeContext: { mode: "MANUFACTURER", sharedManufacturerData: true },
    });

    const expected = [
      "customerMgmt:context",
      "customerMgmt:list",
      "customerMgmt:get",
      "customerMgmt:prepareCreate",
      "customerMgmt:create",
      "customerMgmt:update",
      "customerMgmt:archive",
      "customerMgmt:reactivate",
      "customerMgmt:contacts:list",
      "customerMgmt:contacts:create",
      "customerMgmt:contacts:update",
      "customerMgmt:contacts:delete",
    ];
    assert.deepEqual([...handlers.keys()].sort(), expected.sort());

    const context = await handlers.get("customerMgmt:context")(null, {});
    assert.equal(context.ok, true);
    assert.equal(context.context.mode, "MANUFACTURER");
    assert.equal(context.context.sharedManufacturerData, true);

    const list = await handlers.get("customerMgmt:list")(null, {});
    assert.equal(list.ok, true);
    assert.equal(list.list[0].customerId, "c1");

    const duplicate = await handlers.get("customerMgmt:create")(null, {
      customer: { name1: "Doppelt GmbH", countryCode: "DE" },
    });
    assert.equal(duplicate.ok, false);
    assert.equal(duplicate.code, "CUSTOMER_DUPLICATE_REVIEW_REQUIRED");
    assert.equal(duplicate.candidates.length, 1);

    const created = await handlers.get("customerMgmt:create")(null, {
      customer: { name1: "Doppelt GmbH", countryCode: "DE" },
      confirmCreateDespiteCandidates: true,
    });
    assert.equal(created.ok, true);
    assert.equal(created.customer.name1, "Doppelt GmbH");

    const updated = await handlers.get("customerMgmt:update")(null, {
      customerId: "c1",
      patch: { city: "Hamburg" },
      expectedRevision: 1,
    });
    assert.equal(updated.ok, true);
    assert.equal(updated.customer.revision, 2);

    const contact = await handlers.get("customerMgmt:contacts:create")(null, {
      customerId: "c1",
      contact: { firstName: "Anna", isPrimary: true },
    });
    assert.equal(contact.ok, true);
    assert.equal(contact.contact.firstName, "Anna");
  });

  await run("Customer UI 02: Preload exponiert Management-API getrennt von BBM-Firmen-Bridge", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/main/preload.js"), "utf8");
    assert.match(source, /customerManagementContext/);
    assert.match(source, /customerManagementList/);
    assert.match(source, /customerManagementCreate/);
    assert.match(source, /customerManagementUpdate/);
    assert.match(source, /customerManagementArchive/);
    assert.match(source, /Herstellerbestand/);
    assert.match(source, /Lokaler Kundenbestand/);
    assert.match(source, /customerManagementContactsList/);
    assert.match(source, /customerManagementContactCreate/);
  });

  await run("Customer UI 03: Rechnung oeffnet Kundenverwaltung als Unteransicht statt BBM-Modul", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/RechnungScreen.js"),
      "utf8"
    );
    assert.match(source, /CustomerManagementScreen/);
    assert.match(source, /button\("Kunden"/);
    assert.match(source, /_openCustomerManagement/);
    assert.match(source, /customerManagementScreen\.open/);

    const moduleSource = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/index.js"),
      "utf8"
    );
    assert.doesNotMatch(moduleSource, /moduleId:\s*["']kunden/);
  });

  await run("Customer UI 04: Kundenoberflaeche ist kompakt und unabhaengig von FirmDirectory", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/screens/CustomerManagementScreen.js"),
      "utf8"
    );
    assert.match(source, /customerManagementList/);
    assert.match(source, /customerManagementCreate/);
    assert.match(source, /customerManagementUpdate/);
    assert.match(source, /customerManagementArchive/);
    assert.match(source, /customerManagementContactCreate/);
    assert.match(source, /CUSTOMER_DUPLICATE_REVIEW_REQUIRED/);
    assert.doesNotMatch(source, /firmDirectory/);
    assert.doesNotMatch(source, /deleteCustomer/);

    const css = fs.readFileSync(
      path.join(process.cwd(), "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"),
      "utf8"
    );
    assert.match(css, /\.customer-admin__row/);
    assert.match(css, /min-height:\s*30px/);
    assert.match(css, /font-size:\s*12px/);
  });

  await run("Customer UI 05: Main registriert Management-IPC nur im freigegebenen Customer-Kontext", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/main/main.js"), "utf8");
    const policyIndex = source.indexOf("if (shouldExposeCustomerDirectory");
    const managementIndex = source.indexOf("registerCustomerManagementIpc();");
    assert.ok(policyIndex >= 0);
    assert.ok(managementIndex > policyIndex);
    assert.ok(managementIndex < source.indexOf("registerProjectParticipantsIpc();"));
  });
}

module.exports = { runCustomerManagementUiTests };
