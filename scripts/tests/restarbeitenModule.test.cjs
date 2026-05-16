const assert = require("node:assert/strict");
const fs = require("node:fs");
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
  });

  await run("Restarbeiten: Workscreen ist ueber Resolver aufloesbar", () => {
    const entry = restarbeitenModule.getRestarbeitenModuleEntry();
    const resolved = screenResolver.resolveModuleWorkScreenFromEntry(entry);
    assert.equal(typeof resolved, "function");
  });

  await run("ProjectWorkspaceScreen: Restarbeiten wird als Modul geoeffnet", async () => {
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

    assert.equal(await screen.openProjectModule("restarbeiten"), true);
    const restCall = calls.find((c) => c.type === "module" && c.moduleId === "restarbeiten");
    assert.equal(restCall.options.project.id, "22");
  });

  await run("M4 IPC/Preload: Restarbeiten-Lesewege vorhanden, keine Schreibwege", () => {
    const ipcPath = path.join(__dirname, "../../src/main/ipc/restarbeitenIpc.js");
    const mainPath = path.join(__dirname, "../../src/main/main.js");
    const preloadPath = path.join(__dirname, "../../src/main/preload.js");
    const ipc = fs.readFileSync(ipcPath, "utf8");
    const main = fs.readFileSync(mainPath, "utf8");
    const preload = fs.readFileSync(preloadPath, "utf8");

    assert.match(ipc, /restarbeiten:listByProject/);
    assert.match(ipc, /restarbeiten:getProjectSettings/);
    assert.match(main, /registerRestarbeitenIpc/);
    assert.match(preload, /restarbeitenListByProject/);
    assert.match(preload, /restarbeitenGetProjectSettings/);
    assert.doesNotMatch(ipc, /restarbeiten:create|restarbeiten:update|restarbeiten:delete/);
  });

  await run("M4 Screen-Grenzen: sync render, load-Methode, 4 Spalten, kein innerHTML-Datenbau", () => {
    const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
    const content = fs.readFileSync(screenPath, "utf8");

    assert.doesNotMatch(content, /async\s+render\s*\(/);
    assert.match(content, /render\s*\(/);
    assert.match(content, /async\s+load\s*\(/);
    assert.match(content, /Kein Projektkontext für Restarbeiten vorhanden\./);
    assert.match(content, /Restarbeiten werden geladen…/);
    assert.match(content, /Für dieses Projekt sind noch keine Restarbeiten vorhanden\./);
    assert.match(content, /Nr\. \/ Datum/);
    assert.match(content, /Verortung/);
    assert.match(content, /Restarbeit/);
    assert.match(content, /Status/);
    assert.doesNotMatch(content, /tr\.innerHTML|innerHTML\s*=\s*\[/);
    assert.doesNotMatch(content, /Diktat|Foto|Druck|Mail|Editbox|Neu|Löschen/);
  });

  await run("M4 ViewModel: Mapping fuer Anzeigezeilen", async () => {
    const vm = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/modules/restarbeiten/viewModel/restarbeitenListItems.js")
    );

    const item = vm.toRestarbeitenListItem({
      id: "x",
      running_number: 1,
      created_at: "2026-05-16",
      location_level_1: "Haus A",
      location_level_2: "EG",
      short_text: "Fenster",
      long_text: "nachstellen",
      item_class: "mangel",
      status: "geprueft_erledigt",
      due_date: "2026-05-20",
      responsible_label: "Firma Test",
    });

    assert.equal(item.numberLine, "#1");
    assert.equal(item.locationLine1, "Haus A / EG");
    assert.equal(item.workLine2, "nachstellen");
    assert.match(item.statusLine1, /Mangel/);
    assert.match(item.statusLine1, /geprüft erledigt/);
    assert.equal(item.statusLine2, "2026-05-20");
    assert.equal(item.statusLine3, "Firma Test");

    const fallback = vm.toRestarbeitenListItem({ item_class: "rest", status: "in_arbeit" });
    assert.match(fallback.statusLine1, /Rest/);
    assert.match(fallback.statusLine1, /in Arbeit/);
    assert.equal(fallback.statusLine3, "—");
    assert.equal(JSON.stringify(fallback).includes("undefined"), false);
  });
}

module.exports = { runRestarbeitenModuleTests };
