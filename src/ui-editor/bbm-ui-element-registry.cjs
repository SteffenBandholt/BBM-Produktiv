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

  Object.freeze({
    elementId: "bbm.uiEditorTest.card",
    type: "content",
    label: "Testkarte",
    scope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    parentId: "bbm.main.content",
    capabilities: Object.freeze(["select", "layout"]),
    allowedChanges: ALLOWED_LAYOUT_OPS,
    allowedOps: Object.freeze(["move", "resize"]),
    layoutDefaults: Object.freeze({ visible: true, width: 300, height: 180, minWidth: 80, minHeight: 80 }),
    sourceRef: "src/renderer/ui-editor/BbmUiEditorStatusPanel.js",
  }),
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
  actions: "area",
});

const KIT_ROLE_BY_BBM_TYPE = Object.freeze({
  frame: "layout",
  navigation: "navigation",
  header: "layout",
  content: "content",
  actions: "action",
});

function cloneElement(element) {
  return {
    ...element,
    capabilities: [...element.capabilities],
    allowedChanges: [...element.allowedChanges],
    ...(Array.isArray(element.allowedOps) ? { allowedOps: [...element.allowedOps] } : {}),
    layoutDefaults: { ...element.layoutDefaults },
  };
}

function toKitElement(element, order) {
  return {
    id: element.elementId,
    name: element.label,
    type: KIT_TYPE_BY_BBM_TYPE[element.type] || "area",
    role: KIT_ROLE_BY_BBM_TYPE[element.type] || "layout",
    parentId: element.parentId,
    order,
    visible: element.layoutDefaults?.visible !== false,
    editable: false,
    allowedOps: [...KIT_ALLOWED_OPS],
    lockedOps: [...KIT_LOCKED_OPS],
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
