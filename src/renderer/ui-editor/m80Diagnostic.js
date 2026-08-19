import RestarbeitenScreen from "../modules/restarbeiten/screens/RestarbeitenScreen.js";
import { bindDevelopmentUiEditorOpenButtonRef } from "../app/coreShellNavigation.js";
import { getM80Ref } from "./m80Refs.js";
import { advanceM80DiagnosticRegistryRevision, createM80RegistrationDescriptor, emitM80RegistryEvent, refreshM80StartupLayoutAfterRegistryMount } from "./m80HostAdapter.js";
import { installProtokollAcceptancePilot } from "./protokollAcceptancePilot.js";

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

export async function installBbmM80DiagnosticPilot({ router, module = "restarbeiten", isolatedAcceptance = false } = {}) {
  return await installBbmM80DiagnosticModule({ router, module, isolatedAcceptance });
}

export async function installBbmM80DiagnosticModule({ router, module = "restarbeiten", isolatedAcceptance = false } = {}) {
  if (module === "protokoll") return installProtokollAcceptancePilot({ router, isolatedAcceptance });
  console.info(`[ui-editor] restarbeiten diagnostic start: isolated=${isolatedAcceptance === true}`);
  if (!router?.contentRoot) throw new Error("M80-Diagnose braucht den vorhandenen BBM-Inhaltsbereich.");
  router._setSidebarVisibility?.(false);
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
  if (isolatedAcceptance === true) {
    const editorLauncher = document.createElement("button");
    editorLauncher.type = "button";
    editorLauncher.textContent = "UI-Editor öffnen";
    editorLauncher.setAttribute("data-bbm-ui-editor-acceptance-launcher", "true");
    screen.root.prepend(editorLauncher);
    if (!bindDevelopmentUiEditorOpenButtonRef({ scopeId: "restarbeiten.header.root", button: editorLauncher })) {
      throw new Error("M86_ACCEPTANCE_UI_EDITOR_LAUNCHER_BIND_FAILED");
    }
  }
  console.info("[ui-editor] restarbeiten diagnostic rendered");
  const startupRestore = refreshM80StartupLayoutAfterRegistryMount();
  if (isolatedAcceptance === true) {
    await startupRestore;
    console.info("[ui-editor] restarbeiten diagnostic startup restore completed");
    const registration = createM80RegistrationDescriptor();
    console.info(`[ui-editor] restarbeiten diagnostic registry: status=${registration.registryStatus}, scopes=${registration.activeScopes.join(",")}`);
    const missingBaselines = registration.registryScopes.flatMap((scope) => (scope.elements || []).filter((entry) =>
      (entry?.baseline?.width === null && !(Number(entry?.capturedBaseline?.width) > 0)) ||
      (entry?.baseline?.height === null && !(Number(entry?.capturedBaseline?.height) > 0))
    ).map((entry) => entry.id));
    console.info(`[ui-editor] restarbeiten diagnostic missing baselines: ${missingBaselines.join(",") || "none"}`);
    const editorResult = await window.uiEditor.open(registration);
    console.info(`[ui-editor] restarbeiten diagnostic editor open: ok=${editorResult?.ok === true}, code=${editorResult?.errorCode || "none"}`);
    if (!editorResult?.ok) throw new Error("M86_ACCEPTANCE_UI_EDITOR_OPEN_FAILED");
  }
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
    const revision = advanceM80DiagnosticRegistryRevision({
      elementId: DIAGNOSTIC_FAILURE_TARGET.replace("short.field", "validation"),
      baseline: { maxWidth: 1201 },
    });
    screen.root.dataset.bbmM80DiagnosticRegistryRevision = String(revision);
    await emitM80RegistryEvent("registryChanged");
  };
  window.addEventListener("keydown", onControlledFailureKey);
  window.addEventListener("keydown", onRegistryRevisionKey);
  return screen;
}
