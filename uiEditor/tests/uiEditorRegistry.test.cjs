#!/usr/bin/env node

const assert = require("node:assert/strict");
const path = require("node:path");

const { uiEditorRegistry } = require(path.resolve(__dirname, "../uiEditorRegistry.js"));

assert.equal(Boolean(uiEditorRegistry), true);
assert.equal(Array.isArray(uiEditorRegistry.uiScopes), true);
assert.equal(uiEditorRegistry.uiScopes.length, 1);
assert.equal(uiEditorRegistry.uiScopes[0].uiScopeId, "uiEditor.global");
assert.equal(Array.isArray(uiEditorRegistry.uiScopes[0].elements), true);
assert.equal(uiEditorRegistry.uiScopes[0].elements.length, 1);
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].id, "uiEditor.launcherButton");
assert.deepEqual(uiEditorRegistry.uiScopes[0].elements[0].position, { x: 24, y: 24 });
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].editable, true);
assert.deepEqual(uiEditorRegistry.uiScopes[0].elements[0].allowedOps, ["move", "hide", "show"]);
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].lockedOps.includes("delete"), true);
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].lockedOps.includes("executeTargetAction"), true);

console.log("TESTS OK: uiEditorRegistry contract");
