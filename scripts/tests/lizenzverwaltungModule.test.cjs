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
    },
    {
      getProjektverwaltungModuleEntry,
    },
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/lizenzverwaltung/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/projektverwaltung/index.js")),
  ]);

  const screenSource = read("src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreen.js");
  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
  const projectWorkspaceSource = read("src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js");
  const settingsViewSource = read("src/renderer/views/SettingsView.js");

  await run("Lizenzverwaltung: Modul exportiert LicenseAdminScreen", () => {
    const entry = getLizenzverwaltungModuleEntry();

    assert.equal(LIZENZVERWALTUNG_MODULE_ID, "lizenzverwaltung");
    assert.equal(LIZENZVERWALTUNG_WORK_SCREEN_ID, "licenseAdmin");
    assert.equal(typeof LicenseAdminScreen, "function");
    assert.equal(entry.moduleId, "lizenzverwaltung");
    assert.equal(entry.workScreenId, "licenseAdmin");
    assert.equal(entry.screens?.licenseAdmin, LicenseAdminScreen);
  });

  await run("Lizenzverwaltung: Skeleton enthaelt alle Platzhalterbereiche", () => {
    assert.equal(screenSource.includes("Lizenzverwaltung"), true);
    assert.equal(screenSource.includes("Admin-/Mutter-App-Modul"), true);
    assert.equal(screenSource.includes("Umsetzung erfolgt schrittweise"), true);
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

  await run("Lizenzverwaltung: Entwicklung enthaelt den Einstieg Adminbereich als Kachel, nicht als Tab", () => {
    assert.equal(settingsViewSource.includes("../modules/lizenzverwaltung/index.js"), true);
    assert.equal(settingsViewSource.includes("makeDevTabButton(\"Adminbereich\", \"admin\")"), false);
    assert.equal(settingsViewSource.includes("titleText: \"Adminbereich\""), true);
    assert.equal(settingsViewSource.includes("openAdminbereichPopup"), true);
  });

  await run("Lizenzverwaltung: Adminbereich-Popup enthaelt Kachel Lizenzverwaltung", () => {
    assert.equal(settingsViewSource.includes("title: \"Adminbereich\""), true);
    assert.equal(settingsViewSource.includes("titleText: \"Lizenzverwaltung\""), true);
    assert.equal(settingsViewSource.includes("openLicenseAdminPopup"), true);
  });

  await run("Lizenzverwaltung: Kachel Lizenzverwaltung zeigt weiter den LicenseAdminScreen-Skeleton", () => {
    assert.equal(settingsViewSource.includes("title: \"Lizenzverwaltung\""), true);
    assert.equal(settingsViewSource.includes("new LicenseAdminScreen()"), true);
  });
}

module.exports = { runLizenzverwaltungModuleTests };
