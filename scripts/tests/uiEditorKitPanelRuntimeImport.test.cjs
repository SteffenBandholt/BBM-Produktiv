const assert = require("node:assert/strict");

const PANEL_RUNTIME_IMPORT = "ui-editor-kit/runtime/panel";

const EXPECTED_FUNCTION_EXPORTS = Object.freeze([
  "createDefaultPanelState",
  "normalizePanelPosition",
  "updatePanelPosition",
  "setPanelOpen",
  "buildPanelViewModel",
  "createPreviewButtons",
]);

function assertPanelRuntimeContract(runtime) {
  EXPECTED_FUNCTION_EXPORTS.forEach((exportName) => {
    assert.equal(typeof runtime[exportName], "function", `missing Kit Panel-Runtime export: ${exportName}`);
  });

  assert.deepEqual(runtime.PANEL_DEFAULT_POSITION, {
    left: null,
    top: 132,
    right: 24,
    bottom: null,
  });

  assert.deepEqual(runtime.createDefaultPanelState(), {
    isOpen: true,
    position: {
      left: null,
      top: 132,
      right: 24,
      bottom: null,
    },
  });

  assert.deepEqual(runtime.normalizePanelPosition({ left: "24px", top: "-4", right: "x" }), {
    left: 24,
    top: 0,
    right: null,
    bottom: null,
  });

  const positioned = runtime.updatePanelPosition({ isOpen: false }, { left: 10, top: 20 });
  assert.equal(positioned.isOpen, false);
  assert.deepEqual(positioned.position, { left: 10, top: 20, right: null, bottom: null });
  assert.equal(runtime.setPanelOpen(positioned, true).isOpen, true);
  assert.equal(runtime.setPanelOpen(positioned, false).isOpen, false);

  const viewModel = runtime.buildPanelViewModel({
    state: runtime.setPanelOpen(positioned, true),
    title: "Preview",
    element: {
      id: "sample.field",
      label: "Sample field",
      allowedOps: ["move", "resize", "hide"],
      lockedOps: ["show"],
    },
    previewTarget: {
      id: "sample.container",
      label: "Sample container",
    },
    pendingChangeSummary: {
      total: 2,
      operations: ["move", "width"],
    },
    statusText: "Aenderungen vorbereitet",
  });

  assert.equal(viewModel.isOpen, true);
  assert.equal(viewModel.title, "Preview");
  assert.equal(viewModel.targetId, "sample.field");
  assert.equal(viewModel.targetLabel, "Sample field");
  assert.equal(viewModel.previewTargetId, "sample.container");
  assert.equal(viewModel.previewTargetLabel, "Sample container");
  assert.deepEqual(viewModel.allowedOps, ["move", "resize", "hide"]);
  assert.deepEqual(viewModel.lockedOps, ["show"]);
  assert.deepEqual(viewModel.pendingChangeSummary, { total: 2, operations: ["move", "width"] });
  assert.equal(viewModel.canReset, true);
  assert.equal(viewModel.canDiscard, true);
  assert.equal(viewModel.statusText, "Aenderungen vorbereitet");
  assert.equal(Array.isArray(viewModel.buttons), true);
  assert.equal(viewModel.buttons.some((button) => button.id === "move-left" && button.isEnabled), true);
  assert.equal(viewModel.buttons.some((button) => button.id === "width-plus" && button.isEnabled), true);
  assert.equal(viewModel.buttons.some((button) => button.id === "show" && button.isEnabled), false);
  assert.equal(viewModel.buttons.some((button) => button.id === "reset" && button.isEnabled), true);
  assert.equal(viewModel.buttons.some((button) => button.id === "discard" && button.isEnabled), true);

  const serialized = JSON.stringify(viewModel);
  assert.equal(serialized.includes("<"), false, "Panel-ViewModel darf keine HTML-Strings enthalten.");
  assert.equal(Object.values(viewModel).some((value) => value && typeof value === "object" && typeof value.nodeType === "number"), false);
}

async function runUiEditorKitPanelRuntimeImportTests(run) {
  await run("UI-Editor-kit Panel-Runtime: offizieller CommonJS-Importvertrag funktioniert", () => {
    const runtime = require(PANEL_RUNTIME_IMPORT);
    assertPanelRuntimeContract(runtime);
  });

  await run("UI-Editor-kit Panel-Runtime: offizieller ESM-Importvertrag funktioniert", async () => {
    const runtime = await import(PANEL_RUNTIME_IMPORT);
    assertPanelRuntimeContract(runtime);
    assertPanelRuntimeContract(runtime.default);
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

  runUiEditorKitPanelRuntimeImportTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runUiEditorKitPanelRuntimeImportTests };
