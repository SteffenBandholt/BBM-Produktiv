const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const POLICY_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfacePolicy.js");
const CATALOG_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfaceAdapterCatalog.js");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const POLICY_DOC_PATH = path.join(REPO_ROOT, "docs/UI_EDITOR_SURFACE_POLICY.md");
const SURFACE_INFO_REFERENCE_DOC_PATH = path.join(
  REPO_ROOT,
  "docs/UI_EDITOR_SURFACE_INFO_READONLY_REFERENZSTAND.md",
);
const PDF_PAGE_SICHTPRUEFUNG_DOC_PATH = path.join(
  REPO_ROOT,
  "docs/UI_EDITOR_PDF_PLAN_PAGE_1_READONLY_SICHTPRUEFUNG.md",
);

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

  await run("SurfacePolicy: PDF-Seite 1 und Plan Canvas sind read-only sichtbar", () => {
    assertPolicy(policyModule.getSurfacePolicy("pdf.plan.page.1"), {
      readable: true,
      visibleInEditor: true,
      canHide: false,
      canDrag: false,
      canResize: false,
      canPersist: false,
    });
    assert.equal(policyModule.isSurfaceVisibleInEditor("pdf.plan.page.1"), true);

    assertPolicy(policyModule.getSurfacePolicy("plan.canvas.default"), {
      readable: true,
      visibleInEditor: true,
      canHide: false,
      canDrag: false,
      canResize: false,
      canPersist: false,
    });
    assert.equal(policyModule.isSurfaceVisibleInEditor("plan.canvas.default"), true);
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
      "visibleInEditor: false",
      "canPersist: false",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `SurfacePolicy-Dokument enthaelt ${required} nicht.`);
    }
  });

  await run("SurfacePolicy: SurfaceInfo-Referenzdokument enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(SURFACE_INFO_REFERENCE_DOC_PATH), true, "SurfaceInfo-Referenzdokument fehlt.");
    const docSource = fs.readFileSync(SURFACE_INFO_REFERENCE_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "read-only",
      "SurfaceSelection ist nur als sichtbare read-only Auswahl",
      "Keine echte Surface-Umschaltung",
      "kein Drag",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `SurfaceInfo-Referenzdokument enthaelt ${required} nicht.`);
    }
  });

  await run("SurfacePolicy: PDF-Plan-Sichtpruefungsdokument enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(PDF_PAGE_SICHTPRUEFUNG_DOC_PATH), true, "PDF-Plan-Sichtpruefungsdokument fehlt.");
    const docSource = fs.readFileSync(PDF_PAGE_SICHTPRUEFUNG_DOC_PATH, "utf8");

    for (const required of [
      "Restarbeiten - PDF Plan Seite 1",
      "SurfaceInfo zeigt weiterhin den Hoststand `restarbeiten.ui.main`",
      "plan.canvas.default",
      "keine echte Surface-Umschaltung",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `PDF-Plan-Sichtpruefungsdokument enthaelt ${required} nicht.`);
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
