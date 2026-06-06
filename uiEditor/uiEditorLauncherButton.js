"use strict";

(function publishUiEditorLauncherButtonArtifact(root) {
  const UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS = Object.freeze({
    id: "uiEditor.launcherButton",
    name: "UI-Editor Launcher",
    type: "button",
    role: "editor-launcher",
    parentId: "uiEditor.root",
    order: 10,
    visible: true,
    editable: true,
    area: "overlay",
    allowedOps: Object.freeze(["inspect", "move", "hide", "show"]),
    lockedOps: Object.freeze(["rename", "delete", "executeTargetAction", "modifyDomainData"]),
    label: "UI-Editor",
    cssClassName: "ui-editor-launcher-button",
    position: Object.freeze({ x: 24, y: 24 }),
  });

  function cloneLauncherButtonDefaults() {
    return {
      id: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.id,
      name: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.name,
      type: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.type,
      role: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.role,
      parentId: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.parentId,
      order: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.order,
      visible: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.visible,
      editable: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.editable,
      area: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.area,
      allowedOps: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.allowedOps.slice(),
      lockedOps: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.lockedOps.slice(),
      label: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.label,
      cssClassName: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.cssClassName,
      position: {
        x: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.position.x,
        y: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.position.y,
      },
    };
  }

  function createUiEditorLauncherButton(options) {
    const normalizedOptions = options && typeof options === "object" ? options : {};
    const position = normalizedOptions.position && typeof normalizedOptions.position === "object"
      ? normalizedOptions.position
      : UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.position;

    return {
      ...cloneLauncherButtonDefaults(),
      label: typeof normalizedOptions.label === "string" && normalizedOptions.label.trim() !== ""
        ? normalizedOptions.label
        : UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.label,
      position: {
        x: Number.isFinite(position.x) ? position.x : UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.position.x,
        y: Number.isFinite(position.y) ? position.y : UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.position.y,
      },
    };
  }

  const uiEditorLauncherButtonArtifact = Object.freeze({
    UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS,
    createUiEditorLauncherButton,
    uiEditorLauncherButton: createUiEditorLauncherButton(),
  });

  if (typeof module === "object" && module !== null && module.exports) {
    module.exports = uiEditorLauncherButtonArtifact;
  }

  if (root && typeof root === "object") {
    root.uiEditorLauncherButtonArtifact = uiEditorLauncherButtonArtifact;
  }
})(typeof globalThis === "object" ? globalThis : undefined);
