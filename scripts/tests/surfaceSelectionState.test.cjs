const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const STATE_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/surfaceAdapters/surfaceSelectionState.js");
const LAUNCHER_PATH = path.join(REPO_ROOT, "src/renderer/uiEditor/BbmUiEditorRuntimeLauncher.js");
const DOC_PATH = path.join(REPO_ROOT, "docs/UI_EDITOR_SURFACE_SELECTION_STATE_READONLY.md");
const LAUNCHER_REFERENCE_DOC_PATH = path.join(
  REPO_ROOT,
  "docs/UI_EDITOR_SURFACE_SELECTION_STATE_LAUNCHER_REFERENZSTAND.md"
);

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

async function runSurfaceSelectionStateTests(run) {
  const stateModule = await importEsmFromFile(STATE_PATH);

  await run("SurfaceSelectionState: waehlt standardmaessig restarbeiten.ui.main read-only", () => {
    const state = stateModule.buildReadonlySurfaceSelectionState();

    assert.equal(state.selectedSurfaceId, "restarbeiten.ui.main");
    assert.equal(state.requestedSurfaceId, "");
    assert.equal(state.readonly, true);
    assert.deepEqual(state.availableSurfaceIds, ["restarbeiten.ui.main"]);
    assert.deepEqual(state.blockedSurfaceIds, ["pdf.plan.page.1", "plan.canvas.default"]);
    assert.equal(state.selectionAllowed, true);
    assert.equal(state.reason, "readonly-single-surface");
  });

  await run("SurfaceSelectionState: erlaubt nur restarbeiten.ui.main", () => {
    assert.equal(stateModule.isReadonlySurfaceSelectionAllowed("restarbeiten.ui.main"), true);
    assert.equal(stateModule.resolveReadonlySelectedSurfaceId({ selectedSurfaceId: "restarbeiten.ui.main" }), "restarbeiten.ui.main");

    for (const blockedSurfaceId of [
      "pdf.plan.page.1",
      "plan.canvas.default",
      "unknown.surface",
      "*",
      "",
      "   ",
    ]) {
      assert.equal(
        stateModule.isReadonlySurfaceSelectionAllowed(blockedSurfaceId),
        false,
        `${blockedSurfaceId || "<empty>"} darf nicht auswaehlbar sein`
      );
    }
  });

  await run("SurfaceSelectionState: blockierte Auswahlwuensche fallen defensiv auf Pilot zurueck", () => {
    for (const blockedSurfaceId of [
      "pdf.plan.page.1",
      "plan.canvas.default",
      "unknown.surface",
      "*",
    ]) {
      const state = stateModule.buildReadonlySurfaceSelectionState({
        selectedSurfaceId: blockedSurfaceId,
      });

      assert.equal(state.selectedSurfaceId, "restarbeiten.ui.main");
      assert.equal(state.requestedSurfaceId, blockedSurfaceId);
      assert.deepEqual(state.availableSurfaceIds, ["restarbeiten.ui.main"]);
      assert.equal(state.blockedSurfaceIds.includes(blockedSurfaceId), true);
      assert.equal(state.selectionAllowed, false);
      assert.equal(state.reason, "surface-selection-blocked");
    }
  });

  await run("SurfaceSelectionState: leere Auswahlwuensche fallen auf den Pilot zurueck", () => {
    const state = stateModule.buildReadonlySurfaceSelectionState({
      selectedSurfaceId: "",
      surfaceIds: ["pdf.plan.page.1", "plan.canvas.default", "unknown.surface", "*"],
    });

    assert.equal(state.selectedSurfaceId, "restarbeiten.ui.main");
    assert.deepEqual(state.availableSurfaceIds, ["restarbeiten.ui.main"]);
    assert.deepEqual(state.blockedSurfaceIds, ["pdf.plan.page.1", "plan.canvas.default", "unknown.surface", "*"]);
    assert.equal(state.selectionAllowed, true);
    assert.equal(state.readonly, true);
  });

  await run("SurfaceSelectionState: wird im Launcher read-only genutzt, ohne Drag, Resize und Speicherpfad", () => {
    const stateSource = fs.readFileSync(STATE_PATH, "utf8");
    const launcherSource = fs.readFileSync(LAUNCHER_PATH, "utf8");

    assertNoStorageOrWritePath(stateSource, "SurfaceSelectionState");
    assertNoStorageOrWritePath(launcherSource, "Launcher");
    assert.equal(stateSource.includes("canDrag: true"), false);
    assert.equal(stateSource.includes("canResize: true"), false);
    assert.equal(stateSource.includes("canPersist: true"), false);
    assert.equal(stateSource.includes("wildcard"), false);
    assert.equal(stateSource.includes("default: true"), false);
    assert.equal(launcherSource.includes('from "./surfaceAdapters/surfaceSelectionState.js"'), true);
    assert.equal(launcherSource.includes("buildReadonlySurfaceSelectionState"), true);
    assert.equal(launcherSource.includes("selectSurface"), false);
    assert.equal(launcherSource.includes("data-ui-editor-surface-list"), false);
  });

  await run("SurfaceSelectionState: Dokumentation enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(DOC_PATH), true, "SurfaceSelection-State-Dokument fehlt.");
    const docSource = fs.readFileSync(DOC_PATH, "utf8");

    for (const required of [
      "SurfaceSelection-State",
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
      assert.equal(docSource.includes(required), true, `SurfaceSelection-State-Dokument enthaelt ${required} nicht.`);
    }
  });

  await run("SurfaceSelectionState: Launcher-Referenzdokument enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(LAUNCHER_REFERENCE_DOC_PATH), true, "SurfaceSelection-State-Launcher-Referenzdokument fehlt.");
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
    ]) {
      assert.equal(docSource.includes(required), true, `Launcher-Referenzdokument enthaelt ${required} nicht.`);
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

  runSurfaceSelectionStateTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runSurfaceSelectionStateTests };
