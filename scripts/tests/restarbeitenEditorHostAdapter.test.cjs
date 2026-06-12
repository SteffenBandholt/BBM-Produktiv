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
const HOST_ADAPTER_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js"
);
const REGISTRY_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js"
);

async function runRestarbeitenEditorHostAdapterTests(run) {
  const [{ createBbmEditorHostAdapter }, { validateHostAdapterShape }, registryModule] = await Promise.all([
    importEsmFromFile(HOST_FACTORY_PATH),
    importEsmFromFile(HOST_CONTRACT_PATH),
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
    assert.equal(typeof adapter.getHostContext, "function");
    assert.equal(typeof adapter.getRegistry, "function");
    assert.equal(typeof adapter.getCurrentLayoutState, "function");
    assert.equal(typeof adapter.getCapabilities, "function");
    assert.equal(typeof adapter.onPendingChangeRequestsChanged, "function");
    assert.equal(typeof adapter.submitChangeRequests, "function");
    assert.equal(typeof adapter.submitChangeRequest, "function");
  });

  const adapter = createBbmEditorHostAdapter("restarbeiten.ui.main");

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

  await run("Restarbeiten HostAdapter: HostContext und Capabilities bleiben ohne Persistenz", () => {
    assert.deepEqual(adapter.getHostContext(), {
      targetAppId: "bbm",
      moduleId: "restarbeiten",
      activeUiScope: "restarbeiten.ui.main",
      scopeId: "restarbeiten.ui.main",
    });
    const capabilities = adapter.getCapabilities();
    assert.equal(capabilities.selection, true);
    assert.equal(capabilities.preview, true);
    assert.equal(capabilities.pendingChangeRequests, true);
    assert.equal(capabilities.persistence, false);
    assert.equal(capabilities.canPersistVisibility, false);
    assert.equal(capabilities.dryRunOnly, true);
  });

  await run("Restarbeiten HostAdapter: Layout-State startet leer", () => {
    assert.deepEqual(adapter.getCurrentLayoutState(), []);
  });

  await run("Restarbeiten HostAdapter: Pending ChangeRequests bleiben in-memory", () => {
    const result = adapter.onPendingChangeRequestsChanged([validChangeRequest]);
    assert.equal(result.ok, true);
    assert.equal(result.persistent, false);
    assert.equal(result.count, 1);
  });

  await run("Restarbeiten HostAdapter: ChangeRequests koennen nicht persistiert werden", () => {
    const result = adapter.submitChangeRequests([validChangeRequest]);
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "PERSISTENCE_DISABLED");
    assert.equal(result.persistenceDisabled, true);
    assert.equal(result.canPersistVisibility, false);
    assert.equal(result.dryRunOnly, true);
  });

  await run("Restarbeiten HostAdapter: persistent Visibility-Requests bleiben blockiert", () => {
    const persistentVisibilityRequest = {
      ...validChangeRequest,
      changeId: "chg-visibility-persistent-1",
      operation: "visibility",
      payload: {
        visible: false,
      },
      source: "preview",
      persistent: true,
    };
    const result = adapter.submitChangeRequests([persistentVisibilityRequest]);
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "PERSISTENCE_DISABLED");
    assert.equal(result.persistenceDisabled, true);
    assert.equal(result.visibilityPersistenceDisabled, true);
    assert.equal(result.canPersistVisibility, false);
    assert.equal(result.dryRunOnly, true);
    assert.equal(result.changeRequests.length, 1);
    assert.equal(result.changeRequests[0].operation, "visibility");
    assert.equal(result.changeRequests[0].persistent, true);
    assert.deepEqual(result.changeRequests[0].payload, { visible: false });
  });

  await run("Restarbeiten HostAdapter: bleibt ohne Storage-, IPC- und DB-Schreibweg", () => {
    const source = require("node:fs").readFileSync(HOST_ADAPTER_PATH, "utf8");
    for (const forbidden of [
      "localStorage",
      "sessionStorage",
      "writeFile",
      "ipcRenderer",
      "ipcMain",
      ".prepare(",
      ".run(",
    ]) {
      assert.equal(source.includes(forbidden), false, forbidden);
    }
  });

  await run("Restarbeiten HostAdapter: gueltiger Change Request wird nur blockiert", () => {
    const result = adapter.submitChangeRequest(validChangeRequest);
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "PERSISTENCE_DISABLED");
    assert.equal(result.persistenceDisabled, true);
    assert.equal(result.dryRunOnly, true);
    assert.equal(result.validation.ok, true);
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

  if (!process.exitCode) console.log("restarbeitenEditorHostAdapter.test.cjs passed");
}

module.exports = { runRestarbeitenEditorHostAdapterTests };
