#!/usr/bin/env node

const assert = require("node:assert/strict");
const path = require("node:path");

const { uiEditorRegistry } = require(path.resolve(__dirname, "../uiEditorRegistry.js"));

assert.equal(Boolean(uiEditorRegistry), true);
assert.equal(Array.isArray(uiEditorRegistry.uiScopes), true);
assert.equal(uiEditorRegistry.uiScopes.length, 1);
assert.equal(uiEditorRegistry.uiScopes[0].uiScopeId, "example-ui-scope");
assert.equal(Array.isArray(uiEditorRegistry.uiScopes[0].elements), true);
assert.equal(uiEditorRegistry.uiScopes[0].elements.length, 0);

console.log("TESTS OK: uiEditorRegistry contract");
