const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const INSPECTOR_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/inspector/editorScopeInspector.js"
);
const CATALOG_PATH = path.join(__dirname, "../../src/renderer/editorRuntime/catalog/bbmEditorCatalog.js");
const HOST_FACTORY_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/host/bbmEditorHostAdapterFactory.js"
);
const DETAILS_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/inspector/editorElementDetails.js"
);

async function runEditorScopeInspectorTests(run) {
  const [inspectorModule, catalogModule, hostFactoryModule, detailsModule] = await Promise.all([
    importEsmFromFile(INSPECTOR_PATH),
    importEsmFromFile(CATALOG_PATH),
    importEsmFromFile(HOST_FACTORY_PATH),
    importEsmFromFile(DETAILS_PATH),
  ]);

  const inspector = inspectorModule.createEditorScopeInspector({
    catalog: catalogModule.BBM_EDITOR_CATALOG,
    hostAdapterFactory: hostFactoryModule.createBbmEditorHostAdapter,
  });

  await run("EditorScopeInspector: listet Modul restarbeiten", () => {
    const modules = inspector.getAvailableModules();
    assert.ok(modules.some((module) => module.moduleId === "restarbeiten"));
  });

  await run("EditorScopeInspector: listet Scope restarbeiten.ui.main", () => {
    const scopes = inspector.getAvailableScopes();
    assert.ok(scopes.some((scope) => scope.scopeId === "restarbeiten.ui.main"));
  });

  const result = inspector.inspectScope("restarbeiten.ui.main");

  await run("EditorScopeInspector: inspectScope ist ok", () => {
    assert.equal(result.ok, true);
    assert.ok(result.scope);
    assert.equal(result.scope.scopeId, "restarbeiten.ui.main");
  });

  await run("EditorScopeInspector: Registry ist nicht leer", () => {
    assert.equal(Array.isArray(result.registry), true);
    assert.ok(result.registry.length > 0);
  });

  await run("EditorScopeInspector: Registry-Validation ist ok", () => {
    assert.equal(result.registryValidation.ok, true);
    assert.deepEqual(result.registryValidation.errors, []);
  });

  await run("EditorScopeInspector: Baum hat root restarbeiten.root", () => {
    assert.ok(result.treeResult.tree);
    assert.equal(result.treeResult.tree.id, "restarbeiten.root");
  });

  await run("EditorScopeInspector: Elementdetails fuer Kurztext sind verfuegbar", () => {
    const detailsResult = detailsModule.getEditorElementDetails(result.registry, "restarbeiten.editbox.text.short");
    assert.equal(detailsResult.ok, true);
    assert.ok(detailsResult.details);
    assert.equal(detailsResult.details.id, "restarbeiten.editbox.text.short");
    assert.equal(detailsResult.details.type, "field");
    assert.equal(detailsResult.details.role, "content");
  });

  await run("EditorScopeInspector: effectiveOps enthalten nur erlaubte und nicht gesperrte Operationen", () => {
    const detailsResult = detailsModule.getEditorElementDetails(result.registry, "restarbeiten.editbox.text.short");
    const operationsResult = detailsModule.listEditorElementOperations(
      result.registry,
      "restarbeiten.editbox.text.short"
    );
    assert.equal(operationsResult.ok, true);
    assert.ok(detailsResult.details.effectiveOps.includes("move"));
    assert.ok(!detailsResult.details.effectiveOps.includes("save"));
    assert.deepEqual(operationsResult.operations.effectiveOps, detailsResult.details.effectiveOps);
  });

  await run("EditorScopeInspector: unbekannter Scope wird sauber behandelt", () => {
    const unknown = inspector.inspectScope("does.not.exist");
    assert.equal(unknown.ok, false);
    assert.ok(unknown.errors.length > 0);
  });

  await run("EditorScopeInspector: kein DOM oder window erforderlich", () => {
    assert.equal(typeof globalThis.window, "undefined");
    assert.equal(typeof globalThis.document, "undefined");
  });

  if (!process.exitCode) console.log("editorScopeInspector.test.cjs passed");
}

module.exports = { runEditorScopeInspectorTests };
