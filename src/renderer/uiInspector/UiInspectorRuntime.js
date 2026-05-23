import { createUiInspectorOverlay } from './UiInspectorOverlay.js';
import { createUiInspectorPanel } from './UiInspectorPanel.js';
import { createUiInspectorTemporaryStyles } from './UiInspectorTemporaryStyles.js';

const CONTAINER_CONTROLS = ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Sichtbarkeit'];
const FIELD_CONTROLS = ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Sichtbarkeit'];

function getAllowedControlsForSelectedId(selectedId) {
  const normalizedId = String(selectedId || '').trim();
  if (!normalizedId) return [];
  const containerIds = new Set(['restarbeiten.root', 'restarbeiten.header', 'restarbeiten.main', 'restarbeiten.filterleiste', 'restarbeiten.filterleiste.meta', 'restarbeiten.filterleiste.verortung', 'restarbeiten.filterleiste.klassenfilter', 'restarbeiten.editbox', 'restarbeiten.editbox.header', 'restarbeiten.editbox.verortung', 'restarbeiten.editbox.meta', 'restarbeiten.liste', 'restarbeiten.liste.textbereich', 'restarbeiten.liste.metabereich']);
  if (containerIds.has(normalizedId)) return [...CONTAINER_CONTROLS];
  const fieldSuffixes = ['.feld', '.kurztext', '.langtext', '.fertig_bis', '.status', '.verantwortlich', '.label', '.restzeichen'];
  if (fieldSuffixes.some((suffix) => normalizedId.endsWith(suffix))) return [...FIELD_CONTROLS];
  return [];
}

function escapeSelectorValue(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function compareTargetIds(a, b) {
  const aParts = String(a || '').split('.');
  const bParts = String(b || '').split('.');
  const max = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < max; i += 1) {
    const left = aParts[i] || '';
    const right = bParts[i] || '';
    const cmp = left.localeCompare(right);
    if (cmp !== 0) return cmp;
  }
  return 0;
}

export function createUiInspectorRuntime({ overlay, panel } = {}) {
  const resolvedOverlay = overlay || createUiInspectorOverlay();
  const resolvedPanel = panel || createUiInspectorPanel();
  const temporaryStyles = createUiInspectorTemporaryStyles();
  let overlayActive = false;
  let hostRoot = null;
  let selectedId = '';
  let selectedTargetKey = '';

  function collectAvailableTargets() {
    if (!hostRoot || typeof hostRoot.querySelectorAll !== 'function') return [];
    const targetMap = new Map();
    const nodes = hostRoot.querySelectorAll('[data-ui-inspector-id]');
    let sequence = 0;
    for (const node of nodes || []) {
      sequence += 1;
      const id = String(node?.getAttribute?.('data-ui-inspector-id') || '').trim();
      if (!id) continue;
      const current = targetMap.get(id) || [];
      current.push({ id, key: `${id}::${current.length + 1}`, label: `${id} #${current.length + 1}`, index: current.length + 1, element: node, sequence });
      targetMap.set(id, current);
    }
    const targets = [];
    const sortedIds = [...targetMap.keys()].sort(compareTargetIds);
    for (const id of sortedIds) {
      const items = targetMap.get(id) || [];
      if (items.length === 1) targets.push({ ...items[0], key: id, label: id });
      else targets.push(...items);
    }
    return targets;
  }

  function getSelectedTargetElement(targets) {
    if (!selectedId) return null;
    if (selectedTargetKey) return targets.find((target) => target.key === selectedTargetKey)?.element || null;
    const escapedId = escapeSelectorValue(selectedId);
    return hostRoot?.querySelector?.(`[data-ui-inspector-id="${escapedId}"]`) || null;
  }

  function renderPanelForSelection(nextSelectedId) {
    selectedId = String(nextSelectedId || '').trim();
    const availableTargets = collectAvailableTargets();
    if (!availableTargets.some((target) => target.key === selectedTargetKey && target.id === selectedId)) {
      selectedTargetKey = '';
    }
    const controls = getAllowedControlsForSelectedId(selectedId);
    const targetElement = getSelectedTargetElement(availableTargets);
    const targetMissing = Boolean(selectedId) && !targetElement;
    resolvedPanel.render({ selectedId, selectedTargetKey, controls, note: controls.length ? '' : 'Für diesen Bereich sind noch keine Stellschrauben definiert.', previewState: temporaryStyles.getPreviewState(selectedId), targetMissing, availableTargets,
      onSelectTarget: (selection) => {
        const selectedTarget = availableTargets.find((target) => target.key === selection || target.id === selection);
        selectedTargetKey = selectedTarget?.key || '';
        if (typeof resolvedOverlay.select === 'function') {
          resolvedOverlay.select(selectedTarget?.id || selection);
          return;
        }
        renderPanelForSelection(selectedTarget?.id || selection);
      },
      onControl: (action) => {
        if (!targetElement) return;
        if (action === 'reset') temporaryStyles.resetElement(targetElement, selectedId);
        if (action === 'width.decrease') temporaryStyles.applyDelta(targetElement, 'width', -5, selectedId);
        if (action === 'width.increase') temporaryStyles.applyDelta(targetElement, 'width', 5, selectedId);
        if (action === 'height.decrease') temporaryStyles.applyDelta(targetElement, 'height', -5, selectedId);
        if (action === 'height.increase') temporaryStyles.applyDelta(targetElement, 'height', 5, selectedId);
        if (action === 'marginLeft.decrease') temporaryStyles.applyDelta(targetElement, 'marginLeft', -5, selectedId);
        if (action === 'marginLeft.increase') temporaryStyles.applyDelta(targetElement, 'marginLeft', 5, selectedId);
        if (action === 'marginTop.decrease') temporaryStyles.applyDelta(targetElement, 'marginTop', -5, selectedId);
        if (action === 'marginTop.increase') temporaryStyles.applyDelta(targetElement, 'marginTop', 5, selectedId);
        if (action === 'visibility.toggle') temporaryStyles.toggleVisibility(targetElement, selectedId);
        renderPanelForSelection(selectedId);
      } });
  }

  function activateOverlay(rootElement) {
    hostRoot = rootElement || null;
    const overlayMounted = resolvedOverlay.mount(rootElement, { onSelect: (id) => renderPanelForSelection(id), onClearSelection: () => { temporaryStyles.resetAll(); selectedId = ''; resolvedPanel.clear(); } }) === true;
    if (!overlayMounted) { overlayActive = false; return false; }
    const panelMounted = resolvedPanel.mount(rootElement?.ownerDocument?.body || globalThis.document?.body) === true;
    overlayActive = panelMounted;
    if (overlayActive) renderPanelForSelection(resolvedOverlay.getSelectedId?.() || '');
    return overlayActive;
  }

  function deactivateOverlay() {
    temporaryStyles.resetAll();
    resolvedOverlay.unmount();
    resolvedPanel.unmount();
    overlayActive = false;
    selectedId = '';
    hostRoot = null;
    return true;
  }

  return {
    overlay: resolvedOverlay,
    panel: resolvedPanel,
    activateOverlay,
    deactivateOverlay,
    refreshOverlay() { if (!overlayActive) return false; return resolvedOverlay.refresh() === true; },
    getSelectedElementId() { return resolvedOverlay.getSelectedId?.() || ''; },
    clearSelection() { const result = resolvedOverlay.clearSelection?.() === true; temporaryStyles.resetAll(); selectedId=''; resolvedPanel.clear(); return result; },
    getAllowedControlsForSelectedId,
    isOverlayActive() { return overlayActive; },
  };
}
