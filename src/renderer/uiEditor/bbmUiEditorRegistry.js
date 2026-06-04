import { getProtokollUiEditorElements } from "../modules/protokoll/uiEditor/protokollUiElements.js";
import {
  BBM_UI_EDITOR_DEMO_SCOPE,
  getBbmUiEditorDemoElements,
} from "./demo/bbmUiEditorDemoElements.js";

const TARGET_INFO = Object.freeze({
  targetAppId: "bbm-produktiv",
  targetAppName: "BBM-Produktiv",
  registryVersion: "1.0.0",
});

const PROTOKOLL_TOPS_SCOPE = Object.freeze({
  uiScope: "protokoll.topsScreen",
  moduleId: "protokoll",
  label: "Protokoll",
  status: "available",
});

const BBM_DEMO_SCOPE = Object.freeze({
  uiScope: BBM_UI_EDITOR_DEMO_SCOPE,
  moduleId: "uiEditor",
  label: "BBM UI-Editor Demo",
  status: "available",
});

const AVAILABLE_UI_SCOPES = Object.freeze([PROTOKOLL_TOPS_SCOPE, BBM_DEMO_SCOPE]);
const ACTIVE_UI_SCOPE = "protokoll.topsScreen";

function cloneScope(scope) {
  return { ...scope };
}

export function getBbmUiEditorTargetInfo() {
  return { ...TARGET_INFO };
}

export function getAvailableUiScopes() {
  return AVAILABLE_UI_SCOPES.map(cloneScope);
}

export function getActiveUiScope() {
  return ACTIVE_UI_SCOPE;
}

export function getBbmUiEditorRegistry(uiScope = getActiveUiScope()) {
  if (uiScope === PROTOKOLL_TOPS_SCOPE.uiScope) {
    return {
      targetAppId: TARGET_INFO.targetAppId,
      uiScope: PROTOKOLL_TOPS_SCOPE.uiScope,
      moduleId: PROTOKOLL_TOPS_SCOPE.moduleId,
      elements: getProtokollUiEditorElements(),
    };
  }

  if (uiScope === BBM_DEMO_SCOPE.uiScope) {
    return {
      targetAppId: TARGET_INFO.targetAppId,
      uiScope: BBM_DEMO_SCOPE.uiScope,
      moduleId: BBM_DEMO_SCOPE.moduleId,
      elements: getBbmUiEditorDemoElements(),
    };
  }

  return {
    ok: false,
    targetAppId: TARGET_INFO.targetAppId,
    uiScope,
    elements: [],
    reason: `Unknown UI scope: ${String(uiScope)}`,
  };
}
