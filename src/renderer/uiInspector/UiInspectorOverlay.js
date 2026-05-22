export function createUiInspectorOverlay(options = {}) {
  const defaultSelector = '[data-ui-inspector-id]';
  const selector = typeof options.selector === 'string' && options.selector.trim() ? options.selector : defaultSelector;
  const zIndex = Number.isFinite(options.zIndex) ? String(options.zIndex) : '2147483000';

  let rootElement = null;
  let overlayRoot = null;

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

  function createFrame(doc, id, rect) {
    const frame = doc.createElement('div');
    frame.setAttribute('data-ui-inspector-overlay-frame', id);
    frame.style.position = 'fixed';
    frame.style.left = `${rect.left}px`;
    frame.style.top = `${rect.top}px`;
    frame.style.width = `${rect.width}px`;
    frame.style.height = `${rect.height}px`;
    frame.style.boxSizing = 'border-box';
    frame.style.border = '1px solid rgba(43, 157, 255, 0.95)';
    frame.style.background = 'rgba(43, 157, 255, 0.08)';
    frame.style.pointerEvents = 'none';

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
    for (const node of nodes) {
      if (!node || typeof node.getBoundingClientRect !== 'function') continue;
      const id = String(node.getAttribute('data-ui-inspector-id') || '').trim();
      if (!id) continue;
      const rect = node.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;
      overlayRoot.append(createFrame(rootElement.ownerDocument || globalThis.document, id, rect));
    }
    return true;
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
    return true;
  }

  return { mount, unmount, refresh };
}
