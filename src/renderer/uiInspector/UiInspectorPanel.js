const TEMPORARY_NOTE = 'Temporäre Vorschau – keine Speicherung.';

function createPanelRoot(doc) {
  const panel = doc.createElement('div');
  panel.setAttribute('data-ui-inspector-panel', 'true');
  panel.style.position = 'fixed';
  panel.style.right = '12px';
  panel.style.bottom = '12px';
  panel.style.width = '380px';
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

function createButton(doc, label, onClick, className = '') {
  const button = doc.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (className) button.className = className;
  button.style.margin = '0';
  button.style.padding = '4px 8px';
  button.style.border = '1px solid rgba(255,255,255,0.22)';
  button.style.borderRadius = '4px';
  button.style.background = 'rgba(255,255,255,0.08)';
  button.style.color = '#fff';
  button.style.cursor = 'pointer';
  button.onclick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onClick?.();
  };
  return button;
}

function createControlRow(doc, control, actions = {}) {
  const row = doc.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.justifyContent = 'space-between';
  row.style.gap = '8px';
  row.style.marginBottom = '6px';

  const label = doc.createElement('div');
  label.textContent = control.label;
  label.style.flex = '1 1 auto';

  const buttons = doc.createElement('div');
  buttons.style.display = 'flex';
  buttons.style.gap = '6px';
  buttons.style.flexWrap = 'wrap';
  buttons.style.justifyContent = 'flex-end';

  if (control.kind === 'delta') {
    const step = Number(control.step || 0);
    buttons.append(
      createButton(doc, `${control.label} -${step}`, () => actions.adjust?.(control.key, -step), 'ui-inspector-preview-button'),
      createButton(doc, `${control.label} +${step}`, () => actions.adjust?.(control.key, step), 'ui-inspector-preview-button')
    );
  } else if (control.kind === 'toggle') {
    buttons.append(
      createButton(doc, `${control.label} umschalten`, () => actions.toggleVisibility?.(), 'ui-inspector-preview-button')
    );
  }

  row.append(label, buttons);
  return row;
}

function createKindBadge(doc, selectedKind) {
  const badge = doc.createElement('div');
  badge.style.display = 'inline-flex';
  badge.style.alignItems = 'center';
  badge.style.padding = '2px 6px';
  badge.style.borderRadius = '999px';
  badge.style.background = 'rgba(255,255,255,0.10)';
  badge.style.border = '1px solid rgba(255,255,255,0.16)';
  badge.style.fontSize = '11px';
  badge.textContent = selectedKind ? `Bereichstyp: ${selectedKind}` : 'Bereichstyp: -';
  return badge;
}

function createContextSection(doc, state, actions) {
  const section = doc.createElement('div');
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.gap = '6px';
  section.style.marginBottom = '10px';

  const addLine = (labelText, valueText) => {
    const line = doc.createElement('div');
    line.textContent = `${labelText}: ${valueText || '—'}`;
    section.append(line);
  };

  addLine('Ausgewählt', state.selectedLabel || state.selectedId);
  addLine('Schlüssel', state.selectedId);
  addLine('Typ', state.selectedKind);
  addLine('Elternbereich', state.parentLabel);

  if (state.parentId) {
    const parentRow = doc.createElement('div');
    parentRow.style.display = 'flex';
    parentRow.style.gap = '6px';
    parentRow.style.flexWrap = 'wrap';
    parentRow.append(
      createButton(doc, 'Elternbereich auswählen', () => actions.selectTarget?.(state.parentId), 'ui-inspector-preview-button')
    );
    section.append(parentRow);
  }

  if (Array.isArray(state.children) && state.children.length > 0) {
    const childrenTitle = doc.createElement('div');
    childrenTitle.textContent = 'Enthält:';
    section.append(childrenTitle);

    const childrenWrap = doc.createElement('div');
    childrenWrap.style.display = 'flex';
    childrenWrap.style.flexWrap = 'wrap';
    childrenWrap.style.gap = '6px';
    for (const child of state.children) {
      childrenWrap.append(
        createButton(doc, child.label || child.id, () => actions.selectTarget?.(child.id), 'ui-inspector-preview-button')
      );
    }
    section.append(childrenWrap);
  }

  if (state.selectedKind === 'Feld' && Array.isArray(state.siblings) && state.siblings.length > 1) {
    const siblingRow = doc.createElement('div');
    siblingRow.style.display = 'flex';
    siblingRow.style.gap = '6px';
    siblingRow.style.flexWrap = 'wrap';
    siblingRow.append(
      createButton(doc, 'Vorheriges Feld', () => actions.selectSiblingOffset?.(-1), 'ui-inspector-preview-button'),
      createButton(doc, 'Nächstes Feld', () => actions.selectSiblingOffset?.(1), 'ui-inspector-preview-button')
    );
    section.append(siblingRow);
  }

  return section;
}

function renderPanelContent(
  panelRoot,
  {
    selectedId = '',
    selectedKind = '',
    selectedLabel = '',
    parentId = '',
    parentLabel = '',
    children = [],
    siblings = [],
    controls = [],
    note = '',
    actions = {},
  } = {}
) {
  panelRoot.replaceChildren();

  const doc = panelRoot.ownerDocument || globalThis.document;
  const title = doc.createElement('div');
  title.textContent = 'UI-Inspektor';
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';

  const selectedLabelNode = doc.createElement('div');
  selectedLabelNode.textContent = selectedId ? `Ausgewählt: ${selectedLabel || selectedId}` : 'Kein Bereich ausgewählt';
  selectedLabelNode.style.marginBottom = '6px';

  const kindBadge = createKindBadge(doc, selectedKind);
  kindBadge.style.marginBottom = '8px';

  const hint = doc.createElement('div');
  hint.textContent = note || TEMPORARY_NOTE;
  hint.style.marginBottom = '8px';

  const contextSection = createContextSection(
    doc,
    { selectedId, selectedKind, selectedLabel, parentId, parentLabel, children, siblings },
    actions
  );

  const controlsTitle = doc.createElement('div');
  controlsTitle.textContent = 'Erlaubte Stellschrauben:';
  controlsTitle.style.marginBottom = '4px';

  const controlsList = doc.createElement('div');
  controlsList.style.display = 'flex';
  controlsList.style.flexDirection = 'column';
  controlsList.style.gap = '2px';
  controlsList.style.marginBottom = '10px';

  if (Array.isArray(controls) && controls.length > 0) {
    for (const control of controls) {
      controlsList.append(createControlRow(doc, control, actions));
    }
  } else {
    const emptyState = doc.createElement('div');
    emptyState.textContent = selectedId ? 'Für diesen Bereich sind noch keine Stellschrauben definiert.' : 'Bereich auswählen, um Vorschau zu steuern.';
    controlsList.append(emptyState);
  }

  const actionRow = doc.createElement('div');
  actionRow.style.display = 'flex';
  actionRow.style.flexWrap = 'wrap';
  actionRow.style.gap = '6px';
  actionRow.style.marginBottom = '8px';
  actionRow.append(
    createButton(doc, 'Reset ausgewählt', () => actions.resetSelected?.(), 'ui-inspector-preview-button'),
    createButton(doc, 'Alles zurücksetzen', () => actions.resetAll?.(), 'ui-inspector-preview-button')
  );

  panelRoot.append(title, selectedLabelNode, kindBadge, hint, contextSection, controlsTitle, controlsList, actionRow);
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
    renderPanelContent(panelRoot, {
      selectedId: '',
      selectedKind: '',
      selectedLabel: '',
      parentId: '',
      parentLabel: '',
      children: [],
      siblings: [],
      controls: [],
      note: TEMPORARY_NOTE,
    });
    return true;
  }

  return { mount, unmount, render, clear };
}
