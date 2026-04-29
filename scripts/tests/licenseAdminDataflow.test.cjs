const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createMemoryDb() {
  const customers = [];
  const licenses = [];
  const history = [];

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
          if (text.includes("FROM license_history")) {
            return [...history];
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
          if (text.includes("SELECT id FROM license_records WHERE customer_id = ?") && !text.includes("COUNT(*)")) {
            return licenses.filter((entry) => entry.customer_id === arg).map((entry) => ({ id: entry.id }));
          }
          if (text.includes("SELECT * FROM license_records WHERE id = ?")) {
            return licenses.find((entry) => entry.id === arg) || undefined;
          }
          if (text.includes("SELECT * FROM license_history WHERE id = ?")) {
            return history.find((entry) => entry.id === arg) || undefined;
          }
          if (text.includes("SELECT COUNT(*) AS c FROM license_history WHERE license_record_id = ?")) {
            return { c: history.filter((entry) => entry.license_record_id === arg).length };
          }
          if (text.includes("FROM license_history WHERE license_record_id IN")) {
            const licenseIds = new Set(licenses.filter((entry) => entry.customer_id === arg).map((entry) => entry.id));
            return { c: history.filter((entry) => licenseIds.has(entry.license_record_id)).length };
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
              trial_duration_days,
              license_mode,
              license_edition,
              license_binding,
              machine_id,
              setup_type,
              setup_status,
              setup_file_path,
              setup_created_at,
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
              trial_duration_days,
              license_mode,
              license_edition,
              license_binding,
              machine_id,
              setup_type,
              setup_status,
              setup_file_path,
              setup_created_at,
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
              trial_duration_days,
              license_mode,
              license_edition,
              license_binding,
              machine_id,
              setup_type,
              setup_status,
              setup_file_path,
              setup_created_at,
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
              trial_duration_days,
              license_mode,
              license_edition,
              license_binding,
              machine_id,
              setup_type,
              setup_status,
              setup_file_path,
              setup_created_at,
              license_file_path,
              license_file_created_at,
              notes,
            });
            return;
          }
          if (text.includes("DELETE FROM license_records WHERE id = ?")) {
            const [id] = args;
            const index = licenses.findIndex((entry) => entry.id === id);
            if (index >= 0) licenses.splice(index, 1);
            return;
          }
          if (text.includes("DELETE FROM license_records WHERE customer_id = ?")) {
            const [customerId] = args;
            for (let i = licenses.length - 1; i >= 0; i -= 1) {
              if (licenses[i].customer_id === customerId) licenses.splice(i, 1);
            }
            return;
          }
          if (text.includes("DELETE FROM license_customers WHERE id = ?")) {
            const [id] = args;
            const index = customers.findIndex((entry) => entry.id === id);
            if (index >= 0) customers.splice(index, 1);
            return;
          }
          if (text.includes("INSERT INTO license_history")) {
            const [id, license_record_id, generated_at, product_scope_json, valid_until, output_path, notes] = args;
            history.push({ id, license_record_id, generated_at, product_scope_json, valid_until, output_path, notes });
            return;
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



  await run("Lizenzverwaltung Main-Service: bestehender Kunde mit id wird aktualisiert statt neu angelegt", () => {
    withMockedDatabase((service) => {
      const created = service.saveCustomer({
        customer_number: "K-100A",
        company_name: "Alt GmbH",
      });

      const updated = service.saveCustomer({
        id: created.id,
        customer_number: "K-100A",
        company_name: "Neu GmbH",
      });

      const listed = service.listCustomers();
      assert.equal(updated.id, created.id);
      assert.equal(listed.length, 1);
      assert.equal(listed[0].company_name, "Neu GmbH");
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
        trial_duration_days: 30,
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
      assert.equal(listedByCustomer[0].trial_duration_days, 30);
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



  await run("Lizenzverwaltung Main-Service: bestehende Lizenz mit id wird aktualisiert statt neu angelegt", () => {
    withMockedDatabase((service) => {
      const customer = service.saveCustomer({
        customer_number: "K-101A",
        company_name: "Lizenz AG",
      });
      const created = service.saveLicense({
        customer_id: customer.id,
        product_scope_json: { standardumfang: ["app"] },
        valid_from: "2026-01-01",
        valid_until: "2026-06-30",
        trial_duration_days: 30,
      });

      const updated = service.saveLicense({
        id: created.id,
        customer_id: customer.id,
        product_scope_json: { standardumfang: ["app", "pdf"] },
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        trial_duration_days: 30,
      });

      const listed = service.listLicensesByCustomer(customer.id);
      assert.equal(updated.id, created.id);
      assert.equal(listed.length, 1);
      assert.equal(listed[0].valid_until, "2026-12-31");
      assert.equal(JSON.parse(listed[0].product_scope_json).standardumfang.length, 2);
    });
  });

  await run("Lizenzverwaltung Main-Service: deleteLicenseRecord loescht vorhandene Lizenz", () => {
    withMockedDatabase((service) => {
      const customer = service.saveCustomer({
        customer_number: "K-102",
        company_name: "Delete GmbH",
      });
      const savedLicense = service.saveLicense({
        customer_id: customer.id,
        product_scope_json: { standardumfang: ["app", "pdf", "export"] },
        valid_from: "2026-02-01",
        valid_until: "2026-12-31",
        license_mode: "full",
        license_edition: "full",
        license_binding: "machine",
        machine_id: "MID-DELETE-1",
      });

      const deleted = service.deleteLicenseRecord(savedLicense.id);
      assert.equal(deleted.ok, true);
      assert.equal(deleted.id, savedLicense.id);

      const listedByCustomer = service.listLicensesByCustomer(customer.id);
      assert.equal(listedByCustomer.length, 0);
    });
  });

  await run("Lizenzverwaltung Main-Service: deleteLicenseRecord mit fehlender ID liefert klaren Fehler", () => {
    withMockedDatabase((service) => {
      assert.throws(() => service.deleteLicenseRecord(""), /license_record_id required/);
    });
  });

  await run("Lizenzverwaltung Main-Service: deleteCustomer ohne id wirft Fehler", () => {
    withMockedDatabase((service) => {
      assert.throws(() => service.deleteCustomer(""), /customer_id required/);
    });
  });

  await run("Lizenzverwaltung Main-Service: deleteCustomer mit unbekannter id wirft Fehler", () => {
    withMockedDatabase((service) => {
      assert.throws(() => service.deleteCustomer("missing-customer"), /customer_not_found/);
    });
  });

  await run("Lizenzverwaltung Main-Service: deleteCustomer ohne Lizenzen loescht Kunden", () => {
    withMockedDatabase((service) => {
      const customer = service.saveCustomer({ customer_number: "K-200", company_name: "Delete Customer GmbH" });
      const result = service.deleteCustomer(customer.id);
      assert.equal(result.ok, true);
      assert.equal(result.deletedLicenses, 0);
      assert.equal(service.listCustomers().length, 0);
    });
  });

  await run("Lizenzverwaltung Main-Service: deleteCustomer mit Lizenzen ohne deleteLicenses wirft Fehler", () => {
    withMockedDatabase((service) => {
      const customer = service.saveCustomer({ customer_number: "K-201", company_name: "Delete Protect GmbH" });
      service.saveLicense({
        customer_id: customer.id,
        product_scope_json: { standardumfang: ["app"] },
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        license_mode: "full",
        license_edition: "full",
        license_binding: "machine",
      });
      assert.throws(() => service.deleteCustomer(customer.id), /CUSTOMER_HAS_LICENSES/);
    });
  });

  await run("Lizenzverwaltung Main-Service: deleteCustomer mit deleteLicenses und Historie wird blockiert", () => {
    withMockedDatabase((service) => {
      const customer = service.saveCustomer({ customer_number: "K-202", company_name: "Delete Cascade GmbH" });
      const license = service.saveLicense({
        customer_id: customer.id,
        product_scope_json: { standardumfang: ["app"] },
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        license_mode: "full",
        license_edition: "full",
        license_binding: "machine",
      });
      service.addHistoryEntry({
        license_record_id: license.id,
        generated_at: "2026-04-28T10:10:10.000Z",
        product_scope_json: { standardumfang: ["app"] },
        output_path: "C:\license-tool\output\history-kept.bbmlic",
      });

      assert.throws(() => service.deleteCustomer(customer.id, { deleteLicenses: true }), /CUSTOMER_HAS_LICENSE_HISTORY/);
      assert.equal(service.listCustomers().length, 1);
      assert.equal(service.listLicensesByCustomer(customer.id).length, 1);
      assert.equal(service.listHistory().length, 1);
    });
  });

  await run("Lizenzverwaltung Main-Service: deleteCustomer mit deleteLicenses loescht wenn keine Historie vorhanden", () => {
    withMockedDatabase((service) => {
      const customer = service.saveCustomer({ customer_number: "K-203", company_name: "Delete Clean GmbH" });
      service.saveLicense({
        customer_id: customer.id,
        product_scope_json: { standardumfang: ["app"] },
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        license_mode: "full",
        license_edition: "full",
        license_binding: "machine",
      });
      const result = service.deleteCustomer(customer.id, { deleteLicenses: true });
      assert.equal(result.ok, true);
      assert.equal(result.deletedLicenses, 1);
      assert.equal(service.listCustomers().length, 0);
    });
  });

  await run("Lizenzverwaltung Main-Service: deleteLicenseRecord mit Historie wird blockiert", () => {
    withMockedDatabase((service) => {
      const customer = service.saveCustomer({ customer_number: "K-102H", company_name: "Delete Hist GmbH" });
      const savedLicense = service.saveLicense({
        customer_id: customer.id,
        product_scope_json: { standardumfang: ["app"] },
        valid_from: "2026-02-01",
        valid_until: "2026-12-31",
        license_mode: "full",
        license_edition: "full",
        license_binding: "machine",
      });
      service.addHistoryEntry({
        license_record_id: savedLicense.id,
        generated_at: "2026-04-28T10:10:10.000Z",
        product_scope_json: { standardumfang: ["app"] },
      });

      assert.throws(() => service.deleteLicenseRecord(savedLicense.id), /LICENSE_RECORD_HAS_HISTORY/);
      assert.equal(service.listLicensesByCustomer(customer.id).length, 1);
      assert.equal(service.listHistory().length, 1);
    });
  });

    await run("Lizenzverwaltung Main-Service: deleteLicenseRecord laesst Kundendaten unberuehrt", () => {
    withMockedDatabase((service) => {
      const customer = service.saveCustomer({
        customer_number: "K-103",
        company_name: "History GmbH",
      });
      const savedLicense = service.saveLicense({
        customer_id: customer.id,
        product_scope_json: { standardumfang: ["app", "pdf", "export"] },
        valid_from: "2026-03-01",
        valid_until: "2026-12-31",
        license_mode: "full",
        license_edition: "full",
        license_binding: "machine",
        machine_id: "MID-DELETE-2",
      });

      service.deleteLicenseRecord(savedLicense.id);

      const customers = service.listCustomers();
      const history = service.listHistory();
      assert.equal(customers.length, 1);
      assert.equal(customers[0].id, customer.id);
      assert.equal(history.length, 0);
    });
  });


  await run("Lizenzverwaltung normalizeCustomerRecord: snake_case und camelCase werden vollstaendig abgebildet", async () => {
    const { normalizeCustomerRecord } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/licenseRecords.js")
    );

    const snake = normalizeCustomerRecord({
      id: "customer-existing-1",
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
    assert.equal(snake.id, "customer-existing-1");

    const camel = normalizeCustomerRecord({
      id: "customer-existing-2",
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
    assert.equal(camel.id, "customer-existing-2");
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
      id: "customer-1000",
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
    assert.equal(received.id, "customer-1000");
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
      id: "license-snake-1",
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
    assert.equal(received.id, "license-snake-1");
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

  await run("Lizenzverwaltung Renderer-Service: deleteCustomer nutzt Preload-API", async () => {
    const { deleteCustomer } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/licenseStorageService.js")
    );

    let receivedPayload = null;
    global.window = {
      bbmDb: {
        licenseAdminDeleteLicenseCustomer: async (payload) => {
          receivedPayload = payload;
          return { ok: true, ...payload };
        },
      },
    };

    await deleteCustomer({ id: "customer-delete-1" }, { deleteLicenses: true });
    assert.equal(receivedPayload.id, "customer-delete-1");
    assert.equal(receivedPayload.deleteLicenses, true);

    await deleteCustomer(" id ");
    assert.equal(receivedPayload.id, "id");
  });

  await run("Lizenzverwaltung Renderer-Service: deleteLicense nutzt Preload-API", async () => {
    const { deleteLicense } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/licenseStorageService.js")
    );

    let receivedId = null;
    let calls = 0;
    global.window = {
      bbmDb: {
        licenseAdminDeleteLicenseRecord: async (id) => {
          calls += 1;
          receivedId = id;
          return { ok: true, id };
        },
      },
    };

    const result = await deleteLicense({ id: "  lic-delete-1  " });
    assert.equal(calls, 1);
    assert.equal(receivedId, "lic-delete-1");
    assert.equal(result.ok, true);
  });

  await run("Lizenzverwaltung normalizeLicenseRecord: snake_case und camelCase werden vollstaendig abgebildet", async () => {
    const { normalizeLicenseRecord } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/licenseRecords.js")
    );

    const snake = normalizeLicenseRecord({
      id: "license-existing-1",
      license_id: "LIC-1",
      customer_id: "c-1",
      product_scope_json: "freitext",
      valid_from: "2026-01-01",
      valid_until: "2026-12-31",
      license_mode: "soft",
      machine_id: "MID-1",
      setup_status: "waiting_for_machine_id",
      setup_file_path: "C:\\tmp\\machine-setup.exe",
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
    assert.equal(snake.setup_status, "waiting_for_machine_id");
    assert.equal(snake.setup_file_path, "C:\\tmp\\machine-setup.exe");
    assert.equal(snake.license_file_path, "C:\\tmp\\snake.bbmlic");
    assert.equal(snake.licenseFilePath, "C:\\tmp\\snake.bbmlic");
    assert.equal(snake.license_file_created_at, "2026-04-27T11:00:00.000Z");
    assert.equal(snake.licenseFileCreatedAt, "2026-04-27T11:00:00.000Z");
    assert.equal(snake.id, "license-existing-1");
    assert.equal(snake.product_scope_json, JSON.stringify({ raw: "freitext" }));

    const camel = normalizeLicenseRecord({
      id: "license-existing-2",
      licenseId: "LIC-2",
      customerId: "c-2",
      productScope: { zusatzfunktionen: ["mail"] },
      validFrom: "2026-03-01",
      validUntil: "2026-10-31",
      licenseMode: "full",
      machineId: "MID-2",
      setupStatus: "response_license_created",
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
    assert.equal(camel.setup_status, "response_license_created");
    assert.equal(camel.license_file_path, "C:\\tmp\\camel.bbmlic");
    assert.equal(camel.licenseFilePath, "C:\\tmp\\camel.bbmlic");
    assert.equal(camel.license_file_created_at, "2026-04-27T12:00:00.000Z");
    assert.equal(camel.licenseFileCreatedAt, "2026-04-27T12:00:00.000Z");
    assert.equal(camel.id, "license-existing-2");
  });



  await run("Lizenzverwaltung Registrierung: preload und ipc fuer delete-customer vorhanden", () => {
    const preloadSource = require("node:fs").readFileSync(path.join(process.cwd(), "src/main/preload.js"), "utf8");
    const ipcSource = require("node:fs").readFileSync(path.join(process.cwd(), "src/main/ipc/licenseIpc.js"), "utf8");
    assert.equal(preloadSource.includes("licenseAdminDeleteLicenseCustomer"), true);
    assert.equal(ipcSource.includes("license-admin:delete-customer"), true);
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
    assert.equal(payload.license_edition, "full");
    assert.equal(payload.license_binding, "machine");

    const trialPayload = buildLicenseEditorPayload({
      customer: { id: "customer-55" },
      inputs: {
        license_id: "LIC-TRIAL",
        product_scope_json: "scope-text",
        valid_until: "2026-12-31",
        license_edition: "test",
        license_binding: "none",
        trial_duration_days: "60",
      },
      now: fixedLocalDate,
    });
    assert.equal(trialPayload.valid_from, "2026-04-26");
    assert.equal(trialPayload.valid_until, "");
    assert.equal(trialPayload.trial_duration_days, "60");
    assert.equal(trialPayload.license_mode, "soft");
    assert.equal(trialPayload.license_edition, "test");
    assert.equal(trialPayload.license_binding, "none");
    assert.equal(trialPayload.machine_id, "");

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

  await run("Lizenzverwaltung Mail-Parser: erkennt Felder robust und meldet fehlende Machine-ID klar", async () => {
    const { parseMachineLicenseRequestMail } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );

    const parsed = parseMachineLicenseRequestMail(
      [
        "  kunde : Musterfirma GmbH  ",
        "KUNDENNUMMER: K-123",
        " lizenz-id : LIC-123 ",
        "MACHINE-ID : MID-XYZ-1",
        "App-Version: 2.4.1",
      ].join("\r\n")
    );

    assert.equal(parsed.customerName, "Musterfirma GmbH");
    assert.equal(parsed.customerNumber, "K-123");
    assert.equal(parsed.licenseId, "LIC-123");
    assert.equal(parsed.machineId, "MID-XYZ-1");
    assert.equal(parsed.appVersion, "2.4.1");

    assert.throws(
      () =>
        parseMachineLicenseRequestMail(
          ["Kunde: Ohne Machine", "Kundennummer: K-999", "Lizenz-ID: LIC-999", "App-Version: 1.0.0"].join("\n")
        ),
      /MISSING_MACHINE_ID/
    );
  });

  await run("Lizenzverwaltung Machine-Binding-Status: Statuswerte werden korrekt formatiert", async () => {
    const { formatMachineBindingStatus } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    assert.equal(formatMachineBindingStatus({}), "Noch kein Machine-Setup erstellt");
    assert.equal(
      formatMachineBindingStatus({ setup_status: "waiting_for_machine_id" }),
      "Machine-Setup erstellt – wartet auf Machine-ID"
    );
    assert.equal(
      formatMachineBindingStatus({ setupStatus: "machine_id_received" }),
      "Machine-ID erhalten – Antwortlizenz kann erstellt werden"
    );
    assert.equal(
      formatMachineBindingStatus({ setup_status: "response_license_created" }),
      "Antwortlizenz erstellt"
    );
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
    assert.equal(payload.validUntil, "");
    assert.equal(payload.trialDurationDays, 30);
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

  await run("Lizenzverwaltung Generator-Payload: Testlizenz uebernimmt trialDurationDays", async () => {
    const { buildLicenseGeneratorPayload } = await importEsmFromFile(
      path.join(process.cwd(), "src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js")
    );
    const payload = buildLicenseGeneratorPayload({
      customer: { company_name: "Testdauer GmbH" },
      license: {
        license_id: "LIC-TRIAL-1",
        valid_from: "2026-06-01",
        trial_duration_days: "60",
        license_edition: "test",
        license_binding: "none",
        product_scope_json: JSON.stringify({ standardumfang: ["app"] }),
      },
    });
    assert.equal(payload.edition, "test");
    assert.equal(payload.binding, "none");
    assert.equal(payload.trialDurationDays, 60);
    assert.equal(payload.validUntil, "");
  });
}

module.exports = { runLicenseAdminDataflowTests };
