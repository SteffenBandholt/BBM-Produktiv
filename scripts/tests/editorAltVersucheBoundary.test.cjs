const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.join(__dirname, "../..");
const DOC_PATH = path.join(REPO_ROOT, "docs/EDITOR_ALT_VERSUCHE_SICHERUNG.md");

const CURRENT_EDITOR_FILES = [
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

const FORBIDDEN_IMPORT_MARKERS = [
  "src/renderer/editor.js",
  "src/renderer/editor.html",
  "src/main/ipc/editorIpc.js",
  "src/renderer/uiEditor/demo",
  "src/renderer/uiV2/editorLab",
  "src/renderer/uiV2/editorV2",
];

const DOC_MUST_CONTAIN = [
  "src/renderer/editor.html",
  "src/renderer/editor.js",
  "src/main/ipc/editorIpc.js",
  "uiEditor/demo",
  "uiV2/editorLab",
  "uiV2/editorV2",
  "data-ui-v2-id",
];

function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

async function runEditorAltVersucheBoundaryTests(run) {
  await run("Editor alt-guard: Dokument existiert und nennt die gesicherten Altpfade", () => {
    assert.equal(fs.existsSync(DOC_PATH), true);
    const doc = readSource(DOC_PATH);
    for (const needle of DOC_MUST_CONTAIN) {
      assert.equal(doc.includes(needle), true, `document must mention ${needle}`);
    }
    assert.equal(doc.includes("M3/M4"), true);
    assert.equal(doc.includes("nicht als Ersatz"), true);
  });

  for (const filePath of CURRENT_EDITOR_FILES) {
    await run(`Editor alt-guard: ${path.relative(REPO_ROOT, filePath)} importiert keine alten Demo-/Lab-/Legacy-Pfade`, () => {
      const source = readSource(filePath);
      for (const forbidden of FORBIDDEN_IMPORT_MARKERS) {
        assert.equal(
          source.includes(forbidden),
          false,
          `${path.relative(REPO_ROOT, filePath)} must not import ${forbidden}`
        );
      }
    });
  }
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

  runEditorAltVersucheBoundaryTests(run).then(() => {
    if (!process.exitCode) console.log("editorAltVersucheBoundary.test.cjs passed");
  });
}

module.exports = { runEditorAltVersucheBoundaryTests };
