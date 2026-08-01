import {
  BBM_M80_ACTIVE_SCOPE_GROUPS,
  BBM_M80_REGISTRY_STATUS,
  BBM_M80_REGISTRY_VERSION,
  getM80RegistryEntry,
  listM80RegistryScopes,
} from "./m80Registry.js";
import {
  applyM80State,
  beginM80PilotRender,
  captureM80WorkingStates,
  clearM80VisualState,
  completeM80PilotRender,
  getM80IdsFromTarget,
  getM80ReferenceStatus,
  getM80Ref,
  listM80Refs,
  registerM80Ref,
  registerM80MultiRef,
  restoreM80WorkingStates,
  fitM80Table,
  resetM80Table,
  resetM80PilotWorkingStatesForDiagnostic,
  snapshotM80Topology,
  compareM80Topology,
  snapshotM80State,
  snapshotM80Geometry,
} from "./m80Refs.js";
import {
  TABLE_LAYOUT_OPERATIONS,
  validateTableLayoutIntent,
} from "../../../node_modules/ui-editor-kit/dist/table-layout-contract.mjs";
import {
  createDirectSelectionHierarchy,
  cycleDirectSelectionIndex,
  describeDirectSelection,
  directSelectionFramePresentation,
} from "../../../node_modules/ui-editor-kit/dist/direct-selection-contract.mjs";
import {
  EDIT_MODES,
  RISK_ACTIONS,
  evaluateGeometryRisk,
} from "../../../node_modules/ui-editor-kit/dist/geometry-risk-contract.mjs";
import {
  normalizeTextResizeIntent,
  verifyTextResizeReadback,
} from "../../../node_modules/ui-editor-kit/dist/text-resize-contract.mjs";

const ALLOWED_ACTIONS = new Set(["getRegistry", "getLayoutState", "submitChange"]);
const SUPPORTED_OPERATIONS = Object.freeze(["move", "resize", "resizeWidth", "resizeHeight", "textMove", "textResize", "setVisibility", "spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset", ...TABLE_LAYOUT_OPERATIONS]);
const REGISTRY_EVENT_ACTIONS = new Set(["registryChanged", "registryStatusChanged", "scopeAdded", "scopeChanged", "scopeRemoved"]);
const FORBIDDEN_KEYS = new Set(["fachDaten", "businessData", "domainData", "recordId", "entity", "database", "sql", "status", "responsible", "dueDate", "photos", "rows", "values"]);
let selectionMode = false;
let selectedId = null;
let hoverCandidates = [];
let hoverIndex = 0;
let startupRestorePromise = null;
let startupRestoreStatus = { state: "pending", applied: false, editorProcessRequired: false };
let editorSessionBoundary = null;
let diagnosticRegistryRevision = 0;
const pendingGeometryRisks = new Map();
const capturedRuntimeBaselines = new Map();

function capturedRuntimeBaseline(entry) {
  if (entry?.baseline?.width !== null && entry?.baseline?.height !== null) return null;
  if (!capturedRuntimeBaselines.has(entry.id)) {
    const current = snapshotM80State(entry.id);
    if (current) capturedRuntimeBaselines.set(entry.id, Object.freeze({ width: current.width, height: current.height }));
  }
  return capturedRuntimeBaselines.get(entry.id) || null;
}

function hasForbidden(value) {
  if (Array.isArray(value)) return value.some(hasForbidden);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => FORBIDDEN_KEYS.has(key) || hasForbidden(nested));
}
function failure(request, errorCode, message, previousState = null, rollbackSucceeded = true, geometryRisk = null, textResize = null) {
  return { success: false, changeId: String(request?.changeId || ""), elementId: String(request?.elementId || ""), operation: String(request?.operation || ""), errorCode, message, previousState, newState: previousState, rollbackSucceeded, geometryRisk, textResize };
}
function number(value, field, { positive = false, nonNegative = false } = {}) {
  const result = Number(value);
  if (!Number.isFinite(result) || (positive && result <= 0) || (nonNegative && result < 0)) throw Object.assign(new Error(`Ungültiger Layoutwert: ${field}`), { code: "electron_editor_message_invalid" });
  return result;
}

function desiredState(previous, entry, operation, payload, textResizeIntent = null) {
  const next = { ...previous, spacing: { ...(previous.spacing || {}) } };
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || hasForbidden(payload)) throw Object.assign(new Error("Layout-Payload ist ungültig."), { code: "electron_editor_message_invalid" });
  if (operation === "move") {
    const keys = Object.keys(payload); if (!keys.length || keys.some((key) => !["x", "y"].includes(key))) throw new Error("move-Payload ist ungültig.");
    if (Object.hasOwn(payload, "x")) next.x = number(payload.x, "x");
    if (Object.hasOwn(payload, "y")) next.y = number(payload.y, "y");
    const maximumStoredOffset = Number(entry?.geometry?.maximumStoredOffset);
    if (Number.isFinite(maximumStoredOffset) && [next.x, next.y].some((value) => Math.abs(value) > maximumStoredOffset)) {
      throw Object.assign(new Error(`Verschiebung muss innerhalb von ±${maximumStoredOffset} DIP bleiben.`), { code: "electron_editor_message_invalid" });
    }
  } else if (operation === "resize") {
    const keys = Object.keys(payload); if (!keys.length || keys.some((key) => !["width", "height"].includes(key))) throw new Error("resize-Payload ist ungültig.");
    if (Object.hasOwn(payload, "width")) next.width = number(payload.width, "width", { positive: true });
    if (Object.hasOwn(payload, "height")) next.height = number(payload.height, "height", { positive: true });
  } else if (operation === "resizeWidth") {
    if (Object.keys(payload).length !== 1 || !Object.hasOwn(payload, "width")) throw new Error("resizeWidth-Payload ist ungültig.");
    next.width = number(payload.width, "width", { positive: true });
    if (previous.table?.columnId) next.table = { ...previous.table, widthMode: "fixed" };
  } else if (operation === "resizeHeight") {
    if (Object.keys(payload).length !== 1 || !Object.hasOwn(payload, "height")) throw new Error("resizeHeight-Payload ist ungültig.");
    next.height = number(payload.height, "height", { positive: true });
  } else if (operation === "textMove") {
    if (Object.keys(payload).length !== 1 || !payload.text || typeof payload.text !== "object") throw new Error("textMove-Payload ist ungültig.");
    const keys = Object.keys(payload.text); if (!keys.length || keys.some((key) => !["offsetX", "offsetY"].includes(key))) throw new Error("textMove-Payload ist ungültig.");
    if (Object.hasOwn(payload.text, "offsetX")) next.textOffsetX = number(payload.text.offsetX, "offsetX", { nonNegative: true });
    if (Object.hasOwn(payload.text, "offsetY")) next.textOffsetY = number(payload.text.offsetY, "offsetY", { nonNegative: true });
  } else if (operation === "textResize") {
    if (!textResizeIntent) throw Object.assign(new Error("textResize-Payload ist ungültig."), { code: "text_resize_invalid_intent" });
    next.fontSize = textResizeIntent.requestedFontSize;
  } else if (operation === "setVisibility") {
    if (Object.keys(payload).length !== 1 || typeof payload.visible !== "boolean") throw new Error("setVisibility-Payload ist ungültig.");
    next.visible = payload.visible;
  } else if (["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"].includes(operation)) {
    if (Object.keys(payload).length !== 1 || !payload.spacing || typeof payload.spacing !== "object" || Array.isArray(payload.spacing)) throw new Error("spacing-Payload ist ungültig.");
    const target = String(payload.spacing.target || "");
    const entry = getM80RegistryEntry(previous.elementId);
    if (!entry?.spacingTargets?.includes(target) || Object.keys(payload.spacing).some((key) => !["target", "value"].includes(key))) throw Object.assign(new Error("Abstandsziel ist nicht freigegeben."), { code: "electron_operation_not_allowed" });
    const current = number(next.spacing[target] || 0, target, { nonNegative: true });
    if (operation === "spacingReset") delete next.spacing[target];
    else {
      const value = number(payload.spacing.value, "spacing.value", { nonNegative: true });
      next.spacing[target] = operation === "spacingIncrease" ? current + value : operation === "spacingDecrease" ? Math.max(0, current - value) : value;
    }
  } else if (TABLE_LAYOUT_OPERATIONS.includes(operation)) {
    const validation = validateTableLayoutIntent(operation, payload);
    if (!validation.ok) throw Object.assign(new Error(validation.errors[0]?.message || "Tabellenoperation ist ungÃ¼ltig."), { code: "electron_editor_message_invalid" });
    next.table = { ...(previous.table || {}) };
    if (operation === "setHorizontalOverflowMode") next.table.horizontalOverflowMode = validation.intent.horizontalOverflowMode;
    if (operation === "setColumnWidthMode") next.table.widthMode = validation.intent.widthMode;
    if (operation === "setColumnWrapMode") next.table.wrapMode = validation.intent.wrapMode;
    if (operation === "setColumnOverflowMode") next.table.overflowMode = validation.intent.overflowMode;
    if (operation === "setRowHeightMode") next.table.rowHeightMode = validation.intent.rowHeightMode;
  } else throw Object.assign(new Error("Operation ist nicht erlaubt."), { code: "electron_operation_not_allowed" });
  return next;
}

function descendantsOf(elementId) {
  const ids = new Set([elementId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const scope of listM80RegistryScopes()) {
      for (const entry of scope.elements) {
        if (entry.parentId && ids.has(entry.parentId) && !ids.has(entry.id)) { ids.add(entry.id); changed = true; }
      }
    }
  }
  return ids;
}

function allowedGeometryChanges(entry, operation) {
  const effect = entry.operationEffects?.[operation] || "forbidden";
  if (effect === "forbidden") return { effect, ids: new Set() };
  const declared = new Set(entry.operationAffectedIds?.[operation] || []);
  if (effect === "elementOnly") return { effect, ids: new Set([entry.id, ...declared]) };
  if (effect === "groupWithChildren" || effect === "layoutZone") return { effect, ids: new Set([...descendantsOf(entry.id), ...declared]) };
  if (effect === "parentReflowRequired") {
    const ids = new Set([entry.id]);
    for (const declaredId of declared) for (const id of descendantsOf(declaredId)) ids.add(id);
    return { effect, ids };
  }
  return { effect: "forbidden", ids: new Set() };
}

function geometryChanged(left, right, tolerance = 0.75) {
  if (!left || !right) return false;
  return ["left", "top", "width", "height"].some((key) => Math.abs(Number(left[key]) - Number(right[key])) > tolerance);
}

function inspectGeometryEffect(entry, operation, beforeGeometry, afterGeometry) {
  const affected = allowedGeometryChanges(entry, operation);
  if (affected.effect === "forbidden") throw Object.assign(new Error("Operation besitzt keine zulässige Wirkungsmenge."), { code: "electron_operation_not_allowed" });
  const unexpected = [];
  for (const [id, before] of beforeGeometry) {
    if (!affected.ids.has(id) && geometryChanged(before, afterGeometry.get(id))) unexpected.push(id);
  }
  for (const id of affected.ids) {
    if (id === entry.id) continue;
    const candidate = getM80RegistryEntry(id);
    const before = beforeGeometry.get(id); const after = afterGeometry.get(id);
    if (!candidate || !before || !after) continue;
    const sizeChanged = Math.abs(before.width - after.width) > 0.75 || Math.abs(before.height - after.height) > 0.75;
    const widthChanged = Math.abs(before.width - after.width) > 0.75;
    if (operation === "resizeHeight" && widthChanged)
      throw Object.assign(new Error(`Breite von '${candidate.name}' darf durch die Höhenänderung nicht verändert werden.`), { code: "electron_unexpected_layout_effect" });
    if (sizeChanged && (operation === "move" || ["button", "componentPart", "statusIndicator"].includes(candidate.type)))
      throw Object.assign(new Error(`Größe von '${candidate.name}' darf durch diese Operation nicht verändert werden.`), { code: "electron_unexpected_layout_effect" });
  }
  const target = afterGeometry.get(entry.id);
  if (!target || !Number.isFinite(target.left) || !Number.isFinite(target.top) || target.width <= 0 || target.height <= 0)
    throw Object.assign(new Error("Zielgeometrie ist ungültig."), { code: "electron_invalid_geometry" });
  return { ...affected, unexpected };
}

function allEntries() { return listM80RegistryScopes().flatMap((scope) => scope.elements); }
function ancestor(entry, predicate) {
  let current = entry?.parentId ? getM80RegistryEntry(entry.parentId) : null;
  while (current) { if (predicate(current)) return current; current = current.parentId ? getM80RegistryEntry(current.parentId) : null; }
  return null;
}
function entryWithBounds(entry, geometry) {
  const bounds = entry ? geometry.get(entry.id) : null;
  return entry && bounds ? { elementId: entry.id, displayName: entry.name, elementType: entry.type, bounds } : null;
}
function isAncestor(candidateId, elementId) {
  let current = getM80RegistryEntry(elementId);
  while (current?.parentId) { if (current.parentId === candidateId) return true; current = getM80RegistryEntry(current.parentId); }
  return false;
}
function finitePositiveBounds(bounds) {
  return bounds && [bounds.left, bounds.top, bounds.width, bounds.height].every((value) => Number.isFinite(Number(value))) &&
    Number(bounds.width) > 0 && Number(bounds.height) > 0;
}
function isLayoutEffective(element) {
  if (!element || element.hidden === true) return false;
  const style = globalThis.window?.getComputedStyle?.(element) || element.style || {};
  return String(style.display || "").trim().toLowerCase() !== "none";
}
export function isM80GeometryNeighborActive(candidate, beforeGeometry, afterGeometry) {
  const ref = candidate?.id ? getM80Ref(candidate.id) : null;
  if (!ref?.element || ref.element.isConnected === false || !isLayoutEffective(ref.element)) return false;
  return finitePositiveBounds(beforeGeometry.get(candidate.id)) && finitePositiveBounds(afterGeometry.get(candidate.id));
}
const STARTUP_GEOMETRY_OPERATIONS = new Set(["move", "resize", "resizeWidth", "resizeHeight"]);
function nextM80LayoutFrame() {
  return new Promise((resolve) => {
    if (typeof globalThis.window?.requestAnimationFrame === "function") globalThis.window.requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 16);
  });
}
export async function waitForM80StartupGeometry(items, maximumFrames = 60) {
  const targetIds = [...new Set((items || []).map((item) => item?.request || item)
    .filter((request) => request?.elementId && STARTUP_GEOMETRY_OPERATIONS.has(request.operation))
    .map((request) => request.elementId))];
  if (!targetIds.length) return true;
  const ready = () => targetIds.every((id) => {
    const element = getM80Ref(id)?.element;
    if (!element || element.isConnected === false || typeof element.getBoundingClientRect !== "function") return false;
    const rect = element.getBoundingClientRect();
    return finitePositiveBounds({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
  });
  for (let frame = 0; frame < maximumFrames && !ready(); frame += 1) await nextM80LayoutFrame();
  return ready();
}
export function collectM80GeometryNeighbors(entry, beforeGeometry, afterGeometry, unexpected = []) {
  const parent = entry.parentId ? getM80RegistryEntry(entry.parentId) : null;
  const contextId = parent?.parentId || entry.parentId;
  const flowGroup = ancestor(entry, (candidate) => ["group", "fieldGroup"].includes(candidate.type));
  return allEntries().filter((candidate) => {
    if (candidate.id === entry.id || isAncestor(candidate.id, entry.id) || isAncestor(entry.id, candidate.id)) return false;
    if (!isM80GeometryNeighborActive(candidate, beforeGeometry, afterGeometry)) return false;
    return unexpected.includes(candidate.id) || candidate.parentId === entry.parentId || candidate.parentId === contextId ||
      candidate.id === contextId || (flowGroup && isAncestor(flowGroup.id, candidate.id));
  }).map((candidate) => ({
    elementId: candidate.id,
    displayName: candidate.name,
    elementType: candidate.type,
    bounds: afterGeometry.get(candidate.id),
    previousBounds: beforeGeometry.get(candidate.id),
    geometryChanged: geometryChanged(beforeGeometry.get(candidate.id), afterGeometry.get(candidate.id)),
  }));
}
function geometryRiskFor(entry, request, beforeGeometry, afterGeometry, effect) {
  const parentEntry = entry.parentId ? getM80RegistryEntry(entry.parentId) : null;
  const groupEntry = ancestor(entry, (candidate) => ["group", "fieldGroup"].includes(candidate.type));
  let rootEntry = entry;
  while (rootEntry?.parentId) rootEntry = getM80RegistryEntry(rootEntry.parentId);
  return evaluateGeometryRisk({
    editMode: request.editMode === EDIT_MODES.FREE ? EDIT_MODES.FREE : EDIT_MODES.GUIDED,
    operationId: String(request.changeId || ""),
    rollbackToken: `bbm-m80:${String(request.changeId || "")}`,
    scopeId: rootEntry?.id || "",
    registryVersion: BBM_M80_REGISTRY_VERSION + diagnosticRegistryRevision,
    effectScope: effect.effect,
    errorCode: effect.unexpected.length ? "electron_unexpected_layout_effect" : null,
    rollbackStatus: "guaranteed",
    currentBounds: beforeGeometry.get(entry.id),
    targetBounds: afterGeometry.get(entry.id),
    target: entryWithBounds(entry, beforeGeometry),
    group: entryWithBounds(groupEntry, afterGeometry),
    parent: entryWithBounds(parentEntry, afterGeometry),
    editableArea: entryWithBounds(rootEntry, afterGeometry),
    affectedNeighbors: collectM80GeometryNeighbors(entry, beforeGeometry, afterGeometry, effect.unexpected),
    operation: request.operation,
    groupWidthEditable: groupEntry?.allowedOps?.includes("resizeWidth") === true,
  });
}
function requestSignature(request) {
  return JSON.stringify({ elementId: String(request.elementId || ""), operation: String(request.operation || ""), payload: request.payload || null });
}
function confirmedRisk(request) {
  const confirmation = request?.riskConfirmation;
  if (!confirmation || typeof confirmation !== "object") return null;
  const pending = pendingGeometryRisks.get(String(confirmation.operationId || ""));
  if (!pending || pending.signature !== requestSignature(request)) return null;
  if (![RISK_ACTIONS.APPLY_ANYWAY, RISK_ACTIONS.CLAMP_TO_GROUP, RISK_ACTIONS.CLAMP_TO_AREA, RISK_ACTIONS.PRESERVE_SPACE, RISK_ACTIONS.REFLOW_NEIGHBORS, RISK_ACTIONS.SHRINK_GROUP].includes(confirmation.action)) return null;
  return { ...pending, action: confirmation.action };
}
function clampDesiredState(desired, risk, action) {
  const clamped = action === RISK_ACTIONS.CLAMP_TO_GROUP ? risk.clampedToGroupBounds : risk.clampedToAreaBounds;
  if (!clamped) throw Object.assign(new Error("Für diese Änderung steht keine Begrenzung zur Verfügung."), { code: "electron_invalid_geometry" });
  if (!Object.hasOwn(desired, "x") || !Object.hasOwn(desired, "y")) throw Object.assign(new Error("Nur Positionsänderungen können an einer Grenze gehalten werden."), { code: "electron_invalid_geometry" });
  return { ...desired, x: desired.x + clamped.left - risk.preview.targetBounds.left, y: desired.y + clamped.top - risk.preview.targetBounds.top };
}

function riskPreviewOverlay() {
  let value = document.querySelector("[data-bbm-ui-editor-risk-preview]");
  if (!value) {
    value = document.createElement("div");
    value.setAttribute("data-bbm-ui-editor-risk-preview", "true");
    value.setAttribute("data-ui-inspector-id", "editor.geometry-preview");
    value.setAttribute("data-ui-editor-kind", "overlay");
    value.setAttribute("data-ui-editor-label", "Geometrievorschau");
    value.setAttribute("data-ui-editor-parent", "");
    value.setAttribute("data-ui-editor-editable", "false");
    value.setAttribute("data-ui-editor-ops", "");
    value.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483001;display:none";
    document.body.appendChild(value);
  }
  return value;
}
function previewFrame(container, bounds, style, label) {
  if (!bounds) return;
  const frame = document.createElement("div");
  frame.dataset.geometryPreviewFrame = label;
  frame.style.cssText = `position:fixed;left:${bounds.left}px;top:${bounds.top}px;width:${bounds.width}px;height:${bounds.height}px;box-sizing:border-box;${style}`;
  frame.setAttribute("aria-label", label);
  container.appendChild(frame);
}
function clearGeometryRiskPreview() {
  const value = document.querySelector("[data-bbm-ui-editor-risk-preview]");
  if (value) { value.replaceChildren(); value.style.display = "none"; }
  document.removeEventListener("keydown", onRiskPreviewKey, true);
}
function onRiskPreviewKey(event) { if (event.key === "Escape") clearGeometryRiskPreview(); }
function renderGeometryRiskPreview(risk) {
  const value = riskPreviewOverlay();
  value.replaceChildren();
  previewFrame(value, risk.preview.currentBounds, "border:3px solid #0f172a;background:transparent", "Aktuelles Elementrechteck");
  previewFrame(value, risk.preview.targetBounds, "border:3px dashed #c2410c;background:rgba(251,146,60,.10)", "Neues Zielrechteck");
  previewFrame(value, risk.preview.groupBounds, "border:4px double #6d28d9;background:transparent", "Gruppengrenze");
  previewFrame(value, risk.preview.areaBounds, "border:3px dotted #0f766e;background:transparent", "Bereichsgrenze");
  risk.affectedNeighbors.filter((item) => item.overlapBounds).forEach((item) => previewFrame(value, item.overlapBounds,
    "border:4px double #b91c1c;background:repeating-linear-gradient(45deg,rgba(185,28,28,.28),rgba(185,28,28,.28) 5px,transparent 5px,transparent 10px)", `Überlappung mit ${item.displayName}`));
  risk.affectedNeighbors.filter((item) => item.geometryChanged).forEach((item) => {
    previewFrame(value, item.previousBounds, "border:2px dotted #475569;background:transparent", `Bisherige Position von ${item.displayName}`);
    previewFrame(value, item.bounds, "border:2px dashed #c2410c;background:transparent", `Neue Position von ${item.displayName}`);
  });
  value.style.display = "block";
  document.addEventListener("keydown", onRiskPreviewKey, true);
}

function submitChange(changeRequest, scopeId) {
  const request = changeRequest && typeof changeRequest === "object" ? changeRequest : {};
  const entry = getM80RegistryEntry(request.elementId);
  if (!entry) return failure(request, "electron_element_not_found", "Element ist nicht registriert.");
  if (scopeId && !belongsToScope(entry, scopeId)) return failure(request, "electron_registry_invalid", "Scope passt nicht zum Element.");
  if (entry.lockedOps.includes(request.operation)) return failure(request, "electron_operation_locked", "Operation ist gesperrt.");
  if (!entry.allowedOps.includes(request.operation)) return failure(request, "electron_operation_not_allowed", "Operation ist nicht freigegeben.");
  const previous = snapshotM80State(entry.id);
  if (!previous) return failure(request, "electron_element_not_found", "Explizite Elementreferenz fehlt.");
  let groupRestore = null;
  const tableRestore = new Map();
  let textResizeVerification = null;
  try {
    const beforeTopology = snapshotM80Topology();
    const beforeGeometry = snapshotM80Geometry();
    const ref = getM80Ref(entry.id);
    if (ref?.element?.dataset?.uiEditorFailNextApply === "true") {
      delete ref.element.dataset.uiEditorFailNextApply;
      throw Object.assign(new Error("Kontrollierter Diagnosefehler."), { code: "electron_change_apply_failed" });
    }
    const confirmation = confirmedRisk(request);
    let textResizeIntent = null;
    if (request.operation === "textResize") {
      const normalized = normalizeTextResizeIntent(request.payload, {
        minimumFontSize: entry?.baseline?.minFontSize,
        maximumFontSize: entry?.baseline?.maxFontSize,
        currentFontSize: previous.fontSize,
      });
      if (!normalized.ok) throw Object.assign(new Error(normalized.message), { code: normalized.code, textResize: normalized.readback });
      textResizeIntent = normalized.intent;
    }
    let desired = desiredState(previous, entry, request.operation, request.payload, textResizeIntent);
    if (confirmation && [RISK_ACTIONS.CLAMP_TO_GROUP, RISK_ACTIONS.CLAMP_TO_AREA].includes(confirmation.action)) desired = clampDesiredState(desired, confirmation.risk, confirmation.action);
    if (confirmation?.action === RISK_ACTIONS.PRESERVE_SPACE || confirmation?.action === RISK_ACTIONS.SHRINK_GROUP) {
      desired.spacing = { ...(desired.spacing || {}), reservedWidth: Number(desired.spacing?.reservedWidth || 0) + Number(confirmation.risk.technicalDetails?.freedWidth || 0) };
    }
    let readback;
    const affectedStates = [];
    if (["fitTableToViewport", "resizeColumnsProportionally", "resetTable"].includes(request.operation)) {
      tableRestore.set(entry.id, previous);
      for (const column of entry.tableLayout?.columns || []) tableRestore.set(column.columnId, snapshotM80State(column.columnId));
    }
    if (["fitTableToViewport", "resizeColumnsProportionally"].includes(request.operation)) {
      const fitted = fitM80Table(entry.id, request.payload?.table?.selectedColumnId || "");
      affectedStates.push(...fitted.affectedStates);
      readback = snapshotM80State(entry.id);
    } else if (request.operation === "resetTable") {
      const reset = resetM80Table(entry.id);
      affectedStates.push(...reset.affectedStates);
      readback = reset.newState;
    } else if (request.operation === "resetTableColumn") {
      const baseline = entry.tableColumnLayout;
      readback = applyM80State(entry.id, { ...previous, width: baseline.currentWidth, visible: baseline.visibility, table: { tableId: entry.tableBinding.tableId, columnId: entry.id, widthMode: baseline.widthMode, wrapMode: baseline.wrapMode, overflowMode: baseline.overflowMode } });
    } else {
      readback = applyM80State(entry.id, desired, request.operation);
    }
    if (textResizeIntent) {
      const verified = verifyTextResizeReadback({
        requestedFontSize: textResizeIntent.requestedFontSize,
        expectedCurrentFontSize: textResizeIntent.expectedCurrentFontSize,
        previousFontSize: previous.fontSize,
        appliedFontSize: readback?.fontSize,
        tolerance: textResizeIntent.tolerance,
      });
      textResizeVerification = verified.readback;
      if (!verified.ok) throw Object.assign(new Error(verified.message), { code: verified.code, textResize: verified.readback });
    }
    if (confirmation?.action === RISK_ACTIONS.SHRINK_GROUP) {
      const groupEntry = ancestor(entry, (candidate) => ["group", "fieldGroup"].includes(candidate.type));
      if (!groupEntry?.allowedOps?.includes("resizeWidth")) throw Object.assign(new Error("Die Breite dieser Gruppe kann nicht direkt verändert werden."), { code: "electron_operation_not_allowed" });
      groupRestore = { id: groupEntry.id, state: snapshotM80State(groupEntry.id) };
      affectedStates.push(applyM80State(groupEntry.id, { ...groupRestore.state, width: Math.max(groupEntry.baseline.minWidth || 1, groupRestore.state.width - Number(confirmation.risk.technicalDetails?.freedWidth || 0)) }));
    }
    const afterGeometry = snapshotM80Geometry();
    if (confirmation?.action === RISK_ACTIONS.PRESERVE_SPACE) {
      const unexpectedLocal = [...beforeGeometry].filter(([id, before]) => id !== entry.id && geometryChanged(before, afterGeometry.get(id))).map(([id]) => id);
      if (unexpectedLocal.length) throw Object.assign(new Error("Die Position weiterer Elemente würde sich unerwartet verändern."), { code: "electron_unexpected_layout_effect" });
    }
    const affected = inspectGeometryEffect(entry, request.operation, beforeGeometry, afterGeometry);
    const interactive = request.source === "ui-editor-panel";
    // Reset und bestaetigte Fit-Operationen sind bereits durch den
    // Ziel-App-Vertrag und den Tabellen-Core begrenzt. Sie duerfen deshalb
    // nicht an der Geometrie des aktuell ueberbreiten Laufzeitzustands
    // haengen bleiben.
    const usesValidatedTableGeometry = request.operation === "resetTable" ||
      (["fitTableToViewport", "resizeColumnsProportionally"].includes(request.operation) && request.payload?.table?.previewAccepted === true);
    const risk = interactive && !usesValidatedTableGeometry
      ? geometryRiskFor(entry, request, beforeGeometry, afterGeometry, affected)
      : null;
    if (risk?.hasRisks && !confirmation) {
      for (const [id, state] of [...tableRestore].reverse()) if (state) applyM80State(id, state);
      const restored = applyM80State(entry.id, previous);
      pendingGeometryRisks.set(risk.operationId, { signature: requestSignature(request), risk });
      renderGeometryRiskPreview(risk);
      return failure(request, "geometry_risk_confirmation_required", risk.message, restored, true, risk);
    }
    clearGeometryRiskPreview();
    if (confirmation) pendingGeometryRisks.delete(confirmation.risk.operationId);
    const topology = compareM80Topology(beforeTopology);
    if (!topology.ok) throw Object.assign(new Error("Die Layoutaenderung wuerde die produktive UI-Topologie veraendern."), { code: topology.errorCode });
    return { success: true, changeId: request.changeId, elementId: entry.id, operation: request.operation, effectScope: affected.effect, affectedElementIds: [...affected.ids], affectedStates, errorCode: null, message: confirmation?.action === RISK_ACTIONS.PRESERVE_SPACE ? "Elementbreite geändert; frei gewordener Platz bleibt reserviert." : "Layoutänderung angewandt, geometrisch geprüft und zurückgelesen.", previousState: previous, newState: readback, rollbackSucceeded: true, textResize: textResizeVerification };
  } catch (error) {
    try {
      if (groupRestore?.state) applyM80State(groupRestore.id, groupRestore.state);
      for (const [id, state] of [...tableRestore].reverse()) if (state) applyM80State(id, state);
      const restored = applyM80State(entry.id, previous);
      return failure(request, error?.code || "electron_change_apply_failed", `Layoutänderung wurde sicher abgewiesen und zurückgerollt: ${error?.message || "Unbekannte Geometrieverletzung."}`, restored, true, null, error?.textResize || textResizeVerification);
    } catch (_rollbackError) {
      return failure(request, "electron_change_rollback_failed", "Layoutänderung und Rollback sind fehlgeschlagen.", previous, false);
    }
  }
}

function belongsToScope(entry, scopeId) {
  let current = entry;
  while (current?.parentId) current = getM80RegistryEntry(current.parentId);
  return current?.id === scopeId;
}

function layoutPayload() {
  return createM80RegistrationDescriptor().activeScopes.map((scopeId) => listM80RegistryScopes().find((scope) => scope.scopeId === scopeId)).filter(Boolean).map((scope) => ({
    scopeId: scope.scopeId,
    capturedAt: new Date().toISOString(),
    elements: scope.elements.map((entry) => snapshotM80State(entry.id)).filter(Boolean),
  }));
}

function mountedActiveScopeGroup() {
  return BBM_M80_ACTIVE_SCOPE_GROUPS.find((scopeIds) => getM80Ref(scopeIds[0])) || Object.freeze([]);
}

export function createM80RegistrationDescriptor() {
  const mountedScopes = mountedActiveScopeGroup();
  const registryScopes = listM80RegistryScopes().map((scope) => {
    if (scope.status !== "complete") return scope;
    if (!mountedScopes.includes(scope.scopeId)) {
      return {
        ...scope,
        status: "blocked",
        reason: "registry_reference_not_mounted",
        expectedElementIds: [],
        elements: [],
      };
    }
    const elements = scope.elements.map((entry) => {
      const resolved = { ...entry, ...getM80ReferenceStatus(entry.id), capturedBaseline: capturedRuntimeBaseline(entry) };
      if (diagnosticRegistryRevision > 0 && entry.id === "restarbeiten.edit.validation") {
        return {
          ...resolved,
          baseline: {
            ...resolved.baseline,
            maxWidth: Number(resolved.baseline?.maxWidth || 1200) + diagnosticRegistryRevision,
          },
        };
      }
      return resolved;
    });
    const referenceComplete = elements.every((entry) => entry.referenceResolved === true);
    return {
      ...scope,
      status: referenceComplete ? "complete" : "blocked",
      reason: referenceComplete ? null : "registry_reference_missing",
      elements,
    };
  });
  const activeScopes = mountedScopes.filter((scopeId) => registryScopes.some((scope) => scope.scopeId === scopeId && scope.status === "complete"));
  return {
    applicationId: "bbm-produktiv",
    displayName: "BBM",
    framework: "electron",
    registryVersion: BBM_M80_REGISTRY_VERSION + diagnosticRegistryRevision,
    registryStatus: BBM_M80_REGISTRY_STATUS,
    activeScopes,
    supportedOperations: [...SUPPORTED_OPERATIONS],
    uiCapability: "layout",
    pdfCapability: "unavailable",
    labelFieldSeparation: true,
    visibilityCapability: true,
    registryScopes,
  };
}

export function setM80DiagnosticRegistryRevision(value) {
  const revision = Number(value);
  if (!Number.isInteger(revision) || revision < 0) throw new Error("Ungültige Diagnose-Registryrevision.");
  diagnosticRegistryRevision = revision;
  return diagnosticRegistryRevision;
}

export function advanceM80DiagnosticRegistryRevision() {
  diagnosticRegistryRevision += 1;
  return diagnosticRegistryRevision;
}

export async function emitM80RegistryEvent(action, scopeId = "") {
  if (!REGISTRY_EVENT_ACTIONS.has(action)) throw Object.assign(new Error("Unbekanntes Registryereignis."), { code: "electron_editor_message_invalid" });
  return window.uiEditor?.sendTargetEvent?.({ action, scopeId: String(scopeId || ""), registration: createM80RegistrationDescriptor() });
}

function overlay() {
  let value = document.querySelector("[data-bbm-ui-editor-overlay]");
  if (!value) {
    value = document.createElement("div");
    value.setAttribute("data-bbm-ui-editor-overlay", "true");
    value.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483000;display:none";
    document.body.appendChild(value);
  }
  return value;
}

function directChildCount(id) {
  return listM80RegistryScopes().flatMap((scope) => scope.elements).filter((entry) => entry.parentId === id).length;
}

function selectionCandidates(ids) {
  const seen = new Set();
  return (Array.isArray(ids) ? ids : [ids]).flatMap((id) =>
    createDirectSelectionHierarchy(listM80RegistryScopes().flatMap((scope) => scope.elements), id))
    .filter((candidate) => getM80Ref(candidate.entry.id) && !seen.has(candidate.entry.id) && seen.add(candidate.entry.id));
}

function frameStyle(level) {
  const value = directSelectionFramePresentation(level);
  return {
    border: `${value.lineWidth}px ${value.lineStyle} ${level === "Gruppe" ? "#7c3aed" : level === "Bereich" ? "#9a3412" : "#1d4ed8"}`,
    background: level === "Gruppe" ? "rgba(124,58,237,.07)" : level === "Bereich" ? "rgba(154,52,18,.05)" : "rgba(37,99,235,.09)",
    inset: value.inset,
  };
}

function renderSelectionFrames(candidates, activeIndex = 0, persistent = false) {
  const value = overlay();
  if (typeof value.replaceChildren === "function") value.replaceChildren();
  else value.children = [];
  if (!candidates.length) { value.style.display = "none"; return; }
  candidates.forEach((candidate, index) => {
    const rect = getM80Ref(candidate.entry.id).element.getBoundingClientRect();
    const style = frameStyle(candidate.level);
    const frame = document.createElement("div");
    frame.dataset.selectionLevel = candidate.level;
    frame.dataset.selectionActive = String(index === activeIndex);
    frame.style.cssText = `position:fixed;left:${rect.left - style.inset}px;top:${rect.top - style.inset}px;width:${rect.width + style.inset * 2}px;height:${rect.height + style.inset * 2}px;border:${style.border};background:${style.background};box-sizing:border-box;`;
    const badge = document.createElement("span");
    badge.textContent = describeDirectSelection(candidate, directChildCount(candidate.entry.id));
    badge.style.cssText = `position:absolute;left:-2px;top:${index === activeIndex ? "-29px" : "2px"};max-width:420px;padding:3px 7px;border:2px ${candidate.level === "Gruppe" ? "dashed" : candidate.level === "Bereich" ? "double" : "solid"} #111827;border-radius:4px;background:${index === activeIndex ? "#111827" : "#fff"};color:${index === activeIndex ? "#fff" : "#111827"};font:600 12px/1.25 sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
    frame.appendChild(badge);
    value.appendChild(frame);
  });
  value.dataset.persistent = String(persistent);
  value.style.display = "block";
}

export function highlightM80Element(elementId) {
  const ref = getM80Ref(elementId);
  if (!ref) throw Object.assign(new Error("Element kann nicht markiert werden."), { code: "electron_highlight_failed" });
  selectedId = elementId;
  renderSelectionFrames([{ entry: getM80RegistryEntry(elementId), level: "Element" }], 0, true);
  return true;
}

function stopSelection({ clearHover = false } = {}) {
  selectionMode = false;
  hoverCandidates = [];
  hoverIndex = 0;
  document.removeEventListener("mousemove", onSelectionHover, true);
  document.removeEventListener("click", onSelectionClick, true);
  document.removeEventListener("keydown", onSelectionKey, true);
  if (clearHover) clearM80VisualState();
}

function onSelectionHover(event) {
  if (!selectionMode) return;
  const ids = getM80IdsFromTarget(event.target);
  if (!ids.length) { hoverCandidates = []; renderSelectionFrames([]); return; }
  const candidates = selectionCandidates(ids);
  const same = candidates.map((candidate) => candidate.entry.id).join("|") === hoverCandidates.map((candidate) => candidate.entry.id).join("|");
  hoverCandidates = candidates;
  if (!same) hoverIndex = 0;
  renderSelectionFrames(hoverCandidates, hoverIndex);
}

async function commitHoverSelection() {
  const candidate = hoverCandidates[hoverIndex];
  if (!candidate) return false;
  const ref = getM80Ref(candidate.entry.id);
  const rect = ref.element.getBoundingClientRect();
  stopSelection();
  selectedId = candidate.entry.id;
  renderSelectionFrames([candidate], 0, true);
  await window.uiEditor?.sendTargetEvent?.({
    action: "targetSelectionChanged",
    scopeId: rootScope(candidate.entry.id),
    elementId: candidate.entry.id,
    displayName: candidate.entry.name,
    elementType: candidate.entry.type,
    selectionKind: candidate.entry.selectionKind,
    selectionLevel: candidate.level,
    parentId: candidate.entry.parentId || "",
    childCount: directChildCount(candidate.entry.id),
    boundingRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
  });
  return true;
}

async function onSelectionClick(event) {
  if (!selectionMode || !hoverCandidates.length) return;
  event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  await commitHoverSelection();
}

function onSelectionKey(event) {
  if (!selectionMode) return;
  if (event.key === "Escape") {
    event.preventDefault();
    stopSelection({ clearHover: true });
    void window.uiEditor?.sendTargetEvent?.({ action: "targetSelectionChanged", cancelled: true });
    return;
  }
  if (event.key === "Tab" && hoverCandidates.length) {
    event.preventDefault();
    hoverIndex = cycleDirectSelectionIndex(hoverIndex, hoverCandidates.length, event.shiftKey);
    renderSelectionFrames(hoverCandidates, hoverIndex);
    return;
  }
  if (event.key === "Enter" && hoverCandidates.length) { event.preventDefault(); void commitHoverSelection(); }
}
function rootScope(id) { let entry = getM80RegistryEntry(id); while (entry?.parentId) entry = getM80RegistryEntry(entry.parentId); return entry?.id || ""; }

export function handleM80EditorEvent(event = {}) {
  const action = String(event.action || "");
  if (action === "beginTargetSelection") {
    clearGeometryRiskPreview();
    stopSelection({ clearHover: true });
    selectionMode = true;
    document.addEventListener("mousemove", onSelectionHover, true);
    document.addEventListener("click", onSelectionClick, true);
    document.addEventListener("keydown", onSelectionKey, true);
    return { ok: true };
  }
  if (action === "cancelTargetSelection") { stopSelection({ clearHover: true }); clearGeometryRiskPreview(); return { ok: true }; }
  if (action === "highlightElement") { clearGeometryRiskPreview(); highlightM80Element(event.elementId); return { ok: true }; }
  if (action === "clearGeometryPreview") { clearGeometryRiskPreview(); return { ok: true }; }
  if (action === "editorClosed") {
    const disposition = ["clean", "saved", "discarded"].includes(event.disposition) ? event.disposition : "unknown";
    const restoredElementCount = disposition === "discarded" && editorSessionBoundary
      ? restoreM80WorkingStates(editorSessionBoundary)
      : 0;
    editorSessionBoundary = null;
    stopSelection(); selectedId = null; pendingGeometryRisks.clear(); clearGeometryRiskPreview(); clearM80VisualState();
    return { ok: true, disposition, restoredElementCount };
  }
  return { ok: false, errorCode: "electron_editor_message_invalid" };
}

export function handleM80EditorRequest(request = {}) {
  const action = String(request.action || "");
  if (!ALLOWED_ACTIONS.has(action)) throw Object.assign(new Error("Unbekannte Editoranfrage."), { code: "electron_editor_message_invalid" });
  if (action === "getRegistry") {
    editorSessionBoundary ??= captureM80WorkingStates();
    const registration = createM80RegistrationDescriptor();
    return {
      registryVersion: registration.registryVersion,
      registryStatus: registration.registryStatus,
      activeScopes: registration.activeScopes,
      registryScopes: registration.registryScopes,
    };
  }
  if (action === "getLayoutState") return { scopeStates: layoutPayload() };
  return { changeResult: submitChange({
    ...(request.changeRequest || {}),
    editMode: request.editMode,
    riskConfirmation: request.riskConfirmation,
  }, request.scopeId) };
}

export function createM80StartupRequests(scopeId, element, explicitOperations = null) {
  const entry = getM80RegistryEntry(element.elementId);
  if (!entry) throw Object.assign(new Error("Startprofil enthält ein unbekanntes Element."), { code: "electron_element_not_found" });
  const current = snapshotM80State(entry.id);
  if (!current) throw Object.assign(new Error("Startprofilziel besitzt keine auflösbare Baseline."), { code: "electron_element_not_found" });
  const requests = [];
  const explicit = explicitOperations === null || explicitOperations === undefined
    ? null
    : new Set(explicitOperations[element.elementId] || []);
  const present = (value) => value !== null && value !== undefined;
  const changed = (value, baseline) => present(value) && Math.abs(Number(value) - Number(baseline)) > 0.01;
  const push = (operation, payload) => {
    if (entry.allowedOps.includes(operation) && (explicit === null || explicit.has(operation))) requests.push({ changeId: `startup-${requests.length + 1}-${entry.id}`, elementId: entry.id, operation, payload, source: "target-app-start" });
  };
  const move = {};
  if (changed(element.x, current.x)) move.x = element.x;
  if (changed(element.y, current.y)) move.y = element.y;
  if (Object.keys(move).length) push("move", move);
  if (changed(element.width, current.width)) push("resizeWidth", { width: element.width });
  if (changed(element.height, current.height)) push("resizeHeight", { height: element.height });
  const text = {};
  if (changed(element.textOffsetX, current.textOffsetX)) text.offsetX = element.textOffsetX;
  if (changed(element.textOffsetY, current.textOffsetY)) text.offsetY = element.textOffsetY;
  if (Object.keys(text).length) push("textMove", { text });
  if (changed(element.fontSize, current.fontSize)) push("textResize", { text: { fontSize: element.fontSize } });
  if (present(element.visible) && Boolean(element.visible) !== current.visible) push("setVisibility", { visible: element.visible });
  const desiredSpacing = element.spacing && typeof element.spacing === "object" && !Array.isArray(element.spacing) ? element.spacing : {};
  for (const target of entry.spacingTargets || []) {
    const desiredValue = Number(desiredSpacing[target] || 0);
    const currentValue = Number(current.spacing?.[target] || 0);
    const spacingWasExplicit = explicit === null ||
      ["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"].some((operation) => explicit.has(operation)) ||
      (target === "reservedWidth" && explicit.has("resizeWidth")) ||
      (target === "reservedHeight" && explicit.has("resizeHeight"));
    if (spacingWasExplicit && Math.abs(desiredValue - currentValue) > 0.01 && entry.allowedOps.includes("spacingSet")) {
      requests.push({ changeId: `startup-${requests.length + 1}-${entry.id}`, elementId: entry.id, operation: "spacingSet", payload: { spacing: { target, value: desiredValue } }, source: "target-app-start" });
    }
  }
  const savedTable = element.table && typeof element.table === "object" && !Array.isArray(element.table) ? element.table : null;
  if (savedTable && current.table) {
    if (savedTable.widthMode && savedTable.widthMode !== current.table.widthMode) push("setColumnWidthMode", { table: { widthMode: savedTable.widthMode } });
    if (savedTable.wrapMode && savedTable.wrapMode !== current.table.wrapMode) push("setColumnWrapMode", { table: { wrapMode: savedTable.wrapMode } });
    if (savedTable.overflowMode && savedTable.overflowMode !== current.table.overflowMode) push("setColumnOverflowMode", { table: { overflowMode: savedTable.overflowMode } });
    if (savedTable.horizontalOverflowMode && savedTable.horizontalOverflowMode !== current.table.horizontalOverflowMode) push("setHorizontalOverflowMode", { table: { horizontalOverflowMode: savedTable.horizontalOverflowMode } });
    if (savedTable.rowHeightMode && savedTable.rowHeightMode !== current.table.rowHeightMode) push("setRowHeightMode", { table: { rowHeightMode: savedTable.rowHeightMode } });
  }
  return requests.map((request) => ({ scopeId, request }));
}

export function restoreM80StartupLayout() {
  if (startupRestorePromise) return startupRestorePromise;
  const restore = (async () => {
    const api = window.uiEditor;
    if (typeof api?.loadStartupLayout !== "function") {
      startupRestoreStatus = { state: "baseline", applied: false, code: "startup_layout_bridge_missing", editorProcessRequired: false };
      return startupRestoreStatus;
    }
    const registration = createM80RegistrationDescriptor();
    const requiredScopes = mountedActiveScopeGroup();
    if (!requiredScopes.length || registration.activeScopes.length !== requiredScopes.length) {
      startupRestoreStatus = { state: "waitingForRegistry", applied: false, code: "registry_reference_missing", editorProcessRequired: false };
      return startupRestoreStatus;
    }
    const loaded = await api.loadStartupLayout(registration);
    if (!loaded?.ok || !loaded?.found) {
      startupRestoreStatus = { state: loaded?.state || "baseline", applied: false, code: loaded?.code || "startup_layout_failed", recoveryMarkerPath: loaded?.recoveryMarkerPath || null, editorProcessRequired: false };
      return startupRestoreStatus;
    }
    const original = new Map(listM80Refs().map((ref) => [ref.id, snapshotM80State(ref.id)]));
    try {
      const initialRequests = loaded.scopes.flatMap((scope) => scope.elements.flatMap((element) =>
        createM80StartupRequests(scope.scopeId, element, scope.explicitOperations)));
      await waitForM80StartupGeometry(initialRequests);
      const startupRequests = loaded.scopes.flatMap((scope) => scope.elements.flatMap((element) =>
        createM80StartupRequests(scope.scopeId, element, scope.explicitOperations)));
      for (const item of startupRequests) {
        const result = submitChange(item.request, item.scopeId);
        if (!result.success) throw Object.assign(new Error(`${item.request.elementId}/${item.request.operation}: ${result.message}`), { code: result.errorCode || "startup_layout_apply_failed" });
      }
      const completion = await api.completeStartupLayout({ ok: true, profileSha256: loaded.profileSha256 });
      if (!completion?.ok) throw Object.assign(new Error("Startlayout konnte nicht bestätigt werden."), { code: completion?.code || "startup_layout_apply_failed" });
      startupRestoreStatus = { state: "compatible", applied: true, code: "startup_layout_applied", profileId: loaded.profileId, savedAt: loaded.savedAt, profileSha256: loaded.profileSha256, editorProcessRequired: false };
      return startupRestoreStatus;
    } catch (error) {
      let rollbackSucceeded = true;
      for (const [id, state] of original) {
        try { applyM80State(id, state); } catch { rollbackSucceeded = false; }
      }
      await api.completeStartupLayout({ ok: false, profileSha256: loaded.profileSha256, code: error?.code || "startup_layout_apply_failed", message: error?.message || "Startlayout konnte nicht angewandt werden." });
      startupRestoreStatus = { state: "baseline", applied: false, code: error?.code || "startup_layout_apply_failed", rollbackSucceeded, editorProcessRequired: false };
      return startupRestoreStatus;
    }
  })();
  startupRestorePromise = restore.finally(() => {
    if (startupRestoreStatus.state === "waitingForRegistry") startupRestorePromise = null;
  });
  return startupRestorePromise;
}

export async function refreshM80StartupLayoutAfterRegistryMount() {
  if (startupRestorePromise) {
    try { await startupRestorePromise; } catch (_error) { void _error; }
  }
  startupRestorePromise = null;
  startupRestoreStatus = { state: "pending", applied: false, editorProcessRequired: false };
  return restoreM80StartupLayout();
}

export function clearM80EditorInteraction() { stopSelection(); selectedId = null; pendingGeometryRisks.clear(); clearGeometryRiskPreview(); clearM80VisualState(); }
export function getM80InteractionStatus() { return { selectionMode, selectedId, hoverElementIds: hoverCandidates.map((candidate) => candidate.entry.id), hoverIndex, startupRestoreStatus: { ...startupRestoreStatus }, editorSessionBoundaryElementCount: editorSessionBoundary?.size || 0, scopeStates: layoutPayload() }; }
export { beginM80PilotRender, completeM80PilotRender, registerM80MultiRef, registerM80Ref, resetM80PilotWorkingStatesForDiagnostic };
