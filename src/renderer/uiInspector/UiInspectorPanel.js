function createPanelRoot(doc) {
  const panel = doc.createElement('div');
  panel.setAttribute('data-ui-inspector-panel', 'true');
  panel.style.position = 'fixed'; panel.style.right = '12px'; panel.style.bottom = '12px'; panel.style.width = '360px';
  panel.style.background = 'rgba(20, 25, 35, 0.96)'; panel.style.color = '#fff'; panel.style.padding = '10px'; panel.style.zIndex = '2147483001'; panel.style.pointerEvents='auto';
  return panel;
}

function renderPanelContent(panelRoot, state = {}) {
  const { selectedId = '', selectedTargetKey = '', controls = [], targets = [] } = state;
  panelRoot.replaceChildren();
  const doc = panelRoot.ownerDocument || globalThis.document;
  const title = doc.createElement('div'); title.textContent = 'UI-Inspektor';
  const selected = doc.createElement('div'); selected.textContent = selectedId ? `Ausgewählter Bereich: ${selectedId}` : 'Kein Bereich ausgewählt';
  const select = doc.createElement('select'); select.setAttribute('data-ui-inspector-target-select','true');
  for (const t of targets) {
    const opt = doc.createElement('option'); opt.value = t.key; opt.textContent = `${'  '.repeat(t.level)}${t.label}`; if (t.key === selectedTargetKey) opt.selected = true; select.append(opt);
  }
  const controlsTitle = doc.createElement('div'); controlsTitle.textContent = 'Erlaubte Stellschrauben:';
  const ul = doc.createElement('ul');
  for (const c of controls.length ? controls : ['Für diesen Bereich sind noch keine Stellschrauben definiert.']) { const li = doc.createElement('li'); li.textContent = c; ul.append(li); }
  const hint = doc.createElement('div'); hint.textContent = 'Auswahlmodell – noch keine Layoutänderung.';
  panelRoot.append(title, selected, select, controlsTitle, ul, hint);
}

export function createUiInspectorPanel(options = {}) {
  let panelRoot = null;
  function mount(target) { const doc = target?.ownerDocument || globalThis.document; panelRoot = createPanelRoot(doc); (target || doc.body).append(panelRoot); renderPanelContent(panelRoot, options.initialState || {}); return true; }
  function unmount() { if (panelRoot?.parentElement) panelRoot.parentElement.removeChild(panelRoot); return true; }
  return { mount, unmount, render(nextState = {}) { if (!panelRoot) return false; renderPanelContent(panelRoot, nextState); return true; }, clear() { if (!panelRoot) return false; renderPanelContent(panelRoot, {}); return true; } };
}
