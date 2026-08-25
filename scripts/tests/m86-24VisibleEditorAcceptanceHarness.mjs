import TopsScreen from "../../src/renderer/modules/protokoll/screens/TopsScreen.js";
import RestarbeitenScreen from "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js";
import RechnungScreen from "../../src/renderer/modules/rechnungen/screens/RechnungScreen.js";
import { injectCoreShellBaseStyles } from "../../src/renderer/app/coreShellStyles.js";
import { bindDevelopmentUiEditorOpenButtonRef } from "../../src/renderer/app/coreShellNavigation.js";
import { ensurePopupFormStandardStyles } from "../../src/renderer/ui/popupFormStyles.js";
import { installBbmM80EditorBridge, uninstallBbmM80EditorBridge } from "../../src/renderer/ui-editor/m80Bridge.js";
import { createM80RegistrationDescriptor, getM80InteractionStatus, handleM80EditorEvent, handleM80EditorRequest, refreshM80StartupLayoutAfterRegistryMount } from "../../src/renderer/ui-editor/m80HostAdapter.js";
import { getM80IdsFromTarget, getM80Ref, resetM80PilotWorkingStatesForDiagnostic } from "../../src/renderer/ui-editor/m80Refs.js";
import { getM80RegistryEntry } from "../../src/renderer/ui-editor/m80Registry.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
let activeModuleId = "protokoll";
let activeTargetId = "protokoll.list.row.due";
let activeRechnungScreen = null;
let layoutGuardChangeSequence = 0;
const RECHNUNG_BUTTON_TARGET_IDS = Object.freeze([
  "rechnung.overview.new",
  "rechnung.editor.headToggle",
  "rechnung.editor.customerPicker",
  "rechnung.editor.servicePeriodToggle",
  "rechnung.editor.positionQuantityDecimals.decrease",
  "rechnung.editor.positionQuantityDecimals.increase",
  "rechnung.editor.positionCreateTitle",
  "rechnung.editor.positionCreate",
  "rechnung.editor.positionMove",
  "rechnung.editor.positionDelete",
  "rechnung.editor.positionMoveRoot",
  "rechnung.editor.preview",
  "rechnung.editor.book",
  "rechnung.editor.delete",
  "rechnung.editor.close",
  "rechnung.preview.close",
]);
const RECHNUNG_REFERENCE_TARGET_ID = "rechnung.editor.headerCanvas";

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
    const expectedScopeCount = moduleId === "rechnung" ? 1 : 3;
    if (registration.activeScopes.length === expectedScopeCount && registration.activeScopes.every((scopeId) => scopeId.startsWith(`${moduleId}.`))) return registration;
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
      const layoutChain = [];
      let current = target;
      while (current) {
        const currentStyle = getComputedStyle(current);
        const currentBounds = current.getBoundingClientRect();
        layoutChain.push({
          tag: current.tagName,
          id: current.getAttribute?.("data-ui-inspector-id") || "",
          className: String(current.className || ""),
          bounds: { width: currentBounds.width, height: currentBounds.height },
          display: currentStyle.display,
          boxSizing: currentStyle.boxSizing,
          width: currentStyle.width,
          height: currentStyle.height,
          minWidth: currentStyle.minWidth,
          maxWidth: currentStyle.maxWidth,
          minHeight: currentStyle.minHeight,
          maxHeight: currentStyle.maxHeight,
          gridTemplateColumns: currentStyle.gridTemplateColumns,
          gridTemplateRows: currentStyle.gridTemplateRows,
          flex: currentStyle.flex,
          flexBasis: currentStyle.flexBasis,
          flexGrow: currentStyle.flexGrow,
          flexShrink: currentStyle.flexShrink,
          alignItems: currentStyle.alignItems,
          justifyItems: currentStyle.justifyItems,
          alignSelf: currentStyle.alignSelf,
          justifySelf: currentStyle.justifySelf,
          padding: currentStyle.padding,
          borderWidth: currentStyle.borderWidth,
          lineHeight: currentStyle.lineHeight,
          whiteSpace: currentStyle.whiteSpace,
          overflow: currentStyle.overflow,
        });
        if (current.getAttribute?.("data-ui-inspector-id") === "rechnung.screen") break;
        current = current.parentElement;
      }
      return {
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        parentBounds: parentBounds ? { x: parentBounds.x, y: parentBounds.y, width: parentBounds.width, height: parentBounds.height } : null,
        text: target.textContent,
        inline: { width: target.style.width, height: target.style.height, minWidth: target.style.minWidth, maxWidth: target.style.maxWidth, minHeight: target.style.minHeight, maxHeight: target.style.maxHeight, flex: target.style.flex, display: target.style.display },
        computed: { width: style.width, height: style.height, minWidth: style.minWidth, maxWidth: style.maxWidth, minHeight: style.minHeight, maxHeight: style.maxHeight, flex: style.flex, display: style.display, overflow: style.overflow, whiteSpace: style.whiteSpace, padding: style.padding, borderWidth: style.borderWidth, lineHeight: style.lineHeight, alignSelf: style.alignSelf, justifySelf: style.justifySelf },
        parent: parentStyle ? { display: parentStyle.display, width: parentStyle.width, minWidth: parentStyle.minWidth, flex: parentStyle.flex, gridTemplateColumns: parentStyle.gridTemplateColumns, gridTemplateRows: parentStyle.gridTemplateRows, alignItems: parentStyle.alignItems, justifyItems: parentStyle.justifyItems } : null,
        layoutChain,
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

async function mountRechnung() {
  resetM80PilotWorkingStatesForDiagnostic();
  document.documentElement.style.height = "100%";
  document.body.replaceChildren();
  document.body.style.cssText = "margin:0;height:100%;font-size:14px";
  injectCoreShellBaseStyles();
  ensurePopupFormStandardStyles();
  const screen = new RechnungScreen();
  screen._load = async () => {};
  document.body.appendChild(screen.render());
  screen.customers = [{ kind: "firm", id: "m86-24-customer", label: "M86.24 Kunde", name: "M86.24 Kunde", street: "Testweg 1", zip: "22880", city: "Wedel" }];
  screen.projects = [{ id: "m86-24-project", name: "Projekt M86.24" }];
  screen._open({
    id: "m86-24-invoice",
    status: "DRAFT",
    source_type: "FREE",
    document_type: "INVOICE",
    invoice_number: "ENTWURF-M86.24",
    invoice_date: "2026-08-24",
    service_period_type: "SINGLE_DATE",
    service_date: "2026-08-24",
    service_reference: "Sichtbare UI-Editor-Abnahme",
    intro_text: "Pruefung des unbegrenzten Rechnungslayouts",
    customer_ref_kind: "firm",
    customer_firm_id: "m86-24-customer",
    project_id: "m86-24-project",
    payment_term_days: 8,
    due_date: "2026-09-01",
    positions: [{ id: "m86-24-position", type: "service", short_text: "Kurztext sichtbar", long_text: "Langtext sichtbar", quantity: "1", unit: "Stk.", unit_price_cents: 10000, vat_rate_percent: 19, is_nep: false }],
  });
  screen._selectPosition(screen.positions[0]);
  activeRechnungScreen = screen;
  await waitForStyle('link[data-bbm-rechnungen-design-styles="true"]');
  await waitForStyle('link[data-bbm-popup-form-standard-styles="true"]');
  await tick();
  return waitForModule("rechnung");
}

export async function startVisibleAcceptance(moduleId = "protokoll") {
  uninstallBbmM80EditorBridge();
  installBbmM80EditorBridge();
  const registration = moduleId === "rechnung" ? await mountRechnung() : moduleId === "restarbeiten" ? await mountRestarbeiten() : await mountProtokoll();
  activeModuleId = moduleId;
  activeTargetId = moduleId === "rechnung" ? "rechnung.editor.positionShort" : moduleId === "restarbeiten" ? "restarbeiten.edit.short.label" : "protokoll.list.row.due";
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

export function setVisibleAcceptanceTarget(elementId) {
  if (!getM80Ref(elementId)) throw new Error(`Sichtbares Abnahmeziel fehlt: ${elementId}`);
  activeTargetId = elementId;
  return currentVisibleAcceptanceState();
}

export async function selectVisibleAcceptanceTargetInApp(elementId) {
  const state = setVisibleAcceptanceTarget(elementId);
  const interaction = () => {
    const status = getM80InteractionStatus();
    return { selectionMode: status.selectionMode, selectedId: status.selectedId, hoverElementIds: status.hoverElementIds, hoverIndex: status.hoverIndex };
  };
  handleM80EditorEvent({ action: "beginTargetSelection" });
  const target = targetElements(elementId)[0];
  const ids = getM80IdsFromTarget(target);
  const before = interaction();
  const bounds = target.getBoundingClientRect();
  const eventInit = { bubbles: true, cancelable: true, clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2 };
  target.dispatchEvent(new MouseEvent("mousemove", eventInit));
  await tick();
  const afterHover = interaction();
  target.dispatchEvent(new MouseEvent("click", eventInit));
  await tick();
  return { state, ids, before, afterHover, afterClick: interaction() };
}

export function measureVisibleAcceptanceTargets(elementIds = RECHNUNG_BUTTON_TARGET_IDS) {
  return Object.fromEntries(elementIds.map((elementId) => [elementId, measureTarget(elementId)]));
}

function activateRechnungTarget(elementId) {
  const screen = activeRechnungScreen;
  if (!screen) throw new Error("Rechnungs-Abnahmescreen fehlt.");
  const overviewTarget = elementId === "rechnung.overview.new";
  const previewTarget = elementId === "rechnung.preview.close";
  screen.overview.hidden = !overviewTarget;
  screen.editor.hidden = overviewTarget;
  screen.preview.hidden = !previewTarget;
  if (screen.servicePeriodContainer) screen.servicePeriodContainer.hidden = elementId !== "rechnung.editor.servicePeriodToggle";
  if (screen.positionMoveRootButton) screen.positionMoveRootButton.hidden = elementId !== "rechnung.editor.positionMoveRoot";
  activeTargetId = elementId;
  return measureTarget(elementId);
}

async function applyGuardDimension(elementId, operation, value) {
  const field = operation === "resizeWidth" ? "width" : "height";
  const response = handleM80EditorRequest({
    action: "submitChange",
    changeRequest: {
      changeId: `rechnung-layout-guard-${++layoutGuardChangeSequence}`,
      elementId,
      operation,
      payload: { [field]: value },
      source: "rechnung-layout-guard",
    },
  }).changeResult;
  if (!response?.success) throw new Error(`${elementId}/${operation}: ${response?.errorCode || "failed"} ${response?.message || ""}`);
  await tick();
  return measureTarget(elementId);
}

async function exerciseEffectiveGeometry(elementId) {
  activateRechnungTarget(elementId);
  const initial = measureTarget(elementId);
  const target = initial.targets[0];
  if (!target) throw new Error(`Reales DOM-Ziel fehlt: ${elementId}`);
  const largeWidth = Math.max(160, Math.ceil(target.bounds.width + 80));
  const largeHeight = Math.max(90, Math.ceil(target.bounds.height + 50));
  const widthZero = await applyGuardDimension(elementId, "resizeWidth", 0);
  const bothZero = await applyGuardDimension(elementId, "resizeHeight", 0);
  await applyGuardDimension(elementId, "resizeHeight", target.bounds.height);
  const widthSmall = await applyGuardDimension(elementId, "resizeWidth", 6);
  const bothSmall = await applyGuardDimension(elementId, "resizeHeight", 6);
  const widthLarge = await applyGuardDimension(elementId, "resizeWidth", largeWidth);
  const bothLarge = await applyGuardDimension(elementId, "resizeHeight", largeHeight);
  const widthSmallAgain = await applyGuardDimension(elementId, "resizeWidth", 6);
  const bothSmallAgain = await applyGuardDimension(elementId, "resizeHeight", 6);
  await applyGuardDimension(elementId, "resizeWidth", target.bounds.width);
  const restored = await applyGuardDimension(elementId, "resizeHeight", target.bounds.height);
  return {
    elementId,
    requested: { smallWidth: 6, smallHeight: 6, largeWidth, largeHeight },
    initial,
    widthZero,
    bothZero,
    widthSmall,
    bothSmall,
    widthLarge,
    bothLarge,
    widthSmallAgain,
    bothSmallAgain,
    restored,
  };
}

export async function runRechnungEffectiveGeometryDomGuard() {
  const buttons = [];
  for (const elementId of RECHNUNG_BUTTON_TARGET_IDS) buttons.push(await exerciseEffectiveGeometry(elementId));
  const reference = await exerciseEffectiveGeometry(RECHNUNG_REFERENCE_TARGET_ID);
  activateRechnungTarget("rechnung.editor.positionCreate");
  return { buttonTargetIds: [...RECHNUNG_BUTTON_TARGET_IDS], referenceTargetId: RECHNUNG_REFERENCE_TARGET_ID, buttons, reference };
}

export function currentLayoutPayload() {
  return handleM80EditorRequest({ action: "getLayoutState" }).scopeStates;
}

export async function remountForRestart(moduleId) {
  activeModuleId = moduleId;
  activeTargetId = moduleId === "rechnung" ? "rechnung.editor.positionShort" : moduleId === "restarbeiten" ? "restarbeiten.edit.short.label" : "protokoll.list.row.due";
  const registration = await (moduleId === "rechnung" ? mountRechnung() : moduleId === "restarbeiten" ? mountRestarbeiten() : mountProtokoll());
  const rawStartup = await window.uiEditor.loadStartupLayout(registration);
  const restore = await refreshM80StartupLayoutAfterRegistryMount();
  await new Promise((resolve) => setTimeout(resolve, 250));
  return {
    rawStartup,
    restore,
    renderer: currentVisibleAcceptanceState(),
    buttonTargets: moduleId === "rechnung" ? measureVisibleAcceptanceTargets() : null,
  };
}
