const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createMemoryDb() {
  const customers = [];
  const licenses = [];

  function getCustomerById(id) {
    return customers.find((entry) => entry.id === id) || null;
  }

  function enrichLicense(record) {
    const customer = getCustomerById(record.customer_id) || {};
    return {
      ...record,
      customer_number: customer.customer_number || null,
      company_name: customer.company_name || null,
      customerNumber: customer.customer_number || null,
      companyName: customer.company_name || null,
      customerDisplay: [customer.customer_number, customer.company_name].filter(Boolean).join(" | ") || record.customer_id,
    };
  }

  return {
    prepare(sql) {
      const text = String(sql || "");
      return {
        all(arg) {
          if (text.includes("FROM license_customers")) {
            return [...customers];
          }
          if (text.includes("FROM license_records") && text.includes("WHERE lr.customer_id = ?")) {
            return licenses.filter((entry) => entry.customer_id === arg).map(enrichLicense);
          }
          if (text.includes("FROM license_records")) {
            return licenses.map(enrichLicense);
          }
          return [];
        },
        get(arg) {
          if (text.includes("SELECT id FROM license_customers WHERE id = ?")) {
            const row = getCustomerById(arg);
            return row ? { id: row.id } : undefined;
          }
          if (text.includes("SELECT * FROM license_customers WHERE id = ?")) {
            return getCustomerById(arg) || undefined;
          }
          if (text.includes("SELECT id FROM license_records WHERE id = ?")) {
            const row = licenses.find((entry) => entry.id === arg);
            return row ? { id: row.id } : undefined;
          }
          if (text.includes("SELECT * FROM license_records WHERE id = ?")) {
            return licenses.find((entry) => entry.id === arg) || undefined;
          }
          return undefined;
        },
        run(...args) {
          if (text.includes("INSERT INTO license_customers")) {
            const [id, customer_number, company_name, contact_person, email, phone, notes] = args;
            customers.push({ id, customer_number, company_name, contact_person, email, phone, notes });
            return;
          }
          if (text.includes("UPDATE license_customers")) {
            const [customer_number, company_name, contact_person, email, phone, notes, _updated_at, id] = args;
            const row = getCustomerById(id);
            Object.assign(row, { customer_number, company_name, contact_person, email, phone, notes });
            return;
          }
          if (text.includes("INSERT INTO license_records")) {
            const [id, license_id, customer_id, product_scope_json, valid_from, valid_until, license_mode, machine_id, notes] =
              args;
            licenses.push({ id, license_id, customer_id, product_scope_json, valid_from, valid_until, license_mode, machine_id, notes });
            return;
          }
          if (text.includes("UPDATE license_records")) {
            const [license_id, customer_id, product_scope_json, valid_from, valid_until, license_mode, machine_id, notes, _updated_at, id] =
              args;
            const row = licenses.find((entry) => entry.id === id);
            Object.assign(row, { license_id, customer_id, product_scope_json, valid_from, valid_until, license_mode, machine_id, notes });
          }
        },
      };
    },
  };
}

function withMockedDatabase(fn) {
  const originalLoad = Module._load;
  const memoryDb = createMemoryDb();
  Module._load = function patched(request, parent, isMain) {
    if (request === "../db/database" && String(parent?.filename || "").endsWith("licenseAdminService.js")) {
      return { initDatabase: () => memoryDb };
    }
    return originalLoad.apply(this, arguments);
  };
  try {
    const servicePath = path.join(process.cwd(), "src/main/licensing/licenseAdminService.js");
    delete require.cache[require.resolve(servicePath)];
    const service = require(servicePath);
    return fn(service);
  } finally {
    Module._load = originalLoad;
  }
}

async function runLicenseAdminDataflowTests(run) {
  await run("Lizenzverwaltung Main-Service: Kunde speichern und listen", () => {
    withMockedDatabase((service) => {
      const saved = service.saveCustomer({
        customer_number: "K-100",
        company_name: "Musterbau GmbH",
        contact_person: "Max Muster",
        email: "max@example.org",
      });
      assert.equal(saved.customer_number, "K-100");

      const listed = service.listCustomers();
      assert.equal(listed.length, 1);
      assert.equal(listed[0].company_name, "Musterbau GmbH");
    });
  });

  await run("Lizenzverwaltung Main-Service: Lizenz kundenbezogen mit Pflichtfeldern speichern und listen", () => {
    withMockedDatabase((service) => {
      const customer = service.saveCustomer({
        customer_number: "K-101",
        company_name: "Beispiel AG",
        contact_person: "Erika Beispiel",
        email: "erika@example.org",
      });

      const savedLicense = service.saveLicense({
        customer_id: customer.id,
        product_scope_json: { standardumfang: ["app", "pdf", "export"] },
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        license_mode: "soft",
      });

      assert.equal(savedLicense.customer_id, customer.id);
      assert.equal(savedLicense.license_id.startsWith("LIC-"), true);
      assert.equal(typeof savedLicense.product_scope_json, "string");

      const listedByCustomer = service.listLicensesByCustomer(customer.id);
      assert.equal(listedByCustomer.length, 1);
      assert.equal(listedByCustomer[0].customer_id, customer.id);
      assert.equal(listedByCustomer[0].valid_from, "2026-01-01");
      assert.equal(listedByCustomer[0].valid_until, "2026-12-31");
      assert.equal(listedByCustomer[0].license_mode, "soft");
      assert.equal(typeof listedByCustomer[0].product_scope_json, "string");
    });
  });

  await run("Lizenzverwaltung Renderer-Service: saveLicense mit snake_case uebergibt Pflichtfelder vollstaendig", async () => {
    const { saveLicense } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/licenseStorageService.js")
    );

    let received = null;
    global.window = {
      bbmDb: {
        licenseAdminSaveLicenseRecord: async (payload) => {
          received = payload;
          return payload;
        },
      },
    };

    await saveLicense({
      license_id: "LIC-SNAKE-1",
      customer_id: "customer-snake",
      product_scope_json: "nur-text-produktscope",
      valid_from: "2026-02-01",
      valid_until: "2026-12-31",
      license_mode: "full",
      machine_id: "MACHINE-1",
    });

    assert.equal(received.license_id, "LIC-SNAKE-1");
    assert.equal(received.customer_id, "customer-snake");
    assert.equal(received.valid_from, "2026-02-01");
    assert.equal(received.valid_until, "2026-12-31");
    assert.equal(received.license_mode, "full");
    assert.equal(received.product_scope_json, JSON.stringify({ raw: "nur-text-produktscope" }));
  });

  await run("Lizenzverwaltung Renderer-Service: saveLicense mit camelCase funktioniert ebenfalls", async () => {
    const { saveLicense } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/licenseStorageService.js")
    );

    let received = null;
    global.window = {
      bbmDb: {
        licenseAdminSaveLicenseRecord: async (payload) => {
          received = payload;
          return payload;
        },
      },
    };

    await saveLicense({
      licenseId: "LIC-CAMEL-1",
      customerId: "customer-camel",
      productScope: { standardumfang: ["app"] },
      validFrom: "2026-01-01",
      validUntil: "2026-12-31",
      licenseMode: "full",
    });

    assert.equal(received.licenseId, "LIC-CAMEL-1");
    assert.equal(received.customerId, "customer-camel");
    assert.equal(received.customer_id, "customer-camel");
    assert.equal(received.validFrom, "2026-01-01");
    assert.equal(received.valid_from, "2026-01-01");
    assert.equal(received.validUntil, "2026-12-31");
    assert.equal(received.valid_until, "2026-12-31");
    assert.equal(received.licenseMode, "full");
    assert.equal(received.license_mode, "full");
  });

  await run("Lizenzverwaltung normalizeLicenseRecord: snake_case und camelCase werden vollstaendig abgebildet", async () => {
    const { normalizeLicenseRecord } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/licenseRecords.js")
    );

    const snake = normalizeLicenseRecord({
      license_id: "LIC-1",
      customer_id: "c-1",
      product_scope_json: "freitext",
      valid_from: "2026-01-01",
      valid_until: "2026-12-31",
      license_mode: "soft",
      machine_id: "MID-1",
    });
    assert.equal(snake.license_id, "LIC-1");
    assert.equal(snake.customer_id, "c-1");
    assert.equal(snake.valid_from, "2026-01-01");
    assert.equal(snake.valid_until, "2026-12-31");
    assert.equal(snake.license_mode, "soft");
    assert.equal(snake.machine_id, "MID-1");
    assert.equal(snake.product_scope_json, JSON.stringify({ raw: "freitext" }));

    const camel = normalizeLicenseRecord({
      licenseId: "LIC-2",
      customerId: "c-2",
      productScope: { zusatzfunktionen: ["mail"] },
      validFrom: "2026-03-01",
      validUntil: "2026-10-31",
      licenseMode: "full",
      machineId: "MID-2",
    });
    assert.equal(camel.license_id, "LIC-2");
    assert.equal(camel.customer_id, "c-2");
    assert.equal(camel.valid_from, "2026-03-01");
    assert.equal(camel.valid_until, "2026-10-31");
    assert.equal(camel.license_mode, "full");
    assert.equal(camel.machine_id, "MID-2");
  });


  await run("Lizenzverwaltung UI-Liste: Produktumfang aus product_scope_json raw wird lesbar", async () => {
    const { formatProductScopeForList } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const out = formatProductScopeForList({ product_scope_json: JSON.stringify({ raw: "Sonderumfang A" }) });
    assert.equal(out, "Sonderumfang A");
  });

  await run("Lizenzverwaltung UI-Liste: Produktumfang aus standardumfang/zusatzfunktionen/module wird kurz formatiert", async () => {
    const { formatProductScopeForList } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const out = formatProductScopeForList({
      product_scope_json: JSON.stringify({
        standardumfang: ["app", "pdf"],
        zusatzfunktionen: ["mail"],
        module: ["Protokoll"],
      }),
    });
    assert.equal(out, "std:app,pdf | zus:mail | mod:Protokoll");
  });

  await run("Lizenzverwaltung UI-Liste: Produktumfang ohne Daten zeigt '-'", async () => {
    const { formatProductScopeForList } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    assert.equal(formatProductScopeForList({}), "-");
  });
  await run("Lizenzverwaltung UI-Lizenz-Editor: Eingabewerte werden vollstaendig ins Save-Payload uebernommen", async () => {
    const { assertCustomerContext, createGeneratedLicenseId, buildLicenseEditorPayload } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );

    assert.equal(assertCustomerContext({ id: "customer-1" }), "customer-1");
    assert.throws(() => assertCustomerContext({}), /CUSTOMER_CONTEXT_REQUIRED/);
    assert.equal(createGeneratedLicenseId(new Date("2026-04-26T13:14:15Z")), "LIC-20260426-131415");

    const payload = buildLicenseEditorPayload({
      customer: { id: "customer-55" },
      inputs: {
        license_id: "",
        product_scope_json: "scope-text",
        valid_from: "2026-05-01",
        valid_until: "2026-12-31",
        license_mode: "full",
        machine_id: "MID-55",
        notes: "note",
      },
      now: new Date("2026-04-26T13:14:15Z"),
    });

    assert.equal(payload.customer_id, "customer-55");
    assert.equal(payload.license_id, "LIC-20260426-131415");
    assert.equal(payload.product_scope_json, "scope-text");
    assert.equal(payload.valid_from, "2026-05-01");
    assert.equal(payload.valid_until, "2026-12-31");
    assert.equal(payload.license_mode, "full");
  });
}

module.exports = { runLicenseAdminDataflowTests };
