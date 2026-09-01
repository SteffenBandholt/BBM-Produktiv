import RestarbeitenScreen from "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js";
import TopsScreen from "../../src/renderer/modules/protokoll/screens/TopsScreen.js";
import { getRechnungModuleEntry } from "../../src/renderer/modules/rechnungen/index.js";
import { bindDevelopmentUiEditorOpenButtonRef, openNativeUiEditor } from "../../src/renderer/app/coreShellNavigation.js";
import { BBM_M80_ACTIVE_SCOPES, BBM_M80_ACTIVE_SCOPE_GROUPS, listM83ComponentContracts } from "../../src/renderer/ui-editor/m80Registry.js";
import { getM80Ref, resetM80PilotWorkingStatesForDiagnostic } from "../../src/renderer/ui-editor/m80Refs.js";
import { restoreM80StartupLayoutAfterRegistryMount } from "../../src/renderer/ui-editor/m80HostAdapter.js";

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

function moduleIdFromScope(scopeId) {
  return String(scopeId || "").trim().split(".", 1)[0];
}

function inspectAutomaticRegistryGroups() {
  const componentScopes = [...new Set(
    listM83ComponentContracts()
      .map((component) => String(component?.scopeId || "").trim())
      .filter(Boolean)
  )];
  const expectedGroups = new Map();
  for (const scopeId of componentScopes) {
    const moduleId = moduleIdFromScope(scopeId);
    const group = expectedGroups.get(moduleId) || [];
    group.push(scopeId);
    expectedGroups.set(moduleId, group);
  }
  const actualGroups = BBM_M80_ACTIVE_SCOPE_GROUPS.map((group) => [...group]);
  const expectedGroupValues = [...expectedGroups.values()];
  return {
    componentScopes,
    activeScopes: [...BBM_M80_ACTIVE_SCOPES],
    expectedGroups: expectedGroupValues,
    actualGroups,
    scopesAutomatic: JSON.stringify(BBM_M80_ACTIVE_SCOPES) === JSON.stringify(componentScopes),
    groupsAutomatic: JSON.stringify(actualGroups) === JSON.stringify(expectedGroupValues),
  };
}

function sampleRest() {
  return { id: "m86-20-rest", running_number: 1, item_class: "rest", status: "offen", short_text: "M86.20 Restarbeit", long_text: "Gespeichertes Restarbeiten-Layout.", due_date: "2026-08-12", responsible_label: "Prüfung", ampelState: "orange", location_level_1: "Gebäude", location_level_2: "EG", location_level_3: "Raum", location_level_4: "01" };
}

function sampleTops() {
  return [
    { id: "m86-20-title", level: 1, displayNumber: 1, title: "M86.20 Titel", longtext: "Titeltext", created_at: "2026-08-05" },
    { id: "m86-20-top", level: 2, displayNumber: "1.1", title: "M86.20 TOP", longtext: "Gespeichertes Protokoll-Layout.", created_at: "2026-08-05", due_date: "2026-08-12", status: "offen", responsible_label: "Prüfung", is_task: 0, is_decision: 0 },
  ];
}

function sampleRechnungPosition() {
  return {
    id: "m86-20-rechnung-position",
    type: "SERVICE",
    is_title: false,
    parent_id: null,
    position_number: "1",
    short_text: "M86.20 Rechnungsposition",
    long_text: "Gespeicherte LeistungsEditbox-Geometrie.",
    quantity: "1",
    unit: "Stk",
    unit_price_cents: 10000,
    total_cents: 10000,
    is_nep: false,
    vat_rate_percent: 19,
    price_input_mode: "NET",
    price_input_cents: null,
    alternative_of: null,
    alternative_suffix: null,
  };
}

function createStartupApi(report) {
  return {
    async loadStartupLayout(registration) {
      const moduleId = String(registration?.activeScopes?.[0] || "").split(".", 1)[0];
      const elementId = moduleId === "restarbeiten"
        ? "restarbeiten.edit.short.label"
        : moduleId === "rechnung"
          ? "rechnung.editor.leistungsEditbox.action.addPosition"
          : "protokoll.list.row.short";
      const ref = getM80Ref(elementId);
      if (!ref) throw new Error(`M86.20 Startprofil ohne Ref: ${elementId}`);
      const current = ref.read();
      const isRechnung = moduleId === "rechnung";
      const fontSize = isRechnung ? number(current.fontSize) : number(current.fontSize) + 2;
      const height = isRechnung ? 23 : number(current.height);
      const width = moduleId === "restarbeiten" ? number(current.width) - 3 : number(current.width);
      const remainingElementId = moduleId === "restarbeiten" ? "restarbeiten.edit.short.remaining" : "";
      const remainingX = moduleId === "restarbeiten" ? -190 : null;
      const layoutStorageKey = `module-${moduleId}`;
      report.loads.push({ moduleId, layoutStorageKey, activeScopes: [...registration.activeScopes], elementId, fontSize, width, height, remainingElementId, remainingX, capturedAt: new Date().toISOString() });
      const elements = isRechnung
        ? [{ elementId, height }]
        : [{ elementId, fontSize, ...(moduleId === "restarbeiten" ? { width } : {}) }];
      const explicitOperations = {
        [elementId]: isRechnung
          ? ["resizeHeight"]
          : moduleId === "restarbeiten"
            ? ["textResize", "resizeWidth"]
            : ["textResize"],
      };
      if (remainingElementId) {
        elements.push({ elementId: remainingElementId, x: remainingX });
        explicitOperations[remainingElementId] = ["move"];
      }
      return {
        ok: true,
        found: true,
        state: "compatible",
        profileId: "standard",
        profileSha256: (moduleId === "restarbeiten" ? "a" : moduleId === "rechnung" ? "c" : "b").repeat(64),
        layoutStorageKey,
        scopes: [{
          scopeId: moduleId === "restarbeiten" ? "restarbeiten.edit.root" : moduleId === "rechnung" ? "rechnung.screen" : "protokoll.list.root",
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
  await restoreM80StartupLayoutAfterRegistryMount();
  await waitForStyle('link[data-bbm-restarbeiten-m1-styles="true"]');
  const launcher = document.createElement("button");
  launcher.textContent = "UI-Editor öffnen";
  document.body.appendChild(launcher);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "restarbeiten.header.root", button: launcher });
  return { screen, launcher, elementId: "restarbeiten.edit.short.label" };
}

async function mountProtokoll({ projectId } = {}) {
  resetM80PilotWorkingStatesForDiagnostic();
  document.body.replaceChildren();
  const screen = new TopsScreen({ projectId, meetingId: "m86-20-meeting" });
  screen.store.setState({ tops: sampleTops(), selectedTopId: "m86-20-top", showAmpelInList: true, showLongtextInList: true, meetingMeta: { meeting_number: 1, meeting_date: "2026-08-05", keyword: "Prüfung", context_label: "Projekt M86.20" } });
  document.body.appendChild(screen.render());
  await restoreM80StartupLayoutAfterRegistryMount();
  await waitForStyle('link[data-bbm-tops-v2-styles="true"]');
  const launcher = document.createElement("button");
  launcher.textContent = "UI-Editor öffnen";
  screen.header.actionsWrap.appendChild(launcher);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "protokoll.screen.root", button: launcher });
  return { screen, launcher, elementId: "protokoll.list.row.short" };
}

async function mountRechnung() {
  resetM80PilotWorkingStatesForDiagnostic();
  document.body.replaceChildren();
  const moduleEntry = getRechnungModuleEntry();
  const Screen = Object.values(moduleEntry.screens || {})[0];
  if (typeof Screen !== "function") throw new Error("M86.20 Rechnung: produktiver Screen fehlt.");
  const screen = new Screen();
  document.body.appendChild(screen.render());
  await restoreM80StartupLayoutAfterRegistryMount();
  const launcher = document.createElement("button");
  launcher.textContent = "UI-Editor öffnen";
  document.body.appendChild(launcher);
  return { screen, launcher, elementId: "rechnung.editor.leistungsEditbox.action.addPosition" };
}

async function verifyModule({ moduleId, scopeId, mounted, report }) {
  await waitFor(() => report.loads.filter((entry) => entry.moduleId === moduleId).length === 1 && report.completions.length >= report.loads.length, `M86.20 ${moduleId}: Startprofil wurde nicht automatisch angewandt.`);
  if (document.querySelector("[data-bbm-ui-editor-risk-preview]") || document.querySelector("[data-bbm-ui-editor-overlay]") || document.querySelector("[data-ui-editor-selected]") || document.querySelector("[data-ui-editor-hovered]") || document.querySelector("[data-ui-editor-component]")) {
    throw new Error(`M86.22 ${moduleId}: normaler Modulstart enthaelt verwaiste Editor-Markierungen.`);
  }
  const load = report.loads.find((entry) => entry.moduleId === moduleId);
  const beforeEditor = getM80Ref(mounted.elementId).read();
  if (moduleId === "rechnung") {
    mounted.screen.editor.hidden = false;
    mounted.screen.leistungsEditboxBinding.showPosition(sampleRechnungPosition());
    await tick();
    const visible = getM80Ref(mounted.elementId).read();
    if (Math.abs(number(visible.height) - load.height) > 0.01) throw new Error(`M86.20 Rechnung: sichtbare LeistungsEditbox verlor die gespeicherte Buttonhöhe ${load.height}.`);
  } else {
    if (Math.abs(number(beforeEditor.fontSize) - load.fontSize) > 0.01) throw new Error(`M86.20 ${moduleId}: gespeicherte Schriftgröße ist vor dem Editorstart nicht sichtbar.`);
  }
  if (moduleId === "restarbeiten") {
    if (Math.abs(number(beforeEditor.width) - load.width) > 0.01) throw new Error("M86.25 Restarbeiten: gespeicherte Breite ist nach dem Neustart nicht sichtbar.");
    const remaining = getM80Ref(load.remainingElementId)?.read();
    if (!remaining || Math.abs(number(remaining.x) - load.remainingX) > 0.01) throw new Error("M86.25 Restarbeiten: gespeicherter Move wurde beim Start als interaktives Geometrierisiko verworfen.");
  }
  const opened = await openNativeUiEditor({ scopeId, api: window.uiEditor, launcherButton: mounted.launcher });
  if (!opened.ok) throw new Error(`M86.20 ${moduleId}: späterer Editorstart fehlgeschlagen.`);
  const afterEditor = getM80Ref(mounted.elementId).read();
  if (moduleId === "rechnung") {
    if (Math.abs(number(afterEditor.height) - load.height) > 0.01) throw new Error("M86.20 Rechnung: Editorstart hat die gespeicherte Buttonhöhe verändert.");
  } else if (Math.abs(number(afterEditor.fontSize) - load.fontSize) > 0.01) {
    throw new Error(`M86.20 ${moduleId}: Editorstart hat das Layout erneut verändert.`);
  }
  if (report.loads.filter((entry) => entry.moduleId === moduleId).length !== 1) throw new Error(`M86.20 ${moduleId}: späterer Editorstart hat das Startprofil erneut geladen.`);
  return { moduleId, layoutStorageKey: load.layoutStorageKey, fontSize: load.fontSize, width: load.width, height: load.height, remainingX: load.remainingX, loadWithoutEditor: true, noSecondApply: true };
}

export async function runM8620ModuleStartupRestore() {
  const report = { ok: false, loads: [], completions: [], editorOpens: [], scopeEvents: [], registryAutomatic: inspectAutomaticRegistryGroups() };
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

    const rechnung = await mountRechnung();
    report.rechnung = await verifyModule({ moduleId: "rechnung", scopeId: "rechnung.screen", mounted: rechnung, report });
    if (Math.abs(number(report.rechnung.height) - 23) > 0.01) throw new Error("M86.20 Rechnung: Testprofil besitzt nicht die erwartete Höhe 23.");

    const profileKeys = new Set([report.restarbeiten.layoutStorageKey, report.protokoll.layoutStorageKey, report.rechnung.layoutStorageKey]);
    report.separateModuleProfiles = profileKeys.size === 3;
    if (!report.separateModuleProfiles) throw new Error("M86.20: produktive Module teilen unzulässig ein Profil.");
    report.ok = report.registryAutomatic.scopesAutomatic && report.registryAutomatic.groupsAutomatic && report.editorOpens.length === 3 && report.scopeEvents.length === 3;
    return report;
  } finally {
    window.uiEditor = previousApi;
    resetM80PilotWorkingStatesForDiagnostic();
  }
}
