const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const HOST_ADAPTER_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmMainUiHostAdapter.js");
const INSPECTOR_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/inspector/editorScopeInspector.js");
const REFS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js");
const LAYOUT_PERSISTENCE_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutPersistence.js");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");

class TestRef {
  constructor(width = 300, height = 180) {
    this.hidden = false;
    this.style = { values: {}, setProperty: (k, v) => { this.style.values[k] = String(v); }, removeProperty: (k) => { delete this.style.values[k]; } };
    this.rect = { width, height, left: 0, top: 0 };
  }
  getBoundingClientRect() { return { ...this.rect }; }
}

let counter = 0;
function request(elementId, operation, payload) {
  counter += 1;
  return { changeId: `m66-${counter}`, targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "bbm.main-layout", elementId, operation, payload, createdAt: "2026-07-19T00:00:00.000Z", source: "m66-test" };
}

function persistentStorage(createEditorLayoutMemoryStorage, initialPayload = null) {
  const storage = createEditorLayoutMemoryStorage(initialPayload);
  return { available: true, persistent: true, readResult() { const payload = storage.read(); return payload ? { ok: true, found: true, payload } : { ok: true, found: false, payload: null }; }, read: storage.read, write: storage.write, clear: storage.clear };
}

async function createHarness(layoutStorage) {
  const [{ createBbmMainUiHostAdapter }, { createEditorScopeInspector }, refs] = await Promise.all([importEsmFromFile(HOST_ADAPTER_PATH), importEsmFromFile(INSPECTOR_PATH), importEsmFromFile(REFS_PATH)]);
  refs.clearBbmUiElementRefs();
  global.HTMLElement = TestRef;
  const registry = [
    { id: "bbm.main.content", elementId: "bbm.main.content", name: "Inhalt", type: "root", role: "layout", parentId: null, order: 1, visible: true, editable: false, allowedOps: [], lockedOps: [], layoutDefaults: { visible: true } },
    { id: "bbm.uiEditorTest.card", elementId: "bbm.uiEditorTest.card", name: "Testkarte", type: "card", role: "content", parentId: "bbm.main.content", order: 2, visible: true, editable: true, allowedOps: ["move", "resize"], lockedOps: [], layoutDefaults: { visible: true, width: 300, height: 300 } },
    { id: "bbm.uiEditorTest.table", elementId: "bbm.uiEditorTest.table", name: "Beispieltabelle", type: "table", role: "content", parentId: "bbm.main.content", order: 3, visible: true, editable: true, allowedOps: ["move", "resize", "hide", "show"], lockedOps: [], layoutDefaults: { visible: true, width: 420 } },
  ];
  for (const entry of registry) refs.registerBbmUiElementRef(entry.id, new TestRef(entry.id.includes("table") ? 420 : 300, 180));
  const adapter = createBbmMainUiHostAdapter({ registry, layoutStorage });
  const inspector = createEditorScopeInspector({ hostAdapterFactory: () => adapter, catalog: { targetAppId: "bbm-produktiv", modules: [{ moduleId: "bbm.main", moduleLabel: "BBM", scopes: [{ scopeId: "bbm.main-layout", uiScope: "bbm.main", label: "BBM Main" }] }] } });
  return { adapter, inspector, refs };
}

async function runM66ResetLayoutToDefaultsTests(run) {
  const { createEditorLayoutMemoryStorage } = await importEsmFromFile(LAYOUT_PERSISTENCE_PATH);

  await run("M66 löscht gespeichertes Layout und setzt sichtbare Defaults", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage);
    const { adapter, inspector, refs } = await createHarness(storage);
    inspector.beginLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 10, y: 15 }));
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "resize", { width: 25, height: 20 }));
    adapter.submitChangeRequest(request("bbm.uiEditorTest.table", "resize", { height: 25 }));
    inspector.saveLayoutSession("bbm.main-layout");
    const result = inspector.resetLayoutToDefaults("bbm.main-layout");
    assert.equal(result.ok, true);
    assert.deepEqual(storage.read().entries, {});
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, "translate(0px, 0px)");
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.width, "300px");
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.height, "300px");
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.table").style.values.width, "420px");
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.table").style.values.height, undefined);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.table").hidden, false);
  });

  await run("M66 Sessionstatus: Reset wird neue Baseline", async () => {
    const { adapter, inspector } = await createHarness(persistentStorage(createEditorLayoutMemoryStorage));
    inspector.beginLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 5 }));
    assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").changedCount, 1);
    const reset = inspector.resetLayoutToDefaults("bbm.main-layout");
    assert.equal(reset.status.changedCount, 0);
    assert.equal(reset.status.changedByElementId["bbm.uiEditorTest.card"], undefined);
    assert.equal(inspector.discardLayoutSession("bbm.main-layout").blocked, true);
  });

  await run("M66 Neustart: neuer Adapter findet keine alten Werte", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage);
    let harness = await createHarness(storage);
    harness.inspector.beginLayoutSession("bbm.main-layout");
    harness.adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 20 }));
    harness.inspector.saveLayoutSession("bbm.main-layout");
    assert.equal(harness.inspector.resetLayoutToDefaults("bbm.main-layout").ok, true);
    harness = await createHarness(storage);
    const loaded = harness.inspector.loadSavedLayout("bbm.main-layout");
    assert.equal(loaded.ok, true);
    assert.equal(loaded.savedLayoutFound, false);
    assert.equal(harness.refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, undefined);
  });

  await run("M66 Fehlerfall: Clear/Write-Fehler liefert ok false und Session bleibt nutzbar", async () => {
    const failing = { available: true, persistent: true, readResult: () => ({ ok: true, found: true, payload: { version: 1, targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "bbm.main-layout", layoutProfileId: "default", entries: {} } }), read: () => ({ version: 1, targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "bbm.main-layout", layoutProfileId: "default", entries: {} }), write: () => { const error = new Error("clear failed"); error.code = "LAYOUT_STORAGE_CLEAR_FAILED"; throw error; }, clear() {} };
    const { adapter, inspector } = await createHarness(failing);
    inspector.beginLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 5 }));
    const result = inspector.resetLayoutToDefaults("bbm.main-layout");
    assert.equal(result.ok, false);
    assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").active, true);
  });

  await run("M66 Guardrails: Panel bleibt ohne Storage-/Style-/Default-Kopie", async () => {
    const source = fs.readFileSync(PANEL_PATH, "utf8");
    for (const forbidden of ["localStorage", "style.setProperty", "style.removeProperty", "layoutDefaults:", "baselineByElementId"]) assert.equal(source.includes(forbidden), false, forbidden);
    assert.match(source, /Auf Standard zurücksetzen/);
    assert.match(source, /Layout konnte nicht auf Standard zurückgesetzt werden\./);
  });
}

if (require.main === module) {
  const run = async (name, fn) => { try { await fn(); console.log(`ok - ${name}`); } catch (error) { console.error(`not ok - ${name}`); console.error(error); process.exitCode = 1; } };
  runM66ResetLayoutToDefaultsTests(run).then(() => { if (!process.exitCode) console.log("m66ResetLayoutToDefaults.test.cjs passed"); });
}

module.exports = { runM66ResetLayoutToDefaultsTests };
