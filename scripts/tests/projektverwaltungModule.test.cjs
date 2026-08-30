const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

function createFakeDocumentWithBubbling() {
  const createNode = (tag, doc) => {
    const listeners = {};
    const node = {
      tagName: String(tag || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentNode: null,
      style: {
        setProperty(name, value) {
          this[String(name)] = String(value);
        },
      },
      dataset: {},
      className: "",
      textContent: "",
      disabled: false,
      readOnly: false,
      value: "",
      checked: false,
      tabIndex: 0,
      append(...nodes) {
        for (const child of nodes) {
          if (!child) continue;
          child.parentNode = this;
          this.children.push(child);
        }
      },
      appendChild(nodeChild) {
        if (nodeChild) {
          nodeChild.parentNode = this;
          this.children.push(nodeChild);
        }
        return nodeChild;
      },
      replaceChildren(...nodes) {
        this.children = [];
        this.append(...nodes);
      },
      setAttribute(name, value) {
        this[String(name)] = String(value);
      },
      getAttribute(name) {
        const v = this[String(name)];
        return v === undefined ? null : v;
      },
      addEventListener(type, handler) {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(handler);
      },
      async dispatchEvent(eventInput) {
        const event = typeof eventInput === "string" ? { type: eventInput } : (eventInput || {});
        if (!event.type) event.type = "click";
        if (event.target == null) event.target = this;
        event.currentTarget = this;
        event.defaultPrevented = !!event.defaultPrevented;
        event._stopped = !!event._stopped;
        event._immediateStopped = !!event._immediateStopped;
        event.preventDefault = () => {
          event.defaultPrevented = true;
        };
        event.stopPropagation = () => {
          event._stopped = true;
        };
        event.stopImmediatePropagation = () => {
          event._stopped = true;
          event._immediateStopped = true;
        };

        for (const handler of listeners[event.type] || []) {
          await handler.call(this, event);
          if (event._immediateStopped) break;
        }

        if (!event._stopped && this.parentNode) {
          return await this.parentNode.dispatchEvent(event);
        }

        return event;
      },
      async click() {
        return await this.dispatchEvent({ type: "click" });
      },
      focus() {
        doc.activeElement = this;
      },
      contains(target) {
        if (target === this) return true;
        for (const child of this.children || []) {
          if (child === target) return true;
          if (child && typeof child.contains === "function" && child.contains(target)) return true;
        }
        return false;
      },
      querySelectorAll(selector) {
        const result = [];
        const wantProjectAction = String(selector || "").includes("data-project-action");
        const wantProjectCard = String(selector || "").includes("data-project-card");
        const wantRail = String(selector || "").includes("data-project-action-rail");
        const walk = (nodeToWalk) => {
          if (!nodeToWalk) return;
          if (wantProjectAction && nodeToWalk.dataset?.projectAction) result.push(nodeToWalk);
          if (wantProjectCard && nodeToWalk.dataset?.projectCard) result.push(nodeToWalk);
          if (wantRail && nodeToWalk.dataset?.projectActionRail) result.push(nodeToWalk);
          for (const child of nodeToWalk.children || []) walk(child);
        };
        walk(this);
        return result;
      },
    };

    Object.defineProperty(node, "innerHTML", {
      configurable: true,
      enumerable: true,
      get() {
        return this._innerHTML || "";
      },
      set(value) {
        this._innerHTML = String(value || "");
        this.children = [];
      },
    });

    return node;
  };

  const doc = {
    activeElement: null,
    createElement(tag) {
      return createNode(tag, doc);
    },
    createElementNS(_ns, tag) {
      return createNode(tag, doc);
    },
    addEventListener() {},
    removeEventListener() {},
  };
  doc.body = createNode("body", doc);
  return doc;
}

function findNode(root, predicate) {
  const stack = [root];
  while (stack.length) {
    const node = stack.shift();
    if (predicate(node)) return node;
    for (const child of node?.children || []) {
      stack.push(child);
    }
  }
  return null;
}

function findNodes(root, predicate) {
  const matches = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.shift();
    if (predicate(node)) matches.push(node);
    for (const child of node?.children || []) {
      stack.push(child);
    }
  }
  return matches;
}

function collectText(root) {
  const stack = [root];
  const parts = [];
  while (stack.length) {
    const node = stack.shift();
    if (!node) continue;
    if (typeof node.textContent === "string" && node.textContent.trim()) {
      parts.push(node.textContent.trim());
    }
    for (const child of node?.children || []) {
      stack.push(child);
    }
  }
  return parts.join(" ");
}

async function runProjektverwaltungModuleTests(run) {
  const [
    {
      getProjektverwaltungModuleEntry,
      PROJEKTVERWALTUNG_MODULE_ID,
      ProjectsScreen,
      ArchiveScreen,
      ProjectWorkspaceScreen,
    },
    { resolveModuleScreenFromEntry },
    { getActiveProjectModuleNavigation },
  ] = await Promise.all([
    importEsmFromFile(path.join(__dirname, "../../src/renderer/modules/projektverwaltung/index.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleEntryScreenResolver.js")),
    importEsmFromFile(path.join(__dirname, "../../src/renderer/app/modules/moduleNavigation.js")),
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
  const mainHeaderSource = read("src/renderer/ui/MainHeader.js");
  const restarbeitenScreenSource = read("src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js");
  const protokollScreenSource = read("src/renderer/modules/protokoll/screens/TopsScreen.js");
  const projectContextQuicklaneSource = read("src/renderer/ui/ProjectContextQuicklane.js");
  const projectFirmsViewSource = read("src/renderer/views/ProjectFirmsView.js");
  const firmsPoolViewSource = read("src/renderer/views/FirmsPoolView.js");
  const projectsSource = read("src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js");
  const workspaceSource = read("src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js");
  const formSource = read("src/renderer/modules/projektverwaltung/screens/ProjectFormScreen.js");
  const archiveSource = read("src/renderer/modules/projektverwaltung/screens/ArchiveScreen.js");
  const databaseSource = read("src/main/db/database.js");
  const projectsRepoSource = read("src/main/db/projectsRepo.js");
  const projectsIpcSource = read("src/main/ipc/projectsIpc.js");
  const preloadSource = read("src/main/preload.js");
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
    assert.equal(routerSource.includes("openProjectProtocol(projectId, options = {})"), true);
    assert.equal(routerSource.includes("showProjects()"), true);
    assert.equal(routerSource.includes("showArchive()"), true);
    assert.equal(routerSource.includes("showTops(meetingId, projectId"), true);
    assert.equal(routerSource.includes(".filter((entry) => this._isModuleActive(entry?.moduleId))"), true);
  });

  await run("Projektverwaltung: TopsView ist nicht mehr als aktive Screen-Datei vorhanden", () => {
    const topsViewPath = path.join(process.cwd(), "src/renderer/views/TopsView.js");
    assert.equal(fs.existsSync(topsViewPath), false);
    assert.equal(fs.existsSync(path.join(process.cwd(), "src/renderer/views/TopsScreen.js")), true);
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

  await run("Projektverwaltung: Legacy-Projekt-Arbeitsbereich bleibt isoliert", async () => {
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
          label: "Firmen im Projekt",
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
        ["Protokoll", "Firmen im Projekt"]
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

  await run("Projektverwaltung: sichtbare Firmenbegriffe sind klarer benannt", () => {
    assert.equal(projectFirmsViewSource.includes("Firmen im Projekt"), true);
    assert.equal(projectFirmsViewSource.includes("Aus Firmenstamm hinzufügen"), true);
    assert.equal(projectFirmsViewSource.includes("Firmen hinzufügen"), true);
    assert.equal(projectFirmsViewSource.includes("Fehler beim Laden der Firmen im Projekt"), true);
    assert.equal(projectFirmsViewSource.includes("viewScope.textContent = this._projectScopeText();"), false);
    assert.equal(projectFirmsViewSource.includes("titleWrap.append(title);"), true);
    assert.equal(firmsPoolViewSource.includes("Firmen hinzufügen"), true);
    assert.equal(firmsPoolViewSource.includes("Aus Firmenstamm hinzufügen"), true);
    assert.equal(firmsPoolViewSource.includes("Kategorie: Firmen im Projekt"), true);
    assert.equal(firmsPoolViewSource.includes("Firmenpool"), false);
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

  await run("Projektverwaltung: Projektklick startet im Protokollkontext direkt den Protokollpfad", async () => {
    const calls = [];
    const previousWindow = global.window;
    global.window = {
      localStorage: {
        setItem() {},
      },
    };

    try {
      const screen = new ProjectsScreen({
        moduleContext: "protokoll",
        router: {
          currentProjectId: null,
          currentMeetingId: null,
          async openProjectModule(projectId, moduleId, options) {
            calls.push({ projectId, moduleId, options });
            return true;
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
          moduleId: "protokoll",
          options: {
            project: {
              id: "17",
              short: "Projekt A",
              name: "Projekt A",
              project_number: "17",
            },
            navigationKey: "protokoll",
          },
        },
      ]);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: Projektklick startet im Restarbeitenkontext direkt den Restarbeitenpfad", async () => {
    const calls = [];
    const previousWindow = global.window;
    global.window = { localStorage: { setItem() {} } };

    try {
      const screen = new ProjectsScreen({
        moduleContext: "restarbeiten",
        router: {
          currentProjectId: null,
          currentMeetingId: null,
          async openProjectModule(projectId, moduleId, options) {
            calls.push({ projectId, moduleId, options });
            return true;
          },
        },
      });
      screen.projects = [{ id: "18", name: "Projekt B", module_ids: ["restarbeiten"] }];

      assert.equal(await screen.openProjectById("18"), true);
      assert.deepEqual(calls, [{
        projectId: "18",
        moduleId: "restarbeiten",
        options: {
          project: { id: "18", name: "Projekt B", module_ids: ["restarbeiten"] },
          navigationKey: "restarbeiten",
        },
      }]);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: Projektklick in Alle öffnet ausschließlich die zentrale Bearbeitung", async () => {
    const calls = [];
    const previousWindow = global.window;
    global.window = { localStorage: { setItem() {} } };
    try {
      const screen = new ProjectsScreen({ router: { currentProjectId: null, currentMeetingId: null } });
      screen.projects = [{ id: "17", name: "Projekt A", module_ids: ["protokoll"] }];
      screen._openProjectFormModal = async ({ projectId }) => calls.push(projectId);
      assert.equal(await screen.openProjectById("17"), true);
      assert.deepEqual(calls, ["17"]);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: blockiertes Protokoll wird beim Hauptklick nicht als Erfolg behandelt", async () => {
    const calls = [];
    const previousWindow = global.window;
    global.window = {
      localStorage: {
        setItem() {},
      },
    };

    try {
      const screen = new ProjectsScreen({
        moduleContext: "protokoll",
        router: {
          currentProjectId: null,
          currentMeetingId: null,
          async openProjectModule(projectId, moduleId, options) {
            calls.push({ type: "module", projectId, moduleId, options });
            return {
              ok: false,
              blocked: true,
              reason: "MODULE_DISABLED",
              target: "blocked",
              projectId,
              meetingId: null,
              moduleId,
            };
          },
          async openProjectProtocol(projectId, options) {
            calls.push({ type: "protocol", projectId, options });
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
      screen._flashMsg = (text) => {
        calls.push({ type: "flash", text });
      };

      const result = await screen.openProjectById("17");
      assert.equal(result, false);
      assert.deepEqual(calls[0], {
        type: "module",
        projectId: "17",
        moduleId: "protokoll",
        options: {
          project: {
            id: "17",
            short: "Projekt A",
            name: "Projekt A",
            project_number: "17",
          },
          navigationKey: "protokoll",
        },
      });
      assert.equal(calls.some((item) => item.type === "protocol"), false);
      assert.equal(
        calls.some((item) => item.type === "module" && item.moduleId === "protokoll"),
        true
      );
      assert.equal(
        calls.some((item) => item.type === "flash" && String(item.text || "").includes("nicht freigeschaltet")),
        true
      );
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: Runtime-Projektmodulliste enthaelt Restarbeiten", async () => {
    const projectNavigation = getActiveProjectModuleNavigation();
    const moduleIds = projectNavigation.map((entry) => String(entry?.moduleId || "").trim());
    const navigationKeys = projectNavigation.map((entry) => String(entry?.key || "").trim());

    assert.equal(moduleIds.includes("protokoll"), true);
    assert.equal(moduleIds.includes("restarbeiten"), true);
    assert.equal(moduleIds.filter((moduleId) => moduleId === "restarbeiten").length, 2);
    assert.equal(navigationKeys.includes("restarbeiten"), true);
    assert.equal(navigationKeys.includes("plaene"), true);
  });

  await run("Projektverwaltung: Kontexte filtern zentral gespeicherte Projekte ohne Duplikate", () => {
    const projects = [
      { id: "p1", module_ids: ["protokoll"] },
      { id: "p2", module_ids: ["restarbeiten"] },
      { id: "p3", module_ids: ["protokoll", "restarbeiten"] },
      { id: "p4", module_ids: [], archived_module_ids: ["restarbeiten"], all_module_ids: ["restarbeiten"] },
    ];
    const protocol = new ProjectsScreen({ router: {}, moduleContext: "protokoll" });
    protocol.allProjects = projects;
    assert.deepEqual(protocol._projectsForCurrentContext().map((project) => project.id), ["p1", "p3"]);
    assert.deepEqual(protocol._projectsAvailableToAdd().map((project) => project.id), ["p2", "p4"]);

    const restarbeiten = new ProjectsScreen({ router: {}, moduleContext: "restarbeiten" });
    restarbeiten.allProjects = projects;
    assert.deepEqual(restarbeiten._projectsForCurrentContext().map((project) => project.id), ["p2", "p3"]);
    assert.deepEqual(restarbeiten._projectsAvailableToAdd().map((project) => project.id), ["p1"]);

    const all = new ProjectsScreen({ router: {}, moduleContext: "all" });
    all.allProjects = projects;
    assert.deepEqual(all._projectsForCurrentContext().map((project) => project.id), ["p1", "p2", "p3", "p4"]);
    assert.deepEqual(all._projectsAvailableToAdd(), []);
  });

  await run("Projektverwaltung: Hinzufügen ergänzt nur die Modulzuordnung am bestehenden Projekt", async () => {
    const previousWindow = global.window;
    const calls = [];
    global.window = {
      bbmDb: {
        async projectsAssignModule(payload) {
          calls.push(payload);
          return { ok: true, project: { id: payload.projectId, module_ids: [payload.moduleId] } };
        },
      },
    };
    try {
      const screen = new ProjectsScreen({ router: {}, moduleContext: "restarbeiten" });
      assert.equal(await screen._assignProjectToCurrentModule("p1"), true);
      assert.deepEqual(calls, [{ projectId: "p1", moduleId: "restarbeiten" }]);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: gemeinsame Projektauswahl listet Neues zuerst und zeigt vorhandene Badges", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    const calls = [];
    global.document = createFakeDocumentWithBubbling();
    global.window = { addEventListener() {}, removeEventListener() {} };

    try {
      const screen = new ProjectsScreen({ router: {}, moduleContext: "restarbeiten" });
      screen.allProjects = [
        { id: "existing", name: "Projekt Müller", project_number: "M-1", module_ids: ["protokoll", "sigeko"] },
        { id: "assigned", name: "Bereits zugeordnet", module_ids: ["restarbeiten"] },
      ];
      screen._assignProjectToCurrentModule = async (projectId) => {
        calls.push({ type: "assign", projectId });
        return true;
      };
      screen.reloadProjects = async () => calls.push({ type: "reload" });

      assert.equal(screen._openProjectSelectionModal(), true);
      const list = findNode(global.document.body, (node) => node?.dataset?.projectSelectionList === "true");
      const createOption = findNode(global.document.body, (node) => node?.dataset?.projectCreateOption === "true");
      const candidate = findNode(global.document.body, (node) => node?.dataset?.projectAddCandidate === "true");
      const badges = findNodes(candidate, (node) => !!node?.dataset?.projectModuleBadge);

      assert.equal(list.children[0], createOption);
      assert.equal(list.style.display, "flex");
      assert.equal(list.style.flexDirection, "column");
      assert.equal(list.style.gap, "0");
      assert.equal(createOption.textContent, "");
      assert.equal(collectText(createOption), "Neues Projekt");
      assert.equal(createOption.dataset.projectSelectionRow, "true");
      assert.equal(candidate.dataset.projectSelectionRow, "true");
      assert.equal(candidate.style.width, "100%");
      assert.equal(candidate.style.borderRadius, "0");
      assert.equal(candidate.style.boxShadow, "none");
      assert.equal(candidate.style.background, "transparent");
      assert.equal(candidate.style.borderBottom, "1px solid #dfe5ec");
      assert.equal(collectText(candidate).includes("M-1 - Projekt Müller"), true);
      assert.deepEqual(badges.map((badge) => badge.dataset.projectModuleBadge), ["protokoll", "sigeko"]);

      await candidate.click();
      assert.deepEqual(calls, [{ type: "assign", projectId: "existing" }, { type: "reload" }]);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: Neues Projekt aus der Auswahl nutzt den bestehenden zentralen Anlegeweg", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocumentWithBubbling();
    global.window = { addEventListener() {}, removeEventListener() {} };

    try {
      const calls = [];
      const screen = new ProjectsScreen({ router: {}, moduleContext: "protokoll" });
      screen.openCreateProject = async () => calls.push("create");

      assert.equal(screen._openProjectSelectionModal(), true);
      const createOption = findNode(global.document.body, (node) => node?.dataset?.projectCreateOption === "true");
      await createOption.click();
      assert.deepEqual(calls, ["create"]);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: zentrale Projekt-Modul-Zuordnung ist additiv und idempotent verdrahtet", () => {
    assert.match(databaseSource, /CREATE TABLE IF NOT EXISTS project_modules/);
    assert.match(databaseSource, /ALTER TABLE project_modules ADD COLUMN archived_at TEXT/);
    assert.match(databaseSource, /assignExistingProjects\("meetings", "protokoll"\)/);
    assert.match(databaseSource, /assignExistingProjects\("restarbeiten_items", "restarbeiten"\)/);
    assert.match(projectsRepoSource, /INSERT OR IGNORE INTO project_modules/);
    assert.match(projectsIpcSource, /projects:assignModule/);
    assert.match(preloadSource, /projectsAssignModule/);
    assert.match(projectsRepoSource, /function archiveModule/);
    assert.match(projectsRepoSource, /function unarchiveModule/);
    assert.match(projectsRepoSource, /function deleteArchivedModule/);
  });

  await run("Projektverwaltung: Bestandsdaten werden automatisch zugeordnet und IDs bleiben einmalig", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-project-modules-"));
    const userDataPath = path.join(tempRoot, "userData");
    const databasePath = path.resolve(__dirname, "../../src/main/db/database.js");
    const projectsRepoPath = path.resolve(__dirname, "../../src/main/db/projectsRepo.js");
    const originalLoad = Module._load;
    Module._load = function patched(request, parent, isMain) {
      if (request === "electron" && String(parent?.filename || "").endsWith(path.join("db", "database.js"))) {
        return { app: { getPath: (name) => (name === "userData" ? userDataPath : ""), isPackaged: true } };
      }
      return originalLoad.call(this, request, parent, isMain);
    };
    try {
      delete require.cache[databasePath];
      delete require.cache[projectsRepoPath];
      const database = require(databasePath);
      let db = database.initDatabase();
      const insertProject = db.prepare("INSERT INTO projects (id, name) VALUES (?, ?)");
      insertProject.run("protocol", "Protokollprojekt");
      insertProject.run("rest", "Restarbeitenprojekt");
      insertProject.run("both", "Mehrmodulprojekt");
      insertProject.run("mapped", "Vorhandene Zuordnung");
      db.prepare("INSERT INTO meetings (id, project_id, meeting_index, title) VALUES (?, ?, ?, ?)")
        .run("m1", "protocol", 1, "Protokoll");
      db.prepare("INSERT INTO meetings (id, project_id, meeting_index, title) VALUES (?, ?, ?, ?)")
        .run("m2", "both", 1, "Protokoll");
      db.prepare("INSERT INTO restarbeiten_project_settings (project_id) VALUES (?)").run("rest");
      db.prepare("INSERT INTO restarbeiten_project_settings (project_id) VALUES (?)").run("both");
      db.prepare("INSERT INTO project_modules (project_id, module_id) VALUES (?, ?)").run("mapped", "sigeko");
      database.closeDatabase();

      db = database.initDatabase();
      const projectsRepo = require(projectsRepoPath);
      const projects = projectsRepo.listAll();
      const byId = new Map(projects.map((project) => [project.id, project]));
      assert.deepEqual(byId.get("protocol").module_ids, ["protokoll"]);
      assert.deepEqual(byId.get("rest").module_ids, ["restarbeiten"]);
      assert.deepEqual(byId.get("both").module_ids, ["protokoll", "restarbeiten"]);
      assert.deepEqual(byId.get("mapped").module_ids, ["sigeko"]);

      projectsRepo.assignModule("protocol", "restarbeiten");
      projectsRepo.assignModule("protocol", "restarbeiten");
      assert.equal(
        db.prepare("SELECT COUNT(*) AS count FROM project_modules WHERE project_id = ? AND module_id = ?")
          .get("protocol", "restarbeiten").count,
        1
      );
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM projects WHERE id = ?").get("protocol").count, 1);
      database.closeDatabase();
    } finally {
      try { require(databasePath).closeDatabase(); } catch (_) {}
      Module._load = originalLoad;
      try { fs.rmSync(tempRoot, { recursive: true, force: true }); } catch (_) {}
      delete require.cache[databasePath];
      delete require.cache[projectsRepoPath];
    }
  });

  await run("Projektverwaltung: Modul- und Projektarchive erhalten IDs und löschen nur den gewählten Archivinhalt", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-project-archive-"));
    const userDataPath = path.join(tempRoot, "userData");
    const databasePath = path.resolve(__dirname, "../../src/main/db/database.js");
    const projectsRepoPath = path.resolve(__dirname, "../../src/main/db/projectsRepo.js");
    const originalLoad = Module._load;
    Module._load = function patched(request, parent, isMain) {
      if (request === "electron" && String(parent?.filename || "").endsWith(path.join("db", "database.js"))) {
        return { app: { getPath: (name) => (name === "userData" ? userDataPath : ""), isPackaged: true } };
      }
      return originalLoad.call(this, request, parent, isMain);
    };

    try {
      delete require.cache[databasePath];
      delete require.cache[projectsRepoPath];
      const database = require(databasePath);
      const db = database.initDatabase();
      const projectsRepo = require(projectsRepoPath);

      const insertProject = db.prepare("INSERT INTO projects (id, name) VALUES (?, ?)");
      insertProject.run("module-project", "Modulprojekt");
      insertProject.run("protocol-module-project", "Protokollmodulprojekt");
      insertProject.run("whole-project", "Gesamtprojekt");
      insertProject.run("active-project", "Aktivprojekt");
      insertProject.run("invoice-project", "Rechnungsprojekt");

      const assign = db.prepare("INSERT INTO project_modules (project_id, module_id) VALUES (?, ?)");
      for (const projectId of ["module-project", "protocol-module-project", "whole-project"]) {
        assign.run(projectId, "protokoll");
        assign.run(projectId, "restarbeiten");
      }
      assign.run("active-project", "protokoll");
      assign.run("invoice-project", "protokoll");

      const addProtocolData = (projectId, suffix) => {
        db.prepare("INSERT INTO meetings (id, project_id, meeting_index, title) VALUES (?, ?, ?, ?)")
          .run(`meeting-${suffix}`, projectId, 1, `Protokoll ${suffix}`);
        db.prepare("INSERT INTO tops (id, project_id, level, number, title) VALUES (?, ?, ?, ?, ?)")
          .run(`top-${suffix}`, projectId, 1, 1, `TOP ${suffix}`);
        db.prepare("INSERT INTO meeting_tops (meeting_id, top_id) VALUES (?, ?)")
          .run(`meeting-${suffix}`, `top-${suffix}`);
      };
      const addRestarbeitenData = (projectId, suffix) => {
        db.prepare("INSERT INTO restarbeiten_project_settings (project_id) VALUES (?)").run(projectId);
        db.prepare(`
          INSERT INTO restarbeiten_items (id, project_id, running_number, short_text, long_text)
          VALUES (?, ?, 1, 'Kurz', 'Lang')
        `).run(`rest-${suffix}`, projectId);
        db.prepare(`
          INSERT INTO restarbeiten_attachments (id, restarbeit_id, project_id, file_path)
          VALUES (?, ?, ?, ?)
        `).run(`attachment-${suffix}`, `rest-${suffix}`, projectId, path.join(tempRoot, `${suffix}.jpg`));
        db.prepare("INSERT INTO restarbeiten_notes (id, restarbeit_id, note_text) VALUES (?, ?, ?)")
          .run(`note-${suffix}`, `rest-${suffix}`, "Notiz");
      };

      addProtocolData("module-project", "module");
      addRestarbeitenData("module-project", "module");
      addProtocolData("protocol-module-project", "protocol-module");
      addRestarbeitenData("protocol-module-project", "protocol-module");
      addProtocolData("whole-project", "whole");
      addRestarbeitenData("whole-project", "whole");

      projectsRepo.archiveModule("module-project", "restarbeiten");
      let moduleProject = projectsRepo.getById("module-project");
      assert.deepEqual(moduleProject.module_ids, ["protokoll"]);
      assert.deepEqual(moduleProject.archived_module_ids, ["restarbeiten"]);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM restarbeiten_items WHERE project_id = ?").get("module-project").count, 1);
      let archiveEntries = projectsRepo.listArchiveEntries();
      assert.equal(archiveEntries.some((entry) => entry.archive_type === "module" && entry.project_id === "module-project" && entry.module_id === "restarbeiten"), true);

      projectsRepo.unarchiveModule("module-project", "restarbeiten");
      moduleProject = projectsRepo.getById("module-project");
      assert.equal(moduleProject.id, "module-project");
      assert.deepEqual(moduleProject.module_ids, ["protokoll", "restarbeiten"]);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM restarbeiten_items WHERE id = ?").get("rest-module").count, 1);

      projectsRepo.archiveModule("module-project", "restarbeiten");
      const moduleDelete = projectsRepo.deleteArchivedModule("module-project", "restarbeiten");
      assert.deepEqual(moduleDelete.deletedFilePaths, [path.join(tempRoot, "module.jpg")]);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM projects WHERE id = ?").get("module-project").count, 1);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM meetings WHERE project_id = ?").get("module-project").count, 1);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM restarbeiten_items WHERE project_id = ?").get("module-project").count, 0);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM restarbeiten_notes WHERE restarbeit_id = ?").get("rest-module").count, 0);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM project_modules WHERE project_id = ? AND module_id = ?").get("module-project", "restarbeiten").count, 0);

      projectsRepo.archiveModule("protocol-module-project", "protokoll");
      projectsRepo.deleteArchivedModule("protocol-module-project", "protokoll");
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM projects WHERE id = ?").get("protocol-module-project").count, 1);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM meetings WHERE project_id = ?").get("protocol-module-project").count, 0);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM tops WHERE project_id = ?").get("protocol-module-project").count, 0);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM restarbeiten_items WHERE project_id = ?").get("protocol-module-project").count, 1);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM project_modules WHERE project_id = ? AND module_id = ?").get("protocol-module-project", "protokoll").count, 0);

      projectsRepo.archiveModule("whole-project", "restarbeiten");
      projectsRepo.archiveProject("whole-project");
      assert.equal(projectsRepo.listAll().some((project) => project.id === "whole-project"), false);
      archiveEntries = projectsRepo.listArchiveEntries();
      const wholeArchive = archiveEntries.find((entry) => entry.archive_type === "project" && entry.project_id === "whole-project");
      assert.deepEqual(wholeArchive.module_ids, ["protokoll", "restarbeiten"]);

      projectsRepo.unarchiveProject("whole-project");
      const restoredWhole = projectsRepo.getById("whole-project");
      assert.equal(restoredWhole.id, "whole-project");
      assert.deepEqual(restoredWhole.module_ids, ["protokoll"]);
      assert.deepEqual(restoredWhole.archived_module_ids, ["restarbeiten"]);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM restarbeiten_items WHERE id = ?").get("rest-whole").count, 1);

      projectsRepo.unarchiveModule("whole-project", "restarbeiten");
      projectsRepo.archiveProject("whole-project");
      projectsRepo.deleteArchivedProject("whole-project");
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM projects WHERE id = ?").get("whole-project").count, 0);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM meetings WHERE project_id = ?").get("whole-project").count, 0);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM restarbeiten_items WHERE project_id = ?").get("whole-project").count, 0);
      assert.throws(() => projectsRepo.deleteArchivedProject("active-project"), /not archived/);

      db.prepare(`
        INSERT INTO invoices (id, invoice_date, due_date, project_id, created_at, updated_at)
        VALUES ('invoice-1', '2026-08-30', '2026-09-07', 'invoice-project', '2026-08-30T10:00:00.000Z', '2026-08-30T10:00:00.000Z')
      `).run();
      projectsRepo.archiveProject("invoice-project");
      assert.throws(
        () => projectsRepo.deleteArchivedProject("invoice-project"),
        /solange Rechnungen darauf verweisen/
      );
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM projects WHERE id = ?").get("invoice-project").count, 1);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM invoices WHERE id = ?").get("invoice-1").count, 1);

      database.closeDatabase();
    } finally {
      try { require(databasePath).closeDatabase(); } catch (_) {}
      Module._load = originalLoad;
      try { fs.rmSync(tempRoot, { recursive: true, force: true }); } catch (_) {}
      delete require.cache[databasePath];
      delete require.cache[projectsRepoPath];
    }
  });

  await run("Projektverwaltung: DEV-Version schaltet Modulfreigabe auf alle aktiven Module frei", async () => {
    const moduleAccessState = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/app/modules/moduleAccessState.js")
    );

    const previousWindow = global.window;
    global.window = {
      bbmDb: {
        async appIsPackaged() {
          return { ok: true, isPackaged: false };
        },
        async licenseGetStatus() {
          return {
            ok: true,
            valid: true,
            modules: ["protokoll"],
            features: [],
          };
        },
      },
    };

    try {
      await moduleAccessState.refreshCachedActiveModuleAccess({ force: true });
      assert.equal(moduleAccessState.getCachedActiveModuleSource(), "dev");
      assert.equal(moduleAccessState.isModuleActive("protokoll"), true);
      assert.equal(moduleAccessState.isModuleActive("restarbeiten"), true);
    } finally {
      global.window = previousWindow;
      await moduleAccessState.refreshCachedActiveModuleAccess({ force: true });
    }
  });

  await run("Projektverwaltung: Projekte Alle ist eine Zeilenliste mit Badges und Archivaktion", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    const fakeDocument = createFakeDocumentWithBubbling();
    global.document = fakeDocument;
    global.window = { addEventListener() {}, removeEventListener() {} };

    const calls = [];
    const screen = new ProjectsScreen({
      moduleContext: "all",
      router: {
        currentProjectId: null,
        currentMeetingId: null,
      },
    });

    screen.projects = [
      {
        id: "17",
        short: "Projekt A",
        name: "Projekt A",
        project_number: "17",
        module_ids: ["protokoll", "restarbeiten", "sigeko"],
      },
    ];
    screen.openProjectById = async (projectId) => {
      calls.push({ type: "main", projectId });
      return true;
    };
    screen._openArchiveSelectionModal = (project) => calls.push({ type: "archive", projectId: project?.id });

    try {
      const root = screen.render();
      assert.equal(!!root, true);

      const list = findNode(root, (node) => node?.dataset?.projectsAllList === "true");
      const projectRow = findNode(root, (node) => node?.dataset?.projectAllProjectRow === "true");
      const cards = findNodes(root, (node) => node?.dataset?.projectCard === "true");
      const moduleButtons = findNodes(root, (node) => node?.dataset?.projectAction === "module");
      const badges = findNodes(root, (node) => !!node?.dataset?.projectModuleBadge);
      const archiveButton = findNode(root, (node) => node?.dataset?.projectAction === "archive");
      const editButtons = findNodes(root, (node) => node?.dataset?.projectAction === "edit");

      assert.equal(list.style.display, "flex");
      assert.equal(list.style.flexDirection, "column");
      assert.equal(list.style.gap, "0");
      assert.equal(projectRow.style.borderRadius, "0");
      assert.equal(projectRow.style.boxShadow, "none");
      assert.equal(cards.length, 0);
      assert.equal(moduleButtons.length, 0);
      assert.deepEqual(badges.map((badge) => badge.dataset.projectModuleBadge), [
        "protokoll",
        "restarbeiten",
        "sigeko",
      ]);
      assert.equal(editButtons.length, 0);
      assert.equal(!!archiveButton, true);

      await archiveButton.click();
      assert.deepEqual(calls.at(-1), { type: "archive", projectId: "17" });

      await projectRow.click();
      assert.deepEqual(calls.at(-1), { type: "main", projectId: "17" });
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: Archiv-Auswahl ist eine Zeilenliste und bietet nur aktive Fachmodule", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    global.document = createFakeDocumentWithBubbling();
    global.window = { addEventListener() {}, removeEventListener() {} };

    try {
      const calls = [];
      const screen = new ProjectsScreen({ moduleContext: "all", router: {} });
      screen._archiveSelection = async (project, moduleId) => {
        calls.push({ projectId: project?.id, moduleId });
        return true;
      };
      const project = {
        id: "p1",
        name: "Projekt Archiv",
        module_ids: ["protokoll", "restarbeiten", "rechnung"],
      };

      assert.equal(screen._openArchiveSelectionModal(project), true);
      const list = findNode(global.document.body, (node) => node?.dataset?.projectArchiveSelectionList === "true");
      const choices = findNodes(list, (node) => !!node?.dataset?.projectArchiveChoice);
      assert.equal(list.style.display, "flex");
      assert.equal(list.style.flexDirection, "column");
      assert.deepEqual(choices.map((node) => node.dataset.projectArchiveChoice), [
        "project",
        "protokoll",
        "restarbeiten",
      ]);
      assert.deepEqual(choices.map(collectText), [
        "Gesamtes Projekt archivieren",
        "Nur Protokoll archivieren",
        "Nur Restarbeiten archivieren",
      ]);

      await choices[2].click();
      assert.deepEqual(calls, [{ projectId: "p1", moduleId: "restarbeiten" }]);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: Archivliste benennt Projekt und Inhalt und verdrahtet Wiederherstellen und Löschen", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    const previousAlert = global.alert;
    const previousConfirm = global.confirm;
    global.document = createFakeDocumentWithBubbling();
    const calls = [];
    global.window = {
      bbmDb: {
        async projectsRestoreArchive(payload) {
          calls.push({ type: "restore", payload });
          return { ok: true };
        },
        async projectsDeleteArchiveForever(payload) {
          calls.push({ type: "delete", payload });
          return { ok: true };
        },
      },
    };
    global.alert = () => {};
    global.confirm = () => true;

    try {
      const screen = new ArchiveScreen({ router: {} });
      screen.projects = [
        {
          id: "p1",
          project_id: "p1",
          project_number: "101",
          name: "Bauhof",
          archive_type: "project",
          archive_scope_label: "Gesamtes Projekt",
          module_ids: ["protokoll", "restarbeiten"],
          archived_at: "2026-08-30T10:00:00.000Z",
        },
        {
          id: "p2",
          project_id: "p2",
          name: "Hafen",
          archive_type: "module",
          archive_scope_label: "Restarbeiten",
          module_id: "restarbeiten",
          module_ids: ["restarbeiten"],
          archived_at: "2026-08-29T10:00:00.000Z",
        },
      ];
      screen.reload = async () => calls.push({ type: "reload" });

      const root = screen.render();
      const list = findNode(root, (node) => node?.dataset?.projectArchiveList === "true");
      const rows = findNodes(list, (node) => node?.dataset?.projectArchiveRow === "true");
      const names = findNodes(list, (node) => node?.dataset?.archiveName === "true");
      const badges = findNodes(list, (node) => !!node?.dataset?.archiveModuleBadge);
      const restoreButtons = findNodes(list, (node) => node?.dataset?.archiveAction === "restore");
      const deleteButtons = findNodes(list, (node) => node?.dataset?.archiveAction === "delete");

      assert.equal(list.style.display, "flex");
      assert.equal(list.style.flexDirection, "column");
      assert.equal(rows.length, 2);
      assert.deepEqual(names.map((node) => node.textContent), [
        "101 - Bauhof – Gesamtes Projekt",
        "Hafen – Restarbeiten",
      ]);
      assert.deepEqual(badges.map((node) => node.dataset.archiveModuleBadge), [
        "protokoll",
        "restarbeiten",
        "restarbeiten",
      ]);
      assert.equal(rows.every((row) => row.style.borderRadius === "0" && row.style.boxShadow === "none"), true);

      await restoreButtons[1].click();
      await deleteButtons[0].click();
      assert.deepEqual(calls.filter((call) => call.type !== "reload"), [
        {
          type: "restore",
          payload: { archiveType: "module", projectId: "p2", moduleId: "restarbeiten" },
        },
        {
          type: "delete",
          payload: { archiveType: "project", projectId: "p1" },
        },
      ]);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
      global.alert = previousAlert;
      global.confirm = previousConfirm;
    }
  });

  await run("Projektverwaltung: Modulkontext zeigt Projekte als kompakte Zeilenliste ohne Badges", async () => {
    const previousDocument = global.document;
    const fakeDocument = createFakeDocumentWithBubbling();
    global.document = fakeDocument;

    try {
      for (const moduleContext of ["protokoll", "restarbeiten"]) {
        const screen = new ProjectsScreen({ moduleContext, router: {} });
        screen.projects = [
          { id: moduleContext, name: "Projekt mit Schlagwort", keyword: "Bauabschnitt Nord", module_ids: [moduleContext] },
          { id: `${moduleContext}-date`, name: "Projekt mit Anlagedatum", created_at: "2026-08-30T12:00:00.000Z", module_ids: [moduleContext] },
        ];
        const calls = [];
        screen.openProjectById = async (projectId) => calls.push({ type: "open", projectId });
        screen._openProjectSelectionModal = () => calls.push({ type: "create" });

        const root = screen.render();
        const list = findNode(root, (node) => node?.dataset?.projectContextList === "true");
        const createRow = findNode(root, (node) => node?.dataset?.projectContextCreate === "true");
        const projectRows = findNodes(root, (node) => node?.dataset?.projectContextProject === "true");
        const cards = findNodes(root, (node) => node?.dataset?.projectCard === "true");
        const badges = findNodes(root, (node) => !!node?.dataset?.projectModuleBadge);
        const details = findNodes(root, (node) => node?.dataset?.projectContextDetail === "true");
        const editActions = findNodes(root, (node) => node?.dataset?.projectAction === "edit");
        assert.equal(list.style.display, "flex");
        assert.equal(list.style.flexDirection, "column");
        assert.equal(list.style.gap, "0");
        assert.equal(list.children[0], createRow);
        assert.equal(createRow.style.borderRadius, "0");
        assert.equal(createRow.style.boxShadow, "none");
        assert.equal(projectRows.length, 2);
        assert.equal(projectRows[0].style.borderRadius, "0");
        assert.equal(projectRows[0].style.boxShadow, "none");
        assert.equal(cards.length, 0);
        assert.equal(badges.length, 0);
        assert.equal(editActions.length, 0);
        assert.deepEqual(details.map((node) => node.textContent), ["Bauabschnitt Nord", "30.08.2026"]);

        await createRow.click();
        await projectRows[0].click();
        assert.deepEqual(calls, [{ type: "create" }, { type: "open", projectId: moduleContext }]);
      }
    } finally {
      global.document = previousDocument;
    }
  });

  await run("Projektverwaltung: neue Screen-Dateien enthalten die Implementierung", () => {
    assert.equal(projectsSource.includes("export default class ProjectsScreen"), true);
    assert.equal(workspaceSource.includes("export default class ProjectWorkspaceScreen"), true);
    assert.equal(projectsSource.includes("PROJECT_MODULE_PRESENTATION"), true);
    assert.equal(projectsSource.includes("projectsAssignModule"), true);
    assert.equal(projectsSource.includes("Under construction"), true);
    assert.equal(projectsSource.includes('"protokoll"'), true);
    assert.equal(projectsSource.includes("projectsAllList"), true);
    assert.equal(projectsSource.includes('dataset.projectAction = "archive"'), true);
    assert.equal(projectsSource.includes("projectsArchiveModule"), true);
    assert.equal(formSource.includes("export default class ProjectFormScreen"), true);
    assert.equal(formSource.includes("../../../ui/popupButtonStyles.js"), true);
    assert.equal(formSource.includes("pdf.footerUseUserData"), false);
    assert.equal(archiveSource.includes("export default class ArchiveScreen"), true);
    assert.equal(archiveSource.includes("../../../ui/popupButtonStyles.js"), true);
    assert.equal(archiveSource.includes("projectArchiveList"), true);
    assert.equal(projectsIpcSource.includes("projects:listArchiveEntries"), true);
    assert.equal(projectsIpcSource.includes("projects:deleteArchiveForever"), true);
    assert.equal(preloadSource.includes("projectsListArchiveEntries"), true);
    assert.equal(preloadSource.includes("projectsDeleteArchiveForever"), true);
  });

  await run("Projektverwaltung: Projekt-Popup nutzt die kompakte Formular-Referenz", () => {
    const referenceTokens = [
      "--bbm-form-dialog-padding-y: 8px",
      "--bbm-form-dialog-padding-x: 12px",
      "--bbm-form-card-padding: 10px",
      "--bbm-form-label-field-gap: 3px",
      "--bbm-form-group-gap: 7px",
      "--bbm-form-control-height: 30px",
      "--bbm-form-label-font-size: 11.5px",
      "--bbm-form-control-font-size: 12.5px",
      "--bbm-form-textarea-height: 78px",
      "--bbm-form-section-padding-y: 6px",
      "--bbm-form-section-padding-x: 8px",
      "--bbm-form-section-gap: 2px",
      "--bbm-form-button-height: 26px",
      "--bbm-form-footer-padding-y: 8px",
      "--bbm-form-footer-padding-x: 12px",
    ];
    for (const token of referenceTokens) {
      assert.equal(coreShellStylesSource.includes(token), true, `fehlendes Form-Token: ${token}`);
    }

    assert.equal(formSource.includes("applyCompactFormButtonStyle"), true);
    assert.equal(formSource.includes("var(--bbm-form-label-field-gap)"), true);
    assert.equal(formSource.includes("var(--bbm-form-group-gap)"), true);
    assert.equal(formSource.includes("var(--bbm-form-control-height)"), true);
    assert.equal(formSource.includes("var(--bbm-form-textarea-height)"), true);
    assert.equal(formSource.includes("var(--bbm-form-section-padding-y)"), true);
    assert.equal(formSource.includes("var(--bbm-form-footer-padding-y)"), true);
    assert.equal(formSource.includes('modal.style.maxHeight = "calc(100% - 16px)"'), true);
    assert.equal(
      formSource.includes(
        'form.style.gridTemplateColumns = "minmax(0, 1fr) 1px minmax(0, 1fr)"'
      ),
      true
    );
    assert.equal(formSource.includes('modal.style.width = "min(900px, calc(100vw - 32px))"'), true);
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
    assert.equal(coreShellHeaderBridgeSource.includes('root.style.display = isTopsView ? "none" : ""'), false);
    assert.equal(coreShellHeaderBridgeSource.includes('root.style.display = ""'), true);
    assert.equal(coreShellHeaderBridgeSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(coreShellHeaderBridgeSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(coreShellHeaderBridgeSource.includes("projectFirms"), false);
  });

  await run("Projektverwaltung: MainHeader source nutzt den textbasierten Kopfbereich", () => {
    assert.equal(mainHeaderSource.includes("BBM"), true);
    assert.equal(mainHeaderSource.includes("aktiv:"), true);
    assert.equal(mainHeaderSource.includes("bereit:"), false);
    assert.equal(mainHeaderSource.includes("readyLight"), false);
    assert.equal(mainHeaderSource.includes("readyValEl"), false);
    assert.equal(mainHeaderSource.includes("readyLabel"), false);
    assert.equal(mainHeaderSource.includes("setupStatus?.worstLight"), false);
    assert.equal(mainHeaderSource.includes("dot.style.width = \"10px\""), false);
    assert.equal(mainHeaderSource.includes("user_street"), true);
    assert.equal(mainHeaderSource.includes("user_zip"), true);
    assert.equal(mainHeaderSource.includes("user_city"), true);
    assert.equal(mainHeaderSource.includes("user_company"), true);
    assert.equal(mainHeaderSource.includes("rightInfo.style.position = \"absolute\""), false);
    assert.equal(mainHeaderSource.includes("activeModuleLabel"), true);
    assert.equal(mainHeaderSource.includes("_syncHeaderIdentity"), true);
    assert.equal(mainHeaderSource.includes("_getHeaderModuleText"), true);
    assert.equal(mainHeaderSource.includes("_getHeaderProjectText"), true);
    assert.equal(mainHeaderSource.includes('rightInfo.textContent = "Plan"'), false);
    assert.equal(mainHeaderSource.includes('devBadge.style.gridRow = "2"'), true);
    assert.equal(mainHeaderSource.includes('devBadge.style.position = "absolute"'), false);
    assert.equal(mainHeaderSource.includes('devBadge.style.top = "8px"'), false);
    assert.equal(coreShellHeaderBridgeSource.includes('root.style.display = "grid"'), true);
    assert.equal(coreShellNavigationSource.includes("height:18px;min-height:18px"), true);
    assert.equal(mainHeaderSource.includes("actionWrap.style.gridRow = \"3\""), true);
    assert.equal(mainHeaderSource.includes('actionWrap.style.display = "none"'), true);
    assert.equal(mainHeaderSource.includes("stickyNotice.style.gridRow = \"3\""), true);
  });

  await run("M86.13: Protokoll und Restarbeiten erhalten den einen zweizeiligen MainHeader", () => {
    assert.equal(coreShellSource.includes('import MainHeader from "../ui/MainHeader.js"'), true);
    assert.equal(coreShellSource.includes("const header = new MainHeader({"), true);
    assert.equal(restarbeitenScreenSource.includes("Entwicklungsversion – Testlizenz"), false);
    assert.equal(protokollScreenSource.includes("Entwicklungsversion – Testlizenz"), false);
    assert.equal(mainHeaderSource.includes('rightInfo.textContent = "Plan"'), false);
    assert.equal(mainHeaderSource.includes('devBadge.style.gridColumn = "3"'), true);
    assert.equal(mainHeaderSource.includes('devBadge.style.gridRow = "2"'), true);
    assert.equal(mainHeaderSource.includes('devBadge.style.position = "absolute"'), false);
    assert.equal(mainHeaderSource.includes('devBadge.style.top = "8px"'), false);
  });

  await run("Projektverwaltung: MainHeader rendert zwei gemeinsame Zeilen mit Plan und DEV-Marker", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    const fakeDocument = createFakeDocumentWithBubbling();
    global.document = fakeDocument;
    global.window = {
      localStorage: {
        getItem(key) {
          return key === "bbm.uiMode" ? "new" : null;
        },
        setItem() {},
        removeItem() {},
      },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(fn) {
        if (typeof fn === "function") fn();
      },
      bbmDb: {},
    };

    const { default: MainHeader } = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/ui/MainHeader.js")
    );

    try {
      const router = {
        currentProjectId: "17",
        activeSection: "projectWorkspace",
        context: {
          ui: { pageTitle: "", activeModuleLabel: "Protokoll", isTopsView: false },
          settings: {
            user_company: "Planungsbüro Steffen Bandholt",
            user_zip: "22880",
            user_city: "Wedel",
          },
          projectLabel: "04-2026 - UI-Polish für BBM",
        },
      };

      const header = new MainHeader({ router, version: "1.5.0" });
      header.render();
      header.refresh();
      const headerChildCountBefore = header.root.children.length;

      assert.equal(header.elVersion.textContent, "BBM 1.5.0");
      assert.equal(header.elActive.textContent, "aktiv: Protokoll | 04-2026 - UI-Polish für BBM");
      assert.equal(header.elRightInfo, null);
      assert.equal(header.elDevBadge.style.gridColumn, "3");
      assert.equal(header.elDevBadge.style.gridRow, "2");
      assert.equal(header.elDevBadge.style.position, undefined);
      assert.equal(header.root.style.display, "grid");
      assert.equal(header.root.style.gridTemplateRows, "auto auto");
      assert.equal(header.root.style.rowGap, "1px");
      assert.equal(header.root.style.padding, "4px 12px 3px");
      assert.equal(header.root.style.minHeight, "60px");
      assert.equal(header.elVersion.style.fontSize, "12px");
      assert.equal(header.elVersion.style.lineHeight, "15px");
      assert.equal(["500", "600"].includes(header.elVersion.style.fontWeight), true);
      assert.equal(header.elVersion.style.fontWeight === "700", false);
      assert.equal(header.elVersion.style.fontWeight === "800", false);
      assert.equal(header.elActive.style.fontSize, "12px");
      assert.equal(header.elActive.style.lineHeight, "15px");
      assert.equal(header.elActive.style.fontWeight, "500");
      assert.equal(header.elVersion.style.fontSize <= header.elRightInfo.style.fontSize, true);
      assert.equal(!!findNode(header.root, (node) => node?.textContent === "DEV"), false);
      assert.equal(header.elActive.textContent.includes("bereit:"), false);
      assert.equal(header.elActive.textContent.includes("| -"), false);
      assert.equal(header.elActive.textContent.includes("|  -"), false);

      router.currentProjectId = null;
      router.context.projectLabel = null;
      router.context.ui.pageTitle = "";
      router.context.ui.activeModuleLabel = "";
      router.activeSection = "home";
      header.refresh();

      assert.equal(header.elActive.textContent, "aktiv: Start");
      assert.equal(header.elActive.textContent.includes("|"), false);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("Projektverwaltung: MainHeader/CoreShell ohne alte DEV-Buttons und ohne Scanstatus", async () => {
    assert.equal(coreShellSource.includes("installBbmUiEditorRuntimeLauncher"), false);
    assert.equal(coreShellSource.includes("refreshUiEditorRuntimeLauncher"), false);
    assert.equal(coreShellSource.includes("getActiveUiScope"), false);
    assert.equal(coreShellSource.includes("getBbmUiEditorRegistry"), false);
    assert.equal(coreShellSource.includes("resolveActiveHostUiScope"), false);
    assert.equal(coreShellSource.includes("bindCoreShellUiElementRefs"), true);
    assert.equal(coreShellSource.includes('registerBbmUiElementRef("bbm.main.shell", host)'), true);
    assert.equal(coreShellSource.includes('registerBbmUiElementRef("bbm.main.navigation", sidebar)'), true);
    assert.equal(coreShellSource.includes('registerBbmUiElementRef("bbm.main.header", headerEl)'), true);
    assert.equal(coreShellSource.includes('registerBbmUiElementRef("bbm.main.content", content)'), true);
    assert.equal(coreShellSource.includes('registerBbmUiElementRef("bbm.main.actions"'), false);
    assert.equal(coreShellSource.includes("showEditorLabV2"), false);
    assert.equal(coreShellSource.includes("showRestarbeitenV2Dev"), false);
    assert.equal(coreShellSource.includes("scanUiInspectorTargets"), false);
    assert.equal(mainHeaderSource.includes("scanUiInspectorTargets"), false);
    assert.equal(mainHeaderSource.includes("createUiInspectorPanel"), false);
    assert.equal(mainHeaderSource.includes("formatUiInspectorScanSummary"), false);
    assert.equal(mainHeaderSource.includes("EditorLab V2"), false);
    assert.equal(mainHeaderSource.includes("Restarbeiten V2"), false);

    const previousDocument = global.document;
    const previousWindow = global.window;
    const fakeDocument = createFakeDocumentWithBubbling();
    global.document = fakeDocument;
    global.window = {
      localStorage: {
        getItem(key) {
          return key === "bbm.uiMode" ? "new" : null;
        },
        setItem() {},
        removeItem() {},
      },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(fn) {
        if (typeof fn === "function") fn();
      },
      bbmDb: {},
    };

    const { default: MainHeader } = await importEsmFromFile(
      path.join(__dirname, "../../src/renderer/ui/MainHeader.js")
    );

    try {
      const router = {
        currentProjectId: "17",
        currentMeetingId: null,
        contentRoot: {
          querySelectorAll() {
            throw new Error("alter UI-Editor-Scan darf nicht laufen");
          },
        },
        activeSection: "projectWorkspace",
        context: {
          ui: { pageTitle: "", activeModuleLabel: "Protokoll", isTopsView: false },
          settings: {
            user_company: "Planungsbüro Steffen Bandholt",
            user_zip: "22880",
            user_city: "Wedel",
          },
          projectLabel: "04-2026 - UI-Polish für BBM",
        },
      };

      const header = new MainHeader({ router, version: "1.5.0" });
      assert.doesNotThrow(() => header.render());
      assert.doesNotThrow(() => header.refresh());

      const headerText = collectText(header.root);
      assert.equal(headerText.includes("UI-Editor"), false);
      assert.equal(headerText.includes("EditorLab V2"), false);
      assert.equal(headerText.includes("Restarbeiten V2"), false);
      assert.equal(headerText.includes("Scan"), false);
      assert.equal(findNode(header.root, (node) => node?.tagName === "BUTTON" && node?.textContent === "Editor"), null);
      assert.equal(header.elUiEditorWrap, null);
      assert.equal(header.elUiEditorPanel, null);
      assert.equal(header.toggleUiEditorScan(), false);
      assert.equal(header._isUiEditorRuntimeLauncherEnabled(), true);
      assert.equal(Boolean(findNode(fakeDocument.body, (node) => node?.getAttribute?.("data-ui-inspector-panel") === "true")), false);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
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

  await run("Projektverwaltung: Legacy-Projekt-Arbeitsbereich bleibt isoliert", () => {
    assert.equal(workspaceSource.includes("getActiveProjectModuleNavigation"), false);
    assert.equal(workspaceSource.includes("PROTOKOLL_MODULE_ID"), false);
    assert.equal(workspaceSource.includes("Arbeitsbereiche im Projekt"), true);
    assert.equal(workspaceSource.includes("keine Arbeitsmodule freigeschaltet"), true);
    assert.equal(workspaceSource.includes("const PROJECT_MODULES"), false);
  });

  await run("Projektverwaltung: Router haelt den Legacy-Projekt-Arbeitsbereich getrennt", () => {
    assert.equal(routerSource.includes("_getProjectWorkspaceModules"), true);
    assert.equal(routerSource.includes("getActiveProjectModuleNavigation"), true);
    assert.equal(routerSource.includes("projectModules: this._getProjectWorkspaceModules()"), true);
    assert.equal(routerSource.includes("activeModuleLabel:"), true);
    assert.equal(routerSource.includes('moduleId: "projectFirms"'), true);
    assert.equal(routerSource.includes('label: "Firmen im Projekt"'), true);
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
    assert.equal(projectContextQuicklaneSource.includes("createLockIcon"), true);
    assert.equal(projectContextQuicklaneSource.includes("createElementNS"), true);
    assert.equal(projectContextQuicklaneSource.includes("pinBtn.replaceChildren(createLockIcon"), true);
    assert.equal(projectContextQuicklaneSource.includes('this.pinBtn.textContent = this._isPinned ? "U" : "P"'), false);
  });

  await run("Projektverwaltung: ProjectContextQuicklane schliesst TOP-Filter ohne Render-Rekursion", () => {
    assert.equal(projectContextQuicklaneSource.includes("if (this._isTopFilterOpen === normalized) return;"), true);
    assert.equal(projectContextQuicklaneSource.includes("if (this._isRenderingContext) return;"), true);
    assert.equal(
      projectContextQuicklaneSource.includes("if (!hasTopFilter || this._isRestarbeitenContext) this._isTopFilterOpen = false;"),
      true
    );
    assert.equal(
      projectContextQuicklaneSource.includes("if (!hasTopFilter || this._isRestarbeitenContext) this._setTopFilterMenuOpen(false);"),
      false
    );
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
