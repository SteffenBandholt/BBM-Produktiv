import { seedProtokollAcceptanceData } from "./protokollAcceptanceSeeder.js";
import { openNativeUiEditor } from "../app/coreShellNavigation.js";

export async function installProtokollAcceptancePilot({ router, isolatedAcceptance = false } = {}) {
  if (!router?.contentRoot) {
    throw new Error("M86-Protokoll-Acceptance braucht den vorhandenen BBM-Inhaltsbereich.");
  }
  const acceptance = await seedProtokollAcceptanceData({
    api: window.bbmDb || {},
    isolatedAcceptance,
  });
  const opened = await router.showTops(acceptance.meeting.id, acceptance.project.id);
  if (opened !== true) throw new Error("M86_ACCEPTANCE_PROTOCOL_ROUTE_FAILED");
  router.currentView?.root?.setAttribute?.("data-bbm-m86-protokoll-acceptance", "true");
  const editorResult = await openNativeUiEditor({
    projectId: acceptance.project.id,
    meetingId: acceptance.meeting.id,
  });
  if (!editorResult?.ok) throw new Error("M86_ACCEPTANCE_UI_EDITOR_OPEN_FAILED");
  return router.currentView;
}
