import { createUiInspectorOverlay } from './UiInspectorOverlay.js';
import { createUiInspectorPanel } from './UiInspectorPanel.js';

const TEMPORARY_NOTE = 'Temporäre Vorschau – keine Speicherung.';
const DEFAULT_STEP = 5;
const FONT_STEP = 1;

const RESTARBEITEN_FRAME_IDS = new Set([
  'restarbeiten.root',
  'restarbeiten.header',
  'restarbeiten.main',
  'restarbeiten.filterleiste',
  'restarbeiten.filterleiste.klassenfilter',
  'restarbeiten.filterleiste.verortung',
  'restarbeiten.filterleiste.meta',
  'restarbeiten.liste',
  'restarbeiten.liste.nummernbereich',
  'restarbeiten.liste.textbereich',
  'restarbeiten.liste.metabereich',
  'restarbeiten.editbox',
  'restarbeiten.editbox.header',
  'restarbeiten.editbox.verortung',
  'restarbeiten.editbox.kurztext',
  'restarbeiten.editbox.langtext',
  'restarbeiten.editbox.meta',
]);

const RESTARBEITEN_OPTIONAL_IDS = new Set([
  'restarbeiten.header',
]);

const RESTARBEITEN_LIST_ROW_DEPENDENT_IDS = new Set([
  'restarbeiten.liste.nummernbereich',
  'restarbeiten.liste.textbereich',
  'restarbeiten.liste.kurztext',
  'restarbeiten.liste.langtext',
  'restarbeiten.liste.metabereich',
]);

const RESTARBEITEN_FIELD_IDS = new Set([
  'restarbeiten.filterleiste.klassenfilter.feld',
  'restarbeiten.filterleiste.verortung.feld',
  'restarbeiten.liste.kurztext',
  'restarbeiten.liste.langtext',
]);

const RESTARBEITEN_SINGLE_IDS = new Set([
  'restarbeiten.filterleiste.meta.fertig_bis',
  'restarbeiten.filterleiste.meta.status',
  'restarbeiten.filterleiste.meta.verantwortlich',
  'restarbeiten.filterleiste.meta.erledigt',
  'restarbeiten.editbox.kurztext.label',
  'restarbeiten.editbox.kurztext.restzeichen',
  'restarbeiten.editbox.langtext.label',
  'restarbeiten.editbox.langtext.restzeichen',
]);

const RESTARBEITEN_EDITBOX_OPTIONAL_IDS = new Set([
  'restarbeiten.editbox.kurztext.restzeichen',
  'restarbeiten.editbox.langtext.restzeichen',
]);

const RESTARBEITEN_REQUIRED_IDS = [
  ...Array.from(RESTARBEITEN_FRAME_IDS).filter(
    (id) =>
      !RESTARBEITEN_OPTIONAL_IDS.has(id) &&
      !RESTARBEITEN_LIST_ROW_DEPENDENT_IDS.has(id)
  ),
  ...Array.from(RESTARBEITEN_FIELD_IDS).filter((id) => !RESTARBEITEN_LIST_ROW_DEPENDENT_IDS.has(id)),
  ...Array.from(RESTARBEITEN_SINGLE_IDS).filter((id) => !RESTARBEITEN_EDITBOX_OPTIONAL_IDS.has(id)),
];

const GROUP_CONTROLS = [
  { key: 'width', label: 'Breite', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'height', label: 'Höhe', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'translateX', label: 'Position X', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'translateY', label: 'Position Y', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'marginTop', label: 'Abstand außen oben', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'marginRight', label: 'Abstand außen rechts', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'marginBottom', label: 'Abstand außen unten', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'marginLeft', label: 'Abstand außen links', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'paddingTop', label: 'Abstand innen oben', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'paddingRight', label: 'Abstand innen rechts', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'paddingBottom', label: 'Abstand innen unten', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'paddingLeft', label: 'Abstand innen links', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'visibility', label: 'Sichtbarkeit', kind: 'toggle' },
];

const FIELD_CONTROLS = [
  { key: 'width', label: 'Breite', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'height', label: 'Höhe', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'translateX', label: 'Position X', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'translateY', label: 'Position Y', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'fontSize', label: 'Schriftgröße', step: FONT_STEP, kind: 'delta' },
  { key: 'marginLeft', label: 'Abstand außen links', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'marginTop', label: 'Abstand außen oben', step: DEFAULT_STEP, kind: 'delta' },
  { key: 'visibility', label: 'Sichtbarkeit', kind: 'toggle' },
];

function normalizeInspectorId(id) {
  return String(id || '').trim();
}

function getInspectorCategory(id) {
  const normalizedId = normalizeInspectorId(id);
  if (!normalizedId) return 'unknown';
  if (RESTARBEITEN_FRAME_IDS.has(normalizedId)) return 'frame';
  if (RESTARBEITEN_FIELD_IDS.has(normalizedId)) return 'field';
  if (RESTARBEITEN_SINGLE_IDS.has(normalizedId)) return 'singleElement';
  return 'unknown';
}

function detectInspectorSchema(rootElement, ids = []) {
  const normalizedIds = Array.isArray(ids) ? ids.map((entry) => normalizeInspectorId(entry)) : [];
  if (normalizedIds.some((id) => id.startsWith('restarbeiten.'))) return 'restarbeiten';
  const rootLabel = normalizeInspectorId(rootElement?.getAttribute?.('data-bbm-restarbeiten-screen'));
  if (rootLabel) return 'restarbeiten';
  return '';
}

function createEmptyInspectorScanSummary() {
  return {
    schemaKey: '',
    totalMarkers: 0,
    frameCount: 0,
    fieldCount: 0,
    singleElementCount: 0,
    unknownCount: 0,
    missingImportantIds: [],
    optionalMissingIds: [],
    hasListRows: false,
    status: 'warning',
    statusLabel: 'unvollständig',
  };
}

function countRenderedListRows(rootElement) {
  if (!rootElement || typeof rootElement.querySelectorAll !== 'function') return 0;
  try {
    return Number(rootElement.querySelectorAll('.restarbeiten-list__row')?.length || 0);
  } catch (_error) {
    return 0;
  }
}

export function scanUiInspectorTargets(rootElement, options = {}) {
  if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
    return createEmptyInspectorScanSummary();
  }

  const nodes = Array.from(rootElement.querySelectorAll('[data-ui-inspector-id]') || []);
  const ids = [];
  const counts = {
    totalMarkers: 0,
    frameCount: 0,
    fieldCount: 0,
    singleElementCount: 0,
    unknownCount: 0,
  };
  const foundImportantIds = new Set();
  const foundRowDependentIds = new Set();
  const foundOptionalIds = new Set();
  const schemaKey =
    String(options?.schemaKey || '').trim() ||
    detectInspectorSchema(
      rootElement,
      nodes.map((node) => node?.getAttribute?.('data-ui-inspector-id'))
    );
  const listRowCount = schemaKey === 'restarbeiten' ? countRenderedListRows(rootElement) : 0;
  const hardImportantIds =
    schemaKey === 'restarbeiten'
      ? RESTARBEITEN_REQUIRED_IDS
      : Array.isArray(options?.importantIds)
        ? options.importantIds
          .map((id) => splitInspectorId(id).baseId)
          .map((id) => normalizeInspectorId(id))
          .filter(Boolean)
        : [];
  const rowDependentIds =
    schemaKey === 'restarbeiten' && listRowCount > 0 ? RESTARBEITEN_LIST_ROW_DEPENDENT_IDS : new Set();
  const optionalIds =
    schemaKey === 'restarbeiten' ? RESTARBEITEN_EDITBOX_OPTIONAL_IDS : new Set();

  for (const node of nodes) {
    const { rawId, baseId } = splitInspectorId(node?.getAttribute?.('data-ui-inspector-id'));
    if (!rawId) continue;
    ids.push(rawId);
    counts.totalMarkers += 1;
    const category = getInspectorCategory(baseId);
    if (category === 'frame') counts.frameCount += 1;
    else if (category === 'field') counts.fieldCount += 1;
    else if (category === 'singleElement') counts.singleElementCount += 1;
    else counts.unknownCount += 1;

    if (hardImportantIds.includes(baseId)) {
      foundImportantIds.add(baseId);
    }
    if (rowDependentIds.has(baseId)) {
      foundRowDependentIds.add(baseId);
    }
    if (optionalIds.has(baseId)) {
      foundOptionalIds.add(baseId);
    }
  }

  const missingImportantIds = hardImportantIds.filter((id) => !foundImportantIds.has(id));
  const missingRowDependentIds = Array.from(rowDependentIds).filter((id) => !foundRowDependentIds.has(id));
  const missingOptionalIds = Array.from(optionalIds).filter((id) => !foundOptionalIds.has(id));
  const status =
    schemaKey === 'restarbeiten' &&
    missingImportantIds.length === 0 &&
    (listRowCount === 0 || missingRowDependentIds.length === 0) &&
    counts.totalMarkers > 0
      ? 'ok'
      : 'warning';

  return {
    schemaKey,
    totalMarkers: counts.totalMarkers,
    frameCount: counts.frameCount,
    fieldCount: counts.fieldCount,
    singleElementCount: counts.singleElementCount,
    unknownCount: counts.unknownCount,
    missingImportantIds,
    optionalMissingIds: listRowCount > 0 ? missingRowDependentIds.concat(missingOptionalIds) : missingOptionalIds,
    missingListMarkerIds: missingRowDependentIds,
    hasListRows: listRowCount > 0,
    status,
    statusLabel: status === 'ok' ? 'vollständig' : 'unvollständig',
    ids,
  };
}

export function formatUiInspectorScanSummary(summary = null) {
  const scan = summary || createEmptyInspectorScanSummary();
  const lines = [
    'UI-Editor Scan',
    `Status: ${scan.statusLabel || 'unvollständig'}`,
    `Marker: ${scan.totalMarkers || 0}`,
    `Rahmen: ${scan.frameCount || 0}`,
    `Felder: ${scan.fieldCount || 0}`,
    `Einzelelemente: ${scan.singleElementCount || 0}`,
  ];

  if (scan.unknownCount > 0) {
    lines.push(`Unbekannt: ${scan.unknownCount}`);
  }

  if (scan.hasListRows) {
    lines.push('Listenmarker: vorhanden');
  } else {
    lines.push('Listenmarker: keine Einträge gerendert');
  }

  if (Array.isArray(scan.missingImportantIds) && scan.missingImportantIds.length > 0) {
    lines.push(`Fehlt Pflicht: ${scan.missingImportantIds.join(', ')}`);
  }

  if (Array.isArray(scan.optionalMissingIds) && scan.optionalMissingIds.length > 0) {
    const listMarkerMissing = Array.isArray(scan.missingListMarkerIds) ? scan.missingListMarkerIds : [];
    const otherOptionalMissing = scan.optionalMissingIds.filter((id) => !listMarkerMissing.includes(id));
    if (listMarkerMissing.length > 0) {
      lines.push(`Fehlt Listenmarker: ${listMarkerMissing.join(', ')}`);
    }
    if (otherOptionalMissing.length > 0) {
      lines.push(`Optional nicht vorhanden: ${otherOptionalMissing.join(', ')}`);
    }
  }

  return {
    title: 'UI-Editor Scan',
    status: scan.status || 'warning',
    text: lines.join('\n'),
    missingImportantIds: Array.isArray(scan.missingImportantIds) ? [...scan.missingImportantIds] : [],
    totalMarkers: scan.totalMarkers || 0,
    frameCount: scan.frameCount || 0,
    fieldCount: scan.fieldCount || 0,
    singleElementCount: scan.singleElementCount || 0,
    unknownCount: scan.unknownCount || 0,
    optionalMissingIds: Array.isArray(scan.optionalMissingIds) ? [...scan.optionalMissingIds] : [],
    missingListMarkerIds: Array.isArray(scan.missingListMarkerIds) ? [...scan.missingListMarkerIds] : [],
    hasListRows: !!scan.hasListRows,
    statusLabel: scan.statusLabel || 'unvollständig',
  };
}

function splitInspectorId(id) {
  const rawId = normalizeInspectorId(id);
  const markerIndex = rawId.indexOf('::');
  if (markerIndex < 0) {
    return { rawId, baseId: rawId, instanceId: '' };
  }
  return {
    rawId,
    baseId: rawId.slice(0, markerIndex),
    instanceId: rawId.slice(markerIndex + 2),
  };
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toCssPropertyName(value) {
  return String(value || '')
    .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    .replace(/^ms-/, '-ms-');
}

function getInlineCssValue(cssText, propertyName) {
  const source = String(cssText || '');
  if (!source) return '';
  const pattern = new RegExp(`(?:^|;)\\s*${escapeRegExp(propertyName)}\\s*:\\s*([^;]+)`, 'gi');
  let match = null;
  let value = '';
  while ((match = pattern.exec(source))) {
    value = String(match[1] || '').trim();
  }
  return value;
}

function getComputedCssValue(element, propertyName) {
  const doc = element?.ownerDocument || globalThis.document || null;
  const view = doc?.defaultView || globalThis.window || globalThis;
  const getComputedStyle = typeof view?.getComputedStyle === 'function' ? view.getComputedStyle.bind(view) : null;
  if (!getComputedStyle) return '';

  try {
    const style = getComputedStyle(element);
    if (!style) return '';
    if (typeof style.getPropertyValue === 'function') {
      return String(style.getPropertyValue(propertyName) || '').trim();
    }
    const camelName = String(propertyName || '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return String(style[propertyName] || style[camelName] || '').trim();
  } catch (_error) {
    return '';
  }
}

function readCssValue(element, propertyName, fallback = '') {
  const inlineValue = getInlineCssValue(element?.style?.cssText, propertyName);
  if (inlineValue) return inlineValue;

  const computedValue = getComputedCssValue(element, propertyName);
  if (computedValue) return computedValue;

  if (typeof element?.getBoundingClientRect === 'function' && (propertyName === 'width' || propertyName === 'height')) {
    const rect = element.getBoundingClientRect?.();
    const value = propertyName === 'width' ? rect?.width : rect?.height;
    if (Number.isFinite(Number(value))) {
      return `${Number(value)}px`;
    }
  }

  return fallback;
}

function readPxNumber(element, propertyName, fallback = 0) {
  const rawValue = readCssValue(element, propertyName, '');
  const numericValue = Number.parseFloat(rawValue);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function readTransformValue(element) {
  const value = readCssValue(element, 'transform', '');
  return value && value !== 'none' ? value : '';
}

function readVisibilityValue(element) {
  const value = readCssValue(element, 'visibility', '');
  return value === 'hidden' ? 'hidden' : 'visible';
}

function createPreviewState() {
  return {
    width: 0,
    height: 0,
    translateX: 0,
    translateY: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    fontSize: 0,
    visibility: null,
  };
}

function createSnapshot(element) {
  return {
    originalCssText: String(element?.style?.cssText || ''),
    base: {
      width: readPxNumber(element, 'width', 0),
      height: readPxNumber(element, 'height', 0),
      marginTop: readPxNumber(element, 'margin-top', 0),
      marginRight: readPxNumber(element, 'margin-right', 0),
      marginBottom: readPxNumber(element, 'margin-bottom', 0),
      marginLeft: readPxNumber(element, 'margin-left', 0),
      paddingTop: readPxNumber(element, 'padding-top', 0),
      paddingRight: readPxNumber(element, 'padding-right', 0),
      paddingBottom: readPxNumber(element, 'padding-bottom', 0),
      paddingLeft: readPxNumber(element, 'padding-left', 0),
      fontSize: readPxNumber(element, 'font-size', 16),
      transform: readTransformValue(element),
      visibility: readVisibilityValue(element),
    },
    preview: createPreviewState(),
  };
}

function createUiInspectorRuntime() {
  const overlay = createUiInspectorOverlay({
    onSelect: handleSelection,
    onClearSelection: handleClearSelection,
  });
  const panel = createUiInspectorPanel();

  let rootElement = null;
  let selectedId = '';
  const elementsById = new Map();
  const entryById = new Map();
  const entriesByBaseId = new Map();
  const allEntries = [];
  const snapshotsByElement = new Map();
  let suppressOverlaySelectionCallback = false;

  function rebuildIndex() {
    elementsById.clear();
    entryById.clear();
    entriesByBaseId.clear();
    allEntries.length = 0;
    if (!rootElement || typeof rootElement.querySelectorAll !== 'function') return;

    const nodes = rootElement.querySelectorAll('[data-ui-inspector-id]');
    for (const node of nodes || []) {
      const id = normalizeInspectorId(node?.getAttribute?.('data-ui-inspector-id'));
      if (!id) continue;
      const entry = {
        id,
        ...splitInspectorId(id),
        node,
      };
      elementsById.set(id, node);
      entryById.set(id, entry);
      allEntries.push(entry);
      if (!entriesByBaseId.has(entry.baseId)) entriesByBaseId.set(entry.baseId, []);
      entriesByBaseId.get(entry.baseId).push(entry);
    }
  }

  function getEntryById(id) {
    const normalized = normalizeInspectorId(id);
    if (!normalized) return null;
    let entry = entryById.get(normalized) || null;
    if (entry) return entry;
    const baseId = splitInspectorId(normalized).baseId;
    const entries = entriesByBaseId.get(baseId) || [];
    return entries[0] || null;
  }

  function getEntryByBaseId(baseId) {
    const entries = entriesByBaseId.get(normalizeInspectorId(baseId)) || [];
    return entries[0] || null;
  }

  function getSelectedEntry() {
    if (!selectedId) return null;
    const entry = getEntryById(selectedId);
    if (entry) return entry;
    rebuildIndex();
    return getEntryById(selectedId);
  }

  function getSelectedElement() {
    const entry = getSelectedEntry();
    return entry?.node || null;
  }

  function getDisplayLabel(id) {
    const { baseId, instanceId } = splitInspectorId(id);
    const parts = baseId.split('.').filter(Boolean);
    const lastPart = parts[parts.length - 1] || baseId || '';
    if (instanceId) {
      if (/feld/i.test(lastPart)) return `Feld #${instanceId}`;
      return `${lastPart.charAt(0).toUpperCase()}${lastPart.slice(1)} #${instanceId}`;
    }
    return lastPart ? `${lastPart.charAt(0).toUpperCase()}${lastPart.slice(1)}` : '';
  }

  function getParentEntry(entry) {
    if (!entry?.baseId) return null;
    const parentBaseId = entry.baseId.includes('.') ? entry.baseId.slice(0, entry.baseId.lastIndexOf('.')) : '';
    if (!parentBaseId) return null;
    return getEntryByBaseId(parentBaseId);
  }

  function getChildEntries(entry) {
    if (!entry?.baseId) return [];
    const byParentBase = new Map();
    for (const child of allEntries) {
      if (child.baseId === entry.baseId) continue;
      const parentBaseId = child.baseId.includes('.') ? child.baseId.slice(0, child.baseId.lastIndexOf('.')) : '';
      if (parentBaseId === entry.baseId) {
        byParentBase.set(child.id, child);
      }
    }
    return Array.from(byParentBase.values());
  }

  function getSiblingEntries(entry) {
    const parentEntry = getParentEntry(entry);
    if (!parentEntry) return [];
    return getChildEntries(parentEntry);
  }

  function getSelectionContext(id = selectedId) {
    const entry = getEntryById(id);
    if (!entry) {
      return {
        selectedId: normalizeInspectorId(id),
        selectedBaseId: '',
        selectedKind: '',
        selectedLabel: '',
        parentId: '',
        parentBaseId: '',
        parentLabel: '',
        children: [],
        siblings: [],
      };
    }

    const children = getChildEntries(entry);
    const parentEntry = getParentEntry(entry);
    const siblings = getSiblingEntries(entry);
    const selectedKind = children.length > 0 ? 'Gruppe' : 'Feld';

    return {
      selectedId: entry.id,
      selectedBaseId: entry.baseId,
      selectedKind,
      selectedLabel: getDisplayLabel(entry.id),
      parentId: parentEntry?.id || '',
      parentBaseId: parentEntry?.baseId || '',
      parentLabel: parentEntry ? getDisplayLabel(parentEntry.id) : '',
      children: children.map((child, index) => ({
        id: child.id,
        baseId: child.baseId,
        label: child.instanceId ? `Feld #${child.instanceId}` : getDisplayLabel(child.id) || `Feld #${index + 1}`,
      })),
      siblings: siblings.map((sibling, index) => ({
        id: sibling.id,
        baseId: sibling.baseId,
        label: sibling.instanceId ? `Feld #${sibling.instanceId}` : getDisplayLabel(sibling.id) || `Feld #${index + 1}`,
      })),
    };
  }

  function getSelectedContext() {
    return getSelectionContext(selectedId);
  }

  function getNextSiblingId(direction = 1) {
    const context = getSelectedContext();
    if (!context.siblings.length) return '';
    const currentIndex = context.siblings.findIndex((item) => item.id === context.selectedId);
    if (currentIndex < 0) return '';
    const nextIndex = currentIndex + Number(direction || 0);
    if (nextIndex < 0 || nextIndex >= context.siblings.length) return '';
    return context.siblings[nextIndex]?.id || '';
  }

  function selectInspectorTarget(id) {
    const normalized = normalizeInspectorId(id);
    if (!normalized) return false;
    suppressOverlaySelectionCallback = true;
    try {
      overlay.select(normalized);
    } finally {
      suppressOverlaySelectionCallback = false;
    }
    selectedId = normalized;
    renderPanel();
    return true;
  }

  function getAllowedControlsForSelectedId(id) {
    const { selectedKind } = getSelectionContext(id);
    return {
      selectedKind,
      controls: selectedKind === 'Gruppe' ? GROUP_CONTROLS : FIELD_CONTROLS,
    };
  }

  function getSelectionContextForSelectedId(id) {
    return getSelectionContext(id);
  }

  function ensureSnapshot(element) {
    if (!element) return null;
    let snapshot = snapshotsByElement.get(element);
    if (!snapshot) {
      snapshot = createSnapshot(element);
      snapshotsByElement.set(element, snapshot);
    }
    return snapshot;
  }

  function composeTransform(baseTransform, translateX, translateY) {
    const parts = [];
    const normalizedBase = String(baseTransform || '').trim();
    if (normalizedBase && normalizedBase !== 'none') {
      parts.push(normalizedBase);
    }
    parts.push(`translate(${translateX}px, ${translateY}px)`);
    return parts.join(' ');
  }

  function buildPreviewDeclarations(snapshot) {
    const declarations = [];
    const { base, preview } = snapshot;
    const appendPx = (key, cssName, allowNegative = true) => {
      const delta = Number(preview[key] || 0);
      if (!delta) return;
      const rawValue = Number(base[key] || 0) + delta;
      const nextValue = allowNegative ? rawValue : Math.max(0, rawValue);
      declarations.push(`${cssName}: ${Math.max(0, Number.isFinite(nextValue) ? nextValue : 0)}px;`);
    };
    const appendMarginPx = (key, cssName) => {
      const delta = Number(preview[key] || 0);
      if (!delta) return;
      const nextValue = Number(base[key] || 0) + delta;
      declarations.push(`${cssName}: ${Number.isFinite(nextValue) ? nextValue : 0}px;`);
    };

    appendPx('width', 'width', false);
    appendPx('height', 'height', false);
    appendMarginPx('marginTop', 'margin-top');
    appendMarginPx('marginRight', 'margin-right');
    appendMarginPx('marginBottom', 'margin-bottom');
    appendMarginPx('marginLeft', 'margin-left');
    appendPx('paddingTop', 'padding-top', false);
    appendPx('paddingRight', 'padding-right', false);
    appendPx('paddingBottom', 'padding-bottom', false);
    appendPx('paddingLeft', 'padding-left', false);
    appendPx('fontSize', 'font-size', false);

    const translateX = Number(preview.translateX || 0);
    const translateY = Number(preview.translateY || 0);
    if (translateX || translateY) {
      declarations.push(`transform: ${composeTransform(base.transform, translateX, translateY)};`);
    }

    if (preview.visibility) {
      declarations.push(`visibility: ${preview.visibility};`);
    }

    return declarations;
  }

  function applySnapshotToElement(element, snapshot) {
    if (!element?.style) return false;
    const declarations = buildPreviewDeclarations(snapshot);
    const originalCssText = String(snapshot.originalCssText || '');

    if (!declarations.length) {
      element.style.cssText = originalCssText;
      return true;
    }

    const needsSeparator = originalCssText && !/[;\s]$/.test(originalCssText) ? '; ' : originalCssText ? ' ' : '';
    element.style.cssText = `${originalCssText}${needsSeparator}${declarations.join(' ')}`;
    return true;
  }

  function renderPanel() {
    const context = getSelectedContext();
    const selectedElement = getSelectedElement();
    if (!selectedElement) {
      panel.clear();
      return false;
    }

    const { selectedKind, controls } = getAllowedControlsForSelectedId(selectedId);
    panel.render({
      ...context,
      selectedId: context.selectedId || selectedId,
      selectedKind,
      controls,
      note: TEMPORARY_NOTE,
      actions: {
        adjust: applyPreviewDelta,
        toggleVisibility: toggleSelectedVisibility,
        resetSelected: resetSelectedPreview,
        resetAll: resetAllPreview,
        selectTarget: selectInspectorTarget,
        selectParent: () => {
          const parentId = getSelectedContext().parentId;
          if (!parentId) return false;
          return selectInspectorTarget(parentId);
        },
        selectChild: (childId) => selectInspectorTarget(childId),
        selectSiblingOffset: (offset) => {
          const nextId = getNextSiblingId(offset);
          if (!nextId) return false;
          return selectInspectorTarget(nextId);
        },
      },
    });
    return true;
  }

  function selectElementById(id) {
    selectedId = String(id || '').trim();
    renderPanel();
    return true;
  }

  function handleSelection(id) {
    if (suppressOverlaySelectionCallback) {
      selectedId = normalizeInspectorId(id);
      renderPanel();
      return true;
    }
    selectedId = normalizeInspectorId(id);
    return renderPanel();
  }

  function handleClearSelection() {
    selectedId = '';
    panel.clear();
    return true;
  }

  function applyPreviewDelta(controlKey, delta = 0) {
    const element = getSelectedElement();
    if (!element) return false;

    const snapshot = ensureSnapshot(element);
    if (!snapshot) return false;

    const deltaValue = Number(delta || 0);
    if (!deltaValue) return true;

    if (Object.prototype.hasOwnProperty.call(snapshot.preview, controlKey)) {
      if (controlKey === 'visibility') {
        return toggleSelectedVisibility();
      }
      snapshot.preview[controlKey] = Number(snapshot.preview[controlKey] || 0) + deltaValue;
      applySnapshotToElement(element, snapshot);
      overlay.refresh();
      renderPanel();
      return true;
    }

    return false;
  }

  function toggleSelectedVisibility() {
    const element = getSelectedElement();
    if (!element) return false;

    const snapshot = ensureSnapshot(element);
    if (!snapshot) return false;

    const currentVisibility = snapshot.preview.visibility || snapshot.base.visibility || 'visible';
    snapshot.preview.visibility = currentVisibility === 'hidden' ? 'visible' : 'hidden';
    applySnapshotToElement(element, snapshot);
    overlay.refresh();
    renderPanel();
    return true;
  }

  function resetSelectedPreview() {
    const element = getSelectedElement();
    if (!element) return false;

    const snapshot = snapshotsByElement.get(element);
    if (snapshot) {
      element.style.cssText = snapshot.originalCssText;
      snapshotsByElement.delete(element);
    }

    overlay.refresh();
    renderPanel();
    return true;
  }

  function resetAllPreview() {
    for (const [element, snapshot] of snapshotsByElement.entries()) {
      if (element?.style) {
        element.style.cssText = snapshot.originalCssText;
      }
    }
    snapshotsByElement.clear();
    overlay.refresh();
    renderPanel();
    return true;
  }

  function activateOverlay(nextRootElement) {
    if (!nextRootElement || typeof nextRootElement.querySelectorAll !== 'function') return false;

    rootElement = nextRootElement;
    rebuildIndex();

    const doc = rootElement.ownerDocument || globalThis.document;
    if (!doc) return false;

    panel.mount(doc.body || rootElement);
    overlay.mount(rootElement, {
      onSelect: handleSelection,
      onClearSelection: handleClearSelection,
    });
    renderPanel();
    return true;
  }

  function deactivateOverlay() {
    resetAllPreview();
    overlay.unmount();
    panel.unmount();
    rootElement = null;
    selectedId = '';
    elementsById.clear();
    snapshotsByElement.clear();
    return true;
  }

  function refreshOverlay() {
    overlay.refresh();
    renderPanel();
    return true;
  }

  return {
    overlay,
    panel,
    activateOverlay,
    deactivateOverlay,
    refreshOverlay,
    getSelectedId: () => selectedId,
    getAllowedControlsForSelectedId,
    getSelectionContext: getSelectionContextForSelectedId,
    applyPreviewDelta,
    resetSelectedPreview,
    resetAllPreview,
    toggleSelectedVisibility,
    selectInspectorTarget,
  };
}

export { createUiInspectorRuntime };
