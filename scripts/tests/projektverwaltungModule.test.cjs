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
  const coreShellActionsSource = read("src/renderer/app/coreShellActions.js");
  const coreShellButtonsSource = read("src/renderer/app/coreShellButtons.js");
  const coreShellLayoutSource = read("src/renderer/app/coreShellLayout.js");
  const coreShellHeaderBridgeSource = read("src/renderer/app/coreShellHeaderBridge.js");
  const coreShellKeyboardSource = read("src/renderer/app/coreShellKeyboard.js");
  const coreShellContextControlsSource = read("src/renderer/app/coreShellContextControls.js");
  const coreShellNavigationRuntimeSource = read("src/renderer/app/coreShellNavigationRuntime.js");
  const coreShellNavigationSource = read("src/renderer/app/coreShellNavigation.js");
  const coreShellStylesSource = read("src/renderer/app/coreShellStyles.js");
  const projectContextQuicklaneSource = read("src/renderer/ui/ProjectContextQuicklane.js");
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
    assert.equal(routerSource.includes("../modules/protokoll/index.js"), true);
    assert.equal(routerSource.includes("../views/TopsView.js"), false);
    assert.equal(routerSource.includes("showProjectWorkspace(projectId, options = {})"), true);
    assert.equal(routerSource.includes("ProjectWorkspaceScreen"), true);
    assert.equal(routerSource.includes("showProjects()"), true);
    assert.equal(routerSource.includes("showArchive()"), true);
    assert.equal(routerSource.includes("showTops(meetingId, projectId"), true);
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
        async openProjectProtocol(projectId) {
          routerCalls.push({ module: "protocol", projectId });
          return { ok: true, target: "tops", meetingId: "22" };
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

    const previousWindow = global.window;
    global.window = {
      bbmDb: {
        async meetingsListByProject(projectId) {
          assert.equal(projectId, "9");
          return {
            ok: true,
            list: [
              { id: "21", meeting_index: 1, is_closed: 1 },
              { id: "22", meeting_index: 2, is_closed: 0 },
            ],
          };
        },
      },
    };

    try {
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
      assert.deepEqual(routerCalls, [{ module: "protocol", projectId: "9" }]);

      const openedFirms = await screen.openProjectModule("projectFirms");
      assert.equal(openedFirms, true);
      assert.deepEqual(routerCalls, [
        { module: "protocol", projectId: "9" },
        { module: "projectFirms", projectId: "9" },
      ]);
    } finally {
      global.window = previousWindow;
    }
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
    assert.equal(formSource.includes("pdf.footerUseUserData"), false);
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
    assert.equal(mainSource.includes("bbm.useNewCompanyWorkflow"), false);
    assert.equal(mainSource.includes("useNewCompanyWorkflow"), false);
    assert.equal(mainSource.includes("uiMode"), false);
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
    assert.equal(coreShellSource.includes("coreShellLayout.js"), true);
    assert.equal(coreShellSource.includes("coreShellHeaderBridge.js"), true);
    assert.equal(coreShellSource.includes("coreShellKeyboard.js"), true);
    assert.equal(coreShellSource.includes("coreShellContextControls.js"), true);
    assert.equal(coreShellSource.includes("coreShellNavigationRuntime.js"), true);
    assert.equal(coreShellSource.includes("coreShellButtons.js"), true);
    assert.equal(coreShellSource.includes("createQuitActionButton"), true);
    assert.equal(coreShellSource.includes("injectCoreShellBaseStyles"), true);
    assert.equal(coreShellSource.includes("createCoreShellNavigationRouteDefs"), true);
    assert.equal(coreShellSource.includes("start()"), true);
    assert.equal(coreShellSource.includes("_initShell()"), true);
    assert.equal(coreShellSource.includes("_initUiOld"), false);
    assert.equal(coreShellSource.includes("_initUiNew"), false);
    assert.equal(coreShellSource.includes("uiMode"), false);
    assert.equal(coreShellSource.includes("_attachGlobalKeyHandling"), false);
    assert.equal(coreShellSource.includes("prepareCoreShellBody"), true);
    assert.equal(coreShellSource.includes("_prepareBody"), false);
    assert.equal(coreShellSource.includes("document.body.style"), false);
    assert.equal(coreShellSource.includes("readUseNewCompanyWorkflowFlag"), false);
    assert.equal(coreShellSource.includes("writeUseNewCompanyWorkflowFlag"), false);
    assert.equal(coreShellSource.includes("_injectBaseStyles"), false);
    assert.equal(coreShellSource.includes('shellNavigationRouteDefs'), true);
    assert.equal(coreShellSource.includes('contextualNavigationRouteDefs'), false);
    assert.equal(coreShellSource.includes('projectNavigationButtons'), false);
    assert.equal(coreShellSource.includes('Projekt- und Modul-Arbeitsbereiche werden im Projekt-Arbeitsbereich angezeigt'), false);
    assert.equal(coreShellSource.includes('Hilfe'), true);
    assert.equal(coreShellSource.includes('Beenden'), false);
    assert.equal(coreShellSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellSource.includes("createProjectModuleRouteDef"), false);
    assert.equal(coreShellSource.includes("getButton("), false);
    assert.equal(coreShellSource.includes("btnFirmsBase"), false);
    assert.equal(coreShellSource.includes("Beta: Firmen/Mitarbeiter v2"), false);
    assert.equal(coreShellSource.includes('window.bbmDb.appQuit'), false);
    assert.equal(coreShellSource.includes('btnQuit.textContent = "Beenden"'), false);
    assert.equal(coreShellSource.includes("const buttonsByKey = new Map"), false);
    assert.equal(coreShellSource.includes("const setActive ="), false);
    assert.equal(coreShellSource.includes("const runNavSafe ="), false);
    assert.equal(coreShellSource.includes("router.contentRoot"), true);
    assert.equal(coreShellSource.includes("router.onSectionChange"), true);
    assert.equal(coreShellSource.includes("registerCoreShellContextControls"), true);
    assert.equal(coreShellSource.includes("updateContextButtons"), true);
    assert.equal(coreShellSource.includes("btnParticipants"), false);
    assert.equal(coreShellSource.includes("bbm:header-refresh"), false);
    assert.equal(coreShellSource.includes("bbm:theme-refresh"), false);
    assert.equal(coreShellSource.includes("bbm:sticky-notice"), false);
    assert.equal(coreShellSource.includes("bbm:router-context"), false);
    assert.equal(coreShellSource.includes('document.addEventListener("keydown"'), false);
    assert.equal(coreShellSource.includes("_getHost"), false);
    assert.equal(coreShellSource.includes("data-bbm-sidebar"), false);
    assert.equal(coreShellSource.includes("host.append(headerEl, bodyRow)"), false);
    assert.equal(coreShellSource.includes("appendButtonGroup(topBox, projectNavigationButtons)"), false);
    assert.equal(coreShellSource.includes("for (const btn of projectNavigationButtons)"), false);
    assert.equal(coreShellSource.includes("replaceChildren"), false);
    assert.equal(coreShellSource.includes("Firmen (Stamm)"), false);
    assert.equal(coreShellSource.includes("Firmen (extern)"), false);
  });

  await run("Projektverwaltung: Core-Navigation bleibt fachfrei", () => {
    assert.equal(coreShellNavigationSource.includes("Start"), true);
    assert.equal(coreShellNavigationSource.includes("Projekte"), true);
    assert.equal(coreShellNavigationSource.includes("Firmen"), true);
    assert.equal(coreShellNavigationSource.includes("Einstellungen"), true);
    assert.equal(coreShellNavigationSource.includes("Hilfe"), false);
    assert.equal(coreShellNavigationSource.includes("Beenden"), false);
    assert.equal(coreShellNavigationSource.includes("Protokoll"), false);
    assert.equal(coreShellNavigationSource.includes("Ausgabe"), false);
    assert.equal(coreShellNavigationSource.includes("Audio"), false);
    assert.equal(coreShellNavigationSource.includes("Lizenz"), false);
  });

  await run("Projektverwaltung: coreShellLayout kapselt die reine Shell-Layout-Struktur", () => {
    assert.equal(coreShellLayoutSource.includes("export function createCoreShellLayout"), true);
    assert.equal(coreShellLayoutSource.includes("export function prepareCoreShellBody"), true);
    assert.equal(coreShellLayoutSource.includes("document.body.style.margin"), true);
    assert.equal(coreShellLayoutSource.includes("document.body.style.height"), true);
    assert.equal(coreShellLayoutSource.includes('data-bbm-sidebar'), true);
    assert.equal(coreShellLayoutSource.includes("host.append(headerEl, bodyRow)"), true);
    assert.equal(coreShellLayoutSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellLayoutSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellLayoutSource.includes("projectFirms"), false);
  });

  await run("Projektverwaltung: coreShellHeaderBridge kapselt die Header-/Router-Bridges", () => {
    assert.equal(
      coreShellHeaderBridgeSource.includes("export function registerCoreShellHeaderBridge"),
      true
    );
    assert.equal(coreShellHeaderBridgeSource.includes("router.openOutputMail"), true);
    assert.equal(coreShellHeaderBridgeSource.includes("router.openOutputPrint"), true);
    assert.equal(coreShellHeaderBridgeSource.includes("router.openClosedProtocolSelector"), true);
    assert.equal(coreShellHeaderBridgeSource.includes("router.refreshHeader"), true);
    assert.equal(coreShellHeaderBridgeSource.includes("bbm:header-refresh"), true);
    assert.equal(coreShellHeaderBridgeSource.includes("bbm:theme-refresh"), true);
    assert.equal(coreShellHeaderBridgeSource.includes("bbm:sticky-notice"), true);
    assert.equal(coreShellHeaderBridgeSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellHeaderBridgeSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellHeaderBridgeSource.includes("projectFirms"), false);
  });

  await run("Projektverwaltung: coreShellKeyboard kapselt das globale Keyboard-Handling", () => {
    assert.equal(
      coreShellKeyboardSource.includes("export function registerCoreShellKeyboardHandling"),
      true
    );
    assert.equal(coreShellKeyboardSource.includes('document.addEventListener("keydown"'), true);
    assert.equal(coreShellKeyboardSource.includes("Enter"), true);
    assert.equal(coreShellKeyboardSource.includes("Escape"), true);
    assert.equal(coreShellKeyboardSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellKeyboardSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellKeyboardSource.includes("projectFirms"), false);
  });

  await run("Projektverwaltung: coreShellContextControls kapselt die Teilnehmer-Kontextsteuerung", () => {
    assert.equal(
      coreShellContextControlsSource.includes("export function registerCoreShellContextControls"),
      true
    );
    assert.equal(coreShellContextControlsSource.includes("bbm:router-context"), true);
    assert.equal(
      coreShellContextControlsSource.includes("Bitte zuerst ein Projekt auswählen."),
      true
    );
    assert.equal(
      coreShellContextControlsSource.includes("Bitte zuerst eine Besprechung öffnen."),
      true
    );
    assert.equal(coreShellContextControlsSource.includes("setBtnEnabled(btnParticipants, false"), true);
    assert.equal(coreShellContextControlsSource.includes("setBtnEnabled(btnParticipants, true"), true);
    assert.equal(coreShellContextControlsSource.includes("hasProject"), true);
    assert.equal(coreShellContextControlsSource.includes("hasMeeting"), true);
    assert.equal(coreShellContextControlsSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellContextControlsSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellContextControlsSource.includes("projectFirms"), false);
  });

  await run("Projektverwaltung: coreShellNavigationRuntime kapselt die Navigation-Runtime-Helfer", () => {
    assert.equal(
      coreShellNavigationRuntimeSource.includes("export function createCoreShellNavigationRuntime"),
      true
    );
    assert.equal(coreShellNavigationRuntimeSource.includes("buttonsByKey"), true);
    assert.equal(coreShellNavigationRuntimeSource.includes("setActive"), true);
    assert.equal(coreShellNavigationRuntimeSource.includes("runNavSafe"), true);
    assert.equal(coreShellNavigationRuntimeSource.includes("Navigation fehlgeschlagen"), true);
    assert.equal(coreShellNavigationRuntimeSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellNavigationRuntimeSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellNavigationRuntimeSource.includes("projectFirms"), false);
  });

  await run("Projektverwaltung: coreShellButtons exportiert die Button-Helfer", () => {
    assert.equal(coreShellButtonsSource.includes("export function mkNavBtn"), true);
    assert.equal(coreShellButtonsSource.includes("export function mkActionBtn"), true);
    assert.equal(coreShellButtonsSource.includes("export function setBtnEnabled"), true);
    assert.equal(coreShellButtonsSource.includes("export function appendButtonGroup"), true);
    assert.equal(coreShellButtonsSource.includes("export function createScreenRouteButton"), true);
    assert.equal(coreShellButtonsSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellButtonsSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellButtonsSource.includes("projectFirms"), false);
  });

  await run("Projektverwaltung: coreShellNavigation exportiert die Core-Route-Definitionen", () => {
    assert.equal(
      coreShellNavigationSource.includes("export function createCoreShellNavigationRouteDefs(router)"),
      true
    );
    assert.equal(coreShellNavigationSource.includes('Start'), true);
    assert.equal(coreShellNavigationSource.includes('Projekte'), true);
    assert.equal(coreShellNavigationSource.includes('Firmen'), true);
    assert.equal(coreShellNavigationSource.includes('Einstellungen'), true);
    assert.equal(coreShellNavigationSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellNavigationSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellNavigationSource.includes("projectFirms"), false);
  });

  await run("Projektverwaltung: coreShellActions exportiert die Teilnehmer-Aktion", () => {
    assert.equal(
      coreShellActionsSource.includes(
        "export function createParticipantsActionButton({ router, mkActionBtn, runNavSafe } = {})"
      ),
      true
    );
    assert.equal(coreShellActionsSource.includes("Teilnehmer"), true);
    assert.equal(coreShellActionsSource.includes("openParticipantsModal"), true);
    assert.equal(coreShellActionsSource.includes("openParticipants"), true);
    assert.equal(coreShellActionsSource.includes("export function createQuitActionButton"), true);
    assert.equal(coreShellActionsSource.includes("appQuit"), true);
    assert.equal(coreShellActionsSource.includes("Beenden"), true);
    assert.equal(coreShellActionsSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellActionsSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellActionsSource.includes("projectFirms"), false);
  });

  await run("Projektverwaltung: coreShellStyles exportiert die Style-Injektion", () => {
    assert.equal(coreShellStylesSource.includes("export function injectCoreShellBaseStyles()"), true);
    assert.equal(coreShellStylesSource.includes('data-bbm-core-shell-styles="true"'), true);
    assert.equal(coreShellStylesSource.includes("--sidebar-active-bg"), true);
    assert.equal(coreShellStylesSource.includes("--btn-focus-ring"), true);
  });

  await run("Projektverwaltung: Druck-v2-Keys bleiben unberuehrt", () => {
    assert.equal(mainSource.includes("print.v2.pagePadLeftMm"), true);
    assert.equal(mainSource.includes("print.v2.pagePadRightMm"), true);
    assert.equal(mainSource.includes("print.v2.pagePadTopMm"), true);
    assert.equal(mainSource.includes("print.v2.pagePadBottomMm"), true);
    assert.equal(mainSource.includes("print.v2.footerReserveMm"), true);
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
    assert.equal(coreShellNavigationSource.includes('onClick: () => router.showProjects()'), true);
    assert.equal(mainSource.includes('btnProjects.textContent = "Projekte"'), false);
    assert.equal(mainSource.includes("PROJEKTVERWALTUNG_MODULE_ID"), false);
    assert.equal(moduleCatalogSource.includes("PROJEKTVERWALTUNG_MODULE_ID"), false);
  });

  await run("Projektverwaltung: ProjectContextQuicklane zeigt keinen Projektdaten-Textblock mehr", () => {
    assert.equal(projectContextQuicklaneSource.includes("Projektnummer"), false);
    assert.equal(projectContextQuicklaneSource.includes("Kurzbezeichnung"), false);
    assert.equal(projectContextQuicklaneSource.includes("Projekt-ID"), false);
    assert.equal(projectContextQuicklaneSource.includes("Meeting-ID"), false);
    assert.equal(projectContextQuicklaneSource.includes("contextMeta"), false);
  });

  await run("Projektverwaltung: ProjectContextQuicklane rendert den Protokoll-Filter in der Icon-Spalte", () => {
    assert.equal(projectContextQuicklaneSource.includes("TOP-Filter"), true);
    assert.equal(projectContextQuicklaneSource.includes("top-filter"), true);
    assert.equal(projectContextQuicklaneSource.includes("ToDo"), true);
    assert.equal(projectContextQuicklaneSource.includes("Beschluss"), true);
    assert.equal(projectContextQuicklaneSource.includes("filterSection"), true);
  });

  await run("Projektverwaltung: CoreShell nutzt updateContextButtons weiterhin im Start- und Nav-Flow", () => {
    assert.equal(coreShellSource.includes("registerCoreShellContextControls"), true);
    assert.equal(coreShellSource.includes("if (typeof updateContextButtons === \"function\")"), true);
    assert.equal(coreShellSource.includes("updateContextButtons();"), true);
  });

  await run("Projektverwaltung: Kontextsteuerung bleibt erhalten, auch ohne sichtbaren Teilnehmer-Button", () => {
    assert.equal(coreShellSource.includes("btnParticipants"), false);
    assert.equal(coreShellSource.includes("updateContextButtons"), true);
    assert.equal(coreShellActionsSource.includes("openParticipantsModal"), true);
    assert.equal(coreShellContextControlsSource.includes("registerCoreShellContextControls"), true);
    assert.equal(coreShellContextControlsSource.includes("setBtnEnabled(btnParticipants, false"), true);
    assert.equal(coreShellContextControlsSource.includes("setBtnEnabled(btnParticipants, true"), true);
  });
}

module.exports = { runProjektverwaltungModuleTests };
