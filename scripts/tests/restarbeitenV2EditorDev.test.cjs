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
      _rect: { left: 0, top: 0, width: 160, height: 40 },
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
        if (item && typeof item === "object") item.parentElement = null;
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
      getBoundingClientRect() {
        return { ...this._rect };
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
        const match = String(selector || "").match(/data-ui-v2-id\s*=\s*["']([^"']+)["']/);
        const expectedId = match ? match[1] : null;
        const walk = (node) => {
          if (!node || typeof node !== "object") return;
          if (expectedId && node?.getAttribute?.("data-ui-v2-id") === expectedId) result.push(node);
          for (const child of Array.isArray(node.children) ? node.children : []) walk(child);
        };
        walk(this);
        return result;
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
      },
    };
  }

  const document = {
    activeElement: null,
    body: null,
    defaultView: null,
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

function getNodesByAttr(root, name, value) {
  return collectNodes(root, (node) => node?.getAttribute?.(name) === value);
}

function findButton(root, label) {
  return collectNodes(root, (node) => node?.tagName === "BUTTON" && String(node.textContent || "").includes(label))[0] || null;
}

async function runRestarbeitenV2EditorDevTests(run) {
  const routerPath = path.join(__dirname, "../../src/renderer/app/Router.js");
  const screenPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/RestarbeitenV2Screen.js");
  const registryPath = path.join(__dirname, "../../src/renderer/modules/restarbeitenV2/restarbeitenV2Registry.js");
  const editorCorePath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/editorV2Core.js");
  const panelPath = path.join(__dirname, "../../src/renderer/uiV2/editorV2/EditorV2Panel.js");
  const headerPath = path.join(__dirname, "../../src/renderer/ui/MainHeader.js");

  const routerSource = fs.readFileSync(routerPath, "utf8");
  const screenSource = fs.readFileSync(screenPath, "utf8");
  assert.equal(routerSource.includes("showRestarbeitenV2Dev"), true);
  assert.equal(routerSource.includes("createEditorV2Core({ registry, mode: \"frame\" })"), true);
  assert.equal(routerSource.includes("createRestarbeitenV2Screen({ registry, editorV2Core: core })"), true);
  assert.equal(screenSource.includes("createEditorV2Panel"), true);
  assert.equal(screenSource.includes("ipc"), false);
  assert.equal(screenSource.includes("db"), false);
  assert.equal(screenSource.includes("localStorage"), false);

  const [
    { default: Router },
    { default: MainHeader },
    { createRestarbeitenV2Screen },
    { createRestarbeitenV2Registry },
    { createEditorV2Core },
    { createEditorV2Panel },
  ] = await Promise.all([
    importEsmFromFile(routerPath),
    importEsmFromFile(headerPath),
    importEsmFromFile(screenPath),
    importEsmFromFile(registryPath),
    importEsmFromFile(editorCorePath),
    importEsmFromFile(panelPath),
  ]);

  const document = createFakeDocument();
  const fakeWindow = {
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
  document.defaultView = fakeWindow;

  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const previousAlert = globalThis.alert;
  globalThis.document = document;
  globalThis.window = fakeWindow;
  globalThis.alert = () => {};

  try {
    const router = new Router({ contentRoot: document.body });
    router.context.settings = {};
    router.currentProjectId = null;
    router.currentMeetingId = null;
    router._ensureProjectContextQuicklane = async () => ({ setContext() {}, setEnabled() {} });

    const header = new MainHeader({ router, version: "1.0.0" });
    header.render();
    header.refresh();
    const devButton = findButton(header.root, "Restarbeiten V2");
    assert.ok(devButton);
    assert.equal(devButton.disabled, false);

    await router.showRestarbeitenV2Dev();
    assert.equal(router.currentProjectId, null);
    assert.equal(router.currentMeetingId, null);
    assert.equal(router.activeSection, "restarbeitenV2Dev");
    assert.equal(router.context?.ui?.pageTitle, "Restarbeiten V2 DEV");

    const host = getNodesByAttr(document.body, "data-ui-v2-restarbeiten-host", "true")[0];
    assert.ok(host);
    assert.ok(getNodeById(host, "restarbeitenV2.root"));
    assert.ok(getNodeById(host, "editorv2.panel"));

    const registry = createRestarbeitenV2Registry();
    const core = createEditorV2Core({ registry, mode: "frame" });
    const screen = createRestarbeitenV2Screen({ registry, editorV2Core: core });
    const testHost = document.createElement("div");
    document.body.append(testHost);
    const root = screen.render(testHost);
    assert.ok(root);
    const panelRoot = getNodeById(testHost, "editorv2.panel");
    assert.ok(panelRoot);
    assert.ok(findButton(panelRoot, "Rahmen"));
    assert.equal(core.getMode(), "frame");

    const frameTarget = getNodeById(root, "restarbeitenV2.main");
    const fieldTarget = getNodeById(root, "restarbeitenV2.main.textbereich");
    const controlTarget = getNodeById(root, "restarbeitenV2.quicklane.neu");
    assert.ok(frameTarget);
    assert.ok(fieldTarget);
    assert.ok(controlTarget);

    frameTarget._rect = { left: 30, top: 40, width: 220, height: 80 };
    fieldTarget._rect = { left: 70, top: 160, width: 180, height: 34 };
    controlTarget._rect = { left: 300, top: 90, width: 110, height: 32 };

    core.handlePointerMove({ target: frameTarget });
    core.handlePointerSelect({ target: frameTarget });
    assert.equal(core.getHoverTargetId(), "restarbeitenV2.main");
    assert.equal(core.getSelectedTargetId(), "restarbeitenV2.main");
    assert.equal(getNodesByAttr(document.body, "data-ui-editor-v2-selected-frame", "true").length, 1);
    assert.equal(getNodesByAttr(document.body, "data-ui-editor-v2-hover-frame", "true").length <= 1, true);

    const modeFieldBtn = findButton(panelRoot, "Feld");
    const modeControlBtn = findButton(panelRoot, "Control");
    const modeFrameBtn = findButton(panelRoot, "Rahmen");
    const moveRightBtn = findButton(panelRoot, "→") || findButton(panelRoot, "â†’");
    const growWidthBtn = findButton(panelRoot, "Breite +");
    const growHeightBtn = findButton(panelRoot, "Höhe +") || findButton(panelRoot, "HÃ¶he +");
    const resetSelectedBtn = findButton(panelRoot, "Auswahl zurücksetzen") || findButton(panelRoot, "Auswahl zurÃ¼cksetzen");
    const resetAllBtn = findButton(panelRoot, "Alles zurücksetzen") || findButton(panelRoot, "Alles zurÃ¼cksetzen");
    assert.ok(modeFieldBtn);
    assert.ok(modeControlBtn);
    assert.ok(modeFrameBtn);
    assert.ok(moveRightBtn);
    assert.ok(growWidthBtn);
    assert.ok(growHeightBtn);
    assert.ok(resetSelectedBtn);
    assert.ok(resetAllBtn);

    modeFieldBtn.dispatchEvent({ type: "click", preventDefault() {}, stopPropagation() {}, target: modeFieldBtn });
    assert.equal(core.getMode(), "field");
    core.handlePointerMove({ target: fieldTarget });
    core.handlePointerSelect({ target: fieldTarget });
    assert.equal(core.getSelectedTargetId(), "restarbeitenV2.main.textbereich");
    const fieldBefore = String(fieldTarget.style.cssText || "");
    moveRightBtn.dispatchEvent({ type: "click", preventDefault() {}, stopPropagation() {}, target: moveRightBtn });
    growWidthBtn.dispatchEvent({ type: "click", preventDefault() {}, stopPropagation() {}, target: growWidthBtn });
    growHeightBtn.dispatchEvent({ type: "click", preventDefault() {}, stopPropagation() {}, target: growHeightBtn });
    assert.equal(core.getSelectedTargetId(), "restarbeitenV2.main.textbereich");
    assert.equal(String(fieldTarget.style.cssText || "").includes("translate"), true);
    assert.equal(String(fieldTarget.style.cssText || "").includes("width:"), true);
    assert.equal(String(fieldTarget.style.cssText || "").includes("height:"), true);
    assert.notEqual(String(fieldTarget.style.cssText || ""), fieldBefore);

    resetSelectedBtn.dispatchEvent({ type: "click", preventDefault() {}, stopPropagation() {}, target: resetSelectedBtn });
    assert.equal(String(fieldTarget.style.cssText || ""), fieldBefore);
    assert.equal(core.getSelectedTargetId(), "restarbeitenV2.main.textbereich");
    assert.equal(getNodesByAttr(document.body, "data-ui-editor-v2-selected-frame", "true").length, 1);

    modeControlBtn.dispatchEvent({ type: "click", preventDefault() {}, stopPropagation() {}, target: modeControlBtn });
    assert.equal(core.getMode(), "control");
    core.handlePointerMove({ target: controlTarget });
    core.handlePointerSelect({ target: controlTarget });
    assert.equal(core.getSelectedTargetId(), "restarbeitenV2.quicklane.neu");
    moveRightBtn.dispatchEvent({ type: "click", preventDefault() {}, stopPropagation() {}, target: moveRightBtn });
    assert.equal(String(controlTarget.style.cssText || "").includes("translate"), true);

    resetAllBtn.dispatchEvent({ type: "click", preventDefault() {}, stopPropagation() {}, target: resetAllBtn });
    assert.equal(String(controlTarget.style.cssText || "").includes("translate"), false);
    assert.equal(String(controlTarget.style.cssText || "").includes("width:"), false);
    assert.equal(String(controlTarget.style.cssText || "").includes("height:"), false);
    assert.equal(core.getSelectedTargetId(), "restarbeitenV2.quicklane.neu");
    assert.equal(getNodesByAttr(document.body, "data-ui-editor-v2-selected-frame", "true").length, 1);

    const diffFiles = execFileSync("git", ["diff", "--name-only"], {
      cwd: path.join(__dirname, "../.."),
      encoding: "utf8",
    })
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/restarbeiten/")), false);
    assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/modules/protokoll/")), false);
    assert.equal(diffFiles.some((file) => file.startsWith("src/renderer/uiInspector/")), false);
  } finally {
    globalThis.document = previousDocument;
    globalThis.window = previousWindow;
    globalThis.alert = previousAlert;
  }

  await run("Restarbeiten V2 DEV verbindet Editor V2 mit der Registry und dem Panel", () => undefined);
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

  runRestarbeitenV2EditorDevTests(run).then(() => {
    if (!process.exitCode) console.log("restarbeitenV2EditorDev.test.cjs passed");
  });
}

module.exports = { runRestarbeitenV2EditorDevTests };
