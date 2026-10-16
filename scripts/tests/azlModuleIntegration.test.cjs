const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

async function runAzlModuleIntegrationTests(run) {
  await run("azL: kanonisches Projektmodul ist registriert", () => {
    const registry = JSON.parse(read("src/main/module-registry.json"));
    assert.ok(registry.canonicalModuleIds.includes("azl"));
    assert.equal(registry.modules.azl.kind, "project");
    assert.equal(registry.modules.azl.licenseKey, "module:azl");
    assert.equal(registry.modules.azl.ipcRegistrar, "azl");
    assert.equal(registry.modules.azl.migrationRegistrar, "azl");
    assert.deepEqual(registry.modules.azl.requiredCapabilities, ["pdf", "export", "file-storage", "ui-editor"]);
    assert.equal(registry.canonicalModuleIds.includes("rechnung"), false);
  });

  await run("azL: BBM bindet das Schwesterpaket ein", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.equal(pkg.dependencies["bbm-azl"], "file:../BBM-azL");
  });

  await run("azL: Host- und Rendereradapter sind vorhanden", () => {
    for (const relative of [
      "src/main/modules/azl/registerIpc.js",
      "src/main/modules/azl/registerMigrations.js",
      "src/main/ipc/azlIpc.js",
      "src/renderer/modules/azl/index.js",
      "src/renderer/modules/azl/AzlHostScreen.js",
      "src/renderer/modules/azl/AzlQuicklane.js",
    ]) {
      assert.equal(fs.existsSync(path.join(ROOT, relative)), true, relative);
    }
  });

  await run("azL: Modulkatalog und Projektkachel enthalten den Einstieg", () => {
    const catalog = read("src/renderer/app/modules/moduleCatalog.js");
    const hub = read("src/renderer/modules/projektverwaltung/screens/ProjectsHubScreen.js");
    assert.match(catalog, /getAzlModuleEntry/);
    assert.match(catalog, /AZL_MODULE_ID/);
    assert.match(hub, /"azl"/);
  });

  await run("azL: Auftragnehmer kommen ausschließlich aus Projektfirmen", () => {
    const host = read("src/renderer/modules/azl/AzlHostScreen.js");
    assert.match(host, /firmDirectoryListProjectParticipants/);
    assert.equal(host.includes("firmDirectoryListAll"), false);
    assert.equal(host.includes("projectFirmsAssignGlobalFirm"), false);
    assert.match(host, /includes\("bauherr"\)/);
  });

  await run("azL: Quicklane bietet Projekt, Firmen, Neu und PDF-Vorschau", () => {
    const quicklane = read("src/renderer/modules/azl/AzlQuicklane.js");
    assert.match(quicklane, /Projektfirmen/);
    assert.match(quicklane, /Neue azL/);
    assert.match(quicklane, /PDF-Vorschau/);
    assert.equal(quicklane.includes("azL speichern"), false);
    assert.match(quicklane, /data-bbm-quicklane/);
  });

  await run("azL: Auftragsdaten werden an Projektfirmen gepflegt", () => {
    const view = read("src/renderer/views/ProjectFirmsWorkView.js");
    assert.match(view, /Auftragsdaten für azL/);
    assert.match(view, /azlContractSave/);
    assert.match(view, /azlContractsList/);
    assert.match(view, /Stundenverrechnungssatz/);
  });
}

module.exports = { runAzlModuleIntegrationTests };
