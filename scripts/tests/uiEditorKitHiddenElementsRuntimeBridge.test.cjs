const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { assertHiddenElementsRuntimeContract } = require("./uiEditorKitHiddenElementsRuntimeImport.test.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const HIDDEN_ELEMENTS_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitHiddenElementsRuntimeBridge.js");
const PANEL_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js");
const PREVIEW_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js");
const KIT_HIDDEN_ELEMENTS_ESM_PATH = path.join(REPO_ROOT, "node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs");

const FORBIDDEN_BRIDGE_FRAGMENTS = Object.freeze([
  "bbm",
  "BBM",
  "restarbeiten",
  "Kurztext",
  "editbox",
  "filterbar",
  "localStorage",
  "writeFile",
  "ipc",
  "db",
  "pdf",
  "PDF",
  "druck",
  "Druck",
]);

function assertHiddenElementsBridgeContract() {
  assert.equal(fs.existsSync(HIDDEN_ELEMENTS_BRIDGE_PATH), true, "Hidden-Elements-Runtime-Bridge fehlt.");
  assert.equal(fs.existsSync(KIT_HIDDEN_ELEMENTS_ESM_PATH), true, "Installierter Kit-Hidden-Elements-ESM-Einstieg fehlt.");

  const bridgeSource = fs.readFileSync(HIDDEN_ELEMENTS_BRIDGE_PATH, "utf8");
  assert.equal(
    bridgeSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs";'
  );
  assert.equal(bridgeSource.includes("node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs"), true);
  assert.equal(bridgeSource.includes("ui-editor-kit/runtime/hidden-elements"), false);

  for (const fragment of FORBIDDEN_BRIDGE_FRAGMENTS) {
    assert.equal(bridgeSource.includes(fragment), false, `Hidden-Elements-Bridge enthaelt gesperrtes Fragment: ${fragment}`);
  }
}

function assertLauncherUsesHiddenElementsRuntimeOnlyViaBridge() {
  const source = fs.readFileSync(LAUNCHER_PATH, "utf8");
  assert.equal(source.includes('from "./uiEditorKitHiddenElementsRuntimeBridge.js"'), true);
  assert.equal(source.includes("ui-editor-kit/runtime/hidden-elements"), false);
  assert.equal(source.includes("node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs"), false);
  assert.equal(source.includes("buildHiddenElementsPopoverViewModel"), false);
}

function assertExistingBridgesUnchanged() {
  const previewSource = fs.readFileSync(PREVIEW_BRIDGE_PATH, "utf8");
  const panelSource = fs.readFileSync(PANEL_BRIDGE_PATH, "utf8");

  assert.equal(
    previewSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/preview/index.mjs";'
  );
  assert.equal(
    panelSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/panel/index.mjs";'
  );
}

async function runUiEditorKitHiddenElementsRuntimeBridgeTests(run) {
  await run("UI-Editor-kit Hidden-Elements-Runtime-Bridge: Renderer-Pfad ist vorbereitet", async () => {
    assertHiddenElementsBridgeContract();
    assertLauncherUsesHiddenElementsRuntimeOnlyViaBridge();
    assertExistingBridgesUnchanged();

    const runtime = await importEsmFromFile(HIDDEN_ELEMENTS_BRIDGE_PATH);
    assertHiddenElementsRuntimeContract(runtime);
  });
}

if (require.main === module) {
  let failed = false;
  const run = async (name, fn) => {
    try {
      await fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed = true;
      console.error(`not ok - ${name}`);
      console.error(error?.stack || error?.message || error);
    }
  };

  runUiEditorKitHiddenElementsRuntimeBridgeTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runUiEditorKitHiddenElementsRuntimeBridgeTests };
