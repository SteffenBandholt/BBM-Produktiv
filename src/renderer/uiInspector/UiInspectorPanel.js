import { formatUiInspectorScanSummary } from './UiInspectorRuntime.js';

function createPanelRoot(doc) {
  const panel = doc.createElement('div');
  panel.setAttribute('data-ui-inspector-panel', 'true');
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.gap = '8px';
  panel.style.maxWidth = '320px';
  panel.style.padding = '8px 10px';
  panel.style.borderRadius = '8px';
  panel.style.border = '1px solid rgba(200, 208, 218, 0.9)';
  panel.style.background = 'rgba(248, 250, 252, 0.98)';
  panel.style.color = '#1f2937';
  panel.style.font = '12px/1.35 sans-serif';
  panel.style.boxSizing = 'border-box';
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

  const title = doc.createElement('div');
  title.textContent = 'UI-Editor Scan';
  title.style.fontWeight = '700';

  panelRoot.append(title);

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
}

export function createUiInspectorPanel(options = {}) {
  let panelRoot = null;
  let mountHost = null;
  let currentState = { ...(options.initialState || {}) };

  function ensurePanel(doc) {
    if (panelRoot?.isConnected) return panelRoot;
    panelRoot = createPanelRoot(doc);
    return panelRoot;
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
    renderPanelContent(node, currentState);
    return true;
  }

  function unmount() {
    if (panelRoot?.parentElement) panelRoot.parentElement.removeChild(panelRoot);
    mountHost = null;
    return true;
  }

  function render(nextState = {}) {
    currentState = { ...currentState, ...nextState };
    if (!panelRoot) return false;
    renderPanelContent(panelRoot, currentState);
    return true;
  }

  function clear() {
    currentState = { ...(options.initialState || {}) };
    if (!panelRoot) return true;
    renderPanelContent(panelRoot, currentState);
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
