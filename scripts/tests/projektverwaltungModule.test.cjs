const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runProjektverwaltungModuleTests(run) {
  const [
    { getProjektverwaltungModuleEntry, PROJEKTVERWALTUNG_MODULE_ID, ProjectsScreen },
    { resolveModuleScreenFromEntry },
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/projektverwaltung/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")),
  ]);

  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
  const routerSource = read("src/renderer/app/Router.js");
  const mainSource = read("src/renderer/main.js");
  const projectsSource = read("src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js");
  const formSource = read("src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js");
  const archiveSource = read("src/renderer/modules/projektverwaltung/screens/ArchiveScreen.js");
  const projectsViewSource = read("src/renderer/views/ProjectsView.js");
  const formViewSource = read("src/renderer/views/ProjectFormView.js");
  const archiveViewSource = read("src/renderer/views/ArchiveView.js");

  await run("Projektverwaltung: Router importiert die Screen-Klassen aus dem Modulpfad", () => {
    assert.equal(routerSource.includes("../modules/projektverwaltung/index.js"), true);
    assert.equal(routerSource.includes("../views/ProjectsView.js"), false);
    assert.equal(routerSource.includes("../views/ProjectFormView.js"), false);
    assert.equal(routerSource.includes("../views/ArchiveView.js"), false);
  });

  await run("Projektverwaltung: Modul ist im Resolver vorhanden, aber nicht im Katalog", () => {
    const entry = getProjektverwaltungModuleEntry();
    const resolved = resolveModuleScreenFromEntry(entry, entry.workScreenId);

    assert.equal(moduleCatalogSource.includes("getProjektverwaltungModuleEntry"), false);
    assert.equal(moduleCatalogSource.includes("PROJEKTVERWALTUNG_MODULE_ID"), false);
    assert.equal(moduleCatalogSource.includes("getProtokollModuleEntry"), true);
    assert.equal(PROJEKTVERWALTUNG_MODULE_ID, "projektverwaltung");
    assert.equal(typeof ProjectsScreen, "function");
    assert.equal(entry.moduleId, "projektverwaltung");
    assert.equal(entry.moduleLabel, "Projektverwaltung");
    assert.equal(
      resolved === ProjectsScreen,
      true
    );
    assert.equal(typeof resolved, "function");
    assert.equal(typeof resolveModuleScreenFromEntry(entry, "projects"), "function");
  });

  await run("Projektverwaltung: neue Screen-Dateien enthalten die Implementierung", () => {
    assert.equal(projectsSource.includes("export default class ProjectsScreen"), true);
    assert.equal(projectsSource.includes("../../../ui/popupButtonStyles.js"), true);
    assert.equal(formSource.includes("export default class ProjectFormScreen"), true);
    assert.equal(formSource.includes("../../../ui/popupButtonStyles.js"), true);
    assert.equal(archiveSource.includes("export default class ArchiveScreen"), true);
    assert.equal(archiveSource.includes("../../../ui/popupButtonStyles.js"), true);
  });

  await run("Projektverwaltung: alte View-Dateien bleiben nur als Compatibility-Re-Exports", () => {
    assert.equal(
      projectsViewSource.trim(),
      'export { default } from "../modules/projektverwaltung/screens/ProjectsScreen.js";'
    );
    assert.equal(
      formViewSource.trim(),
      'export { default } from "../modules/projektverwaltung/screens/ProjectFormScreen.js";'
    );
    assert.equal(
      archiveViewSource.trim(),
      'export { default } from "../modules/projektverwaltung/screens/ArchiveScreen.js";'
    );
  });

  await run("Projektverwaltung: bestehender Projekte-Einstieg bleibt der einzige Sidebar-Einstieg", () => {
    assert.equal(mainSource.includes('btnProjects.textContent = "Projekte"'), true);
    assert.equal(mainSource.includes('onClick: () => router.showProjects()'), true);
    assert.equal(mainSource.includes("PROJEKTVERWALTUNG_MODULE_ID"), false);
    assert.equal(moduleCatalogSource.includes("PROJEKTVERWALTUNG_MODULE_ID"), false);
  });
}

module.exports = { runProjektverwaltungModuleTests };
