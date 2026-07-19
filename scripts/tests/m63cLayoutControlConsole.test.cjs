const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
const BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js");
const HOST_ADAPTER_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmMainUiHostAdapter.js");
const REFS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js");
const REGISTRY_PATH = path.join(REPO_ROOT, "src/ui-editor/bbm-ui-element-registry.cjs");
const LAYOUT_PERSISTENCE_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutPersistence.js");

function read(file) { return fs.readFileSync(path.join(REPO_ROOT, file), "utf8"); }

class TestNode {
  constructor(tagName, rect = { width: 300, height: 180 }) {
    this.tagName = tagName;
    this.rect = { ...rect };
    this.rectReadCount = 0;
    this.children = [];
    this.attributes = {};
    this.className = "";
    this.textContent = "";
    this.type = "";
    this.disabled = false;
    this.title = "";
    this.listeners = {};
    this.ownerDocument = { defaultView: { HTMLElement: TestNode } };
    this.style = {
      values: {},
      setProperty: (name, value) => { this.style.values[name] = String(value); },
      removeProperty: (name) => { delete this.style.values[name]; },
    };
  }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  click() { this.listeners.click?.({ target: this }); }
  getBoundingClientRect() { this.rectReadCount += 1; return { ...this.rect }; }
  set innerHTML(_value) { this.children = []; }
}

function collectText(node) { return [node?.textContent || "", ...(node?.children || []).flatMap(collectText)].join("\n"); }
function collectByTag(node, tagName) {
  return [node, ...(node?.children || []).flatMap((child) => collectByTag(child, tagName))].filter((entry) => entry?.tagName === tagName);
}
function collectByClass(node, classPart) {
  return [node, ...(node?.children || []).flatMap((child) => collectByClass(child, classPart))].filter((entry) => String(entry?.className || "").split(/\s+/).includes(classPart));
}

async function withDom(fn) {
  const oldDocument = global.document;
  const oldWindow = global.window;
  const oldHTMLElement = global.HTMLElement;
  global.HTMLElement = TestNode;
  global.document = { createElement: (tagName) => new TestNode(tagName), head: new TestNode("head") };
  global.window = { bbmDb: {} };
  try { return await fn(); }
  finally { global.document = oldDocument; global.window = oldWindow; global.HTMLElement = oldHTMLElement; }
}

const registryElements = [
  { elementId: "bbm.main.shell", label: "Shell", type: "frame", parentId: null, capabilities: ["select", "layout"], allowedChanges: ["layout.read"] },
  { elementId: "bbm.main.navigation", label: "Hauptnavigation", type: "navigation", parentId: "bbm.main.shell", capabilities: ["select", "layout"], allowedChanges: ["layout.read"] },
  { elementId: "bbm.main.content", label: "Inhalt", type: "content", parentId: "bbm.main.shell", capabilities: ["select", "layout"], allowedChanges: ["layout.read"] },
  { elementId: "bbm.uiEditorTest.workspace", label: "UI-Editor-Testfläche", type: "container", parentId: "bbm.main.content", capabilities: ["select", "layout"], allowedChanges: ["layout.read"], allowedOps: [] },
  { elementId: "bbm.uiEditorTest.card", label: "Testkarte", type: "container", parentId: "bbm.uiEditorTest.workspace", capabilities: ["select", "layout"], allowedChanges: ["layout.read"], allowedOps: ["move", "resize"] },
  { elementId: "bbm.main.header", label: "Header", type: "header", parentId: "bbm.main.shell", capabilities: ["select", "layout"], allowedChanges: ["layout.read"] },
];

async function runM63cLayoutControlConsoleTests(run) {
  const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH);
  const { createBbmEditorRuntimeInspectorBridge, M63C_LAYOUT_STEP } = await importEsmFromFile(BRIDGE_PATH);
  const { createBbmMainUiHostAdapter } = await importEsmFromFile(HOST_ADAPTER_PATH);
  const refs = await importEsmFromFile(REFS_PATH);
  const { createEditorLayoutMemoryStorage } = await importEsmFromFile(LAYOUT_PERSISTENCE_PATH);

  await run("M63C Konsole: genau drei Modi, ein Steuerkreuz und Standardmodus move", async () => withDom(() => {
    const panel = new BbmUiEditorStatusPanel({});
    panel.detailsNode = new TestNode("section");
    panel.elements = registryElements;
    panel.selectedElement = registryElements[4];
    panel.renderDetails();
    const text = collectText(panel.detailsNode);
    assert.match(text, /Testkarte/);
    assert.deepEqual(collectByClass(panel.detailsNode, "bbm-ui-editor-layout-console__mode").map((node) => node.textContent), ["Move", "Breite", "Höhe"]);
    assert.equal(collectByClass(panel.detailsNode, "bbm-ui-editor-layout-console__pad").length, 1);
    const modes = collectByClass(panel.detailsNode, "bbm-ui-editor-layout-console__mode");
    assert.equal(modes[0].attributes["aria-pressed"], "true");
    assert.equal(modes[1].attributes["aria-pressed"], "false");
    assert.equal(modes[2].attributes["aria-pressed"], "false");
  }));

  await run("M63C Konsole: Moduswechsel und deaktivierte nicht relevante Pfeile", async () => withDom(() => {
    const panel = new BbmUiEditorStatusPanel({});
    panel.detailsNode = new TestNode("section");
    panel.elements = registryElements;
    panel.selectedElement = registryElements[4];
    panel.renderDetails();
    panel.setLayoutControlMode("width");
    const widthButtons = collectByClass(panel.detailsNode, "bbm-ui-editor-layout-console__pad-button");
    assert.equal(widthButtons.find((btn) => btn.className.includes("--left")).disabled, false);
    assert.equal(widthButtons.find((btn) => btn.className.includes("--right")).disabled, false);
    assert.equal(widthButtons.find((btn) => btn.className.includes("--up")).disabled, true);
    assert.equal(widthButtons.find((btn) => btn.className.includes("--down")).disabled, true);
    panel.setLayoutControlMode("height");
    const heightButtons = collectByClass(panel.detailsNode, "bbm-ui-editor-layout-console__pad-button");
    assert.equal(heightButtons.find((btn) => btn.className.includes("--up")).disabled, false);
    assert.equal(heightButtons.find((btn) => btn.className.includes("--down")).disabled, false);
    assert.equal(heightButtons.find((btn) => btn.className.includes("--left")).disabled, true);
    assert.equal(heightButtons.find((btn) => btn.className.includes("--right")).disabled, true);
    const center = heightButtons.find((btn) => btn.className.includes("--center"));
    assert.equal(center.disabled, true);
    assert.equal(center.attributes["aria-label"], "Änderungen dieses Elements verwerfen");
  }));

  await run("M63C Konsole: neue Auswahl setzt Modus auf move zurueck", async () => withDom(() => {
    const panel = new BbmUiEditorStatusPanel({});
    panel.detailsNode = new TestNode("section");
    panel.elements = registryElements;
    panel.selectedElement = registryElements[4];
    panel.renderDetails();
    panel.setLayoutControlMode("height");
    assert.equal(panel.activeLayoutControlMode, "height");
    panel.selectedElement = registryElements[5];
    panel.renderDetails();
    assert.equal(panel.activeLayoutControlMode, "move");
  }));

  await run("M63C Bridge: Schrittweite 5 und keine capability->operation-Ableitung", () => {
    assert.equal(M63C_LAYOUT_STEP, 5);
    let bridge = createBbmEditorRuntimeInspectorBridge({ registryElements, selectedElement: registryElements[0] });
    assert.deepEqual(bridge.inspectSelectedElement().allowedOps, []);
    bridge = createBbmEditorRuntimeInspectorBridge({ registryElements, selectedElement: registryElements[4] });
    assert.deepEqual(bridge.inspectSelectedElement().allowedOps, ["move", "resize"]);
  });

  await run("M63C HostAdapter: echter LayoutStore-Weg und sichtbare Hostaktion", async () => withDom(() => {
    refs.clearBbmUiElementRefs();
    const target = new TestNode("nav");
    refs.registerBbmUiElementRef("bbm.uiEditorTest.card", target);
    const layoutStorage = createEditorLayoutMemoryStorage();
    const bridge = createBbmEditorRuntimeInspectorBridge({
      registryElements,
      selectedElement: registryElements[4],
      hostAdapterFactory: ({ registry }) => createBbmMainUiHostAdapter({ registry, layoutStorage }),
    });
    const move = bridge.applySelectedElementLayoutAction("right");
    assert.equal(move.ok, true);
    assert.deepEqual(move.layoutEntry.layoutValue, { x: 5 });
    assert.equal(target.style.values.transform, "translate(5px, 0px)");

    const widthRight = bridge.applySelectedElementLayoutAction("widthRight");
    assert.equal(widthRight.ok, true);
    assert.deepEqual(widthRight.layoutEntry.layoutValue, { x: 5, width: 305 });
    assert.equal(target.style.values.width, "305px");
    assert.equal(target.rectReadCount, 1);

    target.rect.width = 999;
    const widthLeft = bridge.applySelectedElementLayoutAction("widthLeft");
    assert.equal(widthLeft.ok, true);
    assert.deepEqual(widthLeft.layoutEntry.layoutValue, { x: 5, width: 300 });
    assert.equal(target.style.values.width, "300px");
    assert.equal(target.rectReadCount, 1);

    const heightUp = bridge.applySelectedElementLayoutAction("heightUp");
    assert.equal(heightUp.ok, true);
    assert.deepEqual(heightUp.layoutEntry.layoutValue, { x: 5, width: 300, height: 185 });
    assert.equal(target.style.values.height, "185px");
    assert.equal(target.rectReadCount, 2);

    target.rect.height = 999;
    const heightDown = bridge.applySelectedElementLayoutAction("heightDown");
    assert.equal(heightDown.ok, true);
    assert.deepEqual(heightDown.layoutEntry.layoutValue, { x: 5, width: 300, height: 180 });
    assert.equal(target.style.values.height, "180px");
    assert.equal(target.rectReadCount, 2);
    assert.equal(createBbmMainUiHostAdapter({ registry: [] }).getCurrentLayoutState().length >= 0, true);
    refs.clearBbmUiElementRefs();
  }));

  await run("M63C HostAdapter: Breite und Hoehe fallen nicht unter sichere Mindestgroesse", async () => withDom(() => {
    refs.clearBbmUiElementRefs();
    const target = new TestNode("nav", { width: 20, height: 20 });
    refs.registerBbmUiElementRef("bbm.uiEditorTest.card", target);
    const layoutStorage = createEditorLayoutMemoryStorage();
    const bridge = createBbmEditorRuntimeInspectorBridge({
      registryElements,
      selectedElement: registryElements[4],
      hostAdapterFactory: ({ registry }) => createBbmMainUiHostAdapter({ registry, layoutStorage }),
    });
    const width = bridge.applySelectedElementLayoutAction("widthLeft");
    assert.equal(width.ok, true);
    assert.equal(width.layoutEntry.layoutValue.width, 20);
    assert.equal(target.style.values.width, "20px");
    const height = bridge.applySelectedElementLayoutAction("heightDown");
    assert.equal(height.ok, true);
    assert.equal(height.layoutEntry.layoutValue.height, 20);
    assert.equal(target.style.values.height, "20px");
    refs.clearBbmUiElementRefs();
  }));

  await run("M63C Registry: Hauptnavigation bleibt ohne move/resize und Testkarte bleibt freigegeben", () => {
    delete require.cache[REGISTRY_PATH];
    const { BBM_UI_ELEMENTS } = require(REGISTRY_PATH);
    const navigation = BBM_UI_ELEMENTS.find((entry) => entry.elementId === "bbm.main.navigation");
    const card = BBM_UI_ELEMENTS.find((entry) => entry.elementId === "bbm.uiEditorTest.card");
    assert.deepEqual(navigation.allowedOps || [], []);
    assert.deepEqual(card.allowedOps, ["move", "resize"]);
  });

  await run("M63C Guardrails: keine lokale Map, keine Simulation, keine DOM-Suche, keine zweite Auswahlhaltung", () => {
    const bridgeSource = read("src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js");
    const panelSource = read("src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
    const hostSource = read("src/renderer/ui-editor/bbmMainUiHostAdapter.js");
    assert.doesNotMatch(bridgeSource, /capabilities\.map\(.*layout|return \["move", "resize"\]/s);
    assert.doesNotMatch(bridgeSource, /new Map\(|createLayoutHostAdapter|executed:\s*false|\.style\s*=|\.style\.setProperty|querySelector|querySelectorAll|getElementById|getElementsBy|elementFromPoint|elementsFromPoint|MutationObserver|let\s+selectedElement|this\.selectedElementId/);
    assert.doesNotMatch(panelSource, /\.style\s*=|\.style\.setProperty|querySelector|querySelectorAll|getElementById|getElementsBy|elementFromPoint|elementsFromPoint|MutationObserver|createElement\("input"\)|createElement\("select"\)/);
    assert.match(hostSource, /createEditorLayoutStore/);
    assert.match(hostSource, /validateEditorChangeRequest/);
    assert.match(hostSource, /getBbmUiElementRef/);
    assert.doesNotMatch(hostSource, /querySelector|querySelectorAll|getElementById|getElementsBy|elementFromPoint|elementsFromPoint|MutationObserver|localStorage|ipcRenderer/);
  });
}

if (require.main === module) {
  const run = async (name, fn) => {
    try { const out = fn(); if (out && typeof out.then === "function") await out; console.log(`ok - ${name}`); }
    catch (err) { console.error(`not ok - ${name}`); console.error(err?.stack || err); process.exitCode = 1; }
  };
  runM63cLayoutControlConsoleTests(run).then(() => { if (!process.exitCode) console.log("m63cLayoutControlConsole.test.cjs passed"); });
}

module.exports = { runM63cLayoutControlConsoleTests };
