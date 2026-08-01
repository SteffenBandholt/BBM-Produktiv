import RestarbeitenScreen from "../modules/restarbeiten/screens/RestarbeitenScreen.js";
import TopsScreen from "../modules/protokoll/screens/TopsScreen.js";
import { editorFromTop } from "../modules/protokoll/editorFromTop.js";
import { getM80Ref } from "./m80Refs.js";
import { advanceM80DiagnosticRegistryRevision, emitM80RegistryEvent, refreshM80StartupLayoutAfterRegistryMount } from "./m80HostAdapter.js";

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

const DIAGNOSTIC_ITEMS = Object.freeze(Array.from({ length: 60 }, (_value, index) => Object.freeze({
  ...DIAGNOSTIC_ITEM,
  id: index === 0 ? DIAGNOSTIC_ITEM.id : `m80-diagnostic-item-${index + 1}`,
  running_number: `M80-${String(index + 1).padStart(3, "0")}`,
  short_text: index === 0 ? DIAGNOSTIC_ITEM.short_text : `Kontrollierter Diagnoseeintrag ${index + 1}`,
  long_text: `${DIAGNOSTIC_ITEM.long_text} Listenzeile ${index + 1}.`,
})));

export async function installBbmM80DiagnosticPilot({ router, module = "restarbeiten" } = {}) {
  return await installBbmM80DiagnosticModule({ router, module });
}

function createProtokollDiagnosticRepository() {
  const tops = [
    { id: "m84-protokoll-1", level: 1, title: "Diagnose-TOP", longtext: "Isolierte Sichtprüfung des bestehenden Protokoll-Layouts.", status: "-", is_carried_over: 0, parent_top_id: null },
    { id: "m84-protokoll-1-1", level: 2, title: "Unterpunkt Diagnose", longtext: "Bestehende Listen- und Editbox-Struktur.", status: "-", is_carried_over: 0, parent_top_id: "m84-protokoll-1" },
    { id: "m84-protokoll-2", level: 1, title: "Weiterer Diagnose-TOP", longtext: "Keine Fachpersistenz.", status: "-", is_carried_over: 0, parent_top_id: null },
  ];
  return Object.freeze({
    loadByMeeting: async () => ({ ok: true, meeting: { id: "m84-protokoll-meeting", is_closed: 0 }, list: tops.map((top) => ({ ...top })) }),
    saveTop: async () => ({ ok: true }),
  });
}

async function installProtokollDiagnosticPilot({ router }) {
  if (!router?.contentRoot) throw new Error("M84-Protokoll-Diagnose braucht den vorhandenen BBM-Inhaltsbereich.");
  const screen = new TopsScreen({
    router: { context: { projectLabel: "M84 Diagnoseprojekt" } },
    projectId: "m84-protokoll-project",
    meetingId: "m84-protokoll-meeting",
    topsRepository: createProtokollDiagnosticRepository(),
    assigneeDataSource: { loadCompaniesByProject: async () => [], loadEmployeesByCompany: async () => [] },
  });
  screen.render();
  router.contentRoot.replaceChildren(screen.root);
  await screen.commands.loadTops({ meetingId: screen.meetingId, projectId: screen.projectId });
  screen.commands.selectTop("m84-protokoll-1");
  const selected = screen.store.getState().tops.find((top) => String(top.id) === "m84-protokoll-1");
  screen.commands.updateDraft(editorFromTop(selected));
  screen._syncScreenState();
  screen.root.setAttribute("data-bbm-m84-protokoll-diagnostic", "true");
  return screen;
}

export async function installBbmM80DiagnosticModule({ router, module = "restarbeiten" } = {}) {
  if (module === "protokoll") return installProtokollDiagnosticPilot({ router });
  if (!router?.contentRoot) throw new Error("M80-Diagnose braucht den vorhandenen BBM-Inhaltsbereich.");
  const screen = new RestarbeitenScreen({
    router: null,
    projectId: null,
    project: { name: "M80 Diagnoseprojekt" },
    moduleId: "restarbeiten",
  });
  screen.items = DIAGNOSTIC_ITEMS.map((item) => ({ ...item }));
  screen.responsibleFirms = [{ id: "m80-diagnostic-firm", shortName: "M80 Diagnosefirma" }];
  screen.settings = {};
  screen.render();
  screen._selectItem(DIAGNOSTIC_ITEM.id, { render: false });
  screen.root.setAttribute("data-bbm-m80-diagnostic", "true");
  router.contentRoot.replaceChildren(screen.root);
  screen._renderShell();
  void refreshM80StartupLayoutAfterRegistryMount();
  const onControlledFailureKey = (event) => {
    if (!(event.ctrlKey && event.shiftKey && (event.code === "F8" || event.key === "F8"))) return;
    event.preventDefault();
    const ref = getM80Ref(DIAGNOSTIC_FAILURE_TARGET);
    if (!ref?.element) return;
    ref.element.dataset.uiEditorFailNextApply = "true";
    window.removeEventListener("keydown", onControlledFailureKey);
  };
  const onRegistryRevisionKey = async (event) => {
    if (!(event.ctrlKey && event.shiftKey && (event.code === "F9" || event.key === "F9"))) return;
    event.preventDefault();
    const revision = advanceM80DiagnosticRegistryRevision();
    screen.root.dataset.bbmM80DiagnosticRegistryRevision = String(revision);
    await emitM80RegistryEvent("registryChanged");
  };
  window.addEventListener("keydown", onControlledFailureKey);
  window.addEventListener("keydown", onRegistryRevisionKey);
  return screen;
}
