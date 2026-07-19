const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { getBbmUiElementRegistry } = require("../../src/ui-editor/bbm-ui-element-registry.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const HOST_ADAPTER_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmMainUiHostAdapter.js");
const INSPECTOR_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/inspector/editorScopeInspector.js");
const REFS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js");
const LAYOUT_PERSISTENCE_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutPersistence.js");
const DEFAULT_STORAGE_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmMainUiLayoutStorage.js");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");

class TestRef {
  constructor(width = 300, height = 180) {
    this.style = { values: {}, setProperty: (k, v) => { this.style.values[k] = String(v); }, removeProperty: (k) => { delete this.style.values[k]; } };
    this.rect = { width, height, left: 0, top: 0 };
  }
  getBoundingClientRect() { return { ...this.rect }; }
}

let changeCounter = 0;
function request(elementId, operation, payload) {
  changeCounter += 1;
  return {
    changeId: `m65-test-${changeCounter}`,
    targetAppId: "bbm-produktiv",
    moduleId: "bbm.main",
    scopeId: "bbm.main-layout",
    elementId,
    operation,
    payload,
    createdAt: "2026-07-19T00:00:00.000Z",
    source: "m65-test",
  };
}

async function createHarness(layoutStorage) {
  const [{ createBbmMainUiHostAdapter }, { createEditorScopeInspector }, refs] = await Promise.all([
    importEsmFromFile(HOST_ADAPTER_PATH),
    importEsmFromFile(INSPECTOR_PATH),
    importEsmFromFile(REFS_PATH),
  ]);
  refs.clearBbmUiElementRefs();
  global.HTMLElement = TestRef;
  const sourceElements = getBbmUiElementRegistry().elements;
  assert.ok(sourceElements.some((element) => element.elementId === "bbm.uiEditorTest.card"), "echte M64-Registry muss die Testkarte enthalten");
  const registryElements = [
    { id: "bbm.main.content", elementId: "bbm.main.content", name: "Inhalt", label: "Inhalt", type: "root", role: "layout", parentId: null, order: 1, visible: true, editable: false, allowedOps: [], lockedOps: [] },
    { id: "bbm.uiEditorTest.card", elementId: "bbm.uiEditorTest.card", name: "Testkarte", label: "Testkarte", type: "card", role: "content", parentId: "bbm.main.content", order: 2, visible: true, editable: true, allowedOps: ["move", "resize"], lockedOps: [] },
    { id: "bbm.uiEditorTest.table", elementId: "bbm.uiEditorTest.table", name: "Beispieltabelle", label: "Beispieltabelle", type: "table", role: "content", parentId: "bbm.main.content", order: 3, visible: true, editable: true, allowedOps: ["move", "resize"], lockedOps: [] },
    { id: "bbm.uiEditorTest.card.title", elementId: "bbm.uiEditorTest.card.title", name: "Überschrift", label: "Überschrift", type: "label", role: "content", parentId: "bbm.uiEditorTest.card", order: 4, visible: true, editable: true, allowedOps: ["move", "resize"], lockedOps: [] },
  ];
  for (const id of ["bbm.uiEditorTest.card", "bbm.uiEditorTest.table", "bbm.uiEditorTest.card.title"]) {
    refs.registerBbmUiElementRef(id, new TestRef(id.includes("table") ? 420 : 300, id.includes("table") ? 160 : 180));
  }
  const adapter = createBbmMainUiHostAdapter({ registry: registryElements, layoutStorage });
  const inspector = createEditorScopeInspector({ hostAdapterFactory: () => adapter, catalog: { targetAppId: "bbm-produktiv", modules: [{ moduleId: "bbm.main", moduleLabel: "BBM", scopes: [{ scopeId: "bbm.main-layout", uiScope: "bbm.main", label: "BBM Main" }] }] } });
  return { adapter, inspector, refs };
}

function createPersistentTestStorage(createEditorLayoutMemoryStorage, initialPayload = null) {
  const storage = createEditorLayoutMemoryStorage(initialPayload);
  return {
    available: true,
    persistent: true,
    readResult() {
      const payload = storage.read();
      return payload ? { ok: true, found: true, payload } : { ok: true, found: false, payload: null };
    },
    read: storage.read,
    write: storage.write,
    clear: storage.clear,
  };
}

async function runM65LayoutPersistenceRoundtripTests(run) {
  const { createEditorLayoutMemoryStorage } = await importEsmFromFile(LAYOUT_PERSISTENCE_PATH);

  await run("M65 Speichern: echte M64-Registry schreibt erst per expliziter Session-Speicherung dauerhaft", async () => {
    const layoutStorage = createPersistentTestStorage(createEditorLayoutMemoryStorage);
    const { adapter, inspector } = await createHarness(layoutStorage);
    assert.equal(inspector.beginLayoutSession("bbm.main-layout").ok, true);
    assert.equal(adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 10, y: 15 })).ok, true);
    assert.equal(adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "resize", { width: 25, height: 20 })).ok, true);
    assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").changedCount, 1);
    const saved = inspector.saveLayoutSession("bbm.main-layout");
    assert.equal(saved.ok, true);
    assert.equal(saved.status.changedCount, 0);
    const persisted = layoutStorage.read();
    assert.deepEqual(persisted.entries["bbm.uiEditorTest.card"].layoutValue, { x: 10, y: 15, width: 325, height: 200 });
    assert.equal(persisted.entries["bbm.uiEditorTest.card"].targetAppId, "bbm-produktiv");
    assert.equal(persisted.entries["bbm.uiEditorTest.card"].moduleId, "bbm.main");
    assert.equal(persisted.entries["bbm.uiEditorTest.card"].scopeId, "bbm.main-layout");
    assert.equal(persisted.entries["bbm.uiEditorTest.card"].layoutProfileId, "default");
    assert.ok(persisted.entries["bbm.uiEditorTest.card"].updatedAt);
  });

  await run("M65 Laden: neue Runtime lädt gespeicherte Werte und beginnt Baseline auf gespeichertem Zustand", async () => {
    const layoutStorage = createPersistentTestStorage(createEditorLayoutMemoryStorage);
    let harness = await createHarness(layoutStorage);
    harness.inspector.beginLayoutSession("bbm.main-layout");
    harness.adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 20, y: 5 }));
    harness.adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "resize", { width: 30, height: 10 }));
    harness.inspector.saveLayoutSession("bbm.main-layout");

    harness = await createHarness(layoutStorage);
    const loaded = harness.inspector.loadSavedLayout("bbm.main-layout");
    assert.equal(loaded.ok, true);
    harness.inspector.beginLayoutSession("bbm.main-layout");
    assert.equal(harness.inspector.getLayoutSessionStatus("bbm.main-layout").changedCount, 0);
    const ref = harness.refs.getBbmUiElementRef("bbm.uiEditorTest.card");
    assert.equal(ref.style.values.transform, "translate(20px, 5px)");
    assert.equal(ref.style.values.width, "330px");
    assert.equal(ref.style.values.height, "190px");
  });

  await run("M65 Verwerfen nach Speichern: einzelnes Element kehrt zum gespeicherten Zustand zurück", async () => {
    const layoutStorage = createPersistentTestStorage(createEditorLayoutMemoryStorage);
    const { adapter, inspector, refs } = await createHarness(layoutStorage);
    inspector.beginLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 10, y: 0 }));
    inspector.saveLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 5, y: 0 }));
    assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").changedCount, 1);
    assert.equal(inspector.discardLayoutSessionElement("bbm.main-layout", "bbm.uiEditorTest.card").ok, true);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, "translate(10px, 0px)");
    assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").changedCount, 0);
  });

  await run("M65 Alle verwerfen: mehrere Änderungen kehren zum gespeicherten Zustand zurück ohne Storage zu löschen", async () => {
    const layoutStorage = createPersistentTestStorage(createEditorLayoutMemoryStorage);
    const { adapter, inspector, refs } = await createHarness(layoutStorage);
    inspector.beginLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 10, y: 0 }));
    adapter.submitChangeRequest(request("bbm.uiEditorTest.table", "resize", { width: 20, height: 20 }));
    inspector.saveLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 5, y: 0 }));
    adapter.submitChangeRequest(request("bbm.uiEditorTest.table", "move", { x: 5, y: 5 }));
    assert.equal(inspector.discardLayoutSession("bbm.main-layout").ok, true);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, "translate(10px, 0px)");
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.table").style.values.transform, "translate(0px, 0px)");
    assert.ok(layoutStorage.read().entries["bbm.uiEditorTest.card"]);
    assert.ok(layoutStorage.read().entries["bbm.uiEditorTest.table"]);
  });

  await run("M65 Guardrail: UI-Zustände und Registry-Metadaten werden nicht persistiert", async () => {
    const layoutStorage = createPersistentTestStorage(createEditorLayoutMemoryStorage);
    const { adapter, inspector } = await createHarness(layoutStorage);
    inspector.beginLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 1 }));
    assert.equal(inspector.saveLayoutSession("bbm.main-layout").ok, true);
    const serialized = JSON.stringify(layoutStorage.read());
    for (const forbidden of ["selectedElement", "selectionModeActive", "editorActive", "activeLayoutControlMode", "Meldung", "DOM", "ref", "registry", "metadata"]) {
      assert.equal(serialized.includes(forbidden), false, `${forbidden} darf nicht im Layoutspeicher stehen`);
    }
  });

  await run("M65 Kein gespeichertes Layout: Load meldet found false und Paneltext ist neutral", async () => {
    const layoutStorage = createPersistentTestStorage(createEditorLayoutMemoryStorage);
    const { inspector } = await createHarness(layoutStorage);
    const loaded = inspector.loadSavedLayout("bbm.main-layout");
    assert.equal(loaded.ok, true);
    assert.equal(loaded.savedLayoutFound, false);
    const panelSource = fs.readFileSync(PANEL_PATH, "utf8");
    assert.match(panelSource, /Noch kein Layout gespeichert/);
    assert.doesNotMatch(panelSource, /loadResult\?\.ok \? "Gespeichertes Layout geladen"/);
  });

  await run("M65 Default-Storage: ohne Browser-Storage nicht persistent und Save bleibt Fehler", async () => {
    const previousStorage = global.localStorage;
    delete global.localStorage;
    try {
      const [{ createBbmMainUiHostAdapter }, refs] = await Promise.all([importEsmFromFile(HOST_ADAPTER_PATH), importEsmFromFile(REFS_PATH)]);
      refs.clearBbmUiElementRefs();
      global.HTMLElement = TestRef;
      refs.registerBbmUiElementRef("bbm.uiEditorTest.card", new TestRef());
      const adapter = createBbmMainUiHostAdapter({ registry: [{ id: "bbm.uiEditorTest.card", elementId: "bbm.uiEditorTest.card", name: "Testkarte", type: "card", role: "content", parentId: null, order: 1, visible: true, editable: true, allowedOps: ["move"], lockedOps: [] }] });
      const persistenceStatus = adapter.getPersistenceStatus();
      assert.equal(persistenceStatus.persistenceAvailable, false);
      assert.equal(persistenceStatus.persistencePersistent, false);
      assert.equal(persistenceStatus.savedLayoutFound, false);
      assert.equal(persistenceStatus.deviatesFromDefaults, false);
      assert.equal(persistenceStatus.standardLayoutActive, true);
      assert.equal(adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 5 })).ok, true);
      const result = adapter.saveLayoutSession();
      assert.equal(result.ok, false);
      assert.equal(result.reason, "LAYOUT_STORAGE_NOT_PERSISTENT");
    } finally {
      global.localStorage = previousStorage;
    }
  });

  await run("M65 Beschädigtes JSON: Load meldet Fehler und wendet nichts an", async () => {
    const previousStorage = global.localStorage;
    global.localStorage = { getItem: () => "{ kaputt", setItem() {}, removeItem() {} };
    try {
      const [{ createBbmMainUiHostAdapter }, { createBbmMainUiLayoutStorage }, refs] = await Promise.all([importEsmFromFile(HOST_ADAPTER_PATH), importEsmFromFile(DEFAULT_STORAGE_PATH), importEsmFromFile(REFS_PATH)]);
      refs.clearBbmUiElementRefs();
      global.HTMLElement = TestRef;
      const ref = new TestRef();
      refs.registerBbmUiElementRef("bbm.uiEditorTest.card", ref);
      const layoutStorage = createBbmMainUiLayoutStorage("m65.corrupt.storage");
      const adapter = createBbmMainUiHostAdapter({ registry: [{ id: "bbm.uiEditorTest.card", elementId: "bbm.uiEditorTest.card", name: "Testkarte", type: "card", role: "content", parentId: null, order: 1, visible: true, editable: true, allowedOps: ["move"], lockedOps: [] }], layoutStorage });
      const result = adapter.loadSavedLayout();
      assert.equal(result.ok, false);
      assert.equal(result.reason, "LAYOUT_STORAGE_READ_FAILED");
      assert.equal(ref.style.values.transform, undefined);
      const panelSource = fs.readFileSync(PANEL_PATH, "utf8");
      assert.match(panelSource, /Gespeichertes Layout konnte nicht geladen werden\./);
    } finally {
      global.localStorage = previousStorage;
    }
  });

  await run("M65 Schreibfehler: Save bleibt Fehler, Änderungen bleiben offen und Verwerfen funktioniert", async () => {
    const failingStorage = { available: true, persistent: true, readResult: () => ({ ok: true, found: false, payload: null }), read: () => null, write: () => { const error = new Error("write failed"); error.code = "LAYOUT_STORAGE_WRITE_FAILED"; throw error; }, clear() {} };
    const { adapter, inspector, refs } = await createHarness(failingStorage);
    inspector.beginLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 5 }));
    const result = inspector.saveLayoutSession("bbm.main-layout");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "LAYOUT_STORAGE_WRITE_FAILED");
    assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").changedCount, 1);
    assert.equal(inspector.discardLayoutSessionElement("bbm.main-layout", "bbm.uiEditorTest.card").ok, true);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, "translate(0px, 0px)");
  });

  await run("M65 Default-Storage: separater Adapter nutzt Browser-Storage, falls vorhanden", async () => {
    const previousStorage = global.localStorage;
    const memory = new Map();
    global.localStorage = {
      getItem: (key) => memory.has(key) ? memory.get(key) : null,
      setItem: (key, value) => memory.set(key, String(value)),
      removeItem: (key) => memory.delete(key),
    };
    try {
      const { createBbmMainUiLayoutStorage, BBM_MAIN_UI_LAYOUT_STORAGE_KEY } = await importEsmFromFile(DEFAULT_STORAGE_PATH);
      const storage = createBbmMainUiLayoutStorage("m65.default.storage");
      storage.write({ version: 1, entries: { sample: { layoutValue: { x: 1 } } } });
      assert.equal(JSON.parse(global.localStorage.getItem("m65.default.storage")).entries.sample.layoutValue.x, 1);
      assert.equal(BBM_MAIN_UI_LAYOUT_STORAGE_KEY.includes("bbm.uiEditor.layout"), true);
    } finally {
      global.localStorage = previousStorage;
    }
  });

  await run("M65 Fehlerfall: fehlschlagender Storage liefert ok false und Panel zeigt keine Erfolgsmeldung", async () => {
    const failingStorage = { read: () => null, write: () => { throw new Error("write failed"); }, clear() {} };
    const { adapter, inspector } = await createHarness(failingStorage);
    inspector.beginLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 5 }));
    const result = inspector.saveLayoutSession("bbm.main-layout");
    assert.equal(result.ok, false);
    assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").active, true);
    const panelSource = fs.readFileSync(PANEL_PATH, "utf8");
    assert.match(panelSource, /Layout konnte nicht dauerhaft gespeichert werden\./);
    assert.doesNotMatch(panelSource, /localStorage/);
  });
}

if (require.main === module) {
  const run = async (name, fn) => { try { await fn(); console.log(`ok - ${name}`); } catch (error) { console.error(`not ok - ${name}`); console.error(error); process.exitCode = 1; } };
  runM65LayoutPersistenceRoundtripTests(run).then(() => { if (!process.exitCode) console.log("m65LayoutPersistenceRoundtrip.test.cjs passed"); });
}

module.exports = { runM65LayoutPersistenceRoundtripTests };
