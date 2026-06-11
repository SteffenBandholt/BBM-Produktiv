const assert = require("node:assert/strict");

const HIDDEN_ELEMENTS_RUNTIME_IMPORT = "ui-editor-kit/runtime/hidden-elements";

const EXPECTED_FUNCTION_EXPORTS = Object.freeze([
  "normalizeHiddenElement",
  "getHiddenElements",
  "buildHiddenElementsButtonViewModel",
  "buildHiddenElementsPopoverViewModel",
  "buildHiddenElementsViewModel",
]);

function assertHiddenElementsRuntimeContract(runtime) {
  EXPECTED_FUNCTION_EXPORTS.forEach((exportName) => {
    assert.equal(typeof runtime[exportName], "function", `missing Kit Hidden-Elements-Runtime export: ${exportName}`);
  });

  assert.equal(runtime.normalizeHiddenElement(null), null);
  assert.deepEqual(runtime.normalizeHiddenElement({
    id: " sample.field ",
    name: " Sample field ",
    visible: false,
  }), {
    elementId: "sample.field",
    label: "Sample field",
    visible: false,
    hidden: true,
    canShow: true,
    action: "show",
    enabled: true,
  });

  const elements = [
    { elementId: "visible.field", label: "Visible field", visible: true, canShow: true },
    { elementId: "hidden.field", label: "Hidden field", visible: false, canShow: true },
    { elementId: "locked.field", label: "Locked field", visible: false, canShow: false },
  ];

  const hiddenElements = runtime.getHiddenElements(elements);
  assert.deepEqual(hiddenElements.map((element) => element.elementId), ["hidden.field", "locked.field"]);
  assert.equal(hiddenElements.some((element) => element.elementId === "visible.field"), false);

  assert.deepEqual(runtime.buildHiddenElementsButtonViewModel({ elements: [] }), {
    visible: false,
    enabled: false,
    label: "Ausgeblendete: 0",
    hiddenCount: 0,
  });

  const button = runtime.buildHiddenElementsButtonViewModel({ elements });
  assert.deepEqual(button, {
    visible: true,
    enabled: true,
    label: "Ausgeblendete: 2",
    hiddenCount: 2,
  });

  const popover = runtime.buildHiddenElementsPopoverViewModel({ elements });
  assert.equal(popover.title, "Ausgeblendete Elemente");
  assert.deepEqual(popover.items, [
    { elementId: "hidden.field", label: "Hidden field", action: "show", enabled: true },
    { elementId: "locked.field", label: "Locked field", action: "show", enabled: false },
  ]);

  const viewModel = runtime.buildHiddenElementsViewModel({ elements });
  assert.equal(viewModel.hiddenCount, 2);
  assert.deepEqual(viewModel.button, button);
  assert.deepEqual(viewModel.popover, popover);

  const serialized = JSON.stringify(viewModel);
  assert.equal(serialized.includes("<"), false, "Hidden-Elements-ViewModel darf keine HTML-Strings enthalten.");
  assert.equal(Object.values(viewModel).some((value) => value && typeof value === "object" && typeof value.nodeType === "number"), false);
}

async function runUiEditorKitHiddenElementsRuntimeImportTests(run) {
  await run("UI-Editor-kit Hidden-Elements-Runtime: offizieller CommonJS-Importvertrag funktioniert", () => {
    const runtime = require(HIDDEN_ELEMENTS_RUNTIME_IMPORT);
    assertHiddenElementsRuntimeContract(runtime);
  });

  await run("UI-Editor-kit Hidden-Elements-Runtime: offizieller ESM-Importvertrag funktioniert", async () => {
    const runtime = await import(HIDDEN_ELEMENTS_RUNTIME_IMPORT);
    assertHiddenElementsRuntimeContract(runtime);
    assertHiddenElementsRuntimeContract(runtime.default);
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

  runUiEditorKitHiddenElementsRuntimeImportTests(run).then(() => {
    if (failed) process.exitCode = 1;
  });
}

module.exports = {
  assertHiddenElementsRuntimeContract,
  runUiEditorKitHiddenElementsRuntimeImportTests,
};
