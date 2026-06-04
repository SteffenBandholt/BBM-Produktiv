const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const REGISTRY_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/bbmUiEditorRegistry.js");
const ELEMENTS_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/demo/bbmUiEditorDemoElements.js");
const LAYOUT_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/demo/bbmUiEditorDemoLayout.js");
const SCREEN_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/demo/BbmUiEditorDemoScreen.js");
const DEMO_FILES = [ELEMENTS_PATH, LAYOUT_PATH, SCREEN_PATH];

const REQUIRED_DEMO_IDS = [
  "bbm.demo.root",
  "bbm.demo.surface",
  "bbm.demo.card.moveable",
];

const FORBIDDEN_DATA_FIELDS = [
  "projectId",
  "project",
  "meetingId",
  "meeting",
  "topId",
  "top",
  "databaseId",
  "database",
  "personId",
  "person",
  "date",
  "deadline",
  "value",
  "text",
  "content",
];

const FORBIDDEN_DEMO_FRAGMENTS = [
  "querySelector",
  "createElement",
  "innerHTML",
  "DOMParser",
  "document.",
  "window.",
  "scan",
  "detect",
  "autoRegister",
  "migration",
  "ipcRenderer",
  "ipcMain",
  "better-sqlite3",
  "sqlite",
  "fetch(",
  "XMLHttpRequest",
  "writeFile",
  "readFile",
];

function assertNoForbiddenFields(value, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenFields(entry, [...pathParts, String(index)]));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const key of Object.keys(value)) {
    assert.equal(
      FORBIDDEN_DATA_FIELDS.includes(key),
      false,
      `forbidden data field ${key} at ${pathParts.concat(key).join(".")}`
    );
    assertNoForbiddenFields(value[key], [...pathParts, key]);
  }
}

function createFakeNode(tag) {
  const listeners = {};
  return {
    tagName: String(tag || "").toUpperCase(),
    attributes: {},
    children: [],
    style: {},
    textContent: "",
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      this.attributes[String(name)] = String(value);
    },
    getAttribute(name) {
      return this.attributes[String(name)] ?? null;
    },
    addEventListener(type, handler) {
      listeners[type] ||= [];
      listeners[type].push(handler);
    },
    click() {
      for (const handler of listeners.click || []) handler();
    },
  };
}

function collectText(node, out = []) {
  if (!node) return out;
  if (node.textContent) out.push(node.textContent);
  for (const child of node.children || []) collectText(child, out);
  return out;
}

function findNodeByText(node, text) {
  if (!node) return null;
  if (node.textContent === text) return node;
  for (const child of node.children || []) {
    const found = findNodeByText(child, text);
    if (found) return found;
  }
  return null;
}

async function loadRegistry() {
  return await importEsmFromFile(REGISTRY_PATH);
}

async function loadElements() {
  return await importEsmFromFile(ELEMENTS_PATH);
}

async function loadLayout() {
  return await importEsmFromFile(LAYOUT_PATH);
}

async function loadScreen() {
  return await importEsmFromFile(SCREEN_PATH);
}

async function runBbmUiEditorDemoTests(run) {
  await run("BBM UI-Editor-Demo: Scope ist in der Registry verfuegbar", async () => {
    const registry = await loadRegistry();
    assert.equal(
      registry.getAvailableUiScopes().some((scope) => scope.uiScope === "bbm.demo.editorMove"),
      true
    );
    assert.equal(registry.getActiveUiScope(), "protokoll.topsScreen");
  });

  await run("BBM UI-Editor-Demo: Scope liefert genau die bewusst registrierten Elemente", async () => {
    const registry = await loadRegistry();
    const result = registry.getBbmUiEditorRegistry("bbm.demo.editorMove");
    assert.equal(result.targetAppId, "bbm-produktiv");
    assert.equal(result.moduleId, "uiEditor");
    assert.deepEqual(result.elements.map((element) => element.id), REQUIRED_DEMO_IDS);
  });

  await run("BBM UI-Editor-Demo: verschiebbare Karte erlaubt move", async () => {
    const { getBbmUiEditorDemoElements } = await loadElements();
    const card = getBbmUiEditorDemoElements().find((element) => element.id === "bbm.demo.card.moveable");
    assert.equal(Boolean(card), true);
    assert.equal(card.editable, true);
    assert.deepEqual(card.allowedOps, ["inspect", "move"]);
    assert.deepEqual(card.lockedOps, []);
  });

  await run("BBM UI-Editor-Demo: Elementliste enthaelt keine Fachdatenfelder", async () => {
    const { getBbmUiEditorDemoElements } = await loadElements();
    assertNoForbiddenFields(getBbmUiEditorDemoElements());
  });

  await run("BBM UI-Editor-Demo: neue Demo-Dateien bleiben frei von verbotenen Fragmenten", () => {
    for (const filePath of DEMO_FILES) {
      const source = fs.readFileSync(filePath, "utf8");
      for (const fragment of FORBIDDEN_DEMO_FRAGMENTS) {
        assert.equal(source.includes(fragment), false, `${path.basename(filePath)} contains ${fragment}`);
      }
      assert.equal(source.includes("protokoll"), false, `${path.basename(filePath)} references Protokoll`);
      assert.equal(source.includes("tops"), false, `${path.basename(filePath)} references TOP paths`);
      assert.equal(source.includes("restarbeiten"), false, `${path.basename(filePath)} references Restarbeiten`);
    }
  });

  await run("BBM UI-Editor-Demo: Protokoll-Scope bleibt verfuegbar", async () => {
    const registry = await loadRegistry();
    const result = registry.getBbmUiEditorRegistry("protokoll.topsScreen");
    assert.equal(result.uiScope, "protokoll.topsScreen");
    assert.equal(result.moduleId, "protokoll");
    assert.equal(result.elements.some((element) => element.id === "protokoll.root"), true);
  });

  await run("BBM UI-Editor-Demo: Layoutwert kann gespeichert und wieder geladen werden", async () => {
    const layout = await loadLayout();
    const store = layout.createDemoLayoutStore(new Map());
    const saved = store.save({
      elementId: "bbm.demo.card.moveable",
      layoutValue: { x: 140, y: 100 },
    });
    assert.deepEqual(saved, {
      elementId: "bbm.demo.card.moveable",
      layoutValue: { x: 140, y: 100 },
    });
    assert.deepEqual(store.load("bbm.demo.card.moveable"), saved);
  });

  await run("BBM UI-Editor-Demo: Move aendert nur neutrale x/y-Layoutwerte", async () => {
    const layout = await loadLayout();
    assert.deepEqual(layout.moveDemoLayoutValue({ x: 120, y: 80 }, "right"), { x: 140, y: 80 });
    assert.deepEqual(Object.keys(layout.moveDemoLayoutValue({ x: 120, y: 80 }, "down")).sort(), ["x", "y"]);
  });

  await run("BBM UI-Editor-Demo: Reset setzt die Karte auf den Standardwert zurueck", async () => {
    const layout = await loadLayout();
    const store = layout.createDemoLayoutStore(new Map());
    store.save({ layoutValue: { x: 200, y: 160 } });
    assert.deepEqual(store.reset(), {
      elementId: "bbm.demo.card.moveable",
      layoutValue: { ...layout.DEFAULT_DEMO_LAYOUT_VALUE },
    });
  });

  await run("BBM UI-Editor-Demo: UI kann importiert und gerendert werden", async () => {
    const screenMod = await loadScreen();
    const layout = await loadLayout();
    const store = layout.createDemoLayoutStore(new Map());
    const screen = screenMod.createBbmUiEditorDemoScreen({
      ui: { node: createFakeNode },
      layoutStore: store,
    });
    const root = screen.render();
    const texts = collectText(root);
    assert.equal(texts.includes("UI-Editor Demo"), true);
    assert.equal(texts.includes("Isolierter Demo-Scope – keine bestehende BBM-UI wird ausgewertet."), true);
    assert.equal(texts.includes("Verschiebbare Demo-Karte"), true);
    assert.equal(texts.includes("x=120 y=80"), true);

    findNodeByText(root, "Rechts").click();
    assert.equal(collectText(root).includes("x=140 y=80"), true);
  });
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

  runBbmUiEditorDemoTests(run).then(() => {
    if (!process.exitCode) console.log("bbmUiEditorDemo.test.cjs passed");
  });
}

module.exports = { runBbmUiEditorDemoTests };
