const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const SURFACE_ADAPTER_PATH = path.join(
  REPO_ROOT,
  "src/renderer/uiEditor/surfaceAdapters/restarbeitenMainSurfaceAdapter.js"
);
const SURFACE_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");

function createReadOnlyHostAdapter({ layoutState = [] } = {}) {
  const registry = [
    {
      id: "restarbeiten.root",
      name: "Restarbeiten",
      visible: true,
      allowedOps: ["inspect", "hide", "show", "move", "resize"],
      lockedOps: [],
    },
    {
      id: "restarbeiten.editbox.text.short",
      name: "Kurztext",
      visible: true,
      allowedOps: ["inspect", "hide", "show", "move", "resize"],
      lockedOps: [],
    },
    {
      id: "restarbeiten.readonly.info",
      name: "Nur lesen",
      visible: true,
      allowedOps: ["inspect"],
      lockedOps: ["hide"],
    },
  ];

  return {
    getRegistry() {
      return registry.map((entry) => ({
        ...entry,
        allowedOps: [...entry.allowedOps],
        lockedOps: [...entry.lockedOps],
      }));
    },
    getCurrentLayoutState() {
      return layoutState.map((entry) => ({
        ...entry,
        overrides: entry.overrides ? { ...entry.overrides } : entry.overrides,
      }));
    },
  };
}

function assertNoStorageOrWritePath(source, label) {
  for (const forbidden of [
    "localStorage",
    "sessionStorage",
    "writeFile",
    "ipcRenderer",
    "ipcMain",
    ".prepare(",
    ".run(",
    "uiEditorLayoutOverridesSave",
  ]) {
    assert.equal(source.includes(forbidden), false, `${label} enthaelt gesperrtes Fragment: ${forbidden}`);
  }
}

async function runRestarbeitenSurfaceAdapterTests(run) {
  const [adapterModule, surfaceRuntime] = await Promise.all([
    importEsmFromFile(SURFACE_ADAPTER_PATH),
    importEsmFromFile(SURFACE_BRIDGE_PATH),
  ]);

  await run("Restarbeiten SurfaceAdapter: erzeugt gueltiges read-only Surface-Modell", () => {
    const surfaceModel = adapterModule.buildRestarbeitenMainSurfaceModel({
      hostAdapter: createReadOnlyHostAdapter(),
    });

    assert.equal(surfaceModel.surfaceId, "restarbeiten.ui.main");
    assert.equal(surfaceModel.surfaceType, "ui-screen");
    assert.equal(surfaceModel.coordinateSystem, "css-pixels");
    assert.equal(Array.isArray(surfaceModel.elements), true);
    assert.equal(surfaceModel.elements.length, 3);
    assert.deepEqual(surfaceRuntime.validateSurfaceModel(surfaceModel), { ok: true, errors: [] });
  });

  await run("Restarbeiten SurfaceAdapter: Elemente enthalten IDs, Sichtbarkeit und defensive Capabilities", () => {
    const surfaceModel = adapterModule.buildRestarbeitenMainSurfaceModel({
      hostAdapter: createReadOnlyHostAdapter(),
    });

    const shortText = surfaceModel.elements.find((entry) => entry.elementId === "restarbeiten.editbox.text.short");
    assert.ok(shortText);
    assert.equal(typeof shortText.elementId, "string");
    assert.equal(shortText.label, "Kurztext");
    assert.equal(typeof shortText.visible, "boolean");
    assert.equal(shortText.visible, true);
    assert.equal(shortText.capabilities.canHide, true);
    assert.equal(shortText.capabilities.canMove, false);
    assert.equal(shortText.capabilities.canResize, false);
    assert.equal(Object.hasOwn(shortText, "bounds"), false);

    const readonly = surfaceModel.elements.find((entry) => entry.elementId === "restarbeiten.readonly.info");
    assert.equal(readonly.capabilities.canHide, false);
    assert.equal(readonly.capabilities.canMove, false);
    assert.equal(readonly.capabilities.canResize, false);
  });

  await run("Restarbeiten SurfaceAdapter: LayoutState-Visibility wird read-only beruecksichtigt", () => {
    const surfaceModel = adapterModule.buildRestarbeitenMainSurfaceModel({
      hostAdapter: createReadOnlyHostAdapter({
        layoutState: [
          {
            scopeId: "restarbeiten.ui.main",
            elementId: "restarbeiten.editbox.text.short",
            overrides: {
              visible: false,
            },
          },
        ],
      }),
    });

    const shortText = surfaceModel.elements.find((entry) => entry.elementId === "restarbeiten.editbox.text.short");
    assert.equal(shortText.visible, false);
    assert.deepEqual(surfaceRuntime.validateSurfaceModel(surfaceModel), { ok: true, errors: [] });
  });

  await run("Restarbeiten SurfaceAdapter: validierter Ergebnishelfer meldet ok=true", () => {
    const result = adapterModule.buildValidatedRestarbeitenMainSurfaceModel({
      hostAdapter: createReadOnlyHostAdapter(),
    });

    assert.equal(result.ok, true);
    assert.equal(result.validation.ok, true);
    assert.equal(result.surfaceModel.surfaceId, "restarbeiten.ui.main");
  });

  await run("Restarbeiten SurfaceAdapter: keine Speicherung und keine Launcher-Produktivnutzung", () => {
    const adapterSource = fs.readFileSync(SURFACE_ADAPTER_PATH, "utf8");
    const launcherSource = fs.readFileSync(LAUNCHER_PATH, "utf8");

    assertNoStorageOrWritePath(adapterSource, "SurfaceAdapter");
    assert.equal(adapterSource.includes("ui-editor-kit/runtime/surface"), false);
    assert.equal(adapterSource.includes("uiEditorKitSurfaceRuntimeBridge.js"), true);
    assert.equal(launcherSource.includes("restarbeitenMainSurfaceAdapter"), false);
    assert.equal(launcherSource.includes("surfaceAdapters/restarbeitenMainSurfaceAdapter"), false);
  });
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

  runRestarbeitenSurfaceAdapterTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runRestarbeitenSurfaceAdapterTests };
