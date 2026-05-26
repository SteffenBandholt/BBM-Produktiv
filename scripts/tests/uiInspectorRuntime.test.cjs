const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');

function createNode(id, rect, cssText = '') {
  return {
    style: { cssText },
    getAttribute(name) {
      return name === 'data-ui-inspector-id' ? id : null;
    },
    getBoundingClientRect() {
      return rect;
    },
  };
}

function createFakeDocument() {
  const listeners = new Map();
  function createElement(tagName) {
    return {
      tagName: String(tagName || '').toUpperCase(),
      ownerDocument: document,
      children: [],
      parentElement: null,
      isConnected: false,
      textContent: '',
      style: { cssText: '' },
      attributes: {},
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
      return createElement(tagName);
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
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    },
  };

  document.body = createElement('body');
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

(async function run() {
  const runtimePath = path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorRuntime.js');
  const runtimeSource = fs.readFileSync(runtimePath, 'utf8');
  assert.doesNotMatch(runtimeSource, /localStorage|saveInspector|saveUiInspector|ui-inspector:save|inspector:save|ipc|db/);
  assert.doesNotMatch(runtimeSource, /applyPreviewDelta|resetSelectedPreview|resetAllPreview|toggleSelectedVisibility|translate\(/);
  assert.match(runtimeSource, /createUiInspectorRuntime/);
  assert.match(runtimeSource, /scanUiInspectorTargets/);
  assert.match(runtimeSource, /getSelectionMode/);
  assert.match(runtimeSource, /setSelectionMode/);
  assert.match(runtimeSource, /getPanelState/);

  const { createUiInspectorRuntime, formatUiInspectorScanSummary, scanUiInspectorTargets } = await importEsmFromFile(
    runtimePath
  );
  assert.equal(typeof createUiInspectorRuntime, 'function');
  assert.equal(typeof scanUiInspectorTargets, 'function');

  const scanNodes = [
    createNode('restarbeiten.root', { left: 0, top: 0, width: 900, height: 600 }, 'width: 900px; height: 600px;'),
    createNode('restarbeiten.main', { left: 0, top: 0, width: 800, height: 500 }, 'width: 800px; height: 500px;'),
    createNode('restarbeiten.filterleiste', { left: 0, top: 0, width: 760, height: 120 }, 'width: 760px; height: 120px;'),
    createNode('restarbeiten.filterleiste.klassenfilter', { left: 0, top: 0, width: 200, height: 40 }, 'width: 200px; height: 40px;'),
    createNode('restarbeiten.filterleiste.klassenfilter.feld', { left: 0, top: 0, width: 180, height: 28 }, 'width: 180px; height: 28px;'),
    createNode('restarbeiten.filterleiste.verortung', { left: 0, top: 0, width: 200, height: 40 }, 'width: 200px; height: 40px;'),
    createNode('restarbeiten.filterleiste.verortung.feld', { left: 0, top: 0, width: 180, height: 28 }, 'width: 180px; height: 28px;'),
    createNode('restarbeiten.filterleiste.meta', { left: 0, top: 0, width: 220, height: 40 }, 'width: 220px; height: 40px;'),
    createNode('restarbeiten.filterleiste.meta.fertig_bis', { left: 0, top: 0, width: 180, height: 28 }, 'width: 180px; height: 28px;'),
    createNode('restarbeiten.filterleiste.meta.status', { left: 0, top: 0, width: 180, height: 28 }, 'width: 180px; height: 28px;'),
    createNode('restarbeiten.filterleiste.meta.verantwortlich', { left: 0, top: 0, width: 180, height: 28 }, 'width: 180px; height: 28px;'),
    createNode('restarbeiten.filterleiste.meta.erledigt', { left: 0, top: 0, width: 180, height: 28 }, 'width: 180px; height: 28px;'),
    createNode('restarbeiten.liste', { left: 0, top: 0, width: 760, height: 280 }, 'width: 760px; height: 280px;'),
    createNode('restarbeiten.liste.nummernbereich', { left: 0, top: 0, width: 160, height: 280 }, 'width: 160px; height: 280px;'),
    createNode('restarbeiten.liste.textbereich', { left: 0, top: 0, width: 420, height: 280 }, 'width: 420px; height: 280px;'),
    createNode('restarbeiten.liste.kurztext', { left: 0, top: 0, width: 420, height: 60 }, 'width: 420px; height: 60px;'),
    createNode('restarbeiten.liste.langtext', { left: 0, top: 0, width: 420, height: 120 }, 'width: 420px; height: 120px;'),
    createNode('restarbeiten.liste.metabereich', { left: 0, top: 0, width: 160, height: 280 }, 'width: 160px; height: 280px;'),
    createNode('restarbeiten.editbox', { left: 0, top: 0, width: 760, height: 320 }, 'width: 760px; height: 320px;'),
    createNode('restarbeiten.editbox.header', { left: 0, top: 0, width: 760, height: 36 }, 'width: 760px; height: 36px;'),
    createNode('restarbeiten.editbox.verortung', { left: 0, top: 0, width: 620, height: 44 }, 'width: 620px; height: 44px;'),
    createNode('restarbeiten.editbox.kurztext', { left: 0, top: 0, width: 620, height: 44 }, 'width: 620px; height: 44px;'),
    createNode('restarbeiten.editbox.kurztext.label', { left: 0, top: 0, width: 120, height: 20 }, 'width: 120px; height: 20px;'),
    createNode('restarbeiten.editbox.kurztext.restzeichen', { left: 0, top: 0, width: 60, height: 20 }, 'width: 60px; height: 20px;'),
    createNode('restarbeiten.editbox.langtext', { left: 0, top: 0, width: 620, height: 120 }, 'width: 620px; height: 120px;'),
    createNode('restarbeiten.editbox.langtext.label', { left: 0, top: 0, width: 120, height: 20 }, 'width: 120px; height: 20px;'),
    createNode('restarbeiten.editbox.langtext.restzeichen', { left: 0, top: 0, width: 60, height: 20 }, 'width: 60px; height: 20px;'),
    createNode('restarbeiten.editbox.meta', { left: 0, top: 0, width: 620, height: 44 }, 'width: 620px; height: 44px;'),
    createNode('restarbeiten.unknown.widget', { left: 0, top: 0, width: 40, height: 20 }, 'width: 40px; height: 20px;'),
  ];

  const scanRoot = {
    ownerDocument: null,
    querySelectorAll(selector) {
      if (selector === '[data-ui-inspector-id]') return scanNodes;
      if (selector === '.restarbeiten-list__row') return [{}, {}];
      return [];
    },
  };
  const beforeStyles = scanNodes.map((node) => node.style.cssText);
  const summary = scanUiInspectorTargets(scanRoot);
  assert.equal(summary.status, 'ok');
  assert.equal(summary.statusLabel, 'vollständig');
  assert.equal(summary.totalMarkers, scanNodes.length);
  assert.equal(summary.frameCount, 16);
  assert.equal(summary.fieldCount, 4);
  assert.equal(summary.singleElementCount, 8);
  assert.equal(summary.unknownCount, 1);
  assert.equal(summary.hasListRows, true);
  assert.deepEqual(summary.missingImportantIds, []);
  assert.deepEqual(summary.optionalMissingIds, []);
  assert.deepEqual(scanNodes.map((node) => node.style.cssText), beforeStyles);
  assert.match(formatUiInspectorScanSummary(summary).text, /Listenmarker: vorhanden/);

  const runtimeDocument = createFakeDocument();
  const previousDocument = globalThis.document;
  globalThis.document = runtimeDocument;

  try {
    const runtime = createUiInspectorRuntime();
    assert.equal(runtime.getSelectionMode(), 'frame');
    assert.equal(runtime.getSelectionModeLabel(), 'Rahmen');

    const changedToField = runtime.setSelectionMode('field');
    assert.equal(changedToField, true);
    assert.equal(runtime.getSelectionMode(), 'field');
    assert.equal(runtime.getSelectionModeLabel(), 'Feld');
    assert.equal(runtime.setSelectionMode('field'), false);
    assert.equal(runtime.setSelectionMode('single'), true);
    assert.equal(runtime.getSelectionMode(), 'single');

    const rootNodes = [
      createNode('restarbeiten.filterleiste', { left: 0, top: 0, width: 320, height: 160 }, 'width: 320px;'),
      createNode('restarbeiten.filterleiste.klassenfilter.feld', { left: 18, top: 18, width: 120, height: 28 }, 'width: 120px;'),
      createNode('restarbeiten.filterleiste.meta.status', { left: 22, top: 20, width: 32, height: 14 }, 'width: 32px;'),
      createNode('restarbeiten.editbox.kurztext.label', { left: 18, top: 60, width: 120, height: 24 }, 'width: 120px;'),
      createNode('restarbeiten.editbox.langtext.restzeichen', { left: 160, top: 60, width: 36, height: 18 }, 'width: 36px;'),
    ];
    const root = {
      ownerDocument: runtimeDocument,
      querySelectorAll(selector) {
        return selector === '[data-ui-inspector-id]' ? rootNodes : [];
      },
    };
    const originalStyles = rootNodes.map((node) => node.style.cssText);

    const runtimeSummary = runtime.scanCurrentScreen(root);
    assert.equal(runtimeSummary.status, 'warning');
    assert.equal(runtimeSummary.statusLabel, 'unvollständig');
    assert.equal(runtime.getScanSummary(), runtimeSummary);
    assert.match(formatUiInspectorScanSummary(runtimeSummary).text, /Fehlt Pflicht:/);
    assert.deepEqual(rootNodes.map((node) => node.style.cssText), originalStyles);
    assert.equal(runtime.getPanelState().selectionMode, 'single');
    assert.equal(runtime.getPanelState().selectionModeLabel, 'Einzelelement');
    assert.equal(runtime.getPanelState().scanSummary, runtimeSummary);

    runtime.clearScanSummary();
    assert.equal(runtime.getScanSummary(), null);
  } finally {
    globalThis.document = previousDocument;
  }

  console.log('ok - uiInspectorRuntime.test');
})();
