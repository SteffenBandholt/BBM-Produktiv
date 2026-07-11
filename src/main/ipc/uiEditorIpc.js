const { ipcMain } = require("electron");
const { startBbmUiEditorRuntime, getBbmUiEditorIntegrationStatus } = require("../../ui-editor/start-bbm-ui-editor-runtime.cjs");

let session = null;
let selectedElementId = null;
let currentDraft = null;

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
    layoutDefaults: element?.layoutDefaults && typeof element.layoutDefaults === "object" ? { ...element.layoutDefaults } : {},
    m53Editable: element?.elementId === "bbm.main.header" || element?.elementId === "bbm.main.actions",
    m53LockReason: element?.elementId === "bbm.main.header" || element?.elementId === "bbm.main.actions" ? "" : "Dieses Element ist in M53 fuer Sichtbarkeitsaenderungen gesperrt.",
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

function getSelectedElement(runtimeResult) {
  if (!selectedElementId) return null;
  return (runtimeResult.registry.elements || []).find((entry) => entry.elementId === selectedElementId) || null;
}

function getElementVisible(runtimeResult, elementId) {
  if (!elementId) return true;
  const result = runtimeResult.hostAdapter.getElementLayoutState({
    elementId,
    layoutScope: runtimeResult.manifest.defaultLayoutScope,
    layoutProfileId: runtimeResult.manifest.defaultLayoutProfileId,
  });
  return result?.ok ? result.visible : true;
}

function createDraftViewModel({ request, element, validation, currentVisible }) {
  return {
    elementId: request.elementId,
    elementLabel: element?.label || request.elementId,
    uiScope: request.uiScope,
    layoutScope: request.layoutScope,
    layoutProfileId: request.layoutProfileId,
    previousValue: currentVisible,
    nextValue: request.value,
    operation: request.operation,
    valid: Boolean(validation?.ok),
    blockCode: validation?.ok ? null : String(validation?.blockCode || "BBM_UI_CHANGE_DRAFT_INVALID"),
  };
}

function createChangeDraft(payload = {}) {
  const runtimeResult = ensureRuntime();
  if (!runtimeResult?.ok) return sanitizeError(runtimeResult);
  const element = getSelectedElement(runtimeResult);
  if (!element) return { ok: false, blockCode: "BBM_UI_CHANGE_NO_SELECTION", message: "Kein registriertes Element ausgewaehlt." };
  const request = {
    elementId: element.elementId,
    uiScope: runtimeResult.manifest.defaultUiScope,
    layoutScope: runtimeResult.manifest.defaultLayoutScope,
    layoutProfileId: runtimeResult.manifest.defaultLayoutProfileId,
    operation: "visibility.set",
    property: "visible",
    value: payload?.visible,
  };
  const validation = runtimeResult.hostAdapter.validateChangeRequest(request);
  const draft = createDraftViewModel({ request, element, validation, currentVisible: getElementVisible(runtimeResult, element.elementId) });
  currentDraft = { request, draft };
  return { ok: validation.ok, draft, blockCode: validation.ok ? null : validation.blockCode, message: validation.message || null };
}

function getChangeDraft() {
  return { ok: true, draft: currentDraft?.draft || null };
}

function discardChangeDraft() {
  currentDraft = null;
  return { ok: true, draft: null };
}

function applyChangeDraft(payload = {}) {
  const runtimeResult = ensureRuntime();
  if (!runtimeResult?.ok) return sanitizeError(runtimeResult);
  if (!currentDraft?.request) return { ok: false, blockCode: "BBM_UI_CHANGE_DRAFT_INVALID", message: "Kein gueltiger Entwurf vorhanden." };
  if (payload && typeof payload === "object" && Object.keys(payload).length > 0) {
    const validation = runtimeResult.hostAdapter.validateChangeRequest(payload);
    if (!validation.ok) return { ok: false, blockCode: validation.blockCode || "BBM_UI_CHANGE_DRAFT_INVALID", message: validation.message || "Manipulierte Payload wurde abgelehnt.", draft: currentDraft.draft };
  }
  const validation = runtimeResult.hostAdapter.validateChangeRequest(currentDraft.request);
  if (!validation.ok) return { ok: false, blockCode: validation.blockCode || "BBM_UI_CHANGE_DRAFT_INVALID", message: validation.message || "Entwurf wurde abgelehnt.", draft: currentDraft.draft };
  const result = runtimeResult.hostAdapter.submitChangeRequest(currentDraft.request);
  if (!result?.ok) return { ok: false, blockCode: String(result?.blockCode || "BBM_UI_CHANGE_APPLY_FAILED"), message: "Layoutaenderung wurde nicht gespeichert.", draft: currentDraft.draft };
  currentDraft = null;
  return { ok: true, message: "Layoutaenderung angewendet", elementId: result.elementId, visible: result.visible, layoutProfileId: result.layoutProfileId, storage: "Sitzungsspeicher", layoutState: result.layoutState };
}

function loadLayoutState(payload = {}) {
  const runtimeResult = ensureRuntime();
  if (!runtimeResult?.ok) return sanitizeError(runtimeResult);
  const elementId = String(payload?.elementId || selectedElementId || "").trim();
  if (!elementId) return { ok: false, blockCode: "BBM_UI_CHANGE_NO_SELECTION", message: "Kein registriertes Element ausgewaehlt." };
  return runtimeResult.hostAdapter.getElementLayoutState({ elementId, layoutScope: runtimeResult.manifest.defaultLayoutScope, layoutProfileId: runtimeResult.manifest.defaultLayoutProfileId });
}

function resetLayoutState(payload = {}) {
  const runtimeResult = ensureRuntime();
  if (!runtimeResult?.ok) return sanitizeError(runtimeResult);
  const elementId = String(payload?.elementId || selectedElementId || "").trim();
  if (!elementId) return { ok: false, blockCode: "BBM_UI_CHANGE_NO_SELECTION", message: "Kein registriertes Element ausgewaehlt." };
  const result = runtimeResult.hostAdapter.resetLayoutState({ elementId, layoutScope: runtimeResult.manifest.defaultLayoutScope, layoutProfileId: runtimeResult.manifest.defaultLayoutProfileId });
  if (currentDraft?.request?.elementId === elementId) currentDraft = null;
  return result;
}

function closeUiEditorSession() {
  selectedElementId = null;
  currentDraft = null;
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
  ipcMain.handle("uiEditor:createChangeDraft", async (_event, payload) => createChangeDraft(payload));
  ipcMain.handle("uiEditor:getChangeDraft", async () => getChangeDraft());
  ipcMain.handle("uiEditor:discardChangeDraft", async () => discardChangeDraft());
  ipcMain.handle("uiEditor:applyChangeDraft", async (_event, payload) => applyChangeDraft(payload));
  ipcMain.handle("uiEditor:loadLayoutState", async (_event, payload) => loadLayoutState(payload));
  ipcMain.handle("uiEditor:resetLayoutState", async (_event, payload) => resetLayoutState(payload));
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
    createChangeDraft,
    getChangeDraft,
    discardChangeDraft,
    applyChangeDraft,
    loadLayoutState,
    resetLayoutState,
  },
};
