const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.join(__dirname, "../..");
const HOST_ADAPTER_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmMainUiHostAdapter.js");
const INSPECTOR_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/inspector/editorScopeInspector.js");
const REFS_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmUiElementRefs.js");
const PANEL_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/BbmUiEditorStatusPanel.js");
const BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/ui-editor/bbmEditorRuntimeInspectorBridge.js");
const LAYOUT_PERSISTENCE_PATH = path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutPersistence.js");

class TestRef {
  constructor(width = 300, height = 180) {
    this.hidden = false;
    this.style = { values: {}, setProperty: (k, v) => { this.style.values[k] = String(v); }, removeProperty: (k) => { delete this.style.values[k]; } };
    this.rect = { width, height, left: 0, top: 0 };
  }
  getBoundingClientRect() { return { ...this.rect }; }
}
class TestNode {
  constructor(tagName) { this.tagName = tagName; this.children = []; this.textContent = ""; this.type = ""; this.disabled = false; this.hidden = false; this.className = ""; this.attributes = {}; this.listeners = {}; }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, handler) { this.listeners[name] = [...(this.listeners[name] || []), handler]; }
  click() { if (!this.disabled) return this.listeners.click?.[0]?.({ target: this, preventDefault() {}, stopPropagation() {} }); return undefined; }
  set innerHTML(_value) { this.children = []; }
}
function findNode(node, predicate) { if (!node) return null; if (predicate(node)) return node; for (const child of node.children || []) { const found = findNode(child, predicate); if (found) return found; } return null; }
function collectText(node) { return [node?.textContent || "", ...(node?.children || []).flatMap(collectText)].join("\n"); }
function clone(value) { return value && typeof value === "object" ? structuredClone(value) : null; }
let counter = 0;
function request(elementId, operation, payload) { counter += 1; return { changeId: `m67-${counter}`, targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "bbm.main-layout", elementId, operation, payload, createdAt: "2026-07-19T00:00:00.000Z", source: "m67-test" }; }
function persistentStorage(createEditorLayoutMemoryStorage, options = {}) {
  const storage = createEditorLayoutMemoryStorage();
  return { available: true, persistent: true, readResult() { const payload = storage.read(); return payload ? { ok: true, found: true, payload } : { ok: true, found: false, payload: null }; }, read: storage.read, write(nextPayload) { if (options.failDeletingCard && !nextPayload?.entries?.["bbm.uiEditorTest.card"]) { const error = new Error("write failed"); error.code = "LAYOUT_STORAGE_WRITE_FAILED"; throw error; } return storage.write(nextPayload); }, clear: storage.clear };
}
function scopedContainerStorage(container, scopeKey = "bbm-produktiv|bbm.main|bbm.main-layout") { return { available: true, persistent: true, readResult() { const payload = container[scopeKey] || null; return payload ? { ok: true, found: true, payload: clone(payload) } : { ok: true, found: false, payload: null }; }, read() { return clone(container[scopeKey] || null); }, write(nextPayload) { container[scopeKey] = clone(nextPayload); return clone(container[scopeKey]); }, clear() { delete container[scopeKey]; } }; }
const registry = [
  { id: "bbm.main.content", elementId: "bbm.main.content", name: "Inhalt", type: "root", role: "layout", parentId: null, order: 1, visible: true, editable: false, allowedOps: [], lockedOps: [], layoutDefaults: { visible: true } },
  { id: "bbm.uiEditorTest.card", elementId: "bbm.uiEditorTest.card", name: "Testkarte", type: "card", role: "content", parentId: "bbm.main.content", order: 2, visible: true, editable: true, allowedOps: ["move", "resize"], lockedOps: [], layoutDefaults: { visible: true, minWidth: 80, minHeight: 80 } },
  { id: "bbm.uiEditorTest.card.title", elementId: "bbm.uiEditorTest.card.title", name: "Überschrift", type: "label", role: "content", parentId: "bbm.uiEditorTest.card", order: 3, visible: true, editable: true, allowedOps: ["move", "resize"], lockedOps: [], layoutDefaults: { visible: true, minWidth: 80, minHeight: 24 } },
  { id: "bbm.uiEditorTest.table", elementId: "bbm.uiEditorTest.table", name: "Beispieltabelle", type: "table", role: "content", parentId: "bbm.main.content", order: 8, visible: true, editable: true, allowedOps: ["move", "resize", "hide", "show"], lockedOps: [], layoutDefaults: { visible: true, minWidth: 160, minHeight: 80 } },
];
async function createHarness(layoutStorage, options = {}) {
  const [{ createBbmMainUiHostAdapter }, { createEditorScopeInspector }, refs] = await Promise.all([importEsmFromFile(HOST_ADAPTER_PATH), importEsmFromFile(INSPECTOR_PATH), importEsmFromFile(REFS_PATH)]);
  refs.clearBbmUiElementRefs(); global.HTMLElement = TestRef;
  for (const entry of registry) if (entry.editable && !options.missingRefIds?.includes(entry.id)) refs.registerBbmUiElementRef(entry.id, new TestRef(entry.id.includes("table") ? 420 : 300, 180));
  const adapter = createBbmMainUiHostAdapter({ registry, layoutStorage });
  const inspector = createEditorScopeInspector({ hostAdapterFactory: () => adapter, catalog: { targetAppId: "bbm-produktiv", modules: [{ moduleId: "bbm.main", moduleLabel: "BBM", scopes: [{ scopeId: "bbm.main-layout" }] }] } });
  return { adapter, inspector, refs };
}
async function saveTwo(storage) { const { adapter, inspector } = await createHarness(storage); inspector.beginLayoutSession("bbm.main-layout"); adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 10, y: 15 })); adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "resize", { width: 25, height: 20 })); adapter.submitChangeRequest(request("bbm.uiEditorTest.table", "move", { x: 20 })); assert.equal(inspector.saveLayoutSession("bbm.main-layout").ok, true); }

async function runM67ResetElementToDefaultsTests(run) {
  const { createEditorLayoutMemoryStorage } = await importEsmFromFile(LAYOUT_PERSISTENCE_PATH);

  await run("M67 A: nur einzelnes gespeichertes Element wird dauerhaft zurückgesetzt", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage); await saveTwo(storage);
    const { inspector, refs } = await createHarness(storage); inspector.loadSavedLayout("bbm.main-layout"); inspector.beginLayoutSession("bbm.main-layout");
    const result = inspector.resetLayoutElementToDefaults("bbm.main-layout", "bbm.uiEditorTest.card");
    assert.equal(result.ok, true); assert.equal(result.status.changedCount, 0);
    assert.equal(storage.read().entries["bbm.uiEditorTest.card"], undefined); assert.ok(storage.read().entries["bbm.uiEditorTest.table"]);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, undefined); assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.width, undefined); assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.height, undefined);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.table").style.values.transform, "translate(20px, 0px)");
  });

  await run("M67 B/D: Kind-Isolation und Element-Baseline nach erneutem Ändern", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage); const { adapter, inspector, refs } = await createHarness(storage);
    inspector.beginLayoutSession("bbm.main-layout"); adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 10 })); adapter.submitChangeRequest(request("bbm.uiEditorTest.card.title", "move", { x: 5 })); inspector.saveLayoutSession("bbm.main-layout");
    assert.equal(inspector.resetLayoutElementToDefaults("bbm.main-layout", "bbm.uiEditorTest.card").ok, true);
    assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, undefined); assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card.title").style.values.transform, "translate(5px, 0px)");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 5 })); assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").changedCount, 1);
    assert.equal(inspector.discardLayoutSessionElement("bbm.main-layout", "bbm.uiEditorTest.card").ok, true); assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, undefined);
    assert.equal(inspector.resetLayoutElementToDefaults("bbm.main-layout", "bbm.uiEditorTest.card.title").ok, true); assert.equal(refs.getBbmUiElementRef("bbm.uiEditorTest.card.title").style.values.transform, undefined);
  });

  await run("M67 C: Session-Isolation lässt andere offene Änderungen stehen", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage); await saveTwo(storage); const { adapter, inspector } = await createHarness(storage); inspector.loadSavedLayout("bbm.main-layout"); inspector.beginLayoutSession("bbm.main-layout");
    adapter.submitChangeRequest(request("bbm.uiEditorTest.card", "move", { x: 5 })); adapter.submitChangeRequest(request("bbm.uiEditorTest.table", "move", { x: 5 })); assert.equal(inspector.getLayoutSessionStatus("bbm.main-layout").changedCount, 2);
    const result = inspector.resetLayoutElementToDefaults("bbm.main-layout", "bbm.uiEditorTest.card"); assert.equal(result.ok, true); assert.equal(result.status.changedCount, 1); assert.equal(result.status.changedByElementId["bbm.uiEditorTest.table"], true);
  });

  await run("M67 Status: echter Bridge-Pfad aktiviert Button über strukturierte Elementfelder", async () => {
    const { createBbmEditorRuntimeInspectorBridge } = await importEsmFromFile(BRIDGE_PATH);
    const storage = persistentStorage(createEditorLayoutMemoryStorage);
    await saveTwo(storage);
    const harness = await createHarness(storage);
    const bridge = createBbmEditorRuntimeInspectorBridge({
      registryElements: registry.map((entry) => ({ ...entry, label: entry.name, elementId: entry.id })),
      selectedElement: { elementId: "bbm.uiEditorTest.card", label: "Testkarte", editable: true },
      hostAdapterFactory: () => harness.adapter,
    });
    const status = bridge.inspectSelectedElement();
    assert.equal(status.ok, true);
    assert.equal(status.selectedElementHasSavedLayout, true);
    assert.equal(status.selectedElementCanResetToDefaults, true);
  });

  await run("M67 E: Panel-Abbrechen ruft keine API auf", async () => {
    const oldDocument = global.document; try { global.document = { createElement: (tagName) => new TestNode(tagName) }; const { BbmUiEditorStatusPanel } = await importEsmFromFile(PANEL_PATH); const panel = new BbmUiEditorStatusPanel(); let calls = 0; panel.detailsNode = new TestNode("section"); panel.editorActive = true; panel.selectedElement = { elementId: "bbm.uiEditorTest.card", label: "Testkarte", editable: true }; panel.inspectorBridge = { inspectSelectedElement: () => ({ ok: true, allowedOps: ["move", "resize"], selectedElementCanResetToDefaults: true }), resetSelectedElementToDefaults: () => { calls += 1; return { ok: true }; } }; panel.renderReadonlyLayoutControls(panel.selectedElement); findNode(panel.detailsNode, (n) => n.tagName === "button" && n.textContent === "Element auf Standard …").click(); panel.detailsNode = new TestNode("section"); panel.renderReadonlyLayoutControls(panel.selectedElement); assert.match(collectText(panel.detailsNode), /Element auf Standard zurücksetzen\?/); assert.doesNotMatch(collectText(panel.detailsNode), /bbm\.uiEditorTest\.card/); findNode(panel.detailsNode, (n) => n.tagName === "button" && n.textContent === "Abbrechen").click(); assert.equal(calls, 0); } finally { global.document = oldDocument; }
  });

  await run("M67 F/G/I: fehlender Ref, Persistenzfehler und nicht editierbar blockieren/rollen zurück", async () => {
    const storage = persistentStorage(createEditorLayoutMemoryStorage); await saveTwo(storage); const before = clone(storage.read()); let harness = await createHarness(storage, { missingRefIds: ["bbm.uiEditorTest.card"] }); assert.equal(harness.inspector.resetLayoutElementToDefaults("bbm.main-layout", "bbm.uiEditorTest.card").reason, "ELEMENT_REF_MISSING"); assert.deepEqual(storage.read(), before);
    const failing = persistentStorage(createEditorLayoutMemoryStorage, { failDeletingCard: true }); await saveTwo(failing); harness = await createHarness(failing); harness.inspector.loadSavedLayout("bbm.main-layout"); const visibleBefore = harness.refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform; const fail = harness.inspector.resetLayoutElementToDefaults("bbm.main-layout", "bbm.uiEditorTest.card"); assert.equal(fail.ok, false); assert.equal(harness.refs.getBbmUiElementRef("bbm.uiEditorTest.card").style.values.transform, visibleBefore); assert.ok(failing.read().entries["bbm.uiEditorTest.card"]);
    const blocked = harness.inspector.resetLayoutElementToDefaults("bbm.main-layout", "bbm.main.content"); assert.equal(blocked.ok, false); assert.equal(blocked.reason, "ELEMENT_NOT_EDITABLE");
  });

  await run("M67 H/J: Scope-/Profil-Isolation und Panel-Guardrails", async () => {
    const container = { "bbm-produktiv|bbm.main|anderer.scope": { version: 1, targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "anderer.scope", layoutProfileId: "default", entries: { foreign: { layoutProfileId: "default", targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "anderer.scope", elementId: "foreign", operation: "move", layoutValue: { x: 99 }, createdAt: "a", updatedAt: "b" } } } };
    const storage = scopedContainerStorage(container); await saveTwo(storage); container["bbm-produktiv|bbm.main|bbm.main-layout"].entries.previewCard = { layoutProfileId: "preview", targetAppId: "bbm-produktiv", moduleId: "bbm.main", scopeId: "bbm.main-layout", elementId: "previewCard", operation: "move", layoutValue: { x: 1 }, createdAt: "a", updatedAt: "b" };
    const { inspector } = await createHarness(storage); assert.equal(inspector.resetLayoutElementToDefaults("bbm.main-layout", "bbm.uiEditorTest.card").ok, true); assert.ok(container["bbm-produktiv|bbm.main|anderer.scope"].entries.foreign); assert.ok(container["bbm-produktiv|bbm.main|bbm.main-layout"].entries.previewCard); assert.ok(container["bbm-produktiv|bbm.main|bbm.main-layout"].entries["bbm.uiEditorTest.table"]);
    const panelSource = fs.readFileSync(PANEL_PATH, "utf8"); const bridgeSource = fs.readFileSync(BRIDGE_PATH, "utf8");
    for (const forbidden of ["localStorage", "style.setProperty", "style.removeProperty", "getBoundingClientRect", "layoutDefaults:", "baselineByElementId"]) assert.equal(panelSource.includes(forbidden), false, forbidden);
    for (const line of panelSource.split(/\n/)) assert.doesNotMatch(line, /selectedElementCanResetToDefaults.*bbm\.uiEditorTest\.(card|table)|bbm\.uiEditorTest\.(card|table).*selectedElementCanResetToDefaults/);
    assert.doesNotMatch(bridgeSource, /__getHostAdapter|restoreLayoutState|layoutStore/);
  });
}

if (require.main === module) {
  const run = async (name, fn) => { try { await fn(); console.log(`ok - ${name}`); } catch (error) { console.error(`not ok - ${name}`); console.error(error); process.exitCode = 1; } };
  runM67ResetElementToDefaultsTests(run).then(() => { if (!process.exitCode) console.log("m67ResetElementToDefaults.test.cjs passed"); });
}
module.exports = { runM67ResetElementToDefaultsTests };
