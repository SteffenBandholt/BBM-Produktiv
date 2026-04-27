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
      licenseEdition: record.license_edition || null,
      licenseBinding: record.license_binding || null,
      licenseFilePath: record.license_file_path || null,
      licenseFileCreatedAt: record.license_file_created_at || null,
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
            const [
              id,
              license_id,
              customer_id,
              product_scope_json,
              valid_from,
              valid_until,
              license_mode,
              license_edition,
              license_binding,
              machine_id,
              license_file_path,
              license_file_created_at,
              notes,
            ] =
              args;
            licenses.push({
              id,
              license_id,
              customer_id,
              product_scope_json,
              valid_from,
              valid_until,
              license_mode,
              license_edition,
              license_binding,
              machine_id,
              license_file_path,
              license_file_created_at,
              notes,
            });
            return;
          }
          if (text.includes("UPDATE license_records")) {
            const [
              license_id,
              customer_id,
              product_scope_json,
              valid_from,
              valid_until,
              license_mode,
              license_edition,
              license_binding,
              machine_id,
              license_file_path,
              license_file_created_at,
              notes,
              _updated_at,
              id,
            ] =
              args;
            const row = licenses.find((entry) => entry.id === id);
            Object.assign(row, {
              license_id,
              customer_id,
              product_scope_json,
              valid_from,
              valid_until,
              license_mode,
              license_edition,
              license_binding,
              machine_id,
              license_file_path,
              license_file_created_at,
              notes,
            });
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
        license_file_path: "C:\\license-tool\\output\\k101.bbmlic",
        license_file_created_at: "2026-04-27T10:00:00.000Z",
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
      assert.equal(listedByCustomer[0].license_edition, "test");
      assert.equal(listedByCustomer[0].license_binding, "none");
      assert.equal(listedByCustomer[0].licenseEdition, "test");
      assert.equal(listedByCustomer[0].licenseBinding, "none");
      assert.equal(listedByCustomer[0].license_file_path, "C:\\license-tool\\output\\k101.bbmlic");
      assert.equal(listedByCustomer[0].licenseFilePath, "C:\\license-tool\\output\\k101.bbmlic");
      assert.equal(listedByCustomer[0].license_file_created_at, "2026-04-27T10:00:00.000Z");
      assert.equal(listedByCustomer[0].licenseFileCreatedAt, "2026-04-27T10:00:00.000Z");
      assert.equal(typeof listedByCustomer[0].product_scope_json, "string");
    });
  });


  await run("Lizenzverwaltung normalizeCustomerRecord: snake_case und camelCase werden vollstaendig abgebildet", async () => {
    const { normalizeCustomerRecord } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/licenseRecords.js")
    );

    const snake = normalizeCustomerRecord({
      customer_number: "K-900",
      company_name: "Bau GmbH",
      contact_person: "Max Muster",
      email: "max@bau.de",
      phone: "123",
      notes: "hinweis",
    });
    assert.equal(snake.customer_number, "K-900");
    assert.equal(snake.company_name, "Bau GmbH");
    assert.equal(snake.contact_person, "Max Muster");
    assert.equal(snake.customerNumber, "K-900");

    const camel = normalizeCustomerRecord({
      customerNumber: "K-901",
      companyName: "Plan AG",
      contactPerson: "Erika Plan",
      email: "erika@plan.de",
      phone: "555",
      notes: "ok",
    });
    assert.equal(camel.customer_number, "K-901");
    assert.equal(camel.company_name, "Plan AG");
    assert.equal(camel.contact_person, "Erika Plan");
    assert.equal(camel.customerNumber, "K-901");
  });

  await run("Lizenzverwaltung Renderer-Service: saveCustomer mit snake_case uebergibt vollstaendiges Payload", async () => {
    const { saveCustomer } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/licenseStorageService.js")
    );

    let received = null;
    global.window = {
      bbmDb: {
        licenseAdminSaveLicenseCustomer: async (payload) => {
          received = payload;
          return { ...payload, id: "customer-1" };
        },
      },
    };

    const saved = await saveCustomer({
      customer_number: "K-1000",
      company_name: "Musterbau",
      contact_person: "Anna",
      email: "anna@example.org",
      phone: "0171",
      notes: "note",
    });

    assert.equal(received.customer_number, "K-1000");
    assert.equal(received.company_name, "Musterbau");
    assert.equal(received.contact_person, "Anna");
    assert.equal(received.email, "anna@example.org");
    assert.equal(saved.id, "customer-1");
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
      licenseEdition: "full",
      licenseBinding: "machine",
      licenseFilePath: "C:\\tmp\\camel-1.bbmlic",
      licenseFileCreatedAt: "2026-04-27T12:30:00.000Z",
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
    assert.equal(received.licenseEdition, "full");
    assert.equal(received.license_edition, "full");
    assert.equal(received.licenseBinding, "machine");
    assert.equal(received.license_binding, "machine");
    assert.equal(received.licenseFilePath, "C:\\tmp\\camel-1.bbmlic");
    assert.equal(received.license_file_path, "C:\\tmp\\camel-1.bbmlic");
    assert.equal(received.licenseFileCreatedAt, "2026-04-27T12:30:00.000Z");
    assert.equal(received.license_file_created_at, "2026-04-27T12:30:00.000Z");
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
      license_file_path: "C:\\tmp\\snake.bbmlic",
      license_file_created_at: "2026-04-27T11:00:00.000Z",
    });
    assert.equal(snake.license_id, "LIC-1");
    assert.equal(snake.customer_id, "c-1");
    assert.equal(snake.valid_from, "2026-01-01");
    assert.equal(snake.valid_until, "2026-12-31");
    assert.equal(snake.license_mode, "soft");
    assert.equal(snake.license_edition, "test");
    assert.equal(snake.license_binding, "none");
    assert.equal(snake.machine_id, "MID-1");
    assert.equal(snake.license_file_path, "C:\\tmp\\snake.bbmlic");
    assert.equal(snake.licenseFilePath, "C:\\tmp\\snake.bbmlic");
    assert.equal(snake.license_file_created_at, "2026-04-27T11:00:00.000Z");
    assert.equal(snake.licenseFileCreatedAt, "2026-04-27T11:00:00.000Z");
    assert.equal(snake.product_scope_json, JSON.stringify({ raw: "freitext" }));

    const camel = normalizeLicenseRecord({
      licenseId: "LIC-2",
      customerId: "c-2",
      productScope: { zusatzfunktionen: ["mail"] },
      validFrom: "2026-03-01",
      validUntil: "2026-10-31",
      licenseMode: "full",
      machineId: "MID-2",
      licenseFilePath: "C:\\tmp\\camel.bbmlic",
      licenseFileCreatedAt: "2026-04-27T12:00:00.000Z",
    });
    assert.equal(camel.license_id, "LIC-2");
    assert.equal(camel.customer_id, "c-2");
    assert.equal(camel.valid_from, "2026-03-01");
    assert.equal(camel.valid_until, "2026-10-31");
    assert.equal(camel.license_mode, "full");
    assert.equal(camel.license_edition, "full");
    assert.equal(camel.license_binding, "machine");
    assert.equal(camel.machine_id, "MID-2");
    assert.equal(camel.license_file_path, "C:\\tmp\\camel.bbmlic");
    assert.equal(camel.licenseFilePath, "C:\\tmp\\camel.bbmlic");
    assert.equal(camel.license_file_created_at, "2026-04-27T12:00:00.000Z");
    assert.equal(camel.licenseFileCreatedAt, "2026-04-27T12:00:00.000Z");
  });


  await run("Lizenzverwaltung UI-Liste: Produktumfang aus product_scope_json raw wird lesbar", async () => {
    const { formatProductScopeForList } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const out = formatProductScopeForList({ product_scope_json: JSON.stringify({ raw: "Sonderumfang A" }) });
    assert.equal(out, "Sonderumfang A");
  });

  await run("Lizenzverwaltung UI-Liste: Produktumfang aus Struktur wird lesbar formatiert", async () => {
    const { formatProductScopeForList } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const out = formatProductScopeForList({
      product_scope_json: JSON.stringify({
        product: "bbm-produktiv",
        standardumfang: ["app", "pdf", "export"],
        zusatzfunktionen: ["mail"],
        module: ["protokoll"],
      }),
    });
    assert.equal(out, "BBM-Produktiv | App, PDF, Export | Mail | Modul: Protokoll");
  });

  await run("Lizenzverwaltung UI-Liste: Dictate wird angezeigt, auch wenn audio gespeichert ist", async () => {
    const { formatProductScopeForList } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const out = formatProductScopeForList({
      product_scope_json: JSON.stringify({
        product: "bbm-produktiv",
        standardumfang: ["app", "pdf", "export"],
        zusatzfunktionen: ["mail", "audio"],
      }),
    });
    assert.equal(out, "BBM-Produktiv | App, PDF, Export | Mail, Dictate");
  });

  await run("Lizenzverwaltung UI-Liste: Produktumfang ohne Daten zeigt '-'", async () => {
    const { formatProductScopeForList } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    assert.equal(formatProductScopeForList({}), "-");
  });

  await run("Lizenzverwaltung UI-Liste: Produktumfang mit leeren Arrays zeigt '-'", async () => {
    const { formatProductScopeForList } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    assert.equal(
      formatProductScopeForList({
        product_scope_json: JSON.stringify({ standardumfang: [], zusatzfunktionen: [], module: [] }),
      }),
      "-"
    );
  });
  await run("Lizenzverwaltung UI-Lizenz-Editor: Eingabewerte werden vollstaendig ins Save-Payload uebernommen", async () => {
    const {
      assertCustomerContext,
      createGeneratedLicenseId,
      tryGenerateLicenseId,
      buildLicenseEditorPayload,
      buildStructuredProductScopeJson,
      createDefaultScopeSelection,
      resetScopeSelectionToDefault,
      buildCustomerEditorPayload,
    } = await importEsmFromFile(path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js"));

    assert.equal(assertCustomerContext({ id: "customer-1" }), "customer-1");
    assert.throws(() => assertCustomerContext({}), /CUSTOMER_CONTEXT_REQUIRED/);
    const fixedLocalDate = new Date(2026, 3, 26, 13, 14, 15);
    assert.equal(createGeneratedLicenseId(fixedLocalDate), "LIC-20260426-131415");
    assert.equal(tryGenerateLicenseId("", fixedLocalDate).value, "LIC-20260426-131415");
    assert.equal(tryGenerateLicenseId("MANUELL-1", fixedLocalDate).generated, false);
    assert.equal(tryGenerateLicenseId("MANUELL-1", fixedLocalDate).value, "MANUELL-1");

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
      now: fixedLocalDate,
    });

    assert.equal(payload.customer_id, "customer-55");
    assert.equal(payload.license_id, "LIC-20260426-131415");
    assert.equal(payload.product_scope_json, "scope-text");
    assert.equal(payload.valid_from, "2026-05-01");
    assert.equal(payload.valid_until, "2026-12-31");
    assert.equal(payload.license_mode, "full");

    const customerPayload = buildCustomerEditorPayload({
      customer: { id: "c-44" },
      inputs: {
        customer_number: "K-44",
        company_name: "Firma 44",
        contact_person: "Kontakt 44",
        email: "44@example.org",
        phone: "444",
        notes: "n",
      },
    });
    assert.equal(customerPayload.id, "c-44");
    assert.equal(customerPayload.customer_number, "K-44");
    assert.equal(customerPayload.company_name, "Firma 44");
    assert.equal(customerPayload.contact_person, "Kontakt 44");

    const scopeSelection = createDefaultScopeSelection();
    scopeSelection.zusatzfunktionen = ["mail", "dictate"];
    scopeSelection.module = ["protokoll"];
    scopeSelection.raw = "legacy";
    scopeSelection.previous = { raw: "legacy" };
    resetScopeSelectionToDefault(scopeSelection);

    const normalizedScope = buildStructuredProductScopeJson(scopeSelection, scopeSelection.previous);
    assert.equal(normalizedScope.product, "bbm-produktiv");
    assert.deepEqual(normalizedScope.standardumfang, ["app", "pdf", "export"]);
    assert.deepEqual(normalizedScope.zusatzfunktionen, []);
    assert.deepEqual(normalizedScope.module, []);
  });

  await run("Lizenzverwaltung Generator-Payload: Kunde + Lizenz werden korrekt gemappt", async () => {
    const { buildLicenseGeneratorPayload } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const payload = buildLicenseGeneratorPayload({
      customer: { company_name: "Musterfirma GmbH", customer_number: "K-77" },
      license: {
        license_id: "LIC-77",
        valid_from: "01.05.2026",
        valid_until: "01.05.2027",
        license_edition: "test",
        license_binding: "none",
        license_mode: "soft",
        machine_id: "M-ID-77",
        product_scope_json: JSON.stringify({
          product: "bbm-produktiv",
          standardumfang: ["app", "pdf", "export"],
          zusatzfunktionen: ["mail", "audio"],
          module: ["protokoll", "dummy"],
        }),
      },
    });

    assert.equal(payload.customerName, "Musterfirma GmbH");
    assert.equal(payload.licenseId, "LIC-77");
    assert.equal(payload.validFrom, "2026-05-01");
    assert.equal(payload.validUntil, "2027-05-01");
    assert.equal(payload.binding, "none");
    assert.equal(payload.product, "bbm-protokoll");
    assert.equal(payload.edition, "test");
    assert.equal(payload.maxDevices, 1);
    assert.equal(payload.machineId, undefined);
    assert.deepEqual(payload.features, ["app", "pdf", "export", "mail", "dictate", "protokoll", "dummy"]);
  });

  await run("Lizenzverwaltung Generator-Payload: fallback customer_number und edition/binding full+machine", async () => {
    const { buildLicenseGeneratorPayload } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const payload = buildLicenseGeneratorPayload({
      customer: { customer_number: "K-88" },
      license: {
        license_id: "LIC-88",
        valid_from: "31.12.2026",
        valid_until: "2027-12-31",
        license_edition: "full",
        license_binding: "machine",
        product_scope_json: JSON.stringify({
          standardumfang: ["app"],
          zusatzfunktionen: ["mail"],
          module: ["protokoll"],
        }),
      },
    });
    assert.equal(payload.customerName, "K-88");
    assert.equal(payload.edition, "full");
    assert.equal(payload.binding, "machine");
  });

  await run("Lizenzverwaltung Generator-Payload: keine ableitbaren Features ergibt leeres Feature-Set", async () => {
    const { buildLicenseGeneratorPayload } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const payload = buildLicenseGeneratorPayload({
      customer: { company_name: "Ohne Feature GmbH" },
      license: {
        license_id: "LIC-99",
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        license_mode: "none",
        product_scope_json: JSON.stringify({ raw: "legacy-freitext" }),
      },
    });
    assert.deepEqual(payload.features, []);
  });

  await run("Lizenzverwaltung Datum: normalizeDateForGenerator unterstuetzt ISO und Deutsch", async () => {
    const { normalizeDateForGenerator } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    assert.equal(normalizeDateForGenerator("2026-05-01"), "2026-05-01");
    assert.equal(normalizeDateForGenerator("01.05.2026"), "2026-05-01");
    assert.equal(normalizeDateForGenerator("31.12.2026"), "2026-12-31");
    assert.equal(normalizeDateForGenerator("31.13.2026"), "");
  });

  await run("Lizenzverwaltung Kompatibilitaet license_mode: soft/full/none/machine", async () => {
    const { getLicenseEditionAndBinding } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    assert.deepEqual(getLicenseEditionAndBinding({ license_mode: "soft" }), { edition: "test", binding: "none" });
    assert.deepEqual(getLicenseEditionAndBinding({ license_mode: "full" }), { edition: "full", binding: "machine" });
    assert.deepEqual(getLicenseEditionAndBinding({ license_mode: "none" }), { edition: "test", binding: "none" });
    assert.deepEqual(getLicenseEditionAndBinding({ license_mode: "machine" }), { edition: "full", binding: "machine" });
  });

  await run("Lizenzverwaltung Generator-Payload: binding machine erzwingt machineId im Payload", async () => {
    const { buildLicenseGeneratorPayload } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const payload = buildLicenseGeneratorPayload({
      customer: { company_name: "Vollversion GmbH" },
      license: {
        license_id: "LIC-MACHINE-1",
        valid_from: "2026-06-01",
        valid_until: "2026-07-01",
        license_edition: "full",
        license_binding: "machine",
        machine_id: "MID-M-1",
        product_scope_json: JSON.stringify({ standardumfang: ["app"] }),
      },
    });
    assert.equal(payload.binding, "machine");
    assert.equal(payload.machineId, "MID-M-1");
  });
}

module.exports = { runLicenseAdminDataflowTests };
