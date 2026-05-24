const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function createFakeElement(tagName, document) {
  return {
    tagName: String(tagName || '').toUpperCase(),
    children: [],
    style: { cssText: '' },
    attributes: {},
    parentElement: null,
    ownerDocument: document,
    textContent: '',
    isConnected: false,
    onclick: null,
    append(...items) {
      for (const child of items) {
        if (child && typeof child === 'object') {
          child.parentElement = this;
          child.ownerDocument = this.ownerDocument;
          child.isConnected = this.isConnected;
        }
        this.children.push(child);
      }
    },
    replaceChildren(...items) {
      this.children = [];
      this.append(...items);
    },
    removeChild(child) {
      this.children = this.children.filter((entry) => entry !== child);
      if (child && typeof child === 'object') {
        child.parentElement = null;
        child.isConnected = false;
      }
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    click() {
      this.onclick?.({
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
      });
    },
  };
}

function createFakeDocument() {
  const listeners = new Map();
  const document = {
    createElement(tag) {
      return createFakeElement(tag, document);
    },
    body: null,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      listeners.set(type, (listeners.get(type) || []).filter((entry) => entry !== handler));
    },
    dispatch(type, event) {
      for (const handler of listeners.get(type) || []) handler(event);
    },
  };

  document.body = createFakeElement('body', document);
  document.body.isConnected = true;
  document.body.append = (...items) => {
    for (const item of items) {
      if (item && typeof item === 'object') {
        item.parentElement = document.body;
        item.ownerDocument = document;
        item.isConnected = true;
      }
      document.body.children.push(item);
    }
  };

  return document;
}

function collectText(node) {
  if (!node) return '';
  return [String(node.textContent || ''), ...(node.children || []).map(collectText)].join(' ');
}

function findNodes(node, predicate, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (predicate(node)) acc.push(node);
  for (const child of Array.isArray(node.children) ? node.children : []) {
    findNodes(child, predicate, acc);
  }
  return acc;
}

function findButtonByText(root, text) {
  return (
    findNodes(root, (node) => node?.tagName === 'BUTTON' && String(node?.textContent || '').trim() === String(text))[0] ||
    null
  );
}

(async function run() {
  const runtimePath = path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorRuntime.js');
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
  assert.doesNotMatch(runtimeSource, /localStorage|saveInspector|saveUiInspector|ui-inspector:save|inspector:save|ipc|db/);
  assert.match(runtimeSource, /getSelectionContext/);
  assert.match(runtimeSource, /selectInspectorTarget/);
  assert.match(runtimeSource, /getNextSiblingId/);

  const { createUiInspectorRuntime } = await importEsmFromFile(runtimePath);
  assert.equal(typeof createUiInspectorRuntime, 'function');

  const document = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = document;

  const parentOriginal =
    'width: 200px; height: 80px; margin-top: 4px; margin-right: 6px; margin-bottom: 8px; margin-left: 10px; padding-top: 1px; padding-right: 2px; padding-bottom: 3px; padding-left: 4px;';
  const child1Original = 'width: 90px; height: 30px; margin-top: 3px; margin-left: 2px; font-size: 12px;';
  const child2Original = 'width: 95px; height: 30px; margin-top: 3px; margin-left: 2px; font-size: 12px;';
  const child3Original = 'width: 100px; height: 30px; margin-top: 3px; margin-left: 2px; font-size: 12px;';
  const child4Original = 'width: 105px; height: 30px; margin-top: 3px; margin-left: 2px; font-size: 12px;';

  const nodes = [
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste' : null),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 420, height: 120 }),
      style: { cssText: 'width: 420px; height: 120px;' },
    },
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung' : null),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 80 }),
      style: { cssText: parentOriginal },
    },
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung.feld::1' : null),
      getBoundingClientRect: () => ({ left: 10, top: 10, width: 90, height: 30 }),
      style: { cssText: child1Original },
    },
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung.feld::2' : null),
      getBoundingClientRect: () => ({ left: 105, top: 10, width: 95, height: 30 }),
      style: { cssText: child2Original },
    },
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung.feld::3' : null),
      getBoundingClientRect: () => ({ left: 205, top: 10, width: 100, height: 30 }),
      style: { cssText: child3Original },
    },
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung.feld::4' : null),
      getBoundingClientRect: () => ({ left: 310, top: 10, width: 105, height: 30 }),
      style: { cssText: child4Original },
    },
  ];

  const root = {
    ownerDocument: document,
    querySelectorAll: (selector) => (selector === '[data-ui-inspector-id]' ? nodes : []),
  };

  try {
    const runtime = createUiInspectorRuntime();
    assert.equal(runtime.activateOverlay(root), true);

    const context = runtime.getSelectionContext('restarbeiten.filterleiste.verortung');
    assert.equal(context.selectedKind, 'Gruppe');
    assert.equal(context.children.length, 4);
    assert.equal(context.children[1].id, 'restarbeiten.filterleiste.verortung.feld::2');
    assert.equal(context.parentLabel, 'Filterleiste');

    runtime.overlay.select('restarbeiten.filterleiste.verortung');
    let panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    assert.ok(panelNode);
    assert.match(collectText(panelNode), /Ausgewählt: Verortung/);
    assert.match(collectText(panelNode), /Typ: Gruppe/);
    assert.match(collectText(panelNode), /Elternbereich: Filterleiste/);
    assert.ok(findButtonByText(panelNode, 'Feld #1'));
    assert.ok(findButtonByText(panelNode, 'Feld #2'));
    assert.ok(findButtonByText(panelNode, 'Feld #3'));
    assert.ok(findButtonByText(panelNode, 'Feld #4'));

    findButtonByText(panelNode, 'Feld #2').click();
    assert.equal(runtime.getSelectedId(), 'restarbeiten.filterleiste.verortung.feld::2');
    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    assert.match(collectText(panelNode), /Ausgewählt: Feld #2/);
    assert.ok(findButtonByText(panelNode, 'Elternbereich auswählen'));
    assert.ok(findButtonByText(panelNode, 'Vorheriges Feld'));
    assert.ok(findButtonByText(panelNode, 'Nächstes Feld'));

    findButtonByText(panelNode, 'Elternbereich auswählen').click();
    assert.equal(runtime.getSelectedId(), 'restarbeiten.filterleiste.verortung');

    runtime.overlay.select('restarbeiten.filterleiste.verortung.feld::2');
    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    findButtonByText(panelNode, 'Nächstes Feld').click();
    assert.equal(runtime.getSelectedId(), 'restarbeiten.filterleiste.verortung.feld::3');
    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    findButtonByText(panelNode, 'Vorheriges Feld').click();
    assert.equal(runtime.getSelectedId(), 'restarbeiten.filterleiste.verortung.feld::2');
    findButtonByText(panelNode, 'Vorheriges Feld').click();
    assert.equal(runtime.getSelectedId(), 'restarbeiten.filterleiste.verortung.feld::1');

    runtime.overlay.select('restarbeiten.filterleiste.verortung');
    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    findButtonByText(panelNode, 'Breite +5').click();
    assert.match(nodes[1].style.cssText, /width:\s*205px/);
    assert.equal(nodes[2].style.cssText, child1Original);

    assert.equal(runtime.deactivateOverlay(), true);
    assert.equal(nodes[0].style.cssText, 'width: 420px; height: 120px;');
    assert.equal(nodes[1].style.cssText, parentOriginal);
    assert.equal(nodes[2].style.cssText, child1Original);
    assert.equal(nodes[3].style.cssText, child2Original);
    assert.equal(nodes[4].style.cssText, child3Original);
    assert.equal(nodes[5].style.cssText, child4Original);
    assert.equal(document.body.children.some((node) => node.attributes['data-ui-inspector-panel'] === 'true'), false);

    console.log('ok - uiInspectorRuntime.test');
  } finally {
    globalThis.document = previousDocument;
  }
})();
