const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runModuleCoexistenceIntegrationTests(run) {
  const [
    moduleCatalog,
    moduleScreenResolver,
    protokollModule,
    restarbeitenModule,
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleCatalog.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleScreenResolver.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/index.js")),
  ]);

  const {
    getActiveModuleIds,
    findActiveModuleEntry,
    getDerivedActiveModuleCatalog,
    getDerivedActiveModuleIds,
  } = moduleCatalog;
  const { resolveActiveModuleWorkScreen } = moduleScreenResolver;
  const {
    PROTOKOLL_MODULE_ID,
    PROTOKOLL_WORK_SCREEN_ID,
    TopsScreen,
  } = protokollModule;
  const {
    RESTARBEITEN_MODULE_ID,
    RESTARBEITEN_WORK_SCREEN_ID,
    RestarbeitenScreen,
  } = restarbeitenModule;

  await run("Module Koexistenz: Protokoll und Restarbeiten sind beide aktiv", () => {
    const activeIds = getActiveModuleIds();
    assert.equal(activeIds.includes(PROTOKOLL_MODULE_ID), true);
    assert.equal(activeIds.includes(RESTARBEITEN_MODULE_ID), true);
    assert.equal(activeIds.length >= 2, true);
  });

  await run("Module Koexistenz: kleine Betriebsmodi sind aus dem statischen Katalog ableitbar", () => {
    const protokollOnlyIds = getDerivedActiveModuleIds([PROTOKOLL_MODULE_ID]);
    const protokollOnlyCatalog = getDerivedActiveModuleCatalog([PROTOKOLL_MODULE_ID]);
    const bothIds = getDerivedActiveModuleIds([
      PROTOKOLL_MODULE_ID,
      RESTARBEITEN_MODULE_ID,
    ]);

    assert.deepEqual(protokollOnlyIds, [PROTOKOLL_MODULE_ID]);
    assert.equal(protokollOnlyCatalog.length, 1);
    assert.equal(protokollOnlyCatalog[0]?.moduleId, PROTOKOLL_MODULE_ID);
    assert.deepEqual(bothIds, [PROTOKOLL_MODULE_ID, RESTARBEITEN_MODULE_ID]);
  });

  await run("Module Koexistenz: beide Work-Screens sind separat aufloesbar", () => {
    const protokollScreen = resolveActiveModuleWorkScreen(PROTOKOLL_MODULE_ID);
    const restarbeitenScreen = resolveActiveModuleWorkScreen(RESTARBEITEN_MODULE_ID);

    assert.equal(protokollScreen, TopsScreen);
    assert.equal(restarbeitenScreen, RestarbeitenScreen);
    assert.notEqual(protokollScreen, restarbeitenScreen);
  });

  await run("Module Koexistenz: Modulgrenzen bleiben im Katalog sichtbar getrennt", () => {
    const protokollEntry = findActiveModuleEntry(PROTOKOLL_MODULE_ID);
    const restarbeitenEntry = findActiveModuleEntry(RESTARBEITEN_MODULE_ID);

    assert.equal(protokollEntry?.workScreenId, PROTOKOLL_WORK_SCREEN_ID);
    assert.equal(restarbeitenEntry?.workScreenId, RESTARBEITEN_WORK_SCREEN_ID);
    assert.equal(Array.isArray(protokollEntry?.navigation?.project), true);
    assert.equal(restarbeitenEntry?.capabilities?.hasNavigation, false);
    assert.equal(Boolean(protokollEntry?.movedParts?.viewmodel), true);
    assert.equal(Boolean(restarbeitenEntry?.movedParts?.components), true);
  });
}

module.exports = { runModuleCoexistenceIntegrationTests };
