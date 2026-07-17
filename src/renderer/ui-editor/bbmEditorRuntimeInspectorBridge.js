import { createEditorScopeInspector } from "../editorRuntime/inspector/editorScopeInspector.js";

const DEFAULT_SCOPE_ID = "bbm.main.readonly";
const DEFAULT_MODULE_ID = "bbm.main";
const DEFAULT_TARGET_APP_ID = "bbm-produktiv";
const LAYOUT_STEP = 8;

const TYPE_BY_ELEMENT_ID = Object.freeze({
  "bbm.main.shell": "root",
  "bbm.main.navigation": "area",
  "bbm.main.header": "area",
  "bbm.main.content": "area",
  "bbm.main.actions": "area",
});

const ROLE_BY_ELEMENT_ID = Object.freeze({
  "bbm.main.shell": "layout",
  "bbm.main.navigation": "navigation",
  "bbm.main.header": "layout",
  "bbm.main.content": "content",
  "bbm.main.actions": "action",
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

  if (Array.isArray(capabilities) && capabilities.map((capability) => normalizeId(capability)).includes("layout")) {
    return ["move", "resize"];
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
  const role = element?.role || ROLE_BY_ELEMENT_ID[id];
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
      allowedOps: toRuntimeAllowedOps(element),
      lockedOps: cloneList(element?.lockedOps),
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

function createLayoutHostAdapter(registry, state) {
  return {
    getRegistry() {
      return registry.map((element) => ({ ...element, allowedOps: [...element.allowedOps], lockedOps: [...element.lockedOps] }));
    },
    getCurrentLayoutState() {
      return [...state.values()].map((entry) => ({ ...entry, layoutValue: { ...entry.layoutValue } }));
    },
    submitChangeRequest(changeRequest) {
      const elementId = normalizeId(changeRequest?.elementId);
      const operation = normalizeId(changeRequest?.operation);
      const payload = changeRequest?.payload && typeof changeRequest.payload === "object" ? changeRequest.payload : {};
      const current = state.get(elementId)?.layoutValue || {};
      const next = { ...current };
      if (operation === "move") {
        if (typeof payload.x === "number") next.x = (typeof next.x === "number" ? next.x : 0) + payload.x;
        if (typeof payload.y === "number") next.y = (typeof next.y === "number" ? next.y : 0) + payload.y;
      }
      if (operation === "resize") {
        if (typeof payload.width === "number") next.width = (typeof next.width === "number" ? next.width : 0) + payload.width;
        if (typeof payload.height === "number") next.height = (typeof next.height === "number" ? next.height : 0) + payload.height;
      }
      const layoutEntry = { elementId, layoutValue: next, operation, updatedAt: changeRequest?.createdAt || new Date().toISOString() };
      state.set(elementId, layoutEntry);
      return { ok: true, accepted: true, executed: false, layoutEntry, changeRequest };
    },
  };
}

function createReadonlyCatalog({ scopeId, moduleId, targetAppId }) {
  return {
    targetAppId,
    modules: [
      {
        moduleId,
        moduleLabel: "BBM Hauptbereich",
        scopes: [
          {
            scopeId,
            scopeLabel: "BBM Hauptbereich read-only",
            layoutProfileId: "bbm.main.readonly",
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
    left: { operation: "move", payload: { x: -LAYOUT_STEP } },
    right: { operation: "move", payload: { x: LAYOUT_STEP } },
    up: { operation: "move", payload: { y: -LAYOUT_STEP } },
    down: { operation: "move", payload: { y: LAYOUT_STEP } },
    narrower: { operation: "resize", payload: { width: -LAYOUT_STEP } },
    wider: { operation: "resize", payload: { width: LAYOUT_STEP } },
    lower: { operation: "resize", payload: { height: -LAYOUT_STEP } },
    higher: { operation: "resize", payload: { height: LAYOUT_STEP } },
  };
  return map[normalizeId(action)] || null;
}

function createRuntimeInspector({ inspector, inspectorFactory, registry, scopeId, moduleId, targetAppId, state }) {
  if (inspector) return inspector;
  const catalog = createReadonlyCatalog({ scopeId, moduleId, targetAppId });
  const hostAdapter = createLayoutHostAdapter(registry, state);
  const factory = inspectorFactory || createEditorScopeInspector;
  return factory({ catalog, hostAdapterFactory: () => hostAdapter });
}

export function createBbmEditorRuntimeInspectorBridge(options = {}) {
  const scopeId = normalizeId(options.scopeId) || DEFAULT_SCOPE_ID;
  const moduleId = normalizeId(options.moduleId) || DEFAULT_MODULE_ID;
  const targetAppId = normalizeId(options.targetAppId) || DEFAULT_TARGET_APP_ID;
  const getRegistryElements = typeof options.getRegistryElements === "function" ? options.getRegistryElements : () => options.registryElements || [];
  const getSelectedElement = typeof options.getSelectedElement === "function" ? options.getSelectedElement : () => options.selectedElement || null;
  const layoutState = new Map();

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
      const inspector = createRuntimeInspector({ inspector: options.inspector, inspectorFactory: options.inspectorFactory, registry: snapshot.transformed.registry, scopeId, moduleId, targetAppId, state: layoutState });
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
    const inspector = createRuntimeInspector({ inspector: options.inspector, inspectorFactory: options.inspectorFactory, registry: snapshot.transformed.registry, scopeId, moduleId, targetAppId, state: layoutState });
    return inspector.applyLayoutChange(scopeId, {
      elementId: snapshot.selectedElementId,
      operation: step.operation,
      payload: step.payload,
    });
  }

  return { inspectSelectedElement, getSelectedElementControlPanel, applySelectedElementLayoutAction, getStatus };
}

export const BBM_EDITOR_RUNTIME_INSPECTOR_BRIDGE_ROLE_BY_ID = ROLE_BY_ELEMENT_ID;
