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

async function runEditorRuntimeCatalogTests(run) {
  const [{ BBM_EDITOR_CATALOG, listEditorModules, findEditorScope }, scopeModule, scopeTypes, registryModel, validator, hostContract] =
    await Promise.all([
      importEsmFromFile(CATALOG_PATH),
      importEsmFromFile(RESTARBEITEN_SCOPE_PATH),
      importEsmFromFile(SCOPE_TYPES_PATH),
      importEsmFromFile(REGISTRY_MODEL_PATH),
      importEsmFromFile(REGISTRY_VALIDATOR_PATH),
      importEsmFromFile(HOST_CONTRACT_PATH),
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
    assert.ok(result.errors.some((error) => error.methodName === "getCurrentLayoutState"));
    assert.ok(result.errors.some((error) => error.methodName === "submitChangeRequest"));
    assert.ok(result.errors.some((error) => error.methodName === "resetLayoutState"));
  });

  if (!process.exitCode) console.log("editorRuntime.catalog.test.cjs passed");
}

module.exports = { runEditorRuntimeCatalogTests };
