import RestarbeitenScreen from "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js";
import TopsScreen from "../../src/renderer/modules/protokoll/screens/TopsScreen.js";
import { bindDevelopmentUiEditorOpenButtonRef } from "../../src/renderer/app/coreShellNavigation.js";
import {
  applyM80State,
  getM80Ref,
  resetM80PilotWorkingStatesForDiagnostic,
} from "../../src/renderer/ui-editor/m80Refs.js";
import {
  createM80RegistrationDescriptor,
  handleM80EditorEvent,
  handleM80EditorRequest,
  refreshM80StartupLayoutAfterRegistryMount,
} from "../../src/renderer/ui-editor/m80HostAdapter.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const number = (value) => Number(value);

async function waitForCompleteRegistry(moduleId) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const registration = createM80RegistrationDescriptor();
    if (registration.activeScopes.length === 3 && registration.activeScopes.every((scopeId) => scopeId.startsWith(`${moduleId}.`))) return;
    await tick();
  }
  throw new Error(`${moduleId}: Registry wurde nicht vollständig gemountet.`);
}

async function waitForStyle(selector) {
  const link = document.querySelector(selector);
  if (!link) throw new Error(`Teststylesheet fehlt: ${selector}`);
  if (link.sheet) return;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Teststylesheet ist nicht lesbar: ${link.href}`)), 5000);
    link.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
    link.addEventListener("error", () => { clearTimeout(timeout); reject(new Error(`Teststylesheet ist nicht lesbar: ${link.href}`)); }, { once: true });
  });
}

function sampleRest() {
  return { id: "m86-23-rest", running_number: 1, item_class: "rest", status: "offen", short_text: "M86.23 Restarbeit", long_text: "Save-Close-Handshake", due_date: "2026-08-12", responsible_label: "Prüfung", ampelState: "orange", location_level_1: "Gebäude", location_level_2: "EG", location_level_3: "Raum", location_level_4: "01" };
}

function sampleTops() {
  return [
    { id: "m86-23-title", level: 1, displayNumber: 1, title: "M86.23 Titel", longtext: "Titeltext", created_at: "2026-08-06" },
    { id: "m86-23-top", level: 2, displayNumber: "1.1", title: "M86.23 TOP", longtext: "Save-Close-Handshake", created_at: "2026-08-06", due_date: "2026-08-12", status: "offen", responsible_label: "Prüfung", is_task: 0, is_decision: 0 },
  ];
}

function baselineStartupApi() {
  return {
    async loadStartupLayout() { return { ok: true, found: false, state: "baseline", code: "layout_profile_not_found" }; },
    async completeStartupLayout() { return { ok: true }; },
  };
}

async function mountRestarbeiten() {
  resetM80PilotWorkingStatesForDiagnostic();
  document.body.replaceChildren();
  const screen = new RestarbeitenScreen({ projectId: "m86-23-project", project: { id: "m86-23-project" } });
  screen.items = [sampleRest()];
  screen.selectedId = "m86-23-rest";
  screen.draft = sampleRest();
  document.body.appendChild(screen.render());
  await waitForStyle('link[data-bbm-restarbeiten-m1-styles="true"]');
  const launcher = document.createElement("button");
  document.body.appendChild(launcher);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "restarbeiten.header.root", button: launcher });
  await waitForCompleteRegistry("restarbeiten");
  return { screen, elementId: "restarbeiten.edit.short.label", scopeId: "restarbeiten.edit.root" };
}

async function mountProtokoll() {
  resetM80PilotWorkingStatesForDiagnostic();
  document.body.replaceChildren();
  const screen = new TopsScreen({ projectId: "m86-23-project", meetingId: "m86-23-meeting" });
  screen.store.setState({ tops: sampleTops(), selectedTopId: "m86-23-top", showAmpelInList: true, showLongtextInList: true, meetingMeta: { meeting_number: 1, meeting_date: "2026-08-06", keyword: "Prüfung", context_label: "Projekt M86.23" } });
  document.body.appendChild(screen.render());
  await waitForStyle('link[data-bbm-tops-v2-styles="true"]');
  const launcher = document.createElement("button");
  screen.header.actionsWrap.appendChild(launcher);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "protokoll.screen.root", button: launcher });
  await waitForCompleteRegistry("protokoll");
  return { screen, elementId: "protokoll.list.row.short", scopeId: "protokoll.list.root" };
}

function persistentSnapshot(scopeStates) {
  return {
    schemaVersion: 1,
    applicationId: "bbm-produktiv",
    profileId: "standard",
    savedAt: new Date().toISOString(),
    scopes: scopeStates.map((scope) => ({
      scopeId: scope.scopeId,
      registryFingerprint: `m86-23-${scope.scopeId}`,
      layoutState: { elements: scope.elements.map((element) => ({ ...element, scopeId: scope.scopeId })) },
      explicitOperations: {},
    })),
  };
}

function saveCurrentLayout(saveRequestId, scopeId, elementId) {
  const scopeStates = handleM80EditorRequest({ action: "getLayoutState" }).scopeStates;
  const snapshot = persistentSnapshot(scopeStates);
  snapshot.scopes.find((scope) => scope.scopeId === scopeId).explicitOperations = { [elementId]: ["textResize"] };
  const response = handleM80EditorRequest({ action: "acknowledgeLayoutSave", saveRequestId, snapshot });
  if (!response.saveAcknowledgement?.accepted || !response.saveAcknowledgement?.persisted) throw new Error("Persistentes Save-Acknowledgement fehlt.");
  return { snapshot, acknowledgement: response.saveAcknowledgement };
}

function resizeText(elementId, fontSize) {
  const ref = getM80Ref(elementId);
  if (!ref) throw new Error(`Editor-Ref fehlt: ${elementId}`);
  applyM80State(elementId, { ...ref.read(), fontSize }, "textResize");
  const applied = ref.read();
  if (Math.abs(number(applied.fontSize) - fontSize) > 0.01) throw new Error(`TextResize-Readback fehlt: ${elementId}`);
  return applied;
}

async function restoreAfterRestart(moduleId, mounted, savedElement) {
  window.uiEditor = {
    async loadStartupLayout() {
      return {
        ok: true,
        found: true,
        state: "compatible",
        profileId: "standard",
        savedAt: new Date().toISOString(),
        profileSha256: (moduleId === "restarbeiten" ? "c" : "d").repeat(64),
        layoutStorageKey: `module-${moduleId}`,
        scopes: [{
          scopeId: mounted.scopeId,
          elements: [savedElement],
          explicitOperations: { [mounted.elementId]: ["textResize"] },
        }],
      };
    },
    async completeStartupLayout() { return { ok: true }; },
  };
  const restored = await refreshM80StartupLayoutAfterRegistryMount();
  if (!restored.applied) throw new Error(`${moduleId}: Neustart-Restore fehlgeschlagen (${restored.code}).`);
  return getM80Ref(mounted.elementId).read();
}

async function exerciseModule(moduleId, mount, seed) {
  window.uiEditor = baselineStartupApi();
  let mounted = await mount();
  const opening = getM80Ref(mounted.elementId).read();
  handleM80EditorRequest({ action: "getRegistry" });
  const savedState = resizeText(mounted.elementId, number(opening.fontSize) + seed);
  const rejectedRequestId = `${moduleId === "restarbeiten" ? "e" : "f"}${String(seed).padStart(31, "0")}`;
  const rejectedSnapshot = persistentSnapshot(handleM80EditorRequest({ action: "getLayoutState" }).scopeStates);
  const rejectedScope = rejectedSnapshot.scopes.find((scope) => scope.scopeId === mounted.scopeId);
  rejectedScope.explicitOperations = { [mounted.elementId]: ["textResize"] };
  const rejectedElement = rejectedScope.layoutState.elements.find((element) => element.elementId === mounted.elementId);
  rejectedElement.fontSize += 1;
  let failedAcknowledgementRejected = false;
  try { handleM80EditorRequest({ action: "acknowledgeLayoutSave", saveRequestId: rejectedRequestId, snapshot: rejectedSnapshot }); }
  catch { failedAcknowledgementRejected = true; }
  if (!failedAcknowledgementRejected) throw new Error(`${moduleId}: abweichender Save-Snapshot wurde bestätigt.`);
  const saveRequestId = `${moduleId === "restarbeiten" ? "a" : "b"}${String(seed).padStart(31, "0")}`;
  const saved = saveCurrentLayout(saveRequestId, mounted.scopeId, mounted.elementId);

  const target = getM80Ref(mounted.elementId).element;
  target.setAttribute("data-ui-editor-selected", "true");
  target.style.outline = "2px solid #2563eb";
  const overlay = document.createElement("div");
  overlay.setAttribute("data-bbm-ui-editor-overlay", "true");
  document.body.appendChild(overlay);
  resizeText(mounted.elementId, number(savedState.fontSize) + 1);
  const discardedPreparation = handleM80EditorRequest({ action: "prepareEditorClose", disposition: "discarded", saveRequestId }).closePreparation;
  const afterDiscard = getM80Ref(mounted.elementId).read();
  if (Math.abs(number(afterDiscard.fontSize) - number(savedState.fontSize)) > 0.01) throw new Error(`${moduleId}: Discard hat auch den bestätigten Save verworfen.`);
  if (target.hasAttribute("data-ui-editor-selected") || document.querySelector("[data-bbm-ui-editor-overlay]")) throw new Error(`${moduleId}: Marker-Cleanup fehlt.`);
  const discarded = handleM80EditorEvent({ action: "editorClosed", disposition: "discarded", saveRequestId });

  const persistedScope = saved.snapshot.scopes.find((scope) => scope.scopeId === mounted.scopeId);
  const persistedElement = persistedScope.layoutState.elements.find((element) => element.elementId === mounted.elementId);
  mounted = await mount();
  const afterRestart = await restoreAfterRestart(moduleId, mounted, persistedElement);
  if (Math.abs(number(afterRestart.fontSize) - number(savedState.fontSize)) > 0.01) throw new Error(`${moduleId}: bestätigtes Layout fehlt nach Neustart.`);

  handleM80EditorRequest({ action: "getRegistry" });
  const cleanPreparation = handleM80EditorRequest({ action: "prepareEditorClose", disposition: "clean", saveRequestId }).closePreparation;
  const clean = handleM80EditorEvent({ action: "editorClosed", disposition: "clean", saveRequestId });
  if (Math.abs(number(getM80Ref(mounted.elementId).read().fontSize) - number(savedState.fontSize)) > 0.01) throw new Error(`${moduleId}: Clean-Close hat das Profil verworfen.`);

  handleM80EditorRequest({ action: "getRegistry" });
  resizeText(mounted.elementId, number(savedState.fontSize) + 1);
  const secondRequestId = `${moduleId === "restarbeiten" ? "c" : "d"}${String(seed).padStart(31, "0")}`;
  const second = saveCurrentLayout(secondRequestId, mounted.scopeId, mounted.elementId);
  const savedPreparation = handleM80EditorRequest({ action: "prepareEditorClose", disposition: "saved", saveRequestId: secondRequestId }).closePreparation;
  const savedClose = handleM80EditorEvent({ action: "editorClosed", disposition: "saved", saveRequestId: secondRequestId });
  if (savedClose.disposition !== "saved" || Math.abs(number(getM80Ref(mounted.elementId).read().fontSize) - (number(savedState.fontSize) + 1)) > 0.01)
    throw new Error(`${moduleId}: Saved-Close hat den bestätigten Rendererzustand nicht erhalten.`);

  return {
    scopeId: mounted.scopeId,
    saveRequestId,
    acknowledgementBeforeClose: saved.acknowledgement.accepted,
    failedAcknowledgementRejected,
    cleanupBeforeClose: discardedPreparation.accepted && cleanPreparation.accepted && savedPreparation.accepted,
    discardRestoredOnlyUnsaved: discarded.restoredElementCount > 0,
    cleanPreserved: clean.disposition === "clean",
    closePreserved: true,
    restartPreserved: true,
    markersRemoved: true,
    secondSaveRequestId: second.acknowledgement.saveRequestId,
  };
}

export async function runM8623SaveCloseAcknowledgement() {
  const previousApi = window.uiEditor;
  try {
    const restarbeiten = await exerciseModule("restarbeiten", mountRestarbeiten, 1);
    const protokoll = await exerciseModule("protokoll", mountProtokoll, 2);
    const separateProfiles = restarbeiten.scopeId.startsWith("restarbeiten.") && protokoll.scopeId.startsWith("protokoll.") && restarbeiten.saveRequestId !== protokoll.saveRequestId;
    return { ok: separateProfiles, restarbeiten, protokoll, separateProfiles };
  } finally {
    window.uiEditor = previousApi;
    resetM80PilotWorkingStatesForDiagnostic();
  }
}
