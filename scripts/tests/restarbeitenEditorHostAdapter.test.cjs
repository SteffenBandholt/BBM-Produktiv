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
  "../../src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js"
);

async function runRestarbeitenEditorHostAdapterTests(run) {
  const [{ createBbmEditorHostAdapter }, { validateHostAdapterShape }, layoutPersistence, registryModule] = await Promise.all([
    importEsmFromFile(HOST_FACTORY_PATH),
    importEsmFromFile(HOST_CONTRACT_PATH),
    importEsmFromFile(LAYOUT_PERSISTENCE_PATH),
    importEsmFromFile(REGISTRY_PATH),
  ]);

  const registry = registryModule.getRestarbeitenMainUiRegistry();
  const validChangeRequest = {
    changeId: "chg-1",
    targetAppId: "bbm",
    moduleId: "restarbeiten",
    scopeId: "restarbeiten.ui.main",
    elementId: "restarbeiten.editbox.text.short",
    operation: "move",
    payload: {
      x: 10,
      y: 20,
    },
    createdAt: "2026-06-08T22:30:00.000Z",
    source: "ui",
  };

  await run("Restarbeiten HostAdapter: Factory liefert Adapter fuer den Scope", () => {
    const adapter = createBbmEditorHostAdapter("restarbeiten.ui.main");
    assert.ok(adapter);
    assert.equal(typeof adapter.getRegistry, "function");
    assert.equal(typeof adapter.getCurrentLayoutState, "function");
    assert.equal(typeof adapter.submitChangeRequest, "function");
    assert.equal(typeof adapter.resetLayoutState, "function");
  });

  const layoutStorage = layoutPersistence.createEditorLayoutMemoryStorage();
  const adapter = createBbmEditorHostAdapter("restarbeiten.ui.main", { layoutStorage });

  await run("Restarbeiten HostAdapter: Shape ist valide", () => {
    const shape = validateHostAdapterShape(adapter);
    assert.equal(shape.ok, true);
    assert.deepEqual(shape.errors, []);
  });

  await run("Restarbeiten HostAdapter: Registry ist nicht leer", () => {
    const adapterRegistry = adapter.getRegistry();
    assert.equal(Array.isArray(adapterRegistry), true);
    assert.ok(adapterRegistry.length > 0);
    assert.equal(adapterRegistry[0].id, registry[0].id);
  });

  await run("Restarbeiten HostAdapter: Layout-State startet leer", () => {
    assert.deepEqual(adapter.getCurrentLayoutState(), []);
  });

  await run("Restarbeiten HostAdapter: gueltiger Change Request speichert neutralen Layoutwert", () => {
    const result = adapter.submitChangeRequest(validChangeRequest);
    assert.equal(result.ok, true);
    assert.equal(result.blocked, false);
    assert.equal(result.reason, null);
    assert.equal(result.validation.ok, true);
    assert.deepEqual(result.layoutEntry.layoutValue, { x: 10, y: 20 });
    assert.equal(result.layoutEntry.elementId, "restarbeiten.editbox.text.short");
    assert.equal(result.layoutEntry.operation, "move");
  });

  await run("Restarbeiten HostAdapter: gespeicherter Layoutwert wird wieder geladen", () => {
    const state = adapter.getCurrentLayoutState();
    assert.equal(state.length, 1);
    assert.equal(state[0].targetAppId, "bbm");
    assert.equal(state[0].moduleId, "restarbeiten");
    assert.equal(state[0].scopeId, "restarbeiten.ui.main");
    assert.equal(state[0].elementId, "restarbeiten.editbox.text.short");
    assert.deepEqual(state[0].layoutValue, { x: 10, y: 20 });
  });

  await run("Restarbeiten HostAdapter: neuer Adapter laedt denselben Layoutspeicher", () => {
    const secondAdapter = createBbmEditorHostAdapter("restarbeiten.ui.main", { layoutStorage });
    assert.deepEqual(secondAdapter.getCurrentLayoutState().map((entry) => entry.layoutValue), [{ x: 10, y: 20 }]);
  });

  await run("Restarbeiten HostAdapter: Reset entfernt gespeicherten Layoutwert", () => {
    const result = adapter.resetLayoutState({ elementId: "restarbeiten.editbox.text.short" });
    assert.equal(result.ok, true);
    assert.equal(result.blocked, false);
    assert.deepEqual(result.layoutState, []);
    assert.deepEqual(adapter.getCurrentLayoutState(), []);
  });

  await run("Restarbeiten HostAdapter: unbekannte elementId blockiert als INVALID_CHANGE_REQUEST", () => {
    const result = adapter.submitChangeRequest({
      ...validChangeRequest,
      elementId: "restarbeiten.editbox.text.unknown",
    });
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "INVALID_CHANGE_REQUEST");
    assert.equal(result.validation.ok, false);
    assert.ok(result.validation.errors.some((error) => error.code === "ELEMENT_ID_UNKNOWN"));
  });

  await run("Restarbeiten HostAdapter: delete und recordId werden abgelehnt", () => {
    const deleteResult = adapter.submitChangeRequest({
      ...validChangeRequest,
      operation: "delete",
    });
    assert.equal(deleteResult.reason, "INVALID_CHANGE_REQUEST");
    assert.ok(deleteResult.validation.errors.some((error) => error.code === "FORBIDDEN_OPERATION"));

    const recordIdResult = adapter.submitChangeRequest({
      ...validChangeRequest,
      payload: {
        recordId: "4711",
      },
    });
    assert.equal(recordIdResult.reason, "INVALID_CHANGE_REQUEST");
    assert.ok(recordIdResult.validation.errors.some((error) => error.code === "PAYLOAD_KEY_FORBIDDEN"));
  });

  await run("Restarbeiten HostAdapter: Fach-, DOM- und Datenbankwerte werden nicht gespeichert", () => {
    const forbiddenPayloads = [
      { projectId: "p-1" },
      { domNode: { id: "x" } },
      { database: "app.db" },
      { sql: "DROP TABLE x" },
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
      assert.equal(result.validation.ok, false);
    }

    assert.deepEqual(adapter.getCurrentLayoutState(), []);
  });

  await run("Restarbeiten HostAdapter: erlaubte, aber nicht layoutneutrale Operation wird blockiert", () => {
    const labelResult = adapter.submitChangeRequest({
      ...validChangeRequest,
      elementId: "restarbeiten.editbox.text.short.label",
      operation: "label",
      payload: {
        label: "Kurztext",
      },
    });

    assert.equal(labelResult.ok, false);
    assert.equal(labelResult.blocked, true);
    assert.equal(labelResult.reason, "OPERATION_NOT_LAYOUT_STORAGE_SAFE");
    assert.equal(labelResult.validation.ok, true);
    assert.deepEqual(adapter.getCurrentLayoutState(), []);
  });

  await run("Restarbeiten HostAdapter: Reset unbekannter elementId wird blockiert", () => {
    const result = adapter.resetLayoutState({ elementId: "restarbeiten.unknown" });
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "ELEMENT_ID_UNKNOWN");
  });

  if (!process.exitCode) console.log("restarbeitenEditorHostAdapter.test.cjs passed");
}

module.exports = { runRestarbeitenEditorHostAdapterTests };
