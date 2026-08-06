import RestarbeitenScreen from "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js";
import TopsScreen from "../../src/renderer/modules/protokoll/screens/TopsScreen.js";
import { bindDevelopmentUiEditorOpenButtonRef, openNativeUiEditor } from "../../src/renderer/app/coreShellNavigation.js";
import { getM80Ref, resetM80PilotWorkingStatesForDiagnostic } from "../../src/renderer/ui-editor/m80Refs.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

async function waitFor(predicate, message) {
  for (let index = 0; index < 100; index += 1) {
    if (predicate()) return;
    await tick();
  }
  throw new Error(message);
}

async function waitForStyle(selector) {
  const link = document.querySelector(selector);
  if (!link) throw new Error(`M86.20-Teststylesheet fehlt: ${selector}`);
  if (link.sheet) return;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`M86.20-Teststylesheet ist nicht lesbar: ${link.href}`)), 5000);
    link.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
    link.addEventListener("error", () => { clearTimeout(timeout); reject(new Error(`M86.20-Teststylesheet ist nicht lesbar: ${link.href}`)); }, { once: true });
  });
}

function sampleRest() {
  return { id: "m86-20-rest", running_number: 1, item_class: "rest", status: "offen", short_text: "M86.20 Restarbeit", long_text: "Gespeichertes Restarbeiten-Layout.", due_date: "2026-08-12", responsible_label: "PrÃ¼fung", ampelState: "orange", location_level_1: "GebÃ¤ude", location_level_2: "EG", location_level_3: "Raum", location_level_4: "01" };
}

function sampleTops() {
  return [
    { id: "m86-20-title", level: 1, displayNumber: 1, title: "M86.20 Titel", longtext: "Titeltext", created_at: "2026-08-05" },
    { id: "m86-20-top", level: 2, displayNumber: "1.1", title: "M86.20 TOP", longtext: "Gespeichertes Protokoll-Layout.", created_at: "2026-08-05", due_date: "2026-08-12", status: "offen", responsible_label: "PrÃ¼fung", is_task: 0, is_decision: 0 },
  ];
}

function createStartupApi(report) {
  return {
    async loadStartupLayout(registration) {
      const moduleId = String(registration?.activeScopes?.[0] || "").split(".", 1)[0];
      const elementId = moduleId === "restarbeiten" ? "restarbeiten.edit.short.label" : "protokoll.list.row.short";
      const ref = getM80Ref(elementId);
      if (!ref) throw new Error(`M86.20 Startprofil ohne Ref: ${elementId}`);
      const current = ref.read();
      const fontSize = number(current.fontSize) + 2;
      const width = moduleId === "restarbeiten" ? number(current.width) - 3 : number(current.width);
      const remainingElementId = moduleId === "restarbeiten" ? "restarbeiten.edit.short.remaining" : "";
      const remainingX = moduleId === "restarbeiten" ? -190 : null;
      const layoutStorageKey = `module-${moduleId}`;
      report.loads.push({ moduleId, layoutStorageKey, activeScopes: [...registration.activeScopes], elementId, fontSize, width, remainingElementId, remainingX, capturedAt: new Date().toISOString() });
      const elements = [{ elementId, fontSize, ...(moduleId === "restarbeiten" ? { width } : {}) }];
      const explicitOperations = { [elementId]: moduleId === "restarbeiten" ? ["textResize", "resizeWidth"] : ["textResize"] };
      if (remainingElementId) {
        elements.push({ elementId: remainingElementId, x: remainingX });
        explicitOperations[remainingElementId] = ["move"];
      }
      return {
        ok: true,
        found: true,
        state: "compatible",
        profileId: "standard",
        profileSha256: (moduleId === "restarbeiten" ? "a" : "b").repeat(64),
        layoutStorageKey,
        scopes: [{
          scopeId: moduleId === "restarbeiten" ? "restarbeiten.edit.root" : "protokoll.list.root",
          elements,
          explicitOperations,
        }],
      };
    },
    async completeStartupLayout(result) {
      report.completions.push({ ...result, capturedAt: new Date().toISOString() });
      return { ok: true };
    },
    async open(registration) {
      report.editorOpens.push({ activeScopes: [...registration.activeScopes], capturedAt: new Date().toISOString() });
      return { ok: true, registryRefreshStatus: "current" };
    },
    async sendTargetEvent(event) {
      report.scopeEvents.push({ ...event, capturedAt: new Date().toISOString() });
      return { ok: true };
    },
  };
}

async function mountRestarbeiten({ projectId, reset = true } = {}) {
  if (reset) resetM80PilotWorkingStatesForDiagnostic();
  document.body.replaceChildren();
  const screen = new RestarbeitenScreen({ projectId, project: { id: projectId } });
  screen.items = [sampleRest()];
  screen.selectedId = "m86-20-rest";
  screen.draft = sampleRest();
  document.body.appendChild(screen.render());
  await waitForStyle('link[data-bbm-restarbeiten-m1-styles="true"]');
  const launcher = document.createElement("button");
  launcher.textContent = "UI-Editor Ã¶ffnen";
  document.body.appendChild(launcher);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "restarbeiten.header.root", button: launcher });
  return { screen, launcher, elementId: "restarbeiten.edit.short.label" };
}

async function mountProtokoll({ projectId } = {}) {
  resetM80PilotWorkingStatesForDiagnostic();
  document.body.replaceChildren();
  const screen = new TopsScreen({ projectId, meetingId: "m86-20-meeting" });
  screen.store.setState({ tops: sampleTops(), selectedTopId: "m86-20-top", showAmpelInList: true, showLongtextInList: true, meetingMeta: { meeting_number: 1, meeting_date: "2026-08-05", keyword: "PrÃ¼fung", context_label: "Projekt M86.20" } });
  document.body.appendChild(screen.render());
  await waitForStyle('link[data-bbm-tops-v2-styles="true"]');
  const launcher = document.createElement("button");
  launcher.textContent = "UI-Editor Ã¶ffnen";
  screen.header.actionsWrap.appendChild(launcher);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "protokoll.screen.root", button: launcher });
  return { screen, launcher, elementId: "protokoll.list.row.short" };
}

async function verifyModule({ moduleId, scopeId, mounted, report }) {
  await waitFor(() => report.loads.filter((entry) => entry.moduleId === moduleId).length === 1 && report.completions.length >= report.loads.length, `M86.20 ${moduleId}: Startprofil wurde nicht automatisch angewandt.`);
  if (document.querySelector("[data-bbm-ui-editor-risk-preview]") || document.querySelector("[data-bbm-ui-editor-overlay]") || document.querySelector("[data-ui-editor-selected]") || document.querySelector("[data-ui-editor-hovered]") || document.querySelector("[data-ui-editor-component]")) {
    throw new Error(`M86.22 ${moduleId}: normaler Modulstart enthaelt verwaiste Editor-Markierungen.`);
  }
  const load = report.loads.find((entry) => entry.moduleId === moduleId);
  const beforeEditor = getM80Ref(mounted.elementId).read();
  if (Math.abs(number(beforeEditor.fontSize) - load.fontSize) > 0.01) throw new Error(`M86.20 ${moduleId}: gespeicherte Schriftgröße ist vor dem Editorstart nicht sichtbar.`);
  if (moduleId === "restarbeiten") {
    if (Math.abs(number(beforeEditor.width) - load.width) > 0.01) throw new Error("M86.25 Restarbeiten: gespeicherte Breite ist nach dem Neustart nicht sichtbar.");
    const remaining = getM80Ref(load.remainingElementId)?.read();
    if (!remaining || Math.abs(number(remaining.x) - load.remainingX) > 0.01) throw new Error("M86.25 Restarbeiten: gespeicherter Move wurde beim Start als interaktives Geometrierisiko verworfen.");
  }
  const opened = await openNativeUiEditor({ scopeId, api: window.uiEditor, launcherButton: mounted.launcher });
  if (!opened.ok) throw new Error(`M86.20 ${moduleId}: späterer Editorstart fehlgeschlagen.`);
  const afterEditor = getM80Ref(mounted.elementId).read();
  if (Math.abs(number(afterEditor.fontSize) - load.fontSize) > 0.01) throw new Error(`M86.20 ${moduleId}: Editorstart hat das Layout erneut verändert.`);
  if (report.loads.filter((entry) => entry.moduleId === moduleId).length !== 1) throw new Error(`M86.20 ${moduleId}: späterer Editorstart hat das Startprofil erneut geladen.`);
  return { moduleId, layoutStorageKey: load.layoutStorageKey, fontSize: load.fontSize, width: load.width, remainingX: load.remainingX, loadWithoutEditor: true, noSecondApply: true };
}

export async function runM8620ModuleStartupRestore() {
  const report = { ok: false, loads: [], completions: [], editorOpens: [], scopeEvents: [] };
  const previousApi = window.uiEditor;
  window.uiEditor = createStartupApi(report);
  try {
    const restarbeiten = await mountRestarbeiten({ projectId: "m86-20-project-a" });
    report.restarbeiten = await verifyModule({ moduleId: "restarbeiten", scopeId: "restarbeiten.header.root", mounted: restarbeiten, report });
    restarbeiten.screen._renderShell();
    bindDevelopmentUiEditorOpenButtonRef({ scopeId: "restarbeiten.header.root", button: restarbeiten.launcher });
    await tick();
    if (Math.abs(number(getM80Ref(restarbeiten.elementId).read().fontSize) - report.restarbeiten.fontSize) > 0.01) throw new Error("M86.20 Restarbeiten: Rerender verlor das wiederhergestellte Layout.");
    if (Math.abs(number(getM80Ref(restarbeiten.elementId).read().width) - report.restarbeiten.width) > 0.01) throw new Error("M86.25 Restarbeiten: Rerender verlor die wiederhergestellte Breite.");
    const restarbeitenProjectChange = await mountRestarbeiten({ projectId: "m86-20-project-b", reset: false });
    await tick();
    if (Math.abs(number(getM80Ref(restarbeitenProjectChange.elementId).read().fontSize) - report.restarbeiten.fontSize) > 0.01) throw new Error("M86.20 Restarbeiten: Projektwechsel verlor das globale Modullayout.");
    if (Math.abs(number(getM80Ref(restarbeitenProjectChange.elementId).read().width) - report.restarbeiten.width) > 0.01) throw new Error("M86.25 Restarbeiten: Projektwechsel verlor die globale Profilbreite.");
    if (report.loads.filter((entry) => entry.moduleId === "restarbeiten").length !== 1) throw new Error("M86.20 Restarbeiten: Projektwechsel lud das globale Profil doppelt.");
    report.restarbeiten.rerender = true;
    report.restarbeiten.projectChange = true;

    const protokoll = await mountProtokoll({ projectId: "m86-20-project-a" });
    report.protokoll = await verifyModule({ moduleId: "protokoll", scopeId: "protokoll.screen.root", mounted: protokoll, report });
    report.separateModuleProfiles = report.restarbeiten.layoutStorageKey !== report.protokoll.layoutStorageKey;
    if (!report.separateModuleProfiles) throw new Error("M86.20: Protokoll und Restarbeiten teilen unzulässig ein Profil.");
    report.ok = report.editorOpens.length === 2 && report.scopeEvents.length === 2;
    return report;
  } finally {
    window.uiEditor = previousApi;
    resetM80PilotWorkingStatesForDiagnostic();
  }
}
