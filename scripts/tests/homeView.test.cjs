"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

function read(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.textContent = "";
    this.innerHTML = "";
    this.listeners = new Map();
    this.disabled = false;
    this.tabIndex = 0;
    this.type = "";
  }

  get isConnected() {
    let node = this;
    while (node) {
      if (node === global.document?.body) return true;
      node = node.parentElement;
    }
    return false;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith("data-")) {
      const key = name
        .slice(5)
        .replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
      this.dataset[key] = String(value);
    }
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  appendChild(child) {
    if (!child) return child;
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  append(...children) {
    for (const child of children) this.appendChild(child);
  }

  addEventListener(type, listener) {
    const list = this.listeners.get(type) || [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  async dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) {
      await listener({ target: this, preventDefault() {}, ...event });
    }
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }

  replaceWith(replacement) {
    if (!this.parentElement) return;
    const index = this.parentElement.children.indexOf(this);
    if (index < 0) return;
    replacement.parentElement = this.parentElement;
    this.parentElement.children[index] = replacement;
    this.parentElement = null;
  }

  cloneNode(deep = false) {
    const clone = new FakeElement(this.tagName);
    clone.attributes = { ...this.attributes };
    clone.dataset = { ...this.dataset };
    clone.style = { ...this.style };
    clone.textContent = this.textContent;
    clone.innerHTML = this.innerHTML;
    clone.disabled = this.disabled;
    clone.tabIndex = this.tabIndex;
    clone.type = this.type;
    if (deep) {
      for (const child of this.children) clone.append(child.cloneNode(true));
    }
    return clone;
  }

  _matches(selector) {
    const attributeMatch = selector.match(/^\[([a-z0-9-]+)(?:="([^"]*)")?\]$/i);
    if (attributeMatch) {
      const actual = this.getAttribute(attributeMatch[1]);
      return attributeMatch[2] === undefined ? actual !== null : actual === attributeMatch[2];
    }
    return this.tagName === selector.toUpperCase();
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (child._matches(selector)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function createDom({ channel = "PROD" } = {}) {
  const body = new FakeElement("body");
  const storageWrites = [];
  const document = {
    body,
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    querySelector(selector) {
      if (body._matches(selector)) return body;
      return body.querySelector(selector);
    },
  };
  const window = {
    bbmDb: {
      async appGetBuildChannel() {
        return { ok: true, channel };
      },
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem(key, value) {
        storageWrites.push({ key, value });
      },
    },
    alert() {},
  };
  return { document, window, storageWrites };
}

async function withDom(options, callback) {
  const previousDocument = global.document;
  const previousWindow = global.window;
  const dom = createDom(options);
  global.document = dom.document;
  global.window = dom.window;
  try {
    return await callback(dom);
  } finally {
    global.document = previousDocument;
    global.window = previousWindow;
  }
}

function moduleIds(root) {
  return root
    .querySelectorAll("[data-bbm-home-module]")
    .map((element) => element.getAttribute("data-bbm-home-module"));
}

function allOwnText(root) {
  const values = [];
  const visit = (node) => {
    if (node.textContent) values.push(node.textContent);
    for (const child of node.children) visit(child);
  };
  visit(root);
  return values;
}

function flushAsyncRender() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function runHomeViewTests(run) {
  const homeViewSource = read("src/renderer/views/HomeView.js");
  const { default: HomeView } = await importEsmFromFile(
    path.join(process.cwd(), "src/renderer/views/HomeView.js")
  );

  await run("HomeView: Dashboard rendert verfügbare Module und alle drei Informationsbereiche", async () => {
    await withDom({ channel: "PROD" }, async ({ document }) => {
      const view = new HomeView({ router: {} });
      const root = view.render();
      document.body.append(root);
      await flushAsyncRender();

      const ids = moduleIds(root);
      assert.equal(root.getAttribute("data-bbm-home-dashboard"), "true");
      assert.ok(ids.includes("protokoll"), ids.join(","));
      assert.ok(ids.includes("restarbeiten"), ids.join(","));
      assert.ok(ids.includes("rechnung"), ids.join(","));
      assert.equal(ids.includes("sigeko"), false);
      assert.equal(ids.includes("dev-ui-editor"), false);

      const texts = allOwnText(root);
      assert.ok(texts.includes("Zuletzt verwendet"));
      assert.ok(texts.includes("Schnellaktionen"));
      assert.ok(texts.includes("Hinweise"));
    });
  });

  await run("HomeView: SiGeKo und UI-Editor erscheinen ausschließlich im DEV-Modus", async () => {
    await withDom({ channel: "DEV" }, async ({ document }) => {
      const view = new HomeView({ router: {} });
      const root = view.render();
      document.body.append(root);
      await flushAsyncRender();

      const ids = moduleIds(root);
      assert.ok(ids.includes("sigeko"), ids.join(","));
      assert.ok(ids.includes("dev-ui-editor"), ids.join(","));
      assert.equal(ids.filter((id) => id === "rechnung").length, 1);
    });

    await withDom({ channel: "PROD" }, async ({ document }) => {
      const view = new HomeView({ router: {} });
      const root = view.render();
      document.body.append(root);
      await flushAsyncRender();

      const ids = moduleIds(root);
      assert.equal(ids.includes("sigeko"), false);
      assert.equal(ids.includes("dev-ui-editor"), false);
    });
  });

  await run("HomeView: globale Rechnungsnavigation verwendet weiterhin openGlobalModule", async () => {
    const calls = [];
    const view = new HomeView({
      router: {
        async openGlobalModule(moduleId, options) {
          calls.push({ type: "global", moduleId, options });
          return true;
        },
        async showProjects() {
          calls.push({ type: "projects" });
        },
      },
    });

    await view._openModule({
      moduleId: "rechnung",
      navigation: { global: [{ key: "rechnungen" }] },
    });

    assert.deepEqual(calls, [
      {
        type: "global",
        moduleId: "rechnung",
        options: { navigationKey: "rechnungen", source: "home" },
      },
    ]);
  });

  await run("HomeView: Projektmodule öffnen die gemeinsame Projektübersicht im passenden Modulkontext", async () => {
    await withDom({ channel: "PROD" }, async ({ storageWrites }) => {
      const calls = [];
      const view = new HomeView({
        router: {
          async ensureActiveModuleAccess(options) {
            calls.push({ type: "ensure", options });
          },
          async showProjects(options) {
            calls.push({ type: "projects", options });
          },
        },
      });

      await view._openModule({ moduleId: "restarbeiten" });

      assert.deepEqual(calls, [
        { type: "ensure", options: { force: true } },
        { type: "projects", options: { moduleContext: "restarbeiten", source: "home" } },
      ]);
      assert.deepEqual(storageWrites, []);
      assert.equal(homeViewSource.includes("bbm.startTargetModuleId"), false);
    });
  });

  await run("HomeView: letzter Projektstart fragt zuerst den Modulstatus ab", async () => {
    const calls = [];
    const view = new HomeView({
      router: {
        async ensureActiveModuleAccess(options) {
          calls.push({ type: "ensure", options });
        },
        async showProjects() {
          calls.push({ type: "showProjects" });
        },
        currentView: {
          async openProjectById(projectId) {
            calls.push({ type: "open", projectId });
            return false;
          },
        },
      },
    });
    view.lastProjectId = "17";
    view._loadLastProjectTile = async () => {
      calls.push({ type: "reload" });
    };

    await view._openLastProject();

    assert.deepEqual(calls, [
      { type: "ensure", options: { force: true } },
      { type: "showProjects" },
      { type: "open", projectId: "17" },
      { type: "reload" },
    ]);
  });

  await run("HomeView: Modulquelle und Editorgrenze bleiben unverändert angebunden", () => {
    assert.match(homeViewSource, /getCachedActiveModuleCatalog/);
    assert.match(homeViewSource, /router\.openGlobalModule/);
    assert.doesNotMatch(homeViewSource, /data-ui-inspector-id|data-ui-editor-kind|data-ui-editor-ops/);
    assert.doesNotMatch(homeViewSource, /bbm\.devEditorTargetModuleId/);
  });
}

module.exports = { runHomeViewTests };
