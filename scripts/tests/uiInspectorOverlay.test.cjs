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

(async function run() {
  const { createUiInspectorOverlay } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorOverlay.js'));
  assert.equal(typeof createUiInspectorOverlay, 'function');
  const { document } = createFakeDom();
  const overlay = createUiInspectorOverlay();
  const root = createInspectableRoot(document);
  assert.equal(overlay.mount(root), true);
  const overlayRoot = document.body.children[0];
  assert.equal(overlayRoot.style.pointerEvents, 'none');
  assert.equal(overlayRoot.children.length, 2);
  assert.equal(overlayRoot.children[0].attributes['data-ui-inspector-overlay-frame'], 'restarbeiten.header');
  assert.equal(overlayRoot.children[0].children[0].textContent, 'restarbeiten.header');
  assert.equal(overlay.refresh(), true);
  assert.equal(overlay.unmount(), true);
  assert.equal(document.body.children.length, 0);
  console.log('ok - uiInspectorOverlay.test');
})();
