import { getProtokollTopsUiRegistry } from "./registries/protokollTopsUiRegistry.js";

export const PROTOKOLL_TOPS_UI_SCOPE_ID = "protokoll.topsScreen";

export function getProtokollEditorScopes() {
  return [
    {
      moduleId: "protokoll",
      scopeId: PROTOKOLL_TOPS_UI_SCOPE_ID,
      scopeLabel: "Protokoll TOPS",
      kind: "ui",
      status: "ready",
      registry: getProtokollTopsUiRegistry(),
    },
  ];
}

export { getProtokollTopsUiRegistry };
