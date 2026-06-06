#!/usr/bin/env node

const assert = require("node:assert/strict");
const path = require("node:path");

const { uiEditorRegistry } = require(path.resolve(__dirname, "../uiEditorRegistry.js"));

assert.equal(Boolean(uiEditorRegistry), true);
assert.equal(Array.isArray(uiEditorRegistry.uiScopes), true);
assert.equal(uiEditorRegistry.uiScopes.length, 1);
assert.equal(uiEditorRegistry.uiScopes[0].uiScopeId, "uiEditor.global");
assert.equal(Array.isArray(uiEditorRegistry.uiScopes[0].elements), true);
assert.equal(uiEditorRegistry.uiScopes[0].elements.length, 2);
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].id, "uiEditor.root");
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].name, "UI-Editor Root");
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].type, "root");
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].role, "system");
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].parentId, null);
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].order, 0);
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].visible, true);
assert.equal(uiEditorRegistry.uiScopes[0].elements[0].editable, false);
assert.deepEqual(uiEditorRegistry.uiScopes[0].elements[0].allowedOps, ["inspect"]);
assert.deepEqual(uiEditorRegistry.uiScopes[0].elements[0].lockedOps, []);
assert.equal(uiEditorRegistry.uiScopes[0].elements[1].id, "uiEditor.launcherButton");
assert.equal(uiEditorRegistry.uiScopes[0].elements[1].name, "UI-Editor Launcher");
assert.equal(uiEditorRegistry.uiScopes[0].elements[1].type, "button");
assert.equal(uiEditorRegistry.uiScopes[0].elements[1].role, "editor-launcher");
assert.equal(uiEditorRegistry.uiScopes[0].elements[1].parentId, "uiEditor.root");
assert.equal(uiEditorRegistry.uiScopes[0].elements[1].order, 10);
assert.equal(uiEditorRegistry.uiScopes[0].elements[1].visible, true);
assert.equal(uiEditorRegistry.uiScopes[0].elements[1].editable, true);
assert.equal(uiEditorRegistry.uiScopes[0].elements[1].area, "overlay");
assert.deepEqual(uiEditorRegistry.uiScopes[0].elements[1].position, { x: 24, y: 24 });
assert.deepEqual(uiEditorRegistry.uiScopes[0].elements[1].allowedOps, ["inspect", "move", "hide", "show"]);
assert.deepEqual(uiEditorRegistry.uiScopes[0].elements[1].lockedOps, ["rename", "delete", "executeTargetAction", "modifyDomainData"]);

console.log("TESTS OK: uiEditorRegistry contract");
