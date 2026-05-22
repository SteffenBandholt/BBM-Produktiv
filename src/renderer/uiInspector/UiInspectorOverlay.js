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
    }
    const badgeDetached = !Array.isArray(overlayRoot.children) || !overlayRoot.children.includes(selectionBadge);
    if (selectionBadge.parentElement !== overlayRoot || badgeDetached) {
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

  function createFrame(doc, id, rect, index) {
    const frame = doc.createElement('div');
    frame.setAttribute('data-ui-inspector-overlay-frame', id);
    frame.style.position = 'fixed';
    frame.style.left = `${rect.left}px`;
    frame.style.top = `${rect.top}px`;
    frame.style.width = `${rect.width}px`;
    frame.style.height = `${rect.height}px`;
    frame.style.boxSizing = 'border-box';
    frame.style.pointerEvents = 'none';
    setFrameSelectionState(frame, id);
    const handle = doc.createElement('button');
    handle.type = 'button';
    handle.setAttribute('data-ui-inspector-overlay-handle', id);
    handle.textContent = id;
    handle.style.position = 'absolute';
    handle.style.left = '0';
    handle.style.top = `${-16 - (index * 18)}px`;
    handle.style.maxWidth = '320px';
    handle.style.whiteSpace = 'nowrap';
    handle.style.overflow = 'hidden';
    handle.style.textOverflow = 'ellipsis';
    handle.style.background = 'rgba(43, 157, 255, 0.95)';
    handle.style.color = '#ffffff';
    handle.style.font = '11px/1.2 monospace';
    handle.style.padding = '2px 4px';
    handle.style.border = '1px solid rgba(255, 255, 255, 0.35)';
    handle.style.borderRadius = '3px';
    handle.style.pointerEvents = 'auto';
    handle.style.cursor = 'pointer';
    handle.onclick = (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      select(id);
    };
    frame.append(handle);
    return frame;
  }

  function refresh() {
    if (!rootElement || !overlayRoot) return false;
    clearOverlayChildren();

    const nodes = rootElement.querySelectorAll(selector);
    const overlayEntries = [];
    let hasSelectedNode = false;
    let sourceIndex = 0;
    for (const node of nodes) {
      if (!node || typeof node.getBoundingClientRect !== 'function') continue;
      const id = String(node.getAttribute('data-ui-inspector-id') || '').trim();
      if (!id) continue;
      const rect = node.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;
      if (id === selectedId) hasSelectedNode = true;
      const area = Number(rect.width) * Number(rect.height);
      const depth = id.split('.').length;
      overlayEntries.push({ id, rect, area: Number.isFinite(area) ? area : 0, depth, sourceIndex });
      sourceIndex += 1;
    }

    overlayEntries.sort((a, b) => {
      if (b.area !== a.area) return b.area - a.area;
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.sourceIndex - b.sourceIndex;
    });

    const doc = rootElement.ownerDocument || globalThis.document;
    for (const [index, entry] of overlayEntries.entries()) {
      overlayRoot.append(createFrame(doc, entry.id, entry.rect, index % 4));
    }
    if (!hasSelectedNode) selectedId = '';
    updateSelectionBadge(doc);
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
