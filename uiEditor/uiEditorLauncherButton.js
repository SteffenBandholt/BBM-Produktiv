"use strict";

(function registerUiEditorLauncherButton(root, factory) {
  const artifact = factory();
  if (typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = artifact;
  }
  if (root && typeof root === "object") {
    root.uiEditorLauncherButtonArtifact = artifact;
  }
})(typeof globalThis === "object" ? globalThis : undefined, function createUiEditorLauncherButtonArtifact() {
  const uiEditorLauncherButton = Object.freeze({
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

  return {
    uiEditorLauncherButton,
  };
});
