const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.join(__dirname, "../..");
const BOUNDARY_DOC = path.join(REPO_ROOT, "docs/EDITOR_M2_M4_BEWERTUNG.md");

const FILES_TO_CHECK = [
  path.join(REPO_ROOT, "src/renderer/editorRuntime/catalog/bbmEditorCatalog.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/changeRequests/editorChangeRequestModel.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/changeRequests/editorChangeRequestValidator.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/host/bbmEditorHostAdapterContract.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/host/bbmEditorHostAdapterFactory.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/inspector/editorLayoutControls.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/inspector/editorScopeInspector.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutPersistence.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/layout/editorLayoutStateModel.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/registry/editorRegistryModel.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/registry/editorRegistryValidator.js"),
  path.join(REPO_ROOT, "src/renderer/editorRuntime/scopes/editorScopeTypes.js"),
  path.join(REPO_ROOT, "src/renderer/modules/restarbeiten/editor/restarbeitenEditorScopes.js"),
  path.join(REPO_ROOT, "src/renderer/modules/restarbeiten/editor/restarbeitenMainUiHostAdapter.js"),
  path.join(REPO_ROOT, "src/renderer/modules/restarbeiten/editor/registries/restarbeitenMainUiRegistry.js"),
];

const FORBIDDEN_IMPORTS = [
  "src/renderer/editor.js",
  "src/renderer/editor.html",
  "src/main/ipc/editorIpc.js",
  "src/renderer/uiEditor/demo",
  "src/renderer/uiV2/editorLab",
  "src/renderer/uiV2/editorV2",
];

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

async function runEditorBoundarySafetyTests(run) {
  for (const filePath of FILES_TO_CHECK) {
    const source = readSource(filePath);
    await run(`Editor boundary: ${path.relative(REPO_ROOT, filePath)} bleibt frei von Legacy-/Demo-Imports`, () => {
      for (const forbidden of FORBIDDEN_IMPORTS) {
        assert.equal(
          source.includes(forbidden),
          false,
          `${path.relative(REPO_ROOT, filePath)} must not import ${forbidden}`
        );
      }
    });
  }

  await run("Editor boundary: Bewertungsdokument existiert", () => {
    assert.equal(fs.existsSync(BOUNDARY_DOC), true);
    const doc = readSource(BOUNDARY_DOC);
    assert.equal(doc.includes("M2"), true);
    assert.equal(doc.includes("M3"), true);
    assert.equal(doc.includes("M4"), true);
  });

  await run("Editor boundary: funktionierende UI-Editor-Registrierung bleibt separat", () => {
    const registrySource = readSource(path.join(REPO_ROOT, "src/renderer/uiEditor/bbmUiEditorRegistry.js"));
    assert.equal(registrySource.includes("getRestarbeitenUiEditorElements"), true);
    assert.equal(registrySource.includes("getBbmUiEditorDemoElements"), true);
    assert.equal(registrySource.includes("getProtokollUiEditorElements"), true);
  });

  await run("Editor boundary: funktionierende UI-Editor-kit-Registry bleibt unberuehrt", () => {
    const registrySource = readSource(path.join(REPO_ROOT, "src/renderer/uiEditor/bbmUiEditorRegistry.js"));
    assert.equal(registrySource.includes("editorRuntime"), false);
  });
}

if (require.main === module) {
  const run = (name, fn) => {
    try {
      fn();
      console.log(`ok - ${name}`);
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err?.stack || err?.message || err);
      process.exitCode = 1;
    }
  };

  runEditorBoundarySafetyTests(run);
}

module.exports = { runEditorBoundarySafetyTests };
