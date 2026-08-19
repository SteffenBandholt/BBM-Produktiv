import { EDITOR_SCOPE_KINDS, isEditorScopeKind } from "../scopes/editorScopeTypes.js";
import { getActiveEditorModuleRegistrations } from "../../app/modules/moduleEditorRegistrations.js";

export const BBM_EDITOR_CATALOG = Object.freeze({
  targetAppId: "bbm",
  modules: Object.freeze(getActiveEditorModuleRegistrations()
    .filter((entry) => Array.isArray(entry.editorRuntimeScopes) && entry.editorRuntimeScopes.length)
    .map((entry) => Object.freeze({
      moduleId: entry.moduleId,
      moduleLabel: entry.moduleLabel,
      scopes: Object.freeze(entry.editorRuntimeScopes.map((scope) => Object.freeze({ ...scope }))),
    }))),
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
