const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
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
  const document = {
    createElement(tag) {
      return createFakeElement(tag, document);
    },
    body: null,
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
  const panelPath = path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorPanel.js');
  const panelSource = fs.readFileSync(panelPath, 'utf8');
  assert.doesNotMatch(panelSource, /Speichern|Anwenden|Übernehmen|Persistieren/);
  assert.match(panelSource, /Elternbereich auswählen/);
  assert.match(panelSource, /Vorheriges Feld/);
  assert.match(panelSource, /Nächstes Feld/);

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
    assert.equal(panelNode.style.pointerEvents, 'auto');

    assert.equal(
      panel.render({
        selectedId: 'restarbeiten.filterleiste.verortung',
        selectedLabel: 'Verortung',
        selectedKind: 'Gruppe',
        parentId: 'restarbeiten.filterleiste',
        parentLabel: 'Filterleiste',
        children: [
          { id: 'restarbeiten.filterleiste.verortung.feld::1', label: 'Feld #1' },
          { id: 'restarbeiten.filterleiste.verortung.feld::2', label: 'Feld #2' },
          { id: 'restarbeiten.filterleiste.verortung.feld::3', label: 'Feld #3' },
          { id: 'restarbeiten.filterleiste.verortung.feld::4', label: 'Feld #4' },
        ],
        siblings: [],
        controls: [
          { label: 'Breite', key: 'width', kind: 'delta', step: 5 },
          { label: 'Höhe', key: 'height', kind: 'delta', step: 5 },
          { label: 'Position X', key: 'translateX', kind: 'delta', step: 5 },
          { label: 'Position Y', key: 'translateY', kind: 'delta', step: 5 },
          { label: 'Abstand außen oben', key: 'marginTop', kind: 'delta', step: 5 },
          { label: 'Abstand innen links', key: 'paddingLeft', kind: 'delta', step: 5 },
          { label: 'Sichtbarkeit', key: 'visibility', kind: 'toggle' },
        ],
        note: 'Temporäre Vorschau – keine Speicherung.',
        actions: {},
      }),
      true
    );

    const text = collectText(panelNode);
    assert.match(text, /UI-Inspektor/);
    assert.match(text, /Ausgewählt: Verortung/);
    assert.match(text, /Typ: Gruppe/);
    assert.match(text, /Elternbereich: Filterleiste/);
    assert.match(text, /Enthält:/);
    assert.match(text, /Temporäre Vorschau – keine Speicherung\./);
    assert.doesNotMatch(text, /Speichern/);
    assert.doesNotMatch(text, /Anwenden/);
    assert.doesNotMatch(text, /Übernehmen/);
    assert.doesNotMatch(text, /Persistieren/);

    assert.ok(findButtonByText(panelNode, 'Feld #1'));
    assert.ok(findButtonByText(panelNode, 'Feld #2'));
    assert.ok(findButtonByText(panelNode, 'Feld #3'));
    assert.ok(findButtonByText(panelNode, 'Feld #4'));
    assert.ok(findButtonByText(panelNode, 'Elternbereich auswählen'));
    assert.ok(findButtonByText(panelNode, 'Breite -5'));
    assert.ok(findButtonByText(panelNode, 'Breite +5'));
    assert.ok(findButtonByText(panelNode, 'Position X +5'));
    assert.ok(findButtonByText(panelNode, 'Sichtbarkeit umschalten'));
    assert.ok(findButtonByText(panelNode, 'Reset ausgewählt'));
    assert.ok(findButtonByText(panelNode, 'Alles zurücksetzen'));

    assert.equal(
      panel.render({
        selectedId: 'restarbeiten.filterleiste.verortung.feld::2',
        selectedLabel: 'Feld #2',
        selectedKind: 'Feld',
        parentId: 'restarbeiten.filterleiste.verortung',
        parentLabel: 'Verortung',
        children: [],
        siblings: [
          { id: 'restarbeiten.filterleiste.verortung.feld::1', label: 'Feld #1' },
          { id: 'restarbeiten.filterleiste.verortung.feld::2', label: 'Feld #2' },
          { id: 'restarbeiten.filterleiste.verortung.feld::3', label: 'Feld #3' },
          { id: 'restarbeiten.filterleiste.verortung.feld::4', label: 'Feld #4' },
        ],
        controls: [
          { label: 'Breite', key: 'width', kind: 'delta', step: 5 },
          { label: 'Höhe', key: 'height', kind: 'delta', step: 5 },
          { label: 'Position X', key: 'translateX', kind: 'delta', step: 5 },
          { label: 'Position Y', key: 'translateY', kind: 'delta', step: 5 },
          { label: 'Schriftgröße', key: 'fontSize', kind: 'delta', step: 1 },
          { label: 'Abstand außen links', key: 'marginLeft', kind: 'delta', step: 5 },
          { label: 'Abstand außen oben', key: 'marginTop', kind: 'delta', step: 5 },
          { label: 'Sichtbarkeit', key: 'visibility', kind: 'toggle' },
        ],
        note: 'Temporäre Vorschau – keine Speicherung.',
        actions: {},
      }),
      true
    );

    const fieldText = collectText(panelNode);
    assert.match(fieldText, /Ausgewählt: Feld #2/);
    assert.match(fieldText, /Typ: Feld/);
    assert.match(fieldText, /Elternbereich: Verortung/);
    assert.ok(findButtonByText(panelNode, 'Elternbereich auswählen'));
    assert.ok(findButtonByText(panelNode, 'Vorheriges Feld'));
    assert.ok(findButtonByText(panelNode, 'Nächstes Feld'));
    assert.ok(findButtonByText(panelNode, 'Schriftgröße +1'));

    assert.equal(panel.unmount(), true);
    assert.equal(document.body.children.some((c) => c.attributes['data-ui-inspector-panel'] === 'true'), false);

    const runtimeDocument = createFakeDocument();
    globalThis.document = runtimeDocument;
    const { createUiInspectorRuntime } = await importEsmFromFile(path.join(__dirname, '../../src/renderer/uiInspector/UiInspectorRuntime.js'));
    const runtime = createUiInspectorRuntime();
    const rootNodes = [
      {
        getAttribute: (n) => (n === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste' : null),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 420, height: 140 }),
        style: { cssText: 'width: 420px; height: 140px;' },
      },
      {
        getAttribute: (n) => (n === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung' : null),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 200 }),
        style: {
          cssText:
            'width: 300px; height: 200px; margin-top: 4px; margin-right: 6px; margin-bottom: 8px; margin-left: 10px; padding-top: 1px; padding-right: 2px; padding-bottom: 3px; padding-left: 4px;',
        },
      },
      {
        getAttribute: (n) => (n === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung.feld::1' : null),
        getBoundingClientRect: () => ({ left: 20, top: 20, width: 100, height: 40 }),
        style: { cssText: 'width: 100px; height: 40px; margin-top: 3px; margin-left: 2px; font-size: 12px;' },
      },
      {
        getAttribute: (n) => (n === 'data-ui-inspector-id' ? 'restarbeiten.filterleiste.verortung.feld::2' : null),
        getBoundingClientRect: () => ({ left: 120, top: 20, width: 100, height: 40 }),
        style: { cssText: 'width: 100px; height: 40px; margin-top: 3px; margin-left: 2px; font-size: 12px;' },
      },
    ];
    const root = {
      ownerDocument: runtimeDocument,
      querySelectorAll: (sel) => (sel === '[data-ui-inspector-id]' ? rootNodes : []),
    };
    assert.equal(runtime.activateOverlay(root), true);
    assert.equal(runtime.overlay.select('restarbeiten.filterleiste.verortung'), true);
    assert.equal(runtime.refreshOverlay(), true);
    const mountedPanel = runtimeDocument.body.children.find((c) => c.attributes['data-ui-inspector-panel'] === 'true');
    assert.ok(mountedPanel);
    assert.match(collectText(mountedPanel), /Ausgewählt: Verortung/);
    assert.match(collectText(mountedPanel), /Feld #1/);
    assert.match(collectText(mountedPanel), /Feld #2/);
    assert.match(collectText(mountedPanel), /Elternbereich: Filterleiste/);
    assert.match(collectText(mountedPanel), /Temporäre Vorschau – keine Speicherung\./);
    assert.doesNotMatch(collectText(mountedPanel), /Speichern|Anwenden|Übernehmen|Persistieren/);
    assert.equal(runtime.deactivateOverlay(), true);
    assert.equal(runtimeDocument.body.children.some((c) => c.attributes['data-ui-inspector-panel'] === 'true'), false);

    console.log('ok - uiInspectorPanel.test');
  } finally {
    globalThis.document = previousDocument;
  }
})();
