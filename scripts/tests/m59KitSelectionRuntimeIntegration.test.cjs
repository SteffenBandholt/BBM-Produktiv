const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const KIT_MERGE_COMMIT = "af1fbabd0b875a4ab382ed84c5cd986c3c7acb14";
const KIT_SPEC = `github:SteffenBandholt/UI-Editor-kit#${KIT_MERGE_COMMIT}`;
const EXPECTED_EXPORTS = [
  "createSelectionController",
  "createHoverOverlay",
  "createSelectedOverlay",
  "resolveSelectionTarget",
  "SelectionRuntimeErrorCodes",
  "SELECTION_CONTRACT_VERSION",
];

function read(file) {
  return fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
}

function readJson(file) {
  return JSON.parse(read(file));
}

function count(text, pattern) {
  const match = text.match(new RegExp(pattern, "g"));
  return match ? match.length : 0;
}

class TestHTMLElement {
  constructor(name) {
    this.name = name;
    this.ownerDocument = null;
    this.children = [];
    this.parentNode = null;
  }
  appendChild(child) {
    child.parentNode = this;
    child.ownerDocument = child.ownerDocument || this.ownerDocument;
    this.children.push(child);
    return child;
  }
  contains(target) {
    let node = target;
    while (node) {
      if (node === this) return true;
      node = node.parentNode || null;
    }
    return false;
  }
}

function createDoc() {
  const doc = { defaultView: { HTMLElement: TestHTMLElement } };
  return doc;
}

class TestNode {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.className = "";
    this.hidden = false;
    this.textContent = "";
    this.type = "";
    this.value = "";
    this.disabled = false;
  }
  append(...children) {
    this.children.push(...children);
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  addEventListener() {}
  set innerHTML(_value) {
    this.children = [];
  }
}

function createPanelDocument() {
  return {
    createElement: (tagName) => new TestNode(tagName),
  };
}

function findFirstNode(root, tagName) {
  if (root?.tagName === tagName) return root;
  for (const child of root?.children || []) {
    const found = findFirstNode(child, tagName);
    if (found) return found;
  }
  return null;
}

async function runM59KitSelectionRuntimeIntegrationTests(run) {
  await run("M59 Abhaengigkeit: UI-Editor-kit ist auf M59-Kit-Merge-Commit gepinnt und Exportvertrag ist pruefbar", () => {
    const pkg = readJson("package.json");
    const lock = readJson("package-lock.json");
    assert.equal(pkg.dependencies["ui-editor-kit"], KIT_SPEC);
    assert.equal(lock.packages[""].dependencies["ui-editor-kit"], KIT_SPEC);
    assert.match(lock.packages["node_modules/ui-editor-kit"].resolved, new RegExp(`${KIT_MERGE_COMMIT}$`));
    const browserRuntimePath = path.join(REPO_ROOT, "node_modules/ui-editor-kit/dist/selection-runtime.browser.mjs");
    if (!fs.existsSync(browserRuntimePath)) {
      return;
    }
    return importEsmFromFile(browserRuntimePath).then((kit) => {
      const missing = EXPECTED_EXPORTS.filter((name) => !(name in kit));
      assert.deepEqual(missing, [], `Lokale node_modules sind nicht auf den M59-Kit-Merge-Commit aktualisiert: ${missing.join(", ")}`);
      assert.equal(kit.SELECTION_CONTRACT_VERSION, "selection-target-contract-v1.0");
    });
  });

  await run("M59 Host-Bridge: nutzt Registry-Liste, M54-Refs, M52-Auswahl und expliziten Panel-Ausschluss", async () => {
    const refs = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js"));
    const { createBbmKitSelectionHost } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmKitSelectionHost.js"));
    refs.clearBbmUiElementRefs();
    const doc = createDoc();
    const shell = new TestHTMLElement("shell");
    const header = new TestHTMLElement("header");
    const panel = new TestHTMLElement("panel");
    const panelChild = new TestHTMLElement("panel-child");
    shell.ownerDocument = doc;
    header.ownerDocument = doc;
    panel.ownerDocument = doc;
    panelChild.ownerDocument = doc;
    panel.appendChild(panelChild);
    shell.appendChild(header);
    refs.registerBbmUiElementRef("bbm.main.shell", shell);
    refs.registerBbmUiElementRef("bbm.main.header", header);
    let selectedElement = { elementId: "bbm.main.header", label: "Seitenkopf" };
    const selectedCalls = [];
    const host = createBbmKitSelectionHost({
      getRegistryElements: () => [{ elementId: "bbm.main.header", label: "Seitenkopf", type: "frame" }],
      getSelectedElement: () => selectedElement,
      selectElement: (elementId) => { selectedCalls.push(elementId); selectedElement = { elementId, label: "Navigation" }; },
      getPanelRoot: () => panel,
    });
    assert.deepEqual(host.listSelectableTargets().map((target) => target.elementId), ["bbm.main.header"]);
    assert.equal(host.getElementRef("bbm.main.header"), header);
    assert.equal(host.getSelectedElementId(), "bbm.main.header");
    assert.equal(host.getInteractionRoot(), shell);
    assert.equal(host.isExcludedTarget(panelChild), true);
    assert.equal(host.isExcludedTarget(header), false);
    await host.selectElement("bbm.main.navigation");
    assert.deepEqual(selectedCalls, ["bbm.main.navigation"]);
    assert.equal(host.getSelectedElementId(), "bbm.main.navigation");
  });

  await run("M59/M61 Kit-Runtime ist im Statuspanel exklusiv verdrahtet", () => {
    const panel = read("src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
    assert.match(panel, /Auswahl-Laufzeit/);
    assert.match(panel, /selectionRuntimeLabel\(\)/);
    assert.match(panel, /selection-runtime\.browser\.mjs/);
    assert.doesNotMatch(panel, /import\(["']ui-editor-kit["']\)/);
    assert.doesNotMatch(panel, /switchSelectionRuntime/);
    assert.doesNotMatch(panel, /createBbmUiElementSelectionController/);
    assert.doesNotMatch(panel, /bbmSelectionController/);
    assert.match(panel, /destroyKitController/);
    assert.equal(count(panel, "createSelectionController\\("), 1);
    assert.match(panel, /syncActiveSelectionRuntime/);
    assert.match(panel, /syncWithSelection/);
    assert.match(panel, /hover: \{ zIndex:/);
    assert.match(panel, /selected: \{ zIndex:/);
  });

  await run("M59/M61 Kit-Auswahl und Lifecycle nutzen dieselbe M52-Auswahl und raeumen Controller auf", () => {
    const panel = read("src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
    assert.match(panel, /selectElement: \(elementId\) => this\.selectElement\(elementId, \{ fromSelectionMode: true \}\)/);
    assert.match(panel, /getSelectedElement: \(\) => this\.selectedElement/);
    assert.match(panel, /this\.destroyKitController\(\)/);
    assert.doesNotMatch(panel, /this\.selectionRuntime = "bbm"/);
    assert.match(panel, /this\.runtimeError = error\?\.message/);
    assert.match(panel, /this\.kitSelectionController\?\.stop\?\.\(\)/);
    assert.match(panel, /this\.kitSelectionController\?\.destroy\?\.\(\)/);
  });


  await run("M59 Verhalten: Kit-Synchronisation nutzt syncWithSelection bei Reset und Refresh", async () => {
    const previousWindow = global.window;
    try {
      const { BbmUiEditorStatusPanel } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js"));
      const panel = new BbmUiEditorStatusPanel({});
      let kitSyncCount = 0;
      let bbmHoverSyncCount = 0;
      let selectedClearCount = 0;
      let selectedSyncCount = 0;
      panel.renderAll = () => {};
      panel.selectedElement = { elementId: "bbm.main.header", label: "Seitenkopf" };
      panel.kitSelectionController = { syncWithSelection() { kitSyncCount += 1; } };

      panel.syncActiveSelectionRuntime();
      assert.equal(kitSyncCount, 1);
      assert.equal(bbmHoverSyncCount, 0);
      assert.equal(selectedClearCount, 0);
      assert.equal(selectedSyncCount, 0);

      panel.selectElement = async () => { panel.selectedElement = null; };
      await panel.resetSelection();
      assert.equal(panel.selectedElement, null);
      assert.equal(kitSyncCount, 2);
      assert.equal(bbmHoverSyncCount, 0);
      assert.equal(selectedClearCount, 0);

      global.window = {
        bbmDb: {
          uiEditorOpen: async () => ({ ok: true, runtimeStarted: true, adapterValid: true }),
          uiEditorGetElements: async () => ({ ok: true, elements: [] }),
          uiEditorGetSelectedElementDetails: async () => ({ ok: true, selectedElement: null }),
        },
      };
      await panel.refresh();
      assert.equal(panel.selectedElement, null);
      assert.equal(kitSyncCount >= 3, true);
      assert.equal(bbmHoverSyncCount, 0);
      assert.equal(selectedClearCount, 0);
    } finally {
      global.window = previousWindow;
    }
  });

  await run("M59/M61 Verhalten: Runtime-Dropdown ist entfernt und Kit-Label bleibt sichtbar", async () => {
    const previousDocument = global.document;
    try {
      global.document = createPanelDocument();
      const { BbmUiEditorStatusPanel } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js"));
      const panel = new BbmUiEditorStatusPanel({});
      panel.statusNode = new TestNode("section");
      panel.elementsNode = new TestNode("section");
      panel.detailsNode = new TestNode("section");
      panel.errorNode = new TestNode("div");
      panel.status = { ok: true };
      panel.refStatus = { count: 0, expectedCount: 0, missingIds: [] };
      panel.elements = [];
      panel.selectedElement = null;

      panel.renderAll();
      assert.equal(findFirstNode(panel.statusNode, "select"), null);
      assert.equal(panel.selectionRuntimeLabel(), "UI-Editor-kit");
      panel.renderAll();
      assert.equal(findFirstNode(panel.statusNode, "select"), null);
    } finally {
      global.document = previousDocument;
    }
  });

  await run("M59 Sicherheit: keine DOM-Suche, keine neue Registry, kein IPC, keine Speicherung, keine Kit-Codekopie", () => {
    const files = [
      "src/renderer/ui-editor/bbmKitSelectionHost.js",
      "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
    ];
    const combined = files.map(read).join("\n");
    for (const forbidden of [
      "querySelector", "querySelectorAll", "getElementById", "getElementsBy", ".closest", ".matches", "MutationObserver",
      "elementFromPoint", "elementsFromPoint", "localStorage", "ipcRenderer", "uiEditorSelectRuntime",
    ]) {
      assert.equal(combined.includes(forbidden), false, `${forbidden} darf in M59-Integration nicht vorkommen`);
    }
    assert.equal(combined.includes("data-ui-editor-storage"), false);
    assert.equal(count(combined, "createBbmKitSelectionHost"), 3);
    assert.equal(count(combined, "createHoverOverlay"), 0);
    assert.equal(count(combined, "createSelectedOverlay"), 0);
  });
}

module.exports = { runM59KitSelectionRuntimeIntegrationTests };


if (require.main === module) {
  let failed = false;
  const run = async (name, fn) => {
    try {
      await fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed = true;
      console.error(`not ok - ${name}`);
      console.error(error?.stack || error?.message || error);
    }
  };
  runM59KitSelectionRuntimeIntegrationTests(run).then(() => {
    if (failed) process.exitCode = 1;
  }).catch((error) => {
    process.exitCode = 1;
    console.error(error?.stack || error?.message || error);
  });
}
