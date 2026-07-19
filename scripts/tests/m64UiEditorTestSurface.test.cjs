const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { getBbmUiElementRegistry } = require("../../src/ui-editor/bbm-ui-element-registry.cjs");
const { startBbmUiEditorRuntime, getBbmUiEditorIntegrationStatus } = require("../../src/ui-editor/start-bbm-ui-editor-runtime.cjs");
const uiEditorIpc = require("../../src/main/ipc/uiEditorIpc.js");

const REPO_ROOT = path.join(__dirname, "../..");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
const BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js");
const HOST_ADAPTER_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmMainUiHostAdapter.js");
const CSS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiEditorStatusPanel.css.js");
const REFS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js");
const LAYOUT_PERSISTENCE_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutPersistence.js");
const KIT_RUNTIME_PATH = path.join(REPO_ROOT, "node_modules/ui-editor-kit/dist/selection-runtime.browser.mjs");

const M64_ELEMENTS = [
  ["bbm.uiEditorTest.workspace", "UI-Editor-Testfläche", "container", "bbm.main.content", false, [], ["move", "resize", "hide", "delete"]],
  ["bbm.uiEditorTest.card", "Testkarte", "container", "bbm.uiEditorTest.workspace", true, ["move", "resize"], ["delete"]],
  ["bbm.uiEditorTest.card.title", "Überschrift", "text", "bbm.uiEditorTest.card", true, ["move", "resize"], ["delete", "execute"]],
  ["bbm.uiEditorTest.card.text", "Beispieltext", "text", "bbm.uiEditorTest.card", true, ["move", "resize"], ["delete", "execute"]],
  ["bbm.uiEditorTest.card.button", "Beispielbutton", "action", "bbm.uiEditorTest.card", true, ["move", "resize"], ["execute", "delete"]],
  ["bbm.uiEditorTest.card.input", "Eingabefeld", "field", "bbm.uiEditorTest.card", true, ["move", "resize"], ["write", "submit", "delete"]],
  ["bbm.uiEditorTest.card.select", "Auswahlfeld", "field", "bbm.uiEditorTest.card", true, ["move", "resize"], ["change-data", "submit", "delete"]],
  ["bbm.uiEditorTest.table", "Beispieltabelle", "table", "bbm.uiEditorTest.workspace", true, ["move", "resize"], ["edit-data", "delete"]],
];

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
  click() { if (!this.disabled) return this.listeners.click?.[0]?.({ target: this, preventDefault() {}, stopPropagation() {} }); return undefined; }
  getBoundingClientRect() { return { ...this.rect }; }
  set innerHTML(_value) { this.children = []; }
}

function collectText(node) {
  return [node?.textContent || "", ...(node?.children || []).flatMap(collectText)].join("\n");
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

function findByAttr(node, attr, value) {
  return findNode(node, (entry) => entry?.attributes?.[attr] === value);
}

function buttonByText(root, text) {
  return collectByClass(root, "bbm-ui-editor-layout-console__mode").find((button) => button.textContent === text);
}

function padButton(root, direction) {
  return collectByClass(root, "bbm-ui-editor-layout-console__pad-button")
    .find((button) => String(button.className).includes(`--${direction}`));
}

async function flushSelection() {
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
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
  global.document = doc;
  global.window = win;
  global.HTMLElement = TestNode;
  try { return await fn({ doc, win }); }
  finally { global.document = oldDocument; global.window = oldWindow; global.HTMLElement = oldHTMLElement; }
}

async function createIntegratedPanel({ doc, win }) {
  const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH);
  const { createBbmEditorRuntimeInspectorBridge } = await importEsmFromFile(BRIDGE_PATH);
  const { createBbmMainUiHostAdapter } = await importEsmFromFile(HOST_ADAPTER_PATH);
  const refs = await importEsmFromFile(REFS_PATH);
  const { createEditorLayoutMemoryStorage } = await importEsmFromFile(LAYOUT_PERSISTENCE_PATH);
  const { createSelectionController } = await import(pathToFileURL(KIT_RUNTIME_PATH).href);

  refs.clearBbmUiElementRefs();
  const registryResult = getBbmUiElementRegistry();
  const realRegistry = registryResult.elements;
  let selectedElement = null;
  let elements = realRegistry.map((entry) => ({ ...entry, selected: false }));
  const changeRequests = [];
  const fachCalls = [];
  const layoutStorage = createEditorLayoutMemoryStorage();

  win.bbmDb = {
    uiEditorOpen: async () => ({ ok: true, runtimeStarted: true, adapterValid: true }),
    uiEditorGetElements: async () => ({ ok: true, elements }),
    uiEditorGetSelectedElementDetails: async () => ({ ok: true, selectedElement }),
    uiEditorSelectElement: async ({ elementId }) => {
      elements = realRegistry.map((entry) => ({ ...entry, selected: entry.elementId === elementId }));
      selectedElement = elements.find((entry) => entry.elementId === elementId) || null;
      return { ok: true, selectedElement };
    },
    ipcCall: (...args) => fachCalls.push(["ipcCall", ...args]),
    dbCall: (...args) => fachCalls.push(["dbCall", ...args]),
    save: (...args) => fachCalls.push(["save", ...args]),
    autosave: (...args) => fachCalls.push(["autosave", ...args]),
  };

  const interactionRoot = doc.createElement("main");
  interactionRoot.rect = { width: 1180, height: 720, left: 0, top: 0 };
  doc.body.appendChild(interactionRoot);
  refs.registerBbmUiElementRef("bbm.main.shell", interactionRoot);

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
  interactionRoot.appendChild(workspace);
  await panel.refresh();
  const kitHost = panel.createKitHost();
  panel.kitSelectionController = createSelectionController({
    host: kitHost,
    document: doc,
    window: win,
    overlayOptions: {
      hover: { zIndex: 2147483190 },
      selected: { zIndex: 2147483191 },
    },
  });
  panel.runtimeError = "";
  panel.syncActiveSelectionRuntime();
  return { panel, refs, interactionRoot, changeRequests, fachCalls };
}

async function selectByRealClick({ panel, refs, interactionRoot }, elementId) {
  const target = refs.getBbmUiElementRef(elementId);
  assert.ok(target, `${elementId} braucht echten registrierten Ref`);
  panel.startSelectionMode();
  assert.equal(panel.selectionModeActive, true);
  interactionRoot.dispatch("pointermove", { target });
  interactionRoot.dispatch("click", { target });
  await flushSelection();
  assert.equal(panel.selectedElement?.elementId, elementId);
  assert.equal(panel.kitSelectionController.getState().selectedElementId, elementId);
  return target;
}

async function applyLayoutTriple({ panel, changeRequests }, elementId, target, defaults = {}) {
  const beforeChangeCount = changeRequests.length;
  buttonByText(panel.detailsNode, "Move").click();
  padButton(panel.detailsNode, "right").click();
  assert.equal(changeRequests.at(-1).elementId, elementId);
  assert.equal(changeRequests.at(-1).operation, "move");
  assert.deepEqual(changeRequests.at(-1).payload, { x: 5 });
  assert.equal(target.style.values.transform, "translate(5px, 0px)");

  buttonByText(panel.detailsNode, "Breite").click();
  padButton(panel.detailsNode, "right").click();
  assert.equal(changeRequests.at(-1).elementId, elementId);
  assert.equal(changeRequests.at(-1).operation, "resize");
  assert.deepEqual(changeRequests.at(-1).payload, { width: 5 });
  assert.equal(target.style.values.width, `${Number(defaults.width || 300) + 5}px`);

  buttonByText(panel.detailsNode, "Höhe").click();
  padButton(panel.detailsNode, "up").click();
  assert.equal(changeRequests.at(-1).elementId, elementId);
  assert.equal(changeRequests.at(-1).operation, "resize");
  assert.deepEqual(changeRequests.at(-1).payload, { height: 5 });
  assert.equal(target.style.values.height, `${Number(defaults.height || 180) + 5}px`);
  assert.equal(panel.selectedElement?.elementId, elementId);
  assert.equal(changeRequests.length, beforeChangeCount + 3);
}

async function runM64UiEditorTestSurfaceTests(run) {
  await run("M64 Registry: alle Testflaechen-Elemente sind explizit mit Parent und Operationen registriert", () => {
    const registry = getBbmUiElementRegistry();
    const byId = new Map(registry.elements.map((entry) => [entry.elementId, entry]));
    for (const [elementId, label, type, parentId, editable, allowedOps, lockedOps] of M64_ELEMENTS) {
      const entry = byId.get(elementId);
      assert.ok(entry, `${elementId} fehlt in Registry`);
      assert.equal(entry.label, label);
      assert.equal(entry.type, type);
      assert.equal(entry.parentId, parentId);
      assert.equal(entry.editable, editable);
      assert.deepEqual(entry.allowedOps || [], allowedOps);
      assert.deepEqual(entry.lockedOps || [], lockedOps);
      if (parentId) assert.ok(byId.has(parentId), `Parent fehlt: ${parentId}`);
    }
  });


  await run("M64 Runtime-Start: echter UI-Editor-kit Public-API-Pfad akzeptiert genau einen Root", () => {
    const result = startBbmUiEditorRuntime();
    assert.equal(result.ok, true);
    assert.equal(result.blockCode, null);
    const status = getBbmUiEditorIntegrationStatus(result);
    assert.equal(status.runtimeStarted, true);
    assert.equal(status.adapterValid, true);
    const roots = result.registry.elements.filter((entry) => entry.parentId === null);
    assert.deepEqual(roots.map((entry) => entry.elementId), ["bbm.main.shell"]);
    const byId = new Map(result.registry.elements.map((entry) => [entry.elementId, entry]));
    assert.equal(byId.get("bbm.uiEditorTest.workspace")?.parentId, "bbm.main.content");
    for (const [elementId] of M64_ELEMENTS) {
      assert.ok(byId.has(elementId), `${elementId} fehlt im echten Runtime-Startpfad`);
    }
  });

  await run("M64 IPC: echter UI-Editor-Statuspfad startet Runtime und liefert M64-Elemente", () => {
    uiEditorIpc._m52.closeUiEditorSession();
    const status = uiEditorIpc._m52.getUiEditorStatus();
    assert.equal(status.ok, true);
    assert.equal(status.runtimeStarted, true);
    assert.equal(status.adapterValid, true);
    assert.notEqual(status.blockCode, "invalid_registry");
    assert.equal(status.blockCode, null);
    assert.ok(status.registeredElementCount >= M64_ELEMENTS.length);

    const elementsResult = uiEditorIpc._m52.getUiEditorElements();
    assert.equal(elementsResult.ok, true);
    const byId = new Map(elementsResult.elements.map((entry) => [entry.elementId, entry]));
    assert.deepEqual(elementsResult.elements.filter((entry) => entry.parentId === null).map((entry) => entry.elementId), ["bbm.main.shell"]);
    assert.equal(byId.get("bbm.uiEditorTest.workspace")?.parentId, "bbm.main.content");
    for (const [elementId] of M64_ELEMENTS) {
      assert.ok(byId.has(elementId), `${elementId} fehlt im IPC-Elementpfad`);
    }
    uiEditorIpc._m52.closeUiEditorSession();
  });

  await run("M64 Render: alle Testelemente bekommen explizite Metadaten und HTMLElement-Refs", async () => withDom(async () => {
    const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH);
    const refs = await importEsmFromFile(REFS_PATH);
    refs.clearBbmUiElementRefs();
    const panel = new BbmUiEditorStatusPanel({});
    panel.testSurfaceNode = document.createElement("section");
    panel.renderTestSurface();
    for (const [elementId, label, kind, parentId, editable, allowedOps] of M64_ELEMENTS) {
      const node = findByAttr(panel.testSurfaceNode, "data-ui-inspector-id", elementId);
      assert.ok(node, `${elementId} fehlt im Renderbaum`);
      assert.equal(node.getAttribute("data-ui-editor-kind"), kind);
      assert.equal(node.getAttribute("data-ui-editor-label"), label);
      assert.equal(node.getAttribute("data-ui-editor-parent"), parentId || "");
      assert.equal(node.getAttribute("data-ui-editor-editable"), editable ? "true" : "false");
      assert.equal(node.getAttribute("data-ui-editor-ops"), allowedOps.join(","));
      assert.equal(refs.getBbmUiElementRef(elementId), node);
    }
    const renderedText = collectText(panel.testSurfaceNode);
    assert.match(renderedText, /Beispielbutton ohne Fachaktion/);
    assert.match(renderedText, /Eingabefeld-Hülle \(keine Dateneingabe\)/);
    assert.match(renderedText, /Auswahlfeld-Hülle \(keine Datenänderung\)/);
    assert.match(renderedText, /Alpha/);
    refs.clearBbmUiElementRefs();
  }));


  await run("M64 Pruefanordnung: Testflaeche und Steuerpanel bleiben getrennt nebeneinander vorbereitet", async () => withDom(async () => {
    const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH);
    const refs = await importEsmFromFile(REFS_PATH);
    refs.clearBbmUiElementRefs();
    const panel = new BbmUiEditorStatusPanel({});
    const root = panel.render();
    const testLayout = collectByClass(root, "bbm-ui-editor-test-layout")[0];
    const controlPanel = collectByClass(root, "bbm-ui-editor-test-control-panel")[0];
    assert.ok(testLayout, "gemeinsamer M64-Pruefarbeitsbereich muss existieren");
    assert.ok(controlPanel, "kompaktes M64-Steuerpanel muss existieren");
    assert.equal(panel.panelRoot, controlPanel);
    assert.equal(testLayout.children.includes(panel.testSurfaceNode), true);
    assert.equal(testLayout.children.includes(controlPanel), true);
    assert.equal(controlPanel.contains(panel.detailsNode), true);
    assert.equal(panel.panelRoot.contains(panel.testSurfaceNode), false, "panelRoot darf die Testflaeche nicht enthalten");
    assert.equal(panel.testSurfaceNode.contains(panel.panelRoot), false, "Testflaeche darf das Bedienpanel nicht enthalten");
    const buttonShell = refs.getBbmUiElementRef("bbm.uiEditorTest.card.button");
    assert.ok(buttonShell, "Testelement-Ref bleibt ausserhalb des panelRoot gebunden");
    assert.equal(panel.panelRoot.contains(buttonShell), false);
    refs.clearBbmUiElementRefs();
  }));

  await run("M64 Pruefanordnung: Steuerbuttons bleiben ausgeschlossen und Testelemente auswaehlbar", async () => withDom(async ({ doc, win }) => {
    const context = await createIntegratedPanel({ doc, win });
    await selectByRealClick(context, "bbm.uiEditorTest.card.title");
    assert.equal(context.panel.selectedElement?.elementId, "bbm.uiEditorTest.card.title");
    const move = buttonByText(context.panel.detailsNode, "Move");
    const right = padButton(context.panel.detailsNode, "right");
    assert.ok(move, "Move-Schalter muss im kompakten Steuerpanel sichtbar sein");
    assert.ok(right, "Steuerkreuz muss im kompakten Steuerpanel sichtbar sein");
    assert.equal(context.panel.panelRoot.contains(move), true);
    assert.equal(context.panel.panelRoot.contains(right), true);
    assert.equal(context.panel.kitSelectionHost.isExcludedTarget(move), true);
    assert.equal(context.panel.kitSelectionHost.isExcludedTarget(right), true);
    assert.equal(context.panel.panelRoot.contains(context.panel.testSurfaceNode), false);
    const beforeSelected = context.panel.selectedElement?.elementId;
    context.interactionRoot.dispatch("click", { target: move });
    await flushSelection();
    assert.equal(context.panel.selectedElement?.elementId, beforeSelected);
    context.refs.clearBbmUiElementRefs();
  }));

  await run("M64 Pruefanordnung: sticky Desktop-CSS und responsive Einspaltigkeit sind vorhanden", () => {
    const cssSource = fs.readFileSync(CSS_PATH, "utf8");
    assert.match(cssSource, /\.bbm-ui-editor-test-layout\s*\{[^}]*display:\s*grid/i);
    assert.match(cssSource, /grid-template-columns:\s*minmax\(650px,\s*1fr\)\s+minmax\(320px,\s*380px\)/i);
    assert.match(cssSource, /\.bbm-ui-editor-test-control-panel\s*\{[^}]*position:\s*sticky[^}]*top:\s*16px[^}]*align-self:\s*start/is);
    assert.doesNotMatch(cssSource, /\.bbm-ui-editor-test-control-panel\s*\{[^}]*position:\s*(?:fixed|absolute)/is);
    assert.match(cssSource, /@media\s*\(max-width:\s*1100px\)[^{]*\{[^}]*\.bbm-ui-editor-test-layout[^}]*grid-template-columns:\s*1fr/is);
    assert.match(cssSource, /@media\s*\(max-width:\s*1100px\)[\s\S]*\.bbm-ui-editor-test-control-panel\s*\{\s*position:\s*static/is);
  });

  await run("M64 Integration: alle M64-Elemente sind per Kit-Klick auswaehlbar und zeigen Namen/Overlay", async () => withDom(async ({ doc, win }) => {
    const context = await createIntegratedPanel({ doc, win });
    for (const [elementId, label] of M64_ELEMENTS) {
      const target = await selectByRealClick(context, elementId);
      assert.match(collectText(context.panel.detailsNode), new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      const selectedOverlay = findNode(doc.body, (node) => node.attributes?.["data-selection-overlay"] === "selected");
      assert.ok(selectedOverlay, "Auswahl-Overlay muss existieren");
      assert.equal(selectedOverlay.style.display, "block");
      assert.equal(context.refs.getBbmUiElementRef(elementId), target, "Overlay-Ziel muss auf den registrierten Ref aufloesbar bleiben");
    }
    context.refs.clearBbmUiElementRefs();
  }));

  await run("M64 Layout: editierbare Elemente bewegen und vergroessern ueber HostAdapter/Layout-State", async () => withDom(async ({ doc, win }) => {
    const context = await createIntegratedPanel({ doc, win });
    for (const [elementId, _label, _type, _parentId, editable] of M64_ELEMENTS) {
      const target = await selectByRealClick(context, elementId);
      const move = buttonByText(context.panel.detailsNode, "Move");
      const width = buttonByText(context.panel.detailsNode, "Breite");
      const height = buttonByText(context.panel.detailsNode, "Höhe");
      if (!editable) {
        const beforeChangeCount = context.changeRequests.length;
        assert.equal(move.disabled, true);
        assert.equal(width.disabled, true);
        assert.equal(height.disabled, true);
        assert.match(collectText(context.panel.detailsNode), /UI-Editor-Testfläche/);
        padButton(context.panel.detailsNode, "right").click();
        assert.equal(context.changeRequests.length, beforeChangeCount);
        assert.equal(context.panel.selectedElement?.elementId, elementId);
        continue;
      }
      assert.equal(move.disabled, false);
      assert.equal(width.disabled, false);
      assert.equal(height.disabled, false);
      const defaults = context.panel.elements.find((entry) => entry.elementId === elementId)?.layoutDefaults || {};
      await applyLayoutTriple(context, elementId, target, defaults);
    }
    context.refs.clearBbmUiElementRefs();
  }));

  await run("M64 Fachaktions-Guardrails: Test-Huellen waehlen nur Editor-Ziele aus", async () => withDom(async ({ doc, win }) => {
    const context = await createIntegratedPanel({ doc, win });
    for (const elementId of ["bbm.uiEditorTest.card.button", "bbm.uiEditorTest.card.input", "bbm.uiEditorTest.card.select"]) {
      await selectByRealClick(context, elementId);
      assert.equal(context.panel.selectedElement?.elementId, elementId);
      assert.equal(context.fachCalls.length, 0);
    }
    assert.equal(context.changeRequests.length, 0);
    context.refs.clearBbmUiElementRefs();
  }));

  await run("M64 Guardrails: Registry bleibt fuehrend, Bridge hat keine zweite Parent-Tabelle", () => {
    const panelSource = fs.readFileSync(PANEL_PATH, "utf8");
    const bridgeSource = fs.readFileSync(BRIDGE_PATH, "utf8");
    assert.doesNotMatch(panelSource, /createNode\("input"\)|createNode\("select"\)|createElement\("input"\)|createElement\("select"\)/);
    assert.doesNotMatch(panelSource, /ipcRenderer|ipcMain|invoke\(|localStorage|querySelector|querySelectorAll|getElementById|getElementsBy|MutationObserver/);
    assert.doesNotMatch(bridgeSource, /PARENT_BY_ELEMENT_ID/);
    assert.doesNotMatch(bridgeSource, /bbm\.uiEditorTest\.workspace"\s*:\s*"root"/);
    assert.match(bridgeSource, /parentId:\s*element\?\.parentId \?\? null/);
    assert.match(panelSource, /bindTestSurfaceElementRef\("bbm\.uiEditorTest\.card\.button", buttonShell\)/);
    assert.match(panelSource, /bindTestSurfaceElementRef\("bbm\.uiEditorTest\.table", table\)/);
  });
}

if (require.main === module) {
  const run = async (name, fn) => {
    try { const out = fn(); if (out && typeof out.then === "function") await out; console.log(`ok - ${name}`); }
    catch (err) { console.error(`not ok - ${name}`); console.error(err?.stack || err); process.exitCode = 1; }
  };
  runM64UiEditorTestSurfaceTests(run).then(() => { if (!process.exitCode) console.log("m64UiEditorTestSurface.test.cjs passed"); });
}

module.exports = { runM64UiEditorTestSurfaceTests };
