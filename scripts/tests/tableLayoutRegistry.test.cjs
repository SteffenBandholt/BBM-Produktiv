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
    assert.equal(modules.length, 3);
    assert.equal(modules[0].moduleId, "protokoll");
    assert.equal(modules[0].moduleLabel, "Protokoll");
    assert.equal(Array.isArray(modules[0].tables), true);
    assert.equal(modules[0].tables[0].tableKey, "protokoll_tops");
    assert.equal(modules[0].tables[0].tableLabel, "TOP-Liste");
    assert.equal(modules[0].tables[0].surfaceKey, "protokoll_tops");
    assert.equal(modules[0].tables[0].surfaceKind, "table");
    assert.equal(modules[0].tables[0].surfaceLabel, "TOP-Liste");
    assert.equal(modules[0].tables[0].tableKind, "content");
    assert.equal(modules[0].tables[0].editorEnabled, true);
    assert.equal(modules[0].tables[1].tableKey, "protokoll_participants");
    assert.equal(modules[0].tables[1].tableLabel, "Teilnehmerliste");
    assert.equal(modules[0].tables[1].surfaceKey, "protokoll_participants");
    assert.equal(modules[0].tables[1].surfaceKind, "table");
    assert.equal(modules[0].tables[1].surfaceLabel, "Teilnehmerliste");
    assert.equal(modules[0].tables[1].tableKind, "content");
    assert.equal(modules[0].tables[1].editorEnabled, true);
    const projectModule = modules.find((moduleDef) => moduleDef.moduleId === "projektverwaltung");
    assert.ok(projectModule, "projektverwaltung module missing");
    assert.equal(projectModule.moduleLabel, "Projektverwaltung");
    assert.equal(projectModule.tables[0].tableKey, "project_firms");
    assert.equal(projectModule.tables[0].tableLabel, "Projekt-Firmenliste");
    assert.equal(projectModule.tables[0].surfaceKey, "project_firms");
    assert.equal(projectModule.tables[0].surfaceKind, "table");
    assert.equal(projectModule.tables[0].surfaceLabel, "Projekt-Firmenliste");
    assert.equal(projectModule.tables[0].tableKind, "content");
    assert.equal(projectModule.tables[0].editorEnabled, true);
    const restarbeitenModule = modules.find((moduleDef) => moduleDef.moduleId === "restarbeiten");
    assert.ok(restarbeitenModule, "restarbeiten module missing");
    assert.equal(restarbeitenModule.moduleLabel, "Restarbeiten");
    assert.equal(restarbeitenModule.tables[0].tableKey, "restarbeiten_filter_meta");
    assert.equal(restarbeitenModule.tables[0].surfaceKey, "restarbeiten_filter_meta");
    assert.equal(restarbeitenModule.tables[0].surfaceKind, "filterBar");
    assert.equal(restarbeitenModule.tables[0].surfaceLabel, "Filterleiste Meta");
    assert.equal(restarbeitenModule.tables[0].tableKind, "control");
    assert.equal(restarbeitenModule.tables[0].editorEnabled, true);
    assert.equal(restarbeitenModule.tables[0].uiAvailable, true);
    assert.equal(restarbeitenModule.tables[0].pdfAvailable, false);

    assert.equal(Array.isArray(definitions), true);
    assert.equal(definitions.length, 4);
    assert.deepEqual(
      definitions.map((def) => def.tableKey),
      ["protokoll_tops", "protokoll_participants", "project_firms", "restarbeiten_filter_meta"]
    );
    assert.equal(definitions[0].moduleId, "protokoll");
    assert.equal(definitions[0].moduleLabel, "Protokoll");
    assert.equal(definitions[0].tableKey, "protokoll_tops");
    assert.equal(definitions[0].tableLabel, "TOP-Liste");
    assert.equal(definitions[0].surfaceKey, "protokoll_tops");
    assert.equal(definitions[0].surfaceKind, "table");
    assert.equal(definitions[0].surfaceLabel, "TOP-Liste");
    assert.equal(definitions[0].surfaceDescription, "Kalibrierbare Layout-Surface fuer die Protokoll-TOP-Liste.");
    assert.equal(Array.isArray(definitions[0].supportedOrientations), true);
    assert.equal(definitions[0].supportedOrientations.includes("portrait"), true);
    assert.equal(definitions[0].supportedOrientations.includes("landscape"), true);
    assert.equal(Array.isArray(definitions[0].editFields), true);
    assert.equal(definitions[0].editFields[0].type, "gridTrack");
    assert.equal(definitions[0].editFields[0].required, true);
    assert.equal(definitions[0].editFields[0].path, "ui.rootVars.--bbm-tops-list-number-col");
    const labelTopField = definitions[0].editFields.find((field) => field?.path === "labels.top");
    assert.ok(labelTopField, "labels.top edit field missing");
    assert.equal(labelTopField.type, "headingText");
    assert.equal(labelTopField.required, true);
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
    const participantsDef = definitions.find((def) => def.tableKey === "protokoll_participants");
    assert.ok(participantsDef, "protokoll_participants definition missing");
    assert.equal(participantsDef.moduleId, "protokoll");
    assert.equal(participantsDef.tableLabel, "Teilnehmerliste");
    assert.equal(participantsDef.surfaceKey, "protokoll_participants");
    assert.equal(participantsDef.surfaceKind, "table");
    assert.equal(participantsDef.surfaceLabel, "Teilnehmerliste");
    assert.equal(participantsDef.tableKind, "content");
    assert.equal(participantsDef.editorEnabled, true);
    assert.equal(participantsDef.uiAvailable, true);
    assert.equal(participantsDef.pdfAvailable, true);
    assert.equal(participantsDef.uiProductive, false);
    assert.equal(participantsDef.pdfProductive, false);
    assert.equal(Array.isArray(participantsDef.columns), true);
    assert.equal(participantsDef.columns.length, 5);
    assert.equal(participantsDef.columns[0].label, "Name");
    assert.equal(participantsDef.columns[3].label, "Telefon / E-Mail");
    assert.equal(participantsDef.columns[4].label, "Anwesend / Verteiler");
    assert.equal(Array.isArray(participantsDef.previewData), true);
    assert.equal(participantsDef.previewData[0].name, "Max Muster");
    assert.equal(Array.isArray(participantsDef.previewData[0].contact), true);
    assert.equal(participantsDef.previewData[0].contact.length, 2);
    assert.equal(Array.isArray(participantsDef.previewData[0].attendance), true);
    assert.equal(participantsDef.previewData[0].attendance.length, 2);
    assert.equal(typeof participantsDef.defaultLayout?.tableKey, "string");
    assert.equal(participantsDef.defaultLayout?.tableKey, "protokoll_participants");
    assert.equal(typeof participantsDef.defaultLayout?.variant, "string");
    assert.equal(participantsDef.defaultLayout?.variant, "portrait");
    const projectFirmsDef = definitions.find((def) => def.tableKey === "project_firms");
    assert.ok(projectFirmsDef, "project_firms definition missing");
    assert.equal(projectFirmsDef.moduleId, "projektverwaltung");
    assert.equal(projectFirmsDef.tableLabel, "Projekt-Firmenliste");
    assert.equal(projectFirmsDef.surfaceKey, "project_firms");
    assert.equal(projectFirmsDef.surfaceKind, "table");
    assert.equal(projectFirmsDef.surfaceLabel, "Projekt-Firmenliste");
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
    const restarbeitenDef = definitions.find((def) => def.tableKey === "restarbeiten_filter_meta");
    assert.ok(restarbeitenDef, "restarbeiten_filter_meta definition missing");
    assert.equal(restarbeitenDef.moduleId, "restarbeiten");
    assert.equal(restarbeitenDef.tableLabel, "Filterleiste Meta");
    assert.equal(restarbeitenDef.surfaceKey, "restarbeiten_filter_meta");
    assert.equal(restarbeitenDef.surfaceKind, "filterBar");
    assert.equal(restarbeitenDef.surfaceLabel, "Filterleiste Meta");
    assert.equal(restarbeitenDef.tableKind, "control");
    assert.equal(restarbeitenDef.editorEnabled, true);
    assert.equal(restarbeitenDef.uiAvailable, true);
    assert.equal(restarbeitenDef.pdfAvailable, false);
    assert.equal(restarbeitenDef.uiProductive, true);
    assert.equal(restarbeitenDef.pdfProductive, false);
    assert.equal(Array.isArray(restarbeitenDef.columns), true);
    assert.equal(restarbeitenDef.columns.length, 0);
    assert.equal(Array.isArray(restarbeitenDef.editFields), true);
    assert.equal(restarbeitenDef.editFields[0].path, "ui.rootVars.--bbm-restarbeiten-meta-due-width");
    assert.equal(restarbeitenDef.defaultLayout?.ui?.rootVars?.["--bbm-restarbeiten-meta-due-width"], "minmax(0, 1fr)");
  });

  await run("TableLayoutRegistry: getTableLayoutDefinition findet den Pilot", () => {
    const def = getTableLayoutDefinition({ moduleId: "protokoll", tableKey: "protokoll_tops" });
    assert.equal(def?.moduleId, "protokoll");
    assert.equal(def?.moduleLabel, "Protokoll");
    assert.equal(def?.tableKey, "protokoll_tops");
    assert.equal(def?.tableLabel, "TOP-Liste");
    assert.equal(def?.surfaceKey, "protokoll_tops");
    assert.equal(def?.surfaceKind, "table");
    assert.equal(def?.surfaceLabel, "TOP-Liste");
    assert.equal(typeof def?.loadStandardLayout, "function");

    const participantsDef = getTableLayoutDefinition({ moduleId: "protokoll", tableKey: "protokoll_participants" });
    assert.equal(participantsDef?.moduleId, "protokoll");
    assert.equal(participantsDef?.tableLabel, "Teilnehmerliste");
    assert.equal(participantsDef?.surfaceKey, "protokoll_participants");
    assert.equal(participantsDef?.surfaceKind, "table");
    assert.equal(participantsDef?.surfaceLabel, "Teilnehmerliste");
    assert.equal(participantsDef?.tableKind, "content");
    assert.equal(participantsDef?.editorEnabled, true);
    assert.equal(typeof participantsDef?.loadStandardLayout, "function");

    const restarbeitenDef = getTableLayoutDefinition({ moduleId: "restarbeiten", tableKey: "restarbeiten_filter_meta" });
    assert.equal(restarbeitenDef?.moduleId, "restarbeiten");
    assert.equal(restarbeitenDef?.moduleLabel, "Restarbeiten");
    assert.equal(restarbeitenDef?.tableKey, "restarbeiten_filter_meta");
    assert.equal(restarbeitenDef?.tableLabel, "Filterleiste Meta");
    assert.equal(restarbeitenDef?.surfaceKey, "restarbeiten_filter_meta");
    assert.equal(restarbeitenDef?.surfaceKind, "filterBar");
    assert.equal(restarbeitenDef?.surfaceLabel, "Filterleiste Meta");
    assert.equal(restarbeitenDef?.tableKind, "control");
    assert.equal(restarbeitenDef?.editorEnabled, true);
    assert.equal(restarbeitenDef?.uiAvailable, true);
    assert.equal(restarbeitenDef?.pdfAvailable, false);
    assert.equal(typeof restarbeitenDef?.loadStandardLayout, "function");
  });
}

module.exports = { runTableLayoutRegistryTests };
