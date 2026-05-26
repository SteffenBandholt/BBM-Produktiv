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

const RESTARBEITEN_OPTIONAL_IDS = new Set(['restarbeiten.header']);

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
    (id) => !RESTARBEITEN_OPTIONAL_IDS.has(id) && !RESTARBEITEN_LIST_ROW_DEPENDENT_IDS.has(id)
  ),
  ...Array.from(RESTARBEITEN_FIELD_IDS).filter((id) => !RESTARBEITEN_LIST_ROW_DEPENDENT_IDS.has(id)),
  ...Array.from(RESTARBEITEN_SINGLE_IDS).filter((id) => !RESTARBEITEN_EDITBOX_OPTIONAL_IDS.has(id)),
];

function normalizeInspectorId(id) {
  return String(id || '').trim();
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

function countRenderedListRows(rootElement) {
  if (!rootElement || typeof rootElement.querySelectorAll !== 'function') return 0;
  try {
    return Number(rootElement.querySelectorAll('.restarbeiten-list__row')?.length || 0);
  } catch (_error) {
    return 0;
  }
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

export function scanUiInspectorTargets(rootElement, options = {}) {
  if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
    return createEmptyInspectorScanSummary();
  }

  const nodes = Array.from(rootElement.querySelectorAll('[data-ui-inspector-id]') || []);
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
  const optionalIds = schemaKey === 'restarbeiten' ? RESTARBEITEN_EDITBOX_OPTIONAL_IDS : new Set();

  for (const node of nodes) {
    const { rawId, baseId } = splitInspectorId(node?.getAttribute?.('data-ui-inspector-id'));
    if (!rawId) continue;
    counts.totalMarkers += 1;
    const category = getInspectorCategory(baseId);
    if (category === 'frame') counts.frameCount += 1;
    else if (category === 'field') counts.fieldCount += 1;
    else if (category === 'singleElement') counts.singleElementCount += 1;
    else counts.unknownCount += 1;

    if (hardImportantIds.includes(baseId)) foundImportantIds.add(baseId);
    if (rowDependentIds.has(baseId)) foundRowDependentIds.add(baseId);
    if (optionalIds.has(baseId)) foundOptionalIds.add(baseId);
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

function normalizeSelectionMode(mode) {
  const normalized = String(mode || '').trim();
  if (normalized === 'field' || normalized === 'single') return normalized;
  return 'frame';
}

function getSelectionModeLabel(mode) {
  if (mode === 'field') return 'Feld';
  if (mode === 'single') return 'Einzelelement';
  return 'Rahmen';
}

export function createUiInspectorRuntime(options = {}) {
  let selectionMode = normalizeSelectionMode(options.initialSelectionMode || 'frame');
  let scanSummary = null;

  function setSelectionMode(nextMode) {
    const normalized = normalizeSelectionMode(nextMode);
    if (normalized === selectionMode) return false;
    selectionMode = normalized;
    return true;
  }

  function scanCurrentScreen(rootElement, scanOptions = {}) {
    scanSummary = scanUiInspectorTargets(rootElement, scanOptions);
    return scanSummary;
  }

  return {
    getSelectionMode: () => selectionMode,
    getSelectionModeLabel: () => getSelectionModeLabel(selectionMode),
    setSelectionMode,
    getScanSummary: () => scanSummary,
    setScanSummary: (summary) => {
      scanSummary = summary || null;
      return scanSummary;
    },
    scanCurrentScreen,
    clearScanSummary: () => {
      scanSummary = null;
      return true;
    },
    activateOverlay: () => false,
    deactivateOverlay: () => true,
    refreshOverlay: () => false,
    getPanelState: () => ({
      selectionMode,
      selectionModeLabel: getSelectionModeLabel(selectionMode),
      scanSummary,
    }),
  };
}
