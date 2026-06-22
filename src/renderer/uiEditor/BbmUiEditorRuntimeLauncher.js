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
const READONLY_SURFACE_SELECTION_STATUS_TEXT = "Bearbeitung: Restarbeiten | Zusatzkontexte: PDF/Plan read-only | Speichern: nicht aktiv";
const READONLY_SURFACE_ELEMENT_CATALOG_TITLE = "Elementkatalog";
const READONLY_SURFACE_ELEMENT_CATALOG_LINES = [
  "Hinweis / Infotext: erlaubt",
  "read-only Kontext: erlaubt",
  "Bearbeitbare Elemente: gesperrt",
  "Drag / Resize: gesperrt",
  "Speichern / Persistenz: gesperrt",
];
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_TITLE = "Entwurfs-Vorschau";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_INPUT_LABEL = "Elementtext";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_LIVE_TITLE = "Live-Vorschau";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_HOST_TITLE = "Host-Vorschau";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_HOST_KIND = "Hinweis / Infotext";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_HOST_STATUS = "nicht gespeichert";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_ELEMENTMODEL_TITLE = "Elementmodell-Vorschau";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_ELEMENTMODEL_TYPE = "Typ: Hinweis / Infotext";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_ELEMENTMODEL_SURFACE = "Surface: restarbeiten.ui.main";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_ELEMENTMODEL_STATUS = "Status: nicht gespeichert";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_TITLE = "Payload-Vorschau";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_TYPE = "type: Hinweis / Infotext";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_SURFACE_ID = "surfaceId: restarbeiten.ui.main";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_STATUS = "status: draft";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_PERSISTED = "persisted: false";
const READONLY_HINT_INFOTEXT_STORAGE_TITLE = "Elementbearbeitung";
const READONLY_HINT_INFOTEXT_STORAGE_CONTEXT_TITLE = "Restarbeit-Kontext";
const READONLY_HINT_INFOTEXT_HOST_CONTEXT_REQUIRED_SOURCE = "BBM-Restarbeiten-Host erforderlich";
const READONLY_HINT_INFOTEXT_STORAGE_CHECK_TITLE = "Freigabecheck";
const READONLY_HINT_INFOTEXT_STORAGE_CHECK_VALID_LINE = "Hinweistext gültig: ja";
const READONLY_HINT_INFOTEXT_STORAGE_CHECK_INVALID_LINE = "Hinweistext gültig: nein";
const READONLY_HINT_INFOTEXT_STORAGE_CHECK_TARGET_SURFACE_LINE = "Ziel-Surface: restarbeiten.ui.main";
const READONLY_HINT_INFOTEXT_ELEMENT_SAVE_STATUS_TITLE = "UI-Element-Speicherstatus";
const READONLY_HINT_INFOTEXT_ELEMENT_SAVE_TARGET_LINE = "Speicherziel: UI-Element-Konfiguration";
const READONLY_HINT_INFOTEXT_ELEMENT_SAVE_CONTRACT_REASON = "Speichervertrag für UI-Elementänderungen fehlt noch";
const UI_EDITOR_ELEMENT_SAVE_CONTRACT_NOT_IMPLEMENTED_REASON = "UI-Element-Speichervertrag noch nicht implementiert";
const READONLY_HINT_INFOTEXT_NOTE_SAVE_NOT_USED_LINE = "Restarbeiten-Notizspeicherweg: nicht verwendet";
const READONLY_HINT_INFOTEXT_DIAGNOSTICS_TITLE = "Diagnose / Entwicklerdetails";
const READONLY_HINT_INFOTEXT_STORAGE_ROUTE_LINE = "Speicherweg: UI-Elementänderungen";
const READONLY_HINT_INFOTEXT_STORAGE_TARGET_LINE = "Ziel: UI-Element-Konfiguration";
const READONLY_HINT_INFOTEXT_STORAGE_STATUS_LINE = "Status: blockiert, Speichervertrag fehlt";
const READONLY_HINT_INFOTEXT_STORAGE_PERSISTED_LINE = "persisted: false";
const READONLY_HINT_INFOTEXT_STORAGE_BUTTON_LABEL = "Änderungen speichern";
const READONLY_HINT_INFOTEXT_CREATE_NOTE_PAYLOAD_TITLE = "Create-Note-Payload-Vorschau";
const READONLY_HINT_INFOTEXT_CREATE_NOTE_PAYLOAD_TARGET = "Ziel: restarbeiten:createNote";
const READONLY_HINT_INFOTEXT_WRITE_GATE_TITLE = "Schreibfreigabe-Gate";
const READONLY_HINT_INFOTEXT_WRITE_GATE_SOURCE_LINE = "Freigabequelle: Konfiguration";
const READONLY_HINT_INFOTEXT_WRITE_GATE_REASON_LINE =
  "Grund: Produktiv-Speicherweg nur bei vollständigem Restarbeiten-Kontext freigegeben";
const READONLY_HINT_INFOTEXT_SAVE_HANDLER_TITLE = "Speicher-Handler";
const READONLY_HINT_INFOTEXT_SAVE_HANDLER_PREPARED_LINE = "Speicher-Handler: vorbereitet";
const READONLY_HINT_INFOTEXT_SAVE_HANDLER_STATUS_LINE = "Handler-Status: blockiert";
const READONLY_HINT_INFOTEXT_SAVE_HANDLER_BLOCKED_REASON = "Schreibfreigabe-Gate geschlossen";
const READONLY_HINT_INFOTEXT_SAVE_ADAPTER_TITLE = "Save-Adapter";
const READONLY_HINT_INFOTEXT_SAVE_ADAPTER_PREPARED_LINE = "Adapter: vorbereitet";
const READONLY_HINT_INFOTEXT_SAVE_ADAPTER_TARGET_ADAPTER = "Restarbeiten-Notizweg";
const READONLY_HINT_INFOTEXT_SAVE_ADAPTER_TARGET_METHOD = "window.bbmDb.restarbeitenCreateNote";
const READONLY_HINT_INFOTEXT_SAVE_ADAPTER_TARGET_CHANNEL = "restarbeiten:createNote";
const READONLY_HINT_INFOTEXT_PRODUCTIVE_SAVE_ADAPTER_PREPARED_LINE = "Produktiv-Save-Adapter: Diagnose/Altspur";
const READONLY_HINT_INFOTEXT_PRODUCTIVE_SAVE_ADAPTER_STANDARD_BLOCKED_LINE =
  "Produktiv-Ausführung im Standardpfad: nicht verwendet";
const READONLY_HINT_INFOTEXT_SAVE_EXECUTION_TITLE = "Save-Ausführung";
const READONLY_HINT_INFOTEXT_SAVE_EXECUTION_PREPARED_LINE = "Save-Ausführung: vorbereitet";
const READONLY_HINT_INFOTEXT_SAVE_EXECUTION_STANDARD_BLOCKED_LINE =
  "Ausführung im Standardzustand: blockiert";
const READONLY_HINT_INFOTEXT_SAVE_EXECUTION_NOT_EXECUTED_LINE = "Ausgeführt: nein";
const READONLY_HINT_INFOTEXT_SAVE_BUTTON_STATE_TITLE = "Speicherbutton-Aktivierung";
const READONLY_HINT_INFOTEXT_SAVE_BUTTON_STATE_PREPARED_LINE = "Button-Aktivierungsprüfung: vorbereitet";
const READONLY_HINT_INFOTEXT_SAVE_BUTTON_STATE_STANDARD_DISABLED_LINE =
  "Button im Standardpfad: deaktiviert";
const READONLY_HINT_INFOTEXT_SAVE_BUTTON_STATE_EXPLICIT_RELEASE_LINE =
  "Aktivierung nur mit expliziter Freigabe";
const READONLY_HINT_INFOTEXT_SAVE_GUARD_TITLE = "Speicherschutz";
const READONLY_HINT_INFOTEXT_SAVE_GUARD_PREPARED_LINE = "Speicherschutz: vorbereitet";
const READONLY_HINT_INFOTEXT_SAVE_GUARD_DOUBLE_CLICK_LINE = "Doppelklickschutz: aktiv";
const READONLY_HINT_INFOTEXT_SAVE_GUARD_DUPLICATE_LINE =
  "Mehrfachspeicherung gleicher Payload: vorbereitet";
const READONLY_HINT_INFOTEXT_SAVE_GUARD_STANDARD_BLOCKED_LINE = "Standardpfad: hinter Gate";
const READONLY_HINT_INFOTEXT_SAVE_CLICK_TITLE = "Speicherklick";
const READONLY_HINT_INFOTEXT_SAVE_CLICK_PREPARED_LINE = "Speicherklick: vorbereitet";
const READONLY_HINT_INFOTEXT_SAVE_CLICK_STANDARD_BLOCKED_LINE = "Klickpfad im Standard: hinter Gate";
const READONLY_HINT_INFOTEXT_SAVE_CLICK_NOT_EXECUTED_LINE = "Letzter Klickstatus: nicht ausgeführt";
const UI_EDITOR_ELEMENT_SAVE_ALLOWED_SURFACES = Object.freeze(["restarbeiten.ui.main"]);
const UI_EDITOR_ELEMENT_SAVE_ALLOWED_ELEMENT_TYPES = Object.freeze(["Hinweis / Infotext", "label"]);
const UI_EDITOR_ELEMENT_SAVE_ALLOWED_CHANGE_KEYS = Object.freeze(["text", "label", "visible", "order"]);
const UI_EDITOR_ELEMENT_SAVE_ALLOWED_TOP_LEVEL_KEYS = Object.freeze([
  "targetAppId",
  "moduleId",
  "projectId",
  "surfaceId",
  "elementId",
  "elementType",
  "changes",
  "updatedAt",
]);
const UI_EDITOR_ELEMENT_SAVE_FORBIDDEN_TOP_LEVEL_KEYS = Object.freeze([
  "restarbeitId",
  "noteText",
  "persisted",
  "previewOnly",
  "debugPayload",
  "diagnostics",
  "diagnosticState",
]);
const READONLY_HINT_INFOTEXT_DRAFT_VALIDATION_TITLE = "Entwurfsprüfung";
const READONLY_HINT_INFOTEXT_DRAFT_VALIDATION_STATUS_VALID = "Status: gültiger lokaler Entwurf";
const READONLY_HINT_INFOTEXT_DRAFT_VALIDATION_STATUS_EMPTY = "Status: Hinweistext fehlt";
const READONLY_HINT_INFOTEXT_DRAFT_VALIDATION_SAVE_STATUS = "Speichern: nicht aktiv";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_DEFAULT_TEXT = "Dies ist ein nicht gespeicherter Hinweis-Entwurf.";
const READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_LINES = [
  "Elementart: Hinweis / Infotext",
  "Status: Vorschau, nicht gespeichert",
  "Zielkontext: Restarbeiten",
];

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

function resolveReadonlyHintInfotextHostContextInput(hostContext = null) {
  if (typeof hostContext !== "function") return hostContext;
  try {
    return hostContext();
  } catch {
    return null;
  }
}

function createLauncherState({
  activeUiScope = null,
  registeredElements = null,
  availableUiScopes = null,
  registryResolver = null,
  hostAdapter = null,
  hostContext = null,
  hostContextStatus = null,
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
    hintInfotextDraftText: READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_DEFAULT_TEXT,
    hostContextProvider: typeof hostContext === "function" ? hostContext : null,
    hostContextStatus: normalizeHostContextStatus(
      hostContextStatus ?? resolveReadonlyHintInfotextHostContextInput(hostContext)
    ),
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

function isPreviewPanelEditableEventTarget(target = null) {
  let current = target && typeof target === "object" ? target : null;
  while (current) {
    const tagName = String(current.tagName || "").toUpperCase();
    if (tagName === "TEXTAREA" || tagName === "INPUT" || tagName === "SELECT") {
      return current.disabled !== true && current.readOnly !== true;
    }
    if (current.getAttribute?.("contenteditable") === "true" || current.isContentEditable === true) {
      return true;
    }
    current = current.parentElement || current.parentNode || null;
  }
  return false;
}

function stopPreviewPanelEvent(event) {
  if (!isPreviewPanelEditableEventTarget(event?.target || null)) {
    event?.preventDefault?.();
  }
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

  appendReadonlyHintInfotextDraftPreview(doc, panel, state);
  appendReadonlyHintInfotextStoragePreview(doc, panel, state);
  appendReadonlySurfaceSelection(doc, panel, state);
  appendReadonlySurfaceElementCatalogOverview(doc, panel);
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

function createReadonlyHintInfotextHostContextStatusModel() {
  return {
    projectId: null,
    restarbeitId: null,
    targetContext: "Restarbeiten",
    targetSurfaceId: READONLY_SURFACE_INFO_SURFACE_ID,
    targetLabel: "nicht ausgewählt",
    elementType: "Hinweis / Infotext",
    source: READONLY_HINT_INFOTEXT_HOST_CONTEXT_REQUIRED_SOURCE,
    isPresent: false,
  };
}

function normalizeReadonlyHintInfotextHostContextValue(value = "") {
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value).trim();
  }
  return "";
}

function normalizeHostContextStatus(input = null) {
  const defaultStatus = createReadonlyHintInfotextHostContextStatusModel();
  if (!input || typeof input !== "object") return defaultStatus;

  const projectId = normalizeReadonlyHintInfotextHostContextValue(input.projectId);
  const restarbeitId = normalizeReadonlyHintInfotextHostContextValue(input.restarbeitId);
  const targetContext = normalizeReadonlyHintInfotextHostContextValue(input.targetContext);
  const targetSurfaceId = normalizeReadonlyHintInfotextHostContextValue(input.targetSurfaceId);
  const targetLabel = normalizeReadonlyHintInfotextHostContextValue(input.targetLabel);
  const elementType = normalizeReadonlyHintInfotextHostContextValue(input.elementType);
  const source = normalizeReadonlyHintInfotextHostContextValue(input.source) || defaultStatus.source;

  const isPresent = Boolean(
    projectId &&
      restarbeitId &&
      targetContext === defaultStatus.targetContext &&
      targetSurfaceId === defaultStatus.targetSurfaceId &&
      elementType === defaultStatus.elementType &&
      targetLabel
  );

  if (!isPresent) return defaultStatus;

  return {
    projectId,
    restarbeitId,
    targetContext: defaultStatus.targetContext,
    targetSurfaceId: defaultStatus.targetSurfaceId,
    targetLabel,
    elementType: defaultStatus.elementType,
    source,
    isPresent: true,
  };
}

function buildReadonlyHintInfotextHostContextStatusModel(input = null) {
  return normalizeHostContextStatus(input);
}

function getReadonlyHintInfotextHostContextStatus(state = {}) {
  if (typeof state?.hostContextProvider === "function") {
    const normalizedHostContextStatus = normalizeHostContextStatus(
      resolveReadonlyHintInfotextHostContextInput(state.hostContextProvider)
    );
    state.hostContextStatus = normalizedHostContextStatus;
    return normalizedHostContextStatus;
  }
  if (state?.hostContextStatus && typeof state.hostContextStatus === "object") {
    const normalizedHostContextStatus = normalizeHostContextStatus(state.hostContextStatus);
    state.hostContextStatus = normalizedHostContextStatus;
    return normalizedHostContextStatus;
  }
  const hostContextStatus = createReadonlyHintInfotextHostContextStatusModel();
  if (state && typeof state === "object") {
    state.hostContextStatus = hostContextStatus;
  }
  return hostContextStatus;
}

function formatReadonlyHintInfotextStorageContextText(hostContextStatus = createReadonlyHintInfotextHostContextStatusModel()) {
  const projectIdPresent = Boolean(hostContextStatus.projectId);
  const restarbeitIdPresent = Boolean(hostContextStatus.restarbeitId);
  const writeReleased = getReadonlyHintInfotextWriteReleaseConfig().writeReleaseEnabled === true;
  return [
    `Host-Kontext vorhanden: ${hostContextStatus.isPresent === true ? "ja" : "nein"}`,
    `projectId vorhanden: ${projectIdPresent ? "ja" : "nein"}`,
    `restarbeitId vorhanden: ${restarbeitIdPresent ? "ja" : "nein"}`,
    `Zielkontext: ${hostContextStatus.targetContext}`,
    `Ziel-Surface: ${hostContextStatus.targetSurfaceId}`,
    `Elementtyp: ${hostContextStatus.elementType}`,
    `restarbeitId: ${hostContextStatus.restarbeitId ? hostContextStatus.restarbeitId : "nicht übergeben"}`,
    `Ziel-Restarbeit: ${hostContextStatus.targetLabel}`,
    `Kontextquelle: ${hostContextStatus.source}`,
    `Schreibweg freigegeben: ${writeReleased ? "ja" : "nein"}`,
    "Speichern: nur bei vollständigem Gate aktiv",
    "persisted: false",
  ].join("\n");
}

function formatReadonlyHintInfotextStorageFreigabecheckText(
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel()
) {
  const hintTextValid = isReadonlyHintInfotextDraftValid(value);
  const projectIdPresent = Boolean(hostContextStatus.projectId);
  const restarbeitIdPresent = Boolean(hostContextStatus.restarbeitId);
  const technicallyReady = hostContextStatus.isPresent === true && hintTextValid;
  const writeGate = buildReadonlyHintInfotextWriteGateViewModel({ value, hostContextStatus });
  return [
    hintTextValid
      ? READONLY_HINT_INFOTEXT_STORAGE_CHECK_VALID_LINE
      : READONLY_HINT_INFOTEXT_STORAGE_CHECK_INVALID_LINE,
    `Host-Kontext vorhanden: ${hostContextStatus.isPresent === true ? "ja" : "nein"}`,
    `projectId vorhanden: ${projectIdPresent ? "ja" : "nein"}`,
    `restarbeitId vorhanden: ${restarbeitIdPresent ? "ja" : "nein"}`,
    `Zielkontext: ${hostContextStatus.targetContext}`,
    `Ziel-Surface: ${hostContextStatus.targetSurfaceId}`,
    `Elementtyp: ${hostContextStatus.elementType}`,
    `technisch/fachlich speicherbereit: ${technicallyReady ? "ja" : "nein"}`,
    `Schreibweg freigegeben: ${writeGate.writeReleased ? "ja" : "nein"}`,
    `Speichern: ${writeGate.gateOpen ? "bereit" : "gesperrt"}`,
    `Speicherbutton: ${writeGate.gateOpen ? "prüft Adapter" : "deaktiviert"}`,
    "persisted: false",
  ].join("\n");
}

function buildReadonlyHintInfotextWriteGateViewModel({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
} = {}) {
  const releaseConfig = getReadonlyHintInfotextWriteReleaseConfig();
  const hintTextValid = isReadonlyHintInfotextDraftValid(value);
  const hostContextValid = hostContextStatus.isPresent === true;
  const projectIdPresent = Boolean(hostContextStatus && hostContextStatus.projectId);
  const restarbeitIdPresent = Boolean(hostContextStatus && hostContextStatus.restarbeitId);
  const targetContextValid = hostContextStatus?.targetContext === "Restarbeiten";
  const targetSurfaceValid = hostContextStatus?.targetSurfaceId === READONLY_SURFACE_INFO_SURFACE_ID;
  const elementTypeValid = hostContextStatus?.elementType === "Hinweis / Infotext";
  const payloadComplete =
    hostContextValid
    && projectIdPresent
    && restarbeitIdPresent
    && targetContextValid
    && targetSurfaceValid
    && elementTypeValid
    && hintTextValid;
  const writeReleaseEnabled = releaseConfig.writeReleaseEnabled === true;
  const gateOpen = writeReleaseEnabled === true && payloadComplete === true;
  return Object.freeze({
    gateOpen,
    releaseSource: releaseConfig.source,
    releaseValue: writeReleaseEnabled,
    reason: gateOpen ? "alle Speicherbedingungen erfüllt" : releaseConfig.reason,
    hostContextValid,
    projectIdPresent,
    restarbeitIdPresent,
    targetContextValid,
    targetSurfaceValid,
    elementTypeValid,
    payloadComplete,
    technicallyReady: payloadComplete,
    writeReleased: gateOpen,
    buttonEnabled: gateOpen,
    persisted: false,
    previewOnly: true,
  });
}

function getReadonlyHintInfotextWriteReleaseConfig() {
  return Object.freeze({
    source: "configuration",
    writeReleaseEnabled: true,
    reason: "Produktiv-Speicherweg nur bei vollständigem Restarbeiten-Kontext freigegeben",
  });
}

function formatReadonlyHintInfotextCreateNotePayloadPreviewText(
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel()
) {
  const hintText = String(value == null ? "" : value);
  const writeGate = buildReadonlyHintInfotextWriteGateViewModel({ value: hintText, hostContextStatus });
  const payloadComplete = writeGate.payloadComplete;
  return [
    `Payload vollständig: ${payloadComplete ? "ja" : "nein"}`,
    READONLY_HINT_INFOTEXT_CREATE_NOTE_PAYLOAD_TARGET,
    `restarbeitId: ${hostContextStatus.restarbeitId ? hostContextStatus.restarbeitId : "nicht übergeben"}`,
    `noteText: ${payloadComplete ? hintText : "nicht bereit"}`,
    `projectId: ${hostContextStatus.projectId ? hostContextStatus.projectId : "nicht übergeben"}`,
    "persisted: false",
    "previewOnly: true",
    `Schreibweg freigegeben: ${writeGate.writeReleased ? "ja" : "nein"}`,
  ].join("\n");
}

function formatReadonlyHintInfotextWriteGateText(
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel()
) {
  const writeGate = buildReadonlyHintInfotextWriteGateViewModel({ value, hostContextStatus });
  return [
    `Schreibfreigabe-Gate: ${writeGate.gateOpen ? "offen" : "geschlossen"}`,
    READONLY_HINT_INFOTEXT_WRITE_GATE_SOURCE_LINE,
    `Freigabewert: ${writeGate.releaseValue ? "true" : "false"}`,
    `Grund: ${writeGate.reason}`,
    `Payload vollständig: ${writeGate.payloadComplete ? "ja" : "nein"}`,
    `technisch/fachlich speicherbereit: ${writeGate.technicallyReady ? "ja" : "nein"}`,
    `Schreibweg freigegeben: ${writeGate.writeReleased ? "ja" : "nein"}`,
    `Button aktivierbar: ${writeGate.buttonEnabled ? "ja" : "nein"}`,
    `Speicherbutton: ${writeGate.buttonEnabled ? "Adapterprüfung" : "deaktiviert"}`,
    "persisted: false",
    "previewOnly: true",
  ].join("\n");
}

function normalizeUiEditorElementSaveText(value) {
  return String(value == null ? "" : value).trim();
}

function isPlainUiEditorElementSaveObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isUiEditorElementSaveSurfaceAllowed(surfaceId = "") {
  return UI_EDITOR_ELEMENT_SAVE_ALLOWED_SURFACES.includes(normalizeUiEditorElementSaveText(surfaceId));
}

function isUiEditorElementSaveElementTypeAllowed(elementType = "") {
  return UI_EDITOR_ELEMENT_SAVE_ALLOWED_ELEMENT_TYPES.includes(normalizeUiEditorElementSaveText(elementType));
}

function normalizeUiEditorElementSaveChanges(changes = {}) {
  const normalized = {};
  for (const key of UI_EDITOR_ELEMENT_SAVE_ALLOWED_CHANGE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(changes, key)) continue;
    const value = changes[key];
    if (key === "text" || key === "label") {
      normalized[key] = normalizeUiEditorElementSaveText(value);
      continue;
    }
    if (key === "visible") {
      normalized[key] = value;
      continue;
    }
    if (key === "order") {
      normalized[key] = Number(value);
    }
  }
  return normalized;
}

function validateUiEditorElementSavePayload(payload = {}) {
  const errors = [];
  if (!isPlainUiEditorElementSaveObject(payload)) {
    return Object.freeze({
      ok: false,
      reason: "Payload muss ein Objekt sein",
      errors: Object.freeze(["Payload muss ein Objekt sein"]),
      normalizedPayload: null,
    });
  }

  for (const key of Object.keys(payload)) {
    if (UI_EDITOR_ELEMENT_SAVE_FORBIDDEN_TOP_LEVEL_KEYS.includes(key)) {
      errors.push(`${key} ist fuer UI-Element-Speicherung nicht erlaubt`);
      continue;
    }
    if (!UI_EDITOR_ELEMENT_SAVE_ALLOWED_TOP_LEVEL_KEYS.includes(key)) {
      errors.push(`Unbekanntes Payload-Feld: ${key}`);
    }
  }

  const projectId = normalizeUiEditorElementSaveText(payload.projectId);
  const surfaceId = normalizeUiEditorElementSaveText(payload.surfaceId);
  const elementId = normalizeUiEditorElementSaveText(payload.elementId);
  const elementType = normalizeUiEditorElementSaveText(payload.elementType);
  const targetAppId = normalizeUiEditorElementSaveText(payload.targetAppId || "bbm");
  const moduleId = normalizeUiEditorElementSaveText(payload.moduleId || "restarbeiten");
  const updatedAt = normalizeUiEditorElementSaveText(payload.updatedAt);

  if (!projectId) errors.push("projectId fehlt");
  if (!surfaceId) {
    errors.push("surfaceId fehlt");
  } else if (!isUiEditorElementSaveSurfaceAllowed(surfaceId)) {
    errors.push("Surface nicht erlaubt");
  }
  if (!elementId) errors.push("elementId fehlt");
  if (!elementType) {
    errors.push("elementType fehlt");
  } else if (!isUiEditorElementSaveElementTypeAllowed(elementType)) {
    errors.push("Elementtyp nicht erlaubt");
  }

  const changes = payload.changes;
  if (!isPlainUiEditorElementSaveObject(changes)) {
    errors.push("changes muss ein Objekt sein");
  } else {
    for (const key of Object.keys(changes)) {
      if (!UI_EDITOR_ELEMENT_SAVE_ALLOWED_CHANGE_KEYS.includes(key)) {
        errors.push(`Unbekannte Aenderung: ${key}`);
      }
      if (key === "noteText") {
        errors.push("noteText ist keine UI-Element-Aenderung");
      }
    }
    if (!Object.keys(changes).length) {
      errors.push("changes ist leer");
    }
    if (Object.prototype.hasOwnProperty.call(changes, "text") && !normalizeUiEditorElementSaveText(changes.text)) {
      errors.push("changes.text ist leer");
    }
    if (Object.prototype.hasOwnProperty.call(changes, "label") && !normalizeUiEditorElementSaveText(changes.label)) {
      errors.push("changes.label ist leer");
    }
    if (Object.prototype.hasOwnProperty.call(changes, "visible") && typeof changes.visible !== "boolean") {
      errors.push("changes.visible muss Boolean sein");
    }
    if (Object.prototype.hasOwnProperty.call(changes, "order") && !Number.isFinite(Number(changes.order))) {
      errors.push("changes.order muss eine Zahl sein");
    }
  }

  const normalizedChanges = isPlainUiEditorElementSaveObject(changes)
    ? normalizeUiEditorElementSaveChanges(changes)
    : {};
  const normalizedPayload = Object.freeze({
    targetAppId,
    moduleId,
    projectId,
    surfaceId,
    elementId,
    elementType,
    changes: Object.freeze(normalizedChanges),
    ...(updatedAt ? { updatedAt } : {}),
  });

  return Object.freeze({
    ok: errors.length === 0,
    reason: errors[0] || "Payload gueltig",
    errors: Object.freeze(errors),
    normalizedPayload: errors.length === 0 ? normalizedPayload : null,
  });
}

function buildReadonlyHintInfotextUiElementSavePayload({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  elementId = "restarbeiten.hinweisInfotext.text",
  elementType = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_HOST_KIND,
} = {}) {
  return Object.freeze({
    targetAppId: "bbm",
    moduleId: "restarbeiten",
    projectId: normalizeUiEditorElementSaveText(hostContextStatus?.projectId),
    surfaceId: READONLY_SURFACE_INFO_SURFACE_ID,
    elementId: normalizeUiEditorElementSaveText(elementId),
    elementType: normalizeUiEditorElementSaveText(elementType),
    changes: Object.freeze({
      text: String(value == null ? "" : value),
    }),
  });
}

async function executeUiEditorElementSaveContract({ payload = {}, win = null, testOnly = null } = {}) {
  const validation = validateUiEditorElementSavePayload(payload);
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      blocked: true,
      executed: false,
      reason: validation.reason,
      errors: validation.errors,
      persisted: false,
      previewOnly: true,
    });
  }

  const api = win?.bbmDb || null;
  const hasPreloadContract = typeof api?.uiEditorSaveElementOverride === "function";
  const explicitTestRelease =
    testOnly?.mode === "ui-element-save-contract-stub-test"
    && testOnly.allowExecute === true;
  const adapter = typeof testOnly?.adapter === "function"
    ? testOnly.adapter
    : explicitTestRelease && hasPreloadContract
      ? api.uiEditorSaveElementOverride
      : null;

  if (explicitTestRelease !== true || typeof adapter !== "function") {
    return Object.freeze({
      ok: false,
      blocked: true,
      executed: false,
      reason: UI_EDITOR_ELEMENT_SAVE_CONTRACT_NOT_IMPLEMENTED_REASON,
      contractAvailable: hasPreloadContract,
      validation,
      payload: validation.normalizedPayload,
      persisted: false,
      previewOnly: true,
    });
  }

  try {
    const result = await adapter(validation.normalizedPayload);
    return Object.freeze({
      ok: result?.ok !== false,
      blocked: false,
      executed: true,
      reason: result?.ok === false ? result?.error || "UI-Element-Speicherung fehlgeschlagen" : "UI-Element-Speicherung ausgefuehrt",
      contractAvailable: true,
      validation,
      payload: validation.normalizedPayload,
      result: result || null,
      persisted: result?.ok !== false,
      previewOnly: false,
    });
  } catch (err) {
    return Object.freeze({
      ok: false,
      blocked: false,
      executed: true,
      reason: err?.message || String(err),
      contractAvailable: true,
      validation,
      payload: validation.normalizedPayload,
      persisted: false,
      previewOnly: true,
    });
  }
}

function formatReadonlyHintInfotextElementSaveStatusText(
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  runtime = null
) {
  const buttonState = buildReadonlyHintInfotextSaveButtonState({ value, hostContextStatus, runtime });
  return [
    READONLY_HINT_INFOTEXT_ELEMENT_SAVE_TARGET_LINE,
    `Ausgewähltes UI-Element: ${READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_HOST_KIND}`,
    `Elementtext gültig: ${buttonState.hintTextValid ? "ja" : "nein"}`,
    `Elementänderungen speicherbar: ${buttonState.buttonEnabled ? "ja" : "nein"}`,
    `Änderungen speichern: ${buttonState.buttonEnabled ? "bereit" : "blockiert"}`,
    `Blockiergrund: ${buttonState.reason}`,
    `UI-Element-Speichervertrag vorhanden: ${buttonState.uiElementSaveContractAvailable ? "ja" : "nein"}`,
    READONLY_HINT_INFOTEXT_NOTE_SAVE_NOT_USED_LINE,
    "Schreibweg freigegeben: nein",
    "persisted: false",
    "previewOnly: true",
  ].join("\n");
}

function buildReadonlyHintInfotextSaveButtonState({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  runtime = null,
  testOnly = null,
} = {}) {
  const writeGate = buildReadonlyHintInfotextWriteGateViewModel({ value, hostContextStatus });
  const hintTextValid = isReadonlyHintInfotextDraftValid(value);
  const payloadComplete = writeGate.payloadComplete === true;
  const restarbeitIdPresent = Boolean(hostContextStatus && hostContextStatus.restarbeitId);
  const runtimeClickState = runtime && typeof runtime === "object" ? runtime.clickState : null;
  const uiElementSaveContractAvailable = false;
  const explicitRelease =
    testOnly
    && testOnly.mode === "save-button-gated-test-release"
    && testOnly.writeReleaseEnabled === true
    && testOnly.gateOpen === true;
  const adapterAvailable =
    explicitRelease === true && testOnly.adapterAvailable === true;
  const isSaving =
    (testOnly && testOnly.isSaving === true)
    || runtimeClickState?.saveState === "saving";
  const currentPayloadSignature = buildReadonlyHintInfotextSavePayloadSignature({ value, hostContextStatus });
  const lastSavedPayloadSignature = String(runtimeClickState?.lastSavedPayloadSignature || "").trim();
  const alreadySavedIdentical =
    (testOnly && testOnly.alreadySavedIdentical === true)
    || (
      Boolean(currentPayloadSignature)
      && Boolean(lastSavedPayloadSignature)
      && currentPayloadSignature === lastSavedPayloadSignature
    );
  const canEnable =
    explicitRelease === true
    && adapterAvailable === true
    && hostContextStatus.isPresent === true
    && restarbeitIdPresent === true
    && payloadComplete === true
    && hintTextValid === true
    && isSaving !== true
    && alreadySavedIdentical !== true;
  const blockReasons = [];
  if (hostContextStatus.isPresent !== true) {
    blockReasons.push("Host-Kontext fehlt");
  }
  if (restarbeitIdPresent !== true) {
    blockReasons.push("restarbeitId fehlt");
  }
  if (payloadComplete !== true) {
    blockReasons.push("Payload unvollständig");
  }
  if (hintTextValid !== true) {
    blockReasons.push("Hinweistext fehlt");
  }
  if (writeGate.gateOpen !== true && explicitRelease !== true) {
    blockReasons.push(READONLY_HINT_INFOTEXT_SAVE_HANDLER_BLOCKED_REASON);
  }
  if (uiElementSaveContractAvailable !== true && explicitRelease !== true) {
    blockReasons.push(READONLY_HINT_INFOTEXT_ELEMENT_SAVE_CONTRACT_REASON);
  }
  if (adapterAvailable !== true) {
    blockReasons.push("UI-Element-Save-Adapter nicht verfügbar");
  }
  if (isSaving === true) {
    blockReasons.push("Speicherung läuft");
  }
  if (alreadySavedIdentical === true) {
    blockReasons.push("identischer Save bereits abgeschlossen");
  }
  return Object.freeze({
    buttonPrepared: true,
    buttonEnabled: canEnable,
    reason: canEnable ? "alle Speicherbedingungen erfüllt" : blockReasons[0] || READONLY_HINT_INFOTEXT_SAVE_HANDLER_BLOCKED_REASON,
    blockReasons: Object.freeze(Array.from(new Set(blockReasons))),
    standardPath: "gated",
    requiresExplicitRelease: false,
    hostContextPresent: hostContextStatus.isPresent === true,
    restarbeitIdPresent,
    payloadComplete,
    hintTextValid,
    gateOpen: writeGate.gateOpen === true || (explicitRelease === true && testOnly.gateOpen === true),
    writeReleased: writeGate.writeReleased === true || (explicitRelease === true && testOnly.writeReleaseEnabled === true),
    uiElementSaveContractAvailable,
    adapterAvailable,
    isSaving: isSaving === true,
    alreadySavedIdentical: alreadySavedIdentical === true,
    persisted: false,
    previewOnly: true,
  });
}

function formatReadonlyHintInfotextSaveButtonStateText(
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  runtime = null
) {
  const buttonState = buildReadonlyHintInfotextSaveButtonState({ value, hostContextStatus, runtime });
  return [
    READONLY_HINT_INFOTEXT_SAVE_BUTTON_STATE_PREPARED_LINE,
    READONLY_HINT_INFOTEXT_SAVE_BUTTON_STATE_STANDARD_DISABLED_LINE,
    READONLY_HINT_INFOTEXT_ELEMENT_SAVE_TARGET_LINE,
    "Aktivierung nur mit UI-Element-Speichervertrag",
    `buttonEnabled: ${buttonState.buttonEnabled ? "true" : "false"}`,
    `Grund: ${buttonState.reason}`,
    `Payload vollständig: ${buttonState.payloadComplete ? "ja" : "nein"}`,
    `Hinweistext gültig: ${buttonState.hintTextValid ? "ja" : "nein"}`,
    `UI-Element-Speichervertrag vorhanden: ${buttonState.uiElementSaveContractAvailable ? "ja" : "nein"}`,
    `UI-Element-Save-Adapter verfügbar: ${buttonState.adapterAvailable ? "ja" : "nein"}`,
    READONLY_HINT_INFOTEXT_NOTE_SAVE_NOT_USED_LINE,
    `Speicherung läuft: ${buttonState.isSaving ? "ja" : "nein"}`,
    `identische Payload gespeichert: ${buttonState.alreadySavedIdentical ? "ja" : "nein"}`,
    "persisted: false",
    "previewOnly: true",
  ].join("\n");
}

function buildReadonlyHintInfotextSavePayloadSignature({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
} = {}) {
  const restarbeitId = String(hostContextStatus?.restarbeitId || "").trim();
  const noteText = String(value == null ? "" : value).trim();
  if (!restarbeitId || !noteText) return "";
  return `restarbeitId=${restarbeitId}\nnoteText=${noteText}`;
}

function getReadonlyHintInfotextSaveResultReference(result = null) {
  if (!result || typeof result !== "object") return "";
  const candidates = [
    result.note?.id,
    result.note?.noteId,
    result.note?.uuid,
    result.noteId,
    result.id,
    result.reference,
    result.resultId,
  ];
  return String(candidates.find((candidate) => String(candidate || "").trim()) || "").trim();
}

function buildReadonlyHintInfotextSaveGuardState({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  saveState = "",
  lastSavedPayloadSignature = "",
  runtime = null,
  testOnly = null,
} = {}) {
  const buttonState = buildReadonlyHintInfotextSaveButtonState({ value, hostContextStatus, runtime, testOnly });
  const explicitGuardRelease =
    testOnly
    && testOnly.mode === "save-guard-isolated-test"
    && testOnly.writeReleaseEnabled === true
    && testOnly.gateOpen === true
    && typeof testOnly.adapter === "function";
  const productiveGuardRelease =
    buttonState.gateOpen === true
    && buttonState.writeReleased === true
    && buttonState.adapterAvailable === true;
  const currentPayloadSignature = buildReadonlyHintInfotextSavePayloadSignature({ value, hostContextStatus });
  const normalizedLastSavedPayloadSignature = String(lastSavedPayloadSignature || "").trim();
  const saving = saveState === "saving" || testOnly?.saveState === "saving";
  const success = saveState === "success" || testOnly?.saveState === "success";
  const error = saveState === "error" || testOnly?.saveState === "error";
  const duplicateBlocked =
    Boolean(currentPayloadSignature)
    && Boolean(normalizedLastSavedPayloadSignature)
    && currentPayloadSignature === normalizedLastSavedPayloadSignature;
  const inFlightBlocked = saving === true;
  const canStartSave =
    (explicitGuardRelease === true || productiveGuardRelease === true)
    && buttonState.payloadComplete === true
    && buttonState.hintTextValid === true
    && buttonState.hostContextPresent === true
    && buttonState.restarbeitIdPresent === true
    && inFlightBlocked !== true
    && duplicateBlocked !== true;
  const resolvedSaveState = canStartSave
    ? "idle"
    : inFlightBlocked
      ? "saving"
      : error
        ? "error"
        : success && duplicateBlocked
          ? "success"
          : "blocked";
  const blockReasons = [];
  if (explicitGuardRelease !== true && productiveGuardRelease !== true) {
    blockReasons.push(READONLY_HINT_INFOTEXT_SAVE_HANDLER_BLOCKED_REASON);
  }
  if (buttonState.payloadComplete !== true) blockReasons.push("Payload unvollständig");
  if (buttonState.hintTextValid !== true) blockReasons.push("Hinweistext fehlt");
  if (buttonState.hostContextPresent !== true) blockReasons.push("Host-Kontext fehlt");
  if (buttonState.restarbeitIdPresent !== true) blockReasons.push("restarbeitId fehlt");
  if (inFlightBlocked === true) blockReasons.push("Speicherung läuft bereits");
  if (duplicateBlocked === true) blockReasons.push("identische Payload bereits gespeichert");
  return Object.freeze({
    guardPrepared: true,
    saveState: resolvedSaveState,
    canStartSave,
    duplicateBlocked,
    inFlightBlocked,
    lastSavedPayloadSignature: normalizedLastSavedPayloadSignature,
    currentPayloadSignature,
    standardPath: "blocked",
    doubleClickProtection: true,
    duplicateProtection: true,
    gateOpen: explicitGuardRelease === true || productiveGuardRelease === true,
    writeReleased: explicitGuardRelease === true || productiveGuardRelease === true,
    persisted: false,
    previewOnly: true,
    reason: canStartSave ? "alle Speicherbedingungen erfüllt" : blockReasons[0] || READONLY_HINT_INFOTEXT_SAVE_HANDLER_BLOCKED_REASON,
    blockReasons: Object.freeze(Array.from(new Set(blockReasons))),
  });
}

async function executeReadonlyHintInfotextGuardedSave({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  guardState = null,
  testOnly = null,
} = {}) {
  const mutableGuardState = guardState && typeof guardState === "object" ? guardState : {};
  const baseGuard = buildReadonlyHintInfotextSaveGuardState({
    value,
    hostContextStatus,
    saveState: mutableGuardState.saveState || "",
    lastSavedPayloadSignature: mutableGuardState.lastSavedPayloadSignature || "",
    testOnly,
  });
  if (baseGuard.canStartSave !== true) {
    return Object.freeze({
      ok: false,
      blocked: true,
      reason: baseGuard.reason,
      blockReasons: baseGuard.blockReasons,
      saveState: baseGuard.saveState,
      canStartSave: false,
      duplicateBlocked: baseGuard.duplicateBlocked,
      inFlightBlocked: baseGuard.inFlightBlocked,
      currentPayloadSignature: baseGuard.currentPayloadSignature,
      lastSavedPayloadSignature: baseGuard.lastSavedPayloadSignature,
      executed: false,
      persisted: false,
      previewOnly: true,
    });
  }

  mutableGuardState.saveState = "saving";
  const payload = Object.freeze({
    restarbeitId: hostContextStatus.restarbeitId,
    noteText: String(value == null ? "" : value),
    projectId: hostContextStatus.projectId,
    previewOnly: true,
    persisted: false,
  });
  try {
    const adapterResult = await testOnly.adapter(payload);
    if (adapterResult && adapterResult.ok === true) {
      mutableGuardState.saveState = "success";
      mutableGuardState.lastSavedPayloadSignature = baseGuard.currentPayloadSignature;
      return Object.freeze({
        ok: true,
        blocked: false,
        reason: "isolierter Guard-Testpfad ausgeführt",
        blockReasons: Object.freeze([]),
        payload,
        adapterResult,
        saveState: "success",
        canStartSave: false,
        duplicateBlocked: false,
        inFlightBlocked: false,
        currentPayloadSignature: baseGuard.currentPayloadSignature,
        lastSavedPayloadSignature: mutableGuardState.lastSavedPayloadSignature,
        executed: true,
        persisted: true,
        previewOnly: false,
      });
    }
    mutableGuardState.saveState = "error";
    return Object.freeze({
      ok: false,
      blocked: false,
      reason: adapterResult?.reason || adapterResult?.error || "isolierter Guard-Testpfad fehlgeschlagen",
      blockReasons: Object.freeze([]),
      payload,
      adapterResult: adapterResult || null,
      saveState: "error",
      canStartSave: false,
      duplicateBlocked: false,
      inFlightBlocked: false,
      currentPayloadSignature: baseGuard.currentPayloadSignature,
      lastSavedPayloadSignature: String(mutableGuardState.lastSavedPayloadSignature || "").trim(),
      executed: true,
      persisted: false,
      previewOnly: true,
    });
  } catch (error) {
    mutableGuardState.saveState = "error";
    return Object.freeze({
      ok: false,
      blocked: false,
      reason: error?.message || "isolierter Guard-Testpfad fehlgeschlagen",
      blockReasons: Object.freeze([]),
      payload,
      saveState: "error",
      canStartSave: false,
      duplicateBlocked: false,
      inFlightBlocked: false,
      currentPayloadSignature: baseGuard.currentPayloadSignature,
      lastSavedPayloadSignature: String(mutableGuardState.lastSavedPayloadSignature || "").trim(),
      executed: true,
      persisted: false,
      previewOnly: true,
    });
  }
}

function formatReadonlyHintInfotextSaveGuardStateText(
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  runtime = null
) {
  const guardState = buildReadonlyHintInfotextSaveGuardState({ value, hostContextStatus, runtime });
  return [
    READONLY_HINT_INFOTEXT_SAVE_GUARD_PREPARED_LINE,
    `Save-Status: ${guardState.saveState}`,
    READONLY_HINT_INFOTEXT_SAVE_GUARD_DOUBLE_CLICK_LINE,
    READONLY_HINT_INFOTEXT_SAVE_GUARD_DUPLICATE_LINE,
    READONLY_HINT_INFOTEXT_SAVE_GUARD_STANDARD_BLOCKED_LINE,
    `canStartSave: ${guardState.canStartSave ? "true" : "false"}`,
    `duplicateBlocked: ${guardState.duplicateBlocked ? "true" : "false"}`,
    `inFlightBlocked: ${guardState.inFlightBlocked ? "true" : "false"}`,
    `currentPayloadSignature: ${guardState.currentPayloadSignature || "nicht vollständig"}`,
    `lastSavedPayloadSignature: ${guardState.lastSavedPayloadSignature || "nicht gesetzt"}`,
    "persisted: false",
    "previewOnly: true",
  ].join("\n");
}

function createReadonlyHintInfotextSaveClickButtonTestRelease(testOnly = null, clickState = {}) {
  const explicitClickRelease =
    testOnly
    && testOnly.mode === "save-click-gated-test-release"
    && testOnly.writeReleaseEnabled === true
    && testOnly.gateOpen === true
    && testOnly.useProductiveAdapter === true;
  if (!explicitClickRelease) return null;
  return {
    mode: "save-button-gated-test-release",
    writeReleaseEnabled: true,
    gateOpen: true,
    adapterAvailable: true,
    isSaving: clickState?.saveState === "saving",
    alreadySavedIdentical: clickState?.alreadySavedIdentical === true,
  };
}

function buildReadonlyHintInfotextSaveClickState({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  clickState = null,
  runtime = null,
  testOnly = null,
} = {}) {
  const normalizedClickState = clickState && typeof clickState === "object" ? clickState : {};
  const buttonTestRelease = createReadonlyHintInfotextSaveClickButtonTestRelease(testOnly, normalizedClickState);
  const runtimeWithClickState = {
    ...(runtime && typeof runtime === "object" ? runtime : {}),
    clickState: normalizedClickState,
  };
  const buttonState = buildReadonlyHintInfotextSaveButtonState({
    value,
    hostContextStatus,
    runtime: runtimeWithClickState,
    testOnly: buttonTestRelease,
  });
  const clickReleaseActive =
    buttonTestRelease !== null
    || (
      buttonState.gateOpen === true
      && buttonState.writeReleased === true
      && buttonState.adapterAvailable === true
    );
  const guardState = buildReadonlyHintInfotextSaveGuardState({
    value,
    hostContextStatus,
    saveState: normalizedClickState.saveState || "",
    lastSavedPayloadSignature: normalizedClickState.lastSavedPayloadSignature || "",
    runtime: runtimeWithClickState,
    testOnly:
      buttonTestRelease
        ? {
            mode: "save-guard-isolated-test",
            writeReleaseEnabled: true,
            gateOpen: true,
            adapter() {
              return { ok: true };
            },
          }
        : null,
  });
  const clickBlocked =
    clickReleaseActive !== true
    || buttonState.buttonEnabled !== true
    || guardState.canStartSave !== true;
  const blockReasons = [];
  if (clickReleaseActive !== true) blockReasons.push(READONLY_HINT_INFOTEXT_SAVE_HANDLER_BLOCKED_REASON);
  if (buttonState.buttonEnabled !== true) blockReasons.push(...buttonState.blockReasons);
  if (guardState.canStartSave !== true) blockReasons.push(...guardState.blockReasons);
  const lastClickStatus = normalizedClickState.lastClickStatus || "not-executed";
  const lastSavePersisted =
    lastClickStatus === "success"
    && Boolean(guardState.currentPayloadSignature)
    && guardState.currentPayloadSignature === guardState.lastSavedPayloadSignature;
  const lastSavedRestarbeitId = String(normalizedClickState.lastSavedRestarbeitId || "").trim();
  const lastSavedNoteText = String(normalizedClickState.lastSavedNoteText || "");
  const lastSaveResultReference = String(normalizedClickState.lastSaveResultReference || "").trim();
  const lastSaveStatusMarker = String(normalizedClickState.lastSaveStatusMarker || "").trim();
  const lastSaveError = String(normalizedClickState.lastSaveError || "").trim();
  return Object.freeze({
    clickPrepared: true,
    clickPathBlocked: clickBlocked,
    lastClickStatus,
    lastMessage: normalizedClickState.lastSaveResultReason || "",
    lastSavedRestarbeitId,
    lastSavedNoteText,
    lastSaveResultReference,
    lastSaveStatusMarker,
    lastSaveError,
    buttonEnabled: buttonState.buttonEnabled === true,
    gateOpen: buttonState.gateOpen === true,
    payloadComplete: buttonState.payloadComplete === true,
    hintTextValid: buttonState.hintTextValid === true,
    canStartSave: guardState.canStartSave === true,
    duplicateBlocked: guardState.duplicateBlocked === true,
    inFlightBlocked: guardState.inFlightBlocked === true,
    currentPayloadSignature: guardState.currentPayloadSignature,
    lastSavedPayloadSignature: guardState.lastSavedPayloadSignature,
    standardPath: "gated",
    persisted: lastSavePersisted,
    previewOnly: lastSavePersisted !== true,
    reason: clickBlocked ? blockReasons[0] || READONLY_HINT_INFOTEXT_SAVE_HANDLER_BLOCKED_REASON : "alle Speicherbedingungen erfüllt",
    blockReasons: Object.freeze(Array.from(new Set(blockReasons))),
  });
}

async function executeReadonlyHintInfotextSaveClick({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  clickState = null,
  runtime = null,
  testOnly = null,
} = {}) {
  const mutableClickState = clickState && typeof clickState === "object" ? clickState : {};
  const runtimeWithClickState = {
    ...(runtime && typeof runtime === "object" ? runtime : {}),
    clickState: mutableClickState,
  };
  const clickModel = buildReadonlyHintInfotextSaveClickState({
    value,
    hostContextStatus,
    clickState: mutableClickState,
    runtime: runtimeWithClickState,
    testOnly,
  });
  if (clickModel.clickPathBlocked === true) {
    mutableClickState.lastClickStatus = "blocked";
    mutableClickState.lastSaveResultReason = clickModel.reason;
    mutableClickState.lastSaveStatusMarker = "blocked";
    return Object.freeze({
      ok: false,
      blocked: true,
      reason: clickModel.reason,
      blockReasons: clickModel.blockReasons,
      clickPrepared: true,
      clickPathBlocked: true,
      lastClickStatus: "blocked",
      buttonEnabled: clickModel.buttonEnabled,
      gateOpen: clickModel.gateOpen,
      payloadComplete: clickModel.payloadComplete,
      hintTextValid: clickModel.hintTextValid,
      canStartSave: false,
      duplicateBlocked: clickModel.duplicateBlocked,
      inFlightBlocked: clickModel.inFlightBlocked,
      executed: false,
      persisted: false,
      previewOnly: true,
      lastSaveStatusMarker: "blocked",
    });
  }

  mutableClickState.saveState = "saving";
  mutableClickState.lastClickStatus = "saving";
  mutableClickState.lastSaveStatusMarker = "saving";
  mutableClickState.lastSaveError = "";
  const payload = Object.freeze({
    restarbeitId: hostContextStatus.restarbeitId,
    noteText: String(value == null ? "" : value).trim(),
  });
  const currentPayloadSignature = buildReadonlyHintInfotextSavePayloadSignature({ value, hostContextStatus });
  const adapterResult = await executeReadonlyHintInfotextProductiveSaveAdapter({
    payload,
    win: testOnly?.win || runtimeWithClickState.win || null,
  });
  if (adapterResult.ok === true) {
    mutableClickState.saveState = "success";
    mutableClickState.lastClickStatus = "success";
    mutableClickState.lastSaveResultReason = adapterResult.reason;
    mutableClickState.lastSavedPayloadSignature = currentPayloadSignature;
    mutableClickState.lastSavedRestarbeitId = payload.restarbeitId;
    mutableClickState.lastSavedNoteText = payload.noteText;
    mutableClickState.lastSaveResultReference = getReadonlyHintInfotextSaveResultReference(adapterResult.result || adapterResult.note || null);
    mutableClickState.lastSaveStatusMarker = "success";
    return Object.freeze({
      ok: true,
      blocked: false,
      reason: adapterResult.reason,
      blockReasons: Object.freeze([]),
      clickPrepared: true,
      clickPathBlocked: false,
      lastClickStatus: "success",
      payload,
      adapterResult,
      buttonEnabled: true,
      gateOpen: true,
      payloadComplete: true,
      hintTextValid: true,
      canStartSave: false,
      duplicateBlocked: false,
      inFlightBlocked: false,
      executed: adapterResult.executed === true,
      persisted: adapterResult.persisted === true,
      previewOnly: adapterResult.previewOnly === true,
      savedRestarbeitId: payload.restarbeitId,
      savedNoteText: payload.noteText,
      resultReference: mutableClickState.lastSaveResultReference,
      lastSaveStatusMarker: "success",
    });
  }
  mutableClickState.saveState = "error";
  mutableClickState.lastClickStatus = "error";
  mutableClickState.lastSaveResultReason = adapterResult.reason;
  mutableClickState.lastSaveError = adapterResult.reason;
  mutableClickState.lastSaveStatusMarker = "error";
  return Object.freeze({
    ok: false,
    blocked: adapterResult.blocked === true,
    reason: adapterResult.reason,
    blockReasons: Object.freeze([]),
    clickPrepared: true,
    clickPathBlocked: false,
    lastClickStatus: "error",
    payload,
    adapterResult,
    buttonEnabled: true,
    gateOpen: true,
    payloadComplete: true,
    hintTextValid: true,
    canStartSave: false,
    duplicateBlocked: false,
    inFlightBlocked: false,
    executed: adapterResult.executed === true,
    persisted: false,
    previewOnly: true,
    errorMessage: adapterResult.reason,
    lastSaveStatusMarker: "error",
  });
}

function formatReadonlyHintInfotextSaveClickStateText(
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  clickState = null,
  runtime = null
) {
  const clickModel = buildReadonlyHintInfotextSaveClickState({ value, hostContextStatus, clickState, runtime });
  const lastClickStatusLabel = {
    "not-executed": "nicht ausgeführt",
    blocked: "blockiert",
    saving: "laeuft",
    success: "erfolgreich",
    error: "Fehler",
  }[clickModel.lastClickStatus] || "nicht ausgeführt";
  return [
    READONLY_HINT_INFOTEXT_SAVE_CLICK_PREPARED_LINE,
    READONLY_HINT_INFOTEXT_SAVE_CLICK_STANDARD_BLOCKED_LINE,
    `Letzter Klickstatus: ${lastClickStatusLabel}`,
    `Klickpfad blockiert: ${clickModel.clickPathBlocked ? "ja" : "nein"}`,
    `buttonEnabled: ${clickModel.buttonEnabled ? "true" : "false"}`,
    `canStartSave: ${clickModel.canStartSave ? "true" : "false"}`,
    `Gate offen: ${clickModel.gateOpen ? "ja" : "nein"}`,
    `Payload vollständig: ${clickModel.payloadComplete ? "ja" : "nein"}`,
    `Hinweistext gültig: ${clickModel.hintTextValid ? "ja" : "nein"}`,
    `Grund: ${clickModel.reason}`,
    `Letzte Meldung: ${clickModel.lastMessage || "nicht vorhanden"}`,
    `Letzter Save-Statusmarker: ${clickModel.lastSaveStatusMarker || clickModel.lastClickStatus}`,
    `Gespeicherte restarbeitId: ${clickModel.lastSavedRestarbeitId || "nicht vorhanden"}`,
    `Gespeicherter noteText: ${clickModel.lastSavedNoteText || "nicht vorhanden"}`,
    `Ergebnisreferenz: ${clickModel.lastSaveResultReference || "nicht vorhanden"}`,
    `Fehlerhinweis: ${clickModel.lastSaveError || "nicht vorhanden"}`,
    `persisted: ${clickModel.persisted ? "true" : "false"}`,
    `previewOnly: ${clickModel.previewOnly ? "true" : "false"}`,
  ].join("\n");
}

function getReadonlyHintInfotextSaveAdapterDescriptor() {
  return Object.freeze({
    adapterPrepared: true,
    targetAdapter: READONLY_HINT_INFOTEXT_SAVE_ADAPTER_TARGET_ADAPTER,
    targetMethod: READONLY_HINT_INFOTEXT_SAVE_ADAPTER_TARGET_METHOD,
    targetChannel: READONLY_HINT_INFOTEXT_SAVE_ADAPTER_TARGET_CHANNEL,
    executionBlocked: true,
    blockReason: READONLY_HINT_INFOTEXT_ELEMENT_SAVE_CONTRACT_REASON,
    persisted: false,
    previewOnly: true,
  });
}

function executeReadonlyHintInfotextBlockedSaveHandler({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
} = {}) {
  const writeGate = buildReadonlyHintInfotextWriteGateViewModel({ value, hostContextStatus });
  const saveAdapter = getReadonlyHintInfotextSaveAdapterDescriptor();
  return Object.freeze({
    ok: false,
    blocked: true,
    reason: READONLY_HINT_INFOTEXT_ELEMENT_SAVE_CONTRACT_REASON,
    payloadComplete: writeGate.payloadComplete,
    saveAdapterPrepared: saveAdapter.adapterPrepared,
    saveAdapterExecutionBlocked: true,
    gateOpen: writeGate.gateOpen === true,
    persisted: false,
    previewOnly: true,
  });
}

function formatReadonlyHintInfotextSaveHandlerText(
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel()
) {
  const handlerResult = executeReadonlyHintInfotextBlockedSaveHandler({ value, hostContextStatus });
  return [
    READONLY_HINT_INFOTEXT_SAVE_HANDLER_PREPARED_LINE,
    "Handler-Status: blockiert",
    `Blockiergrund: ${handlerResult.reason}`,
    "Letztes Speicherergebnis: nicht ausgeführt",
    `Payload vollständig: ${handlerResult.payloadComplete ? "ja" : "nein"}`,
    `blocked: ${handlerResult.blocked ? "true" : "false"}`,
    "persisted: false",
    "previewOnly: true",
  ].join("\n");
}

function formatReadonlyHintInfotextSaveAdapterText() {
  const saveAdapter = getReadonlyHintInfotextSaveAdapterDescriptor();
  return [
    READONLY_HINT_INFOTEXT_SAVE_ADAPTER_PREPARED_LINE,
    READONLY_HINT_INFOTEXT_PRODUCTIVE_SAVE_ADAPTER_PREPARED_LINE,
    `Zieladapter: ${saveAdapter.targetAdapter}`,
    `Zielmethode: ${saveAdapter.targetMethod}`,
    `Zielkanal: ${saveAdapter.targetChannel}`,
    `Ausführung: ${saveAdapter.executionBlocked ? "blockiert" : "freigegeben"}`,
    READONLY_HINT_INFOTEXT_PRODUCTIVE_SAVE_ADAPTER_STANDARD_BLOCKED_LINE,
    "Produktiv-Payload: restarbeitId, noteText (nicht UI-Element-Speichern)",
    `Grund: ${saveAdapter.blockReason}`,
    READONLY_HINT_INFOTEXT_NOTE_SAVE_NOT_USED_LINE,
    "persisted: false",
    "previewOnly: true",
  ].join("\n");
}

async function executeReadonlyHintInfotextProductiveSaveAdapter({ payload = null, win = null } = {}) {
  const restarbeitId = String(payload && payload.restarbeitId != null ? payload.restarbeitId : "").trim();
  const noteText = String(payload && payload.noteText != null ? payload.noteText : "").trim();
  if (restarbeitId.length === 0) {
    return Object.freeze({
      ok: false,
      blocked: true,
      reason: "restarbeitId fehlt",
      executed: false,
      persisted: false,
      previewOnly: true,
    });
  }
  if (noteText.length === 0) {
    return Object.freeze({
      ok: false,
      blocked: true,
      reason: "Hinweistext fehlt",
      executed: false,
      persisted: false,
      previewOnly: true,
    });
  }
  const createNote = win && win.bbmDb ? win.bbmDb.restarbeitenCreateNote : null;
  if (typeof createNote !== "function") {
    return Object.freeze({
      ok: false,
      blocked: true,
      reason: "window.bbmDb.restarbeitenCreateNote nicht verfügbar",
      executed: false,
      persisted: false,
      previewOnly: true,
    });
  }
  const savePayload = Object.freeze({ restarbeitId, noteText });
  try {
    const response = await createNote(savePayload);
    if (response && response.ok === true) {
      return Object.freeze({
        ok: true,
        blocked: false,
        reason: "Restarbeiten-Notiz gespeichert",
        payload: savePayload,
        result: response,
        note: response.note || null,
        executed: true,
        persisted: true,
        previewOnly: false,
      });
    }
    return Object.freeze({
      ok: false,
      blocked: false,
      reason:
        response && typeof response.error === "string" && response.error.length > 0
          ? response.error
          : "Restarbeiten-Notiz konnte nicht gespeichert werden",
      payload: savePayload,
      result: response || null,
      executed: true,
      persisted: false,
      previewOnly: true,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      blocked: false,
      reason:
        error && typeof error.message === "string" && error.message.length > 0
          ? error.message
          : "Restarbeiten-Notiz konnte nicht gespeichert werden",
      payload: savePayload,
      executed: true,
      persisted: false,
      previewOnly: true,
    });
  }
}

function executeReadonlyHintInfotextSave({
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel(),
  testOnly = null,
} = {}) {
  const writeGate = buildReadonlyHintInfotextWriteGateViewModel({ value, hostContextStatus });
  const saveAdapter = getReadonlyHintInfotextSaveAdapterDescriptor();
  const hintTextValid = isReadonlyHintInfotextDraftValid(value);
  const payloadComplete = writeGate.payloadComplete === true;
  const isolatedTestPath =
    testOnly
    && testOnly.mode === "isolated-fake-adapter-positive-test"
    && testOnly.writeReleaseEnabled === true
    && testOnly.gateOpen === true
    && typeof testOnly.adapter === "function";
  if (isolatedTestPath && payloadComplete && hintTextValid) {
    const payload = Object.freeze({
      restarbeitId: hostContextStatus.restarbeitId,
      noteText: String(value == null ? "" : value),
      projectId: hostContextStatus.projectId,
      previewOnly: true,
      persisted: false,
    });
    const adapterResult = testOnly.adapter(payload);
    return Object.freeze({
      ok: true,
      blocked: false,
      reason: "isolierter Fake-Adapter-Testpfad ausgeführt",
      blockReasons: Object.freeze([]),
      payload,
      adapterResult,
      payloadComplete: true,
      hintTextValid: true,
      adapterPrepared: true,
      adapterExecutionBlocked: false,
      gateOpen: true,
      writeReleased: true,
      executed: true,
      persisted: false,
      previewOnly: true,
    });
  }
  const productiveAdapterTestPath =
    testOnly
    && testOnly.mode === "productive-save-adapter-gated-test"
    && testOnly.writeReleaseEnabled === true
    && testOnly.gateOpen === true
    && testOnly.useProductiveAdapter === true;
  if (productiveAdapterTestPath && payloadComplete && hintTextValid) {
    const payload = Object.freeze({
      restarbeitId: hostContextStatus.restarbeitId,
      noteText: String(value == null ? "" : value).trim(),
    });
    return executeReadonlyHintInfotextProductiveSaveAdapter({
      payload,
      win: testOnly.win || null,
    }).then((adapterResult) =>
      Object.freeze({
        ok: adapterResult.ok === true,
        blocked: adapterResult.blocked === true,
        reason: adapterResult.reason,
        blockReasons: Object.freeze([]),
        payload,
        adapterResult,
        payloadComplete: true,
        hintTextValid: true,
        adapterPrepared: true,
        adapterExecutionBlocked: false,
        gateOpen: true,
        writeReleased: true,
        executed: adapterResult.executed === true,
        persisted: adapterResult.persisted === true,
        previewOnly: adapterResult.previewOnly === true,
      })
    );
  }
  const blockReasons = [];
  blockReasons.push(READONLY_HINT_INFOTEXT_ELEMENT_SAVE_CONTRACT_REASON);
  if (writeGate.gateOpen !== true) {
    blockReasons.push(READONLY_HINT_INFOTEXT_SAVE_HANDLER_BLOCKED_REASON);
  }
  if (payloadComplete !== true) {
    blockReasons.push("Payload unvollständig");
  }
  if (hintTextValid !== true) {
    blockReasons.push("Hinweistext fehlt");
  }
  if (writeGate.writeReleased !== true) {
    blockReasons.push("Schreibfreigabe fehlt");
  }
  return Object.freeze({
    ok: false,
    blocked: true,
    reason: READONLY_HINT_INFOTEXT_ELEMENT_SAVE_CONTRACT_REASON,
    blockReasons: Object.freeze(Array.from(new Set(blockReasons))),
    payloadComplete,
    hintTextValid,
    adapterPrepared: saveAdapter.adapterPrepared === true,
    adapterExecutionBlocked: saveAdapter.executionBlocked === true,
    gateOpen: writeGate.gateOpen === true,
    writeReleased: writeGate.writeReleased === true,
    executed: false,
    persisted: false,
    previewOnly: true,
  });
}

function formatReadonlyHintInfotextSaveExecutionText(
  value = "",
  hostContextStatus = createReadonlyHintInfotextHostContextStatusModel()
) {
  const saveExecution = executeReadonlyHintInfotextSave({ value, hostContextStatus });
  return [
    READONLY_HINT_INFOTEXT_SAVE_EXECUTION_PREPARED_LINE,
    "Ausführung im Standardzustand: blockiert",
    READONLY_HINT_INFOTEXT_SAVE_EXECUTION_NOT_EXECUTED_LINE,
    `Blockiergrund: ${saveExecution.reason}`,
    `Payload vollständig: ${saveExecution.payloadComplete ? "ja" : "nein"}`,
    `Hinweistext gültig: ${saveExecution.hintTextValid ? "ja" : "nein"}`,
    `Adapter vorbereitet: ${saveExecution.adapterPrepared ? "ja" : "nein"}`,
    "persisted: false",
    "previewOnly: true",
  ].join("\n");
}

function updateReadonlyHintInfotextStoragePreviews(state = {}, value = "") {
  const hostContextStatus = getReadonlyHintInfotextHostContextStatus(state);
  const runtime = {
    win: state.win || null,
    clickState: state.hintInfotextSaveClickState || null,
  };
  if (state.hintInfotextStorageCheckPreview) {
    state.hintInfotextStorageCheckPreview.textContent = formatReadonlyHintInfotextStorageFreigabecheckText(
      value,
      hostContextStatus
    );
  }
  if (state.hintInfotextElementSaveStatusPreview) {
    state.hintInfotextElementSaveStatusPreview.textContent = formatReadonlyHintInfotextElementSaveStatusText(
      value,
      hostContextStatus,
      runtime
    );
  }
  if (state.hintInfotextCreateNotePayloadPreview) {
    state.hintInfotextCreateNotePayloadPreview.textContent = formatReadonlyHintInfotextCreateNotePayloadPreviewText(
      value,
      hostContextStatus
    );
  }
  if (state.hintInfotextWriteGatePreview) {
    state.hintInfotextWriteGatePreview.textContent = formatReadonlyHintInfotextWriteGateText(
      value,
      hostContextStatus
    );
  }
  if (state.hintInfotextSaveHandlerPreview) {
    state.hintInfotextSaveHandlerPreview.textContent = formatReadonlyHintInfotextSaveHandlerText(
      value,
      hostContextStatus
    );
  }
  if (state.hintInfotextSaveAdapterPreview) {
    state.hintInfotextSaveAdapterPreview.textContent = formatReadonlyHintInfotextSaveAdapterText();
  }
  if (state.hintInfotextSaveExecutionPreview) {
    state.hintInfotextSaveExecutionPreview.textContent = formatReadonlyHintInfotextSaveExecutionText(
      value,
      hostContextStatus
    );
  }
  if (state.hintInfotextSaveButtonStatePreview) {
    state.hintInfotextSaveButtonStatePreview.textContent = formatReadonlyHintInfotextSaveButtonStateText(
      value,
      hostContextStatus,
      runtime
    );
  }
  if (state.hintInfotextSaveGuardStatePreview) {
    state.hintInfotextSaveGuardStatePreview.textContent = formatReadonlyHintInfotextSaveGuardStateText(
      value,
      hostContextStatus,
      runtime
    );
  }
  if (state.hintInfotextSaveClickStatePreview) {
    state.hintInfotextSaveClickStatePreview.textContent = formatReadonlyHintInfotextSaveClickStateText(
      value,
      hostContextStatus,
      state.hintInfotextSaveClickState || null,
      runtime
    );
  }
  if (state.hintInfotextSaveButtonElement) {
    const buttonState = buildReadonlyHintInfotextSaveButtonState({
      value,
      hostContextStatus,
      runtime,
    });
    const enabled = buttonState.buttonEnabled === true;
    state.hintInfotextSaveButtonElement.disabled = !enabled;
    state.hintInfotextSaveButtonElement.setAttribute("aria-disabled", enabled ? "false" : "true");
    state.hintInfotextSaveButtonElement.title = enabled ? "UI-Elementänderungen speichern" : buttonState.reason;
    state.hintInfotextSaveButtonElement.style.background = enabled ? "#ffffff" : "#e2e8f0";
    state.hintInfotextSaveButtonElement.style.color = enabled ? "#1f2937" : "#64748b";
    state.hintInfotextSaveButtonElement.style.cursor = enabled ? "pointer" : "not-allowed";
  }
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

  const status = doc.createElement("div");
  status.className = "ui-editor-preview-surface-selection-status";
  status.setAttribute("data-ui-editor-surface-selection-status", "true");
  status.setAttribute("data-ui-editor-surface-id", selectedSurface.surfaceId || "");
  status.setAttribute("data-ui-editor-surface-readonly", "true");
  status.style.marginTop = "4px";
  status.style.padding = "6px 8px";
  status.style.border = "1px solid #dbe4ee";
  status.style.borderRadius = "6px";
  status.style.background = "#f8fafc";
  status.style.color = "#334155";
  status.style.fontSize = "11px";
  status.style.lineHeight = "1.3";
  status.textContent = READONLY_SURFACE_SELECTION_STATUS_TEXT;
  panel.appendChild(status);
  return selection;
}

function appendReadonlySurfaceElementCatalogOverview(doc, panel) {
  if (!doc?.createElement || !panel?.appendChild) return null;

  const catalog = doc.createElement("div");
  catalog.className = "ui-editor-preview-surface-element-catalog";
  catalog.setAttribute("data-ui-editor-surface-element-catalog", "true");
  catalog.setAttribute("data-ui-editor-surface-element-catalog-readonly", "true");
  catalog.style.marginTop = "8px";
  catalog.style.padding = "8px";
  catalog.style.border = "1px solid #cbd5e1";
  catalog.style.borderRadius = "6px";
  catalog.style.background = "#ffffff";
  catalog.style.fontSize = "11px";
  catalog.style.lineHeight = "1.35";

  const title = doc.createElement("div");
  title.className = "ui-editor-preview-surface-element-catalog__title";
  title.textContent = READONLY_SURFACE_ELEMENT_CATALOG_TITLE;
  title.style.fontWeight = "700";
  title.style.marginBottom = "4px";

  const lines = doc.createElement("div");
  lines.className = "ui-editor-preview-surface-element-catalog__lines";
  lines.textContent = READONLY_SURFACE_ELEMENT_CATALOG_LINES.map((line) => `- ${line}`).join("\n");

  catalog.append(title, lines);
  panel.appendChild(catalog);
  return catalog;
}

function getReadonlyHintInfotextDraftText(state = {}) {
  return state?.hintInfotextDraftText == null
    ? READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_DEFAULT_TEXT
    : String(state.hintInfotextDraftText);
}

function formatReadonlyHintInfotextHostPreviewText(value = "") {
  return [
    READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_HOST_KIND,
    String(value == null ? "" : value),
    READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_HOST_STATUS,
  ].filter(Boolean).join("\n");
}

function formatReadonlyHintInfotextElementModelPreviewText(value = "") {
  return [
    READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_ELEMENTMODEL_TYPE,
    READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_ELEMENTMODEL_SURFACE,
    READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_ELEMENTMODEL_STATUS,
    String(value == null ? "" : value),
  ].filter(Boolean).join("\n");
}

function formatReadonlyHintInfotextPayloadPreviewText(value = "") {
  return [
    READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_TYPE,
    READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_SURFACE_ID,
    READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_STATUS,
    READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_PERSISTED,
    String(value == null ? "" : value),
  ].filter(Boolean).join("\n");
}

function isReadonlyHintInfotextDraftValid(value = "") {
  return String(value == null ? "" : value).trim().length > 0;
}

function formatReadonlyHintInfotextDraftValidationText(value = "") {
  return [
    isReadonlyHintInfotextDraftValid(value)
      ? READONLY_HINT_INFOTEXT_DRAFT_VALIDATION_STATUS_VALID
      : READONLY_HINT_INFOTEXT_DRAFT_VALIDATION_STATUS_EMPTY,
    READONLY_HINT_INFOTEXT_DRAFT_VALIDATION_SAVE_STATUS,
  ].join("\n");
}

function handleReadonlyHintInfotextDraftInput(
  state = {},
  value = "",
  livePreview = null,
  hostPreview = null,
  elementModelPreview = null,
  payloadPreview = null,
  validationPreview = null,
  storageCheckPreview = null
) {
  const nextValue = String(value == null ? "" : value);
  state.hintInfotextDraftText = nextValue;
  if (livePreview) {
    livePreview.textContent = nextValue;
  }
  if (hostPreview) {
    hostPreview.textContent = formatReadonlyHintInfotextHostPreviewText(nextValue);
  }
  if (elementModelPreview) {
    elementModelPreview.textContent = formatReadonlyHintInfotextElementModelPreviewText(nextValue);
  }
  if (payloadPreview) {
    payloadPreview.textContent = formatReadonlyHintInfotextPayloadPreviewText(nextValue);
  }
  if (validationPreview) {
    validationPreview.textContent = formatReadonlyHintInfotextDraftValidationText(nextValue);
  }
  if (
    storageCheckPreview
    || state.hintInfotextCreateNotePayloadPreview
    || state.hintInfotextWriteGatePreview
    || state.hintInfotextSaveHandlerPreview
    || state.hintInfotextSaveAdapterPreview
    || state.hintInfotextSaveExecutionPreview
    || state.hintInfotextSaveButtonStatePreview
    || state.hintInfotextSaveGuardStatePreview
    || state.hintInfotextSaveClickStatePreview
  ) {
    updateReadonlyHintInfotextStoragePreviews(state, nextValue);
  }
  return nextValue;
}

function resetReadonlyHintInfotextDraft(
  state = {},
  livePreview = null,
  hostPreview = null,
  elementModelPreview = null,
  payloadPreview = null,
  validationPreview = null,
  storageCheckPreview = null
) {
  const nextValue = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_DEFAULT_TEXT;
  state.hintInfotextDraftText = nextValue;
  return handleReadonlyHintInfotextDraftInput(
    state,
    nextValue,
    livePreview,
    hostPreview,
    elementModelPreview,
    payloadPreview,
    validationPreview,
    storageCheckPreview
  );
}

function appendReadonlyHintInfotextDraftPreview(doc, panel, state = {}) {
  if (!doc?.createElement || !panel?.appendChild) return null;
  const currentText = getReadonlyHintInfotextDraftText(state);

  const preview = doc.createElement("div");
  preview.className = "ui-editor-preview-hint-infotext-draft";
  preview.setAttribute("data-ui-editor-hint-infotext-draft-preview", "true");
  preview.style.marginTop = "8px";
  preview.style.padding = "8px";
  preview.style.border = "1px solid #d1d5db";
  preview.style.borderRadius = "6px";
  preview.style.background = "#f8fafc";
  preview.style.color = "#334155";
  preview.style.fontSize = "11px";
  preview.style.lineHeight = "1.35";

  const title = doc.createElement("div");
  title.className = "ui-editor-preview-hint-infotext-draft__title";
  title.textContent = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_TITLE;
  title.style.fontWeight = "700";
  title.style.marginBottom = "4px";

  const lines = doc.createElement("div");
  lines.className = "ui-editor-preview-hint-infotext-draft__lines";
  lines.textContent = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_LINES.map((line) => `- ${line}`).join("\n");

  const inputGroup = doc.createElement("div");
  inputGroup.className = "ui-editor-preview-hint-infotext-draft__input-group";
  inputGroup.style.marginTop = "8px";
  inputGroup.style.display = "grid";
  inputGroup.style.gap = "4px";

  const inputLabel = doc.createElement("div");
  inputLabel.className = "ui-editor-preview-hint-infotext-draft__input-label";
  inputLabel.textContent = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_INPUT_LABEL;
  inputLabel.style.fontWeight = "700";

  const input = doc.createElement("textarea");
  input.className = "ui-editor-preview-hint-infotext-draft__input";
  input.setAttribute("data-ui-editor-hint-infotext-draft-input", "true");
  input.rows = 3;
  input.value = currentText;
  input.style.width = "100%";
  input.style.boxSizing = "border-box";
  input.style.resize = "none";
  input.style.border = "1px solid #cbd5e1";
  input.style.borderRadius = "4px";
  input.style.padding = "6px 8px";
  input.style.fontSize = "12px";
  input.style.lineHeight = "1.35";
  input.addEventListener("input", () => {
    handleReadonlyHintInfotextDraftInput(
      state,
      input.value,
      livePreview,
      hostPreview,
      elementModelPreview,
      payloadPreview,
      validationPreview,
      state.hintInfotextStorageCheckPreview || null
    );
  });
  input.addEventListener("change", () => {
    handleReadonlyHintInfotextDraftInput(
      state,
      input.value,
      livePreview,
      hostPreview,
      elementModelPreview,
      payloadPreview,
      validationPreview,
      state.hintInfotextStorageCheckPreview || null
    );
  });

  const resetButton = doc.createElement("button");
  resetButton.type = "button";
  resetButton.className = "ui-editor-preview-hint-infotext-draft__reset-button";
  resetButton.setAttribute("data-ui-editor-hint-infotext-draft-reset", "true");
  resetButton.textContent = "Entwurf zurücksetzen";
  resetButton.style.justifySelf = "start";
  resetButton.style.border = "1px solid #cbd5e1";
  resetButton.style.borderRadius = "4px";
  resetButton.style.background = "#ffffff";
  resetButton.style.padding = "4px 8px";
  resetButton.style.fontSize = "11px";
  resetButton.style.lineHeight = "1.35";
  resetButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    input.value = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_DEFAULT_TEXT;
    resetReadonlyHintInfotextDraft(
      state,
      livePreview,
      hostPreview,
      elementModelPreview,
      payloadPreview,
      validationPreview,
      state.hintInfotextStorageCheckPreview || null
    );
  });

  inputGroup.append(inputLabel, input, resetButton);

  const liveTitle = doc.createElement("div");
  liveTitle.className = "ui-editor-preview-hint-infotext-draft__live-title";
  liveTitle.textContent = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_LIVE_TITLE;
  liveTitle.style.marginTop = "8px";
  liveTitle.style.fontWeight = "700";

  const livePreview = doc.createElement("div");
  livePreview.className = "ui-editor-preview-hint-infotext-draft__live-preview";
  livePreview.setAttribute("data-ui-editor-hint-infotext-live-preview", "true");
  livePreview.setAttribute("aria-live", "polite");
  livePreview.style.marginTop = "4px";
  livePreview.style.padding = "6px 8px";
  livePreview.style.border = "1px solid #dbe4ee";
  livePreview.style.borderRadius = "4px";
  livePreview.style.background = "#ffffff";
  livePreview.style.whiteSpace = "pre-wrap";
  livePreview.style.minHeight = "24px";
  livePreview.textContent = currentText;

  const hostTitle = doc.createElement("div");
  hostTitle.className = "ui-editor-preview-hint-infotext-draft__host-title";
  hostTitle.textContent = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_HOST_TITLE;
  hostTitle.style.marginTop = "8px";
  hostTitle.style.fontWeight = "700";

  const hostPreview = doc.createElement("div");
  hostPreview.className = "ui-editor-preview-hint-infotext-draft__host-preview";
  hostPreview.setAttribute("data-ui-editor-hint-infotext-host-preview", "true");
  hostPreview.style.marginTop = "4px";
  hostPreview.style.padding = "6px 8px";
  hostPreview.style.border = "1px solid #dbe4ee";
  hostPreview.style.borderRadius = "4px";
  hostPreview.style.background = "#ffffff";
  hostPreview.style.whiteSpace = "pre-wrap";
  hostPreview.style.minHeight = "24px";
  hostPreview.textContent = formatReadonlyHintInfotextHostPreviewText(currentText);

  const elementModelTitle = doc.createElement("div");
  elementModelTitle.className = "ui-editor-preview-hint-infotext-draft__elementmodel-title";
  elementModelTitle.textContent = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_ELEMENTMODEL_TITLE;
  elementModelTitle.style.marginTop = "8px";
  elementModelTitle.style.fontWeight = "700";

  const elementModelPreview = doc.createElement("div");
  elementModelPreview.className = "ui-editor-preview-hint-infotext-draft__elementmodel-preview";
  elementModelPreview.setAttribute("data-ui-editor-hint-infotext-elementmodel-preview", "true");
  elementModelPreview.style.marginTop = "4px";
  elementModelPreview.style.padding = "6px 8px";
  elementModelPreview.style.border = "1px solid #dbe4ee";
  elementModelPreview.style.borderRadius = "4px";
  elementModelPreview.style.background = "#ffffff";
  elementModelPreview.style.whiteSpace = "pre-wrap";
  elementModelPreview.style.minHeight = "24px";
  elementModelPreview.textContent = formatReadonlyHintInfotextElementModelPreviewText(currentText);

  const payloadTitle = doc.createElement("div");
  payloadTitle.className = "ui-editor-preview-hint-infotext-draft__payload-title";
  payloadTitle.textContent = READONLY_HINT_INFOTEXT_DRAFT_PREVIEW_PAYLOAD_TITLE;
  payloadTitle.style.marginTop = "8px";
  payloadTitle.style.fontWeight = "700";

  const payloadPreview = doc.createElement("div");
  payloadPreview.className = "ui-editor-preview-hint-infotext-draft__payload-preview";
  payloadPreview.setAttribute("data-ui-editor-hint-infotext-payload-preview", "true");
  payloadPreview.style.marginTop = "4px";
  payloadPreview.style.padding = "6px 8px";
  payloadPreview.style.border = "1px solid #dbe4ee";
  payloadPreview.style.borderRadius = "4px";
  payloadPreview.style.background = "#ffffff";
  payloadPreview.style.whiteSpace = "pre-wrap";
  payloadPreview.style.minHeight = "24px";
  payloadPreview.textContent = formatReadonlyHintInfotextPayloadPreviewText(currentText);

  const validationTitle = doc.createElement("div");
  validationTitle.className = "ui-editor-preview-hint-infotext-draft__validation-title";
  validationTitle.textContent = READONLY_HINT_INFOTEXT_DRAFT_VALIDATION_TITLE;
  validationTitle.style.marginTop = "8px";
  validationTitle.style.fontWeight = "700";

  const validationPreview = doc.createElement("div");
  validationPreview.className = "ui-editor-preview-hint-infotext-draft__validation-preview";
  validationPreview.setAttribute("data-ui-editor-hint-infotext-draft-validation", "true");
  validationPreview.style.marginTop = "4px";
  validationPreview.style.padding = "6px 8px";
  validationPreview.style.border = "1px solid #dbe4ee";
  validationPreview.style.borderRadius = "4px";
  validationPreview.style.background = "#ffffff";
  validationPreview.style.whiteSpace = "pre-wrap";
  validationPreview.style.minHeight = "24px";
  validationPreview.textContent = formatReadonlyHintInfotextDraftValidationText(currentText);

  preview.append(
    title,
    lines,
    inputGroup,
    liveTitle,
    livePreview,
    hostTitle,
    hostPreview,
    elementModelTitle,
    elementModelPreview,
    payloadTitle,
    payloadPreview,
    validationTitle,
    validationPreview
  );
  panel.appendChild(preview);
  return preview;
}

function appendReadonlyHintInfotextStoragePreview(doc, panel, state = {}) {
  if (!doc?.createElement || !panel?.appendChild) return null;
  const hostContextStatus = getReadonlyHintInfotextHostContextStatus(state);
  state.hintInfotextSaveClickState = state.hintInfotextSaveClickState || {};
  const runtime = {
    win: state.win || null,
    clickState: state.hintInfotextSaveClickState,
  };

  const storage = doc.createElement("div");
  storage.className = "ui-editor-preview-hint-infotext-storage";
  storage.setAttribute("data-ui-editor-hint-infotext-storage-preview", "true");
  storage.style.marginTop = "8px";
  storage.style.padding = "8px";
  storage.style.border = "1px solid #d1d5db";
  storage.style.borderRadius = "6px";
  storage.style.background = "#f8fafc";
  storage.style.color = "#334155";
  storage.style.fontSize = "11px";
  storage.style.lineHeight = "1.35";

  const title = doc.createElement("div");
  title.className = "ui-editor-preview-hint-infotext-storage__title";
  title.textContent = READONLY_HINT_INFOTEXT_STORAGE_TITLE;
  title.style.fontWeight = "700";
  title.style.marginBottom = "4px";

  const contextTitle = doc.createElement("div");
  contextTitle.className = "ui-editor-preview-hint-infotext-storage__context-title";
  contextTitle.textContent = READONLY_HINT_INFOTEXT_STORAGE_CONTEXT_TITLE;
  contextTitle.style.fontWeight = "700";
  contextTitle.style.marginTop = "8px";
  contextTitle.style.marginBottom = "4px";

  const contextLines = doc.createElement("div");
  contextLines.className = "ui-editor-preview-hint-infotext-storage__context-lines";
  contextLines.textContent = formatReadonlyHintInfotextStorageContextText(hostContextStatus);

  const lines = doc.createElement("div");
  lines.className = "ui-editor-preview-hint-infotext-storage__lines";
  lines.textContent = [
    READONLY_HINT_INFOTEXT_STORAGE_ROUTE_LINE,
    READONLY_HINT_INFOTEXT_STORAGE_TARGET_LINE,
    READONLY_HINT_INFOTEXT_STORAGE_STATUS_LINE,
    READONLY_HINT_INFOTEXT_STORAGE_PERSISTED_LINE,
  ].join("\n");

  const freigabecheckTitle = doc.createElement("div");
  freigabecheckTitle.className = "ui-editor-preview-hint-infotext-storage__check-title";
  freigabecheckTitle.textContent = READONLY_HINT_INFOTEXT_STORAGE_CHECK_TITLE;
  freigabecheckTitle.style.fontWeight = "700";
  freigabecheckTitle.style.marginTop = "8px";
  freigabecheckTitle.style.marginBottom = "4px";

  const freigabecheck = doc.createElement("div");
  freigabecheck.className = "ui-editor-preview-hint-infotext-storage__check";
  freigabecheck.setAttribute("data-ui-editor-hint-infotext-storage-check", "true");
  freigabecheck.style.whiteSpace = "pre-wrap";
  freigabecheck.style.padding = "6px 8px";
  freigabecheck.style.border = "1px solid #dbe4ee";
  freigabecheck.style.borderRadius = "4px";
  freigabecheck.style.background = "#ffffff";
  freigabecheck.style.minHeight = "24px";
  freigabecheck.textContent = formatReadonlyHintInfotextStorageFreigabecheckText(
    getReadonlyHintInfotextDraftText(state),
    hostContextStatus
  );
  state.hintInfotextStorageCheckPreview = freigabecheck;

  const elementSaveStatusTitle = doc.createElement("div");
  elementSaveStatusTitle.className = "ui-editor-preview-hint-infotext-storage__element-save-status-title";
  elementSaveStatusTitle.textContent = READONLY_HINT_INFOTEXT_ELEMENT_SAVE_STATUS_TITLE;
  elementSaveStatusTitle.style.fontWeight = "700";
  elementSaveStatusTitle.style.marginTop = "8px";
  elementSaveStatusTitle.style.marginBottom = "4px";

  const elementSaveStatus = doc.createElement("div");
  elementSaveStatus.className = "ui-editor-preview-hint-infotext-storage__element-save-status";
  elementSaveStatus.setAttribute("data-ui-editor-hint-infotext-element-save-status", "true");
  elementSaveStatus.style.whiteSpace = "pre-wrap";
  elementSaveStatus.style.padding = "6px 8px";
  elementSaveStatus.style.border = "1px solid #dbe4ee";
  elementSaveStatus.style.borderRadius = "4px";
  elementSaveStatus.style.background = "#ffffff";
  elementSaveStatus.style.minHeight = "24px";
  elementSaveStatus.textContent = formatReadonlyHintInfotextElementSaveStatusText(
    getReadonlyHintInfotextDraftText(state),
    hostContextStatus,
    runtime
  );
  state.hintInfotextElementSaveStatusPreview = elementSaveStatus;

  const diagnostics = doc.createElement("details");
  diagnostics.className = "ui-editor-preview-hint-infotext-storage__diagnostics";
  diagnostics.setAttribute("data-ui-editor-hint-infotext-diagnostics", "true");
  diagnostics.open = false;
  diagnostics.style.marginTop = "8px";

  const diagnosticsSummary = doc.createElement("summary");
  diagnosticsSummary.className = "ui-editor-preview-hint-infotext-storage__diagnostics-summary";
  diagnosticsSummary.textContent = READONLY_HINT_INFOTEXT_DIAGNOSTICS_TITLE;
  diagnosticsSummary.style.cursor = "pointer";
  diagnosticsSummary.style.fontWeight = "700";

  const createNotePayloadTitle = doc.createElement("div");
  createNotePayloadTitle.className = "ui-editor-preview-hint-infotext-storage__payload-title";
  createNotePayloadTitle.textContent = READONLY_HINT_INFOTEXT_CREATE_NOTE_PAYLOAD_TITLE;
  createNotePayloadTitle.style.fontWeight = "700";
  createNotePayloadTitle.style.marginTop = "8px";
  createNotePayloadTitle.style.marginBottom = "4px";

  const createNotePayload = doc.createElement("div");
  createNotePayload.className = "ui-editor-preview-hint-infotext-storage__payload";
  createNotePayload.setAttribute("data-ui-editor-hint-infotext-create-note-payload-preview", "true");
  createNotePayload.style.whiteSpace = "pre-wrap";
  createNotePayload.style.padding = "6px 8px";
  createNotePayload.style.border = "1px solid #dbe4ee";
  createNotePayload.style.borderRadius = "4px";
  createNotePayload.style.background = "#ffffff";
  createNotePayload.style.minHeight = "24px";
  createNotePayload.textContent = formatReadonlyHintInfotextCreateNotePayloadPreviewText(
    getReadonlyHintInfotextDraftText(state),
    hostContextStatus
  );
  state.hintInfotextCreateNotePayloadPreview = createNotePayload;

  const writeGateTitle = doc.createElement("div");
  writeGateTitle.className = "ui-editor-preview-hint-infotext-storage__write-gate-title";
  writeGateTitle.textContent = READONLY_HINT_INFOTEXT_WRITE_GATE_TITLE;
  writeGateTitle.style.fontWeight = "700";
  writeGateTitle.style.marginTop = "8px";
  writeGateTitle.style.marginBottom = "4px";

  const writeGate = doc.createElement("div");
  writeGate.className = "ui-editor-preview-hint-infotext-storage__write-gate";
  writeGate.setAttribute("data-ui-editor-hint-infotext-write-gate-preview", "true");
  writeGate.style.whiteSpace = "pre-wrap";
  writeGate.style.padding = "6px 8px";
  writeGate.style.border = "1px solid #dbe4ee";
  writeGate.style.borderRadius = "4px";
  writeGate.style.background = "#ffffff";
  writeGate.style.minHeight = "24px";
  writeGate.textContent = formatReadonlyHintInfotextWriteGateText(
    getReadonlyHintInfotextDraftText(state),
    hostContextStatus
  );
  state.hintInfotextWriteGatePreview = writeGate;

  const saveHandlerTitle = doc.createElement("div");
  saveHandlerTitle.className = "ui-editor-preview-hint-infotext-storage__save-handler-title";
  saveHandlerTitle.textContent = READONLY_HINT_INFOTEXT_SAVE_HANDLER_TITLE;
  saveHandlerTitle.style.fontWeight = "700";
  saveHandlerTitle.style.marginTop = "8px";
  saveHandlerTitle.style.marginBottom = "4px";

  const saveHandler = doc.createElement("div");
  saveHandler.className = "ui-editor-preview-hint-infotext-storage__save-handler";
  saveHandler.setAttribute("data-ui-editor-hint-infotext-save-handler-preview", "true");
  saveHandler.style.whiteSpace = "pre-wrap";
  saveHandler.style.padding = "6px 8px";
  saveHandler.style.border = "1px solid #dbe4ee";
  saveHandler.style.borderRadius = "4px";
  saveHandler.style.background = "#ffffff";
  saveHandler.style.minHeight = "24px";
  saveHandler.textContent = formatReadonlyHintInfotextSaveHandlerText(
    getReadonlyHintInfotextDraftText(state),
    hostContextStatus
  );
  state.hintInfotextSaveHandlerPreview = saveHandler;

  const saveAdapterTitle = doc.createElement("div");
  saveAdapterTitle.className = "ui-editor-preview-hint-infotext-storage__save-adapter-title";
  saveAdapterTitle.textContent = READONLY_HINT_INFOTEXT_SAVE_ADAPTER_TITLE;
  saveAdapterTitle.style.fontWeight = "700";
  saveAdapterTitle.style.marginTop = "8px";
  saveAdapterTitle.style.marginBottom = "4px";

  const saveAdapter = doc.createElement("div");
  saveAdapter.className = "ui-editor-preview-hint-infotext-storage__save-adapter";
  saveAdapter.setAttribute("data-ui-editor-hint-infotext-save-adapter-preview", "true");
  saveAdapter.style.whiteSpace = "pre-wrap";
  saveAdapter.style.padding = "6px 8px";
  saveAdapter.style.border = "1px solid #dbe4ee";
  saveAdapter.style.borderRadius = "4px";
  saveAdapter.style.background = "#ffffff";
  saveAdapter.style.minHeight = "24px";
  saveAdapter.textContent = formatReadonlyHintInfotextSaveAdapterText();
  state.hintInfotextSaveAdapterPreview = saveAdapter;

  const saveExecutionTitle = doc.createElement("div");
  saveExecutionTitle.className = "ui-editor-preview-hint-infotext-storage__save-execution-title";
  saveExecutionTitle.textContent = READONLY_HINT_INFOTEXT_SAVE_EXECUTION_TITLE;
  saveExecutionTitle.style.fontWeight = "700";
  saveExecutionTitle.style.marginTop = "8px";
  saveExecutionTitle.style.marginBottom = "4px";

  const saveExecution = doc.createElement("div");
  saveExecution.className = "ui-editor-preview-hint-infotext-storage__save-execution";
  saveExecution.setAttribute("data-ui-editor-hint-infotext-save-execution-preview", "true");
  saveExecution.style.whiteSpace = "pre-wrap";
  saveExecution.style.padding = "6px 8px";
  saveExecution.style.border = "1px solid #dbe4ee";
  saveExecution.style.borderRadius = "4px";
  saveExecution.style.background = "#ffffff";
  saveExecution.style.minHeight = "24px";
  saveExecution.textContent = formatReadonlyHintInfotextSaveExecutionText(
    getReadonlyHintInfotextDraftText(state),
    hostContextStatus
  );
  state.hintInfotextSaveExecutionPreview = saveExecution;

  const saveButtonStateTitle = doc.createElement("div");
  saveButtonStateTitle.className = "ui-editor-preview-hint-infotext-storage__save-button-state-title";
  saveButtonStateTitle.textContent = READONLY_HINT_INFOTEXT_SAVE_BUTTON_STATE_TITLE;
  saveButtonStateTitle.style.fontWeight = "700";
  saveButtonStateTitle.style.marginTop = "8px";
  saveButtonStateTitle.style.marginBottom = "4px";

  const saveButtonState = doc.createElement("div");
  saveButtonState.className = "ui-editor-preview-hint-infotext-storage__save-button-state";
  saveButtonState.setAttribute("data-ui-editor-hint-infotext-save-button-state-preview", "true");
  saveButtonState.style.whiteSpace = "pre-wrap";
  saveButtonState.style.padding = "6px 8px";
  saveButtonState.style.border = "1px solid #dbe4ee";
  saveButtonState.style.borderRadius = "4px";
  saveButtonState.style.background = "#ffffff";
  saveButtonState.style.minHeight = "24px";
  saveButtonState.textContent = formatReadonlyHintInfotextSaveButtonStateText(
    getReadonlyHintInfotextDraftText(state),
    hostContextStatus,
    runtime
  );
  state.hintInfotextSaveButtonStatePreview = saveButtonState;

  const saveGuardStateTitle = doc.createElement("div");
  saveGuardStateTitle.className = "ui-editor-preview-hint-infotext-storage__save-guard-state-title";
  saveGuardStateTitle.textContent = READONLY_HINT_INFOTEXT_SAVE_GUARD_TITLE;
  saveGuardStateTitle.style.fontWeight = "700";
  saveGuardStateTitle.style.marginTop = "8px";
  saveGuardStateTitle.style.marginBottom = "4px";

  const saveGuardState = doc.createElement("div");
  saveGuardState.className = "ui-editor-preview-hint-infotext-storage__save-guard-state";
  saveGuardState.setAttribute("data-ui-editor-hint-infotext-save-guard-state-preview", "true");
  saveGuardState.style.whiteSpace = "pre-wrap";
  saveGuardState.style.padding = "6px 8px";
  saveGuardState.style.border = "1px solid #dbe4ee";
  saveGuardState.style.borderRadius = "4px";
  saveGuardState.style.background = "#ffffff";
  saveGuardState.style.minHeight = "24px";
  saveGuardState.textContent = formatReadonlyHintInfotextSaveGuardStateText(
    getReadonlyHintInfotextDraftText(state),
    hostContextStatus,
    runtime
  );
  state.hintInfotextSaveGuardStatePreview = saveGuardState;

  const saveClickStateTitle = doc.createElement("div");
  saveClickStateTitle.className = "ui-editor-preview-hint-infotext-storage__save-click-state-title";
  saveClickStateTitle.textContent = READONLY_HINT_INFOTEXT_SAVE_CLICK_TITLE;
  saveClickStateTitle.style.fontWeight = "700";
  saveClickStateTitle.style.marginTop = "8px";
  saveClickStateTitle.style.marginBottom = "4px";

  const saveClickState = doc.createElement("div");
  saveClickState.className = "ui-editor-preview-hint-infotext-storage__save-click-state";
  saveClickState.setAttribute("data-ui-editor-hint-infotext-save-click-state-preview", "true");
  saveClickState.style.whiteSpace = "pre-wrap";
  saveClickState.style.padding = "6px 8px";
  saveClickState.style.border = "1px solid #dbe4ee";
  saveClickState.style.borderRadius = "4px";
  saveClickState.style.background = "#ffffff";
  saveClickState.style.minHeight = "24px";
  saveClickState.textContent = formatReadonlyHintInfotextSaveClickStateText(
    getReadonlyHintInfotextDraftText(state),
    hostContextStatus,
    state.hintInfotextSaveClickState,
    runtime
  );
  state.hintInfotextSaveClickStatePreview = saveClickState;

  const button = doc.createElement("button");
  button.type = "button";
  button.className = "ui-editor-preview-hint-infotext-storage__button";
  button.setAttribute("data-ui-editor-hint-infotext-save-button", "true");
  const initialButtonState = buildReadonlyHintInfotextSaveButtonState({
    value: getReadonlyHintInfotextDraftText(state),
    hostContextStatus,
    runtime,
  });
  button.disabled = initialButtonState.buttonEnabled !== true;
  button.setAttribute("aria-disabled", initialButtonState.buttonEnabled === true ? "false" : "true");
  button.title =
    initialButtonState.buttonEnabled === true
      ? "UI-Elementänderungen speichern"
      : initialButtonState.reason;
  button.textContent = READONLY_HINT_INFOTEXT_STORAGE_BUTTON_LABEL;
  button.style.marginTop = "8px";
  button.style.padding = "6px 10px";
  button.style.border = "1px solid #cbd5e1";
  button.style.borderRadius = "4px";
  button.style.background = initialButtonState.buttonEnabled === true ? "#ffffff" : "#e2e8f0";
  button.style.color = initialButtonState.buttonEnabled === true ? "#1f2937" : "#64748b";
  button.style.cursor = initialButtonState.buttonEnabled === true ? "pointer" : "not-allowed";
  state.hintInfotextSaveButtonElement = button;
  button.addEventListener("mousedown", stopPreviewPanelEvent);
  button.addEventListener("click", (event) => {
    stopPreviewPanelEvent(event);
    const savePromise = executeReadonlyHintInfotextSaveClick({
      value: getReadonlyHintInfotextDraftText(state),
      hostContextStatus: getReadonlyHintInfotextHostContextStatus(state),
      clickState: state.hintInfotextSaveClickState,
      runtime: {
        win: state.win || null,
        clickState: state.hintInfotextSaveClickState,
      },
    });
    updateReadonlyHintInfotextStoragePreviews(state, getReadonlyHintInfotextDraftText(state));
    savePromise.finally(() => {
      updateReadonlyHintInfotextStoragePreviews(state, getReadonlyHintInfotextDraftText(state));
    });
  });

  diagnostics.append(
    diagnosticsSummary,
    createNotePayloadTitle,
    createNotePayload,
    writeGateTitle,
    writeGate,
    saveHandlerTitle,
    saveHandler,
    saveAdapterTitle,
    saveAdapter,
    saveExecutionTitle,
    saveExecution,
    saveButtonStateTitle,
    saveButtonState,
    saveGuardStateTitle,
    saveGuardState,
    saveClickStateTitle,
    saveClickState
  );

  storage.append(
    title,
    contextTitle,
    contextLines,
    lines,
    freigabecheckTitle,
    freigabecheck,
    elementSaveStatusTitle,
    elementSaveStatus,
    diagnostics,
    button
  );
  panel.appendChild(storage);
  return storage;
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
  hostContext = null,
  hostContextStatus = null,
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
    hostContext,
    hostContextStatus,
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
  normalizeHostContextStatus,
  buildReadonlyHintInfotextHostContextStatusModel,
  isUiEditorElementSaveSurfaceAllowed,
  isUiEditorElementSaveElementTypeAllowed,
  validateUiEditorElementSavePayload,
  buildReadonlyHintInfotextUiElementSavePayload,
  executeUiEditorElementSaveContract,
  buildReadonlyHintInfotextSaveButtonState,
  buildReadonlyHintInfotextSavePayloadSignature,
  buildReadonlyHintInfotextSaveGuardState,
  buildReadonlyHintInfotextSaveClickState,
  getReadonlyHintInfotextSaveAdapterDescriptor,
  executeReadonlyHintInfotextBlockedSaveHandler,
  executeReadonlyHintInfotextProductiveSaveAdapter,
  executeReadonlyHintInfotextSave,
  executeReadonlyHintInfotextGuardedSave,
  executeReadonlyHintInfotextSaveClick,
  getReadonlyHintInfotextHostContextStatus,
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
