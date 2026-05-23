function createPanelRoot(documentRef) {
  const panel = documentRef.createElement('div');
  panel.setAttribute('data-ui-inspector-panel', 'true');

  Object.assign(panel.style, {
    position: 'fixed',
    right: '12px',
    bottom: '12px',
    width: '340px',
    maxWidth: 'calc(100vw - 24px)',
    background: 'rgba(20, 25, 35, 0.96)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    padding: '10px',
    font: '12px/1.4 sans-serif',
    zIndex: '2147483001',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
  });

  return panel;
}

function createTargetOption(documentRef, target, selectedId, selectedLabel) {
  const option = documentRef.createElement('option');
  option.value = target.key;
  option.textContent = `${'  '.repeat(Math.max(0, target.level - 1))}${target.label}`;

  if (selectedId && target.id === selectedId && selectedLabel === target.label) {
    option.selected = true;
  }

  return option;
}

function appendControls(documentRef, controlsList, controls, note) {
  if (controls.length > 0) {
    controls.forEach((control) => {
      const item = documentRef.createElement('li');
      item.textContent = String(control);
      controlsList.append(item);
    });
    return;
  }

  const fallbackItem = documentRef.createElement('li');
  fallbackItem.textContent = note || 'Für diesen Bereich sind noch keine Stellschrauben definiert.';
  controlsList.append(fallbackItem);
}

function renderPanelContent(
  panelRoot,
  {
    selectedId = '',
    selectedLabel = '',
    controls = [],
    note = '',
    targets = [],
  } = {}
) {
  panelRoot.replaceChildren();
  const documentRef = panelRoot.ownerDocument || globalThis.document;

  const title = documentRef.createElement('div');
  title.textContent = 'UI-Inspektor';
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';

  const selected = documentRef.createElement('div');
  selected.textContent = selectedId
    ? `Ausgewählter Bereich: ${selectedId}${selectedLabel ? ` (${selectedLabel})` : ''}`
    : 'Kein Bereich ausgewählt';
  selected.style.marginBottom = '8px';

  const select = documentRef.createElement('select');
  select.setAttribute('data-ui-inspector-target-select', 'true');
  select.style.width = '100%';
  select.style.marginBottom = '8px';

  const emptyOption = documentRef.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Bereich auswählen';
  select.append(emptyOption);

  targets.forEach((target) => {
    select.append(createTargetOption(documentRef, target, selectedId, selectedLabel));
  });

  select.onchange = () => {
    panelRoot.__onSelectTargetKey?.(select.value);
  };

  const controlsTitle = documentRef.createElement('div');
  controlsTitle.textContent = 'Erlaubte Stellschrauben:';
  controlsTitle.style.marginBottom = '4px';

  const controlsList = documentRef.createElement('ul');
  controlsList.style.margin = '0 0 8px 16px';
  controlsList.style.padding = '0';
  appendControls(documentRef, controlsList, controls, note);

  const hint = documentRef.createElement('div');
  hint.textContent = 'Auswahlmodell – noch keine Layoutänderung.';
  hint.style.opacity = '0.9';

  panelRoot.append(title, selected, select, controlsTitle, controlsList, hint);
}

export function createUiInspectorPanel(options = {}) {
  let panelRoot = null;

  function mount(target) {
    const documentRef = target?.ownerDocument || globalThis.document;
    if (!documentRef?.createElement) return false;

    const host = target || documentRef.body;
    if (!host?.append) return false;

    if (!panelRoot?.isConnected) {
      panelRoot = createPanelRoot(documentRef);
      host.append(panelRoot);
    }

    panelRoot.__onSelectTargetKey = options.onSelectTargetKey;
    renderPanelContent(panelRoot, options.initialState || {});
    return true;
  }

  function render(nextState = {}) {
    if (!panelRoot) return false;

    if (nextState.onSelectTargetKey) {
      panelRoot.__onSelectTargetKey = nextState.onSelectTargetKey;
    }

    renderPanelContent(panelRoot, nextState);
    return true;
  }

  function clear({ targets = [] } = {}) {
    if (!panelRoot) return false;

    renderPanelContent(panelRoot, {
      selectedId: '',
      controls: [],
      targets,
    });
    return true;
  }

  function unmount() {
    if (panelRoot?.parentElement) {
      panelRoot.parentElement.removeChild(panelRoot);
    }
    return true;
  }

  return {
    mount,
    render,
    clear,
    unmount,
  };
}
