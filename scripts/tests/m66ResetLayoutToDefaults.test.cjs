const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const HOST_ADAPTER_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmMainUiHostAdapter.js");
const INSPECTOR_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/inspector/editorScopeInspector.js");
const REFS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
const LAYOUT_PERSISTENCE_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutPersistence.js");

class TestRef {
  constructor(width = 300, height = 180, options = {}) {
    this.hidden = false;
    this.failDefaultTransform = Boolean(options.failDefaultTransform);
    this.style = {
      values: {},
      setProperty: (k, v) => {
        if (this.failDefaultTransform && k === "transform" && v === "translate(0px, 0px)") {
          return { ok: false, reason: "STYLE_APPLY_FAILED" }.missing.property;
        }
        this.style.values[k] = String(v);
      },
      removeProperty: (k) => { delete this.style.values[k]; },
    };
    this.rect = { width, height, left: 0, top: 0 };
  }
  getBoundingClientRect() { return { ...this.rect }; }
}

class TestNode {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.textContent = "";
    this.type = "";
    this.disabled = false;
    this.hidden = false;
    this.className = "";
    this.attributes = {};
    this.listeners = {};
  }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, handler) { this.listeners[name] = [...(this.listeners[name] || []), handler]; }
  click() { if (!this.disabled) return this.listeners.click?.[0]?.({ target: this, preventDefault() {}, stopPropagation() {} }); return undefined; }
  set innerHTML(_value) { this.children = []; }
}

function findNode(node, predicate) {
  if (!node) return null;
  if (predicate(node)) return node;
  for (const child of node.children || []) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return null;
}

function collectText(node) {
  return [node?.textContent || "", ...(node?.children || []).flatMap(collectText)].join("\n");
}

let counter = 0;
function request(elementId, operation, payload) {
  counter += 1;
  return { changeId: `m66-${counter}`, targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "bbm.main-layout", elementId, operation, payload, createdAt: "2026-07-19T00:00:00.000Z", source: "m66-test" };
}

function clone(value) {
  return value && typeof value === "object" ? structuredClone(value) : null;
}

function persistentStorage(createEditorLayoutMemoryStorage, initialPayload = null, options = {}) {
  const storage = createEditorLayoutMemoryStorage(initialPayload);
  let writeCount = 0;
  return {
    available: true,
    persistent: true,
    get writeCount() { return writeCount; },
    readResult() { const payload = storage.read(); return payload ? { ok: true, found: true, payload } : { ok: true, found: false, payload: null }; },
    read: storage.read,
    write(nextPayload) {
      const entries = nextPayload?.entries && typeof nextPayload.entries === "object" ? nextPayload.entries : {};
      if (options.failEmptyWrite && Object.keys(entries).length === 0) {
        const error = new Error("clear failed");
        error.code = "LAYOUT_STORAGE_CLEAR_FAILED";
        throw error;
      }
      writeCount += 1;
      return storage.write(nextPayload);
    },
    clear: storage.clear,
  };
}

function scopedContainerStorage(container, scopeKey = "bbm-produktiv|bbm.main|bbm.main-layout") {
  return {
    available: true,
    persistent: true,
    readResult() { const payload = container[scopeKey] || null; return payload ? { ok: true, found: true, payload: clone(payload) } : { ok: true, found: false, payload: null }; },
    read() { return clone(container[scopeKey] || null); },
    write(nextPayload) { container[scopeKey] = clone(nextPayload); return clone(container[scopeKey]); },
    clear() { delete container[scopeKey]; },
  };
}

async function createHarness(layoutStorage, options = {}) {
  const [{ createBbmMainUiHostAdapter }, { createEditorScopeInspector }, refs] = await Promise.all([importEsmFromFile(HOST_ADAPTER_PATH), importEsmFromFile(INSPECTOR_PATH), importEsmFromFile(REFS_PATH)]);
  refs.clearBbmUiElementRefs();
  global.HTMLElement = TestRef;
  const registry = [
    { id: "bbm.main.content", elementId: "bbm.main.content", name: "Inhalt", type: "root", role: "layout", parentId: null, order: 1, visible: true, editable: false, allowedOps: [], lockedOps: [], layoutDefaults: { visible: true } },
    { id: "bbm.uiEditorTest.card", elementId: "bbm.uiEditorTest.card", name: "Testkarte", type: "card", role: "content", parentId: "bbm.main.content", order: 2, visible: true, editable: true, allowedOps: ["move", "resize"], lockedOps: [], layoutDefaults: { visible: true, width: 300, height: 300 } },
    { id: "bbm.uiEditorTest.table", elementId: "bbm.uiEditorTest.table", name: "Beispieltabelle", type: "table", role: "content", parentId: "bbm.main.content", order: 3, visible: true, editable: true, allowedOps: ["move", "resize", "hide", "show"], lockedOps: [], layoutDefaults: { visible: true, width: 420 } },
  ];
  for (const entry of registry) {
    if (options.missingRefIds?.includes(entry.id)) continue;
    refs.registerBbmUiElementRef(entry.id, new TestRef(entry.id.includes("table") ? 420 : 300, 180, options.failRefId === entry.id ? { failDefaultTransform: true } : {}));
  }
  const adapter = createBbmMainUiHostAdapter({ registry, layoutStorage });
  const inspector = createEditorScopeInspector({ hostAdapterFactory: () => adapter, catalog: { targetAppId: "bbm-produktiv", modules: [{ moduleId: "bbm.main", moduleLabel: "BBM", scopes: [{ scopeId: "bbm.main-layout", uiScope: "bbm.main", label: "BBM Main" }] }] } });
  return { adapter, inspector, refs };
}

async function installSavedLayout(storage) {
  const { adapter, inspector } = await createHarness(storage);
  inspector.beginLayoutSession("bbm.main-layout");
  adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 10, y: 15 }));
  adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "resize", { width: 25, height: 20 }));
  adapter.submitChangeRequest(request("bbm.uiEditorTest.table", "resize", { height: 25 }));
  assert.equal(inspector.saveLayoutSession("bbm.main-layout").ok, true);
}

async function runM66ResetLayoutToDefaultsTests(run) {
  const { createEditorLayoutMemoryStorage } = await importEsmFromFile(LAYOUT_PERSISTENCE_PATH);

  await run("M66 A/B/C: erfolgreicher Reset löscht gespeichert, zeigt Defaults und setzt Baseline", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage);
    await installSavedLayout(storage);
    const { inspector, refs } = await createHarness(storage);
    const loadedIsolation = inspector.loadSavedLayout("bbm.main-layout");
    assert.equal(loadedIsolation.savedLayoutFound, true);
    inspector.beginLayoutSession("bbm.main-layout");
    const result = inspector.resetLayoutToDefaults("bbm.main-layout");
    assert.equal(result.ok, true);
    assert.equal(result.status.savedLayoutFound, false);
    assert.equal(result.status.deviatesFromDefaults, false);
    assert.equal(result.status.standardLayoutActive, true);
    assert.equal(result.status.changedCount, 0);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, "translate(0px, 0px)");
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.width, "300px");
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.height, "300px");
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.table").style.values.width, "420px");
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.table").style.values.height, undefined);
    assert.deepEqual(storage.read().entries, {});
  });

  await run("M66 D: Neustart findet kein altes Layout", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage);
    await installSavedLayout(storage);
    let harness = await createHarness(storage);
    harness.inspector.loadSavedLayout("bbm.main-layout");
    assert.equal(harness.inspector.resetLayoutToDefaults("bbm.main-layout").ok, true);
    harness = await createHarness(storage);
    const loaded = harness.inspector.loadSavedLayout("bbm.main-layout");
    assert.equal(loaded.ok, true);
    assert.equal(loaded.savedLayoutFound, false);
    assert.equal(harness.refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, undefined);
  });

  await run("M66 E: echtes Panel-Abbrechen ruft Reset nicht auf und lässt Zustand unverändert", async () => {
    const oldDocument = global.document;
    try {
      global.document = { createElement: (tagName) => new TestNode(tagName) };
      const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH);
      const panel = new BbmUiEditorStatusPanel();
      let calls = 0;
      const statusBefore = { ok: true, active: true, changedCount: 1, changedByElementId: {}, savedLayoutFound: true, deviatesFromDefaults: true, standardLayoutActive: false, persistenceAvailable: true, persistencePersistent: true };
      panel.inspectorBridge = { getLayoutSessionStatus: () => ({ status: statusBefore }), resetLayoutToDefaults: () => { calls += 1; return { ok: true, status: statusBefore }; } };
      panel.detailsNode = new TestNode("section");
      panel.layoutSessionStatus = statusBefore;
      panel.renderEditorSessionControls();
      const resetButton = findNode(panel.detailsNode, (node) => node.tagName === "button" && node.textContent === "Auf Standard zurücksetzen");
      assert.equal(resetButton.disabled, false);
      resetButton.click();
      assert.equal(panel.resetDefaultsDialogOpen, true);
      panel.detailsNode = new TestNode("section");
      panel.renderEditorSessionControls();
      assert.match(collectText(panel.detailsNode), /Layout auf Standard zurücksetzen\?/);
      const cancel = findNode(panel.detailsNode, (node) => node.tagName === "button" && node.textContent === "Abbrechen");
      cancel.click();
      assert.equal(calls, 0);
      assert.equal(panel.resetDefaultsDialogOpen, false);
      assert.deepEqual(panel.layoutSessionStatus, statusBefore);
    } finally {
      global.document = oldDocument;
    }
  });

  await run("M66 F: Scope- und Profil-Isolation bleibt erhalten", async () => {
    const foreignScope = { version: 1, targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "anderer.scope", layoutProfileId: "default", entries: { foreign: { layoutProfileId: "default", targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "anderer.scope", elementId: "foreign", operation: "move", layoutValue: { x: 99 }, createdAt: "a", updatedAt: "b" } } };
    const container = { "bbm-produktiv|bbm.main|anderer.scope": foreignScope };
    const storage = scopedContainerStorage(container);
    await installSavedLayout(storage);
    const current = container["bbm-produktiv|bbm.main|bbm.main-layout"];
    current.entries["foreignProfile"] = { layoutProfileId: "preview", targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "bbm.main-layout", elementId: "foreignProfile", operation: "move", layoutValue: { x: 44 }, createdAt: "a", updatedAt: "b" };
    const { inspector } = await createHarness(storage);
    assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").savedLayoutFound, true);
    assert.equal(inspector.resetLayoutToDefaults("bbm.main-layout").ok, true);
    assert.deepEqual(container["bbm-produktiv|bbm.main|anderer.scope"], foreignScope);
    assert.equal(container["bbm-produktiv|bbm.main|bbm.main-layout"].entries.foreignProfile.layoutProfileId, "preview");
    assert.equal(Object.values(container["bbm-produktiv|bbm.main|bbm.main-layout"].entries).some((entry) => entry.layoutProfileId === "default"), false);
  });

  await run("M66 G: fehlender Ref blockiert vor destruktiver Operation", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage);
    await installSavedLayout(storage);
    const before = clone(storage.read());
    const writesBefore = storage.writeCount;
    const { inspector } = await createHarness(storage, { missingRefIds: ["bbm.uiEditorTest.table"] });
    inspector.loadSavedLayout("bbm.main-layout");
    const result = inspector.resetLayoutToDefaults("bbm.main-layout");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "ELEMENT_REF_MISSING");
    assert.deepEqual(storage.read(), before);
    assert.equal(storage.writeCount, writesBefore);
  });

  await run("M66 H: Fehler bei Default-Anwendung rollt Persistenz, Session und Sicht zurück", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage);
    await installSavedLayout(storage);
    const beforePersistent = clone(storage.read());
    const { inspector, adapter, refs } = await createHarness(storage, { failRefId: "bbm.uiEditorTest.table" });
    inspector.loadSavedLayout("bbm.main-layout");
    inspector.beginLayoutSession("bbm.main-layout");
    const beforeSession = clone(adapter.getCurrentLayoutState());
    const beforeTransform = refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform;
    const result = inspector.resetLayoutToDefaults("bbm.main-layout");
    assert.equal(result.ok, false);
    assert.deepEqual(storage.read(), beforePersistent);
    assert.deepEqual(adapter.getCurrentLayoutState(), beforeSession);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, beforeTransform);
    assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").changedCount, 0);
  });

  await run("M66 I: Fehler beim persistenten Löschen rollt sichtbar und Session zurück", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage, null, { failEmptyWrite: true });
    await installSavedLayout(storage);
    const beforePersistent = clone(storage.read());
    const { inspector, adapter, refs } = await createHarness(storage);
    inspector.loadSavedLayout("bbm.main-layout");
    inspector.beginLayoutSession("bbm.main-layout");
    const beforeSession = clone(adapter.getCurrentLayoutState());
    const beforeTransform = refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform;
    const result = inspector.resetLayoutToDefaults("bbm.main-layout");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "LAYOUT_STORAGE_CLEAR_FAILED");
    assert.deepEqual(storage.read(), beforePersistent);
    assert.deepEqual(adapter.getCurrentLayoutState(), beforeSession);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, beforeTransform);
  });

  await run("M66 J/Guardrail: Button-Zustand ist strukturiert und ohne Meldungstextvergleich", async () => {
    const source = fs.readFileSync(PANEL_PATH, "utf8");
    for (const forbidden of ["layoutPersistenceStatus === \"Gespeichertes Layout geladen\"", "layoutPersistenceStatus === \"Layout gespeichert\"", "layoutPersistenceStatus === \"Standardlayout aktiv\"", "localStorage", "style.setProperty", "style.removeProperty", "layoutDefaults:", "baselineByElementId"]) {
      assert.equal(source.includes(forbidden), false, forbidden);
    }
    assert.match(source, /savedLayoutFound/);
    assert.match(source, /deviatesFromDefaults/);
    assert.match(source, /Auf Standard zurücksetzen/);
  });
}

if (require.main === module) {
  const run = async (name, fn) => { try { await fn(); console.log(`ok - ${name}`); } catch (error) { console.error(`not ok - ${name}`); console.error(error); process.exitCode = 1; } };
  runM66ResetLayoutToDefaultsTests(run).then(() => { if (!process.exitCode) console.log("m66ResetLayoutToDefaults.test.cjs passed"); });
}

module.exports = { runM66ResetLayoutToDefaultsTests };
