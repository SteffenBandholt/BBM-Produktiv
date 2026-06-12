const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const CATALOG_PATH = path.join(__dirname, "../../src/renderer/editorRuntime/catalog/bbmEditorCatalog.js");
const RESTARBEITEN_SCOPE_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/restarbeiten/editor/restarbeitenEditorScopes.js"
);
const SCOPE_TYPES_PATH = path.join(__dirname, "../../src/renderer/editorRuntime/scopes/editorScopeTypes.js");
const REGISTRY_MODEL_PATH = path.join(__dirname, "../../src/renderer/editorRuntime/registry/editorRegistryModel.js");
const REGISTRY_VALIDATOR_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/registry/editorRegistryValidator.js"
);
const HOST_CONTRACT_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js"
);
const VISIBILITY_POLICY_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/host/visibilityPersistenceScopePolicy.js"
);

async function runEditorRuntimeCatalogTests(run) {
  const [{ BBM_EDITOR_CATALOG, listEditorModules, findEditorScope }, scopeModule, scopeTypes, registryModel, validator, hostContract, visibilityPolicy] =
    await Promise.all([
      importEsmFromFile(CATALOG_PATH),
      importEsmFromFile(RESTARBEITEN_SCOPE_PATH),
      importEsmFromFile(SCOPE_TYPES_PATH),
      importEsmFromFile(REGISTRY_MODEL_PATH),
      importEsmFromFile(REGISTRY_VALIDATOR_PATH),
      importEsmFromFile(HOST_CONTRACT_PATH),
      importEsmFromFile(VISIBILITY_POLICY_PATH),
    ]);

  await run("EditorRuntime: Catalog existiert", () => {
    assert.equal(BBM_EDITOR_CATALOG.targetAppId, "bbm");
    assert.equal(Array.isArray(BBM_EDITOR_CATALOG.modules), true);
  });

  await run("EditorRuntime: Modul restarbeiten existiert", () => {
    const modules = listEditorModules();
    const restarbeiten = modules.find((module) => module.moduleId === "restarbeiten");
    assert.ok(restarbeiten);
    assert.equal(restarbeiten.moduleLabel, "Restarbeiten");
  });

  await run("EditorRuntime: Scope restarbeiten.ui.main existiert", () => {
    const scope = findEditorScope("restarbeiten.ui.main");
    assert.ok(scope);
    assert.equal(scope.scopeId, "restarbeiten.ui.main");
    assert.equal(scope.kind, "ui");
    assert.equal(scope.status, "ready");
    assert.equal(Array.isArray(scope.registry), true);
    assert.ok(scope.registry.length > 0);
  });

  await run("EditorRuntime: Restarbeiten-Scope-Helfer liefert den Ready-Scope", () => {
    const scopes = scopeModule.getRestarbeitenEditorScopes();
    const scope = scopes.find((entry) => entry.scopeId === scopeModule.RESTARBEITEN_MAIN_UI_SCOPE_ID);
    assert.ok(scope);
    assert.equal(scope.status, "ready");
    assert.equal(scope.moduleId, "restarbeiten");
    assert.equal(Array.isArray(scope.registry), true);
    assert.ok(scope.registry.length > 0);
  });

  await run("EditorRuntime: Scope-Typen sind fachneutral", () => {
    assert.deepEqual(scopeTypes.EDITOR_SCOPE_KINDS, ["ui", "pdf"]);
    assert.equal(scopeTypes.isEditorScopeKind("ui"), true);
    assert.equal(scopeTypes.isEditorScopeKind("pdf"), true);
    assert.equal(scopeTypes.isEditorScopeKind("audio"), false);
  });

  await run("EditorRuntime: Registry-Modell liefert erlaubte Typen und Rollen", () => {
    assert.equal(registryModel.isEditorElementType("root"), true);
    assert.equal(registryModel.isEditorElementType("grid"), false);
    assert.equal(registryModel.isEditorElementRole("layout"), true);
    assert.equal(registryModel.isEditorElementRole("factual"), false);
    assert.equal(registryModel.isEditorOperation("move"), true);
    assert.equal(registryModel.isEditorOperation("save"), false);
  });

  await run("EditorRuntime: Validator meldet minimale gueltige Registry ok=true", () => {
    const result = validator.validateEditorRegistry([
      {
        id: "bbm.root",
        name: "Root",
        type: "root",
        role: "system",
        parentId: null,
        order: 0,
        visible: true,
        editable: false,
        allowedOps: [],
        lockedOps: ["move"],
      },
    ]);
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  await run("EditorRuntime: Validator erkennt doppelte IDs", () => {
    const result = validator.validateEditorRegistry([
      {
        id: "bbm.root",
        name: "Root",
        type: "root",
        role: "system",
        parentId: null,
        order: 0,
        visible: true,
        editable: false,
        allowedOps: [],
        lockedOps: [],
      },
      {
        id: "bbm.root",
        name: "Duplicate",
        type: "area",
        role: "layout",
        parentId: "bbm.root",
        order: 1,
        visible: true,
        editable: true,
        allowedOps: ["move"],
        lockedOps: [],
      },
    ]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.code === "DUPLICATE_ID"));
  });

  await run("EditorRuntime: Validator erkennt ungueltige Operationen", () => {
    const result = validator.validateEditorRegistry([
      {
        id: "bbm.root",
        name: "Root",
        type: "root",
        role: "system",
        parentId: null,
        order: 0,
        visible: true,
        editable: false,
        allowedOps: [],
        lockedOps: [],
      },
      {
        id: "bbm.area",
        name: "Area",
        type: "area",
        role: "layout",
        parentId: "bbm.root",
        order: 1,
        visible: true,
        editable: true,
        allowedOps: ["save"],
        lockedOps: [],
      },
    ]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.code === "FACILITY_OPERATION_FORBIDDEN"));
  });

  await run("EditorRuntime: HostAdapter-Shape erkennt fehlende Methoden", () => {
    const result = hostContract.validateHostAdapterShape({
      getRegistry() {},
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((error) => error.methodName === "getHostContext"));
    assert.ok(result.errors.some((error) => error.methodName === "getCurrentLayoutState"));
    assert.ok(result.errors.some((error) => error.methodName === "getCapabilities"));
    assert.ok(result.errors.some((error) => error.methodName === "onPendingChangeRequestsChanged"));
    assert.ok(result.errors.some((error) => error.methodName === "submitChangeRequests"));
  });

  await run("EditorRuntime: Visibility-Persistenz-Policy erlaubt nur den Pilot-Scope", () => {
    assert.deepEqual(visibilityPolicy.VISIBILITY_PERSISTENCE_ALLOWED_SCOPES, ["restarbeiten.ui.main"]);
    assert.equal(visibilityPolicy.isVisibilityPersistenceAllowedForScope("restarbeiten.ui.main"), true);
    assert.equal(
      visibilityPolicy.isVisibilityPersistenceAllowedForScope("restarbeiten.ui.main", {
        targetAppId: "bbm",
        moduleId: "restarbeiten",
      }),
      true
    );
    assert.equal(visibilityPolicy.isVisibilityPersistenceAllowedForScope("protokoll.topsScreen"), false);
    assert.equal(visibilityPolicy.isVisibilityPersistenceAllowedForScope("restarbeiten.screen"), false);
    assert.equal(visibilityPolicy.isVisibilityPersistenceAllowedForScope("bbm.demo.editorMove"), false);
    assert.equal(visibilityPolicy.isVisibilityPersistenceAllowedForScope("unknown.scope"), false);
    assert.equal(visibilityPolicy.isVisibilityPersistenceAllowedForScope("*"), false);
    assert.deepEqual(
      visibilityPolicy.getVisibilityPersistenceAllowedScopesForContext({
        targetAppId: "bbm",
        moduleId: "protokoll",
      }),
      []
    );
  });

  await run("EditorRuntime: Contract blockiert persistente Visibility ausserhalb der Scope-Policy", () => {
    const result = hostContract.validatePersistentVisibilityChangeRequests([{
      changeId: "chg-policy-1",
      targetAppId: "bbm",
      moduleId: "protokoll",
      scopeId: "protokoll.topsScreen",
      elementId: "protokoll.root",
      operation: "visibility",
      payload: { visible: false },
      source: "preview",
      persistent: true,
    }], {
      scope: {
        targetAppId: "bbm",
        moduleId: "protokoll",
        scopeId: "protokoll.topsScreen",
      },
      registry: [
        { id: "protokoll.root", name: "Protokoll", allowedOps: ["inspect", "hide", "show"] },
      ],
      capabilities: {
        persistence: true,
        canPersistVisibility: true,
        dryRunOnly: false,
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.persistenceDisabled, true);
    assert.equal(result.canPersistVisibility, true);
    assert.equal(result.entries[0].persistable, false);
    assert.ok(result.errors.some((error) => error.code === "SCOPE_NOT_ALLOWED"));
  });

  await run("EditorRuntime: InMemory HostAdapter liefert Kontext, Registry und blockiert Persistenz", () => {
    const adapter = hostContract.createInMemoryBbmEditorHostAdapter({
      hostContext: {
        targetAppId: "sample-app",
        moduleId: "sample",
        activeUiScope: "sample.scope",
      },
      registeredElements: [
        { id: "sample.root", name: "Root", type: "container", role: "root", parentId: null, allowedOps: ["inspect"], lockedOps: [] },
      ],
      capabilities: {
        persistence: true,
        canPersistVisibility: true,
      },
    });

    assert.equal(hostContract.validateHostAdapterShape(adapter).ok, true);
    assert.deepEqual(adapter.getHostContext(), {
      targetAppId: "sample-app",
      moduleId: "sample",
      activeUiScope: "sample.scope",
      scopeId: "sample.scope",
    });
    assert.equal(adapter.getRegistry("sample.scope").elements[0].id, "sample.root");
    assert.deepEqual(adapter.getCurrentLayoutState(), []);
    assert.equal(adapter.getCapabilities().persistence, false);
    assert.equal(adapter.getCapabilities().canPersistVisibility, false);
    assert.equal(adapter.getCapabilities().dryRunOnly, true);
    assert.equal(adapter.onPendingChangeRequestsChanged([{ changeId: "chg-1" }]).persistent, false);
    const submitResult = adapter.submitChangeRequests([{
      changeId: "chg-visibility-1",
      targetAppId: "sample-app",
      moduleId: "sample",
      scopeId: "sample.scope",
      elementId: "sample.root",
      operation: "visibility",
      payload: { visible: false },
      source: "preview",
      persistent: true,
    }]);
    assert.equal(submitResult.ok, false);
    assert.equal(submitResult.blocked, true);
    assert.equal(submitResult.reason, "INVALID_CHANGE_REQUEST");
    assert.equal(submitResult.persistenceDisabled, true);
    assert.equal(submitResult.visibilityPersistenceDisabled, true);
    assert.equal(submitResult.canPersistVisibility, false);
    assert.equal(submitResult.dryRunOnly, true);
    assert.ok(submitResult.validation.errors.some((error) => error.code === "SCOPE_NOT_ALLOWED"));
    assert.equal(submitResult.changeRequests[0].persistent, true);
  });

  if (!process.exitCode) console.log("editorRuntime.catalog.test.cjs passed");
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

  runEditorRuntimeCatalogTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runEditorRuntimeCatalogTests };
