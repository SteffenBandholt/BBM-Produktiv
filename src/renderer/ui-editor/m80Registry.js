import { getActiveEditorModuleRegistrations, getBlockedEditorScopes } from "../app/modules/moduleEditorRegistrations.js";
import { createUiEditorRegistrationModel } from "./uiEditorRegistrationModel.js";

const model = createUiEditorRegistrationModel(
  getActiveEditorModuleRegistrations().map((entry) => entry?.uiEditor).filter(Boolean),
  { blockedScopes: getBlockedEditorScopes() }
);

export const BBM_M80_REGISTRY_VERSION = model.registryVersion;
export const BBM_M80_REGISTRY_STATUS = "incomplete";
export const BBM_M83_COMPONENT_CONTRACTS = model.componentContracts;
export const BBM_M80_ACTIVE_SCOPES = model.activeScopes;
export const BBM_M80_ACTIVE_SCOPE_GROUPS = model.activeScopeGroups;
export const BBM_M80_REGISTRY_SCOPES = model.scopes;

export function getM80RegistryEntry(id) {
  return model.getEntry(id);
}

export function getM83ComponentContract(componentId) {
  return model.getComponent(componentId);
}

export function listM83ComponentContracts() {
  return [...model.aggregate.components];
}

export function listM80ProfileMigrations() {
  return model.profileMigrations.map((entry) => ({ ...entry }));
}

export function getM80ScopeGroupRegistration(scopeId) {
  const registration = model.getScopeGroup(scopeId);
  if (!registration) return null;
  return { scopeGroupId: registration.scopeGroupId, layoutStorageKey: registration.layoutStorageKey, pdfDocumentTypeId: registration.pdfDocumentTypeId || "", scopeIds: [...registration.scopeIds] };
}

export function getM80LauncherRegistration(scopeId) {
  const launcher = model.getLauncher(scopeId);
  return launcher ? { componentId: launcher.componentId, scopeId: launcher.scopeId, elementId: launcher.elementId } : null;
}

export function listM80RegistryScopes() {
  return BBM_M80_REGISTRY_SCOPES.map((scope) => ({
    ...scope,
    componentIds: [...(scope.componentIds || [])],
    expectedElementIds: [...scope.expectedElementIds],
    elements: scope.elements.map((entry) => ({
      ...entry,
      baseline: { ...entry.baseline, spacing: { ...(entry.baseline?.spacing || {}) } },
      spacingTargets: [...(entry.spacingTargets || [])],
      allowedOps: [...entry.allowedOps],
      lockedOps: [...entry.lockedOps],
    })),
  }));
}

export function m80EditorAttributes(id) {
  const entry = getM80RegistryEntry(id);
  if (!entry) throw new Error(`Nicht registrierte M80-ID: ${id}`);
  return Object.freeze({
    "data-ui-inspector-id": entry.id,
    "data-ui-editor-kind": entry.type,
    "data-ui-editor-label": entry.name,
    "data-ui-editor-parent": entry.parentId || "",
    "data-ui-editor-editable": String(entry.editable),
    "data-ui-editor-ops": entry.allowedOps.join(","),
  });
}
