import { createUiInspectorOverlay } from './UiInspectorOverlay.js';
import { createUiInspectorPanel } from './UiInspectorPanel.js';

const CONTAINER_CONTROLS = ['Breite', 'Höhe', 'Abstand außen', 'Abstand innen', 'Sichtbarkeit'];
const FIELD_CONTROLS = ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Schriftgröße', 'Sichtbarkeit'];

const TOP_LEVEL_IDS = ['restarbeiten.header', 'restarbeiten.main', 'restarbeiten.editbox'];
const SORT_ORDER = [
  'restarbeiten.header', 'restarbeiten.main', 'restarbeiten.filterleiste', 'restarbeiten.filterleiste.klassenfilter',
  'restarbeiten.filterleiste.klassenfilter.feld', 'restarbeiten.filterleiste.verortung', 'restarbeiten.filterleiste.verortung.feld',
  'restarbeiten.filterleiste.meta', 'restarbeiten.liste', 'restarbeiten.liste.textbereich', 'restarbeiten.liste.metabereich',
  'restarbeiten.editbox', 'restarbeiten.editbox.header', 'restarbeiten.editbox.verortung', 'restarbeiten.editbox.kurztext',
  'restarbeiten.editbox.kurztext.label', 'restarbeiten.editbox.kurztext.restzeichen', 'restarbeiten.editbox.langtext',
  'restarbeiten.editbox.langtext.label', 'restarbeiten.editbox.langtext.restzeichen', 'restarbeiten.editbox.meta',
];

const PARENT_MAP = new Map([
  ['restarbeiten.filterleiste', 'restarbeiten.main'], ['restarbeiten.liste', 'restarbeiten.main'],
  ['restarbeiten.filterleiste.klassenfilter', 'restarbeiten.filterleiste'], ['restarbeiten.filterleiste.verortung', 'restarbeiten.filterleiste'],
  ['restarbeiten.filterleiste.meta', 'restarbeiten.filterleiste'], ['restarbeiten.filterleiste.klassenfilter.feld', 'restarbeiten.filterleiste.klassenfilter'],
  ['restarbeiten.filterleiste.verortung.feld', 'restarbeiten.filterleiste.verortung'], ['restarbeiten.liste.textbereich', 'restarbeiten.liste'],
  ['restarbeiten.liste.metabereich', 'restarbeiten.liste'], ['restarbeiten.editbox.header', 'restarbeiten.editbox'],
  ['restarbeiten.editbox.verortung', 'restarbeiten.editbox'], ['restarbeiten.editbox.kurztext', 'restarbeiten.editbox'],
  ['restarbeiten.editbox.langtext', 'restarbeiten.editbox'], ['restarbeiten.editbox.meta', 'restarbeiten.editbox'],
  ['restarbeiten.editbox.kurztext.label', 'restarbeiten.editbox.kurztext'], ['restarbeiten.editbox.kurztext.restzeichen', 'restarbeiten.editbox.kurztext'],
  ['restarbeiten.editbox.langtext.label', 'restarbeiten.editbox.langtext'], ['restarbeiten.editbox.langtext.restzeichen', 'restarbeiten.editbox.langtext'],
]);

function toLabel(id, instance) {
  const raw = String(id || '').split('.').pop() || '';
  const text = raw.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const multipleLabel = instance > 1 || raw === 'feld';
  return multipleLabel ? `${text} #${instance}` : text;
}

export function getInspectorParentId(id) { return PARENT_MAP.get(String(id || '').trim()) || ''; }
export function getInspectorSortRank(id) {
  const idx = SORT_ORDER.indexOf(String(id || '').trim());
  return idx >= 0 ? idx : 10000;
}

function resolveAvailableParent(id, presentIds) {
  let current = getInspectorParentId(id);
  while (current) {
    if (presentIds.has(current)) return current;
    current = getInspectorParentId(current);
  }
  return '';
}

export function buildTargets(rootElement, selector = '[data-ui-inspector-id]') {
  if (!rootElement || typeof rootElement.querySelectorAll !== 'function') return [];
  const nodes = Array.from(rootElement.querySelectorAll(selector));
  const perIdCounter = new Map();
  const grouped = new Map();
  let domIndex = 0;

  for (const element of nodes) {
    domIndex += 1;
    const id = String(element?.getAttribute?.('data-ui-inspector-id') || '').trim();
    if (!id) continue;
    const instance = (perIdCounter.get(id) || 0) + 1;
    perIdCounter.set(id, instance);
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push({ id, instance, element, domIndex });
  }

  const presentIds = new Set(grouped.keys());
  const levelCache = new Map();
  const getLevelForId = (id) => {
    if (levelCache.has(id)) return levelCache.get(id);
    let level = 0;
    let parent = resolveAvailableParent(id, presentIds);
    while (parent) {
      level += 1;
      parent = resolveAvailableParent(parent, presentIds);
    }
    levelCache.set(id, level);
    return level;
  };

  const ids = Array.from(grouped.keys()).sort((a, b) => getInspectorSortRank(a) - getInspectorSortRank(b) || a.localeCompare(b));
  const targets = [];
  for (const id of ids) {
    const parentId = resolveAvailableParent(id, presentIds);
    const level = getLevelForId(id);
    const instances = grouped.get(id).slice().sort((a, b) => a.instance - b.instance || a.domIndex - b.domIndex);
    for (const item of instances) {
      targets.push({
        key: `${id}::${item.instance}`,
        id,
        label: toLabel(id, item.instance),
        level,
        parentId,
        element: item.element,
        instance: item.instance,
      });
    }
  }
  return targets;
}

function getAllowedControlsForSelectedId(selectedId) {
  const normalizedId = String(selectedId || '').trim();
  if (!normalizedId) return [];
  const containerIds = new Set([
    'restarbeiten.root', 'restarbeiten.header', 'restarbeiten.main', 'restarbeiten.filterleiste', 'restarbeiten.filterleiste.klassenfilter',
    'restarbeiten.filterleiste.verortung', 'restarbeiten.filterleiste.meta', 'restarbeiten.liste', 'restarbeiten.liste.textbereich',
    'restarbeiten.liste.metabereich', 'restarbeiten.editbox', 'restarbeiten.editbox.header', 'restarbeiten.editbox.verortung', 'restarbeiten.editbox.meta',
  ]);
  if (containerIds.has(normalizedId)) return [...CONTAINER_CONTROLS];
  const fieldSuffixes = ['.feld', '.kurztext', '.langtext', '.fertig_bis', '.status', '.verantwortlich', '.label', '.restzeichen'];
  if (fieldSuffixes.some((suffix) => normalizedId.endsWith(suffix))) return [...FIELD_CONTROLS];
  return [];
}

export function createUiInspectorRuntime({ overlay, panel } = {}) {
  const resolvedOverlay = overlay || createUiInspectorOverlay({ buildTargets });
  const resolvedPanel = panel || createUiInspectorPanel();
  let overlayActive = false;
  const renderPanel = (selectedTarget) => {
    const selectedId = selectedTarget?.id || '';
    resolvedPanel.render({
      selectedId,
      selectedTargetKey: selectedTarget?.key || '',
      controls: getAllowedControlsForSelectedId(selectedId),
      targets: resolvedOverlay.getTargets?.() || [],
    });
  };

  function activateOverlay(rootElement) {
    const mounted = resolvedOverlay.mount(rootElement, {
      onSelectTarget: (target) => renderPanel(target),
      onClearSelection: () => resolvedPanel.clear(),
    }) === true;
    if (!mounted) return false;
    overlayActive = resolvedPanel.mount(rootElement?.ownerDocument?.body || globalThis.document?.body) === true;
    if (overlayActive) renderPanel(resolvedOverlay.getSelectedTarget?.());
    return overlayActive;
  }
  return {
    overlay: resolvedOverlay, panel: resolvedPanel, getAllowedControlsForSelectedId,
    activateOverlay,
    deactivateOverlay() { resolvedOverlay.unmount(); resolvedPanel.unmount(); overlayActive = false; return true; },
    refreshOverlay() { return overlayActive ? resolvedOverlay.refresh() === true : false; },
    getSelectedElementId() { return resolvedOverlay.getSelectedId?.() || ''; },
    clearSelection() { const ok = resolvedOverlay.clearSelection?.() === true; resolvedPanel.clear(); return ok; },
    isOverlayActive() { return overlayActive; },
  };
}
