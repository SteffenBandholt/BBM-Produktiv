"use strict";

const path = require("node:path");

const BBM_UI_EDITOR_REGISTRY_RELATIVE_PATH =
  "src/renderer/uiEditor/bbmUiEditorRegistry.js";

const INSTALLED_UI_EDITOR_REGISTRY_INFO = Object.freeze({
  installedEntry: "uiEditor/uiEditorRegistry.js",
  targetApp: "BBM-Produktiv",
  registryMode: "target-app-registry-reference",
  officialBbmRegistryPath: BBM_UI_EDITOR_REGISTRY_RELATIVE_PATH,
  createsOwnRegistry: false,
  activeExampleScope: false,
});

function getInstalledUiEditorRegistryInfo() {
  return { ...INSTALLED_UI_EDITOR_REGISTRY_INFO };
}

function getOfficialBbmUiEditorRegistryPath(repoRoot = path.resolve(__dirname, "..")) {
  return path.resolve(repoRoot, BBM_UI_EDITOR_REGISTRY_RELATIVE_PATH);
}

async function loadBbmUiEditorRegistry(importEsmFromFile, options = {}) {
  if (typeof importEsmFromFile !== "function") {
    throw new TypeError("loadBbmUiEditorRegistry needs an ESM file importer function");
  }

  const registryPath = getOfficialBbmUiEditorRegistryPath(options.repoRoot);
  return importEsmFromFile(registryPath);
}

const uiEditorRegistry = Object.freeze({
  ...INSTALLED_UI_EDITOR_REGISTRY_INFO,
  uiScopes: Object.freeze([]),
});

module.exports = {
  BBM_UI_EDITOR_REGISTRY_RELATIVE_PATH,
  getInstalledUiEditorRegistryInfo,
  getOfficialBbmUiEditorRegistryPath,
  loadBbmUiEditorRegistry,
  uiEditorRegistry,
};
