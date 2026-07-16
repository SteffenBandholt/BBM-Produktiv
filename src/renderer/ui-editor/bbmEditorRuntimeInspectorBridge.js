import { createEditorScopeInspector } from "../editorRuntime/inspector/editorScopeInspector.js";

const DEFAULT_SCOPE_ID = "bbm.main.readonly";
const DEFAULT_MODULE_ID = "bbm.main";
const DEFAULT_TARGET_APP_ID = "bbm-produktiv";

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

const RUNTIME_OPS_BY_ALLOWED_CHANGE = Object.freeze({
  "layout.read": ["move"],
  "layout.save": [],
  "layout.reset": [],
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
  const fromAllowedChanges = cloneList(element?.allowedChanges).flatMap((change) => RUNTIME_OPS_BY_ALLOWED_CHANGE[change] || []);
  return unique(fromAllowedChanges);
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

function createReadonlyHostAdapter(registry) {
  return {
    getRegistry() {
      return registry.map((element) => ({ ...element, allowedOps: [...element.allowedOps], lockedOps: [...element.lockedOps] }));
    },
    getCurrentLayoutState() {
      return [];
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

function createReadonlyInspector({ inspector, inspectorFactory, registry, scopeId, moduleId, targetAppId }) {
  if (inspector) return inspector;
  const catalog = createReadonlyCatalog({ scopeId, moduleId, targetAppId });
  const hostAdapter = createReadonlyHostAdapter(registry);
  const factory = inspectorFactory || createEditorScopeInspector;
  return factory({ catalog, hostAdapterFactory: () => hostAdapter });
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
      return { ok: true, kind: "empty", selectedElement: null, inspectorStatus: "read_only", controls: [], allowedOps: [], message: "Keine Auswahl." };
    }
    const sourceElement = snapshot.registryElements.find((element) => normalizeId(element?.elementId || element?.id) === snapshot.selectedElementId) || null;
    if (!sourceElement) {
      return { ok: false, kind: "blocked", selectedElement: null, elementId: snapshot.selectedElementId, controls: [], allowedOps: [], message: "Ausgewaehlte Element-ID ist nicht in der fuehrenden M51-Registry vorhanden.", reason: "UNKNOWN_SELECTED_ELEMENT" };
    }
    const unsupported = snapshot.transformed.unsupported.find((entry) => entry.elementId === snapshot.selectedElementId);
    if (unsupported) {
      return { ok: false, kind: "unsupported", selectedElement: sourceElement, elementId: snapshot.selectedElementId, controls: [], allowedOps: [], message: "Element ist ohne expliziten Inspector-Vertrag nicht kompatibel.", reason: unsupported.reason };
    }
    return { ok: true, kind: "ready", selectedElement: sourceElement, elementId: snapshot.selectedElementId, sourceCount: snapshot.transformed.sourceCount, registryCount: snapshot.transformed.registry.length, inspectorStatus: "read_only" };
  }

  function inspectSelectedElement() {
    const snapshot = getSnapshot();
    const status = getStatus();
    if (!status.ok || status.kind === "empty") return { ...status, registry: snapshot.transformed.registry };
    try {
      const inspector = createReadonlyInspector({ inspector: options.inspector, inspectorFactory: options.inspectorFactory, registry: snapshot.transformed.registry, scopeId, moduleId, targetAppId });
      const panel = inspector.getLayoutControlPanel(scopeId, snapshot.selectedElementId);
      return {
        ...status,
        scopeId,
        inspectorStatus: panel?.status?.kind || "read_only",
        inspectorElement: panel?.selectedElement || null,
        controlPanel: panel,
        controls: Array.isArray(panel?.controls) ? panel.controls : [],
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

  return { inspectSelectedElement, getSelectedElementControlPanel, getStatus };
}

export const BBM_EDITOR_RUNTIME_INSPECTOR_BRIDGE_ROLE_BY_ID = ROLE_BY_ELEMENT_ID;
