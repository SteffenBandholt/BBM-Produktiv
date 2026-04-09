const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenModuleIntegrationTests(run) {
  const [
    moduleEntryResolver,
    restarbeitenModule,
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/index.js")),
  ]);

  const { resolveModuleWorkScreenFromEntry } = moduleEntryResolver;
  const {
    getRestarbeitenModuleEntry,
    RESTARBEITEN_MODULE_ID,
    RESTARBEITEN_WORK_SCREEN_ID,
    RestarbeitenScreen,
  } = restarbeitenModule;

  await run("Restarbeiten Modul-Integration: Moduleinstieg ist eigenstaendig auswertbar", () => {
    const entry = getRestarbeitenModuleEntry();
    assert.equal(entry?.moduleId, RESTARBEITEN_MODULE_ID);
    assert.equal(entry?.workScreenId, RESTARBEITEN_WORK_SCREEN_ID);
    assert.equal(entry?.workScreenLabel, "Restarbeiten");
    assert.equal(entry?.capabilities?.hasWorkScreen, true);
    assert.equal(entry?.capabilities?.hasNavigation, false);
    assert.equal(entry?.capabilities?.hasRouterIntegration, false);
  });

  await run("Restarbeiten Modul-Integration: Work-Screen ist separat aufloesbar", () => {
    const entry = getRestarbeitenModuleEntry();
    const resolvedScreen = resolveModuleWorkScreenFromEntry(entry);
    assert.equal(resolvedScreen, RestarbeitenScreen);

    const screenEntry = entry?.screens?.[RESTARBEITEN_WORK_SCREEN_ID] || null;
    assert.equal(screenEntry?.screenId, RESTARBEITEN_WORK_SCREEN_ID);
    assert.equal(screenEntry?.screenLabel, "Restarbeiten");
    assert.equal(screenEntry?.screenComponent, RestarbeitenScreen);
  });

  await run("Restarbeiten Modul-Integration: Modulkatalog fuehrt das Modul als aktiv", async () => {
    const moduleCatalogSource = await require("node:fs/promises").readFile(
      path.join(__dirname, "../../src/renderer/app/modules/moduleCatalog.js"),
      "utf8"
    );
    assert.match(moduleCatalogSource, /getRestarbeitenModuleEntry\(\)/);
    assert.match(moduleCatalogSource, /RESTARBEITEN_MODULE_ID/);
  });
}

module.exports = { runRestarbeitenModuleIntegrationTests };
