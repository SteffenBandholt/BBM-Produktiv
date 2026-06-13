const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const POLICY_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfacePolicy.js");
const CATALOG_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfaceAdapterCatalog.js");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const POLICY_DOC_PATH = path.join(REPO_ROOT, "docs/UI_EDITOR_SURFACE_POLICY.md");

const KNOWN_SURFACE_IDS = [
  "restarbeiten.ui.main",
  "pdf.plan.page.1",
  "plan.canvas.default",
];

function assertPolicy(policy, expected) {
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(policy[key], value, `Policy ${policy.surfaceId} ${key}`);
  }
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

async function runSurfacePolicyTests(run) {
  const [policyModule, catalogModule] = await Promise.all([
    importEsmFromFile(POLICY_PATH),
    importEsmFromFile(CATALOG_PATH),
  ]);

  await run("SurfacePolicy: bekannte SurfaceIds werden explizit gelistet", () => {
    assert.deepEqual(policyModule.getKnownSurfacePolicyIds(), KNOWN_SURFACE_IDS);
  });

  await run("SurfacePolicy: Restarbeiten UI-Surface bleibt nur read-only vorbereitet", () => {
    assertPolicy(policyModule.getSurfacePolicy("restarbeiten.ui.main"), {
      readable: true,
      visibleInEditor: true,
      canHide: true,
      canDrag: false,
      canResize: false,
      canPersist: false,
    });
    assert.equal(policyModule.isSurfaceVisibleInEditor("restarbeiten.ui.main"), true);
  });

  await run("SurfacePolicy: PDF- und Plan-Surface bleiben ohne Editor-Aktivierung", () => {
    for (const surfaceId of ["pdf.plan.page.1", "plan.canvas.default"]) {
      assertPolicy(policyModule.getSurfacePolicy(surfaceId), {
        readable: true,
        visibleInEditor: false,
        canHide: false,
        canDrag: false,
        canResize: false,
        canPersist: false,
      });
    }
  });

  await run("SurfacePolicy: unbekannte SurfaceIds und Wildcards sind voll blockiert", () => {
    for (const surfaceId of ["pdf.plan.page.2", "unknown.surface", "*", ""]) {
      assertPolicy(policyModule.getSurfacePolicy(surfaceId), {
        readable: false,
        visibleInEditor: false,
        canHide: false,
        canDrag: false,
        canResize: false,
        canPersist: false,
      });
      assert.equal(policyModule.isSurfaceReadable(surfaceId), false);
      assert.equal(policyModule.isSurfaceVisibleInEditor(surfaceId), false);
      assert.equal(policyModule.canSurfaceHideElements(surfaceId), false);
      assert.equal(policyModule.canSurfaceDragElements(surfaceId), false);
      assert.equal(policyModule.canSurfaceResizeElements(surfaceId), false);
      assert.equal(policyModule.canSurfacePersistChanges(surfaceId), false);
    }
  });

  await run("SurfacePolicy: Katalog bleibt an read-only Policy gebunden", () => {
    for (const surfaceId of KNOWN_SURFACE_IDS) {
      assert.equal(policyModule.isSurfaceReadable(surfaceId), true);
      assert.equal(catalogModule.isKnownSurfaceAdapterId(surfaceId), true);
    }

    assert.equal(catalogModule.getSurfaceAdapterById("*"), null);
    assert.equal(catalogModule.isKnownSurfaceAdapterId("pdf.plan.page.2"), false);

    const unknownResult = catalogModule.validateSurfaceModelById("pdf.plan.page.2");
    assert.equal(unknownResult.ok, false);
    assert.equal(unknownResult.validation.errors[0].code, "UNKNOWN_SURFACE_ADAPTER");
  });

  await run("SurfacePolicy: aktiviert keine Launcher-UI und keinen Speicherpfad", () => {
    const policySource = fs.readFileSync(POLICY_PATH, "utf8");
    const catalogSource = fs.readFileSync(CATALOG_PATH, "utf8");
    const launcherSource = fs.readFileSync(LAUNCHER_PATH, "utf8");

    assertNoStorageOrWritePath(policySource, "SurfacePolicy");
    assertNoStorageOrWritePath(catalogSource, "SurfaceAdapter-Katalog");
    assert.equal(policySource.includes("ui-editor-kit/runtime/surface"), false);
    assert.equal(launcherSource.includes("data-ui-editor-surface-policy"), false);
    assert.equal(launcherSource.includes("renderSurfacePolicy"), false);
  });

  await run("SurfacePolicy: Referenzdokument enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(POLICY_DOC_PATH), true, "SurfacePolicy-Dokument fehlt.");
    const docSource = fs.readFileSync(POLICY_DOC_PATH, "utf8");

    for (const required of [
      "SurfacePolicy",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "visibleInEditor: true",
      "pdf.plan.page.1",
      "canPersist: false",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `SurfacePolicy-Dokument enthaelt ${required} nicht.`);
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

  runSurfacePolicyTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runSurfacePolicyTests };
