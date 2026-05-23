import { createUiInspectorOverlay } from './UiInspectorOverlay.js';
import { createUiInspectorPanel } from './UiInspectorPanel.js';

const CONTAINER_CONTROLS = ['Breite', 'Höhe', 'Abstand außen', 'Abstand innen', 'Sichtbarkeit'];
const FIELD_CONTROLS = ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Schriftgröße', 'Sichtbarkeit'];

function toTitleSegment(segment) {
  const map = {
    root: 'Root', header: 'Header', main: 'Main', editbox: 'Editbox', filterleiste: 'Filterleiste',
    klassenfilter: 'Klassenfilter', verortung: 'Verortung', feld: 'Feld', meta: 'Meta', liste: 'Liste',
    textbereich: 'Textbereich', metabereich: 'Metabereich', kurztext: 'Kurztext', langtext: 'Langtext',
    label: 'Label', restzeichen: 'Restzeichen',
  };
  return map[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
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
    const key = `${id}::${next}`;
    const segments = id.split('.');
    const labelBase = toTitleSegment(segments[segments.length - 1] || id);
    const label = counts.get(id) > 1 || nodes.filter((n) => String(n?.getAttribute?.('data-ui-inspector-id') || '').trim() === id).length > 1
      ? `${labelBase} #${next}`
      : labelBase;
    result.push({
      key,
      id,
      label,
      level: Math.max(0, segments.length - 1),
      parentId: segments.length > 1 ? segments.slice(0, -1).join('.') : '',
      element: node,
      instance: next,
    });
  }
  return result;
}

function getAllowedControlsForSelectedId(selectedId) {
  const normalizedId = String(selectedId || '').trim();
  if (!normalizedId) return [];
  const containerIds = new Set(['restarbeiten.root','restarbeiten.header','restarbeiten.main','restarbeiten.filterleiste','restarbeiten.filterleiste.meta','restarbeiten.editbox','restarbeiten.editbox.header','restarbeiten.editbox.verortung','restarbeiten.editbox.meta','restarbeiten.liste','restarbeiten.filterleiste.verortung','restarbeiten.filterleiste.klassenfilter']);
  if (containerIds.has(normalizedId)) return [...CONTAINER_CONTROLS];
  const fieldSuffixes = ['.feld', '.kurztext', '.langtext', '.fertig_bis', '.status', '.verantwortlich', '.label', '.restzeichen'];
  if (fieldSuffixes.some((suffix) => normalizedId.endsWith(suffix))) return [...FIELD_CONTROLS];
  return [];
}

export function createUiInspectorRuntime({ overlay, panel } = {}) {
  const resolvedOverlay = overlay || createUiInspectorOverlay();
  const resolvedPanel = panel || createUiInspectorPanel();
  let overlayActive = false;
  let targets = [];

  function renderPanelForSelection(target) {
    const selectedId = target?.id || '';
    const controls = getAllowedControlsForSelectedId(selectedId);
    resolvedPanel.render({ selectedId, selectedLabel: target?.label || '', selectedTargetKey: target?.key || '', controls, note: controls.length ? 'Auswahlmodell – noch keine Layoutänderung.' : 'Für diesen Bereich sind noch keine Stellschrauben definiert.', targets, onSelectTargetKey: (key) => { const nextTarget = targets.find((t) => t.key === key); if (nextTarget) resolvedOverlay.selectTarget(nextTarget); } });
  }

  function activateOverlay(rootElement) {
    targets = buildTargets(rootElement);
    const byKey = new Map(targets.map((t) => [t.key, t]));
    const overlayMounted = resolvedOverlay.mount(rootElement, {
      targets,
      onSelectTarget: (target) => renderPanelForSelection(target),
      onClearSelection: () => resolvedPanel.clear({ targets }),
      resolveTargetByKey: (key) => byKey.get(key),
    }) === true;
    if (!overlayMounted) { overlayActive = false; return false; }
    const panelMounted = resolvedPanel.mount(rootElement?.ownerDocument?.body || globalThis.document?.body) === true;
    overlayActive = panelMounted;
    if (overlayActive) renderPanelForSelection(resolvedOverlay.getSelectedTarget?.() || null);
    return overlayActive;
  }

  return {
    overlay: resolvedOverlay,
    panel: resolvedPanel,
    activateOverlay,
    deactivateOverlay() { resolvedOverlay.unmount(); resolvedPanel.unmount(); overlayActive = false; return true; },
    refreshOverlay() { if (!overlayActive) return false; return resolvedOverlay.refresh() === true; },
    getSelectedElementId() { return resolvedOverlay.getSelectedId?.() || ''; },
    clearSelection() { const r = resolvedOverlay.clearSelection?.() === true; resolvedPanel.clear({ targets }); return r; },
    getAllowedControlsForSelectedId,
    getTargets() { return [...targets]; },
    isOverlayActive() { return overlayActive; },
  };
}

export { buildTargets };
