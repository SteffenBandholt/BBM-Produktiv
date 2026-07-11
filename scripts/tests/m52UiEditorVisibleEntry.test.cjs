const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.join(__dirname, "../..");
const { getBbmUiElementRegistry } = require("../../src/ui-editor/bbm-ui-element-registry.cjs");
const { _m52 } = require("../../src/main/ipc/uiEditorIpc.js");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(file) {
  return fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
}

function createContractRuntime({ hostAdapter, manifest, registry, layoutStore }) {
  return {
    ok: true,
    manifest,
    registry,
    layoutStore,
    viewModels: {
      statusViewModel: { adapterValid: true, runtimeStarted: true },
      scopeViewModel: {
        activeUiScope: manifest.defaultUiScope,
        activeLayoutScope: manifest.defaultLayoutScope,
        activeLayoutProfileId: manifest.defaultLayoutProfileId,
      },
      selectionViewModel: { selectElement: hostAdapter.selectElement },
      layoutControlViewModel: {
        load: hostAdapter.getCurrentLayoutState,
        save: hostAdapter.saveLayoutState,
        reset: hostAdapter.resetLayoutState,
      },
    },
  };
}

function startTestSession() {
  _m52.ensureRuntime({ forceRestart: true, runtimeOptions: { coreApi: { createTargetAppAdapterRuntime: createContractRuntime } } });
}

function createPanelTestDocument() {
  const createNode = (tag, doc) => ({
    tagName: String(tag || "").toUpperCase(),
    ownerDocument: doc,
    children: [],
    attributes: {},
    className: "",
    textContent: "",
    hidden: false,
    style: {},
    dataset: {},
    disabled: false,
    type: "",
    append(...nodes) {
      for (const node of nodes) this.appendChild(node);
    },
    appendChild(node) {
      if (node) {
        node.parentElement = this;
        this.children.push(node);
      }
      return node;
    },
    setAttribute(name, value) {
      this.attributes[String(name)] = String(value);
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, String(name)) ? this.attributes[String(name)] : null;
    },
    addEventListener() {},
    click() {
      if (typeof this.onclick === "function") return this.onclick({ type: "click", target: this });
      return undefined;
    },
  });

  const doc = {
    createElement(tag) {
      return createNode(tag, doc);
    },
  };
  doc.head = createNode("head", doc);
  doc.body = createNode("body", doc);
  return doc;
}

function findNode(node, predicate) {
  if (!node) return null;
  if (predicate(node)) return node;
  for (const child of node.children || []) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return null;
}

async function runM52UiEditorVisibleEntryTests(run) {
  await run("M52 Startpunkt: bestehende Navigation enthaelt eindeutigen UI-Editor-Status-Einstieg", () => {
    const navigation = read("src/renderer/app/coreShellNavigation.js");
    const router = read("src/renderer/app/Router.js");
    assert.match(navigation, /label:\s*"UI-Editor Status"/);
    assert.doesNotMatch(navigation, /label:\s*"UI-Editor"[,}]/);
    assert.match(navigation, /router\.showUiEditor\(\)/);
    const coreShell = read("src/renderer/app/CoreShell.js");
    assert.match(router, /async showUiEditor\(\)/);
    assert.match(router, /const panel = createBbmUiEditorStatusPanel\(\{ router: this \}\);/);
    assert.match(router, /this\.show\(panel, \{/);
    assert.doesNotMatch(router, /this\.show\(panel\.render\(\), \{/);
    assert.match(router, /showSettings\(\)/);
    assert.match(coreShell, /const routeButtons = shellNavigationRouteDefs\.map/);
    assert.match(coreShell, /const coreNavigationButtons = \[\.\.\.routeButtons, btnHelp\]/);
    assert.doesNotMatch(coreShell, /const \[btnHome, btnProjects, btnFirms, btnSettings\]/);
  });

  await run("M52 Renderer-Panel: Kopf, Status, Elementliste, Details und Schliessen sind sichtbar vorbereitet", () => {
    const panel = read("src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
    assert.match(panel, /textContent = "UI-Editor"/);
    assert.match(panel, /UI-Editor-kit/);
    assert.match(panel, /targetAppId/);
    assert.match(panel, /Aktiver UI-Scope/);
    assert.match(panel, /Layoutprofil/);
    assert.match(panel, /Registrierte UI-Elemente/);
    assert.match(panel, /Elementdetails/);
    assert.match(panel, /data-bbm-ui-editor-close/);
    assert.match(panel, /uiEditorClose/);
  });


  await run("M52 echte Navigationskette: UI-Editor-Route bindet onClick und nutzt Router.show-Schnittstelle", async () => {
    const previousDocument = global.document;
    const previousWindow = global.window;
    const doc = createPanelTestDocument();
    global.document = doc;
    global.window = {
      bbmDb: {
        uiEditorOpen: async () => ({ ok: false, blockCode: "BBM_UI_EDITOR_TEST_BLOCK" }),
      },
    };

    try {
      const navigationModule = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/app/coreShellNavigation.js"));
      const buttonModule = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/app/coreShellButtons.js"));
      const panelModule = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js"));

      const contentRoot = doc.createElement("main");
      contentRoot.appendChild(doc.createElement("p"));
      let activeSection = null;
      const showCalls = [];
      let createdPanel = null;
      let renderCallCount = 0;
      let legacyToggleCalls = 0;
      const router = {
        legacyUiEditorToggle() {
          legacyToggleCalls += 1;
        },
        async show(view, options = {}) {
          activeSection = options.section || null;
          contentRoot.innerHTML = "";
          contentRoot.children = [];
          assert.equal(view, createdPanel);
          assert.equal(typeof view.render, "function");
          const rendered = view.render();
          contentRoot.appendChild(rendered);
          if (typeof view.load === "function") await view.load();
          showCalls.push({ view, options, rendered, childCount: contentRoot.children.length });
        },
        async showUiEditor() {
          const panel = panelModule.createBbmUiEditorStatusPanel({ router: this });
          createdPanel = panel;
          const originalRender = panel.render.bind(panel);
          panel.render = () => {
            renderCallCount += 1;
            return originalRender();
          };
          await this.show(panel, {
            section: "uiEditor",
            isTopsView: false,
            pageTitle: "UI-Editor",
            hideSidebar: false,
          });
        },
      };

      const routeDefs = navigationModule.createCoreShellNavigationRouteDefs(router);
      const uiEditorRoute = routeDefs.find((route) => route.key === "uiEditor");
      assert.ok(uiEditorRoute, "uiEditor route missing");
      assert.equal(uiEditorRoute.label, "UI-Editor Status");

      const buttonsByKey = new Map();
      const button = buttonModule.createScreenRouteButton(
        { buttonsByKey, runNavSafe: (fn) => async () => fn() },
        uiEditorRoute
      );
      assert.equal(buttonsByKey.get("uiEditor"), button);
      assert.equal(typeof button.onclick, "function");

      await button.onclick();

      assert.equal(showCalls.length, 1);
      assert.equal(legacyToggleCalls, 0);
      assert.equal(renderCallCount, 1);
      assert.equal(showCalls[0].view, createdPanel);
      assert.equal(activeSection, "uiEditor");
      assert.equal(showCalls[0].options.section, "uiEditor");
      assert.equal(showCalls[0].rendered.tagName, "SECTION");
      assert.equal(showCalls[0].rendered.getAttribute("data-bbm-ui-editor-panel"), "true");
      assert.equal(contentRoot.children.length, 1);
      assert.equal(contentRoot.children[0], showCalls[0].rendered);
      assert.ok(findNode(contentRoot.children[0], (node) => node.textContent === "UI-Editor"));
      assert.equal(findNode(contentRoot.children[0], (node) => node.getAttribute?.("data-ui-editor-launcher-host") === "true"), null);
      assert.equal(findNode(contentRoot.children[0], (node) => node.getAttribute?.("data-ui-editor-panel") === "true"), null);
      assert.equal(findNode(contentRoot.children[0], (node) => node.getAttribute?.("data-ui-editor-hover-frame") === "true"), null);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("M52 Runtime: M51-Startfunktion wird ueber sichere IPC-Bruecke verwendet", () => {
    const ipc = read("src/main/ipc/uiEditorIpc.js");
    const main = read("src/main/main.js");
    const preload = read("src/main/preload.js");
    assert.match(ipc, /startBbmUiEditorRuntime/);
    assert.match(ipc, /getBbmUiEditorIntegrationStatus/);
    assert.match(ipc, /let session = null/);
    assert.match(main, /registerUiEditorIpc\(\)/);
    assert.match(preload, /uiEditorOpen/);
    assert.match(preload, /uiEditorGetStatus/);
    assert.match(preload, /uiEditorSelectElement/);
    assert.doesNotMatch(preload, /eval|nodeIntegration\s*:\s*true|contextIsolation\s*:\s*false/);
  });


  await run("M52 Fehlerweitergabe: invalid_adapter_manifest bleibt bis zur IPC-Statusantwort erhalten", () => {
    const invalidManifest = { ...require("../../src/ui-editor/bbm-ui-editor-manifest.cjs").getBbmUiEditorManifest() };
    delete invalidManifest.uiScope;
    _m52.closeUiEditorSession();
    _m52.ensureRuntime({ forceRestart: true, runtimeOptions: { manifest: invalidManifest } });
    const status = _m52.getUiEditorStatus();
    assert.equal(status.ok, false);
    assert.equal(status.blockCode, "invalid_adapter_manifest");
    _m52.closeUiEditorSession();
  });

  await run("M52 Status: Ziel-App, Version, Scopes, Layoutprofil und Elementanzahl kommen aus M51", () => {
    _m52.closeUiEditorSession();
    startTestSession();
    const status = _m52.getUiEditorStatus();
    const registry = getBbmUiElementRegistry("bbm.main");
    assert.equal(status.ok, true);
    assert.equal(status.targetAppId, "bbm-produktiv");
    assert.equal(status.targetAppName, "BBM");
    assert.equal(status.uiEditorKitVersion, "v0.2.0");
    assert.equal(status.activeUiScope, "bbm.main");
    assert.equal(status.activeLayoutScope, "bbm.main-layout");
    assert.equal(status.activeLayoutProfileId, "default");
    assert.equal(status.registeredElementCount, registry.elements.length);
    assert.equal(status.layoutStoreAvailable, true);
    assert.equal(status.layout.canLoad, true);
    assert.equal(status.layout.canSave, true);
    assert.equal(status.layout.canReset, true);
  });

  await run("M52 Elementliste und Auswahl: nur explizite Registry-Elemente, gueltige Auswahl und unbekannte ID blockiert", () => {
    _m52.closeUiEditorSession();
    startTestSession();
    const registry = getBbmUiElementRegistry("bbm.main");
    const elements = _m52.getUiEditorElements();
    assert.equal(elements.ok, true);
    assert.deepEqual(elements.elements.map((element) => element.elementId), registry.elements.map((element) => element.elementId));
    assert.equal(new Set(elements.elements.map((element) => element.elementId)).size, elements.elements.length);

    const selected = _m52.selectUiEditorElement({ elementId: "bbm.main.content" });
    assert.equal(selected.ok, true);
    assert.equal(selected.selectedElement.elementId, "bbm.main.content");
    const details = _m52.getSelectedUiEditorElementDetails();
    assert.equal(details.ok, true);
    assert.equal(details.selectedElement.label, "Inhaltsbereich");
    assert.deepEqual(details.selectedElement.allowedChanges, ["layout.read", "layout.save", "layout.reset"]);

    const blocked = _m52.selectUiEditorElement({ elementId: "bbm.main.unknown" });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.blockCode, "BBM_UI_ELEMENT_UNKNOWN");
    assert.doesNotMatch(blocked.message, /Error:| at /);
  });

  await run("M52 Sicherheit: keine DOM-Erkennung, kein eval, keine unsichere Electron-Option und keine Core-Kopie", () => {
    const files = [
      "src/main/ipc/uiEditorIpc.js",
      "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
      "src/renderer/ui-editor/bbmUiEditorStatusPanel.css.js",
    ];
    const preload = read("src/main/preload.js");
    const m52PreloadBlock = preload.slice(preload.indexOf("// UI-Editor M52"), preload.indexOf("});", preload.indexOf("// UI-Editor M52")));
    const combined = files.map(read).join("\n") + "\n" + m52PreloadBlock;
    assert.doesNotMatch(combined, /querySelectorAll|getElementsBy|MutationObserver|DOMParser|autoDiscovery\s*:\s*true/);
    assert.doesNotMatch(combined, /eval\s*\(/);
    assert.doesNotMatch(combined, /nodeIntegration\s*:\s*true|contextIsolation\s*:\s*false/);
    assert.doesNotMatch(combined, /better-sqlite3|CREATE TABLE|ALTER TABLE|INSERT INTO|UPDATE\s+\w+\s+SET/);
    assert.doesNotMatch(combined, /require\(["']ui-editor-kit["']\)/);
    assert.match(read("src/ui-editor/start-bbm-ui-editor-runtime.cjs"), /require\("ui-editor-kit"\)/);
  });

  await run("M52 Dokumentation: M52-Doku, README und STATUS nennen sichtbaren Startpunkt und Grenzen", () => {
    const doc = read("docs/M52_UI_EDITOR_SICHTBARER_STARTPUNKT.md");
    const readme = read("README.md");
    const status = read("STATUS.md");
    assert.match(doc, /sichtbarer Einstieg/i);
    assert.match(doc, /M53/);
    assert.match(doc, /keine DOM-Erkennung|DOM-Erkennung/i);
    assert.match(readme, /M52/);
    assert.match(readme, /noch keine vollstaendige Bearbeitung/i);
    assert.match(status, /M52/);
    assert.match(status, /Layoutbearbeitung noch nicht moeglich/i);
  });
}

module.exports = { runM52UiEditorVisibleEntryTests };
