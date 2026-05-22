import { createUiInspectorOverlay } from './UiInspectorOverlay.js';
import { createUiInspectorPanel } from './UiInspectorPanel.js';

const CONTAINER_CONTROLS = ['Breite', 'Höhe', 'Abstand außen', 'Abstand innen', 'Sichtbarkeit'];
const FIELD_CONTROLS = ['Breite', 'Höhe', 'Abstand links', 'Abstand oben', 'Schriftgröße', 'Sichtbarkeit'];

function getAllowedControlsForSelectedId(selectedId) {
  const normalizedId = String(selectedId || '').trim();
  if (!normalizedId) return [];

  const containerIds = new Set([
    'restarbeiten.root',
    'restarbeiten.header',
    'restarbeiten.main',
    'restarbeiten.filterleiste',
    'restarbeiten.filterleiste.meta',
    'restarbeiten.editbox',
    'restarbeiten.editbox.header',
    'restarbeiten.editbox.verortung',
    'restarbeiten.editbox.meta',
    'restarbeiten.liste',
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

  function renderPanelForSelection(selectedId) {
    const controls = getAllowedControlsForSelectedId(selectedId);
    resolvedPanel.render({
      selectedId,
      controls,
      note: controls.length ? '' : 'Für diesen Bereich sind noch keine Stellschrauben definiert.',
    });
  }

  function activateOverlay(rootElement) {
    const overlayMounted = resolvedOverlay.mount(rootElement, {
      onSelect: (id) => {
        renderPanelForSelection(id);
      },
      onClearSelection: () => {
        resolvedPanel.clear();
      },
    }) === true;

    if (!overlayMounted) {
      overlayActive = false;
      return false;
    }

    const panelMounted = resolvedPanel.mount(resolvedOverlay.getOverlayRoot?.() || rootElement?.ownerDocument?.body || globalThis.document?.body) === true;
    overlayActive = panelMounted;

    if (overlayActive) {
      renderPanelForSelection(resolvedOverlay.getSelectedId?.() || '');
    }

    return overlayActive;
  }

  function deactivateOverlay() {
    resolvedOverlay.unmount();
    resolvedPanel.unmount();
    overlayActive = false;
    return true;
  }

  function refreshOverlay() {
    if (!overlayActive) return false;
    return resolvedOverlay.refresh() === true;
  }

  function getSelectedElementId() {
    return resolvedOverlay.getSelectedId?.() || '';
  }

  function clearSelection() {
    const result = resolvedOverlay.clearSelection?.() === true;
    resolvedPanel.clear();
    return result;
  }

  return {
    overlay: resolvedOverlay,
    panel: resolvedPanel,
    activateOverlay,
    deactivateOverlay,
    refreshOverlay,
    getSelectedElementId,
    clearSelection,
    getAllowedControlsForSelectedId,
    isOverlayActive() {
      return overlayActive;
    },
  };
}
