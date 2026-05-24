function createPanelRoot(doc) {
  const panel = doc.createElement('div');
  panel.setAttribute('data-ui-inspector-panel', 'true');
  panel.style.position = 'fixed';
  panel.style.right = '12px';
  panel.style.bottom = '12px';
  panel.style.width = '340px';
  panel.style.maxWidth = 'calc(100vw - 24px)';
  panel.style.background = 'rgba(20, 25, 35, 0.96)';
  panel.style.color = '#ffffff';
  panel.style.border = '1px solid rgba(255,255,255,0.2)';
  panel.style.borderRadius = '6px';
  panel.style.padding = '10px';
  panel.style.font = '12px/1.4 sans-serif';
  panel.style.zIndex = '2147483001';
  panel.style.pointerEvents = 'auto';
  panel.style.boxSizing = 'border-box';
  return panel;
}

function renderPanelContent(panelRoot, { selectedId = '', controls = [], targets = [], note = '' } = {}) {
  panelRoot.replaceChildren();

  const doc = panelRoot.ownerDocument || globalThis.document;
  const title = doc.createElement('div');
  title.textContent = 'UI-Inspektor';
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';

  const selectedLabel = doc.createElement('div');
  selectedLabel.textContent = selectedId ? `Ausgewählter Bereich: ${selectedId}` : 'Kein Bereich ausgewählt';
  selectedLabel.style.marginBottom = '8px';


  const targetLabel = doc.createElement('div');
  targetLabel.textContent = 'Bereich auswählen:';
  targetLabel.style.marginBottom = '4px';

  const targetSelect = doc.createElement('select');
  targetSelect.setAttribute('data-ui-inspector-target-select', 'true');
  targetSelect.style.width = '100%';
  targetSelect.style.marginBottom = '8px';

  const empty = doc.createElement('option');
  empty.value = '';
  empty.textContent = '— Bereich wählen —';
  targetSelect.append(empty);

  for (const target of Array.isArray(targets) ? targets : []) {
    const option = doc.createElement('option');
    option.value = String(target?.key || '');
    const level = Number(target?.level || 0);
    const indent = '  '.repeat(Math.max(0, level));
    option.textContent = `${indent}${String(target?.label || target?.id || '')}`;
    if (selectedId && String(target?.id || '') === String(selectedId)) option.selected = true;
    targetSelect.append(option);
  }

  if (typeof panelRoot.__onSelectTarget === 'function') {
    targetSelect.onchange = () => panelRoot.__onSelectTarget(targetSelect.value);
  }

  const controlsTitle = doc.createElement('div');
  controlsTitle.textContent = 'Erlaubte Stellschrauben:';
  controlsTitle.style.marginBottom = '4px';

  const controlsList = doc.createElement('ul');
  controlsList.style.margin = '0 0 8px 16px';
  controlsList.style.padding = '0';

  if (Array.isArray(controls) && controls.length > 0) {
    for (const control of controls) {
      const item = doc.createElement('li');
      item.textContent = String(control);
      controlsList.append(item);
    }
  } else {
    const item = doc.createElement('li');
    item.textContent = note || 'Für diesen Bereich sind noch keine Stellschrauben definiert.';
    controlsList.append(item);
  }

  const hint = doc.createElement('div');
  hint.textContent = 'Nur Anzeige – Änderungen folgen erst in M13.';
  hint.style.opacity = '0.9';

  panelRoot.append(title, selectedLabel, targetLabel, targetSelect, controlsTitle, controlsList, hint);
}

export function createUiInspectorPanel(options = {}) {
  let panelRoot = null;
  let mountHost = null;
  let latestState = options.initialState || {};
  const onSelectTarget = typeof options.onSelectTarget === 'function' ? options.onSelectTarget : null;

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
    if (!node.isConnected) mountHost.append(node);
    node.__onSelectTarget = onSelectTarget;
    renderPanelContent(node, latestState);
    return true;
  }

  function unmount() {
    if (panelRoot?.parentElement) panelRoot.parentElement.removeChild(panelRoot);
    mountHost = null;
    return true;
  }

  function render(nextState = {}) {
    if (!panelRoot) return false;
    latestState = { ...latestState, ...nextState };
    renderPanelContent(panelRoot, latestState);
    return true;
  }

  function clear(nextState = {}) {
    if (!panelRoot) return false;
    latestState = { ...latestState, ...nextState, selectedId: '', controls: [] };
    renderPanelContent(panelRoot, latestState);
    return true;
  }

  return { mount, unmount, render, clear };
}
