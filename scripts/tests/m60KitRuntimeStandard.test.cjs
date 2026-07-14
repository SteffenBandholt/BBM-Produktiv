const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");

function read(file) {
  return fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
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

function createBbmDb() {
  let selectedElement = null;
  return {
    async uiEditorOpen() {
      return { ok: true, runtimeStarted: true, adapterValid: true, targetAppName: "BBM" };
    },
    async uiEditorGetElements() {
      return { ok: true, elements: [{ elementId: "bbm.main.header", label: "Seitenkopf", type: "frame" }] };
    },
    async uiEditorGetSelectedElementDetails() {
      return { ok: true, selectedElement };
    },
    async uiEditorSelectElement({ elementId }) {
      selectedElement = elementId ? { elementId, label: elementId } : null;
      return { ok: true };
    },
    async uiEditorClose() {
      return { ok: true };
    },
  };
}

function createPanelHarness(panel) {
  panel.statusNode = new TestNode("section");
  panel.elementsNode = new TestNode("section");
  panel.detailsNode = new TestNode("section");
  panel.errorNode = new TestNode("div");
  panel.bbmSelectionController = {
    startCount: 0,
    stopCount: 0,
    destroyCount: 0,
    active: false,
    start() { this.active = true; this.startCount += 1; },
    stop() { this.active = false; this.stopCount += 1; },
    destroy() { this.destroyCount += 1; },
    isActive() { return this.active; },
    syncHoverWithSelection() {},
  };
  panel.selectedOverlay = {
    clearCount: 0,
    destroyCount: 0,
    clear() { this.clearCount += 1; },
    sync() { return true; },
    destroy() { this.destroyCount += 1; },
  };
}

async function loadPanelClass() {
  return importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js"));
}

async function runM60KitRuntimeStandardTests(run) {
  await run("M60 Panel-Start: selectionRuntime ist standardmaessig kit", async () => {
    const { BbmUiEditorStatusPanel } = await loadPanelClass();
    const panel = new BbmUiEditorStatusPanel({});
    assert.equal(panel.selectionRuntime, "kit");
    assert.equal(panel.selectionController, null);
  });

  await run("M60 Kit-Erfolg: aktive Runtime, Controller und Dropdown stehen auf kit", async () => {
    const previousWindow = global.window;
    const previousDocument = global.document;
    try {
      global.window = { bbmDb: createBbmDb() };
      global.document = createPanelDocument();
      const { BbmUiEditorStatusPanel } = await loadPanelClass();
      const panel = new BbmUiEditorStatusPanel({});
      createPanelHarness(panel);
      let createCount = 0;
      const kitController = { stopCount: 0, destroyCount: 0, syncCount: 0, stop() { this.stopCount += 1; }, destroy() { this.destroyCount += 1; }, syncWithSelection() { this.syncCount += 1; } };
      panel.ensureKitController = async () => { createCount += 1; panel.kitSelectionController = kitController; return kitController; };

      await panel.refresh();

      assert.equal(createCount, 1);
      assert.equal(panel.selectionRuntime, "kit");
      assert.equal(panel.selectionController, kitController);
      assert.equal(panel.kitSelectionController, kitController);
      assert.equal(findFirstNode(panel.statusNode, "select")?.value, "kit");
      assert.equal(panel.runtimeError, "");
    } finally {
      global.window = previousWindow;
      global.document = previousDocument;
    }
  });

  await run("M60 Kit-Fehler: faellt sichtbar und sauber auf BBM zurueck", async () => {
    const previousWindow = global.window;
    const previousDocument = global.document;
    try {
      global.window = { bbmDb: createBbmDb() };
      global.document = createPanelDocument();
      const { BbmUiEditorStatusPanel } = await loadPanelClass();
      const panel = new BbmUiEditorStatusPanel({});
      createPanelHarness(panel);
      panel.ensureKitController = async () => { panel.kitSelectionController = { stop() {}, destroy() {} }; throw new Error("Kit kaputt"); };

      await panel.refresh();

      assert.equal(panel.selectionRuntime, "bbm");
      assert.equal(panel.selectionController, panel.bbmSelectionController);
      assert.equal(panel.kitSelectionController, null);
      assert.match(panel.runtimeError, /Kit kaputt/);
      assert.equal(findFirstNode(panel.statusNode, "select")?.value, "bbm");
    } finally {
      global.window = previousWindow;
      global.document = previousDocument;
    }
  });

  await run("M60 close/destroy: Kit-Controller und Overlays werden bereinigt", async () => {
    const previousWindow = global.window;
    const previousDocument = global.document;
    try {
      global.window = { bbmDb: createBbmDb() };
      global.document = createPanelDocument();
      const { BbmUiEditorStatusPanel } = await loadPanelClass();
      const panel = new BbmUiEditorStatusPanel({ router: { activeSection: "uiEditor", showSettings: async () => {} } });
      createPanelHarness(panel);
      const kitController = { stopCount: 0, destroyCount: 0, stop() { this.stopCount += 1; }, destroy() { this.destroyCount += 1; } };
      panel.kitSelectionController = kitController;
      panel.selectionRuntime = "kit";
      panel.selectionController = kitController;

      await panel.close();

      assert.equal(kitController.stopCount >= 1, true);
      assert.equal(kitController.destroyCount, 1);
      assert.equal(panel.kitSelectionController, null);
      assert.equal(panel.selectedOverlay.destroyCount, 1);

      panel.kitSelectionController = kitController;
      panel.destroy();
      assert.equal(panel.kitSelectionController, null);
    } finally {
      global.window = previousWindow;
      global.document = previousDocument;
    }
  });

  await run("M60 Wiederholtes Oeffnen: erzeugt pro Panel nur einen Kit-Controller", async () => {
    const previousWindow = global.window;
    const previousDocument = global.document;
    try {
      global.window = { bbmDb: createBbmDb() };
      global.document = createPanelDocument();
      const { BbmUiEditorStatusPanel } = await loadPanelClass();
      const panel = new BbmUiEditorStatusPanel({});
      createPanelHarness(panel);
      let createCount = 0;
      const kitController = { stop() {}, destroy() {}, syncWithSelection() {} };
      panel.ensureKitController = async function ensureOnce() {
        if (this.kitSelectionController) return this.kitSelectionController;
        createCount += 1;
        this.kitSelectionController = kitController;
        return kitController;
      };

      await panel.refresh();
      await panel.refresh();

      assert.equal(createCount, 1);
      assert.equal(panel.selectionController, kitController);
    } finally {
      global.window = previousWindow;
      global.document = previousDocument;
    }
  });

  await run("M60 Manueller Wechsel kit -> bbm -> kit bleibt moeglich", async () => {
    const previousDocument = global.document;
    global.document = createPanelDocument();
    const { BbmUiEditorStatusPanel } = await loadPanelClass();
    const panel = new BbmUiEditorStatusPanel({});
    createPanelHarness(panel);
    const kitControllers = [];
    panel.ensureKitController = async function createKit() {
      const controller = { stopCount: 0, destroyCount: 0, syncWithSelection() {}, stop() { this.stopCount += 1; }, destroy() { this.destroyCount += 1; } };
      kitControllers.push(controller);
      this.kitSelectionController = controller;
      return controller;
    };

    await panel.switchSelectionRuntime("bbm");
    assert.equal(panel.selectionRuntime, "bbm");
    assert.equal(panel.selectionController, panel.bbmSelectionController);

    await panel.switchSelectionRuntime("kit");
    assert.equal(panel.selectionRuntime, "kit");
    assert.equal(panel.selectionController, kitControllers[0]);

    await panel.switchSelectionRuntime("bbm");
    assert.equal(panel.selectionRuntime, "bbm");
    assert.equal(kitControllers[0].destroyCount, 1);

    await panel.switchSelectionRuntime("kit");
    assert.equal(panel.selectionRuntime, "kit");
    assert.equal(panel.selectionController, kitControllers[1]);
    global.document = previousDocument;
  });

  await run("M60 Sicherheit: keine DOM-Suche, Persistenz, neue Registry oder Kit-Repo-Aenderung", () => {
    const combined = [
      "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
      "src/renderer/ui-editor/bbmKitSelectionHost.js",
    ].map(read).join("\n");
    for (const forbidden of [
      "querySelector", "querySelectorAll", "getElementById", "getElementsBy", ".closest", ".matches", "MutationObserver",
      "elementFromPoint", "elementsFromPoint", "localStorage", "uiEditorSelectRuntime",
    ]) {
      assert.equal(combined.includes(forbidden), false, `${forbidden} darf in M60 nicht vorkommen`);
    }
    assert.match(combined, /createBbmKitSelectionHost/);
    assert.match(combined, /this\.selectionRuntime = "kit"/);
    assert.match(combined, /initializeDefaultSelectionRuntime/);
    assert.match(combined, /this\.selectionRuntime = "bbm"/);
  });
}

module.exports = { runM60KitRuntimeStandardTests };

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
  runM60KitRuntimeStandardTests(run).then(() => {
    if (failed) process.exitCode = 1;
  }).catch((error) => {
    process.exitCode = 1;
    console.error(error?.stack || error?.message || error);
  });
}
