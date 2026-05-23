function createPanelRoot(doc) {
  const panel = doc.createElement('div');
  panel.setAttribute('data-ui-inspector-panel', 'true');

  panel.style.position = 'fixed';
  panel.style.right = '12px';
  panel.style.bottom = '12px';
  panel.style.width = '360px';
  panel.style.background = 'rgba(20, 25, 35, 0.96)';
  panel.style.color = '#fff';
  panel.style.padding = '10px';
  panel.style.zIndex = '2147483001';
  panel.style.pointerEvents = 'auto';

  return panel;
}

function createTargetSelect(doc, targets, selectedTargetKey, onSelectTargetKey) {
  const select = doc.createElement('select');
  select.setAttribute('data-ui-inspector-target-select', 'true');

  for (const target of targets) {
    const option = doc.createElement('option');
    option.value = target.key;
    option.textContent = `${'  '.repeat(target.level)}${target.label}`;

    if (target.key === selectedTargetKey) {
      option.selected = true;
    }

    select.append(option);
  }

  select.onchange = () => {
    onSelectTargetKey?.(select.value);
  };

  return select;
}

function renderPanelContent(panelRoot, state = {}) {
  const {
    selectedId = '',
    selectedTargetKey = '',
    controls = [],
    targets = [],
    onSelectTargetKey,
  } = state;

  panelRoot.replaceChildren();

  const doc = panelRoot.ownerDocument || globalThis.document;

  const title = doc.createElement('div');
  title.textContent = 'UI-Inspektor';

  const selected = doc.createElement('div');
  selected.textContent = selectedId
    ? `Ausgewählter Bereich: ${selectedId}`
    : 'Kein Bereich ausgewählt';

  const select = createTargetSelect(doc, targets, selectedTargetKey, onSelectTargetKey);

  const controlsTitle = doc.createElement('div');
  controlsTitle.textContent = 'Erlaubte Stellschrauben:';

  const controlsList = doc.createElement('ul');
  const controlEntries = controls.length
    ? controls
    : ['Für diesen Bereich sind noch keine Stellschrauben definiert.'];

  for (const control of controlEntries) {
    const item = doc.createElement('li');
    item.textContent = control;
    controlsList.append(item);
  }

  const hint = doc.createElement('div');
  hint.textContent = 'Auswahlmodell – noch keine Layoutänderung.';

  panelRoot.append(title, selected, select, controlsTitle, controlsList, hint);
}

export function createUiInspectorPanel(options = {}) {
  let panelRoot = null;

  function mount(target) {
    const doc = target?.ownerDocument || globalThis.document;
    panelRoot = createPanelRoot(doc);
    (target || doc.body).append(panelRoot);
    renderPanelContent(panelRoot, options.initialState || {});
    return true;
  }

  function render(nextState = {}) {
    if (!panelRoot) {
      return false;
    }

    renderPanelContent(panelRoot, nextState);
    return true;
  }

  function clear() {
    if (!panelRoot) {
      return false;
    }

    renderPanelContent(panelRoot, {});
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
