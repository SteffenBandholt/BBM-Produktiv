import TopsScreen from "../../src/renderer/modules/protokoll/screens/TopsScreen.js";
import {
  inspectM80ScopeRegistration,
  createM80RegistrationDescriptor,
} from "../../src/renderer/ui-editor/m80HostAdapter.js";
import { resetM80PilotWorkingStatesForDiagnostic } from "../../src/renderer/ui-editor/m80Refs.js";

function sampleTops() {
  return [
    {
      id: "diag-title",
      level: 1,
      displayNumber: 1,
      title: "Diagnose Titel",
      longtext: "Titeltext",
      created_at: "2026-08-09",
    },
    {
      id: "diag-top",
      level: 2,
      displayNumber: "1.1",
      title: "Diagnose TOP",
      longtext: "Diagnose Langtext",
      created_at: "2026-08-09",
      due_date: "2026-08-12",
      status: "offen",
      responsible_label: "Diagnose",
      is_task: 0,
      is_decision: 0,
    },
  ];
}

export async function runProtokollEditorRegistryDiagnostic() {
  resetM80PilotWorkingStatesForDiagnostic();
  document.documentElement.style.height = "100%";
  document.body.replaceChildren();
  document.body.style.cssText = "margin:0;min-width:1400px;height:100%;font-size:14px";

  const screen = new TopsScreen({ projectId: "diag", meetingId: "diag" });
  screen.store.setState({
    tops: sampleTops(),
    selectedTopId: "diag-top",
    showAmpelInList: true,
    showLongtextInList: true,
    meetingMeta: {
      meeting_number: 1,
      meeting_date: "2026-08-09",
      keyword: "Diagnose",
      context_label: "Diagnose",
    },
  });

  document.body.appendChild(screen.render());
  await new Promise((resolve) => setTimeout(resolve, 0));

  const scope = inspectM80ScopeRegistration("protokoll.edit.root");
  const registration = createM80RegistrationDescriptor();
  const resolvedScope =
    registration.registryScopes.find((entry) => entry.scopeId === "protokoll.edit.root") || null;

  return {
    activeScopeIds: scope.activeScopeIds,
    expectedElementCount: scope.expectedElementIds.length,
    presentElementCount: scope.presentElementIds.length,
    missingElementIds: scope.missingElementIds,
    registrationReason: scope.registrationReason,
    componentReferenceErrors: scope.componentReferenceErrors,
    resolvedScopeStatus: resolvedScope?.status || null,
    shortCounter:
      scope.elements.find((entry) => entry.id === "protokoll.edit.short.counter") || null,
    longCounter:
      scope.elements.find((entry) => entry.id === "protokoll.edit.long.counter") || null,
  };
}
