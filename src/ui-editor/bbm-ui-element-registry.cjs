"use strict";

const { BBM_UI_SCOPE, BBM_LAYOUT_SCOPE, BBM_LAYOUT_PROFILE_ID } = require("./bbm-ui-editor-manifest.cjs");

const ALLOWED_LAYOUT_OPS = Object.freeze(["layout.read", "layout.save", "layout.reset"]);
const KIT_ALLOWED_OPS = Object.freeze(["inspect"]);
const KIT_LOCKED_OPS = Object.freeze([
  "show",
  "hide",
  "move",
  "resize",
  "reorder",
  "rename",
  "changeWidth",
  "pin",
  "unpin",
  "reset",
  "applyPreset",
  "delete",
  "executeTargetAction",
  "modifyDomainData",
]);


const M64_TEST_ELEMENTS = Object.freeze([
  Object.freeze({
    elementId: "bbm.uiEditorTest.workspace",
    type: "container",
    role: "test-workspace",
    label: "UI-Editor-Testfläche",
    scope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    parentId: "bbm.main.content",
    capabilities: Object.freeze(["select", "layout"]),
    allowedChanges: ALLOWED_LAYOUT_OPS,
    allowedOps: Object.freeze([]),
    lockedOps: Object.freeze(["move", "resize", "hide", "delete"]),
    editable: false,
    layoutDefaults: Object.freeze({ visible: true }),
    sourceRef: "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
  }),
  Object.freeze({
    elementId: "bbm.uiEditorTest.card",
    type: "container",
    role: "content",
    label: "Testkarte",
    scope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    parentId: "bbm.uiEditorTest.workspace",
    capabilities: Object.freeze(["select", "layout"]),
    allowedChanges: ALLOWED_LAYOUT_OPS,
    allowedOps: Object.freeze(["move", "resize"]),
    lockedOps: Object.freeze(["delete"]),
    editable: true,
    layoutDefaults: Object.freeze({ visible: true, width: 300, height: 300, minWidth: 80, minHeight: 80 }),
    sourceRef: "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
  }),
  Object.freeze({ elementId: "bbm.uiEditorTest.card.title", type: "text", role: "heading", label: "Überschrift", parentId: "bbm.uiEditorTest.card", editable: true, allowedOps: Object.freeze(["move", "resize"]), lockedOps: Object.freeze(["delete", "execute"]), layoutDefaults: Object.freeze({ visible: true, width: 240, height: 36, minWidth: 80, minHeight: 24 }), sourceRef: "src/renderer/ui-editor/BbmUiEditorStatusPanel.js", scope: BBM_UI_SCOPE, layoutScope: BBM_LAYOUT_SCOPE, layoutProfileId: BBM_LAYOUT_PROFILE_ID, capabilities: Object.freeze(["select", "layout"]), allowedChanges: ALLOWED_LAYOUT_OPS }),
  Object.freeze({ elementId: "bbm.uiEditorTest.card.text", type: "text", role: "content", label: "Beispieltext", parentId: "bbm.uiEditorTest.card", editable: true, allowedOps: Object.freeze(["move", "resize"]), lockedOps: Object.freeze(["delete", "execute"]), layoutDefaults: Object.freeze({ visible: true, width: 250, height: 54, minWidth: 80, minHeight: 24 }), sourceRef: "src/renderer/ui-editor/BbmUiEditorStatusPanel.js", scope: BBM_UI_SCOPE, layoutScope: BBM_LAYOUT_SCOPE, layoutProfileId: BBM_LAYOUT_PROFILE_ID, capabilities: Object.freeze(["select", "layout"]), allowedChanges: ALLOWED_LAYOUT_OPS }),
  Object.freeze({ elementId: "bbm.uiEditorTest.card.button", type: "action", role: "visual-control", label: "Beispielbutton", parentId: "bbm.uiEditorTest.card", editable: true, allowedOps: Object.freeze(["move", "resize"]), lockedOps: Object.freeze(["execute", "delete"]), layoutDefaults: Object.freeze({ visible: true, width: 150, height: 40, minWidth: 80, minHeight: 24 }), sourceRef: "src/renderer/ui-editor/BbmUiEditorStatusPanel.js", scope: BBM_UI_SCOPE, layoutScope: BBM_LAYOUT_SCOPE, layoutProfileId: BBM_LAYOUT_PROFILE_ID, capabilities: Object.freeze(["select", "layout"]), allowedChanges: ALLOWED_LAYOUT_OPS }),
  Object.freeze({ elementId: "bbm.uiEditorTest.card.input", type: "field", role: "input", label: "Eingabefeld", parentId: "bbm.uiEditorTest.card", editable: true, allowedOps: Object.freeze(["move", "resize"]), lockedOps: Object.freeze(["write", "submit", "delete"]), layoutDefaults: Object.freeze({ visible: true, width: 220, height: 40, minWidth: 80, minHeight: 24 }), sourceRef: "src/renderer/ui-editor/BbmUiEditorStatusPanel.js", scope: BBM_UI_SCOPE, layoutScope: BBM_LAYOUT_SCOPE, layoutProfileId: BBM_LAYOUT_PROFILE_ID, capabilities: Object.freeze(["select", "layout"]), allowedChanges: ALLOWED_LAYOUT_OPS }),
  Object.freeze({ elementId: "bbm.uiEditorTest.card.select", type: "field", role: "select", label: "Auswahlfeld", parentId: "bbm.uiEditorTest.card", editable: true, allowedOps: Object.freeze(["move", "resize"]), lockedOps: Object.freeze(["change-data", "submit", "delete"]), layoutDefaults: Object.freeze({ visible: true, width: 220, height: 40, minWidth: 80, minHeight: 24 }), sourceRef: "src/renderer/ui-editor/BbmUiEditorStatusPanel.js", scope: BBM_UI_SCOPE, layoutScope: BBM_LAYOUT_SCOPE, layoutProfileId: BBM_LAYOUT_PROFILE_ID, capabilities: Object.freeze(["select", "layout"]), allowedChanges: ALLOWED_LAYOUT_OPS }),
  Object.freeze({ elementId: "bbm.uiEditorTest.table", type: "table", role: "content-table", label: "Beispieltabelle", parentId: "bbm.uiEditorTest.workspace", editable: true, allowedOps: Object.freeze(["move", "resize"]), lockedOps: Object.freeze(["edit-data", "delete"]), layoutDefaults: Object.freeze({ visible: true, width: 420, height: 170, minWidth: 160, minHeight: 80 }), sourceRef: "src/renderer/ui-editor/BbmUiEditorStatusPanel.js", scope: BBM_UI_SCOPE, layoutScope: BBM_LAYOUT_SCOPE, layoutProfileId: BBM_LAYOUT_PROFILE_ID, capabilities: Object.freeze(["select", "layout"]), allowedChanges: ALLOWED_LAYOUT_OPS }),
]);

const BBM_UI_ELEMENTS = Object.freeze([
  Object.freeze({
    elementId: "bbm.main.shell",
    type: "frame",
    label: "BBM Hauptrahmen",
    scope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    parentId: null,
    capabilities: Object.freeze(["select", "layout"]),
    allowedChanges: ALLOWED_LAYOUT_OPS,
    layoutDefaults: Object.freeze({ visible: true }),
    sourceRef: "src/renderer/app/CoreShell.js",
  }),
  Object.freeze({
    elementId: "bbm.main.navigation",
    type: "navigation",
    label: "Hauptnavigation",
    scope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    parentId: "bbm.main.shell",
    capabilities: Object.freeze(["select", "layout"]),
    allowedChanges: ALLOWED_LAYOUT_OPS,
    layoutDefaults: Object.freeze({ visible: true }),
    sourceRef: "src/renderer/app/CoreShell.js",
  }),
  Object.freeze({
    elementId: "bbm.main.header",
    type: "header",
    label: "Seitenkopf",
    scope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    parentId: "bbm.main.shell",
    capabilities: Object.freeze(["select", "layout"]),
    allowedChanges: ALLOWED_LAYOUT_OPS,
    layoutDefaults: Object.freeze({ visible: true }),
    sourceRef: "src/renderer/app/CoreShell.js",
  }),
  Object.freeze({
    elementId: "bbm.main.content",
    type: "content",
    label: "Inhaltsbereich",
    scope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    parentId: "bbm.main.shell",
    capabilities: Object.freeze(["select", "layout"]),
    allowedChanges: ALLOWED_LAYOUT_OPS,
    layoutDefaults: Object.freeze({ visible: true }),
    sourceRef: "src/renderer/app/CoreShell.js",
  }),

  ...M64_TEST_ELEMENTS,
  Object.freeze({
    elementId: "bbm.main.actions",
    type: "actions",
    label: "Aktionsbereich",
    scope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    parentId: "bbm.main.content",
    capabilities: Object.freeze(["select", "layout"]),
    allowedChanges: ALLOWED_LAYOUT_OPS,
    layoutDefaults: Object.freeze({ visible: true }),
    sourceRef: "src/renderer/app/CoreShell.js",
  }),
]);

const KIT_TYPE_BY_BBM_TYPE = Object.freeze({
  frame: "root",
  navigation: "area",
  header: "area",
  content: "area",
  container: "group",
  root: "root",
  text: "label",
  field: "field",
  table: "table",
  actions: "area",
  action: "button",
});

const KIT_ROLE_BY_BBM_TYPE = Object.freeze({
  frame: "layout",
  navigation: "navigation",
  header: "layout",
  content: "content",
  container: "content",
  root: "layout",
  text: "content",
  field: "content",
  table: "content",
  actions: "action",
  action: "action",
});

function cloneElement(element) {
  return {
    ...element,
    capabilities: [...element.capabilities],
    allowedChanges: [...element.allowedChanges],
    ...(Array.isArray(element.allowedOps) ? { allowedOps: [...element.allowedOps] } : {}),
    ...(Array.isArray(element.lockedOps) ? { lockedOps: [...element.lockedOps] } : {}),
    ...(Object.prototype.hasOwnProperty.call(element, "editable") ? { editable: Boolean(element.editable) } : {}),
    ...(element.role ? { role: element.role } : {}),
    layoutDefaults: { ...element.layoutDefaults },
  };
}

function toKitLockedOps(element, allowedOps) {
  const mapped = Array.isArray(element.lockedOps) ? element.lockedOps.flatMap((op) => {
    if (["move", "resize", "hide", "show", "delete", "rename", "reset", "inspect", "reorder", "changeWidth", "pin", "unpin", "applyPreset"].includes(op)) return [op];
    if (op === "execute") return ["executeTargetAction"];
    if (["write", "submit", "change-data", "edit-data"].includes(op)) return ["modifyDomainData"];
    return [];
  }) : KIT_LOCKED_OPS;
  const allowedSet = new Set(Array.isArray(allowedOps) ? allowedOps : []);
  return [...new Set(mapped)].filter((op) => !allowedSet.has(op));
}

function toKitElement(element, order) {
  const allowedOps = Array.isArray(element.allowedOps) ? [...element.allowedOps] : [...KIT_ALLOWED_OPS];
  return {
    id: element.elementId,
    name: element.label,
    type: KIT_TYPE_BY_BBM_TYPE[element.type] || "area",
    role: KIT_ROLE_BY_BBM_TYPE[element.type] || "layout",
    parentId: element.parentId,
    order,
    visible: element.layoutDefaults?.visible !== false,
    editable: Boolean(element.editable),
    allowedOps,
    lockedOps: toKitLockedOps(element, allowedOps),
    uiScope: element.scope,
    layoutScope: element.layoutScope,
  };
}

function createRegistryResult(elements) {
  const clonedElements = elements.map(cloneElement);
  const kitElements = elements.map(toKitElement);
  return {
    ok: true,
    registryMode: "explicit",
    autoDiscovery: false,
    uiScope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    elements: clonedElements,
    listElements() {
      return kitElements.map((element) => ({ ...element, allowedOps: [...element.allowedOps], lockedOps: [...element.lockedOps] }));
    },
    getElementById(elementId) {
      const element = kitElements.find((entry) => entry.id === elementId);
      return element ? { ...element, allowedOps: [...element.allowedOps], lockedOps: [...element.lockedOps] } : null;
    },
    size() {
      return kitElements.length;
    },
  };
}

function getBbmUiElementRegistry(uiScope = BBM_UI_SCOPE) {
  if (uiScope !== BBM_UI_SCOPE) {
    return { ok: false, uiScope, elements: [], blockCode: "BBM_UI_SCOPE_UNKNOWN", listElements: () => [], getElementById: () => null, size: () => 0 };
  }
  return createRegistryResult(BBM_UI_ELEMENTS);
}

function findBbmUiElement(elementId, uiScope = BBM_UI_SCOPE) {
  return getBbmUiElementRegistry(uiScope).elements.find((element) => element.elementId === elementId) || null;
}

module.exports = { BBM_UI_ELEMENTS, getBbmUiElementRegistry, findBbmUiElement };
