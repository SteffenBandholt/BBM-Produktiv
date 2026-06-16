const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const COMMAND_PATH = path.join(
  REPO_ROOT,
  "src/renderer/uiEditor/surfaceAdapters/surfaceSwitchCommand.js"
);
const DOC_PATH = path.join(
  REPO_ROOT,
  "docs/UI_EDITOR_SURFACE_SWITCH_COMMAND_REFERENZSTAND.md"
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
    "BbmUiEditorRuntimeLauncher",
  ]) {
    assert.equal(source.includes(forbidden), false, `${label} enthaelt gesperrtes Fragment: ${forbidden}`);
  }
}

async function runSurfaceSwitchCommandTests(run) {
  const commandModule = await importEsmFromFile(COMMAND_PATH);

  await run("SurfaceSwitchCommand: exportiert read-only Request-Handler", () => {
    assert.equal(typeof commandModule.handleReadonlySurfaceSwitchRequest, "function");
    assert.equal(typeof commandModule.buildReadonlySurfaceSwitchCommand, "function");
    assert.equal(typeof commandModule.executeReadonlySurfaceSwitchCommand, "function");
  });

  await run("SurfaceSwitchCommand: erlaubt restarbeiten.ui.main, PDF-Seite 1 und Plan Canvas read-only", () => {
    const result = commandModule.handleReadonlySurfaceSwitchRequest({
      targetSurfaceId: "restarbeiten.ui.main",
    });

    assert.deepEqual(result, {
      handled: true,
      allowed: true,
      readonly: true,
      requestedSurfaceId: "restarbeiten.ui.main",
      resolvedSurfaceId: "restarbeiten.ui.main",
      changed: false,
      reason: "readonly-current-surface",
    });
    assert.deepEqual(
      commandModule.buildReadonlySurfaceSwitchCommand({ targetSurfaceId: "restarbeiten.ui.main" }),
      result
    );
    assert.deepEqual(
      commandModule.executeReadonlySurfaceSwitchCommand({ targetSurfaceId: "restarbeiten.ui.main" }),
      result
    );

    const pdfResult = commandModule.handleReadonlySurfaceSwitchRequest({
      targetSurfaceId: "pdf.plan.page.1",
    });
    assert.deepEqual(pdfResult, {
      handled: true,
      allowed: true,
      readonly: true,
      requestedSurfaceId: "pdf.plan.page.1",
      resolvedSurfaceId: "pdf.plan.page.1",
      changed: false,
      reason: "readonly-current-surface",
    });

    const planResult = commandModule.handleReadonlySurfaceSwitchRequest({
      targetSurfaceId: "plan.canvas.default",
    });
    assert.deepEqual(planResult, {
      handled: true,
      allowed: true,
      readonly: true,
      requestedSurfaceId: "plan.canvas.default",
      resolvedSurfaceId: "plan.canvas.default",
      changed: false,
      reason: "readonly-current-surface",
    });
  });

  await run("SurfaceSwitchCommand: blockiert unbekannte, Wildcard und leere Ziele", () => {
    for (const blockedSurfaceId of [
      "unknown.surface",
      "*",
      "",
      "   ",
    ]) {
      const result = commandModule.handleReadonlySurfaceSwitchRequest({
        targetSurfaceId: blockedSurfaceId,
      });

      assert.deepEqual(result, {
        handled: true,
        allowed: false,
        readonly: true,
        requestedSurfaceId: String(blockedSurfaceId || "").trim(),
        resolvedSurfaceId: "restarbeiten.ui.main",
        changed: false,
        reason: "surface-not-selectable-readonly",
      });
    }
  });

  await run("SurfaceSwitchCommand: bleibt frei von Storage-, IPC-, DB- und Launcher-Pfaden", () => {
    const source = fs.readFileSync(COMMAND_PATH, "utf8");
    assertNoStorageOrWritePath(source, "SurfaceSwitchCommand");
    for (const forbidden of [
      "canDrag: true",
      "canResize: true",
      "canPersist: true",
      "default: true",
      "selectSurface",
      "data-ui-editor-surface-list",
    ]) {
      assert.equal(source.includes(forbidden), false, `SurfaceSwitchCommand enthaelt gesperrtes Fragment: ${forbidden}`);
    }
  });

  await run("SurfaceSwitchCommand: bleibt kein aktiver Umschaltpfad", () => {
    const source = fs.readFileSync(COMMAND_PATH, "utf8");
    for (const forbidden of [
      "activeSurfaceId",
      "setActiveSurface",
      "activateSurface",
      "selectSurface",
      "localStorage",
      "writeFile",
      "default: true",
      "wildcard",
    ]) {
      assert.equal(source.includes(forbidden), false, `SurfaceSwitchCommand enthaelt gesperrtes Fragment: ${forbidden}`);
    }
  });

  await run("SurfaceSwitchCommand: Dokumentation enthaelt Kernbegriffe", () => {
    assert.equal(fs.existsSync(DOC_PATH), true, "SurfaceSwitch-Command-Dokument fehlt.");
    const docSource = fs.readFileSync(DOC_PATH, "utf8");

    for (const required of [
      "SurfaceSwitch-Request/Command-Handler",
      "restarbeiten.ui.main",
      "pdf.plan.page.1",
      "plan.canvas.default",
      "read-only",
      "changed",
      "false",
      "keine echte Umschaltung",
      "kein Drag",
      "keine Persistenz",
      "UI-Editor-kit speichert nicht",
    ]) {
      assert.equal(docSource.includes(required), true, `SurfaceSwitch-Command-Dokument enthaelt ${required} nicht.`);
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

  runSurfaceSwitchCommandTests(run).catch((err) => {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { runSurfaceSwitchCommandTests };
