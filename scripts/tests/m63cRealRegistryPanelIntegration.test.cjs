const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { getBbmUiElementRegistry } = require("../../src/ui-editor/bbm-ui-element-registry.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
const BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js");
const HOST_ADAPTER_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmMainUiHostAdapter.js");
const REFS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js");
const LAYOUT_PERSISTENCE_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutPersistence.js");

class TestNode {
  constructor(tagName, rect = { width: 300, height: 180, left: 40, top: 40 }) {
    this.tagName = tagName;
    this.rect = { ...rect };
    this.children = [];
    this.attributes = {};
    this.dataset = {};
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
  getAttribute(name) { return this.attributes[name] || ""; }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  click() { if (!this.disabled) return this.listeners.click?.({ target: this }); return undefined; }
  getBoundingClientRect() { return { ...this.rect }; }
  set innerHTML(_value) { this.children = []; }
}

function collectByClass(node, classPart) {
  return [node, ...(node?.children || []).flatMap((child) => collectByClass(child, classPart))]
    .filter((entry) => String(entry?.className || "").split(/\s+/).includes(classPart));
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

function buttonByText(root, text) {
  return collectByClass(root, "bbm-ui-editor-layout-console__mode").find((button) => button.textContent === text);
}

function elementButton(root, elementId) {
  return findNode(root, (node) => node.attributes?.["data-bbm-ui-editor-element-id"] === elementId);
}

function padButton(root, direction) {
  return collectByClass(root, "bbm-ui-editor-layout-console__pad-button")
    .find((button) => String(button.className).includes(`--${direction}`));
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

async function runM63cRealRegistryPanelIntegrationTests(run) {
  const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH);
  const { createBbmEditorRuntimeInspectorBridge } = await importEsmFromFile(BRIDGE_PATH);
  const { createBbmMainUiHostAdapter } = await importEsmFromFile(HOST_ADAPTER_PATH);
  const refs = await importEsmFromFile(REFS_PATH);
  const { createEditorLayoutMemoryStorage } = await importEsmFromFile(LAYOUT_PERSISTENCE_PATH);

  await run("M63C Realintegration: echte Testkarte ist auswählbar und Panel-Klicks wenden Layout sichtbar an", async () => withDom(async () => {
    const registryResult = getBbmUiElementRegistry();
    assert.equal(registryResult.ok, true);
    const realRegistry = registryResult.elements;
    const navigation = realRegistry.find((entry) => entry.elementId === "bbm.main.navigation");
    const testCard = realRegistry.find((entry) => entry.elementId === "bbm.uiEditorTest.card");
    assert.ok(navigation, "bbm.main.navigation muss weiter in der echten Registry existieren");
    assert.deepEqual(navigation.allowedOps || [], []);
    assert.ok(testCard, "bbm.uiEditorTest.card muss in der echten Registry existieren");
    assert.deepEqual(testCard.allowedOps, ["move", "resize"]);

    refs.clearBbmUiElementRefs();
    const changeRequests = [];
    const layoutStorage = createEditorLayoutMemoryStorage();

    const panel = new BbmUiEditorStatusPanel({});
    panel.elementsNode = new TestNode("section");
    panel.detailsNode = new TestNode("section");
    panel.testSurfaceNode = new TestNode("section");
    panel.elements = realRegistry.map((entry) => ({ ...entry, selected: false }));
    panel.selectedElement = null;
    panel.inspectorBridge = createBbmEditorRuntimeInspectorBridge({
      registryElements: panel.elements,
      getSelectedElement: () => panel.selectedElement,
      hostAdapterFactory: ({ registry }) => createBbmMainUiHostAdapter({
        registry,
        layoutStorage,
        onChangeRequest: (request) => changeRequests.push({ ...request, payload: { ...request.payload } }),
      }),
    });

    global.window.bbmDb.uiEditorSelectElement = async ({ elementId }) => {
      panel.elements = realRegistry.map((entry) => ({ ...entry, selected: entry.elementId === elementId }));
      panel.selectedElement = panel.elements.find((entry) => entry.elementId === elementId) || null;
      return { ok: true, selectedElement: panel.selectedElement };
    };
    global.window.bbmDb.uiEditorOpen = async () => ({ ok: true, runtimeStarted: true, adapterValid: true });
    global.window.bbmDb.uiEditorGetElements = async () => ({ ok: true, elements: panel.elements });
    global.window.bbmDb.uiEditorGetSelectedElementDetails = async () => ({ ok: true, selectedElement: panel.selectedElement });

    panel.renderTestSurface();
    const target = refs.getBbmUiElementRef("bbm.uiEditorTest.card");
    assert.ok(target, "Testkarten-Ref muss explizit registriert sein");
    assert.equal(target.attributes["data-ui-editor-id"], "bbm.uiEditorTest.card");

    panel.renderElements();
    assert.ok(elementButton(panel.elementsNode, "bbm.uiEditorTest.card"), "Testkarte muss in der echten Elementliste auswählbar sein");
    await panel.selectElement("bbm.uiEditorTest.card");
    assert.equal(panel.selectedElement.elementId, "bbm.uiEditorTest.card");

    const status = panel.inspectorBridge.inspectSelectedElement();
    assert.equal(status.ok, true);
    assert.equal(status.scopeId, "bbm.main-layout");
    assert.deepEqual(status.allowedOps, ["move", "resize"]);

    panel.renderDetails();
    const move = buttonByText(panel.detailsNode, "Move");
    const width = buttonByText(panel.detailsNode, "Breite");
    const height = buttonByText(panel.detailsNode, "Höhe");
    assert.equal(move.disabled, false);
    assert.equal(width.disabled, false);
    assert.equal(height.disabled, false);
    assert.equal(move.attributes["aria-pressed"], "true");
    assert.equal(padButton(panel.detailsNode, "up").disabled, false);
    assert.equal(padButton(panel.detailsNode, "down").disabled, false);
    assert.equal(padButton(panel.detailsNode, "left").disabled, false);
    assert.equal(padButton(panel.detailsNode, "right").disabled, false);
    assert.equal(padButton(panel.detailsNode, "center").disabled, true);

    padButton(panel.detailsNode, "right").click();
    assert.equal(changeRequests.at(-1).scopeId, "bbm.main-layout");
    assert.equal(changeRequests.at(-1).elementId, "bbm.uiEditorTest.card");
    assert.equal(changeRequests.at(-1).operation, "move");
    assert.deepEqual(changeRequests.at(-1).payload, { x: 5 });
    assert.equal(target.style.values.transform, "translate(5px, 0px)");

    buttonByText(panel.detailsNode, "Breite").click();
    assert.equal(buttonByText(panel.detailsNode, "Breite").attributes["aria-pressed"], "true");
    assert.equal(padButton(panel.detailsNode, "left").disabled, false);
    assert.equal(padButton(panel.detailsNode, "right").disabled, false);
    assert.equal(padButton(panel.detailsNode, "up").disabled, true);
    assert.equal(padButton(panel.detailsNode, "down").disabled, true);
    padButton(panel.detailsNode, "right").click();
    assert.equal(changeRequests.at(-1).operation, "resize");
    assert.deepEqual(changeRequests.at(-1).payload, { width: 5 });
    assert.equal(target.style.values.width, "305px");

    buttonByText(panel.detailsNode, "Höhe").click();
    assert.equal(buttonByText(panel.detailsNode, "Höhe").attributes["aria-pressed"], "true");
    assert.equal(padButton(panel.detailsNode, "up").disabled, false);
    assert.equal(padButton(panel.detailsNode, "down").disabled, false);
    assert.equal(padButton(panel.detailsNode, "left").disabled, true);
    assert.equal(padButton(panel.detailsNode, "right").disabled, true);
    padButton(panel.detailsNode, "up").click();
    assert.equal(changeRequests.at(-1).operation, "resize");
    assert.deepEqual(changeRequests.at(-1).payload, { height: 5 });
    assert.equal(target.style.values.height, "185px");

    const resolvedAfterChange = refs.getBbmUiElementRef("bbm.uiEditorTest.card");
    assert.equal(resolvedAfterChange, target, "Orange Overlay kann die Testkarte nach Änderung neu auflösen");
    assert.equal(refs.getBbmUiElementRef("bbm.main.navigation") || null, null);
    refs.clearBbmUiElementRefs();
  }));
}

if (require.main === module) {
  const run = async (name, fn) => {
    try { const out = fn(); if (out && typeof out.then === "function") await out; console.log(`ok - ${name}`); }
    catch (err) { console.error(`not ok - ${name}`); console.error(err?.stack || err); process.exitCode = 1; }
  };
  runM63cRealRegistryPanelIntegrationTests(run).then(() => { if (!process.exitCode) console.log("m63cRealRegistryPanelIntegration.test.cjs passed"); });
}

module.exports = { runM63cRealRegistryPanelIntegrationTests };
