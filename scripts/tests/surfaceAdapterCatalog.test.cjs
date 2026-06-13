const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const CATALOG_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfaceAdapterCatalog.js");
const SURFACE_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const REFERENCE_DOC_PATH = path.join(REPO_ROOT, "docs/UI_EDITOR_SURFACE_ADAPTER_REFERENZSTAND.md");

function createReadOnlyHostAdapter() {
  return {
    getRegistry() {
      return [
        {
          id: "restarbeiten.root",
          name: "Restarbeiten",
          visible: true,
          allowedOps: ["inspect", "hide", "show"],
          lockedOps: [],
        },
      ];
    },
    getCurrentLayoutState() {
      return [];
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

async function runSurfaceAdapterCatalogTests(run) {
  const [catalogModule, surfaceRuntime] = await Promise.all([
    importEsmFromFile(CATALOG_PATH),
    importEsmFromFile(SURFACE_BRIDGE_PATH),
  ]);

  await run("SurfaceAdapter-Katalog: bekannte AdapterIds werden read-only gelistet", () => {
    const adapterIds = catalogModule.getKnownSurfaceAdapterIds();

    assert.deepEqual(adapterIds, [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
    ]);
    assert.equal(catalogModule.isKnownSurfaceAdapterId("restarbeiten.ui.main"), true);
    assert.equal(catalogModule.isKnownSurfaceAdapterId("pdf.plan.page.1"), true);
    assert.equal(catalogModule.isKnownSurfaceAdapterId("plan.canvas.default"), true);
  });

  await run("SurfaceAdapter-Katalog: Restarbeiten UI-Surface ist validierbar", () => {
    const result = catalogModule.validateSurfaceModelById("restarbeiten.ui.main", {
      hostAdapter: createReadOnlyHostAdapter(),
    });

    assert.equal(result.ok, true);
    assert.equal(result.surfaceModel.surfaceId, "restarbeiten.ui.main");
    assert.equal(result.surfaceModel.surfaceType, "ui-screen");
    assert.deepEqual(surfaceRuntime.validateSurfaceModel(result.surfaceModel), { ok: true, errors: [] });
  });

  await run("SurfaceAdapter-Katalog: PDF-Seite 1 ist ohne Wildcard validierbar", () => {
    const result = catalogModule.validateSurfaceModelById("pdf.plan.page.1", { pageNumber: 7 });

    assert.equal(result.ok, true);
    assert.equal(result.surfaceModel.surfaceId, "pdf.plan.page.1");
    assert.equal(result.surfaceModel.surfaceType, "pdf-page");
    assert.equal(result.surfaceModel.coordinateSystem, "pdf-points");
    assert.equal(result.surfaceModel.pageNumber, 1);
    assert.deepEqual(result.surfaceModel.elements, []);
    assert.deepEqual(surfaceRuntime.validateSurfaceModel(result.surfaceModel), { ok: true, errors: [] });
  });

  await run("SurfaceAdapter-Katalog: Plan-Surface ist validierbar", () => {
    const result = catalogModule.validateSurfaceModelById("plan.canvas.default");

    assert.equal(result.ok, true);
    assert.equal(result.surfaceModel.surfaceId, "plan.canvas.default");
    assert.equal(result.surfaceModel.surfaceType, "plan");
    assert.equal(result.surfaceModel.coordinateSystem, "canvas-pixels");
    assert.deepEqual(result.surfaceModel.elements, []);
    assert.deepEqual(surfaceRuntime.validateSurfaceModel(result.surfaceModel), { ok: true, errors: [] });
  });

  await run("SurfaceAdapter-Katalog: unbekannte SurfaceIds werden kontrolliert abgelehnt", () => {
    assert.equal(catalogModule.getSurfaceAdapterById("pdf.plan.page.2"), null);
    assert.equal(catalogModule.getSurfaceAdapterById("*"), null);
    assert.equal(catalogModule.isKnownSurfaceAdapterId("pdf.plan.page.2"), false);
    assert.equal(catalogModule.buildSurfaceModelById("pdf.plan.page.2"), null);

    const result = catalogModule.validateSurfaceModelById("pdf.plan.page.2");
    assert.equal(result.ok, false);
    assert.equal(result.surfaceModel, null);
    assert.equal(result.validation.ok, false);
    assert.equal(result.validation.errors[0].code, "UNKNOWN_SURFACE_ADAPTER");
  });

  await run("SurfaceAdapter-Katalog: bleibt ohne Launcher-Produktivnutzung und Speicherpfad", () => {
    const catalogSource = fs.readFileSync(CATALOG_PATH, "utf8");
    const launcherSource = fs.readFileSync(LAUNCHER_PATH, "utf8");

    assertNoStorageOrWritePath(catalogSource, "SurfaceAdapter-Katalog");
    assert.equal(catalogSource.includes("ui-editor-kit/runtime/surface"), false);
    assert.equal(catalogSource.includes("uiEditorKitSurfaceRuntimeBridge.js"), true);
    assert.equal(launcherSource.includes("surfaceAdapterCatalog"), false);
    assert.equal(launcherSource.includes("surfaceAdapters/surfaceAdapterCatalog"), false);
  });

  await run("SurfaceAdapter-Katalog: beruehrt keine PDF-/Canvas-Renderpfade", () => {
    const catalogSource = fs.readFileSync(CATALOG_PATH, "utf8");

    for (const forbidden of [
      "canvas.getContext",
      "drawImage",
      "PDFDocument",
      "pdfjs",
      "printToPDF",
      "loadPdf",
      "renderPage",
    ]) {
      assert.equal(catalogSource.includes(forbidden), false, `Renderpfad gefunden: ${forbidden}`);
    }
  });

  await run("SurfaceAdapter-Katalog: Referenzdokument enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(REFERENCE_DOC_PATH), true, "Referenzdokument fehlt.");
    const docSource = fs.readFileSync(REFERENCE_DOC_PATH, "utf8");

    for (const required of [
      "SurfaceAdapterCatalog",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "UNKNOWN_SURFACE_ADAPTER",
      "Keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `Referenzdokument enthaelt ${required} nicht.`);
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

  runSurfaceAdapterCatalogTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runSurfaceAdapterCatalogTests };
