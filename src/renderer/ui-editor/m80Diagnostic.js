import RestarbeitenScreen from "../modules/restarbeiten/screens/RestarbeitenScreen.js";
import { getM80Ref, resetM80PilotWorkingStatesForDiagnostic } from "./m80Refs.js";
import { advanceM80DiagnosticRegistryRevision } from "./m80HostAdapter.js";

const DIAGNOSTIC_FAILURE_TARGET = "restarbeiten.edit.short.field";

const DIAGNOSTIC_ITEM = Object.freeze({
  id: "m80-diagnostic-item",
  running_number: "M80-001",
  item_class: "rest",
  status: "offen",
  short_text: "Fassadenanschluss kontrollieren",
  long_text: "Diagnoseeintrag ohne Datenbank- oder Fachpersistenz.",
  due_date: "2026-08-15",
  responsible_project_firm_id: "m80-diagnostic-firm",
  responsible_label: "M80 Diagnosefirma",
  location_level_1: "Bauteil A",
  location_level_2: "Erdgeschoss",
  location_level_3: "Fassade",
  location_level_4: "Achse 3",
  created_at: "2026-07-26T08:00:00.000Z",
});

export function installBbmM80DiagnosticPilot({ router } = {}) {
  if (!router?.contentRoot) throw new Error("M80-Diagnose braucht den vorhandenen BBM-Inhaltsbereich.");
  resetM80PilotWorkingStatesForDiagnostic();
  const screen = new RestarbeitenScreen({
    router: null,
    projectId: null,
    project: { name: "M80 Diagnoseprojekt" },
    moduleId: "restarbeiten",
  });
  screen.items = [{ ...DIAGNOSTIC_ITEM }];
  screen.responsibleFirms = [{ id: "m80-diagnostic-firm", shortName: "M80 Diagnosefirma" }];
  screen.settings = {};
  screen.render();
  screen._selectItem(DIAGNOSTIC_ITEM.id, { render: false });
  screen.root.setAttribute("data-bbm-m80-diagnostic", "true");
  router.contentRoot.replaceChildren(screen.root);
  screen._renderShell();
  const onControlledFailureKey = (event) => {
    if (!(event.ctrlKey && event.shiftKey && (event.code === "F8" || event.key === "F8"))) return;
    event.preventDefault();
    const ref = getM80Ref(DIAGNOSTIC_FAILURE_TARGET);
    if (!ref?.element) return;
    ref.element.dataset.uiEditorFailNextApply = "true";
    window.removeEventListener("keydown", onControlledFailureKey);
  };
  const onRegistryRevisionKey = (event) => {
    if (!(event.ctrlKey && event.shiftKey && (event.code === "F9" || event.key === "F9"))) return;
    event.preventDefault();
    const revision = advanceM80DiagnosticRegistryRevision();
    screen.root.dataset.bbmM80DiagnosticRegistryRevision = String(revision);
  };
  window.addEventListener("keydown", onControlledFailureKey);
  window.addEventListener("keydown", onRegistryRevisionKey);
  return screen;
}
