const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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
      style: {},
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
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
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

function maxDepth(node, depth = 1) {
  if (!node || typeof node !== "object") return depth;
  const children = Array.isArray(node.children) ? node.children : [];
  if (children.length === 0) return depth;
  return Math.max(depth, ...children.map((child) => maxDepth(child, depth + 1)));
}

async function runEditorLabV2Tests(run) {
  const screenPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/EditorLabScreen.js");
  const registryPath = path.join(__dirname, "../../src/renderer/uiV2/editorLab/editorLabRegistry.js");

  const screenSource = fs.readFileSync(screenPath, "utf8");
  const registrySource = fs.readFileSync(registryPath, "utf8");

  assert.equal(screenSource.includes("restarbeiten"), false);
  assert.equal(screenSource.includes("protokoll"), false);
  assert.equal(registrySource.includes("restarbeiten"), false);
  assert.equal(registrySource.includes("protokoll"), false);

  const { createEditorLabScreen } = await importEsmFromFile(screenPath);
  const { createEditorLabRegistry } = await importEsmFromFile(registryPath);

  assert.equal(typeof createEditorLabScreen, "function");
  assert.equal(typeof createEditorLabRegistry, "function");

  const registry = createEditorLabRegistry();
  assert.equal(Array.isArray(registry), true);
  assert.equal(registry.some((entry) => entry.kind === "frame"), true);
  assert.equal(registry.some((entry) => entry.kind === "field"), true);
  assert.equal(registry.some((entry) => entry.kind === "control"), true);

  for (const entry of registry) {
    assert.equal(Boolean(entry.id), true, `missing id for ${entry.label}`);
    assert.equal(Boolean(entry.label), true, `missing label for ${entry.id}`);
    assert.equal(Boolean(entry.kind), true, `missing kind for ${entry.id}`);
    assert.equal(Boolean(entry.editable === true || entry.editable === false), true, `missing editable for ${entry.id}`);
    assert.equal(Array.isArray(entry.ops), true, `missing ops for ${entry.id}`);
    if (entry.id !== "editorlab.root") {
      assert.equal(Boolean(entry.parentId), true, `missing parentId for ${entry.id}`);
    }
  }

  const ids = new Set(registry.map((entry) => entry.id));
  for (const entry of registry) {
    if (entry.parentId) {
      assert.equal(ids.has(entry.parentId), true, `parentId does not reference a known entry: ${entry.parentId}`);
    }
  }

  const document = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = document;
  try {
    const screen = createEditorLabScreen({ registry });
    const root = screen.render(document.body);

    assert.ok(root);
    assert.equal(root.getAttribute("data-ui-v2-id"), "editorlab.root");

    const text = collectNodes(root, (node) => typeof node.textContent === "string" && node.textContent.trim()).map(
      (node) => String(node.textContent || "").trim()
    );

    assert.equal(text.includes("Header / Titel"), true);
    assert.equal(text.includes("Suche / Filter"), true);
    assert.equal(text.includes("Status / Hinweis"), true);
    assert.equal(text.includes("Neu"), true);
    assert.equal(text.includes("Speichern"), true);
    assert.equal(text.includes("Ansicht"), true);
    assert.equal(text.includes("Button D2"), true);

    const allRegistryNodes = collectNodes(root, (node) => typeof node.getAttribute === "function" && node.getAttribute("data-ui-v2-id"));
    assert.equal(allRegistryNodes.length, registry.length);

    for (const entry of registry) {
      const node = allRegistryNodes.find((item) => item.getAttribute("data-ui-v2-id") === entry.id);
      assert.ok(node, `missing DOM node for ${entry.id}`);
      assert.equal(node.getAttribute("data-ui-v2-kind"), entry.kind);
      assert.equal(node.getAttribute("data-ui-v2-label"), entry.label);
      assert.equal(node.getAttribute("data-ui-v2-editable"), entry.editable ? "true" : "false");
      assert.equal(node.getAttribute("data-ui-v2-ops"), entry.ops.join(","));
      if (entry.parentId) {
        assert.equal(node.getAttribute("data-ui-v2-parent"), entry.parentId);
      } else {
        assert.equal(node.getAttribute("data-ui-v2-parent"), null);
      }
    }

    assert.equal(root.children[0].getAttribute("data-ui-v2-id"), "editorlab.header");
    assert.equal(root.children[1].getAttribute("data-ui-v2-id"), "editorlab.main");
    assert.equal(root.children[2].getAttribute("data-ui-v2-id"), "editorlab.quicklane");
    assert.equal(root.children[3].getAttribute("data-ui-v2-id"), "editorlab.footer");
    assert.equal(maxDepth(root) <= 4, true, "EditorLab exceeds maximum UI depth");
  } finally {
    globalThis.document = previousDocument;
  }

  await run("EditorLab V2: Screen, Registry und DOM-Struktur sind vorhanden", () => undefined);
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

  runEditorLabV2Tests(run).then(() => {
    if (!process.exitCode) console.log("editorLabV2.test.cjs passed");
  });
}

module.exports = { runEditorLabV2Tests };
