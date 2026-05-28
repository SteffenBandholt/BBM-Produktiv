const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
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
      style: {
        cssText: "",
        setProperty(name, value) {
          this[String(name)] = String(value);
        },
      },
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
      appendChild(item) {
        this.append(item);
        return item;
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
      remove() {
        if (this.parentElement?.removeChild) {
          this.parentElement.removeChild(this);
        }
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
      },
      removeAttribute(name) {
        delete this.attributes[name];
      },
      addEventListener(type, handler) {
        if (!nodeListeners.has(type)) nodeListeners.set(type, []);
        nodeListeners.get(type).push(handler);
      },
      removeEventListener(type, handler) {
        nodeListeners.set(type, (nodeListeners.get(type) || []).filter((entry) => entry !== handler));
      },
      dispatchEvent(eventInput) {
        const event = typeof eventInput === "string" ? { type: eventInput } : (eventInput || {});
        const type = String(event.type || "");
        event.target = event.target || this;
        for (const handler of nodeListeners.get(type) || []) handler.call(this, event);
        if (this.parentElement?.dispatchEvent && !event._stopped) {
          return this.parentElement.dispatchEvent(event);
        }
        return event;
      },
      querySelectorAll(selector) {
        const result = [];
        const match = String(selector || "").match(/data-ui-v2-id=["']([^"']+)["']/);
        const expectedId = match ? match[1] : null;
        const walk = (node) => {
          if (!node || typeof node !== "object") return;
          if (expectedId && node?.getAttribute?.("data-ui-v2-id") === expectedId) result.push(node);
          for (const child of Array.isArray(node.children) ? node.children : []) {
            walk(child);
          }
        };
        walk(this);
        return result;
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
      },
      contains(target) {
        if (target === this) return true;
        for (const child of Array.isArray(this.children) ? this.children : []) {
          if (child === target) return true;
          if (typeof child.contains === "function" && child.contains(target)) return true;
        }
        return false;
      },
    };
  }

  const document = {
    activeElement: null,
    body: null,
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

function getNodeByAttr(root, name, value) {
  return collectNodes(root, (node) => node?.getAttribute?.(name) === value)[0] || null;
}

async function runEditorLabV2AccessTests(run) {
  const routerPath = path.join(__dirname, "../../src/renderer/app/Router.js");
  const headerPath = path.join(__dirname, "../../src/renderer/ui/MainHeader.js");
  const moduleNavPath = path.join(__dirname, "../../src/renderer/app/modules/moduleNavigation.js");
  const routerSource = fs.readFileSync(routerPath, "utf8");
  const headerSource = fs.readFileSync(headerPath, "utf8");

  assert.equal(routerSource.includes("showEditorLabV2"), true);
  assert.equal(headerSource.includes("EditorLab V2"), true);
  assert.equal(headerSource.includes("showEditorLabV2"), true);
  assert.equal(headerSource.includes("uiInspector"), true);

  const [{ default: Router }, { default: MainHeader }, { getActiveProjectModuleNavigation }] = await Promise.all([
    importEsmFromFile(routerPath),
    importEsmFromFile(headerPath),
    importEsmFromFile(moduleNavPath),
  ]);

  assert.equal(
    getActiveProjectModuleNavigation().some((entry) => String(entry?.moduleId || "").trim() === "editorlabv2"),
    false
  );

  const document = createFakeDocument();
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  globalThis.document = document;
  globalThis.window = {
    localStorage: {
      getItem(key) {
        return key === "bbm.uiMode" ? "new" : null;
      },
      setItem() {},
      removeItem() {},
    },
    getComputedStyle(node) {
      return node?.style || {};
    },
    innerWidth: 1600,
    innerHeight: 1200,
    addEventListener() {},
    removeEventListener() {},
    bbmDb: {},
  };

  const contentRoot = document.body;
  let router = null;
  let header = null;

  try {
    router = new Router({ contentRoot });
    router._ensureProjectContextQuicklane = async () => ({ setContext() {}, setEnabled() {} });
    router.context.settings = {};
    router.currentProjectId = null;
    router.currentMeetingId = null;

    header = new MainHeader({ router, version: "1.0.0" });
    header.render();
    header.refresh();

    const button = getNodeById(header.root, "editorlabv2.button") || collectNodes(header.root, (node) => node?.tagName === "BUTTON" && node?.textContent === "EditorLab V2")[0];
    assert.ok(button);
    assert.equal(button.disabled, false);

    await router.showEditorLabV2();
    assert.equal(router.currentProjectId, null);
    assert.equal(router.currentMeetingId, null);
    assert.equal(router.activeSection, "editorLabV2");
    const editorLabHost = getNodeByAttr(contentRoot, "data-ui-v2-editorlab-host", "true");
    assert.ok(editorLabHost);
    const editorLabRoot = getNodeById(editorLabHost, "editorlab.root");
    const panelRoot = getNodeById(editorLabHost, "editorv2.panel");
    assert.ok(editorLabRoot);
    assert.ok(panelRoot);
    assert.equal(getNodeById(editorLabHost, "editorlab.main.groupA.fieldA1").getAttribute("data-ui-v2-kind"), "field");
    assert.equal(getNodeById(editorLabHost, "editorlab.quicklane.lock").getAttribute("data-ui-v2-kind"), "control");
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
    router = null;
    header = null;
  }

  await run("EditorLab V2 ist als DEV-Testzugang sichtbar", () => undefined);
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

  runEditorLabV2AccessTests(run).then(() => {
    if (!process.exitCode) console.log("editorLabV2Access.test.cjs passed");
  });
}

module.exports = { runEditorLabV2AccessTests };
