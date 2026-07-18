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
  constructor(tagName, rect = { width: 240, height: 64 }) {
    this.tagName = tagName;
    this.rect = { ...rect };
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
  click() { if (!this.disabled) this.listeners.click?.({ target: this }); }
  getBoundingClientRect() { return { ...this.rect }; }
  set innerHTML(_value) { this.children = []; }
}

function collectByClass(node, classPart) {
  return [node, ...(node?.children || []).flatMap((child) => collectByClass(child, classPart))]
    .filter((entry) => String(entry?.className || "").split(/\s+/).includes(classPart));
}

function buttonByText(root, text) {
  return collectByClass(root, "bbm-ui-editor-layout-console__mode").find((button) => button.textContent === text);
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

  await run("M63C Realintegration: echte Registry aktiviert Hauptnavigation und echte Panel-Klicks wenden Layout an", async () => withDom(() => {
    const registryResult = getBbmUiElementRegistry();
    assert.equal(registryResult.ok, true);
    const realRegistry = registryResult.elements;
    const navigation = realRegistry.find((entry) => entry.elementId === "bbm.main.navigation");
    assert.ok(navigation, "bbm.main.navigation muss in der echten Registry existieren");
    assert.deepEqual(navigation.allowedOps, ["move", "resize"]);

    refs.clearBbmUiElementRefs();
    const target = new TestNode("nav", { width: 240, height: 64 });
    refs.registerBbmUiElementRef("bbm.main.navigation", target);
    const changeRequests = [];
    const layoutStorage = createEditorLayoutMemoryStorage();

    const panel = new BbmUiEditorStatusPanel({});
    panel.detailsNode = new TestNode("section");
    panel.elements = realRegistry.map((entry) => ({ ...entry, selected: entry.elementId === "bbm.main.navigation" }));
    panel.selectedElement = { ...navigation, selected: true };
    panel.inspectorBridge = createBbmEditorRuntimeInspectorBridge({
      registryElements: panel.elements,
      getSelectedElement: () => panel.selectedElement,
      hostAdapterFactory: ({ registry }) => createBbmMainUiHostAdapter({
        registry,
        layoutStorage,
        onChangeRequest: (request) => changeRequests.push({ ...request, payload: { ...request.payload } }),
      }),
    });

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
    assert.equal(changeRequests.at(-1).elementId, "bbm.main.navigation");
    assert.equal(changeRequests.at(-1).operation, "move");
    assert.deepEqual(changeRequests.at(-1).payload, { x: 1 });
    assert.equal(target.style.values.transform, "translate(1px, 0px)");

    buttonByText(panel.detailsNode, "Breite").click();
    assert.equal(buttonByText(panel.detailsNode, "Breite").attributes["aria-pressed"], "true");
    assert.equal(padButton(panel.detailsNode, "left").disabled, false);
    assert.equal(padButton(panel.detailsNode, "right").disabled, false);
    assert.equal(padButton(panel.detailsNode, "up").disabled, true);
    assert.equal(padButton(panel.detailsNode, "down").disabled, true);
    padButton(panel.detailsNode, "right").click();
    assert.equal(changeRequests.at(-1).scopeId, "bbm.main-layout");
    assert.equal(changeRequests.at(-1).elementId, "bbm.main.navigation");
    assert.equal(changeRequests.at(-1).operation, "resize");
    assert.deepEqual(changeRequests.at(-1).payload, { width: 1 });
    assert.equal(target.style.values.width, "241px");

    buttonByText(panel.detailsNode, "Höhe").click();
    assert.equal(buttonByText(panel.detailsNode, "Höhe").attributes["aria-pressed"], "true");
    assert.equal(padButton(panel.detailsNode, "up").disabled, false);
    assert.equal(padButton(panel.detailsNode, "down").disabled, false);
    assert.equal(padButton(panel.detailsNode, "left").disabled, true);
    assert.equal(padButton(panel.detailsNode, "right").disabled, true);
    padButton(panel.detailsNode, "up").click();
    assert.equal(changeRequests.at(-1).scopeId, "bbm.main-layout");
    assert.equal(changeRequests.at(-1).elementId, "bbm.main.navigation");
    assert.equal(changeRequests.at(-1).operation, "resize");
    assert.deepEqual(changeRequests.at(-1).payload, { height: 1 });
    assert.equal(target.style.values.height, "65px");

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
