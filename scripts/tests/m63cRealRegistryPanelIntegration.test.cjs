const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { getBbmUiElementRegistry } = require("../../src/ui-editor/bbm-ui-element-registry.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
const BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js");
const HOST_ADAPTER_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmMainUiHostAdapter.js");
const REFS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js");
const LAYOUT_PERSISTENCE_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutPersistence.js");
const KIT_RUNTIME_PATH = path.join(REPO_ROOT, "node_modules/ui-editor-kit/dist/selection-runtime.browser.mjs");

class TestNode {
  constructor(tagName, rect = { width: 300, height: 180, left: 40, top: 40 }) {
    this.nodeType = 1;
    this.tagName = tagName;
    this.rect = { ...rect };
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.dataset = {};
    this.className = "";
    this.textContent = "";
    this.type = "";
    this.disabled = false;
    this.title = "";
    this.listeners = {};
    this.ownerDocument = null;
    this.style = {
      values: {},
      setProperty: (name, value) => { this.style.values[name] = String(value); this.style[name] = String(value); },
      removeProperty: (name) => { delete this.style.values[name]; delete this.style[name]; },
    };
  }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  appendChild(child) { child.parentNode = this; child.ownerDocument = child.ownerDocument || this.ownerDocument; this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter((entry) => entry !== child); child.parentNode = null; return child; }
  contains(target) { let node = target; while (node) { if (node === this) return true; node = node.parentNode || null; } return false; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || ""; }
  addEventListener(name, handler) { this.listeners[name] = [...(this.listeners[name] || []), handler]; }
  removeEventListener(name, handler) { this.listeners[name] = (this.listeners[name] || []).filter((entry) => entry !== handler); }
  dispatch(type, event = {}) { for (const handler of this.listeners[type] || []) handler({ target: event.target || this, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}, ...event }); }
  click() { if (!this.disabled) return this.listeners.click?.[0]?.({ target: this }); return undefined; }
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


function collectText(node) {
  return [node?.textContent || "", ...(node?.children || []).flatMap(collectText)].join("\n");
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
  const doc = {
    defaultView: { HTMLElement: TestNode },
    createElement: (tagName) => {
      const node = new TestNode(tagName);
      node.ownerDocument = doc;
      return node;
    },
    addEventListener() {},
    removeEventListener() {},
  };
  doc.head = doc.createElement("head");
  doc.body = doc.createElement("body");
  const win = { bbmDb: {}, HTMLElement: TestNode, addEventListener() {}, removeEventListener() {} };
  doc.defaultView = win;
  global.HTMLElement = TestNode;
  global.document = doc;
  global.window = win;
  try { return await fn({ doc, win }); }
  finally { global.document = oldDocument; global.window = oldWindow; global.HTMLElement = oldHTMLElement; }
}

async function runM63cRealRegistryPanelIntegrationTests(run) {
  const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH);
  const { createBbmEditorRuntimeInspectorBridge } = await importEsmFromFile(BRIDGE_PATH);
  const { createBbmMainUiHostAdapter } = await importEsmFromFile(HOST_ADAPTER_PATH);
  const refs = await importEsmFromFile(REFS_PATH);
  const { createEditorLayoutMemoryStorage } = await importEsmFromFile(LAYOUT_PERSISTENCE_PATH);
  const { createSelectionController } = await import(pathToFileURL(KIT_RUNTIME_PATH).href);

  await run("M63C Realintegration: getrennte Testfläche wird per Kit-Klick ausgewählt und danach layoutbar", async () => withDom(async ({ doc }) => {
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
    const shell = doc.createElement("main");
    shell.rect = { width: 1180, height: 720, left: 0, top: 0 };
    doc.body.appendChild(shell);
    refs.registerBbmUiElementRef("bbm.main.shell", shell);

    let selectedElement = null;
    let elements = realRegistry.map((entry) => ({ ...entry, selected: false }));
    const changeRequests = [];
    const layoutStorage = createEditorLayoutMemoryStorage();
    global.window.bbmDb.uiEditorOpen = async () => ({ ok: true, runtimeStarted: true, adapterValid: true });
    global.window.bbmDb.uiEditorGetElements = async () => ({ ok: true, elements });
    global.window.bbmDb.uiEditorGetSelectedElementDetails = async () => ({ ok: true, selectedElement });
    global.window.bbmDb.uiEditorSelectElement = async ({ elementId }) => {
      elements = realRegistry.map((entry) => ({ ...entry, selected: entry.elementId === elementId }));
      selectedElement = elements.find((entry) => entry.elementId === elementId) || null;
      return { ok: true, selectedElement };
    };

    const panel = new BbmUiEditorStatusPanel({});
    panel.initializeDefaultSelectionRuntime = async function initializeTestSelectionRuntime() {
      this.runtimeError = "";
      this.syncActiveSelectionRuntime();
    };
    panel.inspectorBridge = createBbmEditorRuntimeInspectorBridge({
      getRegistryElements: () => panel.elements,
      getSelectedElement: () => panel.selectedElement,
      hostAdapterFactory: ({ registry }) => createBbmMainUiHostAdapter({
        registry,
        layoutStorage,
        onChangeRequest: (request) => changeRequests.push({ ...request, payload: { ...request.payload } }),
      }),
    });
    const workspace = panel.render();
    shell.appendChild(workspace);
    await panel.refresh();
    const kitHost = panel.createKitHost();
    panel.kitSelectionController = createSelectionController({
      host: kitHost,
      document: global.document,
      window: global.window,
      overlayOptions: {
        hover: { zIndex: 2147483190 },
        selected: { zIndex: 2147483191 },
      },
    });
    panel.runtimeError = "";
    panel.syncActiveSelectionRuntime();

    const panelRoot = panel.panelRoot;
    const target = refs.getBbmUiElementRef("bbm.uiEditorTest.card");
    assert.ok(panelRoot, "Bedienpanel-Root muss existieren");
    assert.ok(target, "Testkarten-Ref muss explizit registriert sein");
    assert.equal(workspace.contains(panelRoot), true);
    assert.equal(workspace.contains(target), true);
    assert.equal(panelRoot.contains(target), false, "Testkarte darf nicht im ausgeschlossenen Bedienpanel liegen");
    assert.equal(panel.kitSelectionHost.isExcludedTarget(panelRoot), true);
    assert.equal(panel.kitSelectionHost.isExcludedTarget(target), false);

    panel.startSelectionMode();
    assert.equal(panel.selectionModeActive, true);
    shell.dispatch("pointermove", { target });
    assert.equal(panel.hoverTargetLabel, "Testkarte");
    assert.equal(panel.selectedElement, null);

    const hoverOverlay = findNode(doc.body, (node) => node.attributes?.["data-selection-overlay"] === "hover");
    assert.ok(hoverOverlay, "Hover-Overlay muss existieren");
    assert.equal(hoverOverlay.style.display, "block", "Hover bleibt Hover vor dem Klick");

    shell.dispatch("click", { target });
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    const selectedOverlay = findNode(doc.body, (node) => node.attributes?.["data-selection-overlay"] === "selected");
    assert.ok(selectedOverlay, "Auswahl-Overlay muss existieren");
    assert.equal(selectedOverlay.style.display, "block", "Ausgewaehlter Rahmen bleibt nach dem Klick sichtbar");
    assert.equal(panel.selectedElement.elementId, "bbm.uiEditorTest.card");
    assert.equal(panel.kitSelectionController.getState().selectedElementId, "bbm.uiEditorTest.card");
    assert.match(collectText(panel.detailsNode), /Elementdetails[\s\S]*Testkarte/);

    const move = buttonByText(panel.detailsNode, "Move");
    const width = buttonByText(panel.detailsNode, "Breite");
    const height = buttonByText(panel.detailsNode, "Höhe");
    assert.equal(move.disabled, false);
    assert.equal(width.disabled, false);
    assert.equal(height.disabled, false);

    await move.click();
    shell.dispatch("click", { target: move });
    await Promise.resolve();
    assert.equal(panel.selectedElement.elementId, "bbm.uiEditorTest.card", "Klick auf Move-Button darf kein Zielelement auswählen");
    const moveRight = padButton(panel.detailsNode, "right");
    moveRight.click();
    shell.dispatch("click", { target: moveRight });
    await Promise.resolve();
    assert.equal(panel.selectedElement.elementId, "bbm.uiEditorTest.card", "Steuerkreuz darf Auswahl nicht ändern");
    assert.equal(changeRequests.at(-1).elementId, "bbm.uiEditorTest.card");
    assert.equal(changeRequests.at(-1).operation, "move");
    assert.deepEqual(changeRequests.at(-1).payload, { x: 5 });
    assert.equal(target.style.values.transform, "translate(5px, 0px)");

    buttonByText(panel.detailsNode, "Breite").click();
    padButton(panel.detailsNode, "right").click();
    assert.equal(changeRequests.at(-1).operation, "resize");
    assert.deepEqual(changeRequests.at(-1).payload, { width: 5 });
    assert.equal(target.style.values.width, "305px");

    buttonByText(panel.detailsNode, "Höhe").click();
    padButton(panel.detailsNode, "up").click();
    assert.equal(changeRequests.at(-1).operation, "resize");
    assert.deepEqual(changeRequests.at(-1).payload, { height: 5 });
    assert.equal(target.style.values.height, "185px");
    assert.equal(panel.selectedElement.elementId, "bbm.uiEditorTest.card");
    assert.match(collectText(panel.detailsNode), /Testkarte/);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card"), target, "Orange Overlay kann die Testkarte nach Änderung neu auflösen");
    assert.equal(selectedOverlay.style.display, "block", "Auswahl-Overlay bleibt nach Layoutänderung sichtbar");
    refs.clearBbmUiElementRefs();
  }));}

if (require.main === module) {
  const run = async (name, fn) => {
    try { const out = fn(); if (out && typeof out.then === "function") await out; console.log(`ok - ${name}`); }
    catch (err) { console.error(`not ok - ${name}`); console.error(err?.stack || err); process.exitCode = 1; }
  };
  runM63cRealRegistryPanelIntegrationTests(run).then(() => { if (!process.exitCode) console.log("m63cRealRegistryPanelIntegration.test.cjs passed"); });
}

module.exports = { runM63cRealRegistryPanelIntegrationTests };
