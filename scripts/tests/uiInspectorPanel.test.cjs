const assert = require('node:assert/strict');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function createFakeDocument() {
  function createElement(tagName) {
    return {
      tagName: String(tagName || '').toUpperCase(),
      children: [],
      style: {},
      attributes: {},
      parentElement: null,
      textContent: '',
      isConnected: false,
      append(...items) { for (const child of items) { child.parentElement = this; child.isConnected = this.isConnected; this.children.push(child); } },
      replaceChildren(...items) { this.children = []; this.append(...items); },
      removeChild(child) { this.children = this.children.filter((e) => e !== child); child.parentElement = null; child.isConnected = false; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name]; },
    };
  }
  const document = { createElement, body: createElement('body') };
  document.body.isConnected = true;
  document.body.append = (...items) => { for (const item of items) { item.parentElement = document.body; item.isConnected = true; document.body.children.push(item); } };
  return document;
}

function collectText(node) {
  if (!node) return '';
  return [String(node.textContent || ''), ...(node.children || []).map(collectText)].join(' ');
}

function createFakeDomForRuntime() {
  const listeners = new Map();
  function createElement(tagName) {
    return {
      tagName: String(tagName || '').toUpperCase(),
      children: [],
      style: {},
      attributes: {},
      parentElement: null,
      textContent: '',
      isConnected: false,
      onclick: null,
      ownerDocument: null,
      append(...items) { for (const child of items) { child.parentElement = this; child.ownerDocument = this.ownerDocument; child.isConnected = this.isConnected; this.children.push(child); } },
      replaceChildren(...items) { this.children = []; this.append(...items); },
      removeChild(child) { this.children = this.children.filter((e) => e !== child); child.parentElement = null; child.isConnected = false; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name]; },
      click() { this.onclick?.({ preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} }); },
    };
  }
  const document = {
    createElement(tag) { const node = createElement(tag); node.ownerDocument = document; return node; },
    body: null,
    addEventListener(type, handler) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(handler); },
    removeEventListener(type, handler) { listeners.set(type, (listeners.get(type) || []).filter((h) => h !== handler)); },
  };
  document.body = document.createElement('body');
  document.body.isConnected = true;
  document.body.append = (...items) => { for (const item of items) { item.parentElement = document.body; item.ownerDocument = document; item.isConnected = true; document.body.children.push(item); } };
  return document;
}

(async function run() {
  const { createUiInspectorPanel } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorPanel.js'));
  assert.equal(typeof createUiInspectorPanel, 'function');

  const document = createFakeDocument();
  global.document = document;

  const panel = createUiInspectorPanel();
  assert.equal(panel.mount(document.body), true);

  const panelNode = document.body.children.find((c) => c.attributes['data-ui-inspector-panel'] === 'true');
  assert.ok(panelNode);
  assert.equal(panelNode.style.pointerEvents, 'auto');

  assert.equal(panel.render({ selectedId: 'restarbeiten.editbox.kurztext', controls: ['Breite', 'Höhe', 'Sichtbarkeit'] }), true);
  const text = collectText(panelNode);
  assert.match(text, /UI-Inspektor/);
  assert.match(text, /restarbeiten\.editbox\.kurztext/);
  assert.match(text, /Breite/);
  assert.match(text, /Höhe/);
  assert.match(text, /Sichtbarkeit/);
  assert.match(text, /Nur Anzeige/);
  assert.doesNotMatch(text, /Speichern/);
  assert.doesNotMatch(text, /Anwenden/);

  assert.equal(panel.unmount(), true);
  assert.equal(document.body.children.some((c) => c.attributes['data-ui-inspector-panel'] === 'true'), false);

  const runtimeDocument = createFakeDomForRuntime();
  global.document = runtimeDocument;
  const { createUiInspectorRuntime } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorRuntime.js'));
  const runtime = createUiInspectorRuntime();
  const rootNodes = [
    { getAttribute: (n) => n === 'data-ui-inspector-id' ? 'restarbeiten.main' : null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 200 }) },
    { getAttribute: (n) => n === 'data-ui-inspector-id' ? 'restarbeiten.editbox.meta' : null, getBoundingClientRect: () => ({ left: 20, top: 20, width: 100, height: 40 }) },
  ];
  const root = { ownerDocument: runtimeDocument, querySelectorAll: (sel) => sel === '[data-ui-inspector-id]' ? rootNodes : [] };
  assert.equal(runtime.activateOverlay(root), true);
  assert.equal(runtime.overlay.select('restarbeiten.editbox.meta'), true);
  assert.equal(runtime.refreshOverlay(), true);
  const mountedPanel = runtimeDocument.body.children.find((c) => c.attributes['data-ui-inspector-panel'] === 'true');
  assert.ok(mountedPanel);
  assert.match(collectText(mountedPanel), /restarbeiten\.editbox\.meta/);
  assert.match(collectText(mountedPanel), /Breite/);
  assert.equal(runtime.deactivateOverlay(), true);
  assert.equal(runtimeDocument.body.children.some((c) => c.attributes['data-ui-inspector-panel'] === 'true'), false);

  console.log('ok - uiInspectorPanel.test');
})();
