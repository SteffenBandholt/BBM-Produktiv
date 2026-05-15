const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenModuleTests(run) {
  const [restarbeitenModule, screenResolver, workspaceModule] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js")),
  ]);

  await run("Restarbeiten: Modulentry hat erwartete Struktur", () => {
    const entry = restarbeitenModule.getRestarbeitenModuleEntry();
    assert.equal(entry.moduleId, "restarbeiten");
    assert.equal(entry.moduleLabel, "Restarbeiten");
    assert.equal(entry.workScreenId, "restarbeitenWork");
    assert.equal(entry.navigation.project[0].key, "restarbeiten");
    assert.equal(entry.navigation.project[0].label, "Restarbeiten");
    assert.equal(entry.navigation.project[0].moduleId, "restarbeiten");
    assert.equal(entry.navigation.project[0].workScreenId, "restarbeitenWork");
    assert.equal(entry.navigation.project[0].section, "restarbeiten");
  });

  await run("Restarbeiten: Workscreen ist ueber Resolver aufloesbar", () => {
    const entry = restarbeitenModule.getRestarbeitenModuleEntry();
    const resolved = screenResolver.resolveModuleWorkScreenFromEntry(entry);
    assert.equal(typeof resolved, "function");
  });

  await run("ProjectWorkspaceScreen: Sonderfaelle und generische Module bleiben funktionsfaehig", async () => {
    const calls = [];
    const screen = new workspaceModule.default({
      router: {
        currentProjectId: "22",
        async showProjectFirms(projectId) {
          calls.push({ type: "firms", projectId });
        },
        async openProjectModule(projectId, moduleId, options) {
          calls.push({ type: "module", projectId, moduleId, options });
          return { ok: true };
        },
      },
      projectId: "22",
      project: { id: "22", name: "Test" },
    });

    assert.equal(await screen.openProjectModule("projectFirms"), true);
    assert.equal(await screen.openProjectModule("protokoll"), true);
    assert.equal(await screen.openProjectModule("restarbeiten"), true);

    assert.equal(calls.some((c) => c.type === "firms"), true);
    assert.equal(calls.some((c) => c.type === "module" && c.moduleId === "protokoll"), true);
    assert.equal(calls.some((c) => c.type === "module" && c.moduleId === "restarbeiten"), true);

    const restCall = calls.find((c) => c.type === "module" && c.moduleId === "restarbeiten");
    assert.equal(restCall.options.project.id, "22");
  });

  await run("Restarbeiten: Modulkatalog leitet Restarbeiten gezielt ab", async () => {
    const moduleCatalog = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/app/modules/moduleCatalog.js")
    );

    assert.deepEqual(moduleCatalog.getDerivedActiveModuleIds(["restarbeiten"]), ["restarbeiten"]);

    const derivedCatalog = moduleCatalog.getDerivedActiveModuleCatalog(["restarbeiten"]);
    assert.equal(Array.isArray(derivedCatalog), true);
    assert.equal(derivedCatalog.length, 1);
    assert.equal(derivedCatalog[0].moduleId, "restarbeiten");

    assert.deepEqual(moduleCatalog.getActiveModuleIds(), ["protokoll"]);
  });

}

module.exports = { runRestarbeitenModuleTests };
