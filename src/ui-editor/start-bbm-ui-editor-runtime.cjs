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

function createBlockedViewModels(runtimeResult) {
  const blockCode = runtimeResult?.blockCode || runtimeResult?.runtime?.blockCode || "BBM_UI_EDITOR_RUNTIME_NOT_STARTED";
  return {
    statusViewModel: { adapterValid: false, runtimeStarted: false, blockCode },
    scopeViewModel: { activeUiScope: null, activeLayoutScope: null, activeLayoutProfileId: null, blockCode },
    selectionViewModel: null,
    layoutControlViewModel: null,
  };
}

function getRuntimeBlockCode(runtimeResult) {
  return runtimeResult?.blockCode || runtimeResult?.runtime?.blockCode || runtimeResult?.status || null;
}

function normalizeRuntimeViewModels(runtimeResult, hostAdapter) {
  if (!runtimeResult?.ok) return createBlockedViewModels(runtimeResult);
  const kitViewModels = runtimeResult?.runtime?.viewModels || runtimeResult?.viewModels || null;
  if (kitViewModels) {
    return {
      ...kitViewModels,
      statusViewModel: kitViewModels.statusViewModel || kitViewModels.runtimeStatus || { adapterValid: true, runtimeStarted: true },
      scopeViewModel: kitViewModels.scopeViewModel || kitViewModels.scope || { activeUiScope: BBM_UI_SCOPE, activeLayoutScope: BBM_LAYOUT_SCOPE, activeLayoutProfileId: BBM_LAYOUT_PROFILE_ID },
      selectionViewModel: kitViewModels.selectionViewModel || kitViewModels.selection || { selectElement: hostAdapter.selectElement },
      layoutControlViewModel: kitViewModels.layoutControlViewModel || kitViewModels.layoutControls || null,
    };
  }
  return createFallbackViewModels(hostAdapter);
}

function startBbmUiEditorRuntime(options = {}) {
  const manifest = options.manifest || getBbmUiEditorManifest();
  const registry = options.registry || getBbmUiElementRegistry(manifest.uiScope || manifest.defaultUiScope || BBM_UI_SCOPE);
  const layoutStore = options.layoutStore || createMemoryLayoutStateStore();
  const hostAdapter = options.hostAdapter || createBbmHostAdapter({ layoutStore });

  try {
    const uiEditorKit = loadUiEditorKitPublicApi(options.coreApi);
    if (typeof uiEditorKit.createTargetAppAdapterRuntime !== "function") {
      return { ok: false, blockCode: "BBM_UI_EDITOR_KIT_API_MISSING", message: "createTargetAppAdapterRuntime is not available on the public UI-Editor-kit API.", viewModels: createBlockedViewModels({ blockCode: "BBM_UI_EDITOR_KIT_API_MISSING" }) };
    }
    const runtimeResult = uiEditorKit.createTargetAppAdapterRuntime({ adapterManifest: manifest, manifest, hostAdapter, registry, layoutStore });
    const ok = runtimeResult?.ok === true && runtimeResult?.runtime?.runtimeStatus?.ok !== false;
    const blockCode = ok ? null : getRuntimeBlockCode(runtimeResult) || "BBM_UI_EDITOR_RUNTIME_START_FAILED";
    return {
      ok,
      blockCode,
      message: runtimeResult?.message || null,
      manifest,
      hostAdapter,
      registry,
      layoutStore,
      runtime: runtimeResult,
      viewModels: normalizeRuntimeViewModels(runtimeResult, hostAdapter),
    };
  } catch (error) {
    const blockCode = error.code || "BBM_UI_EDITOR_RUNTIME_START_FAILED";
    return { ok: false, blockCode, message: error.message, manifest, hostAdapter, registry, layoutStore, runtime: null, viewModels: createBlockedViewModels({ blockCode }) };
  }
}

function getBbmUiEditorIntegrationStatus(runtimeResult) {
  const blockCode = getRuntimeBlockCode(runtimeResult);
  if (!runtimeResult?.ok) {
    return { adapterValid: false, runtimeStarted: false, blockCode: blockCode || "BBM_UI_EDITOR_RUNTIME_NOT_STARTED" };
  }
  return {
    adapterValid: true,
    runtimeStarted: true,
    activeScope: runtimeResult.manifest.uiScope || runtimeResult.manifest.defaultUiScope,
    activeLayoutScope: runtimeResult.manifest.layoutScope || runtimeResult.manifest.defaultLayoutScope,
    activeLayoutProfileId: runtimeResult.manifest.layoutProfileId || runtimeResult.manifest.defaultLayoutProfileId,
    registeredElementCount: runtimeResult.registry.elements.length,
    layoutStoreAvailable: Boolean(runtimeResult.layoutStore?.available),
    blockCode: null,
  };
}

module.exports = { startBbmUiEditorRuntime, getBbmUiEditorIntegrationStatus };
