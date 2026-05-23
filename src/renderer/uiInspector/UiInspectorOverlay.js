export function createUiInspectorOverlay(options = {}) {
  let optionsState = { ...options };
  const selector = typeof options.selector === 'string' && options.selector.trim() ? options.selector : '[data-ui-inspector-id]';
  const zIndex = Number.isFinite(options.zIndex) ? String(options.zIndex) : '2147483000';
  let rootElement = null;
  let overlayRoot = null;
  let targets = [];
  let selectedTargetKey = '';
  let captureHost = null;
  let captureHandler = null;

  const byKey = () => new Map(targets.map((t) => [t.key, t]));
  const byId = () => new Map(targets.map((t) => [t.id, (targets.filter((x) => x.id === t.id))]));

  function ensure(doc) {
    if (overlayRoot?.isConnected) return overlayRoot;
    overlayRoot = doc.createElement('div');
    overlayRoot.setAttribute('data-ui-inspector-overlay-root', 'true');
    overlayRoot.style.position = 'fixed'; overlayRoot.style.inset = '0'; overlayRoot.style.pointerEvents = 'none'; overlayRoot.style.zIndex = zIndex;
    return overlayRoot;
  }
  const isSelected = (t) => selectedTargetKey && t.key === selectedTargetKey;
  const selectedTarget = () => byKey().get(selectedTargetKey) || null;

  function refresh() {
    if (!rootElement || !overlayRoot) return false;
    overlayRoot.replaceChildren();
    const doc = rootElement.ownerDocument || globalThis.document;
    for (const target of targets) {
      const rect = target.element?.getBoundingClientRect?.();
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;
      const frame = doc.createElement('div');
      frame.setAttribute('data-ui-inspector-overlay-frame', target.id);
      frame.setAttribute('data-ui-inspector-overlay-key', target.key);
      frame.style.position = 'fixed'; frame.style.left = `${rect.left}px`; frame.style.top = `${rect.top}px`; frame.style.width = `${rect.width}px`; frame.style.height = `${rect.height}px`;
      frame.style.border = isSelected(target) ? '2px solid rgba(255, 168, 42, 0.98)' : '1px solid rgba(43, 157, 255, 0.95)';
      frame.style.background = isSelected(target) ? 'rgba(255, 168, 42, 0.16)' : 'rgba(43, 157, 255, 0.08)';
      if (isSelected(target)) frame.setAttribute('data-ui-inspector-selected', 'true');
      const label = doc.createElement('div'); label.textContent = target.label; label.setAttribute('data-ui-inspector-overlay-label', target.key);
      frame.append(label); overlayRoot.append(frame);
    }
    const badge = doc.createElement('div'); badge.setAttribute('data-ui-inspector-selection-badge', 'true'); badge.style.position='fixed'; badge.style.right='12px'; badge.style.top='12px';
    badge.textContent = `Auswahl: ${selectedTarget()?.label || '-'}`; overlayRoot.append(badge);
    return true;
  }

  function getHitsAtPoint(x, y) {
    const hits = [];
    for (const t of targets) {
      const rect = t.element?.getBoundingClientRect?.();
      if (!rect || x < rect.left || x > rect.left + rect.width || y < rect.top || y > rect.top + rect.height) continue;
      hits.push({ ...t, rect, area: rect.width * rect.height });
    }
    hits.sort((a, b) => a.area - b.area || b.level - a.level || a.instance - b.instance);
    return hits;
  }

  function removeHitList() { for (const child of Array.from(overlayRoot?.children || [])) if (child?.getAttribute?.('data-ui-inspector-hit-list') === 'true') child.parentElement?.removeChild?.(child); }
  function selectTarget(target) { if (!target) return false; selectedTargetKey = target.key; removeHitList(); optionsState.onSelectTarget?.(target); optionsState.onSelect?.(target.id); return refresh(); }
  function select(idOrKey) { const m = byKey(); const t = m.get(idOrKey) || targets.find((e) => e.id === idOrKey); return selectTarget(t); }
  function clearSelection() { selectedTargetKey = ''; removeHitList(); optionsState.onClearSelection?.(); return refresh(); }

  function showHitListAtPoint(x, y) {
    removeHitList(); const hits = getHitsAtPoint(x, y); if (!hits.length) return false;
    const doc = rootElement.ownerDocument || globalThis.document; const list = doc.createElement('div'); list.setAttribute('data-ui-inspector-hit-list', 'true'); list.style.pointerEvents = 'auto';
    for (const hit of hits) { const b = doc.createElement('button'); b.setAttribute('data-ui-inspector-hit-option', hit.key); b.textContent = hit.label; b.onclick = (e) => { e.preventDefault?.(); e.stopPropagation?.(); e.stopImmediatePropagation?.(); selectTarget(hit); }; list.append(b); }
    overlayRoot.append(list); return true;
  }

  function mount(nextRootElement, runtimeOptions = {}) {
    optionsState = { ...optionsState, ...runtimeOptions };
    if (!nextRootElement?.querySelectorAll) return false;
    rootElement = nextRootElement; const builder = optionsState.buildTargets || ((root, sel)=>Array.from(root.querySelectorAll(sel)).map((el,i)=>({key:`${el.getAttribute('data-ui-inspector-id')}::${i+1}`,id:el.getAttribute('data-ui-inspector-id'),label:el.getAttribute('data-ui-inspector-id'),level:0,parentId:'',element:el,instance:i+1}))); targets = builder(rootElement, selector);
    const doc = rootElement.ownerDocument || globalThis.document; const or = ensure(doc); if (!or.isConnected) (doc.body || rootElement).append(or);
    captureHandler = (event) => {
      let n = event.target; while (n) { if (n.getAttribute?.('data-ui-inspector-panel') === 'true' || n.getAttribute?.('data-ui-inspector-hit-list') === 'true' || n.getAttribute?.('data-ui-inspector-hit-option')) return; n = n.parentElement; }
      event.preventDefault?.(); event.stopPropagation?.(); event.stopImmediatePropagation?.(); showHitListAtPoint(Number(event.clientX), Number(event.clientY));
    };
    doc.addEventListener?.('pointerdown', captureHandler, true);
    captureHost = doc;
    return refresh();
  }

  function unmount() { clearSelection(); if (captureHost && captureHandler) captureHost.removeEventListener?.('pointerdown', captureHandler, true); captureHost=null; captureHandler=null; if (overlayRoot?.parentElement) overlayRoot.parentElement.removeChild(overlayRoot); overlayRoot = null; rootElement = null; targets = []; return true; }

  return { mount, unmount, refresh, getSelectedId: () => selectedTarget()?.id || '', getSelectedTargetKey: () => selectedTargetKey, getSelectedTarget: selectedTarget, getTargets: () => targets.slice(), getOverlayRoot: () => overlayRoot, select, selectTarget, clearSelection, getHitsAtPoint, showHitListAtPoint };
}
