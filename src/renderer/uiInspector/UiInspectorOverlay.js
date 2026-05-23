export function createUiInspectorOverlay(options = {}) {
  let optionsState = { ...options };
  const selector = typeof options.selector === 'string' && options.selector.trim()
    ? options.selector
    : '[data-ui-inspector-id]';
  const zIndex = Number.isFinite(options.zIndex) ? String(options.zIndex) : '2147483000';

  let rootElement = null;
  let overlayRoot = null;
  let targets = [];
  let selectedTargetKey = '';
  let captureHost = null;
  let captureHandler = null;

  function getTargetsByKey() {
    return new Map(targets.map((target) => [target.key, target]));
  }

  function getSelectedTarget() {
    return getTargetsByKey().get(selectedTargetKey) || null;
  }

  function isSelected(target) {
    return selectedTargetKey !== '' && target.key === selectedTargetKey;
  }

  function ensureOverlayRoot(doc) {
    if (overlayRoot?.isConnected) {
      return overlayRoot;
    }

    overlayRoot = doc.createElement('div');
    overlayRoot.setAttribute('data-ui-inspector-overlay-root', 'true');
    overlayRoot.style.position = 'fixed';
    overlayRoot.style.inset = '0';
    overlayRoot.style.pointerEvents = 'none';
    overlayRoot.style.zIndex = zIndex;
    overlayRoot.style.overflow = 'hidden';

    return overlayRoot;
  }

  function removeHitList() {
    for (const child of Array.from(overlayRoot?.children || [])) {
      if (child?.getAttribute?.('data-ui-inspector-hit-list') === 'true') {
        child.parentElement?.removeChild?.(child);
      }
    }
  }

  function renderBadge(doc) {
    const badge = doc.createElement('div');
    badge.setAttribute('data-ui-inspector-selection-badge', 'true');
    badge.style.position = 'fixed';
    badge.style.right = '12px';
    badge.style.top = '12px';
    badge.style.padding = '4px 8px';
    badge.style.borderRadius = '6px';
    badge.style.background = 'rgba(20, 25, 35, 0.95)';
    badge.style.color = '#fff';
    badge.style.font = '12px/1.4 sans-serif';

    const selected = getSelectedTarget();
    badge.textContent = `Auswahl: ${selected?.label || '-'}`;
    overlayRoot.append(badge);
  }

  function refresh() {
    if (!rootElement || !overlayRoot) {
      return false;
    }

    overlayRoot.replaceChildren();

    const doc = rootElement.ownerDocument || globalThis.document;

    for (const target of targets) {
      const rect = target.element?.getBoundingClientRect?.();
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        continue;
      }

      const frame = doc.createElement('div');
      frame.setAttribute('data-ui-inspector-overlay-frame', target.id);
      frame.setAttribute('data-ui-inspector-overlay-key', target.key);

      frame.style.position = 'fixed';
      frame.style.left = `${rect.left}px`;
      frame.style.top = `${rect.top}px`;
      frame.style.width = `${rect.width}px`;
      frame.style.height = `${rect.height}px`;
      frame.style.boxSizing = 'border-box';
      frame.style.pointerEvents = 'none';
      frame.style.border = isSelected(target)
        ? '2px solid rgba(255, 168, 42, 0.98)'
        : '1px solid rgba(43, 157, 255, 0.95)';
      frame.style.background = isSelected(target)
        ? 'rgba(255, 168, 42, 0.16)'
        : 'rgba(43, 157, 255, 0.08)';

      if (isSelected(target)) {
        frame.setAttribute('data-ui-inspector-selected', 'true');
      }

      const label = doc.createElement('div');
      label.setAttribute('data-ui-inspector-overlay-label', target.key);
      label.textContent = target.label;
      label.style.position = 'absolute';
      label.style.left = '0';
      label.style.top = '0';
      label.style.padding = '1px 4px';
      label.style.font = '11px/1.2 sans-serif';
      label.style.background = 'rgba(0, 0, 0, 0.72)';
      label.style.color = '#fff';

      frame.append(label);
      overlayRoot.append(frame);
    }

    renderBadge(doc);
    return true;
  }

  function getHitsAtPoint(x, y) {
    const hits = [];

    for (const target of targets) {
      const rect = target.element?.getBoundingClientRect?.();
      if (!rect) {
        continue;
      }

      const isHit = x >= rect.left
        && x <= rect.left + rect.width
        && y >= rect.top
        && y <= rect.top + rect.height;

      if (!isHit) {
        continue;
      }

      hits.push({
        ...target,
        rect,
        area: rect.width * rect.height,
      });
    }

    hits.sort((a, b) => a.area - b.area || b.level - a.level || a.instance - b.instance);
    return hits;
  }

  function selectTarget(target) {
    if (!target) {
      return false;
    }

    selectedTargetKey = target.key;
    removeHitList();
    optionsState.onSelectTarget?.(target);
    optionsState.onSelect?.(target.id);
    return refresh();
  }

  function select(idOrKey) {
    const targetByKey = getTargetsByKey();
    const target = targetByKey.get(idOrKey) || targets.find((entry) => entry.id === idOrKey);
    return selectTarget(target);
  }

  function clearSelection() {
    selectedTargetKey = '';
    removeHitList();
    optionsState.onClearSelection?.();
    return refresh();
  }

  function showHitListAtPoint(x, y) {
    removeHitList();
    const hits = getHitsAtPoint(x, y);
    if (!hits.length) {
      return false;
    }

    const doc = rootElement.ownerDocument || globalThis.document;
    const list = doc.createElement('div');
    list.setAttribute('data-ui-inspector-hit-list', 'true');
    list.style.position = 'fixed';
    list.style.left = `${x}px`;
    list.style.top = `${y}px`;
    list.style.maxWidth = '340px';
    list.style.maxHeight = '240px';
    list.style.overflow = 'auto';
    list.style.pointerEvents = 'auto';
    list.style.padding = '6px';
    list.style.borderRadius = '6px';
    list.style.background = 'rgba(20, 25, 35, 0.98)';
    list.style.border = '1px solid rgba(255, 255, 255, 0.18)';

    for (const hit of hits) {
      const option = doc.createElement('button');
      option.setAttribute('data-ui-inspector-hit-option', hit.key);
      option.textContent = hit.label;
      option.style.display = 'block';
      option.style.width = '100%';
      option.style.margin = '0 0 4px 0';
      option.style.textAlign = 'left';
      option.onclick = (event) => {
        event.preventDefault?.();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        selectTarget(hit);
      };
      list.append(option);
    }

    overlayRoot.append(list);
    return true;
  }

  function mount(nextRootElement, runtimeOptions = {}) {
    optionsState = { ...optionsState, ...runtimeOptions };

    if (!nextRootElement?.querySelectorAll) {
      return false;
    }

    rootElement = nextRootElement;
    const builder = optionsState.buildTargets
      || ((root, targetSelector) => Array.from(root.querySelectorAll(targetSelector)).map((element, index) => ({
        key: `${element.getAttribute('data-ui-inspector-id')}::${index + 1}`,
        id: element.getAttribute('data-ui-inspector-id'),
        label: element.getAttribute('data-ui-inspector-id'),
        level: 0,
        parentId: '',
        element,
        instance: index + 1,
      })));
    targets = builder(rootElement, selector);

    const doc = rootElement.ownerDocument || globalThis.document;
    const nextOverlayRoot = ensureOverlayRoot(doc);
    if (!nextOverlayRoot.isConnected) {
      (doc.body || rootElement).append(nextOverlayRoot);
    }

    captureHandler = (event) => {
      let node = event.target;
      while (node) {
        if (node.getAttribute?.('data-ui-inspector-panel') === 'true') {
          return;
        }
        if (node.getAttribute?.('data-ui-inspector-hit-list') === 'true') {
          return;
        }
        if (node.getAttribute?.('data-ui-inspector-hit-option')) {
          return;
        }
        node = node.parentElement;
      }

      event.preventDefault?.();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      showHitListAtPoint(Number(event.clientX), Number(event.clientY));
    };

    doc.addEventListener?.('pointerdown', captureHandler, true);
    captureHost = doc;

    return refresh();
  }

  function unmount() {
    clearSelection();

    if (captureHost && captureHandler) {
      captureHost.removeEventListener?.('pointerdown', captureHandler, true);
    }

    captureHost = null;
    captureHandler = null;

    if (overlayRoot?.parentElement) {
      overlayRoot.parentElement.removeChild(overlayRoot);
    }

    overlayRoot = null;
    rootElement = null;
    targets = [];
    return true;
  }

  return {
    mount,
    unmount,
    refresh,
    getSelectedId: () => getSelectedTarget()?.id || '',
    getSelectedTargetKey: () => selectedTargetKey,
    getSelectedTarget: getSelectedTarget,
    getTargets: () => targets.slice(),
    getOverlayRoot: () => overlayRoot,
    select,
    selectTarget,
    clearSelection,
    getHitsAtPoint,
    showHitListAtPoint,
  };
}
