const { ipcMain } = require("electron");
const { startBbmUiEditorRuntime, getBbmUiEditorIntegrationStatus } = require("../../ui-editor/start-bbm-ui-editor-runtime.cjs");

let session = null;
let selectedElementId = null;

function getRuntimeBlockCode(result) {
  return result?.blockCode || result?.runtime?.blockCode || result?.runtime?.runtimeStatus?.blocked || result?.runtime?.status || null;
}

function sanitizeError(result) {
  return {
    ok: false,
    blockCode: String(getRuntimeBlockCode(result) || "BBM_UI_EDITOR_RUNTIME_UNAVAILABLE"),
    message: "Der UI-Editor-Status ist aktuell nicht verfuegbar.",
  };
}

function cloneElement(element, selected = false) {
  return {
    elementId: String(element?.elementId || ""),
    label: String(element?.label || ""),
    type: String(element?.type || ""),
    scope: String(element?.scope || ""),
    layoutScope: String(element?.layoutScope || ""),
    layoutProfileId: String(element?.layoutProfileId || ""),
    parentId: element?.parentId == null ? null : String(element.parentId),
    capabilities: Array.isArray(element?.capabilities) ? element.capabilities.map(String) : [],
    allowedChanges: Array.isArray(element?.allowedChanges) ? element.allowedChanges.map(String) : [],
    allowedOps: Array.isArray(element?.allowedOps) ? element.allowedOps.map(String) : [],
    lockedOps: Array.isArray(element?.lockedOps) ? element.lockedOps.map(String) : [],
    editable: Boolean(element?.editable),
    layoutDefaults: element?.layoutDefaults && typeof element.layoutDefaults === "object" && !Array.isArray(element.layoutDefaults) ? { ...element.layoutDefaults } : {},
    selected: Boolean(selected),
  };
}

function ensureRuntime(options = {}) {
  if (session && !options.forceRestart) return session;
  session = startBbmUiEditorRuntime(options.runtimeOptions || {});
  return session;
}

function getElementsFromSession(runtimeResult = ensureRuntime()) {
  if (!runtimeResult?.ok) return [];
  const elements = Array.isArray(runtimeResult?.registry?.elements) ? runtimeResult.registry.elements : [];
  return elements.map((element) => cloneElement(element, element.elementId === selectedElementId));
}

function getLayoutAvailability(runtimeResult = ensureRuntime()) {
  if (!runtimeResult?.ok) {
    return { available: false, hasStateForScopeAndProfile: false, canLoad: false, canSave: false, canReset: false };
  }
  const layoutStore = runtimeResult.layoutStore || null;
  const manifest = runtimeResult.manifest || {};
  const canLoad = typeof layoutStore?.load === "function";
  const entries = canLoad
    ? layoutStore.load({ layoutScope: manifest.defaultLayoutScope, layoutProfileId: manifest.defaultLayoutProfileId })
    : [];
  return {
    available: Boolean(layoutStore?.available),
    hasStateForScopeAndProfile: Array.isArray(entries) && entries.length > 0,
    canLoad,
    canSave: typeof layoutStore?.save === "function",
    canReset: typeof layoutStore?.reset === "function",
  };
}

function getUiEditorStatus() {
  const runtimeResult = ensureRuntime();
  if (!runtimeResult?.ok) return sanitizeError(runtimeResult);
  const integrationStatus = getBbmUiEditorIntegrationStatus(runtimeResult);
  const manifest = runtimeResult.manifest || {};
  const layout = getLayoutAvailability(runtimeResult);
  return {
    ok: true,
    targetAppId: manifest.targetAppId || "bbm-produktiv",
    targetAppName: "BBM",
    uiEditorKitVersion: manifest.uiEditorKitVersion || "v0.2.0",
    runtimeStarted: Boolean(integrationStatus.runtimeStarted),
    adapterValid: Boolean(integrationStatus.adapterValid),
    activeUiScope: integrationStatus.activeScope || manifest.defaultUiScope || "",
    activeLayoutScope: integrationStatus.activeLayoutScope || manifest.defaultLayoutScope || "",
    activeLayoutProfileId: integrationStatus.activeLayoutProfileId || manifest.defaultLayoutProfileId || "",
    registeredElementCount: Number(integrationStatus.registeredElementCount || 0),
    layoutStoreAvailable: Boolean(integrationStatus.layoutStoreAvailable),
    layout,
    blockCode: integrationStatus.blockCode || null,
    selectedElementId,
  };
}

function getUiEditorElements() {
  const runtimeResult = ensureRuntime();
  if (!runtimeResult?.ok) return { ...sanitizeError(runtimeResult), elements: [] };
  return { ok: true, elements: getElementsFromSession(runtimeResult) };
}

function selectUiEditorElement(payload = {}) {
  const runtimeResult = ensureRuntime();
  if (!runtimeResult?.ok) return sanitizeError(runtimeResult);
  const elementId = String(payload?.elementId || "").trim();
  if (!elementId) {
    selectedElementId = null;
    return { ok: true, selectedElement: null };
  }
  const selected = runtimeResult.hostAdapter.selectElement(elementId, runtimeResult.manifest.defaultUiScope);
  if (!selected?.ok) {
    return {
      ok: false,
      blockCode: String(selected?.blockCode || "BBM_UI_ELEMENT_SELECTION_BLOCKED"),
      message: "Dieses UI-Element ist nicht registriert oder nicht auswaehlbar.",
    };
  }
  selectedElementId = selected.selectedElement.elementId;
  return { ok: true, selectedElement: cloneElement(selected.selectedElement, true) };
}

function getSelectedUiEditorElementDetails() {
  const runtimeResult = ensureRuntime();
  if (!runtimeResult?.ok) return sanitizeError(runtimeResult);
  if (!selectedElementId) return { ok: true, selectedElement: null };
  const element = (runtimeResult.registry.elements || []).find((entry) => entry.elementId === selectedElementId);
  if (!element) {
    selectedElementId = null;
    return { ok: false, blockCode: "BBM_UI_ELEMENT_UNKNOWN", message: "Das ausgewaehlte UI-Element ist nicht registriert." };
  }
  return { ok: true, selectedElement: cloneElement(element, true) };
}

function closeUiEditorSession() {
  selectedElementId = null;
  session = null;
  return { ok: true };
}

function registerUiEditorIpc() {
  ipcMain.handle("uiEditor:open", async () => getUiEditorStatus());
  ipcMain.handle("uiEditor:close", async () => closeUiEditorSession());
  ipcMain.handle("uiEditor:getStatus", async () => getUiEditorStatus());
  ipcMain.handle("uiEditor:getElements", async () => getUiEditorElements());
  ipcMain.handle("uiEditor:selectElement", async (_event, payload) => selectUiEditorElement(payload));
  ipcMain.handle("uiEditor:getSelectedElementDetails", async () => getSelectedUiEditorElementDetails());
}

module.exports = {
  registerUiEditorIpc,
  _m52: {
    closeUiEditorSession,
    getLayoutAvailability,
    getUiEditorElements,
    ensureRuntime,
    getUiEditorStatus,
    selectUiEditorElement,
    getSelectedUiEditorElementDetails,
  },
};
