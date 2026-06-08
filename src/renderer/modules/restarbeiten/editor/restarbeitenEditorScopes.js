import { getRestarbeitenMainUiRegistry } from "./registries/restarbeitenMainUiRegistry.js";

export const RESTARBEITEN_MAIN_UI_SCOPE_ID = "restarbeiten.ui.main";

export function getRestarbeitenEditorScopes() {
  return [
    {
      moduleId: "restarbeiten",
      scopeId: RESTARBEITEN_MAIN_UI_SCOPE_ID,
      scopeLabel: "Restarbeiten Hauptansicht",
      kind: "ui",
      status: "ready",
      registry: getRestarbeitenMainUiRegistry(),
    },
  ];
}

export { getRestarbeitenMainUiRegistry };
