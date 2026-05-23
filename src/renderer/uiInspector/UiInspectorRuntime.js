import { createUiInspectorOverlay } from './UiInspectorOverlay.js';
import { createUiInspectorPanel } from './UiInspectorPanel.js';

const CONTAINER_CONTROLS = ['Breite', 'Höhe', 'Abstand außen', 'Abstand innen', 'Sichtbarkeit'];
const FIELD_CONTROLS = ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Schriftgröße', 'Sichtbarkeit'];

const INSPECTOR_PARENT_MAP = {
  'restarbeiten.header': '',
  'restarbeiten.main': '',
  'restarbeiten.filterleiste': 'restarbeiten.main',
  'restarbeiten.filterleiste.klassenfilter': 'restarbeiten.filterleiste',
  'restarbeiten.filterleiste.verortung': 'restarbeiten.filterleiste',
  'restarbeiten.filterleiste.meta': 'restarbeiten.filterleiste',
  'restarbeiten.liste': 'restarbeiten.main',
  'restarbeiten.liste.textbereich': 'restarbeiten.liste',
  'restarbeiten.liste.metabereich': 'restarbeiten.liste',
  'restarbeiten.editbox': '',
  'restarbeiten.editbox.header': 'restarbeiten.editbox',
  'restarbeiten.editbox.verortung': 'restarbeiten.editbox',
  'restarbeiten.editbox.kurztext': 'restarbeiten.editbox',
  'restarbeiten.editbox.kurztext.label': 'restarbeiten.editbox.kurztext',
  'restarbeiten.editbox.kurztext.restzeichen': 'restarbeiten.editbox.kurztext',
  'restarbeiten.editbox.langtext': 'restarbeiten.editbox',
  'restarbeiten.editbox.langtext.label': 'restarbeiten.editbox.langtext',
  'restarbeiten.editbox.langtext.restzeichen': 'restarbeiten.editbox.langtext',
  'restarbeiten.editbox.meta': 'restarbeiten.editbox',
};

const ORDERED_KNOWN_IDS = [
  'restarbeiten.root',
  'restarbeiten.header',
  'restarbeiten.main',
  'restarbeiten.filterleiste',
  'restarbeiten.filterleiste.klassenfilter',
  'restarbeiten.filterleiste.verortung',
  'restarbeiten.filterleiste.meta',
  'restarbeiten.liste',
  'restarbeiten.liste.textbereich',
  'restarbeiten.liste.metabereich',
  'restarbeiten.editbox',
  'restarbeiten.editbox.header',
  'restarbeiten.editbox.verortung',
  'restarbeiten.editbox.kurztext',
  'restarbeiten.editbox.kurztext.label',
  'restarbeiten.editbox.kurztext.restzeichen',
  'restarbeiten.editbox.langtext',
  'restarbeiten.editbox.langtext.label',
  'restarbeiten.editbox.langtext.restzeichen',
  'restarbeiten.editbox.meta',
];
const ORDER_INDEX = new Map(ORDERED_KNOWN_IDS.map((id, index) => [id, index]));

function toTitleSegment(segment) {
  const map = {
    root: 'Root',
    header: 'Header',
    main: 'Main',
    editbox: 'Editbox',
    filterleiste: 'Filterleiste',
    klassenfilter: 'Klassenfilter',
    verortung: 'Verortung',
    feld: 'Feld',
    meta: 'Meta',
    liste: 'Liste',
    textbereich: 'Textbereich',
    metabereich: 'Metabereich',
    kurztext: 'Kurztext',
    langtext: 'Langtext',
    label: 'Label',
    restzeichen: 'Restzeichen',
  };
  return map[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

function resolveParentId(id, idSet) {
  if (Object.prototype.hasOwnProperty.call(INSPECTOR_PARENT_MAP, id)) {
    const mappedParent = INSPECTOR_PARENT_MAP[id] || '';
    if (!mappedParent || idSet.has(mappedParent)) return mappedParent;

    let fallback = mappedParent;
    while (fallback.includes('.')) {
      fallback = fallback.split('.').slice(0, -1).join('.');
      if (idSet.has(fallback)) return fallback;
    }
    return '';
  }

  if (!id.includes('.')) return '';
  const fallbackParent = id.split('.').slice(0, -1).join('.');
  return idSet.has(fallbackParent) ? fallbackParent : '';
}

function getOrderRank(id) {
  if (ORDER_INDEX.has(id)) return ORDER_INDEX.get(id);

  for (let i = ORDERED_KNOWN_IDS.length - 1; i >= 0; i -= 1) {
    const knownId = ORDERED_KNOWN_IDS[i];
    if (id.startsWith(`${knownId}.`)) return i + 0.5;
  }
  return 9999;
}

function buildLevelMap(sortedTargets) {
  const levelById = new Map();
  sortedTargets.forEach((target) => {
    if (!target.parentId) {
      levelById.set(target.id, 1);
      return;
    }

    const parentLevel = levelById.get(target.parentId);
    levelById.set(target.id, typeof parentLevel === 'number' ? parentLevel + 1 : 1);
  });
  return levelById;
}

function buildTargets(rootElement) {
  if (!rootElement?.querySelectorAll) return [];

  const nodes = Array.from(rootElement.querySelectorAll('[data-ui-inspector-id]'));
  const counts = new Map();
  const totals = new Map();

  nodes.forEach((node) => {
    const id = String(node?.getAttribute?.('data-ui-inspector-id') || '').trim();
    if (!id) return;
    totals.set(id, (totals.get(id) || 0) + 1);
  });

  const result = [];
  nodes.forEach((node) => {
    const id = String(node?.getAttribute?.('data-ui-inspector-id') || '').trim();
    if (!id) return;

    const nextInstance = (counts.get(id) || 0) + 1;
    counts.set(id, nextInstance);

    const segments = id.split('.');
    const labelBase = toTitleSegment(segments[segments.length - 1] || id);
    const totalCount = totals.get(id) || 1;

    result.push({
      key: `${id}::${nextInstance}`,
      id,
      label: totalCount > 1 ? `${labelBase} #${nextInstance}` : labelBase,
      level: 1,
      parentId: '',
      element: node,
      instance: nextInstance,
      _domIndex: result.length,
    });
  });

  const idSet = new Set(result.map((target) => target.id));
  result.forEach((target) => {
    target.parentId = resolveParentId(target.id, idSet);
  });

  result.sort((a, b) => {
    const rank = getOrderRank(a.id) - getOrderRank(b.id);
    if (rank !== 0) return rank;

    if (a.id !== b.id) return a.id.localeCompare(b.id, 'de');
    if (a.instance !== b.instance) return a.instance - b.instance;
    return a._domIndex - b._domIndex;
  });

  const indexById = new Map(result.map((target, index) => [target.id, index]));
  for (let i = 0; i < result.length; i += 1) {
    const target = result[i];
    if (!target.parentId) continue;

    const parentIndex = indexById.get(target.parentId);
    if (typeof parentIndex === 'number' && parentIndex > i) {
      result.splice(i, 1);
      result.splice(parentIndex, 0, target);
    }
  }

  result.forEach((target) => {
    delete target._domIndex;
  });

  const levelById = buildLevelMap(result);
  result.forEach((target) => {
    target.level = levelById.get(target.id) || 1;
  });
  return result;
}

function getAllowedControlsForSelectedId(selectedId) {
  const normalizedId = String(selectedId || '').trim();
  if (!normalizedId) return [];

  const containerIds = new Set([
    'restarbeiten.root',
    'restarbeiten.header',
    'restarbeiten.main',
    'restarbeiten.filterleiste',
    'restarbeiten.filterleiste.meta',
    'restarbeiten.filterleiste.verortung',
    'restarbeiten.filterleiste.klassenfilter',
    'restarbeiten.liste',
    'restarbeiten.liste.textbereich',
    'restarbeiten.liste.metabereich',
    'restarbeiten.editbox',
    'restarbeiten.editbox.header',
    'restarbeiten.editbox.verortung',
    'restarbeiten.editbox.meta',
  ]);

  if (containerIds.has(normalizedId)) return [...CONTAINER_CONTROLS];

  const fieldSuffixes = ['.feld', '.kurztext', '.langtext', '.fertig_bis', '.status', '.verantwortlich', '.label', '.restzeichen'];
  if (fieldSuffixes.some((suffix) => normalizedId.endsWith(suffix))) return [...FIELD_CONTROLS];
  return [];
}

export function createUiInspectorRuntime({ overlay, panel } = {}) {
  const resolvedOverlay = overlay || createUiInspectorOverlay();
  const resolvedPanel = panel || createUiInspectorPanel();
  let overlayActive = false;
  let rootElement = null;
  let targets = [];

  function renderPanelForSelection(target) {
    const selectedId = target?.id || '';
    const controls = getAllowedControlsForSelectedId(selectedId);

    resolvedPanel.render({
      selectedId,
      selectedLabel: target?.label || '',
      selectedTargetKey: target?.key || '',
      controls,
      note: controls.length ? 'Auswahlmodell – noch keine Layoutänderung.' : 'Für diesen Bereich sind noch keine Stellschrauben definiert.',
      targets,
      onSelectTargetKey: (key) => {
        const nextTarget = targets.find((item) => item.key === key);
        if (nextTarget) resolvedOverlay.selectTarget(nextTarget);
      },
    });
  }

  function activateOverlay(nextRootElement) {
    rootElement = nextRootElement;
    targets = buildTargets(rootElement);
    const byKey = new Map(targets.map((target) => [target.key, target]));

    const overlayMounted = resolvedOverlay.mount(rootElement, {
      targets,
      onSelectTarget: (target) => renderPanelForSelection(target),
      onClearSelection: () => resolvedPanel.clear({ targets }),
      resolveTargetByKey: (key) => byKey.get(key),
      getTargets: () => {
        targets = buildTargets(rootElement);
        return targets;
      },
    }) === true;

    if (!overlayMounted) {
      overlayActive = false;
      return false;
    }

    const panelMounted = resolvedPanel.mount(rootElement?.ownerDocument?.body || globalThis.document?.body) === true;
    overlayActive = panelMounted;
    if (overlayActive) renderPanelForSelection(resolvedOverlay.getSelectedTarget?.() || null);
    return overlayActive;
  }

  return {
    overlay: resolvedOverlay,
    panel: resolvedPanel,
    activateOverlay,
    deactivateOverlay() {
      resolvedOverlay.unmount();
      resolvedPanel.unmount();
      overlayActive = false;
      rootElement = null;
      targets = [];
      return true;
    },
    refreshOverlay() {
      if (!overlayActive) return false;
      targets = buildTargets(rootElement);
      return resolvedOverlay.refresh() === true;
    },
    getSelectedElementId() {
      return resolvedOverlay.getSelectedId?.() || '';
    },
    clearSelection() {
      const result = resolvedOverlay.clearSelection?.() === true;
      resolvedPanel.clear({ targets });
      return result;
    },
    getAllowedControlsForSelectedId,
    getTargets() {
      return [...targets];
    },
    isOverlayActive() {
      return overlayActive;
    },
  };
}

export { buildTargets };
