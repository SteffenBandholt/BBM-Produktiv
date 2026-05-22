export function createUiInspectorOverlay(options = {}) {
  const defaultSelector = '[data-ui-inspector-id]';
  const selector = typeof options.selector === 'string' && options.selector.trim() ? options.selector : defaultSelector;
  const zIndex = Number.isFinite(options.zIndex) ? String(options.zIndex) : '2147483000';

  let rootElement = null;
  let overlayRoot = null;
  let selectedId = '';
  let captureHost = null;
  let captureHandler = null;
  let domSequence = 0;

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

  function createBadge(doc) {
    const badge = doc.createElement('div');
    badge.setAttribute('data-ui-inspector-selection-badge', 'true');
    badge.style.position = 'fixed';
    badge.style.right = '12px';
    badge.style.top = '12px';
    badge.style.background = 'rgba(30, 35, 45, 0.92)';
    badge.style.color = '#ffffff';
    badge.style.font = '12px/1.3 monospace';
    badge.style.padding = '6px 8px';
    badge.style.borderRadius = '4px';
    badge.style.pointerEvents = 'none';
    badge.textContent = `Auswahl: ${selectedId || '-'}`;
    return badge;
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
    frame.style.border = selectedId === id ? '2px solid rgba(255, 168, 42, 0.98)' : '1px solid rgba(43, 157, 255, 0.95)';
    frame.style.background = selectedId === id ? 'rgba(255, 168, 42, 0.16)' : 'rgba(43, 157, 255, 0.08)';
    frame.style.pointerEvents = 'none';
    if (selectedId === id) frame.setAttribute('data-ui-inspector-selected', 'true');

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
    label.style.background = selectedId === id ? 'rgba(255, 168, 42, 0.98)' : 'rgba(43, 157, 255, 0.95)';
    label.style.color = '#ffffff';
    label.style.font = '11px/1.2 monospace';
    label.style.padding = '2px 4px';
    label.style.pointerEvents = 'none';

    frame.append(label);
    return frame;
  }

  function getHitsAtPoint(x, y) {
    if (!rootElement) return [];
    const nodes = rootElement.querySelectorAll(selector);
    const hits = [];
    domSequence = 0;
    for (const node of nodes) {
      domSequence += 1;
      if (!node || typeof node.getBoundingClientRect !== 'function') continue;
      const id = String(node.getAttribute('data-ui-inspector-id') || '').trim();
      if (!id) continue;
      const rect = node.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;
      if (x < rect.left || x > rect.left + rect.width || y < rect.top || y > rect.top + rect.height) continue;
      hits.push({ id, rect, area: rect.width * rect.height, depth: id.split('.').length, index: domSequence });
    }
    hits.sort((a, b) => a.area - b.area || b.depth - a.depth || a.index - b.index);
    return hits;
  }

  function removeHitList() {
    if (!overlayRoot) return;
    const children = Array.from(overlayRoot.children || []);
    for (const child of children) {
      if (child?.getAttribute?.('data-ui-inspector-hit-list') === 'true') {
        child.parentElement?.removeChild?.(child);
      }
    }
  }

  function select(id) {
    selectedId = String(id || '').trim();
    removeHitList();
    options.onSelect?.(selectedId);
    return refresh();
  }

  function clearSelection() {
    selectedId = '';
    removeHitList();
    options.onClearSelection?.();
    return refresh();
  }

  function showHitListAtPoint(x, y) {
    if (!overlayRoot || !rootElement) return false;
    removeHitList();
    const hits = getHitsAtPoint(x, y);
    if (!hits.length) {
      clearSelection();
      return false;
    }

    const doc = rootElement.ownerDocument || globalThis.document;
    const list = doc.createElement('div');
    list.setAttribute('data-ui-inspector-hit-list', 'true');
    list.style.position = 'fixed';
    list.style.left = `${x}px`;
    list.style.top = `${y}px`;
    list.style.maxWidth = '380px';
    list.style.background = 'rgba(24, 29, 38, 0.97)';
    list.style.border = '1px solid rgba(255,255,255,0.2)';
    list.style.borderRadius = '6px';
    list.style.padding = '6px';
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '4px';
    list.style.pointerEvents = 'auto';

    for (const hit of hits) {
      const option = doc.createElement('button');
      option.type = 'button';
      option.setAttribute('data-ui-inspector-hit-option', hit.id);
      option.textContent = hit.id;
      option.style.pointerEvents = 'auto';
      option.style.textAlign = 'left';
      option.onclick = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        event?.stopImmediatePropagation?.();
        select(hit.id);
      };
      list.append(option);
    }
    overlayRoot.append(list);
    return true;
  }

  function refresh() {
    if (!rootElement || !overlayRoot) return false;
    clearOverlayChildren();

    const nodes = rootElement.querySelectorAll(selector);
    for (const node of nodes) {
      if (!node || typeof node.getBoundingClientRect !== 'function') continue;
      const id = String(node.getAttribute('data-ui-inspector-id') || '').trim();
      if (!id) continue;
      const rect = node.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;
      overlayRoot.append(createFrame(rootElement.ownerDocument || globalThis.document, id, rect));
    }
    overlayRoot.append(createBadge(rootElement.ownerDocument || globalThis.document));
    return true;
  }


  function isInsideHitList(target) {
    let node = target;
    while (node) {
      if (node.getAttribute?.('data-ui-inspector-hit-list') === 'true') return true;
      if (node.getAttribute?.('data-ui-inspector-hit-option')) return true;
      node = node.parentElement;
    }
    return false;
  }

  function bindCaptureListener(doc) {
    if (!doc || captureHandler || typeof doc.addEventListener !== 'function') return;
    captureHandler = (event) => {
      if (isInsideHitList(event?.target)) return;
      const x = Number(event?.clientX);
      const y = Number(event?.clientY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      showHitListAtPoint(x, y);
    };
    doc.addEventListener('pointerdown', captureHandler, true);
    captureHost = doc;
  }

  function unbindCaptureListener() {
    if (!captureHost || !captureHandler) return;
    if (typeof captureHost.removeEventListener === 'function') {
      captureHost.removeEventListener('pointerdown', captureHandler, true);
    }
    captureHost = null;
    captureHandler = null;
  }

  function mount(nextRootElement, runtimeOptions = {}) {
    if (runtimeOptions && typeof runtimeOptions === 'object') {
      options.onSelect = runtimeOptions.onSelect || options.onSelect;
      options.onClearSelection = runtimeOptions.onClearSelection || options.onClearSelection;
    }
    if (!nextRootElement || typeof nextRootElement.querySelectorAll !== 'function') return false;
    rootElement = nextRootElement;
    const doc = rootElement.ownerDocument || globalThis.document;
    const nextOverlayRoot = ensureOverlayRoot(doc);
    const mountHost = doc.body || rootElement;
    if (!nextOverlayRoot.isConnected) mountHost.append(nextOverlayRoot);
    bindCaptureListener(doc);
    refresh();
    return true;
  }

  function unmount() {
    clearSelection();
    unbindCaptureListener();
    clearOverlayChildren();
    if (overlayRoot?.parentElement) overlayRoot.parentElement.removeChild(overlayRoot);
    rootElement = null;
    return true;
  }

  return { mount, unmount, refresh, getSelectedId: () => selectedId, getOverlayRoot: () => overlayRoot, select, clearSelection, getHitsAtPoint, showHitListAtPoint };
}
