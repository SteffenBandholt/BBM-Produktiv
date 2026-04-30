const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function runProjektverwaltungModuleTests(run) {
  const [
    {
      getProjektverwaltungModuleEntry,
      PROJEKTVERWALTUNG_MODULE_ID,
      ProjectsScreen,
      ProjectWorkspaceScreen,
    },
    { resolveModuleScreenFromEntry },
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/projektverwaltung/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")),
  ]);

  const moduleCatalogSource = read("src/renderer/app/modules/moduleCatalog.js");
  const routerSource = read("src/renderer/app/Router.js");
  const mainSource = read("src/renderer/main.js");
  const coreShellSource = read("src/renderer/app/CoreShell.js");
  const projectsSource = read("src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js");
  const workspaceSource = read("src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js");
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
    assert.equal(routerSource.includes("showProjectWorkspace(projectId, options = {})"), true);
    assert.equal(routerSource.includes("ProjectWorkspaceScreen"), true);
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

  await run("Projektverwaltung: Projekt-Arbeitsbereich ist exportiert und beschraenkt die Module", async () => {
    assert.equal(typeof ProjectWorkspaceScreen, "function");
    assert.equal(workspaceSource.includes("export default class ProjectWorkspaceScreen"), true);
    assert.equal(workspaceSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(workspaceSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(workspaceSource.includes("Zur Projektliste"), true);
    assert.equal(workspaceSource.includes("showProjectsList"), true);
    assert.equal(workspaceSource.includes("Projekt konnte nicht gefunden werden."), true);
    assert.equal(workspaceSource.includes("Ausgabe"), false);
    assert.equal(workspaceSource.includes("Audio"), false);
    assert.equal(workspaceSource.includes("Lizenzierung"), false);
    assert.equal(workspaceSource.includes("Settings"), false);
    assert.equal(workspaceSource.includes("Updates"), false);
    assert.equal(workspaceSource.includes("Backup"), false);
    assert.equal(workspaceSource.includes("Diagnose"), false);

    const routerCalls = [];
    const screen = new ProjectWorkspaceScreen({
      router: {
        currentProjectId: "9",
        async showTops(meetingId, projectId) {
          routerCalls.push({ meetingId, projectId });
        },
        async showProjectFirms(projectId) {
          routerCalls.push({ module: "projectFirms", projectId });
        },
      },
      projectId: "9",
      project: {
        id: "9",
        project_number: "P-12",
        short: "Rohbau",
        name: "Rohbau Nord",
      },
      projectModules: [
        {
          moduleId: "protokoll",
          label: "Protokoll",
          description: "Protokoll im aktuellen Projekt öffnen.",
        },
        {
          moduleId: "projectFirms",
          label: "Projektfirmen",
          description: "Projektbezogene Firmen und Mitarbeiter im aktuellen Projekt öffnen.",
        },
      ],
    });

    const modules = screen.getAvailableProjectModules();
    assert.deepEqual(
      modules.map((item) => item.moduleId),
      ["protokoll", "projectFirms"]
    );
    assert.deepEqual(
      modules.map((item) => item.label),
      ["Protokoll", "Projektfirmen"]
    );
    assert.equal(screen.getProjectDisplayText(), "P-12 - Rohbau");

    const opened = await screen.openProjectModule("protokoll");
    assert.equal(opened, true);
    assert.deepEqual(routerCalls, [{ meetingId: null, projectId: "9" }]);

    const openedFirms = await screen.openProjectModule("projectFirms");
    assert.equal(openedFirms, true);
    assert.deepEqual(routerCalls, [
      { meetingId: null, projectId: "9" },
      { module: "projectFirms", projectId: "9" },
    ]);
  });

  await run("Projektverwaltung: Projektanzeige ist robust und Projektliste-Button nutzt showProjects", async () => {
    const calls = [];
    const screen = new ProjectWorkspaceScreen({
      router: {
        currentProjectId: "77",
        async showProjects() {
          calls.push("showProjects");
        },
      },
      projectId: "77",
      project: {
        id: "77",
        projectNumber: "X-77",
        project_name: "Umbau Schule",
      },
    });

    assert.equal(screen.getProjectDisplayText(), "X-77 - Umbau Schule");

    const opened = await screen.showProjectsList();
    assert.equal(opened, true);
    assert.deepEqual(calls, ["showProjects"]);
  });

  await run("Projektverwaltung: Projektdaten werden bei fehlendem Projekt weiter ueber projectsList geladen", async () => {
    const previousWindow = global.window;
    let listCalls = 0;
    global.window = {
      bbmDb: {
        async projectsList() {
          listCalls += 1;
          return {
            ok: true,
            list: [{ id: "4", project_number: "P-4", short: "Nord" }],
          };
        },
      },
    };

    try {
      const screen = new ProjectWorkspaceScreen({
        router: { currentProjectId: "4" },
        projectId: "4",
      });

      const loaded = await screen._loadProject();
      assert.equal(listCalls, 1);
      assert.equal(loaded?.id, "4");
      assert.equal(screen.projectMissing, false);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: nicht gefundenes Projekt wird klar markiert", async () => {
    const previousWindow = global.window;
    global.window = {
      bbmDb: {
        async projectsList() {
          return {
            ok: true,
            list: [{ id: "1", project_number: "P-1", short: "Sued" }],
          };
        },
      },
    };

    try {
      const screen = new ProjectWorkspaceScreen({
        router: { currentProjectId: "404" },
        projectId: "404",
      });

      const loaded = await screen._loadProject();
      assert.equal(loaded, null);
      assert.equal(screen.projectMissing, true);
      assert.equal(screen.getProjectDisplayText(), "#404");
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: Projektklick öffnet den Arbeitsbereich statt direkt Tops", async () => {
    const calls = [];
    const previousWindow = global.window;
    global.window = {
      localStorage: {
        setItem() {},
      },
    };

    try {
      const screen = new ProjectsScreen({
        router: {
          currentProjectId: null,
          currentMeetingId: null,
          async showProjectWorkspace(projectId, options) {
            calls.push({ projectId, options });
          },
        },
      });

      screen.projects = [
        {
          id: "17",
          short: "Projekt A",
          name: "Projekt A",
          project_number: "17",
        },
      ];

      const result = await screen.openProjectById("17");
      assert.equal(result, true);
      assert.deepEqual(calls, [
        {
          projectId: "17",
          options: {
            project: {
              id: "17",
              short: "Projekt A",
              name: "Projekt A",
              project_number: "17",
            },
          },
        },
      ]);
      assert.equal(projectsSource.includes("showProjectWorkspace(project.id, { project })"), true);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: neue Screen-Dateien enthalten die Implementierung", () => {
    assert.equal(projectsSource.includes("export default class ProjectsScreen"), true);
    assert.equal(workspaceSource.includes("export default class ProjectWorkspaceScreen"), true);
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

  await run("Projektverwaltung: Core-Sidebar bleibt frei von Fachmodulen", () => {
    assert.equal(mainSource.includes("new CoreShell"), true);
    assert.equal(mainSource.includes("applyThemeForSettings(DEFAULT_THEME_SETTINGS)"), true);
    assert.equal(mainSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(mainSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(mainSource.includes("createProjectModuleRouteDef"), false);
    assert.equal(mainSource.includes("btnProjects.textContent"), false);
    assert.equal(mainSource.includes("renderMachineSetupLicenseRequired();"), false);
    assert.equal(mainSource.includes("if (await isMachineSetupWithoutLicense())"), false);
    assert.equal(mainSource.includes("isMachineSetupWithoutLicense"), false);
    assert.equal(mainSource.includes("renderMachineSetupLicenseRequired"), false);
    assert.equal(mainSource.includes("renderMachineSetupLicenseFallback"), false);
    assert.equal(mainSource.includes("buildMachineSetupLicenseMailBody"), false);
    assert.equal(mainSource.includes("buildMachineSetupLicenseMailtoUri"), false);
    assert.equal(mainSource.includes("MACHINE_SETUP_LICENSE"), false);
  });

  await run("Projektverwaltung: CoreShell enthaelt die Core-Navigation und keine Fachmodule", () => {
    assert.equal(coreShellSource.includes("export default class CoreShell"), true);
    assert.equal(coreShellSource.includes('shellNavigationRouteDefs'), true);
    assert.equal(coreShellSource.includes('Start'), true);
    assert.equal(coreShellSource.includes('Projekte'), true);
    assert.equal(coreShellSource.includes('Firmen'), true);
    assert.equal(coreShellSource.includes('Einstellungen'), true);
    assert.equal(coreShellSource.includes('Hilfe'), true);
    assert.equal(coreShellSource.includes('Beenden'), true);
    assert.equal(coreShellSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellSource.includes("createProjectModuleRouteDef"), false);
    assert.equal(coreShellSource.includes("getButton("), false);
    assert.equal(coreShellSource.includes("btnFirmsBase"), false);
    assert.equal(coreShellSource.includes("replaceChildren"), false);
    assert.equal(coreShellSource.includes("Firmen (Stamm)"), false);
    assert.equal(coreShellSource.includes("Firmen (extern)"), false);
  });

  await run("Projektverwaltung: Projekt-Arbeitsbereich bleibt Modul-Andockpunkt", () => {
    assert.equal(workspaceSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(workspaceSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(workspaceSource.includes("Arbeitsbereiche im Projekt"), true);
    assert.equal(workspaceSource.includes("keine Arbeitsmodule freigeschaltet"), true);
    assert.equal(workspaceSource.includes("const PROJECT_MODULES"), false);
  });

  await run("Projektverwaltung: Router stellt die Projekt-Arbeitsbereiche bereit", () => {
    assert.equal(routerSource.includes("_getProjectWorkspaceModules"), true);
    assert.equal(routerSource.includes("getActiveProjectModuleNavigation"), true);
    assert.equal(routerSource.includes("projectModules: this._getProjectWorkspaceModules()"), true);
    assert.equal(routerSource.includes('moduleId: "projectFirms"'), true);
    assert.equal(routerSource.includes("Projektbezogene Firmen und Mitarbeiter im aktuellen Projekt öffnen."), true);
  });

  await run("Projektverwaltung: bestehender Projekte-Einstieg bleibt der einzige Sidebar-Einstieg", () => {
    assert.equal(coreShellSource.includes('onClick: () => router.showProjects()'), true);
    assert.equal(mainSource.includes('btnProjects.textContent = "Projekte"'), false);
    assert.equal(mainSource.includes("PROJEKTVERWALTUNG_MODULE_ID"), false);
    assert.equal(moduleCatalogSource.includes("PROJEKTVERWALTUNG_MODULE_ID"), false);
  });
}

module.exports = { runProjektverwaltungModuleTests };
