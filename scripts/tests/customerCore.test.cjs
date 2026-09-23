const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const corePath = path.resolve(process.cwd(), "src/customer-core");

function withCore(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-customer-core-"));
  const userDataPath = path.join(root, "userData");
  const { createCustomerCore } = require(corePath);
  const core = createCustomerCore({ userDataPath });
  try {
    return fn({ ...core, userDataPath, root });
  } finally {
    core.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runCustomerCoreTests(run) {
  await run("Customer Core 01: standalone DB und Schema werden ausserhalb BBM app.db erzeugt", () =>
    withCore(({ db, databasePath, userDataPath }) => {
      assert.equal(databasePath, path.join(userDataPath, "customers.db"));
      assert.equal(fs.existsSync(databasePath), true);
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((row) => row.name);
      for (const name of ["customers", "customer_contacts", "customer_links", "customer_meta", "customer_number_sequence"]) {
        assert.ok(tables.includes(name), name);
      }
      assert.equal(db.prepare("SELECT value FROM customer_meta WHERE key='schema_version'").get().value, "1");
    })
  );

  await run("Customer Core 02: Kundennummern sind eindeutig, stabil und fortlaufend", () =>
    withCore(({ service }) => {
      const a = service.createCustomer({ name1: "Alpha GmbH", countryCode: "DE" });
      const b = service.createCustomer({ name1: "Beta GmbH", countryCode: "DE" });
      assert.equal(a.customerNumber, "K-000001");
      assert.equal(b.customerNumber, "K-000002");
      assert.notEqual(a.customerId, b.customerId);
      const archived = service.archiveCustomer(a.customerId);
      assert.equal(archived.customerNumber, "K-000001");
      assert.equal(archived.status, "ARCHIVED");
      const active = service.reactivateCustomer(a.customerId);
      assert.equal(active.customerNumber, "K-000001");
      assert.equal(active.status, "ACTIVE");
    })
  );

  await run("Customer Core 03: Pflichtfelder, SourceCode und ISO-Land werden validiert", () =>
    withCore(({ service }) => {
      assert.throws(() => service.createCustomer({ countryCode: "DE" }), /name1 required/);
      assert.throws(() => service.createCustomer({ name1: "X", countryCode: "Deutschland" }), /ISO-2/);
      assert.throws(() => service.createCustomer({ name1: "X" }), /countryCode required/);\n      assert.throws(() => service.createCustomer({ name1: "X", countryCode: "DE", sourceCode: "AUTO" }), /invalid sourceCode/);
      const row = service.createCustomer({ name1: "Import", sourceCode: "IMPORT", countryCode: "de" });
      assert.equal(row.sourceCode, "IMPORT");
      assert.equal(row.countryCode, "DE");
    })
  );

  await run("Customer Core 04: Updates nutzen optimistic revision locking", () =>
    withCore(({ service }) => {
      const customer = service.createCustomer({ name1: "Alt", countryCode: "DE" });
      const changed = service.updateCustomer(
        customer.customerId,
        { name1: "Neu", phone: " 040 123 " },
        { expectedRevision: customer.revision }
      );
      assert.equal(changed.name1, "Neu");
      assert.equal(changed.phone, "040 123");
      assert.equal(changed.revision, 2);
      assert.throws(
        () => service.updateCustomer(customer.customerId, { city: "Hamburg" }, { expectedRevision: 1 }),
        (error) => error.code === "CUSTOMER_REVISION_CONFLICT"
      );
    })
  );

  await run("Customer Core 05: Rechnungsprofil faellt auf Hauptanschrift zurueck", () =>
    withCore(({ service }) => {
      const base = service.createCustomer({
        name1: "Muster GmbH",
        street: "Hauptstrasse 1",
        postalCode: "20095",
        city: "Hamburg",
        countryCode: "DE",
        email: "info@example.test",
        vatId: "DE123456789",
      });
      const fallback = service.resolveBillingProfile(base.customerId);
      assert.deepEqual(
        [fallback.name1, fallback.street, fallback.postalCode, fallback.city, fallback.email],
        ["Muster GmbH", "Hauptstrasse 1", "20095", "Hamburg", "info@example.test"]
      );

      const updated = service.updateCustomer(base.customerId, {
        billingName1: "Muster Abrechnung GmbH",
        billingStreet: "Rechnung 2",
        billingPostalCode: "22041",
        billingCity: "Hamburg",
        billingCountryCode: "DE",
        billingEmail: "rechnung@example.test",
      });
      const billing = service.resolveBillingProfile(updated.customerId);
      assert.deepEqual(
        [billing.name1, billing.street, billing.postalCode, billing.city, billing.email],
        ["Muster Abrechnung GmbH", "Rechnung 2", "22041", "Hamburg", "rechnung@example.test"]
      );
    })
  );

  await run("Customer Core 06: mehrere Kontakte, aber nur ein aktiver Hauptkontakt", () =>
    withCore(({ service }) => {
      const customer = service.createCustomer({ name1: "Kontakte GmbH", countryCode: "DE" });
      const primary = service.createContact(customer.customerId, {
        firstName: "Anna",
        lastName: "A",
        isPrimary: true,
        isBillingContact: true,
      });
      service.createContact(customer.customerId, {
        firstName: "Bernd",
        lastName: "B",
        isLicenseContact: true,
      });
      assert.equal(service.listContacts(customer.customerId).length, 2);
      assert.throws(
        () => service.createContact(customer.customerId, { firstName: "Clara", isPrimary: true }),
        (error) => error.code === "CUSTOMER_PRIMARY_CONTACT_EXISTS"
      );
      service.updateContact(primary.id, { isActive: false });
      const next = service.createContact(customer.customerId, { firstName: "Clara", isPrimary: true });
      assert.equal(next.isPrimary, true);
      assert.equal(service.listContacts(customer.customerId).filter((entry) => entry.isPrimary).length, 1);
    })
  );

  await run("Customer Core 07: externe Entitaet kann nur einem Customer zugeordnet werden", () =>
    withCore(({ service }) => {
      const a = service.createCustomer({ name1: "A", countryCode: "DE" });
      const b = service.createCustomer({ name1: "B", countryCode: "DE" });
      const link = service.createLink(a.customerId, {
        systemCode: "BBM",
        entityType: "global_firm",
        entityId: "firm-1",
      });
      assert.equal(link.customerId, a.customerId);
      assert.throws(
        () => service.createLink(b.customerId, {
          systemCode: "BBM",
          entityType: "global_firm",
          entityId: "firm-1",
        }),
        (error) => error.code === "CUSTOMER_LINK_CONFLICT"
      );
      service.createLink(a.customerId, {
        systemCode: "BBM",
        entityType: "global_firm",
        entityId: "firm-2",
      });
      assert.equal(service.listLinks(a.customerId).length, 2);
    })
  );

  await run("Customer Core 08: Archivkunden verschwinden aus aktiver Standardliste", () =>
    withCore(({ service }) => {
      const a = service.createCustomer({ name1: "Aktiv", countryCode: "DE" });
      const b = service.createCustomer({ name1: "Archiv", countryCode: "DE" });
      service.archiveCustomer(b.customerId);
      assert.deepEqual(service.listCustomers().map((entry) => entry.customerId), [a.customerId]);
      assert.equal(service.listCustomers({ includeArchived: true }).length, 2);
      assert.equal(service.listCustomers({ includeArchived: true, search: "K-000002" })[0].customerId, b.customerId);
    })
  );

  await run("Customer Core 09: physisches Loeschen wird bei Links oder externen Referenzen blockiert", () =>
    withCore(({ service }) => {
      const linked = service.createCustomer({ name1: "Linked", countryCode: "DE" });
      service.createLink(linked.customerId, { systemCode: "BBM", entityType: "global_firm", entityId: "g1" });
      assert.deepEqual(service.deleteCustomerIfUnused(linked.customerId), { deleted: 0, reason: "linked" });

      const referenced = service.createCustomer({ name1: "Referenced", countryCode: "DE" });
      assert.deepEqual(
        service.deleteCustomerIfUnused(referenced.customerId, { externalReferenceCount: 1 }),
        { deleted: 0, reason: "external_references" }
      );

      const free = service.createCustomer({ name1: "Free", countryCode: "DE" });
      assert.deepEqual(service.deleteCustomerIfUnused(free.customerId), { deleted: 1, reason: null });
      assert.equal(service.getCustomer(free.customerId), null);
    })
  );

  await run("Customer Core 10: Kundennummer wird nach physischem Loeschen nicht wiederverwendet", () =>
    withCore(({ service }) => {
      const first = service.createCustomer({ name1: "Erster", countryCode: "DE" });
      assert.equal(first.customerNumber, "K-000001");
      assert.equal(service.deleteCustomerIfUnused(first.customerId).deleted, 1);
      const second = service.createCustomer({ name1: "Zweiter", countryCode: "DE" });
      assert.equal(second.customerNumber, "K-000002");
    })
  );

  await run("Customer Core 11: bestehende Datenbank laesst sich ohne Datenverlust wieder oeffnen", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-customer-reopen-"));
    const userDataPath = path.join(root, "userData");
    const { createCustomerCore } = require(corePath);
    let core = createCustomerCore({ userDataPath });
    const created = core.service.createCustomer({ name1: "Persistiert GmbH", countryCode: "DE" });
    core.close();

    core = createCustomerCore({ userDataPath, backupOnOpen: true });
    try {
      assert.equal(core.service.getCustomer(created.customerId).name1, "Persistiert GmbH");
      assert.equal(fs.existsSync(path.join(userDataPath, "customers.db.bak")), true);
    } finally {
      core.close();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  await run("Customer Core 12: Kern importiert keine BBM-Firmen-, Projekt- oder Rechnungslogik", () => {
    const files = fs.readdirSync(corePath).filter((name) => name.endsWith(".js"));
    for (const file of files) {
      const source = fs.readFileSync(path.join(corePath, file), "utf8");
      assert.doesNotMatch(source, /src\/main|firmsRepo|projectFirms|FirmDirectory|rechnungen|invoice_customer/);
      assert.doesNotMatch(source, /require\(["']electron["']\)/);
    }
  });
}

module.exports = { runCustomerCoreTests };
