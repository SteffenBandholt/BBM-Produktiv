const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const SURFACE_ADAPTER_PATH = path.join(
  REPO_ROOT,
  "src/renderer/uiEditor/surfaceAdapters/pdfPlanSurfaceAdapter.js"
);
const SURFACE_BRIDGE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/uiEditorKitSurfaceRuntimeBridge.js");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");

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

async function runPdfPlanSurfaceAdapterTests(run) {
  const [adapterModule, surfaceRuntime] = await Promise.all([
    importEsmFromFile(SURFACE_ADAPTER_PATH),
    importEsmFromFile(SURFACE_BRIDGE_PATH),
  ]);

  await run("PDF-/Plan-SurfaceAdapter: erzeugt gueltiges read-only PDF-Surface-Modell", () => {
    const surfaceModel = adapterModule.buildPdfPageSurfaceModel({ pageNumber: 3 });

    assert.equal(surfaceModel.surfaceId, "pdf.plan.page.3");
    assert.equal(surfaceModel.surfaceType, "pdf-page");
    assert.equal(surfaceModel.coordinateSystem, "pdf-points");
    assert.equal(surfaceModel.pageNumber, 3);
    assert.deepEqual(surfaceModel.elements, []);
    assert.deepEqual(surfaceRuntime.validateSurfaceModel(surfaceModel), { ok: true, errors: [] });
    assert.deepEqual(adapterModule.validatePdfPlanSurfaceModel(surfaceModel), { ok: true, errors: [] });
  });

  await run("PDF-/Plan-SurfaceAdapter: defensiver PDF-Seitenfallback bleibt gueltig", () => {
    const result = adapterModule.buildValidatedPdfPageSurfaceModel({ pageNumber: 0 });

    assert.equal(result.ok, true);
    assert.equal(result.surfaceModel.surfaceId, "pdf.plan.page.1");
    assert.equal(result.surfaceModel.pageNumber, 1);
    assert.equal(result.validation.ok, true);
  });

  await run("PDF-/Plan-SurfaceAdapter: erzeugt optionales gueltiges Plan-Surface-Modell", () => {
    const result = adapterModule.buildValidatedPlanSurfaceModel();

    assert.equal(result.ok, true);
    assert.equal(result.surfaceModel.surfaceId, "plan.canvas.default");
    assert.equal(result.surfaceModel.surfaceType, "plan");
    assert.equal(result.surfaceModel.coordinateSystem, "canvas-pixels");
    assert.deepEqual(result.surfaceModel.elements, []);
    assert.deepEqual(surfaceRuntime.validateSurfaceModel(result.surfaceModel), { ok: true, errors: [] });
  });

  await run("PDF-/Plan-SurfaceAdapter: bleibt ohne Launcher-Produktivnutzung und Speicherpfad", () => {
    const adapterSource = fs.readFileSync(SURFACE_ADAPTER_PATH, "utf8");
    const launcherSource = fs.readFileSync(LAUNCHER_PATH, "utf8");

    assertNoStorageOrWritePath(adapterSource, "PDF-/Plan-SurfaceAdapter");
    assert.equal(adapterSource.includes("ui-editor-kit/runtime/surface"), false);
    assert.equal(adapterSource.includes("uiEditorKitSurfaceRuntimeBridge.js"), true);
    assert.equal(launcherSource.includes("pdfPlanSurfaceAdapter"), false);
    assert.equal(launcherSource.includes("surfaceAdapters/pdfPlanSurfaceAdapter"), false);
  });

  await run("PDF-/Plan-SurfaceAdapter: beruehrt keine PDF-/Canvas-Renderpfade", () => {
    const adapterSource = fs.readFileSync(SURFACE_ADAPTER_PATH, "utf8");

    for (const forbidden of [
      "canvas.getContext",
      "drawImage",
      "PDFDocument",
      "pdfjs",
      "printToPDF",
      "loadPdf",
      "renderPage",
    ]) {
      assert.equal(adapterSource.includes(forbidden), false, `Renderpfad gefunden: ${forbidden}`);
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

  runPdfPlanSurfaceAdapterTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runPdfPlanSurfaceAdapterTests };
