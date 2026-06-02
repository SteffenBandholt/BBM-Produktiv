"use strict";

const launcherButton = Object.freeze({
  id: "uiEditor.launcherButton",
  type: "button",
  role: "editor-launcher",
  area: "overlay",
  position: Object.freeze({
    x: 24,
    y: 24,
  }),
  editable: true,
  allowedOps: Object.freeze(["move", "hide", "show"]),
  lockedOps: Object.freeze(["delete", "executeTargetAction", "modifyDomainData"]),
});

const globalScope = Object.freeze({
  id: "uiEditor.global",
  uiScope: "uiEditor.global",
  label: "UI-Editor",
  elements: Object.freeze([launcherButton]),
});

const uiEditorRegistry = Object.freeze({
  registryId: "uiEditor.installedArtifacts",
  registryVersion: "1.0.0",
  uiScopes: Object.freeze([globalScope]),
});

module.exports = {
  uiEditorRegistry,
};
