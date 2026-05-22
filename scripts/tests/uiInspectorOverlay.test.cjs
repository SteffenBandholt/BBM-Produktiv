const assert = require('node:assert/strict');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function createFakeDom() {
  const listeners = new Map();
  function createElement(tagName) {
    const node = {
      tagName: String(tagName || '').toUpperCase(),
      children: [], style: {}, attributes: {}, isConnected: false, parentElement: null, textContent: '', onclick: null,
      append(...items) { for (const child of items) { child.parentElement = this; child.isConnected = this.isConnected; this.children.push(child); } },
      replaceChildren(...items) { this.children = []; this.append(...items); },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name]; },
      removeChild(child) { this.children = this.children.filter((e) => e !== child); child.parentElement = null; child.isConnected = false; },
      click() { this.onclick?.({ preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} }); },
    };
    return node;
  }
  const document = {
    body: createElement('body'),
    createElement,
    addEventListener(type, handler) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(handler); },
    removeEventListener(type, handler) { listeners.set(type, (listeners.get(type) || []).filter((h) => h !== handler)); },
    dispatch(type, event) { for (const h of listeners.get(type) || []) h(event); },
    listenerCount(type) { return (listeners.get(type) || []).length; },
  };
  document.body.isConnected = true;
  document.body.append = (...items) => { for (const item of items) { item.parentElement = document.body; item.isConnected = true; document.body.children.push(item);} };
  return { document };
}

function createInspectableRoot(document) {
  const mk = (id, rect) => ({ ownerDocument: document, className:'', getAttribute: (n)=> n==='data-ui-inspector-id'?id:null, getBoundingClientRect: ()=>rect });
  const nodes = [
    mk('restarbeiten.root', { left: 0, top: 0, width: 500, height: 400 }),
    mk('restarbeiten.main', { left: 10, top: 20, width: 450, height: 300 }),
    mk('restarbeiten.filterleiste', { left: 20, top: 30, width: 300, height: 80 }),
    mk('restarbeiten.filterleiste.meta', { left: 40, top: 40, width: 180, height: 50 }),
    mk('restarbeiten.filterleiste.meta.status', { left: 60, top: 50, width: 70, height: 20 }),
  ];
  return { ownerDocument: document, querySelectorAll: (sel)=> sel==='[data-ui-inspector-id]'?nodes:[] };
}

(async function run() {
  const { createUiInspectorOverlay } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorOverlay.js'));
  const { document } = createFakeDom();
  const overlay = createUiInspectorOverlay();
  const root = createInspectableRoot(document);

  assert.equal(overlay.mount(root), true);
  const overlayRoot = document.body.children[0];
  assert.equal(overlayRoot.style.pointerEvents, 'none');
  assert.equal(overlayRoot.children.some((c) => c.attributes['data-ui-inspector-overlay-frame'] === 'restarbeiten.main'), true);
  assert.equal(document.listenerCount('pointerdown'), 1);

  const hits = overlay.getHitsAtPoint(65, 55).map((h) => h.id);
  assert.deepEqual(hits.slice(0, 5), [
    'restarbeiten.filterleiste.meta.status',
    'restarbeiten.filterleiste.meta',
    'restarbeiten.filterleiste',
    'restarbeiten.main',
    'restarbeiten.root',
  ]);

  const prevented = { value: false };
  document.dispatch('pointerdown', { clientX: 65, clientY: 55, preventDefault() { prevented.value = true; }, stopPropagation() {}, stopImmediatePropagation() {} });
  assert.equal(prevented.value, true);

  const hitList = overlayRoot.children.find((c) => c.attributes['data-ui-inspector-hit-list'] === 'true');
  assert.ok(hitList);
  assert.equal(hitList.style.pointerEvents, 'auto');
  const firstOption = hitList.children[0];
  assert.equal(firstOption.attributes['data-ui-inspector-hit-option'], 'restarbeiten.filterleiste.meta.status');

  const firstHitListRef = hitList;
  const preventedHitOption = { value: false };
  document.dispatch('pointerdown', {
    clientX: 66,
    clientY: 56,
    target: firstOption,
    preventDefault() { preventedHitOption.value = true; },
    stopPropagation() {},
    stopImmediatePropagation() {},
  });
  assert.equal(preventedHitOption.value, false);
  const hitListAfterOptionPointerdown = overlayRoot.children.find((c) => c.attributes['data-ui-inspector-hit-list'] === 'true');
  assert.equal(hitListAfterOptionPointerdown, firstHitListRef);

  firstOption.click();

  assert.equal(overlay.getSelectedId(), 'restarbeiten.filterleiste.meta.status');
  const selectedFrame = overlayRoot.children.find((c) => c.attributes['data-ui-inspector-selected'] === 'true');
  assert.equal(selectedFrame.attributes['data-ui-inspector-overlay-frame'], 'restarbeiten.filterleiste.meta.status');
  const badge = overlayRoot.children.find((c) => c.attributes['data-ui-inspector-selection-badge'] === 'true');
  assert.equal(badge.textContent, 'Auswahl: restarbeiten.filterleiste.meta.status');
  assert.equal(overlayRoot.children.some((c) => c.attributes['data-ui-inspector-hit-list'] === 'true'), false);

  overlay.clearSelection();
  const badgeAfterClear = overlayRoot.children.find((c) => c.attributes['data-ui-inspector-selection-badge'] === 'true');
  assert.equal(badgeAfterClear.textContent, 'Auswahl: -');

  assert.equal(overlay.unmount(), true);
  assert.equal(document.listenerCount('pointerdown'), 0);

  const noEventsDoc = { ...document, addEventListener: undefined, removeEventListener: undefined, body: document.body, createElement: document.createElement };
  const root2 = createInspectableRoot(noEventsDoc);
  const overlay2 = createUiInspectorOverlay();
  assert.equal(overlay2.mount(root2), true);
  assert.equal(overlay2.unmount(), true);
  console.log('ok - uiInspectorOverlay.test');
})();
