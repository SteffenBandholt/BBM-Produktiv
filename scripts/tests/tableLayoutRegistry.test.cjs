const assert = require("node:assert/strict");

const {
  listTableLayoutDefinitions,
  listTableLayoutModules,
  getTableLayoutDefinition,
} = require("../../src/shared/tableLayouts/tableLayoutRegistry");

async function runTableLayoutRegistryTests(run) {
  await run("TableLayoutRegistry: liefert Modul- und Tabellen-Definitionen", async () => {
    const modules = listTableLayoutModules();
    const definitions = await listTableLayoutDefinitions();

    assert.equal(Array.isArray(modules), true);
    assert.equal(modules.length >= 1, true);
    assert.equal(modules[0].moduleId, "protokoll");
    assert.equal(modules[0].moduleLabel, "Protokoll");
    assert.equal(Array.isArray(modules[0].tables), true);
    assert.equal(modules[0].tables[0].tableKey, "protokoll_tops");
    assert.equal(modules[0].tables[0].tableLabel, "TOP-Liste");

    assert.equal(Array.isArray(definitions), true);
    assert.equal(definitions.length >= 1, true);
    assert.equal(definitions[0].moduleId, "protokoll");
    assert.equal(definitions[0].moduleLabel, "Protokoll");
    assert.equal(definitions[0].tableKey, "protokoll_tops");
    assert.equal(definitions[0].tableLabel, "TOP-Liste");
    assert.equal(Array.isArray(definitions[0].supportedOrientations), true);
    assert.equal(definitions[0].supportedOrientations.includes("portrait"), true);
    assert.equal(definitions[0].supportedOrientations.includes("landscape"), true);
    assert.equal(Array.isArray(definitions[0].editFields), true);
    assert.equal(Array.isArray(definitions[0].previewData), true);
    assert.equal(definitions[0].previewData.length >= 3, true);
    assert.equal(definitions[0].previewData[0].topNumber, "1");
    assert.equal(definitions[0].previewData[1].topNumber, "1.1");
    assert.equal(definitions[0].defaultLayout?.tableKey, "protokoll_tops");
    assert.equal(definitions[0].defaultLayout?.variant, "portrait");
  });

  await run("TableLayoutRegistry: getTableLayoutDefinition findet den Pilot", () => {
    const def = getTableLayoutDefinition({ moduleId: "protokoll", tableKey: "protokoll_tops" });
    assert.equal(def?.moduleId, "protokoll");
    assert.equal(def?.moduleLabel, "Protokoll");
    assert.equal(def?.tableKey, "protokoll_tops");
    assert.equal(def?.tableLabel, "TOP-Liste");
    assert.equal(typeof def?.loadStandardLayout, "function");
  });
}

module.exports = { runTableLayoutRegistryTests };
