const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runLizenzverwaltungModuleTests(run) {
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
    assert.equal(customerEditorSource.includes("ohne Speicherung"), true);
    assert.equal(customerEditorSource.includes("Keine Speicherung"), true);
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
    assert.equal(licenseRecordEditorSource.includes("vorbereitet, noch ohne Speicherung"), true);
    assert.equal(licenseRecordEditorSource.includes("Neu / leeren"), true);
    assert.equal(licenseRecordEditorSource.includes("Pruefen"), true);
    assert.equal(licenseRecordEditorSource.includes("Keine Speicherung"), true);
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
    assert.equal(licenseHistoryEditorSource.includes("Keine Speicherung"), true);
  });

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
