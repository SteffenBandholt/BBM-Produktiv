const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { isUnexpectedProtokollDiff } = require("./_diffGuardAllowances.cjs");

function createFakeDocument() {
  const listeners = new Map();

  function createNode(tagName, doc) {
    return {
      tagName: String(tagName || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentElement: null,
      textContent: "",
      style: { cssText: "" },
      attributes: {},
      dataset: {},
      _rect: { left: 0, top: 0, width: 0, height: 0 },
      append(...items) {
        for (const item of items) {
          if (item && typeof item === "object") {
            item.parentElement = this;
            item.ownerDocument = doc;
          }
          this.children.push(item);
        }
      },
      replaceChildren(...items) {
        this.children = [];
        this.append(...items);
      },
      removeChild(item) {
        this.children = this.children.filter((entry) => entry !== item);
        if (item && typeof item === "object") {
          item.parentElement = null;
        }
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
      },
      getBoundingClientRect() {
        return this._rect;
      },
      querySelectorAll(selector) {
        const all = [];
        const walk = (node) => {
          if (!node || typeof node !== "object") return;
          all.push(node);
          for (const child of Array.isArray(node.children) ? node.children : []) {
            walk(child);
          }
        };
        walk(this);
        if (selector === "[data-ui-v2-id]") {
          return all.filter((node) => typeof node.getAttribute === "function" && node.getAttribute("data-ui-v2-id"));
        }
        return [];
      },
      addEventListener(type, handler) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(handler);
      },
      removeEventListener(type, handler) {
        listeners.set(type, (listeners.get(type) || []).filter((entry) => entry !== handler));
      },
      dispatchEvent(event) {
        const type = String(event?.type || "");
        for (const handler of listeners.get(type) || []) handler.call(this, event);
      },
    };
  }

  const document = {
    createElement(tagName) {
      return createNode(tagName, document);
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      listeners.set(type, (listeners.get(type) || []).filter((entry) => entry !== handler));
    },
    dispatch(type, event = {}) {
      event.type = type;
      for (const handler of listeners.get(type) || []) handler(event);
    },
  };
  document._listeners = listeners;

  document.body = createNode("body", document);
  document.body._rect = { left: 0, top: 0, width: 1600, height: 1200 };
  document.elementFromPoint = () => null;
  return document;
}

function collectNodes(node, predicate, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (predicate(node)) acc.push(node);
  for (const child of Array.isArray(node.children) ? node.children : []) {
    collectNodes(child, predicate, acc);
  }
  return acc;
}

function getNodeById(root, id) {
  return collectNodes(root, (node) => node?.getAttribute?.("data-ui-v2-id") === id)[0] || null;
}

function setRect(node, rect) {
  node._rect = { ...rect };
  return node;
}

function installThrowingGlobal(name) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    get() {
      throw new Error(`${name} darf im Editor V2 Preview nicht verwendet werden`);
    },
  });
  return () => {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor);
    } else {
      delete globalThis[name];
    }
  };
}

async function runEditorV2PreviewTests(run) {
  const corePath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Core.js");
  const overlayPath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Overlay.js");
  const screenPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/EditorLabScreen.js");
  const registryPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/editorLabRegistry.js");

  const coreSource = fs.readFileSync(corePath, "utf8");
  const overlaySource = fs.readFileSync(overlayPath, "utf8");
  assert.equal(coreSource.includes("localStorage"), false);
  assert.equal(coreSource.includes("indexedDB"), false);
  assert.equal(coreSource.includes("ipcRenderer"), false);
  assert.equal(overlaySource.includes("localStorage"), false);
  assert.equal(overlaySource.includes("indexedDB"), false);
  assert.equal(overlaySource.includes("ipcRenderer"), false);
  assert.equal(coreSource.includes("restarbeiten"), false);
  assert.equal(coreSource.includes("protokoll"), false);
  assert.equal(overlaySource.includes("restarbeiten"), false);
  assert.equal(overlaySource.includes("protokoll"), false);
  assert.equal(coreSource.includes("uiInspector"), false);
  assert.equal(overlaySource.includes("uiInspector"), false);

  const { createEditorV2Core } = await importEsmFromFile(corePath);
  const { createEditorLabScreen } = await importEsmFromFile(screenPath);
  const { createEditorLabRegistry } = await importEsmFromFile(registryPath);

  assert.equal(typeof createEditorV2Core, "function");
  assert.equal(typeof createEditorLabScreen, "function");
  assert.equal(typeof createEditorLabRegistry, "function");

  const document = createFakeDocument();
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const restoreLocalStorage = installThrowingGlobal("localStorage");
  const restoreIndexedDB = installThrowingGlobal("indexedDB");
  const restoreIpcRenderer = installThrowingGlobal("ipcRenderer");
  let core = null;
  const windowListeners = new Map();
  const windowMock = {
    innerWidth: 1600,
    innerHeight: 1200,
    addEventListener(type, handler) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      windowListeners.set(type, (windowListeners.get(type) || []).filter((entry) => entry !== handler));
    },
    dispatchEvent(event) {
      const type = String(event?.type || "");
      for (const handler of windowListeners.get(type) || []) handler.call(windowMock, event);
    },
  };
  document.defaultView = windowMock;
  globalThis.document = document;
  globalThis.window = windowMock;

  try {
    const registry = createEditorLabRegistry();
    const screen = createEditorLabScreen({ registry });
    const root = screen.render(document.body);
    assert.ok(root);

    const rects = {
      "editorlab.root": { left: 0, top: 0, width: 1200, height: 900 },
      "editorlab.header": { left: 20, top: 20, width: 1160, height: 120 },
      "editorlab.header.titleGroup": { left: 40, top: 40, width: 260, height: 32 },
      "editorlab.header.searchGroup": { left: 320, top: 40, width: 280, height: 32 },
      "editorlab.header.statusGroup": { left: 620, top: 40, width: 220, height: 32 },
      "editorlab.quicklane": { left: 980, top: 20, width: 180, height: 560 },
      "editorlab.quicklane.lock": { left: 1000, top: 40, width: 140, height: 28 },
      "editorlab.quicklane.new": { left: 1000, top: 76, width: 140, height: 28 },
      "editorlab.quicklane.save": { left: 1000, top: 112, width: 140, height: 28 },
      "editorlab.quicklane.view": { left: 1000, top: 148, width: 140, height: 28 },
      "editorlab.main": { left: 20, top: 160, width: 920, height: 520 },
      "editorlab.main.groupA": { left: 40, top: 180, width: 400, height: 180 },
      "editorlab.main.groupA.fieldA1": { left: 60, top: 212, width: 180, height: 32 },
      "editorlab.main.groupA.buttonA2": { left: 60, top: 260, width: 120, height: 28 },
      "editorlab.main.groupB": { left: 40, top: 380, width: 400, height: 180 },
      "editorlab.main.groupB.fieldB1": { left: 60, top: 412, width: 180, height: 32 },
      "editorlab.main.groupB.buttonB2": { left: 60, top: 460, width: 120, height: 28 },
      "editorlab.footer": { left: 20, top: 700, width: 1160, height: 160 },
      "editorlab.footer.groupC": { left: 40, top: 720, width: 300, height: 52 },
      "editorlab.footer.groupC.fieldC1": { left: 60, top: 730, width: 160, height: 24 },
      "editorlab.footer.groupD": { left: 360, top: 720, width: 300, height: 70 },
      "editorlab.footer.groupD.fieldD1": { left: 380, top: 730, width: 160, height: 24 },
      "editorlab.footer.groupD.buttonD2": { left: 380, top: 760, width: 120, height: 28 },
    };

    for (const entry of registry) {
      const node = getNodeById(root, entry.id);
      assert.ok(node, `missing node for ${entry.id}`);
      setRect(node, rects[entry.id]);
      node.style.cssText = `seed:${entry.id}`;
    }

    core = createEditorV2Core({ registry, mode: "frame" });
    assert.equal(core.mount(root), true);
    assert.equal(core.moveSelected(10, 4), false);
    assert.equal(core.resizeSelected(20, 10), false);

    const overlayRoot = core.getOverlayRoot();
    assert.ok(overlayRoot);

    const click = (target) => document.dispatch("click", { type: "click", target });
    const move = (target) => document.dispatch("pointermove", { type: "pointermove", target });

    core.setMode("frame");
    click(getNodeById(root, "editorlab.main.groupA"));
    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupA");

    const originalCss = new Map();
    for (const entry of registry) {
      const node = getNodeById(root, entry.id);
      originalCss.set(entry.id, node.style.cssText);
    }

    assert.equal(core.moveSelected(10, 4), true);
    let state = core.getPreviewState("editorlab.main.groupA");
    assert.equal(state.x, 10);
    assert.equal(state.y, 4);
    assert.equal(getNodeById(root, "editorlab.main.groupA").style.cssText.includes("translate(10px, 4px)"), true);
    for (const entry of registry) {
      if (entry.id === "editorlab.main.groupA") continue;
      assert.equal(getNodeById(root, entry.id).style.cssText, originalCss.get(entry.id));
    }

    assert.equal(core.moveSelected(-2, 6), true);
    state = core.getPreviewState("editorlab.main.groupA");
    assert.equal(state.x, 8);
    assert.equal(state.y, 10);
    assert.equal(getNodeById(root, "editorlab.main.groupA").style.cssText.includes("translate(8px, 10px)"), true);

    assert.equal(core.resizeSelected(20, 10), true);
    state = core.getPreviewState("editorlab.main.groupA");
    assert.equal(state.width, 420);
    assert.equal(state.height, 190);
    const groupA = getNodeById(root, "editorlab.main.groupA");
    assert.equal(groupA.style.cssText.includes("width: 420px"), true);
    assert.equal(groupA.style.cssText.includes("height: 190px"), true);

    assert.equal(core.resizeSelected(-1000, -1000), true);
    state = core.getPreviewState("editorlab.main.groupA");
    assert.equal(state.width, 140);
    assert.equal(state.height, 80);
    assert.equal(groupA.style.cssText.includes("width: 140px"), true);
    assert.equal(groupA.style.cssText.includes("height: 80px"), true);

    const selectedFrameNodes = () =>
      overlayRoot.children.filter((node) => node.getAttribute("data-ui-editor-v2-selected-frame") === "true");
    assert.equal(selectedFrameNodes().length, 1);
    assert.equal(core.getSelectedFrame()?.getAttribute("data-ui-editor-v2-selected-frame"), "true");

    const hoverFrameNodes = () =>
      overlayRoot.children.filter((node) => node.getAttribute("data-ui-editor-v2-hover-frame") === "true");
    move(getNodeById(root, "editorlab.main.groupB"));
    assert.equal(hoverFrameNodes().length, 1);
    assert.equal(selectedFrameNodes().length, 1);

    setRect(groupA, { left: 120, top: 180, width: 140, height: 80 });
    document.dispatch("scroll", { type: "scroll" });
    assert.equal(selectedFrameNodes().length, 1);
    assert.equal(core.getSelectedFrame().style.left, "120px");
    assert.equal(core.getSelectedFrame().style.top, "180px");
    assert.equal(core.getSelectedFrame().style.width, "140px");
    assert.equal(core.getSelectedFrame().style.height, "80px");

    const groupB = getNodeById(root, "editorlab.main.groupB");
    setRect(groupB, { left: 180, top: 420, width: 400, height: 180 });
    windowMock.dispatchEvent({ type: "resize" });
    assert.equal(hoverFrameNodes().length, 1);
    assert.equal(core.getHoverFrame().style.left, "180px");
    assert.equal(core.getHoverFrame().style.top, "420px");

    assert.equal(core.resetSelectedPreview(), true);
    assert.equal(groupA.style.cssText, originalCss.get("editorlab.main.groupA"));
    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupA");
    assert.equal(selectedFrameNodes().length, 1);
    assert.equal(core.getSelectedFrame().style.left, "40px");
    assert.equal(core.getSelectedFrame().style.top, "180px");

    core.setMode("frame");
    click(getNodeById(root, "editorlab.main.groupB"));
    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupB");
    assert.equal(core.moveSelected(6, 2), true);
    assert.equal(core.resizeSelected(10, 4), true);

    assert.notEqual(groupB.style.cssText, originalCss.get("editorlab.main.groupB"));
    assert.equal(getNodeById(root, "editorlab.main.groupA").style.cssText, originalCss.get("editorlab.main.groupA"));

    assert.equal(core.resetAllPreview(), true);
    for (const entry of registry) {
      const node = getNodeById(root, entry.id);
      assert.equal(node.style.cssText, originalCss.get(entry.id), `style not restored for ${entry.id}`);
    }

    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupB");
    assert.equal(selectedFrameNodes().length, 1);
    assert.equal(hoverFrameNodes().length <= 1, true);
    assert.equal(core.getCurrentSelected().entry.id, "editorlab.main.groupB");

    assert.equal(core.unmount(), true);
    assert.equal((windowListeners.get("resize") || []).length, 0);
    assert.equal((document._listeners?.scroll || []).length || 0, 0);

    const diffFiles = execFileSync("git", ["diff", "--name-only"], { cwd: path.join(__dirname, "../.."), encoding: "utf8" })
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    assert.equal(diffFiles.some(isUnexpectedProtokollDiff), false);
    assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
    restoreLocalStorage();
    restoreIndexedDB();
    restoreIpcRenderer();
    core?.unmount?.();
  }

  await run("Editor V2 Preview arbeitet im EditorLab", () => undefined);
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

  runEditorV2PreviewTests(run).then(() => {
    if (!process.exitCode) console.log("editorV2Preview.test.cjs passed");
  });
}

module.exports = { runEditorV2PreviewTests };
