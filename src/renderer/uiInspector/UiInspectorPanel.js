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

function renderPanelContent(panelRoot, { selectedId = '', controls = [], note = '' } = {}) {
  panelRoot.replaceChildren();

  const doc = panelRoot.ownerDocument || globalThis.document;
  const title = doc.createElement('div');
  title.textContent = 'UI-Inspektor';
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';

  const selectedLabel = doc.createElement('div');
  selectedLabel.textContent = selectedId ? `Ausgewählter Bereich: ${selectedId}` : 'Kein Bereich ausgewählt';
  selectedLabel.style.marginBottom = '8px';

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

  panelRoot.append(title, selectedLabel, controlsTitle, controlsList, hint);
}

export function createUiInspectorPanel(options = {}) {
  let panelRoot = null;
  let mountHost = null;

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
    renderPanelContent(node, options.initialState || {});
    return true;
  }

  function unmount() {
    if (panelRoot?.parentElement) panelRoot.parentElement.removeChild(panelRoot);
    mountHost = null;
    return true;
  }

  function render(nextState = {}) {
    if (!panelRoot) return false;
    renderPanelContent(panelRoot, nextState);
    return true;
  }

  function clear() {
    if (!panelRoot) return false;
    renderPanelContent(panelRoot, { selectedId: '', controls: [] });
    return true;
  }

  return { mount, unmount, render, clear };
}
