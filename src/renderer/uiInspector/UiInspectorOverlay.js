export function createUiInspectorOverlay(options = {}) {
  const defaultSelector = '[data-ui-inspector-id]';
  const selector =
    typeof options.selector === 'string' && options.selector.trim()
      ? options.selector.trim()
      : defaultSelector;
  const zIndex = Number.isFinite(options.zIndex) ? String(options.zIndex) : '2147483000';

  let rootElement = null;
  let overlayRoot = null;
  let selectedTargetKey = '';
  let selectedId = '';
  let selectedLabel = '';
  let captureHost = null;
  let captureHandler = null;
  let targets = [];
  let resolveTargetByKey = null;
  let getTargets = null;

  function clearOverlayChildren() {
    if (overlayRoot) {
      overlayRoot.replaceChildren();
    }
  }

  function ensureOverlayRoot(doc) {
    if (overlayRoot?.isConnected) {
      return overlayRoot;
    }

    overlayRoot = doc.createElement('div');
    overlayRoot.setAttribute('data-ui-inspector-overlay-root', 'true');
    Object.assign(overlayRoot.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex,
      overflow: 'hidden',
    });
    return overlayRoot;
  }

  function createBadge(doc) {
    const badge = doc.createElement('div');
    badge.setAttribute('data-ui-inspector-selection-badge', 'true');
    Object.assign(badge.style, {
      position: 'fixed',
      right: '12px',
      top: '12px',
      background: 'rgba(30, 35, 45, 0.92)',
      color: '#fff',
      font: '12px/1.3 monospace',
      padding: '6px 8px',
      borderRadius: '4px',
      pointerEvents: 'none',
    });
    badge.textContent = `Auswahl: ${selectedLabel || selectedId || '-'}`;
    return badge;
  }

  function createFrame(doc, target, rect) {
    const isSelected = selectedTargetKey === target.key;
    const frame = doc.createElement('div');
    frame.setAttribute('data-ui-inspector-overlay-frame', target.key);
    frame.setAttribute('data-ui-inspector-overlay-id', target.id);

    Object.assign(frame.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      boxSizing: 'border-box',
      border: isSelected ? '2px solid rgba(255, 168, 42, 0.98)' : '1px solid rgba(43, 157, 255, 0.95)',
      background: isSelected ? 'rgba(255, 168, 42, 0.16)' : 'rgba(43, 157, 255, 0.08)',
      pointerEvents: 'none',
    });

    if (isSelected) {
      frame.setAttribute('data-ui-inspector-selected', 'true');
    }

    const label = doc.createElement('div');
    label.textContent = target.label || target.id;
    Object.assign(label.style, {
      position: 'absolute',
      left: '0',
      top: '-16px',
      maxWidth: '320px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      background: isSelected ? 'rgba(255, 168, 42, 0.98)' : 'rgba(43, 157, 255, 0.95)',
      color: '#fff',
      font: '11px/1.2 monospace',
      padding: '2px 4px',
      pointerEvents: 'none',
    });

    frame.append(label);
    return frame;
  }

  function readTargetsFromDom() {
    if (!rootElement?.querySelectorAll) {
      return [];
    }

    const nodes = Array.from(rootElement.querySelectorAll(selector));
    return nodes.map((el, index) => ({
      key: `${el.getAttribute('data-ui-inspector-id')}::${index + 1}`,
      id: el.getAttribute('data-ui-inspector-id'),
      label: el.getAttribute('data-ui-inspector-id'),
      element: el,
    }));
  }

  function updateTargets() {
    if (typeof getTargets === 'function') {
      targets = getTargets();
      return;
    }

    targets = readTargetsFromDom();
  }

  function getHitsAtPoint(x, y) {
    updateTargets();

    return targets
      .filter((target) => {
        const rect = target.element?.getBoundingClientRect?.();
        if (!rect || rect.width <= 0 || rect.height <= 0) {
          return false;
        }
        return !(x < rect.left || x > rect.left + rect.width || y < rect.top || y > rect.top + rect.height);
      })
      .map((target, index) => {
        const rect = target.element.getBoundingClientRect();
        return {
          target,
          area: rect.width * rect.height,
          depth: target.id.split('.').length,
          index,
        };
      })
      .sort((a, b) => a.area - b.area || b.depth - a.depth || a.index - b.index);
  }

  function removeHitList() {
    for (const child of Array.from(overlayRoot?.children || [])) {
      if (child?.getAttribute?.('data-ui-inspector-hit-list') === 'true') {
        child.parentElement?.removeChild?.(child);
      }
    }
  }

  function selectTarget(target) {
    selectedTargetKey = String(target?.key || '').trim();
    selectedId = String(target?.id || '').trim();
    selectedLabel = String(target?.label || '').trim();
    removeHitList();
    options.onSelectTarget?.(target);
    options.onSelect?.(selectedId);
    return refresh();
  }

  function clearSelection() {
    selectedTargetKey = '';
    selectedId = '';
    selectedLabel = '';
    removeHitList();
    options.onClearSelection?.();
    return refresh();
  }

  function showHitListAtPoint(x, y) {
    if (!overlayRoot || !rootElement) {
      return false;
    }

    removeHitList();
    const hits = getHitsAtPoint(x, y);

    if (!hits.length) {
      clearSelection();
      return false;
    }

    const doc = rootElement.ownerDocument || globalThis.document;
    const list = doc.createElement('div');
    list.setAttribute('data-ui-inspector-hit-list', 'true');
    Object.assign(list.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      maxWidth: '380px',
      background: 'rgba(24, 29, 38, 0.97)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '6px',
      padding: '6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      pointerEvents: 'auto',
    });

    for (const hit of hits) {
      const option = doc.createElement('button');
      option.type = 'button';
      option.setAttribute('data-ui-inspector-hit-option', hit.target.key);
      option.textContent = `${hit.target.id}${hit.target.label?.includes('#') ? ` (${hit.target.label})` : ''}`;
      option.style.pointerEvents = 'auto';
      option.style.textAlign = 'left';
      option.onclick = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        event?.stopImmediatePropagation?.();
        selectTarget(hit.target);
      };
      list.append(option);
    }

    overlayRoot.append(list);
    return true;
  }

  function refresh() {
    if (!rootElement || !overlayRoot) {
      return false;
    }

    updateTargets();
    clearOverlayChildren();

    const doc = rootElement.ownerDocument || globalThis.document;
    for (const target of targets) {
      const rect = target.element?.getBoundingClientRect?.();
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        continue;
      }
      overlayRoot.append(createFrame(doc, target, rect));
    }

    overlayRoot.append(createBadge(doc));
    return true;
  }

  function isInsideInspectorUi(target) {
    let node = target;
    while (node) {
      if (
        node.getAttribute?.('data-ui-inspector-hit-list') === 'true' ||
        node.getAttribute?.('data-ui-inspector-hit-option') ||
        node.getAttribute?.('data-ui-inspector-panel') === 'true'
      ) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function bindCaptureListener(doc) {
    if (!doc || captureHandler || typeof doc.addEventListener !== 'function') {
      return;
    }

    captureHandler = (event) => {
      if (isInsideInspectorUi(event?.target)) {
        return;
      }

      const x = Number(event?.clientX);
      const y = Number(event?.clientY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }

      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      showHitListAtPoint(x, y);
    };

    doc.addEventListener('pointerdown', captureHandler, true);
    captureHost = doc;
  }

  function unbindCaptureListener() {
    if (captureHost && captureHandler && typeof captureHost.removeEventListener === 'function') {
      captureHost.removeEventListener('pointerdown', captureHandler, true);
    }
    captureHost = null;
    captureHandler = null;
  }

  function mount(nextRootElement, runtimeOptions = {}) {
    options.onSelect = runtimeOptions.onSelect || options.onSelect;
    options.onSelectTarget = runtimeOptions.onSelectTarget || options.onSelectTarget;
    options.onClearSelection = runtimeOptions.onClearSelection || options.onClearSelection;
    resolveTargetByKey = runtimeOptions.resolveTargetByKey || null;
    getTargets = typeof runtimeOptions.getTargets === 'function' ? runtimeOptions.getTargets : null;
    targets = Array.isArray(runtimeOptions.targets) ? runtimeOptions.targets : [];

    if (!nextRootElement || typeof nextRootElement.querySelectorAll !== 'function') {
      return false;
    }

    rootElement = nextRootElement;
    const doc = rootElement.ownerDocument || globalThis.document;
    const root = ensureOverlayRoot(doc);
    const host = doc.body || rootElement;
    if (!root.isConnected) {
      host.append(root);
    }

    bindCaptureListener(doc);
    refresh();
    return true;
  }

  function unmount() {
    clearSelection();
    unbindCaptureListener();
    clearOverlayChildren();
    overlayRoot?.parentElement?.removeChild(overlayRoot);
    rootElement = null;
    targets = [];
    return true;
  }

  return {
    mount,
    unmount,
    refresh,
    getSelectedId: () => selectedId,
    getSelectedTargetKey: () => selectedTargetKey,
    getSelectedTarget: () =>
      selectedTargetKey
        ? resolveTargetByKey?.(selectedTargetKey) || targets.find((target) => target.key === selectedTargetKey) || null
        : null,
    getOverlayRoot: () => overlayRoot,
    select(id, optionsForSelect = {}) {
      updateTargets();
      let target = optionsForSelect.target || targets.find((item) => item.id === id);
      if (!target) {
        targets = readTargetsFromDom();
        target = targets.find((item) => item.id === id);
      }
      if (!target) {
        return false;
      }
      return selectTarget(target);
    },
    selectTarget,
    clearSelection,
    getHitsAtPoint: (x, y) => getHitsAtPoint(x, y).map((hit) => ({ id: hit.target.id, key: hit.target.key, label: hit.target.label })),
    showHitListAtPoint,
  };
}
