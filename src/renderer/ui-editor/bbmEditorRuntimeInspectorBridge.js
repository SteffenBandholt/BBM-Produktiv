import { createEditorScopeInspector } from "../editorRuntime/inspector/editorScopeInspector.js";
import { createBbmMainUiHostAdapter } from "./bbmMainUiHostAdapter.js";

const DEFAULT_SCOPE_ID = "bbm.main-layout";
const DEFAULT_MODULE_ID = "bbm.main";
const DEFAULT_TARGET_APP_ID = "bbm-produktiv";
export const M63C_LAYOUT_STEP = 5;

const TYPE_BY_ELEMENT_ID = Object.freeze({
  "bbm.main.shell": "root",
  "bbm.main.navigation": "area",
  "bbm.main.header": "area",
  "bbm.main.content": "area",
  "bbm.main.actions": "area",
  "bbm.uiEditorTest.workspace": "area",
  "bbm.uiEditorTest.card": "area",
  "bbm.uiEditorTest.card.title": "label",
  "bbm.uiEditorTest.card.text": "label",
  "bbm.uiEditorTest.card.button": "button",
  "bbm.uiEditorTest.card.input": "field",
  "bbm.uiEditorTest.card.select": "field",
  "bbm.uiEditorTest.table": "table",
});


const ROLE_BY_ELEMENT_ID = Object.freeze({
  "bbm.main.shell": "layout",
  "bbm.main.navigation": "navigation",
  "bbm.main.header": "layout",
  "bbm.main.content": "content",
  "bbm.main.actions": "action",
  "bbm.uiEditorTest.workspace": "content",
  "bbm.uiEditorTest.card": "content",
  "bbm.uiEditorTest.card.title": "content",
  "bbm.uiEditorTest.card.text": "content",
  "bbm.uiEditorTest.card.button": "action",
  "bbm.uiEditorTest.card.input": "content",
  "bbm.uiEditorTest.card.select": "content",
  "bbm.uiEditorTest.table": "content",
});

function normalizeId(value) {
  return String(value ?? "").trim();
}

function cloneList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean) : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const RUNTIME_LAYOUT_OPS = Object.freeze(["move", "resize", "hide", "show", "label", "spacing", "width", "height", "fontSize", "fontWeight", "margin", "pageBreak", "columnWidth", "logoSize", "footerPosition"]);

function toRuntimeLockedOps(element) {
  return unique(cloneList(element?.lockedOps)).filter((op) => RUNTIME_LAYOUT_OPS.includes(op));
}

function getSelectedElementId(selectedElement) {
  return normalizeId(selectedElement?.elementId || selectedElement?.id || selectedElement?.selectedElementId);
}

function toRuntimeAllowedOps(element) {
  if (Array.isArray(element?.allowedOps)) return unique(cloneList(element.allowedOps));

  const capabilities = element?.capabilities;
  if (capabilities && typeof capabilities === "object" && !Array.isArray(capabilities)) {
    if (Array.isArray(capabilities.allowedOps)) return unique(cloneList(capabilities.allowedOps));
    if (Array.isArray(capabilities.operations)) return unique(cloneList(capabilities.operations));
    if (Array.isArray(capabilities.layoutOps)) return unique(cloneList(capabilities.layoutOps));
  }


  if (Array.isArray(capabilities)) {
    const explicitOps = capabilities.flatMap((capability) => {
      if (!capability || typeof capability !== "object" || Array.isArray(capability)) return [];
      if (Array.isArray(capability.allowedOps)) return cloneList(capability.allowedOps);
      if (Array.isArray(capability.operations)) return cloneList(capability.operations);
      if (Array.isArray(capability.layoutOps)) return cloneList(capability.layoutOps);
      return [];
    });
    return unique(explicitOps);
  }

  return [];
}

function isEditable(element) {
  if (typeof element?.editable === "boolean") return element.editable;
  const capabilities = cloneList(element?.capabilities);
  const allowedChanges = cloneList(element?.allowedChanges);
  return capabilities.includes("layout") || allowedChanges.length > 0;
}

function transformRegistryElement(element, order) {
  const id = normalizeId(element?.elementId || element?.id);
  const role = ROLE_BY_ELEMENT_ID[id] || element?.runtimeRole || element?.editorRuntimeRole || element?.role;
  const type = TYPE_BY_ELEMENT_ID[id] || element?.runtimeType || element?.editorRuntimeType;

  if (!id || !role || !type) {
    return {
      ok: false,
      sourceElement: element,
      elementId: id,
      reason: !id ? "ELEMENT_ID_MISSING" : !role ? "ROLE_MISSING" : "TYPE_MISSING",
    };
  }

  return {
    ok: true,
    sourceElement: element,
    element: {
      id,
      name: normalizeId(element?.label || element?.name || id),
      type,
      role,
      parentId: element?.parentId ?? null,
      order,
      visible: element?.visible !== undefined ? Boolean(element.visible) : element?.layoutDefaults?.visible !== false,
      editable: isEditable(element),
      layoutDefaults: element?.layoutDefaults && typeof element.layoutDefaults === "object" ? { ...element.layoutDefaults } : {},
      allowedOps: toRuntimeAllowedOps(element),
      lockedOps: toRuntimeLockedOps(element),
    },
  };
}

function transformRegistry(elements) {
  const input = Array.isArray(elements) ? elements : [];
  const transformed = input.map((element, index) => transformRegistryElement(element, index));
  return {
    registry: transformed.filter((entry) => entry.ok).map((entry) => entry.element),
    unsupported: transformed.filter((entry) => !entry.ok),
    sourceCount: input.length,
  };
}

function createLayoutCatalog({ scopeId, moduleId, targetAppId }) {
  return {
    targetAppId,
    modules: [
      {
        moduleId,
        moduleLabel: "BBM Hauptbereich",
        scopes: [
          {
            scopeId,
            scopeLabel: "BBM Hauptbereich Layout",
            layoutProfileId: "default",
          },
        ],
      },
    ],
  };
}

function toM63cControls(controls) {
  return Array.isArray(controls)
    ? controls.map((control) => ({
        ...control,
        enabled: Boolean(control.enabled),
        readOnly: false,
        m63cStatus: control.enabled ? "bereit" : "blockiert",
      }))
    : [];
}

function createStepPayload(action) {
  const map = {
    left: { operation: "move", payload: { x: -M63C_LAYOUT_STEP } },
    right: { operation: "move", payload: { x: M63C_LAYOUT_STEP } },
    up: { operation: "move", payload: { y: -M63C_LAYOUT_STEP } },
    down: { operation: "move", payload: { y: M63C_LAYOUT_STEP } },
    widthLeft: { operation: "resize", payload: { width: -M63C_LAYOUT_STEP } },
    widthRight: { operation: "resize", payload: { width: M63C_LAYOUT_STEP } },
    heightUp: { operation: "resize", payload: { height: M63C_LAYOUT_STEP } },
    heightDown: { operation: "resize", payload: { height: -M63C_LAYOUT_STEP } },
  };
  return map[normalizeId(action)] || null;
}

function createRuntimeInspector({ inspector, inspectorFactory, hostAdapterFactory, registry, scopeId, moduleId, targetAppId }) {
  if (inspector) return inspector;
  const catalog = createLayoutCatalog({ scopeId, moduleId, targetAppId });
  const factory = inspectorFactory || createEditorScopeInspector;
  const createHostAdapter = typeof hostAdapterFactory === "function"
    ? hostAdapterFactory
    : () => createBbmMainUiHostAdapter({ registry });
  return factory({ catalog, hostAdapterFactory: () => createHostAdapter({ registry, scopeId, moduleId, targetAppId }) });
}

export function createBbmEditorRuntimeInspectorBridge(options = {}) {
  const scopeId = normalizeId(options.scopeId) || DEFAULT_SCOPE_ID;
  const moduleId = normalizeId(options.moduleId) || DEFAULT_MODULE_ID;
  const targetAppId = normalizeId(options.targetAppId) || DEFAULT_TARGET_APP_ID;
  const getRegistryElements = typeof options.getRegistryElements === "function" ? options.getRegistryElements : () => options.registryElements || [];
  const getSelectedElement = typeof options.getSelectedElement === "function" ? options.getSelectedElement : () => options.selectedElement || null;
  function getSnapshot() {
    const registryElements = getRegistryElements() || [];
    const selectedElement = getSelectedElement() || null;
    const selectedElementId = getSelectedElementId(selectedElement);
    const transformed = transformRegistry(registryElements);
    return { registryElements, selectedElement, selectedElementId, transformed };
  }

  function getStatus() {
    const snapshot = getSnapshot();
    if (!snapshot.selectedElementId) {
      return { ok: true, kind: "empty", selectedElement: null, inspectorStatus: "layout_ready", controls: [], allowedOps: [], message: "Keine Auswahl." };
    }
    const sourceElement = snapshot.registryElements.find((element) => normalizeId(element?.elementId || element?.id) === snapshot.selectedElementId) || null;
    if (!sourceElement) {
      return { ok: false, kind: "blocked", selectedElement: null, elementId: snapshot.selectedElementId, controls: [], allowedOps: [], message: "Ausgewaehlte Element-ID ist nicht in der fuehrenden M51-Registry vorhanden.", reason: "UNKNOWN_SELECTED_ELEMENT" };
    }
    const unsupported = snapshot.transformed.unsupported.find((entry) => entry.elementId === snapshot.selectedElementId);
    if (unsupported) {
      return { ok: false, kind: "unsupported", selectedElement: sourceElement, elementId: snapshot.selectedElementId, controls: [], allowedOps: [], message: "Element ist ohne expliziten Inspector-Vertrag nicht kompatibel.", reason: unsupported.reason };
    }
    return { ok: true, kind: "ready", selectedElement: sourceElement, elementId: snapshot.selectedElementId, sourceCount: snapshot.transformed.sourceCount, registryCount: snapshot.transformed.registry.length, inspectorStatus: "layout_ready" };
  }

  function inspectSelectedElement() {
    const snapshot = getSnapshot();
    const status = getStatus();
    if (!status.ok || status.kind === "empty") return { ...status, registry: snapshot.transformed.registry };
    try {
      const inspector = createRuntimeInspector({ inspector: options.inspector, inspectorFactory: options.inspectorFactory, hostAdapterFactory: options.hostAdapterFactory, registry: snapshot.transformed.registry, scopeId, moduleId, targetAppId });
      const panel = inspector.getLayoutControlPanel(scopeId, snapshot.selectedElementId);
      return {
        ...status,
        scopeId,
        inspectorStatus: "layout_ready",
        inspectorElement: panel?.selectedElement || null,
        controlPanel: panel ? { ...panel, controls: toM63cControls(panel.controls) } : null,
        controls: toM63cControls(panel?.controls),
        allowedOps: Array.isArray(panel?.selectedElement?.effectiveOps) ? [...panel.selectedElement.effectiveOps] : [],
        registry: snapshot.transformed.registry,
        errors: panel?.errors || [],
        warnings: panel?.warnings || [],
      };
    } catch (error) {
      return { ok: false, kind: "blocked", selectedElement: status.selectedElement || null, elementId: snapshot.selectedElementId, controls: [], allowedOps: [], message: error?.message || "Inspector-Fehler", reason: "INSPECTOR_ERROR", errors: [{ code: "INSPECTOR_ERROR", message: error?.message || String(error || "Inspector-Fehler") }] };
    }
  }

  function getSelectedElementControlPanel() {
    return inspectSelectedElement().controlPanel || null;
  }

  function applySelectedElementLayoutAction(action) {
    const step = createStepPayload(action);
    const status = getStatus();
    if (!step) return { ok: false, blocked: true, reason: "UNKNOWN_LAYOUT_ACTION" };
    if (!status.ok || status.kind !== "ready") return { ok: false, blocked: true, reason: status.reason || "NO_SELECTED_ELEMENT" };
    const snapshot = getSnapshot();
    const inspector = createRuntimeInspector({ inspector: options.inspector, inspectorFactory: options.inspectorFactory, hostAdapterFactory: options.hostAdapterFactory, registry: snapshot.transformed.registry, scopeId, moduleId, targetAppId });
    return inspector.applyLayoutChange(scopeId, {
      elementId: snapshot.selectedElementId,
      operation: step.operation,
      payload: step.payload,
    });
  }

  return { inspectSelectedElement, getSelectedElementControlPanel, applySelectedElementLayoutAction, getStatus };
}

export const BBM_EDITOR_RUNTIME_INSPECTOR_BRIDGE_ROLE_BY_ID = ROLE_BY_ELEMENT_ID;
