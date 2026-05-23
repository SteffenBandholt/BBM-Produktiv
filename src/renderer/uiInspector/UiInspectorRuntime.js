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

export function createUiInspectorRuntime({ overlay, panel } = {}) {
  const resolvedOverlay = overlay || createUiInspectorOverlay();
  const resolvedPanel = panel || createUiInspectorPanel();
  const temporaryStyles = createUiInspectorTemporaryStyles();
  let overlayActive = false;
  let hostRoot = null;
  let selectedId = '';

  function getSelectedTargetElement() {
    if (!hostRoot || !selectedId) return null;
    const escapedId = escapeSelectorValue(selectedId);
    // M13: duplicate IDs use first match; dedicated handling planned in M15/M16.
    return hostRoot.querySelector?.(`[data-ui-inspector-id="${escapedId}"]`) || null;
  }

  function renderPanelForSelection(nextSelectedId) {
    selectedId = String(nextSelectedId || '').trim();
    const controls = getAllowedControlsForSelectedId(selectedId);
    const targetElement = getSelectedTargetElement();
    const targetMissing = Boolean(selectedId) && !targetElement;
    resolvedPanel.render({ selectedId, controls, note: controls.length ? '' : 'Für diesen Bereich sind noch keine Stellschrauben definiert.', previewState: temporaryStyles.getPreviewState(selectedId), targetMissing,
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
