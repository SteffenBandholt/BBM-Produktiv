const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const CATALOG_PATH = path.join(__dirname, "../../src/renderer/editorRuntime/catalog/bbmEditorCatalog.js");
const SCOPE_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/restarbeiten/editor/restarbeitenEditorScopes.js"
);
const REGISTRY_PATH = path.join(
  __dirname,
  "../../src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js"
);
const VALIDATOR_PATH = path.join(
  __dirname,
  "../../src/renderer/editorRuntime/registry/editorRegistryValidator.js"
);

const RESTARBEITEN_FILES = [
  "src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js",
  "src/renderer/modules/restarbeiten/RestarbeitenQuicklane.js",
  "src/renderer/modules/restarbeiten/RestarbeitenFilterbar.js",
  "src/renderer/modules/restarbeiten/RestarbeitenMainBody.js",
  "src/renderer/modules/restarbeiten/RestarbeitenList.js",
  "src/renderer/modules/restarbeiten/RestarbeitenEditbox.js",
].map((file) => path.join(__dirname, "../../", file));

function readCombinedRestarbeitenSource() {
  return RESTARBEITEN_FILES.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n");
}

async function runRestarbeitenEditorRegistryDomAnchorsTests(run) {
  const [catalogModule, scopeModule, registryModule, validatorModule] = await Promise.all([
    importEsmFromFile(CATALOG_PATH),
    importEsmFromFile(SCOPE_PATH),
    importEsmFromFile(REGISTRY_PATH),
    importEsmFromFile(VALIDATOR_PATH),
  ]);
  const { findEditorScope, BBM_EDITOR_CATALOG } = catalogModule;
  const { validateEditorRegistry } = validatorModule;

  const source = readCombinedRestarbeitenSource();
  const registry = registryModule.getRestarbeitenMainUiRegistry();
  const registryIds = registry.map((entry) => entry.id);

  await run("Restarbeiten EditorRegistry: Scope bleibt als ready katalogisiert", () => {
    const scope = findEditorScope(scopeModule.RESTARBEITEN_MAIN_UI_SCOPE_ID);
    assert.ok(scope);
    assert.equal(scope.status, "ready");
    assert.equal(scope.kind, "ui");
  });

  await run("Restarbeiten EditorRegistry: Registry ist gueltig", () => {
    const result = validateEditorRegistry(registry);
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  await run("Restarbeiten EditorRegistry: Registry-IDs sind eindeutig", () => {
    assert.equal(new Set(registryIds).size, registryIds.length);
  });

  await run("Restarbeiten EditorRegistry: alle IDs sind in den Restarbeiten-Dateien verankert", () => {
    const missing = registryIds.filter((id) => {
      if (id.startsWith("restarbeiten.filterbar.location.level")) {
        return !source.includes("restarbeiten.filterbar.location.level");
      }
      if (id.startsWith("restarbeiten.editbox.location.level")) {
        return !source.includes("restarbeiten.editbox.location.level");
      }
      return !source.includes(id);
    });
    assert.deepEqual(missing, []);
  });

  await run("Restarbeiten EditorRegistry: Template-ID fuer Restarbeiten-Records ist vorhanden", () => {
    assert.equal(source.includes("data-ui-editor-template-id"), true);
    assert.equal(source.includes("restarbeiten.record"), true);
  });

  await run("Restarbeiten EditorRegistry: Registry-Scope-Helfer gibt denselben Scope aus", () => {
    const scopes = scopeModule.getRestarbeitenEditorScopes();
    assert.equal(scopes.length, 1);
    assert.equal(scopes[0].scopeId, scopeModule.RESTARBEITEN_MAIN_UI_SCOPE_ID);
    assert.equal(scopes[0].status, "ready");
    assert.equal(scopes[0].registry.length > 0, true);
  });

  await run("Restarbeiten EditorRegistry: Catalog verwendet den Ready-Scope", () => {
    const scope = BBM_EDITOR_CATALOG.modules[0].scopes[0];
    assert.equal(scope.scopeId, scopeModule.RESTARBEITEN_MAIN_UI_SCOPE_ID);
    assert.equal(scope.status, "ready");
    assert.equal(scope.registry.length > 0, true);
  });

  if (!process.exitCode) console.log("restarbeitenEditorRegistry.domAnchors.test.cjs passed");
}

module.exports = { runRestarbeitenEditorRegistryDomAnchorsTests };
