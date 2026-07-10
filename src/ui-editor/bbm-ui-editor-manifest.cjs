"use strict";

const BBM_UI_EDITOR_KIT_VERSION = "v0.2.0";
const BBM_UI_SCOPE = "bbm.main";
const BBM_LAYOUT_SCOPE = "bbm.main-layout";
const BBM_LAYOUT_PROFILE_ID = "default";

const bbmUiEditorManifest = Object.freeze({
  targetAppId: "bbm-produktiv",
  adapterName: "BBM UI-Editor Adapter",
  adapterVersion: "M51",
  contractVersion: "ui-editor-kit@v0.2.0",
  uiEditorKitVersion: BBM_UI_EDITOR_KIT_VERSION,
  releaseCommit: "bb0804b318981a5d03a97cc3b2b5df7b1b96aabf",
  uiScopes: Object.freeze([BBM_UI_SCOPE]),
  layoutScopes: Object.freeze([BBM_LAYOUT_SCOPE]),
  defaultLayoutProfileId: BBM_LAYOUT_PROFILE_ID,
  defaultUiScope: BBM_UI_SCOPE,
  defaultLayoutScope: BBM_LAYOUT_SCOPE,
  capabilities: Object.freeze([
    "registry.read",
    "scope.validate",
    "element.select",
    "layout.read",
    "layout.save",
    "layout.reset",
    "status.read",
  ]),
});

function getBbmUiEditorManifest() {
  return {
    ...bbmUiEditorManifest,
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
  bbmUiEditorManifest,
  getBbmUiEditorManifest,
};
