import { EDITOR_SCOPE_KINDS, isEditorScopeKind } from "../scopes/editorScopeTypes.js";
import { getProtokollTopsUiRegistry, PROTOKOLL_TOPS_UI_SCOPE_ID } from "../../modules/protokoll/editor/protokollEditorScopes.js";
import { getRestarbeitenMainUiRegistry, RESTARBEITEN_MAIN_UI_SCOPE_ID } from "../../modules/restarbeiten/editor/restarbeitenEditorScopes.js";

export const BBM_EDITOR_CATALOG = Object.freeze({
  targetAppId: "bbm",
  modules: Object.freeze([
    Object.freeze({
      moduleId: "protokoll",
      moduleLabel: "Protokoll",
      scopes: Object.freeze([
        Object.freeze({
          scopeId: PROTOKOLL_TOPS_UI_SCOPE_ID,
          scopeLabel: "Protokoll TOPS",
          kind: "ui",
          registry: getProtokollTopsUiRegistry(),
          status: "ready",
        }),
      ]),
    }),
    Object.freeze({
      moduleId: "restarbeiten",
      moduleLabel: "Restarbeiten",
      scopes: Object.freeze([
        Object.freeze({
          scopeId: RESTARBEITEN_MAIN_UI_SCOPE_ID,
          scopeLabel: "Restarbeiten Hauptansicht",
          kind: "ui",
          registry: getRestarbeitenMainUiRegistry(),
          status: "ready",
        }),
      ]),
    }),
  ]),
});

export function listEditorModules() {
  return BBM_EDITOR_CATALOG.modules.map((module) => ({ ...module }));
}

export function listEditorScopes() {
  const scopes = [];
  for (const module of BBM_EDITOR_CATALOG.modules) {
    for (const scope of module.scopes || []) {
      scopes.push({
        ...scope,
        moduleId: module.moduleId,
        moduleLabel: module.moduleLabel,
      });
    }
  }
  return scopes;
}

export function findEditorScope(scopeId) {
  const needle = String(scopeId || "");
  for (const module of BBM_EDITOR_CATALOG.modules) {
    for (const scope of module.scopes || []) {
      if (scope.scopeId === needle) {
        return {
          ...scope,
          moduleId: module.moduleId,
          moduleLabel: module.moduleLabel,
        };
      }
    }
  }
  return null;
}

export { EDITOR_SCOPE_KINDS, isEditorScopeKind };
