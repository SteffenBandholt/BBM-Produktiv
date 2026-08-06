import TopsScreen from "../../src/renderer/modules/protokoll/screens/TopsScreen.js";
import RestarbeitenScreen from "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js";
import { bindDevelopmentUiEditorOpenButtonRef } from "../../src/renderer/app/coreShellNavigation.js";
import { installBbmM80EditorBridge, uninstallBbmM80EditorBridge } from "../../src/renderer/ui-editor/m80Bridge.js";
import { createM80RegistrationDescriptor, handleM80EditorRequest, refreshM80StartupLayoutAfterRegistryMount } from "../../src/renderer/ui-editor/m80HostAdapter.js";
import { getM80Ref, resetM80PilotWorkingStatesForDiagnostic } from "../../src/renderer/ui-editor/m80Refs.js";
import { getM80RegistryEntry } from "../../src/renderer/ui-editor/m80Registry.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
let activeModuleId = "protokoll";
let activeTargetId = "protokoll.list.row.due";

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

async function waitForModule(moduleId) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const registration = createM80RegistrationDescriptor();
    if (registration.activeScopes.length === 3 && registration.activeScopes.every((scopeId) => scopeId.startsWith(`${moduleId}.`))) return registration;
    await tick();
  }
  throw new Error(`${moduleId}: Registry wurde nicht vollstaendig gemountet.`);
}

function targetElements(elementId) {
  return (getM80Ref(elementId)?.contractTargets || []).filter((target) => target?.isConnected !== false);
}

function measureTarget(elementId) {
  const ref = getM80Ref(elementId);
  const entry = getM80RegistryEntry(elementId);
  const targets = targetElements(elementId);
  return {
    state: ref?.read?.() || null,
    contract: entry ? { referenceKind: entry.referenceKind, parentId: entry.parentId, baseline: entry.baseline, allowedOps: entry.allowedOps } : null,
    targets: targets.map((target) => {
      const bounds = target.getBoundingClientRect();
      const parentBounds = target.parentElement?.getBoundingClientRect();
      const style = getComputedStyle(target);
      const parentStyle = target.parentElement ? getComputedStyle(target.parentElement) : null;
      return {
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        parentBounds: parentBounds ? { x: parentBounds.x, y: parentBounds.y, width: parentBounds.width, height: parentBounds.height } : null,
        text: target.textContent,
        inline: { width: target.style.width, minWidth: target.style.minWidth, maxWidth: target.style.maxWidth, flex: target.style.flex, display: target.style.display },
        computed: { width: style.width, minWidth: style.minWidth, maxWidth: style.maxWidth, flex: style.flex, display: style.display, overflow: style.overflow, whiteSpace: style.whiteSpace },
        parent: parentStyle ? { display: parentStyle.display, width: parentStyle.width, minWidth: parentStyle.minWidth, flex: parentStyle.flex } : null,
      };
    }),
  };
}

async function mountProtokoll() {
  resetM80PilotWorkingStatesForDiagnostic();
  document.documentElement.style.height = "100%";
  document.body.replaceChildren();
  document.body.style.cssText = "margin:0;min-width:1400px;height:100%;font-size:14px";
  const screen = new TopsScreen({ projectId: "m86-24-project", meetingId: "m86-24-meeting" });
  screen.store.setState({
    tops: [
      { id: "m86-24-title", level: 1, displayNumber: 1, title: "M86.24 Titel", longtext: "Titeltext", created_at: "2026-08-06" },
      { id: "m86-24-top", level: 2, displayNumber: "1.1", title: "M86.24 TOP", longtext: "Sichtbare Abnahme", created_at: "2026-08-06", due_date: "2026-08-12", status: "offen", responsible_label: "Pruefung", is_task: 0, is_decision: 0 },
      { id: "m86-24-todo", level: 2, displayNumber: "1.2", title: "M86.24 ToDo", longtext: "Sichtbare Abnahme", created_at: "2026-08-06", due_date: "2026-08-20", status: "offen", responsible_label: "Pruefung", is_task: 1, is_decision: 0 },
    ],
    selectedTopId: "m86-24-top",
    showAmpelInList: true,
    showLongtextInList: true,
    meetingMeta: { meeting_number: 1, meeting_date: "2026-08-06", keyword: "Pruefung", context_label: "Projekt M86.24" },
  });
  document.body.appendChild(screen.render());
  await waitForStyle('link[data-bbm-tops-v2-styles="true"]');
  const launcher = document.createElement("button");
  launcher.textContent = "UI-Editor oeffnen";
  screen.header.actionsWrap.appendChild(launcher);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "protokoll.screen.root", button: launcher });
  await tick();
  return waitForModule("protokoll");
}

function sampleRest() {
  return { id: "m86-24-rest", running_number: 1, item_class: "rest", status: "offen", short_text: "M86.24 Restarbeit", long_text: "Sichtbare Abnahme", due_date: "2026-08-20", responsible_label: "Pruefung", ampelState: "orange", location_level_1: "Gebaeude", location_level_2: "EG", location_level_3: "Raum", location_level_4: "01" };
}

async function mountRestarbeiten() {
  resetM80PilotWorkingStatesForDiagnostic();
  document.body.replaceChildren();
  const screen = new RestarbeitenScreen({ projectId: "m86-24-project", project: { id: "m86-24-project" } });
  screen.items = [sampleRest()];
  screen.selectedId = "m86-24-rest";
  screen.draft = sampleRest();
  document.body.appendChild(screen.render());
  await waitForStyle('link[data-bbm-restarbeiten-m1-styles="true"]');
  const launcher = document.createElement("button");
  launcher.textContent = "UI-Editor oeffnen";
  document.body.appendChild(launcher);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "restarbeiten.header.root", button: launcher });
  await tick();
  return waitForModule("restarbeiten");
}

export async function startVisibleAcceptance(moduleId = "protokoll") {
  uninstallBbmM80EditorBridge();
  installBbmM80EditorBridge();
  const registration = moduleId === "restarbeiten" ? await mountRestarbeiten() : await mountProtokoll();
  activeModuleId = moduleId;
  activeTargetId = moduleId === "restarbeiten" ? "restarbeiten.edit.short.label" : "protokoll.list.row.due";
  const opened = await window.uiEditor.open(registration);
  return { opened, moduleId, targetId: activeTargetId, target: measureTarget(activeTargetId) };
}

export function currentVisibleAcceptanceState() {
  return {
    moduleId: activeModuleId,
    targetId: activeTargetId,
    target: getM80Ref(activeTargetId) ? measureTarget(activeTargetId) : null,
    markers: Array.from(document.querySelectorAll('[data-ui-editor-selected], [data-ui-editor-hover], [data-ui-editor-component], [data-bbm-ui-editor-overlay], [data-bbm-ui-editor-risk-preview]')).map((element) => ({
      tag: element.tagName,
      id: element.getAttribute("data-ui-inspector-id"),
      selected: element.getAttribute("data-ui-editor-selected"),
      hover: element.getAttribute("data-ui-editor-hover"),
      component: element.getAttribute("data-ui-editor-component"),
      overlay: element.hasAttribute("data-bbm-ui-editor-overlay"),
      riskPreview: element.hasAttribute("data-bbm-ui-editor-risk-preview"),
    })),
  };
}

export function currentLayoutPayload() {
  return handleM80EditorRequest({ action: "getLayoutState" }).scopeStates;
}

export async function remountForRestart(moduleId) {
  activeModuleId = moduleId;
  activeTargetId = moduleId === "restarbeiten" ? "restarbeiten.edit.short.label" : "protokoll.list.row.due";
  const registration = await (moduleId === "restarbeiten" ? mountRestarbeiten() : mountProtokoll());
  const rawStartup = await window.uiEditor.loadStartupLayout(registration);
  const restore = await refreshM80StartupLayoutAfterRegistryMount();
  await new Promise((resolve) => setTimeout(resolve, 250));
  return { rawStartup, restore, renderer: currentVisibleAcceptanceState() };
}
