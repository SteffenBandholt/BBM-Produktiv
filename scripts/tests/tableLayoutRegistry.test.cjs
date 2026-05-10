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
    assert.equal(modules.length >= 2, true);
    assert.equal(modules[0].moduleId, "protokoll");
    assert.equal(modules[0].moduleLabel, "Protokoll");
    assert.equal(Array.isArray(modules[0].tables), true);
    assert.equal(modules[0].tables[0].tableKey, "protokoll_tops");
    assert.equal(modules[0].tables[0].tableLabel, "TOP-Liste");
    assert.equal(modules[0].tables[0].tableKind, "content");
    assert.equal(modules[0].tables[0].editorEnabled, true);
    const projectModule = modules.find((moduleDef) => moduleDef.moduleId === "projektverwaltung");
    assert.ok(projectModule, "projektverwaltung module missing");
    assert.equal(projectModule.moduleLabel, "Projektverwaltung");
    assert.equal(projectModule.tables[0].tableKey, "project_firms");
    assert.equal(projectModule.tables[0].tableLabel, "Projekt-Firmenliste");
    assert.equal(projectModule.tables[0].tableKind, "content");
    assert.equal(projectModule.tables[0].editorEnabled, true);

    assert.equal(Array.isArray(definitions), true);
    assert.equal(definitions.length >= 2, true);
    assert.equal(definitions[0].moduleId, "protokoll");
    assert.equal(definitions[0].moduleLabel, "Protokoll");
    assert.equal(definitions[0].tableKey, "protokoll_tops");
    assert.equal(definitions[0].tableLabel, "TOP-Liste");
    assert.equal(Array.isArray(definitions[0].supportedOrientations), true);
    assert.equal(definitions[0].supportedOrientations.includes("portrait"), true);
    assert.equal(definitions[0].supportedOrientations.includes("landscape"), true);
    assert.equal(Array.isArray(definitions[0].editFields), true);
    assert.equal(definitions[0].editFields[0].type, "gridTrack");
    assert.equal(definitions[0].editFields[0].required, true);
    assert.equal(definitions[0].editFields[0].path, "ui.rootVars.--bbm-tops-list-number-col");
    assert.equal(definitions[0].editFields[6].type, "headingText");
    assert.equal(definitions[0].editFields[6].required, true);
    assert.equal(definitions[0].editFields[6].path, "labels.top");
    assert.equal(Array.isArray(definitions[0].previewData), true);
    assert.equal(definitions[0].previewData.length >= 3, true);
    assert.equal(definitions[0].previewData[0].topNumber, "1");
    assert.equal(definitions[0].previewData[1].topNumber, "1.1");
    assert.equal(definitions[0].defaultLayout?.tableKey, "protokoll_tops");
    assert.equal(definitions[0].defaultLayout?.variant, "portrait");
    assert.equal(definitions[0].tableKind, "content");
    assert.equal(definitions[0].editorEnabled, true);
    assert.equal(definitions[0].uiAvailable, true);
    assert.equal(definitions[0].pdfAvailable, true);
    assert.equal(definitions[0].uiProductive, true);
    assert.equal(definitions[0].pdfProductive, true);
    assert.equal(Array.isArray(definitions[0].columns), true);
    assert.equal(definitions[0].columns[0].key, "topNumber");
    assert.equal(definitions[0].columns[1].label, "Gegenstand");
    const projectFirmsDef = definitions.find((def) => def.tableKey === "project_firms");
    assert.ok(projectFirmsDef, "project_firms definition missing");
    assert.equal(projectFirmsDef.moduleId, "projektverwaltung");
    assert.equal(projectFirmsDef.tableLabel, "Projekt-Firmenliste");
    assert.equal(projectFirmsDef.tableKind, "content");
    assert.equal(projectFirmsDef.editorEnabled, true);
    assert.equal(projectFirmsDef.uiAvailable, true);
    assert.equal(projectFirmsDef.pdfAvailable, true);
    assert.equal(projectFirmsDef.uiProductive, true);
    assert.equal(projectFirmsDef.pdfProductive, false);
    assert.equal(Array.isArray(projectFirmsDef.columns), true);
    assert.equal(projectFirmsDef.columns.length, 3);
    assert.equal(projectFirmsDef.columns[0].label, "Kurzbez.");
    assert.equal(projectFirmsDef.previewData[0].shortName, "AB");
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
