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
  const [{ createBbmEditorHostAdapter }, { validateHostAdapterShape }, registryModule, adapterModule] = await Promise.all([
    importEsmFromFile(HOST_FACTORY_PATH),
    importEsmFromFile(HOST_CONTRACT_PATH),
    importEsmFromFile(REGISTRY_PATH),
    importEsmFromFile(HOST_ADAPTER_PATH),
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

  await run("Restarbeiten HostAdapter: HostContext und Capabilities aktivieren nur Pilot-Visibility-Persistenz", () => {
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
    assert.equal(capabilities.persistence, true);
    assert.equal(capabilities.canPersistVisibility, true);
    assert.equal(capabilities.dryRunOnly, false);
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

  await run("Restarbeiten HostAdapter: Nicht-Visibility-ChangeRequests bleiben blockiert", async () => {
    const result = await adapter.submitChangeRequests([validChangeRequest]);
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "PERSISTENCE_DISABLED");
    assert.equal(result.persistenceDisabled, true);
    assert.equal(result.canPersistVisibility, false);
    assert.equal(result.dryRunOnly, true);
  });

  await run("Restarbeiten HostAdapter: persistent Visibility-Requests werden im Pilot-Scope gespeichert", async () => {
    const savedOverrides = [];
    const storageAdapter = adapterModule.createRestarbeitenMainUiHostAdapter({
      storageApi: {
        async list() {
          return { ok: true, data: savedOverrides };
        },
        async save(override) {
          const record = {
            ...override,
            createdAt: override.createdAt || "2026-06-08T22:30:00.000Z",
            updatedAt: "2026-06-08T22:31:00.000Z",
          };
          const index = savedOverrides.findIndex((entry) => entry.elementId === record.elementId);
          if (index >= 0) {
            savedOverrides.splice(index, 1, record);
          } else {
            savedOverrides.push(record);
          }
          return { ok: true, data: record };
        },
      },
    });
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
    const result = await storageAdapter.submitChangeRequests([persistentVisibilityRequest]);
    assert.equal(result.ok, true);
    assert.equal(result.accepted, true);
    assert.equal(result.persisted, true);
    assert.equal(result.reason, "PERSISTED");
    assert.equal(result.validation.ok, true);
    assert.equal(result.validation.count, 1);
    assert.equal(result.validation.entries[0].validation.ok, true);
    assert.equal(result.validation.entries[0].persistable, true);
    assert.deepEqual(result.validation.entries[0].override.overrides, { visible: false });
    assert.equal(result.changeRequests.length, 1);
    assert.equal(result.changeRequests[0].operation, "visibility");
    assert.equal(result.changeRequests[0].persistent, true);
    assert.deepEqual(result.changeRequests[0].payload, { visible: false });
    assert.equal(savedOverrides.length, 1);
    assert.equal(savedOverrides[0].scopeId, "restarbeiten.ui.main");
    assert.equal(savedOverrides[0].elementId, "restarbeiten.editbox.text.short");
    assert.deepEqual(savedOverrides[0].overrides, { visible: false });
    assert.deepEqual(storageAdapter.getCurrentLayoutState()[0].overrides, { visible: false });

    const showResult = await storageAdapter.submitChangeRequests([{
      ...persistentVisibilityRequest,
      changeId: "chg-visibility-persistent-2",
      payload: { visible: true },
    }]);
    assert.equal(showResult.ok, true);
    assert.equal(showResult.changeRequests[0].operation, "visibility");
    assert.equal(showResult.changeRequests[0].persistent, true);
    assert.deepEqual(showResult.changeRequests[0].payload, { visible: true });
    assert.equal(showResult.saved[0].overrides.visible, true);
    assert.deepEqual(storageAdapter.getCurrentLayoutState()[0].overrides, { visible: true });
  });

  await run("Restarbeiten HostAdapter: Restore-Zyklus liest gespeicherte Visibility-Overrides neu ein", async () => {
    const savedOverrides = [];
    const storageApi = {
      async list(filter) {
        return {
          ok: true,
          data: savedOverrides.filter((entry) => (
            entry.targetAppId === filter.targetAppId
            && entry.moduleId === filter.moduleId
            && entry.scopeId === filter.scopeId
          )),
        };
      },
      async save(override) {
        const record = {
          ...override,
          createdAt: override.createdAt || "2026-06-08T22:30:00.000Z",
          updatedAt: "2026-06-08T22:31:00.000Z",
        };
        const index = savedOverrides.findIndex((entry) => (
          entry.targetAppId === record.targetAppId
          && entry.moduleId === record.moduleId
          && entry.scopeId === record.scopeId
          && entry.elementId === record.elementId
        ));
        if (index >= 0) {
          savedOverrides.splice(index, 1, record);
        } else {
          savedOverrides.push(record);
        }
        return { ok: true, data: record };
      },
    };
    const firstAdapter = adapterModule.createRestarbeitenMainUiHostAdapter({ storageApi });
    const registryBefore = firstAdapter.getRegistry();
    const persistentVisibilityRequest = {
      ...validChangeRequest,
      changeId: "chg-visibility-restore-1",
      operation: "visibility",
      payload: { visible: false },
      source: "preview",
      persistent: true,
    };

    const saveHiddenResult = await firstAdapter.submitChangeRequests([persistentVisibilityRequest]);
    assert.equal(saveHiddenResult.ok, true);
    assert.equal(savedOverrides.length, 1);
    assert.deepEqual(savedOverrides[0].overrides, { visible: false });

    const restoredHiddenAdapter = adapterModule.createRestarbeitenMainUiHostAdapter({ storageApi });
    const restoreHiddenResult = await restoredHiddenAdapter.loadCurrentLayoutState();
    assert.equal(restoreHiddenResult.ok, true);
    assert.equal(restoreHiddenResult.layoutState.length, 1);
    assert.equal(restoreHiddenResult.layoutState[0].scopeId, "restarbeiten.ui.main");
    assert.equal(restoreHiddenResult.layoutState[0].elementId, "restarbeiten.editbox.text.short");
    assert.deepEqual(restoreHiddenResult.layoutState[0].overrides, { visible: false });
    assert.equal(restoreHiddenResult.layoutState[0].visible, false);
    assert.deepEqual(restoredHiddenAdapter.getCurrentLayoutState()[0].overrides, { visible: false });
    assert.equal(restoredHiddenAdapter.getCurrentLayoutState()[0].visible, false);
    assert.deepEqual(restoredHiddenAdapter.getRegistry(), registryBefore);

    const saveVisibleResult = await firstAdapter.submitChangeRequests([{
      ...persistentVisibilityRequest,
      changeId: "chg-visibility-restore-2",
      payload: { visible: true },
    }]);
    assert.equal(saveVisibleResult.ok, true);
    assert.equal(savedOverrides.length, 1);
    assert.deepEqual(savedOverrides[0].overrides, { visible: true });

    const restoredVisibleAdapter = adapterModule.createRestarbeitenMainUiHostAdapter({ storageApi });
    const restoreVisibleResult = await restoredVisibleAdapter.loadCurrentLayoutState();
    assert.equal(restoreVisibleResult.ok, true);
    assert.deepEqual(restoredVisibleAdapter.getCurrentLayoutState()[0].overrides, { visible: true });
    assert.equal(restoredVisibleAdapter.getCurrentLayoutState()[0].visible, true);
    assert.deepEqual(restoredVisibleAdapter.getRegistry(), registryBefore);
  });

  await run("Restarbeiten HostAdapter: persistent Visibility ohne Storage wird klar blockiert", async () => {
    const result = await adapter.submitChangeRequests([{
      ...validChangeRequest,
      changeId: "chg-visibility-no-storage-1",
      operation: "visibility",
      payload: {
        visible: false,
      },
      source: "preview",
      persistent: true,
    }]);

    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "STORAGE_UNAVAILABLE");
    assert.equal(result.canPersistVisibility, true);
    assert.equal(result.dryRunOnly, false);
  });

  await run("Restarbeiten HostAdapter: invalides persistent Visibility-Payload wird abgelehnt", async () => {
    const result = await adapter.submitChangeRequests([{
      ...validChangeRequest,
      changeId: "chg-visibility-invalid-visible-1",
      operation: "visibility",
      payload: {
        visible: "false",
      },
      source: "preview",
      persistent: true,
    }]);

    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "INVALID_CHANGE_REQUEST");
    assert.equal(result.persistenceDisabled, false);
    assert.equal(result.visibilityPersistenceDisabled, true);
    assert.equal(result.canPersistVisibility, true);
    assert.equal(result.dryRunOnly, false);
    assert.equal(result.validation.ok, false);
    assert.ok(result.validation.errors.some((error) => error.code === "VISIBLE_NOT_BOOLEAN"));
  });

  await run("Restarbeiten HostAdapter: unbekannte persistent Visibility-elementId wird abgelehnt", async () => {
    const result = await adapter.submitChangeRequests([{
      ...validChangeRequest,
      changeId: "chg-visibility-unknown-element-1",
      elementId: "restarbeiten.editbox.text.unknown",
      operation: "visibility",
      payload: {
        visible: false,
      },
      source: "preview",
      persistent: true,
    }]);

    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "INVALID_CHANGE_REQUEST");
    assert.equal(result.persistenceDisabled, false);
    assert.equal(result.visibilityPersistenceDisabled, true);
    assert.equal(result.canPersistVisibility, true);
    assert.equal(result.dryRunOnly, false);
    assert.equal(result.validation.ok, false);
    assert.ok(result.validation.errors.some((error) => error.code === "ELEMENT_ID_UNKNOWN"));
  });

  await run("Restarbeiten HostAdapter: anderer Scope wird nicht gespeichert", async () => {
    const savedOverrides = [];
    const storageAdapter = adapterModule.createRestarbeitenMainUiHostAdapter({
      storageApi: {
        async save(override) {
          savedOverrides.push(override);
          return { ok: true, data: override };
        },
      },
    });
    const result = await storageAdapter.submitChangeRequests([{
      ...validChangeRequest,
      changeId: "chg-visibility-other-scope-1",
      scopeId: "protokoll.topsScreen",
      operation: "visibility",
      payload: {
        visible: false,
      },
      source: "preview",
      persistent: true,
    }]);

    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "INVALID_CHANGE_REQUEST");
    assert.equal(result.validation.ok, false);
    assert.ok(result.validation.errors.some((error) => error.code === "SCOPE_NOT_ALLOWED"));
    assert.equal(savedOverrides.length, 0);
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

  await run("Restarbeiten HostAdapter: gueltiger Change Request wird nur blockiert", async () => {
    const result = await adapter.submitChangeRequest(validChangeRequest);
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "PERSISTENCE_DISABLED");
    assert.equal(result.persistenceDisabled, true);
    assert.equal(result.dryRunOnly, true);
    assert.equal(result.validation.ok, true);
  });

  await run("Restarbeiten HostAdapter: unbekannte elementId blockiert als INVALID_CHANGE_REQUEST", async () => {
    const result = await adapter.submitChangeRequest({
      ...validChangeRequest,
      elementId: "restarbeiten.editbox.text.unknown",
    });
    assert.equal(result.ok, false);
    assert.equal(result.blocked, true);
    assert.equal(result.reason, "INVALID_CHANGE_REQUEST");
    assert.equal(result.validation.ok, false);
    assert.ok(result.validation.errors.some((error) => error.code === "ELEMENT_ID_UNKNOWN"));
  });

  await run("Restarbeiten HostAdapter: delete und recordId werden abgelehnt", async () => {
    const deleteResult = await adapter.submitChangeRequest({
      ...validChangeRequest,
      operation: "delete",
    });
    assert.equal(deleteResult.reason, "INVALID_CHANGE_REQUEST");
    assert.ok(deleteResult.validation.errors.some((error) => error.code === "FORBIDDEN_OPERATION"));

    const recordIdResult = await adapter.submitChangeRequest({
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

  runRestarbeitenEditorHostAdapterTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runRestarbeitenEditorHostAdapterTests };
