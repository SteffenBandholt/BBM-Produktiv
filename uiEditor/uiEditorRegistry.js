"use strict";

const uiEditorRegistry = Object.freeze({
  uiScopes: Object.freeze([
    Object.freeze({
      uiScopeId: "uiEditor.global",
      label: "UI-Editor globale Elemente",
      elements: Object.freeze([
        Object.freeze({
          id: "uiEditor.launcherButton",
          type: "button",
          role: "editor-launcher",
          area: "overlay",
          position: Object.freeze({ x: 24, y: 24 }),
          editable: true,
          allowedOps: Object.freeze(["move", "hide", "show"]),
          lockedOps: Object.freeze(["delete", "executeTargetAction", "modifyDomainData"]),
        }),
      ]),
    }),
  ]),
});

module.exports = { uiEditorRegistry };
