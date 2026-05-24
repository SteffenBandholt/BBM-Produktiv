export function createUiInspectorOverlay(options = {}) {
  const defaultSelector = '[data-ui-inspector-id]';
  const selector = typeof options.selector === 'string' && options.selector.trim() ? options.selector : defaultSelector;
  const zIndex = Number.isFinite(options.zIndex) ? String(options.zIndex) : '2147483000';

  let rootElement = null;
  let overlayRoot = null;
  let selectedId = '';
  let selectedTargetKey = '';
  let captureHost = null;
  let captureHandler = null;
  let domSequence = 0;
  let targets = [];

  function clearOverlayChildren() { if (overlayRoot) overlayRoot.replaceChildren(); }
  function ensureOverlayRoot(doc) {
    if (overlayRoot?.isConnected) return overlayRoot;
    overlayRoot = doc.createElement('div');
    overlayRoot.setAttribute('data-ui-inspector-overlay-root', 'true');
    Object.assign(overlayRoot.style, { position:'fixed', inset:'0', pointerEvents:'none', zIndex, overflow:'hidden' });
    return overlayRoot;
  }

  function createBadge(doc) {
    const badge = doc.createElement('div');
    badge.setAttribute('data-ui-inspector-selection-badge', 'true');
    Object.assign(badge.style, { position:'fixed', right:'12px', top:'12px', background:'rgba(30, 35, 45, 0.92)', color:'#ffffff', font:'12px/1.3 monospace', padding:'6px 8px', borderRadius:'4px', pointerEvents:'none' });
    badge.textContent = `Auswahl: ${selectedId || '-'}`;
    return badge;
  }

  function createFrame(doc, target, rect) {
    const frame = doc.createElement('div');
    frame.setAttribute('data-ui-inspector-overlay-frame', target.id);
    Object.assign(frame.style, { position:'fixed', left:`${rect.left}px`, top:`${rect.top}px`, width:`${rect.width}px`, height:`${rect.height}px`, boxSizing:'border-box', border: selectedTargetKey===target.key?'2px solid rgba(255, 168, 42, 0.98)':'1px solid rgba(43, 157, 255, 0.95)', background:selectedTargetKey===target.key?'rgba(255, 168, 42, 0.16)':'rgba(43, 157, 255, 0.08)', pointerEvents:'none' });
    if (selectedTargetKey === target.key) frame.setAttribute('data-ui-inspector-selected', 'true');
    const label = doc.createElement('div');
    label.setAttribute('data-ui-inspector-overlay-label', target.key || target.id);
    label.textContent = target.id;
    Object.assign(label.style, { position:'absolute', left:'0', top:'-16px', maxWidth:'320px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', background:selectedTargetKey===target.key?'rgba(255, 168, 42, 0.98)':'rgba(43, 157, 255, 0.95)', color:'#ffffff', font:'11px/1.2 monospace', padding:'2px 4px', pointerEvents:'none' });
    frame.append(label);
    return frame;
  }

  function rebuildTargets() {
    if (!rootElement) { targets=[]; return; }
    const nodes = rootElement.querySelectorAll(selector);
    const counts = new Map();
    const next = [];
    for (const node of nodes) {
      const id = String(node?.getAttribute?.('data-ui-inspector-id') || '').trim();
      if (!id) continue;
      const instance = (counts.get(id) || 0) + 1; counts.set(id, instance);
      next.push({ id, key: `${id}::${instance}`, element: node, instance });
    }
    targets = next;
  }

  function getHitsAtPoint(x,y){
    if(!rootElement) return [];
    const hits=[]; domSequence=0;
    for(const target of targets){
      const node=target.element; domSequence+=1;
      if(!node||typeof node.getBoundingClientRect!=='function') continue;
      const rect=node.getBoundingClientRect();
      if(!rect||rect.width<=0||rect.height<=0) continue;
      if(x<rect.left||x>rect.left+rect.width||y<rect.top||y>rect.top+rect.height) continue;
      hits.push({ ...target, rect, area:rect.width*rect.height, depth:target.id.split('.').length, index:domSequence });
    }
    hits.sort((a,b)=>a.area-b.area||b.depth-a.depth||a.instance-b.instance||a.index-b.index);
    return hits;
  }
  function removeHitList(){ if(!overlayRoot)return; for(const child of Array.from(overlayRoot.children||[])){ if(child?.getAttribute?.('data-ui-inspector-hit-list')==='true') child.parentElement?.removeChild?.(child);} }
  function select(targetKey){
    const match = targets.find((t)=>t.key===String(targetKey||'').trim());
    if(!match) return false;
    selectedTargetKey = match.key; selectedId = match.id; removeHitList(); options.onSelect?.(selectedId, match); return refresh();
  }
  function clearSelection(){ selectedId=''; selectedTargetKey=''; removeHitList(); options.onClearSelection?.(); return refresh(); }

  function showHitListAtPoint(x,y){
    if(!overlayRoot||!rootElement) return false; removeHitList(); const hits=getHitsAtPoint(x,y); if(!hits.length){ clearSelection(); return false; }
    const doc=rootElement.ownerDocument||globalThis.document; const list=doc.createElement('div'); list.setAttribute('data-ui-inspector-hit-list','true');
    Object.assign(list.style,{ position:'fixed', left:`${x}px`, top:`${y}px`, maxWidth:'380px', background:'rgba(24, 29, 38, 0.97)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'6px', padding:'6px', display:'flex', flexDirection:'column', gap:'4px', pointerEvents:'auto' });
    for(const hit of hits){ const option=doc.createElement('button'); option.type='button'; option.setAttribute('data-ui-inspector-hit-option', hit.key); option.textContent=hit.id; option.style.pointerEvents='auto'; option.style.textAlign='left'; option.onclick=(event)=>{ event?.preventDefault?.(); event?.stopPropagation?.(); event?.stopImmediatePropagation?.(); select(hit.key); }; list.append(option);} overlayRoot.append(list); return true;
  }

  function refresh(){
    if(!rootElement||!overlayRoot) return false;
    rebuildTargets(); clearOverlayChildren();
    for(const target of targets){ const rect=target.element?.getBoundingClientRect?.(); if(!rect||rect.width<=0||rect.height<=0) continue; overlayRoot.append(createFrame(rootElement.ownerDocument||globalThis.document,target,rect)); }
    overlayRoot.append(createBadge(rootElement.ownerDocument||globalThis.document));
    return true;
  }

  function isInsideInspectorUi(target){ let node=target; while(node){ if(node.getAttribute?.('data-ui-inspector-hit-list')==='true'||node.getAttribute?.('data-ui-inspector-hit-option')||node.getAttribute?.('data-ui-inspector-panel')==='true') return true; node=node.parentElement; } return false; }
  function bindCaptureListener(doc){ if(!doc||captureHandler||typeof doc.addEventListener!=='function') return; captureHandler=(event)=>{ if(isInsideInspectorUi(event?.target)) return; const x=Number(event?.clientX); const y=Number(event?.clientY); if(!Number.isFinite(x)||!Number.isFinite(y)) return; event.preventDefault?.(); event.stopPropagation?.(); event.stopImmediatePropagation?.(); showHitListAtPoint(x,y);}; doc.addEventListener('pointerdown',captureHandler,true); captureHost=doc; }
  function unbindCaptureListener(){ if(captureHost&&captureHandler&&typeof captureHost.removeEventListener==='function') captureHost.removeEventListener('pointerdown',captureHandler,true); captureHost=null; captureHandler=null; }

  function mount(nextRootElement, runtimeOptions={}){ if(runtimeOptions&&typeof runtimeOptions==='object'){ options.onSelect=runtimeOptions.onSelect||options.onSelect; options.onClearSelection=runtimeOptions.onClearSelection||options.onClearSelection; }
    if(!nextRootElement||typeof nextRootElement.querySelectorAll!=='function') return false; rootElement=nextRootElement; const doc=rootElement.ownerDocument||globalThis.document; const nextOverlayRoot=ensureOverlayRoot(doc); const mountHost=doc.body||rootElement; if(!nextOverlayRoot.isConnected) mountHost.append(nextOverlayRoot); bindCaptureListener(doc); refresh(); return true; }
  function unmount(){ clearSelection(); unbindCaptureListener(); clearOverlayChildren(); if(overlayRoot?.parentElement) overlayRoot.parentElement.removeChild(overlayRoot); rootElement=null; targets=[]; return true; }

  return { mount, unmount, refresh, getSelectedId:()=>selectedId, getSelectedTargetKey:()=>selectedTargetKey, getTargets:()=>[...targets], getOverlayRoot:()=>overlayRoot, select, clearSelection, getHitsAtPoint, showHitListAtPoint };
}
