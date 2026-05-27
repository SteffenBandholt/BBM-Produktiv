const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function createFakeDocument() {
  const listeners = new Map();
  function createNode(tagName, doc) {
    return {
      tagName: String(tagName || '').toUpperCase(),
      ownerDocument: doc,
      children: [],
      parentElement: null,
      isConnected: false,
      textContent: '',
      style: {},
      dataset: {},
      attributes: {},
      onclick: null,
      addEventListener(type, handler) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(handler);
      },
      removeEventListener(type, handler) {
        listeners.set(type, (listeners.get(type) || []).filter((entry) => entry !== handler));
      },
      dispatchEvent(eventInput) {
        const event = typeof eventInput === 'string' ? { type: eventInput } : (eventInput || {});
        if (!event.type) event.type = 'click';
        if (event.target == null) event.target = this;
        event.currentTarget = this;
        event.preventDefault = event.preventDefault || (() => {});
        event.stopPropagation = event.stopPropagation || (() => {});
        event.stopImmediatePropagation = event.stopImmediatePropagation || (() => {});
        for (const handler of listeners.get(event.type) || []) {
          handler.call(this, event);
        }
        return event;
      },
      append(...items) {
        for (const item of items) {
          if (item && typeof item === 'object') {
            item.parentElement = this;
            item.ownerDocument = this.ownerDocument;
            item.isConnected = this.isConnected;
          }
          this.children.push(item);
        }
      },
      replaceChildren(...items) {
        this.children = [];
        this.append(...items);
      },
      removeChild(item) {
        this.children = this.children.filter((entry) => entry !== item);
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name] ?? null;
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

  const document = {
    createElement(tagName) {
      return createNode(tagName, document);
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      listeners.set(type, (listeners.get(type) || []).filter((entry) => entry !== handler));
    },
    dispatch(type, event = {}) {
      event.type = type;
      for (const handler of listeners.get(type) || []) handler(event);
    },
  };
  document.body = createNode('body', document);
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
  return findNodes(
    root,
    (node) => node?.tagName === 'BUTTON' && String(node?.textContent || '').trim() === String(text)
  )[0] || null;
}

(async function run() {
  const panelPath = path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorPanel.js');
  const panelSource = fs.readFileSync(panelPath, 'utf8');
  assert.doesNotMatch(panelSource, /Speichern|Anwenden|Übernehmen|Persistieren/);
  assert.match(panelSource, /UI-Editor Scan/);
  assert.match(panelSource, /Auswahlmodus/);
  assert.match(panelSource, /data-ui-editor-mode/);
  assert.match(panelSource, /data-ui-inspector-panel-drag-handle/);
  assert.match(panelSource, /position:\s*'fixed'|style\.position = 'fixed'/);

  const { createUiInspectorPanel } = await importEsmFromFile(panelPath);
  assert.equal(typeof createUiInspectorPanel, 'function');

  const document = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = document;

  try {
    const panel = createUiInspectorPanel();
    assert.equal(panel.mount(document.body), true);

    const panelNode = document.body.children.find((c) => c.attributes['data-ui-inspector-panel'] === 'true');
    assert.ok(panelNode);
    assert.equal(panel.getMountHost(), document.body);
    assert.equal(panelNode.style.boxSizing, 'border-box');
    assert.equal(panelNode.style.position, 'fixed');
    assert.equal(panelNode.style.pointerEvents, 'auto');
    assert.equal(panelNode.style.zIndex, '2147483600');
    assert.equal(panelNode.parentElement, document.body);
    assert.equal(panelNode.attributes['data-ui-editor-mode'], 'frame');

    const selectionCalls = [];
    panel.render({
      scanSummary: {
        status: 'ok',
        statusLabel: 'vollständig',
        totalMarkers: 72,
        frameCount: 41,
        fieldCount: 23,
        singleElementCount: 8,
        hasListRows: true,
      },
      selectionMode: 'frame',
      selectionModeLabel: 'Rahmen',
      actions: {
        setSelectionMode(mode) {
          selectionCalls.push(mode);
        },
      },
    });

    const text = collectText(panelNode);
    assert.match(text, /UI-Editor Scan/);
    assert.match(text, /Status: vollständig/);
    assert.match(text, /Marker: 72/);
    assert.match(text, /Rahmen: 41/);
    assert.match(text, /Felder: 23/);
    assert.match(text, /Einzelelemente: 8/);
    assert.match(text, /Listenmarker: vorhanden/);
    assert.match(text, /Auswahlmodus: Rahmen/);
    assert.doesNotMatch(text, /Speichern|Anwenden|Übernehmen|Persistieren/);

    const frameButton = findButtonByText(panelNode, 'Rahmen');
    const fieldButton = findButtonByText(panelNode, 'Feld');
    const singleButton = findButtonByText(panelNode, 'Einzelelement');
    assert.ok(frameButton);
    assert.ok(fieldButton);
    assert.ok(singleButton);
    assert.equal(frameButton.attributes['data-ui-editor-mode'], 'frame');
    assert.equal(fieldButton.attributes['data-ui-editor-mode'], 'field');
    assert.equal(singleButton.attributes['data-ui-editor-mode'], 'single');
    assert.equal(frameButton.attributes['data-ui-editor-mode-active'], 'true');
    assert.equal(Boolean(fieldButton.attributes['data-ui-editor-mode-active']), false);
    assert.equal(Boolean(singleButton.attributes['data-ui-editor-mode-active']), false);

    const dragHandle = findNodes(panelNode, (node) => node?.attributes['data-ui-inspector-panel-drag-handle'] === 'true')[0];
    assert.ok(dragHandle);
    assert.equal(dragHandle.style.cursor, 'move');
    assert.equal(dragHandle.style.touchAction, 'none');
    assert.equal(dragHandle.style.userSelect, 'none');
    const initialLeft = panelNode.style.left;
    const initialTop = panelNode.style.top;
    dragHandle.dispatchEvent({
      type: 'pointerdown',
      clientX: 40,
      clientY: 90,
      button: 0,
      preventDefault() {},
      stopPropagation() {},
      stopImmediatePropagation() {},
    });
    document.dispatch('pointermove', {
      clientX: 90,
      clientY: 130,
      preventDefault() {},
    });
    document.dispatch('pointerup', {
      clientX: 90,
      clientY: 130,
      preventDefault() {},
    });
    assert.notEqual(panelNode.style.left, initialLeft);
    assert.notEqual(panelNode.style.top, initialTop);

    fieldButton.click();
    singleButton.click();
    frameButton.click();
    assert.deepEqual(selectionCalls, ['field', 'single', 'frame']);

    panel.render({
      scanSummary: {
        status: 'warning',
        statusLabel: 'unvollständig',
        totalMarkers: 45,
        frameCount: 32,
        fieldCount: 5,
        singleElementCount: 8,
        hasListRows: true,
        missingImportantIds: ['restarbeiten.filterleiste.verortung'],
      },
      selectionMode: 'single',
      selectionModeLabel: 'Einzelelement',
      actions: {},
    });

    const updatedText = collectText(panelNode);
    assert.match(updatedText, /Status: unvollständig/);
    assert.match(updatedText, /Fehlt Pflicht: restarbeiten\.filterleiste\.verortung/);
    assert.match(updatedText, /Auswahlmodus: Einzelelement/);
    assert.equal(findButtonByText(panelNode, 'Einzelelement').attributes['data-ui-editor-mode-active'], 'true');

    assert.equal(panel.unmount(), true);
    assert.equal(document.body.children.some((c) => c.attributes['data-ui-inspector-panel'] === 'true'), false);
  } finally {
    globalThis.document = previousDocument;
  }

  console.log('ok - uiInspectorPanel.test');
})();
