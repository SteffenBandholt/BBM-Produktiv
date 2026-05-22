const assert = require('node:assert/strict');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function createFakeDom() {
  const bodyChildren = [];
  function createElement(tagName) {
    return {
      tagName: String(tagName || '').toUpperCase(),
      children: [], style: {}, attributes: {}, isConnected: false, parentElement: null, textContent: '',
      append(...items) { for (const child of items) { child.parentElement = this; child.isConnected = this.isConnected; this.children.push(child); } },
      replaceChildren(...items) { this.children = []; this.append(...items); },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name]; },
      removeChild(child) { this.children = this.children.filter((e) => e !== child); child.parentElement = null; child.isConnected = false; },
      click() { if (typeof this.onclick === 'function') this.onclick({ preventDefault() {}, stopPropagation() {} }); },
    };
  }
  const document = { body: createElement('body'), createElement };
  document.body.isConnected = true;
  document.body.append = (...items) => { for (const item of items) { item.parentElement = document.body; item.isConnected = true; bodyChildren.push(item); document.body.children.push(item);} };
  return { document };
}

function createInspectableRoot(document) {
  const mk = (id, rect) => ({ ownerDocument: document, getAttribute: (n)=> n==='data-ui-inspector-id'?id:null, getBoundingClientRect: ()=>rect });
  const nodeA = mk('restarbeiten.header', { left: 10, top: 20, width: 100, height: 40 });
  const nodeB = mk('restarbeiten.liste', { left: 30, top: 80, width: 200, height: 120 });
  return { ownerDocument: document, querySelectorAll: (sel)=> sel==='[data-ui-inspector-id]'?[nodeA,nodeB]:[] };
}

function createOverlapRoot(document) {
  const mk = (id, rect) => ({ ownerDocument: document, getAttribute: (n)=> n==='data-ui-inspector-id'?id:null, getBoundingClientRect: ()=>rect });
  const root = mk('restarbeiten.root', { left: 0, top: 0, width: 500, height: 400 });
  const meta = mk('restarbeiten.filterleiste.meta', { left: 20, top: 20, width: 250, height: 100 });
  const field = mk('restarbeiten.filterleiste.meta.status', { left: 30, top: 30, width: 80, height: 24 });
  return { ownerDocument: document, querySelectorAll: (sel)=> sel==='[data-ui-inspector-id]'?[root,meta,field]:[] };
}

function getSelectionBadge(overlayRoot) {
  return (overlayRoot.children || []).find((child) => child?.attributes?.['data-ui-inspector-overlay-selection'] === 'true') || null;
}

function getFrames(overlayRoot) {
  return overlayRoot.children.filter((child) => child?.attributes?.['data-ui-inspector-overlay-frame']);
}

function getHandles(overlayRoot) {
  return getFrames(overlayRoot).flatMap((frame) => frame.children || []).filter((child) => child?.attributes?.['data-ui-inspector-overlay-handle']);
}

(async function run() {
  const { createUiInspectorOverlay } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorOverlay.js'));
  assert.equal(typeof createUiInspectorOverlay, 'function');
  const { document } = createFakeDom();
  const overlay = createUiInspectorOverlay();
  const root = createInspectableRoot(document);
  assert.equal(overlay.mount(root), true);
  const overlayRoot = document.body.children[0];
  assert.equal(overlayRoot.style.pointerEvents, 'none');
  assert.equal(overlayRoot.children.length, 3);
  const badgeAfterMount = getSelectionBadge(overlayRoot);
  assert.equal(!!badgeAfterMount, true);
  assert.equal(badgeAfterMount.textContent, 'Auswahl: -');
  const baseFrames = getFrames(overlayRoot);
  const headerFrame = baseFrames.find((frame) => frame.attributes['data-ui-inspector-overlay-frame'] === 'restarbeiten.header');
  const headerHandle = (headerFrame.children || [])[0];
  assert.equal(headerFrame.style.pointerEvents, 'none');
  assert.equal(headerHandle.attributes['data-ui-inspector-overlay-handle'], 'restarbeiten.header');
  assert.equal(headerHandle.style.pointerEvents, 'auto');
  assert.equal(headerHandle.textContent, 'restarbeiten.header');
  headerHandle.click();
  assert.equal(overlay.getSelectedId(), 'restarbeiten.header');
  const baseFramesAfterClick = getFrames(overlayRoot);
  const selectedHeaderFrame = baseFramesAfterClick.find((frame) => frame.attributes['data-ui-inspector-overlay-frame'] === 'restarbeiten.header');
  assert.equal(selectedHeaderFrame.attributes['data-ui-inspector-selected'], 'true');
  const badgeAfterClick = getSelectionBadge(overlayRoot);
  assert.equal(!!badgeAfterClick, true);
  assert.equal(badgeAfterClick.textContent, 'Auswahl: restarbeiten.header');

  assert.equal(overlay.refresh(), true);
  const badgeAfterRefresh = getSelectionBadge(overlayRoot);
  assert.equal(!!badgeAfterRefresh, true);
  assert.equal(badgeAfterRefresh.textContent, 'Auswahl: restarbeiten.header');

  assert.equal(root.querySelectorAll('[data-ui-inspector-id]')[0].attributes?.className, undefined);
  overlay.clearSelection();
  assert.equal(overlay.getSelectedId(), '');
  const badgeAfterClear = getSelectionBadge(overlayRoot);
  assert.equal(!!badgeAfterClear, true);
  assert.equal(badgeAfterClear.textContent, 'Auswahl: -');
  assert.equal(overlay.unmount(), true);
  assert.equal(overlay.getSelectedId(), '');
  assert.equal(document.body.children.length, 0);

  const overlapOverlay = createUiInspectorOverlay();
  const overlapRoot = createOverlapRoot(document);
  assert.equal(overlapOverlay.mount(overlapRoot), true);
  const overlayRoot2 = document.body.children[0];
  const frames = getFrames(overlayRoot2);
  const handles = getHandles(overlayRoot2);
  assert.equal(frames.length, 3);
  assert.equal(handles.length, 3);
  for (const frame of frames) {
    assert.equal(frame.style.pointerEvents, 'none');
  }
  assert.equal(frames[0].attributes['data-ui-inspector-overlay-frame'], 'restarbeiten.root');
  assert.equal(frames[1].attributes['data-ui-inspector-overlay-frame'], 'restarbeiten.filterleiste.meta');
  assert.equal(frames[2].attributes['data-ui-inspector-overlay-frame'], 'restarbeiten.filterleiste.meta.status');

  const rootHandle = handles.find((h) => h.attributes['data-ui-inspector-overlay-handle'] === 'restarbeiten.root');
  const metaHandle = handles.find((h) => h.attributes['data-ui-inspector-overlay-handle'] === 'restarbeiten.filterleiste.meta');
  const statusHandle = handles.find((h) => h.attributes['data-ui-inspector-overlay-handle'] === 'restarbeiten.filterleiste.meta.status');
  assert.equal(rootHandle.style.pointerEvents, 'auto');
  assert.equal(metaHandle.style.pointerEvents, 'auto');
  assert.equal(statusHandle.style.pointerEvents, 'auto');
  statusHandle.click();
  assert.equal(overlapOverlay.getSelectedId(), 'restarbeiten.filterleiste.meta.status');
  const overlapBadgeAfterField = getSelectionBadge(overlayRoot2);
  assert.equal(overlapBadgeAfterField.textContent, 'Auswahl: restarbeiten.filterleiste.meta.status');

  metaHandle.click();
  assert.equal(overlapOverlay.getSelectedId(), 'restarbeiten.filterleiste.meta');
  const overlapBadgeAfterMeta = getSelectionBadge(overlayRoot2);
  assert.equal(overlapBadgeAfterMeta.textContent, 'Auswahl: restarbeiten.filterleiste.meta');

  rootHandle.click();
  assert.equal(overlapOverlay.getSelectedId(), 'restarbeiten.root');
  const overlapBadgeAfterRoot = getSelectionBadge(overlayRoot2);
  assert.equal(overlapBadgeAfterRoot.textContent, 'Auswahl: restarbeiten.root');

  assert.equal(overlapOverlay.unmount(), true);
  assert.equal(overlapOverlay.getSelectedId(), '');
  assert.equal(document.body.children.length, 0);
  console.log('ok - uiInspectorOverlay.test');
})();
