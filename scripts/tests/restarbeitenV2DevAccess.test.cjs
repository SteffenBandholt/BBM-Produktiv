const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createFakeDocument() {
  const listeners = new Map();

  function createNode(tagName, doc) {
    const nodeListeners = new Map();
    return {
      tagName: String(tagName || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentElement: null,
      textContent: "",
      style: {
        cssText: "",
        setProperty(name, value) {
          this[String(name)] = String(value);
        },
      },
      attributes: {},
      dataset: {},
      append(...items) {
        for (const item of items) {
          if (item && typeof item === "object") {
            item.parentElement = this;
            item.ownerDocument = doc;
          }
          this.children.push(item);
        }
      },
      appendChild(item) {
        this.append(item);
        return item;
      },
      replaceChildren(...items) {
        this.children = [];
        this.append(...items);
      },
      removeChild(item) {
        this.children = this.children.filter((entry) => entry !== item);
        if (item && typeof item === "object") {
          item.parentElement = null;
        }
      },
      remove() {
        if (this.parentElement?.removeChild) {
          this.parentElement.removeChild(this);
        }
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
      },
      removeAttribute(name) {
        delete this.attributes[name];
      },
      addEventListener(type, handler) {
        if (!nodeListeners.has(type)) nodeListeners.set(type, []);
        nodeListeners.get(type).push(handler);
      },
      removeEventListener(type, handler) {
        nodeListeners.set(type, (nodeListeners.get(type) || []).filter((entry) => entry !== handler));
      },
      dispatchEvent(eventInput) {
        const event = typeof eventInput === "string" ? { type: eventInput } : (eventInput || {});
        const type = String(event.type || "");
        event.target = event.target || this;
        for (const handler of nodeListeners.get(type) || []) handler.call(this, event);
        if (this.parentElement?.dispatchEvent && !event._stopped) {
          return this.parentElement.dispatchEvent(event);
        }
        return event;
      },
      querySelectorAll(selector) {
        const result = [];
        const match = String(selector || "").match(/data-ui-v2-id=["']([^"']+)["']/);
        const expectedId = match ? match[1] : null;
        const walk = (node) => {
          if (!node || typeof node !== "object") return;
          if (expectedId && node?.getAttribute?.("data-ui-v2-id") === expectedId) result.push(node);
          for (const child of Array.isArray(node.children) ? node.children : []) {
            walk(child);
          }
        };
        walk(this);
        return result;
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
      },
      contains(target) {
        if (target === this) return true;
        for (const child of Array.isArray(this.children) ? this.children : []) {
          if (child === target) return true;
          if (typeof child.contains === "function" && child.contains(target)) return true;
        }
        return false;
      },
    };
  }

  const document = {
    activeElement: null,
    body: null,
    createElement(tagName) {
      return createNode(tagName, document);
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      listeners.set(type, (listeners.get(type) || []).filter((entry) => entry !== handler));
    },
    dispatch(type, event = {}) {
      event.type = type;
      for (const handler of listeners.get(type) || []) handler(event);
    },
  };

  document.body = createNode("body", document);
  document.body._rect = { left: 0, top: 0, width: 1600, height: 1200 };
  document.elementFromPoint = () => null;
  return document;
}

function collectNodes(node, predicate, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (predicate(node)) acc.push(node);
  for (const child of Array.isArray(node.children) ? node.children : []) {
    collectNodes(child, predicate, acc);
  }
  return acc;
}

function getNodeById(root, id) {
  return collectNodes(root, (node) => node?.getAttribute?.("data-ui-v2-id") === id)[0] || null;
}

function getNodeByAttr(root, name, value) {
  return collectNodes(root, (node) => node?.getAttribute?.(name) === value)[0] || null;
}

async function runRestarbeitenV2DevAccessTests(run) {
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
  const routerPath = path.join(__dirname, "../../src/renderer/app/Router.js");
  const workspacePath = path.join(__dirname, "../../src/renderer/modules/projektverwaltung/screens/ProjectWorkspaceScreen.js");
  const headerPath = path.join(__dirname, "../../src/renderer/ui/MainHeader.js");
  const moduleNavPath = path.join(__dirname, "../../src/renderer/app/modules/moduleNavigation.js");
  const statusPath = path.join(__dirname, "../../STATUS.md");
  const readOnlyDecisionPath = path.join(__dirname, "../../docs/RESTARBEITEN_V2_LESEWEG_ENTSCHEIDUNG.md");
  const routerSource = fs.readFileSync(routerPath, "utf8");
  const headerSource = fs.readFileSync(headerPath, "utf8");
  const statusSource = fs.readFileSync(statusPath, "utf8");
  const readOnlyDecisionSource = fs.readFileSync(readOnlyDecisionPath, "utf8");

  assert.equal(routerSource.includes("showRestarbeitenV2Dev"), true);
  assert.equal(routerSource.includes("_hasExplicitRestarbeitenV2ProductiveReadOnlyFreigabe"), true);
  assert.equal(routerSource.includes("_isRestarbeitenV2ProductiveReadOnlyEnabled"), true);
  assert.equal(routerSource.includes("_getRestarbeitenV2ReadOnlyAccessState"), true);
  assert.equal(statusSource.includes("M18.5 Restarbeiten V2 ReadOnly-Freigabevorbereitung abgeschlossen und eingefroren"), true);
  assert.equal(readOnlyDecisionSource.includes("M18.5 Abschluss / Freeze"), true);
  assert.equal(routerSource.includes("Restarbeiten V2 ReadOnly"), true);
  assert.equal(routerSource.includes("Restarbeiten V2 ist derzeit nicht freigegeben."), true);
  assert.equal(headerSource.includes("Restarbeiten V2"), true);
  assert.equal(headerSource.includes("showRestarbeitenV2Dev"), true);

  const methodSourceMatch = routerSource.match(/async showRestarbeitenV2Dev\(\) \{[\s\S]*?\n  \}\n\n  \/\/ Kern-Routing mit Projektkontext:/);
  assert.ok(methodSourceMatch, "showRestarbeitenV2Dev body not found");
  const methodSource = methodSourceMatch[0];
  assert.equal(methodSource.includes("ipc"), false);
  assert.equal(methodSource.includes("db"), false);
  assert.equal(methodSource.includes("localStorage"), false);
  assert.equal(methodSource.includes("autosave"), false);
  assert.equal(methodSource.includes("createRestarbeitenV2ReadOnlyDataSourceFactory"), true);
  assert.equal(methodSource.includes("createRestarbeitenV2ReadOnlyAdapter"), false);
  assert.equal(methodSource.includes("listRestarbeitenByProject"), true);
  assert.equal(methodSource.includes("productive"), true);
  assert.equal(methodSource.includes("loadRestarbeiten"), true);
  assert.equal(methodSource.includes("createRestarbeitenV2FakeDataSource"), false);
  assert.equal(methodSource.includes("useDataSource: true"), true);
  assert.equal(methodSource.includes("const effectiveProjectId = this.currentProjectId || \"dev-restarbeiten-v2\";"), true);
  assert.equal(methodSource.includes("createRestarbeitV2"), false);
  assert.equal(methodSource.includes("updateRestarbeitV2"), false);
  assert.equal(methodSource.includes("deleteRestarbeitV2"), false);
  assert.equal(methodSource.includes("restarbeitenImportAttachments"), false);
  assert.equal(methodSource.includes("restarbeitenDeleteAttachment"), false);
  assert.equal(methodSource.includes("restarbeitenSetPrimaryAttachment"), false);
  assert.equal(methodSource.includes("autosave"), false);
  assert.equal(methodSource.includes("upload"), false);
  assert.equal(methodSource.includes("save"), false);
  assert.equal(routerSource.includes("restarbeit_id"), true);
  assert.equal(routerSource.includes("lfd_nr"), true);
  assert.equal(routerSource.includes("completion_note"), true);
  assert.equal(routerSource.includes("responsible_firm_name"), true);
  assert.equal(routerSource.includes("due_date"), true);

  const [
    { default: Router },
    { default: MainHeader },
    { default: ProjectWorkspaceScreen },
    { getActiveProjectModuleNavigation },
  ] = await Promise.all([
    importEsmFromFile(routerPath),
    importEsmFromFile(headerPath),
    importEsmFromFile(workspacePath),
    importEsmFromFile(moduleNavPath),
  ]);

  assert.equal(
    getActiveProjectModuleNavigation().some((entry) => String(entry?.moduleId || "").trim().toLowerCase() === "restarbeitenv2"),
    false
  );

  const routerOnOldUiMode = new Router({ contentRoot: null });
  routerOnOldUiMode._ensureProjectContextQuicklane = async () => ({ setContext() {}, setEnabled() {} });
  routerOnOldUiMode.context.settings = {};
  routerOnOldUiMode.currentProjectId = "project-ctx-17";
  routerOnOldUiMode.currentMeetingId = null;
  let oldPathShowCall = null;
  let oldPathV2Called = false;
  routerOnOldUiMode.show = async (view, options = {}) => {
    oldPathShowCall = { view, options };
    routerOnOldUiMode.activeSection = options?.section || null;
    return true;
  };
  routerOnOldUiMode.showRestarbeitenV2Dev = async () => {
    oldPathV2Called = true;
    return true;
  };
  await routerOnOldUiMode.openProjectModule("project-ctx-17", "restarbeiten", {
    project: { id: "project-ctx-17" },
  });
  assert.ok(oldPathShowCall);
  assert.equal(oldPathV2Called, false);
  assert.equal(oldPathShowCall.view?.constructor?.name, "RestarbeitenScreen");
  assert.equal(routerOnOldUiMode.currentProjectId, "project-ctx-17");
  assert.equal(routerOnOldUiMode.activeSection, "restarbeiten");
  assert.equal(routerOnOldUiMode._getRestarbeitenV2ReadOnlyAccessState(), null);

  const productDocument = createFakeDocument();
  const productPreviousDocument = globalThis.document;
  const productPreviousWindow = globalThis.window;
  const productPreviousAlert = globalThis.alert;
  const productiveLoaderCalls = [];
  globalThis.document = productDocument;
  globalThis.window = {
    localStorage: {
      getItem(key) {
        return key === "bbm.uiMode" ? "old" : null;
      },
      setItem() {},
      removeItem() {},
    },
    getComputedStyle(node) {
      return node?.style || {};
    },
    innerWidth: 1600,
    innerHeight: 1200,
    addEventListener() {},
    removeEventListener() {},
    bbmDb: {
      appIsPackaged: async () => ({ ok: true, isPackaged: true }),
      licenseGetStatus: async () => ({
        valid: true,
        modules: ["protokoll", "restarbeiten"],
      }),
      restarbeitenListByProject: async (payload) => {
        productiveLoaderCalls.push(payload);
        assert.deepEqual(payload, { projectId: "project-ctx-18" });
        return {
          ok: true,
          items: [
            {
              restarbeit_id: "LEG-201",
              lfd_nr: "LEG-201",
              title: "Lizenzierte Restarbeit",
              description: "Haus P",
              location: "Haus P",
              state: "open",
              completion_note: "Lizenz geladen",
              responsible_firm_name: "Firma Lizenz",
              due_date: "2026-07-15",
              note: "Lizenz geladen",
              attachments: [],
            },
          ],
        };
      },
      restarbeitenGetProjectSettings: async (payload) => {
        assert.deepEqual(payload, { projectId: "project-ctx-18" });
        return { ok: true, settings: {} };
      },
      projectFirmsListByProject: async (projectId) => {
        assert.equal(projectId, "project-ctx-18");
        return { ok: true, list: [] };
      },
      restarbeitenListAttachments: async (payload) => {
        assert.ok(payload?.restarbeitId);
        return { ok: true, attachments: [] };
      },
    },
  };
  globalThis.alert = () => {};
  try {
    const routerWithProductFreigabe = new Router({ contentRoot: productDocument.body });
    routerWithProductFreigabe._ensureProjectContextQuicklane = async () => ({ setContext() {}, setEnabled() {} });
    routerWithProductFreigabe.context.settings = {};
    routerWithProductFreigabe.currentProjectId = "project-ctx-18";
    routerWithProductFreigabe.currentMeetingId = null;
    await routerWithProductFreigabe.ensureActiveModuleAccess({ force: true });
    assert.equal(typeof routerWithProductFreigabe._hasExplicitRestarbeitenV2ProductiveReadOnlyFreigabe, "function");
    assert.equal(routerWithProductFreigabe._hasExplicitRestarbeitenV2ProductiveReadOnlyFreigabe(), false);
    assert.equal(routerWithProductFreigabe._getRestarbeitenV2ReadOnlyAccessState(), null);
    assert.equal(routerWithProductFreigabe._isRestarbeitenV2ProductiveReadOnlyEnabled(), false);
    assert.equal(routerWithProductFreigabe._shouldRouteRestarbeitenToV2ReadOnly("restarbeiten"), false);

    const productOpened = await routerWithProductFreigabe.openProjectModule("project-ctx-18", "restarbeiten", {
      project: {
        id: "project-ctx-18",
        project_number: "18",
        name: "Projekt 18",
      },
    });
    assert.equal(productOpened, true);
    assert.equal(routerWithProductFreigabe.currentProjectId, "project-ctx-18");
    assert.equal(routerWithProductFreigabe.activeSection, "restarbeiten");
    assert.equal(routerWithProductFreigabe._restarbeitenV2DevLoadedProjectId, undefined);
    const productHost = getNodeByAttr(productDocument.body, "data-ui-v2-restarbeiten-host", "true");
    assert.equal(productHost, null);

    routerWithProductFreigabe._hasExplicitRestarbeitenV2ProductiveReadOnlyFreigabe = () => true;
    assert.equal(routerWithProductFreigabe._hasExplicitRestarbeitenV2ProductiveReadOnlyFreigabe(), true);
    assert.equal(routerWithProductFreigabe._isRestarbeitenV2ProductiveReadOnlyEnabled(), true);
    assert.equal(routerWithProductFreigabe._getRestarbeitenV2ReadOnlyAccessState(), "productive");
    assert.equal(routerWithProductFreigabe._shouldRouteRestarbeitenToV2ReadOnly("restarbeiten"), true);

    const productiveOpened = await routerWithProductFreigabe.openProjectModule("project-ctx-18", "restarbeiten", {
      project: {
        id: "project-ctx-18",
        project_number: "18",
        name: "Projekt 18",
      },
    });
    assert.equal(productiveOpened, true);
    assert.equal(routerWithProductFreigabe.activeSection, "restarbeitenV2Dev");
    assert.equal(routerWithProductFreigabe.context?.ui?.pageTitle, "Restarbeiten V2 ReadOnly");
    assert.equal(routerWithProductFreigabe._restarbeitenV2DevLoadedProjectId, "project-ctx-18");
    assert.equal(productiveLoaderCalls.length > 0, true);
    assert.deepEqual(productiveLoaderCalls[0], { projectId: "project-ctx-18" });
    await flush();
    const productiveHost = getNodeByAttr(productDocument.body, "data-ui-v2-restarbeiten-host", "true");
    assert.ok(productiveHost);
    assert.ok(
      collectNodes(productiveHost, (node) =>
        String(node.textContent || "").includes("LEG-201 / Lizenzierte Restarbeit / Haus P / offen")
      ).length > 0
    );
  } finally {
    globalThis.document = productPreviousDocument;
    globalThis.window = productPreviousWindow;
    globalThis.alert = productPreviousAlert;
  }

  const document = createFakeDocument();
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const previousAlert = globalThis.alert;
  globalThis.document = document;
  globalThis.window = {
    localStorage: {
      getItem(key) {
        return key === "bbm.uiMode" ? "new" : null;
      },
      setItem() {},
      removeItem() {},
    },
    getComputedStyle(node) {
      return node?.style || {};
    },
    innerWidth: 1600,
    innerHeight: 1200,
    addEventListener() {},
    removeEventListener() {},
    bbmDb: {},
  };
  globalThis.alert = () => {};

  const contentRoot = document.body;
  let router = null;
  let header = null;

  try {
    router = new Router({ contentRoot });
    router._ensureProjectContextQuicklane = async () => ({ setContext() {}, setEnabled() {} });
    router.context.settings = {};
    router.currentProjectId = null;
    router.currentMeetingId = null;
    const originalShowRestarbeitenV2Dev = router.showRestarbeitenV2Dev.bind(router);

    header = new MainHeader({ router, version: "1.0.0" });
    header.render();
    header.refresh();

    const button = getNodeById(header.root, "restarbeitenv2.button") || collectNodes(header.root, (node) => node?.tagName === "BUTTON" && node?.textContent === "Restarbeiten V2")[0];
    assert.ok(button);
    assert.equal(button.disabled, false);

    let clicked = false;
    router.showRestarbeitenV2Dev = async () => {
      clicked = true;
      return true;
    };
    button.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(clicked, true);

    router.showRestarbeitenV2Dev = originalShowRestarbeitenV2Dev;
    await router.showRestarbeitenV2Dev();
    assert.equal(router.currentProjectId, null);
    assert.equal(router.currentMeetingId, null);
    assert.equal(router.activeSection, "restarbeitenV2Dev");
    assert.equal(router._restarbeitenV2DevLoadedProjectId, "dev-restarbeiten-v2");
    assert.equal(router.context?.ui?.pageTitle, "Restarbeiten V2 DEV");
    const restarbeitenHost = getNodeByAttr(contentRoot, "data-ui-v2-restarbeiten-host", "true");
    assert.ok(restarbeitenHost);
    const restarbeitenRoot = getNodeById(restarbeitenHost, "restarbeitenV2.root");
    assert.ok(restarbeitenRoot);
    assert.equal(getNodeById(restarbeitenHost, "restarbeitenV2.header").getAttribute("data-ui-v2-kind"), "frame");
    assert.equal(getNodeById(restarbeitenHost, "restarbeitenV2.quicklane").getAttribute("data-ui-v2-kind"), "frame");
    assert.equal(getNodeById(restarbeitenHost, "restarbeitenV2.main").getAttribute("data-ui-v2-kind"), "frame");
    assert.equal(getNodeById(restarbeitenHost, "restarbeitenV2.footer").getAttribute("data-ui-v2-kind"), "frame");
    assert.equal(getNodeById(restarbeitenHost, "restarbeitenV2.quicklane.lock").getAttribute("data-ui-v2-kind"), "control");
    assert.equal(getNodeById(restarbeitenHost, "restarbeitenV2.main.textbereich").getAttribute("data-ui-v2-kind"), "field");
    assert.equal(getNodeById(restarbeitenHost, "restarbeitenV2.footer.notiz").getAttribute("data-ui-v2-kind"), "field");
    await flush();
    assert.ok(getNodeByAttr(restarbeitenHost, "data-restarbeiten-v2-dummy-id", "DS-001"));
    assert.ok(getNodeByAttr(restarbeitenHost, "data-restarbeiten-v2-dummy-id", "DS-002"));
    assert.ok(getNodeByAttr(restarbeitenHost, "data-restarbeiten-v2-dummy-id", "DS-003"));
    assert.ok(collectNodes(restarbeitenHost, (node) => String(node.textContent || "").includes("DS-001 / Geladene Fake-Restarbeit / Haus A / offen")).length > 0);
    assert.ok(collectNodes(restarbeitenHost, (node) => String(node.textContent || "").includes("DS-002 / Fake erledigt / Wohnung 2 / erledigt")).length > 0);
    assert.ok(collectNodes(restarbeitenHost, (node) => String(node.textContent || "").includes("DS-003 / Fake Pruefung / Aussenanlage / offen")).length > 0);

    const documentWithProjectContext = createFakeDocument();
    globalThis.document = documentWithProjectContext;
    const legacyLoaderCalls = [];
    globalThis.window = {
      localStorage: {
        getItem(key) {
          return key === "bbm.uiMode" ? "new" : null;
        },
        setItem() {},
        removeItem() {},
      },
      getComputedStyle(node) {
        return node?.style || {};
      },
      innerWidth: 1600,
      innerHeight: 1200,
      addEventListener() {},
      removeEventListener() {},
      bbmDb: {
        async restarbeitenListByProject(payload) {
          legacyLoaderCalls.push(payload);
          assert.deepEqual(payload, { projectId: "project-ctx-17" });
          return {
            ok: true,
            items: [
              {
                restarbeit_id: "LEG-101",
                lfd_nr: "LEG-101",
                title: "Echte Legacy-Restarbeit",
                description: "Haus X",
                location: "Haus X",
                state: "open",
                completion_note: "Aus Legacy",
                responsible_firm_name: "Firma Legacy",
                due_date: "2026-06-30",
                note: "Legacy geladen",
                attachments: [],
              },
            ],
          };
        },
      },
    };
    const routerWithProjectContext = new Router({ contentRoot: documentWithProjectContext.body });
    routerWithProjectContext._ensureProjectContextQuicklane = async () => ({ setContext() {}, setEnabled() {} });
    routerWithProjectContext.context.settings = {};
    routerWithProjectContext.currentProjectId = "project-ctx-17";
    routerWithProjectContext.currentMeetingId = null;
    const workspaceScreen = new ProjectWorkspaceScreen({
      router: routerWithProjectContext,
      projectId: "project-ctx-17",
      project: {
        id: "project-ctx-17",
        project_number: "17",
        name: "Projekt 17",
      },
      projectModules: [
        {
          moduleId: "protokoll",
          label: "Protokoll",
          description: "Protokoll im aktuellen Projekt oeffnen.",
        },
        {
          moduleId: "restarbeiten",
          label: "Restarbeiten",
          description: "Restarbeiten im aktuellen Projekt oeffnen.",
        },
      ],
    });
    const workspaceHost = documentWithProjectContext.createElement("div");
    documentWithProjectContext.body.append(workspaceHost);
    workspaceHost.append(workspaceScreen.render());
    assert.equal(routerWithProjectContext.currentProjectId, "project-ctx-17");
    assert.equal(
      collectNodes(documentWithProjectContext.body, (node) =>
        String(node.textContent || "").includes("Projekt-Arbeitsbereich")
      ).length > 0,
      true
    );
    assert.equal(
      collectNodes(workspaceHost, (node) => String(node.textContent || "").includes("Restarbeiten")).length > 0,
      true
    );

    const originalOpenProjectModule = routerWithProjectContext.openProjectModule.bind(routerWithProjectContext);
    let workspaceOpenCall = null;
    routerWithProjectContext.openProjectModule = async (projectId, moduleId, options = {}) => {
      workspaceOpenCall = {
        projectId,
        moduleId,
        options,
      };
      assert.equal(projectId, "project-ctx-17");
      assert.equal(moduleId, "restarbeiten");
      assert.equal(options?.project?.id, "project-ctx-17");
      return await originalOpenProjectModule(projectId, moduleId, options);
    };

    const restarbeitenButton = collectNodes(
      workspaceHost,
      (node) => node?.tagName === "BUTTON" && String(node.textContent || "").trim() === "Restarbeiten"
    )[0];
    assert.ok(restarbeitenButton);
    await restarbeitenButton.onclick?.({
      preventDefault() {},
      stopPropagation() {},
    });
    await flush();

    routerWithProjectContext.openProjectModule = originalOpenProjectModule;

    assert.ok(workspaceOpenCall);
    assert.equal(routerWithProjectContext.currentProjectId, "project-ctx-17");
    assert.equal(routerWithProjectContext._restarbeitenV2DevLoadedProjectId, "project-ctx-17");
    assert.equal(routerWithProjectContext.activeSection, "restarbeitenV2Dev");
    assert.equal(legacyLoaderCalls.length, 1);
    assert.equal(
      routerWithProjectContext.showRestarbeitenV2Dev.toString().includes("createRestarbeitV2"),
      false
    );
    const projectContextHost = getNodeByAttr(documentWithProjectContext.body, "data-ui-v2-restarbeiten-host", "true");
    assert.ok(projectContextHost);
    assert.ok(getNodeByAttr(projectContextHost, "data-restarbeiten-v2-dummy-id", "LEG-101"));
    assert.ok(
      collectNodes(projectContextHost, (node) => String(node.textContent || "").includes("LEG-101 / Echte Legacy-Restarbeit / Haus X / offen")).length >
        0
    );
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
    globalThis.alert = previousAlert;
    router = null;
    header = null;
  }

  const diffFiles = execFileSync("git", ["diff", "--name-only"], {
    cwd: path.join(__dirname, "../.."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);

  await run("Restarbeiten V2 ist als DEV-Testzugang sichtbar", () => undefined);
}

if (require.main === module) {
  const run = async (name, fn) => {
    try {
      const out = fn();
      if (out && typeof out.then === "function") await out;
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runRestarbeitenV2DevAccessTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2DevAccess.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2DevAccessTests };
