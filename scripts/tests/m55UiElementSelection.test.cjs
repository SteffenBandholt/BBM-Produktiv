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
    this.parentNode = null;
    this.children = [];
    this.listeners = new Map();
    this.ownerDocument = null;
    this.rect = { left: 0, top: 0, width: 100, height: 100, ...rect };
  }
  appendChild(child) {
    child.parentNode = this;
    if (!child.ownerDocument) child.ownerDocument = this.ownerDocument;
    this.children.push(child);
    child.isConnected = true;
    return child;
  }
  removeChild(child) {
    this.children = this.children.filter((entry) => entry !== child);
    child.parentNode = null;
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
  addEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
  }
  removeEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    this.listeners.set(type, list.filter((entry) => entry !== handler));
  }
  dispatch(type, event) {
    for (const handler of this.listeners.get(type) || []) handler(event);
  }
  getBoundingClientRect() {
    return this.rect;
  }
}

function createDoc() {
  const doc = {
    defaultView: { HTMLElement: TestHTMLElement, listeners: new Map() },
    listeners: new Map(),
    body: null,
    createElement(name) {
      const node = new TestHTMLElement(name);
      node.ownerDocument = doc;
      node.style = {};
      node.attributes = new Map();
      node.setAttribute = (key, value) => node.attributes.set(key, String(value));
      node.firstChild = null;
      const baseAppend = node.appendChild.bind(node);
      node.appendChild = (child) => {
        if (!node.firstChild) node.firstChild = child;
        return baseAppend(child);
      };
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
    dispatch(type, event) {
      for (const handler of this.listeners.get(type) || []) handler(event);
    },
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
  doc.defaultView.dispatch = function dispatch(type, event) {
    for (const handler of this.listeners.get(type) || []) handler(event);
  };
  doc.body = new TestHTMLElement("body");
  doc.body.ownerDocument = doc;
  return doc;
}

function eventFor(target) {
  return {
    target,
    prevented: false,
    stopped: false,
    immediateStopped: false,
    preventDefault() { this.prevented = true; },
    stopPropagation() { this.stopped = true; },
    stopImmediatePropagation() { this.immediateStopped = true; },
  };
}

async function setupRefs() {
  const refs = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js"));
  refs.clearBbmUiElementRefs();
  const doc = createDoc();
  const shell = new TestHTMLElement("shell", { width: 1000, height: 800 });
  const nav = new TestHTMLElement("nav", { width: 200, height: 700 });
  const header = new TestHTMLElement("header", { width: 800, height: 80 });
  const content = new TestHTMLElement("content", { width: 800, height: 620 });
  const panel = new TestHTMLElement("panel", { width: 300, height: 400 });
  for (const node of [shell, nav, header, content, panel]) node.ownerDocument = doc;
  shell.appendChild(nav);
  shell.appendChild(header);
  shell.appendChild(content);
  content.appendChild(panel);
  refs.registerBbmUiElementRef("bbm.main.shell", shell);
  refs.registerBbmUiElementRef("bbm.main.navigation", nav);
  refs.registerBbmUiElementRef("bbm.main.header", header);
  refs.registerBbmUiElementRef("bbm.main.content", content);
  return { refs, doc, shell, nav, header, content, panel };
}

async function runM55UiElementSelectionTests(run) {
  await run("M55 Controller: Lifecycle, Listener und Escape sind zeitlich begrenzt", async () => {
    const { shell, doc } = await setupRefs();
    const { createBbmUiElementSelectionController } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementSelection.js"));
    let destroyCount = 0;
    const controller = createBbmUiElementSelectionController({ overlay: { mount() {}, updateHover() {}, clearHover() {}, destroy() { destroyCount += 1; } } });
    assert.equal(controller.isActive(), false);
    controller.start();
    controller.start();
    assert.equal(controller.isActive(), true);
    assert.equal(shell.listeners.get("pointermove").length, 1);
    assert.equal(shell.listeners.get("click").length, 1);
    assert.equal(doc.listeners.get("keydown").length, 1);
    doc.dispatch("keydown", { key: "Escape" });
    assert.equal(controller.isActive(), false);
    assert.equal(shell.listeners.get("pointermove").length, 0);
    assert.equal(shell.listeners.get("click").length, 0);
    assert.equal(destroyCount, 1);
  });

  await run("M55 Zielaufloesung: explizite Refs, konkretestes Ziel und Panel-Ausschluss", async () => {
    const { shell, nav, header, content, panel } = await setupRefs();
    const { createBbmUiElementSelectionController } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementSelection.js"));
    const controller = createBbmUiElementSelectionController({ panelRoot: panel, overlay: { mount() {}, updateHover() {}, clearHover() {}, destroy() {} } });
    controller.start();
    assert.equal(controller.resolveTargetForTest(nav).elementId, "bbm.main.navigation");
    assert.equal(controller.resolveTargetForTest(header).elementId, "bbm.main.header");
    assert.equal(controller.resolveTargetForTest(content).elementId, "bbm.main.content");
    assert.equal(controller.resolveTargetForTest(shell).elementId, "bbm.main.shell");
    assert.equal(controller.resolveTargetForTest(panel), null);
    assert.equal(controller.getState().unavailableIds.includes("bbm.main.actions"), true);
    controller.stop();
  });

  await run("M55 Hover: ein Rahmen wird aktualisiert, Scroll/Resize erneuert, Stop entfernt Overlay", async () => {
    const { shell, nav, header, doc } = await setupRefs();
    const { createBbmUiElementSelectionController } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementSelection.js"));
    const calls = [];
    let destroyed = false;
    const controller = createBbmUiElementSelectionController({
      getElementMeta: (elementId) => ({ label: elementId === "bbm.main.header" ? "Seitenkopf" : "Hauptnavigation" }),
      overlay: { mount() {}, updateHover(payload) { calls.push(payload); }, clearHover() { calls.push({ clear: true }); }, destroy() { destroyed = true; } },
    });
    controller.start();
    shell.dispatch("pointermove", eventFor(nav));
    shell.dispatch("pointermove", eventFor(nav));
    shell.dispatch("pointermove", eventFor(header));
    doc.dispatch("scroll", {});
    assert.equal(calls.filter((entry) => entry.targetElement).length, 3);
    assert.match(calls[0].label, /Hauptnavigation · bbm\.main\.navigation/);
    assert.match(calls[1].label, /Seitenkopf · bbm\.main\.header/);
    shell.dispatch("pointermove", eventFor({}));
    assert.equal(calls.some((entry) => entry.clear), true);
    controller.stop();
    assert.equal(destroyed, true);
  });

  await run("M55 Klick: Auswahlcallback nur aktiv und Panel-Klicks bleiben frei", async () => {
    const { shell, nav, panel } = await setupRefs();
    const { createBbmUiElementSelectionController } = await importEsmFromFile(path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementSelection.js"));
    const selected = [];
    const controller = createBbmUiElementSelectionController({ panelRoot: panel, selectElement: ({ elementId }) => selected.push(elementId), overlay: { mount() {}, updateHover() {}, clearHover() {}, destroy() {} } });
    const inactiveEvent = eventFor(nav);
    shell.dispatch("click", inactiveEvent);
    assert.equal(inactiveEvent.prevented, false);
    controller.start();
    const panelEvent = eventFor(panel);
    shell.dispatch("click", panelEvent);
    assert.equal(panelEvent.prevented, false);
    const navEvent = eventFor(nav);
    shell.dispatch("click", navEvent);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(selected, ["bbm.main.navigation"]);
    assert.equal(navEvent.prevented, true);
    controller.stop();
    const afterStopEvent = eventFor(nav);
    shell.dispatch("click", afterStopEvent);
    assert.equal(afterStopEvent.prevented, false);
  });

  await run("M55 Sicherheit: keine DOM-Suche, keine Legacy-Imports, keine zweite Registry", () => {
    const files = [
      "src/renderer/ui-editor/bbmUiElementSelection.js",
      "src/renderer/ui-editor/bbmUiSelectionOverlay.js",
      "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
    ];
    const combined = files.map(read).join("\n");
    assert.doesNotMatch(combined, /querySelector|querySelectorAll|getElementById|getElementsBy|closest\s*\(|matches\s*\(|MutationObserver|elementsFromPoint|elementFromPoint/);
    assert.doesNotMatch(combined, /data-ui-|targetSelection|editorV2Core|UiInspectorOverlay|BBM_UI_ELEMENTS\s*=|ipcRenderer|ipcMain|HTMLElement.*send|send.*HTMLElement/);
    assert.doesNotMatch(combined, /\.style\.(width|height|left|top|position)\s*=\s*[^;]*(target|ref|element)/);
  });

  await run("M55 Dokumentation und Status sind nachgezogen", () => {
    assert.match(read("docs/M55_VISUELLE_UI_AUSWAHL_UEBER_EXPLIZITE_REFS.md"), /Zielaufloesung ueber explizite Refs/);
    assert.match(read("STATUS.md"), /M55/);
    assert.match(read("docs/UI_INSPEKTOR_AUFGABENHEFT.md"), /M55/);
  });
}

if (require.main === module) {
  let failed = false;
  const run = async (name, fn) => {
    try { await fn(); console.log(`ok - ${name}`); }
    catch (error) { failed = true; console.error(`not ok - ${name}`); console.error(error?.stack || error); }
  };
  runM55UiElementSelectionTests(run).then(() => { if (failed) process.exitCode = 1; });
}

module.exports = { runM55UiElementSelectionTests };
