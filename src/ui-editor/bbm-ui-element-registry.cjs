"use strict";

const { BBM_UI_SCOPE, BBM_LAYOUT_SCOPE, BBM_LAYOUT_PROFILE_ID } = require("./bbm-ui-editor-manifest.cjs");

const ALLOWED_LAYOUT_OPS = Object.freeze(["layout.read", "layout.save", "layout.reset"]);

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

function cloneElement(element) {
  return {
    ...element,
    capabilities: [...element.capabilities],
    allowedChanges: [...element.allowedChanges],
    layoutDefaults: { ...element.layoutDefaults },
  };
}

function getBbmUiElementRegistry(uiScope = BBM_UI_SCOPE) {
  if (uiScope !== BBM_UI_SCOPE) {
    return { ok: false, uiScope, elements: [], blockCode: "BBM_UI_SCOPE_UNKNOWN" };
  }
  return {
    ok: true,
    registryMode: "explicit",
    autoDiscovery: false,
    uiScope: BBM_UI_SCOPE,
    layoutScope: BBM_LAYOUT_SCOPE,
    layoutProfileId: BBM_LAYOUT_PROFILE_ID,
    elements: BBM_UI_ELEMENTS.map(cloneElement),
  };
}

function findBbmUiElement(elementId, uiScope = BBM_UI_SCOPE) {
  return getBbmUiElementRegistry(uiScope).elements.find((element) => element.elementId === elementId) || null;
}

module.exports = { BBM_UI_ELEMENTS, getBbmUiElementRegistry, findBbmUiElement };
