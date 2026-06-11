const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js");
const KIT_ESM_PATH = path.join(REPO_ROOT, "node_modules/ui-editor-kit/src/runtime/preview/index.mjs");
const LOCAL_PREVIEW_RUNTIME_DIR = path.join(REPO_ROOT, "src/renderer/editorRuntime/preview");

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

function assertLauncherUsesBridgeOnly() {
  const source = fs.readFileSync(LAUNCHER_PATH, "utf8");
  assert.equal(source.includes('from "./uiEditorKitPreviewRuntimeBridge.js"'), true);
  assert.equal(source.includes('from "ui-editor-kit/runtime/preview"'), false);
  assert.equal(source.includes('from "../editorRuntime/preview/index.js"'), false);
}

function assertBridgeContract() {
  const bridgeSource = fs.readFileSync(BRIDGE_PATH, "utf8");
  assert.equal(
    bridgeSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/preview/index.mjs";'
  );

  for (const fragment of FORBIDDEN_BRIDGE_FRAGMENTS) {
    assert.equal(bridgeSource.includes(fragment), false, `Bridge enthaelt gesperrtes Fragment: ${fragment}`);
  }
}

function assertKitEsmIsBrowserNative() {
  const kitSource = fs.readFileSync(KIT_ESM_PATH, "utf8");
  assert.equal(kitSource.includes(".cjs"), false, "Kit-ESM-Einstieg darf keine CommonJS-Datei importieren.");
  assert.equal(kitSource.includes("require"), false, "Kit-ESM-Einstieg darf kein require enthalten.");
  assert.equal(kitSource.includes("createRequire"), false, "Kit-ESM-Einstieg darf kein createRequire enthalten.");
}

function assertNoLocalPreviewRuntime() {
  assert.equal(fs.existsSync(LOCAL_PREVIEW_RUNTIME_DIR), false, "Lokale BBM-Preview-Runtime darf nicht mehr produktiv im Repo liegen.");
}

function assertRuntimeContract(activeRuntime) {
  assert.equal(activeRuntime.getChangeRequestOperation("resizeWidth"), "width");
  assert.equal(activeRuntime.getChangeRequestOperation("resizeHeight"), "height");
  assert.equal(activeRuntime.getChangeRequestOperation("hide"), "visibility");
  assert.equal(activeRuntime.getChangeRequestOperation("show"), "visibility");
  assert.equal(activeRuntime.getPreviewTargetMode({ previewTargetMode: "self" }), "self");
  assert.equal(activeRuntime.getPreviewTargetMode({ previewTargetMode: "parent" }), "parent");
  assert.equal(activeRuntime.UNKNOWN_PREVIEW_TARGET_APP_ID, "unknown-host");
}

async function runUiEditorKitPreviewRuntimeBridgeParityTests(run) {
  await run("UI-Editor-kit Preview-Runtime-Bridge: produktiver Renderer-Pfad ist abgesichert", async () => {
    assertLauncherUsesBridgeOnly();
    assertBridgeContract();
    assertKitEsmIsBrowserNative();
    assertNoLocalPreviewRuntime();

    const activeRuntime = await importEsmFromFile(BRIDGE_PATH);
    assertRuntimeContract(activeRuntime);
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

  runUiEditorKitPreviewRuntimeBridgeParityTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runUiEditorKitPreviewRuntimeBridgeParityTests };
