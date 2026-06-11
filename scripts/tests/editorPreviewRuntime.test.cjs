const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

const PREVIEW_DIR = path.join(__dirname, "../../src/renderer/editorRuntime/preview");
const OPERATIONS_PATH = path.join(PREVIEW_DIR, "editorPreviewOperations.js");
const TARGET_MODEL_PATH = path.join(PREVIEW_DIR, "editorPreviewTargetModel.js");
const CHANGE_REQUESTS_PATH = path.join(PREVIEW_DIR, "editorPendingChangeRequests.js");

function createNode(id = "", parentElement = null) {
  return {
    parentElement,
    attributes: id ? { "data-ui-editor-id": id } : {},
    getAttribute(name) {
      return Object.hasOwn(this.attributes, String(name)) ? this.attributes[String(name)] : null;
    },
  };
}

async function runEditorPreviewRuntimeTests(run) {
  await run("EditorRuntime Preview: Operation-Mapping und Sperren bleiben generisch", async () => {
    const mod = await importEsmFromFile(OPERATIONS_PATH);

    assert.equal(mod.getChangeRequestOperation("resizeWidth"), "width");
    assert.equal(mod.getChangeRequestOperation("resizeHeight"), "height");
    assert.equal(mod.getChangeRequestOperation("hide"), "visibility");
    assert.equal(mod.getChangeRequestOperation("show"), "visibility");

    assert.equal(mod.isPreviewOperationAllowed({ allowedOps: ["inspect", "resize"], lockedOps: [] }, "resizeWidth"), true);
    assert.equal(mod.isPreviewOperationAllowed({ allowedOps: ["inspect", "width"], lockedOps: [] }, "resizeWidth"), true);
    assert.equal(mod.isPreviewOperationAllowed({ allowedOps: ["inspect", "width"], lockedOps: [] }, "resizeHeight"), false);
    assert.equal(mod.isPreviewOperationAllowed({ allowedOps: ["inspect", "resize"], lockedOps: ["width"] }, "resizeWidth"), false);
    assert.equal(mod.isPreviewOperationAllowed({ allowedOps: ["inspect", "resize", "width"], lockedOps: ["resize"] }, "resizeWidth"), true);
    assert.equal(mod.isPreviewOperationAllowed({ allowedOps: ["inspect", "move"], lockedOps: ["move"] }, "move"), false);
  });

  await run("EditorRuntime Preview: Zielmodell wertet self und parent ohne Fachbegriffe aus", async () => {
    const mod = await importEsmFromFile(TARGET_MODEL_PATH);
    const root = createNode("sample.root");
    const field = createNode("sample.field", root);
    const input = createNode("sample.field.input", field);

    assert.equal(mod.getPreviewTargetMode({ previewTargetMode: "self" }), "self");
    assert.equal(mod.getPreviewTargetMode({ previewTarget: { mode: "container" } }), "parent");
    assert.equal(mod.getPreviewTargetMode({ editGranularity: "unknown" }), "auto");
    assert.equal(mod.getNodeUiEditorId(input), "sample.field.input");
    assert.equal(mod.resolvePreviewTargetElement({
      selectionElement: { id: "sample.field.input", parentId: "sample.field", previewTargetMode: "parent" },
      targetNode: input,
    }), field);
    assert.equal(mod.resolvePreviewTargetElement({
      selectionElement: { id: "sample.field.input", parentId: "sample.field", previewTargetMode: "self" },
      targetNode: input,
    }), input);
  });

  await run("EditorRuntime Preview: Pending ChangeRequests kumulieren und deduplizieren generisch", async () => {
    const mod = await importEsmFromFile(CHANGE_REQUESTS_PATH);
    const targetNode = createNode("sample.field.input");
    const registryElement = { id: "sample.field.input", previewTargetMode: "self" };
    const state = {
      activeUiScope: "sample.screen",
      selectedElement: registryElement,
      pendingChangeRequests: [],
      changeRequestSequence: 0,
    };
    const notifications = [];
    const upsert = (operation, payload) => mod.upsertPreviewChangeRequest({
      state,
      registry: { targetAppId: "sample-app", moduleId: "sample", uiScope: "sample.screen" },
      registryElement,
      targetNode,
      operation,
      payload,
      getNextChangeRequestId(currentState) {
        currentState.changeRequestSequence += 1;
        return `preview-${currentState.changeRequestSequence}`;
      },
      notify(currentState) {
        notifications.push(currentState.pendingChangeRequests.length);
      },
    });

    upsert("move", { dx: 3, dy: 0 });
    upsert("move", { dx: 2, dy: 4 });
    upsert("resizeWidth", { delta: 5 });
    upsert("resizeWidth", { delta: -2 });
    upsert("hide", {});
    upsert("show", {});

    assert.equal(state.pendingChangeRequests.length, 3);
    assert.deepEqual(state.pendingChangeRequests.find((request) => request.operation === "move").payload, { dx: 5, dy: 4 });
    assert.deepEqual(state.pendingChangeRequests.find((request) => request.operation === "width").payload, { delta: 3 });
    assert.deepEqual(state.pendingChangeRequests.find((request) => request.operation === "visibility").payload, { visible: true });
    assert.equal(state.pendingChangeRequests.every((request) => request.source === "preview" && request.persistent === false), true);
    assert.deepEqual(mod.getPendingChangeRequestSummary(state, "sample.field.input").operations.sort(), ["move", "visibility", "width"]);

    const removed = mod.removePendingChangeRequestsForTarget({
      state,
      targetNode,
      notify(currentState) {
        notifications.push(currentState.pendingChangeRequests.length);
      },
    });

    assert.equal(removed, 3);
    assert.equal(state.pendingChangeRequests.length, 0);
    assert.equal(notifications.length > 0, true);
  });

  await run("EditorRuntime Preview: targetAppId kommt aus HostContext oder neutralem Fallback", async () => {
    const mod = await importEsmFromFile(CHANGE_REQUESTS_PATH);
    const targetNode = createNode("sample.field.input");
    const registryElement = { id: "sample.field.input", previewTargetMode: "self" };
    const createState = () => ({
      activeUiScope: "sample.screen",
      selectedElement: registryElement,
      pendingChangeRequests: [],
      changeRequestSequence: 0,
    });
    const getNextChangeRequestId = (currentState) => {
      currentState.changeRequestSequence += 1;
      return `preview-${currentState.changeRequestSequence}`;
    };

    const hostState = createState();
    mod.upsertPreviewChangeRequest({
      state: hostState,
      hostContext: { targetAppId: "sample-app", moduleId: "sample-host", scopeId: "sample.screen" },
      registry: { targetAppId: "registry-app", moduleId: "sample-registry", uiScope: "sample.registry" },
      registryElement,
      targetNode,
      operation: "move",
      payload: { dx: 1, dy: 0 },
      getNextChangeRequestId,
    });
    assert.equal(hostState.pendingChangeRequests[0].targetAppId, "sample-app");
    assert.equal(hostState.pendingChangeRequests[0].moduleId, "sample-host");
    assert.equal(hostState.pendingChangeRequests[0].scopeId, "sample.screen");

    const fallbackState = createState();
    mod.upsertPreviewChangeRequest({
      state: fallbackState,
      registry: {},
      registryElement,
      targetNode,
      operation: "move",
      payload: { dx: 1, dy: 0 },
      getNextChangeRequestId,
    });
    assert.equal(fallbackState.pendingChangeRequests[0].targetAppId, "unknown-host");
    assert.notEqual(fallbackState.pendingChangeRequests[0].targetAppId, "bbm");
  });

  await run("EditorRuntime Preview: neue Module bleiben ohne Speicher- und Fach-Sonderlogik", () => {
    const source = [
      fs.readFileSync(OPERATIONS_PATH, "utf8"),
      fs.readFileSync(TARGET_MODEL_PATH, "utf8"),
      fs.readFileSync(CHANGE_REQUESTS_PATH, "utf8"),
    ].join("\n");
    for (const forbidden of [
      "localStorage",
      "sessionStorage",
      "ipc",
      "ipcRenderer",
      "writeFile",
      "BBM",
      "restarbeiten",
      "Kurztext",
      "Editbox",
      "Filterbar",
      "PDF",
    ]) {
      assert.equal(source.includes(forbidden), false, `forbidden runtime term: ${forbidden}`);
    }
  });
}

module.exports = { runEditorPreviewRuntimeTests };
