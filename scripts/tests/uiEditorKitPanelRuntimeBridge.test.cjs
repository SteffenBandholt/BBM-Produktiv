const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const PANEL_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js");
const PREVIEW_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js");
const KIT_PANEL_ESM_PATH = path.join(REPO_ROOT, "node_modules/ui-editor-kit/src/runtime/panel/index.mjs");

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

const EXPECTED_FUNCTION_EXPORTS = Object.freeze([
  "createDefaultPanelState",
  "normalizePanelPosition",
  "updatePanelPosition",
  "setPanelOpen",
  "buildPanelViewModel",
  "createPreviewButtons",
]);

function assertPanelBridgeContract() {
  assert.equal(fs.existsSync(PANEL_BRIDGE_PATH), true, "Panel-Runtime-Bridge fehlt.");
  assert.equal(fs.existsSync(KIT_PANEL_ESM_PATH), true, "Installierter Kit-Panel-ESM-Einstieg fehlt.");

  const bridgeSource = fs.readFileSync(PANEL_BRIDGE_PATH, "utf8");
  assert.equal(
    bridgeSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/panel/index.mjs";'
  );
  assert.equal(bridgeSource.includes("node_modules/ui-editor-kit/src/runtime/panel/index.mjs"), true);
  assert.equal(bridgeSource.includes("ui-editor-kit/runtime/panel"), false);

  for (const fragment of FORBIDDEN_BRIDGE_FRAGMENTS) {
    assert.equal(bridgeSource.includes(fragment), false, `Panel-Bridge enthaelt gesperrtes Fragment: ${fragment}`);
  }
}

function assertLauncherDoesNotUsePanelRuntimeYet() {
  const source = fs.readFileSync(LAUNCHER_PATH, "utf8");
  assert.equal(source.includes("uiEditorKitPanelRuntimeBridge.js"), false);
  assert.equal(source.includes("ui-editor-kit/runtime/panel"), false);
}

function assertPreviewBridgeUnchanged() {
  const source = fs.readFileSync(PREVIEW_BRIDGE_PATH, "utf8");
  assert.equal(
    source.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/preview/index.mjs";'
  );
}

function assertPanelRuntimeContract(runtime) {
  EXPECTED_FUNCTION_EXPORTS.forEach((exportName) => {
    assert.equal(typeof runtime[exportName], "function", `missing Kit Panel-Runtime bridge export: ${exportName}`);
  });

  assert.deepEqual(runtime.PANEL_DEFAULT_POSITION, {
    left: null,
    top: 132,
    right: 24,
    bottom: null,
  });

  assert.deepEqual(runtime.createDefaultPanelState(), {
    isOpen: true,
    position: {
      left: null,
      top: 132,
      right: 24,
      bottom: null,
    },
  });

  assert.deepEqual(runtime.normalizePanelPosition({ left: "16px", top: "-9", bottom: 20 }), {
    left: 16,
    top: 0,
    right: null,
    bottom: 20,
  });
}

async function runUiEditorKitPanelRuntimeBridgeTests(run) {
  await run("UI-Editor-kit Panel-Runtime-Bridge: Renderer-Pfad ist vorbereitet", async () => {
    assertPanelBridgeContract();
    assertLauncherDoesNotUsePanelRuntimeYet();
    assertPreviewBridgeUnchanged();

    const runtime = await importEsmFromFile(PANEL_BRIDGE_PATH);
    assertPanelRuntimeContract(runtime);
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

  runUiEditorKitPanelRuntimeBridgeTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runUiEditorKitPanelRuntimeBridgeTests };
