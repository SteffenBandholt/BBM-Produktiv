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
      createLicenseEditorSection,
    },
    {
      getProjektverwaltungModuleEntry,
    },
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/lizenzverwaltung/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/projektverwaltung/index.js")),
  ]);

  const screenSource = read("src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js");
  const licenseEditorSource = read("src/renderer/modules/lizenzverwaltung/screens/createLicenseEditorSection.js");
  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
  const projectWorkspaceSource = read("src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js");
  const settingsViewSource = read("src/renderer/views/SettingsView.js");

  await run("Lizenzverwaltung: Modul exportiert LicenseAdminScreen", () => {
    const entry = getLizenzverwaltungModuleEntry();

    assert.equal(LIZENZVERWALTUNG_MODULE_ID, "lizenzverwaltung");
    assert.equal(LIZENZVERWALTUNG_WORK_SCREEN_ID, "licenseAdmin");
    assert.equal(typeof LicenseAdminScreen, "function");
    assert.equal(typeof createLicenseEditorSection, "function");
    assert.equal(entry.moduleId, "lizenzverwaltung");
    assert.equal(entry.workScreenId, "licenseAdmin");
    assert.equal(entry.screens?.licenseAdmin, LicenseAdminScreen);
  });

  await run("Lizenzverwaltung: Skeleton enthaelt Einstieg und Platzhalterbereiche", () => {
    assert.equal(screenSource.includes("Lizenzverwaltung"), true);
    assert.equal(screenSource.includes("Admin-/Mutter-App-Modul"), true);
    assert.equal(screenSource.includes("Umsetzung erfolgt schrittweise"), true);
    assert.equal(screenSource.includes("Lizenz erstellen / bearbeiten"), true);
    assert.equal(screenSource.includes("Kunden"), true);
    assert.equal(screenSource.includes("Lizenzen"), true);
    assert.equal(screenSource.includes("Produktumfang"), true);
    assert.equal(screenSource.includes("Historie"), true);
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
    assert.equal(settingsViewSource.includes("title: \"Lizenz erstellen / bearbeiten\""), true);
  });

  await run("Lizenz / bearbeiten: enthaelt Produktumfang statt flacher Feature-Zeile", () => {
    assert.equal(licenseEditorSource.includes("mkRow(\"Produktumfang\", productScopeWrap)"), true);
    assert.equal(licenseEditorSource.includes("mkRow(\"Features\", featureWrap)"), false);
    assert.equal(licenseEditorSource.includes("Standardumfang"), true);
    assert.equal(licenseEditorSource.includes("Zusatzfunktionen"), true);
    assert.equal(licenseEditorSource.includes("Module"), true);
  });

  await run("Lizenz / bearbeiten: Standardumfang enthaelt app/pdf/export", () => {
    assert.equal(licenseEditorSource.includes("const standardFeatureInputs = [\"app\", \"pdf\", \"export\"]"), true);
    assert.equal(licenseEditorSource.includes("Immer enthalten, nicht abwaehlbar."), true);
  });

  await run("Lizenz / bearbeiten: Zusatzfunktionen enthaelt mail/Dictate (audio-kompatibel)", () => {
    assert.equal(licenseEditorSource.includes("const optionalFeatureInputs = [\"mail\", \"audio\"]"), true);
    assert.equal(licenseEditorSource.includes("return normalizedFeature === \"audio\" ? \"Dictate\" : normalizedFeature;"), true);
    assert.equal(licenseEditorSource.includes("if (normalized === \"dictate\") return \"audio\";"), true);
  });

  await run("Lizenz / bearbeiten: zeigt nicht audio und Dictate parallel an", () => {
    assert.equal(licenseEditorSource.includes("mkFeatureInput(\"Dictate\""), false);
    assert.equal(licenseEditorSource.includes("mkFeatureInput(\"audio\""), false);
    assert.equal(licenseEditorSource.includes("return normalizedFeature === \"audio\" ? \"Dictate\" : normalizedFeature;"), true);
  });

  await run("Lizenz / bearbeiten: Module enthaelt Protokoll/Dummy als vorbereitete Eintraege", () => {
    assert.equal(licenseEditorSource.includes("const moduleFeatureInputs = [\"Protokoll\", \"Dummy\"]"), true);
    assert.equal(licenseEditorSource.includes("Vorbereitet, noch nicht aktiv angebunden."), true);
    assert.equal(licenseEditorSource.includes("hint: \"(vorbereitet)\""), true);
  });
}

module.exports = { runLizenzverwaltungModuleTests };
