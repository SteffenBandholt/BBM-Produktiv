const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const SURFACE_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js");
const PREVIEW_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitPreviewRuntimeBridge.js");
const PANEL_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitPanelRuntimeBridge.js");
const HIDDEN_ELEMENTS_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitHiddenElementsRuntimeBridge.js");
const KIT_SURFACE_ESM_PATH = path.join(REPO_ROOT, "node_modules/ui-editor-kit/src/runtime/surface/index.mjs");

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
]);

const EXPECTED_FUNCTION_EXPORTS = Object.freeze([
  "normalizeSurfaceElement",
  "normalizeSurfaceModel",
  "validateSurfaceElement",
  "validateSurfaceModel",
  "isSupportedSurfaceType",
]);

function assertSurfaceBridgeContract() {
  assert.equal(fs.existsSync(SURFACE_BRIDGE_PATH), true, "Surface-Runtime-Bridge fehlt.");
  assert.equal(fs.existsSync(KIT_SURFACE_ESM_PATH), true, "Installierter Kit-Surface-ESM-Einstieg fehlt.");

  const bridgeSource = fs.readFileSync(SURFACE_BRIDGE_PATH, "utf8");
  assert.equal(
    bridgeSource.trim(),
    'export * from "../../../node_modules/ui-editor-kit/src/runtime/surface/index.mjs";'
  );
  assert.equal(bridgeSource.includes("node_modules/ui-editor-kit/src/runtime/surface/index.mjs"), true);
  assert.equal(bridgeSource.includes("ui-editor-kit/runtime/surface"), false);

  for (const fragment of FORBIDDEN_BRIDGE_FRAGMENTS) {
    assert.equal(bridgeSource.includes(fragment), false, `Surface-Bridge enthaelt gesperrtes Fragment: ${fragment}`);
  }
}

function assertLauncherDoesNotUseSurfaceRuntime() {
  const source = fs.readFileSync(LAUNCHER_PATH, "utf8");
  assert.equal(source.includes('from "./uiEditorKitSurfaceRuntimeBridge.js"'), false);
  assert.equal(source.includes("ui-editor-kit/runtime/surface"), false);
  assert.equal(source.includes("node_modules/ui-editor-kit/src/runtime/surface/index.mjs"), false);
}

function assertExistingBridgesUnchanged() {
  const previewSource = fs.readFileSync(PREVIEW_BRIDGE_PATH, "utf8");
  const panelSource = fs.readFileSync(PANEL_BRIDGE_PATH, "utf8");
  const hiddenElementsSource = fs.readFileSync(HIDDEN_ELEMENTS_BRIDGE_PATH, "utf8");

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
}

function assertNoStorageOrHostWritePath(runtimeSource) {
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
  ];

  for (const fragment of forbiddenFragments) {
    assert.equal(runtimeSource.includes(fragment), false, `Surface-Runtime enthaelt gesperrtes Fragment: ${fragment}`);
  }
}

function assertSurfaceRuntimeContract(runtime) {
  assert.deepEqual(runtime.SUPPORTED_SURFACE_TYPES, ["ui-screen", "panel", "pdf-page", "canvas", "plan"]);

  EXPECTED_FUNCTION_EXPORTS.forEach((exportName) => {
    assert.equal(typeof runtime[exportName], "function", `missing Kit Surface-Runtime bridge export: ${exportName}`);
  });

  assert.equal(runtime.isSupportedSurfaceType("ui-screen"), true);
  assert.equal(runtime.isSupportedSurfaceType("pdf-page"), true);
  assert.equal(runtime.isSupportedSurfaceType("unknown"), false);

  const uiSurface = runtime.normalizeSurfaceModel({
    surfaceId: "example.ui",
    surfaceType: "ui-screen",
    elements: [
      {
        elementId: "example.element",
        label: "Example",
        visible: true,
        bounds: {
          x: 0,
          y: 0,
          width: 100,
          height: 30,
        },
        capabilities: {
          canHide: true,
          canMove: false,
        },
      },
    ],
  });

  assert.equal(uiSurface.coordinateSystem, "css-pixels");
  assert.equal(uiSurface.elements[0].capabilities.canResize, false);
  assert.deepEqual(runtime.validateSurfaceModel(uiSurface), { ok: true, errors: [] });

  const pageSurface = runtime.normalizeSurfaceModel({
    surfaceId: "example.page.1",
    surfaceType: "pdf-page",
    pageNumber: 1,
    elements: [],
  });

  assert.equal(pageSurface.coordinateSystem, "pdf-points");
  assert.equal(pageSurface.pageNumber, 1);
  assert.deepEqual(pageSurface.elements, []);
  assert.deepEqual(runtime.validateSurfaceModel(pageSurface), { ok: true, errors: [] });

  const unknownTypeResult = runtime.validateSurfaceModel({
    surfaceId: "example.unknown",
    surfaceType: "unknown",
    elements: [],
  });
  assert.equal(unknownTypeResult.ok, false);
  assert.ok(unknownTypeResult.errors.some((error) => error.code === "UNSUPPORTED_SURFACE_TYPE"));
}

async function runUiEditorKitSurfaceRuntimeBridgeTests(run) {
  await run("UI-Editor-kit Surface-Runtime-Bridge: Renderer-Pfad ist vorbereitet", async () => {
    assertSurfaceBridgeContract();
    assertLauncherDoesNotUseSurfaceRuntime();
    assertExistingBridgesUnchanged();
    assertNoStorageOrHostWritePath(fs.readFileSync(KIT_SURFACE_ESM_PATH, "utf8"));

    const runtime = await importEsmFromFile(SURFACE_BRIDGE_PATH);
    assertSurfaceRuntimeContract(runtime);
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

  runUiEditorKitSurfaceRuntimeBridgeTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runUiEditorKitSurfaceRuntimeBridgeTests };
