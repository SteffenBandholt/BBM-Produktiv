"use strict";

const TARGET_APP_REGISTRY_CONTRACT = Object.freeze({
  contractName: "ui-editor-target-app-registry",
  contractVersion: "1.0.0",
  publicEntry: "uiEditor/targetAppRegistry.js",
});

const TARGET_APP_INFO = Object.freeze({
  targetAppId: "target-app",
  targetAppName: "Target App",
});

function cloneContractObject(value) {
  return { ...value };
}

function getTargetAppRegistryContractInfo() {
  return cloneContractObject(TARGET_APP_REGISTRY_CONTRACT);
}

function getTargetAppInfo() {
  return cloneContractObject(TARGET_APP_INFO);
}

function getAvailableUiScopes() {
  return [];
}

function getActiveUiScope(context) {
  const normalizedContext = context && typeof context === "object" ? context : {};

  return typeof normalizedContext.activeUiScope === "string" && normalizedContext.activeUiScope.trim() !== ""
    ? normalizedContext.activeUiScope
    : null;
}

function getUiRegistry(uiScope) {
  return {
    ok: false,
    uiScope,
    elements: [],
    reason: "unknown-ui-scope",
  };
}

function getOriginalValues(uiScope) {
  return {
    ok: true,
    uiScope,
    values: {},
  };
}

function getChangedValues(uiScope) {
  return {
    ok: true,
    uiScope,
    values: {},
  };
}

function saveChangedValues(uiScope, changes) {
  void changes;

  return {
    ok: false,
    uiScope,
    saved: false,
    reason: "storage-not-configured",
  };
}

module.exports = {
  getTargetAppRegistryContractInfo,
  getTargetAppInfo,
  getAvailableUiScopes,
  getActiveUiScope,
  getUiRegistry,
  getOriginalValues,
  getChangedValues,
  saveChangedValues,
};
