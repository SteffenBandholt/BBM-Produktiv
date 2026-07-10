"use strict";

const { getBbmUiEditorManifest, BBM_UI_SCOPE, BBM_LAYOUT_SCOPE, BBM_LAYOUT_PROFILE_ID } = require("./bbm-ui-editor-manifest.cjs");
const { getBbmUiElementRegistry } = require("./bbm-ui-element-registry.cjs");
const { createBbmHostAdapter, createMemoryLayoutStateStore } = require("./bbm-host-adapter.cjs");

function loadUiEditorKitPublicApi(coreApi) {
  if (coreApi) return coreApi;
  try {
    return require("ui-editor-kit");
  } catch (error) {
    error.code = "BBM_UI_EDITOR_KIT_NOT_AVAILABLE";
    throw error;
  }
}

function createFallbackViewModels(hostAdapter) {
  return {
    statusViewModel: { adapterValid: true, runtimeStarted: true },
    scopeViewModel: { activeUiScope: BBM_UI_SCOPE, activeLayoutScope: BBM_LAYOUT_SCOPE, activeLayoutProfileId: BBM_LAYOUT_PROFILE_ID },
    selectionViewModel: { selectElement: hostAdapter.selectElement },
    layoutControlViewModel: {
      load: hostAdapter.getCurrentLayoutState,
      save: hostAdapter.saveLayoutState,
      reset: hostAdapter.resetLayoutState,
    },
  };
}

function startBbmUiEditorRuntime(options = {}) {
  const manifest = getBbmUiEditorManifest();
  const registry = getBbmUiElementRegistry(manifest.defaultUiScope);
  const layoutStore = options.layoutStore || createMemoryLayoutStateStore();
  const hostAdapter = options.hostAdapter || createBbmHostAdapter({ layoutStore });

  try {
    const uiEditorKit = loadUiEditorKitPublicApi(options.coreApi);
    if (typeof uiEditorKit.createTargetAppAdapterRuntime !== "function") {
      return { ok: false, blockCode: "BBM_UI_EDITOR_KIT_API_MISSING", message: "createTargetAppAdapterRuntime is not available on the public UI-Editor-kit API." };
    }
    const runtime = uiEditorKit.createTargetAppAdapterRuntime({ manifest, hostAdapter, registry, layoutStore });
    return {
      ok: runtime?.ok !== false,
      manifest,
      hostAdapter,
      registry,
      layoutStore,
      runtime,
      viewModels: runtime?.viewModels || createFallbackViewModels(hostAdapter),
    };
  } catch (error) {
    return { ok: false, blockCode: error.code || "BBM_UI_EDITOR_RUNTIME_START_FAILED", message: error.message };
  }
}

function getBbmUiEditorIntegrationStatus(runtimeResult) {
  if (!runtimeResult?.ok) {
    return { adapterValid: false, runtimeStarted: false, blockCode: runtimeResult?.blockCode || "BBM_UI_EDITOR_RUNTIME_NOT_STARTED" };
  }
  return {
    adapterValid: true,
    runtimeStarted: true,
    activeScope: runtimeResult.manifest.defaultUiScope,
    activeLayoutScope: runtimeResult.manifest.defaultLayoutScope,
    activeLayoutProfileId: runtimeResult.manifest.defaultLayoutProfileId,
    registeredElementCount: runtimeResult.registry.elements.length,
    layoutStoreAvailable: Boolean(runtimeResult.layoutStore?.available),
    blockCode: null,
  };
}

module.exports = { startBbmUiEditorRuntime, getBbmUiEditorIntegrationStatus };
