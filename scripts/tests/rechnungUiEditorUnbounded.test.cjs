"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createUiScopeFingerprint, loadTargetStartupLayout } = require("ui-editor-kit");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const ROOT = path.resolve(__dirname, "../..");
const SCOPE_ID = "rechnung.screen";
const BOUND_KEYS = Object.freeze(["minX", "maxX", "minY", "maxY", "minWidth", "maxWidth", "minHeight", "maxHeight"]);
const REQUIRED_OPS = Object.freeze(["move", "resizeWidth", "resizeHeight"]);

function numericStyle(style, key, fallback) {
  const value = Number.parseFloat(style[key]);
  return Number.isFinite(value) ? value : fallback;
}

class FakeElement {
  constructor(tagName = "DIV", width = 100, height = 24) {
    this.tagName = String(tagName).toUpperCase();
    this.nodeName = this.tagName;
    this.attributes = {};
    this.dataset = {};
    this.className = "";
    this.parentElement = null;
    this.children = [];
    this.isConnected = true;
    this.hidden = false;
    this.textContent = "";
    this.value = "";
    this._rect = { left: 0, top: 0, width, height };
    this.style = {
      setProperty(name, value) { this[name] = String(value); },
      getPropertyValue(name) { return this[name] || ""; },
      removeProperty(name) { delete this[name]; },
    };
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      toggle: (name, active) => {
        const names = new Set(this.className.split(/\s+/).filter(Boolean));
        if (active) names.add(name); else names.delete(name);
        this.className = [...names].join(" ");
      },
    };
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase())] = String(value);
  }
  getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
  addEventListener() {}
  removeEventListener() {}
  append(...children) { children.forEach((child) => { child.parentElement = this; this.children.push(child); }); }
  appendChild(child) { this.append(child); return child; }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  contains(candidate) { return candidate === this || this.children.some((child) => child.contains?.(candidate)); }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); this.isConnected = false; }
  getBoundingClientRect() {
    const width = numericStyle(this.style, "width", this._rect.width);
    const height = numericStyle(this.style, "height", this._rect.height);
    const [translateX = 0, translateY = 0] = String(this.style.translate || "0 0").split(/\s+/).map((value) => Number.parseFloat(value) || 0);
    const left = this._rect.left + translateX;
    const top = this._rect.top + translateY;
    return { left, top, width, height, right: left + width, bottom: top + height };
  }
}

function computedStyle(element) {
  const rect = element.getBoundingClientRect();
  return {
    ...element.style,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    paddingLeft: element.style.paddingLeft || "0px",
    paddingTop: element.style.paddingTop || "0px",
    fontSize: element.style.fontSize || "12px",
    boxSizing: "border-box",
    display: element.style.display || "block",
    visibility: element.style.visibility || "visible",
    flexDirection: element.style.flexDirection || "row",
  };
}

function flushAsyncWork() { return new Promise((resolve) => setImmediate(resolve)); }

function submit(host, elementId, operation, payload, changeId) {
  const response = host.handleM80EditorRequest({
    action: "submitChange",
    scopeId: SCOPE_ID,
    changeRequest: { changeId, elementId, operation, payload },
  });
  assert.equal(response.changeResult.success, true, `${elementId}/${operation}: ${response.changeResult.message}`);
  return response.changeResult.newState;
}

function profileDocument(scope, refs) {
  const explicitOperations = {};
  const elements = scope.elements.map((entry) => {
    const state = refs.snapshotM80State(entry.id);
    const operations = new Set(entry.allowedOps);
    explicitOperations[entry.id] = [...REQUIRED_OPS];
    const saved = { elementId: entry.id, scopeId: SCOPE_ID, visible: state.visible };
    if (operations.has("move")) { saved.x = state.x; saved.y = state.y; }
    if (operations.has("resize") || operations.has("resizeWidth")) saved.width = state.width;
    if (operations.has("resize") || operations.has("resizeHeight")) saved.height = state.height;
    if (operations.has("textMove")) { saved.textOffsetX = state.textOffsetX; saved.textOffsetY = state.textOffsetY; }
    if (operations.has("textResize")) saved.fontSize = state.fontSize;
    if (["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"].some((operation) => operations.has(operation))) saved.spacing = state.spacing;
    return saved;
  });
  return {
    schemaVersion: 2,
    applicationId: "bbm-produktiv",
    profileId: "standard",
    savedAt: "2026-08-24T12:00:00.000Z",
    scopes: [{
      scopeId: SCOPE_ID,
      registryFingerprint: createUiScopeFingerprint(scope),
      layoutState: { elements },
      explicitOperations,
    }],
  };
}

async function main() {
  const registry = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Registry.js"));
  const refs = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80Refs.js"));
  const host = await importEsmFromFile(path.join(ROOT, "src/renderer/ui-editor/m80HostAdapter.js"));
  const RechnungScreen = (await importEsmFromFile(path.join(ROOT, "src/renderer/modules/rechnungen/screens/RechnungScreen.js"))).default;
  const scope = registry.listM80RegistryScopes().find((entry) => entry.scopeId === SCOPE_ID);
  assert.ok(scope);
  assert.equal(scope.elements.length, 117);

  for (const entry of scope.elements) {
    REQUIRED_OPS.forEach((operation) => assert.ok(entry.allowedOps.includes(operation), `${entry.id}: ${operation}`));
    BOUND_KEYS.forEach((key) => assert.equal(Object.hasOwn(entry.baseline || {}, key), false, `${entry.id}: ${key}`));
    assert.equal(Object.hasOwn(entry.geometry || {}, "maximumStoredOffset"), false, `${entry.id}: maximumStoredOffset`);
    assert.equal(Object.hasOwn(entry.geometry || {}, "maximumOffset"), false, `${entry.id}: maximumOffset`);
  }

  const stylesheet = fs.readFileSync(path.join(ROOT, "src/renderer/modules/rechnungen/styles/rechnungenDesign.css"), "utf8");
  assert.doesNotMatch(stylesheet, /\.rechnung-sheet__intro textarea\s*\{[^}]*\b(?:min-height|max-height)\s*:/s);
  assert.doesNotMatch(stylesheet, /\.rechnung-live-position-editor\s*\{[^}]*minmax\((?:72|180)px/s);
  assert.doesNotMatch(stylesheet, /\.rechnung-screen__(?:header|sheet|edit)-canvas[^{}]*\{[^}]*max-width\s*:/s);
  assert.doesNotMatch(stylesheet, /\.rechnung-sheet__issuer-(?:address|meta)[^{}]*\{[^}]*(?:min-width\s*:\s*(?:210|270)px|max-width\s*:\s*100%)/s);

  const previous = { document: global.document, window: global.window, Element: global.Element, CustomEvent: global.CustomEvent };
  const body = new FakeElement("BODY", 1600, 900);
  global.Element = FakeElement;
  global.CustomEvent = class { constructor(type) { this.type = type; } };
  global.document = {
    body,
    head: new FakeElement("HEAD"),
    createElement: (tag) => new FakeElement(tag),
    querySelector: () => null,
    addEventListener() {},
    removeEventListener() {},
  };
  global.window = {
    innerWidth: 1600,
    innerHeight: 900,
    getComputedStyle: computedStyle,
    dispatchEvent() {},
    bbmDb: {
      rechnungList: async () => ({ ok: true, list: [] }),
      rechnungListCustomers: async () => ({ ok: true, list: [] }),
      rechnungListProjects: async () => ({ ok: true, list: [] }),
      userProfileGet: async () => ({ ok: true, profile: null }),
    },
  };

  const profileRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-rechnung-unbounded-"));
  try {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    body.appendChild(new RechnungScreen().render());
    await flushAsyncWork();
    assert.equal(refs.validateM83ComponentReferences(["bbm.rechnung.screen"]).ok, true);

    scope.elements.forEach((entry, index) => {
      const current = refs.snapshotM80State(entry.id);
      const negative = -2501 - index;
      const positive = 2501 + index;
      let state = refs.applyM80State(entry.id, { ...current, x: negative, y: negative }, "move");
      assert.equal(state.x, negative, `${entry.id}: x left`);
      assert.equal(state.y, negative, `${entry.id}: y up`);
      state = refs.applyM80State(entry.id, { ...state, x: positive, y: positive }, "move");
      assert.equal(state.x, positive, `${entry.id}: x right`);
      assert.equal(state.y, positive, `${entry.id}: y down`);
      state = refs.applyM80State(entry.id, { ...state, width: 0 }, "resizeWidth");
      state = refs.applyM80State(entry.id, { ...state, height: 0 }, "resizeHeight");
      assert.equal(state.width, 0, `${entry.id}: width zero`);
      assert.equal(state.height, 0, `${entry.id}: height zero`);
      const largeWidth = 3001 + index;
      const largeHeight = 2001 + index;
      state = refs.applyM80State(entry.id, { ...state, width: largeWidth }, "resizeWidth");
      state = refs.applyM80State(entry.id, { ...state, height: largeHeight }, "resizeHeight");
      assert.equal(state.width, largeWidth, `${entry.id}: width above old maximum`);
      assert.equal(state.height, largeHeight, `${entry.id}: height above old maximum`);
      const element = refs.getM80Ref(entry.id).element;
      assert.equal(element.style.minWidth || "", "", `${entry.id}: inline minWidth`);
      assert.equal(element.style.maxWidth || "", "", `${entry.id}: inline maxWidth`);
      assert.equal(element.style.minHeight || "", "", `${entry.id}: inline minHeight`);
      assert.equal(element.style.maxHeight || "", "", `${entry.id}: inline maxHeight`);
    });

    let state = submit(host, "rechnung.editor.positionShort", "move", { x: -2501, y: 2501 }, "rechnung-move-negative");
    assert.equal(state.x, -2501); assert.equal(state.y, 2501);
    state = submit(host, "rechnung.editor.positionShort", "move", { x: 2501, y: -2501 }, "rechnung-move-positive");
    assert.equal(state.x, 2501); assert.equal(state.y, -2501);
    state = submit(host, "rechnung.editor.positionShort", "resizeWidth", { width: 0 }, "rechnung-width-zero");
    assert.equal(state.width, 0);
    state = submit(host, "rechnung.editor.introText", "resizeHeight", { height: 10 }, "rechnung-intro-low");
    assert.equal(state.height, 10);
    state = submit(host, "rechnung.editor.positionLong", "resizeHeight", { height: 800 }, "rechnung-long-high");
    assert.equal(state.height, 800);

    const savedDocument = profileDocument(scope, refs);
    fs.writeFileSync(path.join(profileRoot, "standard.layout-profile.json"), JSON.stringify(savedDocument), "utf8");
    const loaded = loadTargetStartupLayout({ profileRoot, applicationId: "bbm-produktiv", activeScopes: [SCOPE_ID], registryScopes: [scope] });
    assert.equal(loaded.ok, true, JSON.stringify(loaded));
    assert.equal(loaded.found, true);
    const loadedScope = loaded.scopes.find((entry) => entry.scopeId === SCOPE_ID);
    assert.equal(loadedScope.elements.length, 117);

    refs.resetM80PilotWorkingStatesForDiagnostic();
    body.replaceChildren(new RechnungScreen().render());
    await flushAsyncWork();
    global.window.uiEditor = {
      loadStartupLayout: async () => loaded,
      completeStartupLayout: async () => ({ ok: true }),
    };
    const restart = await host.restoreM80StartupLayout();
    assert.equal(restart.applied, true, JSON.stringify(restart));
    for (const element of loadedScope.elements) {
      const restored = refs.snapshotM80State(element.elementId);
      for (const key of ["x", "y", "width", "height"]) assert.equal(restored[key], element[key], `${element.elementId}: restored ${key}`);
    }

    const restoredShort = refs.snapshotM80State("rechnung.editor.positionShort");
    assert.deepEqual({ x: restoredShort.x, y: restoredShort.y, width: restoredShort.width }, { x: 2501, y: -2501, width: 0 });
    assert.equal(refs.snapshotM80State("rechnung.editor.introText").height, 10);
    assert.equal(refs.snapshotM80State("rechnung.editor.positionLong").height, 800);
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    fs.rmSync(profileRoot, { recursive: true, force: true });
    global.document = previous.document;
    global.window = previous.window;
    global.Element = previous.Element;
    global.CustomEvent = previous.CustomEvent;
  }

  console.log("TESTS OK: 117 Rechnungselemente in vier Richtungen und von 0 bis ueber Altmax, Host ±2501, Textareas 10/800, exakter Neustart-Restore");
}

main().catch((error) => { console.error(error?.stack || error); process.exitCode = 1; });
