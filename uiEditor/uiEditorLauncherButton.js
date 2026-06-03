"use strict";

const UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS = Object.freeze({
  id: "uiEditor.launcherButton",
  type: "button",
  role: "editor-launcher",
  area: "overlay",
  label: "UI-Editor",
  cssClassName: "ui-editor-launcher-button",
  position: Object.freeze({ x: 24, y: 24 }),
});

function cloneLauncherButtonDefaults() {
  return {
    id: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.id,
    type: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.type,
    role: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.role,
    area: UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS.area,
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

module.exports = {
  UI_EDITOR_LAUNCHER_BUTTON_DEFAULTS,
  createUiEditorLauncherButton,
};
