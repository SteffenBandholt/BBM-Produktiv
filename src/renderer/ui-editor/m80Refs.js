import { getM80RegistryEntry, getM83ComponentContract, listM80RegistryScopes, listM83ComponentContracts, m80EditorAttributes } from "./m80Registry.js";
import {
  orderUiComponentSelectionTargetIds,
  validateUiComponentReferenceBindings,
} from "../../../node_modules/ui-editor-kit/dist/ui-component-contract.mjs";
import {
  fitTableToViewport,
  measureTableLayout,
  normalizeTableLayout,
} from "../../../node_modules/ui-editor-kit/dist/table-layout-contract.mjs";
import {
  compareUiTopology,
  createUiTopologyFingerprint,
} from "../../../node_modules/ui-editor-kit/dist/ui-topology-fingerprint.mjs";

const refs = new Map();
const elementIds = new WeakMap();
const workingStates = new Map();
const persistentWorkingStateIds = new Set();
const persistentWorkingStateOperations = new Map();
const tableColumnRuntimeBindings = new Map();
const tableRuntimeBindings = new Map();
const HIDDEN_CLASS = "bbm-ui-editor-hidden";

function finite(value, fallback = 0) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
function positive(value, fallback) { const number = finite(value, fallback); return number > 0 ? number : fallback; }
function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }
function px(value) { return `${Math.round(Number(value) * 1000) / 1000}px`; }
function isElementRef(value) { return Boolean(value) && typeof value.setAttribute === "function"; }
function rectOf(element) { return typeof element.getBoundingClientRect === "function" ? element.getBoundingClientRect() : { left: 0, top: 0, width: finite(parseFloat(element.style?.width)), height: finite(parseFloat(element.style?.height)) }; }
function styleOf(element) { return globalThis.window?.getComputedStyle?.(element) || element.style || {}; }
function hasClass(element, className) { return element.classList?.contains?.(className) ?? String(element.className || "").split(/\s+/).includes(className); }
function toggleClass(element, className, enabled) {
  if (element.classList?.toggle) { element.classList.toggle(className, enabled); return; }
  const names = new Set(String(element.className || "").split(/\s+/).filter(Boolean));
  if (enabled) names.add(className); else names.delete(className);
  element.className = [...names].join(" ");
}
function setCustomProperty(style, name, value) { if (typeof style?.setProperty === "function") style.setProperty(name, value); else if (style) style[name] = value; }
function getCustomProperty(style, name) { return typeof style?.getPropertyValue === "function" ? style.getPropertyValue(name) : style?.[name]; }
function applyAttributes(target, id) {
  for (const [name, value] of Object.entries(m80EditorAttributes(id))) target.setAttribute(name, value);
}
function bindElementId(target, id) {
  if (!isElementRef(target)) return;
  const ids = elementIds.get(target) || new Set();
  ids.add(id);
  elementIds.set(target, ids);
}

function topologyStableId(element, fallback) {
  return String(element?.getAttribute?.("data-ui-editor-id") || element?.dataset?.uiEditorId || element?.id || fallback || "").trim();
}

function isDynamicTopologyElement(element, stableId) {
  if (stableId.startsWith("restarbeiten.record.") || stableId.startsWith("protokoll.record.")) return true;
  let current = element;
  while (current) {
    const names = String(current.className || "").split(/\s+/);
    if (names.includes("bbm-restarbeiten-record") || names.includes("bbm-tops-list-row")) return true;
    current = current.parentElement;
  }
  return false;
}

export function snapshotM80Topology() {
  const byElement = new Map();
  for (const ref of refs.values()) {
    const element = ref.element;
    if (!isElementRef(element) || byElement.has(element)) continue;
    const stableId = topologyStableId(element, ref.id);
    if (!stableId || isDynamicTopologyElement(element, stableId)) continue;
    byElement.set(element, { element, stableId, kind: String(element.tagName || element.nodeName || element.constructor?.name || "Element") });
  }
  const roots = [...byElement.values()].filter((item) => {
    let ancestor = item.element.parentElement;
    while (ancestor && !byElement.has(ancestor)) ancestor = ancestor.parentElement;
    return !ancestor;
  }).map((item) => item.element);
  const nodes = [...byElement.values()].map((candidate, fallbackOrder) => {
    let parent = candidate.element.parentElement;
    while (parent && !byElement.has(parent)) parent = parent.parentElement;
    const parentCandidate = parent ? byElement.get(parent) : null;
    const siblings = parentCandidate
      ? Array.from(parentCandidate.element.children || []).filter((child) => byElement.has(child))
      : roots;
    const order = siblings.indexOf(candidate.element);
    return {
      kind: candidate.kind,
      stableId: candidate.stableId,
      parentId: parentCandidate?.stableId || null,
      order: order >= 0 ? order : fallbackOrder,
    };
  });
  return Object.freeze({ nodes: Object.freeze(nodes), fingerprint: createUiTopologyFingerprint(nodes) });
}

export function compareM80Topology(before) {
  const previous = Array.isArray(before) ? before : before?.nodes;
  if (!Array.isArray(previous)) throw new TypeError("Vorheriger BBM-Topologiesnapshot fehlt.");
  const current = snapshotM80Topology();
  return Object.freeze({ ...compareUiTopology(previous, current.nodes), current });
}
function readSpacing(element) {
  try {
    const value = JSON.parse(element.dataset.uiEditorSpacing || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
  } catch { return {}; }
}
function writeSpacing(element, spacing = {}) {
  const normalized = Object.fromEntries(Object.entries(spacing).filter(([, value]) => Number.isFinite(Number(value)) && Number(value) >= 0).map(([key, value]) => [key, Number(value)]));
  element.dataset.uiEditorSpacing = JSON.stringify(normalized);
  return normalized;
}

function readGeneric(element, id) {
  const rect = rectOf(element);
  const style = styleOf(element);
  return {
    elementId: id,
    x: finite(element.dataset.uiEditorX),
    y: finite(element.dataset.uiEditorY),
    width: positive(rect.width, positive(parseFloat(style.width), 1)),
    height: positive(rect.height, positive(parseFloat(style.height), 1)),
    textOffsetX: finite(element.dataset.uiEditorTextX, finite(parseFloat(style.paddingLeft))),
    textOffsetY: finite(element.dataset.uiEditorTextY, finite(parseFloat(style.paddingTop))),
    fontSize: positive(parseFloat(style.fontSize), 12),
    visible: !hasClass(element, HIDDEN_CLASS),
    spacing: readSpacing(element),
  };
}

function bounded(entry, field, value, fallback) {
  const baseline = entry?.baseline || {};
  const capitalized = field[0].toUpperCase() + field.slice(1);
  return clamp(positive(value, fallback), positive(baseline[`min${capitalized}`], 1), positive(baseline[`max${capitalized}`], Number.MAX_SAFE_INTEGER));
}

function applyGeneric(element, state, entry, requestedOperation = null) {
  const operations = new Set(entry.allowedOps);
  const applies = (...candidates) => requestedOperation === null || candidates.includes(requestedOperation);
  if (operations.has("move") && applies("move")) {
    element.dataset.uiEditorX = String(finite(state.x));
    element.dataset.uiEditorY = String(finite(state.y));
    element.style.translate = `${px(state.x)} ${px(state.y)}`;
  }
  if ((operations.has("resize") || operations.has("resizeWidth")) && applies("resize", "resizeWidth")) {
    const desiredWidth = bounded(entry, "width", state.width, 1);
    const style = styleOf(element);
    const currentBounds = rectOf(element);
    const currentContentWidth = Number.parseFloat(style.width);
    const horizontalChrome = style.boxSizing === "border-box" || !Number.isFinite(currentContentWidth)
      ? 0
      : Math.max(0, currentBounds.width - currentContentWidth);
    const contentWidth = style.boxSizing === "border-box" ? desiredWidth : Math.max(1, desiredWidth - horizontalChrome);
    element.style.width = px(contentWidth);
  }
  if ((operations.has("resize") || operations.has("resizeHeight")) && applies("resize", "resizeHeight")) element.style.height = px(bounded(entry, "height", state.height, 1));
  if (operations.has("textMove") && applies("textMove") && state.textOffsetX !== null && state.textOffsetX !== undefined) {
    element.dataset.uiEditorTextX = String(state.textOffsetX);
    element.style.paddingLeft = px(Math.max(0, finite(state.textOffsetX)));
  }
  if (operations.has("textMove") && applies("textMove") && state.textOffsetY !== null && state.textOffsetY !== undefined) {
    element.dataset.uiEditorTextY = String(state.textOffsetY);
    element.style.paddingTop = px(Math.max(0, finite(state.textOffsetY)));
  }
  if (operations.has("textResize") && applies("textResize") && state.fontSize !== null && state.fontSize !== undefined) element.style.fontSize = px(positive(state.fontSize, 1));
  if (operations.has("setVisibility") && applies("setVisibility")) toggleClass(element, HIDDEN_CLASS, state.visible === false);
  const spacingOperations = ["spacingIncrease", "spacingDecrease", "spacingSet", "spacingReset"];
  if (spacingOperations.some((operation) => operations.has(operation)) && applies(...spacingOperations)) {
    const spacing = writeSpacing(element, state.spacing || {});
    element.style.marginLeft = px(finite(spacing.beforeElement));
    element.style.marginRight = px(finite(spacing.afterElement) + finite(spacing.reservedWidth));
    element.style.paddingLeft = px(finite(spacing.groupPaddingLeft));
    element.style.paddingRight = px(finite(spacing.groupPaddingRight));
    element.style.paddingTop = px(finite(spacing.groupPaddingTop));
    element.style.paddingBottom = px(finite(spacing.groupPaddingBottom));
    element.style.columnGap = px(finite(spacing.childGapHorizontal));
    element.style.rowGap = px(finite(spacing.childGapVertical));
  }
}

export function beginM80PilotRender() {
  refs.clear();
  tableColumnRuntimeBindings.clear();
  tableRuntimeBindings.clear();
}

export function beginM83ComponentBinding(componentId) {
  const contract = getM83ComponentContract(componentId);
  if (!contract) throw Object.assign(new Error(`Unbekannter Komponentenvertrag: ${componentId}`), { code: "component_contract_missing", componentId });
  for (const slot of contract.slots) {
    refs.delete(slot.element.id);
    tableColumnRuntimeBindings.delete(slot.element.id);
    tableRuntimeBindings.delete(slot.element.id);
  }
  return contract;
}

export function resetM80PilotWorkingStatesForDiagnostic() {
  refs.clear();
  tableColumnRuntimeBindings.clear();
  tableRuntimeBindings.clear();
  workingStates.clear();
  persistentWorkingStateIds.clear();
  persistentWorkingStateOperations.clear();
}

function applyPersistentWorkingState(ref) {
  const state = workingStates.get(ref.id);
  const requestedOperations = persistentWorkingStateOperations.get(ref.id);
  if (!requestedOperations?.size || requestedOperations.has("*")) ref.apply(state);
  else for (const operation of requestedOperations) ref.apply(state, operation);
}

export function registerM80Ref(id, element, custom = {}) {
  const entry = getM80RegistryEntry(id);
  if (!entry || !isElementRef(element)) throw new Error(`Ungültige explizite M80-Referenz: ${id}`);
  if (custom.applyPrimaryAttributes !== false) applyAttributes(element, id);
  const targets = [...new Set([element, ...(Array.isArray(custom.targets) ? custom.targets : [])].filter(isElementRef))];
  const contractTargets = [...new Set((Array.isArray(custom.contractTargets) ? custom.contractTargets : targets).filter(isElementRef))];
  const existing = refs.get(id);
  if (entry.referenceKind === "single" && (contractTargets.length !== 1 || (existing && existing.element !== element))) {
    throw Object.assign(new Error(`Einzel-Ref loest nicht genau ein Ziel auf: ${id}`), {
      code: "component_single_ref_duplicate",
      elementId: id,
      targetCount: existing && existing.element !== element ? contractTargets.length + 1 : contractTargets.length,
    });
  }
  const ref = {
    id,
    entry,
    element,
    targets,
    contractTargets,
    contractMountedInstanceCount: Number.isFinite(Number(custom.contractMountedInstanceCount))
      ? Number(custom.contractMountedInstanceCount)
      : contractTargets.length,
    read: custom.read || (() => readGeneric(element, id)),
    apply: custom.apply || ((state, requestedOperation = null) => applyGeneric(element, state, entry, requestedOperation)),
  };
  refs.set(id, ref);
  const bindingTargets = Array.isArray(custom.bindingTargets) ? custom.bindingTargets : targets;
  bindingTargets.filter(isElementRef).forEach((target) => bindElementId(target, id));
  if (persistentWorkingStateIds.has(id) && workingStates.has(id)) applyPersistentWorkingState(ref);
  return element;
}

export function registerM80MultiRef(id, elements, fallbackElement, options = {}) {
  const entry = getM80RegistryEntry(id);
  const targets = [...new Set((Array.isArray(elements) ? elements : []).filter(isElementRef))];
  const primary = targets[0] || fallbackElement;
  if (!entry || !isElementRef(primary)) throw new Error(`UngÃ¼ltige explizite M80-Multireferenz: ${id}`);
  targets.forEach((target) => applyAttributes(target, id));
  let logicalState = {
    elementId: id,
    x: finite(entry.baseline?.x),
    y: finite(entry.baseline?.y),
    width: positive(entry.baseline?.width, 1),
    height: positive(entry.baseline?.height, 1),
    textOffsetX: finite(entry.baseline?.textOffsetX),
    textOffsetY: finite(entry.baseline?.textOffsetY),
    fontSize: positive(entry.baseline?.fontSize, 12),
    visible: entry.baseline?.visible !== false,
    spacing: { ...(entry.baseline?.spacing || {}) },
  };
  return registerM80Ref(id, primary, {
    targets,
    contractTargets: targets,
    contractMountedInstanceCount: Number.isFinite(Number(options.mountedInstanceCount)) ? Number(options.mountedInstanceCount) : targets.length,
    bindingTargets: targets,
    applyPrimaryAttributes: false,
    read: () => targets.length ? readGeneric(targets[0], id) : { ...logicalState, spacing: { ...logicalState.spacing } },
    apply: (state, requestedOperation = null) => {
      logicalState = { ...logicalState, ...state, elementId: id, spacing: { ...(state.spacing || logicalState.spacing || {}) } };
      targets.forEach((target) => applyGeneric(target, logicalState, entry, requestedOperation));
    },
  });
}

export function completeM80PilotRender() {
  for (const ref of refs.values()) {
    if (typeof ref.element.isConnected === "boolean" && !ref.element.isConnected) continue;
    if (persistentWorkingStateIds.has(ref.id) && workingStates.has(ref.id)) applyPersistentWorkingState(ref);
    const current = ref.read();
    if (!persistentWorkingStateIds.has(ref.id)) workingStates.set(ref.id, { ...current });
  }
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    const event = typeof CustomEvent === "function" ? new CustomEvent("bbm:m80-pilot-render-complete") : { type: "bbm:m80-pilot-render-complete" };
    window.dispatchEvent(event);
  }
}

function storedColumnState(tableElement, id, baseline) {
  try {
    const stored = JSON.parse(tableElement.dataset.uiEditorTableColumns || "{}")[id];
    return stored && typeof stored === "object" ? { ...baseline, ...stored, tableId: baseline.tableId, columnId: id } : baseline;
  } catch { return baseline; }
}

function writeColumnState(tableElement, id, value) {
  let all = {};
  try { all = JSON.parse(tableElement.dataset.uiEditorTableColumns || "{}"); } catch { all = {}; }
  all[id] = value;
  tableElement.dataset.uiEditorTableColumns = JSON.stringify(all);
}

function applyColumnTextMode(targets, tableState) {
  for (const target of targets) {
    const boundParts = [target, ...Array.from(target.children || [])];
    for (const part of boundParts) {
      const wrap = tableState.wrapMode;
      part.style.whiteSpace = ["noWrap", "ellipsis"].includes(wrap) ? "nowrap" : "normal";
      part.style.overflowWrap = wrap === "characterWrap" ? "anywhere" : wrap === "wordWrap" ? "break-word" : "normal";
      const overflow = tableState.overflowMode;
      part.style.overflow = overflow === "visible" ? "visible" : overflow === "scroll" ? "auto" : "hidden";
      part.style.textOverflow = wrap === "ellipsis" || overflow === "ellipsis" ? "ellipsis" : "clip";
    }
  }
}

export function registerM80TableColumnRef(id, headerCell, dataCells, tableElement, layoutBoundsElement, cssVariable, initialWidth) {
  const entry = getM80RegistryEntry(id);
  const layout = entry.tableColumnLayout;
  const targets = [headerCell, ...(Array.isArray(dataCells) ? dataCells : [])];
  tableColumnRuntimeBindings.set(id, { entry, headerCell, tableElement, layoutBoundsElement, cssVariable, initialWidth });
  const baselineTable = {
    tableId: entry.tableBinding.tableId, columnId: id, widthMode: layout.widthMode,
    wrapMode: layout.wrapMode, overflowMode: layout.overflowMode,
  };
  registerM80Ref(id, headerCell, {
    targets,
    contractTargets: targets,
    contractMountedInstanceCount: targets.length,
    read: () => {
      const style = styleOf(headerCell);
      const rect = rectOf(headerCell);
      const table = storedColumnState(tableElement, id, baselineTable);
      const configured = parseFloat(getCustomProperty(tableElement.style, cssVariable));
      const width = positive(configured, positive(rect.width, initialWidth));
      const metrics = runtimeTableMetrics(entry.tableBinding.tableId, tableElement, layoutBoundsElement);
      return {
        elementId: id, x: 0, y: 0, width, height: positive(rect.height, 1),
        textOffsetX: finite(headerCell.dataset.uiEditorTextX, finite(parseFloat(style.paddingLeft))),
        textOffsetY: finite(headerCell.dataset.uiEditorTextY, finite(parseFloat(style.paddingTop))),
        fontSize: positive(parseFloat(style.fontSize), 12), visible: !hasClass(headerCell, HIDDEN_CLASS),
        table: { ...table, ...metrics },
      };
    },
    apply: (state) => {
      const table = { ...baselineTable, ...(state.table || {}) };
      const width = bounded(entry, "width", state.width, initialWidth);
      const widthValue = table.widthMode === "proportional"
        ? `minmax(${px(layout.minimumWidth)}, 1fr)`
        : table.widthMode === "auto" ? `minmax(${px(layout.minimumWidth)}, max-content)` : px(width);
      setCustomProperty(tableElement.style, cssVariable, widthValue);
      writeColumnState(tableElement, id, table);
      headerCell.dataset.uiEditorTextX = String(finite(state.textOffsetX));
      headerCell.dataset.uiEditorTextY = String(finite(state.textOffsetY));
      headerCell.style.paddingLeft = px(Math.max(0, finite(state.textOffsetX)));
      headerCell.style.paddingTop = px(Math.max(0, finite(state.textOffsetY)));
      headerCell.style.fontSize = px(positive(state.fontSize, 1));
      applyColumnTextMode(targets, table);
      toggleClass(tableElement, `${HIDDEN_CLASS}-${id.split(".").pop()}`, state.visible === false);
      targets.forEach((target) => toggleClass(target, HIDDEN_CLASS, state.visible === false));
    },
  });
  registerM80Ref(layout.headerElementId, headerCell, { targets: [headerCell], contractTargets: [headerCell], contractMountedInstanceCount: 1 });
  registerM80Ref(layout.dataCellTemplateId, dataCells?.[0] || tableElement, {
    targets: dataCells,
    contractTargets: dataCells,
    contractMountedInstanceCount: dataCells?.length || 0,
    applyPrimaryAttributes: Boolean(dataCells?.length),
  });
  return headerCell;
}

function runtimeTableMetrics(tableId, tableElement, layoutBoundsElement) {
  const tableEntry = getM80RegistryEntry(tableId);
  if (!tableEntry?.tableLayout) return {};
  const tableRect = rectOf(tableElement);
  const viewportRect = rectOf(layoutBoundsElement);
  const columns = tableEntry.tableLayout.columns.map((column) => {
    const binding = tableColumnRuntimeBindings.get(column.columnId);
    const columnState = storedColumnState(tableElement, column.columnId, column);
    return {
      ...column,
      currentWidth: positive(rectOf(binding?.headerCell || {}).width, binding?.initialWidth || column.currentWidth),
      widthMode: columnState.widthMode || column.widthMode,
      wrapMode: columnState.wrapMode || column.wrapMode,
      overflowMode: columnState.overflowMode || column.overflowMode,
      visibility: binding?.headerCell ? !hasClass(binding.headerCell, HIDDEN_CLASS) : column.visibility,
    };
  });
  const layout = normalizeTableLayout({
    ...tableEntry.tableLayout,
    bounds: { left: tableRect.left, top: tableRect.top, width: tableRect.width, height: tableRect.height },
    viewportBounds: { left: viewportRect.left, top: viewportRect.top, width: viewportRect.width, height: viewportRect.height },
    contentBounds: { left: tableRect.left, top: tableRect.top, width: Math.max(finite(tableElement.scrollWidth), columns.filter((column) => column.visibility).reduce((sum, column) => sum + column.currentWidth, tableEntry.tableLayout.reservedWidth)), height: Math.max(tableRect.height, finite(tableElement.scrollHeight)) },
    columns,
  });
  const metrics = measureTableLayout(layout);
  return {
    viewportWidth: metrics.viewportWidth,
    tableWidth: metrics.tableWidth,
    overflow: metrics.overflow,
    overflowColumnIds: [...metrics.overflowColumnIds],
  };
}

function runtimeTableLayout(entry, tableElement, layoutBoundsElement) {
  const tableRect = rectOf(tableElement);
  const viewportRect = rectOf(layoutBoundsElement);
  const columns = entry.tableLayout.columns.map((column) => {
    const state = getM80Ref(column.columnId)?.read();
    return { ...column, currentWidth: positive(state?.width, column.currentWidth), widthMode: state?.table?.widthMode || column.widthMode, wrapMode: state?.table?.wrapMode || column.wrapMode, overflowMode: state?.table?.overflowMode || column.overflowMode, visibility: state?.visible !== false };
  });
  return normalizeTableLayout({
    ...entry.tableLayout,
    bounds: { left: tableRect.left, top: tableRect.top, width: tableRect.width, height: tableRect.height },
    viewportBounds: { left: viewportRect.left, top: viewportRect.top, width: viewportRect.width, height: viewportRect.height },
    contentBounds: { left: tableRect.left, top: tableRect.top, width: Math.max(finite(tableElement.scrollWidth), columns.filter((column) => column.visibility).reduce((sum, column) => sum + column.currentWidth, entry.tableLayout.reservedWidth)), height: Math.max(tableRect.height, finite(tableElement.scrollHeight)) },
    horizontalOverflowMode: tableElement.dataset.uiEditorHorizontalOverflowMode || entry.tableLayout.horizontalOverflowMode,
    rowHeightMode: tableElement.dataset.uiEditorRowHeightMode || entry.tableLayout.rowHeightMode,
    columns,
  });
}

export function registerM80TableRef(id, tableElement, layoutBoundsElement = tableElement) {
  const entry = getM80RegistryEntry(id);
  tableRuntimeBindings.set(id, { tableElement, layoutBoundsElement });
  return registerM80Ref(id, tableElement, {
    read: () => {
      const generic = readGeneric(tableElement, id);
      const layout = runtimeTableLayout(entry, tableElement, layoutBoundsElement);
      const metrics = measureTableLayout(layout);
      return { ...generic, table: { tableId: id, horizontalOverflowMode: layout.horizontalOverflowMode, rowHeightMode: layout.rowHeightMode, viewportWidth: metrics.viewportWidth, tableWidth: metrics.tableWidth, overflow: metrics.overflow, overflowColumnIds: [...metrics.overflowColumnIds] } };
    },
    apply: (state) => {
      applyGeneric(tableElement, state, entry);
      const table = state.table || {};
      const rowHeight = table.rowHeightMode || entry.tableLayout.rowHeightMode;
      tableElement.dataset.uiEditorRowHeightMode = rowHeight;
    },
  });
}

export function fitM80Table(id, selectedColumnId = "") {
  const entry = getM80RegistryEntry(id);
  const ref = getM80Ref(id);
  if (!entry?.tableLayout || !ref) throw Object.assign(new Error("Tabellenreferenz fehlt."), { code: "electron_element_not_found" });
  const binding = tableRuntimeBindings.get(id);
  const layout = runtimeTableLayout(entry, binding?.tableElement || ref.element, binding?.layoutBoundsElement || ref.element);
  const result = fitTableToViewport(layout, selectedColumnId ? { selectedColumnId } : {});
  if (!result.ok) throw Object.assign(new Error("Tabelle kann nicht an den sichtbaren Bereich angepasst werden."), { code: "electron_invalid_geometry" });
  const affectedStates = [];
  for (const column of result.model.columns) {
    const current = snapshotM80State(column.columnId);
    affectedStates.push(applyM80State(column.columnId, { ...current, width: column.currentWidth, table: { ...current.table, widthMode: column.widthMode } }));
  }
  return { result, affectedStates };
}

export function resetM80Table(id) {
  const entry = getM80RegistryEntry(id);
  const affectedStates = [];
  for (const column of entry?.tableLayout?.columns || []) {
    const current = snapshotM80State(column.columnId);
    affectedStates.push(applyM80State(column.columnId, { ...current, width: column.currentWidth, visible: column.visibility, table: { tableId: id, columnId: column.columnId, widthMode: column.widthMode, wrapMode: column.wrapMode, overflowMode: column.overflowMode } }));
  }
  const current = snapshotM80State(id);
  const newState = applyM80State(id, { ...current, table: { tableId: id, horizontalOverflowMode: entry.tableLayout.horizontalOverflowMode, rowHeightMode: entry.tableLayout.rowHeightMode } });
  return { newState, affectedStates };
}

export function registerM80FlowLabelRef(id, element, layoutRow, trailingColumns) {
  const entry = getM80RegistryEntry(id);
  return registerM80Ref(id, element, {
    read: () => {
      const state = readGeneric(element, id);
      const configuredWidth = positive(element.dataset.uiEditorFlowWidth, positive(entry?.baseline?.width, state.width));
      const spacing = readSpacing(element);
      if (!Object.hasOwn(spacing, "reservedWidth")) {
        const firstTrack = parseFloat(styleOf(layoutRow).gridTemplateColumns);
        spacing.reservedWidth = Math.max(0, finite(firstTrack, configuredWidth) - configuredWidth);
      }
      return { ...state, width: configuredWidth, spacing };
    },
    apply: (state) => {
      const spacing = { ...(state.spacing || {}) };
      const reservedWidth = Math.max(0, finite(spacing.reservedWidth));
      const genericSpacing = { ...spacing, reservedWidth: 0 };
      applyGeneric(element, { ...state, spacing: genericSpacing }, entry);
      const elementWidth = bounded(entry, "width", state.width, 1);
      element.dataset.uiEditorFlowFixed = "true";
      element.dataset.uiEditorFlowWidth = String(elementWidth);
      setCustomProperty(element.style, "--bbm-ui-editor-flow-element-width", px(elementWidth));
      element.style.justifySelf = "start";
      element.style.minWidth = px(elementWidth);
      element.style.maxWidth = px(elementWidth);
      writeSpacing(element, spacing);
      const slotWidth = elementWidth + reservedWidth;
      layoutRow.style.gridTemplateColumns = `${px(slotWidth)} ${trailingColumns}`;
    },
  });
}

export function getM80Ref(id) { return refs.get(String(id || "")) || null; }
export function listM80Refs() { return [...refs.values()]; }
export function snapshotM80Geometry() {
  return new Map([...refs.values()].map((ref) => {
    const rect = rectOf(ref.element);
    return [ref.id, { left: finite(rect.left), top: finite(rect.top), width: finite(rect.width), height: finite(rect.height) }];
  }));
}
export function getM80IdFromTarget(target) {
  return getM80IdsFromTarget(target)[0] || null;
}
export function getM80IdsFromTarget(target) {
  let current = isElementRef(target) ? target : null;
  while (current) {
    const ids = elementIds.get(current);
    if (ids?.size) {
      const elements = listM80RegistryScopes().flatMap((scope) => scope.elements);
      return orderUiComponentSelectionTargetIds(elements, [...ids]);
    }
    current = current.parentElement;
  }
  return [];
}
export function readM80State(id) {
  const ref = getM80Ref(id);
  if (!ref) return null;
  const state = ref.read();
  workingStates.set(id, { ...state });
  return { ...state };
}
export function applyM80State(id, state, requestedOperation = null) {
  const ref = getM80Ref(id);
  if (!ref) throw Object.assign(new Error("Explizite Elementreferenz fehlt."), { code: "electron_element_not_found" });
  ref.apply(state, requestedOperation);
  const readback = ref.read();
  persistentWorkingStateIds.add(id);
  const operations = persistentWorkingStateOperations.get(id) || new Set();
  if (typeof requestedOperation === "string" && requestedOperation) operations.add(requestedOperation);
  else operations.add("*");
  persistentWorkingStateOperations.set(id, operations);
  workingStates.set(id, { ...readback });
  return { ...readback };
}
export function snapshotM80State(id) { return readM80State(id); }
export function captureM80WorkingStates() {
  return new Map([...refs.values()].map((ref) => {
    const state = ref.read();
    return [ref.id, { ...state, spacing: { ...(state.spacing || {}) } }];
  }));
}
export function restoreM80WorkingStates(states) {
  if (!(states instanceof Map)) throw new TypeError("Gespeicherter Editor-Sitzungszustand fehlt.");
  for (const [id, state] of states) {
    const value = { ...state, spacing: { ...(state?.spacing || {}) } };
    const ref = refs.get(id);
    if (ref) {
      ref.apply(value);
      workingStates.set(id, { ...ref.read() });
    } else {
      workingStates.set(id, value);
    }
    persistentWorkingStateIds.add(id);
    persistentWorkingStateOperations.set(id, new Set(["*"]));
  }
  return states.size;
}
export function listM80CurrentStates(scopeId) {
  return [...refs.values()].filter((ref) => {
      let entry = ref.entry;
      while (entry && entry.parentId) entry = getM80RegistryEntry(entry.parentId);
      return entry?.id === scopeId;
    }).map((ref) => readM80State(ref.id));
}
export function getM80ReferenceStatus(id) {
  const ref = getM80Ref(id);
  const entry = ref?.entry || getM80RegistryEntry(id);
  const targets = (ref?.contractTargets || []).filter((target) => typeof target.isConnected !== "boolean" || target.isConnected);
  return {
    refKey: String(entry?.refKey || id || ""),
    referenceResolved: Boolean(ref && (targets.length > 0 || (entry?.referenceKind === "multi" && (ref.contractMountedInstanceCount || 0) === 0))),
    targetCount: targets.length,
    mountedInstanceCount: ref?.contractMountedInstanceCount || 0,
  };
}

export function validateM83ComponentReferences(componentIds = null) {
  const contracts = listM83ComponentContracts();
  const selectedIds = Array.isArray(componentIds) ? componentIds : contracts.map((component) => component.componentId);
  const bindings = contracts
    .filter((component) => selectedIds.includes(component.componentId))
    .flatMap((component) => component.slots.flatMap((slot) => {
      const ref = refs.get(slot.element.id);
      if (!ref) return [];
      const targets = (ref?.contractTargets || []).filter((target) => typeof target.isConnected !== "boolean" || target.isConnected);
      return [{
        componentId: component.componentId,
        slotId: slot.slotId,
        elementId: slot.element.id,
        targetCount: targets.length,
        mountedInstanceCount: ref?.contractMountedInstanceCount || 0,
        referenceResolved: targets.length > 0,
        selectionTargetIds: targets.length > 0 ? getM80IdsFromTarget(targets[0]) : [],
      }];
    }));
  const result = validateUiComponentReferenceBindings({ components: contracts, bindings, componentIds: selectedIds });
  if (!result.ok) {
    const details = result.errors.map((entry) => `${entry.code}: ${entry.componentId || "?"}/${entry.slotId || entry.elementId || "?"}`).join("; ");
    throw Object.assign(new Error(`BBM-Komponenten-Refs unvollstaendig: ${details}`), { code: "component_reference_contract_invalid", details: result.errors });
  }
  return result;
}
export function clearM80VisualState() {
  document.querySelector("[data-bbm-ui-editor-overlay]")?.remove();
}

export { HIDDEN_CLASS };
