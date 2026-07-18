"use strict";

const BBM_UI_EDITOR_KIT_VERSION = "v0.2.0";
const BBM_UI_SCOPE = "bbm.main";
const BBM_LAYOUT_SCOPE = "bbm.main-layout";
const BBM_LAYOUT_PROFILE_ID = "default";

const BBM_SUPPORTED_ELEMENT_TYPES = Object.freeze(["frame", "navigation", "header", "content", "root", "container", "text", "action", "field", "table", "actions"]);
const BBM_SUPPORTED_ROLES = Object.freeze(["layout", "navigation", "content", "action", "test-workspace", "heading", "visual-control", "input", "select", "content-table"]);
const BBM_SUPPORTED_OPERATIONS = Object.freeze([
  "layout.read",
  "layout.save",
  "layout.reset",
  "element.select",
  "registry.read",
  "scope.validate",
  "status.read",
]);
const BBM_LOCKED_OPERATIONS = Object.freeze([
  "drag",
  "resize",
  "style",
  "color",
  "font",
  "delete",
  "create",
  "dom.scan",
]);

const bbmUiEditorManifest = Object.freeze({
  targetAppId: "bbm-produktiv",
  adapterName: "BBM UI-Editor Adapter",
  adapterVersion: "M51",
  contractVersion: "ui-editor-kit@v0.2.0",
  uiEditorKitVersion: BBM_UI_EDITOR_KIT_VERSION,
  releaseCommit: "bb0804b318981a5d03a97cc3b2b5df7b1b96aabf",
  uiScope: BBM_UI_SCOPE,
  layoutScope: BBM_LAYOUT_SCOPE,
  layoutProfileId: BBM_LAYOUT_PROFILE_ID,
  supportedElementTypes: BBM_SUPPORTED_ELEMENT_TYPES,
  supportedRoles: BBM_SUPPORTED_ROLES,
  supportedOperations: BBM_SUPPORTED_OPERATIONS,
  lockedOperations: BBM_LOCKED_OPERATIONS,
  persistenceMode: "memory-only",
  executionMode: "test-host",
  riskClass: "low",
  rollbackStrategy: "memory-reset",
  testStrategy: "target-app-adapter-contract-test",
  manifestVersion: "1.0",
  description: "BBM M51/M52 technical UI-Editor-kit adapter manifest.",
  uiToLayoutScope: Object.freeze({ [BBM_UI_SCOPE]: BBM_LAYOUT_SCOPE }),
  saveLayoutState: true,
  loadLayoutState: true,
  resetLayoutState: true,
  uiScopes: Object.freeze([BBM_UI_SCOPE]),
  layoutScopes: Object.freeze([BBM_LAYOUT_SCOPE]),
  defaultLayoutProfileId: BBM_LAYOUT_PROFILE_ID,
  defaultUiScope: BBM_UI_SCOPE,
  defaultLayoutScope: BBM_LAYOUT_SCOPE,
  capabilities: BBM_SUPPORTED_OPERATIONS,
});

function getBbmUiEditorManifest() {
  return {
    ...bbmUiEditorManifest,
    supportedElementTypes: [...bbmUiEditorManifest.supportedElementTypes],
    supportedRoles: [...bbmUiEditorManifest.supportedRoles],
    supportedOperations: [...bbmUiEditorManifest.supportedOperations],
    lockedOperations: [...bbmUiEditorManifest.lockedOperations],
    uiToLayoutScope: { ...bbmUiEditorManifest.uiToLayoutScope },
    uiScopes: [...bbmUiEditorManifest.uiScopes],
    layoutScopes: [...bbmUiEditorManifest.layoutScopes],
    capabilities: [...bbmUiEditorManifest.capabilities],
  };
}

module.exports = {
  BBM_UI_EDITOR_KIT_VERSION,
  BBM_UI_SCOPE,
  BBM_LAYOUT_SCOPE,
  BBM_LAYOUT_PROFILE_ID,
  BBM_SUPPORTED_ELEMENT_TYPES,
  BBM_SUPPORTED_ROLES,
  BBM_SUPPORTED_OPERATIONS,
  BBM_LOCKED_OPERATIONS,
  bbmUiEditorManifest,
  getBbmUiEditorManifest,
};
