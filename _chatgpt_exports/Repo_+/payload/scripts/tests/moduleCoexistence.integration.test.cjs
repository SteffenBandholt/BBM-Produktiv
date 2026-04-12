const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runModuleCoexistenceIntegrationTests(run) {
  const [
    moduleCatalog,
    moduleNavigation,
    moduleEntryScreenResolver,
    moduleScreenResolver,
    protokollModule,
    restarbeitenModule,
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleCatalog.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleNavigation.js")),
    importEsmFromFile(
      path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")
    ),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleScreenResolver.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/protokoll/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/restarbeiten/index.js")),
  ]);

  const {
    getActiveModuleIds,
    findActiveModuleEntry,
    getDerivedActiveModuleCatalog,
    getDerivedActiveModuleIds,
    getActiveModuleCatalogForReleaseState,
    getActiveModuleIdsForReleaseState,
  } = moduleCatalog;
  const { getActiveProjectModuleNavigation } = moduleNavigation;
  const { resolveModuleScreenFromEntry } = moduleEntryScreenResolver;
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

  await run("Module Koexistenz: Freigabezustaende werden klein und kontrolliert auf aktive Module abgebildet", () => {
    const protokollReleasedIds = getActiveModuleIdsForReleaseState({
      releasedModuleIds: [PROTOKOLL_MODULE_ID],
    });
    const restarbeitenReleasedIds = getActiveModuleIdsForReleaseState({
      activeModuleIds: [RESTARBEITEN_MODULE_ID],
    });
    const bothReleasedCatalog = getActiveModuleCatalogForReleaseState({
      modules: {
        [PROTOKOLL_MODULE_ID]: true,
        [RESTARBEITEN_MODULE_ID]: true,
      },
    });

    assert.deepEqual(protokollReleasedIds, [PROTOKOLL_MODULE_ID]);
    assert.deepEqual(restarbeitenReleasedIds, [RESTARBEITEN_MODULE_ID]);
    assert.equal(bothReleasedCatalog.length, 2);
    assert.equal(bothReleasedCatalog[0]?.moduleId, PROTOKOLL_MODULE_ID);
    assert.equal(bothReleasedCatalog[1]?.moduleId, RESTARBEITEN_MODULE_ID);
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
    assert.equal(restarbeitenEntry?.capabilities?.hasNavigation, true);
    assert.equal(Boolean(protokollEntry?.movedParts?.viewmodel), true);
    assert.equal(Boolean(restarbeitenEntry?.movedParts?.components), true);
  });

  await run("Module Koexistenz: Projektnavigation enthaelt nur aufloesbare Modulziele", () => {
    const activeCatalog = getActiveModuleCatalogForReleaseState({
      releasedModuleIds: [PROTOKOLL_MODULE_ID, RESTARBEITEN_MODULE_ID],
    });
    const navigation = getActiveProjectModuleNavigation();

    assert.equal(navigation.length > 0, true);

    for (const navEntry of navigation) {
      const moduleEntry =
        activeCatalog.find((entry) => entry?.moduleId === navEntry?.moduleId) || null;
      const screenId = String(navEntry?.workScreenId || moduleEntry?.workScreenId || "").trim();
      const resolvedScreen = resolveModuleScreenFromEntry(moduleEntry, screenId);

      assert.equal(Boolean(moduleEntry), true);
      assert.equal(Boolean(screenId), true);
      assert.equal(Boolean(resolvedScreen), true);
    }
  });

  await run("Module Koexistenz: Restarbeiten wird in der aktiven Projektnavigation sichtbar", () => {
    const navigation = getActiveProjectModuleNavigation();
    const restarbeitenEntry =
      navigation.find((entry) => entry?.moduleId === RESTARBEITEN_MODULE_ID) || null;

    assert.equal(Boolean(restarbeitenEntry), true);
    assert.equal(restarbeitenEntry?.workScreenId, RESTARBEITEN_WORK_SCREEN_ID);
  });

  await run("Module Koexistenz: Projektfirmen bleibt in der Sidebar-Verdrahtung erhalten", () => {
    const mainFile = path.join(__dirname, "../../src/renderer/main.js");
    const source = fs.readFileSync(mainFile, "utf8");

    assert.equal(source.includes('key: "projectFirms"'), true);
    assert.equal(
      source.includes("const projectNavigationButtons = contextualNavigationRouteDefs.map"),
      true
    );
  });
}

module.exports = { runModuleCoexistenceIntegrationTests };
