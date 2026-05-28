const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function createFakeDocument() {
  const listeners = new Map();

  function createNode(tagName, doc) {
    const nodeListeners = new Map();
    return {
      tagName: String(tagName || "").toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentElement: null,
      textContent: "",
      style: { cssText: "" },
      attributes: {},
      dataset: {},
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
      addEventListener(type, handler) {
        if (!nodeListeners.has(type)) nodeListeners.set(type, []);
        nodeListeners.get(type).push(handler);
      },
      removeEventListener(type, handler) {
        nodeListeners.set(type, (nodeListeners.get(type) || []).filter((entry) => entry !== handler));
      },
      dispatchEvent(event) {
        const type = String(event?.type || "");
        for (const handler of nodeListeners.get(type) || []) handler.call(this, event);
      },
      querySelectorAll(selector) {
        const all = [];
        const walk = (current) => {
          if (!current || typeof current !== "object") return;
          all.push(current);
          for (const child of Array.isArray(current.children) ? current.children : []) {
            walk(child);
          }
        };
        walk(this);
        const match = String(selector || "").match(/data-ui-v2-id=["']([^"']+)["']/);
        if (match) {
          return all.filter((node) => node?.getAttribute?.("data-ui-v2-id") === match[1]);
        }
        return [];
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
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

function collectTexts(node, acc = []) {
  if (!node || typeof node !== "object") return acc;
  const text = String(node.textContent || "").trim();
  if (text) acc.push(text);
  for (const child of Array.isArray(node.children) ? node.children : []) {
    collectTexts(child, acc);
  }
  return acc;
}

function getNodeById(root, id) {
  return collectNodes(root, (node) => node?.getAttribute?.("data-ui-v2-id") === id)[0] || null;
}

function findNodeByText(root, text, tagName = null) {
  return collectNodes(root, (node) => {
    if (tagName && String(node.tagName || "") !== String(tagName).toUpperCase()) return false;
    return String(node.textContent || "").trim() === text;
  })[0] || null;
}

function setRect(node, rect) {
  node._rect = { ...rect };
  return node;
}

async function runEditorV2PanelTests(run) {
  const panelPath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/EditorV2Panel.js");
  const corePath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Core.js");
  const screenPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/EditorLabScreen.js");
  const registryPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/editorLabRegistry.js");

  const panelSource = fs.readFileSync(panelPath, "utf8");
  const coreSource = fs.readFileSync(corePath, "utf8");
  assert.equal(panelSource.includes("restarbeiten"), false);
  assert.equal(panelSource.includes("protokoll"), false);
  assert.equal(panelSource.includes("uiInspector"), false);
  assert.equal(coreSource.includes("restarbeiten"), false);
  assert.equal(coreSource.includes("protokoll"), false);
  assert.equal(coreSource.includes("uiInspector"), false);

  const { createEditorV2Panel } = await importEsmFromFile(panelPath);
  const { createEditorV2Core } = await importEsmFromFile(corePath);
  const { createEditorLabScreen } = await importEsmFromFile(screenPath);
  const { createEditorLabRegistry } = await importEsmFromFile(registryPath);

  assert.equal(typeof createEditorV2Panel, "function");

  const stubCalls = [];
  const stubCore = {
    mode: "frame",
    hoverTargetId: "hover.alpha",
    selectedTargetId: "selected.alpha",
    setMode(mode) {
      stubCalls.push(["setMode", mode]);
      this.mode = mode;
      return mode;
    },
    getMode() {
      return this.mode;
    },
    getHoverTargetId() {
      return this.hoverTargetId;
    },
    getSelectedTargetId() {
      return this.selectedTargetId;
    },
    moveSelected(dx, dy) {
      stubCalls.push(["moveSelected", dx, dy]);
      return true;
    },
    resizeSelected(dw, dh) {
      stubCalls.push(["resizeSelected", dw, dh]);
      return true;
    },
    resetSelectedPreview() {
      stubCalls.push(["resetSelectedPreview"]);
      return true;
    },
    resetAllPreview() {
      stubCalls.push(["resetAllPreview"]);
      return true;
    },
  };

  const doc = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = doc;
  let panel = null;

  try {
    panel = createEditorV2Panel({ core: stubCore });
    const panelRoot = panel.render(doc.body);
    assert.ok(panelRoot);
    assert.equal(panelRoot.getAttribute("data-ui-v2-id"), "editorv2.panel");

    const panelTexts = collectTexts(panelRoot);
    assert.equal(panelTexts.includes("Editor V2"), true);
    assert.equal(panelTexts.includes("Rahmen"), true);
    assert.equal(panelTexts.includes("Feld"), true);
    assert.equal(panelTexts.includes("Control"), true);
    assert.equal(panelTexts.includes("Hover-Ziel"), true);
    assert.equal(panelTexts.includes("Ausgewähltes Ziel"), true);
    assert.equal(panelTexts.includes("\u2190"), true);
    assert.equal(panelTexts.includes("Breite +"), true);
    assert.equal(panelTexts.includes("Auswahl zurücksetzen"), true);
    assert.equal(panelTexts.includes("Alles zurücksetzen"), true);
    assert.equal(findNodeByText(panelRoot, "Rahmen", "strong").textContent, "Rahmen");
    assert.equal(findNodeByText(panelRoot, "hover.alpha").textContent, "hover.alpha");
    assert.equal(findNodeByText(panelRoot, "selected.alpha").textContent, "selected.alpha");

    const clickButton = (label) => findNodeByText(panelRoot, label, "button").dispatchEvent({ type: "click" });
    clickButton("Feld");
    clickButton("Control");
    clickButton("Rahmen");
    clickButton("\u2190");
    clickButton("→");
    clickButton("↑");
    clickButton("↓");
    clickButton("Breite -");
    clickButton("Breite +");
    clickButton("Höhe -");
    clickButton("Höhe +");
    clickButton("Auswahl zurücksetzen");
    clickButton("Alles zurücksetzen");

    assert.deepEqual(stubCalls, [
      ["setMode", "field"],
      ["setMode", "control"],
      ["setMode", "frame"],
      ["moveSelected", -2, 0],
      ["moveSelected", 2, 0],
      ["moveSelected", 0, -2],
      ["moveSelected", 0, 2],
      ["resizeSelected", -2, 0],
      ["resizeSelected", 2, 0],
      ["resizeSelected", 0, -2],
      ["resizeSelected", 0, 2],
      ["resetSelectedPreview"],
      ["resetAllPreview"],
    ]);

    assert.equal(typeof panel.save, "undefined");
    assert.equal(typeof panel.persist, "undefined");
    assert.equal(typeof panel.overnehmen, "undefined");
    assert.equal(typeof panel.speichern, "undefined");
    assert.equal(typeof panel.commit, "undefined");

    stubCore.hoverTargetId = "hover.beta";
    stubCore.selectedTargetId = "selected.beta";
    panel.refresh();
    assert.equal(findNodeByText(panelRoot, "hover.beta").textContent, "hover.beta");
    assert.equal(findNodeByText(panelRoot, "selected.beta").textContent, "selected.beta");

    const registry = createEditorLabRegistry();
    const core = createEditorV2Core({ registry, mode: "frame" });
    const screen = createEditorLabScreen({ registry, editorV2Core: core });
    const root = screen.render(doc.body);
    assert.ok(root);
    assert.ok(screen.getPanelNode());
    assert.equal(doc.body.children.some((node) => node?.getAttribute?.("data-ui-v2-id") === "editorv2.panel"), true);

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
    }

    core.mount(root);
    const integratedPanel = screen.getPanelNode();
    assert.ok(integratedPanel);
    assert.equal(typeof screen.panel.refresh, "function");
  } finally {
    globalThis.document = previousDocument;
    panel?.unmount?.();
  }

  const diffFiles = execFileSync("git", ["diff", "--name-only"], { cwd: path.join(__dirname, "../.."), encoding: "utf8" })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
  assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);

  await run("Editor V2 Panel verbindet Bedienelemente und EditorLab", () => undefined);
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

  runEditorV2PanelTests(run).then(() => {
    if (!process.exitCode) console.log("editorV2Panel.test.cjs passed");
  });
}

module.exports = { runEditorV2PanelTests };
