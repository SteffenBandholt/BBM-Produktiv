import { createUiInspectorOverlay } from './UiInspectorOverlay.js';
import { createUiInspectorPanel } from './UiInspectorPanel.js';

const CONTAINER_CONTROLS = ['Breite', 'Höhe', 'Abstand außen', 'Abstand innen', 'Sichtbarkeit'];
const FIELD_CONTROLS = ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Schriftgröße', 'Sichtbarkeit'];

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


function getSegmentPriority(id) {
  const last = id.split('.').pop();
  const priority = {
    root: 0,
    header: 1,
    main: 2,
    filterleiste: 3,
    liste: 4,
    editbox: 5,
  };
  return priority[last] ?? 99;
}

function buildTargets(rootElement) {
  if (!rootElement?.querySelectorAll) return [];

  const nodes = Array.from(rootElement.querySelectorAll('[data-ui-inspector-id]'));
  const counts = new Map();
  const result = [];

  for (const node of nodes) {
    const id = String(node?.getAttribute?.('data-ui-inspector-id') || '').trim();
    if (!id) continue;

    const next = (counts.get(id) || 0) + 1;
    counts.set(id, next);

    const segments = id.split('.');
    const labelBase = toTitleSegment(segments[segments.length - 1] || id);
    const totalCount = nodes.filter((item) => String(item?.getAttribute?.('data-ui-inspector-id') || '').trim() === id).length;

    result.push({
      key: `${id}::${next}`,
      id,
      label: totalCount > 1 ? `${labelBase} #${next}` : labelBase,
      level: Math.max(0, segments.length - 1),
      parentId: segments.length > 1 ? segments.slice(0, -1).join('.') : '',
      element: node,
      instance: next,
    });
  }

  const byId = new Set(result.map((target) => target.id));
  const childrenByParent = new Map();
  for (const target of result) {
    const parentId = target.parentId || '__root__';
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId).push(target);
  }

  const ordered = [];
  function walk(parentId) {
    const children = childrenByParent.get(parentId) || [];
    children.sort((a, b) => {
      const byDepth = a.id.split('.').length - b.id.split('.').length;
      if (byDepth !== 0) return byDepth;
      const bySegmentPriority = getSegmentPriority(a.id) - getSegmentPriority(b.id);
      if (bySegmentPriority !== 0) return bySegmentPriority;
      const byId = a.id.localeCompare(b.id, 'de');
      if (byId !== 0) return byId;
      return a.instance - b.instance;
    });

    for (const child of children) {
      ordered.push(child);
      walk(child.id);
    }
  }

  const roots = result.filter((target) => !target.parentId || !byId.has(target.parentId));
  roots.sort((a, b) => {
    const byPriority = getSegmentPriority(a.id) - getSegmentPriority(b.id);
    if (byPriority !== 0) return byPriority;
    return a.id.localeCompare(b.id, 'de');
  });
  for (const rootTarget of roots) {
    ordered.push(rootTarget);
    walk(rootTarget.id);
  }
  return ordered;
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
