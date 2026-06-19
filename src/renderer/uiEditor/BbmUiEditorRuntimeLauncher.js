import * as installedLauncherButtonArtifactModule from "../../../uiEditor/uiEditorLauncherButton.js";
import * as installedTargetSelectionArtifactModule from "../../../uiEditor/targetSelection.js";
import { createInMemoryBbmEditorHostAdapter } from "../editorRuntime/host/bbmEditorHostAdapterContract.js";
import {
  getElementAllowedOps,
  getElementLockedOps,
  getNodeUiEditorId,
  getPendingChangeRequestSummary,
  getPreviewTargetElement,
  getPreviewTargetElementId,
  getPreviewTargetMode,
  isPreviewOperationAllowed,
  removePendingChangeRequestsForTarget as removePendingChangeRequestsForTargetModel,
  resolvePreviewTargetElement as resolvePreviewTargetElementModel,
  upsertPreviewChangeRequest as upsertPreviewChangeRequestModel,
} from "./uiEditorKitPreviewRuntimeBridge.js";
import {
  buildHiddenElementsButtonViewModel,
  buildHiddenElementsPopoverViewModel,
} from "./uiEditorKitHiddenElementsRuntimeBridge.js";
import {
  PANEL_DRAG_COORDINATE_SYSTEM,
  buildPanelViewModel,
  calculatePanelDragPosition,
} from "./uiEditorKitPanelRuntimeBridge.js";
import { validateSurfaceModelById } from "./surfaceAdapters/surfaceAdapterCatalog.js";
import { buildReadonlySurfaceSelectionModel } from "./surfaceAdapters/surfaceSelectionModel.js";
import { buildReadonlySurfaceSelectionState } from "./surfaceAdapters/surfaceSelectionState.js";
import { handleReadonlySurfaceSwitchRequest } from "./surfaceAdapters/surfaceSwitchCommand.js";
import { isSurfaceVisibleInEditor } from "./surfaceAdapters/surfacePolicy.js";
import { isVisibilityPersistenceAllowedForScope } from "../editorRuntime/host/visibilityPersistenceScopePolicy.js";

void installedLauncherButtonArtifactModule;
void installedTargetSelectionArtifactModule;

const INSTALLED_LAUNCHER_SCRIPT_PATH = "../../uiEditor/uiEditorLauncherButton.js";
const INSTALLED_LAUNCHER_CSS_PATH = "../../uiEditor/uiEditorLauncherButton.css";
const LAUNCHER_HOST_ATTRIBUTE = "data-ui-editor-launcher-host";
const LAUNCHER_CSS_ATTRIBUTE = "data-ui-editor-launcher-css";
const LAUNCHER_STATUS_ATTRIBUTE = "data-ui-editor-launcher-status";
const UI_EDITOR_ACTIVE_ATTRIBUTE = "data-ui-editor-active";
const UI_EDITOR_SELECTED_ATTRIBUTE = "data-ui-editor-selected";
const UI_EDITOR_PREVIEW_ATTRIBUTE = "data-ui-editor-preview";
const PREVIEW_MOVE_STEP = 5;
const PREVIEW_RESIZE_STEP = 5;
const PREVIEW_PANEL_DEFAULT_RIGHT = "24px";
const PREVIEW_PANEL_DEFAULT_TOP = "132px";
const PREVIEW_PANEL_VIEWPORT_MARGIN = 16;
const READONLY_SURFACE_INFO_SURFACE_ID = "restarbeiten.ui.main";
const READONLY_PDF_PLAN_PAGE_1_SURFACE_ID = "pdf.plan.page.1";
const READONLY_PDF_PLAN_PAGE_1_HINT_TEXT = "PDF Plan Seite 1 und Plan Canvas sind nur read-only sichtbar. Keine Bearbeitung, kein Drag, keine Persistenz.";
const READONLY_SURFACE_SELECTION_HINT_TEXT = "Surface-Auswahl zeigt nur read-only Kontext. Keine aktive Umschaltung.";

let installedLauncherCssNode = null;
let launcherHostNode = null;
let launcherStatusNode = null;
let launcherStatusContentNode = null;
let launcherStatusReopenNode = null;
let launcherPreviewPanelNode = null;
let launcherPreviewPanelDragState = null;
let launcherDocumentClickHandler = null;
let launcherDocumentClickDocument = null;
let launcherRuntimeState = null;

function getDocument(explicitDocument = null) {
  return explicitDocument || (typeof document === "object" ? document : null);
}

function getWindow(explicitWindow = null) {
  return explicitWindow || (typeof window === "object" ? window : null);
}

function getInstalledLauncherArtifact(explicitWindow = null) {
  const win = getWindow(explicitWindow);
  return win?.uiEditorLauncherButtonArtifact?.uiEditorLauncherButton || null;
}

function getInstalledTargetSelectionArtifact(explicitWindow = null) {
  const win = getWindow(explicitWindow);
  return win?.uiEditorTargetSelectionArtifact || globalThis?.uiEditorTargetSelectionArtifact || null;
}

function getLauncherHost(doc, host = null) {
  if (host) return host;
  return doc?.body || null;
}

function normalizeReadonlyRegisteredElements(registeredElements = null) {
  if (!Array.isArray(registeredElements)) return [];

  return registeredElements
    .map((element) => {
      if (!element || typeof element !== "object") return null;
      const id = String(element.id == null ? "" : element.id).trim();
      if (!id) return null;
      const label = String(element.label ?? element.name ?? "").trim();
      const area = String(element.area ?? "").trim();
      return { id, label, area };
    })
    .filter(Boolean);
}

function normalizeReadonlyRegistryElements(registeredElements = null) {
  if (!Array.isArray(registeredElements)) return [];

  return registeredElements
    .map((element) => {
      if (!element || typeof element !== "object") return null;
      const id = String(element.id == null ? "" : element.id).trim();
      if (!id) return null;
      const name = String(element.name ?? element.label ?? "").trim();
      const area = String(element.area ?? "").trim();
      const type = String(element.type ?? "").trim();
      const role = String(element.role ?? "").trim();
      const parentId = element.parentId == null ? null : String(element.parentId).trim();
      const allowedOps = Array.isArray(element.allowedOps) ? element.allowedOps.map((entry) => String(entry)).filter(Boolean) : [];
      const lockedOps = Array.isArray(element.lockedOps) ? element.lockedOps.map((entry) => String(entry)).filter(Boolean) : [];
      const editGranularity = String(element.editGranularity ?? "").trim();
      const previewTargetMode = String(element.previewTargetMode ?? "").trim();
      const previewTarget = typeof element.previewTarget === "string"
        ? element.previewTarget.trim()
        : element.previewTarget && typeof element.previewTarget === "object"
          ? { ...element.previewTarget }
          : "";
      const affectsContainer = typeof element.affectsContainer === "boolean" ? element.affectsContainer : null;
      const layoutContainer = typeof element.layoutContainer === "boolean" ? element.layoutContainer : null;
      return {
        id,
        name,
        area,
        type,
        role,
        parentId,
        allowedOps,
        lockedOps,
        editGranularity,
        previewTargetMode,
        previewTarget,
        affectsContainer,
        layoutContainer,
      };
    })
    .filter(Boolean);
}

function normalizeAvailableUiScopes(availableUiScopes = null) {
  if (!Array.isArray(availableUiScopes)) return [];

  return availableUiScopes
    .map((scope) => {
      if (!scope || typeof scope !== "object") return null;
      const uiScope = String(scope.uiScope == null ? "" : scope.uiScope).trim();
      if (!uiScope) return null;
      const moduleId = String(scope.moduleId ?? "").trim();
      const label = String(scope.label ?? "").trim();
      const status = String(scope.status ?? "").trim();
      return { uiScope, moduleId, label, status };
    })
    .filter(Boolean);
}

function normalizeReadonlyRegistry(registry = null) {
  if (!registry || typeof registry !== "object") {
    return { uiScope: "", moduleId: "", elements: [], ok: false, reason: "" };
  }

  return {
    targetAppId: String(registry.targetAppId ?? "").trim(),
    uiScope: String(registry.uiScope ?? "").trim(),
    moduleId: String(registry.moduleId ?? "").trim(),
    elements: normalizeReadonlyRegistryElements(registry.elements),
    ok: registry.ok === false ? false : true,
    reason: String(registry.reason ?? "").trim(),
  };
}

function getHostRegistry(hostAdapter = null, scopeId = "") {
  if (!hostAdapter || typeof hostAdapter.getRegistry !== "function") return null;
  const registry = hostAdapter.getRegistry(scopeId);
  if (!Array.isArray(registry)) return registry;
  const context = typeof hostAdapter.getHostContext === "function" ? hostAdapter.getHostContext() : {};
  const normalizedScope = String(scopeId || context.scopeId || context.activeUiScope || "").trim();
  return {
    targetAppId: String(context.targetAppId || "").trim(),
    moduleId: String(context.moduleId || "").trim(),
    uiScope: normalizedScope,
    scopeId: normalizedScope,
    elements: registry,
  };
}

function notifyPendingChangeRequestsChanged(state = {}) {
  const adapter = state.hostAdapter || null;
  if (!adapter || typeof adapter.onPendingChangeRequestsChanged !== "function") return null;
  return adapter.onPendingChangeRequestsChanged(
    Array.isArray(state.pendingChangeRequests) ? state.pendingChangeRequests : []
  );
}

function getHostContextFromState(state = {}) {
  const adapter = state.hostAdapter || null;
  if (!adapter || typeof adapter.getHostContext !== "function") return {};
  return adapter.getHostContext() || {};
}

function getHostCapabilitiesFromState(state = {}) {
  const adapter = state.hostAdapter || null;
  if (!adapter || typeof adapter.getCapabilities !== "function") return {};
  return adapter.getCapabilities() || {};
}

function createLauncherState({
  activeUiScope = null,
  registeredElements = null,
  availableUiScopes = null,
  registryResolver = null,
  hostAdapter = null,
  onPendingChangeRequestsChanged = null,
} = {}) {
  const normalizedScope = String(activeUiScope == null ? "" : activeUiScope).trim();
  const resolver = typeof registryResolver === "function" ? registryResolver : null;
  const adapter = hostAdapter || createInMemoryBbmEditorHostAdapter({
    hostContext: {
      activeUiScope: normalizedScope,
      scopeId: normalizedScope,
    },
    registeredElements,
    registryResolver: resolver,
    onPendingChangeRequestsChanged,
  });
  const selectedRegistry = normalizeReadonlyRegistry(
    getHostRegistry(adapter, normalizedScope)
    || (resolver && normalizedScope ? resolver(normalizedScope) : null)
    || { uiScope: normalizedScope, elements: registeredElements }
  );

  return {
    uiEditorLauncherActive: false,
    activeUiScope: normalizedScope,
    selectedRegistry,
    selectedElement: null,
    selectedTargetNode: null,
    selectedPreviewTargetNode: null,
    selectedTargetPreviousStyle: null,
    hoverElement: null,
    hoverTargetNode: null,
    selectionMessage: "",
    hoverMessage: "",
    previewStates: new Map(),
    pendingChangeRequests: [],
    changeRequestSequence: 0,
    previewMessage: "",
    hiddenElementsPopoverOpen: false,
    targetSelectionController: null,
    targetSelectionPanelController: null,
    win: null,
    availableUiScopes: normalizeAvailableUiScopes(availableUiScopes),
    registryResolver: resolver,
    hostAdapter: adapter,
  };
}

function ensureInstalledLauncherCss(doc = getDocument()) {
  if (!doc?.createElement) return null;
  if (
    installedLauncherCssNode?.ownerDocument === doc &&
    (installedLauncherCssNode.parentElement || installedLauncherCssNode.parentNode)
  ) {
    return installedLauncherCssNode;
  }

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = INSTALLED_LAUNCHER_CSS_PATH;
  link.setAttribute(LAUNCHER_CSS_ATTRIBUTE, "true");
  link.setAttribute("data-ui-editor-installed-css", INSTALLED_LAUNCHER_CSS_PATH);
  const target = doc.head || doc.body || doc.documentElement;
  target?.appendChild?.(link);
  installedLauncherCssNode = link;
  return link;
}

function loadInstalledLauncherButton({ doc = getDocument(), win = getWindow() } = {}) {
  const existing = getInstalledLauncherArtifact(win);
  if (existing) return Promise.resolve(existing);
  if (!doc?.createElement) return Promise.resolve(null);

  return new Promise((resolve) => {
    const script = doc.createElement("script");
    script.src = INSTALLED_LAUNCHER_SCRIPT_PATH;
    script.async = true;
    script.setAttribute("data-ui-editor-installed-script", INSTALLED_LAUNCHER_SCRIPT_PATH);
    script.onload = () => resolve(getInstalledLauncherArtifact(win));
    script.onerror = () => resolve(null);
    const target = doc.body || doc.head || doc.documentElement;
    target?.appendChild?.(script);
  });
}

function removeNode(node) {
  if (node?.parentElement?.removeChild) {
    node.parentElement.removeChild(node);
  } else if (node?.remove) {
    node.remove();
  }
}

function removeExistingLauncherStatus(doc = getDocument()) {
  launcherStatusNode?._uiEditorPanelController?.uninstall?.();
  removeNode(launcherStatusNode);
  removeNode(launcherStatusReopenNode);
  launcherStatusNode = null;
  launcherStatusContentNode = null;
  launcherStatusReopenNode = null;
}

function removeExistingPreviewPanel() {
  stopPreviewPanelDrag();
  removeNode(launcherPreviewPanelNode);
  launcherPreviewPanelNode = null;
}

function getPreviewOriginalStyle(targetNode) {
  return {
    transform: targetNode?.style?.transform || "",
    width: targetNode?.style?.width || "",
    height: targetNode?.style?.height || "",
    display: targetNode?.style?.display || "",
  };
}

function getPreviewState(state = {}, targetNode = null) {
  if (!targetNode?.style || !state?.previewStates) return null;
  let previewState = state.previewStates.get(targetNode);
  if (!previewState) {
    previewState = {
      originalStyle: getPreviewOriginalStyle(targetNode),
      dx: 0,
      dy: 0,
      widthDelta: 0,
      heightDelta: 0,
      baseWidth: getTargetBaseSize(targetNode, "width"),
      baseHeight: getTargetBaseSize(targetNode, "height"),
      hidden: false,
    };
    state.previewStates.set(targetNode, previewState);
  }
  return previewState;
}

function getTargetBaseSize(targetNode, propertyName) {
  const styleValue = Number.parseFloat(targetNode?.style?.[propertyName]);
  if (Number.isFinite(styleValue) && styleValue > 0) return styleValue;
  const rect = typeof targetNode?.getBoundingClientRect === "function" ? targetNode.getBoundingClientRect() : null;
  const rectValue = Number(rect?.[propertyName]);
  if (Number.isFinite(rectValue) && rectValue > 0) return rectValue;
  const fallbackProperty = propertyName === "width" ? "offsetWidth" : "offsetHeight";
  const fallbackValue = Number(targetNode?.[fallbackProperty]);
  return Number.isFinite(fallbackValue) && fallbackValue > 0 ? fallbackValue : 0;
}

function resolvePreviewTargetElement(state = {}, selection = {}) {
  const selectionElement = selection.registryElement || selection.element || state.selectedElement || null;
  const selectedId = String(selection.elementId || selectionElement?.id || "").trim();
  return resolvePreviewTargetElementModel({
    selectionElement,
    selectedId,
    targetNode: selection.targetElement || state.selectedTargetNode || null,
    getRegisteredElementById: (uiEditorId) => getRegisteredElementById(state, uiEditorId),
  });
}

function describePreviewTargetElement(targetNode = null, selectedNode = null) {
  if (!targetNode) return "nicht verfügbar";
  const tagName = String(targetNode.tagName || "element").toLowerCase();
  const uiEditorId = getNodeUiEditorId(targetNode);
  const className = String(targetNode.className || "").trim().split(/\s+/u).filter(Boolean).join(".");
  const parts = [tagName];
  if (uiEditorId) parts.push(`[data-ui-editor-id="${uiEditorId}"]`);
  if (className) parts.push(`.${className}`);
  if (selectedNode && targetNode !== selectedNode) parts.push("(Parent-Preview-Ziel)");
  return parts.join("");
}

function formatPreviewMetaValue(value = null) {
  if (value === true) return "true";
  if (value === false) return "false";
  if (value == null || value === "") return "nicht gesetzt";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (_error) {
      return "[object]";
    }
  }
  return String(value);
}

function applyPreviewState(targetNode, previewState) {
  if (!targetNode?.style || !previewState) return false;

  const baseTransform = previewState.originalStyle.transform || "";
  const previewTransform = previewState.dx || previewState.dy
    ? `translate(${previewState.dx}px, ${previewState.dy}px)`
    : "";
  targetNode.style.transform = [baseTransform, previewTransform].filter(Boolean).join(" ").trim();

  if (previewState.widthDelta) {
    targetNode.style.width = `${Math.max(1, Math.round(previewState.baseWidth + previewState.widthDelta))}px`;
  } else {
    targetNode.style.width = previewState.originalStyle.width;
  }

  if (previewState.heightDelta) {
    targetNode.style.height = `${Math.max(1, Math.round(previewState.baseHeight + previewState.heightDelta))}px`;
  } else {
    targetNode.style.height = previewState.originalStyle.height;
  }

  targetNode.style.display = previewState.hidden ? "none" : previewState.originalStyle.display;
  targetNode.setAttribute?.(UI_EDITOR_PREVIEW_ATTRIBUTE, "true");
  return true;
}

function resetPreviewForTarget(state = {}, targetNode = null) {
  const previewState = targetNode && state?.previewStates?.get?.(targetNode);
  if (!previewState || !targetNode?.style) return false;
  targetNode.style.transform = previewState.originalStyle.transform;
  targetNode.style.width = previewState.originalStyle.width;
  targetNode.style.height = previewState.originalStyle.height;
  targetNode.style.display = previewState.originalStyle.display;
  targetNode.setAttribute?.(UI_EDITOR_PREVIEW_ATTRIBUTE, "false");
  state.previewStates.delete(targetNode);
  return true;
}

function removePendingChangeRequestsForTarget(state = {}, targetNode = null) {
  return removePendingChangeRequestsForTargetModel({
    state,
    targetNode,
    notify: notifyPendingChangeRequestsChanged,
  });
}

function resetAllPreviewChanges(state = {}) {
  if (!state?.previewStates) {
    state.pendingChangeRequests = [];
    notifyPendingChangeRequestsChanged(state);
    return 0;
  }
  const targets = Array.from(state.previewStates.keys());
  let resetCount = 0;
  for (const targetNode of targets) {
    if (resetPreviewForTarget(state, targetNode)) resetCount += 1;
  }
  state.pendingChangeRequests = [];
  notifyPendingChangeRequestsChanged(state);
  state.previewMessage = resetCount > 0 ? "Preview zurueckgesetzt." : "Keine Preview-Aenderung aktiv.";
  return resetCount;
}

function resetSelectedPreviewChange(state = {}) {
  const targetNode = getPreviewTargetElement(state);
  const removedRequests = removePendingChangeRequestsForTarget(state, targetNode);
  const reset = resetPreviewForTarget(state, targetNode);
  state.previewMessage = reset || removedRequests > 0 ? "Preview zurueckgesetzt." : "Keine Preview-Aenderung aktiv.";
  return reset;
}

function discardPendingPreviewChanges(state = {}) {
  const resetCount = resetAllPreviewChanges(state);
  state.pendingChangeRequests = [];
  state.previewMessage = resetCount > 0 ? "Aenderungen verworfen." : "Keine vorbereiteten Aenderungen.";
  return resetCount;
}

function clearUiEditorTargetSelection(state = {}) {
  const target = state.selectedTargetNode || null;
  if (target?.setAttribute) {
    target.setAttribute(UI_EDITOR_SELECTED_ATTRIBUTE, "false");
    target.style.outline = state.selectedTargetPreviousStyle?.outline || "";
    target.style.boxShadow = state.selectedTargetPreviousStyle?.boxShadow || "";
  }
  state.selectedTargetNode = null;
  state.selectedPreviewTargetNode = null;
  state.selectedElement = null;
  state.selectedTargetPreviousStyle = null;
  state.selectionMessage = "";
}

function clearUiEditorHoverSelection(state = {}) {
  state.hoverTargetNode = null;
  state.hoverElement = null;
  state.hoverMessage = "";
}

function removeLauncherTargetSelectionController(state = {}) {
  resetAllPreviewChanges(state);
  state.targetSelectionController?.uninstall?.();
  state.targetSelectionController = null;
  clearUiEditorTargetSelection(state);
  clearUiEditorHoverSelection(state);
}

function removeLauncherDocumentClickHandler() {
  if (launcherDocumentClickDocument?.removeEventListener && launcherDocumentClickHandler) {
    launcherDocumentClickDocument.removeEventListener("click", launcherDocumentClickHandler, true);
  }
  launcherDocumentClickDocument = null;
  launcherDocumentClickHandler = null;
}

function removeExistingLauncher(doc = getDocument()) {
  removeLauncherDocumentClickHandler();
  removeLauncherTargetSelectionController(launcherRuntimeState || {});
  launcherRuntimeState = null;
  removeNode(launcherHostNode);
  launcherHostNode = null;
  removeExistingLauncherStatus(doc);
  removeExistingPreviewPanel();
  doc?.body?.setAttribute?.(UI_EDITOR_ACTIVE_ATTRIBUTE, "false");
}

function getStatusScopeLabel(activeUiScope = null) {
  const normalizedScope = String(activeUiScope == null ? "" : activeUiScope).trim();
  return normalizedScope || "nicht erkannt";
}

function getReadonlyRegisteredElementsText(registeredElements = null) {
  const elements = normalizeReadonlyRegisteredElements(registeredElements);
  if (elements.length < 1) return "Registrierte Elemente:\nnicht verfügbar";

  const lines = elements.map((element) => {
    const details = [element.label, element.area].filter(Boolean).join(" · ");
    return details ? `* ${element.id} (${details})` : `* ${element.id}`;
  });
  return ["Registrierte Elemente:", "", ...lines].join("\n");
}

function getLauncherStatusText({ activeUiScope = null, registeredElements = null } = {}) {
  return [
    "UI-Editor aktiv",
    `Scope: ${getStatusScopeLabel(activeUiScope)}`,
    "",
    getReadonlyRegisteredElementsText(registeredElements),
  ].join("\n");
}

function getReadonlyRegistryElementsText(registeredElements = null) {
  const elements = Array.isArray(registeredElements)
    ? registeredElements
    : normalizeReadonlyRegisteredElements(registeredElements);
  if (elements.length < 1) return "Registrierte Elemente:\nnicht verfügbar";

  const lines = elements.map((element) => {
    const parent = element.parentId == null ? "null" : element.parentId;
    const allowedOps = Array.isArray(element.allowedOps) ? element.allowedOps.join(",") : "";
    const lockedOps = Array.isArray(element.lockedOps) ? element.lockedOps.join(",") : "";
    const details = [element.name, element.area].filter(Boolean).join(" · ");
    const title = details ? `* ${element.id} (${details})` : `* ${element.id}`;
    return [
      title,
      `  name: ${element.name || ""}`,
      `  type: ${element.type || ""}`,
      `  role: ${element.role || ""}`,
      `  parentId: ${parent}`,
      `  allowedOps: ${allowedOps}`,
      `  lockedOps: ${lockedOps}`,
    ].join("\n");
  });
  return ["Registrierte Elemente:", "", ...lines].join("\n");
}

function getAvailableUiScopesText(availableUiScopes = null) {
  const scopes = normalizeAvailableUiScopes(availableUiScopes);
  if (scopes.length < 1) return "Verfügbare Scopes:\nnicht verfügbar";

  return [
    "Verfügbare Scopes:",
    "",
    ...scopes.map((scope) => {
      const details = [scope.moduleId, scope.status].filter(Boolean).join(" / ");
      return details ? `* ${scope.uiScope} (${details})` : `* ${scope.uiScope}`;
    }),
  ].join("\n");
}

function getSelectedRegistryFromState(state = {}) {
  return normalizeReadonlyRegistry(state.selectedRegistry || {
    uiScope: state.activeUiScope,
    elements: state.registeredElements,
  });
}

function getReadonlyLauncherStatusText(state = {}) {
  const registry = getSelectedRegistryFromState(state);
  const scopes = normalizeAvailableUiScopes(state.availableUiScopes);
  const selectedElement = state.selectedElement || null;
  const hoverElement = state.hoverElement || null;
  const changeRequestSummary = getPendingChangeRequestSummary(state, selectedElement?.id || "");
  if (scopes.length < 1 && !registry.moduleId && registry.elements.length < 1) {
    return getLauncherStatusText({ activeUiScope: state.activeUiScope, registeredElements: [] });
  }
  return [
    "UI-Editor aktiv",
    getAvailableUiScopesText(scopes),
    "",
    `Scope: ${getStatusScopeLabel(registry.uiScope || state.activeUiScope)}`,
    `Modul: ${registry.moduleId || "nicht verfügbar"}`,
    `Elemente: ${registry.elements.length}`,
    registry.ok === false && registry.reason ? `Hinweis: ${registry.reason}` : "",
    hoverElement ? `Hover: ${hoverElement.id}` : "Hover: keine",
    state.hoverMessage ? `Hover-Hinweis: ${state.hoverMessage}` : "",
    selectedElement ? `Auswahl: ${selectedElement.id}` : "Auswahl: keine",
    state.selectionMessage ? `Auswahl-Hinweis: ${state.selectionMessage}` : "",
    `Aenderungen vorbereitet: ${changeRequestSummary.total}`,
    state.previewMessage ? `Preview: ${state.previewMessage}` : "",
    selectedElement ? `Name: ${selectedElement.name || selectedElement.label || ""}` : "",
    "",
    getReadonlyRegistryElementsText(registry.elements),
  ].filter((line) => line !== "").join("\n");
}

function getLauncherStatusContentNode(status) {
  return status?._uiEditorStatusContent || launcherStatusContentNode || status;
}

function ensureLauncherStatusHint(doc, host, state = {}) {
  if (
    launcherStatusNode?.ownerDocument === doc &&
    (launcherStatusNode.parentElement || launcherStatusNode.parentNode)
  ) {
    return launcherStatusNode;
  }
  if (!doc?.createElement || !host?.appendChild) return null;

  const status = doc.createElement("div");
  status.className = "ui-editor-launcher-status";
  status.setAttribute(LAUNCHER_STATUS_ATTRIBUTE, "true");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const header = doc.createElement("div");
  header.className = "ui-editor-launcher-status__header";
  header.setAttribute("data-ui-editor-status-header", "true");
  const title = doc.createElement("span");
  title.textContent = "UI-Editor · Erkennung";
  const actions = doc.createElement("span");
  actions.className = "ui-editor-launcher-status__actions";
  const collapseButton = doc.createElement("button");
  collapseButton.type = "button";
  collapseButton.className = "ui-editor-launcher-status__action";
  collapseButton.textContent = "â€“";
  collapseButton.title = "Einklappen";
  collapseButton.setAttribute("data-ui-editor-status-collapse", "true");
  const hideButton = doc.createElement("button");
  hideButton.type = "button";
  hideButton.className = "ui-editor-launcher-status__action";
  hideButton.textContent = "Ã—";
  hideButton.title = "Ausblenden";
  hideButton.setAttribute("data-ui-editor-status-hide", "true");
  actions.append(collapseButton, hideButton);
  header.append(title, actions);

  const content = doc.createElement("div");
  content.className = "ui-editor-launcher-status__content";
  content.setAttribute("data-ui-editor-status-content", "true");
  content.textContent = getReadonlyLauncherStatusText(state);
  status._uiEditorStatusContent = content;
  status.append(header, content);

  const reopen = doc.createElement("button");
  reopen.type = "button";
  reopen.className = "ui-editor-launcher-status-reopen";
  reopen.textContent = "UI";
  reopen.title = "UI-Editor-Erkennung einblenden";
  reopen.setAttribute("data-ui-editor-status-reopen", "true");
  reopen.style.display = "none";

  host.appendChild(status);
  host.appendChild(reopen);
  launcherStatusNode = status;
  launcherStatusContentNode = content;
  launcherStatusReopenNode = reopen;

  const panelController = getInstalledTargetSelectionArtifact()?.createTargetSelectionPanelController?.({
    document: doc,
    window: state.win || getWindow(),
    panelElement: status,
    headerElement: header,
    contentElement: content,
    collapseButton,
    hideButton,
    reopenButton: reopen,
  });
  panelController?.install?.();
  status._uiEditorPanelController = panelController || null;
  state.targetSelectionPanelController = panelController || null;
  return status;
}

function updateLauncherStatusHint(doc, host, state = {}) {
  const status = ensureLauncherStatusHint(doc, host, state);
  const content = getLauncherStatusContentNode(status);
  if (content) content.textContent = getReadonlyLauncherStatusText(state);
  return status;
}

function setActiveScopeInState(state, nextScope) {
  const normalizedScope = String(nextScope == null ? "" : nextScope).trim();
  removeLauncherTargetSelectionController(state);
  state.activeUiScope = normalizedScope;
  state.selectedRegistry = normalizeReadonlyRegistry(
    getHostRegistry(state.hostAdapter, normalizedScope)
    || (state.registryResolver ? state.registryResolver(normalizedScope) : null)
    || { uiScope: normalizedScope, elements: [] }
  );
}

function installLauncherTargetSelectionController(doc, host, state) {
  if (!state?.uiEditorLauncherActive || !doc?.addEventListener) return null;
  removeLauncherTargetSelectionController(state);
  const targetSelectionArtifact = getInstalledTargetSelectionArtifact();
  const registry = getSelectedRegistryFromState(state);
  const controller = targetSelectionArtifact?.createTargetSelectionController?.({
    document: doc,
    root: doc,
    activeScopeId: registry.uiScope || state.activeUiScope,
    registry,
    onHoverChange(selection) {
      state.hoverElement = selection.element;
      state.hoverTargetNode = selection.targetElement;
      state.hoverMessage = selection.message || "";
      const status = updateLauncherStatusHint(doc, host, state);
      renderReadonlyScopeButtons(doc, status, state);
      renderPreviewControls(doc, status, state);
    },
    onSelectionChange(selection) {
      state.selectedElement = selection.registryElement || selection.element;
      state.selectedTargetNode = selection.targetElement;
      state.selectedPreviewTargetNode = resolvePreviewTargetElement(state, selection);
      state.selectionMessage = selection.message || "";
      const status = updateLauncherStatusHint(doc, host, state);
      renderReadonlyScopeButtons(doc, status, state);
      renderPreviewControls(doc, status, state);
      renderPreviewPanel(doc, state);
    },
  });
  controller?.install?.();
  state.targetSelectionController = controller || null;
  return controller || null;
}

function renderReadonlyScopeButtons(doc, status, state) {
  const scopes = normalizeAvailableUiScopes(state.availableUiScopes);
  if (!doc?.createElement || !status || scopes.length < 1) return;

  const scopeList = doc.createElement("div");
  scopeList.setAttribute("data-ui-editor-scope-list", "true");
  scopeList.setAttribute("aria-label", "UI-Editor Scopes");

  for (const scope of scopes) {
    const button = doc.createElement("button");
    button.type = "button";
    button.textContent = scope.uiScope;
    button.setAttribute("data-ui-editor-scope-option", scope.uiScope);
    button.setAttribute("aria-pressed", scope.uiScope === state.activeUiScope ? "true" : "false");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setActiveScopeInState(state, scope.uiScope);
      const updatedStatus = updateLauncherStatusHint(doc, status.parentElement, state);
      renderReadonlyScopeButtons(doc, updatedStatus, state);
      renderPreviewControls(doc, updatedStatus, state);
      renderPreviewPanel(doc, state);
      installLauncherTargetSelectionController(doc, status.parentElement, state);
    });
    scopeList.appendChild(button);
  }

  getLauncherStatusContentNode(status)?.appendChild(scopeList);
}

function getSelectedRegistryElementForPreview(state = {}) {
  const selectedId = String(state?.selectedElement?.id || "").trim();
  return selectedId ? getRegisteredElementById(state, selectedId) : null;
}

function buildBbmPanelViewModel(state = {}) {
  const selectedElement = getSelectedRegistryElementForPreview(state);
  const targetNode = state.selectedTargetNode || null;
  const previewTargetNode = getPreviewTargetElement(state);
  const previewTargetId = getNodeUiEditorId(previewTargetNode) || "";
  const changeRequestSummary = getPendingChangeRequestSummary(
    state,
    selectedElement?.id || getPreviewTargetElementId(state, previewTargetNode)
  );
  const hasPreviewState = Boolean(previewTargetNode && state.previewStates?.has?.(previewTargetNode));

  return buildPanelViewModel({
    state: {
      isOpen: true,
      position: {},
    },
    title: "Preview",
    element: selectedElement,
    targetId: selectedElement?.id || "",
    targetLabel: selectedElement?.name || selectedElement?.label || selectedElement?.id || "",
    previewTarget: {
      id: previewTargetId,
      label: describePreviewTargetElement(previewTargetNode, targetNode),
    },
    allowedOps: selectedElement ? getElementAllowedOps(selectedElement) : [],
    lockedOps: selectedElement ? getElementLockedOps(selectedElement) : [],
    pendingChangeSummary: changeRequestSummary,
    canReset: hasPreviewState,
    canDiscard: changeRequestSummary.total > 0,
    statusText: state.previewMessage || "",
  });
}

function buildBbmHiddenElementsButtonViewModel(state = {}) {
  return buildHiddenElementsButtonViewModel({ elements: getBbmHiddenElementsViewModelInput(state) });
}

function buildBbmHiddenElementsPopoverViewModel(state = {}) {
  return buildHiddenElementsPopoverViewModel({ elements: getBbmHiddenElementsViewModelInput(state) });
}

function getCurrentLayoutStateFromHost(state = {}) {
  const adapter = state.hostAdapter || null;
  if (!adapter || typeof adapter.getCurrentLayoutState !== "function") return [];
  const context = getHostContextFromState(state);
  const scopeId = state.activeUiScope || context.scopeId || context.activeUiScope || "";
  const layoutState = adapter.getCurrentLayoutState(scopeId);
  if (Array.isArray(layoutState)) return layoutState;
  if (Array.isArray(layoutState?.elements)) return layoutState.elements;
  if (Array.isArray(layoutState?.layoutState)) return layoutState.layoutState;
  if (Array.isArray(layoutState?.overrides)) return layoutState.overrides;
  return [];
}

function getVisibilityFromLayoutStateEntry(entry = null) {
  if (!entry || typeof entry !== "object") return null;
  if (typeof entry.visible === "boolean") return entry.visible;
  if (entry.overrides && typeof entry.overrides === "object" && typeof entry.overrides.visible === "boolean") {
    return entry.overrides.visible;
  }
  if (entry.layoutValue && typeof entry.layoutValue === "object" && typeof entry.layoutValue.visible === "boolean") {
    return entry.layoutValue.visible;
  }
  if (entry.payload && typeof entry.payload === "object" && typeof entry.payload.visible === "boolean") {
    return entry.payload.visible;
  }
  return null;
}

function canPersistVisibilityForElement(state = {}, elementId = "") {
  const registryElement = getRegisteredElementById(state, elementId);
  if (!registryElement || !isPreviewOperationAllowed(registryElement, "show")) return false;
  const context = getHostContextFromState(state);
  const capabilities = getHostCapabilitiesFromState(state);
  const scopeId = String(state.activeUiScope || context.scopeId || context.activeUiScope || "").trim();
  return Boolean(
    isVisibilityPersistenceAllowedForScope(scopeId, context)
      && capabilities.persistence === true
      && capabilities.canPersistVisibility === true
      && capabilities.dryRunOnly !== true
      && state.hostAdapter
      && typeof state.hostAdapter.submitChangeRequests === "function"
  );
}

function upsertHiddenElementsInputEntry(elementsById, elementId = "", patch = {}) {
  const normalizedElementId = String(elementId || "").trim();
  if (!normalizedElementId) return null;
  const previous = elementsById.get(normalizedElementId) || {
    elementId: normalizedElementId,
    label: normalizedElementId,
    visible: true,
    canShow: false,
  };
  const next = {
    ...previous,
    ...patch,
    elementId: normalizedElementId,
  };
  elementsById.set(normalizedElementId, next);
  return next;
}

function getBbmHiddenElementsViewModelInput(state = {}) {
  const elementsById = new Map();
  const registry = getSelectedRegistryFromState(state);

  for (const registryElement of registry.elements || []) {
    const elementId = String(registryElement?.id || "").trim();
    if (!elementId) continue;
    upsertHiddenElementsInputEntry(elementsById, elementId, {
      label: registryElement?.name || registryElement?.label || elementId,
      visible: registryElement?.visible === false ? false : true,
      canShow: false,
    });
  }

  for (const layoutEntry of getCurrentLayoutStateFromHost(state)) {
    const elementId = String(layoutEntry?.elementId || layoutEntry?.id || "").trim();
    const visible = getVisibilityFromLayoutStateEntry(layoutEntry);
    if (!elementId || typeof visible !== "boolean") continue;
    const registryElement = getRegisteredElementById(state, elementId);
    upsertHiddenElementsInputEntry(elementsById, elementId, {
      label: registryElement?.name || registryElement?.label || layoutEntry?.label || elementId,
      visible,
      canShow: visible === false ? canPersistVisibilityForElement(state, elementId) : false,
    });
  }

  const previewVisibilityById = new Map();
  for (const changeRequest of Array.isArray(state.pendingChangeRequests) ? state.pendingChangeRequests : []) {
    const elementId = String(changeRequest?.elementId || changeRequest?.targetElementId || "").trim();
    if (!elementId || changeRequest?.operation !== "visibility") continue;
    const visible = changeRequest?.payload?.visible;
    if (typeof visible === "boolean") previewVisibilityById.set(elementId, visible);
  }

  for (const [elementId, visible] of previewVisibilityById.entries()) {
    const registryElement = getRegisteredElementById(state, elementId);
    upsertHiddenElementsInputEntry(elementsById, elementId, {
      label: registryElement?.name || registryElement?.label || elementId,
      visible,
      canShow: false,
    });
  }

  const previewStates = state.previewStates instanceof Map ? state.previewStates : null;
  if (previewStates) {
    for (const [targetNode, previewState] of previewStates.entries()) {
      const elementId = getNodeUiEditorId(targetNode);
      if (!elementId) continue;
      const registryElement = getRegisteredElementById(state, elementId);
      upsertHiddenElementsInputEntry(elementsById, elementId, {
        label: registryElement?.name || registryElement?.label || elementId,
        visible: previewState?.hidden ? false : true,
        canShow: previewState?.hidden ? (registryElement ? isPreviewOperationAllowed(registryElement, "show") : true) : false,
      });
    }
  }
  return Array.from(elementsById.values());
}

function getPreviewStateEntryByElementId(state = {}, elementId = "") {
  const normalizedElementId = String(elementId || "").trim();
  const previewStates = state.previewStates instanceof Map ? state.previewStates : null;
  if (!normalizedElementId || !previewStates) return null;
  for (const [targetNode, previewState] of previewStates.entries()) {
    if (getNodeUiEditorId(targetNode) === normalizedElementId) {
      return { targetNode, previewState };
    }
  }
  return null;
}

function showHiddenPreviewElement(state = {}, elementId = "") {
  const entry = getPreviewStateEntryByElementId(state, elementId);
  if (!entry?.previewState?.hidden) return false;
  const registryElement = getRegisteredElementById(state, elementId);
  if (registryElement && !isPreviewOperationAllowed(registryElement, "show")) return false;

  entry.previewState.hidden = false;
  applyPreviewState(entry.targetNode, entry.previewState);
  if (registryElement) {
    upsertPreviewChangeRequest(state, registryElement, entry.targetNode, "show", {});
  }
  state.previewMessage = "Element wieder eingeblendet.";
  if (buildBbmHiddenElementsButtonViewModel(state).hiddenCount < 1) {
    state.hiddenElementsPopoverOpen = false;
  }
  return true;
}

function buildPersistentVisibilityChangeRequest(state = {}, registryElement = null, visible = true) {
  if (!registryElement?.id || typeof visible !== "boolean") return null;
  const context = getHostContextFromState(state);
  const scopeId = String(state.activeUiScope || context.scopeId || context.activeUiScope || "").trim();
  const createdAt = new Date().toISOString();
  return {
    changeId: getNextChangeRequestId(state),
    targetAppId: context.targetAppId || "bbm",
    moduleId: context.moduleId || "",
    scopeId,
    elementId: registryElement.id,
    targetElementId: registryElement.id,
    operation: "visibility",
    payload: { visible },
    source: "preview",
    persistent: true,
    previewTargetMode: getPreviewTargetMode(registryElement),
    createdAt,
    updatedAt: createdAt,
  };
}

async function showPersistentHiddenElement(state = {}, elementId = "") {
  const normalizedElementId = String(elementId || "").trim();
  if (!normalizedElementId || !canPersistVisibilityForElement(state, normalizedElementId)) return false;
  const registryElement = getRegisteredElementById(state, normalizedElementId);
  const changeRequest = buildPersistentVisibilityChangeRequest(state, registryElement, true);
  if (!changeRequest) return false;
  const result = await state.hostAdapter.submitChangeRequests([changeRequest]);
  if (!result?.ok || result.persisted !== true) {
    state.previewMessage = "Einblenden nicht gespeichert.";
    return false;
  }
  state.previewMessage = "Element dauerhaft eingeblendet.";
  if (buildBbmHiddenElementsButtonViewModel(state).hiddenCount < 1) {
    state.hiddenElementsPopoverOpen = false;
  }
  return true;
}

async function showHiddenElement(state = {}, elementId = "") {
  if (showHiddenPreviewElement(state, elementId)) return true;
  return showPersistentHiddenElement(state, elementId);
}

function getNextChangeRequestId(state = {}) {
  state.changeRequestSequence = (Number(state.changeRequestSequence) || 0) + 1;
  return `preview-${state.changeRequestSequence}`;
}

function upsertPreviewChangeRequest(state = {}, registryElement = null, targetNode = null, operation = "", payload = {}) {
  return upsertPreviewChangeRequestModel({
    state,
    hostContext: getHostContextFromState(state),
    registry: getSelectedRegistryFromState(state),
    registryElement,
    targetNode,
    operation,
    payload,
    getNextChangeRequestId,
    notify: notifyPendingChangeRequestsChanged,
  });
}

function applyPreviewOperation(state = {}, operation = "", payload = {}) {
  const targetNode = getPreviewTargetElement(state);
  const registryElement = getSelectedRegistryElementForPreview(state);
  const normalizedOperation = String(operation || "").trim();
  if (!targetNode || !registryElement) {
    state.previewMessage = "Kein registriertes Ziel ausgewaehlt.";
    return false;
  }

  if (!isPreviewOperationAllowed(registryElement, normalizedOperation)) {
    state.previewMessage = `Operation nicht erlaubt: ${normalizedOperation}.`;
    return false;
  }

  const previewState = getPreviewState(state, targetNode);
  if (!previewState) {
    state.previewMessage = "Preview nicht anwendbar.";
    return false;
  }

  if (normalizedOperation === "move") {
    previewState.dx += Number(payload.dx) || 0;
    previewState.dy += Number(payload.dy) || 0;
  } else if (normalizedOperation === "resizeWidth") {
    previewState.widthDelta += Number(payload.delta) || 0;
  } else if (normalizedOperation === "resizeHeight") {
    previewState.heightDelta += Number(payload.delta) || 0;
  } else if (normalizedOperation === "hide") {
    previewState.hidden = true;
  } else if (normalizedOperation === "show") {
    previewState.hidden = false;
  }

  applyPreviewState(targetNode, previewState);
  upsertPreviewChangeRequest(state, registryElement, targetNode, normalizedOperation, payload);
  state.previewMessage = "Preview angewendet.";
  return true;
}

function createPreviewControlButton(doc, label, actionId, handler) {
  const button = doc.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.setAttribute("data-ui-editor-preview-action", actionId);
  button.setAttribute("aria-label", label);
  button.title = label;
  button.disabled = typeof handler !== "function";
  button.addEventListener("mousedown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof handler === "function") handler();
  });
  return button;
}

function clearNodeChildren(node) {
  if (!node) return;
  if (typeof node.replaceChildren === "function") {
    node.replaceChildren();
    return;
  }
  node.textContent = "";
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child) {
        child.parentNode = null;
        child.parentElement = null;
      }
    }
    node.children.length = 0;
  }
}

function getPreviewPanelViewport(panel) {
  const win = getWindow(panel?._uiEditorPreviewWindow);
  const root = panel?.ownerDocument?.documentElement || null;
  return {
    width: Number(win?.innerWidth) || Number(root?.clientWidth) || 1024,
    height: Number(win?.innerHeight) || Number(root?.clientHeight) || 768,
  };
}

function clampPreviewPanelPosition(panel, left, top) {
  const viewport = getPreviewPanelViewport(panel);
  const width = Number(panel?.offsetWidth) || 320;
  const height = Number(panel?.offsetHeight) || 220;
  const minLeft = PREVIEW_PANEL_VIEWPORT_MARGIN;
  const minTop = PREVIEW_PANEL_VIEWPORT_MARGIN;
  const maxLeft = Math.max(minLeft, viewport.width - width - PREVIEW_PANEL_VIEWPORT_MARGIN);
  const maxTop = Math.max(minTop, viewport.height - height - PREVIEW_PANEL_VIEWPORT_MARGIN);
  return {
    left: Math.min(Math.max(Number(left) || minLeft, minLeft), maxLeft),
    top: Math.min(Math.max(Number(top) || minTop, minTop), maxTop),
  };
}

function normalizePreviewPanelNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function calculatePreviewPanelDragPositionWithRuntime(panel, {
  startLeft = 0,
  startTop = 0,
  deltaX = 0,
  deltaY = 0,
} = {}) {
  const viewport = getPreviewPanelViewport(panel);
  const width = Number(panel?.offsetWidth) || 320;
  const height = Number(panel?.offsetHeight) || 220;
  const minLeft = PREVIEW_PANEL_VIEWPORT_MARGIN;
  const minTop = PREVIEW_PANEL_VIEWPORT_MARGIN;
  const result = calculatePanelDragPosition({
    panelId: "bbm.uiEditor.previewPanel",
    coordinateSystem: PANEL_DRAG_COORDINATE_SYSTEM,
    startBounds: {
      x: normalizePreviewPanelNumber(startLeft, minLeft),
      y: normalizePreviewPanelNumber(startTop, minTop),
      width,
      height,
    },
    delta: {
      x: normalizePreviewPanelNumber(deltaX, 0),
      y: normalizePreviewPanelNumber(deltaY, 0),
    },
    viewportBounds: {
      x: minLeft,
      y: minTop,
      width: Math.max(0, viewport.width - (PREVIEW_PANEL_VIEWPORT_MARGIN * 2)),
      height: Math.max(0, viewport.height - (PREVIEW_PANEL_VIEWPORT_MARGIN * 2)),
    },
  });

  if (!result.ok || !result.bounds) {
    return clampPreviewPanelPosition(panel, startLeft + deltaX, startTop + deltaY);
  }

  return {
    left: result.bounds.x,
    top: result.bounds.y,
  };
}

function setPreviewPanelPosition(panel, left, top) {
  if (!panel?.style) return;
  const clamped = calculatePreviewPanelDragPositionWithRuntime(panel, {
    startLeft: left,
    startTop: top,
  });
  panel.style.left = `${clamped.left}px`;
  panel.style.top = `${clamped.top}px`;
  panel.style.right = "";
}

function resetPreviewPanelPosition(panel) {
  if (!panel?.style) return;
  panel.style.left = "";
  panel.style.right = PREVIEW_PANEL_DEFAULT_RIGHT;
  panel.style.top = PREVIEW_PANEL_DEFAULT_TOP;
}

function stopPreviewPanelEvent(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
}

function stopPreviewPanelDrag(event = null) {
  stopPreviewPanelEvent(event);
  const dragState = launcherPreviewPanelDragState;
  if (dragState?.doc?.removeEventListener) {
    dragState.doc.removeEventListener("mousemove", dragState.onMove, true);
    dragState.doc.removeEventListener("mouseup", dragState.onUp, true);
  }
  launcherPreviewPanelDragState = null;
}

function movePreviewPanelDrag(event = {}) {
  stopPreviewPanelEvent(event);
  const dragState = launcherPreviewPanelDragState;
  if (!dragState?.panel) return;
  const nextPosition = calculatePreviewPanelDragPositionWithRuntime(dragState.panel, {
    startLeft: dragState.startLeft,
    startTop: dragState.startTop,
    deltaX: Number(event.clientX) - dragState.startClientX,
    deltaY: Number(event.clientY) - dragState.startClientY,
  });
  setPreviewPanelPosition(dragState.panel, nextPosition.left, nextPosition.top);
}

function startPreviewPanelDrag(panel, event = {}) {
  if (!panel?.ownerDocument?.addEventListener) return;
  stopPreviewPanelEvent(event);
  const rect = typeof panel.getBoundingClientRect === "function"
    ? panel.getBoundingClientRect()
    : { left: Number.parseFloat(panel.style.left) || 0, top: Number.parseFloat(panel.style.top) || Number.parseFloat(PREVIEW_PANEL_DEFAULT_TOP) || 0 };
  const startLeft = Number(rect.left) || 0;
  const startTop = Number(rect.top) || Number.parseFloat(panel.style.top) || Number.parseFloat(PREVIEW_PANEL_DEFAULT_TOP) || 0;
  const doc = panel.ownerDocument;
  stopPreviewPanelDrag();
  launcherPreviewPanelDragState = {
    panel,
    doc,
    startLeft,
    startTop,
    startClientX: Number(event.clientX) || 0,
    startClientY: Number(event.clientY) || 0,
    onMove: movePreviewPanelDrag,
    onUp: stopPreviewPanelDrag,
  };
  doc.addEventListener("mousemove", launcherPreviewPanelDragState.onMove, true);
  doc.addEventListener("mouseup", launcherPreviewPanelDragState.onUp, true);
}

function stylePreviewPanel(panel) {
  if (!panel?.style) return;
  panel.style.position = "fixed";
  panel.style.right = PREVIEW_PANEL_DEFAULT_RIGHT;
  panel.style.top = PREVIEW_PANEL_DEFAULT_TOP;
  panel.style.zIndex = "2147482997";
  panel.style.boxSizing = "border-box";
  panel.style.width = "320px";
  panel.style.maxWidth = "calc(100vw - 48px)";
  panel.style.maxHeight = "calc(100vh - 156px)";
  panel.style.overflow = "auto";
  panel.style.display = "block";
  panel.style.padding = "12px";
  panel.style.border = "1px solid #64748b";
  panel.style.borderRadius = "8px";
  panel.style.background = "#f8fafc";
  panel.style.color = "#0f172a";
  panel.style.font = "13px/1.4 system-ui, sans-serif";
  panel.style.boxShadow = "0 8px 24px rgb(15 23 42 / 18%)";
  panel.style.pointerEvents = "auto";
}

function ensurePreviewPanel(doc = getDocument()) {
  if (!doc?.createElement) return null;
  if (
    launcherPreviewPanelNode?.ownerDocument === doc &&
    (launcherPreviewPanelNode.parentElement || launcherPreviewPanelNode.parentNode)
  ) {
    return launcherPreviewPanelNode;
  }

  const panel = doc.createElement("div");
  panel.className = "ui-editor-preview-panel";
  panel.setAttribute("data-ui-editor-preview-panel", "true");
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", "UI-Editor Preview");
  panel.addEventListener("mousedown", stopPreviewPanelEvent);
  panel.addEventListener("click", stopPreviewPanelEvent);
  stylePreviewPanel(panel);
  (doc.body || doc.documentElement)?.appendChild?.(panel);
  launcherPreviewPanelNode = panel;
  return panel;
}

function renderPreviewPanel(doc, state = {}) {
  const panel = ensurePreviewPanel(doc);
  if (!panel || !doc?.createElement) return null;
  panel._uiEditorPreviewWindow = state.win || getWindow();
  clearNodeChildren(panel);

  const header = doc.createElement("div");
  header.className = "ui-editor-preview-panel__header";
  header.setAttribute("data-ui-editor-preview-drag-handle", "true");
  header.style.cursor = "move";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.gap = "8px";
  header.style.marginBottom = "8px";
  header.addEventListener("mousedown", (event) => startPreviewPanelDrag(panel, event));

  const title = doc.createElement("div");
  title.className = "ui-editor-preview-controls__title";
  title.textContent = "Preview";
  title.style.fontWeight = "700";

  const resetPanelButton = doc.createElement("button");
  resetPanelButton.type = "button";
  resetPanelButton.textContent = "Panel zuruecksetzen";
  resetPanelButton.title = "Panelposition zuruecksetzen";
  resetPanelButton.setAttribute("data-ui-editor-preview-action", "panel-reset");
  resetPanelButton.addEventListener("mousedown", stopPreviewPanelEvent);
  resetPanelButton.addEventListener("click", (event) => {
    stopPreviewPanelEvent(event);
    resetPreviewPanelPosition(panel);
  });

  header.append(title, resetPanelButton);
  panel.appendChild(header);

  const registry = getSelectedRegistryFromState(state);
  const selectedElement = getSelectedRegistryElementForPreview(state);
  const targetNode = state.selectedTargetNode || null;
  const previewTargetNode = getPreviewTargetElement(state);
  const previewAvailable = Boolean(selectedElement && previewTargetNode);
  const panelViewModel = buildBbmPanelViewModel(state);
  const allowedOps = panelViewModel.allowedOps;
  const lockedOps = panelViewModel.lockedOps;
  const changeRequestSummary = panelViewModel.pendingChangeSummary;
  title.textContent = panelViewModel.title;

  const details = doc.createElement("div");
  details.className = "ui-editor-preview-controls__details";
  details.setAttribute("data-ui-editor-preview-selected", panelViewModel.targetId);
  details.textContent = [
    `Scope: ${getStatusScopeLabel(registry.uiScope || state.activeUiScope)}`,
    panelViewModel.targetId ? `Element-ID: ${panelViewModel.targetId}` : "Kein Element ausgewÃ¤hlt",
    panelViewModel.targetId ? `Preview-Ziel-ID: ${panelViewModel.previewTargetId || "nicht gesetzt"}` : "",
    `allowedOps: ${allowedOps.length > 0 ? allowedOps.join(", ") : "keine"}`,
    selectedElement ? `lockedOps: ${lockedOps.length > 0 ? lockedOps.join(", ") : "keine"}` : "",
    selectedElement ? `editGranularity: ${formatPreviewMetaValue(selectedElement.editGranularity)}` : "",
    selectedElement ? `previewTargetMode: ${formatPreviewMetaValue(getPreviewTargetMode(selectedElement))}` : "",
    selectedElement ? `affectsContainer: ${formatPreviewMetaValue(selectedElement.affectsContainer)}` : "",
    selectedElement ? `Preview-Ziel: ${panelViewModel.previewTargetLabel}` : "",
    `Aenderungen vorbereitet: ${changeRequestSummary.total}`,
    selectedElement ? `Operationen aktuelles Element: ${changeRequestSummary.operations.length > 0 ? changeRequestSummary.operations.join(" / ") : "keine"}` : "",
    "Noch nicht gespeichert",
    selectedElement && allowedOps.length <= 1 ? "Hinweis: Preview-Operationen deaktiviert." : "",
    panelViewModel.statusText ? `Status: ${panelViewModel.statusText}` : "",
  ].filter(Boolean).join("\n");
  panel.appendChild(details);

  appendReadonlySurfaceSelection(doc, panel, state);
  appendReadonlyPdfPlanPage1Hint(doc, panel, state);
  appendReadonlyPilotInfo(doc, panel, state);

  const hiddenElementsButtonViewModel = buildBbmHiddenElementsButtonViewModel(state);
  if (hiddenElementsButtonViewModel.hiddenCount < 1) {
    state.hiddenElementsPopoverOpen = false;
  }
  const hiddenElementsRow = doc.createElement("div");
  hiddenElementsRow.className = "ui-editor-preview-hidden-elements";
  hiddenElementsRow.style.marginTop = "8px";

  const hiddenElementsButton = doc.createElement("button");
  hiddenElementsButton.type = "button";
  hiddenElementsButton.textContent = hiddenElementsButtonViewModel.label || "Ausgeblendete: 0";
  hiddenElementsButton.disabled = hiddenElementsButtonViewModel.enabled !== true;
  hiddenElementsButton.setAttribute("data-ui-editor-hidden-elements-button", "true");
  hiddenElementsButton.setAttribute("data-ui-editor-hidden-elements-count", String(hiddenElementsButtonViewModel.hiddenCount || 0));
  hiddenElementsButton.setAttribute("aria-disabled", hiddenElementsButton.disabled ? "true" : "false");
  hiddenElementsButton.title = hiddenElementsButton.disabled
    ? "Keine ausgeblendeten Elemente"
    : "Ausgeblendete Elemente anzeigen";
  hiddenElementsButton.style.width = "100%";
  hiddenElementsButton.style.textAlign = "left";
  hiddenElementsButton.style.opacity = hiddenElementsButton.disabled ? "0.62" : "1";
  hiddenElementsButton.addEventListener("mousedown", stopPreviewPanelEvent);
  hiddenElementsButton.addEventListener("click", (event) => {
    stopPreviewPanelEvent(event);
    if (hiddenElementsButtonViewModel.hiddenCount < 1) {
      state.hiddenElementsPopoverOpen = false;
      return;
    }
    state.hiddenElementsPopoverOpen = !state.hiddenElementsPopoverOpen;
    renderPreviewPanel(doc, state);
  });
  hiddenElementsRow.appendChild(hiddenElementsButton);
  if (state.hiddenElementsPopoverOpen && hiddenElementsButtonViewModel.hiddenCount > 0) {
    const popoverViewModel = buildBbmHiddenElementsPopoverViewModel(state);
    const popoverItems = Array.isArray(popoverViewModel.items) ? popoverViewModel.items : [];
    const showablePopoverItems = popoverItems.filter((item) => item?.enabled === true && item?.action === "show");
    const popover = doc.createElement("div");
    popover.className = "ui-editor-preview-hidden-elements__popover";
    popover.setAttribute("data-ui-editor-hidden-elements-popover", "true");
    popover.style.marginTop = "6px";
    popover.style.padding = "8px";
    popover.style.border = "1px solid #cbd5e1";
    popover.style.borderRadius = "6px";
    popover.style.background = "#ffffff";

    const popoverTitle = doc.createElement("div");
    popoverTitle.textContent = popoverViewModel.title || "Ausgeblendete Elemente";
    popoverTitle.style.fontWeight = "700";
    popoverTitle.style.marginBottom = "6px";
    popover.appendChild(popoverTitle);

    if (showablePopoverItems.length > 1) {
      const showAllButton = doc.createElement("button");
      showAllButton.type = "button";
      showAllButton.textContent = "Alle einblenden";
      showAllButton.setAttribute("data-ui-editor-hidden-elements-action", "show-all");
      showAllButton.style.marginBottom = "6px";
      showAllButton.addEventListener("mousedown", stopPreviewPanelEvent);
      showAllButton.addEventListener("click", async (event) => {
        stopPreviewPanelEvent(event);
        for (const item of showablePopoverItems) {
          await showHiddenElement(state, item.elementId);
        }
        renderPreviewPanel(doc, state);
      });
      popover.appendChild(showAllButton);
    }

    for (const item of popoverItems) {
      const row = doc.createElement("div");
      row.setAttribute("data-ui-editor-hidden-elements-item", item.elementId || "");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.gap = "8px";
      row.style.marginTop = "4px";

      const label = doc.createElement("span");
      label.textContent = item.label || item.elementId || "Element";
      row.appendChild(label);

      const showButton = doc.createElement("button");
      showButton.type = "button";
      showButton.textContent = "Einblenden";
      showButton.disabled = item.enabled !== true || item.action !== "show";
      showButton.setAttribute("data-ui-editor-hidden-elements-action", "show");
      showButton.setAttribute("data-ui-editor-hidden-elements-target", item.elementId || "");
      showButton.addEventListener("mousedown", stopPreviewPanelEvent);
      showButton.addEventListener("click", async (event) => {
        stopPreviewPanelEvent(event);
        if (await showHiddenElement(state, item.elementId)) {
          renderPreviewPanel(doc, state);
        }
      });
      row.appendChild(showButton);
      popover.appendChild(row);
    }
    hiddenElementsRow.appendChild(popover);
  }
  panel.appendChild(hiddenElementsRow);

  const buttonGrid = doc.createElement("div");
  buttonGrid.className = "ui-editor-preview-controls";
  buttonGrid.setAttribute("data-ui-editor-preview-controls", "true");
  buttonGrid.style.display = "grid";
  buttonGrid.style.gridTemplateColumns = "repeat(2, minmax(112px, 1fr))";
  buttonGrid.style.gap = "6px";
  buttonGrid.style.marginTop = "10px";

  const getButtonViewModel = (id) => panelViewModel.buttons.find((button) => button.id === id) || null;
  const addButton = (fallbackLabel, operation, payload = {}, actionId = operation) => {
    const buttonViewModel = getButtonViewModel(actionId);
    const label = buttonViewModel?.label || fallbackLabel;
    const allowed = previewAvailable && buttonViewModel?.isEnabled === true;
    buttonGrid.appendChild(createPreviewControlButton(doc, label, actionId, allowed
      ? () => {
          applyPreviewOperation(state, operation, payload);
          renderPreviewPanel(doc, state);
        }
      : null));
  };

  addButton("Links", "move", { dx: -PREVIEW_MOVE_STEP, dy: 0 }, "move-left");
  addButton("Rechts", "move", { dx: PREVIEW_MOVE_STEP, dy: 0 }, "move-right");
  addButton("Hoch", "move", { dx: 0, dy: -PREVIEW_MOVE_STEP }, "move-up");
  addButton("Runter", "move", { dx: 0, dy: PREVIEW_MOVE_STEP }, "move-down");
  addButton("Breite -", "resizeWidth", { delta: -PREVIEW_RESIZE_STEP }, "width-minus");
  addButton("Breite +", "resizeWidth", { delta: PREVIEW_RESIZE_STEP }, "width-plus");
  addButton("Hoehe -", "resizeHeight", { delta: -PREVIEW_RESIZE_STEP }, "height-minus");
  addButton("Hoehe +", "resizeHeight", { delta: PREVIEW_RESIZE_STEP }, "height-plus");
  addButton("Ausblenden", "hide");
  addButton("Einblenden", "show");

  const resetButtonViewModel = getButtonViewModel("reset");
  buttonGrid.appendChild(createPreviewControlButton(doc, resetButtonViewModel?.label || "Reset", "reset", resetButtonViewModel?.isEnabled
    ? () => {
        resetSelectedPreviewChange(state);
        renderPreviewPanel(doc, state);
      }
    : null));

  const discardButtonViewModel = getButtonViewModel("discard");
  buttonGrid.appendChild(createPreviewControlButton(doc, discardButtonViewModel?.label || "Aenderungen verwerfen", "discard-changes", discardButtonViewModel?.isEnabled
    ? () => {
        discardPendingPreviewChanges(state);
        renderPreviewPanel(doc, state);
      }
    : null));

  panel.appendChild(buttonGrid);
  return panel;
}

function renderPreviewControls(doc, status, state) {
  if (!doc?.createElement || !status) return;
  const content = getLauncherStatusContentNode(status);
  if (!content?.appendChild) return;

  const selectedElement = getSelectedRegistryElementForPreview(state);
  const hasTarget = Boolean(state.selectedTargetNode);
  if (!selectedElement || !hasTarget) return;

  const allowedOps = getElementAllowedOps(selectedElement);
  const controls = doc.createElement("div");
  controls.className = "ui-editor-preview-controls";
  controls.setAttribute("data-ui-editor-preview-controls", "true");

  const title = doc.createElement("div");
  title.className = "ui-editor-preview-controls__title";
  title.textContent = "Preview";
  controls.appendChild(title);

  const details = doc.createElement("div");
  details.className = "ui-editor-preview-controls__details";
  details.setAttribute("data-ui-editor-preview-selected", selectedElement.id);
  details.textContent = [
    `Element: ${selectedElement.id}`,
    `allowedOps: ${allowedOps.length > 0 ? allowedOps.join(", ") : "keine"}`,
  ].join("\n");
  controls.appendChild(details);

  const addButton = (label, operation, payload = {}, actionId = operation) => {
    const allowed = isPreviewOperationAllowed(selectedElement, operation);
    controls.appendChild(createPreviewControlButton(doc, label, actionId, allowed
      ? () => {
          applyPreviewOperation(state, operation, payload);
          const updatedStatus = updateLauncherStatusHint(doc, status.parentElement, state);
          renderReadonlyScopeButtons(doc, updatedStatus, state);
          renderPreviewControls(doc, updatedStatus, state);
          renderPreviewPanel(doc, state);
        }
      : null));
  };

  addButton("â† Move links", "move", { dx: -PREVIEW_MOVE_STEP, dy: 0 }, "move-left");
  addButton("â†’ Move rechts", "move", { dx: PREVIEW_MOVE_STEP, dy: 0 }, "move-right");
  addButton("â†‘ Move hoch", "move", { dx: 0, dy: -PREVIEW_MOVE_STEP }, "move-up");
  addButton("â†“ Move runter", "move", { dx: 0, dy: PREVIEW_MOVE_STEP }, "move-down");
  addButton("Breite -", "resizeWidth", { delta: -PREVIEW_RESIZE_STEP }, "width-minus");
  addButton("Breite +", "resizeWidth", { delta: PREVIEW_RESIZE_STEP }, "width-plus");
  addButton("Hoehe -", "resizeHeight", { delta: -PREVIEW_RESIZE_STEP }, "height-minus");
  addButton("Hoehe +", "resizeHeight", { delta: PREVIEW_RESIZE_STEP }, "height-plus");
  addButton("Ausblenden", "hide");
  addButton("Einblenden", "show");

  controls.appendChild(createPreviewControlButton(doc, "Preview zuruecksetzen", "reset", () => {
    resetSelectedPreviewChange(state);
    const updatedStatus = updateLauncherStatusHint(doc, status.parentElement, state);
    renderReadonlyScopeButtons(doc, updatedStatus, state);
    renderPreviewControls(doc, updatedStatus, state);
    renderPreviewPanel(doc, state);
  }));

  content.appendChild(controls);
}

function syncLauncherButtonState(button, state, { doc = getDocument(), host = null } = {}) {
  const active = !!state?.uiEditorLauncherActive;
  button.dataset.uiEditorLauncherActive = active ? "true" : "false";
  button.setAttribute("data-ui-editor-launcher-active", active ? "true" : "false");
  button.setAttribute("aria-pressed", active ? "true" : "false");
  doc?.body?.setAttribute?.(UI_EDITOR_ACTIVE_ATTRIBUTE, active ? "true" : "false");

  if (active) {
    const status = updateLauncherStatusHint(doc, host || button.parentElement, state);
    renderReadonlyScopeButtons(doc, status, state);
    renderPreviewControls(doc, status, state);
    renderPreviewPanel(doc, state);
    installLauncherTargetSelectionController(doc, host || button.parentElement, state);
  } else {
    removeLauncherTargetSelectionController(state);
    removeExistingLauncherStatus(doc);
    removeExistingPreviewPanel();
  }
}

function findClickedUiEditorTarget(event) {
  const target = event?.target || null;
  return typeof target?.closest === "function" ? target.closest("[data-ui-editor-id]") : null;
}

function getRegisteredElementById(state = {}, uiEditorId = "") {
  const normalizedId = String(uiEditorId || "").trim();
  if (!normalizedId) return null;
  const registry = getSelectedRegistryFromState(state);
  return registry.elements.find((element) => element.id === normalizedId) || null;
}

function markUiEditorTargetSelection(state, targetNode, registryElement) {
  clearUiEditorTargetSelection(state);
  state.selectedTargetNode = targetNode;
  state.selectedElement = registryElement;
  state.selectedTargetPreviousStyle = {
    outline: targetNode.style.outline || "",
    boxShadow: targetNode.style.boxShadow || "",
  };
  targetNode.setAttribute(UI_EDITOR_SELECTED_ATTRIBUTE, "true");
  targetNode.style.outline = "2px solid #2563eb";
  targetNode.style.boxShadow = "0 0 0 4px rgb(37 99 235 / 18%)";
}

function handleUiEditorDocumentClick(event, { state, doc, host }) {
  if (!state?.uiEditorLauncherActive) return;
  const targetNode = findClickedUiEditorTarget(event);
  const uiEditorId = String(targetNode?.getAttribute?.("data-ui-editor-id") || "").trim();
  const registryElement = getRegisteredElementById(state, uiEditorId);
  if (!targetNode || !registryElement) return;

  event?.preventDefault?.();
  event?.stopPropagation?.();
  markUiEditorTargetSelection(state, targetNode, registryElement);
  state.selectedPreviewTargetNode = resolvePreviewTargetElement(state, {
    registryElement,
    targetElement: targetNode,
  });
  const status = updateLauncherStatusHint(doc, host, state);
  renderReadonlyScopeButtons(doc, status, state);
  renderPreviewControls(doc, status, state);
  renderPreviewPanel(doc, state);
}

function installLauncherDocumentClickHandler(doc, host, state) {
  removeLauncherDocumentClickHandler();
  if (!doc?.addEventListener) return;
  launcherDocumentClickHandler = (event) => handleUiEditorDocumentClick(event, { state, doc, host });
  launcherDocumentClickDocument = doc;
  doc.addEventListener("click", launcherDocumentClickHandler, true);
}

function renderLauncherButton({ artifact, doc, host, state, onToggle = null }) {
  if (!artifact?.id || !doc?.createElement || !host?.appendChild) return null;

  removeExistingLauncher(doc);

  const button = doc.createElement("button");
  button.type = "button";
  button.id = artifact.id;
  button.className = "ui-editor-launcher-button";
  button.textContent = "UI-Editor";
  button.title = "UI-Editor";
  button.setAttribute(LAUNCHER_HOST_ATTRIBUTE, "true");
  button.setAttribute("data-ui-editor-installed-artifact", "uiEditor/uiEditorLauncherButton.js");
  button.setAttribute("data-ui-editor-launcher-id", artifact.id);
  button.setAttribute("data-ui-editor-launcher-role", artifact.role || "editor-launcher");
  button.setAttribute("data-ui-editor-active-ui-scope", state.activeUiScope == null ? "" : String(state.activeUiScope));
  button.setAttribute("aria-label", "UI-Editor");
  syncLauncherButtonState(button, state, { doc, host });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    state.uiEditorLauncherActive = !state.uiEditorLauncherActive;
    syncLauncherButtonState(button, state, { doc, host });
    if (typeof onToggle === "function") {
      onToggle({
        uiEditorLauncherActive: state.uiEditorLauncherActive,
        activeUiScope: state.activeUiScope || null,
        launcherId: artifact.id,
      });
    }
  });

  host.appendChild(button);
  launcherHostNode = button;
  launcherRuntimeState = state;
  return button;
}

function isRuntimeLauncherDevEnabled({ header = null, devEnabled = null } = {}) {
  if (typeof devEnabled === "boolean") return devEnabled;
  if (typeof header?._isUiEditorEnabled === "function") return header._isUiEditorEnabled() === true;
  return false;
}

function buildReadonlySurfaceModelForLauncher(surfaceId, input = {}) {
  return validateSurfaceModelById(surfaceId, input);
}

function buildReadonlySurfaceInfoForLauncher(surfaceId, input = {}) {
  const normalizedSurfaceId = String(surfaceId || "").trim();
  if (!normalizedSurfaceId || !isSurfaceVisibleInEditor(normalizedSurfaceId)) return null;
  const result = buildReadonlySurfaceModelForLauncher(normalizedSurfaceId, input);
  if (!result?.ok || !result.surfaceModel) return null;

  return {
    surfaceId: result.surfaceModel.surfaceId || normalizedSurfaceId,
    surfaceType: result.surfaceModel.surfaceType || "unbekannt",
    elementCount: Array.isArray(result.surfaceModel.elements) ? result.surfaceModel.elements.length : 0,
  };
}

function buildReadonlySurfaceSelectionStateForLauncher(input = {}) {
  try {
    return buildReadonlySurfaceSelectionState(input);
  } catch (_error) {
    return {
      selectedSurfaceId: "",
      requestedSurfaceId: String(input?.selectedSurfaceId || "").trim(),
      readonly: true,
      availableSurfaceIds: [],
      blockedSurfaceIds: [],
      selectionAllowed: false,
      reason: "surface-selection-state-error",
    };
  }
}

function buildReadonlySurfaceSwitchResultForLauncher(targetSurfaceId, input = {}) {
  try {
    const switchResult = handleReadonlySurfaceSwitchRequestForLauncher(targetSurfaceId, input);
    const selectionState = buildReadonlySurfaceSelectionStateForLauncher({
      ...input,
      selectedSurfaceId: input.fromSurfaceId || input.selectedSurfaceId,
    });
    return {
      ...switchResult,
      fromSurfaceId: selectionState.selectedSurfaceId || READONLY_SURFACE_INFO_SURFACE_ID,
      targetSurfaceId: switchResult.requestedSurfaceId || String(targetSurfaceId || "").trim(),
    };
  } catch (_error) {
    const normalizedTargetSurfaceId = String(targetSurfaceId || "").trim();
    const fallbackSurfaceId = READONLY_SURFACE_INFO_SURFACE_ID;
    return {
      allowed: false,
      readonly: true,
      fromSurfaceId: fallbackSurfaceId,
      targetSurfaceId: normalizedTargetSurfaceId,
      requestedSurfaceId: normalizedTargetSurfaceId,
      resolvedSurfaceId: fallbackSurfaceId,
      changed: false,
      reason: "surface-switch-readonly-error",
    };
  }
}

function handleReadonlySurfaceSwitchRequestForLauncher(targetSurfaceId, input = {}) {
  const switchResult = handleReadonlySurfaceSwitchRequest({
    ...input,
    targetSurfaceId,
  });
  return {
    ...switchResult,
    resolvedSurfaceId: switchResult.resolvedSurfaceId || READONLY_SURFACE_INFO_SURFACE_ID,
  };
}

function buildReadonlySurfaceSelectionForLauncher(input = {}) {
  const switchResult = buildReadonlySurfaceSwitchResultForLauncher(
    input.selectedSurfaceId || input.targetSurfaceId || "",
    input
  );
  const selectionState = buildReadonlySurfaceSelectionStateForLauncher({
    ...input,
    selectedSurfaceId: switchResult.resolvedSurfaceId,
  });
  const model = buildReadonlySurfaceSelectionModel({
    ...input,
    surfaceIds: selectionState.availableSurfaceIds,
    selectedSurfaceId: selectionState.selectedSurfaceId,
  });
  return {
    surfaces: Array.isArray(model?.surfaces) ? model.surfaces : [],
    state: selectionState,
    switchResult,
  };
}

function buildReadonlyPdfPlanPage1HintForLauncher(input = {}) {
  const selectionModel = buildReadonlySurfaceSelectionForLauncher(input);
  const pdfSurface = Array.isArray(selectionModel?.surfaces)
    ? selectionModel.surfaces.find((surface) => surface?.surfaceId === READONLY_PDF_PLAN_PAGE_1_SURFACE_ID)
    : null;
  if (!pdfSurface || pdfSurface.readonly !== true) return null;

  return {
    surfaceId: READONLY_PDF_PLAN_PAGE_1_SURFACE_ID,
    text: READONLY_PDF_PLAN_PAGE_1_HINT_TEXT,
    readonly: true,
  };
}

function appendReadonlySurfaceSelection(doc, panel, state = {}) {
  if (!doc?.createElement || !panel?.appendChild) return null;
  const selectionModel = buildReadonlySurfaceSelectionForLauncher({
    selectedSurfaceId: state?.readonlySurfaceSelectionRequestedSurfaceId || "",
  });
  const surfaces = Array.isArray(selectionModel.surfaces) ? selectionModel.surfaces : [];
  const selectedSurface = surfaces.find((surface) => surface?.selected === true) || surfaces[0] || null;
  if (!selectedSurface) return null;

  const selection = doc.createElement("div");
  selection.className = "ui-editor-preview-surface-selection";
  selection.setAttribute("data-ui-editor-surface-selection", "true");
  selection.setAttribute("data-ui-editor-surface-id", selectedSurface.surfaceId || "");
  selection.setAttribute("data-ui-editor-surface-readonly", "true");
  selection.setAttribute("data-ui-editor-surface-count", String(surfaces.length));
  selection.style.marginTop = "8px";
  selection.style.padding = "8px";
  selection.style.border = "1px solid #cbd5e1";
  selection.style.borderRadius = "6px";
  selection.style.background = "#ffffff";
  selection.style.fontSize = "12px";
  selection.style.lineHeight = "1.35";
  selection.textContent = [
    "Surface-Auswahl",
    ...surfaces.map((surface) => {
      const label = surface.label || surface.surfaceId || "nicht verfügbar";
      return `${surface.selected ? "•" : "-"} ${label}`;
    }),
  ].join("\n");
  panel.appendChild(selection);

  const hint = doc.createElement("div");
  hint.className = "ui-editor-preview-surface-selection-hint";
  hint.setAttribute("data-ui-editor-surface-selection-hint", "true");
  hint.setAttribute("data-ui-editor-surface-id", selectedSurface.surfaceId || "");
  hint.setAttribute("data-ui-editor-surface-readonly", "true");
  hint.style.marginTop = "4px";
  hint.style.color = "#475569";
  hint.style.fontSize = "11px";
  hint.style.lineHeight = "1.3";
  hint.textContent = READONLY_SURFACE_SELECTION_HINT_TEXT;
  panel.appendChild(hint);
  return selection;
}

function appendReadonlyPdfPlanPage1Hint(doc, panel, state = {}) {
  if (!doc?.createElement || !panel?.appendChild) return null;
  const hint = buildReadonlyPdfPlanPage1HintForLauncher({
    selectedSurfaceId: state?.readonlySurfaceSelectionRequestedSurfaceId || "",
  });
  if (!hint) return null;

  const hintNode = doc.createElement("div");
  hintNode.className = "ui-editor-preview-surface-readonly-hint";
  hintNode.setAttribute("data-ui-editor-surface-readonly-hint", "true");
  hintNode.setAttribute("data-ui-editor-surface-id", hint.surfaceId);
  hintNode.setAttribute("data-ui-editor-surface-readonly", "true");
  hintNode.style.marginTop = "8px";
  hintNode.style.padding = "6px 8px";
  hintNode.style.border = "1px solid #cbd5e1";
  hintNode.style.borderRadius = "6px";
  hintNode.style.background = "#fff7ed";
  hintNode.style.color = "#9a3412";
  hintNode.style.fontSize = "11px";
  hintNode.style.lineHeight = "1.35";
  hintNode.textContent = hint.text;
  panel.appendChild(hintNode);
  return hintNode;
}

function appendReadonlyPilotInfo(doc, panel, state = {}) {
  if (!doc?.createElement || !panel?.appendChild) return null;
  const switchResult = buildReadonlySurfaceSwitchResultForLauncher(
    state?.readonlySurfaceSelectionRequestedSurfaceId || "",
    state
  );
  const surfaceId = switchResult.resolvedSurfaceId || READONLY_SURFACE_INFO_SURFACE_ID;
  const surfaceInfo = buildReadonlySurfaceInfoForLauncher(surfaceId);
  if (!surfaceInfo) return null;

  const info = doc.createElement("div");
  info.className = "ui-editor-preview-surface-info";
  info.setAttribute("data-ui-editor-surface-info", "true");
  info.setAttribute("data-ui-editor-surface-id", surfaceInfo.surfaceId);
  info.style.marginTop = "8px";
  info.style.padding = "8px";
  info.style.border = "1px solid #cbd5e1";
  info.style.borderRadius = "6px";
  info.style.background = "#f8fafc";
  info.style.fontSize = "12px";
  info.style.lineHeight = "1.35";
  info.textContent = [
    `Surface: ${surfaceInfo.surfaceId}`,
    `Typ: ${surfaceInfo.surfaceType}`,
    `Elemente: ${surfaceInfo.elementCount}`,
  ].join("\n");
  panel.appendChild(info);
  return info;
}

export async function installBbmUiEditorRuntimeLauncher({
  header = null,
  devEnabled = null,
  activeUiScope = null,
  registeredElements = null,
  availableUiScopes = null,
  registryResolver = null,
  hostAdapter = null,
  onPendingChangeRequestsChanged = null,
  doc = getDocument(),
  win = getWindow(),
  host = null,
  onToggle = null,
} = {}) {
  if (!isRuntimeLauncherDevEnabled({ header, devEnabled })) {
    removeExistingLauncher(doc);
    return null;
  }

  ensureInstalledLauncherCss(doc);
  const artifact = await loadInstalledLauncherButton({ doc, win });
  const launcherHost = getLauncherHost(doc, host);
  const state = createLauncherState({
    activeUiScope,
    registeredElements,
    availableUiScopes,
    registryResolver,
    hostAdapter,
    onPendingChangeRequestsChanged,
  });
  state.win = win || null;
  return renderLauncherButton({ artifact, doc, host: launcherHost, state, onToggle });
}

export {
  INSTALLED_LAUNCHER_SCRIPT_PATH,
  INSTALLED_LAUNCHER_CSS_PATH,
  createLauncherState,
  ensureInstalledLauncherCss,
  getInstalledLauncherArtifact,
  getInstalledTargetSelectionArtifact,
  isRuntimeLauncherDevEnabled,
  loadInstalledLauncherButton,
  getStatusScopeLabel,
  getReadonlyRegisteredElementsText,
  getReadonlyRegistryElementsText,
  getAvailableUiScopesText,
  getLauncherStatusText,
  getReadonlyLauncherStatusText,
  buildBbmPanelViewModel,
  buildBbmHiddenElementsButtonViewModel,
  buildBbmHiddenElementsPopoverViewModel,
  showHiddenElement,
  showHiddenPreviewElement,
  normalizeReadonlyRegisteredElements,
  normalizeAvailableUiScopes,
  ensureLauncherStatusHint,
  applyPreviewOperation,
  discardPendingPreviewChanges,
  findClickedUiEditorTarget,
  getPendingChangeRequestSummary,
  getRegisteredElementById,
  handleUiEditorDocumentClick,
  isPreviewOperationAllowed,
  buildReadonlySurfaceModelForLauncher,
  buildReadonlySurfaceInfoForLauncher,
  handleReadonlySurfaceSwitchRequestForLauncher,
  buildReadonlySurfaceSwitchResultForLauncher,
  buildReadonlySurfaceSelectionStateForLauncher,
  buildReadonlySurfaceSelectionForLauncher,
  buildReadonlyPdfPlanPage1HintForLauncher,
  calculatePreviewPanelDragPositionWithRuntime,
  resolvePreviewTargetElement,
  resetAllPreviewChanges,
  resetSelectedPreviewChange,
  renderPreviewPanel,
  renderLauncherButton,
  READONLY_PDF_PLAN_PAGE_1_HINT_TEXT,
};
