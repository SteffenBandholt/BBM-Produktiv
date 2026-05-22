export function createUiInspectorOverlay(options = {}) {
  const defaultSelector = '[data-ui-inspector-id]';
  const selector = typeof options.selector === 'string' && options.selector.trim() ? options.selector : defaultSelector;
  const zIndex = Number.isFinite(options.zIndex) ? String(options.zIndex) : '2147483000';

  let rootElement = null;
  let overlayRoot = null;
  let selectedId = '';
  let selectionBadge = null;

  function clearOverlayChildren() {
    if (!overlayRoot) return;
    overlayRoot.replaceChildren();
  }

  function ensureOverlayRoot(doc) {
    if (overlayRoot?.isConnected) return overlayRoot;
    overlayRoot = doc.createElement('div');
    overlayRoot.setAttribute('data-ui-inspector-overlay-root', 'true');
    overlayRoot.style.position = 'fixed';
    overlayRoot.style.inset = '0';
    overlayRoot.style.pointerEvents = 'none';
    overlayRoot.style.zIndex = zIndex;
    overlayRoot.style.overflow = 'hidden';
    return overlayRoot;
  }

  function updateSelectionBadge(doc) {
    if (!overlayRoot) return;
    if (!selectionBadge) {
      selectionBadge = doc.createElement('div');
      selectionBadge.setAttribute('data-ui-inspector-overlay-selection', 'true');
      selectionBadge.style.position = 'fixed';
      selectionBadge.style.right = '12px';
      selectionBadge.style.top = '12px';
      selectionBadge.style.background = 'rgba(9, 30, 66, 0.94)';
      selectionBadge.style.color = '#ffffff';
      selectionBadge.style.font = '12px/1.2 monospace';
      selectionBadge.style.padding = '4px 8px';
      selectionBadge.style.border = '1px solid rgba(255, 255, 255, 0.35)';
      selectionBadge.style.borderRadius = '4px';
      selectionBadge.style.pointerEvents = 'none';
      overlayRoot.append(selectionBadge);
    }
    selectionBadge.textContent = selectedId ? `Auswahl: ${selectedId}` : 'Auswahl: -';
  }

  function setFrameSelectionState(frame, id) {
    const isSelected = !!selectedId && selectedId === id;
    frame.setAttribute('data-ui-inspector-selected', isSelected ? 'true' : 'false');
    frame.style.border = isSelected ? '2px solid rgba(255, 133, 40, 1)' : '1px solid rgba(43, 157, 255, 0.95)';
    frame.style.background = isSelected ? 'rgba(255, 133, 40, 0.16)' : 'rgba(43, 157, 255, 0.08)';
  }

  function createFrame(doc, id, rect) {
    const frame = doc.createElement('div');
    frame.setAttribute('data-ui-inspector-overlay-frame', id);
    frame.style.position = 'fixed';
    frame.style.left = `${rect.left}px`;
    frame.style.top = `${rect.top}px`;
    frame.style.width = `${rect.width}px`;
    frame.style.height = `${rect.height}px`;
    frame.style.boxSizing = 'border-box';
    frame.style.pointerEvents = 'auto';
    setFrameSelectionState(frame, id);
    frame.onclick = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      select(id);
    };

    const label = doc.createElement('div');
    label.setAttribute('data-ui-inspector-overlay-label', id);
    label.textContent = id;
    label.style.position = 'absolute';
    label.style.left = '0';
    label.style.top = '-16px';
    label.style.maxWidth = '320px';
    label.style.whiteSpace = 'nowrap';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
    label.style.background = 'rgba(43, 157, 255, 0.95)';
    label.style.color = '#ffffff';
    label.style.font = '11px/1.2 monospace';
    label.style.padding = '2px 4px';
    label.style.pointerEvents = 'none';

    frame.append(label);
    return frame;
  }

  function refresh() {
    if (!rootElement || !overlayRoot) return false;
    clearOverlayChildren();

    const nodes = rootElement.querySelectorAll(selector);
    let hasSelectedNode = false;
    for (const node of nodes) {
      if (!node || typeof node.getBoundingClientRect !== 'function') continue;
      const id = String(node.getAttribute('data-ui-inspector-id') || '').trim();
      if (!id) continue;
      const rect = node.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;
      if (id === selectedId) hasSelectedNode = true;
      overlayRoot.append(createFrame(rootElement.ownerDocument || globalThis.document, id, rect));
    }
    if (!hasSelectedNode) selectedId = '';
    updateSelectionBadge(rootElement.ownerDocument || globalThis.document);
    return true;
  }

  function getSelectedId() {
    return selectedId;
  }

  function select(id) {
    const nextId = String(id || '').trim();
    selectedId = nextId;
    refresh();
    if (typeof options.onSelect === 'function') options.onSelect(selectedId, { id: selectedId });
    return selectedId;
  }

  function clearSelection() {
    if (!selectedId) return '';
    selectedId = '';
    refresh();
    if (typeof options.onSelect === 'function') options.onSelect('', { id: '' });
    return selectedId;
  }

  function mount(nextRootElement) {
    if (!nextRootElement || typeof nextRootElement.querySelectorAll !== 'function') return false;
    rootElement = nextRootElement;
    const doc = rootElement.ownerDocument || globalThis.document;
    const nextOverlayRoot = ensureOverlayRoot(doc);
    const mountHost = doc.body || rootElement;
    if (!nextOverlayRoot.isConnected) mountHost.append(nextOverlayRoot);
    refresh();
    return true;
  }

  function unmount() {
    clearOverlayChildren();
    if (overlayRoot?.parentElement) overlayRoot.parentElement.removeChild(overlayRoot);
    rootElement = null;
    selectionBadge = null;
    selectedId = '';
    return true;
  }

  return { mount, unmount, refresh, getSelectedId, select, clearSelection };
}
