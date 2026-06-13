const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const DRAG_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitDragRuntimeBridge.js");
const PREVIEW_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js");
const PANEL_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js");
const HIDDEN_ELEMENTS_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitHiddenElementsRuntimeBridge.js");
const SURFACE_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js");
const KIT_DRAG_ESM_PATH = path.join(REPO_ROOT, "node_modules/ui-editor-kit/src/runtime/drag/index.mjs");

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
  "DB",
  "persist",
  "Persist",
  "druck",
  "Druck",
  "addEventListener",
  "PointerEvent",
  "MouseEvent",
]);

const EXPECTED_FUNCTION_EXPORTS = Object.freeze([
  "normalizeDragBounds",
  "validateDragBounds",
  "normalizeDragDelta",
  "validateDragDelta",
  "applyDragDelta",
  "clampBoundsToConstraints",
  "buildDragResult",
  "isSupportedDragCoordinateSystem",
]);

function assertDragBridgeContract() {
  assert.equal(fs.existsSync(DRAG_BRIDGE_PATH), true, "Drag-Runtime-Bridge fehlt.");
  assert.equal(fs.existsSync(KIT_DRAG_ESM_PATH), true, "Installierter Kit-Drag-ESM-Einstieg fehlt.");

  const bridgeSource = fs.readFileSync(DRAG_BRIDGE_PATH, "utf8");
  assert.equal(
    bridgeSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/drag/index.mjs";'
  );
  assert.equal(bridgeSource.includes("node_modules/ui-editor-kit/src/runtime/drag/index.mjs"), true);
  assert.equal(bridgeSource.includes("ui-editor-kit/runtime/drag"), false);

  for (const fragment of FORBIDDEN_BRIDGE_FRAGMENTS) {
    assert.equal(bridgeSource.includes(fragment), false, `Drag-Bridge enthaelt gesperrtes Fragment: ${fragment}`);
  }
}

function assertLauncherUsesDragRuntimeOnlyViaBridgeForPanelPosition() {
  const source = fs.readFileSync(LAUNCHER_PATH, "utf8");
  assert.equal(source.includes('import { buildDragResult } from "./uiEditorKitDragRuntimeBridge.js";'), true);
  assert.equal(source.includes("ui-editor-kit/runtime/drag"), false);
  assert.equal(source.includes("node_modules/ui-editor-kit/src/runtime/drag/index.mjs"), false);
  assert.equal(source.includes("calculatePreviewPanelDragPositionWithRuntime"), true);
  assert.equal(source.includes("coordinateSystem: \"css-pixels\""), true);
  assert.equal(source.includes("pdf-points"), false);
  assert.equal(source.includes("canvas-pixels"), false);
  assert.equal(source.includes("addEventListener(\"mousemove\""), true);
  assert.equal(source.includes("addEventListener(\"mouseup\""), true);
}

function assertExistingBridgesUnchanged() {
  const previewSource = fs.readFileSync(PREVIEW_BRIDGE_PATH, "utf8");
  const panelSource = fs.readFileSync(PANEL_BRIDGE_PATH, "utf8");
  const hiddenElementsSource = fs.readFileSync(HIDDEN_ELEMENTS_BRIDGE_PATH, "utf8");
  const surfaceSource = fs.readFileSync(SURFACE_BRIDGE_PATH, "utf8");

  assert.equal(
    previewSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/preview/index.mjs";'
  );
  assert.equal(
    panelSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/panel/index.mjs";'
  );
  assert.equal(
    hiddenElementsSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/hiddenElements/index.mjs";'
  );
  assert.equal(
    surfaceSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/surface/index.mjs";'
  );
}

function assertNoStorageOrEventPath(runtimeSource) {
  const forbiddenFragments = [
    "localStorage",
    "writeFile",
    "ipc",
    "db",
    "DB",
    "save",
    "Save",
    "persist",
    "Persist",
    "document",
    "window",
    "addEventListener",
    "PointerEvent",
    "MouseEvent",
  ];

  for (const fragment of forbiddenFragments) {
    assert.equal(runtimeSource.includes(fragment), false, `Drag-Runtime enthaelt gesperrtes Fragment: ${fragment}`);
  }
}

function assertDragRuntimeContract(runtime) {
  assert.deepEqual(runtime.SUPPORTED_DRAG_COORDINATE_SYSTEMS, ["css-pixels", "pdf-points", "canvas-pixels"]);

  EXPECTED_FUNCTION_EXPORTS.forEach((exportName) => {
    assert.equal(typeof runtime[exportName], "function", `missing Kit Drag-Runtime bridge export: ${exportName}`);
  });

  assert.equal(runtime.isSupportedDragCoordinateSystem("css-pixels"), true);
  assert.equal(runtime.isSupportedDragCoordinateSystem("pdf-points"), true);
  assert.equal(runtime.isSupportedDragCoordinateSystem("canvas-pixels"), true);
  assert.equal(runtime.isSupportedDragCoordinateSystem("unknown"), false);

  const startBounds = runtime.normalizeDragBounds({
    x: 10,
    y: 20,
    width: 100,
    height: 30,
  });
  const delta = runtime.normalizeDragDelta({
    x: 15,
    y: -5,
  });

  assert.deepEqual(runtime.validateDragBounds(startBounds), { ok: true, errors: [] });
  assert.deepEqual(runtime.validateDragDelta(delta), { ok: true, errors: [] });
  assert.deepEqual(runtime.applyDragDelta(startBounds, delta), {
    x: 25,
    y: 15,
    width: 100,
    height: 30,
  });
  assert.deepEqual(runtime.clampBoundsToConstraints({
    x: -10,
    y: 900,
    width: 100,
    height: 30,
  }, {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 800,
  }), {
    x: 0,
    y: 800,
    width: 100,
    height: 30,
  });

  const result = runtime.buildDragResult({
    elementId: "example.element",
    startBounds,
    delta,
    constraints: {
      minX: 0,
      minY: 0,
      maxX: 1000,
      maxY: 800,
    },
    coordinateSystem: "css-pixels",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.bounds, {
    x: 25,
    y: 15,
    width: 100,
    height: 30,
  });
  assert.equal(result.changed, true);

  const negativeSizeResult = runtime.validateDragBounds({
    x: 0,
    y: 0,
    width: -1,
    height: 10,
  });
  assert.equal(negativeSizeResult.ok, false);
  assert.equal(negativeSizeResult.errors.some((error) => error.code === "NEGATIVE_DRAG_BOUNDS_SIZE"), true);

  const unknownCoordinateResult = runtime.buildDragResult({
    elementId: "bad.coordinate",
    startBounds,
    delta,
    coordinateSystem: "unknown",
  });
  assert.equal(unknownCoordinateResult.ok, false);
  assert.equal(unknownCoordinateResult.errors.some((error) => error.code === "UNSUPPORTED_DRAG_COORDINATE_SYSTEM"), true);
}

async function runUiEditorKitDragRuntimeBridgeTests(run) {
  await run("UI-Editor-kit Drag-Runtime-Bridge: Renderer-Pfad ist vorbereitet", async () => {
    assertDragBridgeContract();
    assertLauncherUsesDragRuntimeOnlyViaBridgeForPanelPosition();
    assertExistingBridgesUnchanged();
    assertNoStorageOrEventPath(fs.readFileSync(KIT_DRAG_ESM_PATH, "utf8"));

    const runtime = await importEsmFromFile(DRAG_BRIDGE_PATH);
    assertDragRuntimeContract(runtime);
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

  runUiEditorKitDragRuntimeBridgeTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runUiEditorKitDragRuntimeBridgeTests };
