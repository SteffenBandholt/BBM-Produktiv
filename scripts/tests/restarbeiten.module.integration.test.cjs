const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runRestarbeitenModuleIntegrationTests(run) {
  const [
    moduleCatalog,
    moduleEntryResolver,
    restarbeitenModule,
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleCatalog.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/index.js")),
  ]);

  const { getDerivedActiveModuleCatalog, getDerivedActiveModuleIds } = moduleCatalog;
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

  await run("Restarbeiten Modul-Integration: Restarbeiten-Only ist als kleiner Betriebsmodus ableitbar", () => {
    const activeIds = getDerivedActiveModuleIds([RESTARBEITEN_MODULE_ID]);
    const activeCatalog = getDerivedActiveModuleCatalog([RESTARBEITEN_MODULE_ID]);

    assert.deepEqual(activeIds, [RESTARBEITEN_MODULE_ID]);
    assert.equal(activeCatalog.length, 1);
    assert.equal(activeCatalog[0]?.moduleId, RESTARBEITEN_MODULE_ID);
    assert.equal(activeCatalog[0]?.workScreenId, RESTARBEITEN_WORK_SCREEN_ID);
  });
}

module.exports = { runRestarbeitenModuleIntegrationTests };
