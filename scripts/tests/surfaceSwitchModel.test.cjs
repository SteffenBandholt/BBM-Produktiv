const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const SWITCH_MODEL_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfaceSwitchModel.js");
const DOC_PATH = path.join(REPO_ROOT, "docs/UI_EDITOR_SURFACE_SWITCH_READONLY.md");
const REFERENCE_DOC_PATH = path.join(REPO_ROOT, "docs/UI_EDITOR_SURFACE_SWITCH_READONLY_REFERENZSTAND.md");
const LAUNCHER_REFERENCE_DOC_PATH = path.join(REPO_ROOT, "docs/UI_EDITOR_SURFACE_SWITCH_LAUNCHER_REFERENZSTAND.md");

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

async function runSurfaceSwitchModelTests(run) {
  const switchModule = await importEsmFromFile(SWITCH_MODEL_PATH);

  await run("SurfaceSwitchModel: erlaubt nur den aktuellen read-only Pilot", () => {
    const result = switchModule.buildReadonlySurfaceSwitchResult({
      targetSurfaceId: "restarbeiten.ui.main",
    });

    assert.deepEqual(result, {
      allowed: true,
      readonly: true,
      fromSurfaceId: "restarbeiten.ui.main",
      targetSurfaceId: "restarbeiten.ui.main",
      resolvedSurfaceId: "restarbeiten.ui.main",
      reason: "readonly-current-surface",
    });
    assert.equal(switchModule.canSwitchReadonlySurface("restarbeiten.ui.main"), true);
    assert.equal(
      switchModule.resolveReadonlySurfaceSwitchTarget("restarbeiten.ui.main"),
      "restarbeiten.ui.main"
    );
  });

  await run("SurfaceSwitchModel: blockiert PDF, Plan, unbekannte und leere Ziele", () => {
    for (const blockedSurfaceId of [
      "pdf.plan.page.1",
      "plan.canvas.default",
      "unknown.surface",
      "*",
      "",
      "   ",
    ]) {
      const expectedTargetSurfaceId = String(blockedSurfaceId || "").trim();
      const result = switchModule.buildReadonlySurfaceSwitchResult({
        targetSurfaceId: blockedSurfaceId,
      });

      assert.deepEqual(result, {
        allowed: false,
        readonly: true,
        fromSurfaceId: "restarbeiten.ui.main",
        targetSurfaceId: expectedTargetSurfaceId,
        resolvedSurfaceId: "restarbeiten.ui.main",
        reason: "surface-not-selectable-readonly",
      });
      assert.equal(
        switchModule.canSwitchReadonlySurface(blockedSurfaceId),
        false,
        `${blockedSurfaceId || "<empty>"} darf nicht umschaltbar sein`
      );
      assert.equal(
        switchModule.resolveReadonlySurfaceSwitchTarget(blockedSurfaceId),
        "restarbeiten.ui.main"
      );
    }
  });

  await run("SurfaceSwitchModel: blockierte fromSurfaceId erzwingt keinen Zielwechsel", () => {
    const result = switchModule.buildReadonlySurfaceSwitchResult({
      fromSurfaceId: "pdf.plan.page.1",
      targetSurfaceId: "plan.canvas.default",
    });

    assert.equal(result.allowed, false);
    assert.equal(result.readonly, true);
    assert.equal(result.fromSurfaceId, "restarbeiten.ui.main");
    assert.equal(result.targetSurfaceId, "plan.canvas.default");
    assert.equal(result.resolvedSurfaceId, "restarbeiten.ui.main");
    assert.equal(result.reason, "surface-not-selectable-readonly");
  });

  await run("SurfaceSwitchModel: bleibt frei von Speicher-, Drag-, Resize- und Launcher-Pfaden", () => {
    const source = fs.readFileSync(SWITCH_MODEL_PATH, "utf8");

    assertNoStorageOrWritePath(source, "SurfaceSwitchModel");
    for (const forbidden of [
      "canDrag: true",
      "canResize: true",
      "canPersist: true",
      "default: true",
      "selectSurface",
      "data-ui-editor-surface-list",
      "BbmUiEditorRuntimeLauncher",
    ]) {
      assert.equal(source.includes(forbidden), false, `SurfaceSwitchModel enthaelt gesperrtes Fragment: ${forbidden}`);
    }
  });

  await run("SurfaceSwitchModel: Dokumentation enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(DOC_PATH), true, "SurfaceSwitch-Dokument fehlt.");
    const docSource = fs.readFileSync(DOC_PATH, "utf8");

    for (const required of [
      "Surface-Umschaltungsmodell",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "read-only",
      "keine echte Umschaltung",
      "kein Drag",
      "kein Resize",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `SurfaceSwitch-Dokument enthaelt ${required} nicht.`);
    }
  });

  await run("SurfaceSwitchModel: Referenzdokument enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(REFERENCE_DOC_PATH), true, "SurfaceSwitch-Referenzdokument fehlt.");
    const docSource = fs.readFileSync(REFERENCE_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "read-only",
      "keine echte Umschaltung",
      "kein Drag",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `SurfaceSwitch-Referenzdokument enthaelt ${required} nicht.`);
    }
  });

  await run("SurfaceSwitchModel: Launcher-Referenzdokument enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(LAUNCHER_REFERENCE_DOC_PATH), true, "SurfaceSwitch-Launcher-Referenzdokument fehlt.");
    const docSource = fs.readFileSync(LAUNCHER_REFERENCE_DOC_PATH, "utf8");

    for (const required of [
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "read-only",
      "keine echte Umschaltung",
      "kein Drag",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
      "Editorpanel im BBM-Launcher",
      "Surface-Auswahl: Restarbeiten",
      "SurfaceInfo: restarbeiten.ui.main / ui-screen / Elementanzahl",
    ]) {
      assert.equal(docSource.includes(required), true, `SurfaceSwitch-Launcher-Referenzdokument enthaelt ${required} nicht.`);
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

  runSurfaceSwitchModelTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runSurfaceSwitchModelTests };
