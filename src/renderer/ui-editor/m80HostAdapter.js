import {
  BBM_M80_ACTIVE_SCOPE_GROUPS,
  BBM_M80_REGISTRY_STATUS,
  BBM_M80_REGISTRY_VERSION,
  getM83ComponentContract,
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
  setM80WorkingStateOperationObserver,
  snapshotM80Topology,
  compareM80Topology,
  snapshotM80State,
  snapshotM80Geometry,
  validateM83ComponentReferences,
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

const ALLOWED_ACTIONS = new Set(["getRegistry", "getLayoutState", "submitChange", "acknowledgeLayoutSave", "prepareEditorClose"]);
const SUPPORTED_OPERATIONS = Object.freeze(["move", "resize", "resizeWidth", "resizeHeight", "textMove", "textResize", "setVisibility", "spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset", ...TABLE_LAYOUT_OPERATIONS]);
const REGISTRY_EVENT_ACTIONS = new Set(["registryChanged", "registryStatusChanged", "scopeAdded", "scopeChanged", "scopeRemoved"]);
const FORBIDDEN_KEYS = new Set(["fachDaten", "businessData", "domainData", "recordId", "entity", "database", "sql", "status", "responsible", "dueDate", "photos", "rows", "values"]);
const PERSISTED_LAYOUT_ELEMENT_KEYS = new Set(["elementId", "scopeId", "x", "y", "width", "height", "textOffsetX", "textOffsetY", "fontSize", "visible", "spacing", "table"]);
let selectionMode = false;
let selectedId = null;
let hoverCandidates = [];
let hoverIndex = 0;
const startupRestorePromises = new Map();
const startupRestoreStatuses = new Map();
let editorSessionBoundary = null;
let editorSessionOperations = new Map();
let editorSessionSaveAcknowledgements = new Map();
let preparedEditorClose = null;
let diagnosticRegistryRevision = 0;
const pendingGeometryRisks = new Map();
const capturedRuntimeBaselines = new Map();
const validatedStartupRequests = new WeakSet();
let scheduledRegistryMountRestore = null;

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
function number(value, field, { nonNegative = false } = {}) {
  const result = Number(value);
  if (!Number.isFinite(result) || (nonNegative && result < 0)) throw Object.assign(new Error(`Ungültiger Layoutwert: ${field}`), { code: "electron_editor_message_invalid" });
  return result;
}

function finiteDeclaredBound(source, key) {
  const value = source?.[key];
  return Object.hasOwn(source || {}, key) && typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positionBounds(entry, axis) {
  const baseline = entry?.baseline || {};
  const capitalized = axis[0].toUpperCase() + axis.slice(1);
  const minimumKey = `min${capitalized}`;
  const maximumKey = `max${capitalized}`;
  let minimum = finiteDeclaredBound(baseline, minimumKey);
  let maximum = finiteDeclaredBound(baseline, maximumKey);
  const geometry = entry?.geometry || {};
  const legacyOffset = finiteDeclaredBound(geometry, "maximumStoredOffset") ?? finiteDeclaredBound(geometry, "maximumOffset");
  if (!Object.hasOwn(baseline, minimumKey) && legacyOffset !== null) minimum = -Math.abs(legacyOffset);
  if (!Object.hasOwn(baseline, maximumKey) && legacyOffset !== null) maximum = Math.abs(legacyOffset);
  return { minimum, maximum };
}

function dimensionBounds(entry, dimension) {
  const baseline = entry?.baseline || {};
  const capitalized = dimension[0].toUpperCase() + dimension.slice(1);
  return {
    minimum: finiteDeclaredBound(baseline, `min${capitalized}`),
    maximum: finiteDeclaredBound(baseline, `max${capitalized}`),
  };
}

function requireWithinDeclaredBounds(value, bounds, field) {
  if (bounds.minimum !== null && value < bounds.minimum) throw Object.assign(new Error(`${field} unterschreitet die deklarierte Mindestgrenze.`), { code: "electron_editor_message_invalid" });
  if (bounds.maximum !== null && value > bounds.maximum) throw Object.assign(new Error(`${field} überschreitet die deklarierte Höchstgrenze.`), { code: "electron_editor_message_invalid" });
  return value;
}

function desiredState(previous, entry, operation, payload, textResizeIntent = null) {
  const next = { ...previous, spacing: { ...(previous.spacing || {}) } };
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || hasForbidden(payload)) throw Object.assign(new Error("Layout-Payload ist ungültig."), { code: "electron_editor_message_invalid" });
  if (operation === "move") {
    const keys = Object.keys(payload); if (!keys.length || keys.some((key) => !["x", "y"].includes(key))) throw new Error("move-Payload ist ungültig.");
    if (Object.hasOwn(payload, "x")) next.x = requireWithinDeclaredBounds(number(payload.x, "x"), positionBounds(entry, "x"), "x");
    if (Object.hasOwn(payload, "y")) next.y = requireWithinDeclaredBounds(number(payload.y, "y"), positionBounds(entry, "y"), "y");
  } else if (operation === "resize") {
    const keys = Object.keys(payload); if (!keys.length || keys.some((key) => !["width", "height"].includes(key))) throw new Error("resize-Payload ist ungültig.");
    if (Object.hasOwn(payload, "width")) next.width = requireWithinDeclaredBounds(number(payload.width, "width", { nonNegative: true }), dimensionBounds(entry, "width"), "width");
    if (Object.hasOwn(payload, "height")) next.height = requireWithinDeclaredBounds(number(payload.height, "height", { nonNegative: true }), dimensionBounds(entry, "height"), "height");
  } else if (operation === "resizeWidth") {
    if (Object.keys(payload).length !== 1 || !Object.hasOwn(payload, "width")) throw new Error("resizeWidth-Payload ist ungültig.");
    next.width = requireWithinDeclaredBounds(number(payload.width, "width", { nonNegative: true }), dimensionBounds(entry, "width"), "width");
    if (previous.table?.columnId) next.table = { ...previous.table, widthMode: "fixed" };
  } else if (operation === "resizeHeight") {
    if (Object.keys(payload).length !== 1 || !Object.hasOwn(payload, "height")) throw new Error("resizeHeight-Payload ist ungültig.");
    next.height = requireWithinDeclaredBounds(number(payload.height, "height", { nonNegative: true }), dimensionBounds(entry, "height"), "height");
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
    if (sizeChanged && (operation === "move" || (affected.effect === "elementOnly" && ["button", "componentPart", "statusIndicator"].includes(candidate.type))))
      throw Object.assign(new Error(`Größe von '${candidate.name}' darf durch diese Operation nicht verändert werden.`), { code: "electron_unexpected_layout_effect" });
  }
  const target = afterGeometry.get(entry.id);
  if (!target || !Number.isFinite(target.left) || !Number.isFinite(target.top) || target.width < 0 || target.height < 0)
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
function finiteNonNegativeBounds(bounds) {
  return bounds && [bounds.left, bounds.top, bounds.width, bounds.height].every((value) => Number.isFinite(Number(value))) &&
    Number(bounds.width) >= 0 && Number(bounds.height) >= 0;
}
function requireFiniteTargetGeometry(entry, geometry) {
  const bounds = geometry.get(entry.id);
  const widthBounds = dimensionBounds(entry, "width");
  const heightBounds = dimensionBounds(entry, "height");
  const acceptsZeroGeometry = widthBounds.minimum === null && widthBounds.maximum === null &&
    heightBounds.minimum === null && heightBounds.maximum === null;
  const valid = acceptsZeroGeometry ? finiteNonNegativeBounds(bounds) : finitePositiveBounds(bounds);
  if (!valid) {
    throw Object.assign(new Error(`Zielgeometrie von '${entry.name}' fehlt oder ist ungueltig.`), {
      code: "electron_invalid_geometry",
    });
  }
}
function requireMountedTarget(entry) {
  const ref = getM80Ref(entry.id);
  const targets = (ref?.contractTargets || []).filter((target) => target?.isConnected !== false);
  if (!ref || targets.length === 0) {
    throw Object.assign(new Error(`Direktes Ziel von '${entry.name}' fehlt.`), {
      code: "electron_element_not_found",
    });
  }
}
function isLogicalConditionalStartup(entry, request) {
  if (request?.source !== "target-app-start" || entry?.referenceKind !== "multi" || entry?.componentKind !== "conditionalMultiRef") return false;
  const ref = getM80Ref(entry.id);
  const targets = (ref?.contractTargets || []).filter((target) => target?.isConnected !== false);
  return Boolean(ref) && targets.length === 0;
}
function isLayoutEffective(element) {
  let current = element;
  while (current) {
    if (current.hidden === true) return false;
    const style = globalThis.window?.getComputedStyle?.(current) || current.style || {};
    if (String(style.display || "").trim().toLowerCase() === "none") return false;
    if (["hidden", "collapse"].includes(String(style.visibility || "").trim().toLowerCase())) return false;
    current = current.parentElement;
  }
  return Boolean(element);
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
    const ref = getM80Ref(id);
    const targets = (ref?.contractTargets || []).filter((target) => target?.isConnected !== false);
    const element = ref?.element;
    if (!targets.length || !targets.includes(element) || typeof element.getBoundingClientRect !== "function") return false;
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
  if (value) {
    value.replaceChildren();
    value.style.display = "none";
    value.remove?.();
  }
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
    const logicalConditionalStartup = isLogicalConditionalStartup(entry, request);
    const validatedHiddenStartup = request.source === "target-app-start" &&
      validatedStartupRequests.has(request) &&
      Boolean(ref?.element) &&
      !isLayoutEffective(ref.element);
    if (!logicalConditionalStartup) {
      requireMountedTarget(entry);
      if (!validatedHiddenStartup) requireFiniteTargetGeometry(entry, beforeGeometry);
    }
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
      readback = applyM80State(entry.id, { ...previous, width: baseline.currentWidth, visible: baseline.visibility, table: { tableId: entry.tableBinding.tableId, columnId: entry.id, widthMode: baseline.widthMode, wrapMode: baseline.wrapMode, overflowMode: baseline.overflowMode } }, request.operation);
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
      const requestedWidth = groupRestore.state.width - Number(confirmation.risk.technicalDetails?.freedWidth || 0);
      const minimumWidth = finiteDeclaredBound(groupEntry.baseline || {}, "minWidth");
      affectedStates.push(applyM80State(groupEntry.id, { ...groupRestore.state, width: minimumWidth === null ? Math.max(0, requestedWidth) : Math.max(minimumWidth, requestedWidth) }));
    }
    const afterGeometry = snapshotM80Geometry();
    if (confirmation?.action === RISK_ACTIONS.PRESERVE_SPACE) {
      const unexpectedLocal = [...beforeGeometry].filter(([id, before]) => id !== entry.id && geometryChanged(before, afterGeometry.get(id))).map(([id]) => id);
      if (unexpectedLocal.length) throw Object.assign(new Error("Die Position weiterer Elemente würde sich unerwartet verändern."), { code: "electron_unexpected_layout_effect" });
    }
    const affected = validatedHiddenStartup
      ? { ...allowedGeometryChanges(entry, request.operation), unexpected: [] }
      : inspectGeometryEffect(entry, request.operation, beforeGeometry, afterGeometry);
    if (affected.effect === "forbidden") {
      throw Object.assign(new Error("Operation besitzt keine zulaessige Wirkungsmenge."), {
        code: "electron_operation_not_allowed",
      });
    }
    const interactive = request.source === "ui-editor-panel";
    // Reset und bestaetigte Fit-Operationen sind bereits durch den
    // Ziel-App-Vertrag und den Tabellen-Core begrenzt. Sie duerfen deshalb
    // nicht an der Geometrie des aktuell ueberbreiten Laufzeitzustands
    // haengen bleiben.
    const usesValidatedTableGeometry = request.operation === "resetTable" ||
      (["fitTableToViewport", "resizeColumnsProportionally"].includes(request.operation) && request.payload?.table?.previewAccepted === true);
    const unvalidatedStartupRequest = request.source === "target-app-start" && !validatedStartupRequests.has(request);
    const canEvaluateGeometryRisk = finitePositiveBounds(beforeGeometry.get(entry.id)) && finitePositiveBounds(afterGeometry.get(entry.id));
    const risk = (interactive || unvalidatedStartupRequest) && !usesValidatedTableGeometry && canEvaluateGeometryRisk
      ? geometryRiskFor(entry, request, beforeGeometry, afterGeometry, affected)
      : null;
    if (risk?.hasRisks && !confirmation) {
      for (const [id, state] of [...tableRestore].reverse()) if (state) applyM80State(id, state);
      const restored = applyM80State(entry.id, previous, request.operation);
      if (interactive) {
        pendingGeometryRisks.set(risk.operationId, { signature: requestSignature(request), risk });
        renderGeometryRiskPreview(risk);
      }
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
      const restored = applyM80State(entry.id, previous, request.operation);
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

function layoutValueMatches(persisted, current, tolerance = 0.05) {
  if (persisted === null || persisted === undefined) return true;
  if (typeof persisted === "number") return typeof current === "number" && Number.isFinite(current) && Math.abs(persisted - current) <= tolerance;
  if (typeof persisted === "boolean" || typeof persisted === "string") return persisted === current;
  if (Array.isArray(persisted)) return Array.isArray(current) && persisted.length === current.length && persisted.every((value, index) => layoutValueMatches(value, current[index], tolerance));
  if (typeof persisted === "object") return current && typeof current === "object" && !Array.isArray(current) &&
    Object.entries(persisted).every(([key, value]) => layoutValueMatches(value, current[key], tolerance));
  return false;
}

function persistedLayoutForOperations(element, operations) {
  const selected = {};
  const include = (key) => {
    if (element?.[key] !== null && element?.[key] !== undefined) selected[key] = element[key];
  };
  if (operations.has("move")) { include("x"); include("y"); }
  if (operations.has("resize") || operations.has("resizeWidth")) include("width");
  if (operations.has("resize") || operations.has("resizeHeight")) include("height");
  if (operations.has("textMove")) { include("textOffsetX"); include("textOffsetY"); }
  if (operations.has("textResize")) include("fontSize");
  if (operations.has("setVisibility")) include("visible");
  if (["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"].some((operation) => operations.has(operation))) include("spacing");
  else if (element?.spacing && typeof element.spacing === "object" && !Array.isArray(element.spacing)) {
    const spacing = {};
    if ((operations.has("resize") || operations.has("resizeWidth")) && element.spacing.reservedWidth !== undefined)
      spacing.reservedWidth = element.spacing.reservedWidth;
    if ((operations.has("resize") || operations.has("resizeHeight")) && element.spacing.reservedHeight !== undefined)
      spacing.reservedHeight = element.spacing.reservedHeight;
    if (Object.keys(spacing).length) selected.spacing = spacing;
  }
  if (TABLE_LAYOUT_OPERATIONS.some((operation) => operations.has(operation))) include("table");
  return selected;
}

function acknowledgePersistentLayoutSave(request) {
  const saveRequestId = String(request.saveRequestId || "");
  const snapshot = request.snapshot;
  if (!/^[a-f0-9]{32}$/i.test(saveRequestId) || !snapshot || typeof snapshot !== "object" || Array.isArray(snapshot))
    throw Object.assign(new Error("Save-Snapshot oder requestId fehlt."), { code: "electron_editor_message_invalid" });
  const serializedSnapshot = JSON.stringify(snapshot);
  const previous = editorSessionSaveAcknowledgements.get(saveRequestId);
  if (previous) {
    if (previous.serializedSnapshot !== serializedSnapshot)
      throw Object.assign(new Error("Save-requestId wurde mit einem anderen Snapshot wiederverwendet."), { code: "electron_editor_message_invalid" });
    return previous.acknowledgement;
  }
  if (!editorSessionBoundary)
    throw Object.assign(new Error("Es ist keine aktive Editorsitzung vorhanden."), { code: "electron_editor_session_invalid" });
  if (snapshot.applicationId !== "bbm-produktiv" || typeof snapshot.profileId !== "string" || !snapshot.profileId ||
      !Number.isFinite(Date.parse(snapshot.savedAt)) || !Array.isArray(snapshot.scopes))
    throw Object.assign(new Error("Der persistente Save-Snapshot ist unvollständig."), { code: "electron_editor_message_invalid" });

  const currentScopes = layoutPayload();
  const currentByScope = new Map(currentScopes.map((scope) => [scope.scopeId, scope]));
  const persistedScopeIds = new Set(snapshot.scopes.map((scope) => scope?.scopeId));
  if (snapshot.scopes.length !== currentScopes.length || persistedScopeIds.size !== snapshot.scopes.length)
    throw Object.assign(new Error("Save-Snapshot und aktive Registry-Scopes stimmen nicht überein."), { code: "electron_editor_message_invalid" });
  for (const persistedScope of snapshot.scopes) {
    const currentScope = currentByScope.get(persistedScope?.scopeId);
    const persistedElements = persistedScope?.layoutState?.elements;
    if (!currentScope || !Array.isArray(persistedElements) || persistedElements.length !== currentScope.elements.length)
      throw Object.assign(new Error("Save-Snapshot enthält einen ungültigen Scope."), { code: "electron_editor_message_invalid" });
    const currentById = new Map(currentScope.elements.map((element) => [element.elementId, element]));
    const persistedElementIds = new Set(persistedElements.map((element) => element?.elementId));
    if (persistedElementIds.size !== persistedElements.length)
      throw Object.assign(new Error("Save-Snapshot enthält doppelte Element-IDs."), { code: "electron_editor_message_invalid" });
    for (const persistedElement of persistedElements) {
      const currentElement = currentById.get(persistedElement?.elementId);
      const persistedScopeId = persistedElement?.scopeId;
      const operations = new Set(persistedScope?.explicitOperations?.[persistedElement?.elementId] || []);
      const hasUnknownOperation = [...operations].some((operation) => !SUPPORTED_OPERATIONS.includes(operation));
      const persistedLayout = persistedLayoutForOperations(persistedElement, operations);
      const hasTransientOrUnknownField = Object.keys(persistedElement || {}).some((key) => !PERSISTED_LAYOUT_ELEMENT_KEYS.has(key));
      if (!currentElement || persistedScopeId !== persistedScope.scopeId || hasTransientOrUnknownField || hasUnknownOperation || !layoutValueMatches(persistedLayout, currentElement))
        throw Object.assign(new Error(`Save-Snapshot stimmt nicht mit dem angewendeten Rendererzustand überein: ${persistedElement?.elementId || "unbekannt"}.`), { code: "electron_editor_message_invalid" });
    }
  }

  editorSessionBoundary = captureM80WorkingStates();
  editorSessionOperations = new Map();
  const acknowledgement = Object.freeze({
    accepted: true,
    persisted: true,
    saveRequestId,
    profileId: snapshot.profileId,
    savedAt: snapshot.savedAt,
    acknowledgedAt: new Date().toISOString(),
  });
  editorSessionSaveAcknowledgements.set(saveRequestId, { serializedSnapshot, acknowledgement });
  return acknowledgement;
}

function completeEditorSession(disposition) {
  setM80WorkingStateOperationObserver(null);
  const restoredElementCount = disposition === "discarded" && editorSessionBoundary
    ? restoreM80WorkingStates(editorSessionBoundary, editorSessionOperations)
    : 0;
  editorSessionBoundary = null;
  editorSessionOperations = new Map();
  editorSessionSaveAcknowledgements = new Map();
  stopSelection(); selectedId = null; pendingGeometryRisks.clear(); clearGeometryRiskPreview(); clearM80VisualState();
  return { ok: true, disposition, restoredElementCount };
}

function prepareEditorClose(request) {
  const disposition = ["clean", "saved", "discarded"].includes(request.disposition) ? request.disposition : "unknown";
  const saveRequestId = String(request.saveRequestId || "");
  if (disposition === "unknown" || disposition === "saved" && !editorSessionSaveAcknowledgements.has(saveRequestId))
    throw Object.assign(new Error("Editor-Close ist ohne bestätigten Save-Zustand nicht freigegeben."), { code: "electron_editor_session_invalid" });
  const result = completeEditorSession(disposition);
  preparedEditorClose = Object.freeze({ disposition, saveRequestId, result });
  return Object.freeze({ accepted: true, disposition, saveRequestId, restoredElementCount: result.restoredElementCount });
}

function mountedActiveScopeGroup() {
  return BBM_M80_ACTIVE_SCOPE_GROUPS.find((scopeIds) => getM80Ref(scopeIds[0])) || Object.freeze([]);
}

export function createM80RegistrationDescriptor() {
  const mountedScopes = mountedActiveScopeGroup();
  const mountedComponentIds = listM80RegistryScopes()
    .filter((scope) => mountedScopes.includes(scope.scopeId))
    .flatMap((scope) => scope.componentIds || []);
  let componentReferenceErrors = [];
  try {
    if (mountedComponentIds.length) validateM83ComponentReferences(mountedComponentIds);
  } catch (error) {
    componentReferenceErrors = Array.isArray(error?.details) ? error.details : [{ code: error?.code || "component_reference_contract_invalid", message: error?.message || String(error) }];
  }
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
    const scopeComponentIds = new Set(scope.componentIds || []);
    const scopeReferenceErrors = componentReferenceErrors.filter((entry) => !entry.componentId || scopeComponentIds.has(entry.componentId));
    const referenceComplete = elements.every((entry) => entry.referenceResolved === true) && scopeReferenceErrors.length === 0;
    return {
      ...scope,
      status: referenceComplete ? "complete" : "blocked",
      reason: referenceComplete ? null : scopeReferenceErrors[0]?.code || "registry_reference_missing",
      componentReferenceErrors: scopeReferenceErrors,
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

export function inspectM80ScopeRegistration(scopeId) {
  const requestedScopeId = String(scopeId || "").trim();
  const registration = createM80RegistrationDescriptor();
  const declaredScope = listM80RegistryScopes().find((scope) => scope.scopeId === requestedScopeId) || null;
  const resolvedScope = registration.registryScopes.find((scope) => scope.scopeId === requestedScopeId) || null;
  const presentRefs = new Map(listM80Refs().map((ref) => [ref.id, ref]));
  const expectedElementIds = [...(declaredScope?.expectedElementIds || [])];
  const presentElementIds = expectedElementIds.filter((id) => presentRefs.has(id));
  const missingElementIds = expectedElementIds.filter((id) => !getM80ReferenceStatus(id).referenceResolved);
  const componentByElementId = new Map((declaredScope?.componentIds || []).flatMap((componentId) => {
    const component = getM83ComponentContract(componentId);
    return (component?.slots || []).map((slot) => [slot.element.id, componentId]);
  }));
  return {
    capturedAt: new Date().toISOString(),
    expectedScopeId: requestedScopeId,
    activeScopeIds: [...registration.activeScopes],
    expectedElementIds,
    presentElementIds,
    missingElementIds,
    elements: expectedElementIds.map((id) => {
      const ref = presentRefs.get(id);
      const status = getM80ReferenceStatus(id);
      return {
        id,
        componentId: componentByElementId.get(id) || null,
        referenceResolved: status.referenceResolved,
        referenceKind: getM80RegistryEntry(id)?.referenceKind || null,
        targetCount: status.targetCount,
        mountedInstanceCount: status.mountedInstanceCount,
        registeredAt: ref?.registeredAt || null,
      };
    }),
    registrationReason: resolvedScope?.reason || null,
    componentReferenceErrors: [...(resolvedScope?.componentReferenceErrors || [])],
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

function positiveClientRect(element) {
  if (!element || element.isConnected === false || typeof element.getBoundingClientRect !== "function") return null;
  const rect = element.getBoundingClientRect();
  if (![rect?.left, rect?.top, rect?.width, rect?.height].every((value) => Number.isFinite(Number(value)))) return null;
  if (Number(rect.width) <= 0 || Number(rect.height) <= 0) return null;
  const style = globalThis.window?.getComputedStyle?.(element) || element.style || {};
  if (String(style.display || "").trim().toLowerCase() === "none") return null;
  if (["hidden", "collapse"].includes(String(style.visibility || "").trim().toLowerCase())) return null;

  let left = Number(rect.left);
  let top = Number(rect.top);
  let right = Number(rect.right ?? (left + Number(rect.width)));
  let bottom = Number(rect.bottom ?? (top + Number(rect.height)));
  const viewportWidth = Number(globalThis.window?.innerWidth);
  const viewportHeight = Number(globalThis.window?.innerHeight);
  if (Number.isFinite(viewportWidth) && viewportWidth > 0) {
    left = Math.max(left, 0);
    right = Math.min(right, viewportWidth);
  }
  if (Number.isFinite(viewportHeight) && viewportHeight > 0) {
    top = Math.max(top, 0);
    bottom = Math.min(bottom, viewportHeight);
  }

  let ancestor = element.parentElement;
  while (ancestor) {
    const ancestorStyle = globalThis.window?.getComputedStyle?.(ancestor) || ancestor.style || {};
    const overflow = String(ancestorStyle.overflow || "").trim().toLowerCase();
    const overflowX = String(ancestorStyle.overflowX || overflow).trim().toLowerCase();
    const overflowY = String(ancestorStyle.overflowY || overflow).trim().toLowerCase();
    const clipsX = ["auto", "hidden", "scroll", "clip"].includes(overflowX);
    const clipsY = ["auto", "hidden", "scroll", "clip"].includes(overflowY);
    if ((clipsX || clipsY) && typeof ancestor.getBoundingClientRect === "function") {
      const ancestorRect = ancestor.getBoundingClientRect();
      if (clipsX) {
        left = Math.max(left, Number(ancestorRect.left));
        right = Math.min(right, Number(ancestorRect.right ?? (Number(ancestorRect.left) + Number(ancestorRect.width))));
      }
      if (clipsY) {
        top = Math.max(top, Number(ancestorRect.top));
        bottom = Math.min(bottom, Number(ancestorRect.bottom ?? (Number(ancestorRect.top) + Number(ancestorRect.height))));
      }
    }
    ancestor = ancestor.parentElement;
  }
  return right > left && bottom > top ? rect : null;
}

function visibleRefTarget(ref, sourceElement = null) {
  if (!ref) return null;
  const targets = [...new Set((ref.contractTargets || []).filter((target) => target?.isConnected !== false))];
  if (!targets.length) return null;
  if (sourceElement) {
    const sourceTarget = targets.find((target) => target === sourceElement || (typeof target.contains === "function" && target.contains(sourceElement)));
    if (positiveClientRect(sourceTarget)) return sourceTarget;
  }
  return targets.find((target) => positiveClientRect(target)) || null;
}

function selectionCandidates(ids, sourceElement = null) {
  const seen = new Set();
  return (Array.isArray(ids) ? ids : [ids]).flatMap((id) =>
    createDirectSelectionHierarchy(listM80RegistryScopes().flatMap((scope) => scope.elements), id))
    .map((candidate) => ({ ...candidate, visualElement: visibleRefTarget(getM80Ref(candidate.entry.id), sourceElement) }))
    .filter((candidate) => candidate.visualElement && !seen.has(candidate.entry.id) && seen.add(candidate.entry.id));
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
  const resolved = candidates
    .map((candidate) => ({ ...candidate, visualElement: candidate.visualElement || visibleRefTarget(getM80Ref(candidate.entry.id)) }))
    .filter((candidate) => candidate.visualElement);
  if (!resolved.length) { value.style.display = "none"; return false; }
  const activeId = candidates[activeIndex]?.entry?.id;
  const resolvedActiveIndex = Math.max(0, resolved.findIndex((candidate) => candidate.entry.id === activeId));
  resolved.forEach((candidate, index) => {
    const rect = candidate.visualElement.getBoundingClientRect();
    const style = frameStyle(candidate.level);
    const frame = document.createElement("div");
    frame.dataset.selectionLevel = candidate.level;
    frame.dataset.selectionActive = String(index === resolvedActiveIndex);
    frame.style.cssText = `position:fixed;left:${rect.left - style.inset}px;top:${rect.top - style.inset}px;width:${rect.width + style.inset * 2}px;height:${rect.height + style.inset * 2}px;border:${style.border};background:${style.background};box-sizing:border-box;`;
    const badge = document.createElement("span");
    badge.textContent = describeDirectSelection(candidate, directChildCount(candidate.entry.id));
    badge.style.cssText = `position:absolute;left:-2px;top:${index === resolvedActiveIndex ? "-29px" : "2px"};max-width:420px;padding:3px 7px;border:2px ${candidate.level === "Gruppe" ? "dashed" : candidate.level === "Bereich" ? "double" : "solid"} #111827;border-radius:4px;background:${index === resolvedActiveIndex ? "#111827" : "#fff"};color:${index === resolvedActiveIndex ? "#fff" : "#111827"};font:600 12px/1.25 sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
    frame.appendChild(badge);
    value.appendChild(frame);
  });
  value.dataset.persistent = String(persistent);
  value.style.display = "block";
  return true;
}

export function highlightM80Element(elementId) {
  const ref = getM80Ref(elementId);
  if (!ref) throw Object.assign(new Error("Element kann nicht markiert werden."), { code: "electron_highlight_failed" });
  const visualElement = visibleRefTarget(ref);
  if (!visualElement) throw Object.assign(new Error("Element besitzt derzeit keine sichtbare Geometrie."), { code: "electron_invalid_geometry" });
  selectedId = elementId;
  renderSelectionFrames([{ entry: getM80RegistryEntry(elementId), level: "Element", visualElement }], 0, true);
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
  const candidates = selectionCandidates(ids, event.target);
  const same = candidates.map((candidate) => candidate.entry.id).join("|") === hoverCandidates.map((candidate) => candidate.entry.id).join("|");
  hoverCandidates = candidates;
  if (!same) hoverIndex = 0;
  renderSelectionFrames(hoverCandidates, hoverIndex);
}

async function commitHoverSelection() {
  const candidate = hoverCandidates[hoverIndex];
  if (!candidate) return false;
  const visualElement = candidate.visualElement || visibleRefTarget(getM80Ref(candidate.entry.id));
  if (!visualElement) return false;
  const rect = visualElement.getBoundingClientRect();
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
    const requestedDisposition = ["clean", "saved", "discarded"].includes(event.disposition) ? event.disposition : "unknown";
    const saveRequestId = String(event.saveRequestId || "");
    if (preparedEditorClose && preparedEditorClose.disposition === requestedDisposition && preparedEditorClose.saveRequestId === saveRequestId) {
      const result = preparedEditorClose.result;
      preparedEditorClose = null;
      return result;
    }
    const disposition = requestedDisposition === "saved" && !editorSessionSaveAcknowledgements.has(saveRequestId)
      ? "unknown"
      : requestedDisposition;
    preparedEditorClose = null;
    return completeEditorSession(disposition);
  }
  return { ok: false, errorCode: "electron_editor_message_invalid" };
}

export function handleM80EditorRequest(request = {}) {
  const action = String(request.action || "");
  if (!ALLOWED_ACTIONS.has(action)) throw Object.assign(new Error("Unbekannte Editoranfrage."), { code: "electron_editor_message_invalid" });
  if (action === "getRegistry") {
    if (!editorSessionBoundary) {
      editorSessionBoundary = captureM80WorkingStates();
      editorSessionOperations = new Map();
      editorSessionSaveAcknowledgements = new Map();
      preparedEditorClose = null;
      setM80WorkingStateOperationObserver((elementId, operation) => {
        const operations = editorSessionOperations.get(elementId) || new Set();
        operations.add(operation);
        editorSessionOperations.set(elementId, operations);
      });
    }
    const registration = createM80RegistrationDescriptor();
    return {
      registryVersion: registration.registryVersion,
      registryStatus: registration.registryStatus,
      activeScopes: registration.activeScopes,
      registryScopes: registration.registryScopes,
    };
  }
  if (action === "getLayoutState") return { scopeStates: layoutPayload() };
  if (action === "acknowledgeLayoutSave") return { saveAcknowledgement: acknowledgePersistentLayoutSave(request) };
  if (action === "prepareEditorClose") return { closePreparation: prepareEditorClose(request) };
  const changeRequest = {
    ...(request.changeRequest || {}),
    editMode: request.editMode,
    riskConfirmation: request.riskConfirmation,
  };
  const changeResult = submitChange(changeRequest, request.scopeId);
  if (changeResult.success && editorSessionBoundary && changeRequest.source !== "target-app-start") {
    const operations = editorSessionOperations.get(changeRequest.elementId) || new Set();
    operations.add(changeRequest.operation);
    editorSessionOperations.set(changeRequest.elementId, operations);
  }
  return { changeResult };
}

export function createM80StartupRequests(scopeId, element, explicitOperations = null, trustedPersistentProfile = false) {
  const entry = getM80RegistryEntry(element.elementId);
  if (!entry) throw Object.assign(new Error("Startprofil enthält ein unbekanntes Element."), { code: "electron_element_not_found" });
  const explicit = explicitOperations === null || explicitOperations === undefined
    ? null
    : new Set(explicitOperations[element.elementId] || []);
  if (explicit?.size === 0) return [];
  const current = snapshotM80State(entry.id);
  if (!current) throw Object.assign(new Error(`Startprofilziel '${entry.id}' besitzt keine auflösbare Baseline.`), { code: "electron_element_not_found" });
  const requests = [];
  const present = (value) => value !== null && value !== undefined;
  const changed = (value, baseline) => present(value) && Math.abs(Number(value) - Number(baseline)) > 0.01;
  const push = (operation, payload) => {
    if (entry.allowedOps.includes(operation) && (explicit === null || explicit.has(operation))) {
      const request = { changeId: `startup-${requests.length + 1}-${entry.id}`, elementId: entry.id, operation, payload, source: "target-app-start" };
      if (trustedPersistentProfile) validatedStartupRequests.add(request);
      requests.push(request);
    }
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
      const request = { changeId: `startup-${requests.length + 1}-${entry.id}`, elementId: entry.id, operation: "spacingSet", payload: { spacing: { target, value: desiredValue } }, source: "target-app-start" };
      if (trustedPersistentProfile) validatedStartupRequests.add(request);
      requests.push(request);
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

export function createM80StartupRestoreKey(activeScopes) {
  const scopeIds = Array.isArray(activeScopes) ? activeScopes.map((scopeId) => String(scopeId || "").trim()).filter(Boolean) : [];
  const moduleIds = [...new Set(scopeIds.map((scopeId) => scopeId.split(".", 1)[0]))];
  if (moduleIds.length !== 1 || !/^[a-z0-9-]+$/.test(moduleIds[0])) throw new TypeError("Aktive Scopes ergeben keinen eindeutigen Modulschlüssel.");
  return `module:${moduleIds[0]}`;
}

export function restoreM80StartupLayout() {
  const requiredScopes = mountedActiveScopeGroup();
  if (!requiredScopes.length) return Promise.resolve({ state: "waitingForRegistry", applied: false, code: "registry_reference_missing", editorProcessRequired: false });
  const restoreKey = createM80StartupRestoreKey(requiredScopes);
  if (startupRestorePromises.has(restoreKey)) return startupRestorePromises.get(restoreKey);
  const setStatus = (status) => {
    startupRestoreStatuses.set(restoreKey, status);
    return status;
  };
  const restore = (async () => {
    const api = window.uiEditor;
    if (typeof api?.loadStartupLayout !== "function") {
      return setStatus({ state: "baseline", applied: false, code: "startup_layout_bridge_missing", editorProcessRequired: false });
    }
    const registration = createM80RegistrationDescriptor();
    if (registration.activeScopes.length !== requiredScopes.length) {
      return setStatus({ state: "waitingForRegistry", applied: false, code: "registry_reference_missing", editorProcessRequired: false });
    }
    const loaded = await api.loadStartupLayout(registration);
    if (!loaded?.ok || !loaded?.found) {
      return setStatus({ state: loaded?.state || "baseline", applied: false, code: loaded?.code || "startup_layout_failed", recoveryMarkerPath: loaded?.recoveryMarkerPath || null, editorProcessRequired: false });
    }
    const appliedStartupRequests = [];
    try {
      const trustedPersistentProfile = /^[a-f0-9]{64}$/i.test(String(loaded.profileSha256 || ""));
      const initialRequests = loaded.scopes.flatMap((scope) => scope.elements.flatMap((element) =>
        createM80StartupRequests(scope.scopeId, element, scope.explicitOperations, trustedPersistentProfile)));
      await waitForM80StartupGeometry(initialRequests);
      const startupRequests = loaded.scopes.flatMap((scope) => scope.elements.flatMap((element) =>
        createM80StartupRequests(scope.scopeId, element, scope.explicitOperations, trustedPersistentProfile)));
      for (const item of startupRequests) {
        const result = submitChange(item.request, item.scopeId);
        if (!result.success) throw Object.assign(new Error(`${item.request.elementId}/${item.request.operation}: ${result.message}`), { code: result.errorCode || "startup_layout_apply_failed" });
        appliedStartupRequests.push({ id: item.request.elementId, operation: item.request.operation, state: result.previousState });
      }
      const completion = await api.completeStartupLayout({ ok: true, profileSha256: loaded.profileSha256, layoutStorageKey: loaded.layoutStorageKey });
      if (!completion?.ok) throw Object.assign(new Error("Startlayout konnte nicht bestätigt werden."), { code: completion?.code || "startup_layout_apply_failed" });
      return setStatus({ state: "compatible", applied: true, code: "startup_layout_applied", profileId: loaded.profileId, savedAt: loaded.savedAt, profileSha256: loaded.profileSha256, editorProcessRequired: false });
    } catch (error) {
      let rollbackSucceeded = true;
      for (const item of [...appliedStartupRequests].reverse()) {
        try { applyM80State(item.id, item.state, item.operation); } catch { rollbackSucceeded = false; }
      }
      await api.completeStartupLayout({ ok: false, profileSha256: loaded.profileSha256, layoutStorageKey: loaded.layoutStorageKey, code: error?.code || "startup_layout_apply_failed", message: error?.message || "Startlayout konnte nicht angewandt werden." });
      return setStatus({ state: "baseline", applied: false, code: error?.code || "startup_layout_apply_failed", rollbackSucceeded, editorProcessRequired: false });
    }
  })();
  const trackedRestore = restore.finally(() => {
    if (startupRestoreStatuses.get(restoreKey)?.state === "waitingForRegistry") startupRestorePromises.delete(restoreKey);
  });
  startupRestorePromises.set(restoreKey, trackedRestore);
  return trackedRestore;
}

export async function refreshM80StartupLayoutAfterRegistryMount() {
  const requiredScopes = mountedActiveScopeGroup();
  if (!requiredScopes.length) return restoreM80StartupLayout();
  const restoreKey = createM80StartupRestoreKey(requiredScopes);
  const currentRestore = startupRestorePromises.get(restoreKey);
  if (currentRestore) {
    try { await currentRestore; } catch (_error) { void _error; }
  }
  startupRestorePromises.delete(restoreKey);
  startupRestoreStatuses.set(restoreKey, { state: "pending", applied: false, editorProcessRequired: false });
  return restoreM80StartupLayout();
}

export function restoreM80StartupLayoutAfterRegistryMount() {
  if (typeof globalThis.window?.uiEditor?.loadStartupLayout !== "function") {
    return Promise.resolve({ state: "baseline", applied: false, code: "startup_layout_bridge_missing", editorProcessRequired: false });
  }
  if (scheduledRegistryMountRestore) return scheduledRegistryMountRestore;
  scheduledRegistryMountRestore = Promise.resolve().then(async () => {
    const initial = await restoreM80StartupLayout();
    if (initial?.code !== "registry_reference_missing") return initial;
    return refreshM80StartupLayoutAfterRegistryMount();
  }).finally(() => {
    scheduledRegistryMountRestore = null;
  });
  return scheduledRegistryMountRestore;
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("bbm:m80-pilot-render-complete", () => {
    void restoreM80StartupLayoutAfterRegistryMount();
  });
}

export function clearM80EditorInteraction() { stopSelection(); selectedId = null; pendingGeometryRisks.clear(); clearGeometryRiskPreview(); clearM80VisualState(); }
export function getM80InteractionStatus() {
  const requiredScopes = mountedActiveScopeGroup();
  const restoreKey = requiredScopes.length ? createM80StartupRestoreKey(requiredScopes) : "";
  const startupRestoreStatus = startupRestoreStatuses.get(restoreKey) || { state: "pending", applied: false, editorProcessRequired: false };
  return { selectionMode, selectedId, hoverElementIds: hoverCandidates.map((candidate) => candidate.entry.id), hoverIndex, startupRestoreStatus: { ...startupRestoreStatus }, editorSessionBoundaryElementCount: editorSessionBoundary?.size || 0, editorSessionSaveAcknowledgementCount: editorSessionSaveAcknowledgements.size, scopeStates: layoutPayload() };
}
export { beginM80PilotRender, completeM80PilotRender, registerM80MultiRef, registerM80Ref, resetM80PilotWorkingStatesForDiagnostic };
