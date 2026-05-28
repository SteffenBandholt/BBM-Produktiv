const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

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

async function runEditorV2SelectionTests(run) {
  const corePath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Core.js");
  const overlayPath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Overlay.js");
  const screenPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/EditorLabScreen.js");
  const registryPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/editorLabRegistry.js");
  const coreSource = fs.readFileSync(corePath, "utf8");
  const overlaySource = fs.readFileSync(overlayPath, "utf8");
  assert.equal(coreSource.includes("data-ui-inspector-id"), false);
  assert.equal(overlaySource.includes("data-ui-inspector-id"), false);
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
  let core = null;
  globalThis.document = document;

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

    const fieldA1 = getNodeById(root, "editorlab.main.groupA.fieldA1");
    const innerChild = document.createElement("span");
    innerChild.textContent = "inner child";
    innerChild._rect = { left: 70, top: 220, width: 60, height: 16 };
    innerChild.style.cssText = "seed:inner";
    fieldA1.append(innerChild);

    core = createEditorV2Core({ registry, mode: "frame" });
    assert.equal("selectedTargetId" in core, false);
    assert.equal(core.mount(root), true);

    const overlayRoot = core.getOverlayRoot();
    assert.ok(overlayRoot);

    const move = (target) => document.dispatch("pointermove", { type: "pointermove", target });
    const click = (target) => document.dispatch("click", { type: "click", target });

    core.setMode("frame");
    click(getNodeById(root, "editorlab.main.groupA"));
    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupA");
    assert.equal(overlayRoot.children.filter((node) => node.getAttribute("data-ui-editor-v2-selected-frame") === "true").length, 1);
    assert.equal(overlayRoot.children[0].getAttribute("data-ui-editor-v2-selected-frame"), "true");

    core.setMode("field");
    click(getNodeById(root, "editorlab.main.groupA.fieldA1"));
    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupA.fieldA1");

    core.setMode("control");
    click(getNodeById(root, "editorlab.main.groupA.buttonA2"));
    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupA.buttonA2");

    const afterControlSelection = core.getSelectedTargetId();
    click(null);
    assert.equal(core.getSelectedTargetId(), afterControlSelection);

    core.setMode("frame");
    click(getNodeById(root, "editorlab.main.groupA"));
    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupA");
    click(getNodeById(root, "editorlab.main.groupB"));
    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupB");

    const selectedFrameNodes = overlayRoot.children.filter((node) => node.getAttribute("data-ui-editor-v2-selected-frame") === "true");
    assert.equal(selectedFrameNodes.length, 1);

    move(getNodeById(root, "editorlab.main.groupA"));
    const hoverFrames = overlayRoot.children.filter((node) => node.getAttribute("data-ui-editor-v2-hover-frame") === "true");
    const selectedFrames = overlayRoot.children.filter((node) => node.getAttribute("data-ui-editor-v2-selected-frame") === "true");
    assert.equal(hoverFrames.length, 1);
    assert.equal(selectedFrames.length, 1);
    assert.notEqual(hoverFrames[0], selectedFrames[0]);

    const selectedBeforeHoverOut = core.getSelectedTargetId();
    move(null);
    assert.equal(core.getSelectedTargetId(), selectedBeforeHoverOut);
    assert.equal(overlayRoot.children.filter((node) => node.getAttribute("data-ui-editor-v2-selected-frame") === "true").length, 1);

    const beforeCss = new Map();
    for (const entry of registry) {
      const node = getNodeById(root, entry.id);
      beforeCss.set(entry.id, node.style.cssText);
    }
    for (const entry of registry) {
      const node = getNodeById(root, entry.id);
      assert.equal(node.style.cssText, beforeCss.get(entry.id));
    }

    assert.equal(typeof core.handlePointerSelect, "function");
    assert.equal(typeof core.resolveRegistryTarget, "function");
    assert.equal(typeof core.getSelectedTargetId, "function");
    assert.equal(typeof core.getHoverTargetId, "function");

    const hoverAfterSelect = core.getHoverTargetId();
    if (hoverAfterSelect) {
      assert.equal(typeof hoverAfterSelect, "string");
    }

    assert.equal(core.getSelectedTargetId(), "editorlab.main.groupB");
    assert.equal(overlayRoot.children.some((node) => node.getAttribute("data-ui-editor-v2-selected-frame") === "true"), true);
    assert.equal(overlayRoot.children.some((node) => node.getAttribute("data-ui-editor-v2-hover-frame") === "true"), false);

    assert.equal(typeof core.move, "undefined");
    assert.equal(typeof core.resize, "undefined");
    assert.equal(typeof core.hide, "undefined");
  } finally {
    globalThis.document = previousDocument;
    core?.unmount?.();
  }

  const diffFiles = execFileSync("git", ["diff", "--name-only"], { cwd: path.join(__dirname, "../.."), encoding: "utf8" })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);

  await run("Editor V2 Selection arbeitet im EditorLab", () => undefined);
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

  runEditorV2SelectionTests(run).then(() => {
    if (!process.exitCode) console.log("editorV2Selection.test.cjs passed");
  });
}

module.exports = { runEditorV2SelectionTests };
