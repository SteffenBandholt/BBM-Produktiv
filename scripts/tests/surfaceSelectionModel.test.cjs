const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const SELECTION_MODEL_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfaceSelectionModel.js");
const CATALOG_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfaceAdapterCatalog.js");
const POLICY_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfacePolicy.js");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const DOC_PATH = path.join(REPO_ROOT, "docs/UI_EDITOR_SURFACE_SELECTION_READONLY.md");

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

async function runSurfaceSelectionModelTests(run) {
  const [selectionModule, catalogModule, policyModule] = await Promise.all([
    importEsmFromFile(SELECTION_MODEL_PATH),
    importEsmFromFile(CATALOG_PATH),
    importEsmFromFile(POLICY_PATH),
  ]);

  await run("SurfaceSelectionModel: sichtbare Editor-SurfaceIds kommen aus Katalog und Policy", () => {
    assert.deepEqual(selectionModule.getVisibleEditorSurfaceIds(), ["restarbeiten.ui.main"]);
    assert.equal(catalogModule.isKnownSurfaceAdapterId("restarbeiten.ui.main"), true);
    assert.equal(policyModule.isSurfaceReadable("restarbeiten.ui.main"), true);
    assert.equal(policyModule.isSurfaceVisibleInEditor("restarbeiten.ui.main"), true);
  });

  await run("SurfaceSelectionModel: Auswahlmodell enthaelt nur restarbeiten.ui.main", () => {
    const model = selectionModule.buildReadonlySurfaceSelectionModel();

    assert.equal(model.surfaces.length, 1);
    assert.deepEqual(model.surfaces[0], {
      surfaceId: "restarbeiten.ui.main",
      label: "Restarbeiten",
      surfaceType: "ui-screen",
      selected: true,
      readonly: true,
      capabilities: {
        canDrag: false,
        canResize: false,
        canPersist: false,
      },
    });
  });

  await run("SurfaceSelectionModel: PDF, Plan, unbekannte SurfaceIds und Wildcard werden nicht aufgenommen", () => {
    const model = selectionModule.buildReadonlySurfaceSelectionModel({
      surfaceIds: [
        "restarbeiten.ui.main",
        "pdf.plan.page.1",
        "plan.canvas.default",
        "unknown.surface",
        "*",
      ],
      selectedSurfaceId: "pdf.plan.page.1",
    });

    assert.deepEqual(model.surfaces.map((surface) => surface.surfaceId), ["restarbeiten.ui.main"]);
    assert.equal(selectionModule.isSurfaceSelectableInEditor("restarbeiten.ui.main"), true);
    assert.equal(selectionModule.isSurfaceSelectableInEditor("pdf.plan.page.1"), false);
    assert.equal(selectionModule.isSurfaceSelectableInEditor("plan.canvas.default"), false);
    assert.equal(selectionModule.isSurfaceSelectableInEditor("unknown.surface"), false);
    assert.equal(selectionModule.isSurfaceSelectableInEditor("*"), false);
    assert.equal(model.surfaces[0].selected, true);
  });

  await run("SurfaceSelectionModel: kein Default-true fuer Auswahl oder Capabilities", () => {
    const emptyModel = selectionModule.buildReadonlySurfaceSelectionModel({
      surfaceIds: ["pdf.plan.page.1", "plan.canvas.default", "unknown.surface", "*"],
      selectedSurfaceId: "*",
    });
    const model = selectionModule.buildReadonlySurfaceSelectionModel({
      selectedSurfaceId: "unknown.surface",
    });

    assert.deepEqual(emptyModel, { surfaces: [] });
    assert.equal(model.surfaces[0].selected, true);
    assert.equal(model.surfaces[0].readonly, true);
    assert.deepEqual(model.surfaces[0].capabilities, {
      canDrag: false,
      canResize: false,
      canPersist: false,
    });
  });

  await run("SurfaceSelectionModel: bleibt ohne Speicherpfad und ohne sichtbare Launcher-Nutzung", () => {
    const selectionSource = fs.readFileSync(SELECTION_MODEL_PATH, "utf8");
    const launcherSource = fs.readFileSync(LAUNCHER_PATH, "utf8");

    assertNoStorageOrWritePath(selectionSource, "SurfaceSelectionModel");
    assert.equal(selectionSource.includes("ui-editor-kit/runtime/surface"), false);
    assert.equal(launcherSource.includes("surfaceSelectionModel"), false);
    assert.equal(launcherSource.includes("buildReadonlySurfaceSelectionModel"), false);
    assert.equal(launcherSource.includes("data-ui-editor-surface-selection"), false);
    assert.equal(launcherSource.includes("data-ui-editor-surface-list"), false);
    assert.equal(launcherSource.includes("selectSurface"), false);
  });

  await run("SurfaceSelectionModel: Dokumentation enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(DOC_PATH), true, "SurfaceSelection-Dokument fehlt.");
    const docSource = fs.readFileSync(DOC_PATH, "utf8");

    for (const required of [
      "SurfaceSelection",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "keine sichtbare Auswahl",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `SurfaceSelection-Dokument enthaelt ${required} nicht.`);
    }
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

  runSurfaceSelectionModelTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runSurfaceSelectionModelTests };
