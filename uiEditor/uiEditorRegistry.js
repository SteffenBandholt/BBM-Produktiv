"use strict";

const uiEditorRegistry = Object.freeze({
  uiScopes: Object.freeze([
    Object.freeze({
      uiScopeId: "uiEditor.global",
      label: "UI-Editor globale Elemente",
      elements: Object.freeze([
        Object.freeze({
          id: "uiEditor.root",
          name: "UI-Editor Root",
          type: "root",
          role: "system",
          parentId: null,
          order: 0,
          visible: true,
          editable: false,
          allowedOps: Object.freeze(["inspect"]),
          lockedOps: Object.freeze([]),
        }),
        Object.freeze({
          id: "uiEditor.launcherButton",
          name: "UI-Editor Launcher",
          type: "button",
          role: "editor-launcher",
          parentId: "uiEditor.root",
          order: 10,
          visible: true,
          editable: true,
          area: "overlay",
          position: Object.freeze({ x: 24, y: 24 }),
          allowedOps: Object.freeze(["inspect", "move", "hide", "show"]),
          lockedOps: Object.freeze(["rename", "delete", "executeTargetAction", "modifyDomainData"]),
        }),
      ]),
    }),
  ]),
});

module.exports = { uiEditorRegistry };
