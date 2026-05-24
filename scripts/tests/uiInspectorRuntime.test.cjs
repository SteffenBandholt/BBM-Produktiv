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
  assert.match(runtimeSource, /getAllowedControlsForSelectedId/);
  assert.match(runtimeSource, /applyPreviewDelta/);
  assert.match(runtimeSource, /resetSelectedPreview/);
  assert.match(runtimeSource, /resetAllPreview/);
  assert.match(runtimeSource, /toggleSelectedVisibility/);

  const { createUiInspectorRuntime } = await importEsmFromFile(runtimePath);
  assert.equal(typeof createUiInspectorRuntime, 'function');

  const document = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = document;

  const parentOriginal =
    'width: 200px; height: 80px; margin-top: 4px; margin-right: 6px; margin-bottom: 8px; margin-left: 10px; padding-top: 1px; padding-right: 2px; padding-bottom: 3px; padding-left: 4px;';
  const childOriginal = 'width: 90px; height: 30px; margin-top: 3px; margin-left: 2px; font-size: 12px;';
  const classOriginal = 'width: 180px; height: 60px; margin-top: 1px; padding-top: 2px;';
  const classFieldOriginal = 'width: 80px; height: 20px; font-size: 11px;';

  const nodes = [
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung' : null),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 80 }),
      style: { cssText: parentOriginal },
    },
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung.feld' : null),
      getBoundingClientRect: () => ({ left: 10, top: 10, width: 90, height: 30 }),
      style: { cssText: childOriginal },
    },
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.klassenfilter' : null),
      getBoundingClientRect: () => ({ left: 220, top: 0, width: 180, height: 60 }),
      style: { cssText: classOriginal },
    },
    {
      getAttribute: (name) => (name === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.klassenfilter.feld' : null),
      getBoundingClientRect: () => ({ left: 230, top: 8, width: 80, height: 20 }),
      style: { cssText: classFieldOriginal },
    },
  ];

  const root = {
    ownerDocument: document,
    querySelectorAll: (selector) => (selector === '[data-ui-inspector-id]' ? nodes : []),
  };

  try {
    const runtime = createUiInspectorRuntime();
    assert.equal(runtime.activateOverlay(root), true);

    runtime.overlay.select('restarbeiten.filterleiste.verortung');
    let panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    assert.ok(panelNode);
    assert.match(collectText(panelNode), /Bereichstyp: Gruppe/);
    assert.ok(findButtonByText(panelNode, 'Position X +5'));
    assert.ok(findButtonByText(panelNode, 'Position Y +5'));
    assert.ok(findButtonByText(panelNode, 'Abstand außen oben +5'));
    assert.ok(findButtonByText(panelNode, 'Abstand innen links +5'));
    assert.ok(findButtonByText(panelNode, 'Sichtbarkeit umschalten'));
    assert.ok(findButtonByText(panelNode, 'Reset ausgewählt'));
    assert.ok(findButtonByText(panelNode, 'Alles zurücksetzen'));

    findButtonByText(panelNode, 'Position X +5').click();
    assert.match(nodes[0].style.cssText, /transform:\s*translate\(5px,\s*0px\)/);
    assert.equal(nodes[1].style.cssText, childOriginal);

    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    findButtonByText(panelNode, 'Position Y +5').click();
    assert.match(nodes[0].style.cssText, /transform:\s*translate\(5px,\s*5px\)/);
    assert.equal(nodes[1].style.cssText, childOriginal);

    runtime.resetSelectedPreview();
    assert.equal(nodes[0].style.cssText, parentOriginal);
    assert.equal(nodes[1].style.cssText, childOriginal);

    runtime.overlay.select('restarbeiten.filterleiste.verortung.feld');
    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    assert.match(collectText(panelNode), /Bereichstyp: Feld/);
    findButtonByText(panelNode, 'Position X +5').click();
    assert.match(nodes[1].style.cssText, /transform:\s*translate\(5px,\s*0px\)/);
    assert.equal(nodes[0].style.cssText, parentOriginal);

    runtime.resetSelectedPreview();
    assert.equal(nodes[1].style.cssText, childOriginal);

    runtime.overlay.select('restarbeiten.filterleiste.verortung');
    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    findButtonByText(panelNode, 'Abstand außen oben +5').click();
    assert.match(nodes[0].style.cssText, /margin-top:\s*9px/);
    assert.match(nodes[0].style.cssText, /margin-left:\s*10px/);
    findButtonByText(panelNode, 'Abstand außen links +5').click();
    assert.match(nodes[0].style.cssText, /margin-left:\s*15px/);
    assert.match(nodes[0].style.cssText, /margin-top:\s*9px/);

    runtime.resetSelectedPreview();
    assert.equal(nodes[0].style.cssText, parentOriginal);

    runtime.overlay.select('restarbeiten.filterleiste.verortung');
    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    findButtonByText(panelNode, 'Abstand innen oben +5').click();
    assert.match(nodes[0].style.cssText, /padding-top:\s*6px/);
    assert.match(nodes[0].style.cssText, /padding-left:\s*4px/);
    findButtonByText(panelNode, 'Abstand innen links +5').click();
    assert.match(nodes[0].style.cssText, /padding-left:\s*9px/);
    assert.match(nodes[0].style.cssText, /padding-top:\s*6px/);

    runtime.resetSelectedPreview();
    assert.equal(nodes[0].style.cssText, parentOriginal);

    runtime.overlay.select('restarbeiten.filterleiste.verortung');
    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    findButtonByText(panelNode, 'Breite +5').click();
    runtime.overlay.select('restarbeiten.filterleiste.verortung.feld');
    panelNode = document.body.children.find((node) => node.attributes['data-ui-inspector-panel'] === 'true');
    findButtonByText(panelNode, 'Breite +5').click();
    assert.notEqual(nodes[0].style.cssText, parentOriginal);
    assert.notEqual(nodes[1].style.cssText, childOriginal);

    assert.equal(runtime.deactivateOverlay(), true);
    assert.equal(nodes[0].style.cssText, parentOriginal);
    assert.equal(nodes[1].style.cssText, childOriginal);
    assert.equal(nodes[2].style.cssText, classOriginal);
    assert.equal(nodes[3].style.cssText, classFieldOriginal);
    assert.equal(document.body.children.some((node) => node.attributes['data-ui-inspector-panel'] === 'true'), false);

    console.log('ok - uiInspectorRuntime.test');
  } finally {
    globalThis.document = previousDocument;
  }
})();
