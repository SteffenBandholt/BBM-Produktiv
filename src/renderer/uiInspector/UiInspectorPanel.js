function createPanelRoot(doc) { const panel = doc.createElement('div'); panel.setAttribute('data-ui-inspector-panel', 'true'); Object.assign(panel.style,{position:'fixed',right:'12px',bottom:'12px',width:'340px',maxWidth:'calc(100vw - 24px)',background:'rgba(20, 25, 35, 0.96)',color:'#ffffff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'6px',padding:'10px',font:'12px/1.4 sans-serif',zIndex:'2147483001',pointerEvents:'auto',boxSizing:'border-box'}); return panel; }

function renderPanelContent(panelRoot, { selectedId = '', selectedLabel = '', controls = [], note = '', targets = [] } = {}) {
  panelRoot.replaceChildren(); const doc = panelRoot.ownerDocument || globalThis.document;
  const title = doc.createElement('div'); title.textContent = 'UI-Inspektor'; title.style.fontWeight = '700'; title.style.marginBottom = '8px';
  const selected = doc.createElement('div'); selected.textContent = selectedId ? `Ausgewählter Bereich: ${selectedId}${selectedLabel ? ` (${selectedLabel})` : ''}` : 'Kein Bereich ausgewählt'; selected.style.marginBottom = '8px';
  const select = doc.createElement('select'); select.setAttribute('data-ui-inspector-target-select', 'true'); select.style.width='100%'; select.style.marginBottom='8px';
  const empty = doc.createElement('option'); empty.value=''; empty.textContent='Bereich auswählen'; select.append(empty);
  for (const t of targets) { const o = doc.createElement('option'); o.value = t.key; o.textContent = `${'  '.repeat(Math.max(0,t.level-1))}${t.label}`; if (selectedId && t.id === selectedId && selectedLabel === t.label) o.selected = true; select.append(o); }
  select.onchange = () => panelRoot.__onSelectTargetKey?.(select.value);
  const controlsTitle = doc.createElement('div'); controlsTitle.textContent = 'Erlaubte Stellschrauben:'; controlsTitle.style.marginBottom = '4px';
  const controlsList = doc.createElement('ul'); controlsList.style.margin = '0 0 8px 16px'; controlsList.style.padding = '0';
  if (controls.length) controls.forEach((c)=>{const i=doc.createElement('li'); i.textContent=String(c); controlsList.append(i);}); else { const i=doc.createElement('li'); i.textContent = note || 'Für diesen Bereich sind noch keine Stellschrauben definiert.'; controlsList.append(i); }
  const hint = doc.createElement('div'); hint.textContent = 'Auswahlmodell – noch keine Layoutänderung.'; hint.style.opacity='0.9';
  panelRoot.append(title, selected, select, controlsTitle, controlsList, hint);
}

export function createUiInspectorPanel(options = {}) {
  let panelRoot = null;
  return {
    mount(target) { const doc = target?.ownerDocument || globalThis.document; if (!doc?.createElement) return false; const host = target || doc.body; if (!host?.append) return false; if (!panelRoot?.isConnected) { panelRoot = createPanelRoot(doc); host.append(panelRoot); } panelRoot.__onSelectTargetKey = options.onSelectTargetKey; renderPanelContent(panelRoot, options.initialState || {}); return true; },
    unmount() { if (panelRoot?.parentElement) panelRoot.parentElement.removeChild(panelRoot); return true; },
    render(nextState = {}) { if (!panelRoot) return false; if (nextState.onSelectTargetKey) panelRoot.__onSelectTargetKey = nextState.onSelectTargetKey; renderPanelContent(panelRoot, nextState); return true; },
    clear({ targets = [] } = {}) { if (!panelRoot) return false; renderPanelContent(panelRoot, { selectedId: '', controls: [], targets }); return true; },
  };
}
