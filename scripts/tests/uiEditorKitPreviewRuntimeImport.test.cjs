const assert = require("node:assert/strict");

const PREVIEW_RUNTIME_IMPORT = "ui-editor-kit/runtime/preview";

const EXPECTED_FUNCTION_EXPORTS = Object.freeze([
  "getElementAllowedOps",
  "getElementLockedOps",
  "getChangeRequestOperation",
  "isPreviewOperationAllowed",
  "getNodeUiEditorId",
  "findAncestorUiEditorElementById",
  "normalizePreviewTargetMode",
  "getPreviewTargetMode",
  "resolvePreviewTargetElement",
  "getPreviewTargetElement",
  "getPreviewTargetElementId",
  "upsertPreviewChangeRequest",
  "removePendingChangeRequestsForTarget",
  "getPendingChangeRequestSummary",
]);

function createNode(id = "") {
  return {
    parentElement: null,
    attributes: id ? { "data-ui-editor-id": id } : {},
    getAttribute(name) {
      return Object.hasOwn(this.attributes, String(name)) ? this.attributes[String(name)] : null;
    },
  };
}

function createState(registryElement) {
  return {
    activeUiScope: "sample.screen",
    selectedElement: registryElement,
    pendingChangeRequests: [],
    changeRequestSequence: 0,
  };
}

function getNextChangeRequestId(state) {
  state.changeRequestSequence += 1;
  return `preview-${state.changeRequestSequence}`;
}

function assertPreviewRuntimeContract(runtime) {
  EXPECTED_FUNCTION_EXPORTS.forEach((exportName) => {
    assert.equal(typeof runtime[exportName], "function", `missing Kit Preview-Runtime export: ${exportName}`);
  });

  assert.equal(runtime.UNKNOWN_PREVIEW_TARGET_APP_ID, "unknown-host");
  assert.equal(runtime.UI_EDITOR_ID_ATTRIBUTE, "data-ui-editor-id");
  assert.equal(runtime.getChangeRequestOperation("resizeWidth"), "width");
  assert.equal(runtime.getChangeRequestOperation("resizeHeight"), "height");
  assert.equal(runtime.getChangeRequestOperation("hide"), "visibility");

  const registryElement = { id: "sample.field.input", previewTargetMode: "self" };
  const state = createState(registryElement);
  const targetNode = createNode("sample.field.input");

  runtime.upsertPreviewChangeRequest({
    state,
    registry: {},
    registryElement,
    targetNode,
    operation: "move",
    payload: { dx: 1, dy: 0 },
    getNextChangeRequestId,
  });

  assert.equal(state.pendingChangeRequests.length, 1);
  assert.equal(state.pendingChangeRequests[0].targetAppId, "unknown-host");
  assert.equal(state.pendingChangeRequests[0].source, "preview");
  assert.equal(state.pendingChangeRequests[0].persistent, false);
}

async function runUiEditorKitPreviewRuntimeImportTests(run) {
  await run("UI-Editor-kit Preview-Runtime: offizieller CommonJS-Importvertrag funktioniert", () => {
    const runtime = require(PREVIEW_RUNTIME_IMPORT);
    assertPreviewRuntimeContract(runtime);
  });

  await run("UI-Editor-kit Preview-Runtime: offizieller ESM-Importvertrag funktioniert", async () => {
    const runtime = await import(PREVIEW_RUNTIME_IMPORT);
    assertPreviewRuntimeContract(runtime);
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

  runUiEditorKitPreviewRuntimeImportTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = { runUiEditorKitPreviewRuntimeImportTests };
