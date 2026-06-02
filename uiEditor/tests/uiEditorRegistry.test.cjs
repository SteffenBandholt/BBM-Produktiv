#!/usr/bin/env node

const assert = require("node:assert/strict");
const path = require("node:path");

const REGISTRY_PATH = path.resolve(__dirname, "../uiEditorRegistry.js");

function runUiEditorRegistryArtifactTests() {
  const { uiEditorRegistry } = require(REGISTRY_PATH);
  assert.equal(Array.isArray(uiEditorRegistry.uiScopes), true);

  const globalScope = uiEditorRegistry.uiScopes.find((scope) => scope.uiScope === "uiEditor.global");
  assert.equal(Boolean(globalScope), true, "missing uiEditor.global scope");
  assert.equal(Array.isArray(globalScope.elements), true);

  const launcher = globalScope.elements.find((element) => element.id === "uiEditor.launcherButton");
  assert.equal(Boolean(launcher), true, "missing uiEditor.launcherButton");
  assert.equal(launcher.type, "button");
  assert.equal(launcher.role, "editor-launcher");
  assert.equal(launcher.area, "overlay");
  assert.equal(launcher.position?.x, 24);
  assert.equal(launcher.position?.y, 24);
  assert.equal(launcher.editable, true);

  for (const op of ["move", "hide", "show"]) {
    assert.equal(launcher.allowedOps.includes(op), true, `missing allowed op: ${op}`);
  }

  for (const op of ["delete", "executeTargetAction", "modifyDomainData"]) {
    assert.equal(launcher.lockedOps.includes(op), true, `missing locked op: ${op}`);
  }
}

if (require.main === module) {
  try {
    runUiEditorRegistryArtifactTests();
    console.log("uiEditorRegistry.test.cjs passed");
  } catch (err) {
    console.error(err?.stack || err?.message || err);
    process.exitCode = 1;
  }
}
