import { formatUiInspectorScanSummary } from './UiInspectorRuntime.js';

function createPanelRoot(doc, options = {}) {
  const panel = doc.createElement('div');
  panel.setAttribute('data-ui-inspector-panel', 'true');
  panel.style.position = 'fixed';
  panel.style.left = `${Number.isFinite(options.initialLeft) ? Number(options.initialLeft) : 16}px`;
  panel.style.top = `${Number.isFinite(options.initialTop) ? Number(options.initialTop) : 72}px`;
  panel.style.zIndex = String(Number.isFinite(options.zIndex) ? Number(options.zIndex) : 2147483600);
  panel.style.pointerEvents = 'auto';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.gap = '8px';
  panel.style.width = '320px';
  panel.style.minWidth = '280px';
  panel.style.maxWidth = '360px';
  panel.style.padding = '8px 10px';
  panel.style.borderRadius = '8px';
  panel.style.border = '1px solid rgba(200, 208, 218, 0.9)';
  panel.style.background = 'rgba(248, 250, 252, 0.98)';
  panel.style.color = '#1f2937';
  panel.style.font = '12px/1.35 sans-serif';
  panel.style.boxSizing = 'border-box';
  panel.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.16)';
  return panel;
}

function createButton(doc, label, onClick, active = false, mode = '') {
  const button = doc.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (mode) button.setAttribute('data-ui-editor-mode', mode);
  if (active) button.setAttribute('data-ui-editor-mode-active', 'true');
  button.style.margin = '0';
  button.style.padding = '4px 8px';
  button.style.border = active ? '1px solid #16a34a' : '1px solid rgba(148, 163, 184, 0.9)';
  button.style.borderRadius = '4px';
  button.style.background = active ? 'rgba(22, 163, 74, 0.14)' : 'rgba(255,255,255,0.82)';
  button.style.color = '#111827';
  button.style.cursor = 'pointer';
  const handleClick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onClick?.();
  };
  if (typeof button.addEventListener === 'function') {
    button.addEventListener('click', handleClick);
  }
  button.onclick = handleClick;
  return button;
}

function renderSummaryLines(doc, panelRoot, scanSummary) {
  const summary = formatUiInspectorScanSummary(scanSummary);
  const lines = String(summary.text || '').split('\n').filter(Boolean);
  const wrap = doc.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.gap = '2px';

  for (const line of lines) {
    const node = doc.createElement('div');
    node.textContent = line;
    wrap.append(node);
  }

  panelRoot.append(wrap);
}

function renderModeRow(doc, panelRoot, selectionMode, actions = {}) {
  const label = doc.createElement('div');
  label.textContent = 'Auswahlmodus:';

  const row = doc.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '6px';
  row.style.flexWrap = 'wrap';

  row.append(
    createButton(doc, 'Rahmen', () => actions.setSelectionMode?.('frame'), selectionMode === 'frame', 'frame'),
    createButton(doc, 'Feld', () => actions.setSelectionMode?.('field'), selectionMode === 'field', 'field'),
    createButton(
      doc,
      'Einzelelement',
      () => actions.setSelectionMode?.('single'),
      selectionMode === 'single',
      'single'
    )
  );

  panelRoot.setAttribute('data-ui-editor-mode', selectionMode || 'frame');
  panelRoot.dataset.uiEditorMode = selectionMode || 'frame';
  panelRoot.append(label, row);
}

function renderPanelContent(panelRoot, state = {}) {
  panelRoot.replaceChildren();
  const doc = panelRoot.ownerDocument || globalThis.document;
  const {
    scanSummary = null,
    selectionMode = 'frame',
    selectionModeLabel = 'Rahmen',
    note = '',
    actions = {},
  } = state;

  const dragHandle = doc.createElement('div');
  dragHandle.setAttribute('data-ui-inspector-panel-drag-handle', 'true');
  dragHandle.textContent = 'UI-Editor';
  dragHandle.style.display = 'flex';
  dragHandle.style.alignItems = 'center';
  dragHandle.style.justifyContent = 'space-between';
  dragHandle.style.padding = '4px 6px';
  dragHandle.style.margin = '0';
  dragHandle.style.borderRadius = '6px';
  dragHandle.style.background = 'rgba(225, 232, 240, 0.9)';
  dragHandle.style.border = '1px solid rgba(148, 163, 184, 0.45)';
  dragHandle.style.color = '#0f172a';
  dragHandle.style.fontWeight = '700';
  dragHandle.style.cursor = 'move';
  dragHandle.style.userSelect = 'none';
  dragHandle.style.touchAction = 'none';

  const dragHint = doc.createElement('span');
  dragHint.textContent = 'ziehen';
  dragHint.style.fontWeight = '500';
  dragHint.style.opacity = '0.72';
  dragHandle.append(dragHint);

  const title = doc.createElement('div');
  title.textContent = 'UI-Editor Scan';
  title.style.fontWeight = '700';

  panelRoot.append(dragHandle, title);

  if (scanSummary) {
    renderSummaryLines(doc, panelRoot, scanSummary);
  }

  if (note) {
    const noteNode = doc.createElement('div');
    noteNode.textContent = note;
    panelRoot.append(noteNode);
  }

  const modeTitle = doc.createElement('div');
  modeTitle.textContent = `Auswahlmodus: ${selectionModeLabel || 'Rahmen'}`;
  panelRoot.append(modeTitle);
  renderModeRow(doc, panelRoot, selectionMode, actions);
  return dragHandle;
}

export function createUiInspectorPanel(options = {}) {
  let panelRoot = null;
  let mountHost = null;
  let currentState = { ...(options.initialState || {}) };
  let dragDocument = null;
  let dragState = null;

  function ensurePanel(doc) {
    if (panelRoot?.isConnected) return panelRoot;
    panelRoot = createPanelRoot(doc, options);
    return panelRoot;
  }

  function removeDragListeners() {
    if (!dragDocument || !dragState) return;
    if (typeof dragDocument.removeEventListener === 'function') {
      dragDocument.removeEventListener('pointermove', dragState.onMove, true);
      dragDocument.removeEventListener('pointerup', dragState.onUp, true);
      dragDocument.removeEventListener('pointercancel', dragState.onUp, true);
    }
    dragDocument = null;
    dragState = null;
  }

  function installDragListeners(doc, handle) {
    removeDragListeners();
    if (!doc || typeof doc.addEventListener !== 'function' || !handle) return;

    const position = {
      left: Number.parseFloat(panelRoot?.style?.left || '16') || 16,
      top: Number.parseFloat(panelRoot?.style?.top || '72') || 72,
    };

    const onMove = (event) => {
      if (!dragState) return;
      const x = Number(event?.clientX);
      const y = Number(event?.clientY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      position.left = Math.max(0, x - dragState.offsetX);
      position.top = Math.max(0, y - dragState.offsetY);
      panelRoot.style.left = `${Math.round(position.left)}px`;
      panelRoot.style.top = `${Math.round(position.top)}px`;
      event?.preventDefault?.();
    };

    const onUp = (event) => {
      if (!dragState) return;
      event?.preventDefault?.();
      removeDragListeners();
    };

    const onDown = (event) => {
      if ((event?.button ?? 0) !== 0) return;
      const x = Number(event?.clientX);
      const y = Number(event?.clientY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      dragState = {
        offsetX: x - position.left,
        offsetY: y - position.top,
        onMove,
        onUp,
      };
      dragDocument = doc;
      doc.addEventListener('pointermove', onMove, true);
      doc.addEventListener('pointerup', onUp, true);
      doc.addEventListener('pointercancel', onUp, true);
      event?.preventDefault?.();
      event?.stopPropagation?.();
    };

    if (typeof handle.addEventListener === 'function') {
      handle.addEventListener('pointerdown', onDown);
    }
  }

  function mount(target) {
    const doc = target?.ownerDocument || globalThis.document;
    if (!doc || typeof doc.createElement !== 'function') return false;

    const host = target || doc.body;
    if (!host || typeof host.append !== 'function') return false;

    mountHost = host;
    const node = ensurePanel(doc);
    const currentParent = node?.parentElement || node?.parentNode || null;
    const isAlreadyMounted = currentParent === mountHost;
    if (!isAlreadyMounted) {
      if (currentParent && typeof currentParent.removeChild === 'function') {
        currentParent.removeChild(node);
      }
      mountHost.append(node);
    }
    const dragHandle = renderPanelContent(node, currentState);
    installDragListeners(doc, dragHandle);
    return true;
  }

  function unmount() {
    removeDragListeners();
    if (panelRoot?.parentElement) panelRoot.parentElement.removeChild(panelRoot);
    mountHost = null;
    return true;
  }

  function render(nextState = {}) {
    currentState = { ...currentState, ...nextState };
    if (!panelRoot) return false;
    const doc = panelRoot.ownerDocument || globalThis.document;
    const dragHandle = renderPanelContent(panelRoot, currentState);
    installDragListeners(doc, dragHandle);
    return true;
  }

  function clear() {
    currentState = { ...(options.initialState || {}) };
    if (!panelRoot) return true;
    const doc = panelRoot.ownerDocument || globalThis.document;
    const dragHandle = renderPanelContent(panelRoot, currentState);
    installDragListeners(doc, dragHandle);
    return true;
  }

  return {
    mount,
    unmount,
    render,
    clear,
    getPanelRoot: () => panelRoot,
    getMountHost: () => mountHost,
  };
}
