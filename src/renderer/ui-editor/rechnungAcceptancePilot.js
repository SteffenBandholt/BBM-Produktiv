import { openNativeUiEditor } from "../app/coreShellNavigation.js";

const RECHNUNG_ACCEPTANCE_SCOPE_ID = "rechnung.screen";

export async function installRechnungAcceptancePilot({ router } = {}) {
  if (!router?.contentRoot) {
    throw new Error("Rechnung-Acceptance braucht den vorhandenen BBM-Inhaltsbereich.");
  }

  const opened = await router.openGlobalModule("rechnung");
  if (opened !== true) throw new Error("RECHNUNG_ACCEPTANCE_ROUTE_FAILED");

  router.currentView?.root?.setAttribute?.("data-bbm-rechnung-acceptance", "true");
  const editorResult = await openNativeUiEditor({ scopeId: RECHNUNG_ACCEPTANCE_SCOPE_ID });
  if (!editorResult?.ok) throw new Error("RECHNUNG_ACCEPTANCE_UI_EDITOR_OPEN_FAILED");

  return router.currentView;
}
