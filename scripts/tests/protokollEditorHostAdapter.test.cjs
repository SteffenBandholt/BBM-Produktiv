const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const HOST_FACTORY_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/host/bbmEditorHostAdapterFactory.js"
);
const HOST_CONTRACT_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js"
);
const LAYOUT_PERSISTENCE_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/layout/editorLayoutPersistence.js"
);
const REGISTRY_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/protokoll/editor/registries/protokollTopsUiRegistry.js"
);

async function runProtokollEditorHostAdapterTests(run) {
  const [{ createBbmEditorHostAdapter }, { validateHostAdapterShape }, layoutPersistence, registryModule] = await Promise.all([
    importEsmFromFile(HOST_FACTORY_PATH),
    importEsmFromFile(HOST_CONTRACT_PATH),
    importEsmFromFile(LAYOUT_PERSISTENCE_PATH),
    importEsmFromFile(REGISTRY_PATH),
  ]);

  const registry = registryModule.getProtokollTopsUiRegistry();
  const validChangeRequest = {
    changeId: "chg-protokoll-1",
    targetAppId: "bbm",
    moduleId: "protokoll",
    scopeId: "protokoll.topsScreen",
    elementId: "protokoll.topsScreen.quicklane",
    operation: "move",
    payload: {
      x: 12,
      y: 24,
    },
    createdAt: "2026-07-08T10:00:00.000Z",
    source: "ui",
  };

  await run("Protokoll HostAdapter: Factory liefert Adapter fuer den TOPS-Scope", () => {
    const adapter = createBbmEditorHostAdapter("protokoll.topsScreen");
    assert.ok(adapter);
    assert.equal(typeof adapter.getRegistry, "function");
    assert.equal(typeof adapter.getCurrentLayoutState, "function");
    assert.equal(typeof adapter.submitChangeRequest, "function");
    assert.equal(typeof adapter.resetLayoutState, "function");
  });

  const layoutStorage = layoutPersistence.createEditorLayoutMemoryStorage();
  const adapter = createBbmEditorHostAdapter("protokoll.topsScreen", { layoutStorage });

  await run("Protokoll HostAdapter: Shape ist valide", () => {
    const shape = validateHostAdapterShape(adapter);
    assert.equal(shape.ok, true);
    assert.deepEqual(shape.errors, []);
  });

  await run("Protokoll HostAdapter: Registry enthaelt registrierte TOPS-Quicklane-Elemente", () => {
    const adapterRegistry = adapter.getRegistry();
    const ids = new Set(adapterRegistry.map((entry) => entry.id));
    assert.equal(Array.isArray(adapterRegistry), true);
    assert.ok(adapterRegistry.length > 0);
    assert.equal(adapterRegistry[0].id, registry[0].id);
    assert.equal(ids.has("protokoll.topsScreen.quicklane"), true);
    assert.equal(ids.has("protokoll.topsScreen.quicklane.group.output"), true);
    assert.equal(ids.has("protokoll.topsScreen.quicklane.action.print"), true);
  });

  await run("Protokoll HostAdapter: gueltiger Change Request speichert neutralen Layoutwert", () => {
    const result = adapter.submitChangeRequest(validChangeRequest);
    assert.equal(result.ok, true);
    assert.equal(result.blocked, false);
    assert.equal(result.reason, null);
    assert.equal(result.validation.ok, true);
    assert.deepEqual(result.layoutEntry.layoutValue, { x: 12, y: 24 });
    assert.equal(result.layoutEntry.moduleId, "protokoll");
    assert.equal(result.layoutEntry.scopeId, "protokoll.topsScreen");
  });

  await run("Protokoll HostAdapter: gespeicherter Layoutwert wird geladen und resetbar", () => {
    const state = adapter.getCurrentLayoutState();
    assert.equal(state.length, 1);
    assert.equal(state[0].elementId, "protokoll.topsScreen.quicklane");
    assert.deepEqual(state[0].layoutValue, { x: 12, y: 24 });

    const resetResult = adapter.resetLayoutState({ elementId: "protokoll.topsScreen.quicklane" });
    assert.equal(resetResult.ok, true);
    assert.deepEqual(resetResult.layoutState, []);
    assert.deepEqual(adapter.getCurrentLayoutState(), []);
  });

  await run("Protokoll HostAdapter: Restarbeiten-ID wird im Protokoll-Scope blockiert", () => {
    const result = adapter.submitChangeRequest({
      ...validChangeRequest,
      elementId: "restarbeiten.quicklane",
    });
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "INVALID_CHANGE_REQUEST");
    assert.ok(result.validation.errors.some((error) => error.code === "ELEMENT_ID_UNKNOWN"));
  });

  await run("Protokoll HostAdapter: Fach-, DOM- und Datenbankwerte werden nicht gespeichert", () => {
    const forbiddenPayloads = [
      { topId: "top-1" },
      { projectId: "p-1" },
      { domNode: { id: "x" } },
      { database: "app.db" },
      { text: "Fachdaten" },
    ];

    for (const payload of forbiddenPayloads) {
      const result = adapter.submitChangeRequest({
        ...validChangeRequest,
        payload,
      });
      assert.equal(result.ok, false);
      assert.equal(result.blocked, true);
      assert.equal(result.reason, "INVALID_CHANGE_REQUEST");
    }

    assert.deepEqual(adapter.getCurrentLayoutState(), []);
  });

  await run("Protokoll HostAdapter: nicht erlaubte und verbotene Aktionen werden blockiert", () => {
    const labelResult = adapter.submitChangeRequest({
      ...validChangeRequest,
      operation: "label",
      payload: { label: "TOPS" },
    });
    assert.equal(labelResult.reason, "INVALID_CHANGE_REQUEST");
    assert.ok(labelResult.validation.errors.some((error) => error.code === "OPERATION_NOT_ALLOWED"));

    const deleteResult = adapter.submitChangeRequest({
      ...validChangeRequest,
      operation: "delete",
    });
    assert.equal(deleteResult.reason, "INVALID_CHANGE_REQUEST");
    assert.ok(deleteResult.validation.errors.some((error) => error.code === "FORBIDDEN_OPERATION"));
  });

  await run("Protokoll HostAdapter: Reset unbekannter elementId wird blockiert", () => {
    const result = adapter.resetLayoutState({ elementId: "protokoll.topsScreen.unknown" });
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "ELEMENT_ID_UNKNOWN");
  });

  if (!process.exitCode) console.log("protokollEditorHostAdapter.test.cjs passed");
}

module.exports = { runProtokollEditorHostAdapterTests };
