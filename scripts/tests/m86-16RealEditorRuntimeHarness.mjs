import RestarbeitenScreen from "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js";
import TopsScreen from "../../src/renderer/modules/protokoll/screens/TopsScreen.js";
import { bindDevelopmentUiEditorOpenButtonRef, openNativeUiEditor } from "../../src/renderer/app/coreShellNavigation.js";
import { createM80RegistrationDescriptor, handleM80EditorRequest, inspectM80ScopeRegistration, restoreM80StartupLayout } from "../../src/renderer/ui-editor/m80HostAdapter.js";
import { getM80Ref, resetM80PilotWorkingStatesForDiagnostic } from "../../src/renderer/ui-editor/m80Refs.js";
import { listM80RegistryScopes } from "../../src/renderer/ui-editor/m80Registry.js";

const EPSILON = 0.75;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
async function waitForStyle(selector) {
  const link = document.querySelector(selector);
  if (!link) throw new Error(`M86.16-Teststylesheet fehlt: ${selector}`);
  if (link.sheet) return;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`M86.16-Teststylesheet wurde nicht geladen: ${link.href}`)), 5000);
    link.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
    link.addEventListener("error", () => { clearTimeout(timeout); reject(new Error(`M86.16-Teststylesheet ist nicht lesbar: ${link.href}`)); }, { once: true });
  });
}
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const rect = (target) => { const value = target.getBoundingClientRect(); return { left: value.left, top: value.top, width: value.width, height: value.height }; };
const targets = (ref) => (ref?.contractTargets || []).filter((target) => target?.isConnected !== false);
const isCurrentlyVisible = (target) => {
  const style = getComputedStyle(target);
  const geometry = rect(target);
  return target.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden" && number(style.opacity, 1) > 0 && geometry.width > EPSILON && geometry.height > EPSILON;
};
const measured = (target) => ({ rect: rect(target), fontSize: number(Number.parseFloat(getComputedStyle(target).fontSize)), style: { height: target.style.height, minHeight: target.style.minHeight, maxHeight: target.style.maxHeight, flex: target.style.flex, computedHeight: getComputedStyle(target).height } });

function rootScope(entry, byId) { let current = entry; while (current?.parentId) current = byId.get(current.parentId); return current?.id || entry.scopeId; }
function sampleRest() { return { id: "m86-16-rest", running_number: 1, item_class: "rest", status: "offen", short_text: "M86.16 Restarbeit", long_text: "Sichtbarer M86.16 Langtext.", due_date: "2026-08-12", responsible_label: "Prüfung", ampelState: "orange", location_level_1: "Gebäude", location_level_2: "EG", location_level_3: "Raum", location_level_4: "01" }; }
function sampleTops() { return [
  { id: "m86-16-title", level: 1, displayNumber: 1, title: "M86.16 Titel", longtext: "Titeltext", created_at: "2026-08-05" },
  { id: "m86-16-top", level: 2, displayNumber: "1.1", title: "M86.16 TOP", longtext: "Sichtbarer M86.16 Protokoll-Langtext.", created_at: "2026-08-05", due_date: "2026-08-12", status: "offen", responsible_label: "Prüfung", is_task: 0, is_decision: 0 },
]; }

async function mountRestarbeiten() {
  resetM80PilotWorkingStatesForDiagnostic(); document.documentElement.style.height = "100%"; document.body.replaceChildren(); document.body.style.cssText = "margin:0;min-width:1400px;height:100%;font-size:14px";
  const screen = new RestarbeitenScreen({ projectId: "m86-16", project: { id: "m86-16" } });
  screen.items = [
    sampleRest(),
    { ...sampleRest(), id: "m86-16-rest-aftercare", short_text: "", long_text: "", status: "offen" },
    { ...sampleRest(), id: "m86-16-rest-required", short_text: "", due_date: "", responsible_label: "" },
  ]; screen.selectedId = "m86-16-rest"; screen.draft = sampleRest();
  document.body.appendChild(screen.render());
  await waitForStyle("link[data-bbm-restarbeiten-m1-styles=\"true\"]");
  const button = document.createElement("button"); button.textContent = "UI-Editor öffnen"; document.body.appendChild(button);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "restarbeiten.header.root", button });
  await tick();
  return screen;
}

async function mountProtokoll({ projectId = "m86-16", resetWorkingState = true } = {}) {
  if (resetWorkingState) resetM80PilotWorkingStatesForDiagnostic();
  document.documentElement.style.height = "100%"; document.body.replaceChildren(); document.body.style.cssText = "margin:0;min-width:1400px;height:100%;font-size:14px";
  const screen = new TopsScreen({ projectId, meetingId: "m86-16" });
  screen.store.setState({ tops: [...sampleTops(),
    { id: "m86-16-todo", level: 2, displayNumber: "1.2", title: "M86.16 ToDo", longtext: "ToDo", created_at: "2026-08-05", due_date: "2026-08-12", status: "offen", responsible_label: "Prüfung", is_task: 1 },
    { id: "m86-16-decision", level: 2, displayNumber: "1.3", title: "M86.16 Beschluss", longtext: "Beschluss", created_at: "2026-08-05", due_date: "2026-08-12", status: "offen", responsible_label: "Prüfung", is_decision: 1 },
  ], selectedTopId: "m86-16-top", showAmpelInList: true, showLongtextInList: true, meetingMeta: { meeting_number: 1, meeting_date: "2026-08-05", keyword: "Prüfung", context_label: "Projekt M86.16" } });
  document.body.appendChild(screen.render());
  await waitForStyle("link[data-bbm-tops-v2-styles=\"true\"]");
  const button = document.createElement("button"); button.textContent = "UI-Editor öffnen"; screen.header.actionsWrap.appendChild(button);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "protokoll.screen.root", button });
  screen.quicklane._toggleFilterMenu("all");
  await tick();
  return screen;
}

function failure(entry, operation, expected, before, after, reason) { return { elementId: entry.id, elementType: entry.type, scope: entry.scopeId, referenceKind: entry.referenceKind, parentId: entry.parentId || null, operation, expected, before, after, reason }; }
function submit(entry, byId, operation, payload, sequence, source = "m86-16-runtime", riskConfirmation = null) { return handleM80EditorRequest({ action: "submitChange", scopeId: rootScope(entry, byId), changeRequest: { changeId: `m86-16-${sequence}-${entry.id}`, elementId: entry.id, operation, payload, source }, ...(riskConfirmation ? { riskConfirmation } : {}) }).changeResult; }
function operationVector(entry, operation, direction) { return `${entry.id}:${operation}:${direction}`; }
function requireVector(entry, operation, direction, report) { report.requiredOperationVectors.push(operationVector(entry, operation, direction)); }

function verifyPersistableGeometry(moduleId, entries, report) {
  const violations = [];
  for (const entry of entries.filter((candidate) => candidate.id.startsWith(`${moduleId}.`))) {
    const state = getM80Ref(entry.id)?.read?.();
    if (!state) continue;
    for (const [field, minimum, maximum] of [
      ["width", number(entry.baseline?.minWidth, 1), number(entry.baseline?.maxWidth, Number.MAX_SAFE_INTEGER)],
      ["height", number(entry.baseline?.minHeight, 1), number(entry.baseline?.maxHeight, Number.MAX_SAFE_INTEGER)],
    ]) {
      const value = number(state[field], 0);
      if (!(value > 0 && value >= minimum - 0.01 && value <= maximum + 0.01)) {
        violations.push({ elementId: entry.id, field, value, minimum, maximum });
      }
    }
  }
  report.persistableGeometry = {
    ...(report.persistableGeometry || {}),
    [moduleId]: { checked: true, violationCount: violations.length, violations },
  };
}

async function checkDirection(entry, byId, operation, payload, key, less, report, sequence, source = "m86-16-runtime") {
  const direction = operation === "move"
    ? (key === "left" ? (less ? "left" : "right") : (less ? "up" : "down"))
    : (less ? "smaller" : "larger");
  report.attemptedOperationVectors.push(operationVector(entry, operation, direction));
  const ref = getM80Ref(entry.id); const all = targets(ref); const before = all.map(measured);
  let result = submit(entry, byId, operation, payload, sequence, source);
  if (source === "ui-editor-panel" && result?.errorCode === "geometry_risk_confirmation_required" && result?.geometryRisk?.operationId) {
    result = submit(entry, byId, operation, payload, sequence, source, {
      operationId: result.geometryRisk.operationId,
      action: "applyAnyway",
    });
  }
  await tick();
  const after = all.map(measured);
  report.operationCount += all.length; if (entry.referenceKind === "multi") report.multiRefCount += all.length; if (operation === "textResize") report.textOperationCount += all.length;
  if (!result?.success) { report.failures.push(failure(entry, operation, less ? "smaller" : "larger", before, after, result?.errorCode || "apply_failed")); return; }
  all.forEach((_, index) => {
    const beforeValue = key === "fontSize" ? before[index].fontSize : before[index].rect[key];
    const afterValue = key === "fontSize" ? after[index].fontSize : after[index].rect[key];
    if (less ? !(afterValue < beforeValue - EPSILON) : !(afterValue > beforeValue + EPSILON)) report.failures.push({ ...failure(entry, operation, less ? "smaller" : "larger", before[index], after[index], `direction_not_observed:${key}`), targetIndex: index, targetMeasurements: after });
  });
}

async function checkEntry(entry, byId, report, sequence) {
  const ref = getM80Ref(entry.id); const all = targets(ref);
  if (!all.length) { report.unmounted.push(entry.id); return; }
  if (all.some((target) => !isCurrentlyVisible(target))) {
    report.notCurrentlyVisible.push({ elementId: entry.id, elementType: entry.type, scope: entry.scopeId, referenceKind: entry.referenceKind, parentId: entry.parentId || null, geometry: all.map((target) => rect(target)) });
    return;
  }
  report.elementCount += 1;
  let state = ref.read();
  if (entry.allowedOps.includes("move")) {
    requireVector(entry, "move", "left", report); requireVector(entry, "move", "right", report);
    requireVector(entry, "move", "up", report); requireVector(entry, "move", "down", report);
    await checkDirection(entry, byId, "move", { x: number(state.x) - 8 }, "left", true, report, `${sequence}-left`);
    state = ref.read(); await checkDirection(entry, byId, "move", { x: number(state.x) + 8 }, "left", false, report, `${sequence}-right`);
    state = ref.read(); await checkDirection(entry, byId, "move", { y: number(state.y) - 8 }, "top", true, report, `${sequence}-up`);
    state = ref.read(); await checkDirection(entry, byId, "move", { y: number(state.y) + 8 }, "top", false, report, `${sequence}-down`);
  }
  state = ref.read(); const minWidth = number(entry.baseline?.minWidth, 1); const maxWidth = number(entry.baseline?.maxWidth, state.width + 8);
  if (entry.allowedOps.includes("resizeWidth")) {
    requireVector(entry, "resizeWidth", "larger", report); requireVector(entry, "resizeWidth", "smaller", report);
    if (state.width < maxWidth) {
      await checkDirection(entry, byId, "resizeWidth", { width: Math.min(maxWidth, state.width + 8) }, "width", false, report, `${sequence}-width-plus`);
      state = ref.read(); await checkDirection(entry, byId, "resizeWidth", { width: Math.max(minWidth, state.width - 8) }, "width", true, report, `${sequence}-width-minus`);
    } else if (state.width > minWidth) {
      await checkDirection(entry, byId, "resizeWidth", { width: Math.max(minWidth, state.width - 8) }, "width", true, report, `${sequence}-width-minus`);
      state = ref.read(); await checkDirection(entry, byId, "resizeWidth", { width: Math.min(maxWidth, state.width + 8) }, "width", false, report, `${sequence}-width-plus`);
    } else report.unavailableOperationVectors.push({ elementId: entry.id, operation: "resizeWidth", state: state.width, min: minWidth, max: maxWidth });
  }
  state = ref.read(); const minHeight = number(entry.baseline?.minHeight, 1); const maxHeight = number(entry.baseline?.maxHeight, state.height + 8);
  if (entry.allowedOps.includes("resizeHeight")) {
    requireVector(entry, "resizeHeight", "larger", report); requireVector(entry, "resizeHeight", "smaller", report);
    if (state.height < maxHeight) {
      await checkDirection(entry, byId, "resizeHeight", { height: Math.min(maxHeight, state.height + 8) }, "height", false, report, `${sequence}-height-plus`);
      state = ref.read(); await checkDirection(entry, byId, "resizeHeight", { height: Math.max(minHeight, state.height - 8) }, "height", true, report, `${sequence}-height-minus`);
    } else if (state.height > minHeight) {
      await checkDirection(entry, byId, "resizeHeight", { height: Math.max(minHeight, state.height - 8) }, "height", true, report, `${sequence}-height-minus`);
      state = ref.read(); await checkDirection(entry, byId, "resizeHeight", { height: Math.min(maxHeight, state.height + 8) }, "height", false, report, `${sequence}-height-plus`);
    } else report.unavailableOperationVectors.push({ elementId: entry.id, operation: "resizeHeight", state: state.height, min: minHeight, max: maxHeight });
  }
  state = ref.read(); const minFontSize = number(entry.baseline?.minFontSize, 6); const maxFontSize = number(entry.baseline?.maxFontSize, state.fontSize + 1);
  if (entry.hasVisibleText && entry.allowedOps.includes("textResize")) {
    requireVector(entry, "textResize", "larger", report); requireVector(entry, "textResize", "smaller", report);
    if (state.fontSize < maxFontSize) {
      await checkDirection(entry, byId, "textResize", { text: { fontSize: Math.min(maxFontSize, state.fontSize + 1), unit: "dip", expectedCurrentFontSize: state.fontSize } }, "fontSize", false, report, `${sequence}-font-plus`);
      state = ref.read(); await checkDirection(entry, byId, "textResize", { text: { fontSize: Math.max(minFontSize, state.fontSize - 1), unit: "dip", expectedCurrentFontSize: state.fontSize } }, "fontSize", true, report, `${sequence}-font-minus`);
    } else if (state.fontSize > minFontSize) {
      await checkDirection(entry, byId, "textResize", { text: { fontSize: Math.max(minFontSize, state.fontSize - 1), unit: "dip", expectedCurrentFontSize: state.fontSize } }, "fontSize", true, report, `${sequence}-font-minus`);
      state = ref.read(); await checkDirection(entry, byId, "textResize", { text: { fontSize: Math.min(maxFontSize, state.fontSize + 1), unit: "dip", expectedCurrentFontSize: state.fontSize } }, "fontSize", false, report, `${sequence}-font-plus`);
    } else report.unavailableOperationVectors.push({ elementId: entry.id, operation: "textResize", state: state.fontSize, min: minFontSize, max: maxFontSize });
  }
}

async function verifyRestarbeitenRerenderPersistence(screen, byId, report) {
  const entry = byId.get("restarbeiten.record.shortText");
  const ref = getM80Ref(entry.id);
  const before = ref.read();
  const expectedFontSize = before.fontSize + 1;
  const changed = submit(entry, byId, "textResize", { text: { fontSize: expectedFontSize, unit: "dip", expectedCurrentFontSize: before.fontSize } }, "rest-persist-font");
  if (!changed?.success) throw new Error(`M86.16 Persistenz: textResize wurde abgewiesen (${changed?.errorCode || "unknown"}).`);
  screen.filters = { ...screen.filters, status: "__m86_16_absent__" };
  screen._renderShell(); await tick();
  const filteredCount = targets(getM80Ref(entry.id)).length;
  if (filteredCount !== 0) throw new Error("M86.16 Persistenz: Filter blendet die erwarteten Multi-Refs nicht aus.");
  screen.filters = { ...screen.filters, status: "" };
  screen.items = [...screen.items, { ...sampleRest(), id: "m86-16-rest-new", short_text: "Neue M86.16 Restarbeit" }];
  screen._renderShell(); await tick();
  const afterNewRow = targets(getM80Ref(entry.id));
  if (afterNewRow.length !== 4 || afterNewRow.some((target) => Math.abs(number(Number.parseFloat(getComputedStyle(target).fontSize)) - expectedFontSize) > EPSILON)) {
    throw new Error("M86.16 Persistenz: Rerender oder neue Zeile hat den gespeicherten Multi-Ref-Wert nicht uebernommen.");
  }
  const reopened = new RestarbeitenScreen({ projectId: "m86-16-other-project", project: { id: "m86-16-other-project" } });
  reopened.items = [...screen.items]; reopened.selectedId = "m86-16-rest"; reopened.draft = sampleRest();
  document.body.replaceChildren(reopened.render()); await tick();
  const afterProjectChange = targets(getM80Ref(entry.id));
  if (afterProjectChange.length !== 4 || afterProjectChange.some((target) => Math.abs(number(Number.parseFloat(getComputedStyle(target).fontSize)) - expectedFontSize) > EPSILON)) {
    throw new Error("M86.16 Persistenz: Projektwechsel hat den gespeicherten Multi-Ref-Wert nicht uebernommen.");
  }
  report.persistence = { ...(report.persistence || {}), restarbeiten: { rerender: true, filter: true, newRow: true, projectChange: true, expectedFontSize } };
}

async function verifyStartupRestoreRejectsUnsafeRestarbeitenOffset(byId, report) {
  const entry = byId.get("restarbeiten.edit.class");
  const before = getM80Ref(entry.id).read();
  const result = handleM80EditorRequest({
    action: "submitChange",
    scopeId: rootScope(entry, byId),
    changeRequest: {
      changeId: "startup-unsafe-restarbeiten-offset",
      elementId: entry.id,
      operation: "move",
      payload: { x: -200 },
      source: "target-app-start",
    },
  }).changeResult;
  await tick();
  const after = getM80Ref(entry.id).read();
  if (result?.success || result?.errorCode !== "geometry_risk_confirmation_required") {
    throw new Error(`M86.18 Startup-Restore: ungueltiger Altwert wurde nicht blockiert (${result?.errorCode || "unknown"}).`);
  }
  if (Math.abs(number(after.x) - number(before.x)) > EPSILON || Math.abs(number(after.y) - number(before.y)) > EPSILON) {
    throw new Error("M86.18 Startup-Restore: blockierter Altwert hat die Restarbeiten-Geometrie veraendert.");
  }
  report.startupRestoreGuard = { checked: true, blocked: true, errorCode: result.errorCode, elementId: entry.id };
}

async function verifyStartupRollbackPreservesRestarbeitenBaseline(report) {
  const classRef = getM80Ref("restarbeiten.edit.class");
  const remainingRef = getM80Ref("restarbeiten.edit.short.remaining");
  const unrelatedRef = getM80Ref("restarbeiten.filterbar.location.level1.label");
  const classBefore = classRef.read();
  const unrelatedBefore = { width: unrelatedRef.element.style.width, height: unrelatedRef.element.style.height, translate: unrelatedRef.element.style.translate };
  const originalApi = window.uiEditor;
  const completed = [];
  window.uiEditor = {
    ...(originalApi || {}),
    async loadStartupLayout() {
      return {
        ok: true, found: true, profileId: "standard", savedAt: "2026-08-05T00:00:00.000Z", profileSha256: "m86-18-unsafe-profile", layoutStorageKey: "module-restarbeiten",
        scopes: [{
          scopeId: "restarbeiten.edit.root",
          elements: [
            { elementId: classRef.id, x: 1, y: classBefore.y },
            { elementId: remainingRef.id, x: -193, y: 0 },
          ],
          explicitOperations: {
            [classRef.id]: ["move"],
            [remainingRef.id]: ["move"],
          },
        }],
      };
    },
    async completeStartupLayout(value) { completed.push(value); return { ok: true }; },
  };
  try {
    const status = await restoreM80StartupLayout();
    const classAfter = classRef.read();
    const unrelatedAfter = { width: unrelatedRef.element.style.width, height: unrelatedRef.element.style.height, translate: unrelatedRef.element.style.translate };
    if (status.applied || status.code !== "geometry_risk_confirmation_required") throw new Error(`M86.18 Startup-Rollback: unsicheres Profil wurde nicht abgewiesen (${status.code}).`);
    if (document.querySelector("[data-bbm-ui-editor-risk-preview]") || document.querySelector("[data-bbm-ui-editor-overlay]")) throw new Error("M86.22 Startup-Rollback: nichtinteraktiver Restore hinterliess Editor-Markierungen.");
    if (Math.abs(number(classAfter.x) - number(classBefore.x)) > EPSILON || Math.abs(number(classAfter.y) - number(classBefore.y)) > EPSILON) throw new Error("M86.18 Startup-Rollback: zuvor angewandte Operation wurde nicht gezielt zurückgesetzt.");
    if (JSON.stringify(unrelatedAfter) !== JSON.stringify(unrelatedBefore)) throw new Error("M86.18 Startup-Rollback: unbeteiligtes Restarbeiten-Element wurde erneut als feste Geometrie angewandt.");
    if (completed.length !== 1 || completed[0]?.ok !== false) throw new Error("M86.18 Startup-Rollback: abgewiesenes Profil wurde nicht korrekt quittiert.");
    report.startupRestoreRollback = { checked: true, baselinePreserved: true, rejected: true };
  } finally {
    window.uiEditor = originalApi;
  }
}

async function verifyRestarbeitenLauncherScopeRegistration(screen, report) {
  const launcher = document.querySelector('[data-m86-19-launcher="true"]') || document.createElement("button");
  if (!launcher.isConnected) {
    launcher.setAttribute("data-m86-19-launcher", "true");
    launcher.textContent = "UI-Editor öffnen";
    document.body.appendChild(launcher);
    bindDevelopmentUiEditorOpenButtonRef({ scopeId: "restarbeiten.header.root", button: launcher });
  }
  screen._renderShell();
  await tick();
  const before = inspectM80ScopeRegistration("restarbeiten.header.root");
  const missingBefore = before.missingElementIds;
  if (missingBefore.length !== 1 || missingBefore[0] !== "restarbeiten.header.action.openUiEditor") {
    throw new Error(`M86.19 Registrierung: erwartete fehlende Launcher-Ref, erhielt ${missingBefore.join(", ") || "keine"}.`);
  }
  const multiRef = getM80Ref("restarbeiten.record.number");
  if (!multiRef || multiRef.contractTargets.length !== screen.items.length) {
    throw new Error("M86.19 Registrierung: Multi-Refs wurden nach dem Restarbeiten-Rerender nicht erneut gebunden.");
  }
  const originalAlert = globalThis.alert;
  const openedRegistrations = [];
  const events = [];
  const api = {
    async open(registration) { openedRegistrations.push(registration); return { ok: true, registryRefreshStatus: "current" }; },
    async sendTargetEvent(event) { events.push(event); return { ok: true }; },
  };
  globalThis.alert = () => {};
  try {
    const blocked = await openNativeUiEditor({ scopeId: "restarbeiten.header.root", api });
    if (blocked.ok || blocked.errorCode !== "electron_editor_scope_not_active") {
      throw new Error("M86.19 Registrierung: unvollständiger Scope wurde nicht weiter blockiert.");
    }
    const opened = await openNativeUiEditor({ scopeId: "restarbeiten.header.root", api, launcherButton: launcher });
    if (!opened.ok || openedRegistrations.length !== 1 || !openedRegistrations[0].activeScopes.includes("restarbeiten.header.root")) {
      throw new Error("M86.19 Registrierung: der Launcher hat nach Wiederbindung keinen vollständigen Scope geöffnet.");
    }
    if (events.length !== 1 || events[0]?.scopeId !== "restarbeiten.header.root") {
      throw new Error("M86.19 Registrierung: die Scope-Aktivierung nach dem Öffnen fehlt.");
    }
  } finally {
    globalThis.alert = originalAlert;
  }
  const after = inspectM80ScopeRegistration("restarbeiten.header.root");
  if (!createM80RegistrationDescriptor().activeScopes.includes("restarbeiten.header.root") || after.missingElementIds.length) {
    throw new Error("M86.19 Registrierung: Scope ist nach Wiederbindung weiterhin unvollständig.");
  }
  report.restarbeitenScopeRegistration = {
    checked: true,
    expectedScopeId: before.expectedScopeId,
    activeScopeIdsBefore: before.activeScopeIds,
    expectedElementIds: before.expectedElementIds,
    presentElementIdsBefore: before.presentElementIds,
    missingElementIdsBefore: missingBefore,
    missingElementIdsAfter: after.missingElementIds,
    launcherRegisteredAt: after.elements.find((entry) => entry.id === "restarbeiten.header.action.openUiEditor")?.registeredAt || null,
    checkedAt: after.capturedAt,
    multiRefsRebound: true,
    blockedWhenIncomplete: true,
    openedWhenComplete: true,
  };
}

async function verifyProtokollRerenderPersistence(screen, byId, report) {
  const entry = byId.get("protokoll.list.row.short");
  const ref = getM80Ref(entry.id);
  const before = ref.read();
  const beforeTargets = targets(ref);
  const expectedFontSize = before.fontSize + 1;
  const changed = submit(entry, byId, "textResize", { text: { fontSize: expectedFontSize, unit: "dip", expectedCurrentFontSize: before.fontSize } }, "protokoll-persist-font");
  if (!changed?.success) throw new Error(`M86.16 Protokoll-Persistenz: textResize wurde abgewiesen (${changed?.errorCode || "unknown"}).`);
  screen.setTopFilter("todo"); await tick();
  const filteredCount = targets(getM80Ref(entry.id)).length;
  if (filteredCount !== 1) throw new Error(`M86.16 Protokoll-Persistenz: ToDo-Filter erwartete genau eine Kurztext-Ref, erhielt ${filteredCount}.`);
  screen.setTopFilter("all");
  screen.store.setState({
    tops: [...screen.store.getState().tops, {
      id: "m86-16-protokoll-new", level: 2, displayNumber: "1.4", title: "Neuer M86.16 TOP", longtext: "Neue Zeile", created_at: "2026-08-05", due_date: "2026-08-12", status: "offen", responsible_label: "Prüfung",
    }],
  });
  screen._syncListState(); await tick();
  const afterNewRow = targets(getM80Ref(entry.id));
  if (afterNewRow.length !== beforeTargets.length + 1 || afterNewRow.some((target) => Math.abs(number(Number.parseFloat(getComputedStyle(target).fontSize)) - expectedFontSize) > EPSILON)) {
    throw new Error("M86.16 Protokoll-Persistenz: Rerender oder neue Zeile hat den gespeicherten Multi-Ref-Wert nicht übernommen.");
  }
  const reopened = await mountProtokoll({ projectId: "m86-16-other-project", resetWorkingState: false });
  reopened.store.setState({
    tops: [...screen.store.getState().tops],
    selectedTopId: "m86-16-top",
    showAmpelInList: true,
    showLongtextInList: true,
    meetingMeta: { meeting_number: 1, meeting_date: "2026-08-05", keyword: "Prüfung", context_label: "Projekt M86.16" },
  });
  reopened._syncScreenState(); await tick();
  const afterProjectChange = targets(getM80Ref(entry.id));
  if (afterProjectChange.length !== afterNewRow.length || afterProjectChange.some((target) => Math.abs(number(Number.parseFloat(getComputedStyle(target).fontSize)) - expectedFontSize) > EPSILON)) {
    throw new Error("M86.16 Protokoll-Persistenz: Projektwechsel hat den gespeicherten Multi-Ref-Wert nicht übernommen.");
  }
  report.persistence = { ...(report.persistence || {}), protokoll: { rerender: true, filter: true, newRow: true, projectChange: true, expectedFontSize } };
}

async function verifyProtokollAmpelPanelMove(byId, report) {
  const entry = byId.get("protokoll.list.row.ampel");
  const ref = getM80Ref(entry.id);
  const before = ref.read();
  const initialFailures = report.failures.length;
  await checkDirection(entry, byId, "move", { x: number(before.x) - 4 }, "left", true, report, "protokoll-ampel-panel-left", "ui-editor-panel");
  let state = ref.read();
  await checkDirection(entry, byId, "move", { x: number(state.x) + 4 }, "left", false, report, "protokoll-ampel-panel-right", "ui-editor-panel");
  state = ref.read();
  await checkDirection(entry, byId, "move", { y: number(state.y) - 4 }, "top", true, report, "protokoll-ampel-panel-up", "ui-editor-panel");
  state = ref.read();
  await checkDirection(entry, byId, "move", { y: number(state.y) + 4 }, "top", false, report, "protokoll-ampel-panel-down", "ui-editor-panel");
  state = ref.read();
  await checkDirection(entry, byId, "resizeWidth", { width: Math.min(number(entry.baseline?.maxWidth, state.width + 4), state.width + 4) }, "width", false, report, "protokoll-ampel-panel-width-plus", "ui-editor-panel");
  state = ref.read();
  await checkDirection(entry, byId, "resizeWidth", { width: Math.max(number(entry.baseline?.minWidth, 1), state.width - 4) }, "width", true, report, "protokoll-ampel-panel-width-minus", "ui-editor-panel");
  state = ref.read();
  await checkDirection(entry, byId, "resizeHeight", { height: Math.min(number(entry.baseline?.maxHeight, state.height + 4), state.height + 4) }, "height", false, report, "protokoll-ampel-panel-height-plus", "ui-editor-panel");
  state = ref.read();
  await checkDirection(entry, byId, "resizeHeight", { height: Math.max(number(entry.baseline?.minHeight, 1), state.height - 4) }, "height", true, report, "protokoll-ampel-panel-height-minus", "ui-editor-panel");
  report.protokollAmpelPanelMove = { before, checked: true, failureCount: report.failures.length - initialFailures };
}

export async function runM8616RealEditorRuntime() {
  const scopes = listM80RegistryScopes().filter((scope) => scope.status === "complete"); const entries = scopes.flatMap((scope) => scope.elements); const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const report = { ok: false, registryElementCount: entries.length, elementCount: 0, operationCount: 0, multiRefCount: 0, textOperationCount: 0, requiredOperationVectors: [], attemptedOperationVectors: [], unavailableOperationVectors: [], failures: [], unmounted: [], notCurrentlyVisible: [], diagnostics: {} };
  try {
    const restarbeiten = await mountRestarbeiten();
    const diagnosticTarget = getM80Ref("restarbeiten.filterbar.location.level1.label")?.element;
    report.diagnostics.restarbeitenFont = diagnosticTarget ? {
      inlineFontSize: diagnosticTarget.style.fontSize,
      computedFontSize: getComputedStyle(diagnosticTarget).fontSize,
      bodyFontSize: getComputedStyle(document.body).fontSize,
      documentFontSize: getComputedStyle(document.documentElement).fontSize,
      fontFamily: getComputedStyle(diagnosticTarget).fontFamily,
      styleSheetCount: document.styleSheets.length,
    } : null;
    report.diagnostics.quicklaneNavigationBaseline = byId.get("protokoll.topsScreen.quicklane.group.navigation")?.baseline || null;
    await verifyStartupRestoreRejectsUnsafeRestarbeitenOffset(byId, report);
    await verifyStartupRollbackPreservesRestarbeitenBaseline(report);
    await verifyRestarbeitenLauncherScopeRegistration(restarbeiten, report);
    for (const entry of entries.filter((entry) => entry.id.startsWith("restarbeiten."))) await checkEntry(entry, byId, report, "rest");
    await verifyRestarbeitenRerenderPersistence(restarbeiten, byId, report);
    verifyPersistableGeometry("restarbeiten", entries, report);
    const protokoll = await mountProtokoll();
    for (const entry of entries.filter((entry) => entry.id.startsWith("protokoll."))) await checkEntry(entry, byId, report, "protokoll");
    await verifyProtokollAmpelPanelMove(byId, report);
    await verifyProtokollRerenderPersistence(protokoll, byId, report);
    verifyPersistableGeometry("protokoll", entries, report);
    report.unverifiedOperationVectors = report.requiredOperationVectors.filter((vector) => !report.attemptedOperationVectors.includes(vector));
    report.ok = report.failures.length === 0 && report.unmounted.length === 0 && report.unverifiedOperationVectors.length === 0 && report.elementCount + report.notCurrentlyVisible.length === report.registryElementCount;
    return report;
  } finally { resetM80PilotWorkingStatesForDiagnostic(); }
}
