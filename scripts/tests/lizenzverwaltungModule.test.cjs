const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
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
      createCustomerSetup,
      buildCustomerSetupPayload,
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
    assert.equal(typeof LicenseAdminScreen, "function");
    assert.equal(entry.moduleId, "lizenzverwaltung");
    assert.equal(entry.workScreenId, "licenseAdmin");
    assert.equal(entry.screens?.licenseAdmin, LicenseAdminScreen);
  });

  await run("Lizenzverwaltung UI: Lizenzanforderung-Import im Lizenzformular vorhanden", () => {
    assert.equal(screenSource.includes("Lizenzanforderung importieren"), true);
    assert.equal(screenSource.includes("Lizenzanforderung aus E-Mail übernehmen"), true);
    assert.equal(screenSource.includes("Mailtext einfügen"), true);
    assert.equal(screenSource.includes("Lizenzanforderung erkannt."), true);
    assert.equal(screenSource.includes("Keine Machine-ID im Mailtext gefunden."), true);
    assert.equal(screenSource.includes("setup_status: \"machine_id_received\""), true);
    assert.equal(screenSource.includes("setup_status: \"waiting_for_machine_id\""), true);
    assert.equal(screenSource.includes("setup_status: isMachineResponseLicense ? \"response_license_created\""), true);
    assert.equal(screenSource.includes("Machine-Binding-Status:"), true);
    assert.equal(screenSource.includes("parseMachineLicenseRequestMail"), true);
    assert.equal(screenSource.includes("licenseAdminImportLicenseRequest"), true);
    assert.equal(screenSource.includes("inputs.license_binding.value = \"machine\""), true);
    assert.equal(screenSource.includes("inputs.license_edition.value = \"full\""), true);
    assert.equal(screenSource.includes("inputs.machine_id.value = String(request.machineId || \"\").trim()"), true);
  });


  await run("Lizenzverwaltung Modulindex: kein Pflicht-Export createLicenseEditorSection fuer Admin", () => {
    assert.equal("createLicenseEditorSection" in { getLizenzverwaltungModuleEntry }, false);
    assert.equal(read("src/renderer/modules/lizenzverwaltung/index.js").includes("createLicenseEditorSection"), false);
    assert.equal(read("src/renderer/modules/lizenzverwaltung/screens/index.js").includes("createLicenseEditorSection"), false);
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
      "trialDurationDays",
      "licenseEdition",
      "licenseBinding",
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
      "Testdauer (Tage)",
      "Lizenzart",
      "Gerätebindung",
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
    assert.equal(normalizedLicense.licenseEdition, "full");
    assert.equal(normalizedLicense.licenseBinding, "machine");
    assert.deepEqual(normalizedLicense.productScope.zusatzfunktionen, ["mail"]);
    assert.deepEqual(normalizedLicense.productScope.standardumfang, []);
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
    assert.equal(typeof createCustomerSetup, "function");

    assert.equal(listCustomers.constructor.name, "AsyncFunction");
    assert.equal(saveCustomer.constructor.name, "AsyncFunction");
    assert.equal(listLicenses.constructor.name, "AsyncFunction");
    assert.equal(saveLicense.constructor.name, "AsyncFunction");
    assert.equal(listHistory.constructor.name, "AsyncFunction");
    assert.equal(addHistoryEntry.constructor.name, "AsyncFunction");
    assert.equal(createCustomerSetup.constructor.name, "AsyncFunction");

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

  await run("Lizenzverwaltung: Build-Mapping fuer Kunden-Setup Payload", () => {
    const testPayload = buildCustomerSetupPayload({
      customer: { customer_number: "K-100", company_name: "Musterfirma GmbH" },
      license: { license_file_path: "C:\\tmp\\customer.bbmlic", license_id: "LIC-100" },
    });
    assert.equal(testPayload.customer.customer_number, "K-100");
    assert.equal(testPayload.license.license_file_path, "C:\\tmp\\customer.bbmlic");
    assert.equal(testPayload.licenseFilePath, "C:\\tmp\\customer.bbmlic");
    assert.equal(testPayload.setupType, "test");
    assert.equal(testPayload.customerName, "Musterfirma GmbH");
    assert.equal(testPayload.customerNumber, "K-100");
    assert.equal(testPayload.licenseId, "LIC-100");

    const machinePayload = buildCustomerSetupPayload({
      customer: { customer_number: "K-100", company_name: "Musterfirma GmbH" },
      license: { license_file_path: "C:\\tmp\\customer.bbmlic", license_id: "LIC-100" },
      setupType: "machine",
    });
    assert.equal(machinePayload.setupType, "machine");
    assert.equal(machinePayload.licenseFilePath, "");
    assert.equal(machinePayload.customerNumber, "K-100");
    assert.equal(machinePayload.licenseId, "LIC-100");
  });

  await run("Lizenzverwaltung UI: Kunden-Setup-Texte und Hinweise vorhanden", () => {
    assert.equal(screenSource.includes("Kunden-Setup erstellen"), true);
    assert.equal(screenSource.includes("Machine-Setup erstellen"), true);
    assert.equal(screenSource.includes("Machine-Setup wird erstellt ..."), true);
    assert.equal(screenSource.includes("Machine-Setup wurde erstellt."), true);
    assert.equal(screenSource.includes("Lizenztyp"), true);
    assert.equal(screenSource.includes("Testversion"), true);
    assert.equal(screenSource.includes("Bitte zuerst die Lizenz erstellen."), true);
    assert.equal(screenSource.includes("Kunden-Setup wird erstellt ..."), true);
    assert.equal(screenSource.includes("Kunden-Setup wurde erstellt."), true);
    assert.equal(screenSource.includes("Schritt 1: Machine-Setup erstellen"), true);
    assert.equal(screenSource.includes("Schritt 2: Lizenzanforderung importieren"), true);
    assert.equal(screenSource.includes("Schritt 3: Antwortlizenz erstellen"), true);
    assert.equal(screenSource.includes("Dieses Setup enthält noch keine fertige Lizenz."), true);
    assert.equal(screenSource.includes("if (!res?.ok)"), true);
    assert.equal(screenSource.includes("stdout(last):"), true);
    assert.equal(screenSource.includes("stderr(last):"), true);
    assert.equal(screenSource.includes("customerSlug:"), true);
    assert.equal(screenSource.includes("exitCode:"), true);
    assert.equal(screenSource.includes("logPath:"), true);
    assert.equal(
      screenSource.includes(
        "Kunden-Setup konnte nicht erstellt werden, weil eine Build-Datei gesperrt ist. Bitte App schließen und Kunden-Setup manuell über den Build-Befehl erstellen."
      ),
      true
    );
    assert.equal(screenSource.includes("Lizenz erstellen"), true);
    assert.equal(screenSource.includes("Lizenz-ID erzeugen"), false);
    assert.equal(screenSource.includes("Formular leeren"), false);
    assert.equal(screenSource.includes("Lizenzdatei erzeugen"), false);
  });

  await run("Lizenzverwaltung Main/Preload/Schema: Kunden-Setup-IPC und Lizenzpfad-Spalten vorhanden", () => {
    assert.equal(databaseSource.includes("license_file_path"), true);
    assert.equal(databaseSource.includes("license_file_created_at"), true);
    assert.equal(databaseSource.includes("setup_type"), true);
    assert.equal(databaseSource.includes("setup_status"), true);
    assert.equal(databaseSource.includes("setup_file_path"), true);
    assert.equal(databaseSource.includes("setup_created_at"), true);
    assert.equal(preloadSource.includes("licenseAdminCreateCustomerSetup"), true);
    assert.equal(licenseIpcSource.includes("license-admin:create-customer-setup"), true);
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
  await run("Lizenzverwaltung: Screen startet mit Kundenliste und Rueck-Navigation", () => {
    assert.equal(screenSource.includes("Kundenliste"), true);
    assert.equal(screenSource.includes("Neuer Kunde"), true);
    assert.equal(screenSource.includes("Zurueck zum Adminbereich"), true);
    assert.equal(screenSource.includes("Kundennummer"), true);
    assert.equal(screenSource.includes("Firma / Kundenname"), true);
    assert.equal(screenSource.includes("Ansprechpartner"), true);
    assert.equal(screenSource.includes("E-Mail"), true);
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
      "Testdauer (Tage)",
      "Lizenzart",
      "Gerätebindung",
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
    assert.equal(licenseRecordEditorSource.includes("await saveLicense(model);"), true);
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

  await run("Lizenzverwaltung DB-Schema: optionale Spalten license_edition/license_binding sind vorhanden", () => {
    assert.equal(databaseSource.includes("license_edition TEXT"), true);
    assert.equal(databaseSource.includes("license_binding TEXT"), true);
    assert.equal(databaseSource.includes("trial_duration_days INTEGER"), true);
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

  await run("Lizenzverwaltung Main-Service: speichert product_scope_json als JSON-String", () => {
    assert.equal(licenseAdminServiceSource.includes("product_scope_json"), true);
    assert.equal(licenseAdminServiceSource.includes("JSON.stringify"), true);
    assert.equal(licenseAdminServiceSource.includes("JSON.parse"), true);
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
    assert.equal(storageServiceSource.includes("licenseAdminDeleteLicenseRecord"), true);
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
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license-admin:delete-license-record"'), true);
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
    assert.equal(licenseIpcSource.includes("licenseAdminService.deleteLicenseRecord"), true);
    assert.equal(licenseIpcSource.includes("licenseAdminService.listHistory"), true);
    assert.equal(licenseIpcSource.includes("licenseAdminService.addHistoryEntry"), true);
  });

  await run("Lizenzverwaltung: bestehende Lizenzdatei-/Status-IPC bleibt vorhanden", () => {
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:get-status"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:get-installed"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:import"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:delete"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:generate"'), true);
    assert.equal(licenseIpcSource.includes('ipcMain.handle("license:open-output-dir"'), true);
  });

  await run(
    "Lizenzverwaltung: Preload-API enthaelt list/save fuer Admin-Lizenzkunden, -Lizenzen und -Historie",
    () => {
      assert.equal(preloadSource.includes("licenseAdminListLicenseCustomers"), true);
      assert.equal(preloadSource.includes("licenseAdminSaveLicenseCustomer"), true);
      assert.equal(preloadSource.includes("licenseAdminListLicenseRecords"), true);
      assert.equal(preloadSource.includes("licenseAdminSaveLicenseRecord"), true);
      assert.equal(preloadSource.includes("licenseAdminDeleteLicenseRecord"), true);
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
    assert.equal(settingsViewSource.includes("titleText: \"Profil & Druck\""), true);
    assert.equal(settingsViewSource.includes("subText: \"Profil, Adresse, Protokolltexte, Logos und Layout\""), true);
    assert.equal(settingsViewSource.includes("titleText: \"Lizenzstatus\""), true);
    assert.equal(settingsViewSource.includes("subText: \"Externe Lizenzverwaltung\""), true);
    assert.equal(settingsViewSource.includes("titleText: \"Technik\""), true);
    assert.equal(settingsViewSource.includes("subText: \"Versionierung, Textgrenzen, DB-Diagnose und Diktat / Audio\""), true);
    assert.equal(settingsViewSource.includes("tiles.append(tileProfilePrint, tileLicense, tileAdmin, tileArchive, tileDev);"), true);
    assert.equal(settingsViewSource.includes("titleText: \"Adminbereich\""), true);
    assert.equal(settingsViewSource.includes("subText: \"Externe Lizenzverwaltung\""), true);
  });

  await run("SettingsView: Sammelmaske ist in sechs sichtbare Abschnitte gegliedert", () => {
    const idx = (needle) => settingsViewSource.indexOf(needle);
    assert.equal(settingsViewSource.includes('title: "Profil"'), true);
    assert.equal(settingsViewSource.includes('title: "Adresse"'), true);
    assert.equal(settingsViewSource.includes('title: "Druckinhalt"'), true);
    assert.equal(settingsViewSource.includes('title: "Footer"'), true);
    assert.equal(settingsViewSource.includes('title: "Logos"'), true);
    assert.equal(settingsViewSource.includes('title: "Drucklayout"'), true);
    assert.equal(settingsViewSource.includes('hint: "Name, Firma und Anzeigedaten"'), true);
    assert.equal(settingsViewSource.includes('hint: "Strasse, PLZ und Ort"'), true);
    assert.equal(settingsViewSource.includes('hint: "Texte fuer Protokoll und PDF-Ausgabe"'), true);
    assert.equal(settingsViewSource.includes('hint: "Fusszeilenangaben und Profil-/Adressbezug"'), true);
    assert.equal(settingsViewSource.includes('hint: "Drucklogos und Logo-Dialog-Einstieg"'), true);
    assert.equal(settingsViewSource.includes('hint: "Seitenraender und Footer-Abstand"'), true);
    assert.equal(settingsViewSource.includes("Drucklogos konfigurieren"), true);
    assert.equal(idx('title: "Profil"') < idx('title: "Adresse"'), true);
    assert.equal(idx('title: "Adresse"') < idx('title: "Druckinhalt"'), true);
    assert.equal(idx('title: "Druckinhalt"') < idx('title: "Footer"'), true);
    assert.equal(idx('title: "Footer"') < idx('title: "Logos"'), true);
    assert.equal(idx('title: "Logos"') < idx('title: "Drucklayout"'), true);
  });

  await run("SettingsView: sichtbare Druckinhalt-Texte sind sprachlich geschaerft", () => {
    assert.equal(settingsViewSource.includes('label: "Protokolltitel"'), true);
    assert.equal(settingsViewSource.includes('label: "Vorbemerkung"'), true);
    assert.equal(settingsViewSource.includes('label: "Vorbemerkung in der Ausgabe drucken"'), true);
    assert.equal(settingsViewSource.includes('title: "Textgrenzen für TOPs"'), true);
    assert.equal(settingsViewSource.includes('hint: "Maximale Länge für Kurztext und Langtext in TOPs."'), true);
    assert.equal(settingsViewSource.includes('label: "Vorbemerkung drucken (true/false)"'), false);
    assert.equal(settingsViewSource.includes('title: "Protokoll-Textgrenzen"'), false);
  });

  await run("SettingsView: sichtbare Footer-Labels sind sprachlich vereinfacht", () => {
    assert.equal(settingsViewSource.includes('label: "Ort"'), true);
    assert.equal(settingsViewSource.includes('label: "Datum"'), true);
    assert.equal(settingsViewSource.includes('label: "Name 1"'), true);
    assert.equal(settingsViewSource.includes('label: "Name 2"'), true);
    assert.equal(settingsViewSource.includes('label: "Protokollfuehrer"'), true);
    assert.equal(settingsViewSource.includes('label: "Strasse"'), true);
    assert.equal(settingsViewSource.includes('label: "PLZ"'), true);
    assert.equal(settingsViewSource.includes('label: "Ort (Adresse)"'), true);
    assert.equal(settingsViewSource.includes('label: "Profil-/Adressdaten im Footer verwenden"'), true);
    assert.equal(settingsViewSource.includes('label: "Footer nutzt Nutzerdaten (true/false)"'), false);
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


  await run("SettingsView: neuer Adminbereich nutzt keine alten Popup-Callbacks", () => {
    assert.equal(settingsViewSource.includes("onOpenLicenseEditor:"), false);
    assert.equal(settingsViewSource.includes("onOpenCustomerEditor:"), false);
    assert.equal(settingsViewSource.includes("onOpenProductScopeEditor:"), false);
    assert.equal(settingsViewSource.includes("onOpenLicenseHistory:"), false);
  });

  await run("LicenseAdminScreen wird direkt aus SettingsView geoeffnet", () => {
    assert.equal(settingsViewSource.includes("new LicenseAdminScreen({"), true);
    assert.equal(settingsViewSource.includes("onBackToAdminbereich"), true);
    assert.equal(settingsViewSource.includes("onOpenLicenseEditor"), false);
  });


  await run("LicenseAdminScreen Liste zeigt Produktumfang in Kunden-Lizenzzeile", () => {
    assert.equal(screenSource.includes("formatProductScopeForList(record)"), true);
  });

  await run("LicenseAdminScreen enthaelt kundenbezogene Lizenzfunktionen", () => {
    assert.equal(screenSource.includes("Lizenzen dieses Kunden"), true);
    assert.equal(screenSource.includes("Kundendaten"), true);
    assert.equal(screenSource.includes("Neue Lizenz"), true);
    assert.equal(screenSource.includes("Lizenz löschen"), true);
    assert.equal(screenSource.includes("Lizenz wirklich löschen?"), true);
    assert.equal(screenSource.includes("Lizenz wurde gelöscht."), true);
    assert.equal(screenSource.includes("Lizenz konnte nicht gelöscht werden."), true);
    assert.equal(screenSource.includes("Zurueck zur Kundenliste"), true);
    assert.equal(screenSource.includes("Lizenz erstellen"), true);
    assert.equal(screenSource.includes("Lizenz speichern"), false);
    assert.equal(screenSource.includes("Formular leeren"), false);
    assert.equal(screenSource.includes("Lizenz-ID erzeugen"), false);
    assert.equal(screenSource.includes("Zurueck"), true);
    assert.equal(screenSource.includes("Merken"), false);
    assert.equal(screenSource.includes("Neu / leeren"), false);
    assert.equal(screenSource.includes("Zurueck zum Kunden"), false);
    assert.equal(screenSource.includes("Aktion"), true);
    assert.equal(screenSource.includes("Öffnen"), true);
    assert.equal(screenSource.includes("Lizenzdatei erzeugen"), false);
    assert.equal(screenSource.includes("Ausgabeordner öffnen"), true);
    assert.equal(screenSource.includes("Lizenzdatei wird erzeugt ..."), true);
    assert.equal(screenSource.includes("Lizenzdatei wurde erzeugt."), true);
    assert.equal(screenSource.includes("Gerätegebundene Vollversion:"), true);
    assert.equal(screenSource.includes("Antwortlizenz wurde erstellt."), true);
    assert.equal(screenSource.includes("Diese .bbmlic-Datei an den Kunden zurückgeben."), true);
    assert.equal(screenSource.includes("Antwortlizenz erzeugen"), false);
    assert.equal(screenSource.includes("Produktumfang enthält keine erzeugbaren Features."), true);
    assert.equal(screenSource.includes("Machine-ID ist erforderlich, wenn die Lizenz an ein Gerät gebunden wird."), true);
    assert.equal(screenSource.includes("Bitte gültige Datumswerte eintragen."), true);
    assert.equal(screenSource.includes("Der Testzeitraum beginnt bei erster Installation / erstem Start."), true);
    assert.equal(screenSource.includes("Testzeitraum"), true);
    assert.equal(screenSource.includes("\"Lizenztyp\""), true);
    assert.equal(screenSource.includes("Gerätebindung (automatisch)"), true);
    assert.equal(screenSource.includes("licenseGenerate"), true);
    assert.equal(screenSource.includes("licenseOpenOutputDir"), true);
  });

  await run("SettingsView: Lizenzstatusbereich fuehrt Antwortlizenz-Import ohne neuen Mechanismus", () => {
    assert.equal(settingsViewSource.includes("Antwortlizenz erhalten?"), true);
    assert.equal(settingsViewSource.includes("Importieren Sie hier die .bbmlic-Datei"), true);
    assert.equal(settingsViewSource.includes("Lizenz importieren"), true);
  });

  await run("Kundendetail: nach Kunde speichern ist Neue Lizenz direkt nutzbar", () => {
    assert.equal(screenSource.includes("this.currentCustomer = saved;"), true);
    assert.equal(screenSource.includes("newLicenseBtn.disabled = false;"), true);
  });


  await run("Kundendetail: Neue Lizenz ist ohne gespeicherten Kunden blockiert", () => {
    assert.equal(screenSource.includes("Bitte zuerst den Kunden speichern."), true);
    assert.equal(screenSource.includes("newLicenseBtn.disabled = !this.currentCustomer?.id;"), true);
  });

  await run("LicenseAdminScreen zeigt Speicherkontext und Kundenpflicht", () => {
    assert.equal(screenSource.includes("Kundenkontext:"), true);
    assert.equal(screenSource.includes("CUSTOMER_CONTEXT_REQUIRED"), true);
    assert.equal(screenSource.includes("Speichern ohne geoeffneten Kunden ist unmoeglich"), true);
  });

  await run("Entwicklungs-Trial-Einstellungen bleiben entfernt", () => {
    assert.equal(settingsViewSource.includes("Nutzungstage-Limit aktiv"), false);
    assert.equal(settingsViewSource.includes("Nutzungstage (0 = aus)"), false);
    assert.equal(settingsViewSource.includes("trial.enabled"), false);
    assert.equal(settingsViewSource.includes("trial.daysLimit"), false);
    assert.equal(settingsViewSource.includes("trial.firstStartAt"), false);
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
