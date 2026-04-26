const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

function loadLicenseAdminServiceWithDb(mockDbFactory) {
  const servicePath = path.join(process.cwd(), "src/main/licensing/licenseAdminService.js");
  const databasePath = path.join(process.cwd(), "src/main/db/database.js");
  const previousDatabaseModule = require.cache[databasePath];
  delete require.cache[servicePath];
  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: {
      initDatabase: mockDbFactory,
    },
  };
  const service = require(servicePath);
  if (previousDatabaseModule) require.cache[databasePath] = previousDatabaseModule;
  else delete require.cache[databasePath];
  delete require.cache[servicePath];
  return service;
}

async function runLizenzverwaltungModuleTests(run) {
  const originalWindow = global.window;
  const restoreWindow = () => {
    if (typeof originalWindow === "undefined") delete global.window;
    else global.window = originalWindow;
  };
  const [
    {
      getLizenzverwaltungModuleEntry,
      LIZENZVERWALTUNG_MODULE_ID,
      LIZENZVERWALTUNG_WORK_SCREEN_ID,
      LicenseAdminScreen,
      createCustomerEditorSection,
      createLicenseEditorSection,
      createProductScopeEditorSection,
      createLicenseRecordEditorSection,
      createLicenseHistorySection,
      CUSTOMER_RECORD_FIELDS,
      LICENSE_RECORD_FIELDS,
      LICENSE_HISTORY_FIELDS,
      LICENSE_MODES,
      createDefaultCustomerRecord,
      createDefaultLicenseRecord,
      createDefaultLicenseHistoryRecord,
      normalizeCustomerRecord,
      normalizeLicenseRecord,
      normalizeLicenseHistoryRecord,
      listCustomers,
      saveCustomer,
      listLicenses,
      saveLicense,
      listHistory,
      addHistoryEntry,
    },
    {
      getProjektverwaltungModuleEntry,
    },
    {
      PRODUCT_SCOPE,
      formatProductScopeFeatureLabel,
      normalizeProductScopeFeatureKey,
    },
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/lizenzverwaltung/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/projektverwaltung/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/lizenzverwaltung/productScope.js")),
  ]);

  const screenSource = read("src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js");
  const productScopeSource = read("src/renderer/modules/lizenzverwaltung/productScope.js");
  const licenseRecordsSource = read("src/renderer/modules/lizenzverwaltung/licenseRecords.js");
  const licenseEditorSource = read("src/renderer/modules/lizenzverwaltung/screens/createLicenseEditorSection.js");
  const customerEditorSource = read("src/renderer/modules/lizenzverwaltung/screens/createCustomerEditorSection.js");
  const licenseRecordEditorSource = read("src/renderer/modules/lizenzverwaltung/screens/createLicenseRecordEditorSection.js");
  const productScopeEditorSource = read(
    "src/renderer/modules/lizenzverwaltung/screens/createProductScopeEditorSection.js"
  );
  const licenseHistoryEditorSource = read(
    "src/renderer/modules/lizenzverwaltung/screens/createLicenseHistorySection.js"
  );
  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
  const projectWorkspaceSource = read("src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js");
  const settingsViewSource = read("src/renderer/views/SettingsView.js");
  const databaseSource = read("src/main/db/database.js");
  const licenseAdminServiceSource = read("src/main/licensing/licenseAdminService.js");
  const preloadSource = read("src/main/preload.js");
  const licenseIpcSource = read("src/main/ipc/licenseIpc.js");

  await run("Lizenzverwaltung: Modul exportiert LicenseAdminScreen", () => {
    const entry = getLizenzverwaltungModuleEntry();

    assert.equal(LIZENZVERWALTUNG_MODULE_ID, "lizenzverwaltung");
    assert.equal(LIZENZVERWALTUNG_WORK_SCREEN_ID, "licenseAdmin");
    assert.equal(typeof LicenseAdminScreen, "function");
    assert.equal(typeof createCustomerEditorSection, "function");
    assert.equal(typeof createLicenseEditorSection, "function");
    assert.equal(typeof createProductScopeEditorSection, "function");
    assert.equal(typeof createLicenseRecordEditorSection, "function");
    assert.equal(typeof createLicenseHistorySection, "function");
    assert.equal(entry.moduleId, "lizenzverwaltung");
    assert.equal(entry.workScreenId, "licenseAdmin");
    assert.equal(entry.screens?.licenseAdmin, LicenseAdminScreen);
  });


  await run("Lizenzverwaltung: Kundendatensatz zentral vorbereitet", () => {
    const customerKeys = CUSTOMER_RECORD_FIELDS.map((entry) => entry.key);
    assert.deepEqual(customerKeys, [
      "customerNumber",
      "companyName",
      "contactPerson",
      "email",
      "phone",
      "notes",
    ]);

    const customerLabels = CUSTOMER_RECORD_FIELDS.map((entry) => entry.label);
    assert.deepEqual(customerLabels, [
      "Kundennummer",
      "Firma / Kundenname",
      "Ansprechpartner",
      "E-Mail",
      "Telefon",
      "Notizen",
    ]);

    assert.equal(typeof createDefaultCustomerRecord, "function");
    assert.equal(typeof normalizeCustomerRecord, "function");
    assert.equal(licenseRecordsSource.includes("CUSTOMER_RECORD_FIELDS"), true);
  });

  await run("Lizenzverwaltung: Lizenzdatensatz zentral vorbereitet", () => {
    const licenseKeys = LICENSE_RECORD_FIELDS.map((entry) => entry.key);
    assert.deepEqual(licenseKeys, [
      "licenseId",
      "customerNumber",
      "productScope",
      "validFrom",
      "validUntil",
      "licenseMode",
      "machineId",
      "notes",
    ]);

    const licenseLabels = LICENSE_RECORD_FIELDS.map((entry) => entry.label);
    assert.deepEqual(licenseLabels, [
      "Lizenz-ID",
      "Kunde",
      "Produktumfang",
      "gueltig von",
      "gueltig bis",
      "Lizenzmodus",
      "Machine-ID",
      "Notizen",
    ]);

    assert.deepEqual(LICENSE_MODES.map((entry) => entry.label), ["Soft-Lizenz", "Vollversion"]);
    assert.equal(typeof createDefaultLicenseRecord, "function");
    assert.equal(typeof normalizeLicenseRecord, "function");
    assert.equal(licenseRecordsSource.includes("LICENSE_RECORD_FIELDS"), true);
  });

  await run("Lizenzverwaltung: Datensatz-Normalisierung bleibt minimal und robust", () => {
    const normalizedCustomer = normalizeCustomerRecord({
      customerNumber: "  K-100  ",
      companyName: "  Musterbau GmbH  ",
      email: "  info@example.org  ",
    });
    assert.equal(normalizedCustomer.customerNumber, "K-100");
    assert.equal(normalizedCustomer.companyName, "Musterbau GmbH");
    assert.equal(normalizedCustomer.email, "info@example.org");

    const normalizedLicense = normalizeLicenseRecord({
      licenseId: "  LIC-1  ",
      customerNumber: "  K-100  ",
      licenseMode: "FULL",
      productScope: { zusatzfunktionen: ["mail"] },
    });
    assert.equal(normalizedLicense.licenseId, "LIC-1");
    assert.equal(normalizedLicense.customerNumber, "K-100");
    assert.equal(normalizedLicense.licenseMode, "full");
    assert.deepEqual(normalizedLicense.productScope.zusatzfunktionen, ["mail"]);
    assert.deepEqual(normalizedLicense.productScope.standardumfang, []);
    assert.equal(normalizedLicense.valid_from, "");
    assert.equal(normalizedLicense.valid_until, "");
    assert.equal(normalizedLicense.license_mode, "full");
  });

  await run("Lizenzverwaltung: normalizeLicenseRecord behaelt productScope._display", () => {
    const normalized = normalizeLicenseRecord({
      productScope: { _display: "app,pdf,export,mail,Protokoll" },
    });
    assert.equal(normalized.productScope._display, "app,pdf,export,mail,Protokoll");
    assert.equal(normalized.product_scope_json._display, "app,pdf,export,mail,Protokoll");
  });


  await run("Lizenzverwaltung: Storage-Service wird exportiert und ist Promise-kompatibel", async () => {
    global.window = {
      bbmDb: {
        licenseAdminListLicenseCustomers: async () => [],
        licenseAdminListLicenseRecords: async () => [],
        licenseAdminListLicenseHistory: async () => [],
      },
    };
    assert.equal(typeof listCustomers, "function");
    assert.equal(typeof saveCustomer, "function");
    assert.equal(typeof listLicenses, "function");
    assert.equal(typeof saveLicense, "function");
    assert.equal(typeof listHistory, "function");
    assert.equal(typeof addHistoryEntry, "function");

    assert.equal(listCustomers.constructor.name, "AsyncFunction");
    assert.equal(saveCustomer.constructor.name, "AsyncFunction");
    assert.equal(listLicenses.constructor.name, "AsyncFunction");
    assert.equal(saveLicense.constructor.name, "AsyncFunction");
    assert.equal(listHistory.constructor.name, "AsyncFunction");
    assert.equal(addHistoryEntry.constructor.name, "AsyncFunction");

    assert.equal(typeof listCustomers().then, "function");
    assert.equal(typeof listLicenses().then, "function");
    assert.equal(typeof listHistory().then, "function");
    restoreWindow();
  });

  await run("Lizenzverwaltung: listCustomers nutzt licenseAdminListLicenseCustomers", async () => {
    let calls = 0;
    global.window = {
      bbmDb: {
        licenseAdminListLicenseCustomers: async () => {
          calls += 1;
          return [{ customerNumber: "K-200" }];
        },
      },
    };
    const customers = await listCustomers();
    assert.equal(Array.isArray(customers), true);
    assert.equal(customers.length, 1);
    assert.equal(calls, 1);
    restoreWindow();
  });

  await run("Lizenzverwaltung: saveCustomer nutzt licenseAdminSaveLicenseCustomer", async () => {
    let payload = null;
    global.window = {
      bbmDb: {
        licenseAdminSaveLicenseCustomer: async (customer) => {
          payload = customer;
          return { ...customer, id: "customer-1" };
        },
      },
    };
    const record = await saveCustomer({
      customerNumber: "  K-200  ",
      companyName: "  Beispiel GmbH  ",
      contactPerson: "  Max Mustermann  ",
      email: "  kontakt@example.org  ",
    });

    assert.equal(record.customerNumber, "K-200");
    assert.equal(record.companyName, "Beispiel GmbH");
    assert.equal(record.id, "customer-1");
    assert.equal(payload.customerNumber, "K-200");
    assert.equal(payload.companyName, "Beispiel GmbH");
    restoreWindow();
  });

  await run("Lizenzverwaltung: listLicenses nutzt licenseAdminListLicenseRecords", async () => {
    let calls = 0;
    global.window = {
      bbmDb: {
        licenseAdminListLicenseRecords: async () => {
          calls += 1;
          return [{ licenseId: "LIC-200" }];
        },
      },
    };
    const licenses = await listLicenses();
    assert.equal(Array.isArray(licenses), true);
    assert.equal(licenses.length, 1);
    assert.equal(calls, 1);
    restoreWindow();
  });

  await run("Lizenzverwaltung: saveLicense nutzt licenseAdminSaveLicenseRecord", async () => {
    let payload = null;
    global.window = {
      bbmDb: {
        licenseAdminSaveLicenseRecord: async (license) => {
          payload = license;
          return { ...license, id: "license-1" };
        },
      },
    };
    const record = await saveLicense({
      licenseId: "  LIC-200  ",
      customerId: "  customer-200  ",
      customerNumber: "  K-200  ",
      licenseMode: "FULL",
      productScope: { zusatzfunktionen: ["mail"] },
    });

    assert.equal(record.licenseId, "LIC-200");
    assert.equal(record.customerId, "customer-200");
    assert.equal(record.customer_id, "customer-200");
    assert.equal(record.licenseMode, "full");
    assert.equal(record.id, "license-1");
    assert.equal(payload.licenseId, "LIC-200");
    assert.equal(payload.customerId, "customer-200");
    assert.equal(payload.customer_id, "customer-200");
    assert.equal(typeof payload.productScope, "object");
    assert.equal(typeof payload.product_scope_json, "object");
    assert.equal(payload.product_scope_json._display, "");
    assert.equal(payload.validFrom, "");
    assert.equal(payload.valid_from, "");
    assert.equal(payload.validUntil, "");
    assert.equal(payload.valid_until, "");
    assert.equal(payload.licenseMode, "full");
    assert.equal(payload.license_mode, "full");
    restoreWindow();
  });

  await run("Lizenzverwaltung: saveLicense lehnt fehlende customerId/customer_id ab", async () => {
    global.window = {
      bbmDb: {
        licenseAdminSaveLicenseRecord: async () => {
          throw new Error("darf nicht aufgerufen werden");
        },
      },
    };
    await assert.rejects(
      () =>
        saveLicense({
          licenseId: "LIC-201",
          productScope: { standardumfang: ["app", "pdf", "export"] },
          validUntil: "2027-04-26",
          licenseMode: "soft",
        }),
      /customer_id\/customerId fehlt/
    );
    restoreWindow();
  });

  await run("Lizenzverwaltung: saveLicense-Payload behaelt UI-Produktumfang und Pflichtfelder", async () => {
    let payload = null;
    global.window = {
      bbmDb: {
        licenseAdminSaveLicenseRecord: async (license) => {
          payload = license;
          return { ...license, id: "license-2" };
        },
      },
    };
    await saveLicense({
      licenseId: "LIC-202",
      customerId: "customer-202",
      productScope: { _display: "app,pdf,export,mail,Protokoll" },
      validFrom: "2026-04-26",
      validUntil: "2027-04-26",
      licenseMode: "soft",
    });
    assert.equal(payload.productScope._display, "app,pdf,export,mail,Protokoll");
    assert.equal(payload.product_scope_json._display, "app,pdf,export,mail,Protokoll");
    assert.equal(payload.validFrom, "2026-04-26");
    assert.equal(payload.valid_from, "2026-04-26");
    assert.equal(payload.validUntil, "2027-04-26");
    assert.equal(payload.valid_until, "2027-04-26");
    assert.equal(payload.licenseMode, "soft");
    assert.equal(payload.license_mode, "soft");
    restoreWindow();
  });

  await run("Lizenzverwaltung: listHistory nutzt licenseAdminListLicenseHistory", async () => {
    let calls = 0;
    global.window = {
      bbmDb: {
        licenseAdminListLicenseHistory: async () => {
          calls += 1;
          return [{ licenseId: "LIC-200" }];
        },
      },
    };
    const history = await listHistory();
    assert.equal(Array.isArray(history), true);
    assert.equal(history.length, 1);
    assert.equal(calls, 1);
    restoreWindow();
  });

  await run("Lizenzverwaltung: addHistoryEntry nutzt licenseAdminAddLicenseHistoryEntry", async () => {
    let payload = null;
    global.window = {
      bbmDb: {
        licenseAdminAddLicenseHistoryEntry: async (entry) => {
          payload = entry;
          return { ...entry, id: "history-1" };
        },
      },
    };
    const record = await addHistoryEntry({
      createdAt: "  2026-04-26  ",
      licenseId: "  LIC-200  ",
      customer: "  Beispiel GmbH  ",
      productScope: "  app,pdf,export  ",
      validUntil: "  2027-04-26  ",
      outputPath: "  /tmp/license.json  ",
    });

    assert.equal(record.createdAt, "2026-04-26");
    assert.equal(record.licenseId, "LIC-200");
    assert.equal(record.id, "history-1");
    assert.equal(payload.createdAt, "2026-04-26");
    restoreWindow();
  });

  await run("Lizenzverwaltung: fehlende Preload-API erzeugt klare Fehlermeldung", async () => {
    delete global.window;
    await assert.rejects(
      () => listCustomers(),
      /Preload-API nicht verfügbar \(window\.bbmDb fehlt\)\. Speicherung nicht möglich\./
    );
    global.window = { bbmDb: {} };
    await assert.rejects(
      () => saveCustomer({ customerNumber: "K-1" }),
      /Preload-API-Methode fehlt \(licenseAdminSaveLicenseCustomer\)\./
    );
    restoreWindow();
  });

  await run("Lizenzverwaltung: Historien-Datensatz zentral vorbereitet", () => {
    const historyKeys = LICENSE_HISTORY_FIELDS.map((entry) => entry.key);
    assert.deepEqual(historyKeys, [
      "createdAt",
      "licenseId",
      "customer",
      "productScope",
      "validUntil",
      "outputPath",
      "notes",
    ]);
    const historyLabels = LICENSE_HISTORY_FIELDS.map((entry) => entry.label);
    assert.deepEqual(historyLabels, [
      "erzeugt am",
      "Lizenz-ID",
      "Kunde",
      "Produktumfang",
      "gueltig bis",
      "Datei / Ausgabeort",
      "Notizen",
    ]);
    assert.equal(typeof createDefaultLicenseHistoryRecord, "function");
    assert.equal(typeof normalizeLicenseHistoryRecord, "function");
    assert.equal(licenseRecordsSource.includes("LICENSE_HISTORY_FIELDS"), true);
  });
  await run("Lizenzverwaltung: Skeleton enthaelt Einstieg und Platzhalterbereiche", () => {
    assert.equal(screenSource.includes("Lizenzverwaltung"), true);
    assert.equal(screenSource.includes("Admin-/Mutter-App-Modul"), true);
    assert.equal(screenSource.includes("Umsetzung erfolgt schrittweise"), true);
    assert.equal(screenSource.includes("Lizenz erstellen / bearbeiten"), true);
    assert.equal(screenSource.includes("Kunden"), true);
    assert.equal(screenSource.includes('actionLabel: "Oeffnen"'), true);
    assert.equal(screenSource.includes("Lizenzen"), true);
    assert.equal(screenSource.includes("onOpenLicenseRecordEditor"), true);
    assert.equal(screenSource.includes("Vorbereitete Felder:"), true);
    assert.equal(screenSource.includes("CUSTOMER_RECORD_FIELDS"), true);
    assert.equal(screenSource.includes("LICENSE_RECORD_FIELDS"), true);
    assert.equal(screenSource.includes("Produktumfang"), true);
    assert.equal(screenSource.includes("Historie"), true);
  });


  await run("Kunden-UI: nutzt CUSTOMER_RECORD_FIELDS und enthaelt alle Kundenfelder", () => {
    assert.equal(customerEditorSource.includes('from "../licenseRecords.js"'), true);
    assert.equal(customerEditorSource.includes("CUSTOMER_RECORD_FIELDS"), true);
    assert.equal(customerEditorSource.includes("createDefaultCustomerRecord"), true);
    assert.equal(customerEditorSource.includes("normalizeCustomerRecord"), true);
    assert.deepEqual(CUSTOMER_RECORD_FIELDS.map((entry) => entry.label), [
      "Kundennummer",
      "Firma / Kundenname",
      "Ansprechpartner",
      "E-Mail",
      "Telefon",
      "Notizen",
    ]);
  });

  await run("Kunden-UI: bietet Neu / leeren und Pruefen", () => {
    assert.equal(customerEditorSource.includes("Neu / leeren"), true);
    assert.equal(customerEditorSource.includes("Pruefen"), true);
    assert.equal(customerEditorSource.includes("Merken"), true);
    assert.equal(customerEditorSource.includes("ohne Speicherung"), true);
    assert.equal(customerEditorSource.includes("Keine Speicherung"), true);
    assert.equal(customerEditorSource.includes("saveCustomer"), true);
    assert.equal(customerEditorSource.includes("listCustomers"), true);
    assert.equal(customerEditorSource.includes("temporaer gemerkt"), false);
    assert.equal(customerEditorSource.includes("nur In-Memory-Storage-Service"), false);
    assert.equal(customerEditorSource.includes("dauerhaft gespeichert"), true);
    assert.equal(customerEditorSource.includes("Gespeicherte Kunden"), true);
    assert.equal(customerEditorSource.includes("Noch keine gespeicherten Kunden."), true);
    assert.equal(customerEditorSource.includes("entry.customerNumber"), true);
    assert.equal(customerEditorSource.includes("entry.companyName"), true);
    assert.equal(customerEditorSource.includes("entry.email"), true);
    assert.equal(customerEditorSource.includes("refreshRememberedCustomers"), true);
    assert.equal(customerEditorSource.includes("refreshRememberedCustomers();"), true);
    assert.equal(customerEditorSource.includes("await refreshRememberedCustomers();"), true);
  });

  await run("Lizenzen-UI: nutzt LICENSE_RECORD_FIELDS und enthaelt alle Lizenzfelder", () => {
    assert.equal(licenseRecordEditorSource.includes('from "../licenseRecords.js"'), true);
    assert.equal(licenseRecordEditorSource.includes("LICENSE_RECORD_FIELDS"), true);
    assert.equal(licenseRecordEditorSource.includes("LICENSE_MODES"), true);
    assert.equal(licenseRecordEditorSource.includes("createDefaultLicenseRecord"), true);
    assert.equal(licenseRecordEditorSource.includes("normalizeLicenseRecord"), true);
    assert.deepEqual(LICENSE_RECORD_FIELDS.map((entry) => entry.label), [
      "Lizenz-ID",
      "Kunde",
      "Produktumfang",
      "gueltig von",
      "gueltig bis",
      "Lizenzmodus",
      "Machine-ID",
      "Notizen",
    ]);
  });

  await run("Lizenzen-UI: bietet Neu / leeren und Pruefen", () => {
    assert.equal(licenseRecordEditorSource.includes("Lizenzen"), true);
    assert.equal(licenseRecordEditorSource.includes("vorbereitet, mit dauerhafter Speicherung"), true);
    assert.equal(licenseRecordEditorSource.includes("Neu / leeren"), true);
    assert.equal(licenseRecordEditorSource.includes("Pruefen"), true);
    assert.equal(licenseRecordEditorSource.includes("Merken"), true);
    assert.equal(licenseRecordEditorSource.includes("Keine Speicherung"), true);
    assert.equal(licenseRecordEditorSource.includes("listCustomers"), true);
    assert.equal(licenseRecordEditorSource.includes("saveLicense"), true);
    assert.equal(licenseRecordEditorSource.includes("listLicenses"), true);
    assert.equal(licenseRecordEditorSource.includes("temporaer gemerkt"), false);
    assert.equal(licenseRecordEditorSource.includes("nur In-Memory-Storage-Service"), false);
    assert.equal(licenseRecordEditorSource.includes("dauerhaft gespeichert"), true);
    assert.equal(licenseRecordEditorSource.includes("Gespeicherte Lizenzen"), true);
    assert.equal(licenseRecordEditorSource.includes("Noch keine gespeicherten Lizenzen."), true);
    assert.equal(licenseRecordEditorSource.includes("entry.licenseId"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.customerDisplay"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.customerId"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.validUntil"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.licenseMode"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.license_id"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.customer_number"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.company_name"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.productScope ?? entry.product_scope_json"), true);
    assert.equal(licenseRecordEditorSource.includes("JSON.parse(trimmed)"), true);
    assert.equal(licenseRecordEditorSource.includes("productScopeDisplay"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.validFrom || entry.valid_from"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.valid_until"), true);
    assert.equal(licenseRecordEditorSource.includes("entry.license_mode"), true);
    assert.equal(licenseRecordEditorSource.includes("refreshRememberedLicenses"), true);
    assert.equal(licenseRecordEditorSource.includes("refreshRememberedLicenses();"), true);
    assert.equal(licenseRecordEditorSource.includes("await refreshRememberedLicenses();"), true);
    assert.equal(licenseRecordEditorSource.includes("Bitte zuerst einen Kunden anlegen."), true);
    assert.equal(licenseRecordEditorSource.includes("customer_id/customerId"), true);
    assert.equal(licenseRecordEditorSource.includes('input = document.createElement("select")'), true);
    assert.equal(licenseRecordEditorSource.includes("runValidation();"), true);
    assert.equal(licenseRecordEditorSource.includes("generateLicenseId"), true);
    assert.equal(licenseRecordEditorSource.includes("LIC-"), true);
    assert.equal(licenseRecordEditorSource.includes("model.licenseId = generateLicenseId();"), true);
    assert.equal(licenseRecordEditorSource.includes("licenseIdInput.value = model.licenseId;"), true);
  });

  await run("Lizenzen-UI: Speichern ohne Kunden ist nicht erfolgreich", () => {
    assert.equal(licenseRecordEditorSource.includes("if (!hasCustomers)"), true);
    assert.equal(licenseRecordEditorSource.includes('message.textContent = "Bitte zuerst einen Kunden anlegen."'), true);
    assert.equal(licenseRecordEditorSource.includes("if (!isValid) return;"), true);
    assert.equal(licenseRecordEditorSource.includes("const payload = normalizeLicenseRecord(model);"), true);
    assert.equal(licenseRecordEditorSource.includes("if (!customerId)"), true);
    assert.equal(
      licenseRecordEditorSource.includes("customer_id/customerId fehlt. Bitte Kunde neu auswaehlen."),
      true
    );
    assert.equal(licenseRecordEditorSource.includes("await saveLicense(payload);"), true);
    assert.equal(licenseRecordEditorSource.includes("Speichern fehlgeschlagen:"), true);
  });

  await run("Lizenzen-UI: Leere Lizenz-ID wird automatisch erzeugt und blockiert Pruefen nicht", () => {
    assert.equal(licenseRecordEditorSource.includes('if (!String(model.licenseId || "").trim())'), true);
    assert.equal(licenseRecordEditorSource.includes("model.licenseId = generateLicenseId();"), true);
    assert.equal(
      licenseRecordEditorSource.includes("Pruefung erfolgreich: Pflichtfelder sind befuellt. Keine Speicherung erfolgt."),
      true
    );
  });

  await run("Lizenzen-UI: Manuelle Lizenz-ID bleibt erhalten und wird nicht ueberschrieben", () => {
    assert.equal(licenseRecordEditorSource.includes("if (!String(model.licenseId || \"\").trim())"), true);
    assert.equal(licenseRecordEditorSource.includes("model[field.key] = String(input.value || \"\");"), true);
    assert.equal(licenseRecordEditorSource.includes("model.licenseId = generateLicenseId();"), true);
  });

  await run("Lizenzen-UI: Save vorbereitet mit customerId/customer_id", () => {
    assert.equal(licenseRecordsSource.includes("customerId"), true);
    assert.equal(licenseRecordsSource.includes("customer_id"), true);
    assert.equal(licenseRecordsSource.includes("input.customerId"), true);
    assert.equal(licenseRecordsSource.includes("input.customer_id"), true);
    assert.equal(licenseRecordsSource.includes("product_scope_json"), true);
    assert.equal(licenseRecordsSource.includes("valid_from"), true);
    assert.equal(licenseRecordsSource.includes("valid_until"), true);
    assert.equal(licenseRecordsSource.includes("license_mode"), true);
  });

  await run("Produktumfang-UI: nutzt PRODUCT_SCOPE und enthaelt Gruppen", () => {
    assert.equal(productScopeEditorSource.includes('from "../productScope.js"'), true);
    assert.equal(productScopeEditorSource.includes("PRODUCT_SCOPE.standardumfang"), true);
    assert.equal(productScopeEditorSource.includes("PRODUCT_SCOPE.zusatzfunktionen"), true);
    assert.equal(productScopeEditorSource.includes("PRODUCT_SCOPE.module"), true);
    assert.equal(PRODUCT_SCOPE.standardumfang.title, "Standardumfang");
    assert.equal(PRODUCT_SCOPE.zusatzfunktionen.title, "Zusatzfunktionen");
    assert.equal(PRODUCT_SCOPE.module.title, "Module");
  });

  await run("Produktumfang-UI: enthaelt app, pdf, export, mail, Dictate, Protokoll, Dummy", () => {
    const standardLabels = PRODUCT_SCOPE.standardumfang.entries.map((entry) => entry.label);
    const optionalLabels = PRODUCT_SCOPE.zusatzfunktionen.entries.map((entry) => entry.label);
    const moduleLabels = PRODUCT_SCOPE.module.entries.map((entry) => entry.label);
    assert.deepEqual(standardLabels, ["app", "pdf", "export"]);
    assert.deepEqual(optionalLabels, ["mail", "Dictate"]);
    assert.deepEqual(moduleLabels, ["Protokoll", "Dummy"]);
  });

  await run("Produktumfang-UI: bietet Neu / leeren und Pruefen mit lokaler Standardumfang-Pruefung", () => {
    assert.equal(productScopeEditorSource.includes("Produktumfang"), true);
    assert.equal(productScopeEditorSource.includes("vorbereitet, noch ohne Speicherung"), true);
    assert.equal(productScopeEditorSource.includes("Neu / leeren"), true);
    assert.equal(productScopeEditorSource.includes("Pruefen"), true);
    assert.equal(productScopeEditorSource.includes("Standardumfang muss app, pdf und export enthalten"), true);
    assert.equal(productScopeEditorSource.includes("Keine Speicherung"), true);
  });

  await run("Historie-UI: enthaelt vorbereitete Felder und lokale Validierung", () => {
    assert.equal(licenseHistoryEditorSource.includes("Historie"), true);
    assert.equal(licenseHistoryEditorSource.includes("vorbereitet, noch ohne Speicherung"), true);
    assert.equal(licenseHistoryEditorSource.includes("LICENSE_HISTORY_FIELDS"), true);
    assert.deepEqual(LICENSE_HISTORY_FIELDS.map((entry) => entry.label), [
      "erzeugt am",
      "Lizenz-ID",
      "Kunde",
      "Produktumfang",
      "gueltig bis",
      "Datei / Ausgabeort",
      "Notizen",
    ]);
    assert.equal(licenseHistoryEditorSource.includes("Neu / leeren"), true);
    assert.equal(licenseHistoryEditorSource.includes("Pruefen"), true);
    assert.equal(licenseHistoryEditorSource.includes("Merken"), true);
    assert.equal(licenseHistoryEditorSource.includes("Keine Speicherung"), true);
    assert.equal(licenseHistoryEditorSource.includes("addHistoryEntry"), true);
    assert.equal(licenseHistoryEditorSource.includes("listHistory"), true);
    assert.equal(licenseHistoryEditorSource.includes("temporaer gemerkt"), false);
    assert.equal(licenseHistoryEditorSource.includes("nur In-Memory-Storage-Service"), false);
    assert.equal(licenseHistoryEditorSource.includes("dauerhaft gespeichert"), true);
    assert.equal(licenseHistoryEditorSource.includes("Gespeicherte Historie"), true);
    assert.equal(licenseHistoryEditorSource.includes("Noch keine gespeicherte Historie."), true);
    assert.equal(licenseHistoryEditorSource.includes("entry.createdAt"), true);
    assert.equal(licenseHistoryEditorSource.includes("entry.licenseId"), true);
    assert.equal(licenseHistoryEditorSource.includes("entry.customer"), true);
    assert.equal(licenseHistoryEditorSource.includes("entry.validUntil"), true);
    assert.equal(licenseHistoryEditorSource.includes("refreshRememberedHistory"), true);
    assert.equal(licenseHistoryEditorSource.includes("refreshRememberedHistory();"), true);
    assert.equal(licenseHistoryEditorSource.includes("await refreshRememberedHistory();"), true);
  });

  await run("Lizenzverwaltung DB-Schema: Tabellen fuer Admin-Lizenzdaten sind vorbereitet", () => {
    assert.equal(databaseSource.includes("CREATE TABLE IF NOT EXISTS license_customers"), true);
    assert.equal(databaseSource.includes("CREATE TABLE IF NOT EXISTS license_records"), true);
    assert.equal(databaseSource.includes("CREATE TABLE IF NOT EXISTS license_history"), true);
  });

  await run("Lizenzverwaltung DB-Schema: product_scope_json ist fuer Lizenz und Historie vorhanden", () => {
    assert.equal(databaseSource.includes("license_records"), true);
    assert.equal(databaseSource.includes("product_scope_json TEXT NOT NULL"), true);
    assert.equal(databaseSource.includes("license_history"), true);
  });

  await run("Lizenzverwaltung DB-Schema: Referenzen customer_id und license_record_id sind vorbereitet", () => {
    assert.equal(databaseSource.includes("customer_id TEXT NOT NULL"), true);
    assert.equal(
      databaseSource.includes("FOREIGN KEY (customer_id) REFERENCES license_customers(id) ON DELETE RESTRICT"),
      true
    );
    assert.equal(databaseSource.includes("license_record_id TEXT NOT NULL"), true);
    assert.equal(
      databaseSource.includes(
        "FOREIGN KEY (license_record_id) REFERENCES license_records(id) ON DELETE RESTRICT"
      ),
      true
    );
  });

  await run("Lizenzverwaltung Main-Service: Datei existiert und exportiert die geplanten Funktionen", () => {
    const service = require(path.join(process.cwd(), "src/main/licensing/licenseAdminService.js"));

    assert.equal(typeof service.listCustomers, "function");
    assert.equal(typeof service.saveCustomer, "function");
    assert.equal(typeof service.listLicenses, "function");
    assert.equal(typeof service.saveLicense, "function");
    assert.equal(typeof service.listHistory, "function");
    assert.equal(typeof service.addHistoryEntry, "function");
  });

  await run("Lizenzverwaltung Main-Service: nutzt database.js und Admin-Tabellen", () => {
    assert.equal(licenseAdminServiceSource.includes('require("../db/database")'), true);
    assert.equal(licenseAdminServiceSource.includes("license_customers"), true);
    assert.equal(licenseAdminServiceSource.includes("license_records"), true);
    assert.equal(licenseAdminServiceSource.includes("license_history"), true);
  });

  await run("Lizenzverwaltung Main-Service: listLicenses liefert Kundendaten lesbar mit", () => {
    assert.equal(licenseAdminServiceSource.includes("LEFT JOIN license_customers"), true);
    assert.equal(licenseAdminServiceSource.includes("customerDisplay"), true);
    assert.equal(licenseAdminServiceSource.includes("customerNumber"), true);
    assert.equal(licenseAdminServiceSource.includes("companyName"), true);
  });

  await run("Lizenzverwaltung Main-Service: saveLicense akzeptiert customerId und customer_id", () => {
    const calls = [];
    const fakeDb = {
      prepare(sql) {
        return {
          get(...args) {
            calls.push({ type: "get", sql, args });
            if (sql.includes("SELECT id FROM license_records")) return undefined;
            if (sql.includes("SELECT * FROM license_records WHERE id = ?")) {
              return {
                id: args[0],
                license_id: "LIC-300",
                customer_id: "customer-300",
              };
            }
            return undefined;
          },
          run(...args) {
            calls.push({ type: "run", sql, args });
            return { changes: 1 };
          },
          all() {
            return [];
          },
        };
      },
    };
    const service = loadLicenseAdminServiceWithDb(() => fakeDb);

    service.saveLicense({
      licenseId: "LIC-300",
      customerId: "customer-300",
      productScope: { standardumfang: ["app", "pdf", "export"] },
      validUntil: "2027-04-26",
      licenseMode: "soft",
    });
    service.saveLicense({
      license_id: "LIC-301",
      customer_id: "customer-301",
      product_scope_json: JSON.stringify({ standardumfang: ["app", "pdf", "export"] }),
      valid_until: "2027-05-26",
      license_mode: "full",
    });

    const insertCalls = calls.filter((entry) => entry.type === "run" && entry.sql.includes("INSERT INTO license_records"));
    assert.equal(insertCalls.length, 2);
    assert.equal(insertCalls[0].args[1], "LIC-300");
    assert.equal(insertCalls[0].args[2], "customer-300");
    assert.equal(insertCalls[1].args[1], "LIC-301");
    assert.equal(insertCalls[1].args[2], "customer-301");
  });

  await run("Lizenzverwaltung Main-Service: listLicenses liefert customerDisplay", () => {
    const fakeRows = [{ license_id: "LIC-401", customerDisplay: "K-401 | Bau AG" }];
    const fakeDb = {
      prepare(sql) {
        return {
          all() {
            if (sql.includes("FROM license_records")) return fakeRows;
            return [];
          },
          get() {
            return undefined;
          },
          run() {
            return { changes: 1 };
          },
        };
      },
    };
    const service = loadLicenseAdminServiceWithDb(() => fakeDb);
    const rows = service.listLicenses();
    assert.deepEqual(rows, fakeRows);
    assert.equal(rows[0].customerDisplay, "K-401 | Bau AG");
  });

  await run("Lizenzverwaltung Main-Service: speichert product_scope_json als JSON-String", () => {
    assert.equal(licenseAdminServiceSource.includes("product_scope_json"), true);
    assert.equal(licenseAdminServiceSource.includes("JSON.stringify"), true);
    assert.equal(licenseAdminServiceSource.includes("JSON.parse"), true);
  });

  await run("Lizenzverwaltung Main-Service: meldet ungueltige customer_id nachvollziehbar", () => {
    const fakeDb = {
      prepare(sql) {
        return {
          get() {
            return undefined;
          },
          run() {
            if (sql.includes("INSERT INTO license_records")) {
              throw new Error("FOREIGN KEY constraint failed");
            }
            return { changes: 1 };
          },
          all() {
            return [];
          },
        };
      },
    };
    const service = loadLicenseAdminServiceWithDb(() => fakeDb);
    assert.throws(
      () =>
        service.saveLicense({
          licenseId: "LIC-999",
          customerId: "unknown-customer",
          productScope: {},
        }),
      /customer_id invalid: unknown-customer/
    );
  });

  await run("Lizenzverwaltung Main-Service: bleibt im Main-Prozess ohne Renderer-Import", () => {
    assert.equal(licenseAdminServiceSource.includes("../renderer"), false);
    assert.equal(licenseAdminServiceSource.includes("licenseStorageService"), false);
  });

  await run("Lizenzverwaltung: Renderer-Storage nutzt Preload-API statt In-Memory", () => {
    const storageServiceSource = read("src/renderer/modules/lizenzverwaltung/licenseStorageService.js");

    assert.equal(storageServiceSource.includes("const storage = {"), false);
    assert.equal(storageServiceSource.includes("customers: []"), false);
    assert.equal(storageServiceSource.includes("licenses: []"), false);
    assert.equal(storageServiceSource.includes("history: []"), false);
    assert.equal(storageServiceSource.includes("window.bbmDb"), true);
    assert.equal(storageServiceSource.includes("licenseAdminListLicenseCustomers"), true);
    assert.equal(storageServiceSource.includes("licenseAdminSaveLicenseCustomer"), true);
    assert.equal(storageServiceSource.includes("licenseAdminListLicenseRecords"), true);
    assert.equal(storageServiceSource.includes("licenseAdminSaveLicenseRecord"), true);
    assert.equal(storageServiceSource.includes("licenseAdminListLicenseHistory"), true);
    assert.equal(storageServiceSource.includes("licenseAdminAddLicenseHistoryEntry"), true);
    assert.equal(storageServiceSource.includes("ipcRenderer"), false);
    assert.equal(storageServiceSource.includes("window.api"), false);
  });

  await run("Lizenzverwaltung: IPC-Handler fuer Admin-Lizenzkunden sind vorbereitet", () => {
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license-admin:list-customers"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license-admin:save-customer"'), true);
  });

  await run("Lizenzverwaltung: IPC-Handler fuer Admin-Lizenzen sind vorbereitet", () => {
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license-admin:list-records"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license-admin:save-record"'), true);
  });

  await run("Lizenzverwaltung: IPC-Handler fuer Admin-Lizenzhistorie sind vorbereitet", () => {
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license-admin:list-history"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license-admin:add-history-entry"'), true);
  });

  await run("Lizenzverwaltung: licenseAdminService wird in der Lizenz-IPC genutzt", () => {
    assert.equal(licenseIpcSource.includes('require("../licensing/licenseAdminService")'), true);
    assert.equal(licenseIpcSource.includes("licenseAdminService.listCustomers"), true);
    assert.equal(licenseIpcSource.includes("licenseAdminService.saveCustomer"), true);
    assert.equal(licenseIpcSource.includes("licenseAdminService.listLicenses"), true);
    assert.equal(licenseIpcSource.includes("licenseAdminService.saveLicense"), true);
    assert.equal(licenseIpcSource.includes("licenseAdminService.listHistory"), true);
    assert.equal(licenseIpcSource.includes("licenseAdminService.addHistoryEntry"), true);
  });

  await run("Lizenzverwaltung: bestehende Lizenzdatei-/Status-IPC bleibt vorhanden", () => {
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:get-status"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:get-installed"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:import"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:delete"'), true);
  });

  await run(
    "Lizenzverwaltung: Preload-API enthaelt list/save fuer Admin-Lizenzkunden, -Lizenzen und -Historie",
    () => {
      assert.equal(preloadSource.includes("licenseAdminListLicenseCustomers"), true);
      assert.equal(preloadSource.includes("licenseAdminSaveLicenseCustomer"), true);
      assert.equal(preloadSource.includes("licenseAdminListLicenseRecords"), true);
      assert.equal(preloadSource.includes("licenseAdminSaveLicenseRecord"), true);
      assert.equal(preloadSource.includes("licenseAdminListLicenseHistory"), true);
      assert.equal(preloadSource.includes("licenseAdminAddLicenseHistoryEntry"), true);
    }
  );

  await run("Lizenzverwaltung: bleibt Adminbereich und erscheint nicht als Projektmodul", () => {
    const projektEntry = getProjektverwaltungModuleEntry();

    assert.equal(moduleCatalogSource.includes("lizenzverwaltung"), false);
    assert.equal(moduleCatalogSource.includes("LIZENZVERWALTUNG_MODULE_ID"), false);
    assert.equal(projectWorkspaceSource.includes("lizenzverwaltung"), false);
    assert.equal(projectWorkspaceSource.includes("Lizenzverwaltung"), false);
    assert.equal(projectWorkspaceSource.includes("Protokoll öffnen"), true);
    assert.equal(projektEntry.moduleId, "projektverwaltung");
    assert.equal(projektEntry.moduleLabel, "Projektverwaltung");
  });

  await run("Lizenzverwaltung: Einstellungen enthaelt den Einstieg Adminbereich auf oberster Ebene", () => {
    assert.equal(settingsViewSource.includes("../modules/lizenzverwaltung/index.js"), true);
    assert.equal(settingsViewSource.includes("tiles.append(tileUser, tilePrint, tileLicense, tileAdmin);"), true);
    assert.equal(settingsViewSource.includes("titleText: \"Adminbereich\""), true);
    assert.equal(settingsViewSource.includes("subText: \"Adminmodule und Verwaltungswerkzeuge\""), true);
  });

  await run("Lizenzverwaltung: Entwicklung enthaelt keinen sichtbaren Tab Lizenz / bearbeiten", () => {
    assert.equal(settingsViewSource.includes("makeDevTabButton(\"Lizenz / bearbeiten\", \"license\")"), false);
    assert.equal(settingsViewSource.includes("{ key: \"license\", label: \"Lizenz / bearbeiten\", el: tabLicense }"), false);
    assert.equal(settingsViewSource.includes("tabLicense.append(licenseBox, licenseGenBox);"), false);
  });

  await run("Lizenzverwaltung: Adminbereich-Popup enthaelt Kachel Lizenzverwaltung", () => {
    assert.equal(settingsViewSource.includes("title: \"Adminbereich\""), true);
    assert.equal(settingsViewSource.includes("titleText: \"Lizenzverwaltung\""), true);
    assert.equal(settingsViewSource.includes("openLicenseAdminPopup"), true);
  });

  await run("LicenseAdminScreen enthaelt Einstieg Lizenz erstellen / bearbeiten", () => {
    assert.equal(settingsViewSource.includes("new LicenseAdminScreen({"), true);
    assert.equal(settingsViewSource.includes("onOpenLicenseEditor: openLicenseEditorPopup"), true);
    assert.equal(settingsViewSource.includes("onOpenCustomerEditor: openCustomerEditorPopup"), true);
    assert.equal(settingsViewSource.includes("title: \"Lizenz erstellen / bearbeiten\""), true);
  });

  await run("LicenseAdminScreen enthaelt Einstieg fuer Produktumfang", () => {
    assert.equal(screenSource.includes("onOpenProductScopeEditor"), true);
    assert.equal(screenSource.includes("title: \"Produktumfang\""), true);
    assert.equal(screenSource.includes("hint: \"vorbereitet, noch ohne Speicherung\""), true);
    assert.equal(screenSource.includes("actionLabel: \"Oeffnen\""), true);
    assert.equal(settingsViewSource.includes("createProductScopeEditorSection"), true);
    assert.equal(settingsViewSource.includes("const openProductScopeEditorPopup = () =>"), true);
    assert.equal(settingsViewSource.includes("onOpenProductScopeEditor: openProductScopeEditorPopup"), true);
  });

  await run("LicenseAdminScreen enthaelt Einstieg fuer Historie", () => {
    assert.equal(screenSource.includes("onOpenLicenseHistory"), true);
    assert.equal(screenSource.includes("title: \"Historie\""), true);
    assert.equal(screenSource.includes("hint: \"vorbereitet, noch ohne Speicherung\""), true);
    assert.equal(settingsViewSource.includes("createLicenseHistorySection"), true);
    assert.equal(settingsViewSource.includes("const openLicenseHistoryPopup = () =>"), true);
    assert.equal(settingsViewSource.includes("onOpenLicenseHistory: openLicenseHistoryPopup"), true);
  });

  await run("Lizenz / bearbeiten: enthaelt Produktumfang statt flacher Feature-Zeile", () => {
    assert.equal(licenseEditorSource.includes("mkRow(\"Produktumfang\", productScopeWrap)"), true);
    assert.equal(licenseEditorSource.includes("mkRow(\"Features\", featureWrap)"), false);
    assert.equal(licenseEditorSource.includes("Standardumfang"), false);
    assert.equal(licenseEditorSource.includes("Zusatzfunktionen"), false);
    assert.equal(licenseEditorSource.includes("Module"), false);
  });

  await run("Lizenzverwaltung: Produktumfang zentral im Modul definiert", () => {
    assert.equal(productScopeSource.includes("export const PRODUCT_SCOPE"), true);
    assert.equal(productScopeSource.includes("standardumfang"), true);
    assert.equal(productScopeSource.includes("zusatzfunktionen"), true);
    assert.equal(productScopeSource.includes("module"), true);
  });

  await run("Lizenz / bearbeiten: Standardumfang enthaelt app/pdf/export", () => {
    const standardKeys = PRODUCT_SCOPE.standardumfang.entries.map((entry) => entry.key);
    assert.deepEqual(standardKeys, ["app", "pdf", "export"]);
    assert.equal(PRODUCT_SCOPE.standardumfang.note, "Immer enthalten, nicht abwaehlbar.");
  });

  await run("Lizenz / bearbeiten: Zusatzfunktionen enthaelt mail/Dictate (audio-kompatibel)", () => {
    const optionalKeys = PRODUCT_SCOPE.zusatzfunktionen.entries.map((entry) => entry.key);
    const optionalLabels = PRODUCT_SCOPE.zusatzfunktionen.entries.map((entry) => entry.label);
    assert.deepEqual(optionalKeys, ["mail", "audio"]);
    assert.deepEqual(optionalLabels, ["mail", "Dictate"]);
    assert.equal(formatProductScopeFeatureLabel("audio"), "Dictate");
    assert.equal(normalizeProductScopeFeatureKey("Dictate"), "audio");
  });

  await run("Lizenz / bearbeiten: zeigt nicht audio und Dictate parallel an", () => {
    assert.equal(PRODUCT_SCOPE.zusatzfunktionen.entries.filter((entry) => entry.label === "Dictate").length, 1);
    assert.equal(PRODUCT_SCOPE.zusatzfunktionen.entries.filter((entry) => entry.label === "audio").length, 0);
  });

  await run("Lizenz / bearbeiten: Module enthaelt Protokoll/Dummy als vorbereitete Eintraege", () => {
    const moduleLabels = PRODUCT_SCOPE.module.entries.map((entry) => entry.label);
    assert.deepEqual(moduleLabels, ["Protokoll", "Dummy"]);
    assert.equal(PRODUCT_SCOPE.module.note, "Vorbereitet, noch nicht aktiv angebunden.");
  });

  await run("Lizenz / bearbeiten: createLicenseEditorSection nutzt zentrale Produktumfang-Struktur", () => {
    assert.equal(licenseEditorSource.includes('from "../productScope.js"'), true);
    assert.equal(licenseEditorSource.includes("PRODUCT_SCOPE.standardumfang.entries"), true);
    assert.equal(licenseEditorSource.includes("PRODUCT_SCOPE.zusatzfunktionen.entries"), true);
    assert.equal(licenseEditorSource.includes("PRODUCT_SCOPE.module.entries"), true);
  });
}

module.exports = { runLizenzverwaltungModuleTests };
