const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");

function read(file) {
  return fs.readFileSync(path.join(REPO_ROOT, file), "utf8");
}

class TestHTMLElement {
  constructor(name, rect = {}) {
    this.name = name;
    this.tagName = String(name).toUpperCase();
    this.parentNode = null;
    this.parentElement = null;
    this.children = [];
    this.listeners = new Map();
    this.ownerDocument = null;
    this.rect = { left: 0, top: 0, width: 100, height: 100, ...rect };
    this.style = {};
    this.attributes = new Map();
    this.textContent = "";
    this.isConnected = false;
    this.firstChild = null;
    this.disabled = false;
    this.hidden = false;
  }
  append(...nodes) { for (const node of nodes) this.appendChild(node); }
  appendChild(child) {
    child.parentNode = this;
    child.parentElement = this;
    if (!child.ownerDocument) child.ownerDocument = this.ownerDocument;
    this.children.push(child);
    if (!this.firstChild) this.firstChild = child;
    child.isConnected = true;
    return child;
  }
  removeChild(child) {
    this.children = this.children.filter((entry) => entry !== child);
    if (this.firstChild === child) this.firstChild = this.children[0] || null;
    child.parentNode = null;
    child.parentElement = null;
    child.isConnected = false;
  }
  contains(target) {
    let node = target;
    while (node) {
      if (node === this) return true;
      node = node.parentNode || null;
    }
    return false;
  }
  setAttribute(name, value) { this.attributes.set(String(name), String(value)); }
  getAttribute(name) { return this.attributes.has(String(name)) ? this.attributes.get(String(name)) : null; }
  addEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
  }
  removeEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    this.listeners.set(type, list.filter((entry) => entry !== handler));
  }
  dispatch(type, event) { for (const handler of this.listeners.get(type) || []) handler(event); }
  getBoundingClientRect() { return this.rect; }
}

function createDoc() {
  const doc = {
    defaultView: { HTMLElement: TestHTMLElement, listeners: new Map() },
    listeners: new Map(),
    body: null,
    documentElement: null,
    createElement(name) {
      const node = new TestHTMLElement(name);
      node.ownerDocument = doc;
      return node;
    },
    addEventListener(type, handler) {
      const list = this.listeners.get(type) || [];
      list.push(handler);
      this.listeners.set(type, list);
    },
    removeEventListener(type, handler) {
      const list = this.listeners.get(type) || [];
      this.listeners.set(type, list.filter((entry) => entry !== handler));
    },
    dispatch(type, event) { for (const handler of this.listeners.get(type) || []) handler(event); },
  };
  doc.defaultView.addEventListener = function addEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
  };
  doc.defaultView.removeEventListener = function removeEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    this.listeners.set(type, list.filter((entry) => entry !== handler));
  };
  doc.defaultView.dispatch = function dispatch(type, event) { for (const handler of this.listeners.get(type) || []) handler(event); };
  doc.body = new TestHTMLElement("body");
  doc.body.ownerDocument = doc;
  doc.body.isConnected = true;
  doc.documentElement = doc.body;
  return doc;
}

function walk(node, predicate, results = []) {
  if (!node) return results;
  if (predicate(node)) results.push(node);
  for (const child of node.children || []) walk(child, predicate, results);
  return results;
}

function byAttr(root, attr) {
  return walk(root, (node) => node.getAttribute?.(attr) === "true");
}

function eventFor(target) {
  return { target, key: undefined, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} };
}

async function setupRefs() {
  const refs = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js"));
  refs.clearBbmUiElementRefs();
  const doc = createDoc();
  const shell = new TestHTMLElement("shell", { left: 1, top: 2, width: 1000, height: 800 });
  const nav = new TestHTMLElement("nav", { left: 10, top: 20, width: 200, height: 700 });
  const header = new TestHTMLElement("header", { left: 220, top: 20, width: 800, height: 80 });
  const content = new TestHTMLElement("content", { left: 220, top: 110, width: 800, height: 620 });
  for (const node of [shell, nav, header, content]) node.ownerDocument = doc;
  doc.body.appendChild(shell);
  shell.appendChild(nav);
  shell.appendChild(header);
  shell.appendChild(content);
  refs.registerBbmUiElementRef("bbm.main.shell", shell);
  refs.registerBbmUiElementRef("bbm.main.navigation", nav);
  refs.registerBbmUiElementRef("bbm.main.header", header);
  refs.registerBbmUiElementRef("bbm.main.content", content);
  return { refs, doc, shell, nav, header, content };
}

async function runM56PersistentSelectionFrameTests(run) {
  await run("M56 Auswahloverlay: Rahmen, Label, Rect, Wechsel, Leer und unbekannt", async () => {
    const { refs, doc, header, nav } = await setupRefs();
    const { createBbmUiSelectedOverlay } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiSelectedOverlay.js"));
    const overlay = createBbmUiSelectedOverlay();
    assert.equal(overlay.sync({ elementId: "bbm.main.header", label: "Seitenkopf" }), true);
    let frames = byAttr(doc.body, "data-bbm-ui-selected-frame");
    assert.equal(frames.length, 1);
    assert.equal(frames[0].style.left, "220px");
    assert.equal(frames[0].style.top, "20px");
    assert.equal(frames[0].style.width, "800px");
    assert.equal(frames[0].style.height, "80px");
    assert.match(frames[0].firstChild.textContent, /Ausgewählt: Seitenkopf · bbm\.main\.header/);
    assert.match(frames[0].style.border, /249, 115, 22/);
    const sameFrame = frames[0];
    assert.equal(overlay.sync({ elementId: "bbm.main.navigation", label: "Navigation" }), true);
    frames = byAttr(doc.body, "data-bbm-ui-selected-frame");
    assert.equal(frames.length, 1);
    assert.equal(frames[0], sameFrame);
    assert.equal(frames[0].style.left, "10px");
    nav.rect.left = 42;
    doc.dispatch("scroll", {});
    assert.equal(frames[0].style.left, "42px");
    nav.rect.width = 222;
    doc.defaultView.dispatch("resize", {});
    assert.equal(frames[0].style.width, "222px");
    overlay.sync(null);
    assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 0);
    assert.equal((doc.listeners.get("scroll") || []).length, 0);
    assert.equal((doc.defaultView.listeners.get("resize") || []).length, 0);
    assert.equal(overlay.sync({ elementId: "bbm.unknown", label: "Unbekannt" }), false);
    refs.unregisterBbmUiElementRef("bbm.main.navigation");
    assert.equal(overlay.sync({ elementId: "bbm.main.navigation", label: "Navigation" }), false);
  });

  await run("M56 Auswahloverlay: bbm.main.actions ohne Ref erzeugt keinen Rahmen und maximal einen Rahmen", async () => {
    const { doc } = await setupRefs();
    const { createBbmUiSelectedOverlay } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiSelectedOverlay.js"));
    const overlay = createBbmUiSelectedOverlay();
    assert.equal(overlay.sync({ elementId: "bbm.main.actions", label: "Aktionen" }), false);
    assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 0);
    overlay.sync({ elementId: "bbm.main.header", label: "Seitenkopf" });
    overlay.sync({ elementId: "bbm.main.header", label: "Seitenkopf" });
    overlay.sync({ elementId: "bbm.main.content", label: "Inhalt" });
    assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 1);
  });

  await run("M56 Hover/Selected: anderes Ziel doppelt sichtbar, gleiches Ziel nicht doppelt, Escape/Stop lassen Auswahl stehen", async () => {
    const { doc, shell, nav, header } = await setupRefs();
    const { createBbmUiSelectedOverlay } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiSelectedOverlay.js"));
    const { createBbmUiElementSelectionController } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementSelection.js"));
    const selectedOverlay = createBbmUiSelectedOverlay();
    selectedOverlay.sync({ elementId: "bbm.main.header", label: "Seitenkopf" });
    const controller = createBbmUiElementSelectionController({
      isElementSelected: (elementId) => elementId === "bbm.main.header",
      getElementMeta: (elementId) => ({ label: elementId === "bbm.main.header" ? "Seitenkopf" : "Navigation" }),
    });
    controller.start();
    shell.dispatch("pointermove", eventFor(nav));
    assert.equal(byAttr(doc.body, "data-bbm-ui-selection-hover-frame").length, 1);
    assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 1);
    shell.dispatch("pointermove", eventFor(header));
    assert.equal(byAttr(doc.body, "data-bbm-ui-selection-hover-frame").length, 0);
    assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 1);
    shell.dispatch("pointermove", eventFor(nav));
    doc.dispatch("keydown", { key: "Escape" });
    assert.equal(controller.isActive(), false);
    assert.equal(byAttr(doc.body, "data-bbm-ui-selection-hover-frame").length, 0);
    assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 1);
    controller.start();
    shell.dispatch("pointermove", eventFor(nav));
    controller.stop();
    assert.equal(byAttr(doc.body, "data-bbm-ui-selection-hover-frame").length, 0);
    assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 1);
    selectedOverlay.clear();
    assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 0);
  });

  await run("M56 Statuspanel: selectedElement ist Quelle, refresh/select/reset/close/destroy synchronisieren", async () => {
    const { doc } = await setupRefs();
    const previousDocument = global.document;
    const previousWindow = global.window;
    let selectedId = "bbm.main.header";
    const elements = [
      { elementId: "bbm.main.header", label: "Seitenkopf", type: "frame", scope: "bbm", capabilities: [], allowedChanges: [] },
      { elementId: "bbm.main.navigation", label: "Navigation", type: "frame", scope: "bbm", capabilities: [], allowedChanges: [] },
    ];
    global.document = doc;
    global.window = {
      bbmDb: {
        uiEditorOpen: async () => ({ ok: true, runtimeStarted: true, adapterValid: true, layout: {} }),
        uiEditorGetElements: async () => ({ ok: true, elements: elements.map((element) => ({ ...element, selected: element.elementId === selectedId })) }),
        uiEditorGetSelectedElementDetails: async () => ({ ok: true, selectedElement: elements.find((element) => element.elementId === selectedId) || null }),
        uiEditorSelectElement: async ({ elementId }) => { selectedId = elementId; return { ok: true }; },
        uiEditorClose: async () => ({ ok: true }),
      },
    };
    try {
      const { createBbmUiEditorStatusPanel } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js"));
      const panel = createBbmUiEditorStatusPanel({ router: { activeSection: "uiEditor", showSettings: async () => {} } });
      const root = panel.render();
      doc.body.appendChild(root);
      await panel.refresh();
      assert.equal(panel.selectedElement.elementId, "bbm.main.header");
      assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 1);
      assert.ok(walk(root, (node) => node.textContent === "Visuell markiert").length >= 1);
      assert.ok(walk(root, (node) => node.textContent === "Seitenkopf").length >= 1);
      await panel.selectElement("bbm.main.navigation");
      assert.equal(panel.selectedElement.elementId, "bbm.main.navigation");
      assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 1);
      await panel.resetSelection();
      assert.equal(selectedId, "");
      assert.equal(panel.selectedElement, null);
      assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 0);
      selectedId = "bbm.main.header";
      await panel.refresh();
      assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 1);
      await panel.close();
      assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 0);
      selectedId = "bbm.main.header";
      await panel.refresh();
      assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 1);
      panel.destroy();
      assert.equal(byAttr(doc.body, "data-bbm-ui-selected-frame").length, 0);
      assert.equal((doc.listeners.get("scroll") || []).length, 0);
      assert.equal((doc.defaultView.listeners.get("resize") || []).length, 0);
    } finally {
      global.document = previousDocument;
      global.window = previousWindow;
    }
  });

  await run("M56 Sicherheit: keine verbotene Zielsuche, keine zweite Auswahlhaltung, keine neue IPC/Legacy/Layoutmutation", () => {
    const files = [
      "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
      "src/renderer/ui-editor/bbmUiElementSelection.js",
      "src/renderer/ui-editor/bbmUiSelectionOverlay.js",
      "src/renderer/ui-editor/bbmUiSelectedOverlay.js",
      "src/renderer/ui-editor/bbmUiElementRefs.js",
    ];
    const combined = files.map(read).join("\n");
    assert.doesNotMatch(combined, /querySelector|querySelectorAll|getElementById|getElementsBy|closest\s*\(|matches\s*\(|MutationObserver|elementsFromPoint|elementFromPoint/);
    assert.doesNotMatch(combined, /targetSelection|editorV2Core|UiInspectorOverlay|BBM_UI_ELEMENTS\s*=|ipcRenderer|ipcMain|localStorage/);
    assert.doesNotMatch(combined, /selectedElementId\s*=|new Map\(\).*selected|data-ui-/s);
    assert.doesNotMatch(combined, /targetElement\.style|nextTargetElement\.style|getBbmUiElementRef\("bbm\.main\.shell"\)\s*\|\|/);
  });

  await run("M56 Dokumentation, Aufgabenheft und Testeinbindung sind nachgezogen", () => {
    assert.match(read("docs/M56_DAUERHAFTER_AUSWAHLRAHMEN.md"), /dauerhafter Auswahlrahmen/i);
    assert.match(read("STATUS.md"), /M56/);
    assert.match(read("docs/UI_INSPEKTOR_AUFGABENHEFT.md"), /M56/);
    assert.match(read("scripts/test.cjs"), /runM56PersistentSelectionFrameTests/);
  });
}

if (require.main === module) {
  let failed = false;
  const run = async (name, fn) => {
    try { await fn(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM56PersistentSelectionFrameTests(run).then(() => { if (failed) process.exitCode = 1; });
}

module.exports = { runM56PersistentSelectionFrameTests };
