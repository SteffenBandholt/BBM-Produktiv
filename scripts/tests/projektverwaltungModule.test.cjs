const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runProjektverwaltungModuleTests(run) {
  await run("Projektverwaltung: Router importiert die Screen-Klassen aus dem Modulpfad", () => {
    const routerSource = read("src/renderer/app/Router.js");
    assert.equal(routerSource.includes("../modules/projektverwaltung/index.js"), true);
    assert.equal(routerSource.includes("../views/ProjectsView.js"), false);
    assert.equal(routerSource.includes("../views/ProjectFormView.js"), false);
    assert.equal(routerSource.includes("../views/ArchiveView.js"), false);
  });

  await run("Projektverwaltung: neue Screen-Dateien enthalten die Implementierung", () => {
    const projectsSource = read("src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js");
    const formSource = read("src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js");
    const archiveSource = read("src/renderer/modules/projektverwaltung/screens/ArchiveScreen.js");

    assert.equal(projectsSource.includes("export default class ProjectsScreen"), true);
    assert.equal(projectsSource.includes("../../../ui/popupButtonStyles.js"), true);
    assert.equal(formSource.includes("export default class ProjectFormScreen"), true);
    assert.equal(formSource.includes("../../../ui/popupButtonStyles.js"), true);
    assert.equal(archiveSource.includes("export default class ArchiveScreen"), true);
    assert.equal(archiveSource.includes("../../../ui/popupButtonStyles.js"), true);
  });

  await run("Projektverwaltung: alte View-Dateien bleiben nur als Compatibility-Re-Exports", () => {
    const projectsViewSource = read("src/renderer/views/ProjectsView.js");
    const formViewSource = read("src/renderer/views/ProjectFormView.js");
    const archiveViewSource = read("src/renderer/views/ArchiveView.js");

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
}

module.exports = { runProjektverwaltungModuleTests };
